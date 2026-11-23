// MMH Daily — gom tin: RSS báo chính thống (Việt + Anh) + Google News + cổng văn bản ⇒ data/pool.json (4 ngày gần nhất).
// Mỗi tin: mảng (health/economy/politics/society), nhãn chuyên sâu y tế (tender/policy/invest/hospital/device), điểm.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DAY, norm, hasKw, tkey, idOf, parseFeed, parseDate, get, host, gnUrl, strip, dec, findDocs, iso } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const NOW = process.env.DAILY_NOW ? new Date(process.env.DAILY_NOW) : new Date();
const POOL = path.join(ROOT, 'data', 'pool.json');

function trustedName(u) {
  let h = host(u);
  while (h) { if (CFG.trusted[h]) return [h, CFG.trusted[h]]; const i = h.indexOf('.'); if (i < 0) break; h = h.slice(i + 1); }
  return null;
}
const KW = Object.fromEntries(Object.entries(CFG.kw).map(([k, v]) => [k, v]));
const count = (n, list) => list.reduce((s, k) => s + (hasKw(n, k) ? 1 : 0), 0);
/** bỏ tiền tố nguồn ở đầu mô tả: "SKĐS - ", "(Chinhphu.vn) - ", "TTO - ", "VTV.vn - "… */
const dePrefix = s => String(s || '').replace(/^\s*\(?[\p{L}\d&.\s]{2,22}\)?\s*[-–—:]\s+/u, m => (/\s\S+\s\S+\s\S+/.test(m.trim()) ? m : '')).trim();
const CRIME = ['tạm giữ', 'khởi tố', 'bắt giữ', 'truy nã', 'sàm sỡ', 'cướp', 'trộm', 'giết', 'án mạng', 'lừa đảo', 'arrested', 'murder', 'robbery'];

/* ── AI & Công nghệ (24/11/2026, người dùng yêu cầu): lãnh đạo OpenAI · Anthropic · Meta · Google · NVIDIA…, mô hình / công nghệ mới, AI trong sales & marketing.
   Chỉ nguồn quốc tế tiếng Anh (không lấy nguồn Việt Nam). Kênh chung chung (podcast, marketing) chỉ nhận bài / video nói về AI. */
