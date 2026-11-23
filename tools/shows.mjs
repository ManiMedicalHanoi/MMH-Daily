// MMH Daily — các chương trình podcast (đổi theo ngày, không ngày nào giống ngày nào) + giọng đọc + bảng thuật ngữ.
// Giọng: Microsoft Edge neural (edge-tts, miễn phí). Mỗi chương trình có người dẫn riêng ⇒ nghe là nhận ra.

export const SHOWS = {
  /* ── 5 SERIES CỐ ĐỊNH (23/11/2026, người dùng duyệt) — nhân vật, tính cách, giọng không đổi giữa các số; xem PODCAST.md ▸ 7 ── */
  talk: {
    name: 'MMH Talk', vi: 'Trò chuyện MMH', style: 'duo', mode: 'duo', rate: '-4%', series: true,
    desc: 'Emma and Daniel talk through the stories that matter most for MMH this week.',
    hosts: [
      { id: 'A', name: 'Emma', voice: 'en-US-EmmaMultilingualNeural', el: 'hpp4J3VqNfWAUOO0d1Us', role: 'Host',
        bio: 'Emma, the main host. Curious, warm, asks the questions a busy sales person would ask; likes concrete examples; laughs easily but never at bad news.' },
      { id: 'B', name: 'Daniel', voice: 'en-US-BrianMultilingualNeural', el: 'iP95p4xoKVk53GoZ742B', role: 'Co-host',
        bio: 'Daniel, co-host. Used to work in hospital procurement before joining the industry side; calm, a little sceptical, explains how tenders and hospital budgets really work; pushes back politely, then finds common ground.' }],
    color: '#1F5E8C',
  },
  clinicroom: {
    name: 'The Clinic Room', vi: 'Phòng khám', style: 'duo', mode: 'duo', rate: '-6%', series: true,
    desc: 'Dr. Sarah explains eye care and dentistry — conditions, techniques, instruments — while Minh asks the questions.',
    hosts: [
      { id: 'A', name: 'Sarah', voice: 'en-GB-SoniaNeural', el: 'Xb7hH8MSUJpSbSDYk0k2', role: 'Clinical educator',
        bio: 'Dr. Sarah, a British clinician who teaches ophthalmology and dentistry workshops. Clear, patient, uses simple images ("think of the cornea as a window"); always explains which step of the procedure an instrument is used in.' },
      { id: 'B', name: 'Minh', voice: 'en-US-AndrewMultilingualNeural', el: 'bIHbv24MWmeRgasZH58o', role: 'Sales rep, learning',
        bio: 'Minh, a young MMH sales rep who visits eye and dental clinics. Friendly, honest about what he does not know, asks the questions a B1 listener would ask, connects the answer to what doctors tell him on visits.' }],
    color: '#2E7D8C',
  },
  lawdesk: {
    name: 'Law & Tender Desk', vi: 'Bàn luật & thầu', style: 'solo', mode: 'm', rate: '-7%', series: true,
    desc: 'Thomas walks through new laws, decrees and tender rules — what changed, who is affected, from when, what MMH should do.',
    hosts: [
      { id: 'A', name: 'Thomas', voice: 'en-GB-ThomasNeural', el: 'JBFqnCBsd6RMkjVDRZzb', role: 'Legal explainer',
        bio: 'Thomas, a calm British legal explainer. Speaks slowly and precisely, numbers his points ("First… Second…"), translates legal language into plain English, ends each item with one practical step for MMH.' }],
    color: '#5B3F8C',
  },
  headlines: {
    name: 'Morning Headlines', vi: 'Thời sự buổi sáng', style: 'solo', mode: 'm', rate: '-5%', series: true,
    desc: 'Andrew, news anchor: the hottest economy, politics, society and health headlines — and what each means for MMH.',
    hosts: [
      { id: 'A', name: 'Andrew', voice: 'en-GB-RyanNeural', el: 'onwK4e9ZLuTAKqWW03F9', role: 'News anchor',
        bio: 'Andrew, a steady broadcast anchor. Crisp, confident, slightly faster pace; short punchy sentences; every headline gets a one-line "for MMH, this means…".' }],
    color: '#A23B3B',
  },
  english: {
    name: 'English at Work', vi: 'Tiếng Anh công sở', style: 'duo', mode: 'duo', rate: '-7%', series: true,
    desc: 'Saturday class: Ms. Olivia and Minh review the week\'s words and phrases and role-play real MMH situations.',
    hosts: [
      { id: 'A', name: 'Olivia', voice: 'en-US-AvaMultilingualNeural', el: 'XrExE9yKIg1WjnnlVkGX', role: 'English teacher',
        bio: 'Ms. Olivia, an English teacher for business people. Encouraging, structured, corrects gently ("Nice try — we usually say…"), gives the learner time to answer.' },
      { id: 'B', name: 'Minh', voice: 'en-US-AndrewMultilingualNeural', el: 'bIHbv24MWmeRgasZH58o', role: 'Learner (MMH sales rep)',
        bio: 'Minh, the same young MMH sales rep from The Clinic Room, now as the student; makes the typical small mistakes of a Vietnamese B1 speaker and improves during the lesson.' }],
    color: '#8A5A00',
  },
  /* ── 24/11/2026 (người dùng yêu cầu): series AI — phong cách YouTuber review công nghệ, tin AI quốc tế, góc ứng dụng cho MMH chỉ khi thực tế ── */
  aipulse: {
    name: 'AI Pulse', vi: 'Nhịp AI', style: 'solo', mode: 'm', rate: '-3%', series: true, ai: true,
    desc: 'Liam, tech creator: what the people building AI are saying, the newest models and tools explained, and how sales & marketing teams use them.',
    hosts: [
      { id: 'A', name: 'Liam', voice: 'en-US-RogerNeural', el: 'TX3LPaxmHKxFdv7VOQHJ', role: 'Tech creator',
        bio: 'Liam, a popular tech YouTuber who reviews AI every week. Energetic, quick, genuinely excited by good engineering but allergic to hype; always separates "announced" from "you can use it today" and "rumour" from "confirmed"; explains how things work with everyday images ("a context window is the model\'s desk — how many pages it can keep open at once"); credits who said or showed what; ends segments with a punchy one-line takeaway.' }],
    color: '#3949AB',
  },
  /* ── các chương trình cũ: giữ để mở lại số cũ (không còn trong lịch) ── */
  briefing: {
    mode: 'm', rate: '-6%',
    name: 'The Morning Briefing', vi: 'Bản tin sáng', style: 'solo',
    desc: 'One anchor, the day’s essential stories in about eight minutes.',
    hosts: [{ id: 'A', name: 'Andrew', voice: 'en-US-AndrewMultilingualNeural', role: 'Anchor' }],
    color: '#1F4E79',
  },
  twotakes: {
    mode: 'duo', rate: '-4%',
    name: 'Two Takes', vi: 'Hai góc nhìn', style: 'duo',
    desc: 'Two hosts trade views on the stories everyone will talk about today.',
    hosts: [{ id: 'A', name: 'Emma', voice: 'en-US-EmmaMultilingualNeural', role: 'Host' }, { id: 'B', name: 'Brian', voice: 'en-US-BrianMultilingualNeural', role: 'Co-host' }],
    color: '#7A3E9D',
  },
  healthdesk: {
    mode: 'duo', rate: '-5%',
    name: 'Health Desk', vi: 'Bàn tin Y tế', style: 'desk',
    desc: 'Tenders, policy, public investment and the big hospitals — the health sector in depth.',
    hosts: [{ id: 'A', name: 'Ava', voice: 'en-US-AvaMultilingualNeural', role: 'Host' }, { id: 'B', name: 'Ryan', voice: 'en-GB-RyanNeural', role: 'Health correspondent' }],
    color: '#0E7C6B',
  },
  markets: {
    mode: 'duo', rate: '-5%',
    name: 'Market Watch', vi: 'Nhịp kinh tế', style: 'duo',
    desc: 'Growth, trade, investment and the money stories behind the headlines.',
    hosts: [{ id: 'A', name: 'Christopher', voice: 'en-US-ChristopherNeural', role: 'Host' }, { id: 'B', name: 'Libby', voice: 'en-GB-LibbyNeural', role: 'Economics analyst' }],
    color: '#B8641B',
  },
  editor: {
    mode: 'duo', rate: '-5%',
    name: 'Ask the Editor', vi: 'Hỏi biên tập viên', style: 'qa',
    desc: 'A host puts the listener’s questions to the editor: what happened, why it matters, what next.',
    hosts: [{ id: 'A', name: 'Jenny', voice: 'en-US-JennyNeural', role: 'Host' }, { id: 'B', name: 'Thomas', voice: 'en-GB-ThomasNeural', role: 'Editor' }],
    color: '#2F6F9F',
  },
  explainer: {
    mode: 'duo', rate: '-6%',
    name: 'The Explainer', vi: 'Giải thích', style: 'deep',
    desc: 'One big story, unpacked step by step — then the rest of the news in brief.',
    hosts: [{ id: 'A', name: 'Michelle', voice: 'en-US-MichelleNeural', role: 'Host' }, { id: 'B', name: 'Guy', voice: 'en-US-GuyNeural', role: 'Reporter' }],
    color: '#A23B3B',
  },
  // ── thêm 23/11/2026: đa dạng kiểu trình bày + giọng (xem PODCAST.md) ──
  notes: {
    name: 'Morning Notes', vi: 'Ghi chú buổi sáng', style: 'solo', mode: 'f', rate: '-7%',
    desc: 'One calm voice walks you through what matters this morning, story by story.',
    hosts: [{ id: 'A', name: 'Ava', voice: 'en-US-AvaMultilingualNeural', role: 'Host' }],
    color: '#6B4E9B',
  },
  clinic: {
    name: 'Clinic Notes', vi: 'Góc lâm sàng', style: 'duo', mode: 'duo', rate: '-5%',
    desc: 'Eye care and dentistry: what is changing in the clinic, and what it means for the products we sell.',
    hosts: [{ id: 'A', name: 'Sonia', voice: 'en-GB-SoniaNeural', role: 'Host' }, { id: 'B', name: 'Andrew', voice: 'en-US-AndrewMultilingualNeural', role: 'Clinical reporter' }],
    color: '#2E7D8C',
  },
  story: {
    name: 'One Story', vi: 'Một câu chuyện', style: 'deep', mode: 'm', rate: '-7%',
    desc: 'One storyteller takes the biggest story of the day and tells it from start to finish.',
    hosts: [{ id: 'A', name: 'Ryan', voice: 'en-GB-RyanNeural', role: 'Storyteller' }],
    color: '#5A4632',
  },
  quickfive: {
    name: 'Quick Five', vi: 'Năm tin nhanh', style: 'duo', mode: 'duo', rate: '-5%',
    desc: 'Five short stories, each with a quick question for you — fast, light, easy to follow.',
    hosts: [{ id: 'A', name: 'Libby', voice: 'en-GB-LibbyNeural', role: 'Host' }, { id: 'B', name: 'Christopher', voice: 'en-US-ChristopherNeural', role: 'Co-host' }],
    color: '#C0582B',
  },
  weekly: {
    mode: 'duo', rate: '-5%', series: true,
    name: 'Week in Review', vi: 'Nhìn lại tuần', style: 'duo',
    desc: 'Sunday: Emma and Daniel (MMH Talk) connect the week\'s stories and say what to watch next week.',
    hosts: [
      { id: 'A', name: 'Emma', voice: 'en-US-EmmaMultilingualNeural', el: 'hpp4J3VqNfWAUOO0d1Us', role: 'Host', bio: 'Emma from MMH Talk (same personality).' },
      { id: 'B', name: 'Daniel', voice: 'en-US-BrianMultilingualNeural', el: 'iP95p4xoKVk53GoZ742B', role: 'Co-host', bio: 'Daniel from MMH Talk (same personality).' }],
    color: '#3D5A3D',
  },
};

