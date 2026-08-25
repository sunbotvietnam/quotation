# Quotation V3 production refactor plan

## Audit kết luận

Production V3 hiện nạp `catalog.js`, `app.js`, `pre-shared.js`, `patch.js`, `shared-tool.js`, `login-polish.js`, `retail-tool.js` và `final-cleanup.js`. Các file sau override global function của file trước; `final-cleanup.js` tiếp tục dùng `MutationObserver` để sửa wording, trạng thái Draft và quyền in sau render.

Rủi ro chính:

- `catalog.js` vẫn chứa SKU, combo và giá fallback trong public frontend.
- Solution quote được tính ở client; `saveSnapshot` hiện tin `subtotal`, `unit_price` và `line_total` client gửi lên.
- Mã tạm được tạo ở client trước Save rồi bị thay bằng mã backend thông qua DOM cleanup.
- Dirty state của Solution và Retail được suy luận từ DOM event thay vì quote state.
- Shared login, backend hydration, CRM context, document renderer và retail mode nằm trong các lớp patch khác nhau.

## Contract giữ nguyên

- Pages bridge và URL Apps Script production.
- Shared password hash trong `00_CONFIG`; session trong Script Cache.
- Sheet names hiện hành: `CATALOG_ITEMS`, `PRICE_VERSIONS`, `COMBO_DEFINITIONS`, `COMBO_COMPONENTS`, `PRICING_RULES`, `MATERIALS`, `QUOTES`, `QUOTE_LINES`, `AUDIT_LOG` cùng các sheet V2.
- Quote code hiển thị `BG/SUNBOT/YYYY/MMDD-NNN`; ID lưu trữ giữ dạng an toàn cho Sheet.
- Query params `customer_id`, `opportunity_id`, `customer_name`.
- Hai mode Solution và Retail; layout A4, logo và nhận diện hiện tại.
- Không sửa/xóa dữ liệu hoặc mã sản phẩm hiện có.

## Kiến trúc đích

```text
v3/
  index.html
  styles/app.css
  styles/quotation.css
  js/config.js
  js/utils.js
  js/api.js
  js/storage.js
  js/state.js
  js/auth.js
  js/catalog.js
  js/quote-lifecycle.js
  js/quote-document.js
  js/solution-builder.js
  js/retail-builder.js
  js/app.js
```

Backend `sunbot-ops` mở rộng `QuotationSharedApi.gs` nhưng giữ route hiện hành:

- `bootstrap`: session + feature flags + Pricebook version.
- `catalog`: catalog, combo, components và rule metadata đã lọc; không trả floor/internal cost.
- `materials`: danh mục MATERIALS đã lọc.
- `preview`: server resolve component/rule/active price và recompute.
- `saveSnapshot`: server recompute lần nữa, cấp mã/version và lưu snapshot.
- `historySnapshot`/`getSnapshot`: đọc snapshot bất biến.

## Cutover an toàn

1. Refactor trên branch riêng của cả hai repo.
2. Backend deploy trước theo contract tương thích; frontend production cũ vẫn dùng được.
3. Deploy frontend preview branch và chạy 28 acceptance cases.
4. So sánh quote lines/tổng/mã/PDF giữa production và preview.
5. Chỉ merge frontend sau khi backend production đã xác nhận route mới.
6. V2, root quotation cũ và dữ liệu lịch sử không bị thay đổi.
