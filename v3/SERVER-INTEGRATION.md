# SERVER INTEGRATION – V3

Tài liệu này cô lập phần còn phải sửa trong Google Apps Script để hoàn tất phân quyền Trưởng vùng/Admin. Frontend không chứa mật khẩu hoặc password hash.

## Mục tiêu xác thực

Backend dùng mô hình `ID + PASSWORD` đơn giản, không quay lại email/PIN 6 số.

Các ID hợp lệ:

- `admin` → role `ADMIN`
- `Thu` → role `REGIONAL_MANAGER`, region `Đông Bắc`
- `Dung` → role `REGIONAL_MANAGER`, region `Bắc Trung Bộ`
- `Nhung` → role `REGIONAL_MANAGER`, region `Hà Nội`

Mật khẩu và hash không được ghi trong repo. Nguồn xác thực phía server là tab `AUTH_USERS` của Backend; chỉ Apps Script được đọc hash để kiểm tra mật khẩu.

## Endpoint đăng nhập

Apps Script duy trì một endpoint `quotationAccess` nhận:

```json
{
  "login_id": "Thu",
  "identifier": "Thu",
  "password": "<user input>"
}
```

Server phải:

1. Chuẩn hóa ID theo chính sách đã chốt.
2. Tìm ID trong `AUTH_USERS` và kiểm tra `ENABLED = TRUE`.
3. Hash password bằng SHA-256 và so sánh với `PASSWORD_HASH_SHA256`.
4. Trả token phiên có role, display name và region tương ứng.
5. Không bao giờ trả password hash về frontend.

## Bootstrap

`quotationShared/bootstrap` cần trả tối thiểu:

```json
{
  "role": "REGIONAL_MANAGER | ADMIN",
  "user": {
    "login_id": "Thu",
    "display_name": "Thu",
    "region": "Đông Bắc"
  },
  "session_expires_at": "...",
  "backend_version": "2026.08.28-v2"
}
```

Frontend dùng role do server trả. Với Trưởng vùng, người lập báo giá phải được gắn theo tài khoản đăng nhập; không cho chọn Trưởng vùng khác. Admin có thể xem/chọn toàn bộ Trưởng vùng khi cần xử lý hoặc duyệt.

## Catalog

`quotationShared/catalog` trả danh mục giá khuyến nghị cho Trưởng vùng. Không trả floor/Actual COGS/economics cho `REGIONAL_MANAGER`.

Với `ADMIN` có thể trả thêm dữ liệu nhạy cảm theo role, nhưng chỉ khi endpoint kiểm tra role phía server.

## Lưu báo giá

`quotationShared/saveSnapshot` nhận thêm các trường frontend V3 đã gửi:

- `created_by`
- `creator_role`
- `region`
- `deal_owner`
- `desired_status = NEEDS_APPROVAL`
- `status = NEEDS_APPROVAL`
- từng dòng có `commercial_group` và `max_user_discount_pct`

Server phải coi `created_by`, `region`, `role` từ client là dữ liệu tham khảo. Giá trị có thẩm quyền phải được lấy từ token đăng nhập. Với Trưởng vùng, trạng thái tối đa sau save là `NEEDS_APPROVAL`.

## Duyệt báo giá

Bổ sung subaction:

- `approveQuote`
- `rejectQuote`
- `getQuote`

Chỉ token `ADMIN` được approve/reject.

Khi approve cần lưu audit:

- quote_id / version
- approved_by
- approved_at
- giá chuẩn
- giá đề nghị
- discount
- lý do ngoại lệ nếu có
- trạng thái `APPROVED`

Mọi thay đổi trường thương mại sau approve phải vô hiệu hóa approval và đưa về `NEEDS_APPROVAL`. Sửa trường trình bày không làm mất approval.

## Quyền xuất báo giá

Server phải là lớp enforcement cuối cùng: chỉ `APPROVED` mới được đánh dấu/exportable. Không dựa duy nhất vào việc frontend disable nút.

## Quy tắc thương mại cần kiểm tra server-side

- A/B: mức đề xuất Trưởng vùng tối đa 3%, không dưới floor.
- C: Trưởng vùng discount = 0.
- MIXED_GROWTH Camp/Event: Trưởng vùng discount = 0; Admin tối đa 5% nếu doanh thu hạng mục >= 50.000.000 và không dưới floor.
- Custom Line, dưới floor, miễn phí, điều khoản thanh toán khác chuẩn: Admin special approval.
- Android Box: recommended 1.800.000; floor 1.700.000.

## Nguyên tắc triển khai

Không quay lại email/PIN 6 số. Không để secret trong GitHub. Mô hình hiện tại chỉ cần 4 ID nội bộ + role token và bảng `AUTH_USERS` phía Backend.
