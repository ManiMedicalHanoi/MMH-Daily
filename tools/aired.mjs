// MMH Daily — sổ "đã lên sóng" (data/aired.json, 30 ngày): tin / video nào đã được đọc trong podcast thì KHÔNG chương trình nào đọc lại
// (người dùng yêu cầu 24/11/2026: các MC / series không bao giờ trùng nội dung). So theo mã tin + so tiêu đề gần giống (cùng sự kiện, báo khác đăng lại).
// Week in Review (Chủ nhật) là số NHÌN LẠI tuần nên được phép nhắc lại — xem edition.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bare } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const AIRED_F = path.join(ROOT, 'data', 'aired.json');
export const AIRED_DAYS = 30;
const STOP = new Set(('the a an and or but of to in on at for with is are was were be been it its this that these those from into over after says said new will can could '
  + 'how why what who about more than just your you our we they has have had not now first after year years day week '
  + 'cua va cac nhung mot cho voi tai trong khi duoc nay sau tren nam ngay theo de la co khong nhieu ve nguoi viet nam').split(' '));
export const wordsOf = s => [...new Set(bare(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))];
const day = d => Math.floor(new Date(d + 'T00:00:00Z') / 864e5);

export function loadAired() { try { return JSON.parse(fs.readFileSync(AIRED_F, 'utf8')); } catch { return []; } }

/** Bộ kiểm tra cho ngày `date`: chỉ tính các số TRƯỚC ngày đó, trong 30 ngày. */
export function airedCheck(date, list = loadAired()) {
  const rows = list.filter(r => r.date < date && day(date) - day(r.date) <= AIRED_DAYS);
  const ids = new Set(rows.flatMap(r => r.ids || []));
  const heads = rows.flatMap(r => r.heads || []).map(h => new Set(wordsOf(h))).filter(w => w.size >= 4);
  const hit = t => { const W = wordsOf(t); if (W.length < 4) return false;
    return heads.some(H => { let n = 0; for (const w of W) if (H.has(w)) n++; return n >= 4 && n / Math.min(W.length, H.size) >= 0.6; }); };
  const is = x => !!x && (ids.has(x.id) || hit(x.t) || (x.h_en && hit(x.h_en)));
  return { is, n: rows.length, ids };
}

/** Tin nào thật sự được nói trong kịch bản (khi AI không trả danh sách): đếm từ đặc trưng của tiêu đề / tóm tắt có trong lời thoại. */
export function inferCovered(turns, stories) {
  const text = ' ' + bare(turns.map(t => t.text).join(' ')).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  return stories.filter(x => {
    const W = wordsOf([x.h_en, x.lang === 'en' ? x.t : '', (x.s_en || '').split(/[.!?]/)[0]].filter(Boolean).join(' ')).filter(w => w.length > 3);
    if (W.length < 3) return false;
    const n = W.filter(w => text.includes(' ' + w + ' ')).length;
    return n >= 4 || n / W.length >= 0.5;
  }).map(x => x.id);
}

/** Ghi (thay) dòng của ngày `date`. */
export function recordAired(date, show, stories) {
  const list = loadAired().filter(r => r.date !== date && day(date) - day(r.date) <= AIRED_DAYS + 5);
  if (stories.length) list.unshift({ date, show, ids: stories.map(x => x.id), heads: stories.map(x => [x.h_en, x.t].filter(Boolean).join(' · ').slice(0, 260)) });
  list.sort((a, b) => b.date.localeCompare(a.date));
  fs.writeFileSync(AIRED_F, JSON.stringify(list));
  return stories.length;
}
