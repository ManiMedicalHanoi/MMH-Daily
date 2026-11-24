/* MMH Daily — app đọc báo + nghe podcast. Dữ liệu: data/index.json, data/editions/<ngày>.json (GitHub Actions tạo mỗi sáng). */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* riêng tư */ } },
  };
  /* Mọi nhãn có 2 ngôn ngữ [Việt, Anh] — nút VI · EN đổi CẢ giao diện, không chỉ tiêu đề tin (người dùng yêu cầu 24/11/2026). */
  const SEC = { health: ['Y tế', 'Health'], economy: ['Kinh tế', 'Economy'], politics: ['Chính trị', 'Politics'], society: ['Xã hội', 'Society'], ai: ['AI & Công nghệ', 'AI & Tech'] };
  const TAG = { dental: ['Nha khoa', 'Dentistry'], eye: ['Nhãn khoa', 'Ophthalmology'], tender: ['Đấu thầu', 'Tenders'], device: ['Thiết bị y tế', 'Medical devices'], insurance: ['BHYT & giá', 'Insurance & fees'],
    surgery: ['Phẫu thuật', 'Surgery'], policy: ['Chính sách', 'Policy'], invest: ['Đầu tư công', 'Public investment'], hospital: ['Bệnh viện', 'Hospitals'], market: ['Thị trường', 'Market'],
    people: ['Lãnh đạo AI', 'AI leaders'], model: ['Mô hình mới', 'New models'], agent: ['AI agent', 'AI agents'], salesmkt: ['AI cho sales & marketing', 'AI in sales & marketing'],
    aimed: ['AI trong y tế', 'AI in healthcare'], airules: ['Quy định AI', 'AI rules'], chips: ['Chip & hạ tầng', 'Chips & compute'], research: ['Nghiên cứu', 'Research'], video: ['Video', 'Video'] };
  const DESK = { dental: ['Nha khoa', 'Dentistry'], eye: ['Nhãn khoa', 'Ophthalmology'], tender: ['Thầu & thiết bị', 'Tenders & devices'], policy: ['Chính sách & BHYT', 'Policy & insurance'],
    market: ['Bệnh viện & thị trường', 'Hospitals & market'], invest: ['Đầu tư công', 'Public investment'], hospital: ['Bệnh viện', 'Hospitals'], device: ['Thiết bị y tế', 'Medical devices'] };
  const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="5.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor"/><rect x="14" y="4" width="4.5" height="16" rx="1.2" fill="currentColor"/></svg>',
  };
  const S = { index: null, eds: {}, cur: null, lang: store.get('mmh_daily_lang', 'vi'), ep: null, tab: '', sub: store.get('mmh_daily_sub', 'both') };
  const EN = () => S.lang === 'en';
  const L = (vi, en) => (S.lang === 'en' ? en : vi);
  const tr = pair => (pair ? pair[S.lang === 'en' ? 1 : 0] : '');
  const toast = t => { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2400); };
  const viDate = ds => { ds = String(ds).replace(/^i-/, ''); const d = new Date(ds + 'T00:00:00Z'); return `${WD[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`; };
  const enDate = ds => new Date(ds + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const ago = d => { const h = Math.round((Date.now() - new Date(d)) / 36e5); return h < 1 ? L('vừa xong', 'just now') : h < 24 ? h + L(' giờ trước', 'h ago') : Math.round(h / 24) + L(' ngày trước', 'd ago'); };
  const dateL = ds => (S.lang === 'en' ? enDate(String(ds).replace(/^i-/, '')) : viDate(ds));
  /* Tên báo khi xem tiếng Anh: tên tiếng Anh chính thức (cơ quan, báo có tên Anh), báo khác viết không dấu (Tuoi Tre, Nhan Dan…) */
  const SRC_EN = { 'Báo Chính phủ': 'Government News', 'Cổng TTĐT Chính phủ': 'Government Portal', 'Bộ Y tế': 'Ministry of Health', 'Văn bản Chính phủ': 'Government documents',
    'Sức khỏe & Đời sống': 'Health & Life', 'Báo Đấu thầu': 'Bidding Newspaper', 'Báo Đầu tư': 'Vietnam Investment News', 'Kinh tế Sài Gòn': 'Saigon Economic Times',
    'Quân đội Nhân dân': 'People\'s Army', 'Báo Đảng Cộng sản': 'Communist Party News', 'Quốc hội': 'National Assembly', 'Đại biểu Nhân dân': 'People\'s Representative',
    'Báo Tin tức (TTXVN)': 'Vietnam News Agency', 'Hà Nội Mới': 'Hanoi Moi', 'Sài Gòn Giải Phóng': 'Saigon Giai Phong', 'Người Lao Động': 'Nguoi Lao Dong', 'Lao Động': 'Lao Dong',
    'Pháp luật TP.HCM': 'HCMC Law', 'Luật Việt Nam': 'LuatVietnam', 'Bộ Tài chính': 'Ministry of Finance', 'Ngân hàng Nhà nước': 'State Bank of Vietnam',
    'Tổng cục Thống kê': 'General Statistics Office', 'Cục Thống kê': 'National Statistics Office', 'Báo Quốc tế': 'World & Vietnam Report', 'Công Thương': 'Industry & Trade',
    'Tạp chí Tài chính': 'Finance Review', 'Hải quan Việt Nam': 'Vietnam Customs', 'BHXH Việt Nam': 'Vietnam Social Security', 'BV Mắt Trung ương': 'Vietnam National Eye Hospital',
    'BV Răng Hàm Mặt TW': 'National Hospital of Odonto-Stomatology', 'Cục Quản lý Khám chữa bệnh': 'Medical Services Administration', 'Cục Quản lý Dược': 'Drug Administration of Vietnam',
    'Mua sắm công': 'Public Procurement System', 'BV Bạch Mai': 'Bach Mai Hospital', 'Hội Nhãn khoa Việt Nam': 'Vietnam Ophthalmological Society', 'Thư viện Pháp luật': 'Law Library',
    'CSDL văn bản pháp luật': 'National Legal Database', 'Tin đọc nhiều (VnExpress)': 'VnExpress most read' };
  const unmark = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const srcN = s => (S.lang === 'en' ? SRC_EN[s] || unmark(s) : s);
  const views = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);

  // ── ảnh bìa podcast (SVG, theo màu chương trình) ──
  function cover(pod, date, big) {
    const c = pod?.color || '#0E7C6B';
    const name = pod?.name || 'MMH Daily Podcast';
    const words = name.split(' ');
    const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [name];
    const d = date ? new Date(date + 'T00:00:00Z') : null;
    const seed = (date || name).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const bars = Array.from({ length: 28 }, (_, i) => { const h = 10 + ((seed * (i + 3) * 37) % 46); return `<rect x="${14 + i * 6}" y="${150 - h}" width="3.4" height="${h}" rx="1.7" fill="#fff" opacity="${0.18 + (i % 5) * 0.06}"/>`; }).join('');
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(name)}">
      <defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#0b0d10"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#g${seed})"/>
      <circle cx="168" cy="34" r="54" fill="#fff" opacity=".07"/><circle cx="168" cy="34" r="30" fill="#fff" opacity=".07"/>
      ${bars}
      <text x="14" y="28" fill="#fff" opacity=".8" font-family="Inter,sans-serif" font-weight="700" font-size="9.5" letter-spacing="1.6">MMH DAILY</text>
      ${lines.map((l, i) => `<text x="14" y="${(lines.length > 1 ? 160 : 172) + i * 22}" fill="#fff" font-family="'Playfair Display',Georgia,serif" font-weight="800" font-size="${big ? 21 : 20}">${esc(l)}</text>`).join('')}
      ${d ? `<text x="186" y="28" text-anchor="end" fill="#fff" opacity=".8" font-family="Inter,sans-serif" font-weight="600" font-size="9.5">${d.getUTCDate()}/${d.getUTCMonth() + 1}</text>` : ''}
    </svg>`;
  }

  // ── dữ liệu ──
  async function loadIndex() {
    const r = await fetch('data/index.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('index ' + r.status);
    S.index = await r.json();
  }
  async function loadEd(date) {
    if (S.eds[date]) return S.eds[date];
    const r = await fetch(`data/editions/${date}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error('edition ' + r.status);
    const ed = await r.json();
    for (const id in ed.stories) ed.stories[id].id = id;
    return (S.eds[date] = ed);
  }
  const story = (ed, id) => ed.stories[id];
  const H = x => (S.lang === 'en' ? (x.h_en || (x.lang === 'en' ? x.t : '') || x.h_vi || x.t) : (x.h_vi || (x.lang === 'vi' ? x.t : '') || x.t));
  const dePrefix = s => String(s || '').replace(/^\s*\(?[\p{L}\d&.]{2,14}(?:\.vn)?\)?\s*[-–—]\s+/u, '');
  const SUMV = x => x.s_vi || (x.lang === 'vi' ? dePrefix(x.sum) : '') || '';
  const SUME = x => x.s_en || (x.lang === 'en' ? x.sum : '') || '';

  // ── mẩu tin ──
  function kicker(x) {
    const tags = (x.tags || []).filter(t => t !== 'video').map(t => tr(TAG[t])).filter(Boolean).slice(0, 2);
    const pe = window.PESTEL ? PESTEL.of(x).map(f => `<span class="pe pe-${f}" title="${esc(PESTEL.NAMES[f][EN() ? 2 : 1])}">${PESTEL.NAMES[f][0]}</span>`).join('') : '';
    return `<div class="kick">${esc(tr(SEC[x.sec]))}${tags.map(t => `<span class="tg">· ${esc(t)}</span>`).join('')}${x.kind === 'doc' ? `<span class="red">· ${L('Văn bản mới', 'New document')}</span>` : ''}${x.tags?.includes('video') ? `<span class="red">· ${L('Video', 'Video')}</span>` : ''}${pe ? `<span class="pes">${pe}</span>` : ''}</div>`;
  }
  function byline(x) {
    return `<div class="by"><b>${esc(srcN(x.src))}</b><span>· ${esc(ago(x.d))}</span>${x.views ? `<span>· ${views(x.views)} ${L('lượt xem', 'views')}</span>` : ''}${x.lang === 'en' && !EN() ? '<span class="badge en">EN</span>' : ''}${x.also?.length ? `<span>· ${L('cũng đăng trên', 'also in')} ${esc(x.also.slice(0, 3).map(srcN).join(', '))}</span>` : ''}</div>`;
  }
  function body(x, opt = {}) {
    const vi = SUMV(x), en = SUME(x);
    let out = '';
    if (S.lang === 'en') { if (en) out += `<p class="sum">${esc(en)}</p>`; else if (vi) out += `<p class="sum">${esc(vi)}</p>`; }
    else { if (vi) out += `<p class="sum">${esc(vi)}</p>`; if (en && opt.both) out += `<p class="sum en">${esc(en)}</p>`; else if (!vi && en) out += `<p class="sum en">${esc(en)}</p>`; }
    return out;
  }

  const link = (x, inner) => `<a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  function storyHtml(x, size = 's', opt = {}) {
    return `<article class="story">${opt.img && x.img ? `<img class="thumb" src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
      ${opt.kick ? kicker(x) : ''}<h3 class="hl ${size}">${link(x, esc(H(x)))}</h3>${x.dek && S.lang === 'en' ? `<p class="dek">${esc(x.dek)}</p>` : ''}${body(x, opt)}${byline(x)}</article>`;
  }

  // ── thẻ nghe ──
  function listenCard(ed) {
    const p = ed.podcast; const a = p.audio;
    return `<a class="lcard" href="#/listen/${ed.date}" style="--show:${p.color}">
      <div class="cv">${cover(p, ed.date)}</div>
      <div><div class="k">${L('Nghe hôm nay · English podcast', 'Today\'s English podcast')}</div><b>${esc(p.name)}</b><span>${esc(p.hosts.map(h => h.name).join(' & '))}${a ? ' · ' + Math.round(a.dur / 60) + L(' phút', ' min') : ''}</span>
      <div class="row"><button class="pbtn" type="button" data-play="${ed.date}" aria-label="${L('Phát podcast', 'Play podcast')}">${ICON.play}</button><span>${a ? L('Bấm để nghe', 'Tap to listen') : L('Đang tạo âm thanh…', 'Audio is being made…')}</span></div></div></a>`;
  }

  // ── TRANG NHẤT ──
  function front(ed) {
    const LD = story(ed, ed.lead);
    const secs = ed.sections;
    const healthIds = (secs.health || []).filter(id => id !== ed.lead);
    const leadSub = healthIds.slice(0, 2).map(id => story(ed, id)).filter(Boolean);
    const note = ed.note ? `<div class="note"><h3>${L('Lời biên tập', 'Editor\'s note')}</h3>${EN() ? `<p>${esc(ed.note.en)}</p>` : `<p>${esc(ed.note.vi)}</p><p class="en">${esc(ed.note.en)}</p>`}</div>` : '';
    const docs = (ed.docs || []).map(id => story(ed, id)).filter(Boolean).slice(0, 6);
    const docsBox = docs.length ? `<div class="docs-box"><h3>${L('Văn bản & chính sách mới', 'New laws & policies')}</h3>${docs.map(x => `<div class="doc"><span class="no">${esc((x.docs || [''])[0])}</span>${link(x, esc(H(x)))}</div>`).join('')}</div>` : '';
    const vocab = ed.vocab?.length ? vocabHtml(ed) : '';
    let html = `<div class="mlisten">${listenCard(ed)}</div><div class="front">
      <div class="lead">${LD ? `${kicker(LD)}${LD.img ? `<img class="ph" src="${esc(LD.img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
        <h1 class="hl xl">${link(LD, esc(H(LD)))}</h1>${LD.dek && EN() ? `<p class="dek">${esc(LD.dek)}</p>` : ''}${body(LD, { both: true })}${byline(LD)}` : `<div class="empty">${L('Chưa có tin.', 'No stories yet.')}</div>`}
        <div class="lead-sub">${leadSub.map(x => storyHtml(x, 'm', { kick: true })).join('')}</div>
      </div>
      <aside class="side">${listenCard(ed)}${note}${docsBox}${vocab}</aside>
    </div>`;
    html += healthDesk(ed, true);
    html += aiBlock(ed);
    html += `<div class="sec-h"><h2>${L('Kinh tế · Chính trị · Xã hội', 'Economy · Politics · Society')}</h2>${EN() ? '' : '<span class="sub">Economy · Politics · Society</span>'}</div><div class="cols3">`;
    for (const sec of ['economy', 'politics', 'society']) {
      html += `<div><div class="col-h">${tr(SEC[sec])}</div>${(secs[sec] || []).slice(0, 5).map((id, i) => storyHtml(story(ed, id), i ? 's' : 'm', { img: i === 0 })).join('') || `<p class="empty">${L('Chưa có tin.', 'No stories yet.')}</p>`}<a class="by" href="#/s/${sec}">${L('Xem tất cả ' + tr(SEC[sec]).toLowerCase(), 'All ' + tr(SEC[sec]).toLowerCase() + ' stories')} →</a></div>`;
    }
    html += '</div>';
    return html;
  }

  function healthDesk(ed, compact) {
    const g = ed.healthDesk?.groups || {};
    const an = ed.healthDesk?.analysis;
    const col = t => {
      const xs = (g[t] || []).map(id => story(ed, id)).filter(Boolean).slice(0, compact ? 4 : 8);
      return `<div><h4>${esc(tr(DESK[t] || TAG[t]))}</h4>${xs.length ? `<ul>${xs.map(x => `<li>${link(x, esc(H(x)))}<small>${esc(srcN(x.src))} · ${esc(ago(x.d))}</small></li>`).join('')}</ul>` : `<p class="none">${L('Chưa có tin mới.', 'Nothing new.')}</p>`}</div>`;
    };
    return `<section class="desk"><div class="sec-h"><h2>${L('Bàn tin Y tế', 'Health Desk')}</h2><span class="sub">${L('Tin ảnh hưởng tới MMH — nha khoa, nhãn khoa, thầu, thiết bị, BHYT, thị trường', 'Stories that affect MMH — dentistry, ophthalmology, tenders, devices, health insurance, market')}</span><a href="#/s/health">${L('Tất cả tin y tế →', 'All health stories →')}</a></div>
      ${an ? (EN() ? `<div class="desk-an"><div><p>${esc(an.en)}</p></div><div><p class="en">${esc(an.vi)}</p></div></div>` : `<div class="desk-an"><div><p>${esc(an.vi)}</p></div><div><p class="en">${esc(an.en)}</p></div></div>`) : ''}
      <div class="desk-g">${(ed.healthDesk?.order || ['tender', 'policy', 'invest', 'hospital', 'device']).map(col).join('')}</div></section>`;
  }

  /* AI & Công nghệ trên trang nhất: 6 tin / video AI quốc tế (3 cột × 2) */
  function aiBlock(ed) {
    const xs = (ed.sections.ai || []).map(id => story(ed, id)).filter(Boolean).slice(0, 6);
    if (!xs.length) return '';
    const col = [xs.slice(0, 2), xs.slice(2, 4), xs.slice(4, 6)].filter(c => c.length);
    return `<section class="aib"><div class="sec-h"><h2>${esc(tr(SEC.ai))}</h2><span class="sub">${L('Lãnh đạo OpenAI · Anthropic · Meta · Google nói gì · mô hình, công cụ mới · AI trong sales & marketing', 'What AI leaders are saying · new models and tools · AI in sales & marketing')}</span><a href="#/s/ai">${L('Tất cả tin AI →', 'All AI stories →')}</a></div>
      <div class="cols3">${col.map(c => `<div>${c.map((x, i) => storyHtml(x, i ? 's' : 'm', { img: i === 0, kick: true })).join('')}</div>`).join('')}</div></section>`;
  }

  function vocabHtml(ed, dark) {
    return `<div class="vocab${dark ? ' dk' : ''}"><h3>${L('Học tiếng Anh hôm nay', 'Today\'s English words')}</h3><dl>${ed.vocab.map(v => `<dt>${esc(v.en)}</dt><dd>${esc(v.vi)}</dd>${v.ex ? `<div class="ex">“${esc(v.ex)}”</div>` : ''}`).join('')}</dl></div>`;
  }

  // ── TRANG CHUYÊN MỤC ──
  function sectionPage(ed, sec) {
    const ids = sec === 'health' ? [...new Set([...(ed.sections.health || []), ...Object.values(ed.healthDesk?.groups || {}).flat()])] : (ed.sections[sec] || []);
    let xs = ids.map(id => story(ed, id)).filter(Boolean);
    const CH = { health: ['', 'dental', 'eye', 'tender', 'policy', 'invest', 'hospital', 'device'], ai: ['', 'people', 'model', 'agent', 'salesmkt', 'aimed', 'video'] }[sec];
    if (CH && S.tab && CH.includes(S.tab)) xs = xs.filter(x => x.tags?.includes(S.tab));
    const chips = CH ? `<div class="filters">${CH.filter(t => !t || ids.some(id => story(ed, id)?.tags?.includes(t))).map(t => `<button class="chip${(S.tab === t || (!CH.includes(S.tab) && !t)) ? ' on' : ''}" data-tab="${t}" type="button">${t ? esc(tr(TAG[t])) : L('Tất cả', 'All')}</button>`).join('')}</div>` : '';
    const items = xs.map(x => `<div class="sp-item${x.img ? '' : ' noimg'}"><div>${kicker(x)}<h2 class="hl l">${link(x, esc(H(x)))}</h2>${x.dek && S.lang === 'en' ? `<p class="dek">${esc(x.dek)}</p>` : ''}${body(x, { both: true })}${byline(x)}</div>${x.img ? `<img class="ph" src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ''}</div>`).join('');
    return `<div class="sec-h" style="margin-top:4px"><h2>${esc(tr(SEC[sec]))}</h2>${EN() ? '' : `<span class="sub">${esc(SEC[sec][1])}</span>`}</div>${chips}
      <div class="secpage"><div class="main">${items || `<div class="empty">${L('Chưa có tin.', 'No stories yet.')}</div>`}</div><aside class="side">${listenCard(ed)}${sec === 'health' && ed.healthDesk?.analysis ? `<div class="note"><h3>${L('Phân tích', 'Analysis')}</h3><p>${esc(EN() ? ed.healthDesk.analysis.en : ed.healthDesk.analysis.vi)}</p></div>` : ''}${ed.vocab?.length ? vocabHtml(ed) : ''}</aside></div>`;
  }

  function docsPage(ed) {
    const xs = (ed.docs || []).map(id => story(ed, id)).filter(Boolean);
    return `<div class="sec-h" style="margin-top:4px"><h2>${L('Văn bản & chính sách', 'Laws & policies')}</h2><span class="sub">${L('Nghị định, thông tư, quyết định mới liên quan y tế, đấu thầu, đầu tư công', 'New decrees, circulars and decisions on health, tenders and public investment')}</span></div>
      <div class="secpage"><div class="main">${xs.map(x => `<div class="sp-item noimg"><div><div class="kick"><span class="red">${esc((x.docs || []).join(' · '))}</span></div><h2 class="hl m">${link(x, esc(H(x)))}</h2>${body(x)}${byline(x)}</div></div>`).join('') || `<div class="empty">${L('Chưa có văn bản mới trong số này.', 'No new documents in this edition.')}</div>`}</div>
      <aside class="side">${listenCard(ed)}</aside></div>`;
  }

  function archivePage() {
    const eds = S.index.editions;
    return `<div class="sec-h" style="margin-top:4px"><h2>${L('Số cũ', 'Past editions')}</h2><span class="sub">${eds.length} ${L('số báo · bấm để đọc / nghe lại', 'editions · tap to read or listen again')}</span></div>
      <div class="archive">${eds.map(e => `<a class="arc" href="#/e/${e.date}"><div class="cv">${cover({ name: showName(e.show), color: showColor(e.show) }, e.date)}</div><div><b>${esc(dateL(e.date))}</b><span>${L('Số', 'No.')} ${e.no} · ${esc(showName(e.show))}</span><br><span>${esc(e.lead || '')}</span></div></a>`).join('')}</div>`;
  }
  const SERIES = [['talk', ['Thứ Hai', 'Monday']], ['clinicroom', ['Thứ Ba', 'Tuesday']], ['lawdesk', ['Thứ Tư', 'Wednesday']], ['aipulse', ['Thứ Năm', 'Thursday']], ['headlines', ['Thứ Sáu', 'Friday']], ['english', ['Thứ Bảy', 'Saturday']], ['weekly', ['Chủ nhật', 'Sunday']]];
  const SHOWMETA = { talk: ['MMH Talk', '#1F5E8C'], clinicroom: ['The Clinic Room', '#2E7D8C'], lawdesk: ['Law & Tender Desk', '#5B3F8C'], headlines: ['Morning Headlines', '#A23B3B'], english: ['English at Work', '#8A5A00'], briefing: ['The Morning Briefing', '#1F4E79'], twotakes: ['Two Takes', '#7A3E9D'], healthdesk: ['Health Desk', '#0E7C6B'], markets: ['Market Watch', '#B8641B'], editor: ['Ask the Editor', '#2F6F9F'], explainer: ['The Explainer', '#A23B3B'], weekly: ['Week in Review', '#3D5A3D'], aipulse: ['AI Pulse', '#3949AB'], notes: ['Morning Notes', '#6B4E9B'], clinic: ['Clinic Notes', '#2E7D8C'], story: ['One Story', '#5A4632'], quickfive: ['Quick Five', '#C0582B'] };
  const SHOWDESC = { talk: 'Emma & Daniel trò chuyện về các chuyện nóng nhất với MMH', clinicroom: 'Dr. Sarah giảng nhãn khoa, nha khoa · Minh hỏi', lawdesk: 'Thomas giải thích luật, nghị định, quy định thầu', headlines: 'Andrew đọc tin thời sự · mỗi tin một câu "với MMH"', english: 'Lớp tiếng Anh công sở: cô Olivia & Minh ôn từ của tuần', briefing: 'Một người dẫn · tin chính trong ~8 phút', twotakes: 'Hai người dẫn trao đổi', healthdesk: 'Chuyên sâu y tế: đấu thầu, chính sách, bệnh viện', markets: 'Kinh tế, thương mại, đầu tư', editor: 'Hỏi – đáp với biên tập viên', explainer: 'Giải thích sâu một tin lớn', weekly: 'Emma & Daniel nhìn lại cả tuần', notes: 'Một giọng nữ · tóm tắt nhẹ nhàng từng tin', clinic: 'Nhãn khoa, nha khoa: xu hướng điều trị và sản phẩm', story: 'Một người kể · một câu chuyện lớn từ đầu đến cuối', quickfive: 'Năm tin nhanh, mỗi tin một câu hỏi cho bạn' };
  SHOWDESC.aipulse = 'Liam (tech creator) điểm tin AI: lãnh đạo OpenAI · Anthropic · Meta nói gì, công nghệ mới, AI trong sales & marketing';
  const SHOWDESC_EN = { talk: 'Emma & Daniel talk through the stories that matter most for MMH', clinicroom: 'Dr. Sarah teaches eye care and dentistry · Minh asks', lawdesk: 'Thomas explains laws, decrees and tender rules',
    headlines: 'Andrew reads the headlines · each with a line on MMH', english: 'Business English class: Ms. Olivia & Minh review the week\'s words', weekly: 'Emma & Daniel look back on the week',
    aipulse: 'Liam (tech creator): what AI leaders say, new tech explained, AI in sales & marketing' };
  const showDesc = id => (S.lang === 'en' && SHOWDESC_EN[id]) || SHOWDESC[id] || '';
  const showName = id => SHOWMETA[id]?.[0] || id;
  const showColor = id => SHOWMETA[id]?.[1] || '#0E7C6B';

  // ── TRANG NGHE ──
  function listenPage(ed) {
    const p = ed.podcast, a = p.audio;
    const turns = (p.turns || []).filter(t => t.text);
    const hosts = Object.fromEntries(p.hosts.map(h => [h.id, h]));
    const recent = S.index.editions.slice(0, 14);
    // sáng mở app mà số mới nhất chưa phải hôm nay ⇒ báo đang tạo (Training Hub tự gọi tạo số từ 05:40)
    const vnNow = new Date(Date.now() + 7 * 36e5), today = vnNow.toISOString().slice(0, 10), latest = S.index.editions[0]?.date;
    const pending = latest && latest < today && vnNow.getUTCHours() >= 5 && ed.date === latest
      ? `<p class="ls-pend">${L('Số hôm nay đang được tạo tự động — trong lúc chờ, bạn đang nghe số ' + dateL(latest) + '.', 'Today\'s episode is being made — meanwhile you are listening to ' + dateL(latest) + '.')}</p>` : '';
    return `<div class="ls" style="--show:${p.color}">${window.STUDY ? STUDY.tabs(ed) : ''}${pending}
      <section class="ls-hero"><div class="cv">${cover(p, ed.date, true)}</div><div>
        <div class="ls-k">Podcast · ${esc(dateL(ed.date))}</div>
        <h1 class="ls-t">${esc(p.name)}</h1>
        <p class="ls-d">${esc(p.desc || '')}</p>
        <div class="ls-meta"><span>${esc(p.hosts.map(h => `${h.name} (${h.role})`).join(' · '))}</span>${a ? `<span>${Math.round(a.dur / 60)} ${L('phút', 'min')}</span>` : ''}<span>${L('Tiếng Anh · phụ đề bên dưới', 'In English · Vietnamese subtitles below')}</span></div>
      </div></section>
      <div class="ls-ctl">
        <button class="bigplay" id="ls-play" type="button" data-play="${ed.date}" aria-label="${L('Phát', 'Play')}">${ICON.play}</button>
        <button class="ibtn" id="ls-back" type="button" aria-label="${L('Lùi 15 giây', 'Back 15 seconds')}" title="${L('Lùi 15 giây', 'Back 15 seconds')}">${$('#mini-back').innerHTML}</button>
        <button class="ibtn" id="ls-fwd" type="button" aria-label="${L('Tới 15 giây', 'Forward 15 seconds')}" title="${L('Tới 15 giây', 'Forward 15 seconds')}">${$('#mini-fwd').innerHTML}</button>
        <button class="spd" id="ls-spd" type="button" title="${L('Tốc độ đọc', 'Speed')}">${(store.get('mmh_daily_rate', 1)).toFixed(2).replace(/0$/, '')}×</button>
        ${a ? `<a class="dl" href="${esc(a.file + (/^blob:/.test(a.file) ? '' : '?v=' + (a.bytes || '')))}" download>${L('Tải MP3', 'Download MP3')}</a>` : `<span class="dl">${L('Âm thanh đang được tạo…', 'Audio is being made…')}</span>`}
      </div>
      <div class="nowsub" id="nowsub" aria-live="off"><span class="en"></span><span class="vi"></span></div>
      <div class="seek"><span id="ls-cur">0:00</span><div class="tr" id="ls-tr"><i id="ls-prog" style="width:0"></i></div><span id="ls-dur">${a ? mmss(a.dur) : '--:--'}</span></div>
      ${window.STUDY ? STUDY.html(ed) : ''}
      <div class="ls-grid">
        <div class="ls-box"><h3>${L('Lời thoại', 'Transcript')}<small>${L('bấm một câu để nghe từ đó', 'tap a line to play from there')}</small></h3>
          <div class="subsel" id="subsel" role="group" aria-label="${L('Phụ đề', 'Subtitles')}">${[['both', L('Anh + Việt', 'EN + VI')], ['en', L('Tiếng Anh', 'English')], ['vi', L('Tiếng Việt', 'Vietnamese')]].map(([k, l]) => `<button type="button" data-sub="${k}" class="${S.sub === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div class="tx sub-${S.sub}" id="tx">${turns.map((t, i) => `<p data-i="${i}" data-t="${t.t ?? ''}"><b>${esc(hosts[t.sp]?.name || t.sp)}</b><span class="en">${esc(t.text)}</span>${t.vi ? `<span class="vi">${esc(t.vi)}</span>` : ''}</p>`).join('')}</div></div>
        <div>
          <div class="ls-box"><h3>${L('Các số gần đây', 'Recent episodes')}</h3><div class="eps">${recent.map(e => `<a class="ep${e.date === ed.date ? ' on' : ''}" href="#/listen/${e.date}"><div class="cv">${cover({ name: showName(e.show), color: showColor(e.show) }, e.date)}</div><div><b>${esc(showName(e.show))}</b><span>${esc(dateL(e.date))}</span></div><em>${e.words ? '~' + Math.round(e.words / 130) + L(' ph', ' min') : ''}</em></a>`).join('')}</div></div>
          ${ed.vocab?.length ? `<div style="margin-top:20px">${vocabHtml(ed, true)}</div>` : ''}
        </div>
      </div>
      <h2 class="ls-sh">${L('Các series trong tuần', 'This week\'s series')}</h2>
      <div class="shows">${SERIES.map(([id, day]) => `<div class="show${id === p.show ? ' today' : ''}" style="--show:${showColor(id)}"><div class="cv">${cover({ name: showName(id), color: showColor(id) })}</div><b>${esc(showName(id))}</b><span>${esc(tr(day))} · ${esc(showDesc(id))}</span></div>`).join('')}</div>
    </div>`;
  }

  // ── trình phát ──
  const audio = $('#audio');
  audio.playbackRate = store.get('mmh_daily_rate', 1);
  function setEp(ed) {
    const a = ed.podcast.audio;
    if (!a) { toast(L('Âm thanh của số này chưa sẵn sàng', 'The audio for this episode is not ready yet')); return false; }
    // Cùng ngày có thể dựng lại số (giữ tên file mp3) ⇒ gắn ?v= theo kích thước file để máy không phát lại tiếng cũ trong bộ nhớ đệm.
    const aKey = ed.date + ':' + (a.bytes || a.dur || '');
    if (S.epKey !== aKey) {
      S.ep = ed; S.epKey = aKey;
      audio.src = a.file + (/^blob:/.test(a.file) ? '' : (a.file.includes('?') ? '&' : '?') + 'v=' + (a.bytes || Math.round(a.dur || 0)));
      audio.playbackRate = store.get('mmh_daily_rate', 1);
      const vk = store.get('mmh_daily_posv', {});
      if (vk[ed.date] !== aKey) { const P = store.get('mmh_daily_pos', {}); delete P[ed.date]; store.set('mmh_daily_pos', P); vk[ed.date] = aKey; store.set('mmh_daily_posv', vk); }
      const pos = store.get('mmh_daily_pos', {})[ed.date];
      if (pos && pos < a.dur - 10) audio.currentTime = pos;
      $('#mini').hidden = false;
      $('#mini-open').innerHTML = cover(ed.podcast, ed.date);
      $('#mini-t').textContent = ed.podcast.name;
      $('#mini-s').textContent = dateL(ed.date) + ' · ' + ed.podcast.hosts.map(h => h.name).join(' & ');
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: ed.podcast.title || ed.podcast.name, artist: 'MMH Daily Podcast', album: viDate(ed.date),
          artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
      }
    }
    return true;
  }
  async function playDate(date) {
    try {
      const ed = await loadEd(date);
      if (!setEp(ed)) return;
      if (audio.paused) await audio.play(); else audio.pause();
    } catch (e) { toast(L('Không phát được: ', 'Cannot play: ') + e.message); }
  }
  function syncUi() {
    const playing = !audio.paused;
    $('#mini-play').innerHTML = playing ? ICON.pause : ICON.play;
    $('#mini-play').setAttribute('aria-label', playing ? L('Tạm dừng', 'Pause') : L('Phát', 'Play'));
    document.querySelectorAll('[data-play]').forEach(b => { const on = S.ep && b.dataset.play === S.ep.date && playing; b.innerHTML = on ? ICON.pause : ICON.play; });
    const ip = document.querySelector('[data-inplay]'); if (ip) ip.innerHTML = (S.ep && S.cur && S.ep.date === S.cur.date && playing) ? ICON.pause : ICON.play;
  }
  let lastSave = 0, lastLine = -1;
  function onTime() {
    if (!S.ep) return;
    const d = audio.duration || S.ep?.podcast.audio?.dur || 1, t = audio.currentTime;
    $('#mini-prog').style.width = (t / d * 100) + '%';
    curSubMini(t);
    const lp = $('#ls-prog');
    if (lp && S.cur && S.ep && S.cur.date === S.ep.date) { lp.style.width = (t / d * 100) + '%'; $('#ls-cur').textContent = mmss(t); $('#ls-dur').textContent = mmss(d); hiLine(t); }
    if (Date.now() - lastSave > 4000) { lastSave = Date.now(); const p = store.get('mmh_daily_pos', {}); p[S.ep.date] = Math.floor(t); store.set('mmh_daily_pos', p); }
  }
  // dòng 2 của thanh phát nhỏ = phụ đề Việt câu đang đọc (học tiếng Anh khi nghe)
  let miniIdx = -2;
  function curSubMini(t) {
    const turns = (S.ep?.podcast.turns || []).filter(x => x.text);
    let i = -1; turns.forEach((x, k) => { if (x.t != null && x.t <= t + 0.2) i = k; });
    if (i === miniIdx) return; miniIdx = i;
    $('#mini-s').textContent = (i >= 0 && turns[i].vi && !audio.paused) ? turns[i].vi : dateL(S.ep.date) + ' · ' + S.ep.podcast.hosts.map(h => h.name).join(' & ');
  }
  function hiLine(t) {
    const ps = [...document.querySelectorAll('#tx p')];
    let idx = -1;
    ps.forEach((p, i) => { const v = parseFloat(p.dataset.t); if (!isNaN(v) && v <= t + 0.2) idx = i; });
    if (idx === lastLine) return;
    lastLine = idx;
    ps.forEach((p, i) => { p.classList.toggle('now', i === idx); p.classList.toggle('past', i < idx); });
    const turn = S.ep?.podcast.turns.filter(t => t.text)[idx], ns = $('#nowsub');
    if (ns) { ns.querySelector('.en').textContent = turn ? turn.text : ''; ns.querySelector('.vi').textContent = turn?.vi || ''; ns.className = 'nowsub sub-' + S.sub + (turn ? ' on' : ''); }
    const el = ps[idx], box = $('#tx');
    if (el && box && box.scrollHeight > box.clientHeight + 4) box.scrollTop = el.offsetTop - box.offsetTop - box.clientHeight / 3;
  }
  const seekBy = s => { if (S.ep) audio.currentTime = Math.max(0, Math.min((audio.duration || 0) - 1, audio.currentTime + s)); };
  audio.addEventListener('timeupdate', onTime);
  audio.addEventListener('play', syncUi);
  audio.addEventListener('pause', syncUi);
  audio.addEventListener('ended', () => { const p = store.get('mmh_daily_pos', {}); delete p[S.ep.date]; store.set('mmh_daily_pos', p); syncUi(); });
  audio.addEventListener('error', () => {
    const alt = S.ep?.podcast.audio?.alt;
    if (alt && !audio.src.endsWith(alt)) { const t = audio.currentTime; audio.src = alt; audio.currentTime = t; audio.play().catch(() => {}); return; }
    if (S.ep) toast(L('Không tải được file âm thanh', 'Could not load the audio file'));
  });
  $('#mini-play').onclick = () => { if (!S.ep) return; audio.paused ? audio.play() : audio.pause(); };
  $('#mini-back').onclick = () => seekBy(-15);
  $('#mini-fwd').onclick = () => seekBy(15);
  // Bấm thanh podcast thu nhỏ (ảnh bìa hoặc tên) ⇒ mở trình phát đầy đủ. Đang ở đúng trang đó (cùng #hash ⇒ trình duyệt không chuyển trang) ⇒ cuộn lên trình phát.
  const openFull = () => {
    if (!S.ep) return;
    const want = /^i-/.test(S.ep.date) ? '#/report/' + S.ep.date.slice(2) : '#/listen/' + S.ep.date;
    const here = S.cur && S.cur.date === S.ep.date && document.getElementById('ls-play');
    if (here) { document.querySelector('.ls-ctl')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    location.hash = want;
  };
  $('#mini-open').onclick = openFull;
  const mm = document.querySelector('.mini-meta');
  if (mm) { mm.setAttribute('role', 'button'); mm.tabIndex = 0; mm.onclick = openFull; mm.onkeydown = e => { if (e.key === 'Enter') openFull(); }; }
  $('#mini-bar').onclick = e => { if (!S.ep) return; const r = e.currentTarget.getBoundingClientRect(); audio.currentTime = (e.clientX - r.left) / r.width * (audio.duration || 0); };
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => seekBy(-15));
    navigator.mediaSession.setActionHandler('seekforward', () => seekBy(15));
  }

  // ── điều hướng ──
  async function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [r, a] = h.split('/');
    if (r === 'noibo') { location.replace('#/report' + (a ? '/' + a : '')); return; }   // link cũ ⇒ MMH Report
    if (r === 'report') {  // 24/11/2026: MMH Report — bản tin nội bộ sáng thứ Hai (người dùng yêu cầu lại, chỉ nhóm Việt Nam)
      if (!$('#m-date').textContent && S.index.editions[0]) $('#m-date').textContent = dateL(S.index.editions[0].date);
      document.querySelectorAll('#nav a').forEach(x => x.classList.toggle('on', x.dataset.r === 'report'));
      document.querySelectorAll('#tabbar [data-tab-k]').forEach(x => x.classList.toggle('on', x.dataset.tabK === 'news'));
      return internalPage();
    }
    let date = S.index.editions[0]?.date;
    if ((r === 'e' || r === 'listen') && a) date = a;
    if (!date) { $('#view').innerHTML = `<div class="empty">${L('Chưa có số báo nào. Số đầu tiên sẽ có sau lượt chạy sáng mai.', 'No editions yet. The first one will appear after tomorrow morning\'s run.')}</div>`; return; }
    let ed;
    try { ed = await loadEd(date); } catch { $('#view').innerHTML = `<div class="empty">${L('Không tải được số báo này.', 'Could not load this edition.')}</div>`; return; }
    S.cur = ed;
    const row = S.index.editions.find(e => e.date === date);
    $('#m-date').textContent = dateL(date);
    $('#m-no').textContent = `${L('Số', 'No.')} ${row?.no || ed.no} · ${L('Hà Nội', 'Hanoi')}`;
    const dark = r === 'listen' || r === 'rank' || r === 'me' || r === 'add' || r === 'learn';
    document.body.classList.toggle('dark', dark);
    document.querySelector('meta[name=theme-color]').content = dark ? '#0E1013' : '#FBF9F4';
    let html;
    if (r === 's' && SEC[a]) html = sectionPage(ed, a);
    else if (r === 'docs') html = docsPage(ed);
    else if (r === 'listen') html = listenPage(ed);
    else if (r === 'archive') html = archivePage();
    else if (r === 'rank' && window.RANK) html = RANK.page();
    else if (r === 'me' && window.RANK) html = RANK.mePage();
    else if (r === 'add' && window.RANK && RANK.addPage) html = RANK.addPage(a);
    else if (r === 'learn' && window.RANK && RANK.learnPage) html = RANK.learnPage();
    else html = front(ed);
    $('#view').innerHTML = html;
    lastLine = -1;
    const key = r === 's' ? a : (r === 'e' || !r) ? 'front' : r;
    document.querySelectorAll('#nav a').forEach(x => x.classList.toggle('on', x.dataset.r === key));
    const tk = r === 'listen' ? 'listen' : r === 'rank' ? 'rank' : r === 'me' ? 'me' : r === 'learn' ? 'study' : 'news';
    document.querySelectorAll('#tabbar [data-tab-k]').forEach(x => x.classList.toggle('on', x.dataset.tabK === tk));
    $('#foot').innerHTML = footer(ed);
    if (r === 'listen') wireListen(ed);
    if (r === 'rank' && window.RANK) RANK.load();
    if (r === 'me' && window.RANK) RANK.meLoad();
    if (window.RANK && RANK.after) RANK.after(r, ed, a);
    if (r === 'learn' && window.RANK && RANK.learnAfter) RANK.learnAfter();
    syncUi();
    if (!S.routed) S.routed = true; else window.scrollTo({ top: 0 });
  }
  function wireListen(ed) {
    $('#ls-back').onclick = () => { if (S.ep?.date !== ed.date) setEp(ed); seekBy(-15); };
    $('#ls-fwd').onclick = () => { if (S.ep?.date !== ed.date) setEp(ed); seekBy(15); };
    $('#ls-spd').onclick = e => {
      const steps = [0.8, 0.9, 1, 1.15, 1.3, 1.5];
      const cur = store.get('mmh_daily_rate', 1);
      const nx = steps[(steps.indexOf(cur) + 1) % steps.length] || 1;
      store.set('mmh_daily_rate', nx); audio.playbackRate = nx;
      e.currentTarget.textContent = String(nx).replace(/^1$/, '1') + '×';
      toast(L('Tốc độ đọc ', 'Speed ') + nx + '×');
    };
    $('#ls-tr').onclick = e => { if (!setEp(ed)) return; const r = e.currentTarget.getBoundingClientRect(); audio.currentTime = (e.clientX - r.left) / r.width * (audio.duration || ed.podcast.audio.dur); if (audio.paused) audio.play(); };
    $('#tx').onclick = e => {
      const p = e.target.closest('p'); if (!p) return;
      const t = parseFloat(p.dataset.t); if (isNaN(t) || !setEp(ed)) return;
      audio.currentTime = t; if (audio.paused) audio.play();
    };
    if (S.ep?.date === ed.date) onTime();
  }
  function footer(ed) {
    const ok = (ed.sources || []).filter(s => s.ok).length;
    const ai = /claude|gemini/.test(ed.writer || '');
    const writer = ai ? L('Biên tập bằng AI từ tin gom được', 'Edited by AI from the collected news') : L('Tin lấy nguyên văn từ báo · podcast đọc tin tiếng Anh', 'Stories as published · the podcast reads English stories');
    const voice = ed.podcast?.voice?.engine === 'eleven' ? L('Giọng đọc: ElevenLabs', 'Voices: ElevenLabs') : L('Giọng đọc: giọng máy (Microsoft neural)', 'Voices: Microsoft neural');
    return `<span><b>MMH Daily Podcast</b> · ${L('số', 'no.')} ${ed.no} · ${L('cập nhật', 'updated')} ${new Date(ed.updated).toLocaleString(EN() ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
      <span>${ok}/${(ed.sources || []).length} ${L('nguồn tin chạy', 'sources ran')}</span><span>${writer}</span><span>${voice}</span><span>${L('Bấm tiêu đề để đọc bài gốc', 'Tap a headline to read the original')}</span>`;
  }

  document.addEventListener('click', e => {
    const p = e.target.closest('[data-play]');
    if (p) { e.preventDefault(); e.stopPropagation(); playDate(p.dataset.play); return; }
    const sb = e.target.closest('[data-sub]');
    if (sb) { S.sub = sb.dataset.sub; store.set('mmh_daily_sub', S.sub); document.querySelectorAll('#subsel button').forEach(b => b.classList.toggle('on', b === sb)); const tx = $('#tx'); if (tx) tx.className = 'tx sub-' + S.sub; lastLine = -1; onTime(); return; }
    const c = e.target.closest('[data-tab]');
    if (c) { S.tab = c.dataset.tab; route(); }
  });
  $('#lang').onclick = () => { S.lang = S.lang === 'vi' ? 'en' : 'vi'; store.set('mmh_daily_lang', S.lang); paintLang(); route(); };
  const paintLang = () => {
    $('#lang').innerHTML = S.lang === 'vi' ? '<b>VI</b> · EN' : 'VI · <b>EN</b>';
    $('#lang').title = S.lang === 'vi' ? 'Đang xem tiếng Việt — bấm để chuyển cả app sang tiếng Anh' : 'English — tap for Vietnamese';
    document.documentElement.lang = S.lang;
    // chữ cố định trong index.html: data-en = bản tiếng Anh, bản Việt nhớ ở data-vi
    document.querySelectorAll('[data-en]').forEach(el => { if (el.dataset.vi == null) el.dataset.vi = el.textContent; el.textContent = S.lang === 'en' ? el.dataset.en : el.dataset.vi; });
    document.querySelectorAll('[data-en-title]').forEach(el => { if (el.dataset.viTitle == null) el.dataset.viTitle = el.title; el.title = S.lang === 'en' ? el.dataset.enTitle : el.dataset.viTitle; });
    document.querySelectorAll('[data-en-aria]').forEach(el => { if (el.dataset.viAria == null) el.dataset.viAria = el.getAttribute('aria-label') || ''; el.setAttribute('aria-label', S.lang === 'en' ? el.dataset.enAria : el.dataset.viAria); });
    document.dispatchEvent(new CustomEvent('mmh-lang', { detail: S.lang }));
  };
  window.addEventListener('hashchange', route);
  // thanh tab dưới đáy: "Học bài" = Lộ trình học kiểu Duolingo (#/learn, path.js)
  new MutationObserver(() => document.body.classList.toggle('has-mini', !$('#mini').hidden)).observe($('#mini'), { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (e.code === 'Space' && S.ep) { e.preventDefault(); audio.paused ? audio.play() : audio.pause(); }
    if (e.key === 'ArrowLeft' && S.ep && document.body.classList.contains('dark')) seekBy(-5);
    if (e.key === 'ArrowRight' && S.ep && document.body.classList.contains('dark')) seekBy(5);
  });

  async function boot() {
    paintLang();
    $('#view').innerHTML = '<div class="skel" style="height:44px;width:70%"></div><div class="skel"></div><div class="skel" style="width:85%"></div><div class="skel" style="width:60%"></div>';
    try { await loadIndex(); }
    catch { $('#view').innerHTML = '<div class="empty">Chưa có dữ liệu. Thử tải lại sau ít phút.</div>'; return; }
    if (!location.hash || location.hash === '#' || location.hash === '#/') history.replaceState(null, '', '#/listen');   // mở app ⇒ vào thẳng podcast (người dùng yêu cầu 24/11/2026)
    await route();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !(window.DAILY_CFG || {}).demo) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ══════════ BẢN TIN NỘI BỘ (Chủ nhật) — chỉ người đăng nhập email công ty ══════════
  // Dữ liệu trên trang đã MÃ HOÁ (AES-256-GCM); khoá lấy từ Training Hub ▸ dailyKey bằng phiên `mmh_tk` (dùng chung Report Hub / CRM).
  const HUB = 'https://script.google.com/macros/s/AKfycbwsX4cQEoH4LNlmcNfe8qWIM9K6EiDEXy7PjhP9bHY2citL6xHn5L1unsAlQJHyL9EP/exec';
  const IN = { key: null, kid: '', admin: false, idx: null, eds: {} };
  // Phiên: tài khoản học viên (`dy…`, rank.js) lưu riêng mmh_daily_tk — KHÔNG ghi đè mmh_tk của Report Hub / CRM (cùng trang github.io).
  // Chưa có ⇒ dùng phiên công ty mmh_tk (máy chủ tự tạo tài khoản học viên), trừ khi đã bấm Đăng xuất trong app này (mmh_daily_out).
  const tkGet = () => { try { return localStorage.getItem('mmh_daily_tk') || (localStorage.getItem('mmh_daily_out') ? '' : localStorage.getItem('mmh_tk')) || ''; } catch { return ''; } };
  const tkSet = t => {
    try {
      if (t) { localStorage.setItem(t.startsWith('dy') ? 'mmh_daily_tk' : 'mmh_tk', t); localStorage.removeItem('mmh_daily_out'); return; }
      const cur = tkGet(); localStorage.removeItem('mmh_daily_tk'); if (cur && !cur.startsWith('dy')) localStorage.removeItem('mmh_tk');   // phiên hỏng
    } catch { /* riêng tư */ }
  };
  async function hub(action, params) {
    const q = new URLSearchParams({ action, ...params });
    try {
      const r = await fetch(HUB + '?' + q, { credentials: 'omit' });
      return await r.json();
    } catch {
      return await new Promise((res, rej) => {        // dự phòng JSONP
        const cb = '__hub' + Date.now() + Math.floor(Math.random() * 1e6), sc = document.createElement('script');
        const t = setTimeout(() => { clean(); rej(new Error('Máy chủ phản hồi chậm')); }, 30000);
        const clean = () => { clearTimeout(t); delete window[cb]; sc.remove(); };
        window[cb] = d => { clean(); res(d); }; sc.onerror = () => { clean(); rej(new Error('Không kết nối được máy chủ')); };
        q.set('callback', cb); sc.src = HUB + '?' + q; document.body.appendChild(sc);
      });
    }
  }
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function decrypt(buf) {
    const k = await crypto.subtle.importKey('raw', b64(IN.key), 'AES-GCM', false, ['decrypt']);
    const u = new Uint8Array(buf);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, k, u.slice(12));
  }
  async function inKey() {
    if (IN.key) return true;
    const tk = tkGet(); if (!tk) return false;
    const d = await hub('dailyKey', { tk });
    if (!d.ok) { if (d.code === 'AUTH') tkSet(''); throw new Error(d.error || 'Không lấy được khoá'); }
    Object.assign(IN, { key: d.key, kid: d.kid, admin: d.admin, pic: d.pic });
    return true;
  }
  // Đăng nhập: dùng chung tài khoản app (rank.js ▸ RANK.login: email + mật khẩu / mã). Chỉ EMAIL CÔNG TY mở được (máy chủ dailyKey kiểm RH_Users).
  function loginHtml(msg) {
    return `<div class="in-login"><div class="kick">MMH Report</div><h2>${L('Bản tin nội bộ sáng thứ Hai', 'The Monday-morning internal bulletin')}</h2>
      <p>${L('Tuần làm việc của MMH Việt Nam: Sales đi địa bàn và phản hồi khách hàng, sự kiện và ấn phẩm Marketing, đơn hàng, pháp lý, nhân sự của Back office — kế hoạch tuần trước đã làm tới đâu, tuần này làm gì. Mỗi tập một người dẫn.', 'The week at MMH Vietnam: sales visits and customer feedback, marketing events and designs, back-office orders, legal and HR — how last week\'s plans went and what\'s next. A new anchor every episode.')}</p>
      <p>${L('Chỉ dành cho nhân sự MMH: đăng nhập bằng email công ty (@manimedicalhanoi.com hoặc @mani.inc).', 'MMH staff only: sign in with your company email (@manimedicalhanoi.com or @mani.inc).')}</p>
      <button class="in-btn" type="button" id="in-login">${L('Đăng nhập', 'Sign in')}</button>
      ${msg ? `<p class="in-err">${esc(msg)}</p>` : ''}</div>`;
  }
  function wireLogin() {
    const b = $('#in-login'); if (!b) return;
    b.onclick = async () => {
      if (!window.RANK?.login) { toast(L('Chưa tải xong, thử lại sau giây lát', 'Still loading, try again')); return; }
      if (await RANK.login(L('MMH Report chỉ mở được bằng email công ty.', 'MMH Report opens with a company email only.'))) { IN.key = null; route(); }
    };
  }
  async function loadInEd(date) {
    if (IN.eds[date]) return IN.eds[date];
    const r = await fetch(`data/internal/${date}.json.enc`, { cache: 'no-cache' });
    if (!r.ok) throw new Error('Chưa có bản tin tuần này');
    const ed = JSON.parse(new TextDecoder().decode(await decrypt(await r.arrayBuffer())));
    ed.date = 'i-' + ed.date;           // tách khỏi số báo hằng ngày cùng ngày
    return (IN.eds[date] = ed);
  }
  async function inAudio(ed) {
    const a = ed.podcast.audio;
    if (!a || a.blob) return;
    const r = await fetch(a.file.replace(/^\/+/, ''), { cache: 'force-cache' });
    if (!r.ok) throw new Error('Không tải được âm thanh');
    a.file = URL.createObjectURL(new Blob([await decrypt(await r.arrayBuffer())], { type: 'audio/mpeg' }));
    a.blob = true;
  }
  const num = n => (n || 0).toLocaleString(S.lang === 'en' ? 'en-US' : 'vi-VN');
  const vnd = v => v >= 1e9 ? (v / 1e9).toFixed(1).replace('.', S.lang === 'en' ? '.' : ',') + L(' tỷ', ' bn') : v >= 1e6 ? Math.round(v / 1e6) + L(' triệu', ' M') : num(v);
  const dm = s => s ? `${+String(s).slice(8, 10)}/${+String(s).slice(5, 7)}` : '';
  const RSEC = ['headline', 'sales', 'marketing', 'backoffice', 'followup', 'people', 'next'];
  const fbOf = v => { const m = String(v.res || '').match(/3\.\s*Customer Feedback:\s*(.*?)(?:\s*4\.\s*Opportunities|$)/i); return (m && m[1].trim()) || ''; };
  // MMH Report (24/11/2026): trang 1 tập — người dẫn, podcast + phụ đề, các mục văn xuôi do Claude viết, số liệu chi tiết thu gọn.
  function inPage(ed) {
    const f = ed.facts || {}, w = ed.week, p = ed.podcast, eps = (IN.idx.weeks || []).filter(x => x.series === 'report');
    const sal = f.sales || [], deps = f.departments || [], dep = id => deps.find(d => d.id === id) || { count: {}, plan: {}, keys: [], trips: [] };
    const sum = (a, k) => a.reduce((s, t) => s + (t.count?.[k] || 0), 0);
    const delta = (a, b) => b ? `${a >= b ? '+' : ''}${a - b} ${L('so với tuần trước', 'vs last week')}` : '';
    const mk = dep('marketing'), bo = dep('backoffice');
    const planT = deps.reduce((s, d) => s + (d.plan?.total || 0), 0), planD = deps.reduce((s, d) => s + (d.plan?.done || 0), 0);
    const tile = (k, v, s) => `<div class="in-tile"><span>${k}</span><b>${v}</b>${s ? `<em>${s}</em>` : ''}</div>`;
    const turns = (p.turns || []).filter(t => t.text), hosts = Object.fromEntries(p.hosts.map(h => [h.id, h]));
    const wkStr = `${dm(w.from)} – ${dm(w.to)}/${w.to.slice(0, 4)}`;
    const secs = (ed.sections || []).slice().sort((a, b) => RSEC.indexOf(a.key) - RSEC.indexOf(b.key));
    const visits = sal.flatMap(t => (t.visits || []).map(v => ({ ...v, team: t.name }))).filter(v => fbOf(v) || v.fb).slice(0, 12);
    const orders = sal.flatMap(t => t.orders || []);
    const events = mk.keys.filter(k => /event/i.test(k.type));
    const nextV = sal.flatMap(t => (t.next || []).map(v => ({ ...v, team: t.name }))).sort((a, b) => a.d.localeCompare(b.d));
    const nextT = deps.flatMap(d => d.keys.flatMap(k => k.items.filter(i => i.tag === 'next').map(i => ({ ...i, dep: d.name, key: k.key })))).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    const trips = deps.flatMap(d => d.trips || []);
    return `<div class="in rp">
      <div class="in-head"><div><div class="kick">MMH Report · ${L('Tập', 'Episode')} ${ed.ep || ''} · ${L('chỉ dành cho nhân sự MMH', 'MMH staff only')}</div>
        <h1 class="hl xl">${esc(ed.title?.[S.lang] || ed.title?.vi || 'MMH Report')}</h1>
        <p class="dek">${esc(ed.intro?.[S.lang] || ed.intro?.vi || '')}</p>
        <p class="rp-by">${L('Tuần', 'Week')} ${wkStr} · ${L('Người dẫn', 'Anchor')} <b>${esc(p.hosts[0]?.name || '')}</b></p></div>
        <select class="in-wk" id="in-wk" aria-label="${L('Chọn tập', 'Choose an episode')}">${eps.map(x => `<option value="${x.date}"${'i-' + x.date === ed.date ? ' selected' : ''}>${L('Tập', 'Ep.')} ${x.ep} · ${dm(x.from)} – ${dm(x.date)}</option>`).join('')}</select></div>
      <section class="ls in-player" style="--show:${p.color || '#9B2C2C'}">
        <div class="in-ph"><div class="cv">${cover(p, w.to)}</div><div><div class="ls-k">MMH Report · ${L('Tập', 'Episode')} ${ed.ep || ''}</div><b>${esc(p.title || p.name)}</b><span>${esc(p.hosts.map(h => h.name).join(' & '))}${p.audio?.dur ? ' · ' + Math.round(p.audio.dur / 60) + L(' phút', ' min') : ' · ' + L('giọng đọc đang được tạo', 'audio is being made')}</span></div></div>
        <div class="ls-ctl"><button class="bigplay" id="ls-play" type="button" data-inplay="1" aria-label="${L('Phát', 'Play')}">${ICON.play}</button>
          <button class="ibtn" id="ls-back" type="button" aria-label="${L('Lùi 15 giây', 'Back 15 seconds')}">${$('#mini-back').innerHTML}</button><button class="ibtn" id="ls-fwd" type="button" aria-label="${L('Tới 15 giây', 'Forward 15 seconds')}">${$('#mini-fwd').innerHTML}</button>
          <button class="spd" id="ls-spd" type="button">${store.get('mmh_daily_rate', 1)}×</button></div>
        <div class="nowsub" id="nowsub"><span class="en"></span><span class="vi"></span></div>
        <div class="seek"><span id="ls-cur">0:00</span><div class="tr" id="ls-tr"><i id="ls-prog" style="width:0"></i></div><span id="ls-dur">${p.audio?.dur ? mmss(p.audio.dur) : '--:--'}</span></div>
        <details class="in-tx"><summary>${L('Lời đọc + phụ đề tiếng Việt', 'Transcript + Vietnamese subtitles')}</summary>
          <div class="subsel" id="subsel">${[['both', L('Anh + Việt', 'EN + VI')], ['en', L('Tiếng Anh', 'English')], ['vi', L('Tiếng Việt', 'Vietnamese')]].map(([k, l]) => `<button type="button" data-sub="${k}" class="${S.sub === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div class="tx sub-${S.sub}" id="tx">${turns.map((t, i) => `<p data-i="${i}" data-t="${t.t ?? ''}"><b>${esc(hosts[t.sp]?.name || t.sp)}</b><span class="en">${esc(t.text)}</span>${t.vi ? `<span class="vi">${esc(t.vi)}</span>` : ''}</p>`).join('')}</div></details>
      </section>
      ${window.STUDY ? STUDY.html(ed) : ''}
      <div class="in-tiles">${tile(L('Hoạt động Sales', 'Sales activities'), num(sum(sal, 'done')), delta(sum(sal, 'done'), sum(sal, 'prevDone')))}${tile(L('Gặp khách', 'Customer visits'), num(sum(sal, 'visits')), num(sum(sal, 'accounts')) + L(' khách hàng', ' customers'))}${tile(L('Đơn hàng', 'Orders'), num(sum(sal, 'orders')), sum(sal, 'orderAmount') ? vnd(sum(sal, 'orderAmount')) + ' đ' : '')}${tile(L('Việc Marketing xong', 'Marketing tasks done'), num(mk.count.done), delta(mk.count.done || 0, mk.count.prevDone))}${tile(L('Việc Back office xong', 'Back-office tasks done'), num(bo.count.done), delta(bo.count.done || 0, bo.count.prevDone))}${tile(L('Đúng hẹn', 'On plan'), planT ? Math.round(planD / planT * 100) + '%' : '–', planT ? `${planD}/${planT} ${L('việc có hạn trong tuần', 'tasks due this week')}` : '')}</div>
      <div class="rp-secs">${secs.map(x => `<section class="rp-sec rp-${x.key}"><h3>${esc(S.lang === 'en' ? x.h_en : x.h_vi)}</h3><p>${esc(S.lang === 'en' ? x.en : x.vi)}</p></section>`).join('')}</div>
      <details class="rp-data"><summary>${L('Số liệu chi tiết của tuần', 'The week in detail')}</summary>
      <div class="in-grid">
        <div class="in-card"><h3>${L('Đi địa bàn theo người', 'Field work by person')}</h3><table class="in-tb"><thead><tr><th>${L('Người', 'Person')}</th><th>${L('Hoạt động', 'Activities')}</th><th>${L('Gặp khách', 'Visits')}</th><th>${L('Khách', 'Customers')}</th></tr></thead><tbody>${sal.flatMap(t => Object.entries(t.byPic || {}).map(([k, v]) => `<tr><td>${esc(k)} <small>${esc(t.name)}</small></td><td>${v.done}</td><td>${v.visits}</td><td>${v.accounts}</td></tr>`)).join('') || `<tr><td colspan="4">${L('Chưa có', 'None')}</td></tr>`}</tbody></table></div>
        <div class="in-card"><h3>${L('Khách hàng nói gì', 'What customers said')}</h3><ul class="in-list">${visits.map(v => `<li><b>${esc(v.acc)}</b><small>${esc(v.pic)} · ${esc(v.prov)} · ${dm(v.d)}${v.prod ? ' · ' + esc(v.prod) : ''}</small>${esc(fbOf(v) || v.fb)}${v.next ? `<small>${L('Tiếp theo', 'Next')}: ${esc(v.next)}</small>` : ''}</li>`).join('') || `<li class="none">${L('Chưa có phản hồi', 'No feedback')}</li>`}</ul></div>
        <div class="in-card"><h3>${L('Đơn hàng trong tuần', 'Orders this week')}</h3><ul class="in-list">${orders.map(o => `<li><b>${esc(o.acc)}</b> · ${vnd(o.amount)} đ<small>${esc(o.pic)} · ${esc(o.prov)} · ${dm(o.d)} · ${esc(o.via)}</small><small>${esc(o.lines.join('; '))}</small></li>`).join('') || `<li class="none">${L('Không có đơn mới', 'No new orders')}</li>`}</ul></div>
        <div class="in-card"><h3>${L('Sự kiện Marketing', 'Marketing events')}</h3><ul class="in-list">${events.map(k => `<li><b>${esc(k.key)}</b><small>${k.pct}% · ${k.items.filter(i => i.tag === 'done').length} ${L('việc xong trong tuần', 'tasks done this week')}${k.items.filter(i => i.tag === 'next').length ? ' · ' + k.items.filter(i => i.tag === 'next').length + L(' việc tuần này', ' due this week') : ''}</small></li>`).join('') || `<li class="none">${L('Không có', 'None')}</li>`}</ul></div>
        <div class="in-card"><h3>${L('Lịch gặp khách tuần này', 'Visits planned this week')}</h3><ul class="in-list">${nextV.slice(0, 30).map(v => `<li><b>${dm(v.d)} · ${esc(v.acc)}</b><small>${esc(v.pic)} · ${esc(v.prov)}${v.prod ? ' · ' + esc(v.prod) : ''}</small>${v.plan ? esc(v.plan) : ''}</li>`).join('') || `<li class="none">${L('Chưa có lịch', 'Nothing planned')}</li>`}</ul></div>
        <div class="in-card"><h3>${L('Việc đến hạn tuần này', 'Tasks due this week')}</h3><ul class="in-list">${nextT.slice(0, 30).map(x => `<li><b>${esc(x.t)}</b><small>${esc(x.dep)} · ${esc(x.pic)} · ${L('hạn', 'due')} ${dm(x.due)}</small></li>`).join('') || `<li class="none">${L('Chưa có', 'None')}</li>`}</ul>
          ${trips.length ? `<h3 style="margin-top:14px">${L('Công tác', 'Business trips')}</h3><ul class="in-list">${trips.map(t => `<li><b>${esc(t.pic)}</b><small>${esc(t.what)}</small></li>`).join('')}</ul>` : ''}</div>
      </div></details>
      ${IN.admin ? adminBox() : ''}
      <p class="in-foot">${L('Bản tin được mã hoá; chỉ người đăng nhập email công ty mới mở được. Số liệu lấy từ Report Hub và CRM (nhóm Việt Nam).', 'Encrypted; only company-email accounts can open it. Data from Report Hub and CRM (Vietnam teams).')} ${esc(IN.pic || '')} · <button class="in-lnk" type="button" id="in-out">${L('Đăng xuất', 'Sign out')}</button></p>
    </div>`;
  }
  function adminBox(missing) {
    const same = IN.idx?.kid && IN.idx.kid === IN.kid;
    return `<details class="in-admin"${missing || !same ? ' open' : ''}><summary>Thiết lập (Admin)</summary>
      <p>${same ? 'Khoá trên máy chủ khớp với khoá GitHub đang dùng.' : (IN.idx?.kid ? 'Khoá trên GitHub KHÁC khoá máy chủ (khoá đã đổi). ' : 'Chưa có bản tin nào được mã hoá nên chưa kiểm được khoá trên GitHub. ') + 'Nếu chưa làm: chép khoá dưới đây vào <b>Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret</b> của kho MMH-Daily, tên <code>DAILY_INTERNAL_KEY</code>. Sau đó bấm <b>Tạo bản tin tuần này</b> — bản tin đầu tiên tạo xong là khoá được xác nhận.'}</p>
      ${same ? '' : `<div class="in-key"><code id="in-k">${esc(IN.key)}</code><button class="in-btn" type="button" id="in-copy">Chép khoá</button></div><p class="in-small">Mã nhận diện: ${esc(IN.kid)}. Không gửi khoá qua chat / email.</p>`}</details>`;
  }
  async function internalPage() {
    document.body.classList.remove('dark');
    document.querySelector('meta[name=theme-color]').content = '#FBF9F4';
    $('#view').innerHTML = '<div class="skel" style="height:40px;width:60%"></div><div class="skel"></div>';
    try { if (!(await inKey())) { $('#view').innerHTML = loginHtml(); wireLogin(); return; } }
    catch (e) { $('#view').innerHTML = loginHtml(e.message); wireLogin(); return; }
    if (!IN.idx) { try { IN.idx = await (await fetch('data/internal/index.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch { IN.idx = { weeks: [] }; } }
    const eps = (IN.idx.weeks || []).filter(x => x.series === 'report');
    const want = location.hash.split('/')[2] || eps[0]?.date;
    if (!want) {
      $('#view').innerHTML = `<div class="in"><div class="empty in-first"><p>${L('Chưa có tập MMH Report nào. Tập mới ra sáng thứ Hai hằng tuần.', 'No MMH Report episode yet. A new one comes out every Monday morning.')}</p></div>${IN.admin ? adminBox(true) : ''}</div>`;
      wireAdmin(); return;
    }
    let ed;
    try { ed = await loadInEd(want); } catch (e) { $('#view').innerHTML = `<div class="in"><div class="empty">${esc(e.message)}${IN.idx.kid && IN.idx.kid !== IN.kid ? L(' — khoá đã đổi, Admin cần cập nhật khoá trên GitHub.', ' — the key changed; Admin must update it on GitHub.') : ''}</div>${IN.admin ? adminBox(true) : ''}</div>`; wireAdmin(); return; }
    if (ed.series !== 'report') { location.replace('#/report'); return; }
    S.cur = ed;
    $('#view').innerHTML = inPage(ed);
    $('#foot').innerHTML = `<span><b>MMH Report</b> · ${L('bản tin nội bộ sáng thứ Hai', 'the Monday internal bulletin')}</span>`;
    wireAdmin();
    $('#in-wk').onchange = e => { location.hash = '#/report/' + e.target.value; };
    $('#in-out').onclick = () => { if (window.RANK?.logout) RANK.logout(); else tkSet(''); IN.key = null; IN.eds = {}; route(); };
    $('#ls-play').onclick = async () => {
      try { if (ed.podcast.audio && !ed.podcast.audio.blob) { toast(L('Đang giải mã âm thanh…', 'Decrypting audio…')); await inAudio(ed); } if (!setEp(ed)) return; audio.paused ? audio.play() : audio.pause(); }
      catch (er) { toast(er.message); }
    };
    wireListen(ed);
    syncUi();
  }
  function wireAdmin() {
    const c = $('#in-copy');
    if (c) c.onclick = async () => { try { await navigator.clipboard.writeText(IN.key); toast('Đã chép khoá'); } catch { toast('Trình duyệt không cho chép — hãy chọn và chép tay'); } };
  }


  // ══════════ TỔNG HỢP NGAY (bất kỳ lúc nào) ══════════
  const CFG = window.DAILY_CFG || {};
  (function updWire() {
    const dlg = $('#upd-dlg'); if (!dlg) return;
    const gh = `https://github.com/${CFG.repo || 'ManiMedicalHanoi/MMH-Daily'}/actions/workflows/daily.yml`;
    $('#upd-claude-daily').href = CFG.routines?.daily || 'https://claude.ai/code/routines';
    $('#upd-claude-week').href = CFG.routines?.weekly || 'https://claude.ai/code/routines';
    $('#upd-gh').href = gh;
    let timer = null, since = '';
    const open = () => { dlg.hidden = false; $('#upd-close').focus(); };
    const close = () => { dlg.hidden = true; };
    const watch = () => {
      since = S.index?.updated || ''; $('#upd-wait').hidden = false; store.set('mmh_daily_wait', Date.now());
      clearInterval(timer);
      timer = setInterval(async () => {
        try {
          const j = await (await fetch('data/index.json?t=' + Date.now(), { cache: 'no-store' })).json();
          const ij = await fetch('data/internal/index.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
          const newer = j.updated > since || (ij && IN.idx && ij.updated > (IN.idx.updated || ''));
          if (newer) { clearInterval(timer); $('#upd-wait').hidden = true; S.index = j; S.eds = {}; IN.idx = ij || IN.idx; IN.eds = {}; toast('Đã có số mới'); route(); }
        } catch { /* mạng chập chờn — thử lại phút sau */ }
        if (Date.now() - (store.get('mmh_daily_wait', 0)) > 45 * 60e3) { clearInterval(timer); $('#upd-wait').hidden = true; }
      }, 60e3);
    };
    $('#upd-btn').onclick = open;
    $('#upd-close').onclick = close;
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); if (e.target.closest('.dlg-a')) watch(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) close(); });
  })();

  window.DAILY = { showName, showColor, S, L, tr, EN, dateL, route, playDate, IN, setEp, loadEd, hub, tkGet, tkSet, inKey, toast, store, esc, audio, viDate, mmss, ICON, loadIndex, seekBy, HUB, inAudio };
  boot();
})();
