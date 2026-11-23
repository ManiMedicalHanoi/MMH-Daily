# MMH Daily Podcast

> Đổi tên từ "MMH Daily" (23/11/2026). Bản tin nội bộ Chủ nhật đã BỎ khỏi app + lịch chạy theo yêu cầu người dùng (code `tools/weekly.mjs`, dữ liệu mã hoá cũ vẫn giữ, chạy tay `kind=weekly` vẫn được). Chỉ còn tin từ báo / cơ quan chính thống, bệnh viện, hội y học; bỏ tin giải trí (`config.json ▸ kw.entertainment`).

Tờ báo buổi sáng của MMH + podcast tiếng Anh mỗi ngày.
**Ưu tiên y tế** (đấu thầu, chính sách, đầu tư công, bệnh viện lớn, thiết bị y tế), sau đó kinh tế, chính trị, xã hội Việt Nam.

## AI & Công nghệ + AI Pulse, tiếng Anh toàn app, không lặp nội dung (24/11/2026)
- **Mục AI & Công nghệ** (`config.json ▸ sections.ai`, feeds `sec: "ai"`, chỉ nguồn quốc tế, giữ 10 ngày): blog chính thức các hãng AI, bài do chính lãnh đạo / người xây AI viết,
  phát biểu – bài đăng của lãnh đạo OpenAI · Anthropic · Meta · Google · NVIDIA · Microsoft (qua báo công nghệ — X / Threads không cho đọc tự động), kênh YouTube AI lớn
  + kênh AI cho sales & marketing (khai báo `@handle`, GitHub tự tra mã kênh ⇒ `data/yt.json`). Nhãn: lãnh đạo AI · mô hình mới · AI agent · AI cho sales & marketing · AI trong y tế · video.
- **AI Pulse** (Thứ Năm, Liam — giọng ElevenLabs "Liam", edge-tts `en-US-RogerNeural`): kiểu YouTuber review công nghệ, đi sâu công nghệ, góc MMH tuỳ chọn luân phiên (PODCAST.md ▸ 8).
  Thiếu tin AI mới (< 3) ⇒ MMH Talk. Tổng hợp ngay ▸ chỉ chọn chủ đề AI ⇒ ra số AI Pulse.
- **Không lặp**: `data/aired.json` (`tools/aired.mjs`) — tin / video đã nói trong podcast (`podcast.covered`) không series nào dùng lại trong 30 ngày (so mã tin + tiêu đề gần giống). Week in Review được nhắc lại.
- **VI · EN** đổi cả giao diện: mục, nhãn chủ đề, ngày, tên báo (tên tiếng Anh hoặc không dấu), hướng dẫn, chế độ học. Chữ giao diện mới: `L(vi, en)` / `data-en`.

## Mỗi sáng (GitHub Actions `.github/workflows/daily.yml`, 05:45 giờ VN)

1. `tools/collect.mjs`: gom tin từ ~45 kênh của báo chính thống Việt + Anh và Google News (Reuters, Bloomberg, Nikkei…), cùng văn bản mới trên vanban.chinhphu.vn.
   Chỉ nhận tin từ tên miền trong `config.json ▸ trusted`. Xếp tin vào 4 mảng, gắn nhãn y tế chuyên sâu, chấm điểm, gộp tin trùng.
2. `tools/edition.mjs`: chọn tin của số báo (không lặp tin của 3 số trước) và chương trình podcast trong ngày (`tools/shows.mjs`):
   Morning Briefing · Health Desk · Two Takes · Market Watch · Ask the Editor · The Explainer · (Chủ nhật) Week in Review.
   - (Tuỳ chọn, ~15k đ/tháng) Có secret `ANTHROPIC_API_KEY`: Claude Haiku 5.5 (đổi bằng biến `DAILY_MODEL`) viết tiêu đề + tóm tắt Việt / Anh,
     "vì sao quan trọng", lời biên tập, phân tích y tế, 8 từ vựng, kịch bản podcast 8–10 phút + phụ đề Việt.
   - **Mặc định, 0 đồng**: dịch máy Google (miễn phí) tin Việt ⇄ Anh; podcast soạn theo mẫu từ tin tiếng Anh + tin y tế tiếng Việt đã dịch (7 kiểu chương trình, câu chuyển ý thay đổi theo ngày).
