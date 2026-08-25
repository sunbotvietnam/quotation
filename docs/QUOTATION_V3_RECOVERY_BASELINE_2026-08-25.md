# SUNBOT Quotation V3 — Recovery Baseline

**Baseline date:** 25/08/2026  
**Purpose:** Mốc chuẩn để khôi phục hoặc dựng lại hệ thống báo giá Sunbot đúng trạng thái đã được người dùng chấp nhận sau khi rollback Codex refactor.

---

## 1. Trạng thái chuẩn cần được coi là nguồn tham chiếu

### Frontend
- Repository: `sunbotvietnam/quotation`
- Production path: `/v3/`
- Production URL: `https://sunbotvietnam.github.io/quotation/v3/`
- Baseline frontend commit: `f56290444f4dd79894100868ecc329192f4d78a0`
- Commit message: `refine: complete sales-facing quotation cleanup`
- Đây là mốc cuối cùng trước khi Codex refactor V3.

### Backend Apps Script
- Repository: `sunbotvietnam/sunbot-ops`
- Baseline backend source commit: `4ed33c397b2ce9eb566e882d705517ed42d2bfaf`
- Commit message: `feat: route quotation materials catalog`
- Production Apps Script deployment được dựng lại từ đúng source tree của mốc này.

### Backup của bản Codex refactor
Không xóa. Giữ để tra cứu/cherry-pick về sau:
- `sunbotvietnam/quotation` → branch `backup/post-codex-refactor-20260825`
- `sunbotvietnam/sunbot-ops` → branch `backup/post-codex-refactor-20260825`

Không merge hai branch backup này vào production nếu chưa review theo module.

---

## 2. Nguyên tắc kiến trúc của baseline

Hệ thống được chia thành ba lớp rõ ràng:

1. **Official Master Pricebook** = nguồn sự thật nghiệp vụ và quản trị giá.
2. **Sales Pricebook Backend Google Sheet** = dữ liệu máy đọc cho app.
3. **Quotation V3** = giao diện bán hàng và công cụ lập báo giá.

Không hard-code lại các mức giá nghiệp vụ vào frontend nếu backend đã quản lý được.

### Official Master
- File: `SUNBOT_PRICEBOOK_MASTER_2026_CHINH_THUC`
- Spreadsheet ID: `14wk6li0oRK3ho1fAPkPPG1vPYlTFoMccRmn3sHpeAxc`

### Sales Pricebook Backend
- File: `SUNBOT_SALES_PRICEBOOK_BACKEND_2026`
- Spreadsheet ID: `1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg`

Các sheet backend đã có gồm catalog, version giá, combo, rule, approval, materials, quotes, quote lines, audit log và các sheet tương thích V2.

---

## 3. Trải nghiệm người dùng cần được giữ nguyên khi rebuild

### Đăng nhập
- Dùng cơ chế truy cập đơn giản dành cho sales như baseline trước Codex.
- Không tự ý chuyển lại sang mô hình auth phức tạp nếu chưa có quyết định nghiệp vụ.
- Thông báo đăng nhập phải ngắn, dễ hiểu, không lộ thuật ngữ kỹ thuật.

### Màn hình làm báo giá
- Phải phục vụ sales, không phải giao diện kỹ thuật.
- Người dùng chọn nhu cầu/cấu hình, hệ thống tính từ các cấu phần.
- Các gói gợi ý Basic / Standard / Plus chỉ là **template cấu hình**, không phải SKU hay ba sản phẩm độc lập.
- Cho phép tinh chỉnh số lượng cấu phần trước khi xuất báo giá.
- Có mode báo giá vật liệu/phụ tùng/sửa chữa riêng.

### Báo giá in/PDF
- A4 chuyên nghiệp.
- Logo Sunbot chính thức.
- Màu nhận diện Sunbot, đặc biệt orange `#f97316` / `#ea580c` kết hợp teal của app.
- Có tên công ty, tiêu đề báo giá, khách hàng, cấu hình, bảng hạng mục, tổng tiền, điều kiện và chữ ký/footer.
- Khi in/lưu PDF, tên file mặc định phải theo format có cấu trúc, ví dụ: `SUNBOT_BAO_GIA_<KHACH_HANG>_<YYYYMMDD>`.
- Không làm biến dạng print CSS hoặc chuyển báo giá thành giao diện dashboard khi in.

---

## 4. Các dữ liệu/nguyên tắc nghiệp vụ KHÔNG được rollback cùng code

Rollback code không có nghĩa rollback các quyết định giá và sản phẩm đã chốt sau đó.

