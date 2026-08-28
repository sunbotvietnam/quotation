# SUNBOT - CÔNG CỤ BÁO GIÁ V3

V3 là công cụ cấu hình và lập báo giá nội bộ cho Sunbot. Mục tiêu là để Trưởng vùng tạo báo giá nhanh, trong khi giá, quyền duyệt và logic thương mại nằm ở Backend.

## Quy trình hiện hành

1. Cán bộ vận hành phát hiện nhu cầu/cơ hội và chuyển lead cho Trưởng vùng.
2. Chỉ Trưởng vùng lập báo giá: Nhung – Hà Nội; Thu – Đông Bắc; Dung – Bắc Trung Bộ.
3. Trưởng vùng lưu báo giá ở trạng thái `NEEDS_APPROVAL` – Chờ Admin duyệt.
4. Chỉ báo giá đã được Admin duyệt mới được xuất/gửi khách hàng.

## Kiến trúc

- `index.html`: entry point tối giản.
- `catalog.js`: chỉ giữ cấu trúc combo; không chứa giá. Item và giá bắt buộc tải từ Backend sau đăng nhập.
- `app.js`: runtime V3 gồm ID + mật khẩu, tải catalog, cấu hình, lưu báo giá và màn hình Admin duyệt.
- `styles.css`, `retail.css`: giao diện và bố cục báo giá.

Không còn chuỗi patch email/PIN 6 số. Các file patch cũ đã được loại khỏi runtime.

## Nguồn nghiệp vụ

- Pricebook Master: `14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc`
- Backend: `1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg`
- Commercial Policy 01–05: `1ff_Lz7A2lgfMNMwMLd3EZuMOAmsQBvmxxVXhlfhkPcE`

## Quy tắc chính

- A/B: Trưởng vùng có vùng đề xuất giảm giá tối đa 3%, nhưng mọi báo giá vẫn phải Admin duyệt trước khi gửi khách.
- C – hàng vật lý: Trưởng vùng không tự giảm.
- Camp/Event: nhóm hỗn hợp bảo vệ giá; Trưởng vùng không tự giảm; Admin chỉ cân nhắc tối đa 5% khi doanh thu hạng mục từ 50 triệu đồng và không dưới giá sàn.
- Android Box: giá khuyến nghị 1,8 triệu; giá sàn được giữ trong Backend, không đưa vào frontend public.
- Không đưa lương, commission, residual hay dữ liệu nhạy cảm lên giao diện Trưởng vùng.

## Xác thực Trưởng vùng/Admin

Backend đọc `AUTH_USERS`, kiểm tra SHA-256 server-side và trả session chứa `login_id`, `display_name`, `role`, `region`, `expires_at`. Trưởng vùng không thể mạo danh người lập khác; chỉ Admin được duyệt/từ chối; chỉ snapshot `APPROVED` được backend cho xuất.

## An toàn

Repo có thể public. Không commit mật khẩu, hash mật khẩu, giá sàn, Actual COGS, dữ liệu khách hàng hoặc secret API.
