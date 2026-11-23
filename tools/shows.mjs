// MMH Daily — các chương trình podcast (đổi theo ngày, không ngày nào giống ngày nào) + giọng đọc + bảng thuật ngữ.
// Giọng: Microsoft Edge neural (edge-tts, miễn phí). Mỗi chương trình có người dẫn riêng ⇒ nghe là nhận ra.

export const SHOWS = {
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
    mode: 'duo', rate: '-5%',
    name: 'Week in Review', vi: 'Nhìn lại tuần', style: 'duo',
    desc: 'Sunday edition: the week that was in health, the economy, politics and society.',
    hosts: [{ id: 'A', name: 'Natasha', voice: 'en-AU-NatashaNeural', role: 'Host' }, { id: 'B', name: 'William', voice: 'en-AU-WilliamMultilingualNeural', role: 'Co-host' }],
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

const ROTATION = ['briefing', 'notes', 'healthdesk', 'twotakes', 'clinic', 'quickfive', 'editor', 'explainer', 'story'];
const DAILY_SHOWS = [...ROTATION, 'markets'];
/* Cách trình bày từng chương trình (đưa vào lời dặn AI). */
export const HOW = {
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
  weekly: 'Sunday: the week in review — the three stories that mattered most for MMH, then what to watch next week.'
};
/* Phần học tiếng Anh trong số (xoay theo ngày, xem PODCAST.md §3). */
export const LEARN = {
  spotlight: 'Word Spotlight: pick ONE useful word or phrase from today\'s stories; explain it simply and give two short example sentences from MMH work.',
  phrase: 'Phrase for Work: teach ONE sentence pattern useful in meetings, emails or presentations, inspired by today\'s news, with two examples.',
  repeat: 'Listen & Repeat: say "Say it with me." then three short sentences (max 10 words each) taken from today\'s stories; mark those three turns with rep=true.',
  quiz: 'Quick Quiz: ask the listener two short questions about stories in this episode, give a beat ("Think about it…"), then answer each.'
};
export const learnFor = dateStr => { const k = Object.keys(LEARN); return k[Math.floor(new Date(dateStr + 'T00:00:00Z') / 864e5) % k.length]; };

/* Chọn chương trình theo nội dung trong ngày (PODCAST.md §1), không trùng 3 ngày gần nhất, không cùng kiểu giọng với hôm qua. */
export function pickShow(dateStr, picked, history = []) {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (d.getUTCDay() === 0) return 'weekly';
  const xs = Object.values(picked.sections || {}).flat();
  const has = t => xs.filter(x => (x.tags || []).includes(t)).length;
  const lead = picked.lead, leadMmh = lead?.mmh || 0;
  const second = xs.filter(x => x !== lead).reduce((m, x) => Math.max(m, x.mmh || 0), 0);
  const legal = (picked.docs || []).length + has('policy') + has('tender');
  const clinicN = has('eye') + has('dental');
  const econ = (picked.sections?.economy || []).length + has('market');
  const health = (picked.sections?.health || []).length;
  const prefs = [];
  if (legal >= 3) prefs.push('explainer', 'editor');
  if (clinicN >= 3) prefs.push('clinic');
  if (leadMmh >= 7 && leadMmh - second >= 2) prefs.push('story', 'explainer');
  if (has('tender') + has('hospital') + has('device') >= 4) prefs.push('healthdesk');
  if (health >= 7) prefs.push('quickfive', 'twotakes');
  if (econ >= 5) prefs.push('markets');
  const recent = history.slice(0, 3).map(h => h.show);
  const yMode = history[0] ? (SHOWS[history[0].show]?.mode || '') : '';
  const ok = id => SHOWS[id] && DAILY_SHOWS.includes(id) && !recent.includes(id);
  const byContent = [...new Set(prefs)].filter(ok);                       // nội dung quyết định trước
  if (byContent.length) return byContent.find(id => SHOWS[id].mode !== yMode) || byContent[0];
  const n = Math.floor(d / 864e5), rot = ROTATION.map((_, i) => ROTATION[(n + i) % ROTATION.length]).filter(ok);
  return rot.find(id => SHOWS[id].mode !== yMode) || rot[0] || showFor(dateStr);
}
/** Chủ nhật = Week in Review; ngày khác xoay vòng theo số ngày, không trùng hôm trước. */
export function showFor(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (d.getUTCDay() === 0) return 'weekly';
  const n = Math.floor(d / 864e5);
  return ROTATION[n % ROTATION.length];   // dự phòng khi không có dữ liệu tin
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
