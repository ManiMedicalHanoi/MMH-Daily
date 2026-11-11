# Video hướng dẫn Tập 1: tạo app bằng Claude Code + GitHub + ElevenLabs

Mã nguồn Tập 1: 2 video 4K (16:9 và 9:16, khoảng 2 phút 35 giây) giới thiệu cách dựng app ví dụ **DailyCast**,
một podcast tự đọc báo mỗi sáng: Claude Code viết code, GitHub chứa code, chạy Actions và đăng Pages,
ElevenLabs đọc thành giọng nói (khoá API cất trong GitHub Secrets). Cuối video giới thiệu Tập 2: Google Sheet + GitHub,
combo cho mọi ứng dụng trong doanh nghiệp.

| Thư mục / tệp | Vai trò |
|---|---|
| `tools/script.json` | Lời đọc tiếng Việt, 13 đoạn (giọng ElevenLabs "Ninh Đôn", model `eleven_v4`), lời gốc ở `LOI_DOC_TAP1.md` |
| `tools/build_tl.py` | Ghép MP3 từng đoạn thành `vo/narration.wav`; lấy mốc từng từ (ElevenLabs `with-timestamps`) ⇒ `timeline.json` + phụ đề |
| `src/data/timeline.json` | Mốc từng từ: mọi chuyển động khớp lời qua `W('đoạn', 'từ')` |
| `src/Video.tsx` | Toàn bộ cảnh. Một component cho 2 khổ (`v = true` là dọc 9:16, có phụ đề) |
| `public/media/` | Ảnh chụp giao diện app (đã bỏ tên MMH), icon GitHub / Google Sheets / Apps Script (dùng cho phần giới thiệu Tập 2), icon DailyCast |
| `tools/gen_v4.py` | Đọc liền theo 3 cụm cảnh (ngữ điệu nối tự nhiên), 3 bản mỗi cụm, chọn bản khớp nhất qua Scribe, cắt ra từng cảnh theo mốc chữ |
| `tools/takes.py` | Thu 3 bản mỗi đoạn, chép lời bằng Scribe, chấm lệch chữ + từ kém rõ, chọn bản đọc chuẩn nhất |
| `frames.mjs` | Dựng khung JPEG 4K (`scale: 2`) hoặc chỉ âm thanh (`audio`), ghép bằng ffmpeg: nhanh hơn `render.mjs` |
| `render.mjs` | Dựng thẳng MP4 4K (chậm hơn) |
| `snap.mjs` | Chụp nhanh vài khung để soát bố cục |

Âm thanh (`public/narration.wav`, `public/music.wav`, `public/sfx/`) không lưu trong git, vì nặng và tạo lại được:
lời đọc từ ElevenLabs, nhạc nền tự tổng hợp bằng `music.py --mood tech`, hiệu ứng âm thanh bằng `sfx.py` (skill mmh-video-maker).

Dựng lại: `npm i` → đặt 3 nguồn âm thanh vào `public/` → `node render.mjs 16x9 out.mp4` (hoặc `9x16`).
Remotion miễn phí cho cá nhân / công ty ≤ 3 người; công ty lớn hơn dùng thương mại cần Company License.