// Bản tin nội bộ Chủ nhật — xoay vòng theo tuần: lúc 1 người dẫn, lúc 2 người.
export const SHOWS_INTERNAL = {
  thisweek: { name: 'MMH This Week', vi: 'MMH tuần này', style: 'duo', desc: 'Two colleagues look back at the week across MMH.',
    hosts: [{ id: 'A', name: 'Ava', voice: 'en-US-AvaMultilingualNeural', role: 'Host' }, { id: 'B', name: 'Andrew', voice: 'en-US-AndrewMultilingualNeural', role: 'Co-host' }], color: '#8A5A00' },
  notes: { name: 'Sunday Notes', vi: 'Ghi chú Chủ nhật', style: 'solo', desc: 'One host, the week at MMH in a relaxed Sunday chat.',
    hosts: [{ id: 'A', name: 'Emma', voice: 'en-US-EmmaMultilingualNeural', role: 'Host' }], color: '#6B4E9B' },
  roundup: { name: 'The MMH Roundup', vi: 'Tổng kết tuần', style: 'duo', desc: 'Wins, field work and what’s next — the team roundup.',
    hosts: [{ id: 'A', name: 'Brian', voice: 'en-US-BrianMultilingualNeural', role: 'Host' }, { id: 'B', name: 'Sonia', voice: 'en-GB-SoniaNeural', role: 'Co-host' }], color: '#2F6F5E' },
  desk: { name: 'From the Desk', vi: 'Từ bàn làm việc', style: 'solo', desc: 'One voice, the week’s numbers and stories from every team.',
    hosts: [{ id: 'A', name: 'Andrew', voice: 'en-US-AndrewMultilingualNeural', role: 'Host' }], color: '#1F4E79' },
};

