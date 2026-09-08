# Sunbot Quotation Intelligence 2026

## Mục tiêu
Giữ nguyên các tài sản đã làm tốt của hệ thống báo giá hiện hành nhưng tách phần quản lý giao dịch khỏi phần biên tập tài liệu khách hàng.

## Nguyên tắc
- Backend là nguồn sự thật về giá, hạng mục, cấu hình, chiết khấu, mã báo giá, phiên bản và trạng thái.
- App nhận yêu cầu Sale, cho Admin cấu hình, lưu snapshot, phát hành và tra cứu lịch sử.
- ChatGPT/Skill biên tập nội dung theo bối cảnh và tạo Google Docs đẹp.
- Google Docs là tài liệu gốc; PDF là bản xuất.
- AI không tự nghĩ giá, VAT, chiết khấu, thời hạn hay quyền thương mại.

## Phải giữ nguyên
- Bảng giá đầy đủ và danh mục Admin.
- Logic cấu hình theo quy mô.
- Trường có thiết bị / mua thiết bị / Sunbot cung cấp thiết bị.
- Trường kế thừa: không phí tái kích hoạt, tận dụng tài sản cũ.
- Bộ nhận diện: mặc định với triển khai mới, tùy chọn trường kế thừa.
- STEAM kit bán riêng, không nằm trong tài sản Sunbot cung cấp ở mô hình không đầu tư ban đầu.
- Đào tạo lớp riêng, lớp ghép, tái đào tạo, sát hạch/chứng nhận.
- Hạng mục rời & sửa chữa, hạng mục tùy chỉnh.
- Chiết khấu theo phân quyền và snapshot lịch sử.
- UI/UX xanh teal + cam, thời gian chờ, tìm kiếm thông minh, kéo thả.

## Các kiểu tài liệu
1. Đào tạo / tái đào tạo.
2. Triển khai / mở rộng.
3. Trường kế thừa.
4. Hạng mục rời.
5. Sửa chữa.
6. Đề xuất giải pháp.

## Luồng dự kiến
1. Sale gửi yêu cầu trên App.
2. Admin xác minh và cấu hình giá.
3. Backend lưu snapshot.
4. Admin gọi Skill bằng quote_id/request_id.
5. Skill đọc snapshot + hồ sơ trường + quy tắc + template.
6. Skill tạo Google Doc.
7. Admin xem/chỉnh và xuất PDF khi cần.
8. Sale chỉ nhận trạng thái và tài liệu cuối qua kênh nội bộ.

## Tiêu chuẩn nghiệm thu
- Giá/số lượng khớp snapshot tuyệt đối.
- Khách đọc độc lập hiểu mình mua gì và nhận gì.
- Tên tài liệu đúng tình huống.
- Không văn mẫu AI.
- Format nhất quán Sunbot.
- Google Doc dễ sửa, in, xuất PDF và tìm lại.
- Không có dữ liệu nội bộ, giá vốn hay giá sàn trên bản khách hàng.
