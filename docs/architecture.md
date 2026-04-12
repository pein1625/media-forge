# Media Processing Platform — Microservices Architecture

> **Tech Stack:** NestJS · PostgreSQL · Redis · Apache Kafka · Docker  
> **Scale Target:** 100K+ users · High Availability · Multi-region ready  
> **Date:** April 2026

---

## 1. Tổng quan hệ thống

Hệ thống media processing platform được chia thành **8 microservices chính**, giao tiếp qua **Kafka** (async) và **gRPC** (sync), phía trước là một **API Gateway** xử lý routing, auth và rate limiting.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPS                                │
│                   (Web, Mobile, Third-party)                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │  ← NestJS + Kong/Nginx
                    │ (Auth, Rate │
                    │  Limit, TLS)│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────────────┐
         │                 │                          │
    ┌────▼────┐     ┌──────▼──────┐          ┌───────▼───────┐
    │  User   │     │   Upload    │          │   Streaming   │
    │ Service │     │   Service   │          │    Service    │
    └────┬────┘     └──────┬──────┘          └───────┬───────┘
         │                 │                          │
         │          ┌──────▼──────┐                   │
         │          │   Object    │                   │
         │          │   Storage   │◄──────────────────┘
         │          │  (MinIO/S3) │
         │          └──────┬──────┘
         │                 │
         │     ════════════╪══════════════════════════════
         │          KAFKA EVENT BUS
         │     ════════════╪══════════════════════════════
         │                 │
    ┌────┼─────────┬───────┼────────┬─────────────────┐
    │    │         │       │        │                  │
┌───▼──┐ ┌──▼───┐ ┌──▼───┐ ┌──▼────┐ ┌──────▼──────┐
│Media │ │Trans-│ │ AI   │ │Notif- │ │ Analytics   │
│Catalog│ │code  │ │Proc. │ │ication│ │   Service   │
│Service│ │Svc   │ │Svc   │ │Svc    │ │             │
└──┬───┘ └──┬───┘ └──┬───┘ └───────┘ └─────────────┘
   │        │        │
   ▼        ▼        ▼
┌──────────────────────────┐
│  PostgreSQL (per-service) │
│  + Redis (cache/queue)    │
└──────────────────────────┘
```

---

## 2. Chi tiết từng Microservice

### 2.1 API Gateway Service

**Vai trò:** Single entry point, authentication, rate limiting, request routing.

| Aspect | Detail |
|--------|--------|
| Framework | NestJS + `@nestjs/microservices` |
| Auth | JWT + OAuth2 (Google, Apple) |
| Rate Limit | Redis-based sliding window (100 req/min default) |
| Protocol | REST (external) → gRPC (internal service-to-service) |
| Load Balancer | Nginx / Traefik trước Gateway |

**Chức năng chính:**
- JWT validation & token refresh
- Request routing tới downstream services qua gRPC
- Rate limiting per-user & per-IP (Redis sorted set)
- Request/response transformation & validation
- CORS, helmet, compression middleware
- Circuit breaker pattern (sử dụng `opossum` hoặc custom)

```typescript
// Ví dụ cấu trúc module Gateway
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'UPLOAD_SERVICE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'upload',
            protoPath: join(__dirname, '../proto/upload.proto'),
            url: config.get('UPLOAD_SERVICE_URL'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'MEDIA_CATALOG_SERVICE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'catalog',
            protoPath: join(__dirname, '../proto/catalog.proto'),
            url: config.get('CATALOG_SERVICE_URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ThrottlerModule.forRoot({ ttl: 60, limit: 100 }),
    AuthModule,
  ],
})
export class GatewayModule {}
```

---

### 2.2 User Service

**Vai trò:** Quản lý user accounts, authentication, authorization, quota management.

| Aspect | Detail |
|--------|--------|
| Database | PostgreSQL (schema: `user_service`) |
| Cache | Redis — session store, user profile cache |
| Auth | Bcrypt + JWT + Refresh Token rotation |

**Database Schema:**

```sql
-- user_service schema
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    role            VARCHAR(20) DEFAULT 'user',  -- user, creator, admin
    status          VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    email_verified  BOOLEAN DEFAULT FALSE,
    oauth_provider  VARCHAR(20),                  -- google, apple, null
    oauth_id        VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_quotas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    plan            VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
    storage_used    BIGINT DEFAULT 0,           -- bytes
    storage_limit   BIGINT DEFAULT 5368709120,  -- 5GB default
    transcode_mins  INTEGER DEFAULT 0,          -- minutes used this month
    transcode_limit INTEGER DEFAULT 60,         -- 60 mins/month free
    ai_credits      INTEGER DEFAULT 0,
    ai_credit_limit INTEGER DEFAULT 100,
    reset_at        TIMESTAMPTZ,                -- quota reset date
    UNIQUE(user_id)
);

CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash    VARCHAR(255) NOT NULL,
    name        VARCHAR(100),
    scopes      TEXT[],                          -- ['upload', 'read', 'transcode']
    last_used   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

---

### 2.3 Upload Service

**Vai trò:** Xử lý file upload (multipart, resumable), validation, virus scan, lưu vào Object Storage.

| Aspect | Detail |
|--------|--------|
| Upload Protocol | Multipart + TUS (resumable uploads) |
| Storage | MinIO (S3-compatible) — multi-bucket strategy |
| Max File Size | 10GB (video), 50MB (image), 500MB (audio) |
| Virus Scan | ClamAV integration |

**Upload Flow:**

```
Client                Upload Service           MinIO            Kafka
  │                        │                     │                │
  │──POST /upload/init────▶│                     │                │
  │◀─── upload_id + ───────│                     │                │
  │     presigned URLs      │                     │                │
  │                        │                     │                │
  │──PUT chunk 1──────────▶│──store chunk───────▶│                │
  │◀─── ack ───────────────│                     │                │
  │──PUT chunk 2──────────▶│──store chunk───────▶│                │
  │◀─── ack ───────────────│                     │                │
  │──PUT chunk N──────────▶│──store chunk───────▶│                │
  │                        │                     │                │
  │──POST /upload/complete▶│──combine chunks────▶│                │
  │                        │──virus scan──┐      │                │
  │                        │◀─────────────┘      │                │
  │                        │──publish────────────────────────────▶│
  │                        │  media.uploaded                      │
  │◀─── 201 Created ──────│                     │                │
```

**Bucket Strategy:**

```
media-raw/          ← Original uploads (lifecycle: move to glacier after 90d)
media-processed/    ← Transcoded outputs
media-thumbnails/   ← Generated thumbnails
media-hls/          ← HLS segments for streaming
media-temp/         ← Chunks during upload (auto-delete after 24h)
```

**Database Schema:**

```sql
-- upload_service schema
CREATE TABLE uploads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    filename        VARCHAR(500) NOT NULL,
    original_name   VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    media_type      VARCHAR(10) NOT NULL,      -- image, video, audio
    file_size       BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64),
    storage_bucket  VARCHAR(100) NOT NULL,
    storage_key     VARCHAR(500) NOT NULL,
    status          VARCHAR(20) DEFAULT 'uploading',
                    -- uploading, scanning, ready, infected, failed
    chunk_count     INTEGER DEFAULT 0,
    chunks_received INTEGER DEFAULT 0,
    virus_scan_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE upload_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id   UUID REFERENCES uploads(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    size        BIGINT NOT NULL,
    checksum    VARCHAR(64),
    storage_key VARCHAR(500),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(upload_id, chunk_index)
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
```

---

### 2.4 Media Catalog Service

**Vai trò:** Central metadata store. Quản lý thông tin media, tags, collections, search.

| Aspect | Detail |
|--------|--------|
| Database | PostgreSQL + full-text search (tsvector) |
| Search | Elasticsearch (optional, cho scale lớn) |
| Cache | Redis — hot media metadata, search results |

**Database Schema:**

```sql
-- catalog_service schema
CREATE TABLE media_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    upload_id       UUID NOT NULL,
    title           VARCHAR(500),
    description     TEXT,
    media_type      VARCHAR(10) NOT NULL,       -- image, video, audio
    mime_type       VARCHAR(100),
    duration_ms     INTEGER,                     -- video/audio duration
    width           INTEGER,                     -- image/video width
    height          INTEGER,                     -- image/video height
    file_size       BIGINT,
    storage_bucket  VARCHAR(100),
    storage_key     VARCHAR(500),
    thumbnail_key   VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'processing',
                    -- processing, ready, failed, archived
    visibility      VARCHAR(20) DEFAULT 'private', -- private, unlisted, public
    metadata_json   JSONB,                       -- EXIF, codec info, etc.
    search_vector   TSVECTOR,                    -- full-text search
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE TABLE media_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id        UUID REFERENCES media_items(id) ON DELETE CASCADE,
    variant_type    VARCHAR(30) NOT NULL,        -- thumbnail, preview, hls_720p, mp3_128k, webp_small
    storage_bucket  VARCHAR(100),
    storage_key     VARCHAR(500),
    mime_type       VARCHAR(100),
    width           INTEGER,
    height          INTEGER,
    bitrate         INTEGER,
    file_size       BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) UNIQUE NOT NULL,
    slug    VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE media_tags (
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    tag_id   INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    source   VARCHAR(20) DEFAULT 'user',         -- user, ai_auto
    PRIMARY KEY (media_id, tag_id)
);

CREATE TABLE collections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    cover_media UUID REFERENCES media_items(id),
    visibility  VARCHAR(20) DEFAULT 'private',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_items (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    media_id      UUID REFERENCES media_items(id) ON DELETE CASCADE,
    sort_order    INTEGER DEFAULT 0,
    added_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, media_id)
);

-- Indexes
CREATE INDEX idx_media_user ON media_items(user_id);
CREATE INDEX idx_media_status ON media_items(status);
CREATE INDEX idx_media_type ON media_items(media_type);
CREATE INDEX idx_media_search ON media_items USING GIN(search_vector);
CREATE INDEX idx_media_metadata ON media_items USING GIN(metadata_json);
CREATE INDEX idx_variants_media ON media_variants(media_id);
```

