# Media Forge — Kế hoạch triển khai

> Nguyên tắc: **Mỗi phase kết thúc đều có thể demo được.** Không phase nào là "setup xong mà chưa thấy gì".

---

## Phase 1 · Nền móng chạy được

**Mục tiêu:** Docker Compose lên đầy đủ infrastructure + 1 service đầu tiên (User Service) hoạt động end-to-end.

**Việc cần làm:**
- Docker Compose cho PostgreSQL, Redis, Kafka (KRaft), MinIO
- Shared libs: Kafka helper, database config, common DTOs
- User Service: đăng ký, đăng nhập, JWT, refresh token
- API Gateway: routing tới User Service, rate limiting cơ bản

**Thành quả nhìn thấy:**
- `docker compose up` → toàn bộ infra + 2 services sống
- Gọi API đăng ký, đăng nhập, lấy profile qua Postman
- Kafka UI hiển thị cluster healthy
- MinIO Console truy cập được qua browser

---

## Phase 2 · Upload & lưu trữ file

**Mục tiêu:** User upload được file (image/video/audio), file nằm trong MinIO, metadata ghi vào database.

**Việc cần làm:**
- Upload Service: multipart upload, chunk upload (TUS), virus scan (ClamAV)
- Media Catalog Service: nhận event `media.uploaded` từ Kafka, tạo record
- Kết nối Kafka event flow đầu tiên: Upload → Catalog

**Thành quả nhìn thấy:**
- Upload 1 ảnh qua API → file xuất hiện trong MinIO bucket `media-raw`
- GET `/api/v1/media` trả về danh sách file đã upload
- Kafka topic `media.uploaded` có message khi upload xong
- Upload file lớn (video) hoạt động với resumable upload

---

## Phase 3 · Transcode ảnh

**Mục tiêu:** Ảnh upload xong → tự động sinh thumbnail + các variant (webp, avif). Bắt đầu từ image vì pipeline đơn giản nhất, kiểm chứng toàn bộ async flow trước khi làm video.

**Việc cần làm:**
- Transcode Service: image pipeline (Sharp) — thumbnail, resize, convert format
- Kafka flow: `media.transcode.requested` → process → `media.transcode.completed`
- Catalog Service cập nhật variants khi transcode xong
- Bull queue + Redis cho job management

**Thành quả nhìn thấy:**
- Upload ảnh → vài giây sau, MinIO có thêm thumbnail + webp
- GET `/api/v1/media/{id}` trả về `variants[]` với URLs cho từng kích thước
- Bull Board dashboard xem được job queue, trạng thái, thời gian xử lý

---

## Phase 4 · Transcode video & audio

**Mục tiêu:** Video tự động transcode ra nhiều chất lượng + HLS segments. Audio sinh ra mp3/aac + waveform.

**Việc cần làm:**
- Video pipeline: FFmpeg → 360p, 720p, 1080p, HLS adaptive
- Audio pipeline: FFmpeg → mp3_128k, mp3_320k, aac, waveform JSON
- Progress tracking qua Kafka (`media.transcode.progress`)
- Transcode presets (cấu hình sẵn cho từng loại output)

**Thành quả nhìn thấy:**
- Upload video → xem progress realtime (0%→100%)
- MinIO bucket `media-hls` chứa master playlist + segments
- Upload audio → có waveform data trả về qua API
- GET `/api/v1/media/{id}` hiển thị đầy đủ variants cho video/audio

---

## Phase 5 · Streaming

**Mục tiêu:** Phát video qua HLS player trong browser.

**Việc cần làm:**
- Streaming Service: generate master playlist, signed URLs
- Token-based access control (ai có quyền xem media nào)
- CDN integration (CloudFront hoặc chạy local qua Nginx trước)
- Demo player page (HTML + hls.js)

**Thành quả nhìn thấy:**
- Mở browser → chọn video → phát adaptive bitrate (tự chuyển 360p↔1080p)
- Network tab thấy HLS segments được tải từng đoạn
- Video private chỉ phát được khi có token hợp lệ

---

## Phase 6 · AI Processing

**Mục tiêu:** Media upload xong → AI tự động phân tích, gắn tag, tạo transcript.

**Việc cần làm:**
- AI Orchestrator: route job theo media type
- Image AI: object detection (YOLO), scene classification, OCR
- Audio/Video AI: speech-to-text (Whisper) → transcript + subtitles
- Content moderation: NSFW scoring
- Auto-tagging: tổng hợp kết quả AI → gắn tags vào Catalog

