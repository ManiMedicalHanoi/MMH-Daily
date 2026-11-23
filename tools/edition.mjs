// MMH Daily — dựng số báo hôm nay từ data/pool.json ⇒ data/editions/<ngày>.json + data/index.json.
// Chọn tin (ưu tiên Y tế: đấu thầu, chính sách, đầu tư công, bệnh viện lớn), chọn chương trình podcast của ngày,
// viết nội dung: có ANTHROPIC_API_KEY ⇒ Claude (song ngữ, phân tích, kịch bản podcast); không có ⇒ mẫu soạn sẵn từ tin tiếng Anh.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DAY, vnDay, iso } from './lib.mjs';
import { SHOWS, showFor, pickShow, HOW, LEARN, learnFor, GLOSSARY } from './shows.mjs';
import { translateStories, translate } from './translate.mjs';
import { airedCheck, inferCovered, recordAired, loadAired, AIRED_F } from './aired.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const NOW = process.env.DAILY_NOW ? new Date(process.env.DAILY_NOW) : new Date();
const DATE = process.env.DAILY_DATE || vnDay(NOW);
const ED_DIR = path.join(ROOT, 'data', 'editions');
const list = v => String(v || '').split(',').map(x => x.trim()).filter(Boolean);
const FILTER = { sources: list(process.env.DAILY_SOURCES), topics: list(process.env.DAILY_TOPICS) };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

// ── chọn tin ──
const DESK = { dental: ['dental'], eye: ['eye'], tender: ['tender', 'device'], policy: ['policy', 'insurance'], market: ['market', 'invest', 'hospital'] };
/** "Vì sao quan trọng với MMH" — câu mẫu theo nhãn (bản miễn phí; Claude viết thì thay bằng câu riêng từng tin) */
const WHY = [
  ['dental', 'Liên quan trực tiếp mảng nha khoa (trâm, mũi khoan, vật liệu) — sales Dental nên nắm.'],
  ['eye', 'Liên quan mảng nhãn khoa (dao mổ, chỉ khâu) — theo dõi nhu cầu phẫu thuật mắt và kế hoạch mua sắm của bệnh viện.'],
  ['tender', 'Ảnh hưởng cách bệnh viện mua sắm: thời gian, giá hoặc hồ sơ thầu có thể thay đổi.'],
  ['device', 'Tác động tới nhà cung cấp thiết bị, vật tư y tế: thủ tục, giá, nguồn hàng.'],
  ['insurance', 'BHYT và giá dịch vụ quyết định ngân sách mua vật tư của bệnh viện.'],
  ['market', 'Ảnh hưởng giá nhập hàng, chi phí hoặc nhu cầu thị trường của MMH.'],
  ['surgery', 'Nhu cầu phẫu thuật kéo theo nhu cầu chỉ khâu, ghim da, dụng cụ.'],
  ['policy', 'Quy định mới của ngành y — xem có ảnh hưởng giấy phép, hồ sơ hay cách bán hàng.'],
  ['invest', 'Vốn đầu tư cho y tế: bệnh viện có thêm ngân sách mua sắm.'],
  ['hospital', 'Bệnh viện lớn là khách hàng và đầu mối thầu — đáng theo dõi.'],
];
const whyOf = x => (WHY.find(([t]) => x.tags?.includes(t)) || [])[1];

function pick(pool) {
  const prevEds = (readJson(path.join(ROOT, 'data', 'index.json'), { editions: [] }).editions || []).filter(e => e.date < DATE).slice(0, 3);
  const used = new Set(prevEds.flatMap(e => readJson(path.join(ED_DIR, e.date + '.json'), { used: [] }).used || []));
  const fresh = h => pool.items.filter(x => NOW - new Date(x.d) <= h * 36e5 && !used.has(x.id));
  let cand = fresh(30);
  if (cand.length < 40) cand = fresh(54);
  // lọc theo lựa chọn khi bấm "Tổng hợp ngay": DAILY_SOURCES = tên miền báo, DAILY_TOPICS = mã chủ đề (config.json ▸ topics)
  if (FILTER.sources.length) { const ok = new Set(FILTER.sources); cand = cand.filter(x => ok.has(x.dom) || (x.kind === 'doc' && ok.has('vanban.chinhphu.vn'))); }
  if (FILTER.topics.length) {
    const T = CFG.topics.filter(t => FILTER.topics.includes(t.id));
    const hit = x => T.some(t => (t.tags || []).some(g => x.tags?.includes(g)) || (t.secs || []).includes(x.sec));
    const strict = cand.filter(hit);
    cand = strict.length >= 8 ? strict : [...strict, ...cand.filter(x => !hit(x) && x.sec === 'health')].slice(0, 12);
  }
  const rank = x => x.sc + (x.also?.length || 0) * 1.5 + Math.max(0, 1 - (NOW - new Date(x.d)) / (30 * 36e5)) + (x.img ? 0.3 : 0);
  cand.sort((a, b) => rank(b) - rank(a));
  const sections = {};
  for (const [sec, def] of Object.entries(CFG.sections)) {
    if (sec === 'ai') continue;   // AI & Công nghệ chọn riêng bên dưới (tin quốc tế, giữ 10 ngày)
    const all = cand.filter(x => x.sec === sec);
    // trộn tiếng Việt + tiếng Anh: tối đa 60% một ngôn ngữ
    const out = [], cap = Math.ceil(def.quota * 0.6), n = { vi: 0, en: 0 };
    for (const x of all) { if (out.length >= def.quota) break; if (n[x.lang] >= cap && all.some(y => y.lang !== x.lang && !out.includes(y))) continue; out.push(x); n[x.lang]++; }
    for (const x of all) { if (out.length >= def.quota) break; if (!out.includes(x)) out.push(x); }
    sections[sec] = sec === 'health' ? out.filter((x, i) => i < 6 || (x.mmh || 0) > 0) : out;
  }
  // Bàn tin Y tế: nhóm theo mức ảnh hưởng tới MMH
  const desk = {};
  for (const [g, ts] of Object.entries(DESK)) desk[g] = cand.filter(x => (x.sec === 'health' || g === 'market') && ts.some(t => x.tags?.includes(t))).slice(0, 6).map(x => x.id);
  const docs = cand.filter(x => x.docs?.length && (x.sec === 'health' || x.tags?.includes('invest') || x.kind === 'doc')).slice(0, 10);
  const lead = sections.health[0] || sections.economy[0];
  // ── AI & Công nghệ (24/11/2026): tin / bài / video AI quốc tế trong 9 ngày; podcast AI Pulse chỉ lấy tin CHƯA lên sóng (data/aired.json) ──
  const AIR = airedCheck(DATE);
  let ai = pool.items.filter(x => x.sec === 'ai' && NOW - new Date(x.d) <= 9 * DAY && new Date(x.d) - NOW < DAY / 2);
  if (FILTER.sources.length) { const ok = new Set(FILTER.sources); ai = ai.filter(x => ok.has(x.dom)); }
  if (FILTER.topics.length && !FILTER.topics.includes('ai')) ai = [];
  const aiRank = x => x.sc + (x.also?.length || 0) + Math.max(0, 2 - (NOW - new Date(x.d)) / (3.5 * DAY));
  ai.sort((a, b) => aiRank(b) - aiRank(a));
  const spread = (xs, n, perSrc, maxVid) => { const out = [], by = {}; let vid = 0;
    for (const x of xs) { if (out.length >= n) break; const k = x.src || x.dom; if ((by[k] || 0) >= perSrc || (x.tags?.includes('video') && vid >= maxVid)) continue;
      by[k] = (by[k] || 0) + 1; if (x.tags?.includes('video')) vid++; out.push(x); }
    return out; };
  sections.ai = spread(ai.filter(x => !used.has(x.id)), CFG.sections.ai?.quota || 10, 2, 4);
  const aiPod = spread(ai.filter(x => !AIR.is(x)), 10, 2, 5);
  return { sections, desk, docs, lead, cand, aiPod, AIR };
}

