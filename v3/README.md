# SUNBOT SALES PRICEBOOK V3

Bản V3 là sales configurator (công cụ cấu hình bán hàng) cho Sunbot Pricebook Master 2026.

## Mục tiêu

- Cho Sales bắt đầu từ cấu hình mẫu Basic / Standard / Plus hoặc tự cấu hình.
- Basic / Standard / Plus là **cấu hình triển khai**, không phải ba phiên bản chất lượng khác nhau của chương trình.
- Tự động cộng cấu phần theo giá khuyến nghị hiện hành.
- Hỗ trợ cây quyết định trường Sunbot kế thừa.
- Hỗ trợ máy tính phí mạng lưới Operator.
- Không hiển thị giá sàn trên frontend công khai.

## Nguồn nghiệp vụ

- `SUNBOT_PRICEBOOK_MASTER_2026_CHINH_THUC`
- `SUNBOT PRICEBOOK MASTER 2026 - CẨM NANG SALES & VẬN HÀNH GIÁ`

Các URL nguồn được khai báo trong `catalog.js` để Sales truy cập tài liệu gốc.

## Kiến trúc hiện tại

- Frontend tĩnh: `index.html`, `styles.css`, `app.js`, `catalog.js`
- Đăng nhập: dùng lại `pagesBridge` / `pinLogin` của backend Google Apps Script hiện hành.
- Giá khuyến nghị hiện đang được snapshot trong `catalog.js` để MVP chạy độc lập.
- Giá sàn, rule phê duyệt nhạy cảm và secret **không được** đưa vào frontend.

## Lộ trình tiếp theo

1. Chuyển catalog giá khuyến nghị sang API đọc trực tiếp Pricebook Master sau đăng nhập.
2. Mở rộng backend từ package-centric sang configuration-driven quotation.
3. Lưu báo giá nhiều dòng, versioning, phê duyệt dưới giá khuyến nghị/giá sàn và lịch sử thay đổi.
4. Đồng bộ CRM / Sunbot Ops nếu cần.

## Quy tắc an toàn

Repo có thể public. Tuyệt đối không commit API secret, mật khẩu, giá sàn hoặc dữ liệu khách hàng.
