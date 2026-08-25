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

Nguồn được migrate vào backend bằng `apps-script-v3/Migration.gs`; frontend không giữ snapshot dữ liệu kinh doanh.

## Kiến trúc hiện tại

- Frontend tĩnh: `index.html`, `styles.css`, `api.js`, `app.js`
- Đăng nhập: dùng lại `pagesBridge` / `pinLogin` của backend Google Apps Script hiện hành.
- Catalog, combo, schema và giá theo role được tải sau đăng nhập qua `mode=quotationV3`.
- Preview và create được backend recompute; quote lưu snapshot bất biến.
- Giá sàn, rule phê duyệt nhạy cảm và secret **không được** đưa vào frontend Sales.

## Trạng thái triển khai

Backend V3, migration, schema, pricing engine, quote snapshot, role filtering và audit nằm trong `apps-script-v3/`. Xem `docs/migration.md` để gắn vào Apps Script hiện hành và chạy parallel V2/V3 trước cutover.

## Quy tắc an toàn

Repo có thể public. Tuyệt đối không commit API secret, mật khẩu, giá sàn hoặc dữ liệu khách hàng.
