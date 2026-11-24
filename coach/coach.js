/* MMH Daily · Luyện nói (v1.0)
   3 mức cho mỗi đoạn: 1 Chọn từ & đọc (có tiếng Anh, chọn từ đúng rồi đọc to) · 2 Có gợi ý (tiếng Việt + từ khoá / khung câu / chia nhỏ / nghe mẫu)
   · 3 Tự nói (chỉ tiếng Việt). Nhận giọng = Web Speech API của trình duyệt (miễn phí). Chấm ý + sửa câu = Gemini API (key miễn phí của người dùng,
   chỉ lưu trên máy này); chưa có key ⇒ chấm theo ý chính + từ khoá có sẵn trong bài. Giọng mẫu = giọng trình duyệt hoặc Azure Neural (tuỳ chọn).
   Dữ liệu học lưu localStorage: mmh_coach_cfg · mmh_coach_prog · mmh_coach_words · mmh_coach_day · mmh_coach_news. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const CFG = Object.assign({ rate: 0.95, voice: '', gkey: '', gmodel: '', akey: '', areg: '', avoice: 'en-US-JennyNeural', goal: 10 }, LS.get('mmh_coach_cfg', {}));
  const saveCfg = () => LS.set('mmh_coach_cfg', CFG);
  const PROG = LS.get('mmh_coach_prog', {});
  let WORDS = LS.get('mmh_coach_words', []);
  const TOPICS = window.COACH_TOPICS || [];
  const LESSONS = window.COACH_LESSONS || [];
  const topicName = id => id === 'news' ? 'Bản tin hôm nay' : id === 'my' ? 'Chủ đề của tôi' : (TOPICS.find(t => t.id === id) || {}).vi || '';
  const LV = { 1: ['Mức 1', 'Chọn từ & đọc'], 2: ['Mức 2', 'Có gợi ý'], 3: ['Mức 3', 'Tự nói'] };
  const PASS = 70;

  const I = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/></svg>',
    slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/></svg>'
  };

  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, ms);
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  /* ── chữ: chuẩn hoá, so khớp từng từ, kiểm ý ── */
  const NUM = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 15: 'fifteen', 20: 'twenty', 30: 'thirty', 50: 'fifty', 100: 'hundred' };
  function toks(s) {
    s = String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/%/g, ' percent ').replace(/[^a-z0-9' ]+/g, ' ').trim();
    if (!s) return [];
    return s.split(/\s+/).map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean).map(w => NUM[w] || w);
  }
  const normStr = s => toks(s).join(' ');
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length; if (!m || !n) return m || n;
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const c = [i];
      for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = c;
    }
    return p[n];
  }
  function sim(a, b) {
    if (a === b) return 2;
    if (a.length >= 4 && b.length >= 4) {
      const d = lev(a, b);
      if (d <= 1 || (a.length >= 7 && d <= 2) || a.slice(0, 5) === b.slice(0, 5)) return 1;
    }
    return 0;
  }
  /* So câu mẫu với câu người học nói (quy hoạch động, như so sánh văn bản): mỗi từ mẫu ⇒ ok / near / miss. */
  function align(refText, hypText) {
    const disp = String(refText).split(/\s+/).filter(Boolean);
    const ref = []; disp.forEach((w, i) => toks(w).forEach(t => ref.push({ t, i })));
    const hyp = toks(hypText);
    const n = ref.length, m = hyp.length;
    const S = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
      const s = sim(ref[i - 1].t, hyp[j - 1]);
      S[i][j] = Math.max(S[i - 1][j], S[i][j - 1], s ? S[i - 1][j - 1] + s : 0);
    }
    const lab = new Array(n).fill('miss');
    for (let i = n, j = m; i > 0 && j > 0;) {
      const s = sim(ref[i - 1].t, hyp[j - 1]);
      if (s && S[i][j] === S[i - 1][j - 1] + s) { lab[i - 1] = s === 2 ? 'ok' : 'near'; i--; j--; }
      else if (S[i - 1][j] >= S[i][j - 1]) i--; else j--;
    }
    const marks = disp.map(() => []);
    ref.forEach((r, k) => marks[r.i].push(lab[k]));
    const dm = marks.map(a => !a.length ? 'ok' : a.every(x => x === 'ok') ? 'ok' : a.some(x => x !== 'miss') ? 'near' : 'miss');
    const pts = lab.reduce((s, x) => s + (x === 'ok' ? 1 : x === 'near' ? 0.5 : 0), 0);
    return { disp, marks: dm, score: n ? Math.round(pts / n * 100) : 0 };
  }
  function ideaHit(text, groups) {
    const t = ' ' + normStr(text) + ' ';
    return (groups || []).every(g => g.some(a => { const x = normStr(a); return x && t.includes(x); }));
  }
  const clean = en => String(en || '').replace(/\[\[|\]\]/g, '');
  const blanksOf = en => [...String(en || '').matchAll(/\[\[(.+?)\]\]/g)].map(m => m[1]);
  const frameOf = en => esc(String(en || '')).replace(/\[\[(.+?)\]\]/g, '<b>____</b>');
  function shuffleSeeded(arr, seed) {
    let h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ── nhận giọng nói (Web Speech API) ── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const Rec = {
    r: null, on: false,
    start(onText, onEnd, lang) {
      if (!SR) { onEnd({ text: '', err: 'nosupport' }); return; }
      Voice.stop();
      const r = new SR(); this.r = r;
      // Android: chế độ liên tục hay lặp lại chữ ⇒ nghe từng câu (tự dừng khi ngừng nói)
      r.lang = lang || 'en-US'; r.interimResults = true; r.continuous = !/Android/i.test(navigator.userAgent); r.maxAlternatives = 1;
      let fin = '', err = ''; const conf = [];
      const addFin = t => { t = String(t || '').trim(); if (!t) return; const f = fin.trim().toLowerCase(), x = t.toLowerCase(); if (f && x.startsWith(f)) fin = ' ' + t; else if (!f.endsWith(x)) fin += ' ' + t; };
      r.onresult = e => {
        let inter = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) { addFin(res[0].transcript); if (res[0].confidence) conf.push(res[0].confidence); }
          else inter += ' ' + res[0].transcript;
        }
        onText((fin + inter).trim());
      };
      r.onerror = e => { err = e.error || 'error'; };
      r.onend = () => { this.on = false; this.r = null; onEnd({ text: fin.trim(), conf: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : 0, err }); };
      try { r.start(); this.on = true; } catch (e) { this.on = false; onEnd({ text: '', err: String(e.message || e) }); }
    },
    stop() { try { this.r && this.r.stop(); } catch {} }
  };
  const recErr = e => e === 'not-allowed' || e === 'service-not-allowed' ? 'Trình duyệt chưa cho dùng micro. Bấm biểu tượng ổ khoá trên thanh địa chỉ ▸ cho phép Micro.'
    : e === 'no-speech' ? 'Chưa nghe thấy giọng. Bấm micro rồi nói to, rõ hơn.'
      : e === 'nosupport' ? 'Trình duyệt này chưa nhận giọng nói. Dùng Chrome / Edge, hoặc gõ câu trả lời.'
        : e === 'network' ? 'Nhận giọng cần mạng. Kiểm tra kết nối rồi thử lại.' : '';

  /* ── giọng đọc mẫu: Azure Neural (nếu có key) ⇒ giọng trình duyệt ── */
  const AUD = new Audio();
  const AZ_CACHE = new Map();
  const xml = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
  async function azureSay(text, rate) {
    const k = `${CFG.avoice}|${rate}|${text}`;
    let url = AZ_CACHE.get(k);
    if (!url) {
      const pct = Math.round((rate - 1) * 100);
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${xml(CFG.avoice)}"><prosody rate="${pct >= 0 ? '+' : ''}${pct}%">${xml(text)}</prosody></voice></speak>`;
      const r = await fetch(`https://${encodeURIComponent(CFG.areg)}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST', body: ssml,
        headers: { 'Ocp-Apim-Subscription-Key': CFG.akey, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' }
      });
      if (!r.ok) throw new Error('Azure ' + r.status);
      url = URL.createObjectURL(await r.blob());
      AZ_CACHE.set(k, url);
    }
    AUD.src = url; await AUD.play();
  }
  const Voice = {
    list() { return 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang)) : []; },
    pick() {
      const vs = this.list();
      if (CFG.voice) { const v = vs.find(x => x.name === CFG.voice); if (v) return v; }
      for (const p of [/natural/i, /online/i, /google us english/i, /samantha/i, /aria|jenny|ava|emma/i]) {
        const v = vs.find(x => p.test(x.name) && /en[-_]US/i.test(x.lang)) || vs.find(x => p.test(x.name));
        if (v) return v;
      }
      return vs.find(x => /en[-_]US/i.test(x.lang)) || vs[0];
    },
    stop() { try { AUD.pause(); } catch {} if ('speechSynthesis' in window) speechSynthesis.cancel(); },
    sayWait(text) {
      return new Promise(async res => {
        if (CFG.akey && CFG.areg) { try { await azureSay(text, CFG.rate); AUD.onended = () => res(); AUD.onpause = () => res(); return; } catch {} }
        if (!('speechSynthesis' in window)) return res();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = CFG.rate; const v = this.pick(); if (v) u.voice = v;
        u.onend = () => res(); u.onerror = () => res(); speechSynthesis.speak(u);
      });
    },
    async say(text, rate) {
      rate = rate || CFG.rate; this.stop();
      if (CFG.akey && CFG.areg) {
        try { await azureSay(text, rate); return; } catch (e) { toast('Giọng Azure chưa chạy (' + e.message + '), dùng giọng trình duyệt.'); }
      }
      if (!('speechSynthesis' in window)) { toast('Trình duyệt này không có giọng đọc.'); return; }
      const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate;
      const v = this.pick(); if (v) u.voice = v;
      speechSynthesis.speak(u);
    }
  };
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { if (S.view === 'set') paintVoices(); };

  /* ── Gemini (key miễn phí của người dùng, gọi thẳng từ trình duyệt) ── */
  const GEM = 'https://generativelanguage.googleapis.com/v1beta';
  /* fetch có giới hạn thời gian: Google không trả lời ⇒ báo lỗi thay vì quay mãi */
  async function tfetch(url, opt = {}, ms = 30000) {
    const c = new AbortController(), outer = opt.signal;
    const t = setTimeout(() => c.abort('timeout'), ms);
    if (outer) outer.addEventListener('abort', () => c.abort(outer.reason), { once: true });
    try { return await fetch(url, { ...opt, signal: c.signal }); }
    catch (e) { if (c.signal.reason === 'timeout') throw new Error(`Google chưa trả lời sau ${Math.round(ms / 1000)} giây. Kiểm tra mạng rồi thử lại.`); throw e; }
    finally { clearTimeout(t); }
  }
  function gemErr(status, body) {
    const m = String(body || '').match(/"message"\s*:\s*"([^"]{0,160})/);
    if (/location is not supported|not available in your country/i.test(body || '')) return new Error('Gemini API chưa hỗ trợ vùng mạng này. Thử mạng khác (4G / Wi-Fi khác).');
    if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(body || '')) return new Error('Gemini key không đúng. Copy lại key trong AI Studio rồi dán lại.');
    if (status === 403 && /SERVICE_DISABLED|has not been used|disabled/i.test(body || '')) return new Error('Dự án của key chưa bật Gemini API. Đợi 1–2 phút sau khi tạo key rồi thử lại.');
    return new Error(status === 429 ? 'Gemini: hết lượt miễn phí tạm thời. Đợi khoảng 1 phút rồi thử lại.'
      : (status === 400 || status === 401 || status === 403) ? 'Gemini key chưa đúng hoặc chưa được bật. Kiểm tra trong Cài đặt.'
        : 'Gemini đang lỗi (' + status + (m ? ': ' + m[1] : '') + '). Thử lại sau.');
  }
  async function gemModels() {
    const r = await tfetch(GEM + '/models?pageSize=200', { headers: { 'x-goog-api-key': CFG.gkey } }, 15000);
    if (!r.ok) throw gemErr(r.status, await r.text().catch(() => ''));
    const d = await r.json();
    return (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/i.test(m.name)
      && !/(tts|image|embed|live|audio|veo|imagen|learnlm|robotics|computer|native|thinking-exp)/i.test(m.name))
      .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }));
  }
  function rankModels(list) {
    const sc = m => { const v = parseFloat((m.id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0); return v * 10 + (/flash/.test(m.id) ? 30 : 0) + (/latest$/.test(m.id) ? 5 : 0) - (/lite/.test(m.id) ? 8 : 0) - (/pro/.test(m.id) ? 5 : 0) - (/preview|exp/.test(m.id) ? 12 : 0) - (/\d{3,}$/.test(m.id) ? 2 : 0); };
    return list.slice().sort((a, b) => sc(b) - sc(a));
  }
  const bestModel = list => rankModels(list)[0];
  async function ensureModel() {
    if (CFG.gmodel) return CFG.gmodel;
    const b = bestModel(await gemModels());
    if (!b) throw new Error('Key này chưa dùng được mẫu Gemini nào. Tạo lại key trong AI Studio.');
    CFG.gmodel = b.id; saveCfg(); return b.id;
  }
  /* Gọi Gemini bền: Google bận (503 / 429 / 500) ⇒ chờ rồi thử lại 1 lần ⇒ đổi sang mẫu Flash khác; không chạy được "tắt suy nghĩ" ⇒ bỏ.
     Hạn mức miễn phí tính theo từng mẫu, nên đổi mẫu cũng giúp khi một mẫu hết lượt. */
  let MODELS = null;
  async function modelList() { if (!MODELS) MODELS = await gemModels(); return MODELS; }
  /* Mẫu báo hết / không có hạn mức miễn phí ⇒ nhớ 12 giờ, không gọi lại (đỡ chờ). */
  const badGet = () => { const b = LS.get('mmh_gem_bad', {}), now = Date.now(); for (const k in b) if (now - b[k] > 12 * 36e5) delete b[k]; return b; };
  const badSet = m => { const b = badGet(); b[m] = Date.now(); LS.set('mmh_gem_bad', b); if (CFG.gmodel === m) { CFG.gmodel = ''; saveCfg(); } };
  async function candidates() {
    const bad = badGet();
    const out = CFG.gmodel && !bad[CFG.gmodel] ? [CFG.gmodel] : [];
    try { rankModels(await modelList()).forEach(m => { if (!out.includes(m.id) && !/pro/.test(m.id) && !bad[m.id]) out.push(m.id); }); }
    catch (e) { if (!out.length) throw e; }
    if (!out.length) { LS.set('mmh_gem_bad', {}); throw new Error('Các mẫu Gemini miễn phí đang hết lượt. Đợi vài phút rồi thử lại.'); }
    return out.slice(0, 6);
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const TRANSIENT = st => st === 429 || st === 500 || st === 502 || st === 503 || st === 504;
  async function gemPost(method, body, opt = {}) {
    if (!CFG.gkey) throw new Error('NOKEY');
    let last = null;
    for (const model of await candidates()) {
      let think = !CFG.noThink;
      for (let a = 0; a < 3; a++) {
        const gc = Object.assign({}, body.generationConfig); if (think) gc.thinkingConfig = { thinkingBudget: 0 };
        let r;
        try {
          r = await tfetch(`${GEM}/models/${encodeURIComponent(model)}:${method}`, {
            method: 'POST', signal: opt.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CFG.gkey },
            body: JSON.stringify(Object.assign({}, body, { generationConfig: gc }))
          }, opt.ms || 45000);
        } catch (e) { if (opt.signal?.aborted) throw e; last = e; opt.onBusy?.(model); break; }
        if (r.ok) { if (model !== CFG.gmodel) { CFG.gmodel = model; saveCfg(); } return r; }
        const txt = await r.text().catch(() => '');
        if (r.status === 400 && think && /thinking|budget/i.test(txt)) { think = false; continue; }
        last = gemErr(r.status, txt);
        if (r.status === 404) break;
        if (r.status === 429 && /limit: ?0|quota|exceeded|billing/i.test(txt)) { badSet(model); opt.onBusy?.(model); break; }
        if (TRANSIENT(r.status)) { opt.onBusy?.(model); if (a === 0) { await wait(r.status === 429 ? 2500 : 1500); continue; } break; }
        throw last;
      }
    }
    throw last && /503|500|502|504/.test(last.message) ? new Error('Máy chủ Gemini đang quá tải. Đợi khoảng 1 phút rồi bấm Thử lại.') : (last || new Error('Gemini chưa trả lời được. Thử lại.'));
  }
  async function gem(sys, user, opt = {}) {
    const r = await gemPost('generateContent', { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } }, opt);
    const d = await r.json();
    const txt = (d.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!txt) throw new Error('Gemini trả lời rỗng. Thử lại.');
    return JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  }
  const EVAL_SYS = `You are a friendly, precise English speaking coach for a Vietnamese learner at CEFR B1 who works as a product and sales manager at a medical device distributor (dental, ophthalmic, surgical products) in Vietnam.
The learner read a Vietnamese text and SPOKE an English version. The transcript comes from browser speech recognition: ignore small recognition errors (homophones, missing punctuation, numbers written as words) unless they clearly change the meaning.
Judge MEANING first (did they convey every idea of the Vietnamese text?), then grammar and word choice. Be encouraging but honest.
Return JSON only, with these keys:
"score": integer 0-100, how completely and correctly the meaning was conveyed (grammar mistakes that keep the meaning clear cost little),
"ideas": [{"vi": short Vietnamese label of one meaning unit, "ok": true|false, "note": short Vietnamese note when missing or wrong, else ""}] covering every meaning unit of the Vietnamese text,
"corrected": the learner's own answer corrected with minimal changes (keep their wording where possible), complete and natural,
"better": [a natural spoken version, a more professional version],
"errors": up to 4 items [{"you": the learner's wrong fragment, "fix": the corrected fragment, "why": one short Vietnamese explanation}],
"keywords": 2-5 items [{"vi": Vietnamese phrase, "en": English}] — the most useful words for this text that the learner missed or misused,
"grammar": 1-2 items [{"point": the pattern, "vi": one-sentence Vietnamese explanation, "ex": an example sentence}],
"praise": one short, specific encouraging sentence in Vietnamese.
Write all Vietnamese with full diacritics.`;
  const GEN_SYS = `You create speaking drills for a Vietnamese professional at CEFR B1 (product and sales manager at a medical device distributor: dental, ophthalmic, surgical products).
From a Vietnamese news summary (and a rough machine translation), return JSON only with these keys:
"vi": the Vietnamese text the learner will translate aloud: 1-2 sentences, at most 40 words, faithful to the source, natural Vietnamese with full diacritics,
"en": a natural, correct English translation (business / news register, B1-B2 vocabulary). Mark exactly 3 key words or short phrases (the hardest useful vocabulary or collocations) with double square brackets, e.g. [[procurement]],
"d": one entry per marked phrase, same order; each entry is an array of 2 WRONG options a learner might confuse (wrong word form, wrong preposition, wrong collocation) that are clearly wrong in context,
"keys": 3-6 pairs ["Vietnamese phrase exactly as written in vi", "English equivalent"] for difficult words only (skip easy words),
"chunks": 2-3 pairs ["consecutive part of vi", "matching part of en without brackets"] splitting the text in order,
"ideas": 3-5 items ["short Vietnamese label of one meaning unit", groups] where groups is an array of arrays of lowercase English fragments; the idea counts as said when every group has at least one fragment in the learner's answer; include synonyms and word stems (e.g. "approv", "procur"),
"grammar": 2 items ["pattern", "one-sentence Vietnamese explanation"],
"alt": 1-2 alternative natural English versions.`;

  /* ── tiến độ, phút học, chuỗi ngày ── */
  const saveProg = () => LS.set('mmh_coach_prog', PROG);
  const best = (id, l) => (PROG[id] || {})['l' + l] || 0;
  const passed = (id, l) => best(id, l) >= PASS;
  const recLevel = id => !passed(id, 1) ? 1 : !passed(id, 2) ? 2 : 3;
  function dayStat() {
    const d = LS.get('mmh_coach_day', {});
    if (d.d !== today()) { d.prevDone = d.done ? d.d : d.prevDone; d.d = today(); d.sec = 0; d.n = 0; d.done = false; }
    return d;
  }
  function record(id, l, score) {
    const p = PROG[id] || (PROG[id] = {});
    p['l' + l] = Math.max(p['l' + l] || 0, score); p.at = Date.now(); saveProg();
    const d = dayStat(); d.n = (d.n || 0) + 1;
    if (!d.done) { d.done = true; d.streak = d.prevDone === addDays(today(), -1) ? (d.streak || 0) + 1 : 1; }
    LS.set('mmh_coach_day', d);
    dyCoach(id, l, score);
  }
  // XP tài khoản học viên (MMH Daily ▸ rank.js / Training Hub dyEvent kind=coach): 1 lần / đoạn / mức / ngày; chưa đăng nhập ⇒ hàng chờ mmh_dy_q (app chính tự gửi)
  const DY_HUB = 'https://script.google.com/macros/s/AKfycbwsX4cQEoH4LNlmcNfe8qWIM9K6EiDEXy7PjhP9bHY2citL6xHn5L1unsAlQJHyL9EP/exec';
  async function dyCoach(id, l, score) {
    const key = today() + '|coach|' + id + '|' + l, seen = LS.get('mmh_dy_coach', {});
    if (seen[key]) return; seen[key] = 1; LS.set('mmh_dy_coach', Object.fromEntries(Object.entries(seen).slice(-60)));
    const it = { kind: 'coach', pct: Math.round(score), show: 'coach', rid: 'dc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), key };
    let tk = ''; try { tk = localStorage.getItem('mmh_daily_tk') || (localStorage.getItem('mmh_daily_out') ? '' : localStorage.getItem('mmh_tk')) || ''; } catch {}
    const queue = () => { const q = LS.get('mmh_dy_q', []); q.push(it); LS.set('mmh_dy_q', q.slice(-40)); };
    if (!tk) return queue();
    try {
      const { key: _k, ...p } = it;
      const r = await fetch(DY_HUB + '?' + new URLSearchParams({ action: 'dyEvent', tk, ...p }), { credentials: 'omit' }), d = await r.json();
      if (!d.ok) return queue();
      if (d.me) LS.set('mmh_dy_me', d.me);
      if (d.xp) toast(d.levelUp ? 'Lên cấp ' + d.levelUp + '! +' + d.xp + ' XP' : '+' + d.xp + ' XP');
    } catch { queue(); }
  }
  let lastAct = 0;
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.visibilityState !== 'visible' || S.view !== 'lesson' || (Date.now() - lastAct > 90000 && !Rec.on)) return;
    const d = dayStat(); d.sec = (d.sec || 0) + 5; LS.set('mmh_coach_day', d);
  }, 5000);

  /* ── sổ từ ── */
  const STEPS = [1, 3, 7, 14, 30];
  function addWord(en, vi, ex, src) {
    en = String(en || '').trim(); if (!en) return false;
    if (WORDS.some(w => w.en.toLowerCase() === en.toLowerCase())) return false;
    WORDS.unshift({ en, vi: vi || '', ex: ex || '', src: src || '', at: Date.now(), due: today(), step: 0 });
    LS.set('mmh_coach_words', WORDS); return true;
  }
  const dueWords = () => WORDS.filter(w => w.due <= today());

  /* ── bài từ bản tin ── */
  const NEWS = { list: null, err: '' };
  /* Chỉ tin chuyên môn liên quan MMH (nhãn khoa, nha khoa, đấu thầu, thiết bị, chính sách y tế, BHYT, bệnh viện, phẫu thuật); bỏ giải trí, người nổi tiếng. */
  const NEWS_TAGS = { eye: 'Nhãn khoa', dental: 'Nha khoa', tender: 'Đấu thầu', device: 'Thiết bị y tế', policy: 'Chính sách', insurance: 'BHYT', surgery: 'Phẫu thuật', hospital: 'Bệnh viện' };
  const NEWS_SKIP = /youtuber|tiktoker|mukbang|thánh ăn|ca sĩ|diễn viên|hoa hậu|người mẫu|showbiz|người nổi tiếng|celebrity|influencer|giải trí|thẩm mỹ viện/i;
  async function loadNews() {
    if (NEWS.list) return NEWS.list;
    try {
      const idx = await (await fetch('../data/index.json?t=' + Date.now(), { cache: 'no-store' })).json();
      const date = idx.editions?.[0]?.date; if (!date) throw new Error('Chưa có số báo.');
      const ed = await (await fetch(`../data/editions/${date}.json`, { cache: 'no-cache' })).json();
      NEWS.date = date; NEWS.pre = ed.coach?.lessons || {}; NEWS.briefs = ed.coach?.briefs || []; NEWS.stories = ed.stories || {};
      const seen = new Set();
      NEWS.list = Object.values(ed.stories || {})
        .filter(s => NEWS.pre[s.id] || (s.sum && (s.mmh || 0) >= 3 && (s.tags || []).some(t => NEWS_TAGS[t]) && (s.sec === 'health' || (s.tags || []).some(t => ['tender', 'device', 'policy'].includes(t))) && !NEWS_SKIP.test(s.t + ' ' + s.sum)))
        .sort((a, b) => (NEWS.pre[b.id] ? 1 : 0) - (NEWS.pre[a.id] ? 1 : 0) || (b.mmh || 0) - (a.mmh || 0))
        .filter(s => { const k = normStr(s.t).split(' ').slice(0, 4).join(' '); if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, 6)
        .map(s => ({ id: `n-${date}-${s.id}`, sid: s.id, title: s.h_vi || s.t, sum: s.s_vi || s.sum, en: s.s_en || '', src: s.src || '', url: s.u || '', tag: NEWS_TAGS[(s.tags || []).find(t => NEWS_TAGS[t])] || '' }));
    } catch (e) { NEWS.err = 'Chưa đọc được bản tin hôm nay.'; NEWS.list = []; }
    return NEWS.list;
  }
  function fixLesson(o, base) {
    const L = Object.assign({ keys: [], chunks: [], ideas: [], grammar: [], alt: [], d: [] }, o, base);
    L.vi = String(L.vi || '').trim(); L.en = String(L.en || '').trim();
    const bl = blanksOf(L.en);
    if (!L.vi || !L.en || !bl.length) throw new Error('Gemini trả bài chưa đúng mẫu. Thử lại.');
    L.d = bl.map((b, i) => { const x = Array.isArray(L.d[i]) ? L.d[i].map(String).filter(v => v && v.toLowerCase() !== b.toLowerCase()) : []; return x.slice(0, 2); });
    L.keys = (L.keys || []).filter(k => Array.isArray(k) && k[0] && k[1]);
    L.chunks = (L.chunks || []).filter(k => Array.isArray(k) && k[0] && k[1]);
    L.ideas = (L.ideas || []).filter(x => Array.isArray(x) && x[0] && Array.isArray(x[1])).map(x => [x[0], x[1].map(g => Array.isArray(g) ? g : [g])]);
    L.grammar = (L.grammar || []).filter(g => Array.isArray(g) && g[0]);
    L.alt = (L.alt || []).filter(Boolean);
    return L;
  }
  const PEND = {};
  function newsLesson(id, onBusy) {
    const c = LS.get('mmh_coach_news', {});
    if (c[id]) return Promise.resolve(c[id]);
    if (!PEND[id]) PEND[id] = newsLessonRaw(id, onBusy).finally(() => { delete PEND[id]; });
    return PEND[id];
  }
  async function newsLessonRaw(id, onBusy) {
    const cache = LS.get('mmh_coach_news', {});
    const list = await loadNews();
    const it = list.find(x => x.id === id);
    if (!it) throw new Error('Tin này không còn trong số báo hôm nay.');
    const o = NEWS.pre?.[it.sid] || await gem(GEN_SYS, JSON.stringify({ title: it.title, vietnamese_summary: it.sum, rough_translation: it.en }), { onBusy });
    const L = fixLesson(o, { id, topic: 'news', title: it.title, src: it.src, url: it.url });
    const cache2 = LS.get('mmh_coach_news', {}); Object.assign(cache, cache2);
    cache[id] = L;
    const ks = Object.keys(cache); if (ks.length > 40) delete cache[ks[0]];
    LS.set('mmh_coach_news', cache);
    return L;
  }

  /* Soạn sẵn bài từ bản tin ngay khi mở trang (chạy nền, lần lượt) ⇒ bấm vào là học ngay, không phải chờ. */
  const PREP = {};
  async function prefetchNews() {
    if (prefetchNews.on) return; prefetchNews.on = true;
    try {
      const ls = await loadNews();
      for (const n of ls.slice(0, 3)) {
        if (LS.get('mmh_coach_news', {})[n.id]) { PREP[n.id] = 'ok'; continue; }
        if (!NEWS.pre?.[n.sid] && !CFG.gkey) continue;
        PREP[n.id] = 'run'; paintPrep(n.id);
        try { await newsLesson(n.id); PREP[n.id] = 'ok'; } catch { PREP[n.id] = 'err'; }
        paintPrep(n.id);
        if (PREP[n.id] === 'err') break;
        await wait(800);
      }
    } finally { prefetchNews.on = false; }
  }
  function paintPrep(id) {
    const el = document.querySelector(`.li[href="#/l/${encodeURIComponent(id)}"] .prep`); if (!el) return;
    const it = (NEWS.list || []).find(x => x.id === id);
    const st = PREP[id] || (LS.get('mmh_coach_news', {})[id] || (it && NEWS.pre?.[it.sid]) ? 'ok' : '');
    el.className = 'prep ' + st; el.textContent = st === 'ok' ? 'Sẵn sàng' : st === 'run' ? 'Đang soạn…' : st === 'err' ? 'Soạn khi mở' : '';
  }

  /* ── Bài theo chủ đề của tôi: người dùng gõ chủ đề ⇒ Gemini soạn 5 đoạn cùng mẫu 3 mức ── */
  const MY_SUGGEST = ['Thuyết trình dao phẫu thuật nhãn khoa cho bác sĩ', 'Giới thiệu trâm JIZAI cho nha sĩ', 'Họp dự báo đặt hàng với nhà phân phối', 'Báo cáo KPI quý cho sếp người Nhật', 'Email cảm ơn và theo dõi sau hội thảo', 'Trò chuyện với bác sĩ ở hội nghị', 'Giải thích hồ sơ dự thầu cho bệnh viện', 'Phỏng vấn, giới thiệu bản thân bằng tiếng Anh'];
  const myGet = () => LS.get('mmh_coach_my', []);
  const myLesson = id => { for (const g of myGet()) { const L = g.lessons.find(x => x.id === id); if (L) return L; } return null; };
  const GEN_SET_SYS = GEN_SYS.replace('From a Vietnamese news summary (and a rough machine translation), return JSON only with these keys:',
    'The learner gives a THEME in Vietnamese. Create 5 different speaking drills for that theme: realistic sentences this learner would really say at work (presentations to doctors, meetings with distributors, emails, reports to Japanese managers, tender documents, small talk at conferences), varied situations, gradually harder. Do not invent real company figures; if a number helps, use an obvious example. Return JSON only: {"lessons":[5 objects]}; each object has these keys:')
    .replace('1-2 sentences, at most 40 words, faithful to the source,', '1-2 sentences, at most 35 words,');
  async function myCreate(theme, onBusy) {
    const o = await gem(GEN_SET_SYS, 'THEME: ' + theme, { onBusy });
    const arr = Array.isArray(o) ? o : (o.lessons || []);
    const set = 'u' + Date.now().toString(36);
    const lessons = [];
    arr.forEach((x, k) => { try { lessons.push(fixLesson(x, { id: `${set}-${k}`, topic: 'my', src: theme, set })); } catch {} });
    if (!lessons.length) throw new Error('Gemini chưa soạn được bài cho chủ đề này. Thử lại hoặc viết chủ đề cụ thể hơn.');
    const all = myGet(); all.unshift({ set, theme, at: Date.now(), lessons }); LS.set('mmh_coach_my', all.slice(0, 30));
    return lessons;
  }

  /* ── điều hướng ── */
  const S = { view: '', topic: LS.get('mmh_coach_topic', 'all'), L: null, lvl: 1, st: {} };
  async function route() {
    Voice.stop(); if (Rec.on) Rec.stop();
    const h = location.hash.replace(/^#\/?/, '');
    const [a, b, c] = h.split('/');
    if (a === 'ask') { location.replace('#/'); return; }       // "Hỏi tin" đã bỏ (người dùng yêu cầu 24/11/2026)
    S.view = a === 'l' ? 'lesson' : a === 'words' ? 'words' : a === 'set' ? 'set' : a === 'live' ? 'live' : 'home';
    if (S.view !== 'live' && window.LIVE) LIVE.leave();
    if (window.SHELL) SHELL.sync();
    window.scrollTo({ top: 0 });
    if (S.view === 'live') return window.LIVE ? LIVE.render() : null;   // Phiên dịch hội thoại (live.js)
    if (S.view === 'home') return renderHome();
    if (S.view === 'words') return renderWords();
    if (S.view === 'set') return renderSet();
    return openLesson(decodeURIComponent(b || ''), +c || 0);
  }
  addEventListener('hashchange', route);

  /* ── trang chủ ── */
  function renderHome() {
    const d = dayStat(), min = Math.floor((d.sec || 0) / 60), goal = CFG.goal || 10;
    const due = dueWords().length;
    const list = LESSONS.filter(l => S.topic === 'all' || l.topic === S.topic);
    $('#view').innerHTML = `
      <h1>Luyện nói mỗi ngày</h1>
      <p class="sub">Mỗi đoạn có 3 mức: chọn từ và đọc, nói có gợi ý, rồi tự nói. Đạt ${PASS} điểm thì mở mức tiếp theo.</p>
      <div class="card">
        <div class="goal"><div class="grow"><div class="small muted">Hôm nay</div><b>${min}</b> / ${goal} phút</div>
          <div class="small muted" style="text-align:right">Chuỗi ngày<br><b>${d.done ? d.streak || 1 : (d.prevDone === addDays(today(), -1) ? d.streak || 0 : 0)}</b></div></div>
        <div class="goal-bar" style="margin-top:8px"><i style="width:${Math.min(100, min / goal * 100)}%"></i></div>
        ${Object.keys(PROG).length ? '<details class="lvls-x"><summary>3 mức luyện là gì?</summary>' : ''}<div class="lvls">
          <div class="lvl-card"><b>Mức 1 · Chọn từ & đọc</b><span>Có câu tiếng Anh, chọn từ khoá đúng rồi đọc to để chấm phát âm.</span></div>
          <div class="lvl-card"><b>Mức 2 · Có gợi ý</b><span>Đọc tiếng Việt, nói tiếng Anh. Mở từ khoá, khung câu, chia nhỏ khi cần.</span></div>
          <div class="lvl-card"><b>Mức 3 · Tự nói</b><span>Chỉ có tiếng Việt, không gợi ý. App chấm đúng ý và sửa câu.</span></div>
        </div>${Object.keys(PROG).length ? '</details>' : ''}
        ${due ? `<div class="row" style="margin-top:12px"><span class="grow small">${due} từ trong Sổ từ đến hạn ôn hôm nay.</span><a class="btn" href="#/words">Ôn từ</a></div>` : ''}
      </div>
      ${todayCard()}
      <h2>Chủ đề của tôi</h2>
      <div class="card">
        <div class="small muted" style="margin-bottom:8px">Gõ tình huống bạn cần nói, Gemini soạn 5 đoạn luyện theo đúng 3 mức.</div>
        <div class="typed" style="margin:0"><input id="my-theme" placeholder="Ví dụ: thuyết trình sản phẩm mới cho bác sĩ nhãn khoa" autocomplete="off"><button class="btn pri" data-act="my-go">Tạo bài</button></div>
        <div class="chips hs" style="margin:10px 0 0">${MY_SUGGEST.map(t => `<button class="chip" data-mytheme="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div id="my-msg" class="small muted" style="margin-top:8px"></div>
      </div>
      <div id="my-sets">${mySetsHtml()}</div>
      <h2>Từ bản tin hôm nay</h2>
      <div id="news"><div class="muted small"><span class="spin"></span> Đang đọc bản tin…</div></div>
      <h2>Theo công việc</h2>
      <div class="chips hs">${[['all', 'Tất cả'], ...TOPICS.map(t => [t.id, t.vi])].map(([id, vi]) => `<button class="chip${S.topic === id ? ' on' : ''}" data-topic="${id}">${esc(vi)}</button>`).join('')}</div>
      <div class="ls">${list.map(l => lessonItem(l.id, topicName(l.topic), l.vi)).join('')}</div>`;
    loadNews().then(ls => {
      const box = $('#news'); if (!box) return;
      if (!ls.length) { box.innerHTML = `<div class="muted small">${esc(NEWS.err || 'Bản tin hôm nay chưa có tin y tế phù hợp.')}</div>`; return; }
      box.innerHTML = (CFG.gkey || Object.keys(NEWS.pre || {}).length ? '' : `<div class="note" style="margin-bottom:8px">Bài từ bản tin do AI soạn sẵn mỗi sáng. Hôm nay chưa có bài soạn sẵn; thêm Gemini key trong <a href="#/set">Cài đặt</a> để app tự soạn.</div>`)
        + `<div class="ls">${ls.map(n => lessonItem(n.id, [n.tag, n.src].filter(Boolean).join(' · '), n.title, n.sum, true)).join('')}</div>`;
      ls.forEach(n => paintPrep(n.id));
      const tc = $('#today'); if (tc) tc.outerHTML = todayCard();
      prefetchNews();
    });
  }
  function mySetsHtml() {
    return myGet().map(g => `<div class="myset"><div class="row" style="margin:16px 0 6px"><b class="grow">${esc(g.theme)}</b><button class="btn ghost small" data-mydel="${g.set}">Xoá</button></div>
      <div class="ls">${g.lessons.map(l => lessonItem(l.id, 'Chủ đề của tôi', l.vi)).join('')}</div></div>`).join('');
  }
  /* Gợi ý hôm nay: 1 đoạn theo công việc chưa xong + 1 bài từ tin đã soạn sẵn + ôn từ */
  function todayCard() {
    const work = LESSONS.find(l => !passed(l.id, 3)) || LESSONS[0];
    const news = (NEWS.list || []).find(n => LS.get('mmh_coach_news', {})[n.id]);
    const mine = myGet().flatMap(g => g.lessons).find(l => !passed(l.id, 3));
    const due = dueWords().length;
    const items = [
      mine && [`#/l/${encodeURIComponent(mine.id)}`, 'Chủ đề của tôi', mine.vi],
      [`#/l/${encodeURIComponent(work.id)}`, topicName(work.topic) + ' · ' + LV[recLevel(work.id)][0], work.vi],
      news && [`#/l/${encodeURIComponent(news.id)}`, 'Bản tin hôm nay', news.title],
      due && ['#/words', 'Sổ từ', `Ôn ${due} từ đến hạn`]
    ].filter(Boolean).slice(0, 3);
    return `<div id="today"><h2>Gợi ý hôm nay</h2><div class="ls">${items.map(([h, tp, t]) => `<a class="li today" href="${h}"><span class="t"><span class="tp">${esc(tp)}</span>${esc(t)}</span><span class="go">Bắt đầu</span></a>`).join('')}</div></div>`;
  }
  function lessonItem(id, tp, text, sub, prep) {
    return `<a class="li" href="#/l/${encodeURIComponent(id)}"><span class="t"><span class="tp">${esc(tp)}${prep ? ' <span class="prep"></span>' : ''}</span>${esc(text)}${sub ? `<span class="ls-sub">${esc(sub)}</span>` : ''}</span>
      <span class="dots" title="Mức đã đạt">${[1, 2, 3].map(l => `<i class="${passed(id, l) ? 'ok' : ''}"></i>`).join('')}</span></a>`;
  }

  /* ── bài luyện ── */
  async function openLesson(id, lvl) {
    let L = LESSONS.find(x => x.id === id) || myLesson(id);
    if (!L && id.startsWith('n-')) {
      await loadNews();
      const it0 = (NEWS.list || []).find(x => x.id === id);
      if (!CFG.gkey && !(it0 && NEWS.pre?.[it0.sid])) { $('#view').innerHTML = `<p class="note">Bài này chưa được soạn sẵn. Thêm Gemini key (miễn phí) trong <a href="#/set">Cài đặt</a> để app tự soạn.</p>`; return; }
      const t0 = Date.now(); let msg = 'Gemini đang soạn bài từ tin này';
      const draw = () => { const el = $('#gen-wait'); if (el) el.innerHTML = `<span class="spin"></span> ${msg}… ${Math.round((Date.now() - t0) / 1000)} giây`; };
      $('#view').innerHTML = `<p class="muted" id="gen-wait"></p>`; draw();
      const tick = setInterval(draw, 500);
      try { L = await newsLesson(id, () => { msg = 'Google đang bận, đang thử lại'; }); }
      catch (e) { clearInterval(tick); if (S.view !== 'lesson') return; $('#view').innerHTML = `<p class="note">${esc(e.message === 'NOKEY' ? 'Chưa có Gemini key.' : e.message)}</p><div class="row"><button class="btn pri" data-act="reopen">Thử lại</button><a class="btn" href="#/">Về danh sách</a></div>`; return; }
      clearInterval(tick);
      if (S.view !== 'lesson') return;
    }
    if (!L) { $('#view').innerHTML = '<p class="note">Không tìm thấy bài này.</p>'; return; }
    S.L = L; S.lvl = lvl >= 1 && lvl <= 3 ? lvl : recLevel(L.id);
    S.st = { sel: [], checked: false, hints: new Set(), shown: new Set(), said: '', phase: 'say' };
    paintLesson();
  }
  function seqOf(L) {
    if (L.topic === 'news') return (NEWS.list || []).map(x => x.id);
    if (L.topic === 'my') return (myGet().find(g => g.set === L.set) || { lessons: [] }).lessons.map(x => x.id);
    return LESSONS.filter(x => S.topic === 'all' || x.topic === S.topic).map(x => x.id).concat(LESSONS.map(x => x.id)).filter((v, i, a) => a.indexOf(v) === i);
  }
  function paintLesson() {
    const L = S.L, l = S.lvl;
    $('#view').innerHTML = `
      <div class="row" style="margin-bottom:10px"><a class="btn ghost" href="#/">‹ Bài nói</a><span class="grow small muted">${esc(topicName(L.topic))}${L.src ? ' · ' + esc(L.src) : ''}</span></div>
      <div class="tabs" role="tablist">${[1, 2, 3].map(k => `<button role="tab" data-lvl="${k}" class="${k === l ? 'on' : ''}">${LV[k][0]} <span class="small">${LV[k][1]}</span>${passed(L.id, k) ? ' <span class="ok">✓</span>' : ''}</button>`).join('')}</div>
      <div class="card" style="margin-top:12px" id="drill">${l === 1 ? lvl1Html() : l === 2 ? lvl2Html() : lvl3Html()}</div>
      <div id="res"></div>`;
  }
  const viBlock = () => `<div class="src">Đề tiếng Việt</div><p class="vi" id="vi">${S.lvl === 2 ? viMarked() : esc(S.L.vi)}</p>`;
  function viMarked() {
    const L = S.L, vi = L.vi, low = vi.toLowerCase(); const marks = [];
    L.keys.slice().sort((a, b) => b[0].length - a[0].length).forEach(([v, e], k) => {
      const at = low.indexOf(String(v).toLowerCase());
      if (at < 0 || marks.some(m => at < m.e && at + v.length > m.s)) return;
      marks.push({ s: at, e: at + v.length, k: L.keys.indexOf(L.keys.find(x => x[0] === v)), en: e });
    });
    marks.sort((a, b) => a.s - b.s);
    let out = '', p = 0;
    marks.forEach(m => { out += esc(vi.slice(p, m.s)) + `<u data-key="${m.k}" class="${S.st.shown.has(m.k) ? 'shown' : ''}">${esc(vi.slice(m.s, m.e))}${S.st.shown.has(m.k) ? `<em>${esc(m.en)}</em>` : ''}</u>`; p = m.e; });
    return out + esc(vi.slice(p));
  }
  function micHtml(label) {
    return `<div class="mic-wrap"><button class="mic" id="mic" aria-label="Bấm để nói">${I.mic}</button>
      <div class="mic-lb" id="mic-lb">${esc(label)}</div><div class="live" id="live"></div>
      <button class="btn ghost small" data-act="type">Gõ thay vì nói</button>
      <div class="typed" id="typed" hidden><input id="typed-in" placeholder="Gõ câu tiếng Anh của bạn" autocomplete="off"><button class="btn pri" data-act="typed-go">Chấm</button></div></div>`;
  }
  /* Mức 1 (24/11/2026, người dùng: các từ rời rạc, không liền mạch thành câu): câu tiếng Anh hiện LIỀN MỘT KHỐI, mỗi chỗ trống là 1 ô trong câu;
     bên dưới là các từ của ô đang chọn — chạm 1 từ ⇒ điền vào ô, tự sang ô trống kế tiếp; chạm lại 1 ô trong câu để đổi từ. */
  function lvl1Html() {
    const L = S.L, st = S.st, parts = L.en.split(/\[\[(.+?)\]\]/), n = (parts.length - 1) / 2;
    const optsOf = b => shuffleSeeded([parts[2 * b + 1], ...(L.d[b] || [])], L.id + b);
    if (!(st.cur >= 0 && st.cur < n)) st.cur = Math.max(0, st.sel.findIndex((x, i) => i < n && !x));
    if (!(st.cur < n)) st.cur = 0;
    let en = '';
    parts.forEach((p, i) => {
      if (i % 2 === 0) { en += esc(p); return; }
      const b = (i - 1) / 2, ans = p, sel = st.sel[b] || '';
      const w = Math.max(...optsOf(b).map(o => o.length));
      let cls = 'slot', inner = esc(sel);
      if (st.checked) { cls += sel === ans ? ' right' : ' wrong'; if (sel !== ans) inner = `<s>${esc(sel)}</s><b>${esc(ans)}</b>`; }
      else { if (sel) cls += ' fill'; if (b === st.cur) cls += ' on'; if (b === st.pop) cls += ' pop'; }
      en += `<button type="button" class="${cls}" data-slot="${b}" style="min-width:${Math.min(11, w * 0.56 + 1.1).toFixed(1)}em"${st.checked ? ' tabindex="-1"' : ''} aria-label="Chỗ trống ${b + 1}${sel ? ': ' + esc(sel) : ''}">${inner}</button>`;
    });
    st.pop = null;
    const chosen = st.sel.filter(Boolean).length;
    if (st.checked) {
      return `${viBlock()}<div class="src">Câu tiếng Anh</div><p class="l1-sent">${en}</p>
        <div class="row" style="margin-top:12px"><button class="btn" data-say="${esc(clean(L.en))}">${I.play} Nghe mẫu</button><button class="btn" data-say="${esc(clean(L.en))}" data-rate="0.75">${I.slow} Nghe chậm</button></div>
        ${micHtml('Bấm micro và đọc to cả câu tiếng Anh')}`;
    }
    const opts = optsOf(st.cur);
    return `${viBlock()}<div class="src">Điền từ vào câu tiếng Anh</div><p class="l1-sent">${en}</p>
      <div class="l1-bank"><div class="lbl"><span>Chọn từ cho ô ${st.cur + 1}/${n}</span><span>Đã điền ${chosen}/${n}</span></div>
        <div class="l1-opts">${opts.map((o, k) => `<button type="button" data-pick="${esc(o)}" class="${st.sel[st.cur] === o ? 'on' : ''}" title="Phím ${k + 1}">${esc(o)}</button>`).join('')}</div>
        <div class="l1-hint">Chạm một ô trong câu để đổi từ.</div></div>
      <div class="row" style="margin-top:14px"><span class="grow"></span><button class="btn pri" data-act="check"${chosen < n ? ' disabled' : ''}>Kiểm tra</button></div>`;
  }
  function lvl2Html() {
    const L = S.L, h = S.st.hints;
    return `${viBlock()}<div class="small muted">Chạm vào chữ gạch chân để xem tiếng Anh.</div>
      <div class="hints">
        <button class="btn${h.has('keys') ? ' used' : ''}" data-hint="keys">Từ khoá</button>
        <button class="btn${h.has('frame') ? ' used' : ''}" data-hint="frame">Khung câu</button>
        <button class="btn${h.has('chunks') ? ' used' : ''}" data-hint="chunks">Chia nhỏ</button>
        <button class="btn${h.has('listen') ? ' used' : ''}" data-hint="listen">Nghe mẫu</button>
      </div>
      <div id="hint-area">${hintArea()}</div>
      ${micHtml('Bấm micro và nói đoạn trên bằng tiếng Anh')}`;
  }
  function hintArea() {
    const L = S.L, h = S.st.hints; let o = '';
    if (h.has('keys')) o += `<div class="hbox"><div class="lbl">Từ khoá</div><table class="kt">${L.keys.map(([v, e]) => `<tr><td>${esc(v)}</td><td>${esc(e)}</td><td style="width:30px"><button class="say" data-say="${esc(String(e).split(/\s*[\/(]/)[0].replace('…', ''))}" aria-label="Nghe">${I.play}</button></td></tr>`).join('')}</table></div>`;
    if (h.has('frame')) o += `<div class="hbox"><div class="lbl">Khung câu</div><div class="frame">${frameOf(L.en)}</div></div>`;
    if (h.has('chunks')) o += `<div class="hbox"><div class="lbl">Chia nhỏ · chạm để xem tiếng Anh</div>${L.chunks.map(([v, e], i) => `<div class="chunk"><span class="v">${esc(v)}</span><button class="btn ghost small" data-chunk="${i}">${S.st.shown.has('c' + i) ? `<span class="e">${esc(e)}</span>` : 'Xem'}</button></div>`).join('')}</div>`;
    return o;
  }
  const lvl3Html = () => `${viBlock()}<p class="small muted" style="margin-top:8px">Không có gợi ý. Nói trọn ý đoạn trên bằng tiếng Anh, câu không cần giống mẫu.</p>${micHtml('Bấm micro rồi nói, bấm lần nữa để dừng')}`;

  function pickL1(o) {
    const st = S.st, n = blanksOf(S.L.en).length;
    st.sel[st.cur] = o; st.pop = st.cur;
    for (let k = 1; k <= n; k++) { const j = (st.cur + k) % n; if (!st.sel[j]) { st.cur = j; break; } }   // sang ô còn trống kế tiếp
    $('#drill').innerHTML = lvl1Html();
    if (st.sel.filter(Boolean).length >= n) $('[data-act="check"]')?.focus({ preventScroll: true });
  }

  /* micro: bấm để nói, bấm lần nữa để dừng; xong ⇒ chấm */
  function micToggle(onDone) {
    const btn = $('#mic'), lb = $('#mic-lb'), live = $('#live');
    if (Rec.on) { Rec.stop(); return; }
    if (!SR) { toast(recErr('nosupport'), 4000); $('#typed') && ($('#typed').hidden = false); return; }
    btn.classList.add('rec'); btn.innerHTML = I.stop; lb.textContent = 'Đang nghe… bấm để dừng'; live.textContent = '';
    Rec.start(t => { live.textContent = t; }, r => {
      btn.classList.remove('rec'); btn.innerHTML = I.mic; lb.textContent = 'Bấm micro để nói lại';
      if (!r.text) { const m = recErr(r.err); if (m) toast(m, 4500); else toast('Chưa nghe rõ, thử lại nhé.'); return; }
      live.textContent = r.text; onDone(r.text);
    });
  }

  /* ── chấm ── */
  function ring(score, label) {
    const c = score >= PASS ? 'var(--accent)' : score >= 50 ? 'var(--gold)' : 'var(--red)';
    return `<div class="score"><div class="ring" style="--p:${score};--c:${c}"><b>${score}</b></div><div><b>${esc(label)}</b><div class="small muted">${score >= PASS ? 'Đạt' : 'Chưa đạt ' + PASS + ' điểm, thử lại nhé'}</div></div></div>`;
  }
  function wordsHtml(a) { return `<div class="words">${a.disp.map((w, i) => `<span class="w-${a.marks[i]}">${esc(w)}</span>`).join(' ')}</div>`; }
  const legend = `<div class="legend"><span><i style="background:var(--accent)"></i>Nghe rõ</span><span><i style="background:var(--gold)"></i>Gần đúng</span><span><i style="background:var(--red)"></i>Chưa nghe ra</span></div>`;
  const pronNote = '<div class="small muted">Điểm đọc ước lượng từ việc máy nghe ra đúng từ nào. Từ đỏ / vàng: đọc chậm lại, rõ âm cuối.</div>';

  function doneL1(text) {
    const L = S.L, a = align(clean(L.en), text);
    const bl = blanksOf(L.en), right = bl.filter((b, i) => S.st.sel[i] === b).length;
    const score = Math.round(right / bl.length * 40 + a.score * 0.6);
    record(L.id, 1, score);
    $('#res').innerHTML = `<div class="res"><div class="card">${ring(score, `Chọn đúng ${right}/${bl.length} · Đọc ${a.score}%`)}
      <div style="margin-top:12px">${wordsHtml(a)}</div>${legend}${pronNote}</div>${nextHtml(1, score)}</div>`;
    paintTabs();
  }
  function hintPenalty() { const h = S.st.hints; return (h.has('keys') ? 3 : 0) + (h.has('frame') ? 6 : 0) + (h.has('chunks') ? 6 : 0) + (h.has('listen') ? 10 : 0) + Math.min(5, S.st.shown.size); }
  function offlineEval(text) {
    const L = S.L;
    const ideas = L.ideas.map(([vi, g]) => ({ vi, ok: ideaHit(text, g), note: '' }));
    const score = ideas.length ? Math.round(ideas.filter(x => x.ok).length / ideas.length * 100) : align(clean(L.en), text).score;
    return { score, ideas, corrected: clean(L.en), better: L.alt, errors: [], keywords: [], grammar: L.grammar.map(([point, vi]) => ({ point, vi })), praise: '', offline: true };
  }
  async function doneSpeak(text) {
    const L = S.L, lvl = S.lvl;
    S.st.said = text;
    let R = offlineEval(text);
    paintResult(R, text, CFG.gkey ? 'wait' : '');
    if (CFG.gkey) {
      try {
        const g = await gem(EVAL_SYS, JSON.stringify({ vietnamese: L.vi, reference_english: clean(L.en), key_vocabulary: L.keys, level: lvl, hints_used: [...S.st.hints], learner_said: text }));
        if (S.L !== L || S.st.said !== text) return;
        R = {
          score: Math.max(0, Math.min(100, Math.round(+g.score || 0))), ideas: (g.ideas || []).map(x => ({ vi: x.vi, ok: !!x.ok, note: x.note || '' })),
          corrected: g.corrected || clean(L.en), better: (g.better || []).filter(Boolean), errors: g.errors || [], keywords: g.keywords || [],
          grammar: (g.grammar || []).map(x => ({ point: x.point, vi: x.vi, ex: x.ex })), praise: g.praise || ''
        };
        paintResult(R, text, '');
      } catch (e) { paintResult(R, text, e.message === 'NOKEY' ? '' : e.message); }
    }
  }
  function paintResult(R, said, state) {
    const L = S.L, lvl = S.lvl, pen = lvl === 2 ? hintPenalty() : 0, final = Math.max(0, R.score - pen);
    if (state !== 'wait') {
      record(L.id, lvl, final);
      (R.keywords.length ? R.keywords.map(k => [k.vi, k.en]) : R.ideas.filter(x => !x.ok).flatMap(x => L.keys.filter(k => x.vi.toLowerCase().includes(k[0].toLowerCase()) || k[0].toLowerCase().includes(x.vi.toLowerCase()))))
        .forEach(([vi, en]) => addWord(en, vi, R.corrected, topicName(L.topic)));
    }
    S.st.target = R.corrected;
    $('#res').innerHTML = `<div class="res">
      <div class="card">${ring(final, 'Đúng ý' + (pen ? ` (trừ ${pen} điểm gợi ý)` : ''))}${R.praise ? `<p style="margin:10px 0 0">${esc(R.praise)}</p>` : ''}
        <div class="lbl" style="margin-top:12px">Bạn nói</div><div class="said">${esc(said)}</div>
        ${R.ideas.length ? `<div class="lbl" style="margin-top:12px">Các ý trong đoạn</div><ul class="ideas">${R.ideas.map(x => `<li class="${x.ok ? '' : 'no'}">${esc(x.vi)}${x.note ? ` <span>· ${esc(x.note)}</span>` : ''}</li>`).join('')}</ul>` : ''}
        ${state === 'wait' ? '<p class="small muted" style="margin-top:10px"><span class="spin"></span> Gemini đang chấm chi tiết…</p>' : state ? `<p class="note" style="margin-top:10px">${esc(state)} Đang dùng cách chấm có sẵn.</p>` : ''}</div>
      <div class="card"><div class="lbl">${R.offline ? 'Câu tham khảo' : 'Câu của bạn, đã sửa'}</div><p class="best">${esc(R.corrected)} <button class="say" data-say="${esc(R.corrected)}" aria-label="Nghe">${I.play}</button></p>
        ${R.better.length ? `<div class="lbl" style="margin-top:12px">Cách nói khác</div>${R.better.map(b => `<p class="best" style="font-size:17px">${esc(b)} <button class="say" data-say="${esc(b)}" aria-label="Nghe">${I.play}</button></p>`).join('')}` : ''}</div>
      ${R.errors.length ? `<div class="card"><div class="lbl">Sửa lỗi</div><div class="err">${R.errors.map(e => `<div><s>${esc(e.you)}</s> → <b>${esc(e.fix)}</b><br><span class="small muted">${esc(e.why)}</span></div>`).join('')}</div></div>` : ''}
      <div class="card"><div class="lbl">Từ khoá của đoạn</div><table class="kt">${(R.keywords.length ? R.keywords.map(k => [k.vi, k.en]) : L.keys).map(([v, e]) => `<tr><td>${esc(v)}</td><td>${esc(e)}</td></tr>`).join('')}</table>
        ${R.grammar.length ? `<div class="lbl" style="margin-top:14px">Ngữ pháp</div><div class="gram">${R.grammar.map(g => `<div><b>${esc(g.point)}</b><span>${esc(g.vi || '')}${g.ex ? ` — <i>${esc(g.ex)}</i>` : ''}</span></div>`).join('')}</div>` : ''}
        ${R.offline && !CFG.gkey ? `<p class="small muted" style="margin-top:12px">Thêm Gemini key (miễn phí) trong <a href="#/set">Cài đặt</a> để được sửa từng lỗi trong câu của bạn.</p>` : ''}</div>
      <div class="card" id="shadow"><div class="lbl">Nói lại câu chuẩn</div><p class="small muted" style="margin:0 0 6px">Nghe câu trên, rồi đọc lại để luyện phát âm và ngữ điệu.</p>
        <div class="row"><button class="btn" data-say="${esc(R.corrected)}">${I.play} Nghe</button><button class="btn" data-say="${esc(R.corrected)}" data-rate="0.75">${I.slow} Nghe chậm</button><button class="btn pri" data-act="shadow">${I.mic} Đọc lại</button></div>
        <div id="shadow-res"></div></div>
      ${state === 'wait' ? '' : nextHtml(lvl, final)}</div>`;
    paintTabs();
  }
  function nextHtml(lvl, score) {
    const L = S.L, seq = seqOf(L), i = seq.indexOf(L.id), nx = seq[i + 1];
    return `<div class="row"><button class="btn" data-act="retry">Làm lại</button>
      ${lvl < 3 ? `<a class="btn${score >= PASS ? ' pri' : ''}" href="#/l/${encodeURIComponent(L.id)}/${lvl + 1}">Lên ${LV[lvl + 1][0]}</a>` : ''}
      ${nx ? `<a class="btn${lvl === 3 && score >= PASS ? ' pri' : ''}" href="#/l/${encodeURIComponent(nx)}">Đoạn tiếp theo</a>` : ''}</div>`;
  }
  function paintTabs() { $$('.tabs button').forEach(b => { const k = +b.dataset.lvl; b.innerHTML = `${LV[k][0]} <span class="small">${LV[k][1]}</span>${passed(S.L.id, k) ? ' <span class="ok">✓</span>' : ''}`; }); }
  function shadowGo() {
    const box = $('#shadow-res'), btn = $('[data-act="shadow"]');
    if (Rec.on) { Rec.stop(); return; }
    if (!SR) { toast(recErr('nosupport'), 4000); return; }
    btn.innerHTML = I.stop + ' Dừng'; box.innerHTML = '<div class="live" id="sh-live"></div>';
    Rec.start(t => { const l = $('#sh-live'); if (l) l.textContent = t; }, r => {
      btn.innerHTML = I.mic + ' Đọc lại';
      if (!r.text) { toast(recErr(r.err) || 'Chưa nghe rõ, thử lại nhé.', 4000); box.innerHTML = ''; return; }
      const a = align(S.st.target, r.text);
      box.innerHTML = `<div style="margin-top:10px">${ring(a.score, 'Đọc rõ')}</div><div style="margin-top:8px">${wordsHtml(a)}</div>${legend}`;
    });
  }

  /* ── Sổ từ ── */
  function renderWords() {
    const due = dueWords();
    $('#view').innerHTML = `<h1>Sổ từ</h1><p class="sub">Từ khoá bạn đã mở gợi ý hoặc nói chưa đúng tự vào đây. App nhắc ôn lại sau 1, 3, 7, 14, 30 ngày.</p>
      <div id="flash"></div>
      <h2>Tất cả (${WORDS.length})</h2>
      <div class="ls">${WORDS.length ? WORDS.map((w, i) => `<div class="wc"><div class="v"><b>${esc(w.vi || '—')}</b><span>${esc(w.en)}</span><small>${esc(w.src)}${w.due > today() ? ' · ôn lại ' + w.due.split('-').reverse().slice(0, 2).join('/') : ' · đến hạn ôn'}</small></div>
        <button class="say" data-say="${esc(w.en)}" aria-label="Nghe">${I.play}</button><button class="btn ghost small" data-del="${i}" aria-label="Xoá">Xoá</button></div>`).join('') : '<div class="muted small">Chưa có từ nào. Làm vài bài luyện là có.</div>'}</div>`;
    paintFlash(due);
  }
  function paintFlash(due) {
    const box = $('#flash'); if (!box) return;
    if (!due.length) { box.innerHTML = WORDS.length ? '<div class="card small muted">Hôm nay không còn từ nào cần ôn.</div>' : ''; return; }
    const w = due[0];
    box.innerHTML = `<div class="card flash"><div class="small muted">Còn ${due.length} từ cần ôn · nói tiếng Anh của:</div>
      <div class="q">${esc(w.vi || w.ex || w.en)}</div><div class="a" id="fa" hidden>${esc(w.en)}</div>${w.ex ? `<div class="ex" id="fx" hidden>${esc(w.ex)}</div>` : ''}
      <div class="row" style="justify-content:center;margin-top:16px" id="fb1"><button class="btn pri" data-act="reveal">Xem đáp án</button></div>
      <div class="row" style="justify-content:center;margin-top:16px" id="fb2" hidden><button class="say" data-say="${esc(w.en)}">${I.play}</button>
        <button class="btn" data-know="0">Chưa nhớ</button><button class="btn pri" data-know="1">Đã nhớ</button></div></div>`;
  }
  function know(ok) {
    const w = dueWords()[0]; if (!w) return;
    w.step = ok ? Math.min((w.step || 0) + 1, STEPS.length - 1) : 0;
    w.due = addDays(today(), ok ? STEPS[w.step] : 1);
    LS.set('mmh_coach_words', WORDS); paintFlash(dueWords());
  }

  /* ── Cài đặt ── */
  function renderSet() {
    $('#view').innerHTML = `<h1>Cài đặt</h1><p class="sub">Key chỉ lưu trên máy này, không gửi về máy chủ MMH. Máy khác cần nhập lại.</p>
      <div class="card">
        <div class="lbl">Gemini · chấm ý, sửa câu, soạn bài từ bản tin</div>
        <div class="fld"><label for="gkey">Gemini API key</label><input id="gkey" type="password" autocomplete="off" value="${esc(CFG.gkey)}" placeholder="Dán key từ aistudio.google.com">
          <small>Lấy miễn phí ở aistudio.google.com ▸ Get API key, không cần thẻ. Gói miễn phí: Google có thể dùng nội dung để cải thiện sản phẩm, đừng nói số liệu mật của công ty khi luyện.</small></div>
        <div class="fld"><label for="gmodel">Mẫu Gemini</label><select id="gmodel"><option value="${esc(CFG.gmodel)}">${esc(CFG.gmodel || 'Tự chọn khi chấm lần đầu')}</option></select></div>
        <div class="row"><button class="btn" data-act="gload">Tải danh sách mẫu</button><button class="btn pri" data-act="gtest">Lưu & thử</button><span class="small muted" id="gmsg"></span></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="lbl">Giọng đọc mẫu</div>
        <div class="fld"><label for="voice">Giọng trình duyệt (miễn phí)</label><select id="voice"></select><small>Chrome / Edge có giọng "Natural", "Online" nghe tự nhiên hơn.</small></div>
        <div class="fld"><label for="rate">Tốc độ đọc: <b id="rate-v">${CFG.rate}</b></label><input id="rate" type="range" min="0.6" max="1.2" step="0.05" value="${CFG.rate}"></div>
        <details ${CFG.akey ? 'open' : ''}><summary class="small" style="cursor:pointer;font-weight:600">Giọng Azure Neural (tuỳ chọn, miễn phí 0,5 triệu ký tự / tháng)</summary>
          <div class="fld" style="margin-top:10px"><label for="akey">Azure Speech key</label><input id="akey" type="password" autocomplete="off" value="${esc(CFG.akey)}"></div>
          <div class="fld"><label for="areg">Vùng (region)</label><input id="areg" value="${esc(CFG.areg)}" placeholder="vd. southeastasia"></div>
          <div class="fld"><label for="avoice">Giọng Azure</label><select id="avoice">${['en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-AvaNeural', 'en-US-AndrewNeural', 'en-US-EmmaNeural', 'en-US-BrianNeural', 'en-US-GuyNeural', 'en-GB-SoniaNeural', 'en-GB-RyanNeural'].map(v => `<option${v === CFG.avoice ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        </details>
        <div class="row" style="margin-top:8px"><button class="btn" data-act="vsave">${I.play} Lưu & nghe thử</button></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="lbl">Mục tiêu & dữ liệu</div>
        <div class="fld"><label for="goal">Mục tiêu mỗi ngày (phút)</label><input id="goal" type="number" min="5" max="60" value="${CFG.goal}"></div>
        <div class="row"><button class="btn" data-act="goal">Lưu mục tiêu</button><button class="btn ghost" data-act="reset">Xoá tiến độ học</button></div>
      </div>`;
    paintVoices();
  }
  function paintVoices() {
    const sel = $('#voice'); if (!sel) return;
    const vs = Voice.list();
    sel.innerHTML = `<option value="">Tự chọn giọng tốt nhất</option>` + vs.map(v => `<option${v.name === CFG.voice ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
  }

  /* ── sự kiện ── */
  $('#view').addEventListener('click', async e => {
    const t = e.target.closest('button, u, a'); if (!t) return;
    const ds = t.dataset;
    if (ds.say != null) { Voice.say(ds.say, ds.rate ? +ds.rate : CFG.rate); return; }
    if (ds.topic) { S.topic = ds.topic; LS.set('mmh_coach_topic', S.topic); renderHome(); return; }
    if (ds.lvl) { location.hash = `#/l/${encodeURIComponent(S.L.id)}/${ds.lvl}`; return; }
    if (ds.slot != null && S.lvl === 1 && !S.st.checked) { S.st.cur = +ds.slot; $('#drill').innerHTML = lvl1Html(); return; }
    if (ds.pick != null && S.lvl === 1 && !S.st.checked) { pickL1(ds.pick); return; }
    if (ds.key != null && t.tagName === 'U') {
      const k = +ds.key; S.st.shown.add(k); const kk = S.L.keys[k];
      if (kk) addWord(kk[1], kk[0], clean(S.L.en), topicName(S.L.topic));
      $('#vi').innerHTML = viMarked(); return;
    }
    if (ds.hint) {
      S.st.hints.add(ds.hint);
      if (ds.hint === 'keys') S.L.keys.forEach(([v, en]) => addWord(en, v, clean(S.L.en), topicName(S.L.topic)));
      if (ds.hint === 'listen') Voice.say(clean(S.L.en));
      t.classList.add('used'); $('#hint-area').innerHTML = hintArea(); return;
    }
    if (ds.chunk != null) { S.st.shown.add('c' + ds.chunk); $('#hint-area').innerHTML = hintArea(); return; }
    if (ds.del != null) { WORDS.splice(+ds.del, 1); LS.set('mmh_coach_words', WORDS); renderWords(); return; }
    if (ds.know != null) { know(ds.know === '1'); return; }
    if (t.id === 'mic') { micToggle(S.lvl === 1 ? doneL1 : doneSpeak); return; }
    if (ds.mytheme) { $('#my-theme').value = ds.mytheme; $('[data-act="my-go"]').click(); return; }
    if (ds.mydel) {
      if (t.dataset.sure) { LS.set('mmh_coach_my', myGet().filter(g => g.set !== ds.mydel)); $('#my-sets').innerHTML = mySetsHtml(); }
      else { t.dataset.sure = 1; t.textContent = 'Bấm lần nữa để xoá'; }
      return;
    }
    switch (ds.act) {
      case 'reopen': route(); return;
      case 'my-go': {
        const th = $('#my-theme').value.trim(); if (!th) { $('#my-theme').focus(); return; }
        if (!CFG.gkey) { $('#my-msg').innerHTML = 'Cần Gemini key. Vào <a href="#/set">Cài đặt</a> để thêm.'; return; }
        if (t.disabled) return; t.disabled = true;
        const t0 = Date.now(); let msg = 'Gemini đang soạn 5 đoạn';
        const tick = setInterval(() => { const m = $('#my-msg'); if (m) m.innerHTML = `<span class="spin"></span> ${msg}… ${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
        try {
          const ls = await myCreate(th, () => { msg = 'Google đang bận, đang thử lại'; });
          clearInterval(tick); if (S.view !== 'home') return;
          $('#my-msg').textContent = `Đã tạo ${ls.length} đoạn. Bấm vào đoạn đầu để học.`; $('#my-theme').value = '';
          $('#my-sets').innerHTML = mySetsHtml(); $('#my-sets').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (er) { clearInterval(tick); const m = $('#my-msg'); if (m) m.textContent = er.message === 'NOKEY' ? 'Chưa có Gemini key.' : er.message; }
        t.disabled = false; return;
      }
      case 'check': {
        S.st.checked = true; const bl = blanksOf(S.L.en);
        bl.forEach((b, i) => { if (S.st.sel[i] !== b) { const k = S.L.keys.find(x => x[1].toLowerCase().includes(b.toLowerCase())); addWord(b, k ? k[0] : '', clean(S.L.en), topicName(S.L.topic)); } });
        $('#drill').innerHTML = lvl1Html(); return;
      }
      case 'type': { const b = $('#typed'); b.hidden = !b.hidden; if (!b.hidden) $('#typed-in').focus(); return; }
      case 'typed-go': { const v = $('#typed-in').value.trim(); if (!v) return; (S.lvl === 1 ? doneL1 : doneSpeak)(v); return; }
      case 'retry': S.st = { sel: [], checked: false, hints: new Set(), shown: new Set(), said: '' }; paintLesson(); return;
      case 'shadow': shadowGo(); return;
      case 'reveal': $('#fa').hidden = false; $('#fx') && ($('#fx').hidden = false); $('#fb1').hidden = true; $('#fb2').hidden = false; return;
      case 'gload': {
        CFG.gkey = $('#gkey').value.trim(); saveCfg(); $('#gmsg').innerHTML = '<span class="spin"></span>';
        try {
          const ms = await gemModels(), b = bestModel(ms);
          $('#gmodel').innerHTML = ms.map(m => `<option value="${esc(m.id)}"${m.id === (CFG.gmodel || b?.id) ? ' selected' : ''}>${esc(m.label)} · ${esc(m.id)}</option>`).join('');
          $('#gmsg').textContent = `${ms.length} mẫu. Gợi ý: ${b ? b.id : '—'}`;
        } catch (er) { $('#gmsg').textContent = er.message; }
        return;
      }
      case 'gtest': {
        CFG.gkey = $('#gkey').value.trim(); CFG.gmodel = $('#gmodel').value || CFG.gmodel; saveCfg();
        if (!CFG.gkey) { $('#gmsg').textContent = 'Đã xoá key.'; return; }
        const t0 = Date.now(); let step = 'Đang kiểm tra key';
        const tick = setInterval(() => { const g = $('#gmsg'); if (g) g.innerHTML = `<span class="spin"></span> ${step}… ${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
        try {
          const ms = await gemModels();
          const b = bestModel(ms);
          if (!b) throw new Error('Key đúng nhưng chưa thấy mẫu Gemini nào dùng được.');
          if (!ms.some(m => m.id === CFG.gmodel)) { CFG.gmodel = b.id; saveCfg(); }
          step = 'Key đúng · đang thử mẫu ' + CFG.gmodel;
          const r = await gem('Return JSON {"ok":true,"hi":"one short Vietnamese greeting"}', 'ping');
          $('#gmsg').textContent = `Chạy tốt${r.hi ? ': ' + r.hi : ''} · mẫu ${CFG.gmodel} · ${((Date.now() - t0) / 1000).toFixed(1)} giây`;
          $('#gmodel').innerHTML = ms.map(m => `<option value="${esc(m.id)}"${m.id === CFG.gmodel ? ' selected' : ''}>${esc(m.label)} · ${esc(m.id)}</option>`).join('');
        } catch (er) { $('#gmsg').textContent = er.message === 'Failed to fetch' ? 'Không kết nối được tới Google. Kiểm tra mạng, tắt VPN / chặn quảng cáo rồi thử lại.' : er.message; }
        finally { clearInterval(tick); }
        return;
      }
      case 'vsave':
        CFG.voice = $('#voice').value; CFG.rate = +$('#rate').value; CFG.akey = $('#akey').value.trim(); CFG.areg = $('#areg').value.trim(); CFG.avoice = $('#avoice').value; saveCfg();
        Voice.say('Hello! Let’s practice English together for ten minutes today.'); return;
      case 'goal': CFG.goal = Math.max(5, Math.min(60, +$('#goal').value || 10)); saveCfg(); toast('Đã lưu mục tiêu.'); return;
      case 'reset':
        if (t.dataset.sure) { for (const k in PROG) delete PROG[k]; saveProg(); LS.set('mmh_coach_day', {}); toast('Đã xoá tiến độ (Sổ từ giữ nguyên).'); renderSet(); }
        else { t.dataset.sure = 1; t.textContent = 'Bấm lần nữa để xoá'; }
        return;
    }
  });
  $('#view').addEventListener('input', e => { if (e.target.id === 'rate') $('#rate-v').textContent = e.target.value; });
  document.addEventListener('keydown', e => {
    if (S.view !== 'lesson' || S.lvl !== 1 || S.st.checked || e.target.closest('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key)) { const b = $$('.l1-opts button')[+e.key - 1]; if (b) { e.preventDefault(); pickL1(b.dataset.pick); } }
  });
  $('#view').addEventListener('keydown', e => {
    if (e.target.id === 'typed-in' && e.key === 'Enter') { e.preventDefault(); $('[data-act="typed-go"]').click(); }
    if (e.target.id === 'my-theme' && e.key === 'Enter') { e.preventDefault(); $('[data-act="my-go"]').click(); }
  });

  window.COACH = { align, ideaHit, toks, S, CFG, gem, gemPost, Voice, toast, esc, LS, saveCfg };
  route();
})();
