# Tracy — Bẻ nhỏ scope từng idea + bảng đánh giá các variant

> **Tác giả:** Tracy (draft by Claude theo insight Tracy cung cấp)
> **Ngày:** 2026-04-24
> **Branch:** `tracy`
> **Mục đích:** với mỗi idea trong 6 ideas gốc, đề xuất **3–4 variant "bẻ nhỏ scope"**, mô tả hướng triển khai kỹ thuật ngắn gọn, và chấm điểm theo bộ 8 tiêu chí (`ideas/00-tieu-chi-danh-gia.md`) để có cơ sở thảo luận với Hà.
>
> **Cách đọc nhanh:** bảng tổng hợp ở Phần 7 cuối file — có thể nhảy thẳng xuống đó xem điểm, rồi quay lên từng idea đọc chi tiết variant nào mình quan tâm.

Bộ tiêu chí dùng để chấm (copy lại cho tiện đối chiếu):

| # | Tiêu chí | Trọng số |
|---|---|:--:|
| 1 | Mass appeal | ×3 |
| 2 | Dễ tiếp cận | ×2 |
| 3 | Scope XS (build 1–2 tuần) | ×3 |
| 4 | Chi phí vận hành thấp | ×2 |
| 5 | Maintenance thấp | ×2 |
| 6 | Tự dùng được | ×2 |
| 7 | Path to monetize | ×2 |
| 8 | Risk platform thấp | ×1 |

Ngưỡng: ≥65 ưu tiên · 50–64 cần làm rõ · <50 gác/rework. Max 85.

---

## 1. Idea 001 — Tự động đăng bài MXH

**Insight Tracy chốt lại:** key pain = *thiếu chỗ lưu draft*. Không cần auto-post thật. Pattern chung = Telegram bot + Google Sheet.

### 001-A · Draft Vault text-only (đề xuất mạnh nhất)

**Triển khai:**
- Telegram bot nhận brief text từ user ("muốn đăng post chia sẻ niềm vui đi chơi").
- Bot gọi Gemini gen 2–3 phương án caption → user reply số phương án ưng.
- Caption lưu Google Sheet kèm `created_at`, `post_date`, `status=draft`.
- Cron (GitHub Actions / Vercel cron) mỗi sáng 8h đọc sheet, nhắn Telegram: *"hôm nay có 2 draft chờ: (1) …, (2) …. Reply số để nhận nội dung."*
- User copy nội dung, **tự paste đăng thủ công** lên platform.

**Không làm:** xử lý ảnh/video, tích hợp API MXH, auto-post.

**Stack:** Telegram Bot API · Gemini API · Google Sheet API · 1 cron job.

### 001-B · Draft Vault + media tag (metadata, KHÔNG lưu file)

**Triển khai:** giống 001-A, nhưng khi draft có kèm ảnh/video, user **mô tả bằng chữ** ("1 ảnh sunset ở Nha Trang, 1 video pan 360 bãi biển"). Bot lưu mô tả; khi nhắc lại user tự nhớ đính kèm file từ photo library của mình.

**Khác biệt:** vẫn $0 storage, nhưng draft có "memory" về media kèm theo.

### 001-C · Draft Vault + upload ảnh (caption-from-image)

**Triển khai:** giống 001-B nhưng user gửi ảnh vào bot. Bot gọi Gemini Vision mô tả ảnh + gen caption phù hợp. Ảnh lưu Telegram (free, bot serve lại qua file_id) hoặc Cloudinary free tier.

**Khác biệt:** chạm được ngách creator nhiều ảnh. Chi phí +, scope +.

### 001-D · Idea Seed Bank cho blogger

**Triển khai:** thu hẹp về ngách blogger/writer. Bot chỉ làm 2 việc:
1. *Nhận rough idea* ("ý tưởng viết về tại sao nên ngủ trưa").
2. *Khi user cần inspiration*, user nhắn `/inspire` → bot random 3 idea cũ, gợi ý expand thành outline.

Không gen caption, không scheduling. **Thuần tính năng "kho ý tưởng có brain"**.

**Khác biệt:** niche rõ, scope cực nhỏ, nhưng mass appeal giảm.

### Bảng điểm — idea 001

