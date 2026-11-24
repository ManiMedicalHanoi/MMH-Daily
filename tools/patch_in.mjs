// MMH Daily Podcast — GỘP bản bổ sung (đã mở hộp thư, bản rõ ở thư mục tạm) vào bản tin nội bộ đã đăng, mã hoá lại. Không đụng âm thanh.
//   DAILY_INTERNAL_KEY=… node tools/patch_in.mjs <bổ sung.json>   ⇒ data/internal/<ngày>.json.enc (cùng khoá)
// Chỉ nhận các khoá an toàn: study (bài học), title, intro, sections.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seal, open } from './seal.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.DAILY_INTERNAL_KEY;
if (!KEY) { console.error('Thiếu DAILY_INTERNAL_KEY'); process.exit(1); }
const P = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const f = path.join(ROOT, 'data', 'internal', `${P.date}.json.enc`);
if (!fs.existsSync(f)) { console.error('Chưa có bản tin ' + P.date); process.exit(1); }
const ed = JSON.parse(open(fs.readFileSync(f), KEY).toString());
const keys = [];
for (const k of ['study', 'title', 'intro', 'sections']) if (P.patch[k] != null) { ed[k] = P.patch[k]; keys.push(k); }
if (P.patch.study) {
  const n = (ed.podcast?.turns || []).length, ok = x => Number.isInteger(x.turn) && x.turn >= 0 && x.turn < n;
  const s = ed.study; s.words = (s.words || []).filter(ok); s.phrases = (s.phrases || []).filter(ok); s.grammar = (s.grammar || []).filter(ok);
  s.quiz = (s.quiz || []).filter(q => ok(q) && q.opts?.length === 4 && q.a >= 0 && q.a < 4);
}
ed.updated = new Date().toISOString();
fs.writeFileSync(f, seal(Buffer.from(JSON.stringify(ed)), KEY));
const ip = path.join(ROOT, 'data', 'internal', 'index.json');
try { const idx = JSON.parse(fs.readFileSync(ip, 'utf8')); idx.updated = ed.updated; fs.writeFileSync(ip, JSON.stringify(idx)); } catch { /* không có sổ */ }
console.log(`Đã gộp bổ sung vào bản tin ${P.date}: ${keys.join(', ')}.`);
