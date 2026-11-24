/* MMH Daily Podcast · PHIÊN DỊCH HỘI THOẠI (coach/#/live, v1.0 — 24/11/2026, người dùng yêu cầu)
   Máy luôn mở trong cuộc họp: nghe tiếng Anh ⇒ dịch tiếng Việt ngay; bấm (hoặc giữ) "Tôi nói" ⇒ nghe tiếng Việt ⇒ hiện câu tiếng Anh to để đọc theo (có thể đọc to).
   Đoạn tiếng Anh dài ⇒ tự TÓM TẮT Ý CHÍNH bằng tiếng Việt + 1 câu nhắc lại bằng tiếng Anh + gợi ý trả lời. Hết họp ⇒ tóm tắt cả cuộc họp (ý chính, quyết định, việc cần làm), tải về.
   Nghe:   (1) Trình duyệt — Web Speech API (Chrome / Edge / Safari), nhanh, đổi ngôn ngữ bằng nút "Tôi nói";
           (2) Gemini — ghi âm từng đoạn ngắn (tự cắt theo khoảng lặng) gửi Gemini, TỰ NHẬN tiếng Anh / tiếng Việt, chậm hơn vài giây.
   Dịch:   dịch trên máy của Chrome (Translator API, riêng tư) ⇒ Google Dịch miễn phí ⇒ Gemini (key người dùng) làm mượt cả đoạn theo ngữ cảnh MMH.
   Lưu:    chỉ trên máy này (localStorage mmh_live_sessions, 12 cuộc gần nhất). Không gửi về máy chủ MMH. */
