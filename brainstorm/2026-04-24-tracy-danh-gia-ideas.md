# Tracy — Đánh giá 6 ideas theo bộ tiêu chí

> **Tác giả:** Tracy
> **Ngày:** 2026-04-24
> **Branch:** `tracy`
> **Mục đích:** chuẩn bị cho buổi họp tiếp theo với Hà (tạm T7 2026-04-25) — trình bày bảng đánh giá các idea + bổ sung insight từ việc đọc lại toàn bộ nội dung repo.

---

## Phần 1 — Tóm tắt nội dung branch `tracy`

### 1.1. Nhóm quan trọng nhất: meeting note + ideas

**`meeting-notes/2026-04-18.md`** — ghi lại buổi họp đầu tiên với Hà. Chốt: side project 2 người part-time, free tier, scope XS, target mass user, định hướng xoay quanh **media services**. Role: Hà care công nghệ, Tracy care logic/UX/UI. Workflow: dùng branch `tracy`, push lên rồi FF-merge sang `main`. Output buổi đó là **6 rough ideas** + bộ tiêu chí. Next step: buổi sau Tracy sẽ trình bày **bảng đánh giá các idea**. (← note này chính là deliverable đó.)

**`ideas/00-tieu-chi-danh-gia.md`** — bộ khung đánh giá gồm **8 tiêu chí có trọng số** (tổng tối đa 85đ):

1. Mass appeal (×3)
2. Dễ tiếp cận (×2)
3. Scope XS để build 1–2 tuần (×3)
4. Chi phí vận hành thấp (×2)
5. Maintenance thấp (×2)
6. Tự dùng được (×2)
7. Path to monetize (×2)
8. Risk thấp — không phụ thuộc 1 platform (×1)

Ngưỡng: ≥65 ưu tiên, 50–64 cần làm rõ, <50 gác/rework. Kèm bộ **7 câu hỏi quick-eval** và danh sách **anti-pattern** (infra phức tạp, seed data lớn, API trả phí không free tier, cần network effect ngay, không đam mê domain).

**`ideas/media/00-base-idea.md`** — định hướng media service gồm 4 nhánh ứng viên: **chỉnh màu**, **ratio crop** (có bản nâng cấp theo golden ratio / rule of thirds), **cắt ghép video highlight**, **audio theme** (chưa rõ).

**6 rough ideas** (tất cả đều mới ở mức 1 đoạn mô tả, chưa deep):

| ID | Tên | Nhánh | Mô tả 1 câu |
|---|---|---|---|
| 001 | Tự động đăng bài lên MXH | Ngoài media | Đưa tư liệu + khung content → hệ thống mix/gen bài, chọn kênh, hẹn giờ, review trước khi post. Telegram bot cho mobile. |
| 002 | "Xào nấu" media | Media (core) | User upload media → hệ thống trả ra vài phương án biến tấu để chọn. |
| 003 | Hướng dẫn tạo dáng chụp ảnh | Ngoài media | Upload ảnh phong cảnh → gợi ý pose. |
| 004 | Gợi ý & thống kê địa điểm vui chơi | Ngoài media | Recommender cafe, ăn uống, du lịch, check-in. |
| 005 | Gợi ý script quay video ngắn | Gần media | Input sản phẩm/chủ đề → checklist shot cần quay. |
| 006 | Chỉnh màu media | Media (core) | Đồng nhất tone màu cho bộ ảnh/video chụp bằng nhiều thiết bị. |

### 1.2. Nhóm kỹ thuật (khung Hà đã dựng — không cần đọc sâu, chỉ cần biết tồn tại)

- **`docs/architecture.md`** (1290 dòng): kiến trúc **8 microservices** NestJS + Postgres + Redis + Kafka + MinIO, target 100K+ users, multi-region. Gồm API Gateway, User, Upload, Catalog, Transcode, Streaming, AI, Notification, Analytics.
- **`docs/implementation-plan.md`** (203 dòng): **10 phase** triển khai, mỗi phase đều có tiêu chí demo được.
- **`docs/minhnguyet.md`**: placeholder gần như trống.
- **`docker-compose.yml`**: compose cho toàn bộ infra.
- **`services/`**: khung folder cho 8 microservices. Chỉ **api-gateway** và **user-service** có code thật; 6 service còn lại chỉ là `.gitkeep` placeholder.
- **`shared/libs/`**: thư viện chung (Kafka helper, DB module, common DTOs/filters/interceptors).
- **`scripts/`**: 2 script auto sync (`sync-tracy.sh`, `predeploy.sh`) — tạo ngày 2026-04-24.
- **`infra/`**: folder rỗng cho cấu hình ClamAV, Grafana, Nginx, Prometheus…

### 1.3. Gap lớn mình nhìn ra

Có một **vênh rõ** giữa hai phần:

