# Migration & cutover runbook

## Backup / rollback

1. Tạo tag backup repo hiện hành và export Apps Script + Pricebook Sheet trước thay đổi.
2. Tạo một Google Sheet V3 riêng; chưa dùng trực tiếp Pricebook nguồn làm bảng giao dịch.
3. Đặt Script Property `QUOTATION_V3_SPREADSHEET_ID` bằng ID Sheet V3.
4. Copy các file trong `apps-script-v3/` vào project Apps Script hiện hành.
5. Nối một nhánh router `quotationV3` như comment trong `Api.gs`; giữ nguyên các nhánh V2.
6. Chạy `qv3MigrateOfficial2026()` một lần. Hàm idempotent theo business key nên có thể chạy lại để sửa dữ liệu seed.
7. Cấp user V3 trong `USERS`; không copy PIN/hash sang sheet mới.
8. Deploy một version Apps Script mới, chạy `/v3/` song song V2 và đối chiếu T01–T15.

Rollback: chuyển frontend V3 về commit/tag trước, hoặc bỏ nhánh `quotationV3`; V2 và `/` không bị thay đổi. Không xóa quote V3 đã tạo. Khi rollback giá, đóng `valid_to` của version lỗi và tạo version mới; không sửa lịch sử.

## Chưa cutover trong commit này

Trang `/`, V2 và admin hiện hành được giữ nguyên. Chỉ chuyển `/` sang V3 sau 1–2 tuần parallel run và nghiệm thu dữ liệu production.
