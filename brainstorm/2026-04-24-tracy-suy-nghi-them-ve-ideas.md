# Tracy — Suy nghĩ thêm về 6 ideas sau khi đọc đánh giá

> **Tác giả:** Tracy
> **Ngày:** 2026-04-24
> **Branch:** `tracy`
> **Mục đích:** lưu lại dòng suy nghĩ brief của Tracy sau khi đọc bảng đánh giá (file `2026-04-24-tracy-danh-gia-ideas.md`). Đây là raw thinking — giữ nguyên văn để sau này đọc lại, không phải tài liệu cuối cùng. Phần chắt lọc thành "update chính thức" đã được đẩy vào từng file idea tương ứng trong `ideas/`.

---

## 001 — Tự động đăng bài MXH

Chưa cần làm full flow là đăng bài tự động. Nhưng có thể làm là từ ảnh hoặc video cung cấp và hướng nội dung mong muốn, ví dụ: *"nội dung bài đăng chia sẻ niềm vui của tôi khi được đi chơi"*.

Sau đó kết quả sẽ trả ra 1 vài phương án, user chọn phương án mình thích → lưu nội dung lại vào Google Sheet chẳng hạn kèm thời gian mong muốn đăng.

Có thể là chat qua Telegram bot. Ví dụ cứ mỗi 1 buổi sáng bot sẽ tự động nhắn tin hôm nay có bài post nào mà tôi đang mong muốn đăng, nếu tôi muốn đăng thì sẽ trả lại nội dung vào đoạn chat của Telegram để tôi đăng.

Việc posting thời gian đầu có thể vẫn sẽ là làm thủ công. Hoặc ví dụ có cách nào lách ví dụ như tạo post nhưng để schedule thì có vi phạm policy của các nền tảng MXH không?

Các hướng scope co giãn:

- Scope chỉ support nội dung đầu vào là: ảnh only
- Scope thậm chí không support ảnh hay video, nhưng sẽ có 1 chỗ để cho user tick là họ có đăng kèm img hay video không, nếu họ tick thì bảo họ mô tả ngắn gọn video/img có gì
- Scope thậm chí không support ảnh hay video, mà simple người dùng brief chia sẻ họ muốn đăng gì — ví dụ quan điểm ở 1 số news thường nhật

Thật ra đúng là có thể chat với Gemini hay các kênh chat khác để gen ra nội dung, nhưng tôi đang thấy **nút thắt** là nó chưa có chỗ để lưu lại các nội dung đó để hôm nay chưa kịp đăng thì hôm khác đăng chẳng hạn.

Hoặc 1 số người viết blog, họ có thể có nhanh 1 số idea muốn viết nhưng chưa có full nội dung → họ có thể chat với bot bảo bot lưu lại, sau này khi cần tìm nguồn cảm hứng để viết thì sẽ bảo bot lấy ra các idea và bảo bot tư vấn luôn.

**Nhưng hãy luôn ghi nhớ: điều này có khả thi ít nhất với 1 nhóm nhỏ, hoặc cá nhân trước không, trước khi nghĩ đến mass — không phải tất cả idea đều phù hợp với mass.**

---

## 002 — Xào nấu media

Ở đây ý tôi là tôi gửi ảnh, video, có thể gợi ý cho user là video này cắt thành 2-3 đoạn xong mix lại thứ tự cùng với video/media được cung cấp, ở hướng là cut cho video ngắn/dài → ghép thành 1 video hoàn chỉnh kiểu vậy. **Chưa có gì về việc gen ảnh cả.**

Nhưng đúng là chỗ này tôi cũng cảm nhận là khá phức tạp nhiều thứ, tôi cũng chưa có ý tưởng để bẻ nhỏ nào → cần Claude gợi ý giúp.

---

## 003 — Gợi ý tạo dáng chụp ảnh

Tôi đồng ý điểm mạnh/yếu của Claude.

Bổ sung: việc gợi ý tạo dáng hiện tại đang có **1 số app chụp ảnh và điện thoại Huawei** cũng có tính năng này ở camera, tức là mở camera là AI tự động gợi ý pose dáng → tôi thấy cái này cực mạnh mẽ, vì tôi không phải làm thêm 1 bước là chụp khung cảnh đó lại rồi chờ AI gen, hoặc không phải upload lên 1 cái website nào đó.

Nhưng thực tế là **công cụ đã có sẵn nhưng chưa nhiều người biết**, đến như tôi cũng mới biết gần đây thôi.

---

