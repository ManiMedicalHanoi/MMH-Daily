# Lời đọc Tập 1 · Tạo app bằng Claude Code + GitHub + ElevenLabs

Khoảng 2 phút 30 giây. Mỗi đoạn ứng với một cảnh trong video. Dấu `/` là chỗ nên ngắt hơi ngắn, **chữ đậm** là chỗ nên nhấn.

**Cách thu:** mỗi đoạn một file (`01.m4a`, `02.m4a`…), hoặc một file liền và nghỉ khoảng 2 giây giữa các đoạn.
Thu bằng điện thoại trong phòng yên tĩnh, để máy cách miệng khoảng một gang tay. Đọc sai thì đọc lại cả câu đó, không cần thu lại cả đoạn.
Không cần đọc thật khớp với từng chữ ở đây: nói tự nhiên theo cách của bạn là được, hình sẽ được chỉnh theo giọng của bạn.

---

**01 · Mở đầu**
Chào bạn! / Một app podcast, / sáng nào cũng **tự đọc báo** cho bạn nghe. / Không cần lập trình viên, / không cần máy chủ, / gần như **không tốn đồng nào**. / Chỉ khoảng **hai phút** nữa thôi, / bạn sẽ biết mình làm ra nó như thế nào.

**02 · Ba mảnh ghép**
Công thức chỉ có **ba mảnh ghép**. / Thứ nhất là **Claude Code**, / người viết code thay bạn. / Thứ hai là **GitHub**: / vừa là nơi cất code, / vừa là máy chạy tự động, / vừa đăng trang web miễn phí. / Và thứ ba là **ElevenLabs**, / biến chữ thành giọng đọc nghe như người thật.

**03 · Nguyên lý**
Vậy app này **chạy thế nào**? / Đơn giản lắm. / App có **hai phần**. / Phần bạn **nhìn thấy** là trang web, / đặt miễn phí trên GitHub Pages. / Còn phần **chạy ngầm** là GitHub Actions, / hiểu đơn giản là một máy tính của GitHub. / Sáng nào nó cũng tự bật lên, / đọc tin mới trên các trang báo, / nhờ Claude viết tóm tắt, / nhờ ElevenLabs đọc thành giọng, / rồi cập nhật lại trang web. / Hoàn toàn **không cần máy chủ riêng**.

**04 · Bước 1**
Giờ mình bắt tay vào làm nhé. / **Bước một**: / tạo một kho GitHub mới, / đặt tên là DailyCast, / rồi bật GitHub Pages lên.

**05 · Bước 2**
**Bước hai**: / vào ElevenLabs, / chọn một giọng đọc bạn ưng, / rồi tạo một **khoá API**. / Sau đó dán khoá này vào mục **Secrets** của kho GitHub. / Khoá được cất kín ở đó, / không ai nhìn thấy được.

**06 · Bước 3**
**Bước ba**: / mở Claude Code, / kết nối với GitHub, / rồi chọn kho DailyCast.

**07 · Prompt**
Và giờ là **phần hay nhất**. / Bạn chỉ cần gõ yêu cầu bằng **tiếng Việt**, / y như đang nói chuyện bình thường.

**08 · Claude làm việc**
Claude sẽ tự lên kế hoạch, / viết giao diện, / viết phần lấy tin, / viết phần gọi ElevenLabs, / đặt lịch chạy mỗi sáng, / rồi đẩy hết lên GitHub. / Việc của bạn / chỉ là **đọc lại và bấm duyệt**.

**09 · Tự vận hành**
Từ đây, / mọi thứ **tự chạy**. / Đúng **năm giờ bốn lăm** sáng, / GitHub Actions thức dậy, / đọc tin từ hàng chục trang báo, / chấm điểm, / và chọn ra những tin quan trọng. / Claude viết tóm tắt và kịch bản podcast. / ElevenLabs đọc kịch bản thành giọng nói. / Cuối cùng, / GitHub Pages **đăng ngay số mới** lên app.

**10 · Trên điện thoại**
Bạn chỉ cần mở link trên điện thoại, / bấm **Cài app**, / thế là DailyCast nằm ngay trên màn hình chính, / y như một app thật. / Nghe podcast có phụ đề song ngữ, / luyện tiếng Anh từng câu, / hay đọc tin theo chuyên mục, / đều được.

**11 · Tổng hợp ngay**
Muốn chủ động hơn? / Bấm nút **Tổng hợp ngay**, / chọn chủ đề, / chọn báo, / chọn giọng đọc nam hay nữ. / Vài phút sau / là có ngay **một số mới**.

**12 · Kết**
Chi phí máy chủ: / **không đồng**. / Thời gian làm: / chỉ **một buổi chiều**. / Còn bạn, / **ý tưởng tiếp theo** của bạn là gì? / Cứ để **Claude Code** viết nó!

**13 · Tập 2**
Và ở **tập hai**, / mình sẽ kết hợp **Google Sheet với GitHub**, / bộ đôi dùng được cho gần như **mọi ứng dụng trong doanh nghiệp**. / Hẹn gặp lại bạn / ở tập sau nhé!