| Tiêu chí (trọng số) | 001-A Draft text | 001-B + tag | 001-C + ảnh | 001-D Seed bank |
|---|:-:|:-:|:-:|:-:|
| Mass appeal (×3) | 3 | 3 | 3 | 2 |
| Dễ tiếp cận (×2) | 5 | 5 | 4 | 5 |
| Scope XS (×3) | 5 | 4 | 3 | 5 |
| Chi phí vận hành (×2) | 5 | 5 | 3 | 5 |
| Maintenance (×2) | 5 | 5 | 4 | 5 |
| Tự dùng được (×2) | 3 | 4 | 4 | 3 |
| Path to monetize (×2) | 2 | 2 | 3 | 2 |
| Risk platform (×1) | 4 | 4 | 4 | 5 |
| **Tổng / 85** | **68** | **67** | **58** | **66** |
| Khuyến nghị | Ưu tiên | Ưu tiên | Làm rõ | Ưu tiên |

---

## 2. Idea 002 — Xào nấu media (video cut + reorder)

**Insight Tracy:** chỉ cut + reorder, **không gen ảnh**. Tracy chưa thấy cách bẻ nhỏ.

### 002-A · Client-side trimmer + reorder (FFmpeg.wasm)

**Triển khai:**
- Web app (Next.js) load FFmpeg.wasm chạy trong trình duyệt.
- User upload 1 video → timeline UI cho phép đặt 2–5 marker để cắt đoạn.
- Drag-and-drop các đoạn đã cắt để sắp xếp thứ tự.
- Export mp4 tỉ lệ 9:16, chạy hoàn toàn **client-side** → infra $0.

**Giới hạn:** video lớn (>200MB) chậm trên mobile; iPhone Safari có bug FFmpeg.wasm đôi khi.

### 002-B · Server-side trimmer + reorder

**Triển khai:** giống 002-A nhưng xử lý trên server (FFmpeg CLI). Có queue (BullMQ/Redis). Upload lên S3/MinIO, xử lý xong trả link.

**Giới hạn:** không còn $0 — trả tiền compute + storage ngay từ user đầu tiên.

### 002-C · Sport Highlight Cutter (niche — cầu lông, tennis, bóng đá)

**Triển khai:**
- User upload video 1 trận đấu (vd: 1h video cầu lông).
- Server phân tích audio energy (Python + librosa): rally = loud claps / ball hit, dead time = quiet.
- Auto propose các đoạn rally (vd: 25 đoạn, mỗi đoạn 5–20s).
- User tick bỏ những đoạn không muốn giữ, reorder.
- Export highlight video 2–5 phút.

**Giá trị khác biệt:** automation phần mệt nhất (tìm highlight trong video dài). Ngách cụ thể → dễ claim.

**Giới hạn:** cần compute, cần dataset để tune audio detection, scope không còn nhỏ.

### 002-D · Template-based reorder (travel vlog / wedding / vlog)

**Triển khai:** user upload N clips ngắn → chọn template ("travel vlog day 1"). Template = thứ tự + duration + caption overlay gợi ý. User tick tick là ra video.

**Giá trị:** giảm decision fatigue cho user không biết edit. Khác 002-A ở chỗ có "brain gợi ý".

### Bảng điểm — idea 002

| Tiêu chí (trọng số) | 002-A Client trimmer | 002-B Server trimmer | 002-C Sport highlight | 002-D Template |
|---|:-:|:-:|:-:|:-:|
| Mass appeal (×3) | 4 | 4 | 2 | 3 |
| Dễ tiếp cận (×2) | 4 | 5 | 4 | 4 |
| Scope XS (×3) | 3 | 2 | 2 | 2 |
| Chi phí vận hành (×2) | 5 | 2 | 2 | 2 |
| Maintenance (×2) | 4 | 3 | 3 | 3 |
| Tự dùng được (×2) | 3 | 3 | 3 | 3 |
| Path to monetize (×2) | 3 | 3 | 4 | 4 |
| Risk platform (×1) | 5 | 5 | 5 | 5 |
| **Tổng / 85** | **64** | **55** | **49** | **52** |
| Khuyến nghị | Làm rõ (cận ưu tiên) | Làm rõ | Gác/rework | Làm rõ |

---

## 3. Idea 003 — Hướng dẫn tạo dáng chụp ảnh

**Insight Tracy:** camera AI Huawei đã làm tốt realtime → rất khó thắng UX của nó.

### 003-A · Pose Pack Collection (nội dung curated, không AI)

