# MMH Daily Podcast — quy tắc trình bày (AI đọc trước khi viết kịch bản)

Người nghe chính: nhân sự MMH (quản lý sản phẩm, sales) trình độ tiếng Anh **B1**, nghe để vừa nắm tin vừa học tiếng Anh.
Mục tiêu: **mỗi ngày một kiểu, nghe cuốn, dễ hiểu, tự nhiên**, không lặp khuôn.

## 1. (cũ, trước 24/11/2026) Chọn kiểu chương trình theo nội dung — nay thay bằng 5 series cố định ở mục 7; bảng dưới vẫn dùng làm gợi ý cách trình bày
| Nội dung nổi bật trong ngày | Kiểu hợp | Cách trình bày |
|---|---|---|
| Văn bản pháp quy mới (luật, nghị định, thông tư, đấu thầu, BHYT) | **The Explainer** · **Ask the Editor** | Giải thích từng bước: cái gì đổi · ai bị ảnh hưởng · từ khi nào · MMH cần làm gì. Hỏi – đáp như người nghe đang thắc mắc. |
| Nhiều tin nhãn khoa / nha khoa, xu hướng điều trị | **Clinic Notes** | Như hai người trong ngành trò chuyện: bệnh gì, kỹ thuật gì, bác sĩ đang chuyển sang làm gì, liên hệ sản phẩm MMH (dao, chỉ khâu, trâm, mũi khoan, vật liệu). |
| Một câu chuyện lớn vượt trội | **One Story** · **The Explainer** | Kể như kể chuyện: bối cảnh → diễn biến → vì sao quan trọng → điều đáng theo dõi. Các tin khác chỉ 1–2 câu cuối. |
| Nhiều tin ngắn, đều nhau | **Quick Five** · **The Morning Briefing** · **Morning Notes** | 5 tin, mỗi tin: 2–3 câu + 1 câu hỏi nhanh cho người nghe ("Quick question: who pays for this?") rồi trả lời. |
| Đấu thầu, bệnh viện, đầu tư công nhiều | **Health Desk** | Người dẫn + phóng viên y tế: số liệu, gói thầu, bệnh viện nào, hệ quả cho nhà phân phối. |
| Tin nóng, được đọc nhiều, gây tranh luận | **Two Takes** | Hai người hai góc nhìn, phản biện nhẹ, kết bằng điểm chung. |
| Kinh tế, tỷ giá, nhập khẩu nhiều | **Market Watch** | Ngắn gọn con số → ý nghĩa với giá vốn hàng nhập từ Nhật. |

Giọng đọc xoay vòng: một giọng nam · một giọng nữ · hai người (nam + nữ, đổi giọng Mỹ / Anh / Úc). Không để hai ngày liền cùng một kiểu giọng.

## 2. Ngôn ngữ cho người học B1 (bắt buộc)
- Câu **ngắn, trung bình 10–14 từ, tối đa ~18 từ**. Một ý một câu. Từ thông dụng; thuật ngữ ngành được dùng nhưng **giải thích ngay bằng lời đơn giản**
  ("a tender — that's the bidding process hospitals use to buy equipment").
- Không thành ngữ khó, không tiếng lóng; nếu dùng một cụm hay thì nói lại nghĩa.
- Nhắc lại ý chính của mỗi tin một lần bằng cách nói khác (paraphrase) — giúp người nghe bắt kịp.
- Số đọc rõ và làm tròn khi được ("about one point two trillion dong").
- Nhịp: không dồn ba bốn số liệu vào một câu; chuyển tin có câu nối rõ ràng.

## 3. Phần học tiếng Anh trong mỗi số (đổi theo ngày, chỉ một phần, 60–90 giây, đặt gần cuối)
- **Word Spotlight**: một từ / cụm trong tin hôm nay — nghĩa, 2 câu ví dụ trong công việc MMH.
- **Phrase for Work**: một mẫu câu dùng ngay trong họp / email / thuyết trình ("We're on track to…", "Could you walk me through…").
- **Listen & Repeat**: 3 câu ngắn rút từ tin hôm nay, đánh dấu `rep: true` — đọc chậm, có khoảng lặng để người nghe nói theo. Trước đó nói "Say it with me."
- **Quick Quiz**: hỏi người nghe 2 câu về tin vừa nghe, chờ một nhịp, rồi trả lời.

