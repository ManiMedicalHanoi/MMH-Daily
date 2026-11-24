// MMH Daily Podcast — ghép phần Claude viết cho MMH REPORT (bản tin nội bộ thứ Hai), kiểm tra, rồi KHOÁ vào hộp thư (data/inbox/) — không ghi bản rõ vào repo.
//   node tools/apply_in.mjs <số liệu .facts.json> <kết quả .json>
// Kết quả (xem REPORT.md ▸ 5):
//   { title:{vi,en}, intro:{vi,en},
//     sections:[{ key:'headline'|'sales'|'marketing'|'backoffice'|'followup'|'people'|'next', h_vi, h_en, vi, en }],
//     podcast:{ title, turns:[{ sp:'A', text, say?, vi }] },
//     memo:{ angle, order },             ← memo công khai (không có nội dung): kiểu mở đầu + thứ tự phần, để tập sau đổi cách
//     study:{ words, phrases, grammar, quiz } }   ← bài học (cùng mẫu số báo hằng ngày)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lint } from './style.mjs';
import { GLOSSARY, REPORT } from './shows.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const KEYS = ['headline', 'sales', 'marketing', 'backoffice', 'followup', 'people', 'next'];
const NEED = ['sales', 'marketing', 'backoffice', 'next'];
const TAG = /\[[a-z ,'-]{2,40}\]/gi;

export function check(F, out, { strict = true } = {}) {
  const err = [], hosts = F.show.hosts.map(h => h.id), turns = out.podcast?.turns || [];
  if (!out.title?.vi || !out.title?.en) err.push('thiếu title vi / en');
  if (strict && (!out.intro?.vi || !out.intro?.en)) err.push('thiếu intro vi / en');
  for (const x of out.sections || []) if (!KEYS.includes(x.key) || !x.vi || !x.en) err.push('mục lạ hoặc thiếu chữ: ' + x.key);
  if (strict) for (const k of NEED) if (!(out.sections || []).some(x => x.key === k)) err.push('thiếu mục ' + k);
  turns.forEach((t, i) => {
    if (!hosts.includes(t.sp)) err.push(`lượt ${i}: người nói ${t.sp} không có (${hosts})`);
    if (!t.text || !t.vi) err.push(`lượt ${i}: thiếu text / vi`);
    if (TAG.test(t.text || '') || TAG.test(t.vi || '')) err.push(`lượt ${i}: thẻ cảm xúc chỉ để trong "say", không để trong text / vi`);
    TAG.lastIndex = 0;
    if (t.say && (t.say.match(TAG) || []).length > 1) err.push(`lượt ${i}: tối đa 1 thẻ cảm xúc / lượt`);
  });
  err.push(...lint(turns));
  const words = turns.reduce((n, t) => n + String(t.text || '').split(/\s+/).filter(Boolean).length, 0);
  if (strict && turns.length < 16) err.push('kịch bản quá ngắn (' + turns.length + ' lượt)');
  if (strict && (words < 850 || words > 1900)) err.push(`kịch bản ${words} từ — cần 850–1.900 (≈ 6–12 phút)`);
  const blob = JSON.stringify(out);
  if (/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(blob) || /\b0\d{9,10}\b/.test(blob)) err.push('có email / số điện thoại — bỏ đi');
  if (strict && (!out.memo?.angle || !out.memo?.order)) err.push('thiếu memo.angle / memo.order');
  err.push(...checkStudy(out.study, turns.length, strict));
  return { err, words };
}

// Bài học (study.js): cùng mẫu với số báo hằng ngày (edition.mjs ▸ studyWrite). turn = số thứ tự lượt lời nghe thấy từ / câu đó.
export function checkStudy(st, n, strict = true) {
  const err = [];
  if (!st) { if (strict) err.push('thiếu study (bài học: words · phrases · grammar · quiz — REPORT.md ▸ 5)'); return err; }
  const okT = x => Number.isInteger(x.turn) && x.turn >= 0 && x.turn < n;
  if ((st.words || []).length < 8) err.push('study.words cần 8–12 từ');
  if ((st.phrases || []).length < 4) err.push('study.phrases cần 4–6 cụm');
  if ((st.grammar || []).length < 2) err.push('study.grammar cần 2–3 mẫu');
  if ((st.quiz || []).length < 6) err.push('study.quiz cần 6–8 câu');
  for (const [k, a] of Object.entries({ words: st.words, phrases: st.phrases, grammar: st.grammar, quiz: st.quiz })) (a || []).forEach((x, i) => { if (!okT(x)) err.push(`study.${k}[${i}]: turn sai`); });
  (st.quiz || []).forEach((q, i) => { if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || !(q.a >= 0 && q.a < 4) || !q.why) err.push(`study.quiz[${i}]: cần q, 4 opts, a 0–3, why`); });
  return err;
}

export function build(F, out, writer) {
  const speech = s => String(s).replace(/\bVND\b/g, 'dong').replace(/(\d)%/g, '$1 percent').replace(/\s+/g, ' ').trim();
  const turns = (out.podcast?.turns || []).map(t => ({ sp: t.sp, text: speech(t.text), ...(t.say && t.say !== t.text ? { say: speech(t.say) } : {}), vi: String(t.vi).trim() }));
  const text = turns.map(t => t.text).join(' ').toLowerCase();
  const show = F.show;
  return {
    kind: 'internal', series: 'report', date: F.date, week: F.week, prevWeek: F.prevWeek, nextWeek: F.nextWeek, ep: F.ep,
    updated: new Date().toISOString(), writer, facts: F.facts,
    title: out.title, intro: out.intro || { vi: '', en: '' }, sections: (out.sections || []).filter(x => KEYS.includes(x.key)),
    podcast: { show: 'report', name: show.name, anchor: show.anchor, hosts: show.hosts.map(h => ({ ...h, ...(hostFull(h)) })), color: show.color || '#9B2C2C',
      title: out.podcast?.title || `MMH Report · Episode ${F.ep}`, turns },
    ...(out.study ? { study: { words: out.study.words, phrases: out.study.phrases, grammar: out.study.grammar, quiz: out.study.quiz } } : {}),
    vocab: GLOSSARY.filter(([en]) => text.includes(en.toLowerCase())).slice(0, 8).map(([en, vi]) => ({ en, vi })),
    memo: { angle: String(out.memo?.angle || '').slice(0, 60), order: String(out.memo?.order || '').slice(0, 120) },
  };
}
function hostFull(h) {            // facts chỉ giữ id / tên / vai ⇒ lấy lại giọng đọc từ shows.mjs
  return REPORT.anchors.find(a => a.name === h.name) || {};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [factsF, outF] = process.argv.slice(2);
  const F = JSON.parse(fs.readFileSync(factsF, 'utf8')), out = JSON.parse(fs.readFileSync(outF, 'utf8'));
  const { err, words } = check(F, out);
  if (err.length) { console.error('KHÔNG GHI — sửa lại:\n- ' + err.join('\n- ')); process.exit(1); }
  const ed = build(F, out, 'claude-code');
  const tmp = path.join(path.dirname(factsF), F.date + '.json');
  fs.writeFileSync(tmp, JSON.stringify(ed));
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'inbox.mjs'), 'seal', tmp], { stdio: 'inherit' });
  fs.rmSync(factsF, { force: true }); fs.rmSync(outF, { force: true });
  console.log(`MMH Report tập ${F.ep} (${F.date}): ${ed.podcast.turns.length} lượt · ${words} từ (≈ ${Math.round(words / 150)} phút) · người dẫn ${F.show.anchor}. Bản rõ đã xoá.\n⇒ git add data/inbox && git commit -m "MMH Report tập ${F.ep}" && git push origin HEAD:main`);
}