---

### 2.5 Transcode Service

**Vai trò:** Xử lý chuyển đổi format, tạo thumbnails, resize, compress, generate HLS segments.

| Aspect | Detail |
|--------|--------|
| Engine | FFmpeg (video/audio), Sharp (image) |
| Concurrency | Worker pool pattern — Redis Bull queue |
| Scaling | Horizontal scaling dựa trên queue depth |

**Processing Pipelines:**

```
┌─────────────────────────────────────────────────────────┐
│                   IMAGE PIPELINE                         │
│                                                          │
│  Original ──▶ Validate ──▶ Extract EXIF ──▶ Generate:   │
│                                              ├─ thumb_sm (150x150)
│                                              ├─ thumb_md (400x400)
│                                              ├─ preview  (1200xAuto)
│                                              ├─ webp     (optimized)
│                                              └─ avif     (optimized)
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   VIDEO PIPELINE                         │
│                                                          │
│  Original ──▶ Probe ──▶ Extract metadata ──▶ Generate:  │
│                                              ├─ thumb    (poster frame)
│                                              ├─ preview  (10s GIF/WebM)
│                                              ├─ 360p     (H.264, 800kbps)
│                                              ├─ 720p     (H.264, 2.5Mbps)
│                                              ├─ 1080p    (H.264, 5Mbps)
│                                              ├─ 4K       (H.265, 12Mbps)
│                                              └─ HLS      (adaptive master playlist)
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   AUDIO PIPELINE                         │
│                                                          │
│  Original ──▶ Probe ──▶ Extract metadata ──▶ Generate:  │
│                                              ├─ mp3_128k │
│                                              ├─ mp3_320k │
│                                              ├─ aac_256k │
│                                              ├─ waveform (JSON data)
│                                              └─ spectrogram (PNG)
└─────────────────────────────────────────────────────────┘
```

**Database Schema:**

```sql
-- transcode_service schema
CREATE TABLE transcode_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id        UUID NOT NULL,
    upload_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    pipeline        VARCHAR(20) NOT NULL,        -- image, video, audio
    priority        INTEGER DEFAULT 5,           -- 1=highest, 10=lowest
    status          VARCHAR(20) DEFAULT 'queued',
                    -- queued, assigned, processing, completed, failed, cancelled
    worker_id       VARCHAR(100),                -- which worker picked it up
    progress        REAL DEFAULT 0,              -- 0.0 to 1.0
    input_key       VARCHAR(500) NOT NULL,
    output_keys     JSONB,                       -- {"720p": "key", "1080p": "key"}
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 3,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transcode_presets (
    id          VARCHAR(50) PRIMARY KEY,         -- e.g., 'video_720p_h264'
    media_type  VARCHAR(10) NOT NULL,
    name        VARCHAR(100),
    config      JSONB NOT NULL,                  -- FFmpeg/Sharp options
    is_default  BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_jobs_status ON transcode_jobs(status);
CREATE INDEX idx_jobs_media ON transcode_jobs(media_id);
CREATE INDEX idx_jobs_priority ON transcode_jobs(priority, created_at);
```

**Worker Pattern:**

```typescript
// Bull queue + worker pattern
@Processor('transcode-video')
export class VideoTranscodeProcessor {
  @Process({ concurrency: 2 })
  async handleTranscode(job: Job<TranscodeJobData>) {
    const { inputPath, outputPath, preset } = job.data;

    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-c:v', preset.videoCodec,    // libx264 / libx265
      '-b:v', preset.videoBitrate,  // 2500k
      '-c:a', preset.audioCodec,    // aac
      '-b:a', preset.audioBitrate,  // 128k
      '-preset', 'medium',
      '-movflags', '+faststart',
      '-progress', 'pipe:1',
      outputPath,
    ]);

    // Stream progress updates
    ffmpeg.stdout.on('data', (data) => {
      const progress = parseFFmpegProgress(data, job.data.duration);
      job.progress(progress);
    });

    await new Promise((resolve, reject) => {
      ffmpeg.on('close', (code) =>
        code === 0 ? resolve(true) : reject(new Error(`FFmpeg exit ${code}`))
      );
    });
  }
}
```

