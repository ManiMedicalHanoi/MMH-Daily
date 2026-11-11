# Lời đọc Tập 3 · CRM bản đồ (FieldMap)

Giọng ElevenLabs "Ninh Đôn", model `eleven_v4`, đọc liền theo 3 cụm. Khoảng 2 phút 8 giây. App ví dụ **FieldMap** (dữ liệu giả, mã trong `demo-app/`).
Bản đồ: ranh giới 14 tỉnh đồng bằng Bắc Bộ từ gói npm `@highcharts/map-collection` (không vẽ đường biên giới quốc gia); vị trí khách hàng là dữ liệu giả.

**01 · Câu chuyện · buổi sáng của Minh**
Bảy giờ sáng. Minh, nhân viên kinh doanh, mở máy tính. Doanh số nằm trong một file Excel. Thông tin khách hàng thì ở sổ tay và tin nhắn Zalo. Còn báo cáo tuần, lại là một file Google Sheet khác, dòng nào cũng dài dằng dặc.

**02 · Câu chuyện · sếp hỏi lịch sử khách**
Rồi sếp hỏi: tháng trước mình gặp phòng khám An Phát mấy lần, họ đang quan tâm sản phẩm gì? Minh lục tìm khắp nơi. Dữ liệu chồng chéo, lịch sử chăm sóc gần như không thể tra lại.

**03 · Bài toán · nhập liệu và tra cứu**
Với người làm bán hàng, nhập liệu và tra cứu là hai việc tốn thời gian nhất. Và đó là lúc ứng dụng CRM của riêng mình ra đời.

**04 · Bản đồ làm việc**
Mọi khách hàng giờ nằm trên một bản đồ làm việc. Mỗi điểm là một khách hàng, màu sắc cho biết trạng thái: đang chăm sóc, cần gặp lại, hay đã chốt đơn. Phóng to một khu vực, thấy ngay ai cần ghé thăm hôm nay.

**05 · Ghi nhận ngay tại chỗ**
Đi địa bàn xong, Minh ghi nhận ngay trên điện thoại: ảnh chụp tại phòng khám, nội dung trao đổi, hẹn lần gặp tới. Những dòng báo cáo khô khan trong từng ô Sheet được thay bằng một bản ghi gọn gàng, có hệ thống.

**06 · Quản lý thấy cả đội**
Người quản lý mở bản đồ là thấy lịch làm việc của cả đội, và lịch sử chăm sóc của từng khách hàng, không cần hỏi lại ai.

**07 · Tính toán tự động**
Mọi ghi nhận được tính toán tự động: tiến độ, KPI, doanh số ước tính, hiện thành biểu đồ ngay trên bản đồ. Nhân viên bớt hẳn thời gian nhập liệu, để dành thời gian cho khách hàng.

**08 · CRM thì có gì mới?**
Bạn sẽ hỏi: CRM thì có gì mới, công ty nào chẳng thuê sẵn một phần mềm? Nhưng khách hàng luôn thay đổi, công ty bạn cũng vậy. Quy trình được cải tiến, dữ liệu thay đổi mỗi năm, và mỗi lần như thế, bạn lại phải chờ bên cung cấp cập nhật.

**09 · Cơ chế · kho backend trên GitHub**
Ở đây thì khác. Toàn bộ dữ liệu Google Sheet chính là phần backend. Chúng được gom về một kho trên GitHub, cùng với mã Apps Script quản lý chúng. Còn Claude Code thì kết nối thẳng vào kho này.

**10 · Thêm một ô mới với Claude**
Muốn thêm một ô ghi nhận mới? Chỉ cần nói với Claude. Claude sửa Apps Script, Apps Script tự cập nhật cấu trúc Sheet. Rồi Claude sửa luôn giao diện và biểu đồ trên GitHub. Vài phút sau, cả đội đã dùng được.

**11 · Kết**
Một CRM lớn lên cùng doanh nghiệp của bạn. Ý tưởng mới đến đâu, ứng dụng thay đổi đến đó. Cảm ơn bạn đã xem, hẹn gặp lại nhé!
