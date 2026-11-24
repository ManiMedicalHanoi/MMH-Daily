// MMH Daily — CHUYÊN ĐỀ (25/11/2026, người dùng: "đi sâu vào một chủ đề — đấu thầu chỉ đọc Báo Đấu Thầu, văn bản pháp quy từ Thư viện Pháp luật
// về đấu thầu & trang thiết bị y tế, glôcôm, bệnh võng mạc, xu hướng & kỹ thuật điều trị mới, tài liệu của các hãng; thông tin luôn mới, không trùng tin cũ").
// Mỗi chuyên đề (deep.json) = nguồn riêng + chỉ tên miền cho phép + từ khoá bắt buộc + cửa sổ dài (60–365 ngày).
// Kho CỘNG DỒN data/deep/<id>.json (mới nhất trước): mỗi bài nhớ `first` (lần đầu thấy) ⇒ app đánh dấu "Mới"; cùng sự kiện ở báo khác ⇒ 1 bài + "cũng đăng trên".
// Nguồn: RSS · Google News (site:…) · Europe PMC (bài báo khoa học có tóm tắt, chỉ tạp chí đầu ngành theo ISSN) · văn bản Chính phủ.
//   node tools/deep.mjs                    — mọi chuyên đề
//   DEEP_TOPICS=glaucoma,dauthau node …    — một số chuyên đề
//   DEEP_OUT=<thư mục> node …              — ghi ra nơi khác (thử nguồn, không đụng data/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DAY, iso, vnDay, get, gnUrl, parseFeed, host, idOf, norm, hasKw, strip, dec, parseDate, findDocs } from './lib.mjs';
import { translate } from './translate.mjs';
import { wordsOf } from './aired.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'deep.json'), 'utf8'));
const BASE = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const NOW = process.env.DAILY_NOW ? new Date(process.env.DAILY_NOW) : new Date();
const OUT = process.env.DEEP_OUT || path.join(ROOT, 'data', 'deep');
const ONLY = String(process.env.DEEP_TOPICS || '').split(',').map(s => s.trim()).filter(Boolean);
const MT = process.env.DAILY_MT !== '0';
const MT_MAX = +(process.env.DEEP_MT_MAX || 260);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── nguồn & mức uy tín ──
const GROUP_TIER = { gov: 'gov', health: 'pro', vn: 'press', biz: 'press', en: 'press', intl: 'press' };
const BASE_TIER = {};
for (const g of BASE.outletGroups || []) for (const d of g.doms || []) if (GROUP_TIER[g.id]) BASE_TIER[d] = GROUP_TIER[g.id];
/** tên miền ⇒ [tên miền khớp, tên nguồn, mức] (khớp cả tên miền con: dmec.moh.gov.vn ⇒ moh.gov.vn) */
export function domInfo(d) {
  d = String(d || '').replace(/^www\./, '').toLowerCase();
  for (let x = d; x && x.includes('.'); x = x.slice(x.indexOf('.') + 1)) {
    if (CFG.doms[x]) return [x, CFG.doms[x][0], CFG.doms[x][1]];
    if (BASE.trusted?.[x] && BASE_TIER[x]) return [x, BASE.trusted[x], BASE_TIER[x]];
  }
  return null;
}
const allowed = (t, dom, tier) => (t.doms ? t.doms.some(a => dom === a || dom.endsWith('.' + a)) : (t.tiers || []).includes(tier));

// ── chữ ──
/** từ khoá: cả từ (hasKw); riêng "ai" chỉ khớp chữ AI viết hoa (tiếng Việt "ai" = who) */
const kwHit = (raw, n, k) => (k === 'ai' ? /\bAI\b/.test(raw) : hasKw(n, k));
const countKw = (raw, n, list) => (list || []).reduce((s, k) => s + (kwHit(raw, n, k) ? 1 : 0), 0);
const ENT = [...(BASE.kw.entertainment || []), 'cầu thủ', 'tiền đạo', 'tiền vệ', 'hậu vệ', 'thủ môn', 'huấn luyện viên', 'ngoại hạng anh', 'premier league', 'champions league',
  'la liga', 'footballer', 'striker', 'midfielder', 'goalkeeper', 'nba', 'pop star', 'actress', 'singer', 'rapper', 'hollywood', 'oscar', 'hoa hậu'];