export function classifyAI(it, feed) {
  const n = norm(it.title + ' ' + (it.desc || '')), nt = norm(it.title);
  const k = it.k || feed.kind || '';
  const core = count(n, KW.ai_core), coreT = count(nt, KW.ai_core), people = count(n, KW.ai_people);
  if (/#shorts?\b/i.test(it.title + ' ' + (it.desc || '').slice(0, 120))) return null;               // bỏ YouTube Shorts
  if (k !== 'lab' && !coreT && core < 2 && !(people && core)) return null;
  const tags = [];
  if (people) tags.push('people');
  if (count(n, KW.ai_model) >= (coreT ? 1 : 2)) tags.push('model');
  if (count(n, KW.ai_agent)) tags.push('agent');
  if (count(n, KW.ai_biz) || k === 'salesmkt') tags.push('salesmkt');
  if (count(n, KW.ai_med)) tags.push('aimed');
  if (count(n, KW.ai_rules)) tags.push('airules');
  if (count(n, KW.ai_chips)) tags.push('chips');
  if (count(n, KW.ai_research)) tags.push('research');
  if (feed.yt || /youtube\.com|youtu\.be/.test(it.link || it.u || '')) tags.push('video');
  const has = t => tags.includes(t), v = it.views || 0;
  const score = 2 + Math.min(core, 5) * 0.5 + (coreT ? 1 : 0) + (people ? 2 : 0) + (has('salesmkt') ? 1.5 : 0) + (has('aimed') ? 1.5 : 0) + (has('model') ? 1 : 0) + (has('agent') ? 1 : 0)
    + ({ lab: 1.5, voice: 2, people: 1, salesmkt: 0.5, talk: 0.5 }[k] || 0) + (v ? Math.max(0, Math.min(3, Math.log10(v) - 3.5)) : 0);
  return { sec: 'ai', tags, docs: [], score, mmh: 0 };
}
const keepOf = x => (CFG.sections[x.sec]?.keepDays || CFG.keepDays) * DAY;
const YT_F = path.join(ROOT, 'data', 'yt.json');
/** YouTube: tên kênh (@handle) ⇒ mã kênh UC… (đọc trang kênh, lưu data/yt.json 30 ngày); không đọc được ⇒ mã ghi sẵn trong config */
async function ytUrls(f) {
  let cache = {}; try { cache = JSON.parse(fs.readFileSync(YT_F, 'utf8')); } catch { /* lần đầu */ }
  const out = [];
  for (const c of f.yt) {
    let id = cache[c.h]?.id;
    if (!id || NOW - new Date(cache[c.h].at) > 30 * DAY) {
      try {
        const html = await get('https://www.youtube.com/' + c.h, 1);
        const m = html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) || html.match(/itemprop="identifier" content="(UC[\w-]{22})"/);
        if (m) { id = m[1]; cache[c.h] = { id, at: iso(NOW) }; }
      } catch { /* trang kênh không đọc được ⇒ dùng mã ghi sẵn */ }
    }
    id = id || c.id;
    if (id) out.push({ u: 'https://www.youtube.com/feeds/videos.xml?channel_id=' + id, meta: c });
    else console.log(`    YouTube ${c.h}: chưa tìm được mã kênh`);
  }
  fs.writeFileSync(YT_F, JSON.stringify(cache, null, 1));
  return out;
}
/** mô tả video / blog: bỏ link, hashtag, dòng quảng cáo */
const cleanDesc = s => String(s || '').replace(/https?:\/\/\S+/g, ' ').replace(/#\w+/g, ' ').replace(/\b(subscribe|sponsor(ed)?|patreon|discount code|use code|affiliate)\b[^.!?]*[.!?]?/gi, ' ').replace(/\s+/g, ' ').trim();

const MW = CFG.mmhWeight || {};
const TAGK = [['dental', 'dental'], ['eye', 'eye'], ['tender', 'health_tender'], ['device', 'device'], ['insurance', 'insurance'], ['surgery', 'surgery'],
  ['policy', 'health_policy'], ['hospital', 'hospital'], ['invest', 'public_invest'], ['market', 'market']];
/** Phân mảng + nhãn + điểm. Điểm ưu tiên tin ảnh hưởng tới kinh doanh MMH (nha khoa, nhãn khoa, thiết bị, thầu, BHYT, thị trường). */
export function classify(it, feed) {
  const n = norm(it.title + ' ' + it.desc), nt = norm(it.title);
  const health = count(n, CFG.health_core) + count(nt, CFG.health_core);
  const spec = count(n, KW.dental) + count(n, KW.eye);
  const sc = {
    health: health * 2 + spec * 3 + (feed.sec === 'health' ? 3 : 0),
    economy: count(n, KW.economy) + (feed.sec === 'economy' ? 3 : 0),
    politics: count(n, KW.politics) + (feed.sec === 'politics' ? 3 : 0),
    society: count(n, KW.society) + (feed.sec === 'society' ? 3 : 0),
  };
  let sec = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
  if (sec[1] <= 0) return null;
  // Y tế: tiêu đề nói về y tế / nha khoa / nhãn khoa, hoặc nội dung nhắc nhiều (≥ 3). Kênh y tế mà tiêu đề không có từ y tế ⇒ xếp theo nội dung
  const hTitle = count(nt, CFG.health_core) + count(nt, KW.dental) + count(nt, KW.eye);
  if (hTitle || spec >= 2 || health >= 4 || (feed.sec === 'health' && health >= 3)) sec = ['health', Math.max(sc.health, 2)];
  else if (sec[0] === 'health') { const rest = Object.entries(sc).filter(([k]) => k !== 'health').sort((a, b) => b[1] - a[1])[0]; if (rest[1] <= 0) return null; sec = rest; }   // có nội dung y tế rõ ⇒ mảng Y tế
  const crime = count(n, CRIME) > 0 || count(nt, KW.crime || []) > 0;
  const tags = [];
  const anchor = count(nt, KW.health_anchor) + count(nt, KW.dental) + count(nt, KW.eye) > 0;   // tiêu đề nói về ngành y
  const japanBiz = count(n, KW.japan) > 0 && count(n, KW.biz) > 0;                               // Nhật Bản + kinh tế / y tế ⇒ thị trường
  if (sec[0] === 'health' && !crime) {
    for (const [t, k] of TAGK) {
      if (t === 'policy') { if (anchor && count(nt, KW[k])) tags.push(t); continue; }                         // chính sách: tiêu đề phải nói về ngành y
      if (t === 'tender' || t === 'device' || t === 'insurance') { if (count(nt, KW[k]) || (anchor && count(n, KW[k]))) tags.push(t); continue; }
      if (t === 'market') { if (count(n, KW.market) || japanBiz) tags.push(t); continue; }
      if (count(n, KW[k])) tags.push(t);
    }
  } else if (!crime) { if (count(n, KW.public_invest)) tags.push('invest'); if (count(n, KW.market) || japanBiz) tags.push('market'); }
  const docs = findDocs(it.title + ' ' + it.desc, NOW).map(d => d.no);
  if (docs.length && !tags.includes('policy')) tags.push('policy');
  // liên quan MMH: tổng trọng số nhãn (tối đa 9); tin ca bệnh / tai nạn không có góc kinh doanh ⇒ trừ điểm
  const bizTag = tags.some(t => ['dental', 'eye', 'tender', 'device', 'insurance', 'market'].includes(t));
  // tin ngành y nhưng xa MMH (an toàn thực phẩm, thuốc lá, vắc xin…) ⇒ giảm điểm liên quan
  const mmh = Math.max(0, Math.min(9, tags.reduce((s, t) => s + (MW[t] || 0), 0)) - (!bizTag && count(n, KW.lowrel) ? 3 : 0));
  const story = count(nt, KW.case) > 0 && !bizTag;
  const advice = count(nt, KW.advice) > 0 && !tags.some(t => ['tender', 'device', 'insurance', 'market'].includes(t));   // bài tư vấn sức khoẻ cho người bệnh
  const plainEcon = sec[0] === 'economy' && !tags.length;
  let score = (crime ? -3 : 0) + (story ? -3 : 0) + (advice ? -3 : 0) + (plainEcon ? -1.5 : 0) + CFG.sections[sec[0]].w + Math.min(sec[1], 6) * 0.4 + mmh + (docs.length ? 1.5 : 0)
    + ((count(nt, KW.dental) + count(nt, KW.eye)) ? 2 : 0);
  return { sec: sec[0], tags, docs, score, mmh };
}

async function main() {
  fs.mkdirSync(path.dirname(POOL), { recursive: true });
  let prev = { items: [] };
  try { prev = JSON.parse(fs.readFileSync(POOL, 'utf8')); } catch { /* lần đầu */ }
  const since = NOW - CFG.keepDays * DAY, sinceMax = NOW - Math.max(CFG.keepDays, ...Object.values(CFG.sections).map(s => s.keepDays || 0)) * DAY;
  const byId = new Map(prev.items.filter(x => NOW - new Date(x.d) <= keepOf(x)).map(x => [x.id, x]));
  // chấm lại tin cũ theo luật hiện tại (đổi từ khoá / trọng số thì kho cũ cũng theo)
  for (const x of byId.values()) {
    if (x.kind === 'doc') continue;
    if (x.sec === 'ai') { const c = classifyAI({ title: x.t, desc: x.sum || '', views: x.views, k: x.fk, link: x.u }, { kind: x.fk });
      if (!c) byId.delete(x.id); else Object.assign(x, { tags: c.tags, sc: +c.score.toFixed(2) }); continue; }
    const c = classify({ title: x.t, desc: x.sum || '' }, { sec: x.fsec !== undefined ? x.fsec : (x.sec === 'health' ? 'health' : null) });
    if (!c) { byId.delete(x.id); continue; }
    Object.assign(x, { sec: c.sec, tags: c.tags.length ? c.tags : undefined, mmh: c.mmh || undefined, sc: +c.score.toFixed(2) });
  }
  const byKey = new Map([...byId.values()].map(x => [tkey(x.t), x.id]));
  const status = [];

  for (const f of CFG.feeds) {
    const ai = f.sec === 'ai';
    const urls = f.gnews ? f.gnews.map(q => ({ u: gnUrl(q, f.lang) })) : f.yt ? await ytUrls(f) : f.urls.map(u => ({ u }));
    const st = { id: f.id, lang: f.lang, ok: 0, n: 0, kept: 0, err: [] };
    for (const { u, meta } of urls) {
      let xml;
      try { xml = await get(u); } catch (e) { st.err.push(u.replace(/^https?:\/\//, '').slice(0, 50) + ': ' + e.message); continue; }
      const items = parseFeed(xml, f.datefmt);
      if (meta) items.forEach(it => { it.k = meta.k; it.ch = it.author || meta.name || ''; });
      if (items.length) st.ok++;
      st.n += items.length;
      for (const it of items) {
        if (!it.title || !it.link) continue;
        const tn = trustedName(f.gnews ? it.srcUrl : it.link);
        if (!tn) continue;
        if (f.gnews && it.src) { it.title = it.title.replace(new RegExp('\\s+-\\s+' + it.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), ''); it.desc = ''; }
        if (it.title.length < (ai ? 12 : 25) || (!ai && it.title === it.title.toUpperCase())) continue;
        if (ai) it.desc = cleanDesc(it.desc).slice(0, 600);
        if (!ai && KW.entertainment && count(norm(it.title + ' ' + (it.desc || '')), KW.entertainment)) { st.skipEnt = (st.skipEnt || 0) + 1; continue; }   // bỏ tin giải trí / thể thao (người dùng yêu cầu 23/11/2026)
        const d = it.date || NOW;
        if (NOW - d > (ai ? keepOf({ sec: 'ai' }) : NOW - since) || d - NOW > DAY / 2) continue;
        const c = ai ? classifyAI(it, f) : classify(it, f);
        if (!c) continue;
        const id = idOf(it.link), k = tkey(it.title);
        if (byKey.has(k) && byKey.get(k) !== id) { const x = byId.get(byKey.get(k)); if (x && !x.also?.includes(tn[1]) && x.src !== tn[1]) (x.also ||= []).push(tn[1]); continue; }
        byKey.set(k, id);
        const o = byId.get(id);
        byId.set(id, { ...(o || {}), id, t: it.title, u: it.link, d: iso(d), src: (ai && it.ch) || tn[1], dom: tn[0], lang: f.lang,
          ...(ai ? { fk: it.k || f.kind, views: it.views || undefined, by: it.author && !it.ch ? it.author.slice(0, 60) : undefined } : {}),
          sum: dePrefix((it.desc || '').replace(it.title, '')).slice(0, 400) || undefined, img: it.img || o?.img || undefined,
          sec: c.sec, fsec: f.sec ?? null, tags: c.tags.length ? c.tags : undefined, mmh: c.mmh || undefined, docs: c.docs.length ? c.docs : undefined, sc: +c.score.toFixed(2), first: o?.first || iso(NOW) });
        st.kept++;
      }
    }
    status.push(st);
    console.log(`${st.ok ? 'OK ' : 'LỖI'} ${f.id.padEnd(8)} ${f.lang} tin ${st.n} · nhận ${st.kept}${st.err.length ? ' · ' + st.err.join('; ') : ''}`);
  }

  // Văn bản mới của Chính phủ (y tế / đấu thầu / đầu tư công)
  for (const s of CFG.docSites || []) {
    try {
      const html = await get(s.url);
      let kept = 0;
      for (const row of html.split(/<tr[\s>]/i).slice(1)) {
        const code = strip((row.match(/class="code"[^>]*>([\s\S]*?)<\/span>/) || [])[1]);
        const title = strip((row.match(/class="substract"[^>]*>([\s\S]*?)<\/span>/) || [])[1]);
        const date = parseDate(strip((row.match(/class="issued-date[^"]*"[^>]*>([\s\S]*?)<\/span>/) || [])[1]), 'dmy');
        const href = (row.match(/href='([^']*docid=\d+[^']*)'/) || [])[1];
        if (!code || !title || !href || !date || date < since) continue;
        const n = norm(title);
        const sec = count(n, CFG.health_core) ? 'health' : (count(n, KW.public_invest) || count(n, KW.economy)) ? 'economy' : null;
        if (!sec || /UBND|HĐND|VBHN/.test(code)) continue;
        const u = new URL(dec(href), s.url).href, id = idOf(u);
        byId.set(id, { ...(byId.get(id) || {}), id, t: `${code}: ${title}`, u, d: iso(date), src: s.name, dom: host(s.url), lang: 'vi', sec, kind: 'doc',
          tags: ['policy'], docs: [code], sc: CFG.sections[sec].w + 4, first: byId.get(id)?.first || iso(NOW) });
        kept++;
      }
      status.push({ id: s.id, lang: 'vi', ok: 1, n: 0, kept, err: [] });
      console.log(`OK  ${s.id.padEnd(8)} vi văn bản liên quan ${kept}`);
    } catch (e) { status.push({ id: s.id, lang: 'vi', ok: 0, n: 0, kept: 0, err: [e.message] }); console.log(`LỖI ${s.id} ${e.message}`); }
  }

  const items = [...byId.values()].filter(x => NOW - new Date(x.d) <= keepOf(x) && new Date(x.d) >= sinceMax).sort((a, b) => b.d.localeCompare(a.d));
  fs.writeFileSync(POOL, JSON.stringify({ updated: iso(NOW), status, items }));
  // danh mục nguồn + chủ đề cho app (ô chọn khi bấm "Tổng hợp ngay"): số tin 48 giờ qua của từng báo / chủ đề
  const recent = items.filter(x => NOW - new Date(x.d) <= 2 * DAY);
  const nDom = {}; for (const x of recent) nDom[x.dom] = (nDom[x.dom] || 0) + 1;
  const topicN = t => recent.filter(x => (t.tags || []).some(g => x.tags?.includes(g)) || (t.secs || []).includes(x.sec)).length;
  fs.writeFileSync(path.join(ROOT, 'data', 'sources.json'), JSON.stringify({ updated: iso(NOW),
    groups: CFG.outletGroups.map(g => ({ id: g.id, vi: g.vi, outlets: g.doms.map(d => ({ dom: d, name: CFG.trusted[d] || d, n: nDom[d] || 0 })) })),
    topics: CFG.topics.map(t => ({ id: t.id, vi: t.vi, en: t.en, n: topicN(t) })),
    voice: { engines: CFG.voice.engines, presets: CFG.voice.presets.map(p => ({ id: p.id, vi: p.vi, f: { name: p.f.name, preview: p.f.preview }, m: { name: p.m.name, preview: p.m.preview } })) } }));
  const by = {}; for (const x of items) by[x.sec + '/' + x.lang] = (by[x.sec + '/' + x.lang] || 0) + 1;
  console.log(`\nKho tin: ${items.length} · ${JSON.stringify(by)}`);
  if (!status.some(s => s.ok)) process.exit(1);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
