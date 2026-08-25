# SUNBOT SALES PRICEBOOK V3

V3 là công cụ báo giá production của Sunbot. Frontend chạy tĩnh; xác thực, danh mục, giá, quy tắc tính và snapshot báo giá đều do backend Sunbot OPS xử lý.

## Luồng sử dụng

- Chỉ nhập mật khẩu nội bộ đang dùng cho Sunbot OPS; không yêu cầu ID, email hoặc PIN riêng.
- Chọn `Giải pháp Sunbot` hoặc `Vật liệu & sửa chữa lẻ`.
- Báo giá chưa lưu luôn mang trạng thái `BẢN NHÁP` và không thể in.
- Khi lưu, backend cấp mã `BG/SUNBOT/YYYY/MMDD-NNN`, lưu snapshot và mở chức năng in/PDF.
- Sửa báo giá đã lưu sẽ quay về bản nháp. Lần lưu tiếp theo giữ nguyên mã và tăng phiên bản.

## Kiến trúc

- `js/api.js`: cầu nối duy nhất tới Apps Script Web App.
- `js/auth.js`: đăng nhập bằng mật khẩu dùng chung và quản lý phiên theo tab.
- `js/catalog.js`: đọc danh mục runtime, không chứa giá hoặc SKU hardcode.
- `js/solution-builder.js`: cấu hình giải pháp.
- `js/retail-builder.js`: vật liệu, linh kiện và sửa chữa lẻ.
- `js/quote-lifecycle.js`: preview, save, dirty/version lifecycle.
- `js/quote-document.js`: bản báo giá A4 và tên file PDF.
- `js/state.js`, `js/storage.js`, `js/utils.js`: state và tiện ích thuần.

Backend tương ứng nằm trong repo `sunbot-ops`, file `apps-script/QuotationV3Refactor.gs`, được định tuyến qua `PagesBridge.gs` với mode `quotationV3`.

## Nguyên tắc production

- Backend Pricebook là nguồn duy nhất cho item, giá, combo và quy tắc.
- Frontend không có fallback catalog, fallback price, giá sàn, secret hoặc mật khẩu.
- Backend tính lại toàn bộ giá khi preview và khi lưu; không tin đơn giá/tổng tiền do trình duyệt gửi lên.
- Hạng mục tùy chỉnh chỉ được phép trong báo giá lẻ và luôn có cảnh báo xác nhận giá.
- Dữ liệu V2, ID sheet hiện hành và URL Web App production không bị thay đổi.

## Kiểm tra nhanh

```bash
for file in v3/js/*.js; do node --check "$file"; done
git diff --check
```