**Triển khai:**
- Website tĩnh (Framer/Notion/Astro) chứa bộ sưu tập pose **theo theme**: biển & nắng, cafe moody, street style Hàn, dã ngoại, ảnh cặp đôi…
- Mỗi theme = 15–30 ảnh reference + text mô tả pose + tips ánh sáng.
- Free 2 theme preview + bán theme pack $3–5/theme hoặc $10/tháng unlock all.

**Lợi thế:** ~0 compute, ~0 AI cost. Scope = content + UX đơn giản.

**Cảnh báo:** cần ảnh — tự mua asset (Unsplash+, Envato) hoặc hợp tác photographer.

### 003-B · iOS realtime pose camera

**Triển khai:** SwiftUI + on-device ML model (CoreML, nhẹ như MediaPipe Pose) suggest pose overlay khi mở camera. Giống Huawei nhưng cho iOS.

**Giá trị:** fill gap iOS native.

**Giới hạn:** 2 người làm không có kinh nghiệm iOS — scope **không còn XS**. App Store review.

### 003-C · Upload ảnh → gợi ý pose text (Gemini Vision wrapper)

**Triển khai:** PWA đơn giản. Upload ảnh phong cảnh → Gemini Vision + prompt "suggest 3 poses for this location" → hiển thị text description + tạo 3 ảnh ref bằng Gemini Image hoặc Imagen.

**Giá trị:** scope siêu nhỏ, làm trong 3–5 ngày.

**Giới hạn:** không khác gì prompt thẳng Gemini. Monetize yếu.

### 003-D · Awareness play (không phải software)

**Triển khai:** TikTok/YouTube channel "1 phút học tạo dáng" + landing page review các công cụ pose AI đã có.

**Lợi thế:** 0 compute, leverage distribution. **Nhưng không phải product tech** → loại khỏi scope side project này.

### Bảng điểm — idea 003

| Tiêu chí (trọng số) | 003-A Pose pack | 003-B iOS camera | 003-C Gemini wrapper | 003-D Awareness |
|---|:-:|:-:|:-:|:-:|
| Mass appeal (×3) | 3 | 4 | 3 | 3 |
| Dễ tiếp cận (×2) | 5 | 4 | 3 | 5 |
| Scope XS (×3) | 5 | 1 | 5 | 4 |
| Chi phí vận hành (×2) | 5 | 4 | 4 | 5 |
| Maintenance (×2) | 4 | 3 | 5 | 3 |
| Tự dùng được (×2) | 3 | 3 | 2 | 2 |
| Path to monetize (×2) | 4 | 4 | 1 | 3 |
| Risk platform (×1) | 5 | 3 | 4 | 3 |
| **Tổng / 85** | **71** | **54** | **58** | **57** |
| Khuyến nghị | Ưu tiên | Làm rõ | Làm rõ | Làm rõ |

*(Lưu ý: 003-A cao nhưng cần check Tracy có đam mê curate content pose không — anti-pattern "2 người không có đam mê/kiến thức về domain" nếu không.)*

---

## 4. Idea 004 — Bookmark địa điểm cá nhân

**Insight Tracy:** user seed data chính mình, không seed mass. Pattern Telegram bot + Google Sheet. Pain point cực rõ với chính Tracy.

### 004-A · Telegram bot + Google Sheet (personal bookmark)

**Triển khai:**
- User paste URL (TikTok / IG / FB / YouTube) vào Telegram bot, kèm note ngắn.
- Bot crawl OG metadata + caption của bài post (nếu có API/scrape được).
- Gemini extract structured fields: tên quán, địa chỉ, quận/thành phố, loại (cafe/ăn/bar), vibe, giờ mở (nếu có).
- Append vào Google Sheet của user.
- User chat `/find cafe Q1 yên tĩnh` → bot query sheet bằng keyword + LLM re-rank → trả top 3.

**Stack:** Telegram Bot API · Gemini API · Google Sheet API · scraping library (Cheerio/Playwright nếu cần) · 1 host (Cloudflare Worker free / Vercel).

### 004-B · Web app + shared lists giữa users

**Triển khai:** thêm web UI lên trên 004-A. User login (Google OAuth). Mỗi list có permission public/private/shared. Thêm "merge lists" để kết hợp list của nhiều user.

**Giá trị:** mở được hướng viral (share list), có path monetize rõ hơn.

**Giới hạn:** scope lớn hơn nhiều, cần DB thật (Supabase free), cần UX design.