---

### 2.6 Streaming Service

**Vai trò:** Phục vụ HLS/DASH streaming, adaptive bitrate, token-based access control.

| Aspect | Detail |
|--------|--------|
| Protocol | HLS (primary), DASH (secondary) |
| CDN | CloudFront / Cloudflare — signed URLs |
| DRM | Widevine + FairPlay (optional) |

**Streaming Architecture:**

```
Client Player        Streaming Service         CDN            MinIO
    │                      │                    │               │
    │──GET /stream/{id}───▶│                    │               │
    │                      │──check access──┐   │               │
    │                      │◀───────────────┘   │               │
    │                      │──generate signed───▶│               │
    │◀── master.m3u8 ─────│   CDN URLs          │               │
    │    (signed URLs)      │                    │               │
    │                      │                    │               │
    │──GET /segment.ts────────────────────────▶│               │
    │                      │                    │──fetch──────▶│
    │◀── video segment ──────────────────────── │◀─────────────│
    │                      │                    │  (cached)     │
```

**HLS Master Playlist Generation:**

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
/stream/{id}/360p/playlist.m3u8?token=xxx&expires=yyy
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
/stream/{id}/720p/playlist.m3u8?token=xxx&expires=yyy
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
/stream/{id}/1080p/playlist.m3u8?token=xxx&expires=yyy
#EXT-X-STREAM-INF:BANDWIDTH=12000000,RESOLUTION=3840x2160
/stream/{id}/4k/playlist.m3u8?token=xxx&expires=yyy
```

---

### 2.7 AI Processing Service

**Vai trò:** OCR, speech-to-text, object detection, content moderation, auto-tagging.

| Aspect | Detail |
|--------|--------|
| OCR | Tesseract |
| Speech-to-Text | Whisper (OpenAI) |
| Object Detection | YOLO v8 / TensorFlow |
| Content Moderation | NSFW detection + custom rules |

**AI Pipeline Flow:**

```
Kafka: media.transcoded
         │
         ▼
┌─────────────────────┐
│  AI Orchestrator     │
│  (route by type)     │
└───┬────┬────┬───────┘
    │    │    │
    ▼    ▼    ▼
┌─────┐┌────┐┌──────┐
│Image││Vid ││Audio │
│ AI  ││ AI ││ AI   │
└──┬──┘└─┬──┘└──┬───┘
   │     │      │
   ▼     ▼      ▼
Tasks:
├─ Object detection       (image, video keyframes)
├─ Scene classification    (indoor, outdoor, nature...)
├─ OCR text extraction     (image, video frames)
├─ Face detection          (blur/count, no recognition)
├─ NSFW content scoring    (all media types)
├─ Speech-to-text          (video, audio → subtitles/transcript)
├─ Auto-tagging            (combine all signals → tags)
└─ Content fingerprint     (perceptual hash for dedup)

Output → Kafka: media.ai.completed
       → Update Catalog metadata_json + tags