// ── chữ cho giọng đọc ──
// Thẻ cảm xúc cho ElevenLabs v3 ([curious], [chuckles]…): "say" = lời có thẻ (đưa cho giọng đọc), "text" = lời sạch (phụ đề, giọng miễn phí).
const TAG = /\s*\[[a-z][a-z ,'-]{1,28}\]\s*/gi;
const voiceTurn = t => { const raw = speech(t.text), text = raw.replace(TAG, ' ').replace(/\s+([,.?!])/g, '$1').replace(/\s+/g, ' ').trim();
  const o = { sp: t.sp, text, vi: String(t.vi || '').replace(TAG, ' ').replace(/\s+/g, ' ').trim() };
  if (raw !== text && !t.rep) o.say = raw;
  if (t.rep) o.rep = true;
  return o; };
const speech = s => String(s || '')
  .replace(/\bHCMC\b/g, 'Ho Chi Minh City').replace(/\bVND\b/g, 'dong').replace(/\bUS\$/g, '$').replace(/(\d)%/g, '$1 percent')
  .replace(/\s*\([^)]*\)/g, '').replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const sentences = (s, n) => { const t = String(s || '').replace(/(\d)\.(\d)/g, '$1\u2024$2');   // không cắt câu ở số thập phân
  return ((t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t]).slice(0, n).join(' ').trim()).replace(/\u2024/g, '.'); };
const ordinal = d => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
function dateEn(ds) {
  const d = new Date(ds + 'T00:00:00Z');
  return `${d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}, ${d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })} ${ordinal(d.getUTCDate())}`;
}
function seedRand(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507), h ^= h >>> 13, (h >>> 0) / 4294967296)); }

// ── viết bằng mẫu (miễn phí, không cần AI): tin tiếng Anh + tin tiếng Việt đã dịch máy ──
const words = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3));
const similar = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return false; let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.min(A.size, B.size) > 0.5; };

