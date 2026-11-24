// MMH Daily — ghi phần Claude Code viết vào số báo (kiểm tra định dạng trước khi ghi).
//   node tools/apply.mjs <ngày> <file kết quả .json>
// File kết quả: { stories:[{id,rel (0–3: mức liên quan MMH; 0 = bỏ khỏi số báo),h_en,h_vi,dek_en,s_vi,s_en,why_vi}], note:{en,vi}, health:{en,vi}, vocab:[{en,vi,ex}],
//                podcast:{title, desc, covered:[id tin đã nói trong kịch bản], mmh:true|false (AI Pulse có góc MMH), turns:[{sp:'A'|'B', text, vi}]} }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from './style.mjs';
import { inferCovered, recordAired } from './aired.mjs';
import { SHOWS } from './shows.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [date, file] = process.argv.slice(2);
const fp = path.join(ROOT, 'data', 'editions', date + '.json');
const ed = JSON.parse(fs.readFileSync(fp, 'utf8'));
const out = JSON.parse(fs.readFileSync(file, 'utf8'));
const err = [];
const hosts = ed.podcast.hosts.map(h => h.id);
if (!Array.isArray(out.stories)) err.push('thiếu stories');
for (const s of out.stories || []) if (!ed.stories[s.id]) err.push('id lạ: ' + s.id);
const turns = out.podcast?.turns || [];
if (turns.length < 8) err.push('kịch bản quá ngắn (' + turns.length + ' lượt)');
turns.forEach((t, i) => { if (!hosts.includes(t.sp)) err.push(`lượt ${i}: người nói ${t.sp} không có trong chương trình (${hosts})`); if (!t.text || !t.vi) err.push(`lượt ${i}: thiếu text hoặc phụ đề vi`); });
const words = turns.reduce((n, t) => n + String(t.text).split(/\s+/).length, 0);
err.push(...lint(turns));
for (const s of out.stories || []) if (!s.h_en || !s.h_vi || !s.s_vi || !s.s_en) err.push('tin ' + s.id + ': thiếu tiêu đề / tóm tắt Anh hoặc Việt');
if (words < 700) err.push('kịch bản ' + words + ' từ — cần ≥ 700 (≈ 5 phút)');
if (err.length) { console.error('KHÔNG GHI — sửa lại:\n- ' + err.join('\n- ')); process.exit(1); }
const TAG = /\s*\[[a-z][a-z ,'-]{1,28}\]\s*/gi;   // thẻ cảm xúc ElevenLabs v3 ⇒ say (giọng) / text (phụ đề)
const speech = s => String(s).replace(/\bHCMC\b/g, 'Ho Chi Minh City').replace(/\bVND\b/g, 'dong').replace(/(\d)%/g, '$1 percent').replace(/\s+/g, ' ').trim();
for (const s of out.stories) Object.assign(ed.stories[s.id], { h_en: s.h_en, h_vi: s.h_vi, dek: s.dek_en, s_vi: s.s_vi, s_en: s.s_en, why: s.why_vi || undefined, mt: undefined });
// 25/11/2026: tin rel = 0 (thể thao, người nổi tiếng, bài tư vấn, ca bệnh không liên quan MMH) ⇒ bỏ khỏi số báo; tin dẫn = tin liên quan nhất (rel ≥ 2)
const relOf = new Map((out.stories || []).filter(s => Number.isInteger(s.rel)).map(s => [s.id, s.rel]));
if (relOf.size) {
  const r = id => (relOf.has(id) ? relOf.get(id) : 1), drop = id => r(id) === 0 && ed.stories[id]?.sec !== 'ai';
  for (const [id, v] of relOf) if (ed.stories[id]) ed.stories[id].rel = v;
  for (const k of Object.keys(ed.sections)) ed.sections[k] = ed.sections[k].filter(id => !drop(id)).map((id, i) => [id, i]).sort((a, b) => r(b[0]) - r(a[0]) || a[1] - b[1]).map(x => x[0]);
  for (const g of Object.keys(ed.healthDesk?.groups || {})) ed.healthDesk.groups[g] = ed.healthDesk.groups[g].filter(id => !drop(id));
  ed.docs = (ed.docs || []).filter(id => !drop(id));
  if (!ed.lead || drop(ed.lead) || r(ed.lead) < 2) { const c = [...(ed.sections.health || [])].sort((a, b) => r(b) - r(a) || (ed.stories[b].mmh || 0) - (ed.stories[a].mmh || 0))[0]; if (c) ed.lead = c; }
  console.log(`Mức liên quan: bỏ ${[...relOf.values()].filter(v => v === 0).length} tin rel = 0 · tin dẫn ${ed.lead}`);
}
ed.note = out.note; ed.healthDesk.analysis = out.health; ed.vocab = out.vocab;
Object.assign(ed.podcast, { title: out.podcast.title, desc: out.podcast.desc, turns: turns.map(t => { const raw = speech(t.text), text = raw.replace(TAG, ' ').replace(/\s+([,.?!])/g, '$1').replace(/\s+/g, ' ').trim();
  return Object.assign({ sp: t.sp, text, vi: String(t.vi).replace(TAG, ' ').trim() }, raw !== text && !t.rep ? { say: raw } : {}, t.rep ? { rep: true } : {}); }), words });
// sổ "đã lên sóng" (data/aired.json): tin kịch bản này đã nói ⇒ không series nào đọc lại trong 30 ngày
const isAI = !!SHOWS[ed.podcast.show]?.ai;
const podStories = Object.entries(ed.stories).map(([id, x]) => ({ ...x, id })).filter(x => isAI ? x.sec === 'ai' : x.sec !== 'ai');
const okIds = new Set(podStories.map(x => x.id));
let cov = (out.podcast.covered || []).filter(id => okIds.has(id));
if (!cov.length) cov = inferCovered(ed.podcast.turns, podStories);
ed.podcast.covered = [...new Set(cov)];
if (isAI) ed.podcast.mmh = !!out.podcast.mmh;
const byId = new Map(podStories.map(x => [x.id, x]));
recordAired(date, ed.podcast.show, ed.podcast.covered.map(id => byId.get(id)).filter(Boolean));
try { const hp = path.join(ROOT, 'data', 'history.json'), h = JSON.parse(fs.readFileSync(hp, 'utf8')), r = h.find(x => x.date === date); if (r) { r.mmh = ed.podcast.mmh || undefined; fs.writeFileSync(hp, JSON.stringify(h)); } } catch { /* chưa có lịch sử */ }
delete ed.podcast.audio;                      // GitHub sẽ tạo lại giọng đọc
if (process.env.DAILY_VOICE) ed.podcast.voiceReq = { engine: process.env.DAILY_VOICE, preset: process.env.DAILY_VOICES || '' };
ed.writer = 'claude-code'; ed.updated = new Date().toISOString();
fs.writeFileSync(fp, JSON.stringify(ed));
const ip = path.join(ROOT, 'data', 'index.json'), idx = JSON.parse(fs.readFileSync(ip, 'utf8'));
const row = idx.editions.find(e => e.date === date); const ld = ed.stories[ed.lead]; if (row) Object.assign(row, { writer: 'claude-code', words, title: out.podcast.title }, ld ? { lead: ld.h_en || ld.t } : {});
idx.updated = ed.updated; fs.writeFileSync(ip, JSON.stringify(idx));
console.log(`Đã ghi số ${date}: ${out.stories.length} tin · ${turns.length} lượt lời · ${words} từ (≈ ${Math.round(words / 150)} phút). Đẩy lên main để GitHub tạo giọng + đăng trang.`);