```

**Database Schema:**

```sql
-- ai_processing schema
CREATE TABLE ai_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id        UUID NOT NULL,
    job_type        VARCHAR(30) NOT NULL,
                    -- ocr, stt, object_detect, moderation, auto_tag, fingerprint
    status          VARCHAR(20) DEFAULT 'queued',
    model_version   VARCHAR(50),
    input_key       VARCHAR(500),
    result          JSONB,                       -- structured AI output
    confidence      REAL,
    processing_ms   INTEGER,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE transcripts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id    UUID NOT NULL,
    language    VARCHAR(10) DEFAULT 'en',
    segments    JSONB NOT NULL,                  -- [{start, end, text, confidence}]
    full_text   TEXT,
    model       VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_moderations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id        UUID NOT NULL,
    nsfw_score      REAL,                        -- 0.0 to 1.0
    violence_score  REAL,
    spam_score      REAL,
    decision        VARCHAR(20),                 -- approved, flagged, rejected
    reviewed_by     UUID,                        -- null = auto, UUID = human reviewer
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_jobs_media ON ai_jobs(media_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_transcripts_media ON transcripts(media_id);
```

---

### 2.8 Notification Service

**Vai trò:** Push notifications, email, webhooks khi media processing hoàn tất hoặc có lỗi.

| Aspect | Detail |
|--------|--------|
| Channels | WebSocket (real-time), Email (SendGrid), Webhook |
| Queue | Redis Bull — retry with exponential backoff |

---

## 3. Kafka Event Architecture

### 3.1 Topic Design

```
media.uploaded              ← Upload Service publishes after successful upload
media.upload.failed         ← Upload failures

media.transcode.requested   ← Catalog → Transcode (with preset config)
media.transcode.progress    ← Transcode progress updates (0-100%)
media.transcode.completed   ← Transcode done → Catalog updates variants
media.transcode.failed      ← Transcode failures → retry/notify

media.ai.requested          ← Catalog → AI Service
media.ai.completed          ← AI results → Catalog updates metadata
media.ai.moderation.flagged ← Content flagged → Admin review queue

media.streaming.ready       ← HLS generation complete → enable playback
media.deleted               ← User deletes → cleanup all services

user.quota.updated          ← After transcode/upload → update quotas
user.quota.exceeded         ← Quota limit hit → notify user

notification.send           ← Any service → Notification Service
```

### 3.2 Event Schema (Avro/JSON Schema)

```typescript
// Base event envelope
interface MediaEvent<T> {
  eventId: string;          // UUID v4
  eventType: string;        // e.g., 'media.uploaded'
  timestamp: string;        // ISO 8601
  version: number;          // schema version
  source: string;           // service name
  correlationId: string;    // trace across services
  userId: string;
  payload: T;
}

// media.uploaded payload
interface MediaUploadedPayload {
  uploadId: string;
  mediaType: 'image' | 'video' | 'audio';
  mimeType: string;
  fileSize: number;
  storageBucket: string;
  storageKey: string;
  checksumSha256: string;
  originalFilename: string;
}

// media.transcode.completed payload
interface TranscodeCompletedPayload {
  jobId: string;
  mediaId: string;
  pipeline: string;
  variants: Array<{
    type: string;           // '720p', 'thumb_md', 'mp3_128k'
    storageBucket: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    bitrate?: number;
    duration?: number;
  }>;
  processingTimeMs: number;
}
```

### 3.3 Kafka Configuration

```yaml
# Topic configs cho production
media.uploaded:
  partitions: 12
  replication-factor: 3
  retention.ms: 604800000          # 7 days
  cleanup.policy: delete

media.transcode.requested:
  partitions: 24                    # Higher parallelism cho heavy processing
  replication-factor: 3
  retention.ms: 259200000          # 3 days

media.transcode.progress:
  partitions: 12
  replication-factor: 2            # Progress data less critical
  retention.ms: 86400000           # 1 day
  cleanup.policy: delete

media.ai.requested:
  partitions: 16
  replication-factor: 3
  retention.ms: 259200000

# Consumer groups
consumer-groups:
  - catalog-consumers              # Media Catalog Service
  - transcode-workers              # Transcode Service
  - ai-processors                  # AI Processing Service
  - notification-handlers          # Notification Service
  - analytics-ingestors            # Analytics Service
  - quota-updaters                 # User Service (quota tracking)
```

---

## 4. End-to-End Processing Flow

```
User uploads video
       │
       ▼
[1] Upload Service
    ├─ Receive chunks (TUS protocol)
    ├─ Reassemble file
    ├─ Virus scan (ClamAV)
    ├─ Store in MinIO (media-raw/)
    └─ Publish: media.uploaded
              │
              ▼
[2] Media Catalog Service (consumer: media.uploaded)
    ├─ Create media_item record (status: processing)
    ├─ Extract basic metadata
    ├─ Publish: media.transcode.requested
    │          (with default presets for video)
    └─ Publish: media.ai.requested
              │
       ┌──────┴──────┐
       ▼              ▼
[3a] Transcode     [3b] AI Processing
     Service             Service
     ├─ FFprobe         ├─ NSFW check
     ├─ Generate:       ├─ Object detection
     │  ├─ 360p         ├─ Scene classification
     │  ├─ 720p         ├─ Speech-to-text
     │  ├─ 1080p        └─ Auto-tagging
     │  ├─ HLS              │
     │  └─ thumbnail         │
     └─ Publish:             └─ Publish:
        media.transcode         media.ai.completed
        .completed                   │
              │                      │
              └──────┬───────────────┘
                     ▼
[4] Media Catalog Service
    ├─ Update media_item (status: ready)
    ├─ Store variant records
    ├─ Update search index
    └─ Publish: notification.send
                     │
                     ▼
[5] Notification Service
    ├─ WebSocket push to connected client
    ├─ Email notification (if configured)
    └─ Webhook callback (if configured)
```

---

## 5. Redis Usage Strategy

```
┌────────────────────────────────────────────────┐
│                 REDIS CLUSTER                    │
│                                                  │
│  DB 0: Session & Auth                            │
│    ├─ sess:{sessionId}     → user session data  │
│    ├─ refresh:{userId}     → refresh token      │
│    └─ blacklist:{jti}      → revoked JWTs       │
│                                                  │
│  DB 1: Rate Limiting                             │
│    ├─ rate:ip:{ip}         → sorted set         │
│    └─ rate:user:{userId}   → sorted set         │
│                                                  │
│  DB 2: Cache                                     │
│    ├─ media:{mediaId}      → media metadata     │
│    ├─ user:{userId}        → user profile       │
│    ├─ search:{hash}        → search results     │
│    └─ stream:token:{id}    → signed URL cache   │
│                                                  │
│  DB 3: Job Queues (Bull)                         │
│    ├─ bull:transcode-video → video jobs         │
│    ├─ bull:transcode-image → image jobs         │
│    ├─ bull:transcode-audio → audio jobs         │
│    └─ bull:ai-processing   → AI jobs            │
│                                                  │
│  DB 4: Real-time                                 │
│    ├─ upload:progress:{id} → upload progress    │
│    ├─ transcode:progress   → job progress       │
│    └─ pubsub channels      → WebSocket events   │
└────────────────────────────────────────────────┘
```

---

## 6. Docker & Infrastructure

### 6.1 Docker Compose (Production-like)

```yaml
version: '3.8'

services:
  # ─── API Gateway ─────────────────────────────
  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis-cluster:6379
    depends_on: [redis-cluster, user-service]
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '1', memory: 512M }
    networks: [media-net]

  # ─── User Service ─────────────────────────────
  user-service:
    build: ./services/user-service
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-user:5432/user_db
      - REDIS_URL=redis://redis-cluster:6379
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
    depends_on: [pg-user, redis-cluster, kafka-1]
    deploy:
      replicas: 2
      resources:
        limits: { cpus: '0.5', memory: 256M }
    networks: [media-net]

  # ─── Upload Service ───────────────────────────
  upload-service:
    build: ./services/upload-service
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-upload:5432/upload_db
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
      - CLAMAV_HOST=clamav
    depends_on: [pg-upload, minio, kafka-1, clamav]
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '2', memory: 1G }
    volumes:
      - upload-temp:/tmp/uploads
    networks: [media-net]

  # ─── Media Catalog ────────────────────────────
  catalog-service:
    build: ./services/catalog-service
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-catalog:5432/catalog_db
      - REDIS_URL=redis://redis-cluster:6379
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
    depends_on: [pg-catalog, redis-cluster, kafka-1]
    deploy:
      replicas: 2
      resources:
        limits: { cpus: '1', memory: 512M }
    networks: [media-net]

  # ─── Transcode Service ────────────────────────
  transcode-service:
    build: ./services/transcode-service
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-transcode:5432/transcode_db
      - REDIS_URL=redis://redis-cluster:6379
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
      - MINIO_ENDPOINT=minio:9000
    depends_on: [pg-transcode, redis-cluster, kafka-1, minio]
    deploy:
      replicas: 4                                # Scale theo load
      resources:
        limits: { cpus: '4', memory: 4G }        # FFmpeg cần nhiều resource
    volumes:
      - transcode-temp:/tmp/transcode
    networks: [media-net]

  # ─── AI Processing ────────────────────────────
  ai-service:
    build: ./services/ai-service
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-ai:5432/ai_db
      - REDIS_URL=redis://redis-cluster:6379
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
      - MINIO_ENDPOINT=minio:9000
      - WHISPER_MODEL=medium
    depends_on: [pg-ai, redis-cluster, kafka-1, minio]
    deploy:
      replicas: 2
      resources:
        limits: { cpus: '4', memory: 8G }
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    networks: [media-net]

  # ─── Streaming Service ────────────────────────
  streaming-service:
    build: ./services/streaming-service
    ports: ["3010:3010"]
    environment:
      - REDIS_URL=redis://redis-cluster:6379
      - MINIO_ENDPOINT=minio:9000
      - CDN_BASE_URL=${CDN_BASE_URL}
      - CDN_SIGNING_KEY=${CDN_SIGNING_KEY}
    depends_on: [redis-cluster, minio]
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '1', memory: 512M }
    networks: [media-net]

  # ─── Notification Service ─────────────────────
  notification-service:
    build: ./services/notification-service
    environment:
      - REDIS_URL=redis://redis-cluster:6379
      - KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on: [redis-cluster, kafka-1]
    deploy:
      replicas: 2
    networks: [media-net]

  # ═══ INFRASTRUCTURE ═══════════════════════════

  # PostgreSQL instances (1 per service with DB)
  pg-user:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: user_db
      POSTGRES_PASSWORD: ${PG_USER_PASS}
    volumes: [pg-user-data:/var/lib/postgresql/data]
    deploy:
      resources:
        limits: { memory: 512M }
    networks: [media-net]

  pg-upload:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: upload_db
      POSTGRES_PASSWORD: ${PG_UPLOAD_PASS}
    volumes: [pg-upload-data:/var/lib/postgresql/data]
    networks: [media-net]

  pg-catalog:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: catalog_db
      POSTGRES_PASSWORD: ${PG_CATALOG_PASS}
    volumes: [pg-catalog-data:/var/lib/postgresql/data]
    deploy:
      resources:
        limits: { memory: 1G }
    networks: [media-net]

  pg-transcode:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: transcode_db
      POSTGRES_PASSWORD: ${PG_TRANSCODE_PASS}
    volumes: [pg-transcode-data:/var/lib/postgresql/data]
    networks: [media-net]

  pg-ai:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_db
      POSTGRES_PASSWORD: ${PG_AI_PASS}
    volumes: [pg-ai-data:/var/lib/postgresql/data]
    networks: [media-net]

  # Redis Cluster
  redis-cluster:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes: [redis-data:/data]
    ports: ["6379:6379"]
    networks: [media-net]

  # Kafka Cluster (KRaft mode, no Zookeeper)
  kafka-1:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
      KAFKA_LOG_RETENTION_HOURS: 168
      CLUSTER_ID: 'media-platform-kafka-cluster'
    volumes: [kafka-1-data:/var/lib/kafka/data]
    networks: [media-net]

  kafka-2:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 2
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
      CLUSTER_ID: 'media-platform-kafka-cluster'
    volumes: [kafka-2-data:/var/lib/kafka/data]
    networks: [media-net]

  kafka-3:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 3
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
      CLUSTER_ID: 'media-platform-kafka-cluster'
    volumes: [kafka-3-data:/var/lib/kafka/data]
    networks: [media-net]

  # MinIO (S3-compatible Object Storage)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes: [minio-data:/data]
    networks: [media-net]

  # ClamAV (Virus Scanning)
  clamav:
    image: clamav/clamav:latest
    volumes: [clamav-data:/var/lib/clamav]
    networks: [media-net]

  # ═══ OBSERVABILITY ════════════════════════════

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]
    networks: [media-net]

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports: ["3030:3000"]
    volumes: [grafana-data:/var/lib/grafana]
    networks: [media-net]

  # Jaeger (Distributed Tracing)
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports: ["16686:16686", "4318:4318"]
    networks: [media-net]