### 004-C · Mobile share extension (iOS/Android native)

**Triển khai:** native share extension để user share URL trực tiếp từ TikTok/IG/YouTube app → extension gọi API backend xử lý → lưu Sheet. **UX zero-friction.**

**Giá trị:** kill friction lớn nhất (copy URL, mở Telegram, paste, gửi).

**Giới hạn:** build native extension iOS + Android với 2 người part-time là quá sức. Pháp lý scrape content platform vẫn mơ hồ.

### 004-D · Plan generator (build trên data đã có)

**Triển khai:** giả định đã có 004-A chạy ổn. Thêm command `/plan chủ nhật đi cafe + ăn trưa Q1` → bot gợi ý sequence 2–3 địa điểm từ list user, tính thời gian di chuyển, export itinerary.

**Vị trí:** đây là **phase 2** trên nền 004-A, không phải MVP riêng.

### Bảng điểm — idea 004

| Tiêu chí (trọng số) | 004-A Bot + Sheet | 004-B Web + share | 004-C Share extension | 004-D Plan gen |
|---|:-:|:-:|:-:|:-:|
| Mass appeal (×3) | 4 | 4 | 4 | 3 |
| Dễ tiếp cận (×2) | 5 | 4 | 5 | 4 |
| Scope XS (×3) | 4 | 2 | 2 | 3* |
| Chi phí vận hành (×2) | 5 | 3 | 4 | 4 |
| Maintenance (×2) | 4 | 3 | 3 | 3 |
| Tự dùng được (×2) | 5 | 4 | 5 | 4 |
| Path to monetize (×2) | 3 | 4 | 3 | 4 |
| Risk platform (×1) | 4 | 4 | 3 | 4 |
| **Tổng / 85** | **72** | **58** | **61** | **60*** |
| Khuyến nghị | **Ưu tiên cao nhất** | Làm rõ | Làm rõ | Phase 2 |

*004-D giả định đã có 004-A; điểm chỉ có nghĩa nếu đã build xong 004-A.*

---

## 5. Idea 005 — Script quay video ngắn

**Insight Tracy:** ChatGPT/Gemini làm được rồi. Tracy sẽ test Gemini trước để tìm gap thật.

### 005-A · Thin wrapper + Checklist tick mode (mobile-first)

**Triển khai:**
- PWA đơn giản, user nhập chủ đề video ("quay review son dưỡng").
- Gemini trả ra shot list có cấu trúc: shot #, góc máy, duration, mô tả.
- UI hiển thị list có **checkbox to từng shot, to tick khi đang quay ngoài thực địa**.
- Auto save progress (IndexedDB / Supabase).

**Khác với Gemini thuần:** offline-friendly, có checklist mode dùng khi đang cầm máy quay. Đây là UX gap.

### 005-B · Project vault + revisit (merge với pattern 001-D)

**Triển khai:** giống 005-A nhưng thêm "project" — user lưu nhiều script, revisit, chia sẻ với editor/đồng đội. Có version history.

**Giá trị:** cho creator làm content series (tập 1 / tập 2 / tập 3).

### 005-C · Template-based (pre-built cho ngách cụ thể)

**Triển khai:** tạo thư viện template "review mỹ phẩm", "tour quán cafe", "day in life"… mỗi template có slot (tên sản phẩm, địa điểm…). User fill slot → ra shot list hoàn chỉnh.

**Lợi thế:** ít dependency vào LLM (rẻ hơn), scope XS.

**Giới hạn:** khó gen template phủ đủ use case — sẽ rất cứng.

### 005-D · Tạm gác — chờ kết quả Gemini test của Tracy

**Hành động:** Tracy quay thử 1 video dùng Gemini gen script, ghi lại gap thật. Không build gì cho đến khi có kết quả.

### Bảng điểm — idea 005

| Tiêu chí (trọng số) | 005-A Checklist mode | 005-B Project vault | 005-C Template |
|---|:-:|:-:|:-:|
| Mass appeal (×3) | 3 | 2 | 3 |
| Dễ tiếp cận (×2) | 4 | 4 | 4 |
| Scope XS (×3) | 4 | 3 | 4 |
| Chi phí vận hành (×2) | 4 | 4 | 5 |
| Maintenance (×2) | 4 | 4 | 3 |
| Tự dùng được (×2) | 3 | 3 | 3 |
| Path to monetize (×2) | 2 | 2 | 3 |
| Risk platform (×1) | 4 | 4 | 4 |
| **Tổng / 85** | **59** | **53** | **61** |
| Khuyến nghị | Làm rõ | Làm rõ | Làm rõ |

