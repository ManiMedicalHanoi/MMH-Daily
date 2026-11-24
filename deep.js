/* MMH Daily Podcast — CHUYÊN ĐỀ (25/11/2026, người dùng: "đi sâu vào một chủ đề — đấu thầu chỉ đọc Báo Đấu Thầu, văn bản pháp quy từ Thư viện Pháp luật,
   glôcôm, bệnh võng mạc, xu hướng & kỹ thuật điều trị mới, tài liệu của các hãng; thông tin luôn mới, không trùng").
   #/deep = danh sách chuyên đề (số bài mới từ lần xem trước) · #/deep/<id> = bài của chuyên đề, lọc theo Loại (tin · văn bản · nghiên cứu · hãng),
   Phần (chip của chuyên đề), Nguồn (vd. chỉ Báo Đấu thầu), Chỉ bài mới, sắp Mới nhất / Nổi bật. Chữ tiếng Anh: chạm 1 từ ⇒ tra nghĩa, lưu Sổ từ (tx.js).
   Dữ liệu: data/deep/index.json + data/deep/<id>.json (tools/deep.mjs, GitHub Actions mỗi sáng). Nhớ trên máy: mmh_deep_seen {id: lần xem trước}, mmh_deep_follow [id]. */
(function () {
  const D = window.DAILY; if (!D) return;
  const esc = D.esc, store = D.store, L = (vi, en) => D.L(vi, en), EN = () => D.S.lang === 'en';
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    gavel: svg('<path d="m14 5 5 5M11.5 7.5l5 5M8 11l5 5M3 21l7-7"/><path d="m12.5 4.5 7 7-2 2-7-7z"/>'),
    doc: svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    tooth: svg('<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.4 2.6 1 6 2.6 6 1.4 0 1.6-3.4 2.4-5.5.4-1 .9-1.5 2-1.5s1.6.5 2 1.5c.8 2.1 1 5.5 2.4 5.5 1.6 0 2.2-3.4 2.6-6 .5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>'),
    suture: svg('<path d="M4 20c4-1 6-4 7-8s3-7 9-8"/><path d="M7 9l3 3M11 6l3 3M13 14l3 3"/>'),
    star: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    say: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
    ext: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    back: svg('<path d="m15 5-7 7 7 7"/>'),
    brand: svg('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
  };
  const S = { idx: null, at: 0, files: {}, prev: {}, f: {} };
  const seen = () => store.get('mmh_deep_seen', {}) || {};
  const follows = () => store.get('mmh_deep_follow', []) || [];
  const tn = p => (Array.isArray(p) ? (EN() ? p[1] : p[0]) : '');
  const ago = d => { const h = Math.round((Date.now() - new Date(d)) / 36e5); if (h < 1) return L('vừa xong', 'just now'); if (h < 24) return h + L(' giờ trước', 'h ago'); const n = Math.round(h / 24); if (n < 31) return n + L(' ngày trước', 'd ago'); const x = new Date(d); return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`; };
  const isNew = (x, id) => { const p = S.prev[id] ?? seen()[id]; return p ? x.first > p : Date.now() - new Date(x.first) < 7 * 864e5; };

  async function loadIdx() {
    if (S.idx && Date.now() - S.at < 10 * 60e3) return S.idx;
    const r = await fetch('data/deep/index.json?t=' + Math.floor(Date.now() / 6e5), { cache: 'no-cache' });
    if (!r.ok) throw new Error('index ' + r.status);
    S.idx = await r.json(); S.at = Date.now(); return S.idx;
  }
  async function loadTopic(id) {
    if (S.files[id] && Date.now() - S.files[id]._at < 10 * 60e3) return S.files[id];
    const r = await fetch(`data/deep/${id}.json?t=` + Math.floor(Date.now() / 6e5), { cache: 'no-cache' });
    if (!r.ok) throw new Error(id + ' ' + r.status);
    const f = await r.json(); f._at = Date.now(); return (S.files[id] = f);
  }
  // số bài mới từ lần xem trước (chưa xem bao giờ ⇒ số bài 7 ngày qua)
  function newCount(t) { const p = seen()[t.id]; if (!p) return t.new7 || 0; return (t.fr || (t.top || []).map(x => x.first)).filter(f => f > p).length; }

  // ── danh sách chuyên đề ──
  const H = x => (EN() ? (x.lang === 'en' ? x.t : x.h_en || x.t) : (x.lang === 'vi' ? x.t : x.h_vi || x.t));
  function card(t) {
    const nw = newCount(t), fol = follows().includes(t.id), top = (t.top || [])[0];
    return `<a class="dp-card" href="#/deep/${t.id}" style="--tc:${esc(t.color)}">
      <div class="dp-ch"><span class="dp-ic">${IC[t.icon] || IC.doc}</span><div><b>${esc(EN() ? t.en : t.vi)}</b><span>${t.n} ${L('bài', 'items')}${nw ? ` · <em>${nw} ${L('mới', 'new')}</em>` : ''}</span></div>${fol ? `<i class="dp-fol" title="${L('Đang theo dõi', 'Following')}">${IC.star}</i>` : ''}</div>
      <p class="dp-cd">${esc(tn(t.desc))}</p>
      ${top ? `<div class="dp-ct"><small>${esc(L('Mới nhất', 'Latest'))} · ${esc(ago(top.d))}</small><span>${esc(H(top))}</span></div>` : ''}
    </a>`;
  }
  function hubHtml(idx) {
    const fl = follows(), T = idx.topics || [];
    const fol = T.filter(t => fl.includes(t.id));
    const latest = fol.flatMap(t => (t.top || []).map(x => ({ ...x, tp: t }))).filter(x => isNew(x, x.tp.id) || !seen()[x.tp.id]).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 6);
    return `<div class="dp">
      <div class="sec-h" style="margin-top:4px"><h2>${L('Chuyên đề', 'Deep dives')}</h2><span class="sub">${L('Đi sâu từng chủ đề — chỉ nguồn uy tín, mỗi ngày có bài mới, bài trùng được gộp lại', 'One topic at a time — trusted sources only, new items every day, duplicates merged')}</span></div>
      ${latest.length ? `<section class="dp-follow"><h3>${L('Mới trong chuyên đề bạn theo dõi', 'New in topics you follow')}</h3><ul>${latest.map(x => `<li><a href="#/deep/${x.tp.id}"><i style="--tc:${esc(x.tp.color)}"></i><span>${esc(H(x))}</span><small>${esc(EN() ? x.tp.en : x.tp.vi)} · ${esc(x.src)} · ${esc(ago(x.d))}</small></a></li>`).join('')}</ul></section>` : ''}
      ${(idx.groups || []).map(g => { const xs = T.filter(t => t.group === g.id); return xs.length ? `<h3 class="dp-gh">${esc(EN() ? g.en : g.vi)}</h3><div class="dp-grid">${xs.map(card).join('')}</div>` : ''; }).join('')}
      ${idx.brands ? `<h3 class="dp-gh">${L('Thông tin các hãng', 'Company news')}</h3><div class="dp-grid"><a class="dp-card" href="#/deep/_brands" style="--tc:#555"><div class="dp-ch"><span class="dp-ic">${IC.brand}</span><div><b>${L('Tin của các hãng', 'From manufacturers')}</b><span>${idx.brands} ${L('bài', 'items')}</span></div></div><p class="dp-cd">${L('Sản phẩm mới, phê duyệt, nghiên cứu do các hãng nhãn khoa, nha khoa, ngoại khoa công bố (thông cáo, trang tin của hãng).', 'New products, approvals and studies announced by eye-care, dental and surgical companies (press releases, company newsrooms).')}</p></a></div>` : ''}
      <p class="dp-note">${L('Mỗi bài ghi rõ mức nguồn: Cơ quan nhà nước · Tạp chí khoa học · Chuyên ngành · Báo lớn · Thông tin của hãng. Tin của hãng là thông tin quảng bá — đối chiếu với nghiên cứu trước khi dùng.', 'Every item shows its source type: Government · Peer-reviewed journal · Specialist source · Major newspaper · Company news. Company news is promotional — check it against research before using it.')}</p>
    </div>`;
  }

  // ── trang một chuyên đề ──
  const filt = id => (S.f[id] ||= { kind: '', sub: '', src: '', only: false, sort: 'new' });
  function itemHtml(x, id, idx) {
    const kn = tn((idx.kindName || {})[x.kind]), tr = tn((idx.tierName || {})[x.tier]);
    const en = x.lang === 'en' ? x.t : x.h_en, vi = x.lang === 'vi' ? x.t : x.h_vi;
    const sEn = x.lang === 'en' ? x.sum : x.s_en, sVi = x.lang === 'vi' ? x.sum : x.s_vi;
    const head = EN() ? (en || x.t) : (vi || x.t), alt = EN() ? '' : (en && en !== head ? en : '');
    const sum = EN() ? (sEn || '') : (sVi || sEn || '');
    const sum2 = !EN() && sEn && sVi ? sEn : '';
    return `<article class="dp-it${isNew(x, id) ? ' new' : ''}" data-id="${esc(x.id)}">
      <div class="dp-k"><span class="dp-kind k-${esc(x.kind)}">${esc(kn)}</span><span class="dp-tier t-${esc(x.tier)}">${esc(tr)}</span>${isNew(x, id) ? `<span class="dp-new">${L('Mới', 'New')}</span>` : ''}${id === '_brands' && x.topic ? `<span class="dp-tp">${esc(EN() ? (idx.topics.find(t => t.id === x.topic) || {}).en || '' : (idx.topics.find(t => t.id === x.topic) || {}).vi || '')}</span>` : ''}</div>
      <h3 class="dp-t"><a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">${esc(head)}</a></h3>
      ${alt ? `<p class="dp-en" lang="en">${esc(alt)}</p>` : ''}
      ${sum ? `<p class="dp-s">${x.kind === 'study' ? `<b>${L('Kết luận', 'Conclusion')}: </b>` : ''}<span${EN() ? ' class="dp-en" lang="en"' : ''}>${esc(sum)}</span></p>` : ''}
      ${sum2 ? `<p class="dp-en dp-s2" lang="en">${esc(sum2)}</p>` : ''}
      <div class="dp-by"><b>${esc(x.src)}</b><span>${esc(ago(x.d))}</span>${x.also?.length ? `<span>${L('cũng đăng trên', 'also in')} ${esc(x.also.slice(0, 3).join(', '))}</span>` : ''}${x.docs?.length ? `<span class="dp-no">${esc(x.docs.join(' · '))}</span>` : ''}${x.mt ? `<span class="dp-mt">${L('dịch máy', 'machine-translated')}</span>` : ''}
        <span class="grow"></span>${en ? `<button type="button" class="dp-ib" data-dp="say" aria-label="${L('Nghe đọc tiếng Anh', 'Read aloud in English')}" title="${L('Nghe đọc tiếng Anh', 'Read aloud in English')}">${IC.say}</button>` : ''}<a class="dp-ib" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer" aria-label="${L('Mở bài gốc', 'Open the original')}" title="${L('Mở bài gốc', 'Open the original')}">${IC.ext}</a></div>
    </article>`;
  }
  function chips(list, cur, key) {
    return list.map(([v, label, n]) => `<button type="button" class="chip${cur === v ? ' on' : ''}" data-dpf="${key}" data-v="${esc(v)}">${esc(label)}${n != null ? ` <small>${n}</small>` : ''}</button>`).join('');
  }
  function topicHtml(id, idx, f) {
    const t = id === '_brands' ? { id, vi: 'Tin của các hãng', en: 'From manufacturers', color: '#555', icon: 'brand', desc: ['Thông tin do các hãng công bố (thông cáo báo chí, trang tin của hãng) ở mọi chuyên đề nhãn khoa, nha khoa, ngoại khoa.', 'Announcements from companies (press releases, company newsrooms) across the eye-care, dental and surgical topics.'], subs: [] }
      : (idx.topics || []).find(x => x.id === id);
    if (!t) return `<div class="empty">${L('Không có chuyên đề này.', 'No such topic.')}</div>`;
    const F = filt(id), all = f.items || [];
    let xs = all.filter(x => (!F.kind || x.kind === F.kind) && (!F.sub || x.sub?.includes(F.sub)) && (!F.src || x.src === F.src) && (!F.only || isNew(x, id)));
    if (F.sort === 'top') xs = [...xs].sort((a, b) => (b.sc || 0) + Math.max(0, 2 - (Date.now() - new Date(b.d)) / (15 * 864e5)) - ((a.sc || 0) + Math.max(0, 2 - (Date.now() - new Date(a.d)) / (15 * 864e5))));
    const cnt = fn => all.filter(fn).length;
    const kinds = ['news', 'doc', 'study', 'pr'].map(k => [k, tn((idx.kindName || {})[k]), cnt(x => x.kind === k)]).filter(k => k[2]);
    const srcs = Object.entries(all.reduce((m, x) => (m[x.src] = (m[x.src] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const subs = (t.subs || []).map(s => [s.id, EN() ? s.en : s.vi, cnt(x => x.sub?.includes(s.id))]).filter(s => s[2]);
    const nNew = cnt(x => isNew(x, id)), fol = follows().includes(id);
    const vocab = (f.vocab || []);
    const eps = (D.S.index?.editions || []).filter(e => [].concat(e.deep || []).includes(id)).slice(0, 2);
    return `<div class="dp dp-one" style="--tc:${esc(t.color)}">
      <a class="dp-back" href="#/deep">${IC.back}${L('Chuyên đề', 'Deep dives')}</a>
      <header class="dp-hd"><span class="dp-ic big">${IC[t.icon] || IC.doc}</span><div><h1>${esc(EN() ? t.en : t.vi)}</h1><p>${esc(tn(t.desc))}</p>
        <div class="dp-meta"><span>${all.length} ${L('bài', 'items')}</span>${nNew ? `<span class="dp-new">${nNew} ${L('mới từ lần xem trước', 'new since your last visit')}</span>` : ''}<span>${L('cập nhật', 'updated')} ${esc(ago(f.updated))}</span></div></div>
        ${id !== '_brands' ? `<button type="button" class="dp-folb${fol ? ' on' : ''}" data-dp="fol" aria-pressed="${fol}">${IC.star}<span>${fol ? L('Đang theo dõi', 'Following') : L('Theo dõi', 'Follow')}</span></button>` : ''}</header>
      <div class="dp-fl">
        <div class="filters"><button type="button" class="chip${!F.kind ? ' on' : ''}" data-dpf="kind" data-v="">${L('Tất cả', 'All')} <small>${all.length}</small></button>${chips(kinds, F.kind, 'kind')}</div>
        ${subs.length ? `<div class="filters"><button type="button" class="chip${!F.sub ? ' on' : ''}" data-dpf="sub" data-v="">${L('Mọi phần', 'All parts')}</button>${chips(subs, F.sub, 'sub')}</div>` : ''}
        ${srcs.length > 1 ? `<div class="filters dp-srcs"><span class="dp-lb">${L('Nguồn', 'Source')}</span><button type="button" class="chip${!F.src ? ' on' : ''}" data-dpf="src" data-v="">${L('Mọi nguồn', 'All sources')}</button>${chips(srcs.map(([s, n]) => [s, s, n]), F.src, 'src')}</div>` : ''}
        <div class="dp-tools"><div class="subsel" role="group" aria-label="${L('Sắp xếp', 'Sort')}"><button type="button" data-dpf="sort" data-v="new" class="${F.sort === 'new' ? 'on' : ''}">${L('Mới nhất', 'Newest')}</button><button type="button" data-dpf="sort" data-v="top" class="${F.sort === 'top' ? 'on' : ''}">${L('Nổi bật', 'Top')}</button></div>
          ${nNew ? `<label class="dp-only"><input type="checkbox" data-dpf="only"${F.only ? ' checked' : ''}><span>${L('Chỉ bài mới', 'New only')}</span></label>` : ''}<span class="grow"></span><span class="dp-hint">${L('Chạm một từ tiếng Anh để tra nghĩa', 'Tap an English word to look it up')}</span></div>
      </div>
      <div class="secpage"><div class="main dp-list">${xs.length ? xs.map(x => itemHtml(x, id, idx)).join('') : `<div class="empty">${L('Không có bài nào khớp bộ lọc.', 'No items match these filters.')}</div>`}</div>
        <aside class="side">
          ${eps.length ? `<div class="note dp-pod"><h3>${L('Nghe podcast chuyên đề', 'Listen to the deep-dive episode')}</h3>${eps.map(e => `<a href="#/listen/${e.date}">${esc(D.showName(e.show))} · ${esc(D.dateL(e.date))}</a>`).join('')}</div>` : ''}
          ${vocab.length ? `<div class="vocab dp-vocab"><h3>${L('Từ vựng của chuyên đề', 'Key terms in this topic')}</h3><dl>${vocab.map(([en, vi, n]) => `<dt><span class="w" data-w="${esc(en)}" lang="en">${esc(en)}</span><small>${n}</small></dt><dd>${esc(vi)}</dd>`).join('')}</dl><button type="button" class="dp-save" data-dp="saveall">${L('Lưu cả bộ vào Sổ từ', 'Save all to my word book')}</button></div>` : ''}
          <div class="note dp-src"><h3>${L('Nguồn của chuyên đề', 'Sources in this topic')}</h3><ul>${srcs.map(([s, n]) => `<li><span>${esc(s)}</span><small>${n}</small></li>`).join('')}</ul></div>
        </aside></div>
    </div>`;
  }

  // ── chữ tiếng Anh: chạm từ ⇒ tra nghĩa (tx.js), nghe đọc bằng giọng của trình duyệt ──
  const ped = id => { const f = S.files[id] || {}, t = (S.idx?.topics || []).find(x => x.id === id);
    return { vocab: (f.vocab || []).map(([en, vi]) => ({ en, vi })), srcName: L('Chuyên đề ', 'Deep dive: ') + (t ? (EN() ? t.en : t.vi) : ''), date: '' }; };
  function sayEn(text) {
    if (!('speechSynthesis' in window)) return D.toast(L('Trình duyệt chưa hỗ trợ đọc', 'Speech is not supported here'));
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.92;
    const vs = speechSynthesis.getVoices(); const v = vs.find(x => /en[-_]US/i.test(x.lang) && /natural|online|google|samantha|aria|jenny/i.test(x.name)) || vs.find(x => /en[-_]US/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function wire(id) {
    const v = document.getElementById('view'); if (!v || v._dpw) return; v._dpw = 1;
    v.addEventListener('click', e => {
      if (!location.hash.startsWith('#/deep/')) return;
      const tid = location.hash.split('/')[2];
      const fb = e.target.closest('[data-dpf]');
      if (fb && fb.type !== 'checkbox') { const F = filt(tid), k = fb.dataset.dpf; F[k] = k === 'sort' ? fb.dataset.v : (F[k] === fb.dataset.v ? '' : fb.dataset.v); paint(tid); return; }
      const b = e.target.closest('[data-dp]');
      if (b) {
        const k = b.dataset.dp;
        if (k === 'fol') { const fl = follows(); const on = !fl.includes(tid); store.set('mmh_deep_follow', on ? [...fl, tid] : fl.filter(x => x !== tid)); D.toast(on ? L('Đã theo dõi — bài mới hiện ở đầu trang Chuyên đề', 'Following — new items show at the top of Deep dives') : L('Đã bỏ theo dõi', 'Unfollowed')); paint(tid); return; }
        if (k === 'say') { const a = b.closest('.dp-it'), x = (S.files[tid]?.items || []).find(y => y.id === a?.dataset.id); if (x) sayEn([x.lang === 'en' ? x.t : x.h_en, x.lang === 'en' ? x.sum : x.s_en].filter(Boolean).join('. ')); return; }
        if (k === 'saveall') {
          const W = store.get('mmh_coach_words', []) || [], have = new Set(W.map(w => String(w.en).toLowerCase())), today = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), src = ped(tid).srcName;
          const add = (S.files[tid]?.vocab || []).filter(([en]) => !have.has(en.toLowerCase())).map(([en, vi]) => ({ en, vi, ex: '', src, at: Date.now(), due: today, step: 0 }));
          store.set('mmh_coach_words', [...add, ...W]); if (window.SHELL) SHELL.sync();
          b.disabled = true; b.textContent = add.length ? L(`Đã lưu ${add.length} từ — ôn ở Luyện nói ▸ Sổ từ`, `Saved ${add.length} words — review in Speak ▸ Word book`) : L('Các từ này đã có trong Sổ từ', 'All of these are already saved'); return;
        }
      }
      if (!window.TX) return;
      const w = e.target.closest('.w');
      if (w && (w.closest('.dp-en') || w.closest('.dp-vocab'))) { e.preventDefault(); TX.lookup(w, ped(tid)); return; }
      const p = e.target.closest('.dp-en');
      if (p && !p.dataset.w && !e.target.closest('a')) {   // lần chạm đầu: bọc từng chữ rồi tra đúng chữ vừa chạm
        TX.wrapWords(p);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.classList.contains('w')) TX.lookup(el, ped(tid));
      }
    });
    v.addEventListener('change', e => { const c = e.target.closest('[data-dpf="only"]'); if (!c) return; const tid = location.hash.split('/')[2]; filt(tid).only = c.checked; paint(tid); });
  }
  async function paint(id) {
    const v = document.getElementById('view'); if (!v) return;
    const y = scrollY;
    try {
      const idx = await loadIdx(), f = await loadTopic(id);
      if (!location.hash.startsWith('#/deep/' + id)) return;
      v.innerHTML = topicHtml(id, idx, f);
      scrollTo({ top: y });
    } catch (e) { v.innerHTML = `<div class="empty">${L('Chưa có dữ liệu chuyên đề — bản đầu tiên có sau lượt cập nhật sáng mai.', 'No deep-dive data yet — the first batch arrives after tomorrow morning\'s run.')}</div>`; }
  }

  // ── khối Chuyên đề trên trang nhất ──
  async function frontStrip() {
    const v = document.getElementById('view'); if (!v || v.querySelector('.dp-strip')) return;
    let idx; try { idx = await loadIdx(); } catch { return; }
    const desk = v.querySelector('.desk'); if (!desk || v.querySelector('.dp-strip')) return;
    const fl = follows(), T = [...(idx.topics || [])].sort((a, b) => (fl.includes(b.id) - fl.includes(a.id)) || (newCount(b) - newCount(a)));
    const el = document.createElement('section'); el.className = 'dp-strip';
    el.innerHTML = `<div class="sec-h"><h2>${L('Chuyên đề', 'Deep dives')}</h2><span class="sub">${L('Đấu thầu · văn bản pháp quy · glôcôm · võng mạc · đục thủy tinh thể · nội nha · phục hồi răng · khâu & ghim da', 'Tenders · regulations · glaucoma · retina · cataract · endodontics · restorative · sutures & staplers')}</span><a href="#/deep">${L('Tất cả chuyên đề →', 'All deep dives →')}</a></div>
      <div class="dp-grid four">${T.slice(0, 4).map(card).join('')}</div>`;
    desk.insertAdjacentElement('afterend', el);
  }

  // trang Nghe: số này đi sâu chuyên đề nào ⇒ dòng dẫn tới trang chuyên đề
  function listenChip() {
    const ed = D.S.cur, host = document.querySelector('.ls-hero'); if (!ed || !ed.deepDive || !host || document.querySelector('.dp-lchip')) return;
    const a = document.createElement('div'); a.className = 'dp-lchip';
    a.innerHTML = `<span>${L('Số này đi sâu chuyên đề', 'This episode goes deep on')}</span>${ed.deepDive.ids.map(id => `<a href="#/deep/${id}">${esc(id === ed.deepDive.ids[0] && ed.deepDive.ids.length === 1 ? (EN() ? ed.deepDive.en : ed.deepDive.vi) : id)}</a>`).join('')}<small>${ed.deepDive.items.length} ${L('bài nguồn', 'source items')}</small>`;
    if (ed.deepDive.ids.length > 1) loadIdx().then(idx => a.querySelectorAll('a').forEach(x => { const t = idx.topics.find(y => '#/deep/' + y.id === x.getAttribute('href')); if (t) x.textContent = EN() ? t.en : t.vi; })).catch(() => {});
    host.insertAdjacentElement('afterend', a);
  }
  window.DEEP = {
    page(a) { return `<div class="dp-wait"><div class="skel" style="height:40px;width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div></div>`; },
    async after(r, a) {
      if (r === '' || r === 'e' || !r) return frontStrip();
      if (r === 'listen') return listenChip();
      if (r !== 'deep') return;
      const v = document.getElementById('view');
      if (!a) { try { const idx = await loadIdx(); if (location.hash.replace(/^#\/?/, '') === 'deep') v.innerHTML = hubHtml(idx); } catch { v.innerHTML = `<div class="empty">${L('Chưa có dữ liệu chuyên đề — bản đầu tiên có sau lượt cập nhật sáng mai.', 'No deep-dive data yet — the first batch arrives after tomorrow morning\'s run.')}</div>`; } return; }
      // nhớ lần xem trước để đánh dấu "Mới" suốt lần xem này, rồi ghi lần xem mới
      if (!(a in S.prev)) { const sm = seen(); S.prev[a] = sm[a] || ''; sm[a] = new Date().toISOString(); store.set('mmh_deep_seen', sm); }
      wire(a); await paint(a);
    },
    loadIdx, newCount,
  };
})();
