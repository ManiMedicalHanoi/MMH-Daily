# Lời đọc Tập 4 · Bản chất (tập cuối)

Giọng ElevenLabs "Ninh Đôn", model `eleven_v4`, đọc liền theo 4 cụm. Khoảng 2 phút 34 giây. Phong cách hình: tạp chí / biên tập
(nền giấy, chữ có chân Cormorant Garamond, đầu trang "Tự dựng app · Số 04").

Ba app ví dụ là bản demo dữ liệu mẫu trong `demo-app/index.html` (PriceScope, TripLens, TenderWatch), chụp bằng `tools/shots.js` (Playwright).
Bản đồ TripLens vẽ từ dữ liệu đường phố và toà nhà khu Lower Manhattan (New York) của bộ dữ liệu mẫu công khai `visgl/deck.gl-data`,
tuyến đi bộ tính trên đồ thị đường thật (`tools/map.py`, cần `networkx`, `scipy`). Ảnh bản đồ và ảnh chụp app không lưu trong kho, chạy lại script để tạo.

**Lời mở · ba số đã ra**
Ba tập vừa rồi, chúng ta đã dựng một app podcast, một nền tảng đào tạo, và một CRM. Tập cuối này, mình muốn nói về điều quan trọng hơn cả: bản chất.

**Bản chất · lấy, xử lý, trình bày**
Thật ra, app nào cũng chỉ làm ba việc: lấy dữ liệu, xử lý nó, rồi trình bày cho dễ hiểu. Tổng hợp, phân tích hay trực quan hóa, suy cho cùng đều là chuyển dữ liệu từ dạng này sang dạng khác. Hiểu được điều đó, bạn sẽ thấy rất nhiều phần mềm tưởng phải đi mua, giờ hoàn toàn tự dựng được.

**Giải phẫu một ứng dụng**
Hãy hình dung thế này. Google Drive và Google Sheet là kho dữ liệu. Apps Script, cũng của Google, là phần backend xử lý, can thiệp thẳng vào Sheet và Drive. GitHub là mặt tiền, nơi dữ liệu hiện lên thành giao diện. Còn Claude Code chính là bộ não, kết nối tất cả, và nối thêm cả Google Maps hay các ứng dụng bên ngoài.

**Ví dụ 01 · Tra giá thị trường**
Ví dụ đầu tiên: tra giá thị trường. Trước đây, muốn biết thị trường đang bán bao nhiêu, bạn phải Google từng sản phẩm rồi chép tay vào bảng. Giờ, mỗi sáng, hệ thống tự thu thập giá các sản phẩm liên quan từ những nguồn bạn đã cấp quyền, ghi vào Sheet, so sánh và vẽ biểu đồ. Nguồn nào đáng tin, Claude cũng giúp bạn tìm. Giá thấp nhất ở đâu, ai vừa giảm giá, nhìn là thấy.

**Ví dụ 02 · Du lịch: ba ứng dụng rời rạc**
Ví dụ thứ hai, khi đi du lịch nước ngoài. Một tab mở Google Maps tìm đường, một tab Chrome xem chỗ ăn chỗ chơi, rồi lại chụp ảnh để dịch. Cứ thế chuyển qua chuyển lại.

**Ví dụ 02 · Một ứng dụng làm hết**
Sẽ ra sao nếu chỉ một ứng dụng làm hết? Vị trí của bạn cập nhật trực tiếp trên bản đồ, chỉ đường từng bước, dịch biển hiệu hay thực đơn ngay lập tức, và giới thiệu luôn những địa điểm bạn đi qua trên đường.

**Ví dụ 03 · Theo dõi đấu thầu**
Ví dụ thứ ba, đấu thầu. Thay vì mua số liệu từ bên cung cấp, bạn hoàn toàn có thể tải dữ liệu công khai từ hệ thống mua sắm công, dựng công cụ làm sạch, cập nhật tự động, và trực quan toàn bộ thông tin. Thử tưởng tượng bạn tiết kiệm được bao nhiêu thời gian.

**Ví dụ 03 · 17:00 hệ thống tự làm**
Còn nếu đã mua, mỗi ngày bạn nhận email thông tin thầu. Thay vì tự tải thủ công, cứ năm giờ chiều, hệ thống quét hộp thư, tự tải file, đưa vào file tổng hợp, rồi cập nhật và báo ngay trên ứng dụng theo dõi đấu thầu, do chính bạn dựng ra.

**Kết luận**
Bạn thấy đấy, ứng dụng không có gì bí ẩn. Bản chất chỉ là một yêu cầu: xử lý dữ liệu, và chuyển dạng dữ liệu. Hãy tưởng tượng, khi bạn cho Claude quyền truy cập Drive, và dựng một kho backend trên GitHub, thì sáng tạo của bạn gần như không có giới hạn.

**Lời cảm ơn**
Cảm ơn bạn đã đồng hành cùng chuỗi video này. Giờ đến lượt bạn: ứng dụng đầu tiên bạn muốn dựng là gì?