*(005-D không chấm điểm — là trạng thái "pending validation".)*

---

## 6. Idea 006 — Chỉnh màu ảnh

**Insight Tracy:** Lightroom đã giải được bài toán, nhưng **learning curve là rào cản** cho người phổ thông.

### 006-A · One-click preset web app (core MVP)

**Triển khai:**
- PWA mobile-first. User upload 5–20 ảnh.
- Chọn 1 theme từ preset pack (warm / moody / vintage / Hàn / Nhật).
- Backend dùng **Sharp + LUT files** (file `.cube` đã tuning sẵn) apply cho cả batch.
- Download zip kết quả.

**Stack:** Next.js + Sharp + LUT files từ free sources (hoặc tự tuning bằng Lightroom rồi export LUT). Storage Cloudinary free tier (25GB).

**Giá trị khác biệt:** zero learning curve, mobile, batch, export đồng bộ. Không cần Lightroom.

### 006-B · Demand validation trước (Phase 0, không code)

**Hành động (không phải product):**
- Post lên 2–3 group FB / Reddit nhiếp ảnh & du lịch VN: *"gửi mình 10 ảnh, mình chỉnh tone đồng bộ free cho 5 người đầu"*.
- Tự chỉnh bằng Lightroom thủ công, gửi lại.
- Đo: bao nhiêu reply? bao nhiêu người nhắn lại xin thêm? bao nhiêu người hỏi "có bán dịch vụ này không"?

**Decision gate:** chỉ build 006-A nếu ≥30% người nhắn lại trong 2 tuần.

### 006-C · Reference-photo-driven (AI transfer tone từ 1 ảnh ref)

**Triển khai:** user upload 1 ảnh "đây là tone tôi muốn" + N ảnh cần chỉnh. Dùng color transfer algorithm (Reinhard, PCCM) hoặc Gemini 2.0 Flash image edit với prompt "match color tone of reference".

**Giá trị khác biệt so với 006-A:** không bị giới hạn bởi preset pack có sẵn — user tự đem tone từ ảnh mình thích.

**Giới hạn:** model cost tăng; kết quả khó đoán hơn LUT cứng.

### 006-D · Theme marketplace (mở rộng từ 006-A)

**Triển khai:** trên nền 006-A, cho phép photographer upload theme pack của họ, chia doanh thu. Giống Creative Market mini cho preset.

**Vị trí:** phase 2 — chỉ có ý nghĩa sau khi 006-A có user.

### Bảng điểm — idea 006

| Tiêu chí (trọng số) | 006-A Preset web | 006-C Reference AI | 006-D Marketplace |
|---|:-:|:-:|:-:|
| Mass appeal (×3) | 4 | 3 | 3 |
| Dễ tiếp cận (×2) | 5 | 4 | 4 |
| Scope XS (×3) | 3 | 2 | 2* |
| Chi phí vận hành (×2) | 3 | 2 | 3 |
| Maintenance (×2) | 3 | 3 | 3 |
| Tự dùng được (×2) | 5 | 4 | 3 |
| Path to monetize (×2) | 4 | 4 | 5 |
| Risk platform (×1) | 5 | 4 | 4 |
| **Tổng / 85** | **66** | **53** | **56*** |
| Khuyến nghị | Ưu tiên | Làm rõ | Phase 2 |

*006-D giả định đã có 006-A.*

*006-B là phase 0 validation không chấm điểm (nhưng **khuyến nghị làm trước 006-A**).*

---

## 7. Bảng tổng hợp — tất cả variant, sắp xếp theo điểm

