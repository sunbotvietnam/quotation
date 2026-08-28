# SERVER INTEGRATION – V3

Tài liệu này cô lập phần còn phải sửa trong Google Apps Script để hoàn tất phân quyền USER/ADMIN. Frontend không chứa secret.

## Mục tiêu xác thực

Backend cấu hình mục tiêu: `DUAL_SHARED_PASSWORD`.

Apps Script cần duy trì đúng một endpoint đăng nhập `quotationAccess` nhưng kiểm tra hai credential server-side:

- USER password → token có `role: REGIONAL_MANAGER`
- ADMIN password → token có `role: ADMIN`

Hash/secret chỉ tồn tại phía server hoặc nguồn Backend được bảo vệ, tuyệt đối không trả về frontend.

## Bootstrap

`quotationShared/bootstrap` cần trả tối thiểu:

```json
{
  "role": "REGIONAL_MANAGER | ADMIN",
  "session_expires_at": "...",
  "backend_version": "2026.08.28-v2"
}
```

Frontend đã đọc `boot.role` và sẽ mặc định REGIONAL_MANAGER nếu server cũ chưa trả role.

## Catalog

`quotationShared/catalog` trả danh mục giá khuyến nghị cho USER. Không trả floor/Actual COGS/economics cho REGIONAL_MANAGER.

Với ADMIN có thể trả thêm dữ liệu nhạy cảm theo role, nhưng chỉ khi endpoint kiểm tra role phía server.

## Lưu báo giá

`quotationShared/saveSnapshot` nhận thêm các trường frontend V3 đã gửi:

- `created_by`
- `creator_role`
- `region`
- `deal_owner`
- `desired_status = NEEDS_APPROVAL`
- `status = NEEDS_APPROVAL`
- từng dòng có `commercial_group` và `max_user_discount_pct`

Server phải coi status do client gửi là yêu cầu, không phải quyền quyết định. Với Regional Manager, trạng thái tối đa sau save là `NEEDS_APPROVAL`.

## Duyệt báo giá

Bổ sung subaction, ví dụ:

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

- A/B: mức đề xuất USER tối đa 3%, không dưới floor.
- C: USER discount = 0.
- MIXED_GROWTH Camp/Event: USER discount = 0; ADMIN tối đa 5% nếu doanh thu hạng mục >= 50.000.000 và không dưới floor.
- Custom Line, dưới floor, miễn phí, điều khoản thanh toán khác chuẩn: ADMIN special approval.
- Android Box: recommended 1.800.000; floor 1.700.000.

## Nguyên tắc triển khai

Không quay lại email/PIN 6 số. Không tạo account database nếu chưa cần. Hai mật khẩu + role-token là đủ cho giai đoạn hiện tại và giữ hệ thống đơn giản.
