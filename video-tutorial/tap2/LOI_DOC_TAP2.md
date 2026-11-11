# Lời đọc Tập 2 · Nền tảng đào tạo online (Google Drive + Google Sheet + Apps Script + GitHub)

Giọng ElevenLabs "Ninh Đôn", model `eleven_v4`, đọc liền theo 4 cụm cảnh. Khoảng 2 phút 23 giây. App ví dụ: **LearnDesk** (dữ liệu giả, mã trong `demo-app/`).

**01 · Mở đầu**
Chào bạn! Như đã hẹn, tập này mình làm một nền tảng học online. Có bài giảng video, có bài kiểm tra, học xong là nhận chứng chỉ, người học hoàn toàn chủ động. Doanh nghiệp đào tạo nội bộ dùng được, thầy cô dạy học viên cũng dùng được.

**02 · Bốn mảnh ghép**
Công thức lần này có bốn mảnh. GitHub đăng giao diện web. Google Drive cất video và tài liệu bài giảng. Google Sheet giữ tài khoản, điểm số và chứng chỉ. Còn Apps Script là cầu nối, giúp trang web đọc và ghi dữ liệu trên Drive và Sheet.

**03 · Nguyên lý**
Nguyên lý thế này. Người học mở trang web, đăng nhập bằng tài khoản được cấp. Trang web gọi tới Apps Script. Apps Script kiểm tra tài khoản trong Sheet, lấy danh sách bài học và video trên Drive, rồi gửi về. Làm bài xong, điểm số được ghi ngược vào Sheet. Tất cả đều miễn phí, không cần máy chủ riêng.

**04 · Bước 1 · Kho dữ liệu**
Bắt tay vào làm nhé. Bước một: chuẩn bị kho dữ liệu. Một thư mục Drive chứa video và tài liệu PDF. Một file Sheet gồm các trang: khoá học, câu hỏi, người học và kết quả.

**05 · Bước 2 · Claude Code viết code**
Bước hai: nhờ Claude Code viết cả hai phần. Giao diện học, làm bài và chứng chỉ, đẩy lên GitHub. Cùng với mã Apps Script, triển khai thành một đường link để trang web gọi tới.

**06 · Người học**
Giờ xem người học dùng thế nào. Đăng nhập xong, trang chủ hiện ngay bài đang học dở, và các khoá theo từng nhóm: kiến thức sản phẩm, quy trình, kỹ năng bán hàng.

**07 · Bài học**
Bấm vào một bài, video phát ngay từ Drive, kèm tài liệu và danh sách chương. Học tới đâu, tiến độ lưu tới đó.

**08 · Bài kiểm tra**
Học xong thì làm bài kiểm tra. Câu hỏi đảo thứ tự, có giới hạn thời gian, chấm điểm tự động.

**09 · Chứng chỉ + bảng quản lý**
Đạt yêu cầu là có ngay chứng chỉ, kèm mã xác thực, tải về được. Còn người quản lý thì xem được ai đã học, ai chưa, điểm bao nhiêu, trên một bảng tổng hợp.

**10 · Video bài giảng (Remotion)**
Vậy video bài giảng lấy ở đâu ra? Claude Code làm luôn. Bạn đưa tài liệu, Claude viết kịch bản, rồi dựng video bằng Remotion: chữ chuyển động, biểu đồ, hình minh hoạ, lồng tiếng bằng ElevenLabs. Xuất ra file MP4, thả vào Drive, thế là khoá học có ngay bài mới.

**11 · Ứng dụng**
Một nền tảng, rất nhiều cách dùng: hội nhập nhân viên mới, kiến thức sản phẩm, quy trình làm việc, kỹ năng bán hàng. Hay đơn giản là một lớp học online của riêng bạn.

**12 · Tập 3**
Ở tập ba, mình sẽ làm một ứng dụng CRM, để tra cứu và quản lý dữ liệu khách hàng ngay trên điện thoại. Hẹn gặp lại bạn nhé!