**Thành quả nhìn thấy:**
- Upload ảnh chụp văn bản → OCR trả về text
- Upload video có người nói → transcript tiếng Việt/Anh xuất hiện
- Upload ảnh → tự động gắn tags ("outdoor", "beach", "sunset")
- Ảnh NSFW bị flag, status = `flagged` thay vì `ready`

---

## Phase 7 · Search, Collections & Quota

**Mục tiêu:** Tìm kiếm media, tổ chức vào collections, giới hạn quota theo plan.

**Việc cần làm:**
- Full-text search (PostgreSQL tsvector, kết hợp AI tags)
- Collections CRUD: tạo album, thêm/xóa media
- User quota: giới hạn storage, transcode minutes, AI credits theo plan
- Quota enforcement: reject upload khi vượt limit

**Thành quả nhìn thấy:**
- Search "sunset beach" → trả về ảnh đúng (kể cả ảnh chưa có title, nhờ AI tags)
- Tạo collection, thêm media, xem collection
- User free upload quá 5GB → bị reject với thông báo rõ ràng

---

## Phase 8 · Notifications & Realtime

**Mục tiêu:** User nhận thông báo realtime khi media xử lý xong hoặc lỗi.

**Việc cần làm:**
- WebSocket gateway (Socket.io qua NestJS)
- Email notifications (SendGrid)
- Webhook callbacks cho third-party integration
- Notification preferences (user chọn nhận qua kênh nào)

**Thành quả nhìn thấy:**
- Upload video → browser nhận WebSocket push khi transcode xong
- Email notification "Your video is ready" đến inbox
- Webhook POST đến URL đã cấu hình khi media ready

---

## Phase 9 · Observability & Hardening

**Mục tiêu:** Production-ready monitoring, logging, tracing.

**Việc cần làm:**
- Prometheus metrics cho mỗi service
- Grafana dashboards: upload rate, transcode queue, AI throughput, error rates
- Jaeger distributed tracing (trace 1 request xuyên suốt các services)
- Structured logging (Loki hoặc ELK)
- Health checks, circuit breaker, graceful shutdown

**Thành quả nhìn thấy:**
- Grafana dashboard hiển thị realtime metrics toàn hệ thống
- Click vào 1 request trên Jaeger → thấy trace xuyên Gateway → Upload → Kafka → Transcode → Catalog
- Tắt 1 service → circuit breaker bật, hệ thống không sập

---

## Phase 10 · Production Deployment

**Mục tiêu:** Chuyển từ Docker Compose sang Kubernetes, sẵn sàng cho 100K+ users.

**Việc cần làm:**
- Kubernetes manifests / Helm charts cho tất cả services
- HPA + KEDA auto-scaling (transcode & AI scale theo queue depth)
- PostgreSQL HA (Patroni), Redis Cluster, Kafka (Strimzi)
- CI/CD pipeline (GitHub Actions → build → test → deploy)
- SSL/TLS, secrets management (Vault hoặc K8s secrets)

**Thành quả nhìn thấy:**
- `kubectl get pods` → toàn bộ services running trên cluster
- Load test 1000 concurrent uploads → auto-scale transcode workers lên
- Zero-downtime deploy: push code → pipeline tự build, test, deploy

---

## Tổng quan timeline

```
Phase   Tên                         Phụ thuộc
─────   ──────────────────────────   ─────────
  1     Nền móng                     —
  2     Upload & Storage             Phase 1
  3     Transcode ảnh                Phase 2
  4     Transcode video & audio      Phase 3
  5     Streaming                    Phase 4
  6     AI Processing                Phase 2 (chạy song song với 4-5 được)
  7     Search, Collections, Quota   Phase 3 + 6
  8     Notifications & Realtime     Phase 4
  9     Observability                Phase 8 (hoặc bắt đầu từ Phase 4)
 10     Production Deployment        Phase 9
```

**Ghi chú:**
- Phase 6 (AI) có thể chạy song song với Phase 4-5 vì chỉ phụ thuộc Phase 2 (có file trong MinIO là đủ)
- Phase 9 (Observability) nên cài metrics cơ bản từ Phase 4 trở đi, Phase 9 chỉ là hoàn thiện dashboards
- Mỗi phase nên kết thúc bằng 1 buổi demo ngắn để verify kết quả
