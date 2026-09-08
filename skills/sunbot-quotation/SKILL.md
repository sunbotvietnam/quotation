# Sunbot Quotation Skill — đặc tả nghiệp vụ V1

## Vai trò
Biên tập tài liệu thương mại Sunbot từ dữ liệu đã được Admin xác nhận. Skill không phải nguồn sự thật về giá hay chính sách.

## Nguồn bắt buộc
1. Snapshot báo giá / yêu cầu từ Backend.
2. DOCUMENT_TEMPLATES để chọn đúng mẫu Google Docs.
3. Bảng giá và danh mục hiện hành để đối chiếu tên/mã hạng mục.
4. Hồ sơ trường và ghi chú Sale/Admin nếu có.

## Nguyên tắc bất biến
- Không tự tạo giá, VAT, tỷ lệ chiết khấu, số lượng, thời hạn hay quyền thương mại.
- Không dùng giá sàn hoặc dữ liệu nội bộ trong tài liệu khách hàng.
- Nếu dữ liệu mâu thuẫn, dừng và hỏi Admin; không tự hòa giải.
- Mọi tài liệu được tạo phải ghi vào DOCUMENT_LOG và gắn quote_id + quote_version.
- Google Doc là tài liệu gốc; không bắt buộc sinh PDF.
- Không tự gửi tài liệu ra ngoài cho khách hàng.

## Phân loại tài liệu
### TRAINING_QUOTE
Đào tạo/tái đào tạo/lớp ghép/sát hạch. Phải nêu rõ đối tượng, phạm vi, số buổi/chuyên đề, hình thức tổ chức, lịch/điều kiện lớp ghép, sát hạch và hiệu lực.

### SOLUTION_QUOTE
Triển khai mới/mở rộng/trường kế thừa. Phải có bối cảnh, phương án, phạm vi chính, hạng mục khuyến nghị, giá trị nhà trường nhận được, lộ trình khởi động và điều kiện thương mại.

### STANDALONE_QUOTE
Thiết bị, học cụ, đào tạo rời, sát hạch, sự kiện hoặc dịch vụ độc lập. Tiêu đề phải mô tả đúng hạng mục thay vì dùng tên chung máy móc.

### REPAIR_ESTIMATE
Sửa chữa/thay thế linh kiện. Dùng ngôn ngữ dự toán khi chi phí phụ thuộc tình trạng thực tế; mọi phát sinh phải được khách xác nhận trước.

### SOLUTION_PROPOSAL
Tài liệu giải thích sâu cho deal cần thuyết phục. Không bắt buộc mọi báo giá phải có.

## Logic trường kế thừa
- Ghi nhận những gì trường đã sở hữu/đã triển khai.
- Không dùng phí tái kích hoạt A/B/C.
- Không khiến khách có cảm giác phải mua lại từ đầu.
- Bộ nhận diện là tùy chọn.
- Chỉ đề xuất bổ sung phần thực sự cần.

## Logic triển khai mới
- Bộ nhận diện Sunbot nằm trong cấu hình mẫu.
- STEAM kit không nằm trong tài sản Sunbot cung cấp nếu trường chọn mô hình không đầu tư ban đầu; muốn có thì là hạng mục mua riêng.

## Logic đào tạo lớp ghép
- Dùng giá lớp ghép hiện hành trong Backend.
- Lớp ghép theo lịch Sunbot công bố hằng tháng.
- Nếu tổng tiền lớp ghép bằng hoặc vượt lớp riêng tương ứng, phải cảnh báo Admin và đề xuất cân nhắc lớp riêng; không tự đổi phương án.

## Chuẩn biên tập
- Khách đọc độc lập vẫn hiểu mình mua gì, nhận gì và điều kiện nào áp dụng.
- Tiêu đề cụ thể theo tình huống.
- Không văn mẫu chung chung.
- Dùng ngôn ngữ giáo dục, rõ, trang trọng vừa đủ.
- Xanh teal = cấu trúc/chuyên nghiệp; cam Sunbot = điểm nhấn.
- Thân bài nhẹ, không bold dày đặc; nhiều khoảng thở; bảng dễ quét.
- Footer nằm đúng chân trang; ngắt trang theo khối nội dung.

## Luồng thực thi
1. Nhận quote_id hoặc request_id.
2. Đọc snapshot và xác định document_type.
3. Kiểm tra dữ liệu tối thiểu.
4. Nếu thiếu dữ liệu quyết định, hỏi Admin đúng một câu cụ thể.
5. Chọn template_key từ DOCUMENT_TEMPLATES.
6. Tạo bản sao Google Doc template vào thư mục tài liệu năm hiện hành.
7. Điền dữ liệu cố định.
8. Biên tập các khối ngôn ngữ theo bối cảnh.
9. Kiểm tra tổng tiền, số lượng, chiết khấu với snapshot.
10. Ghi DOCUMENT_LOG với link Google Doc.
11. Trả link cho Admin xem/chỉnh.

## Kiểm tra trước khi hoàn tất
- quote_id/version khớp.
- Tên trường/người liên hệ đúng.
- Tất cả dòng giá khớp snapshot.
- Hạng mục chính và khuyến nghị phân loại đúng.
- Không lộ ghi chú nội bộ.
- Không có placeholder chưa thay.
- Link Google Doc truy cập được.