## 4. Không lặp
- Câu mở đầu, câu chào kết, cách chuyển tin **khác các số gần đây** (danh sách được gửi kèm mỗi lần viết). Có thể mở bằng một câu hỏi, một con số, một cảnh, hay thẳng vào tin hay nhất.
- Không dùng lại các cụm "cửa miệng" đã lặp ở các số trước (danh sách gửi kèm).
- Từ vựng (vocab) **không trùng** từ đã dạy trong 14 ngày gần nhất.
- **Không đọc lại nội dung đã lên sóng** (24/11/2026, người dùng yêu cầu): sổ `data/aired.json` (30 ngày, `tools/aired.mjs`) ghi các tin / video mỗi số podcast đã nói (`podcast.covered`).
  Mọi series (kể cả AI Pulse) chỉ được dùng tin CHƯA có trong sổ — so theo mã tin và theo tiêu đề gần giống (cùng sự kiện, báo khác đăng lại). Riêng Week in Review (CN) là số nhìn lại tuần nên được nhắc lại.
  Claude viết qua Routine: trong `brief.mjs` tin có `"aired": true` KHÔNG đưa vào kịch bản; ghi `podcast.covered` = id các tin đã nói.

## 5. Nghe cuốn
- Mỗi tin có một "điểm móc": chi tiết bất ngờ, con số lạ, câu hỏi người nghe đang nghĩ.
- Người dẫn có cá tính nhẹ, phản ứng thật ("Wait, that's a big jump.", "Okay, that one surprised me.").
- Có "what this means for us" cụ thể cho MMH ở những tin liên quan.
- Kết: 1 câu điều đáng nhớ nhất hôm nay + chào ngắn, khác mỗi ngày.

## 6. Viết cho giọng đọc — nghe thật, có trọng tâm (23/11/2026, người dùng: giọng cũ "đều, thiếu hồn")
- Nhịp: xen câu rất ngắn (2–5 từ: "Wait. Every few months?") với câu vừa; không để ba câu dài liền nhau.
- Mỗi tin **một ý trọng tâm**, nói thành câu riêng, có đà dẫn ("Here's the thing." · một câu hỏi) — chỗ giọng nhấn.
- "..." tối đa 2 lần / tin, cho một nhịp dừng thật.
- **Thẻ cảm xúc** (giọng ElevenLabs v3 đọc, phụ đề tự bỏ): `[curious] [surprised] [thoughtful] [warmly] [excited] [serious] [chuckles] [sighs]`, trong ngoặc vuông ở chỗ người dẫn đổi giọng.
  Tối đa 1 thẻ / lượt, khoảng 1 lượt trong 3 có thẻ; `[serious]` cho tai nạn, tử vong, bệnh tật (không vui vẻ); không thẻ trong câu Listen & Repeat, không thẻ trong phụ đề Việt.
- Máy tách lời: `turns[i].say` = có thẻ (đưa cho giọng đọc), `turns[i].text` = sạch (phụ đề, giọng miễn phí khi hết credit).

Xem thêm `WRITING.md` (chọn tin, giọng nói tự nhiên, phụ đề Việt, đúng sự thật, danh sách từ cấm).

## 7. Series cố định, nhân vật cố định (người dùng duyệt 23/11/2026, `tools/shows.mjs`)
| Ngày | Series | Nhân vật (giọng ElevenLabs riêng, không đổi) | Nội dung |
|---|---|---|---|
| T2 | **MMH Talk** | Emma (dẫn chính, tò mò) · Daniel (từng làm mua sắm bệnh viện, hơi hoài nghi) | 2–3 chuyện quan trọng nhất với MMH, trao đổi, phản biện nhẹ |
| T3 | **The Clinic Room** | Dr. Sarah (giảng nhãn khoa, nha khoa) · Minh (sales trẻ MMH, hỏi như người nghe B1) | Bệnh, kỹ thuật, dụng cụ dùng ở bước nào |
| T4 | **Law & Tender Desk** | Thomas (giải thích luật, giọng Anh, chậm rãi) | Cái gì đổi · ai bị ảnh hưởng · từ khi nào · MMH làm gì; phần học = tiếng Anh pháp lý |
| T5 | **AI Pulse** | Liam (tech creator, kiểu YouTuber review công nghệ; giọng ElevenLabs Liam — "Energetic, Social Media Creator") | Tin AI quốc tế — xem mục 8 |
| T6 | **Morning Headlines** | Andrew (MC thời sự) | 5–7 tin nóng, mỗi tin kết bằng "với MMH, …" |
| T7 | **English at Work** | Ms. Olivia (giáo viên) · Minh (học viên) | Ôn từ / cụm / ngữ pháp của cả tuần, đóng vai tình huống MMH |
| CN | **Week in Review** | Emma · Daniel | Nối các chuyện của tuần, việc cần theo dõi tuần sau |
- Đổi chỗ theo tin: nhiều văn bản luật ⇒ Law & Tender Desk, nhiều tin nhãn / nha khoa ⇒ The Clinic Room (nếu series đó chưa phát 2 ngày gần đây). T7, CN không đổi.
- Nhân vật giữ đúng tính cách, cách nói; không giới thiệu lại lý lịch mỗi số.
- **Sổ ghi nhớ** `data/memory.json` (~5 tháng, mọi series): mỗi số Claude ghi 2–5 ý (`recap`). Sáng hôm sau máy tìm số cũ có chủ đề gần với tin hôm nay;
  **chỉ khoảng 1/3 số** được phép nhắc lại (ngẫu nhiên, `DAILY_RECALL_P`), tối đa **một lần, nửa câu**, chỉ khi tin hôm nay thật sự nối tiếp; không kể lại chuyện cũ. Bước soát kịch bản bỏ phần nhắc thừa.