## 004 — Gợi ý & thống kê địa điểm

Ở mức MVP tôi chưa nghĩ đến việc tự động seed data lớn trước khi launch. Tính năng này thì ở mức MVP tôi mới chỉ nghĩ đến việc **user seed data — những data mà họ prefer trước.**

**Pain point:**

Tôi consume content ở cực kì nhiều kênh: YouTube, Facebook, Thread, TikTok, Instagram. Mỗi lần thấy content về 1 quán ăn hay quán cafe hay thì tôi thường đang cố gắng làm 2 bước:

1. Save lại bài post đó tại chính platform đó
2. Vào Google Maps save địa điểm đó lại, label điểm đó là điểm ăn hay điểm cafe, ăn đồ Việt hay đồ nước ngoài

Mỗi lần muốn tìm chỗ thì sẽ thường vào Google Maps nhưng **đôi khi bị cái là:**

- Địa điểm nó bị outdate
- Hoặc tôi cũng không nhớ tại sao tôi lại lưu địa điểm này, có điểm gì mà tôi thích ở nó nên thường tôi phải lưu cả bài post gốc ở platform đó, nhưng thường cũng khá khó để tìm lại bài post đó khi đang xem ở Google Maps, thường thì tôi sẽ bỏ qua luôn
- Ngoài ra khi lưu địa điểm vào rồi, tôi đến rồi nhưng tôi không thích địa điểm đó tôi phải unsave thủ công ở tất cả mọi nơi, cũng không có chỗ nào để tôi note lý do cá nhân lại
- Hoặc có quán thời gian mở quán nó cũng khác nhau, có quán chỉ mở trưa không mở tối và ngược lại, mỗi lần vào lại phải tìm
- Rồi ở Google Maps rất hạn chế gắn tag, ví dụ tôi muốn gán nhiều thông tin cho nó cũng không được

**Idea MVP sơ khai:**

Tôi xem video/bài post nào đó hay, tôi sẽ paste url vào Telegram bot chẳng hạn, kèm nội dung của bài post đó hoặc suy nghĩ của tôi. Bot sẽ tự động trích thông tin: thời gian, quán ăn hay quán cafe, địa chỉ, thành phố, quận, quán vibe gì, etc.

Sau này muốn tìm địa điểm tôi chỉ cần chat với bot tôi bảo cho tôi 1 số quán cafe ở quận này quận kia. Data tôi đưa cho bot nó sẽ **lưu ở Google Sheet thôi**.

**Idea dài hơi sau này:**

- Tracy có list của Tracy, HàPK có list của Hà → sau này share list cho nhau, Hà có thể bảo bot tổng hợp và cấu trúc lại thông tin của Tracy theo cách của Hà
- Hoặc thậm chí bot có thể dựa trên thông tin đó gợi ý luôn plan đi chơi

---

## 005 — Gợi ý script quay video ngắn

Tôi đồng ý với Claude, ChatGPT hay Gemini cũng đã làm được.

**Để tôi test thử với Gemini thêm xem pain point là gì và có thể có hướng triển khai tiếp theo là gì.**

---

## 006 — Chỉnh màu media

Đồng ý MVP có thể chỉ ở mức ảnh.

Nhưng tự dưng tôi nghĩ tới việc nếu apply 1 tone màu cho ảnh thì **1 số ứng dụng như Lightroom cũng có vẻ là đang giải quyết được rồi.**

Nhưng có lẽ có thể là nó hơi khó và có **learning curve lớn cho người dùng phổ thông** không? Vì như tôi là tôi không biết dùng. Cũng có 1 số bạn bán "công thức" chỉnh màu nhưng mà tôi cũng chưa thử bao giờ.

---

## Self-note cho lần đọc lại sau

- Có 2 idea bị pain point rõ ràng từ chính mình (001 — thiếu chỗ lưu draft; 004 — Google Maps bottleneck): đây là dấu hiệu tốt cho câu hỏi số 1 trong quick-eval *"Pain thật?"*.
- Ý chung của mình với nhiều idea đang xoay quanh **Telegram bot + Google Sheet** như một pattern chung — có thể đây là cái nên validate trước (pattern khả thi không?) hơn là chọn idea cụ thể.
- 002 còn mơ hồ, 006 có competitor (Lightroom) → cần claim được *differentiator* rõ trước khi đi tiếp.
- 003 có competitor rất mạnh (AI pose suggestion có sẵn trong camera điện thoại) → khó beat trải nghiệm zero-friction đó.
- 005 cần test Gemini trước để có insight.
