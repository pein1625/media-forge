# 004 - Gợi ý và thống kê các địa điểm vui chơi giải trí

> Rough idea (chưa phải mô tả cuối cùng)

Một nơi gợi ý và thống kê các địa điểm vui chơi giải trí.

Ví dụ: cafe, ăn uống, du lịch, check-in.

---

## Cập nhật 2026-04-24 — Tracy

### Re-frame quan trọng: KHÔNG phải recommender mass, mà là "bookmark tool cá nhân"

MVP **không seed data lớn** trước khi launch. Chỉ **user tự seed data của chính họ**, những chỗ họ quan tâm. Đây là **personal bookmark / note-taking tool cho địa điểm**, không phải Foody/Google Maps thứ 2.

### Pain point thật của Tracy

Tracy consume content ở rất nhiều kênh (YouTube, Facebook, Thread, TikTok, Instagram). Mỗi lần thấy review quán hay, hiện đang phải làm 2 bước:

1. Save bài post tại chính platform đó.
2. Vào Google Maps save địa điểm, gắn label (ăn/cafe, Việt/nước ngoài…).

**Nhưng flow này bể ở nhiều chỗ:**

- Google Maps info outdate (đóng cửa, đổi giờ mở).
- Không nhớ **tại sao** đã save, **điểm gì thích** ở đó.
- Phải lưu cả bài post gốc bên ngoài, nhưng **khó link** được từ Google Maps về bài post.
- Đến quán không ưng → phải **unsave thủ công** ở nhiều nơi, không có chỗ note lý do.
- Một số quán **giờ mở khác nhau** theo buổi → mỗi lần vào lại phải tìm.
- Google Maps **hạn chế tag** — muốn gán nhiều thông tin (vibe, ai đi cùng đến, mood phù hợp) không được.

### Idea MVP sơ khai (bookmark-first)

Flow:

1. Tracy xem 1 bài post / video hay về quán → **paste URL vào Telegram bot**, kèm text ghi chú cá nhân ("quán này có chỗ làm việc, cafe sữa đá 35k, vibe yên tĩnh").
2. Bot tự động trích: tên quán, địa chỉ, thành phố / quận, loại (cafe / ăn / bar), vibe — từ nội dung bài post + từ URL.
3. Bot lưu vào **Google Sheet cá nhân**.
4. Sau này muốn tìm: chat với bot *"cho tôi quán cafe yên tĩnh ở Q1"* → bot query sheet, trả về top 3-5 kèm ghi chú gốc của Tracy.

**Tech stack đơn giản:** Telegram Bot API + Gemini (trích thông tin) + Google Sheet API. Không DB, không server phức tạp. Infra ~$0.

### Tại sao re-frame này giải quyết được anti-pattern "seed data lớn"

- Không cần seed trước. User seed dần khi dùng.
- Data của ai người đó dùng — không cần network effect để hữu ích.
- Giá trị tăng theo thời gian với chính user đó ("moat" cá nhân).

### Idea dài hơi (không ưu tiên MVP)

- **Share list:** Tracy share list cho Hà → bot tổng hợp list 2 người, present theo cách của Hà.
- **Plan suggestion:** bot dựa trên list → đề xuất plan đi chơi (sáng cafe A → trưa ăn B → chiều check-in C).
- **Auto re-validation:** bot định kỳ check địa chỉ / giờ mở của các quán đã save (dùng Maps API hoặc crawl).

### Nhận xét của Claude (để Tracy cân nhắc)

Với re-frame này, **điểm scope XS + maintenance tăng từ 1/5 lên 4/5**, anti-pattern "seed data lớn" **biến mất**. Đây có thể là **idea mạnh nhất trong 6 ideas hiện tại khi đánh giá lại.**

Điểm cần validate:

- **Tự dùng được?** Tracy đang có pain thật → qua. Hỏi Hà xem anh ấy có cùng pain không.
- **Mass appeal?** Nhiều người có cùng pain này không? Tra thử: các video TikTok "mình lưu quán ăn thế nào" có traction không? Notion template "food diary" có phổ biến không?
- **Monetize?** Subscription cho multi-device sync, export đẹp, shared list với bạn bè — khá rõ.
- **Risk platform?** Google Sheet + Telegram = 2 platform, nhưng đều có API chính thức và không phải nơi publish content → ít risk bị ban.

### Open questions

- Telegram bot lưu qua Google Sheet API — bot chạy free ở đâu? (Vercel cron / GitHub Actions / Cloudflare Worker…)
- Có cần built-in map view không hay chỉ cần list + link Google Maps?
- User onboarding: làm sao để user bắt đầu seed data dễ nhất (share thẳng từ TikTok/Instagram vào bot)?
