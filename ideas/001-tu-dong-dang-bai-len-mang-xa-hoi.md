# 001 - Tự động đăng bài lên mạng xã hội

> Rough idea (chưa phải mô tả cuối cùng)

## Input
- Có sẵn tư liệu: img, photo
- Có khung content muốn đăng là gì

## Action
- Có thể tự động mix các tư liệu tạo thành bài post
- Có thể tự động gen tư liệu dựa trên tư liệu được cung cấp
- Có thể lựa chọn kênh/tài khoản để đăng
- Có thể hẹn giờ
- Có thể work comfortable trên điện thoại: vd sử dụng telegram bot để gửi content/image/video
- Database đơn giản có sẵn: vd google drive, sheet, etc.
- Custom format cho phù hợp với platform. Vd thread thì đăng text với ảnh ngang hoặc vuông ok hơn ảnh dọc
- Có thể setup tone giọng
- Có thể cung cấp 1 vài phương án -> select preferral -> post hoặc schedule post
- Có thể review confirm trước khi post

## Risk
- Cần tìm hiểu thêm việc tự động dùng bot có khiến kênh bị die, bị khoá hay bị ảnh hưởng tới lượng tương tác hay không

## Reference
- https://www.reddit.com/r/automation/comments/1rn6iwv/

---

## Cập nhật 2026-04-24 — Tracy

### Re-scope: không cần full flow auto-post ngay

Tạm thời **không làm phần "tự động đăng bài"**. Pipeline cắt xuống còn:

1. Input: ảnh/video (optional) + hướng nội dung mong muốn — vd *"chia sẻ niềm vui khi được đi chơi"*.
2. Output: vài phương án nội dung bài post để user chọn.
3. User chọn phương án ưng → **lưu vào Google Sheet** kèm thời gian mong muốn đăng.
4. Mỗi sáng, **Telegram bot** chủ động nhắn: *"hôm nay có N bài đang chờ, bạn muốn đăng bài nào?"* → user trả lời → bot trả lại nội dung vào chat để user **copy-paste đăng thủ công**.

Việc auto-posting thật sự sẽ tính sau (nếu có). Hoặc thử hướng "schedule" native của platform (Threads, Facebook) — cần check policy xem có vi phạm không.

### Các hướng scope co giãn (từ dễ đến khó)

- **Scope A — text only, tick có media:** không hỗ trợ upload ảnh/video. User chỉ brief muốn đăng gì; nếu có media kèm thì tick + mô tả ngắn ("1 ảnh chụp biển Nha Trang lúc hoàng hôn").
- **Scope B — text only, không media:** user brief quan điểm về news thường nhật → bot gen nội dung → lưu.
- **Scope C — ảnh only:** hỗ trợ upload ảnh, không nhận video.
- **Scope D — ảnh + video:** bản đầy đủ như mô tả ban đầu.

Bắt đầu từ A hoặc B để rẻ nhất, validate giá trị cốt lõi trước.

### Nút thắt (pain point) mình đang thấy

ChatGPT / Gemini đã gen được nội dung. **Nút thắt không phải ở "gen" — mà ở "chỗ lưu draft"**. Hiện không có chỗ nào:

- Lưu idea/nội dung đăng bài chưa kịp đăng để hôm khác đăng.
- Lưu rough idea của blogger (có ý muốn viết nhưng chưa thành bài).
- Bảo bot lấy lại, tư vấn, expand khi cần inspiration.

Giá trị lõi của MVP = **"kho draft ý tưởng có bot đọc hiểu + nhắc nhở"**, không phải "gen nội dung".

### Target user khả thi

**Trước khi nghĩ đến mass:** validate với **nhóm nhỏ / cá nhân** trước. Không phải idea nào cũng phù hợp với mass — cái này có thể là niche tool cho content creator cá nhân / blogger / người bán hàng nhỏ.

### Open questions

- Lưu nội dung nhạy cảm của user trong Google Sheet có OK không (privacy)?
- Telegram bot free tier đủ cho bao nhiêu user đồng thời?
- Schedule post native của platform có API/cơ chế không vi phạm ToS?
