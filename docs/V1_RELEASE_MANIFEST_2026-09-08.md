# SUNBOT QUOTATION — V1 RELEASE MANIFEST

**Khóa ngày:** 08/09/2026

## Mục đích
Manifest này ghi lại mốc ổn định của hệ thống báo giá Sunbot sau khi khóa chuẩn thiết kế V1. Không dùng “North Star” làm tên phiên bản/sản phẩm.

## App chính thức
- URL: https://sunbotvietnam.github.io/quotation/v3/
- Repo: sunbotvietnam/quotation
- Chuẩn thiết kế: `docs/SUNBOT_QUOTATION_V1_LOCK.md`
- Skill dự phòng: `docs/SUNBOT_QUOTATION_V1_SKILL.md`

## Nguồn dữ liệu chính thức
- Spreadsheet: `SUNBOT_SALES_PRICEBOOK_BACKEND_2026`
- Spreadsheet ID: `1Er11CKeojfSKWfb9zYGTXSLDWocfYX7d-Gi5Sya2EDg`
- Quy tắc: Backend là nguồn giá hiện hành; báo giá cũ giữ snapshot và không thay đổi khi bảng giá đổi.

## Tài liệu Drive chuẩn V1
- Google Doc chuẩn thiết kế: `SUNBOT - CHUẨN THIẾT KẾ & SINH TÀI LIỆU BÁO GIÁ V1`
- Folder: `SUNBOT - Chuẩn báo giá V1 & Skill dự phòng`
- File Markdown skill: `SUNBOT_QUOTATION_V1_SKILL.md`

## Những phần V1 khóa
1. Hệ màu teal + cam Sunbot.
2. Cấu trúc A4: header → tiêu đề → kính gửi → nội dung/bảng → tổng → điều khoản/lưu ý → footer.
3. Hai cửa thương mại: Triển khai/mở rộng và Hạng mục rời/sửa chữa.
4. Hạng mục khuyến nghị và Ưu đãi thương mại.
5. Thuyết minh/Đề xuất chỉ áp dụng cho Triển khai/mở rộng.
6. Sale gửi nhu cầu; Admin cấu hình và phát hành.
7. Admin có cấu hình mẫu + hạng mục thường dùng + danh mục giá đầy đủ + dòng tùy chỉnh.
8. In/Lưu PDF dựng từ snapshot và chỉ in vùng A4.
9. Có lớp ghép đào tạo/tái đào tạo theo lịch Sunbot công bố, kèm logic so sánh với lớp riêng.
10. Không sử dụng giá sàn trong quy trình bán hàng mới.

## Quy tắc thay đổi sau V1
- Sửa lỗi không đổi logic: ghi bản vá + ngày.
- Thay đổi nhận diện/cấu trúc/logic thương mại: tạo V2.
- Không chỉnh âm thầm vào tài liệu khóa V1.
