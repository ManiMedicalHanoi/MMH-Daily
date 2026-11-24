// MMH Daily Podcast — MMH REPORT (bản tin nội bộ sáng thứ Hai, từ 24/11/2026; thay "bản tin nội bộ Chủ nhật" cũ).
// Gom (CHỈ ĐỌC) tuần làm việc vừa qua (thứ Hai → Chủ nhật) của các nhóm VIỆT NAM: Report Hub Marketing + Back office, CRM Dental · Surgical · Eyeless
// (đi địa bàn, phản hồi khách, bước tiếp theo, đơn hàng), công tác, đào tạo, gói thầu trúng ⇒ số liệu gọn cho người viết (Claude).
// Có so sánh: tuần trước nữa (số đếm) + "kế hoạch đã hẹn cho tuần này" (việc có hạn gốc trong tuần: xong / dời / còn mở) ⇒ bản tin nối tiếp từng tuần.
// Nhóm Thái Lan KHÔNG đưa vào (người dùng chốt 24/11/2026).
//   WEEKLY_FACTS_ONLY=1 WEEKLY_OUT=<thư mục tạm> node tools/weekly.mjs   ⇒ <Chủ nhật>.facts.json (phiên Claude viết ⇒ tools/apply_in.mjs)
//   node tools/weekly.mjs                                                ⇒ GitHub Actions: có ANTHROPIC_API_KEY ⇒ Claude API viết, không có ⇒ bản mẫu ngắn
// KHÔNG in tên người / khách hàng ra log (log GitHub Actions của kho công khai ai cũng xem được) — chỉ in số đếm.
// KHÔNG gửi dữ liệu nội bộ cho Gemini gói miễn phí / dịch máy (Google có thể dùng dữ liệu gói miễn phí).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORT, reportShow, GLOSSARY } from './shows.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).internal;
const NOW = process.env.DAILY_NOW ? new Date(process.env.DAILY_NOW) : new Date();
const vn = d => new Date(+d + 7 * 36e5);
const addD = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// tuần kết thúc ở Chủ nhật gần nhất ĐÃ QUA (chạy thứ Hai ⇒ hôm qua; chạy Chủ nhật ⇒ hôm nay)
const END = process.env.WEEK_END || (() => { const d = vn(NOW); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(0, 10); })();
const START = addD(END, -6), P_START = addD(END, -13), P_END = addD(END, -7), N_START = addD(END, 1), N_END = addD(END, 7);
const OD_FROM = addD(START, -28);                       // quá hạn: chỉ xét 4 tuần gần nhất
const OUT = process.env.WEEKLY_OUT || path.join(process.env.RUNNER_TEMP || '/tmp', 'mmh-weekly');
const inR = (s, a, b) => !!s && s >= a && s <= b;
const inW = s => inR(s, START, END);
const day = v => { const s = String(v || '').trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
const S = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const cut = (v, n) => { const s = S(v); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const DONE = /done|complete|hoàn thành|xong|finished/i;
const DROP = /cancel|huỷ|hủy|skip|bỏ qua|stop/i;
const isTest = p => /^test/i.test(S(p));
const noPhone = s => String(s || '').replace(/\b0\d{8,10}\b/g, '…').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '…');

async function getJson(base, params, tries = 3) {
  const u = base + '?' + new URLSearchParams(params);
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(120000) });
      const t = await r.text();
      const j = JSON.parse(t.replace(/^[\w$.]+\(([\s\S]*)\);?\s*$/, '$1'));
      if (j && j.ok === false) throw new Error(j.error || j.code || 'lỗi');
      return j;
    } catch (e) { err = e; await new Promise(r => setTimeout(r, 3000 * (i + 1))); }
  }
  throw err;
}