/* AI Pulse bản miễn phí (không có AI viết): Liam đọc lần lượt tin AI quốc tế chưa lên sóng — tiêu đề, ý chính, nguồn. */
function templateAI(ed, picked) {
  const rnd = seedRand(DATE + 'ai');
  const any = a => a[Math.floor(rnd() * a.length)];
  const show = SHOWS[ed.podcast.show], A = show.hosts[0], turns = [];
  const say = text => { const t = speech(text).replace(/\.\./g, '.').replace(/\s+([,.?!])/g, '$1'); if (t) turns.push({ sp: A.id, text: t }); };
  const head = x => String(x.h_en || x.t).replace(/['"“”‘’]/g, '').replace(/\s*[|:]\s+/, '. ').replace(/[.!?]$/, '');
  const gist = x => { const g = sentences(x.s_en || x.sum, 2); return g.split(/\s+/).length > 55 ? sentences(g, 1) : g; };
  const xs = (picked.aiPod || []).filter(x => gist(x).length > 30).slice(0, 7);
  const who = x => x.tags?.includes('video') ? `In a new video, ${x.src}` : x.fk === 'voice' ? `${x.src} wrote` : `According to ${x.src}`;
  say(`${any(['Okay, AI news. Lots of it.', 'Big week in AI. Let\'s go.', 'Right, let\'s talk AI.'])} Hey, I'm ${A.name}, and this is ${show.name}, ${dateEn(DATE).replace(/^\w+, /, '')}.`);
  xs.forEach((x, i) => {
    say(`${i ? any(['Okay, next up.', 'Next one.', 'Moving on.', 'And here\'s another one.']) + ' ' : ''}${head(x)}.`);
    say(`${who(x)}: ${gist(x)}`);
    if (i < 3) say(any(['Here\'s why this matters. It changes what these tools can do at work.', 'Quick reality check: test it before you trust it.', 'Keep an eye on this one.', 'One to watch over the next few weeks.']));
  });
  if (!xs.length) say('We could not reach our AI sources this week. More next time.');
  say(`${any(['That\'s the AI Pulse for this week.', 'And that\'s a wrap on AI this week.'])} The links are in today's paper, in the AI section. ${any(['See you next week.', 'Stay curious.', 'Catch you next time.'])}`);
  picked.read = xs;
  ed.podcast.turns = turns; ed.podcast.title = `${show.name} · ${dateEn(DATE)}`; ed.podcast.desc = show.desc;
  ed.podcast.covered = xs.map(x => x.id);
  ed.vocab = [];
  ed.writer = 'template';
}

function templateWrite(ed, picked) {
  if (SHOWS[ed.podcast.show]?.ai) return templateAI(ed, picked);
  // Bản miễn phí: ít tin, nói như hai đồng nghiệp — mỗi tin MMH có 1 câu "liên quan gì tới mình". Tin chung chỉ điểm nhanh.
  const rnd = seedRand(DATE + ed.podcast.show);
  const usedP = new Set();
  const any = a => { const free = a.filter(x => !usedP.has(x)); const x = (free.length ? free : a)[Math.floor(rnd() * (free.length || a.length))]; usedP.add(x); return x; };
  const show = SHOWS[ed.podcast.show];
  const A = show.hosts[0], B = show.hosts[1] || show.hosts[0];
  const duo = show.hosts.length > 1;
  const turns = [];
  const say = (h, text) => { const t = speech(text).replace(/([?!…])\./g, '$1').replace(/\.\./g, '.').replace(/\s+([,.?!])/g, '$1'); if (t) turns.push({ sp: h.id, text: t }); };
  picked.read = [];
  // tiêu đề nói được: bỏ ngoặc kép, "X: Y" ⇒ "X. Y"
  const head = x => (x.lang === 'en' ? x.t : x.h_en || '').replace(/\s+/g, ' ').replace(/['"“”‘’]/g, '').replace(/\s*:\s+/, '. ').replace(/[.。]$/, '');
  // ý chính: 1 câu, tối đa ~30 từ (cắt ở dấu phẩy)
  const gist = x => {
    let t = sentences(x.lang === 'en' ? x.sum : x.s_en, 1).replace(/^(According to [^,]+, )/i, '');
    const w = t.split(/\s+/);
    if (w.length > 40) {                         // câu quá dài: cắt ở dấu phẩy gần nhất sau ~15 từ; không có ⇒ bỏ tin
      const cut = t.lastIndexOf(',', 230);
      t = cut > 90 ? t.slice(0, cut) + '.' : '';
    }
    return t;
  };
  const readHeads = [];
  const notAired = x => ed.podcast.show === 'weekly' || !picked.AIR?.is(x);   // không đọc lại tin đã lên sóng (data/aired.json)
  const usable = x => { const h = head(x); return h && h.length < 170 && gist(x).length >= 40 && notAired(x) && !readHeads.some(r => similar(r, h)); };
  const takeOne = x => { picked.read.push(x); readHeads.push(head(x)); return x; };
  const BIZ = ['dental', 'eye', 'tender', 'device', 'insurance', 'market', 'surgery', 'policy', 'invest', 'hospital'];
  const tagOf = x => BIZ.find(t => x.tags?.includes(t)) || 'other';
  const nMain = { healthdesk: 7, explainer: 4, weekly: 7, markets: 5 }[ed.podcast.show] || 6;
  // tin chính: ưu tiên điểm MMH, không quá 2 tin cùng nhãn
  const pool = [...new Map([...picked.sections.health, ...picked.cand.filter(x => x.sec === 'health' || x.tags?.includes('market'))].map(x => [x.id, x])).values()]
    .sort((a, b) => (b.mmh || 0) - (a.mmh || 0) || b.sc - a.sc);
  const main = [], perTag = {};
  for (const x of pool) {
    if (main.length >= nMain) break;
    const t = tagOf(x);
    if (t === 'other' || (perTag[t] || 0) >= 2 || !usable(x)) continue;
    perTag[t] = (perTag[t] || 0) + 1; main.push(takeOne(x));
  }
  // điểm nhanh: kinh tế + chính trị (1–3 tin)
  const quick = [];
  for (const sec of ['economy', 'politics', 'society']) for (const x of picked.sections[sec]) { if (quick.length >= (sec === 'economy' ? 2 : quick.length + 1) || quick.length >= 3) break; if (usable(x)) quick.push(takeOne(x)); }

  const INTRO = {
    dental: ['Okay, one for the dental team.', 'Dental news now, and it’s a useful one.', 'Something from the dental world.'],
    eye: ['Now, eye care. This one’s close to home for us.', 'Over to eye care.', 'An eye care story, and our surgical team will want to hear it.'],
    tender: ['Tender news. And honestly, this one matters.', 'Let’s talk tenders.', 'Here’s one from the procurement side.'],
    device: ['A story for anyone dealing with medical devices.', 'Device news now.', 'This one’s about equipment and supplies.'],
    insurance: ['Let’s talk money. Health insurance.', 'Now, insurance and hospital fees.', 'A health insurance story.'],
    market: ['A market story now.', 'Bit of business news that touches us.', 'This one’s about the wider market.'],
    surgery: ['From the operating room.', 'A surgery story.', 'Something from the surgical side.'],
    policy: ['A policy update from the health sector.', 'Rules and regulations now. Stay with me.', 'There’s a new policy move.'],
    invest: ['Follow the money: health investment.', 'Investment in health care now.', 'A spending story.'],
    hospital: ['From the big hospitals.', 'Hospital news now.', 'Inside the hospitals this week.'],
  };
  const ANGLE = {
    dental: ['For our dental reps, that’s a good talking point with clinics this week.', 'Worth knowing before your next clinic visit.', 'If you sell into dental clinics, keep an eye on that one.'],
    eye: ['More eye surgery means more demand for the knives and sutures we sell. So it’s one to watch.', 'For the eye care side of the business, that’s a useful signal.', 'That’s the kind of thing ophthalmologists will bring up, so good to know.'],
    tender: ['For us, it could change how hospitals write their tender files. Worth a read before the next round.', 'Anything that changes how hospitals buy changes how we sell. Simple as that.', 'If this goes ahead, timing and pricing on future tenders could shift.'],
    device: ['That affects every supplier, us included: paperwork, pricing, supply.', 'Anyone handling registrations or imports should read the full piece.', 'Good to keep in mind when hospitals ask about supply.'],
    insurance: ['Insurance money is what pays for supplies in the end. So yes, it matters to us.', 'When hospital budgets get squeezed, purchasing slows down. That’s the link.', 'Fees and insurance rules decide how much hospitals can spend.'],
    market: ['For a company importing from Japan, that’s not background noise.', 'It feeds straight into costs and demand, so it’s on our radar.', 'Worth a look for anyone planning budgets.'],
    surgery: ['More procedures, more demand for sutures and staplers.', 'Good context for the surgical team.', 'It shows where surgical care is heading.'],
    policy: ['Check whether it touches licences or tender paperwork.', 'Most of it won’t change our day. Some of it might.', 'One to file away for now.'],
    invest: ['New money usually means new purchasing plans later on.', 'Budget first, purchases later. That’s the pattern.', 'Hospitals with fresh budgets are hospitals that buy.'],
    hospital: ['These hospitals are customers, and they set the tone for everyone else.', 'When the big hospitals move, provincial ones often follow.', 'Good to know who’s doing what at the top.'],
  };
  const REACT = ['Hm.', 'Right.', 'Interesting.', 'Okay.', 'Huh.', 'Yeah.', 'That’s a big one.', 'Makes sense.'];
  const ASK = ['So what does that mean for us?', 'Why should we care?', 'And for MMH?', 'Does that affect us?', 'What’s our angle?'];
  const NEXT = ['Next one.', 'Moving on.', 'Okay, next.', 'Another one.', 'Right, what else?'];

  // mở đầu: câu móc từ tin đầu
  const L = main[0];
  const hook = L ? { dental: 'Dental clinics are in the news today.', eye: 'There’s an eye care story we can’t skip today.', tender: 'If you sell anything to a public hospital, today’s first story is for you.',
    device: 'Medical devices are in the headlines this morning.', insurance: 'Health insurance is in the spotlight today.', market: 'There’s a market story today that touches our costs.' }[tagOf(L)] || 'We’ve got a busy health news day.' : 'It’s a quieter news day.';
  const short = dateEn(DATE).replace(/^\w+, /, '');
  if (duo) {
    say(A, `${hook} ${any(['Morning, everyone.', 'Hi, good morning.', 'Hello again.'])} I’m ${A.name}, this is ${show.name}, and it’s ${short}.`);
    say(B, `${any(['And I’m', 'Hi, I’m', 'Morning, I’m'])} ${B.name}. ${any(['Let’s get into it.', 'Lots to get through.', 'Coffee in hand. Go.'])}`);
  } else say(A, `${hook} ${any(['Morning.', 'Hi there.', 'Hello.'])} I’m ${A.name}, this is ${show.name}, ${short}. ${any(['Let’s get into it.', 'Here’s what matters today.', 'Grab a coffee.'])}`);

  main.forEach((x, i) => {
    const t = tagOf(x), h = head(x), g = gist(x), ang = any(ANGLE[t] || ANGLE.policy);
    const [P, Q] = duo ? (i % 2 ? [B, A] : [A, B]) : [A, A];
    if (i && rnd() < 0.5) say(P, `${any(NEXT)} ${any(INTRO[t])}`); else say(P, any(INTRO[t]));
    say(P, `${h}.`);
    if (duo) {
      say(Q, `${any(REACT)} ${rnd() < 0.5 ? 'What’s the detail?' : 'Go on.'}`);
      say(P, g);
      if (rnd() < 0.6) { say(Q, any(ASK)); say(P, ang); } else say(Q, ang);
    } else { say(A, g); say(A, ang); }
  });
  if (quick.length) {
    say(A, any(['Before we go, the rest of the news, quickly.', 'Okay, outside health, very fast.', 'A few other headlines, thirty seconds.']));
    quick.forEach((x, i) => say(duo && i % 2 ? B : A, `${head(x)}.`));
  }
  if (!main.length && !quick.length) say(A, 'We couldn’t reach our sources this morning. Today’s paper has everything we found.');
  if (L) say(duo ? B : A, `${any(['If you remember one thing today:', 'So, the one to remember:', 'Our pick of the day:'])} ${head(L).split('. ')[0]}.`);
  say(A, `${any(['That’s it from us.', 'And that’s the show.', 'That’s all for today.'])} The full stories, in Vietnamese and English, are in today’s paper. ${any(['See you tomorrow.', 'Have a good day.', 'Talk soon.'])}`);
  if (duo) say(B, any(['Bye for now.', 'Take care, everyone.', 'See you.']));

  ed.podcast.turns = turns;
  ed.podcast.title = `${show.name} · ${dateEn(DATE)}`;
  ed.podcast.desc = show.desc;
  const text = turns.map(t => t.text).join(' ').toLowerCase();
  ed.vocab = GLOSSARY.filter(([en]) => text.includes(en.toLowerCase())).slice(0, 10).map(([en, vi]) => ({ en, vi }));
  ed.podcast.covered = picked.read.map(x => x.id);
  ed.writer = 'template';
}

// ── viết bằng Claude (gói Tiết kiệm: Haiku 5.5) — 2 lượt: tin song ngữ; podcast + phụ đề Việt + phân tích ──
async function claudeWrite(ed, picked) {
  const { askJson, S: J } = await import('./ai.mjs');
  const show = SHOWS[ed.podcast.show];
  const deskX = Object.values(picked.desk).flat().map(id => picked.cand.find(y => y.id === id)).filter(Boolean);
  const AI_SHOW = !!show.ai;
  const all = [...new Map(Object.values(picked.sections).flat().concat(picked.docs, deskX, AI_SHOW ? picked.aiPod || [] : []).map(x => [x.id, x])).values()];
  const list = all.map(x => ({ id: x.id, sec: x.sec, tags: x.tags, lang: x.lang, source: x.src, date: x.d.slice(0, 10), title: x.t, summary: (x.sum || '').slice(0, 450) }));
  const prev = (readJson(path.join(ROOT, 'data', 'index.json'), { editions: [] }).editions || []).slice(0, 5).map(e => `${e.date}: ${e.show} — ${e.lead}`);
  const AV = historyAvoid(readJson(HIST_F, []));
  const MEM = memRecall(picked, ed.podcast.show, ed.date);
  const WEEK = [...new Set(readJson(HIST_F, []).filter(h => h.date !== ed.date).slice(0, 6).flatMap(h => [...(h.vocab || []), ...(h.phr || [])]))].slice(0, 40);
  if (MEM.used.length) console.log('Sổ ghi nhớ: gợi ý nhắc lại ' + MEM.used.map(m => m.date + ' ' + m.topic).join(' · '));
  const SYSTEM = `You are the editor of MMH Daily Podcast, a morning news podcast for staff of MANI Medical Hanoi (MMH) who are learning English (level B1). Follow these house guides exactly
(they are in Vietnamese; write stories and scripts in English with Vietnamese where asked):\n\n${fs.readFileSync(path.join(ROOT, 'context', 'MMH.md'), 'utf8')}\n\n${fs.readFileSync(path.join(ROOT, 'WRITING.md'), 'utf8')}\n\n${fs.readFileSync(path.join(ROOT, 'PODCAST.md'), 'utf8')}`;
  const GL = glossaryFor(all);   // chỉ thuật ngữ xuất hiện trong tin hôm nay (tiết kiệm token)
  if (GL.n) console.log(`Thuật ngữ MMH gửi kèm: ${GL.n}`);
  // 1. tin song ngữ
  const st = await askJson({ system: SYSTEM, effort: 'low', schema: J.obj({ stories: J.arr(J.obj({ id: J.str, rel: { type: 'integer', enum: [0, 1, 2, 3] }, h_en: J.str, h_vi: J.str, dek_en: J.str, s_vi: J.str, s_en: J.str, why_vi: J.str })) }),
    user: `For EVERY story below first rate rel = how much it matters to MMH's business (WRITING.md ▸ "Luôn gắn với MMH"):
3 = direct (ophthalmic / dental / surgical products, medical-device tenders and procurement, distributors, MMH's hospital and clinic customers, competitors);
2 = health system (hospitals, health insurance, health policy, medical devices / pharma regulation, medical societies, health investment);
1 = indirect but real (exchange rate yen / USD, import duties and customs, public investment and hospital budgets, laws on bidding, tax, business, labour;
    macro economy that changes customer demand or MMH's costs) — only if you can name the chain of impact;
0 = no plausible link (crime, accidents, entertainment, sport, foreign politics without an economic effect, local news unrelated to health or business).
Then write: h_en (sharp English headline), h_vi (Vietnamese headline), dek_en (one-line English standfirst),
s_vi (2–3 sentence Vietnamese summary), s_en (2–3 sentence English summary), why_vi (one Vietnamese sentence, REQUIRED when rel ≥ 1: how it affects MMH concretely —
which product group, customer, tender step, cost or price; for rel = 1 spell out the chain, e.g. "Yên giảm ⇒ giá vốn hàng MANI nhập từ Nhật giảm ⇒ dư địa giá thầu tốt hơn"; empty when rel = 0).
For rel = 0 you may leave the other fields short — the story will be dropped.
Stories with sec = "ai" are international AI / tech news for the separate AI section: rate them too, but they are NEVER dropped; write why_vi only if there is a
realistic use for MMH's daily work, else leave it empty. Keep AI product and model names exactly as written (GPT-5, Claude, Gemini, Llama…); s_vi in natural Vietnamese
with the English technical term in brackets the first time (e.g. "cửa sổ ngữ cảnh (context window)").${GL.text}\n\nStories (JSON):\n${JSON.stringify(list)}` });
  const byId = new Map(st.stories.map(s => [s.id, s]));
  for (const x of all) { const s = byId.get(x.id); if (s) Object.assign(x, { h_en: s.h_en, h_vi: s.h_vi, dek: s.dek_en, s_vi: s.s_vi, s_en: s.s_en, why: s.why_vi || undefined, rel: s.rel }); }
  // Luật người dùng (23/11/2026): chỉ giữ tin có liên quan tới MMH (rel ≥ 1); tin không liên quan không tổng hợp, không vào podcast.
  const rel = x => (x.rel == null ? 1 : x.rel), okRel = x => x.sec === 'ai' || rel(x) >= 1;   // tin AI là mục riêng ⇒ không bỏ theo mức liên quan MMH
  if (all.filter(okRel).length >= 6) {
    for (const sec of Object.keys(picked.sections)) picked.sections[sec] = picked.sections[sec].filter(okRel).sort((a, b) => rel(b) - rel(a));
    picked.docs = picked.docs.filter(okRel);
    if (picked.read) picked.read = picked.read.filter(okRel);
    const kept = new Set(all.filter(okRel).map(x => x.id));
    for (const t of Object.keys(picked.desk)) picked.desk[t] = picked.desk[t].filter(id => kept.has(id) || !all.some(x => x.id === id));
    if (!picked.lead || !okRel(picked.lead) || rel(picked.lead) < 2) picked.lead = [...(picked.sections.health || [])].sort((a, b) => rel(b) - rel(a) || (b.mmh || 0) - (a.mmh || 0))[0] || picked.lead;
    ed.lead = picked.lead?.id; ed.docs = picked.docs.map(x => x.id);
    console.log(`Tin liên quan MMH: giữ ${kept.size}/${all.length} (bỏ ${all.length - kept.size} tin không liên quan)`);
  }

  // 2. podcast + phụ đề + lời biên tập + phân tích y tế + từ vựng
  // Không đọc lại tin đã lên sóng ở bất kỳ series nào (data/aired.json, 30 ngày). Week in Review (CN) là số nhìn lại tuần nên được phép.
  const fresh = x => ed.podcast.show === 'weekly' || !picked.AIR?.is(x);
  const pick = sec => (picked.sections[sec] || []).filter(fresh).slice(0, sec === 'health' ? 8 : 4).map(x => ({ id: x.id, tags: x.tags, source: x.src, headline: x.h_en || x.t, summary: x.s_en || x.sum, mmh_relevance: x.rel, mmh_impact: x.why || '' }));
  const KIND = { yt: 'YouTube video', lab: 'official lab blog / video', voice: 'written or said by the person themselves', people: 'press report of what a leader said or posted', salesmkt: 'AI in sales & marketing', tech: 'tech press', talk: 'long interview / podcast' };
  const aiList = (picked.aiPod || []).map(x => ({ id: x.id, tags: x.tags, source: x.src, kind: KIND[x.fk] || x.fk || '', date: x.d.slice(0, 10), views: x.views || undefined,
    headline: x.h_en || x.t, summary: x.s_en || x.sum, mmh_use: x.why || '' }));
  const lastAI = readJson(HIST_F, []).find(h => h.show === 'aipulse' && h.date < ed.date);
  const hosts = show.hosts.map(h => `${h.id} = ${h.name} (${h.role})`).join('; ');
  const COMMON = `   LEARNING SEGMENT (60–90 seconds, near the end): ${LEARN[ed.podcast.learn]}
   LANGUAGE FOR B1 LEARNERS: average 10–14 words per sentence, max about 18; everyday words; explain any industry term in plain words the first time; paraphrase each story's key point once; no hard idioms.
   VARIETY: the opening line, the hand-offs and the sign-off must be different from recent episodes. Recent openings: ${AV.opens.map(o => '"' + o + '"').join(' | ') || 'none'}.
   Recent sign-offs: ${AV.closes.map(o => '"' + o + '"').join(' | ') || 'none'}. Avoid these phrases that were overused recently: ${AV.phrases.join('; ') || 'none'}.
   NO REPEATS ACROSS SHOWS: every story below is new to the listeners — none of them has been on any MMH series before. Do not retell earlier episodes.
   Sound like real people talking, not reading: contractions, short sentences, natural reactions and hand-offs, a light personal touch; numbers written to be spoken;
   no URLs or lists. Never sound cheerful about accidents or deaths. For every turn also give "vi": a natural Vietnamese subtitle of that turn, and "rep": true only for Listen & Repeat sentences (else false).
   WRITE FOR THE VOICE (PODCAST.md ▸ 6): mix very short reactions (2–5 words) with medium sentences so the rhythm is never flat; each story has ONE key point said
   with weight (a short sentence of its own, often after "Here's the thing." or a question); use "..." at most twice per story for a real pause.
   Delivery tags for the voice engine, in square brackets inside "text": [curious] [surprised] [thoughtful] [warmly] [excited] [serious] [chuckles] [sighs].
   At most one tag per turn, roughly one turn in three, placed where a real host would change tone; [serious] only for accidents, deaths, disease;
   no tags in Listen & Repeat turns; never write tags in "vi".`;
  const POD = AI_SHOW ? `4. podcast: title, one-line desc, recap (2–5 items: topic = 2–5 words, gist = one sentence), covered (ids of the AI stories you actually talk about),
   mmh (true only if you include the MMH corner), and turns for a 1,100–1,400 word script (about 8–10 minutes).
   THIS IS "${show.name}", THE AI & TECH EPISODE — NOT a health show. Use ONLY the stories under "ai" below (international sources). The health stories are only for item 2.
   Priorities: (1) what the leaders and builders at OpenAI, Anthropic, Meta, Google DeepMind, NVIDIA, Microsoft said, wrote or posted, and what it signals;
   (2) the newest models, features and techniques — GO DEEP: for the 2–3 biggest items explain what is new, HOW it works in plain words (reasoning models that "think" before
   answering, context window, agents that use tools, open-weight vs closed, multimodal, on-device, pricing…), what it can and cannot do yet, who can use it and when;
   (3) how sales and marketing teams around the world use AI — from the creators and sources given, name them ("In a video this week, … showed…");
   (4) quick hits. Always separate "announced" from "available today" and "rumour" from "confirmed". Credit every claim to its source. Never invent features, numbers,
   prices, dates or quotes — paraphrase only what the summaries say; if a summary is thin, say less. Prefer stories with kind "written or said by the person themselves".
   MMH CORNER (OPTIONAL — it rotates, not every episode): only if there is a realistic, practical use for MMH's daily work — e.g. sales visit notes and CRM, tender documents
   and checklists, translating IFUs / catalogues, training material, customer emails, market research, reports between departments, analysing product feedback —
   add a short "MMH corner" near the end: 60–120 words, 2–3 concrete ideas, one sentence each. If nothing is practical, skip it.
   ${lastAI?.mmh ? 'The previous AI Pulse HAD an MMH corner, so this time include one only if an idea is genuinely strong and new.' : 'The previous AI Pulse had no MMH corner — include one if there is a practical idea.'}
   Outside that corner do NOT force links to MMH.
   HOW TO PRESENT: ${HOW[ed.podcast.show] || ''}
   STYLE: a popular tech YouTuber's weekly AI review — energetic, curious, quick hand-offs ("Okay, next up…", "Here's why this matters…", "Quick reality check…"),
   one vivid everyday image per big tech item, a punchy one-line takeaway after each segment. Still B1 English. No hype words ("insane", "game-changer").
   FIXED CAST (a running series — keep the personality, do not re-introduce the background every time): ${show.hosts.map(h => `${h.id} = ${h.bio || h.name}`).join(' | ')}
   ${MEM.text}
${COMMON}` : `4. podcast: title, one-line desc, recap (2–5 items for the series' memory: topic = 2–5 words, gist = one sentence on what the episode said or concluded, incl. anything to follow up),
   covered (ids of the stories you actually talk about), mmh (false), and turns for a 1,100–1,400 word script (about 8–10 minutes at a relaxed pace). Listener priorities, in this order: (1) the hottest, most-read health news;
   (2) new laws, decrees and circulars on medical-device tenders and procurement, health insurance and hospitals; (3) treatment trends in ophthalmology and dentistry;
   (4) news from hospitals and medical societies. Stories that touch MMH's business come first and deepest.
   ALWAYS TIE IT TO MMH (house rule): this is MMH's own podcast. EVERY story you include must end with a concrete link to MMH — a product group (ophthalmic knives,
   sutures, Manipler, micro forceps, trabeculotomy hook, JIZAI files, DIA-BURS, MMG composite / bond), a customer (eye / dental / surgical hospitals and clinics), a tender step,
   a distributor, a cost or price. Use mmh_impact as your starting point and make it vivid. Economy, law and macro stories (exchange rate, import rules, public investment,
   bidding or tax law) are welcome only with the impact chain spelled out ("…so our import cost from Japan…"). If you cannot link a story to MMH, leave it out.
   No entertainment or celebrity news. ${show.style === 'solo' ? 'One anchor only.' : show.style === 'qa' ? 'A asks short listener-style questions; B answers.' : show.style === 'desk' ? 'B is the health correspondent and carries health in depth; A wraps up other news briefly.' : show.style === 'deep' ? 'Spend half the show explaining the lead story step by step, then a quick round-up.' : 'Two hosts in real conversation.'}
   HOW TO PRESENT TODAY'S SHOW: ${HOW[ed.podcast.show] || ''}
   FIXED CAST (a running series — keep each character's personality and way of speaking exactly; do not re-introduce their background every time, just let it show):
   ${show.hosts.map(h => `${h.id} = ${h.bio || h.name + ' (' + h.role + ')'}`).join(' | ')}
   ${MEM.text}${ed.podcast.show === 'english' ? `\n   THIS WEEK'S LANGUAGE (build the class on these): ${WEEK.join(', ') || 'choose useful work English from today\'s stories'}` : ''}
${COMMON}`;
  const out = await askJson({ system: SYSTEM, effort: 'medium',
    schema: J.obj({ note: J.obj({ en: J.str, vi: J.str }), health: J.obj({ en: J.str, vi: J.str }), vocab: J.arr(J.obj({ en: J.str, vi: J.str, ex: J.str })),
      podcast: J.obj({ title: J.str, desc: J.str, recap: J.arr(J.obj({ topic: J.str, gist: J.str })), covered: J.arr(J.str), mmh: { type: 'boolean' },
        turns: J.arr(J.obj({ sp: { type: 'string', enum: show.hosts.map(h => h.id) }, text: J.str, vi: J.str, rep: { type: 'boolean' } })) }) }),
    user: `Date: ${dateEn(DATE)} (${DATE}). Today's show: "${show.name}" — ${show.desc} Format: ${show.style}. Hosts: ${hosts}.
Recent editions (do not repeat their angle or opening): ${prev.join(' | ') || 'none'}.
1. note: editor's note (60–90 words) in English and Vietnamese.
2. health: analysis for MMH (180–240 words) in English and Vietnamese: dental, eye care, tenders, devices, insurance, market — what changed, who is affected, what MMH should watch.
3. vocab: 8 useful English terms used in the script, with Vietnamese meaning and a short example from the script. Do NOT reuse these terms taught in the last 14 days: ${AV.vocab.join(', ') || 'none'}.
${POD}

${GL.text}
${AI_SHOW ? `AI stories for the podcast — ai: ${JSON.stringify(aiList)}
Health stories (for items 1–2 ONLY, not the podcast): ${JSON.stringify(pick('health').slice(0, 6))}` : `Stories — health: ${JSON.stringify(pick('health'))}
economy: ${JSON.stringify(pick('economy'))}
politics: ${JSON.stringify(pick('politics'))}
society: ${JSON.stringify(pick('society'))}`}` });
  ed.note = out.note; ed.healthDesk.analysis = out.health; ed.vocab = out.vocab;
  ed.podcast.title = out.podcast.title; ed.podcast.desc = out.podcast.desc; ed.podcast.recap = (out.podcast.recap || []).slice(0, 6);
  if (MEM.used.length) ed.podcast.recall = MEM.used.map(m => ({ date: m.date, show: m.show, topic: m.topic }));
  ed.podcast.turns = out.podcast.turns.map(t => voiceTurn({ sp: t.sp, text: t.text, vi: t.vi, rep: t.rep }));
  // tin thật sự được nói trong kịch bản ⇒ sổ "đã lên sóng" (không series nào đọc lại)
  const passed = AI_SHOW ? (picked.aiPod || []) : ['health', 'economy', 'politics', 'society'].flatMap(sec => (picked.sections[sec] || []).filter(fresh));
  const okIds = new Set(passed.map(x => x.id));
  let cov = (out.podcast.covered || []).filter(id => okIds.has(id));
  if (!cov.length) cov = inferCovered(ed.podcast.turns, passed);
  ed.podcast.covered = [...new Set(cov)];
  if (AI_SHOW) ed.podcast.mmh = !!out.podcast.mmh;
  const { PROVIDER, usedModel } = await import('./ai.mjs');
  ed.writer = PROVIDER || 'claude'; ed.model = usedModel();
  try { await reviewScript(ed, SYSTEM); } catch (e) { console.log('Bỏ qua soát kịch bản: ' + e.message); }
  try { await coachWrite(ed, all, SYSTEM); } catch (e) { console.log('Bỏ qua soạn sẵn bài luyện / tóm tắt: ' + e.message); }
  try { await studyWrite(ed, SYSTEM, AV.vocab); } catch (e) { console.log('Bỏ qua bài học từ podcast: ' + e.message); }
}

/* Soát kịch bản TRƯỚC khi tạo giọng (đỡ tốn credit ElevenLabs): mọi tin phải gắn MMH, thẻ cảm xúc đúng luật, không bịa — sửa / bỏ đúng lượt hỏng. */
async function reviewScript(ed, SYSTEM) {
  const { askJson, S: J } = await import('./ai.mjs');
  const T = ed.podcast.turns, I = { type: 'integer' };
  const script = T.map((t, i) => `${i}. ${t.sp}${t.rep ? ' (Listen & Repeat)' : ''}: ${t.say || t.text}`).join('\n');
  const out = await askJson({ system: SYSTEM, effort: 'low', maxTokens: 16000,
    schema: J.obj({ issues: J.arr(J.str), fixes: J.arr(J.obj({ turn: I, text: J.str, vi: J.str })), remove: J.arr(I) }),
    user: `Review this MMH Daily Podcast script before it is sent to the paid voice engine. Check against the house rules:
${SHOWS[ed.podcast.show]?.ai ? `(a) this is the AI & tech episode: technical explanations are correct, plain and concrete; "announced" vs "available" and "rumour" vs "confirmed" are clear;
every claim is credited to its source; do NOT add links to MMH outside the optional "MMH corner"; if the MMH corner exists it is short (≤ 120 words) and practical —
fix it or remove it (list its turns in "remove") if it is vague or forced;
(b) remove nothing else for "lack of MMH link"; remove hype ("insane", "game-changer");` : `(a) every story is clearly linked to MMH's business (products, customers, tenders, distributors, costs) — add a short concrete link where it is missing;
(b) stories with no possible link to MMH are removed (list their turn numbers in "remove");`}
(c) delivery tags: at most one per turn, only [curious] [surprised] [thoughtful] [warmly] [excited] [serious] [chuckles] [sighs], none in Listen & Repeat turns, never cheerful tags on sad news;
(d) spoken rhythm: no three long sentences in a row, one clear key point per story; (e) nothing invented beyond what is already stated;
(f) each character speaks in line with the fixed cast (personality, role); at most ONE brief, natural mention of an earlier episode — remove extra ones and any retelling of old content.
Only return turns that need changing ("fixes": full new English text with tags + its Vietnamese subtitle). Keep fixes few and small. If the script is fine return empty arrays.

Script:
${script}` });
  const drop = new Set((out.remove || []).filter(i => Number.isInteger(i) && i >= 0 && i < T.length && !T[i].rep));
  if (drop.size > T.length / 4) drop.clear();                   // phòng hờ: không để bản soát cắt quá nhiều
  for (const f of out.fixes || []) if (Number.isInteger(f.turn) && T[f.turn] && !drop.has(f.turn) && f.text.trim())
    T[f.turn] = voiceTurn({ sp: T[f.turn].sp, text: f.text, vi: f.vi || T[f.turn].vi, rep: T[f.turn].rep });
  ed.podcast.turns = T.filter((_, i) => !drop.has(i));
  console.log(`Soát kịch bản: sửa ${(out.fixes || []).length} lượt · bỏ ${drop.size} lượt${out.issues?.length ? ' · ' + out.issues.slice(0, 5).join(' | ') : ''}`);
}

/* Bài học từ podcast (trang Nghe ▸ "Học từ số này"): từ mới, cụm hay / câu móc, ngữ pháp, bài kiểm tra nghe — gắn với lượt lời để bấm nghe lại. */
async function studyWrite(ed, SYSTEM, avoid) {
  const { askJson, S: J } = await import('./ai.mjs');
  const T = ed.podcast.turns, I = { type: 'integer' };
  const script = T.map((t, i) => `${i}. ${t.sp}: ${t.text}`).join('\n');
  const out = await askJson({ system: SYSTEM, effort: 'low', maxTokens: 24000, schema: J.obj({
      words: J.arr(J.obj({ en: J.str, vi: J.str, ex: J.str, turn: I })),
      phrases: J.arr(J.obj({ en: J.str, vi: J.str, use: J.str, turn: I })),
      grammar: J.arr(J.obj({ p: J.str, vi: J.str, ex: J.str, turn: I })),
      quiz: J.arr(J.obj({ kind: { type: 'string', enum: ['gist', 'detail', 'vocab', 'inference'] }, q: J.str, opts: J.arr(J.str), a: I, why: J.str, turn: I })) }),
    user: `Build a listening lesson from today's MMH Daily podcast script for a B1 learner (MMH product & sales manager). Use ONLY what is in the script; "turn" = the line number where it is heard.
words: 12 useful new words or terms from the script (work + health + business), not already taught recently: ${[...(ed.vocab || []).map(v => v.en), ...(avoid || [])].join(', ') || 'none'}.
  vi = short Vietnamese meaning; ex = the exact sentence from the script that contains it.
phrases: 6 natural chunks worth copying — hooks, collocations, everyday idioms, ways to react or hand over (e.g. "Here's the thing", "keep an eye on"). vi = meaning; use = one short Vietnamese tip on when to use it at work.
grammar: 3 patterns used in the script (conditionals, passive, "as long as", reported speech…). p = the pattern, vi = one-sentence Vietnamese explanation, ex = the script sentence.
quiz: 8 listening questions in English, in script order: 2 gist, 4 detail, 1 vocab-in-context, 1 inference. opts = 4 short options, exactly one correct, a = index of the correct option (0-3); vary the position of the answer.
  why = one Vietnamese sentence explaining the answer.

Script:
${script}` });
  const n = T.length, ok = x => Number.isInteger(x.turn) && x.turn >= 0 && x.turn < n;
  ed.study = {
    words: out.words.filter(ok).slice(0, 14), phrases: out.phrases.filter(ok).slice(0, 8), grammar: out.grammar.filter(ok).slice(0, 4),
    quiz: out.quiz.filter(q => ok(q) && q.opts.length === 4 && q.a >= 0 && q.a < 4).slice(0, 10)
  };
  console.log(`Bài học từ podcast: ${ed.study.words.length} từ · ${ed.study.phrases.length} cụm · ${ed.study.grammar.length} ngữ pháp · ${ed.study.quiz.length} câu hỏi nghe`);
}

/* Soạn sẵn cho app (để mở ra là dùng ngay, không phải chờ AI trên điện thoại):
   ① bài luyện nói 3 mức cho 4 tin liên quan MMH nhất; ② tóm tắt theo chủ đề (đấu thầu, pháp quy, nhãn khoa, nha khoa, bệnh viện, PESTEL). */
const BRIEFS = [
  ['tender', 'Đấu thầu & trang thiết bị y tế: có gì mới?', 'tenders, procurement and medical devices/equipment'],
  ['legal', 'Văn bản pháp quy mới liên quan đến MMH', 'new laws, decrees, circulars, decisions affecting medical devices, tenders, health insurance, hospitals'],
  ['eye', 'Nhãn khoa: tin mới và xu hướng điều trị', 'ophthalmology / eye care news and treatment trends'],
  ['dental', 'Nha khoa: tin mới và xu hướng điều trị', 'dentistry / oral health news and treatment trends'],
  ['hospital', 'Bệnh viện: thông tin đáng chú ý', 'hospitals: new techniques, investment, capacity, management'],
  ['pestel', 'PESTEL hôm nay: yếu tố nào ảnh hưởng MMH?', 'all stories, grouped by PESTEL factor, focusing on what matters for MMH']
];
async function coachWrite(ed, all, SYSTEM) {
  const { askJson, S: J } = await import('./ai.mjs');
  const rel = all.filter(x => x.sec === 'health' || (x.tags || []).some(t => ['tender', 'device', 'policy', 'insurance', 'eye', 'dental'].includes(t))).sort((a, b) => (b.mmh || 0) - (a.mmh || 0));
  const top = rel.slice(0, 4);
  const list = all.map(x => ({ id: x.id, sec: x.sec, tags: x.tags, source: x.src, date: x.d.slice(0, 10), title: x.h_en || x.t, title_vi: x.h_vi || (x.lang === 'vi' ? x.t : ''), summary: x.s_en || x.sum, summary_vi: x.s_vi || (x.lang === 'vi' ? x.sum : '') }));
  const L = J.obj({ story: J.str, vi: J.str, en: J.str, d: J.arr(J.arr(J.str)), keys: J.arr(J.obj({ vi: J.str, en: J.str })), chunks: J.arr(J.obj({ vi: J.str, en: J.str })),
    ideas: J.arr(J.obj({ vi: J.str, any: J.arr(J.arr(J.str)) })), grammar: J.arr(J.obj({ p: J.str, vi: J.str })), alt: J.arr(J.str) });
  const B = J.obj({ id: J.str, src: J.arr(J.str), en: J.arr(J.str), vi: J.arr(J.str), pestel: J.arr(J.obj({ f: J.str, note: J.str })), mmh: J.str, words: J.arr(J.obj({ en: J.str, vi: J.str })) });
  const out = await askJson({ system: SYSTEM, effort: 'low', maxTokens: 32000, schema: J.obj({ lessons: J.arr(L), briefs: J.arr(B) }),
    user: `Prepare study material for the MMH Daily Podcast app. The learner is MMH's product & sales manager, English level B1.
A. lessons: one speaking drill for EACH of these story ids: ${top.map(x => x.id).join(', ')}.
   story = the story id. vi = 1-2 natural Vietnamese sentences (max 40 words) faithful to the story. en = natural English translation with EXACTLY 3 key words/short phrases marked [[like this]].
   d = for each marked phrase in order, 2 clearly WRONG options a learner might confuse. keys = 3-6 difficult phrases {vi exactly as written in vi, en}.
   chunks = 2-3 consecutive parts {vi, en} splitting the text. ideas = 3-5 meaning units {vi: short label, any: groups of lowercase English fragments; the idea counts as said when every group has one fragment in the answer; include synonyms and stems}.
   grammar = 2 {p: pattern, vi: one-sentence Vietnamese explanation}. alt = 1-2 alternative English versions.
B. briefs: one brief for EACH topic id below, using ONLY the stories provided (never invent facts). Skip nothing: if no story fits, return the brief with empty en/vi arrays.
   src = ids of the stories used (most important first, max 6). en = 3-6 short B1-B2 English bullets; cite sources as [1], [2] … = position in YOUR src list. vi = the same bullets in Vietnamese with the same citations.
   pestel = factors present {f: one of P, E, S, T, M (environment), L; note: short Vietnamese note with citation}. mmh = 1-3 Vietnamese sentences on the impact on MMH (dental, ophthalmic, surgical products, tenders, distributors); "Chưa thấy ảnh hưởng trực tiếp." if none.
   words = 4-6 useful English terms from your bullets with Vietnamese meaning.
   Topics: ${BRIEFS.map(([id, q, d]) => `${id} = ${d}`).join('; ')}.

Stories (JSON): ${JSON.stringify(list)}` });
  const fix = x => ({ story: x.story, vi: x.vi, en: x.en, d: x.d, keys: x.keys.map(k => [k.vi, k.en]), chunks: x.chunks.map(k => [k.vi, k.en]), ideas: x.ideas.map(i => [i.vi, i.any]), grammar: x.grammar.map(g => [g.p, g.vi]), alt: x.alt });
  const ids = new Set(all.map(x => x.id));
  ed.coach = {
    lessons: Object.fromEntries((out.lessons || []).filter(x => ids.has(x.story) && /\[\[.+?\]\]/.test(x.en)).map(x => [x.story, fix(x)])),
    briefs: (out.briefs || []).map(b => { const q = BRIEFS.find(z => z.id === b.id || z[0] === b.id); return q && b.en.length ? { id: q[0], q: q[1], src: b.src.filter(i => ids.has(i)), en: b.en, vi: b.vi, pestel: b.pestel, mmh: b.mmh, words: b.words } : null; }).filter(Boolean)
  };
  console.log(`Soạn sẵn: ${Object.keys(ed.coach.lessons).length} bài luyện nói · ${ed.coach.briefs.length} bản tóm tắt chủ đề`);
}

/* Bộ thuật ngữ chuẩn MMH (context/glossary.tsv, rút từ MMH Library ▸ glossary nhãn khoa / nha khoa + thuật ngữ thầu / BHYT):
   KHÔNG gửi cả bộ (~1.400 dòng) — chỉ những thuật ngữ thật sự có trong tin hôm nay, tối đa 60 ⇒ vài trăm token / lượt. */
let GLOSS = null;
function glossaryFor(stories) {
  if (!GLOSS) GLOSS = (() => { try { return fs.readFileSync(path.join(ROOT, 'context', 'glossary.tsv'), 'utf8').split('\n').slice(1).map(l => l.split('\t')).filter(r => r[0] && r[1]); } catch { return []; } })();
  const text = ' ' + stories.map(x => [x.t, x.sum, x.h_en, x.h_vi, x.s_en, x.s_vi].filter(Boolean).join(' ')).join(' ').toLowerCase().replace(/\s+/g, ' ') + ' ';
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hit = GLOSS.filter(([en, vi]) => { const e = en.toLowerCase(), v = vi.toLowerCase().replace(/\s*\(.*?\)/g, '');
    return (e.length >= 4 && new RegExp(`(^|[^a-z])${esc(e)}(s|es)?([^a-z]|$)`).test(text)) || (v.length >= 5 && text.includes(' ' + v)); })
    .sort((a, b) => b[0].length - a[0].length).slice(0, 60);
  return { n: hit.length, text: hit.length ? `\nGLOSSARY (MMH standard terms — use these Vietnamese renderings in "vi", s_vi, h_vi): ${hit.map(([en, vi]) => `${en} = ${vi}`).join('; ')}` : '' };
}

/* Sổ ghi nhớ của các series — data/memory.json (~5 tháng): mỗi số = chủ đề + ý chính (recap do Claude viết).
   Mỗi sáng tìm số cũ có chủ đề gần với tin hôm nay (mọi series); chỉ khoảng 1/3 số được phép nhắc lại, và tối đa 1 lần, cho tự nhiên (người dùng chốt 23/11/2026). */
const MEM_F = path.join(ROOT, 'data', 'memory.json');
const MEM_P = +(process.env.DAILY_RECALL_P || 0.35);
const kw = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOPW.has(w)));
function memRecall(picked, show, date) {
  const mem = readJson(MEM_F, []);
  const today = SHOWS[show]?.ai ? (picked.aiPod || []).slice(0, 10)
    : [...(picked.sections?.health || []).slice(0, 8), ...(picked.docs || []).slice(0, 4), ...(picked.sections?.economy || []).slice(0, 3)];
  const W = kw(today.map(x => [x.h_en, x.t, x.s_en, (x.tags || []).join(' ')].join(' ')).join(' '));
  const day = d => Math.floor(new Date(d + 'T00:00:00Z') / 864e5), now = day(date);
  const cands = [];
  for (const e of mem) {
    const age = now - day(e.date); if (age < 2) continue;
    for (const it of e.items || []) {
      const k = kw(it.topic + ' ' + it.gist); let sc = 0; for (const w of k) if (W.has(w)) sc++;
      if (sc >= 3) cands.push({ date: e.date, show: e.show, name: e.name, topic: it.topic, gist: it.gist, sc: sc + (e.show === show ? 1 : 0) - age / 60 });
    }
  }
  cands.sort((a, b) => b.sc - a.sc);
  const pool = [...new Map(cands.map(c => [c.date + c.topic, c])).values()].slice(0, 4);
  if (show === 'english' || !pool.length || Math.random() >= MEM_P) return { used: [], text: 'EARLIER EPISODES: do not refer to earlier episodes today.' };
  const used = pool.sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.5 ? 1 : 2);
  const ago = d => { const n = now - day(d); return n < 7 ? 'a few days ago' : n < 14 ? 'last week' : n < 35 ? Math.round(n / 7) + ' weeks ago' : 'a while back'; };
  return { used, text: `EARLIER EPISODES you MAY mention — at most ONE brief, natural mention (half a sentence, e.g. "…which we touched on ${ago(used[0].date)}"), only where today's story really continues it; never retell it; skipping it is fine: ${used.map(m => `[${ago(m.date)}, ${m.name}] ${m.topic}: ${m.gist}`).join(' | ')}` };
}