const ADVICE = [...(BASE.kw.advice || []), 'nên ăn', 'thực phẩm tốt', 'món ăn', 'bài thuốc', 'mẹo', 'cách chăm sóc', 'tips', 'what to know', 'what is'];
const CASE = BASE.kw.case || [];
const TECH = ['kỹ thuật', 'phẫu thuật', 'laser', 'lần đầu', 'thành công', 'triển khai', 'hội nghị', 'hội thảo', 'công nghệ', 'thiết bị', 'nghiên cứu', 'thử nghiệm', 'robot', 'ai',
  'technique', 'surgery', 'surgical', 'device', 'trial', 'study', 'approval', 'fda', 'launch', 'launches', 'new', 'first', 'innovation', 'technology', 'guideline'];
const CRIME = ['tạm giữ', 'khởi tố', 'bắt giữ', 'truy nã', 'lừa đảo', 'giết', 'án mạng', 'arrested', 'murder', 'lawsuit'];
const JUNK = /\b(weekly|newsletter|insert issue|issue \d|photos?|webinar|symposium|podcast|e-?connect|journal update|case challenge|editorial|table of contents|in this issue)\b|^(nl|de|uk|us|fr)\s-\s/i;
const DOC_HEAD = /^(nghị định|thông tư|quyết định|luật|nghị quyết|chỉ thị|công văn|dự thảo)\b/i;
const cleanGnTitle = (t, src) => (src ? t.replace(new RegExp('\\s+-\\s+' + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '') : t).trim();
const titleCase = s => String(s || '').replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(Of|And|The|In|For|On)\b(?!$)/g, w => w.toLowerCase()).replace(/^the\b/, 'The');