// ── 1. Report Hub: việc của từng phòng ban, gom theo Key task ──
async function department(d) {
  const j = await getJson(d.url, { action: 'weekly', fresh: 1 });
  const dep = { id: d.id, name: d.name, count: { done: 0, active: 0, overdue: 0, notUpdated: 0, next: 0, prevDone: 0 },
    plan: { total: 0, done: 0, moved: 0, open: 0 }, keys: [], trips: [], overdue: [] };
  for (const k of j.keyTasks || []) {
    const key = S(k.keyTask);
    if (!key || /^text$/i.test(key) || isTest(k.pic)) continue;
    const isTrip = (k.subs || []).some(r => /^trip/i.test(S(r.vSrc))) || /^lịch công tác/i.test(key);
    const rows = (k.subs || []).length ? k.subs : [k];
    const items = [];
    for (const r of rows) {
      if (isTest(r.pic)) continue;
      const name = S(r.subTask || r.name) || key;
      const s0 = day(r.start), planned = day(r.planned), revised = day(r.revised), due = revised || planned, act = day(r.actual), st = S(r.status);
      const done = DONE.test(st) || +r.progress >= 100, drop = DROP.test(st);
      if (isTrip) { if (inR(s0, START, N_END) || inR(due, START, N_END)) dep.trips.push({ pic: S(r.pic), what: cut(name, 140), from: s0, to: due, report: cut(r.result, 200) }); continue; }
      const touchW = inW(act) || inW(due) || inW(s0) || (s0 && s0 < START && (!due || due > END));
      const it = { t: cut(name, 140), pic: S(r.pic), st: st || '—', pct: +r.progress || 0, from: s0, due, res: cut(noPhone(r.result), 260) };
      if (done && (inR(act, P_START, P_END) || (!act && inR(due, P_START, P_END)))) dep.count.prevDone++;
      // kế hoạch đã hẹn cho tuần này (hạn GỐC trong tuần): xong / dời / còn mở
      if (inW(planned) && !drop) { dep.plan.total++; if (done) dep.plan.done++; else if (revised && revised > planned) dep.plan.moved++; else dep.plan.open++; }
      if (done && (inW(act) || (!act && (inW(due) || inW(s0))))) { dep.count.done++; items.push({ ...it, tag: 'done' }); }
      else if (!done && !drop && due && due < START) {
        if (due < OD_FROM) continue;
        if (!st && !(+r.progress > 0)) dep.count.notUpdated++;            // dòng việc mẫu chưa ai cập nhật — không gọi là quá hạn
        else { dep.count.overdue++; if (dep.overdue.length < 15) dep.overdue.push({ key: cut(key, 90), t: cut(name, 120), pic: S(r.pic), due, st }); }
      } else if (!done && !drop && touchW) {
        if (!st && !(+r.progress > 0) && !inW(s0)) { dep.count.notUpdated++; continue; }
        dep.count.active++; items.push({ ...it, tag: revised && planned && revised > planned ? 'moved' : 'active', planned: revised && revised !== planned ? planned : undefined });
      }
      if (!done && !drop && (inR(due, N_START, N_END) || inR(s0, N_START, N_END))) { dep.count.next++; if (!items.find(x => x.t === it.t && x.pic === it.pic)) items.push({ ...it, tag: 'next' }); }
    }
    if (items.length) dep.keys.push({ key: cut(key, 160), type: S(k.type), pic: S(k.pic), st: S(k.status), pct: +k.progress || 0, from: day(k.start), due: day(k.revised) || day(k.planned), items });
  }
  // việc xong + đang làm trước, nhiều việc trước
  const w = x => x.items.filter(i => i.tag === 'done').length * 2 + x.items.filter(i => i.tag !== 'next').length;
  dep.keys.sort((a, b) => w(b) - w(a));
  console.log(`Phòng ${d.id}: key ${dep.keys.length} · xong ${dep.count.done} (tuần trước ${dep.count.prevDone}) · đang làm ${dep.count.active} · quá hạn ${dep.count.overdue} · chưa cập nhật ${dep.count.notUpdated} · tuần tới ${dep.count.next} · hẹn tuần này ${dep.plan.done}/${dep.plan.total} xong · công tác ${dep.trips.length}`);
  return dep;
}
async function departments() {
  const out = [];
  for (const d of CFG.reportHub) { try { out.push(await department(d)); } catch (e) { console.log(`Phòng ${d.id}: lỗi ${e.message}`); } }
  return out;
}

