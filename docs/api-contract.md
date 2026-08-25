# Quotation V3 API contract

Frontend tiếp tục dùng authenticated `pagesBridge`. Router backend hiện hành cần chuyển `mode=quotationV3` đến `quotationV3Handle_(subaction,payload,token)`.

Actions đã triển khai:

- `bootstrap`, `catalog`, `item_detail`, `combo`, `preview`, `create`, `history`, `get`
- `submit_approval`, `approve`
- `admin.catalog_upsert`, `admin.price_version_create`, `admin.combo_upsert`, `admin.rule_upsert`

`preview` và `create` nhận cùng cấu trúc:

```json
{"client":{"name":"Trường A","type":"Trường mới"},"context":{"students":150,"teachers":2},"lines":[{"item_id":"HW-RBT-01","quantity":4,"inputs":{}}]}
```

`create` bỏ qua mọi tổng tiền client gửi và recompute từ active price/rule. Khi lỗi hoặc không có price/rule hiệu lực, backend trả lỗi và không tạo quote.
