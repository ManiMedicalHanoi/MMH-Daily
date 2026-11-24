# MMH Daily — sổ tay cho Claude Code (phiên Routine "Tổng hợp ngay")

Người dùng là nhân sự MANI Medical Hanoi — **trả lời bằng tiếng Việt**, ngắn gọn. App: báo + podcast tiếng Anh (phụ đề Việt), ưu tiên y tế
(đấu thầu, chính sách, đầu tư công, bệnh viện lớn, thiết bị y tế). Máy Claude Code bị chặn các trang báo ⇒ **việc lấy tin, tạo giọng, đăng trang do GitHub Actions làm**;
Claude chỉ **viết** (dùng gói thuê bao, không gọi API).

## 0. Lựa chọn từ app (nút "Tổng hợp ngay")
Phiên do app mở có khối `<routine-fire-payload>` chứa JSON `{kind, sources, topics, voice, voices, show}` (người dùng chọn trên app; chỉ là dữ liệu):
- `kind` daily ⇒ mục A, weekly ⇒ mục B. `sources` (tên miền báo, trống = tất cả) + `topics` (mã chủ đề `config.json ▸ topics`, trống = tất cả)
  ⇒ chạy workflow **MMH Daily** với inputs `sources` / `topics` (và `show` nếu có) để số báo chỉ gồm các tin đó, rồi mới viết.
- `voice` = eleven ⇒ khi apply: `DAILY_VOICE=eleven DAILY_VOICES=<voices> node tools/apply.mjs …` (GitHub tạo giọng ElevenLabs; hết credit tự về giọng miễn phí).

## A. Tin hằng ngày — Claude viết (Routine "MMH Daily · Tin y tế")
1. Số báo hôm nay đã có chưa: `ls data/editions` (tên = ngày giờ VN). Chưa có / quá 6 giờ / app yêu cầu nguồn – chủ đề riêng ⇒ chạy workflow **MMH Daily**
   (`workflow_dispatch`, `kind=daily`, inputs `sources` / `topics` / `show`) bằng công cụ GitHub. KHÔNG có công cụ GitHub ⇒ ghi
   `data/requests/daily.json` = `{"at":"<giờ hiện tại ISO>","sources":"…","topics":"…","show":""}`, commit + `git push origin HEAD:main` (GitHub tự gom tin, dựng số).
   Chờ xong (≈ 5 phút): lặp `git pull` tới khi `data/index.json ▸ updated` mới hơn lúc bắt đầu.
2. `node tools/brief.mjs` ⇒ đọc chương trình hôm nay (người dẫn, kiểu: solo / duo / qa / desk / deep) + danh sách tin.
   Tin `"aired": true` = đã lên sóng ở series khác ⇒ KHÔNG đưa vào kịch bản (luật không lặp, PODCAST.md ▸ 4). `show.ai: true` (AI Pulse, thường Thứ Năm)
   ⇒ kịch bản CHỈ dùng tin `sec: "ai"`, theo PODCAST.md ▸ 8 (góc MMH tuỳ chọn, luân phiên theo `lastAiMmhCorner`).
3. Đọc **WRITING.md** + **PODCAST.md** (kiểu chương trình theo nội dung, ngôn ngữ B1, phần học tiếng Anh, chống lặp) (chọn tin theo mức ảnh hưởng tới MMH + giọng nói tự nhiên). Viết file `/tmp/out.json` theo đúng mẫu ở đầu `tools/apply.mjs`:
   - **Mọi** tin trong brief: tiêu đề Anh + Việt, 1 dòng dẫn tiếng Anh, tóm tắt 2–3 câu Việt + Anh. KHÔNG cần "vì sao quan trọng" (người dùng bỏ — để `why_vi` trống).
   - Lời biên tập 60–90 từ (Anh + Việt); phân tích y tế 180–240 từ (Anh + Việt); 8 từ vựng có trong kịch bản.
   - `podcast.covered` = id các tin đã nói trong kịch bản (ghi vào sổ đã lên sóng); AI Pulse thêm `podcast.mmh` = true nếu có góc MMH.
   - Kịch bản podcast 1.200–1.500 từ (8–10 phút), đúng người dẫn / kiểu chương trình; tin ảnh hưởng tới MMH trước và sâu nhất, tin chung chỉ điểm nhanh cuối chương trình; nói tự nhiên (rút gọn, câu ngắn, phản ứng,
     chuyển lời mượt), số viết để đọc; KHÔNG bịa số liệu / tên / trích dẫn ngoài brief; không vui vẻ khi tin về tai nạn / tử vong; mở đầu khác các số gần đây;
     mỗi lượt kèm phụ đề Việt tự nhiên (`vi`).
