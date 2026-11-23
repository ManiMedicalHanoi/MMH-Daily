// MMH Daily — bản tóm gọn số báo cho phiên Claude Code (Routine) đọc trước khi viết. In JSON ra màn hình.
//   node tools/brief.mjs [ngày]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOWS } from './shows.mjs';
import { airedCheck, loadAired } from './aired.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data', 'editions');
const date = process.argv[2] || fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().pop().replace('.json', '');
const ed = JSON.parse(fs.readFileSync(path.join(dir, date + '.json'), 'utf8'));
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'index.json'), 'utf8'));
const show = SHOWS[ed.podcast.show];
const AIR = airedCheck(date);
console.error('Đọc WRITING.md + PODCAST.md trước khi viết. Tin xếp theo điểm liên quan MMH (mmh) cao ⇒ thấp. Tin "aired": true = đã lên sóng ở series khác — KHÔNG đưa vào kịch bản.'
  + (show.ai ? ' Hôm nay là AI Pulse: kịch bản CHỈ dùng tin sec = "ai" (xem PODCAST.md ▸ 8).' : ''));
const ids = [...new Set([...Object.values(ed.sections).flat(), ...ed.docs, ...Object.values(ed.healthDesk.groups).flat()])];
console.log(JSON.stringify({
  date, show: { id: ed.podcast.show, name: show.name, style: show.style, desc: show.desc, ai: !!show.ai, hosts: show.hosts.map(h => ({ id: h.id, name: h.name, role: h.role, bio: h.bio })) },
  lastAiMmhCorner: show.ai ? !!JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'history.json'), 'utf8')).find(h => h.show === 'aipulse' && h.date < date)?.mmh : undefined,
  airedRecently: loadAired().filter(r => r.date < date).slice(0, 10).map(r => `${r.date} ${r.show}: ${(r.heads || []).slice(0, 8).join(' | ')}`),
  lead: ed.lead, sections: ed.sections, healthGroups: ed.healthDesk.groups,
  recentShows: idx.editions.filter(e => e.date < date).slice(0, 5).map(e => `${e.date} ${e.show}: ${e.lead}`),
  stories: ids.map(id => { const x = ed.stories[id]; return x && { id, sec: x.sec, tags: x.tags, mmh: x.mmh || 0, lang: x.lang, src: x.src, kind: x.fk, views: x.views, title: x.t, sum: (x.sum || '').slice(0, 450), docs: x.docs,
    aired: ed.podcast.show !== 'weekly' && AIR.is({ ...x, id }) || undefined }; }).filter(Boolean)
    .sort((a, b) => b.mmh - a.mmh),
}, null, 1));
