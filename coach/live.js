/* MMH Daily Podcast · PHIÊN DỊCH HỘI THOẠI (coach/#/live) — v2.0, 24/11/2026
   Người dùng: "bấm nói không hiển thị ra ngay, bố cục chưa hợp lý; bỏ phần nói chuyện với AI để tóm tắt".
   Cách dùng: 2 nút lớn ở đáy màn hình — "Họ nói · English" và "Tôi nói · Tiếng Việt". Chạm ⇒ micro mở NGAY đúng ngôn ngữ đó
   (không mở tiếng Anh rồi mới đổi), khung "Đang nghe…" hiện liền, chữ hiện dần trong lúc nói kèm bản dịch nháp.
   Nói xong ⇒ 1 thẻ hội thoại: họ nói ⇒ chữ Việt to; tôi nói ⇒ câu tiếng Anh to để đọc lại (có nút Đọc to, Chép).
   Dịch: dịch trên máy của Chrome (nếu đã có gói ngôn ngữ) ⇒ Google Dịch miễn phí. KHÔNG dùng AI tóm tắt.
   Lưu: chỉ trên máy này (localStorage mmh_live_sessions, 12 cuộc gần nhất), tải lời thoại .txt. */
(() => {
  'use strict';
  const C = window.COACH; if (!C) return;
  const { esc, toast, LS, Voice } = C;
  const $ = (s, r = document) => r.querySelector(s);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ANDROID = /Android/i.test(navigator.userAgent);
  const now = () => Date.now();
  const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
  const OPT = Object.assign({ speakEn: false, autoBack: true, big: false }, LS.get('mmh_live_opt', {}));
  const saveOpt = () => LS.set('mmh_live_opt', OPT);
  const LANG = { en: { rec: 'en-US', who: 'Họ nói', name: 'English' }, vi: { rec: 'vi-VN', who: 'Tôi nói', name: 'Tiếng Việt' } };

  /* ── trạng thái ── */
  const L = {
    lang: '',            // '' = không nghe · 'en' · 'vi'
    phase: '',           // '' · 'opening' (đang mở micro) · 'live' (micro đã mở)
    rec: null, gen: 0, interim: '', prev: '', prevAt: 0, prevTr: '', s: null, view: false,
    wake: null, tick: null, speaking: false, holding: false, fails: 0, backT: 0,
  };
  const newSession = () => ({ id: 'm' + now(), title: '', start: now(), end: 0, segs: [] });
  function persist() {
    if (!L.s || !L.s.segs.length) return;
    const all = LS.get('mmh_live_sessions', []).filter(x => x.id !== L.s.id);
    all.unshift({ id: L.s.id, title: L.s.title, start: L.s.start, end: L.s.end, segs: L.s.segs.map(({ id, lang, text, tr, at }) => ({ id, lang, text, tr, at })) });
    LS.set('mmh_live_sessions', all.slice(0, 12));
  }

  /* ── dịch: Chrome Translator API (trên máy, nếu có sẵn gói) ⇒ Google Dịch ── */
  const TRN = {};
  const within = (pr, ms) => Promise.race([pr, new Promise(r => setTimeout(() => r(''), ms))]);
  function prepDevice(sl, tl) {
    const T = window.Translator, k = sl + tl; if (TRN[k]) return;
    if (!T || !T.create || !T.availability) { TRN[k] = 'no'; return; }
    TRN[k] = 'wait';
    (async () => {
      try {
        const av = await within(T.availability({ sourceLanguage: sl, targetLanguage: tl }), 4000);
        if (av !== 'available') { TRN[k] = 'no'; return; }
        TRN[k] = (await within(T.create({ sourceLanguage: sl, targetLanguage: tl }), 6000)) || 'no';
      } catch { TRN[k] = 'no'; }
    })();
  }
  async function onDevice(text, sl, tl) {
    const t = TRN[sl + tl];
    if (!t || typeof t === 'string') { prepDevice(sl, tl); return ''; }
    try { return (await within(t.translate(text), 2500)) || ''; } catch { return ''; }
  }
  async function google(text, sl, tl) {
    const eps = [
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`,
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&q=${encodeURIComponent(text)}`,
    ];
    for (const u of eps) {
      try {
        const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (!r.ok) continue;
        const j = await r.json();
        const out = Array.isArray(j?.[0]) && Array.isArray(j[0][0]) ? j[0].map(p => p[0]).join('') : Array.isArray(j) ? (Array.isArray(j[0]) ? j[0][0] : j[0]) : '';
        if (out) return String(out);
      } catch { /* thử nguồn sau */ }
    }
    return '';
  }
  const translate = (text, from) => { const to = from === 'en' ? 'vi' : 'en'; return onDevice(text, from, to).then(r => r || google(text, from, to)); };

  /* ── lời nói thành thẻ hội thoại: cùng người + nghỉ < 3 giây ⇒ nối vào cùng một thẻ ── */
  function addText(text, lang) {
    text = String(text || '').trim(); if (!text || !L.s) return;
    const last = L.s.segs[L.s.segs.length - 1];
    let seg;
    if (last && last.lang === lang && now() - last.at2 < 3000 && words(last.text) < 80) {
      const a = last.text.toLowerCase(), b = text.toLowerCase();
      if (b.startsWith(a)) last.text = text;                    // Android có lúc trả lại cả câu đã nói
      else if (!a.endsWith(b)) last.text += ' ' + text;
      seg = last; seg.at2 = now();
    } else { seg = { id: 's' + now() + Math.random().toString(36).slice(2, 5), lang, text, tr: '', at: now(), at2: now(), n: 0 }; L.s.segs.push(seg); }
    if (!L.s.title && lang === 'en' && words(seg.text) >= 4) L.s.title = seg.text.split(/\s+/).slice(0, 8).join(' ');
    paintSeg(seg, true);
    const n = ++seg.n;
    translate(seg.text, lang).then(tr => {
      if (n !== seg.n) return;
      if (!tr) { seg.err = true; paintSeg(seg); return; }
      seg.tr = tr; seg.err = false; paintSeg(seg); persist();
      if (lang === 'vi' && OPT.speakEn && L.lang !== 'vi') speak(tr);
    });
    persist();
  }

  /* ── nhận giọng nói: mở đúng ngôn ngữ ngay khi chạm; Android: từng câu một rồi tự mở lại (tránh lặp chữ) ── */
  function listen(lang) {
    if (!SR) { setMsg('Trình duyệt này chưa nhận được giọng nói. Hãy mở bằng Chrome hoặc Edge (Android, Windows, Mac) hoặc Safari (iPhone).', 'err'); return; }
    if (!L.s || L.s.end) L.s = newSession();
    if (L.lang !== lang) flushInterim();
    const g = ++L.gen;
    if (L.rec) { const old = L.rec; L.rec = null; try { old.onend = null; old.onresult = null; old.onerror = null; old.abort(); } catch { /* đã dừng */ } }
    const fresh = L.lang !== lang;
    L.lang = lang; if (fresh) { L.phase = 'opening'; L.interim = ''; L.prev = ''; setMsg(''); }
    paintCtl(); paintLive(fresh);
    wake(); clearInterval(L.tick); L.tick = setInterval(paintTimer, 1000);
    const r = new SR(); L.rec = r;
    r.lang = LANG[lang].rec; r.interimResults = true; r.continuous = !ANDROID; r.maxAlternatives = 1;
    r.onstart = () => { if (g !== L.gen || L.phase === 'live') return; L.phase = 'live'; L.fails = 0; paintCtl(); paintLive(); };
    r.onaudiostart = r.onstart;
    r.onresult = e => {
      if (g !== L.gen) return;
      L.phase = 'live';
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i], t = res[0].transcript;
        if (res.isFinal) { addText(t, lang); inter = ''; L.prevTr = ''; } else inter += t;
      }
      L.interim = inter.trim(); paintLive(); previewTr();
      if (lang === 'vi' && OPT.autoBack && !L.holding) armBack();
    };
    r.onerror = e => {
      if (g !== L.gen) return;
      const er = e.error || '';
      if (/not-allowed|service-not-allowed/.test(er)) { stopAll(); setMsg('Chưa cho dùng micro. Chạm biểu tượng ổ khoá cạnh địa chỉ trang ▸ cho phép Micro, rồi chạm lại nút nói.', 'err'); }
      else if (er === 'audio-capture') { stopAll(); setMsg('Không tìm thấy micro trên máy này.', 'err'); }
      else if (er === 'network') { L.fails++; setMsg('Mạng chập chờn — đang thử nghe lại…', 'warn'); }
      else if (er === 'language-not-supported') { stopAll(); setMsg('Trình duyệt này chưa nghe được ' + LANG[lang].name + '. Thử Chrome.', 'err'); }
    };
    r.onend = () => {
      if (g !== L.gen) return;
      flushInterim();
      L.rec = null;
      if (!L.lang || L.speaking) return;
      // Chrome tự ngắt sau khoảng lặng / mỗi câu (Android) ⇒ mở lại ngay, cùng ngôn ngữ, không làm mới khung "Đang nghe"
      setTimeout(() => { if (g === L.gen && L.lang === lang && !L.rec && !L.speaking) listen(lang); }, L.fails > 3 ? 2000 : 60);
    };
    try { r.start(); } catch { L.rec = null; setTimeout(() => { if (g === L.gen) listen(lang); }, 300); }
  }
  function flushInterim() {
    if (L.interim && L.lang) addText(L.interim, L.lang);
    L.interim = ''; L.prev = ''; L.prevTr = '';
  }
  function stopAll() {
    const r = L.rec; L.gen++; L.rec = null;
    if (r) { try { r.onend = null; r.onresult = null; r.abort(); } catch { /* đã dừng */ } }
    flushInterim();
    L.lang = ''; L.phase = ''; clearTimeout(L.backT);
    clearInterval(L.tick);
    try { L.wake && L.wake.release(); } catch { /* */ } L.wake = null;
    persist();
    paintCtl(); paintLive();
  }
  // tôi nói xong (im khoảng 2 giây) ⇒ tự quay lại nghe tiếng Anh
  function armBack() {
    clearTimeout(L.backT);
    L.backT = setTimeout(() => { if (L.lang === 'vi' && !L.holding && !L.interim) listen('en'); }, 2200);
  }
  // bản dịch nháp trong lúc đang nói (thưa: ≥ 0,8 giây và có thêm ≥ 2 từ)
  function previewTr() {
    const t = L.interim; if (!t || words(t) < 3) return;
    if (now() - L.prevAt < 800 || Math.abs(words(t) - words(L.prev)) < 2) return;
    L.prevAt = now(); L.prev = t; const lang = L.lang;
    google(t, lang, lang === 'en' ? 'vi' : 'en').then(tr => { if (tr && L.interim && L.lang === lang) { L.prevTr = tr; paintLive(); } });
  }

  /* ── đọc to câu tiếng Anh: tạm ngắt micro để máy không tự nghe lại giọng đọc ── */
  async function speak(text) {
    if (!text) return;
    const was = L.lang; L.speaking = true;
    if (L.rec) { const r = L.rec; L.gen++; L.rec = null; try { r.onend = null; r.abort(); } catch { /* */ } }
    paintCtl();
    try { await Voice.sayWait(text); } finally { L.speaking = false; if (was && L.lang === was) listen(was); else paintCtl(); }
  }

  async function wake() { try { if ('wakeLock' in navigator && !L.wake && document.visibilityState === 'visible') { L.wake = await navigator.wakeLock.request('screen'); L.wake.addEventListener('release', () => { L.wake = null; }); } } catch { /* không hỗ trợ */ } }
  document.addEventListener('visibilitychange', () => { if (L.lang && document.visibilityState === 'visible') { wake(); if (!L.rec && !L.speaking) listen(L.lang); } });

  /* ── tải lời thoại ── */
  function txt(s) {
    const out = [`${s.title || 'Cuộc trò chuyện'} — ${new Date(s.start).toLocaleString('vi-VN')}`, ''];
    s.segs.forEach(x => out.push(`[${hhmm(x.at)}] ${x.lang === 'en' ? 'Họ (EN)' : 'Tôi (VI)'}: ${x.text}`, `        => ${x.tr || ''}`, ''));
    return out.join('\n');
  }
  function download(s) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt(s)], { type: 'text/plain;charset=utf-8' }));
    a.download = `Phien-dich-${new Date(s.start).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ── giao diện ── */
  const IC = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>',
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  };
  function segHtml(x) {
    const me = x.lang === 'vi';
    const tr = x.tr ? esc(x.tr) : x.err ? '<i class="lv-wait">Chưa dịch được — kiểm tra mạng</i>' : '<i class="lv-wait">Đang dịch…</i>';
    return `<div class="lv-b ${me ? 'me' : 'they'}" id="${x.id}">
      <div class="lv-who">${me ? 'Tôi · Tiếng Việt ⇒ English' : 'Họ · English ⇒ Tiếng Việt'}<span>${hhmm(x.at)}</span></div>
      <div class="lv-main"${me ? ' lang="en"' : ''}>${tr}</div>
      <div class="lv-orig"${me ? '' : ' lang="en"'}>${esc(x.text)}</div>
      ${me && x.tr ? `<div class="lv-acts"><button type="button" class="lv-a" data-lv="speak" data-id="${x.id}">${IC.spk}<span>Đọc to</span></button><button type="button" class="lv-a" data-lv="copy" data-id="${x.id}">${IC.copy}<span>Chép</span></button></div>` : ''}
    </div>`;
  }
  function emptyHtml() {
    return `<div class="lv-empty"><p><b>Họ nói tiếng Anh?</b> Chạm <span class="lv-k en">Họ nói</span> — chữ tiếng Việt hiện ngay trong lúc họ đang nói.</p>
      <p><b>Bạn muốn nói?</b> Chạm <span class="lv-k vi">Tôi nói</span> rồi nói tiếng Việt — máy hiện câu tiếng Anh thật to để bạn đọc lại (hoặc bấm Đọc to).</p>
      <p class="muted small">Đặt máy gần người nói. Chạm lại nút đang sáng để dừng. Lời thoại chỉ lưu trên máy này.</p></div>`;
  }
  const toolsHtml = () => `<div class="lv-tools"><button type="button" class="btn" data-lv="dl">Tải lời thoại</button><button type="button" class="btn ghost" data-lv="new">Cuộc trò chuyện mới</button></div>`;
  function render() {
    L.view = true;
    const s = L.s, hist = LS.get('mmh_live_sessions', []).filter(x => !s || x.id !== s.id);
    $('#view').innerHTML = `<div class="lv${OPT.big ? ' big' : ''}">
      <div class="lv-head"><div><h1>Phiên dịch hội thoại</h1><p class="sub">Anh ⇄ Việt ngay trong lúc nói — cho cuộc họp, gặp khách.</p></div>
        <div class="lv-st" id="lv-st"></div></div>
      <p class="lv-msg" id="lv-msg" hidden></p>
      <div class="lv-conv" id="lv-conv">${s && s.segs.length ? s.segs.map(segHtml).join('') : emptyHtml()}<div class="lv-live" id="lv-live" hidden></div></div>
      ${s && s.segs.length ? toolsHtml() : ''}
      <details class="lv-opt"><summary>Tuỳ chọn</summary>
        <label><input type="checkbox" id="lv-back"${OPT.autoBack ? ' checked' : ''}> Tôi nói xong ⇒ tự quay lại nghe tiếng Anh</label>
        <label><input type="checkbox" id="lv-speak"${OPT.speakEn ? ' checked' : ''}> Tự đọc to câu tiếng Anh sau khi tôi nói</label>
        <label><input type="checkbox" id="lv-big"${OPT.big ? ' checked' : ''}> Chữ to</label>
        <p class="small muted">Máy tính: giữ phím cách để nói tiếng Việt, thả ra để nghe tiếng Anh. Nhận giọng do trình duyệt (Google / Apple) xử lý; dịch bằng Chrome trên máy hoặc Google Dịch.</p>
      </details>
      ${hist.length ? `<h2>Đã lưu trên máy này</h2><ul class="lv-hist">${hist.map(x => `<li><button type="button" class="lv-ho" data-lv="open" data-id="${x.id}"><b>${esc(x.title || 'Cuộc trò chuyện')}</b><span>${new Date(x.start).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${x.segs.length} lượt</span></button><button type="button" class="btn ghost small" data-lv="del" data-id="${x.id}" aria-label="Xoá">Xoá</button></li>`).join('')}</ul>` : ''}
      <div class="lv-dock" id="lv-dock" role="group" aria-label="Ai đang nói">
        <button type="button" class="lv-mic en" data-lv="go" data-k="en"></button>
        <button type="button" class="lv-mic vi" data-lv="go" data-k="vi"></button>
      </div></div>`;
    paintCtl(); paintLive(); paintTimer();
  }
  const inView = () => L.view && !!$('#lv-conv');
  function paintCtl() {
    if (!inView()) return;
    document.querySelectorAll('.lv-mic').forEach(b => {
      const k = b.dataset.k, on = L.lang === k, opening = on && L.phase === 'opening';
      b.classList.toggle('on', on); b.classList.toggle('opening', opening);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.title = on ? 'Chạm để dừng nghe' : (k === 'en' ? 'Nghe họ nói tiếng Anh' : 'Nghe bạn nói tiếng Việt');
      b.innerHTML = `<span class="lv-ic">${on ? IC.stop : IC.mic}</span><span class="lv-tx"><b>${LANG[k].who}</b><small>${on ? (opening ? 'Mở micro…' : L.speaking ? 'Đang đọc…' : 'Đang nghe…') : LANG[k].name}</small></span>`;
    });
    const st = $('#lv-st');
    if (st) st.innerHTML = L.lang ? `<i class="lv-dot on"></i>${L.lang === 'en' ? 'Đang nghe tiếng Anh' : 'Đang nghe tiếng Việt'}<span id="lv-time"></span>` : `<i class="lv-dot"></i>Chưa nghe`;
    paintTimer();
  }
  function paintLive(open) {
    const el = $('#lv-live'); if (!el) return;
    if (!L.lang) { el.hidden = true; el.innerHTML = ''; return; }
    if (open) L.prevTr = '';
    $('.lv-empty')?.remove();
    const wasHidden = el.hidden;
    el.hidden = false;
    el.className = 'lv-live ' + (L.lang === 'vi' ? 'me' : 'they');
    const label = L.phase === 'opening' ? 'Đang mở micro…' : (L.lang === 'en' ? 'Đang nghe họ nói tiếng Anh' : 'Đang nghe bạn nói tiếng Việt');
    el.innerHTML = `<div class="lv-who"><span class="lv-wave${L.phase === 'live' ? ' on' : ''}"><i></i><i></i><i></i><i></i></span>${label}</div>
      <div class="lv-now"${L.lang === 'en' ? ' lang="en"' : ''}>${L.interim ? esc(L.interim) : `<span class="lv-ph">${L.lang === 'en' ? 'Mời họ nói — chữ hiện ở đây…' : 'Hãy nói tiếng Việt — chữ hiện ở đây…'}</span>`}</div>
      ${L.interim && L.prevTr ? `<div class="lv-pre">${esc(L.prevTr)}</div>` : ''}`;
    if (wasHidden || open) scrollEnd(); else scrollEnd(false, true);
  }
  function paintTimer() { const t = $('#lv-time'); if (t && L.s && L.lang) t.textContent = ' · ' + mmss(now() - L.s.start); }
  // giữ khung đang nghe luôn nằm trên 2 nút nói
  function scrollEnd(_, soft) {
    const box = $('#lv-live'); if (!box || box.hidden) return;
    const r = box.getBoundingClientRect(), dock = $('#lv-dock')?.getBoundingClientRect();
    const bottom = (dock && dock.top > 0 ? dock.top : innerHeight) - 12;
    if (r.bottom > bottom) window.scrollBy({ top: r.bottom - bottom, behavior: soft ? 'auto' : 'smooth' });
  }
  function paintSeg(seg, scroll) {
    if (!inView()) return;
    $('.lv-empty')?.remove();
    const old = document.getElementById(seg.id), live = $('#lv-live');
    if (old) old.outerHTML = segHtml(seg); else live.insertAdjacentHTML('beforebegin', segHtml(seg));
    if (!$('.lv-tools')) $('#lv-conv').insertAdjacentHTML('afterend', toolsHtml());
    if (scroll) scrollEnd();
  }
  function setMsg(msg, kind) { const el = $('#lv-msg'); if (!el) { if (msg) toast(msg, 4500); return; } el.hidden = !msg; el.textContent = msg; el.className = 'lv-msg ' + (kind || ''); }

  /* ── sự kiện ── */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-lv]'); if (!t || !inView()) return;
    const k = t.dataset.lv, id = t.dataset.id;
    if (k === 'go') { const lg = t.dataset.k; if (L.lang === lg) stopAll(); else listen(lg); return; }
    if (k === 'dl') { if (L.s) download(L.s); return; }
    if (k === 'new') { stopAll(); L.s = null; render(); return; }
    if (k === 'speak') { const s = L.s?.segs.find(x => x.id === id); if (s?.tr) speak(s.tr); return; }
    if (k === 'copy') { const s = L.s?.segs.find(x => x.id === id); try { await navigator.clipboard.writeText(s?.tr || ''); toast('Đã chép câu tiếng Anh'); } catch { toast('Không chép được'); } return; }
    if (k === 'open') { stopAll(); const x = LS.get('mmh_live_sessions', []).find(z => z.id === id); L.s = x ? { ...x, segs: (x.segs || []).map(z => ({ ...z, at2: 0, n: 0 })) } : null; render(); window.scrollTo({ top: 0 }); return; }
    if (k === 'del') { if (t.dataset.sure) { LS.set('mmh_live_sessions', LS.get('mmh_live_sessions', []).filter(x => x.id !== id)); render(); } else { t.dataset.sure = 1; t.textContent = 'Xoá?'; } }
  });
  document.addEventListener('change', e => {
    if (!inView()) return;
    const id = e.target.id;
    if (id === 'lv-speak') { OPT.speakEn = e.target.checked; saveOpt(); }
    if (id === 'lv-back') { OPT.autoBack = e.target.checked; saveOpt(); }
    if (id === 'lv-big') { OPT.big = e.target.checked; saveOpt(); $('.lv')?.classList.toggle('big', OPT.big); }
  });
  // máy tính: giữ phím cách = nói tiếng Việt, thả ra = nghe tiếng Anh lại
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || !inView() || e.repeat || e.target.closest('input,textarea,select,button,a')) return;
    e.preventDefault(); L.holding = true; if (L.lang !== 'vi') listen('vi');
  });
  document.addEventListener('keyup', e => {
    if (e.code !== 'Space' || !L.holding) return;
    L.holding = false; setTimeout(() => { if (!L.holding && L.lang === 'vi') listen('en'); }, 600);
  });
  window.addEventListener('beforeunload', () => { if (L.s) persist(); });

  window.LIVE = { render, leave: () => { if (L.view) stopAll(); L.view = false; }, state: L, opt: OPT, _test: { addText, txt, listen, stopAll } };
  if (/^#\/live/.test(location.hash)) render();   // coach.js chạy route() trước khi file này tải xong
})();