volumes:
  pg-user-data:
  pg-upload-data:
  pg-catalog-data:
  pg-transcode-data:
  pg-ai-data:
  redis-data:
  kafka-1-data:
  kafka-2-data:
  kafka-3-data:
  minio-data:
  clamav-data:
  grafana-data:
  upload-temp:
  transcode-temp:

networks:
  media-net:
    driver: bridge
```

### 6.2 Kubernetes Production Notes

Với production 100K+ users, Docker Compose dùng cho dev/staging. Production nên dùng **Kubernetes** với:

| Component | K8s Resource | Scaling Strategy |
|-----------|-------------|------------------|
| API Gateway | Deployment + HPA | CPU-based (target 70%) |
| Upload Service | Deployment + HPA | Connection count |
| Catalog Service | Deployment + HPA | CPU + memory |
| Transcode Service | Deployment + KEDA | Queue depth (Bull queue length) |
| AI Service | Deployment + KEDA | Queue depth + GPU availability |
| Streaming Service | Deployment + HPA | Bandwidth / request count |
| PostgreSQL | StatefulSet + PgBouncer | Vertical + read replicas |
| Redis | StatefulSet (Redis Cluster) | 6 nodes (3 master + 3 replica) |
| Kafka | StatefulSet (Strimzi operator) | Partition rebalancing |
| MinIO | StatefulSet (distributed mode) | 4+ nodes, erasure coding |

---

## 7. Cross-cutting Concerns

### 7.1 Observability Stack

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Prometheus  │  │    Jaeger    │  │     Loki     │
│  (Metrics)   │  │  (Tracing)   │  │   (Logs)     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       └────────┬────────┴──────────────────┘
                │
         ┌──────▼──────┐
         │   Grafana   │
         │ (Dashboard) │
         └─────────────┘
```