(() => {
  'use strict';
  const C = window.COACH; if (!C) return;
  const { esc, toast, LS, CFG, Voice } = C;
  const $ = (s, r = document) => r.querySelector(s);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const now = () => Date.now();
  const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
  const OPT = Object.assign({ engine: 'browser', autoSum: true, sumWords: 140, speakEn: false, big: false, autoBack: true }, LS.get('mmh_live_opt', {}));
  const saveOpt = () => LS.set('mmh_live_opt', OPT);

  /* ── phiên ── */
  const L = {
    on: false, lang: 'en', s: null, interim: '', rec: null, recLang: '', restarts: 0, lastErr: '', wake: null, tick: null,
    sumBusy: false, sumAt: 0, sumFrom: 0, holding: false, view: false,
  };
  const newSession = () => ({ id: 'm' + now(), title: '', start: now(), end: 0, segs: [], sums: [], final: null });
  function persist() {
    if (!L.s || !L.s.segs.length) return;
    const all = LS.get('mmh_live_sessions', []).filter(x => x.id !== L.s.id);
    all.unshift(L.s); LS.set('mmh_live_sessions', all.slice(0, 12));
  }

  /* ── dịch: máy (Chrome Translator API) ⇒ Google Dịch ⇒ Gemini ── */
  const TRN = {};
  const within = (pr, ms) => Promise.race([pr, new Promise(r => setTimeout(() => r(''), ms))]);
  // Chỉ dùng khi gói ngôn ngữ ĐÃ có trên máy (không tự tải — tải cần bấm); giới hạn 3 giây, lỗi ⇒ Google Dịch.
  async function onDevice(text, sl, tl) {
    const T = window.Translator; if (!T || !T.create || !T.availability) return '';
    const k = sl + tl;
    try {
      if (TRN[k] === 'no') return '';
      if (!TRN[k]) {
        const av = await within(T.availability({ sourceLanguage: sl, targetLanguage: tl }), 1500);
        if (av !== 'available') { TRN[k] = 'no'; return ''; }
        TRN[k] = await within(T.create({ sourceLanguage: sl, targetLanguage: tl }), 3000);
        if (!TRN[k]) { TRN[k] = 'no'; return ''; }
      }
      return (await within(TRN[k].translate(text), 3000)) || '';
    } catch { TRN[k] = 'no'; return ''; }
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
  const MMH_CTX = `MMH = MANI Medical Hanoi, distributor in Vietnam of MANI (Japan) ophthalmic knives, ophthalmic sutures, micro forceps, trabeculotomy hook, Manipler skin stapler, dental endodontic files (JIZAI), DIA-BURS diamond burs and MMG composites. Common words: distributor = nhà phân phối (NPP), tender = gói thầu / đấu thầu, forecast = dự báo, KOL = báo cáo viên, registration = đăng ký lưu hành, MA = MANI Asia / ban điều hành.`;
  async function quickTr(text, from) {
    const to = from === 'en' ? 'vi' : 'en';
    return (await onDevice(text, from, to)) || (await google(text, from, to)) || '';
  }
  // Gemini làm mượt bản dịch cả lượt nói (có ngữ cảnh 6 lượt trước). Lỗi / hết lượt ⇒ giữ bản dịch nhanh.
  async function polish(seg) {
    if (!CFG.gkey) return;
    const ctx = L.s.segs.filter(x => x !== seg).slice(-6).map(x => `${x.lang.toUpperCase()}: ${x.text}`).join('\n');
    const to = seg.lang === 'en' ? 'Vietnamese' : 'English';
    try {
      const r = await C.gem(`You are a live meeting interpreter for a Vietnamese professional at MMH. ${MMH_CTX}
Translate the LAST utterance into natural ${to} that a person would actually say in a business meeting (not word-for-word). Fix obvious speech-recognition mistakes using the context.
${seg.lang === 'vi' ? 'The user will READ your English aloud: keep it short, clear, polite, CEFR B1-B2 words, contractions allowed.' : 'Keep names, product names and numbers.'}
Return JSON {"tr":"…","fix":"the utterance with recognition errors fixed (same language)"}.`, `Context:\n${ctx || '(none)'}\n\nLAST (${seg.lang.toUpperCase()}): ${seg.text}`, { ms: 20000 });
      if (r && r.tr) { seg.tr = r.tr; seg.by = 'gemini'; if (r.fix && words(r.fix) >= words(seg.text) * 0.6) seg.text = r.fix; paintSeg(seg); persist(); }
    } catch { /* giữ bản dịch nhanh */ }
  }

  /* ── ghi nhận lời nói thành đoạn: cùng ngôn ngữ + nghỉ < 2,5 giây ⇒ cùng một lượt ── */
  async function addText(text, lang) {
    text = String(text || '').trim(); if (!text) return;
    const last = L.s.segs[L.s.segs.length - 1];
    let seg;
    if (last && last.lang === lang && !last.closed && now() - last.at2 < 2500 && words(last.text) < 70) { seg = last; seg.text += (/[.?!]$/.test(seg.text) ? ' ' : '. ') + text; seg.at2 = now(); }
    else { if (last && !last.closed) closeSeg(last); seg = { id: 's' + now(), lang, text, tr: '', by: '', at: now(), at2: now() }; L.s.segs.push(seg); }
    paintSeg(seg, true);
    const tr = await quickTr(seg.text, lang);
    if (tr) { seg.tr = tr; seg.by = seg.by || 'fast'; paintSeg(seg); }
    clearTimeout(seg._t); seg._t = setTimeout(() => closeSeg(seg), 2600);
    persist();
  }
  function closeSeg(seg) {
    if (seg.closed) return; seg.closed = true; clearTimeout(seg._t);
    polish(seg).then(() => { if (seg.lang === 'vi' && OPT.speakEn && seg.tr) speak(seg.tr); });
    maybeSummary();
    if (seg.lang === 'vi' && OPT.autoBack && !L.holding && OPT.engine === 'browser' && L.lang === 'vi') setLang('en');
  }

  /* ── nghe 1: Web Speech API (tự khởi động lại, đổi ngôn ngữ khi bấm "Tôi nói") ── */
  function recStart() {
    if (!SR) { setStatus('Trình duyệt này chưa nhận giọng nói. Dùng Chrome / Edge, hoặc chọn "Gemini nghe" trong Cài đặt.', 'err'); return; }
    const r = new SR(); L.rec = r; L.recLang = L.lang;
    r.lang = L.lang === 'en' ? 'en-US' : 'vi-VN'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = e => {
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) addText(res[0].transcript, L.recLang); else inter += res[0].transcript;
      }
      L.interim = inter; paintLive(); L.restarts = 0;
    };
    r.onerror = e => { L.lastErr = e.error || ''; if (/not-allowed|service-not-allowed/.test(L.lastErr)) { stop(); setStatus('Chưa cho dùng micro. Bấm biểu tượng ổ khoá trên thanh địa chỉ ▸ cho phép Micro, rồi bấm Bắt đầu.', 'err'); } };
    r.onend = () => {
      if (L.interim) { addText(L.interim, L.recLang); L.interim = ''; paintLive(); }
      L.rec = null;
      if (!L.on || OPT.engine !== 'browser') return;
      L.restarts++;
      setTimeout(() => { if (L.on && !L.rec && OPT.engine === 'browser' && !L.speaking) recStart(); }, L.restarts > 5 ? 1500 : 150);   // Chrome tự ngắt sau khoảng lặng ⇒ mở lại
    };
    try { r.start(); } catch { L.rec = null; }
  }
  function recStop() { const r = L.rec; if (r) { try { r.stop(); } catch { /* đã dừng */ } } }
  function setLang(lang) {
    if (L.lang === lang) return;
    L.lang = lang; paintLang();
    if (L.on && OPT.engine === 'browser') { if (L.rec) recStop(); else recStart(); }   // onend sẽ mở lại với ngôn ngữ mới
  }

  /* ── nghe 2: Gemini — ghi âm, tự cắt đoạn theo khoảng lặng, Gemini tự nhận Anh / Việt ── */
  const GA = { ctx: null, src: null, node: null, stream: null, buf: [], speech: 0, silence: 0, floor: 0.004, q: [], busy: false, rate: 16000 };
  async function gaStart() {
    if (!CFG.gkey) { setStatus('Chế độ "Gemini nghe" cần Gemini API key (Cài đặt ▸ Gemini). Đang dùng nghe bằng trình duyệt.', 'err'); OPT.engine = 'browser'; saveOpt(); paintOpt(); recStart(); return; }
    try {
      GA.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch { stop(); setStatus('Chưa cho dùng micro. Cho phép Micro rồi bấm Bắt đầu.', 'err'); return; }
    GA.ctx = new (window.AudioContext || window.webkitAudioContext)();
    GA.src = GA.ctx.createMediaStreamSource(GA.stream);
    GA.node = GA.ctx.createScriptProcessor(4096, 1, 1);
    const inRate = GA.ctx.sampleRate, ratio = inRate / GA.rate;
    GA.node.onaudioprocess = e => {
      if (!L.on) return;
      const x = e.inputBuffer.getChannelData(0);
      let sum = 0; for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
      const rms = Math.sqrt(sum / x.length), dt = x.length / inRate;
      const talk = rms > Math.max(0.012, GA.floor * 3);
      if (!talk) GA.floor = GA.floor * 0.95 + rms * 0.05;
      const ds = new Float32Array(Math.floor(x.length / ratio));
      for (let i = 0; i < ds.length; i++) ds[i] = x[Math.floor(i * ratio)];
      if (talk || GA.speech > 0) GA.buf.push(ds);
      if (talk) { GA.speech += dt; GA.silence = 0; } else if (GA.speech > 0) GA.silence += dt;
      L.level = Math.min(1, rms * 12); paintMeter();
      const len = GA.buf.reduce((n, b) => n + b.length, 0) / GA.rate;
      if ((GA.speech >= 1.2 && GA.silence >= 0.8 && len >= 4) || len >= 18) gaCut();
      else if (GA.speech < 0.4 && GA.silence > 1.5) { GA.buf = []; GA.speech = 0; GA.silence = 0; }
    };
    GA.src.connect(GA.node); GA.node.connect(GA.ctx.destination);
  }
  function gaCut() {
    const parts = GA.buf; GA.buf = []; GA.speech = 0; GA.silence = 0;
    const n = parts.reduce((a, b) => a + b.length, 0); if (n < GA.rate * 0.8) return;
    const pcm = new Float32Array(n); let o = 0; for (const p of parts) { pcm.set(p, o); o += p.length; }
    GA.q.push(wav(pcm, GA.rate)); L.interim = '…'; paintLive(); gaPump();
  }
  function wav(pcm, rate) {
    const b = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(b);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) { const s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    let bin = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function gaPump() {
    if (GA.busy || !GA.q.length) return; GA.busy = true;
    const b64 = GA.q.shift();
    const ctx = L.s.segs.slice(-4).map(x => `${x.lang.toUpperCase()}: ${x.text}`).join('\n');
    try {
      const r = await C.gemPost('generateContent', {
        systemInstruction: { parts: [{ text: `You are a live meeting interpreter. ${MMH_CTX}\nThe audio is a short clip from a meeting in English and/or Vietnamese. Transcribe exactly what is said (skip silence, noise, filler like "uh"). For each utterance give the language and a natural translation into the other language (English ⇄ Vietnamese). Return JSON {"segs":[{"lang":"en"|"vi","text":"…","tr":"…"}]} — empty segs if there is no speech.` }] },
        contents: [{ role: 'user', parts: [{ text: 'Previous context:\n' + (ctx || '(none)') }, { inlineData: { mimeType: 'audio/wav', data: b64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }, { ms: 30000 });
      const d = await r.json();
      const t = (d.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
      const j = JSON.parse(t.replace(/^```(?:json)?\s*|\s*```$/g, '') || '{}');
      for (const s of j.segs || []) {
        if (!s.text) continue;
        const lang = s.lang === 'vi' ? 'vi' : 'en';
        const last = L.s.segs[L.s.segs.length - 1];
        if (last && !last.closed && last.lang !== lang) closeSeg(last);
        const seg = { id: 's' + now() + Math.random().toString(36).slice(2, 5), lang, text: s.text.trim(), tr: (s.tr || '').trim(), by: 'gemini', at: now(), at2: now(), closed: true };
        L.s.segs.push(seg); paintSeg(seg, true);
        if (lang === 'vi' && OPT.speakEn && seg.tr) speak(seg.tr);
      }
      maybeSummary(); persist();
    } catch (e) { setStatus('Gemini: ' + (e.message || e) + ' — vẫn tiếp tục nghe.', 'warn'); }
    L.interim = ''; paintLive();
    GA.busy = false; if (GA.q.length) gaPump();
  }
  function gaStop() {
    try { GA.node && GA.node.disconnect(); GA.src && GA.src.disconnect(); } catch { /* */ }
    try { GA.stream && GA.stream.getTracks().forEach(t => t.stop()); } catch { /* */ }
    try { GA.ctx && GA.ctx.close(); } catch { /* */ }
    if (GA.buf.length) gaCut();
    Object.assign(GA, { ctx: null, src: null, node: null, stream: null, buf: [], speech: 0, silence: 0 });
  }

  /* ── đọc to câu tiếng Anh (tạm ngừng nghe để micro không bắt lại giọng máy) ── */
  async function speak(text) {
    L.speaking = true; if (OPT.engine === 'browser') recStop();
    try { await Voice.sayWait(text); } finally { L.speaking = false; if (L.on && OPT.engine === 'browser' && !L.rec) recStart(); }
  }

  /* ── tóm tắt ý chính (Gemini) ── */
  const SUM_SYS = `You help a Vietnamese professional (English CEFR B1) follow an English business meeting at MMH. ${MMH_CTX}
From the transcript part given, return JSON:
{"vi":["3–6 ý chính bằng tiếng Việt, ngắn, giữ số liệu, tên người, tên sản phẩm"],
 "recap":"ONE short English sentence the user can say to confirm understanding, starting like 'So, if I understand correctly, …' (vary the opener)",
 "recap_vi":"nghĩa tiếng Việt của câu đó",
 "reply":[{"en":"a natural short reply or question the user could say next","vi":"nghĩa tiếng Việt"},{"en":"…","vi":"…"}],
 "terms":[{"en":"useful English term from the talk","vi":"tiếng Việt"}]}
Use only what was said. If something is unclear, say so in Vietnamese ("chưa rõ …").`;
  function maybeSummary(force) {      // force: true = bấm tay · 'timer' = mỗi 4 phút (đủ ~40 từ tiếng Anh là tóm tắt)
    if (!L.s || L.sumBusy) return;
    const segs = L.s.segs.slice(L.sumFrom);
    const enW = segs.filter(x => x.lang === 'en').reduce((n, x) => n + words(x.text), 0);
    if (force === 'timer') { if (!OPT.autoSum || enW < 40 || !CFG.gkey) return; }
    else if (!force && (!OPT.autoSum || enW < OPT.sumWords || now() - L.sumAt < 60000)) return;
    if (!segs.length) { if (force) toast('Chưa có nội dung mới để tóm tắt.'); return; }
    if (!CFG.gkey) { if (force || !L.noKeyTold) { L.noKeyTold = true; toast('Tóm tắt ý chính cần Gemini API key (Cài đặt ▸ Gemini, miễn phí).', 4500); } return; }
    summarize(segs, L.s.segs.length);
  }
  async function summarize(segs, upto) {
    L.sumBusy = true; paintSumBusy(true);
    const text = segs.map(x => `${x.lang === 'en' ? 'THEY (EN)' : 'ME (VI)'}: ${x.text}`).join('\n');
    try {
      const r = await C.gem(SUM_SYS, text, { ms: 30000 });
      const sm = { id: 'k' + now(), at: now(), from: segs[0].at, to: segs[segs.length - 1].at2 || segs[segs.length - 1].at, words: segs.reduce((n, x) => n + words(x.text), 0), ...r };
      L.s.sums.push(sm); L.sumAt = now(); L.sumFrom = upto; persist(); paintSums(true);
    } catch (e) { toast('Chưa tóm tắt được: ' + e.message, 4000); }
    L.sumBusy = false; paintSumBusy(false);
  }
  const FINAL_SYS = `You write the minutes of a bilingual (English / Vietnamese) meeting at MMH. ${MMH_CTX}
Return JSON {"title":"short meeting title in Vietnamese",
 "vi":{"points":["ý chính"],"decisions":["quyết định / thống nhất"],"actions":[{"who":"","what":"","when":""}],"open":["điểm còn bỏ ngỏ / cần hỏi lại"]},
 "en":{"points":[],"decisions":[],"actions":[{"who":"","what":"","when":""}],"open":[]}}
Use only what was said; leave arrays empty when nothing fits; who/when empty if not said.`;
  async function finalSummary() {
    if (!L.s || !L.s.segs.length) { toast('Chưa có nội dung.'); return; }
    if (!CFG.gkey) { toast('Tóm tắt cuộc họp cần Gemini API key (Cài đặt ▸ Gemini).', 4500); return; }
    const b = $('#lv-final'); if (b) { b.disabled = true; b.innerHTML = '<span class="spin"></span> Đang tóm tắt cả cuộc họp…'; }
    try {
      const text = L.s.segs.map(x => `[${hhmm(x.at)}] ${x.lang === 'en' ? 'EN' : 'VI (me)'}: ${x.text}`).join('\n');
      L.s.final = await C.gem(FINAL_SYS, text.slice(-60000), { ms: 60000 });
      if (L.s.final?.title && !L.s.title) L.s.title = L.s.final.title;
      persist(); render();
    } catch (e) { toast('Chưa tóm tắt được: ' + e.message, 4000); if (b) { b.disabled = false; b.textContent = 'Tóm tắt cả cuộc họp'; } }
  }

  /* ── bắt đầu / dừng; giữ màn hình sáng ── */
  async function wake() { try { if ('wakeLock' in navigator && !L.wake && document.visibilityState === 'visible') { L.wake = await navigator.wakeLock.request('screen'); L.wake.addEventListener('release', () => { L.wake = null; }); } } catch { /* không hỗ trợ */ } }
  document.addEventListener('visibilitychange', () => { if (L.on && document.visibilityState === 'visible') { wake(); if (OPT.engine === 'browser' && !L.rec && !L.speaking) recStart(); } });
  async function start() {
    if (!L.s || L.s.end) { L.s = newSession(); L.sumFrom = 0; L.sumAt = now(); }
    L.on = true; L.restarts = 0; setStatus('');
    await wake();
    if (OPT.engine === 'gemini') await gaStart(); else recStart();
    clearInterval(L.tick); L.tick = setInterval(() => { paintTimer(); if (now() - L.sumAt > 240000) maybeSummary('timer'); }, 1000);
    paintCtl();
  }
  function stop() {
    L.on = false; recStop(); gaStop();
    const last = L.s?.segs[L.s.segs.length - 1]; if (last && !last.closed) closeSeg(last);
    clearInterval(L.tick);
    try { L.wake && L.wake.release(); } catch { /* */ } L.wake = null;
    if (L.s) { L.s.end = now(); persist(); }
    L.interim = ''; paintCtl(); paintLive();
  }

  /* ── xuất biên bản ── */
  function md(s) {
    const f = s.final, out = [`# ${s.title || 'Cuộc họp'} — ${new Date(s.start).toLocaleString('vi-VN')}`, ''];
    if (f) for (const [lg, h] of [['vi', 'Tóm tắt'], ['en', 'Summary']]) {
      const x = f[lg] || {}; out.push(`## ${h}`);
      const sec = (t, a) => { if (a && a.length) { out.push(`### ${t}`); a.forEach(i => out.push('- ' + (typeof i === 'string' ? i : [i.who, i.what, i.when].filter(Boolean).join(' · ')))); } };
      sec(lg === 'vi' ? 'Ý chính' : 'Key points', x.points); sec(lg === 'vi' ? 'Quyết định' : 'Decisions', x.decisions); sec(lg === 'vi' ? 'Việc cần làm' : 'Action items', x.actions); sec(lg === 'vi' ? 'Còn bỏ ngỏ' : 'Open questions', x.open);
      out.push('');
    }
    if (s.sums.length) { out.push('## Ý chính từng đoạn'); s.sums.forEach(k => { out.push(`### ${hhmm(k.from)}–${hhmm(k.to)}`); (k.vi || []).forEach(v => out.push('- ' + v)); if (k.recap) out.push(`> ${k.recap}`); }); out.push(''); }
    out.push('## Lời thoại');
    s.segs.forEach(x => out.push(`**${hhmm(x.at)} · ${x.lang === 'en' ? 'EN' : 'VI'}**: ${x.text}  \n_${x.tr || ''}_`));
    return out.join('\n');
  }
  function download(s) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md(s)], { type: 'text/markdown' }));
    a.download = `Bien-ban-${new Date(s.start).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ── giao diện ── */
  const IC = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  };
  function segHtml(x) {
    const me = x.lang === 'vi';
    return `<div class="lv-seg ${me ? 'me' : 'they'}" id="${x.id}"><div class="lv-meta">${hhmm(x.at)} · ${me ? 'Tôi nói · VI' : 'Họ nói · EN'}${x.by === 'gemini' ? ' · <i>Gemini</i>' : ''}</div>
      ${me ? `<div class="lv-say">${esc(x.tr || '…')}</div><div class="lv-src">${esc(x.text)}</div>
        <div class="lv-acts"><button class="btn ghost" data-lv="speak" data-id="${x.id}">${IC.spk} Đọc to</button><button class="btn ghost" data-lv="copy" data-id="${x.id}">${IC.copy} Chép</button></div>`
        : `<div class="lv-tr">${esc(x.tr || '…')}</div><div class="lv-src en">${esc(x.text)}</div>`}</div>`;
  }
  function sumHtml(k, open) {
    return `<details class="lv-sum"${open ? ' open' : ''}><summary><b>Ý chính ${hhmm(k.from)}–${hhmm(k.to)}</b> <span class="muted small">${k.words} từ</span></summary>
      <ul>${(k.vi || []).map(v => `<li>${esc(v)}</li>`).join('')}</ul>
      ${k.recap ? `<div class="lv-recap"><span class="small muted">Nhắc lại để xác nhận đã hiểu</span><b>${esc(k.recap)}</b><span>${esc(k.recap_vi || '')}</span><button class="btn ghost" data-lv="say" data-t="${esc(k.recap)}">${IC.spk} Nghe</button></div>` : ''}
      ${(k.reply || []).length ? `<div class="lv-reply"><span class="small muted">Gợi ý trả lời</span>${k.reply.map(r => `<p><b>${esc(r.en)}</b><span>${esc(r.vi)}</span></p>`).join('')}</div>` : ''}
      ${(k.terms || []).length ? `<div class="lv-terms">${k.terms.map(t => `<span><b>${esc(t.en)}</b> ${esc(t.vi)}</span>`).join('')}</div>` : ''}</details>`;
  }
  function finalHtml(f) {
    const x = f.vi || {}, y = f.en || {};
    const li = i => typeof i === 'string' ? esc(i) : [i.who ? `<b>${esc(i.who)}</b>` : '', esc(i.what || ''), i.when ? `(${esc(i.when)})` : ''].filter(Boolean).join(' ');
    const ul = a => (a && a.length) ? `<ul>${a.map(i => `<li>${li(i)}</li>`).join('')}</ul>` : '<p class="muted small">—</p>';
    return `<div class="card lv-final"><h3>${esc(f.title || 'Tóm tắt cuộc họp')}</h3>
      <div class="lv-fg"><div><h4>Ý chính</h4>${ul(x.points)}<h4>Quyết định</h4>${ul(x.decisions)}<h4>Việc cần làm</h4>${ul(x.actions)}<h4>Còn bỏ ngỏ</h4>${ul(x.open)}</div>
      <div lang="en"><h4>Key points</h4>${ul(y.points)}<h4>Decisions</h4>${ul(y.decisions)}<h4>Action items</h4>${ul(y.actions)}<h4>Open questions</h4>${ul(y.open)}</div></div></div>`;
  }
  function render() {
    L.view = true;
    const s = L.s, hist = LS.get('mmh_live_sessions', []).filter(x => !s || x.id !== s.id);
    $('#view').innerHTML = `<div class="lv${OPT.big ? ' big' : ''}">
      <div class="lv-top"><div><h1>Phiên dịch hội thoại</h1><p class="sub">Họ nói tiếng Anh ⇒ bạn đọc tiếng Việt. Bạn nói tiếng Việt ⇒ máy hiện câu tiếng Anh để nói lại. Để máy mở suốt cuộc họp.</p></div>
        <div class="lv-st"><span id="lv-dot" class="lv-dot"></span><span id="lv-stt">Chưa nghe</span><span id="lv-time" class="muted"></span></div></div>
      <div class="lv-bar card">
        <button class="lv-go" id="lv-go" data-lv="go"></button>
        <div class="lv-lang" id="lv-lang" role="group" aria-label="Ai đang nói"></div>
        <button class="lv-hold" id="lv-hold" type="button" title="Giữ để nói tiếng Việt, thả ra để nghe tiếng Anh lại (phím cách)">${IC.mic}<span>Giữ để nói tiếng Việt</span></button>
        <a class="lv-jump" href="#lv-sums" data-lv="jump">Ý chính${s && s.sums.length ? ` (${s.sums.length})` : ''}</a>
        <div class="lv-meter" id="lv-meter" hidden><i></i></div>
      </div>
      <p class="lv-msg small" id="lv-msg" hidden></p>
      <div class="lv-live" id="lv-live"></div>
      <div class="lv-grid">
        <div class="lv-col"><h2>Lời thoại</h2><div class="lv-segs" id="lv-segs">${s && s.segs.length ? s.segs.map(segHtml).join('') : '<p class="muted small lv-empty">Bấm <b>Bắt đầu nghe</b>, đặt máy gần người nói. Lời nói và bản dịch hiện ở đây.</p>'}</div></div>
        <aside class="lv-col lv-side"><h2>Ý chính</h2>
          <div class="row"><button class="btn" data-lv="sum" id="lv-sumbtn">Tóm tắt đoạn vừa rồi</button><label class="small"><input type="checkbox" id="lv-auto"${OPT.autoSum ? ' checked' : ''}> Tự tóm tắt</label></div>
          <div id="lv-sums">${s && s.sums.length ? s.sums.slice().reverse().map((k, i) => sumHtml(k, i === 0)).join('') : `<p class="muted small">${CFG.gkey ? `Khi họ nói dài (khoảng ${OPT.sumWords} từ) hoặc mỗi 4 phút, máy tự rút ý chính bằng tiếng Việt và gợi ý câu trả lời.` : 'Tóm tắt ý chính dùng Gemini (miễn phí): thêm key ở <a href="#/set">Cài đặt</a>.'}</p>`}</div>
          ${s && s.segs.length ? `<div class="row" style="margin-top:12px"><button class="btn pri" id="lv-final" data-lv="final">Tóm tắt cả cuộc họp</button><button class="btn" data-lv="dl">Tải biên bản (.md)</button><button class="btn ghost" data-lv="new">Cuộc họp mới</button></div>` : ''}
          ${s && s.final ? finalHtml(s.final) : ''}
          <details class="lv-opt"><summary>Cài đặt phiên dịch</summary>
            <div class="fld"><label>Nghe bằng</label>
              <label class="small"><input type="radio" name="lv-eng" value="browser"${OPT.engine === 'browser' ? ' checked' : ''}> Trình duyệt — nhanh, bấm "Tôi nói" để đổi sang tiếng Việt</label>
              <label class="small"><input type="radio" name="lv-eng" value="gemini"${OPT.engine === 'gemini' ? ' checked' : ''}> Gemini — tự nhận Anh / Việt, chậm hơn vài giây (cần key)</label></div>
            <label class="small"><input type="checkbox" id="lv-speak"${OPT.speakEn ? ' checked' : ''}> Tự đọc to câu tiếng Anh sau khi tôi nói</label><br>
            <label class="small"><input type="checkbox" id="lv-back"${OPT.autoBack ? ' checked' : ''}> Tôi nói xong ⇒ tự quay lại nghe tiếng Anh</label><br>
            <label class="small"><input type="checkbox" id="lv-big"${OPT.big ? ' checked' : ''}> Chữ to</label>
            <div class="fld"><label for="lv-sw">Tự tóm tắt khi họ nói khoảng</label><select id="lv-sw">${[80, 140, 220, 320].map(n => `<option value="${n}"${OPT.sumWords === n ? ' selected' : ''}>${n} từ</option>`).join('')}</select></div>
            <p class="small muted">Nhận giọng: trình duyệt gửi âm thanh tới dịch vụ nhận giọng của Google / Apple. Dịch: dịch trên máy của Chrome nếu có, không thì Google Dịch; Gemini (key của bạn) làm mượt câu và tóm tắt. Gói Gemini miễn phí: Google có thể dùng nội dung để cải thiện sản phẩm — cân nhắc với cuộc họp có số liệu mật. Lời thoại chỉ lưu trên máy này.</p>
          </details>
          ${hist.length ? `<h2>Cuộc họp đã lưu</h2><ul class="lv-hist">${hist.map(x => `<li><button class="btn ghost" data-lv="open" data-id="${x.id}">${esc(x.title || 'Cuộc họp')} · ${new Date(x.start).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${x.segs.length} lượt</button><button class="btn ghost" data-lv="del" data-id="${x.id}" aria-label="Xoá">✕</button></li>`).join('')}</ul>` : ''}
        </aside>
      </div></div>`;
    paintCtl(); paintLang(); paintLive(); paintTimer();
    const segs = $('#lv-segs'); if (segs) segs.scrollTop = segs.scrollHeight;
  }
  const inView = () => L.view && !!$('#lv-segs');
  function paintCtl() {
    const b = $('#lv-go'); if (!b) return;
    b.className = 'lv-go' + (L.on ? ' on' : '');
    b.innerHTML = L.on ? `${IC.stop}<span>Dừng</span>` : `${IC.mic}<span>${L.s && L.s.segs.length && !L.s.end ? 'Nghe tiếp' : 'Bắt đầu nghe'}</span>`;
    $('#lv-dot').className = 'lv-dot' + (L.on ? ' on' : '');
    $('#lv-stt').textContent = !L.on ? 'Chưa nghe' : OPT.engine === 'gemini' ? 'Đang nghe · Gemini tự nhận Anh / Việt' : L.lang === 'en' ? 'Đang nghe tiếng Anh' : 'Đang nghe tiếng Việt';
    $('#lv-hold').hidden = OPT.engine !== 'browser'; $('#lv-meter').hidden = !(L.on && OPT.engine === 'gemini');
  }
  function paintLang() {
    const g = $('#lv-lang'); if (!g) return;
    if (OPT.engine === 'gemini') { g.innerHTML = '<span class="small muted">Tự nhận tiếng Anh / tiếng Việt</span>'; return; }
    g.innerHTML = [['en', 'Họ nói', 'Tiếng Anh'], ['vi', 'Tôi nói', 'Tiếng Việt']].map(([k, a, b]) => `<button type="button" data-lv="lang" data-k="${k}" class="${L.lang === k ? 'on' : ''}"><b>${a}</b><span>${b}</span></button>`).join('');
    paintCtl();
  }
  function paintLive() {
    const el = $('#lv-live'); if (!el) return;
    el.innerHTML = L.on && L.interim ? `<span class="${L.lang}">${esc(L.interim)}</span>` : '';
  }
  function paintMeter() { const m = $('#lv-meter i'); if (m) m.style.width = Math.round((L.level || 0) * 100) + '%'; }
  function paintTimer() { const t = $('#lv-time'); if (t && L.s) t.textContent = mmss((L.s.end || now()) - L.s.start); }
  function paintSeg(seg, scroll) {
    if (!inView()) return;
    $('.lv-empty')?.remove();
    const old = document.getElementById(seg.id), box = $('#lv-segs');
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    if (old) old.outerHTML = segHtml(seg); else box.insertAdjacentHTML('beforeend', segHtml(seg));
    if (scroll || near) box.scrollTop = box.scrollHeight;
  }
  function paintSums(fresh) {
    const el = $('#lv-sums'); if (!el || !L.s) return;
    el.innerHTML = L.s.sums.slice().reverse().map((k, i) => sumHtml(k, i === 0)).join('');
    const j = $('.lv-jump'); if (j) j.textContent = `Ý chính (${L.s.sums.length})`;
    if (fresh) { toast('Có ý chính mới'); if (!$('#lv-final')) render(); }
  }
  function paintSumBusy(b) { const x = $('#lv-sumbtn'); if (x) { x.disabled = b; x.innerHTML = b ? '<span class="spin"></span> Đang tóm tắt…' : 'Tóm tắt đoạn vừa rồi'; } }
  function setStatus(msg, kind) { const el = $('#lv-msg'); if (!el) { if (msg) toast(msg, 4500); return; } el.hidden = !msg; el.textContent = msg; el.className = 'lv-msg small ' + (kind || ''); }
  function paintOpt() { if (inView()) render(); }

  /* ── sự kiện ── */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-lv]'); if (!t || !inView()) return;
    const k = t.dataset.lv, id = t.dataset.id;
    if (k === 'jump') { e.preventDefault(); $('#lv-sums')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (k === 'go') { L.on ? stop() : start(); return; }
    if (k === 'lang') { if (!L.on) await start(); setLang(t.dataset.k); return; }
    if (k === 'sum') { maybeSummary(true); return; }
    if (k === 'final') { finalSummary(); return; }
    if (k === 'dl') { if (L.s) download(L.s); return; }
    if (k === 'new') { if (L.on) stop(); L.s = null; render(); return; }
    if (k === 'speak') { const s = L.s?.segs.find(x => x.id === id); if (s?.tr) speak(s.tr); return; }
    if (k === 'say') { speak(t.dataset.t); return; }
    if (k === 'copy') { const s = L.s?.segs.find(x => x.id === id); try { await navigator.clipboard.writeText(s?.tr || ''); toast('Đã chép câu tiếng Anh'); } catch { toast('Không chép được'); } return; }
    if (k === 'open') { if (L.on) stop(); L.s = LS.get('mmh_live_sessions', []).find(x => x.id === id) || null; render(); return; }
    if (k === 'del') { if (t.dataset.sure) { LS.set('mmh_live_sessions', LS.get('mmh_live_sessions', []).filter(x => x.id !== id)); render(); } else { t.dataset.sure = 1; t.textContent = 'Xoá?'; } }
  });
  document.addEventListener('change', e => {
    if (!inView()) return;
    const id = e.target.id;
    if (e.target.name === 'lv-eng') { const was = L.on; if (was) stop(); OPT.engine = e.target.value; saveOpt(); render(); if (was) start(); return; }
    if (id === 'lv-auto') { OPT.autoSum = e.target.checked; saveOpt(); }
    if (id === 'lv-speak') { OPT.speakEn = e.target.checked; saveOpt(); }
    if (id === 'lv-back') { OPT.autoBack = e.target.checked; saveOpt(); }
    if (id === 'lv-big') { OPT.big = e.target.checked; saveOpt(); $('.lv')?.classList.toggle('big', OPT.big); }
    if (id === 'lv-sw') { OPT.sumWords = +e.target.value; saveOpt(); }
  });
  // giữ để nói tiếng Việt (chuột / chạm / phím cách)
  const holdOn = async () => { if (!inView() || OPT.engine !== 'browser') return; L.holding = true; if (!L.on) await start(); setLang('vi'); $('#lv-hold')?.classList.add('on'); };
  const holdOff = () => { if (!L.holding) return; L.holding = false; $('#lv-hold')?.classList.remove('on'); setTimeout(() => { if (!L.holding) setLang('en'); }, 700); };
  document.addEventListener('pointerdown', e => { if (e.target.closest('#lv-hold')) { e.preventDefault(); holdOn(); } });
  document.addEventListener('pointerup', holdOff); document.addEventListener('pointercancel', holdOff);
  document.addEventListener('keydown', e => { if (e.code === 'Space' && inView() && !e.target.closest('input,textarea,select,button') && !e.repeat) { e.preventDefault(); holdOn(); } });
  document.addEventListener('keyup', e => { if (e.code === 'Space' && inView()) holdOff(); });
  window.addEventListener('beforeunload', e => { if (L.on) { persist(); e.preventDefault(); e.returnValue = ''; } });

  window.LIVE = { render, leave: () => { L.view = false; }, state: L, opt: OPT, _test: { addText, closeSeg, summarize, md, wav } };
  if (/^#\/live/.test(location.hash)) render();   // coach.js chạy route() trước khi file này tải xong
})();