- **Tiêu chí + meeting note** nói: 2 người, part-time, scope XS, build 1–2 tuần, infra rẻ.
- **Docs + scaffolding hiện tại** đang build: 8 microservices, Kafka, 100K users, 10 phase, cần cả ClamAV + Grafana + Prometheus.

Đây là kiến trúc của một team 5–10 người full-time làm 6–12 tháng, không phải side project 2 người part-time. Cần **flag với Hà** — hoặc tiêu chí đổi, hoặc kiến trúc cần cắt mạnh. Mình nghiêng về cắt kiến trúc (xem Phần 3).

---

## Phần 2 — Đánh giá 6 ideas theo tiêu chí

Điểm chấm theo bộ 8 tiêu chí × trọng số. Không phải absolute — là **điểm sàn để thảo luận**, có thể cãi lại từng ô.

| Tiêu chí (trọng số) | 001 MXH auto | 002 Xào nấu | 003 Pose | 004 Địa điểm | 005 Script shot | 006 Chỉnh màu |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1. Mass appeal (×3) | 4 | 3 | 3 | 5 | 3 | 4 |
| 2. Dễ tiếp cận (×2) | 3 | 4 | 5 | 5 | 4 | 4 |
| 3. Scope XS (×3) | 2 | 2 | 4 | 1 | 5 | 3 |
| 4. Chi phí vận hành (×2) | 2 | 2 | 4 | 2 | 5 | 2 |
| 5. Maintenance thấp (×2) | 2 | 3 | 4 | 1 | 5 | 3 |
| 6. Tự dùng được (×2) | 4 | 4 | 3 | 4 | 3 | 5 |
| 7. Path to monetize (×2) | 4 | 3 | 2 | 4 | 2 | 4 |
| 8. Risk platform (×1) | 1 | 5 | 5 | 3 | 5 | 5 |
| **Tổng (/85)** | **55** | **55** | **62** | **58** | **61** | **60** |
| Khuyến nghị | Cần làm rõ | Cần làm rõ | Cần làm rõ | Cần làm rõ | Cần làm rõ | Cần làm rõ |

**Không có idea nào vượt ngưỡng 65 ngay.** Tất cả đều "tiềm năng, cần làm rõ thêm". Dưới đây là lý do và gợi ý cho từng idea.

### 001 — Tự động đăng bài MXH (55đ)

**Mạnh:** nhu cầu rất thật (người bán hàng, content creator, brand nhỏ), dễ monetize (subscription / lượt post), tự dùng được.

**Yếu chí mạng:**

- **Risk platform = 1/5** → ăn thẳng vào anti-pattern *"phụ thuộc 1 platform có thể ban overnight"*. Meta/TikTok/Threads đều coi auto-posting qua unofficial tool là vi phạm ToS. Risk bay tài khoản user.
- **Scope không XS**: cần tích hợp 3–4 API (phần lớn có gate thẩm định app 2–6 tuần), OAuth/refresh token, queue, retry. Vài tháng, không phải 1–2 tuần.
- **Chi phí vận hành**: lưu media + queue bài → phải trả storage + compute.

**Gợi ý:** nếu vẫn muốn giữ, cắt còn **1 platform duy nhất có API chính thức** (vd: Threads API, Zalo OA, LinkedIn), bỏ phần "gen tư liệu". Hoặc gác lại.

### 002 — "Xào nấu" media (55đ)

**Mạnh:** đúng trục media core, tự dùng được, risk platform ~0.

**Yếu:**

- **Mô tả quá mơ hồ**: "xào nấu" = cắt? ghép? đổi màu? gen thêm ảnh? Mỗi hướng là một sản phẩm khác. Đây là **meta-idea** hơn là idea.
- Nếu "xào nấu" = gen variant từ ảnh gốc bằng AI, cost rất cao (stable diffusion / GPT-4o image ~$0.04–0.08/ảnh × 3 option × N user → burn tiền nhanh).

**Gợi ý:** tách 002 thành nhiều idea con cụ thể rồi đánh giá lại. Bản thân 006 (chỉnh màu) và "ratio crop" trong base-idea đã là 2 cái cụ thể hơn của 002.

### 003 — Hướng dẫn tạo dáng chụp ảnh (62đ — cao nhất theo điểm)

**Mạnh:** scope XS rõ (upload ảnh → gọi 1 model multimodal → trả về gợi ý pose text + ref ảnh), risk thấp, dễ dùng trên mobile, không cần seed data nếu dùng Gemini Vision / GPT-4o.

**Yếu:**

- **Monetize yếu**: khó thu phí cho tính năng người ta dùng 1 lần rồi quên. Tối đa ads / premium "lấy ảnh ref độ phân giải cao".
- **Mass appeal cần validate**: nghe hay nhưng có thật sự đủ 10k+ user ở VN tìm cái này không? Cần search trend TikTok "tạo dáng chụp ảnh", volume search Google.