3. `tools/audio.py`: giọng đọc neural (edge-tts, miễn phí), mỗi người dẫn một giọng, có nhạc hiệu, chuẩn âm lượng, ghi mốc thời gian để phụ đề chạy theo.
4. Lưu `data/` vào git, MP3 lên Releases (`ep-yyyy-mm-dd`), đăng trang lên GitHub Pages (kèm MP3 của 21 ngày gần nhất).

## Trên app
- **Tổng hợp ngay** (`update.js`): chọn chủ đề, nguồn báo (`data/sources.json` do `collect.mjs` sinh: nhóm báo + số tin 48 giờ), Claude viết / Tự động, giọng ElevenLabs (bộ giọng `config.json ▸ voice.presets`, nghe thử) / miễn phí
  ⇒ Training Hub `dailyRun` (đăng nhập email công ty; máy chủ giữ token) ⇒ GitHub Actions (inputs `sources`, `topics`, `voice`, `voices`) hoặc Routine Claude. Tiến độ: `dailyStatus`.
  Admin: Thiết lập ▸ token GitHub (fine-grained, kho này, Actions R/W), Fire URL + token Routine, số lượt ElevenLabs / ngày.
- **Chế độ học** (`learn.js`): phụ đề Anh + Việt chạy theo câu, lặp câu, dừng sau mỗi câu, ẩn Anh / Việt, từ vựng gạch chân.
- **Xếp hạng** (`rank.js`, `#/rank`): điểm bài học lưu theo tài khoản email công ty (phiên `mmh_tk`, đăng nhập email + mật khẩu hoặc mã) ⇒ Training Hub `dailyScore` / `dailyBoard` (sheet DAILY_SCORES); bảng tuần / tháng + hoạt động gần đây, mọi người cùng thấy; chưa đăng nhập ⇒ điểm chờ ở `mmh_daily_score_q`, đăng nhập xong tự gửi.
- **Học bài này** (`study.js`, trang Nghe, ngay dưới nút phát): bài học 4 bước toàn màn hình dựng từ `ed.study` (`edition.mjs ▸ studyWrite`) — 1 Từ khoá (thẻ lật, phát âm, "Chưa biết" ⇒ Sổ từ Luyện nói, vuốt trái / phải) · 2 Nghe (phụ đề lớn theo giọng đọc, ẩn chữ / Anh / Anh + Việt, câu trước / sau, tốc độ) · 3 Kiểm tra nghe (từng câu, đúng / sai ngay, nghe lại đúng đoạn) · 4 Nói theo (cụm hay + câu ngữ pháp, chấm bằng nhận diện giọng nói của trình duyệt) · Tổng kết. Tiến độ `mmh_daily_lesson:<ngày>`, điểm `mmh_daily_quiz:<ngày>`.
- **Hướng dẫn** (`guide.js`, nút ?), **Cài app** (`install.js`, `manifest.webmanifest`, `sw.js` — đổi quy tắc đệm ⇒ tăng `V`).
- Giọng ElevenLabs: secret `ELEVENLABS_API_KEY` (Settings ▸ Secrets ▸ Actions) ⇒ podcast hằng ngày tự đọc bằng ElevenLabs v4 Turbo có thẻ cảm xúc (PODCAST.md ▸ 6); hết credit / lỗi ⇒ giọng miễn phí. Không có khoá ⇒ luôn giọng miễn phí.

## Cài đặt kho mới (1 lần)
- Settings ▸ Pages ▸ Build and deployment ▸ Source: **GitHub Actions**.
- (Khuyên dùng) Settings ▸ Secrets and variables ▸ Actions ▸ New secret `ANTHROPIC_API_KEY`.
- Actions ▸ MMH Daily ▸ Run workflow (chạy lần đầu, không cần chờ sáng mai).

## Sửa thường gặp
| Muốn | Sửa |
|---|---|
| Thêm / bỏ báo | `config.json ▸ feeds` (+ tên miền ở `trusted`) |
| Đổi từ khoá y tế / kinh tế… | `config.json ▸ health_core`, `kw` |
| Đổi chương trình, giọng, người dẫn | `tools/shows.mjs` (danh sách giọng: `edge-tts --list-voices`) |
| Số tin mỗi mảng | `config.json ▸ sections.*.quota` |
| Giờ chạy | `cron` trong workflow (giờ UTC = giờ VN − 7) |