**Key Metrics per Service:**

- **Upload:** upload_bytes_total, upload_duration_seconds, active_uploads, virus_scan_results
- **Transcode:** jobs_in_queue, job_duration_seconds, ffmpeg_cpu_usage, output_file_size
- **AI:** inference_duration_seconds, model_accuracy, gpu_utilization, nsfw_flagged_total
- **Streaming:** active_streams, bandwidth_bytes, buffer_ratio, segment_latency

### 7.2 Error Handling & Resilience

```typescript
// Dead Letter Queue pattern cho Kafka consumers
@EventPattern('media.transcode.requested')
async handleTranscodeRequest(@Payload() event: MediaEvent<TranscodeRequest>) {
  try {
    await this.transcodeService.process(event.payload);
  } catch (error) {
    if (event.payload._retryCount >= MAX_RETRIES) {
      // Move to DLQ
      await this.kafkaClient.emit('media.transcode.dlq', {
        ...event,
        error: error.message,
        failedAt: new Date().toISOString(),
      });
      return;
    }
    // Retry with exponential backoff
    await this.kafkaClient.emit('media.transcode.requested', {
      ...event,
      payload: {
        ...event.payload,
        _retryCount: (event.payload._retryCount || 0) + 1,
        _retryAfter: Date.now() + Math.pow(2, event.payload._retryCount || 0) * 1000,
      },
    });
  }
}
```