// ── 2. CRM (Việt Nam): đi địa bàn, phản hồi khách, bước tiếp theo, đơn hàng ──
async function team(t) {
  const tm = { id: t.id, name: t.name, count: { done: 0, visits: 0, accounts: 0, notDone: 0, next: 0, prevDone: 0, orders: 0, orderLines: 0, orderAmount: 0, prevOrders: 0 },
    byPic: {}, provinces: {}, actions: {}, products: {}, visits: [], notDone: [], next: [], orders: [] };
  try {
    const j = await getJson(t.url, { action: 'visitFeed', from: P_START, to: N_END });
    const acc = new Set();
    for (const r of j.rows || []) {
      if (isTest(r.pic)) continue;
      const d0 = day(r.start), d1 = day(r.finish) || d0, done = /complet/i.test(S(r.status)), pic = S(r.pic);
      const type = S(r.typeAction) || S(r.typeTask) || 'Other', prov = S(r.accProv || r.province), a = S(r.accName || r.account);
      if (done && inR(d1, P_START, P_END)) { tm.count.prevDone++; continue; }
      if (done && (inW(d1) || inW(d0))) {
        tm.count.done++; if (/visit|gặp|thăm/i.test(type)) tm.count.visits++;
        const p = tm.byPic[pic] = tm.byPic[pic] || { done: 0, visits: 0, accounts: 0, _a: new Set() };
        p.done++; if (/visit|gặp|thăm/i.test(type)) p.visits++; p._a.add(a);
        if (prov) tm.provinces[prov] = (tm.provinces[prov] || 0) + 1;
        tm.actions[type] = (tm.actions[type] || 0) + 1;
        if (S(r.product)) tm.products[S(r.product)] = (tm.products[S(r.product)] || 0) + 1;
        if (a) acc.add(a);
        tm.visits.push({ d: d1, pic, acc: a, kind: S(r.accType), prov, act: type, prod: S(r.product), stage: S(r.process), res: cut(noPhone(r.result), 320), fb: cut(noPhone(r.feedback), 160), next: cut(noPhone(r.nextAction), 160) });
      } else if (!done && inW(d0)) {
        tm.count.notDone++; if (tm.notDone.length < 25) tm.notDone.push({ d: d0, pic, acc: a, act: type, st: S(r.status), why: cut(r.stopReason, 100), plan: cut(r.plan, 100) });
      } else if (!done && inR(d0, N_START, N_END)) {
        tm.count.next++; if (tm.next.length < 30) tm.next.push({ d: d0, pic, acc: a, prov, act: type, prod: S(r.product), plan: cut(noPhone(r.plan), 120) });
      }
    }
    tm.count.accounts = acc.size;
    for (const p of Object.values(tm.byPic)) { p.accounts = p._a.size; delete p._a; }
    // lượt có nội dung dài (kết quả + phản hồi) trước; giữ tối đa 40 lượt / nhóm
    tm.visits.sort((a, b) => (b.res.length + b.fb.length + b.next.length) - (a.res.length + a.fb.length + a.next.length));
    tm.visits = tm.visits.slice(0, 40).sort((a, b) => a.d.localeCompare(b.d));
  } catch (e) { console.log(`CRM ${t.id}: lỗi đi địa bàn ${e.message}`); }
  if (t.orders) {
    try {
      const j = await getJson(t.url, { action: 'list', tab: 'order', offset: 0, limit: 5000 });
      const g = new Map();
      for (const r of j.rows || j.items || []) {
        const d = day(r.day); if (isTest(r.pic)) continue;
        const no = S(r.orderNo) || (S(r.name) + '|' + d);
        if (inR(d, P_START, P_END)) { g.set('P|' + no, 1); continue; }
        if (!inW(d)) continue;
        const k = 'W|' + no;
        if (!g.has(k)) g.set(k, { no: S(r.orderNo), d, pic: S(r.pic), acc: S(r.name), kind: S(r.type), prov: S(r.province), via: S(r.partner).split('/')[0], otype: S(r.otype), appr: S(r.appr), lines: [], amount: 0 });
        const o = g.get(k);
        o.lines.push(`${S(r.ptype)}${S(r.detail) ? ' · ' + cut(r.detail, 50) : ''} × ${+r.qty || 0}`); o.amount += +String(r.amount || 0).replace(/[^\d.-]/g, '') || 0;
      }
      for (const [k, o] of g) { if (k[0] === 'P') tm.count.prevOrders++; else { tm.orders.push(o); tm.count.orders++; tm.count.orderLines += o.lines.length; tm.count.orderAmount += o.amount; } }
      tm.orders.sort((a, b) => b.amount - a.amount); tm.orders = tm.orders.slice(0, 25);
    } catch (e) { console.log(`CRM ${t.id}: lỗi đơn hàng ${e.message}`); }
  }
  console.log(`CRM ${t.id}: xong ${tm.count.done} (tuần trước ${tm.count.prevDone}) · gặp khách ${tm.count.visits} · khách ${tm.count.accounts} · chưa xong ${tm.count.notDone} · tuần tới ${tm.count.next} · đơn ${tm.count.orders} (tuần trước ${tm.count.prevOrders})`);
  return tm;
}
async function sales() { return Promise.all(CFG.crm.filter(t => !/thai/i.test(t.id)).map(team)); }

