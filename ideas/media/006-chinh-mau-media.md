# 006 - Chỉnh màu media (img, video)

> Rough idea (chưa phải mô tả cuối cùng)

Edit/chỉnh màu cho media (ảnh, video) để cùng chung **1 theme / color tone**.

Ví dụ: bộ ảnh du lịch nhiều người chụp bằng nhiều device khác nhau → chỉnh để cùng tone (warm, vintage, moody…).

---

## Cập nhật 2026-04-24 — Tracy

### Đồng ý: MVP chỉ ảnh

Video để Phase 2 sau.

### Competitor nhận diện: Lightroom + thị trường "công thức chỉnh màu"

Lightroom (và các preset market) **đã giải quyết được** bài toán apply tone đồng bộ. Có sẵn cộng đồng bán "công thức" chỉnh màu (preset, LUT) → **chứng tỏ có demand**.

### Nhưng… learning curve là rào cản thật

Người dùng phổ thông (**trong đó có Tracy**) **không biết dùng Lightroom** → dù đã mua preset cũng không apply được. Có 1 số người bán preset nhưng Tracy chưa thử bao giờ vì ngại.

### Giả thuyết về differentiator

Giá trị khác biệt **không phải "chỉnh màu giỏi hơn Lightroom"** — mà là **"không cần học Lightroom"**:

- Upload 5-20 ảnh → pick theme (warm / moody / vintage / Hàn Quốc / Nhật Bản…) → export ảnh đã grade đồng bộ.
- **Zero learning curve** — giống Canva của preset.
- **Mobile-first** — user không cần mở Lightroom desktop.
- Bán **theme / preset pack** như Lightroom preset market, nhưng có **one-click apply** thay vì phải hướng dẫn user import vào Lightroom.

### Test nhanh có thể làm (non-code)

Trước khi build, thử làm thủ công để validate demand:

1. Post 1-2 bài lên group nhiếp ảnh / du lịch VN: *"gửi mình 10 ảnh du lịch, mình chỉnh màu đồng bộ free cho 5 người đầu"*.
2. Dùng Lightroom chỉnh thủ công, gửi lại.
3. Đếm xem có bao nhiêu người quay lại, bao nhiêu người hỏi "bạn có bán dịch vụ này không".

Nếu demand có thật → build tool tự động hóa chính quy trình mình đang làm thủ công.

### Open questions

- Model nào apply được "theme" cho bộ ảnh (preserve chủ thể, chỉ đổi tone) và rẻ? (Gemini 2.0 Flash image edit? Replicate? Custom LUT apply bằng Sharp/FFmpeg?)
- Bộ theme ban đầu lấy đâu — mình tự gen bằng LUT có sẵn hay hợp tác với 1 photographer?
- Tracy có thể là **user đầu tiên** — tự dùng = 5/5, đây là điểm mạnh giữ nguyên.
