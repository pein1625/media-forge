# 003 - Hướng dẫn tạo dáng chụp ảnh

> Rough idea (chưa phải mô tả cuối cùng)

Người dùng chụp ảnh phong cảnh → upload web → web sẽ trả về pose gợi ý.

---

## Cập nhật 2026-04-24 — Tracy

### Competitor insight quan trọng: AI pose suggestion đã có sẵn trên nhiều điện thoại

**Huawei** (và một số app chụp ảnh khác) đã có tính năng này trong camera — mở camera lên là AI tự động gợi ý pose dáng realtime. Đây là trải nghiệm **zero-friction**:

- Không phải chụp trước
- Không phải chờ AI gen
- Không phải upload lên website

Trong khi flow của idea 003 hiện tại có 3 bước friction đó. Về UX, idea 003 **khó thắng được trải nghiệm native trong camera**.

### Insight ngách (có thể là cửa thoát)

Tuy **công cụ đã có sẵn nhưng rất ít người biết** — ngay cả Tracy (đối tượng chính của tính năng này) cũng mới biết gần đây. Có 2 hướng khai thác:

- **Hướng A — Awareness / Content play:** thay vì build tool mới, làm content / guide / collection để người dùng biết tính năng camera AI đã có. (Nhưng cái này không phải software side project, gần giống content creator → có thể không phù hợp với 2 người muốn làm tech product.)
- **Hướng B — Fill the gap iOS / máy không có:** iPhone chưa có tính năng này native. Tạo iOS app pose realtime có thể là ngách — nhưng build iOS camera app không còn là scope XS.
- **Hướng C — Niche theme:** pose theo chủ đề cụ thể (du lịch biển, cafe tone moody, street style Hàn Quốc…) → user chọn theme → app trả ra **bộ reference ảnh + description pose + shot list**. Đây mới là giá trị khác biệt so với camera AI generic.

### Claim quan trọng

Idea 003 dạng **"upload ảnh → trả về pose gợi ý"** có thể đã bị thay thế bởi camera AI native. **Nếu giữ idea này, phải re-frame về theme-collection hoặc iOS-only** thay vì chỉ là wrapper Gemini Vision.

### Open questions

- iPhone / iOS có tính năng camera pose AI native chưa (tra cứu)?
- Volume search "tạo dáng chụp ảnh" ở VN là bao nhiêu / tháng?
- User có sẵn sàng trả tiền cho bộ sưu tập pose theme không?