/* Lịch sử 30 ngày (chống lặp kiểu chương trình, câu mở / kết, cụm từ cửa miệng, từ vựng) — data/history.json */
const HIST_F = path.join(ROOT, 'data', 'history.json');
const STOPW = new Set('the a an and or but of to in on at for with is are was were be been it its this that these those we you they i he she our your their so as by from about just really yeah okay right well'.split(' '));
const grams = text => { const w = String(text).toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean); const out = new Set();
  for (let n = 3; n <= 4; n++) for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n); if (g.filter(x => !STOPW.has(x)).length >= 1) out.add(g.join(' ')); } return [...out]; };
function historyAvoid(hist) {
  const recent = hist.slice(0, 6), cnt = new Map();
  recent.forEach(h => (h.grams || []).forEach(g => cnt.set(g, (cnt.get(g) || 0) + 1)));
  const phrases = [...cnt].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([g]) => g).slice(0, 40);
  return { opens: recent.map(h => h.open).filter(Boolean), closes: recent.map(h => h.close).filter(Boolean), phrases,
    vocab: [...new Set(hist.slice(0, 14).flatMap(h => h.vocab || []))].slice(0, 120) };
}
/* Lần đầu có sổ "đã lên sóng": ghi lại tin của các số podcast còn giữ (suy từ lời thoại). */
function seedAired() {
  if (fs.existsSync(AIRED_F)) return;
  const rows = [];
  for (const f of fs.existsSync(ED_DIR) ? fs.readdirSync(ED_DIR) : []) {
    const d = f.replace(/\.json$/, ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d >= DATE) continue;
    const e = readJson(path.join(ED_DIR, f), null); if (!e?.podcast?.turns?.length) continue;
    const st = Object.entries(e.stories || {}).map(([id, x]) => ({ ...x, id }));
    const ids = e.podcast.covered?.length ? e.podcast.covered : inferCovered(e.podcast.turns, st);
    const by = new Map(st.map(x => [x.id, x]));
    rows.push({ date: d, show: e.podcast.show, ids, heads: ids.map(id => [by.get(id)?.h_en, by.get(id)?.t].filter(Boolean).join(' · ').slice(0, 260)) });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  fs.writeFileSync(AIRED_F, JSON.stringify(rows));
  console.log(`Sổ đã lên sóng: khởi tạo từ ${rows.length} số cũ (${rows.reduce((n, r) => n + r.ids.length, 0)} tin)`);
}
const KEEP_EDITIONS = +(process.env.DAILY_KEEP || 7);   // chỉ giữ 7 số / podcast gần nhất
const slim = x => x && ({ id: x.id, t: x.t, u: x.u, src: x.src, d: x.d, lang: x.lang, sec: x.sec, tags: x.tags, mmh: x.mmh, docs: x.docs, img: x.img, also: x.also, kind: x.kind,
  sum: x.sum, h_en: x.h_en, h_vi: x.h_vi, dek: x.dek, s_vi: x.s_vi, s_en: x.s_en, why: x.why, mt: x.mt, fk: x.fk, views: x.views });

async function main() {
  const pool = readJson(path.join(ROOT, 'data', 'pool.json'), null);
  if (!pool) throw new Error('Chưa có data/pool.json — chạy collect.mjs trước');
  seedAired();
  const picked = pick(pool);
  const HIST = readJson(HIST_F, []).filter(h => h.date !== DATE);
  const onlyAI = FILTER.topics.length && FILTER.topics.every(t => t === 'ai');   // app ▸ Tổng hợp ngay chỉ chọn chủ đề AI ⇒ số AI Pulse
  let showId = (process.env.DAILY_SHOW && SHOWS[process.env.DAILY_SHOW]) ? process.env.DAILY_SHOW : onlyAI ? 'aipulse' : pickShow(DATE, picked, HIST);
  if (SHOWS[showId].ai) picked.sections.ai = [...new Map([...picked.aiPod, ...picked.sections.ai].map(x => [x.id, x])).values()].slice(0, 12);
  console.log(`Tin AI: ${picked.sections.ai.length} trên báo · ${picked.aiPod.length} chưa lên sóng · sổ đã lên sóng ${picked.AIR.n} số / ${picked.AIR.ids.size} tin`);
  const useAI = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
  const index = readJson(path.join(ROOT, 'data', 'index.json'), { editions: [] });
  const no = (index.editions.find(e => e.date === DATE)?.no) || (index.editions.length ? Math.max(...index.editions.map(e => e.no || 0)) + 1 : 1);
  const ed = {
    date: DATE, no, updated: iso(NOW), writer: '',
    lead: picked.lead?.id, sections: {}, healthDesk: { groups: picked.desk, order: Object.keys(DESK) }, docs: picked.docs.map(x => x.id),
    podcast: { show: showId, name: SHOWS[showId].name, hosts: SHOWS[showId].hosts, color: SHOWS[showId].color, rate: SHOWS[showId].rate || '-5%', learn: learnFor(DATE, showId) },
    filter: (FILTER.sources.length || FILTER.topics.length) ? { sources: FILTER.sources, topics: FILTER.topics, by: process.env.DAILY_BY || '' } : undefined,
    stories: {}, sources: pool.status.map(s => ({ id: s.id, lang: s.lang, ok: !!s.ok, kept: s.kept })),
  };
  const freeWrite = async () => {
    if (process.env.DAILY_MT !== '0') {
      // dịch: tin của số báo + tin dự phòng cho podcast (y tế nhiều nhất)
      const extra = ['health', 'economy', 'politics', 'society'].flatMap(sec => picked.cand.filter(x => x.sec === sec).slice(0, sec === 'health' ? 24 : 10));
      const list = [...new Map([...Object.values(picked.sections).flat(), ...picked.docs, ...Object.values(picked.desk).flat().map(id => picked.cand.find(y => y.id === id)).filter(Boolean), ...extra].map(x => [x.id, x])).values()];
      try { console.log(`Dịch máy: ${await translateStories(list)}/${list.length} tin`); } catch (e) { console.log('Bỏ qua dịch máy: ' + e.message); }
    }
    templateWrite(ed, picked);
    if (process.env.DAILY_MT !== '0') {
      try {
        const { out, ok } = await translate(ed.podcast.turns.map(t => t.text), 'en', 'vi');
        ed.podcast.turns.forEach((t, i) => { if (out[i]) t.vi = out[i]; });
        console.log(`Phụ đề Việt: ${ok}/${ed.podcast.turns.length} lượt lời`);
      } catch (e) { console.log('Bỏ qua phụ đề Việt: ' + e.message); }
    }
  };
  if (useAI) {
    try { await claudeWrite(ed, picked); }
    catch (e) { console.log('AI lỗi, dùng bản miễn phí: ' + e.message); await freeWrite(); }
  } else await freeWrite();

  const keep = new Map();
  for (const [sec, arr] of Object.entries(picked.sections)) { ed.sections[sec] = arr.map(x => x.id); arr.forEach(x => keep.set(x.id, x)); }
  picked.docs.forEach(x => keep.set(x.id, x));
  (picked.read || []).forEach(x => keep.set(x.id, x));
  for (const ids of Object.values(picked.desk)) ids.forEach(id => { const x = picked.cand.find(y => y.id === id); if (x) keep.set(id, x); });
  for (const [id, x] of keep) ed.stories[id] = slim(x);
  ed.used = [...keep.keys()];
  const words = ed.podcast.turns.reduce((s, t) => s + t.text.split(/\s+/).length, 0);
  ed.podcast.words = words;

  fs.mkdirSync(ED_DIR, { recursive: true });
  fs.writeFileSync(path.join(ED_DIR, DATE + '.json'), JSON.stringify(ed));
  const lead = ed.stories[ed.lead];
  const row = { date: DATE, no, show: showId, title: ed.podcast.title, lead: lead ? (lead.h_en || lead.t) : '', writer: ed.writer, words };
  index.editions = [row, ...index.editions.filter(e => e.date !== DATE)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, KEEP_EDITIONS);
  const keepDates = new Set(index.editions.map(e => e.date));
  for (const f of fs.readdirSync(ED_DIR)) { const d = f.replace(/\.json$/, ''); if (/^\d{4}-\d{2}-\d{2}$/.test(d) && !keepDates.has(d)) fs.unlinkSync(path.join(ED_DIR, f)); }
  index.updated = iso(NOW);
  fs.writeFileSync(path.join(ROOT, 'data', 'index.json'), JSON.stringify(index));
  // sổ "đã lên sóng": tin podcast hôm nay đã nói ⇒ không series nào đọc lại trong 30 ngày
  const look = new Map([...picked.cand, ...picked.aiPod, ...Object.values(picked.sections).flat(), ...picked.docs].map(x => [x.id, x]));
  console.log(`Đã lên sóng hôm nay: ${recordAired(DATE, showId, (ed.podcast.covered || []).map(id => look.get(id)).filter(Boolean))} tin`);
  const T = ed.podcast.turns, all = T.map(t => t.text).join(' ');
  const hrow = { date: DATE, show: showId, writer: ed.writer, mmh: ed.podcast.mmh || undefined, open: (T[0]?.text || '').slice(0, 140), close: (T[T.length - 1]?.text || '').slice(0, 140),
    vocab: [...(ed.vocab || []).map(v => v.en), ...(ed.study?.words || []).map(w => w.en)], phr: (ed.study?.phrases || []).map(p => p.en), grams: grams(all).slice(0, 700) };
  fs.writeFileSync(HIST_F, JSON.stringify([hrow, ...HIST].slice(0, 30)));
  if (ed.podcast.recap?.length) {
    const mem = readJson(MEM_F, []).filter(e => e.date !== DATE);
    mem.unshift({ date: DATE, show: showId, name: SHOWS[showId].name, title: ed.podcast.title, items: ed.podcast.recap });
    fs.writeFileSync(MEM_F, JSON.stringify(mem.slice(0, 150)));
  }
  console.log(`Số ${no} · ${DATE} · ${SHOWS[showId].name} · viết bằng ${ed.writer} · ${words} từ · ${Object.keys(ed.stories).length} tin`);
}
main().catch(e => { console.error(e); process.exit(1); });