// ── Europe PMC: bài báo khoa học có tóm tắt ──
const PT_BAD = /erratum|retract|comment|editorial|letter|news|interview|biography|portrait/i;
function absPick(abs) {
  const t = strip(String(abs || '').replace(/<\/?(h\d|b|strong)[^>]*>/gi, m => (/^<\//.test(m) ? ': ' : ' '))).replace(/\s+/g, ' ').replace(/\s*:\s*:/g, ':').trim();
  const m = [...t.matchAll(/\b(conclusions? and relevance|conclusions?|clinical relevance|interpretation|clinical significance)\s*[:.]\s*/gi)].pop();
  if (m) return t.slice(m.index + m[0].length).slice(0, 460).replace(/\s+\S*$/, t.length - m.index > 460 ? '…' : '');
  const body = t.replace(/^(purpose|background|objectives?|aims?|introduction|importance|precis|topic)\s*[:.]\s*/i, '');
  const s = (body.match(/[^.!?]+[.!?]+/g) || [body]).slice(0, 2).join(' ').trim();
  return s.slice(0, 460);
}
async function epmc(src, keepDays) {
  const from = vnDay(+NOW - Math.min(keepDays, 180) * DAY), to = vnDay(NOW);
  const q = `(${src.terms.map(t => `TITLE:"${t}"`).join(' OR ')}) AND (${src.issn.map(s => `ISSN:"${s}"`).join(' OR ')}) AND FIRST_PDATE:[${from} TO ${to}] AND HAS_ABSTRACT:y`;
  const base = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=40&query=' + encodeURIComponent(q);
  let err;
  for (const s of ['&sort=' + encodeURIComponent('P_PDATE_D desc'), '']) {
    try {
      const j = JSON.parse(await get(base + s));
      return (j.resultList?.result || []).filter(r => r.title && (r.doi || r.pmid) && !PT_BAD.test((r.pubTypeList?.pubType || []).join(' '))).map(r => {
        const jr = titleCase(r.journalInfo?.journal?.title || r.journalTitle || 'Journal');
        const d = r.firstPublicationDate ? new Date(r.firstPublicationDate + 'T00:00:00+07:00') : NOW;
        return { id: 'pm' + (r.pmid || idOf(r.doi)), t: strip(r.title).replace(/\.$/, ''), u: r.doi ? 'https://doi.org/' + r.doi : 'https://europepmc.org/article/MED/' + r.pmid,
          d: iso(d), src: jr, dom: 'europepmc.org', tier: 'sci', kind: 'study', lang: 'en', sum: absPick(r.abstractText), jr, doi: r.doi || undefined,
          oa: r.isOpenAccess === 'Y' || undefined, cited: +r.citedByCount || undefined };
      });
    } catch (e) { err = e; }
  }
  throw err;
}

// ── văn bản Chính phủ (vanban.chinhphu.vn) ──
async function vbcp(src, t, since) {
  const html = await get(src.u), out = [];
  for (const row of html.split(/<tr[\s>]/i).slice(1)) {
    const code = strip((row.match(/class="code"[^>]*>([\s\S]*?)<\/span>/) || [])[1]);
    const title = strip((row.match(/class="substract"[^>]*>([\s\S]*?)<\/span>/) || [])[1]);
    const date = parseDate(strip((row.match(/class="issued-date[^"]*"[^>]*>([\s\S]*?)<\/span>/) || [])[1]), 'dmy');
    const href = (row.match(/href='([^']*docid=\d+[^']*)'/) || [])[1];
    if (!code || !title || !href || !date || date < since || /UBND|HĐND|VBHN/.test(code)) continue;
    const n = norm(title); if (!countKw(title, n, t.kw)) continue;
    const u = new URL(dec(href), src.u).href;
    out.push({ id: idOf(u), t: `${code}: ${title}`, u, d: iso(date), src: 'Văn bản Chính phủ', dom: 'vanban.chinhphu.vn', tier: 'gov', kind: 'doc', lang: 'vi', docs: [code] });
  }
  return out;
}

// ── một nguồn RSS / Google News ⇒ bài hợp lệ của chuyên đề ──
async function feed(src, t, since) {
  const gn = src.t === 'gn', xml = await get(gn ? gnUrl(src.q, src.lang) : src.u);
  const out = [], seen = { n: 0, dom: 0, kw: 0, junk: 0, old: 0 };
  for (const it of parseFeed(xml)) {
    if (!it.title || !it.link) continue;
    seen.n++;
    const di = domInfo(host(gn ? it.srcUrl : it.link));
    if (!di || !allowed(t, di[0], di[2])) { seen.dom++; continue; }
    const title = gn ? cleanGnTitle(it.title, it.src) : it.title, desc = gn ? '' : strip(it.desc).slice(0, 600);
    if (title.length < 20) continue;
    const raw = title + ' ' + desc, n = norm(raw), nt = norm(title);
    const d = it.date || NOW;
    if (d < since || d - NOW > DAY / 2) { seen.old++; continue; }
    if (countKw(raw, n, ENT) || countKw(raw, n, t.not)) { seen.junk++; continue; }
    // TIÊU ĐỀ (RSS: tiêu đề + tóm tắt) phải có từ khoá của chuyên đề — Google News khớp cả chữ trong thân bài / cột bên nên dễ lạc đề.
    // Riêng nguồn 'loose' (trang chỉ viết về đúng chủ đề, vd. Glaucoma Today) nhận theo truy vấn.
    if (!src.loose && !countKw(gn ? title : raw, gn ? nt : n, t.kw)) { seen.kw++; continue; }
    if (JUNK.test(title) || title.split(/\s+/).length < 5) { seen.junk++; continue; }   // số báo / bản tin tuần / ảnh / hội thảo trực tuyến
    const clinical = t.group !== 'law';
    const crime = countKw(title, nt, CRIME) > 0, advice = countKw(title, nt, ADVICE) > 0, tech = countKw(raw, n, TECH) > 0;
    if (clinical && crime) { seen.junk++; continue; }
    if (clinical && di[2] === 'press' && advice && !tech) { seen.junk++; continue; }   // bài tư vấn sức khoẻ cho người bệnh, không có kỹ thuật / xu hướng ⇒ bỏ
    const docs = findDocs(raw, NOW).map(x => x.no);
    const kind = di[2] === 'pr' ? 'pr' : (t.group === 'law' && (docs.length || DOC_HEAD.test(title))) ? 'doc' : 'news';
    out.push({ id: idOf(it.link), t: title, u: it.link, d: iso(d), src: di[1] || it.src, dom: di[0], tier: di[2], kind, lang: src.lang || (/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(title) ? 'vi' : 'en'),
      sum: desc ? desc.replace(title, '').trim().slice(0, 420) || undefined : undefined, docs: docs.length ? docs : undefined,
      _adv: advice || undefined, _case: (countKw(title, nt, CASE) > 0 && !tech) || undefined, _tech: tech || undefined, _kwt: countKw(title, nt, t.kw) });
  }
  return { items: out, seen };
}

// ── gộp trùng: cùng mã / cùng DOI / tiêu đề gần giống (cùng sự kiện, báo khác đăng lại) ──
const W = CFG.tierW || {};
const better = (a, b) => ((W[a.tier] || 0) - (W[b.tier] || 0)) || (a.sum ? 1 : 0) - (b.sum ? 1 : 0) || String(b.first || b.d).localeCompare(String(a.first || a.d));
export function dedupe(items) {
  const keep = [], byId = new Map(), byDoi = new Map();
  const sig = x => new Set(wordsOf(x.t));
  for (const x of items.sort((a, b) => better(b, a))) {
    if (byId.has(x.id)) { const k = byId.get(x.id); Object.assign(k, { ...x, ...k, first: k.first < x.first ? k.first : x.first }); continue; }
    if (x.doi && byDoi.has(x.doi)) continue;
    const S = sig(x);
    const dup = S.size >= 4 && keep.find(k => { if (k.lang !== x.lang) return false; const K = k._sig; let n = 0; for (const w of S) if (K.has(w)) n++; return n >= 4 && n / Math.min(S.size, K.size) >= 0.6; });
    if (dup) {
      if (dup.src !== x.src && !(dup.also || []).includes(x.src)) (dup.also ||= []).push(x.src);
      if (x.first && x.first < dup.first) dup.first = x.first;
      continue;
    }
    x._sig = S; keep.push(x); byId.set(x.id, x); if (x.doi) byDoi.set(x.doi, x);
  }
  keep.forEach(x => delete x._sig);
  return keep;
}

/** điểm nổi bật (sắp xếp "Nổi bật", podcast chọn bài): mức uy tín + từ khoá ở tiêu đề + kỹ thuật / xu hướng + nhiều báo cùng đưa − bài tư vấn / ca bệnh */
export const scoreOf = x => +((W[x.tier] || 1) + Math.min(3, x._kwt || 0) * 0.6 + (x._tech ? 1 : 0) + Math.min(3, (x.also || []).length) * 0.6
  + (x.kind === 'doc' ? 1 : 0) + (x.kind === 'study' && x.cited ? Math.min(1, x.cited / 10) : 0) - (x._adv ? 2 : 0) - (x._case ? 1.5 : 0)).toFixed(2);

// ── từ vựng của chuyên đề: thuật ngữ chuẩn (context/glossary.tsv) xuất hiện trong các bài ──
const GLOSS = (() => {
  try {
    return fs.readFileSync(path.join(ROOT, 'context', 'glossary.tsv'), 'utf8').split('\n').slice(1).map(l => l.split('\t')).filter(r => r[0] && r[1]).map(([en, vi, dm]) => {
      const main = en.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\/.*$/, '').trim(), abbr = (en.match(/\(([A-Z0-9-]{2,8})\)/) || [])[1];
      // bỏ thuật ngữ có ghi chú ngữ cảnh "(Primary Teeth)", có "/", hoặc là một chữ thông thường (Control, Root, Skin…)
      if (/\([^)]*[a-z][^)]*\)/.test(en) || /\//.test(en) || (!main.includes(' ') && main.length < 8 && !abbr)) return null;
      return { en: en.trim(), vi: vi.trim(), dm: (dm || '').trim(), keys: [main.toLowerCase(), abbr].filter(k => k && k.length >= 3) };
    }).filter(Boolean);
  } catch { return []; }
})();
function vocabOf(t, items) {
  const dm = { eye: ['eye', 'biz'], dental: ['dental', 'biz'], surgery: ['eye', 'biz'], law: ['biz'] }[t.group] || [];
  const texts = items.map(x => (x.lang === 'en' ? x.t + ' ' + (x.sum || '') : (x.h_en || '') + ' ' + (x.s_en || '')));
  const N = texts.map(s => norm(s));
  const out = [];
  for (const g of GLOSS) {
    if (!dm.includes(g.dm)) continue;
    let c = 0;
    N.forEach((n, i) => { if (g.keys.some(k => (/^[A-Z0-9-]+$/.test(k) ? new RegExp('\\b' + k + '\\b').test(texts[i]) : hasKw(n, k)))) c++; });
    if (c >= (items.length > 30 ? 2 : 1)) out.push([g.en, g.vi, c, g.keys]);
  }
  const seen = new Set();
  return out.sort((a, b) => b[2] - a[2] || a[0].length - b[0].length)
    .filter(([en, , , keys]) => { if (keys.some(k => seen.has(k))) return false; keys.forEach(k => seen.add(k)); return true; }).slice(0, 18).map(([en, vi, c]) => [en, vi, c]);
}

// ── chạy song song có giới hạn ──
async function pool(tasks, n) {
  const res = new Array(tasks.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (i < tasks.length) { const k = i++; try { res[k] = { ok: true, v: await tasks[k]() }; } catch (e) { res[k] = { ok: false, e }; } await sleep(350); }
  }));
  return res;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const topics = CFG.topics.filter(t => !ONLY.length || ONLY.includes(t.id));
  const report = [];
  const store = {};
  for (const t of topics) {
    const keepDays = t.keepDays || CFG.keepDays, since = new Date(+NOW - keepDays * DAY);
    const prev = readJson(path.join(ROOT, 'data', 'deep', t.id + '.json'), null) || readJson(path.join(OUT, t.id + '.json'), { items: [] });
    const first = !prev.items?.length;
    const tasks = t.src.map(s => () => (s.t === 'epmc' ? epmc(s, keepDays).then(items => ({ items, seen: { n: items.length } })) : s.t === 'vbcp' ? vbcp(s, t, since).then(items => ({ items, seen: { n: items.length } })) : feed(s, t, since)));
    const res = await pool(tasks, 3);
    const got = [], rep = { id: t.id, src: [] };
    res.forEach((r, i) => {
      const s = t.src[i], label = s.t === 'gn' ? 'gn ' + s.q.slice(0, 70) : s.t === 'epmc' ? 'epmc ' + s.terms.slice(0, 3).join('/') : s.t + ' ' + (s.u || '').replace(/^https?:\/\//, '').slice(0, 60);
      if (!r.ok) { rep.src.push({ s: label, err: String(r.e?.message || r.e).slice(0, 80) }); return; }
      got.push(...r.v.items); rep.src.push({ s: label, ok: r.v.items.length, ...r.v.seen });
    });
    const old = new Map((prev.items || []).map(x => [x.id, x]));
    const fresh = got.map(x => { const o = old.get(x.id); return { ...(o || {}), ...x, first: o?.first || (first ? x.d : iso(NOW)), h_vi: o?.h_vi, h_en: o?.h_en, s_vi: o?.s_vi, s_en: o?.s_en, mt: o?.mt }; });
    const merged = dedupe([...fresh, ...(prev.items || []).filter(x => !fresh.some(y => y.id === x.id))])
      .filter(x => new Date(x.d) >= since).sort((a, b) => b.d.localeCompare(a.d)).slice(0, t.max || CFG.max);
    rep.n = merged.length; rep.new = merged.filter(x => !old.has(x.id)).length; rep.got = got.length;
    store[t.id] = merged; report.push(rep);
    console.log(`${t.id.padEnd(9)} ${String(merged.length).padStart(3)} bài · mới ${rep.new} · lấy ${got.length} · ${rep.src.map(s => (s.err ? 'LỖI ' : '') + (s.ok ?? 0)).join(' / ')}`);
  }

  // ── dịch máy bài mới (tiêu đề + tóm tắt): tin Việt ⇒ tiếng Anh (để học), tin Anh ⇒ tiếng Việt (để hiểu) ──
  if (MT) {
    const all = [...new Map(Object.values(store).flat().map(x => [x.id, x])).values()];
    const need = all.filter(x => (x.lang === 'vi' ? !x.h_en : !x.h_vi)).sort((a, b) => b.d.localeCompare(a.d)).slice(0, MT_MAX);
    for (const [sl, tl] of [['vi', 'en'], ['en', 'vi']]) {
      const xs = need.filter(x => x.lang === sl); if (!xs.length) continue;
      try {
        const { out } = await translate(xs.flatMap(x => [x.t, (x.sum || '').slice(0, 320)]), sl, tl);
        xs.forEach((x, i) => { if (!out[2 * i]) return; const h = out[2 * i], s = out[2 * i + 1] || undefined;
          for (const arr of Object.values(store)) for (const y of arr) if (y.id === x.id) { if (tl === 'en') { y.h_en = h; y.s_en = s; } else { y.h_vi = h; y.s_vi = s; } y.mt = true; } });
        console.log(`Dịch máy ${sl}→${tl}: ${xs.length} bài`);
      } catch (e) { console.log('Bỏ qua dịch máy: ' + e.message); }
    }
  }

  // ── nhãn phần (chip lọc trong chuyên đề), điểm, ghi file ──
  const idx = readJson(path.join(OUT, 'index.json'), { topics: [] });
  const rows = new Map((idx.topics || []).map(r => [r.id, r]));
  for (const t of topics) {
    const items = store[t.id];
    for (const x of items) {
      const raw = [x.t, x.sum, x.h_en, x.h_vi, x.s_en].filter(Boolean).join(' '), n = norm(raw);
      x.sub = (t.subs || []).filter(s => countKw(raw, n, s.kw)).map(s => s.id);
      if (!x.sub.length) delete x.sub;
      x.sc = scoreOf(x);
    }
    const clean = items.map(x => { const o = { ...x }; for (const k of Object.keys(o)) if (k[0] === '_' || o[k] === undefined) delete o[k]; return o; });
    const vocab = vocabOf(t, items);
    fs.writeFileSync(path.join(OUT, t.id + '.json'), JSON.stringify({ id: t.id, updated: iso(NOW), vocab, items: clean }));
    const cnt = (f) => clean.filter(f).length;
    const srcN = {}; for (const x of clean) srcN[x.src] = (srcN[x.src] || 0) + 1;
    rows.set(t.id, {
      id: t.id, group: t.group, vi: t.vi, en: t.en, color: t.color, icon: t.icon, show: t.show, desc: t.desc, n: clean.length,
      new7: cnt(x => +NOW - new Date(x.first) <= 7 * DAY), fr: clean.map(x => x.first).sort().reverse().slice(0, 80), last: clean[0]?.d, updated: iso(NOW),
      kinds: Object.fromEntries(['news', 'doc', 'study', 'pr'].map(k => [k, cnt(x => x.kind === k)])),
      srcs: Object.entries(srcN).sort((a, b) => b[1] - a[1]).slice(0, 14),
      subs: (t.subs || []).map(s => ({ id: s.id, vi: s.vi, en: s.en, n: cnt(x => x.sub?.includes(s.id)) })),
      top: clean.slice(0, 3).map(x => ({ id: x.id, t: x.t, h_vi: x.h_vi, h_en: x.h_en, u: x.u, src: x.src, d: x.d, kind: x.kind, lang: x.lang, first: x.first })),
    });
  }
  // "Tin các hãng": thông tin của hãng ở mọi chuyên đề nhãn khoa / nha khoa / ngoại khoa
  const brands = [];
  for (const r of CFG.topics) { const f = readJson(path.join(OUT, r.id + '.json'), { items: [] }); for (const x of f.items || []) if (x.kind === 'pr') brands.push({ ...x, topic: r.id }); }
  fs.writeFileSync(path.join(OUT, '_brands.json'), JSON.stringify({ id: '_brands', updated: iso(NOW), items: dedupe(brands).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 80) }));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
    updated: iso(NOW), tierName: CFG.tierName, kindName: CFG.kindName, groups: CFG.groups,
    topics: CFG.topics.map(t => rows.get(t.id)).filter(Boolean), brands: brands.length,
  }));
  if (process.env.DEEP_REPORT) fs.writeFileSync(process.env.DEEP_REPORT, JSON.stringify(report, null, 1));
  const total = Object.values(store).reduce((s, a) => s + a.length, 0);
  console.log(`\nChuyên đề: ${topics.length} · ${total} bài${ONLY.length ? ' (chỉ ' + ONLY.join(', ') + ')' : ''}`);
  if (!report.some(r => r.src.some(s => s.ok))) process.exit(1);
}
export { main };
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