**Gợi ý:** mạnh nhất hiện tại theo điểm, **nhưng yếu monetize**. Có thể bán dạng "Bộ sưu tập pose theo chủ đề" (du lịch biển, cafe, street style) → subscription hoặc one-time.

### 004 — Gợi ý & thống kê địa điểm (58đ)

**Mạnh:** mass appeal cao nhất (5/5), dễ tiếp cận, path monetize rõ (ads địa điểm, featured listing).

**Yếu chí mạng:**

- **Scope = 1/5 + Maintenance = 1/5** → ăn thẳng vào anti-pattern *"cần seed data lớn trước khi launch"*. Không có 500+ địa điểm thì không có ai dùng lần 2. Duy trì data địa điểm (đóng cửa, đổi địa chỉ, giá) cực nhọc, không phù hợp part-time.
- Đã có Foody, Google Maps, Now… rất mạnh ở VN. **Khác biệt gì?** — câu hỏi 4 trong quick-eval chưa có câu trả lời.

**Gợi ý:** gác lại ở dạng hiện tại. Nếu vẫn muốn, **thu hẹp ngách cực kỳ** (vd: chỉ cafe có chỗ làm việc lâu ở Q1 Sài Gòn) và có lý do tại sao user chọn mình thay vì Google Review.

### 005 — Gợi ý script quay video ngắn (61đ)

**Mạnh:** scope cực XS (1 prompt LLM có cấu trúc), cost thấp, maintenance ~0, risk platform thấp. Đây là idea **"cheapest to try"**.

**Yếu:**

- **Monetize = 2/5**: giá trị per-user thấp, khó thu phí. Các tool AI chung (ChatGPT, Gemini) đã làm được.
- **Khác biệt gì?** — nếu chỉ là prompt wrapper quanh Gemini, user dùng thẳng Gemini cũng được.

**Gợi ý:** có thể làm **stepping stone** — build 3–5 ngày để test workflow + release + thu user feedback, nhưng không phải sản phẩm chính.

### 006 — Chỉnh màu media (60đ)

**Mạnh:** đúng trục media core, tự dùng được (5/5), risk thấp, path monetize khá (Lightroom preset market là bằng chứng nhu cầu).

**Yếu:**

- **Video = khó**: color grading server-side tốn compute kinh khủng (FFmpeg + GPU nếu realtime). Giữ cả ảnh + video trong MVP → vượt scope.
- **Chi phí vận hành** kéo xuống vì phải lưu file gốc + file output.

**Gợi ý mạnh:** **cắt xuống CHỈ ảnh cho MVP**. Core feature = "upload 5–20 ảnh → pick theme (warm / moody / vintage…) → trả ảnh đã grade đồng bộ". 1 core feature, scope 1–2 tuần khả thi, dùng được trên mobile. Video để Phase 2.

---

## Phần 3 — Đề xuất cho buổi họp với Hà (T7 2026-04-25)

Mình đưa ra bàn họp **3 điểm**:

**1. Shortlist: 006 (chỉnh màu, chỉ ảnh) là ứng viên MVP mạnh nhất.**
Lý do: đúng trục media, tự dùng được, scope cắt gọn khả thi, có bằng chứng monetize (preset market), risk platform thấp. **003 là phương án 2** — nhẹ hơn nhưng path monetize yếu.

**2. Gác hoặc rework: 001 và 004.**
- 001 vi phạm anti-pattern *"phụ thuộc 1 platform"*.
- 004 vi phạm *"cần seed data lớn"*.
Cả hai đều bị đánh dấu đỏ trong chính tiêu chí mình đặt ra.

**3. Flag gap kiến trúc vs tiêu chí.**
Hỏi Hà thẳng: *"Kiến trúc 8 microservices + Kafka + 100K users có khớp với 'scope XS, 2 người part-time, build 1–2 tuần' không?"*
Nếu làm MVP 006 thật sự, một Next.js app + 1 API route gọi Gemini + Cloudinary/S3 cho ảnh là đủ. Docker compose + 8 services là over-engineering cho giai đoạn này. Có thể kiến trúc hiện tại là "target sau 1 năm" chứ không phải MVP — cần confirm với Hà để tránh dồn sức vào infra thay vì vào product.

---

## Phần 4 — Open questions cần làm rõ trước buổi họp

- [ ] Validate mass appeal cho 003 và 006: search volume "tạo dáng chụp ảnh", "chỉnh màu ảnh đồng bộ", "preset lightroom" ở VN.
- [ ] 006 MVP: dùng model nào? Gemini 2.0 Flash image edit? Replicate? Cost per ảnh?
- [ ] Storage cho 006: Cloudinary free tier đủ không? (25GB + 25k transformations/tháng).
- [ ] Hà có sẵn kiến trúc lớn rồi — có muốn giữ như "long-term target" và build MVP nhỏ ở một sub-folder không?
- [ ] Deadline mềm cho MVP: 2 tuần, 4 tuần, hay flexible?