| Hạng | Variant | Điểm | Nhóm | Ghi chú ngắn |
|:--:|---|:-:|---|---|
| 1 | **004-A** Bookmark bot + Sheet | **72** | Ưu tiên cao nhất | Pain của Tracy cực rõ, scope XS, $0 cost |
| 2 | **003-A** Pose pack collection | **71** | Ưu tiên | Nội dung curated, ~0 tech risk — cần đam mê curate |
| 3 | **001-A** Draft Vault text-only | **68** | Ưu tiên | Pattern Telegram bot đơn giản nhất |
| 4 | **001-B** Draft Vault + media tag | **67** | Ưu tiên | Gần như 001-A, thêm metadata |
| 5 | **006-A** Preset web app | **66** | Ưu tiên | Đúng trục media core, zero learning curve |
| 6 | **001-D** Idea seed bank | **66** | Ưu tiên | Niche blogger, scope cực nhỏ |
| 7 | 002-A Client trimmer (FFmpeg.wasm) | 64 | Làm rõ | Cận ưu tiên, kỹ thuật có rủi ro |
| 8 | 005-C Template script | 61 | Làm rõ | Chờ Tracy test Gemini |
| 9 | 004-C Share extension | 61 | Làm rõ | Native quá nặng cho 2 ng part-time |
| 10 | 004-D Plan generator | 60* | Phase 2 | Chỉ có ý nghĩa sau 004-A |
| 11 | 005-A Checklist mode | 59 | Làm rõ | Chờ Tracy test Gemini |
| 12 | 004-B Web + share | 58 | Làm rõ | Scope tăng nhiều so với 004-A |
| 13 | 001-C Draft + ảnh | 58 | Làm rõ | Chi phí/scope tăng |
| 14 | 003-C Gemini wrapper | 58 | Làm rõ | Ít khác biệt so với Gemini gốc |
| 15 | 003-D Awareness | 57 | Làm rõ | Không phải software product |
| 16 | 006-D Marketplace | 56* | Phase 2 | Chỉ có ý nghĩa sau 006-A |
| 17 | 002-B Server trimmer | 55 | Làm rõ | Cost tăng ngay từ user đầu |
| 18 | 003-B iOS camera | 54 | Làm rõ | Scope quá lớn cho 2 ng part-time |
| 19 | 005-B Project vault | 53 | Làm rõ | Giá trị thấp nếu không có distribution |
| 20 | 006-C Reference AI | 53 | Làm rõ | Model cost + khó đoán kết quả |
| 21 | 002-D Template vlog | 52 | Làm rõ | Scope không thật sự nhỏ |
| 22 | 002-C Sport highlight | 49 | Gác/rework | Ngách quá, kỹ thuật khó |

---

## 8. Gợi ý chọn shortlist để đưa vào buổi họp T7

Top 3 rõ ràng (≥68đ, phủ 3 idea khác nhau) — an toàn để chọn 1 MVP thật sự:

1. **004-A — Bookmark bot + Sheet** (72đ)
2. **003-A — Pose pack collection** (71đ)
3. **001-A — Draft Vault text-only** (68đ)

Nếu ưu tiên bám trục **media core** như base-idea đã chốt:

- **006-A — Preset web app** (66đ) là ứng viên duy nhất trong top 6 nằm đúng nhánh media.

**3 câu hỏi quyết định** cho buổi họp với Hà:

1. **Có bám đúng base-idea media hay mở rộng ra?** Nếu bám chặt → 006-A. Nếu mở → 004-A dẫn đầu rõ rệt.
2. **Có làm Phase 0 validate trước (006-B manual) không?** 1–2 tuần đo demand thật trước khi code.
3. **Gap kiến trúc hiện tại** — microservices + Kafka + 100K users có cần cắt xuống Next.js + Supabase/Cloudflare Worker cho MVP không?

---

## 9. Ghi chú về cách chấm điểm

- Điểm là **điểm sàn để thảo luận**, không phải phán xét cuối. Có thể cãi từng ô.
- Tiêu chí "Tự dùng được" (×2) được chấm dựa trên: Tracy có pain thật không (5), Hà có thể có pain không (4), người thân bạn bè dùng (3), chỉ dùng để test (2), không ai dùng (1).
- Tiêu chí "Mass appeal" (×3) dùng proxy: có ít nhất 10k user tiềm năng ở VN không? 5 = rất rõ (vd bookmark), 3 = có nhưng ngách, 1 = rất hẹp.
- Tiêu chí "Scope XS" (×3) = có build được MVP trong 1–2 tuần với 2 người part-time không? 5 = 1 tuần dễ, 3 = 2 tuần gọn, 1 = vài tháng.
- Tiêu chí "Risk platform" (×1) được chấm rộng tay với các variant không đụng ToS MXH; chấm thấp với những cái phụ thuộc 1 platform có thể ban overnight.

Claude có thể sai ở từng ô — Tracy và Hà hãy review từng dòng khi họp.