/* Lịch tuần (0 = CN): T2 MMH Talk · T3 The Clinic Room · T4 Law & Tender Desk · T5 AI Pulse · T6 Morning Headlines · T7 English at Work · CN Week in Review.
   (24/11/2026: T5 đổi từ MMH Talk sang AI Pulse — người dùng yêu cầu thêm chủ đề AI, các series luân phiên.) */
export const SCHEDULE = ['weekly', 'talk', 'clinicroom', 'lawdesk', 'aipulse', 'headlines', 'english'];
const ROTATION = ['talk', 'clinicroom', 'lawdesk', 'headlines'];
const DAILY_SHOWS = [...ROTATION];
/* Cách trình bày từng chương trình (đưa vào lời dặn AI). */
export const HOW = {
  talk: 'MMH Talk: Emma and Daniel in a real conversation about the 2–3 stories that matter most for MMH, then a quick round of 2–3 shorter items. Emma asks, Daniel brings the hospital-procurement view; they may disagree a little, then agree on what it means for MMH.',
  clinicroom: 'The Clinic Room: a teaching episode on eye care or dentistry built on today\'s clinical / hospital stories (or, if few, one condition or procedure linked to the news). Dr. Sarah explains the condition, the procedure step by step and where instruments are used (ophthalmic knives, sutures, micro forceps, trabeculotomy hook, endo files, diamond burs, composites); Minh asks plain questions and says what he hears from doctors. Other news: at most two sentences at the end.',
  lawdesk: 'Law & Tender Desk: Thomas alone. For each legal item (law, decree, circular, tender rule, insurance price list): 1) what changed, 2) who is affected, 3) from when, 4) one practical step for MMH. Explain every legal term in plain English. If there are few legal items, explain one in depth and add the most relevant tender / hospital-procurement news.',
  headlines: 'Morning Headlines: Andrew alone, broadcast style. 5–7 headlines across health, economy, policy and society — only those with a link to MMH — each 3–5 sentences ending with "for MMH, this means…" (vary the wording). Lead with the most important one.',
  english: 'English at Work (Saturday class): NOT a news show. Ms. Olivia teaches Minh using words, phrases and grammar from THIS WEEK\'s episodes (list given) plus one or two of this week\'s MMH stories as context: warm-up recap, 3 phrase drills, one role-play of a real MMH situation (calling a hospital, a distributor meeting, a tender email), quick quiz. Minh makes typical B1 mistakes; Olivia corrects gently. Mark 3–5 drill sentences for the listener with rep=true.',
  briefing: 'One male anchor. Clear, warm, steady. Lead story in depth, then 3–4 shorter stories with smooth links.',
  notes: 'One female host, calm and friendly, like a colleague summarising the morning for you. Short sections, each ends with one plain-English takeaway.',
  twotakes: 'Two hosts with two angles on the hottest, most-read stories: one optimistic, one sceptical. Gentle disagreement, then common ground.',
  healthdesk: 'Host + health correspondent. The correspondent carries tenders, hospitals and policy in depth with concrete numbers; the host asks what it means for distributors like MMH.',
  markets: 'Host + economics analyst. Numbers first, then why they matter for imported Japanese medical products (yen, import costs, hospital budgets).',
  editor: 'Host asks the questions a listener would ask (What changed? Who is affected? From when? What should we do?); the editor answers simply, step by step.',
  explainer: 'Host + reporter. Spend half the show explaining the lead story step by step (background, what changed, who is affected, what to watch), then a quick round-up.',
  clinic: 'Two people who know the clinic: eye care and dentistry stories — the condition, the technique, the trend among doctors, and the link to MMH products (ophthalmic knives and sutures, micro forceps, endo files, diamond burs, composites).',
  story: 'One storyteller, narrative style: set the scene, what happened, why it matters, what to watch. The other stories only get one or two sentences at the end.',
  quickfive: 'Exactly five short stories. Each: 2–3 sentences, then a quick question to the listener ("Quick question: …?"), a short pause line, and the answer. Light and fast-paced in structure, but simple language.',
  weekly: 'Sunday: Emma and Daniel look back on the week — the three stories that mattered most for MMH, then what to watch next week.',
  aipulse: 'AI Pulse: Liam alone, tech-YouTuber style, ONLY international AI stories (no Vietnamese sources). Order: (1) cold open with the single biggest AI story in one punchy line; (2) "What the builders are saying" — what leaders of OpenAI, Anthropic, Meta, Google DeepMind, NVIDIA, Microsoft said, wrote or posted, and what it signals; (3) "New tech, explained" — the 2–3 most important new models, features or techniques, each: what is new, how it works in plain words, what it can and cannot do yet, who can use it and when; (4) "AI at work" — how sales and marketing teams around the world use AI, from the creators and sources given; (5) quick hits; (6) OPTIONAL "MMH corner" (see the instructions); (7) learning segment and sign-off. Go deep on the technology, keep the MMH reflection short.'
};
/* Phần học tiếng Anh trong số (xoay theo ngày, xem PODCAST.md §3). */
export const LEARN = {
  class: 'The whole episode is the lesson (see HOW). Keep it practical for MMH work.',
  legal: 'Legal English: explain 3 legal terms used today (e.g. decree, circular, take effect, bidder, procuring entity) in plain words, each with one MMH example sentence.',
  spotlight: 'Word Spotlight: pick ONE useful word or phrase from today\'s stories; explain it simply and give two short example sentences from MMH work.',
  phrase: 'Phrase for Work: teach ONE sentence pattern useful in meetings, emails or presentations, inspired by today\'s news, with two examples.',
  repeat: 'Listen & Repeat: say "Say it with me." then three short sentences (max 10 words each) taken from today\'s stories; mark those three turns with rep=true.',
  quiz: 'Quick Quiz: ask the listener two short questions about stories in this episode, give a beat ("Think about it…"), then answer each.',
  tech: 'Tech Talk English: pick TWO AI / tech terms heard today (e.g. "context window", "open-weight", "agent", "rolled out", "benchmark"); explain each in plain words and give one example sentence an MMH colleague could say at work.'
};
export const learnFor = (dateStr, show) => { if (show === 'english') return 'class'; if (show === 'lawdesk') return 'legal'; if (show === 'aipulse') return 'tech'; const k = ['spotlight', 'phrase', 'repeat', 'quiz']; return k[Math.floor(new Date(dateStr + 'T00:00:00Z') / 864e5) % k.length]; };