- T5 AI Pulse cần ≥ 3 tin AI chưa lên sóng; thiếu ⇒ MMH Talk. App ▸ Tổng hợp ngay ▸ chỉ chọn chủ đề "AI & Công nghệ" ⇒ ra số AI Pulse bất kỳ ngày nào.

## 8. AI Pulse — series AI & công nghệ (24/11/2026, người dùng yêu cầu)
- **Nguồn** (`config.json ▸ feeds`, `sec: "ai"`, CHỈ quốc tế, không lấy nguồn Việt Nam): blog chính thức OpenAI · Google DeepMind · Google AI · Hugging Face · NVIDIA · Microsoft;
  bài do chính lãnh đạo / người xây AI viết (Sam Altman, Jack Clark — đồng sáng lập Anthropic, Andrej Karpathy, Simon Willison, Ethan Mollick, Latent Space);
  phát biểu / bài đăng X, Threads, phỏng vấn của Altman, Amodei, Zuckerberg, Huang, Hassabis, Pichai, Nadella, Karpathy, LeCun… qua báo công nghệ (X / Threads không cho đọc tự động);
  kênh YouTube lớn về AI (OpenAI, Anthropic, DeepMind, NVIDIA, Lex Fridman, Dwarkesh, Y Combinator, a16z, AI Explained, Two Minute Papers, Matt Wolfe, Matthew Berman…)
  và **AI trong sales & marketing** (The AI Advantage, Liam Ottley, Jeff Su, HubSpot, Neil Patel, GaryVee, Greg Isenberg, Salesforce + MarTech, Marketing AI Institute).
  Kênh YouTube khai báo bằng `@handle` (GitHub tự tra mã kênh, lưu `data/yt.json`); video Shorts và video không nói về AI bị bỏ. Lượt xem cộng điểm.
- **Nội dung**: (1) câu mở = chuyện AI lớn nhất; (2) lãnh đạo nói / viết / đăng gì và tín hiệu là gì; (3) công nghệ mới — ĐI SÂU 2–3 mục: cái gì mới, chạy thế nào (lời thường + một hình ảnh đời thường),
  làm được / chưa làm được gì, ai dùng được, khi nào; (4) AI tại nơi làm việc — sales & marketing, nêu tên kênh / nguồn; (5) tin nhanh; (6) **góc MMH tuỳ chọn**; (7) phần học (Tech Talk English) + chào.
- Luôn tách "đã công bố" / "dùng được ngay", "tin đồn" / "đã xác nhận"; mọi ý ghi nguồn; không bịa tính năng, số liệu, giá, trích dẫn. Không dùng từ thổi phồng ("insane", "game-changer").
- **Góc MMH** (60–120 từ, 2–3 ý, mỗi ý 1 câu): chỉ khi có ứng dụng thực tế cho việc hằng ngày — ghi chú đi địa bàn / CRM, hồ sơ thầu, dịch IFU / catalogue, tài liệu đào tạo,
  email khách hàng, nghiên cứu thị trường, báo cáo liên phòng ban, phân tích phản hồi sản phẩm. Luân phiên: số AI Pulse trước có góc MMH ⇒ số này chỉ đưa khi ý thật sự mạnh (`history.json ▸ mmh`).
- Phong cách YouTuber review công nghệ: hào hứng, nhanh, chuyển ý gọn ("Okay, next up…", "Quick reality check…"), mỗi phần kết bằng một câu chốt — vẫn tiếng Anh B1.
- Bài kiểm tra nghe / bài học (Học bài này) dựng từ kịch bản như mọi số.