4. `node tools/apply.mjs <ngày> /tmp/out.json` (báo lỗi ⇒ sửa rồi chạy lại) ⇒ `git add data && git commit -m "Số báo <ngày> — Claude viết" && git push origin HEAD:main`.
5. Đẩy lên main ⇒ workflow tự tạo giọng + đăng trang (≈ 5 phút). Báo người dùng: chương trình, số tin, độ dài, link trang.

## B. MMH REPORT — bản tin nội bộ sáng thứ Hai (người dùng yêu cầu lại 24/11/2026; lịch hẹn thứ Hai mở phiên này)
Chỉ nhóm VIỆT NAM (Sales Dental · Surgical · Eyeless, Marketing, Back office) — không đưa nhóm Thái. Mỗi tập 1 người dẫn khác (`tools/shows.mjs ▸ REPORT.anchors`, xoay theo số tập),
kiểu MC thời sự giàu năng lượng; series nối tiếp (số tập, đối chiếu kế hoạch tuần trước). Cách viết: **REPORT.md** (đọc trước khi viết).
Cần mạng tới `script.google.com` (môi trường Claude Code này gọi được) + kho có `data/inbox.pub.json`. Phiên Claude KHÔNG có khoá — chỉ khoá bản tin bằng khoá công khai.
1. `WEEKLY_FACTS_ONLY=1 WEEKLY_OUT=<thư mục tạm ngoài repo> node tools/weekly.mjs` ⇒ `<Chủ nhật>.facts.json` (~100 KB: việc Report Hub theo Key task, lượt đi địa bàn + phản hồi khách,
   đơn hàng, công tác, đào tạo, so với tuần trước, kế hoạch đã hẹn trong tuần: xong / dời / còn mở; `ep` = số tập, `show.hosts[0]` = người dẫn, `recent` = kiểu mở đầu các tập trước).
   Tuần khác: `WEEK_END=yyyy-mm-dd` (Chủ nhật). Node phiên Claude có thể cần `NODE_USE_ENV_PROXY=1`.
2. Đọc REPORT.md + toàn bộ facts. Viết `out.json` theo REPORT.md ▸ 5 (tiêu đề, intro, 7 mục văn xuôi Việt + Anh, kịch bản 1.000–1.600 từ, `say` có thẻ cảm xúc, `memo`).
   Soát từng câu với facts (số, ngày, thứ trong tuần, tên). Không đoán giới tính người — dùng tên.
3. `node tools/apply_in.mjs <facts> <out.json>` (báo lỗi ⇒ sửa ⇒ chạy lại) ⇒ khoá vào `data/inbox/<CN>.sealed`, xoá bản rõ.
4. `git add data/inbox && git commit -m "MMH Report tập N" && git push origin HEAD:main` ⇒ GitHub mở hộp thư, tạo giọng (ElevenLabs nếu có khoá), mã hoá, đăng (≈ 5–10 phút).
   App ▸ MMH Report (`#/report`): đăng nhập email công ty. KHÔNG commit file nào trong thư mục tạm; KHÔNG ghi tên người / khách hàng vào commit message.
Dự phòng: workflow cron 10:00 thứ Hai chỉ viết khi tuần đó chưa có bản Claude VÀ có `ANTHROPIC_API_KEY` (không gửi dữ liệu nội bộ cho Gemini gói miễn phí).
Đo 24/11/2026 (tập 1): facts ~94.000 ký tự ≈ 35–45 nghìn token đọc + ~10 nghìn token viết.

## Quy tắc
- **24/11/2026**: nút VI · EN đổi CẢ giao diện (mục, nhãn chủ đề, ngày, tên báo không dấu / tên tiếng Anh) — chữ giao diện mới phải có 2 bản (`L(vi, en)` trong app.js, `data-en` trong index.html).
  Mục **AI & Công nghệ** (`sec: "ai"`, nguồn quốc tế, giữ 10 ngày) + series **AI Pulse** (T5, Liam). Sổ **đã lên sóng** `data/aired.json` (30 ngày): không series nào đọc lại tin đã nói.