/* Chọn series: theo lịch tuần (SCHEDULE); nội dung đặc biệt được đổi chỗ — nhiều văn bản luật ⇒ Law & Tender Desk, nhiều tin nhãn / nha khoa ⇒ The Clinic Room —
   miễn series đó chưa phát trong 2 ngày gần nhất và không trùng hôm qua. T7 (English at Work) và CN (Week in Review) không đổi. */
export function pickShow(dateStr, picked, history = []) {
  const day = new Date(dateStr + 'T00:00:00Z').getUTCDay(), base = SCHEDULE[day];
  if (day === 0 || day === 6) return base;
  const xs = Object.values(picked.sections || {}).flat();
  const has = t => xs.filter(x => (x.tags || []).includes(t)).length;
  const legal = (picked.docs || []).length + has('policy') + has('tender');
  const clinicN = has('eye') + has('dental');
  const recent = history.slice(0, 2).map(h => h.show), yday = history[0]?.show;
  const free = id => !recent.includes(id);
  if (base === 'aipulse') return (picked.aiPod || []).length >= 3 ? 'aipulse' : 'talk';   // T5: đủ tin AI mới (chưa lên sóng) ⇒ AI Pulse, không thì MMH Talk
  if (base !== 'lawdesk' && legal >= 4 && free('lawdesk')) return 'lawdesk';
  if (base !== 'clinicroom' && clinicN >= 4 && free('clinicroom')) return 'clinicroom';
  if (base === yday) return ROTATION.find(id => id !== yday && free(id)) || base;
  return base;
}
/** Chủ nhật = Week in Review; ngày khác xoay vòng theo số ngày, không trùng hôm trước. */
export function showFor(dateStr) {
  return SCHEDULE[new Date(dateStr + 'T00:00:00Z').getUTCDay()];   // dự phòng khi không có dữ liệu tin
}