Chạy thử tại máy: `node tools/collect.mjs && node tools/edition.mjs && python3 tools/audio.py` (cần ffmpeg, `pip install edge-tts`), rồi `python3 -m http.server` trong thư mục này.

## Bản tin nội bộ (tối Chủ nhật 19:00) — chỉ nhân sự MMH
- `tools/weekly.mjs` đọc (chỉ đọc) tuần thứ Hai → Chủ nhật: Report Hub Marketing + Back office (việc xong / quá hạn 4 tuần / tuần sau, sự kiện, công tác),
  CRM Dental · Surgical · Eyeless · Thái (hoạt động, gặp khách, khách, tỉnh, lượt nổi bật, đơn hàng), thầu Hùng Vĩ + iCare (gói có ngày phê duyệt trong tuần), Training Hub (buổi đào tạo).
  Management Task Tracker chưa đọc được (chỉ cho người đăng nhập).
- 4 chương trình xoay vòng theo tuần (`SHOWS_INTERNAL`): MMH This Week (2 người) · Sunday Notes (1 người) · The MMH Roundup (2 người) · From the Desk (1 người); phụ đề Việt.
  Có Claude ⇒ viết tự nhiên, nêu tên người / bệnh viện, mở đầu bằng tin vui; không có ⇒ câu mẫu song ngữ (KHÔNG gửi dữ liệu nội bộ sang dịch máy bên ngoài).
- **Bảo mật**: bản rõ chỉ nằm trong thư mục tạm của máy chạy; `tools/seal.mjs` mã hoá AES-256-GCM bằng secret `DAILY_INTERNAL_KEY` ⇒ `data/internal/<ngày>.json.enc` + MP3 mã hoá trên Releases.
  App ▸ **Nội bộ**: đăng nhập email công ty (dùng chung phiên Report Hub / CRM) ⇒ Training Hub `dailyKey` trả khoá ⇒ giải mã ngay trên máy.
  Log GitHub Actions chỉ in số đếm (kho công khai — ai cũng đọc được log).
- **Cài lần đầu**: Admin mở app ▸ Nội bộ ▸ *Thiết lập (Admin)* ▸ Chép khoá ⇒ Settings ▸ Secrets ▸ Actions ▸ `DAILY_INTERNAL_KEY`. Lộ khoá ⇒ xoá Script Property `DAILY_KEY` của Training Hub ⇒ khoá mới ⇒ dán lại.
- Chạy tay: Actions ▸ MMH Daily ▸ Run workflow ▸ kind = `weekly`.

## Luyện nói (`coach/`, từ 23/11/2026)
Trang riêng trong cùng app (menu **Luyện nói**, lối tắt app). Mỗi đoạn 3 mức: **1 Chọn từ & đọc** (câu tiếng Anh có 3 chỗ trống ⇒ chọn từ đúng ⇒ đọc to, so từng từ)
· **2 Có gợi ý** (tiếng Việt, chạm chữ gạch chân để xem tiếng Anh; nút Từ khoá · Khung câu · Chia nhỏ · Nghe mẫu, mỗi gợi ý trừ ít điểm) · **3 Tự nói** (chỉ tiếng Việt).
Đạt 70 điểm ⇒ chấm xanh mức đó. Sau khi chấm: câu đã sửa, cách nói khác, lỗi, từ khoá, ngữ pháp, **Nói lại câu chuẩn** (chấm đọc rõ từng từ). Từ khoá đã mở / nói sai vào **Sổ từ** (ôn sau 1, 3, 7, 14, 30 ngày).
- Bài có sẵn: `coach/lessons.js` (18 câu theo công việc: thuyết trình sản phẩm, Sales & KPI, NPP, đấu thầu, email & họp, đời thường). Thêm bài: theo mẫu ở đầu file
  (`[[…]]` = chỗ trống, `d` = 2 phương án sai, `ideas` = ý chính + cụm tiếng Anh chấp nhận). Câu mẫu và `alt` phải qua được luật `ideas` của chính bài.
