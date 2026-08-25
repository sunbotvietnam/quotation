# Quotation V3 backend schema

Nguồn dữ liệu là Google Sheet được khai báo qua Script Property `QUOTATION_V3_SPREADSHEET_ID`. Frontend không biết tên sheet.

Các bảng logic: `CATALOG_ITEMS`, `PRICE_VERSIONS`, `COMBO_DEFINITIONS`, `COMBO_COMPONENTS`, `PRICING_RULES`, `QUOTES`, `QUOTE_LINES`, `USERS`, `PERMISSIONS`, `AUDIT_LOG`.

- `item_id` là khóa bất biến. Không dùng tên sản phẩm làm điều kiện nghiệp vụ.
- Giá không được ghi đè. Mỗi lần đổi giá tạo một `PRICE_VERSIONS` mới với `valid_from`.
- Combo chỉ giữ component ID và quantity, không giữ tổng tiền.
- `QUOTES` và `QUOTE_LINES` lưu snapshot theo `quote_id + quote_version`.
- `floor_price` chỉ được thêm vào catalog response khi permission `can_view_floor=true`; response preview/create luôn xóa trường nội bộ `_floor`.

Header chính xác nằm trong `apps-script-v3/Schema.gs`; file này là adapter giữa tên cột Sheet và API contract.