// Thuật ngữ Anh – Việt hay gặp trong tin (dùng cho mục "Học từ vựng" khi chưa có AI).
export const GLOSSARY = [
  ['public investment', 'đầu tư công'], ['disbursement', 'giải ngân'], ['tender', 'đấu thầu'], ['bidding', 'đấu thầu'], ['procurement', 'mua sắm'],
  ['contractor', 'nhà thầu'], ['medical equipment', 'trang thiết bị y tế'], ['medical supplies', 'vật tư y tế'], ['health insurance', 'bảo hiểm y tế'],
  ['decree', 'nghị định'], ['circular', 'thông tư'], ['draft law', 'dự thảo luật'], ['National Assembly', 'Quốc hội'], ['Ministry of Health', 'Bộ Y tế'],
  ['hospital autonomy', 'tự chủ bệnh viện'], ['provincial hospital', 'bệnh viện tỉnh'], ['central hospital', 'bệnh viện trung ương'], ['outbreak', 'đợt bùng phát dịch'],
  ['dengue fever', 'sốt xuất huyết'], ['vaccination', 'tiêm chủng'], ['pharmaceutical', 'dược phẩm'], ['drug shortage', 'thiếu thuốc'],
  ['GDP growth', 'tăng trưởng GDP'], ['inflation', 'lạm phát'], ['consumer price index', 'chỉ số giá tiêu dùng (CPI)'], ['exports', 'xuất khẩu'],
  ['foreign direct investment', 'đầu tư trực tiếp nước ngoài (FDI)'], ['trade surplus', 'thặng dư thương mại'], ['interest rate', 'lãi suất'],
  ['exchange rate', 'tỷ giá'], ['state budget', 'ngân sách nhà nước'], ['infrastructure', 'hạ tầng'], ['expressway', 'đường cao tốc'],
  ['real estate', 'bất động sản'], ['stock market', 'thị trường chứng khoán'], ['per capita income', 'thu nhập bình quân đầu người'],
  ['administrative reform', 'cải cách hành chính'], ['streamline', 'tinh gọn'], ['merger', 'sáp nhập'], ['resolution', 'nghị quyết'],
  ['Prime Minister', 'Thủ tướng'], ['General Secretary', 'Tổng Bí thư'], ['diplomatic ties', 'quan hệ ngoại giao'], ['comprehensive strategic partnership', 'đối tác chiến lược toàn diện'],
  ['social welfare', 'an sinh xã hội'], ['flooding', 'ngập lụt'], ['typhoon', 'bão'], ['traffic accident', 'tai nạn giao thông'], ['labor market', 'thị trường lao động'],
  ['minimum wage', 'lương tối thiểu'], ['tuition', 'học phí'], ['food safety', 'an toàn thực phẩm'], ['heritage', 'di sản'], ['festival', 'lễ hội'], ['tourism', 'du lịch'],
];