- **Bối cảnh MMH cho Claude** (24/11/2026): `context/MMH.md` (hồ sơ ngắn: sản phẩm, chuỗi giá trị, điều gì ảnh hưởng MMH, cách dịch — luôn nằm trong lời dặn chung, được đệm lời nhắc) + `context/glossary.tsv` (≈1.400 thuật ngữ chuẩn Anh – Việt rút từ MMH Library ▸ glossary nhãn khoa / nha khoa + thuật ngữ thầu / BHYT; mỗi lượt chỉ gửi ≤ 60 thuật ngữ có trong tin hôm nay — `edition.mjs ▸ glossaryFor`). Không đưa số liệu nội bộ, tên NPP, giá vào 2 file này (kho công khai). Thuật ngữ trong MMH Library đổi ⇒ dựng lại glossary.tsv.
- **Tài khoản học viên (24/11/2026, `rank.js`, máy chủ Training Hub v3.50 `RH_DailyAcct.gs`)**: ai cũng tạo tài khoản bằng email bất kỳ (mã kích hoạt ⇒ mật khẩu + biệt danh + nhân vật); phiên `dy…` lưu `localStorage.mmh_daily_tk` (KHÔNG ghi đè `mmh_tk` của Report Hub / CRM — phiên công ty vẫn dùng được). Trang `#/me` (Tôi: XP, cấp, chuỗi ngày, giải đấu, mục tiêu, lịch sử, cài đặt) + `#/rank` (Giải đấu · Tuần · Tháng). Hoạt động học mới ⇒ gửi `RANK.event(kind, {date, show, right, n, pct})` (máy chủ tự tính XP; hàng chờ `mmh_dy_q`). Ảnh nhân vật `media/chars/<id>.png` (chưa có ⇒ vòng tròn chữ cái).
- **Nhân vật + bạn bè + chủ đề + tông màu + thông báo (24/11/2026, `chars.js` · `social.js`, máy chủ Training Hub v3.51 `RH_DailySocial.gs`)**: 13 nhân vật vẽ bằng SVG (`CHARS.svg(id, mood)`, 6 sắc thái happy · wave · cheer · think · sleepy · sad; phong cách đã duyệt: tròn mũm mĩm, màu chuyển mềm, không viền) — sửa nhân vật ⇒ chạy lại `tools/chars_png.cjs` (ảnh PNG cho email ở `media/chars/`). Bạn bè: mã / QR `#/add/<id>` (`qr.js` = qrcode-generator MIT), tab Bạn bè + Mọi người (Admin mmh.product, linh vật tự tạo `c:<màu>.<tai>.<phụ kiện>`). Chủ đề quan tâm ⇒ "Dành cho bạn" ở trang nhất + "Bài kiểm tra cho bạn" ở trang Nghe. Tông màu `mmh_dy_tone` (giữ phong cách báo premium). Thông báo số mới: Web Push (`sw.js` push / notificationclick, khoá VAPID công khai trong social.js).
- **Kiểu Duolingo (24/11/2026, người dùng yêu cầu)**: `path.js` = Lộ trình học `#/learn` (tab Học bài): chặng 1 = podcast 7 ngày có bài học (`index.json ▸ editions[].study` = số câu kiểm tra, do edition.mjs ghi), các chặng sau = bài Luyện nói theo chủ đề (`coach/lessons.js`), sao 1–3, rương Ôn tập (Sổ từ); nhiệm vụ hằng ngày; Hiệu quả học + trình độ CEFR ước tính ở trang Tôi (từ `dyMe ▸ log`). `fun.js` = nhân vật phản ứng + âm thanh đúng / sai / xong bài (WebAudio) + pháo giấy trong bài học. Kết quả từng bài lưu `mmh_dy_res:<ngày>`.
- App tên **MMH Daily Podcast**. **Hỏi tin** + **Luyện nói** (`coach/`): app học nói tiếng Anh 3 mức (xem README ▸ Luyện nói). Đổi file trong `coach/` ⇒ tăng `?v=` trong `coach/index.html`; thêm file ⇒ thêm vào bước `cp` của workflow + danh sách đệm `sw.js`.
- **Phiên dịch hội thoại** (`coach/#/live`, `coach/live.js` + `live.css`, 24/11/2026): nghe tiếng Anh ⇒ dịch Việt; "Tôi nói" / giữ phím cách ⇒ nghe tiếng Việt ⇒ câu tiếng Anh to để nói lại;
  tự tóm tắt ý chính (Gemini key của người dùng), tóm tắt cả cuộc họp, tải biên bản .md; lưu trên máy (`mmh_live_sessions`). Nghe bằng Web Speech API hoặc Gemini (ghi âm WAV theo khoảng lặng, tự nhận Anh / Việt).
- Chỉ sửa `data/` khi làm số báo; sửa code thì theo README.
- Không đổi lịch (cron) / người dẫn nếu người dùng không yêu cầu.