### 7.3 Security

| Layer | Implementation |
|-------|---------------|
| Transport | TLS 1.3 everywhere, mTLS between services |
| Auth | JWT (access 15min) + Refresh Token (7d, rotation) |
| API Keys | SHA-256 hashed, scoped permissions |
| Upload | File type validation (magic bytes, not just extension) |
| Storage | Server-side encryption (SSE-S3), bucket policies |
| Streaming | Time-limited signed URLs (1h expiry) |
| CORS | Whitelist origin domains |
| Rate Limit | Per-IP + per-user sliding window |
| Content | Automated NSFW scanning, manual review queue |

### 7.4 Database Strategy

Mỗi service sở hữu database riêng (Database-per-Service pattern). Cross-service data access qua Kafka events hoặc gRPC calls, không bao giờ query trực tiếp database của service khác.

```
┌─────────────────────────────────────────────────┐
│           PostgreSQL Instances                    │
│                                                   │
│  pg-user     ──▶ users, quotas, api_keys         │
│  pg-upload   ──▶ uploads, chunks                  │
│  pg-catalog  ──▶ media_items, variants, tags      │
│  pg-transcode──▶ jobs, presets                    │
│  pg-ai       ──▶ ai_jobs, transcripts, moderations│
│                                                   │
│  Connection Pooling: PgBouncer per instance       │
│  Backup: pg_dump daily + WAL archiving to S3      │
│  HA: Patroni cluster (1 primary + 2 replicas)     │
└─────────────────────────────────────────────────┘
```

---

## 8. API Design (Key Endpoints)

```yaml
# Upload
POST   /api/v1/upload/init              # Initialize resumable upload
PUT    /api/v1/upload/{id}/chunk/{n}     # Upload chunk
POST   /api/v1/upload/{id}/complete      # Finalize upload

# Media
GET    /api/v1/media                     # List user's media (paginated)
GET    /api/v1/media/{id}                # Get media details + variants
PATCH  /api/v1/media/{id}                # Update title, description, tags
DELETE /api/v1/media/{id}                # Soft delete
GET    /api/v1/media/search?q=           # Full-text search

# Streaming
GET    /api/v1/stream/{id}/manifest      # HLS master playlist
GET    /api/v1/stream/{id}/{quality}/playlist.m3u8

# Transcode
POST   /api/v1/media/{id}/transcode      # Request custom transcode
GET    /api/v1/media/{id}/transcode/status

# AI
POST   /api/v1/media/{id}/ai/transcribe  # Request speech-to-text
GET    /api/v1/media/{id}/ai/transcript   # Get transcript
GET    /api/v1/media/{id}/ai/tags         # Get AI-generated tags

# Collections
POST   /api/v1/collections
GET    /api/v1/collections
POST   /api/v1/collections/{id}/items
DELETE /api/v1/collections/{id}/items/{mediaId}

# User
GET    /api/v1/users/me
GET    /api/v1/users/me/quota
POST   /api/v1/users/me/api-keys
```

---

## 9. Capacity Planning (100K+ Users)

| Resource | Estimate | Config |
|----------|----------|--------|
| Storage | ~500TB (year 1) | MinIO distributed, 4 nodes, erasure coding |
| Upload throughput | 1000 concurrent uploads | 3 upload service replicas |
| Transcode queue | ~50K jobs/day | 4-8 transcode workers (auto-scale) |
| Kafka throughput | ~10K events/sec peak | 3 brokers, 12-24 partitions/topic |
| PostgreSQL | ~1TB catalog DB | Read replicas, partitioning by date |
| Redis | ~4GB memory | 6-node cluster |
| CDN bandwidth | ~50TB/month | CloudFront with regional edge caches |
| GPU (AI) | 2-4 NVIDIA T4/A10 | KEDA scaling on queue depth |

---

*Architecture designed for horizontal scalability. Start with minimum replicas, scale based on metrics.*