// ── 3. Gói thầu trúng (NPP Hùng Vĩ, iCare) — tin vui nếu có ──
async function tenders() {
  const res = { wins: [], other: 0 };
  for (const n of CFG.tenders || []) {
    try {
      const j = await getJson(n.url, { action: 'winMap', from: String(+START.slice(0, 7).replace('-', '') - 1) });
      const pk = new Map();
      for (const r of j.rows || []) {
        if (!inW(day(r.approve))) continue;
        const key = (S(r.tbmt) || S(r.tender)) + '|' + S(r.hospital);
        if (!pk.has(key)) pk.set(key, { npp: n.name, hospital: S(r.hospital), city: S(r.city), tender: cut(r.tender, 120), win: false, products: [] });
        const p = pk.get(key);
        if (/win/i.test(S(r.result))) { p.win = true; p.products.push(S(r.wonProduct || r.pcode) + (r.wonQty ? ` × ${r.wonQty}` : '')); }
      }
      for (const p of pk.values()) { if (p.win) res.wins.push({ ...p, products: [...new Set(p.products)].slice(0, 6) }); else res.other++; }
    } catch (e) { console.log(`Thầu ${n.id}: lỗi ${e.message}`); }
  }
  console.log(`Thầu: trúng ${res.wins.length} gói · khác ${res.other}`);
  return res;
}

// ── 4. Đào tạo (Training Hub) ──
async function trainings() {
  try {
    const j = await getJson(CFG.training.url, { action: 'rhSessions', rhKey: CFG.training.rhKey, from: START, to: N_END });
    const xs = (j.sessions || []).filter(s => !/^test|\[test\]/i.test(S(s.topic))).map(s => ({ date: day(s.date), topic: cut(s.topic, 120), trainer: S(s.trainer), type: S(s.type), category: S(s.category), people: (s.people || []).length, status: S(s.status) }));
    console.log(`Đào tạo: ${xs.length} buổi`);
    return xs;
  } catch (e) { console.log('Đào tạo: lỗi ' + e.message); return []; }
}

// ── sổ series (công khai, KHÔNG có nội dung): số tập, người dẫn, kiểu mở đầu các tập trước ──
function series() {
  let idx = { weeks: [] }; try { idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'internal', 'index.json'), 'utf8')); } catch { /* lần đầu */ }
  const eps = (idx.weeks || []).filter(w => w.series === 'report' && w.date < END).sort((a, b) => b.date.localeCompare(a.date));
  const same = (idx.weeks || []).find(w => w.series === 'report' && w.date === END);
  const ep = same?.ep || (eps[0]?.ep || 0) + 1;
  return { ep, recent: eps.slice(0, 4).map(w => ({ ep: w.ep, date: w.date, anchor: w.anchor, angle: w.angle || '', order: w.order || '' })) };
}

export async function gather() {
  const [dep, sal, ten, trn] = await Promise.all([departments(), sales(), tenders(), trainings()]);
  const ser = series();
  const show = reportShow(ser.ep);
  return { kind: 'internal', series: 'report', date: END, week: { from: START, to: END }, prevWeek: { from: P_START, to: P_END }, nextWeek: { from: N_START, to: N_END },
    ep: ser.ep, recent: ser.recent, show: { id: show.id, name: show.name, anchor: show.anchor, hosts: show.hosts.map(h => ({ id: h.id, name: h.name, role: h.role })) },
    facts: { departments: dep, sales: sal, tenders: ten, trainings: trn } };
}

