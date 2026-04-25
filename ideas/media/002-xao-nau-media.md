# 002 - Xào nấu media

> Rough idea (chưa phải mô tả cuối cùng)

User upload media lên web của tôi sau đó tôi "xào nấu" ra 1 vài phương án option cho người dùng chọn.

---

## Cập nhật 2026-04-24 — Tracy

### Làm rõ scope: chỉ cut + re-order, KHÔNG gen ảnh

"Xào nấu" ở đây = **cắt video upload thành 2-3 đoạn, mix lại thứ tự, có thể ghép với media khác để ra 1 video hoàn chỉnh (ngắn/dài)**. Không có gen ảnh / gen video bằng AI.

Ví dụ flow: user upload 1 video dài 5 phút → hệ thống cắt thành 3 đoạn highlight → đưa ra 2-3 phương án "order mix" khác nhau → user chọn order ưng → xuất ra video cuối cùng.

### Tracy thấy idea này phức tạp và chưa biết cách bẻ nhỏ → đây là gợi ý từ Claude

Có 4 "trục phức tạp" cần quyết, mỗi trục nếu tham lam thì MVP blow-up:

| Trục | Lựa chọn tham lam | Lựa chọn XS cho MVP |
|---|---|---|
| 1. Loại media input | Ảnh + video + audio | **Chỉ video 1 file** |
| 2. Cách chọn đoạn cắt | AI tự detect highlight | **User tự đánh dấu timestamp** (tap trên timeline) |
| 3. Cách mix | Gen nhiều phương án, có nhạc, có transition | **1 phương án duy nhất: user chọn thứ tự, không transition** |
| 4. Output | Nhiều format, nhiều ratio | **1 format mp4, 1 ratio 9:16** |

**Đề xuất MVP v0 (1-2 tuần):**

> User upload 1 video → kéo 2-3 marker trên timeline để cắt lát → kéo thả sắp xếp thứ tự → export ra 1 clip mp4 9:16. Hết.

Không AI, không LLM. Là một **video trimmer + reorder tool** chạy client-side (FFmpeg.wasm hoặc gọi FFmpeg server-side).

**Nếu MVP v0 có người dùng thật,** mới add:
- v1: AI detect highlight (silence/scene-change detection — rẻ hơn gen)
- v2: Thêm nhạc nền / transition
- v3: Nhiều ratio output, nhiều phương án gợi ý

### Vấn đề tiềm ẩn

- Xử lý video server-side rất tốn compute (FFmpeg + storage). Thử **FFmpeg.wasm chạy trực tiếp trên trình duyệt** trước → infra cost ~ $0.
- Mobile upload video lớn chậm / tốn data — cân nhắc resolution cap.
- Differentiator yếu so với CapCut / InShot — cần thu hẹp ngách (vd: "chuyên cắt video trận cầu lông / video cưới / vlog du lịch" với template sẵn).