Ví dụ các quyết định nghiệp vụ phải tiếp tục lấy từ Master/Backend hiện hành:
- Cách gọi bên ngoài: **Quyền sử dụng chương trình...**
- Giá robot chính thức 4,8 triệu/robot.
- Bộ chướng ngại vật rút gọn và đầy đủ theo giá hiện hành trong backend.
- Quyền chương trình, STEAM kit, đào tạo, chứng nhận, companion support, operator fee, legacy reactivation theo Master hiện hành.

Nguyên tắc: **code baseline cũ + dữ liệu nghiệp vụ mới hiện hành**.

---

## 5. Quy trình khôi phục nhanh

### A. Frontend
1. Tạo một branch backup từ `main` hiện tại trước khi rollback.
2. Đưa `main` của `sunbotvietnam/quotation` về tree của commit:
   `f56290444f4dd79894100868ecc329192f4d78a0`
3. Push/update `main`.
4. Chờ workflow `Deploy GitHub Pages` hoàn thành `success`.
5. Mở URL `/quotation/v3/` và hard refresh.

### B. Backend
1. Tạo branch backup từ `main` hiện tại.
2. Đưa `main` của `sunbotvietnam/sunbot-ops` về source tree của commit:
   `4ed33c397b2ce9eb566e882d705517ed42d2bfaf`
3. Bảo đảm có thay đổi trong `apps-script/**` hoặc trigger workflow deploy thủ công.
4. Workflow `Deploy Apps Script production` phải chạy đủ:
   - checkout
   - validate clasp mapping
   - push Apps Script
   - create immutable version
   - update production web app deployment
5. Chỉ coi rollback hoàn tất khi bước update production deployment là `success`.

---

## 6. Kiểm tra chấp nhận sau phục hồi

Phải kiểm tra tối thiểu:

- [ ] `/v3/` mở được.
- [ ] Đăng nhập bằng cơ chế baseline.
- [ ] Catalog/load dữ liệu được.
- [ ] Báo giá giải pháp hoạt động.
- [ ] Báo giá vật liệu/sửa chữa hoạt động.
- [ ] Giá hiển thị lấy đúng backend hiện hành.
- [ ] Có thể thay đổi số lượng/cấu hình.
- [ ] Tổng tiền tính đúng.
- [ ] Save/print flow hoạt động.
- [ ] Print A4 đúng branding.
- [ ] Tên file PDF có cấu trúc chuẩn.
- [ ] Không xuất hiện UI hoặc logic của Codex refactor chưa được duyệt.

---

## 7. Quy tắc thay đổi hệ thống từ baseline này

1. Không refactor toàn bộ production trong một lần.
2. Mỗi thay đổi đáng kể phải làm trên branch riêng.
3. Có preview/test trước khi merge.
4. Tách rõ thay đổi **UI/UX**, **business logic**, **backend API**, **pricing data**.
5. Không thay cả bốn lớp cùng một lúc nếu không thật sự cần.
6. Nếu thay thuật toán cấu hình/giá, phải giữ snapshot để đối chiếu trước-sau.
7. Khi một trạng thái mới được người dùng chấp nhận, tạo Recovery Baseline mới thay vì ghi đè mốc cũ.

---

## 8. Hướng phát triển tiếp theo từ baseline

Không phá baseline. Phát triển tiếp theo theo các module độc lập:

### Module A — Complex Configuration Engine
Dành cho báo giá trường có nhiều site, nhiều phân môn, nhiều loại phần cứng, nhiều năm quyền sử dụng, nhiều nhóm đào tạo và các ngoại lệ thương mại.

### Module B — Operator Quotation Engine
Dành cho D1/D2/D3/D5 và mô hình operator theo vùng/cụm. Phải tách rõ:
- quyền chương trình
- network/operator fee
- minimum guarantee
- thiết bị
- giáo viên
- support/QA
- territory
- KPI
- cap doanh thu
- các khoản pass-through.

### Module C — Quote Snapshot & Approval
Mỗi báo giá phát hành cần lưu snapshot bất biến: khách hàng, version giá, cấu phần, đơn giá, discount, người tạo, người duyệt, trạng thái và thời hạn hiệu lực.

---

## 9. Nguyên tắc tối quan trọng

> Quotation là lớp cấu hình và trình bày thương mại. Pricebook mới là nguồn quản trị giá. Không biến template báo giá thành sản phẩm cứng, không nhúng mọi logic kinh doanh vào UI, và không để một lần refactor thay đổi đồng thời trải nghiệm sales, logic giá và kiến trúc backend.

---

**Status:** ACCEPTED RECOVERY BASELINE — 25/08/2026