// ── viết (GitHub Actions) ──
export const OUT_KEYS = ['headline', 'sales', 'marketing', 'backoffice', 'followup', 'people', 'next'];
async function aiWrite(F) {
  const { askJson, S: J, PROVIDER } = await import('./ai.mjs');
  if (PROVIDER !== 'claude') throw new Error('Chỉ dùng Claude API cho dữ liệu nội bộ');
  const guide = fs.readFileSync(path.join(ROOT, 'REPORT.md'), 'utf8');
  const out = await askJson({
    effort: 'medium',
    system: guide,
    schema: J.obj({
      title: J.obj({ vi: J.str, en: J.str }), intro: J.obj({ vi: J.str, en: J.str }),
      sections: J.arr(J.obj({ key: { type: 'string', enum: OUT_KEYS }, h_vi: J.str, h_en: J.str, vi: J.str, en: J.str })),
      podcast: J.obj({ title: J.str, turns: J.arr(J.obj({ sp: { type: 'string', enum: F.show.hosts.map(h => h.id) }, text: J.str, say: J.str, vi: J.str })) }),
      memo: J.obj({ angle: J.str, order: J.str }),
    }),
    user: 'FACTS (JSON):\n' + JSON.stringify(F),
  });
  return out;
}
// Bản mẫu (không có Claude API): ngắn, chỉ số đếm — KHÔNG gửi dữ liệu nội bộ sang dịch máy bên ngoài.
function templateWrite(F) {
  const f = F.facts, A = F.show.hosts[0];
  const n = x => x.reduce((s, y) => s + y, 0);
  const visits = n(f.sales.map(t => t.count.visits)), acts = n(f.sales.map(t => t.count.done)), orders = n(f.sales.map(t => t.count.orders));
  const turns = [];
  const say = (en, vi) => turns.push({ sp: A.id, text: en, vi });
  say(`Good morning, MMH! This is MMH Report, episode ${F.ep}, the week of ${F.week.from} to ${F.week.to}. I'm ${A.name}.`, `Chào buổi sáng MMH! Đây là MMH Report, tập ${F.ep}, tuần ${F.week.from} đến ${F.week.to}. Mình là ${A.name}.`);
  if (acts) say(`Out in the field, our sales teams finished ${acts} activities, with ${visits} customer visits.`, `Ngoài địa bàn, các nhóm sales hoàn thành ${acts} hoạt động, ${visits} lượt gặp khách.`);
  if (orders) say(`Dental booked ${orders} orders this week.`, `Nhóm Dental ghi nhận ${orders} đơn hàng trong tuần.`);
  for (const d of f.departments) say(`${d.name} closed ${d.count.done} tasks, with ${d.count.next} lined up for next week.`, `${d.name} hoàn thành ${d.count.done} việc, tuần tới có ${d.count.next} việc.`);
  say(`Full details are in the app. Have a great week, everyone!`, `Chi tiết có trong app. Chúc cả nhà một tuần làm việc hiệu quả!`);
  return { title: { vi: `MMH Report · Tập ${F.ep}`, en: `MMH Report · Episode ${F.ep}` }, intro: { vi: '', en: '' }, sections: [], podcast: { title: `MMH Report · Episode ${F.ep}`, turns }, memo: { angle: 'template', order: '' } };
}

async function main() {
  const F = await gather();
  fs.mkdirSync(OUT, { recursive: true });
  if (process.env.WEEKLY_FACTS_ONLY) {               // phiên Claude Code: chỉ lấy số liệu, Claude tự viết (REPORT.md) ⇒ apply_in.mjs
    const f = path.join(OUT, END + '.facts.json');
    fs.writeFileSync(f, JSON.stringify(F, null, 1));
    console.log(`MMH Report tập ${F.ep} · tuần ${START} → ${END} · người dẫn ${F.show.anchor} ⇒ ${f} (${Math.round(fs.statSync(f).size / 1024)} KB, ngoài repo). Viết theo REPORT.md rồi: node tools/apply_in.mjs ${f} <kết quả.json>`);
    return;
  }
  let out, writer = 'template';
  if (process.env.ANTHROPIC_API_KEY) { try { out = await aiWrite(F); writer = 'claude'; } catch (e) { console.log('Claude lỗi, dùng bản mẫu: ' + e.message); } }
  if (!out) out = templateWrite(F);
  const { build } = await import('./apply_in.mjs');
  const ed = build(F, out, writer);
  fs.writeFileSync(path.join(OUT, END + '.json'), JSON.stringify(ed));
  console.log(`MMH Report tập ${F.ep} ${START} → ${END} · viết bằng ${writer} · ${ed.podcast.turns.length} lượt lời · tạm lưu ngoài repo`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exit(1); });
export { GLOSSARY };