- Bài từ bản tin: tin hôm nay có nhãn chuyên môn (nhãn khoa, nha khoa, đấu thầu, thiết bị, chính sách, BHYT, phẫu thuật, bệnh viện; bỏ tin giải trí) ⇒ Gemini soạn bài cùng mẫu, lưu trên máy.
- Nhận giọng: Web Speech API (Chrome / Edge / Safari), không có ⇒ gõ. Chấm ý + sửa câu: **Gemini API key của người dùng** (Cài đặt, chỉ lưu localStorage của máy đó,
  gọi thẳng từ trình duyệt, tự chọn mẫu Flash mới nhất khi mẫu cũ không còn); chưa có key ⇒ chấm theo `ideas` có sẵn. Giọng mẫu: giọng trình duyệt hoặc Azure Neural TTS (key + vùng, tuỳ chọn).
- Không dùng tài khoản Claude của người dùng trong trang này (điều khoản Anthropic không cho dùng gói thuê bao trong app tự làm).

## Hỏi tin (`coach/#/ask`, từ 23/11/2026)
Hỏi bằng chữ hoặc giọng nói (Việt / Anh) về tin của 7 số gần nhất ⇒ chọn tối đa 12 tin khớp nhất (hoặc các tin người dùng tick) ⇒ Gemini trả lời **dạng chữ, hiện dần** (stream SSE, tắt "suy nghĩ" để nhanh):
English (có trích nguồn [n]) · Tiếng Việt · PESTEL · Ảnh hưởng tới MMH · Từ vựng (tự vào Sổ từ) · 3 câu hỏi tiếp. Đọc to từng câu ngay khi viết xong (giọng trình duyệt / Azure, miễn phí), "Luyện đọc" từng câu (chấm từng từ).
Chỉ trả lời từ các tin đưa vào (tóm tắt của báo, không đọc toàn văn bài). Nhãn PESTEL trên mỗi tin: `pestel.js` (luật từ khoá, chạy trên trình duyệt, dùng chung trang báo + Hỏi tin).

## Soạn sẵn bằng Gemini trên máy chủ (từ 23/11/2026)
Secret **`GEMINI_API_KEY`** (Settings ▸ Secrets and variables ▸ Actions; key miễn phí ở aistudio.google.com) ⇒ `tools/ai.mjs` viết bằng Gemini khi không có `ANTHROPIC_API_KEY`
(tự chọn mẫu Flash ổn định nhất, Google bận ⇒ chờ / thử lại / đổi mẫu; không in khoá ra log). Ngoài tin song ngữ + kịch bản podcast, `coachWrite` (edition.mjs) soạn sẵn
`ed.coach.lessons` (bài luyện nói 3 mức cho 4 tin liên quan MMH nhất) và `ed.coach.briefs` (tóm tắt: đấu thầu & thiết bị · văn bản pháp quy · nhãn khoa · nha khoa · bệnh viện · PESTEL)
⇒ app mở là dùng, không gọi Gemini trên điện thoại. Podcast ưu tiên: tin y tế đọc nhiều (VnExpress tin xem nhiều) · văn bản đấu thầu / thiết bị · xu hướng nhãn khoa, nha khoa · bệnh viện, hội y học.
Chỉ giữ **7 số / podcast gần nhất** (`DAILY_KEEP`), Releases `ep-*` cũ hơn tự xoá.

## Podcast đa dạng (từ 23/11/2026, `PODCAST.md` = quy tắc trình bày)
11 chương trình (thêm Morning Notes · Clinic Notes · One Story · Quick Five). `tools/shows.mjs ▸ pickShow` chọn theo nội dung trong ngày (văn bản pháp quy ⇒ Explainer / Ask the Editor,
nhãn khoa + nha khoa ⇒ Clinic Notes, một tin vượt trội ⇒ One Story, nhiều tin ngắn ⇒ Quick Five / Two Takes…), không trùng 3 ngày gần nhất, đổi kiểu giọng (nam / nữ / hai người) so với hôm qua.
Mỗi số có 1 phần học (Word Spotlight · Phrase for Work · Listen & Repeat · Quick Quiz, xoay theo ngày). `data/history.json` (30 ngày) ⇒ AI tránh câu mở / kết, cụm từ lặp, từ vựng 14 ngày.
Giọng: tốc độ theo chương trình (−4% → −7%), câu `rep: true` đọc −22% + 2,6 giây lặng để nói theo.
