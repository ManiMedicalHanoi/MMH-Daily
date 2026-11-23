// MMH Daily — "Học bài này": bài học có hướng dẫn từng bước, dựng từ ed.study (tools/edition.mjs ▸ studyWrite) + lời thoại podcast.
// 1 Từ khoá (thẻ lật, nghe phát âm, Biết / Chưa biết ⇒ Sổ từ) · 2 Nghe (phụ đề lớn, ẩn / hiện, từ khoá tô màu, tốc độ) ·
// 3 Kiểm tra nghe (từng câu, đúng / sai ngay, nghe lại đúng đoạn) · 4 Nói theo (cụm hay + ngữ pháp, chấm bằng nhận diện giọng nói của trình duyệt) · Tổng kết.
// Tiến độ lưu trên máy: mmh_daily_lesson:<ngày>, kết quả kiểm tra mmh_daily_quiz:<ngày>, Sổ từ = mmh_coach_words (dùng chung Luyện nói).
(function () {
  const D = window.DAILY; if (!D) return;
  const esc = D.esc, store = D.store, audio = D.audio;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const STEPS = [['words', 'Từ khoá'], ['listen', 'Nghe'], ['quiz', 'Kiểm tra'], ['speak', 'Nói theo'], ['done', 'Tổng kết']];
  const KIND = { gist: 'Ý chính', detail: 'Chi tiết', vocab: 'Từ trong ngữ cảnh', inference: 'Suy luận' };
  let ed = null, L = null, segEnd = null, rec = null;
  const lk = d => 'mmh_daily_lesson:' + d, qk = d => 'mmh_daily_quiz:' + d;
  const load = d => Object.assign({ step: 'words', i: 0, known: {}, spoke: {}, sub: 'en' }, store.get(lk(d), {}));
  const save = () => store.set(lk(ed.date), L);
  const quiz = () => store.get(qk(ed.date), {});
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  /* ── Sổ từ ── */
  const book = () => store.get('mmh_coach_words', []) || [];
  const inBook = en => book().some(w => w.en.toLowerCase() === String(en).toLowerCase());
  function addBook(en, vi, ex) {
    const W = book(); if (W.some(w => w.en.toLowerCase() === en.toLowerCase())) return false;
    W.unshift({ en, vi: vi || '', ex: ex || '', src: 'Podcast ' + D.viDate(ed.date), at: Date.now(), due: today(), step: 0 });
    store.set('mmh_coach_words', W); return true;
  }

  /* ── âm thanh: nghe đúng một đoạn (từ câu i tới hết câu j) ── */
  const T = () => ed.podcast.turns;
  function playSeg(i, j = i) {
    const t0 = T()[i]?.t; if (t0 == null || !D.setEp(ed)) { D.toast('Podcast chưa có âm thanh'); return; }
    const nx = T().slice(j + 1).find(t => t.t != null);
    segEnd = nx ? nx.t - 0.15 : null; audio.currentTime = t0; audio.play();
  }
  audio.addEventListener('timeupdate', () => {
    if (segEnd != null && audio.currentTime >= segEnd) { audio.pause(); segEnd = null; }
    if (L && L.step === 'listen' && document.getElementById('ls2-line')) paintLine();
  });
  const say = (text, rate = 0.9) => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate; speechSynthesis.speak(u); } catch { D.toast('Máy không đọc được'); } };

  /* ── thẻ vào bài trên trang Nghe ── */
  function progress(date, s) {
    const l = load(date), q = store.get(qk(date), {}), nq = s.quiz?.length || 0;
    const done = Object.keys(q).length, right = (s.quiz || []).filter((x, i) => q[i] === x.a).length;
    return { l, done, right, nq, finished: l.step === 'done' };
  }
  window.STUDY = {
    html(e) {
      ed = e; const s = e.study; if (!s || !(s.quiz?.length || s.words?.length)) return '';
      const p = progress(e.date, s), idx = STEPS.findIndex(([k]) => k === p.l.step);
      const L = (D.L || ((v) => v)), SN = { words: 'Keywords', listen: 'Listen', quiz: 'Quiz', speak: 'Speak' };
      return `<section class="ls-box st" id="study">
        <div class="st-hero"><div><h3>${L('Học bài này', 'Study this episode')}</h3><p>${L(`4 bước · khoảng 10 phút: ${s.words.length} từ khoá · nghe · ${p.nq} câu kiểm tra · ${s.phrases.length + s.grammar.length} câu nói theo`, `4 steps · about 10 minutes: ${s.words.length} keywords · listen · ${p.nq} questions · ${s.phrases.length + s.grammar.length} lines to repeat`)}</p>
          <div class="st-steps">${STEPS.slice(0, 4).map(([k, n], i) => `<span class="${i < idx || p.finished ? 'ok' : i === idx ? 'on' : ''}">${i + 1}. ${L(n, SN[k] || n)}</span>`).join('')}</div>
          ${p.done ? `<p class="st-sc">${L('Kiểm tra nghe', 'Listening quiz')}: <b>${p.right}/${p.nq}</b></p>` : ''}</div>
          <div class="st-btns"><a class="st-rk" href="#/rank">${L('Bảng xếp hạng', 'Ranking')}</a><button class="st-go" type="button" data-ls2="open">${p.finished ? L('Học lại', 'Study again') : idx > 0 ? L('Học tiếp', 'Continue') : L('Bắt đầu', 'Start')}</button></div></div>
        <details class="st-all"><summary>${L('Xem nhanh toàn bộ từ, cụm, ngữ pháp', 'All words, phrases and grammar')}</summary>
          <dl class="st-dl">${s.words.map(w => `<dt>${esc(w.en)}</dt><dd>${esc(w.vi)}</dd>`).join('')}${s.phrases.map(x => `<dt>${esc(x.en)}</dt><dd>${esc(x.vi)}</dd>`).join('')}${s.grammar.map(g => `<dt>${esc(g.p)}</dt><dd>${esc(g.vi)}</dd>`).join('')}</dl></details>
      </section>`;
    },
    tabs(e) {   // thanh chuyển nhanh đầu trang Nghe: Nghe · Học bài này · Luyện nói · Xếp hạng
      const s = e.study, ok = s && (s.quiz?.length || s.words?.length);
      const L = (D.L || ((v) => v));
      return `<nav class="ls-tabs" aria-label="${L('Chuyển nhanh', 'Quick links')}"><a class="on" href="#/listen/${e.date}">${L('Nghe', 'Listen')}</a>${ok ? `<button type="button" data-ls2="open">${L('Học bài này', 'Study this episode')}</button>` : ''}<a href="coach/#/">${L('Luyện nói', 'Speaking')}</a><a href="#/rank">${L('Xếp hạng', 'Ranking')}</a></nav>`;
    },
    open(e) { if (e) ed = e; if (!ed?.study) return; L = load(ed.date); if (L.step === 'done') Object.assign(L, { step: 'words', i: 0 }); ov.hidden = false; document.documentElement.classList.add('ls2-on'); render(); }
  };

  /* ── khung học toàn màn hình ── */
  const ov = document.createElement('div');
  ov.className = 'ls2'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Học bài này');
  document.body.appendChild(ov);
  const close = () => { ov.hidden = true; document.documentElement.classList.remove('ls2-on'); stopRec(); segEnd = null; const b = document.getElementById('study'); if (b) b.outerHTML = STUDY.html(ed); };
  function go(step, i = 0) { L.step = step; L.i = i; save(); render(); ov.querySelector('.ls2-body')?.scrollTo(0, 0); }

  function render() {
    const idx = STEPS.findIndex(([k]) => k === L.step);
    ov.innerHTML = `<header class="ls2-top"><button class="ls2-x" type="button" data-ls2="close" aria-label="Đóng">✕</button>
      <div class="ls2-bar">${STEPS.slice(0, 4).map(([k, n], i) => `<button type="button" data-ls2="step" data-k="${k}" class="${i < idx ? 'ok' : i === idx ? 'on' : ''}"><i></i><span>${n}</span></button>`).join('')}</div></header>
      <div class="ls2-body">${({ words: vWords, listen: vListen, quiz: vQuiz, speak: vSpeak, done: vDone })[L.step]()}</div>`;
    if (L.step === 'listen') paintLine(true);
    if (L.step === 'done') rankBox();
  }

  /* 1. Từ khoá: thẻ lật */
  function vWords() {
    const W = ed.study.words, i = Math.min(L.i, W.length - 1), w = W[i];
    return `<p class="ls2-k">Từ khoá trước khi nghe · ${i + 1}/${W.length}</p>
      <div class="ls2-card" data-ls2="flip" tabindex="0"><div class="ls2-w">${esc(w.en)}</div>
        <div class="ls2-back"><div class="ls2-vi">${esc(w.vi)}</div><div class="ls2-ex">“${esc(w.ex)}”</div></div>
        <div class="ls2-hint">Chạm để xem nghĩa</div></div>
      <div class="ls2-row"><button type="button" data-ls2="tts" data-t="${esc(w.en)}">Nghe phát âm</button><button type="button" data-ls2="seg" data-i="${w.turn}">Nghe trong podcast</button></div>
      <div class="ls2-act"><button type="button" class="b2" data-ls2="know" data-v="0">Chưa biết</button><button type="button" class="b1" data-ls2="know" data-v="1">Đã biết</button></div>
      <p class="ls2-note">"Chưa biết" tự thêm vào Sổ từ để ôn lại.</p>`;
  }

  /* 2. Nghe: phụ đề lớn theo giọng đọc */
  function vListen() {
    const rate = store.get('mmh_daily_rate', 1);
    return `<p class="ls2-k">Nghe cả bài · thử ẩn chữ để luyện tai</p>
      <div class="ls2-sub">${[['hide', 'Ẩn chữ'], ['en', 'Tiếng Anh'], ['both', 'Anh + Việt']].map(([k, n]) => `<button type="button" data-ls2="sub" data-k="${k}" class="${L.sub === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="ls2-line" id="ls2-line"></div>
      <div class="ls2-player"><button type="button" data-ls2="back" aria-label="Lùi 1 câu">‹ Câu trước</button>
        <button type="button" class="ls2-play" data-ls2="pp" aria-label="Phát / dừng">${audio.paused ? D.ICON.play : D.ICON.pause}</button>
        <button type="button" data-ls2="fwd" aria-label="Câu sau">Câu sau ›</button></div>
      <div class="ls2-row"><button type="button" data-ls2="rep">Nghe lại câu này</button><button type="button" data-ls2="rate">Tốc độ ${String(rate).replace(/^1$/, '1.0')}×</button></div>
      <div class="ls2-act"><button type="button" class="b1" data-ls2="next" data-to="quiz">Nghe xong · Làm bài kiểm tra</button></div>`;
  }
  const curTurn = () => { const t = audio.currentTime; let k = 0; T().forEach((x, i) => { if (x.t != null && x.t <= t + 0.05) k = i; }); return k; };
  let lastK = -1;
  function paintLine(force) {
    const el = document.getElementById('ls2-line'); if (!el) return;
    const k = D.S.ep?.date === ed.date ? curTurn() : 0; if (k === lastK && !force) return; lastK = k;
    const t = T()[k], host = ed.podcast.hosts.find(h => h.id === t.sp)?.name || '';
    let en = esc(t.text);
    for (const w of ed.study.words) { const r = w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); en = en.replace(new RegExp(`\\b(${r})\\b`, 'i'), `<mark title="${esc(w.vi)}">$1</mark>`); }
    el.className = 'ls2-line sub-' + L.sub;
    el.innerHTML = `<b>${esc(host)}</b><p class="en">${en}</p>${t.vi ? `<p class="vi">${esc(t.vi)}</p>` : ''}${L.sub === 'hide' ? '<p class="ls2-hid">Chữ đang ẩn — chạm để hiện câu này</p>' : ''}`;
    const pp = ov.querySelector('[data-ls2="pp"]'); if (pp) pp.innerHTML = audio.paused ? D.ICON.play : D.ICON.pause;
  }

  /* 3. Kiểm tra nghe: từng câu */
  function vQuiz() {
    const Q = ed.study.quiz, a = quiz(), i = Math.min(L.i, Q.length - 1), q = Q[i], my = a[i];
    return `<p class="ls2-k">Kiểm tra nghe · câu ${i + 1}/${Q.length}<span class="ls2-tag">${KIND[q.kind] || ''}</span></p>
      <h2 class="ls2-q">${esc(q.q)}</h2>
      <div class="ls2-opts">${q.opts.map((o, j) => `<button type="button" data-ls2="ans" data-j="${j}" class="${my == null ? '' : j === q.a ? 'ok' : j === my ? 'no' : 'dim'}"${my != null ? ' disabled' : ''}><i>${'ABCD'[j]}</i>${esc(o)}</button>`).join('')}</div>
      ${my != null ? `<div class="ls2-fb ${my === q.a ? 'ok' : 'no'}"><b>${my === q.a ? 'Đúng rồi!' : 'Chưa đúng.'}</b> ${esc(q.why)}</div>` : '<p class="ls2-note">Chưa chắc? Nghe lại đúng đoạn có đáp án.</p>'}
      <div class="ls2-row"><button type="button" data-ls2="seg" data-i="${q.turn}">Nghe lại đoạn này</button></div>
      <div class="ls2-act">${i > 0 ? '<button type="button" class="b2" data-ls2="prev">‹ Câu trước</button>' : ''}${my != null ? `<button type="button" class="b1" data-ls2="${i + 1 < Q.length ? 'nextq' : 'next'}" data-to="speak">${i + 1 < Q.length ? 'Câu tiếp ›' : 'Xem kết quả · Nói theo'}</button>` : ''}</div>`;
  }

  /* 4. Nói theo: cụm hay + câu ví dụ ngữ pháp */
  const speakList = () => [...ed.study.phrases.map(p => ({ k: 'p', en: (T()[p.turn] && T()[p.turn].text.toLowerCase().includes(p.en.toLowerCase()) ? sentenceWith(T()[p.turn].text, p.en) : p.en), head: p.en, vi: p.vi, tip: p.use, turn: p.turn })),
    ...ed.study.grammar.map(g => ({ k: 'g', en: g.ex, head: g.p, vi: g.vi, turn: g.turn }))];
  function sentenceWith(text, phrase) { const ss = text.match(/[^.!?]+[.!?]*/g) || [text]; return (ss.find(s => s.toLowerCase().includes(phrase.toLowerCase())) || text).trim(); }
  function vSpeak() {
    const X = speakList(), i = Math.min(L.i, X.length - 1), x = X[i], r = L.spoke[i];
    return `<p class="ls2-k">Nói theo · ${i + 1}/${X.length}<span class="ls2-tag">${x.k === 'p' ? 'Cụm hay' : 'Ngữ pháp'}</span></p>
      <div class="ls2-head">${esc(x.head)}</div><p class="ls2-vi2">${esc(x.vi)}${x.tip ? ` · <em>${esc(x.tip)}</em>` : ''}</p>
      <div class="ls2-say">“${esc(x.en)}”</div>
      <div class="ls2-row"><button type="button" data-ls2="seg" data-i="${x.turn}">Nghe trong podcast</button><button type="button" data-ls2="tts" data-t="${esc(x.en)}" data-r="0.85">Nghe chậm</button></div>
      ${SR ? `<button type="button" class="ls2-mic" data-ls2="mic" data-t="${esc(x.en)}" id="ls2-mic">Bấm và nói câu trên</button>` : '<p class="ls2-note">Trình duyệt này chưa nhận giọng nói — hãy đọc to theo, rồi bấm Tiếp.</p>'}
      <div id="ls2-res">${r ? resHtml(r) : ''}</div>
      <div class="ls2-act">${i > 0 ? '<button type="button" class="b2" data-ls2="prev">‹ Trước</button>' : ''}<button type="button" class="b1" data-ls2="${i + 1 < X.length ? 'nexts' : 'next'}" data-to="done">${i + 1 < X.length ? 'Tiếp ›' : 'Hoàn thành'}</button></div>`;
  }
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  function score(target, heard) {
    const a = norm(target), b = new Set(norm(heard)); const hit = a.filter(w => b.has(w));
    return { p: Math.round(hit.length / Math.max(1, a.length) * 100), heard, miss: a.filter(w => !b.has(w)) };
  }
  const resHtml = r => `<div class="ls2-fb ${r.p >= 80 ? 'ok' : r.p >= 50 ? 'mid' : 'no'}"><b>${r.p}%</b> ${r.p >= 80 ? 'Rất tốt!' : r.p >= 50 ? 'Khá ổn, thử lại một lần nữa.' : 'Nghe lại rồi nói chậm hơn.'}
    <div class="ls2-heard">Máy nghe được: “${esc(r.heard)}”</div>${r.miss.length ? `<div class="ls2-heard">Thiếu / chưa rõ: <b>${esc(r.miss.slice(0, 8).join(', '))}</b></div>` : ''}</div>`;
  function stopRec() { try { rec && rec.abort(); } catch {} rec = null; }
  function mic(target) {
    if (rec) { stopRec(); return; }
    audio.pause(); rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1;
    const btn = document.getElementById('ls2-mic'), out = document.getElementById('ls2-res'); let txt = '';
    btn.classList.add('rec'); btn.textContent = 'Đang nghe… bấm để dừng';
    rec.onresult = e => { txt = [...e.results].map(r => r[0].transcript).join(' '); out.innerHTML = `<div class="ls2-heard">“${esc(txt)}”</div>`; };
    rec.onerror = e => { D.toast(e.error === 'not-allowed' ? 'Hãy cho phép dùng micro' : 'Không nghe rõ, thử lại'); };
    rec.onend = () => { rec = null; btn.classList.remove('rec'); btn.textContent = 'Bấm và nói lại'; if (!txt) return; const r = score(target, txt); L.spoke[L.i] = r; save(); out.innerHTML = resHtml(r); };
    try { rec.start(); } catch { rec = null; }
  }

  /* 5. Tổng kết */
  function vDone() {
    const Q = ed.study.quiz, a = quiz(), right = Q.filter((q, i) => a[i] === q.a).length;
    const sp = Object.values(L.spoke), avg = sp.length ? Math.round(sp.reduce((s, r) => s + r.p, 0) / sp.length) : null;
    const unk = ed.study.words.filter(w => L.known[w.en] === 0), wrong = Q.map((q, i) => ({ q, i })).filter(({ q, i }) => a[i] !== q.a);
    return `<h2 class="ls2-q">Xong bài hôm nay!</h2>
      <div class="ls2-sum"><div><b>${right}/${Q.length}</b><span>câu nghe đúng</span></div><div><b>${avg == null ? '–' : avg + '%'}</b><span>nói theo</span></div><div><b>${unk.length}</b><span>từ thêm vào Sổ từ</span></div></div>
      ${wrong.length ? `<h3 class="ls2-h3">Nghe lại các câu sai</h3>${wrong.map(({ q }) => `<div class="ls2-wrong"><span>${esc(q.q)}</span><button type="button" data-ls2="seg" data-i="${q.turn}">Nghe lại</button></div>`).join('')}` : ''}
      <div class="ls2-rank" id="ls2-rank"></div>
      <div class="ls2-act"><button type="button" class="b2" data-ls2="redo">Làm lại bài kiểm tra</button><a class="b1" href="coach/#/words">Ôn Sổ từ</a></div>`;
  }
  /* điểm theo tài khoản + bảng xếp hạng (rank.js ▸ RANK) */
  function result() {
    const Q = ed.study.quiz, a = quiz(), sp = Object.values(L.spoke);
    return { quiz: Q.filter((q, i) => a[i] === q.a).length, quizN: Q.length, speak: sp.length ? Math.round(sp.reduce((s, r) => s + r.p, 0) / sp.length) : null,
      spoken: sp.length, words: ed.study.words.filter(w => L.known[w.en] === 0).length };
  }
  async function rankBox() {
    const el = document.getElementById('ls2-rank'); if (!el || !window.RANK) return;
    const r = result(), sig = JSON.stringify(r);
    const link = '<button type="button" class="ls2-lnk" data-ls2="rank">Xem bảng xếp hạng ›</button>';
    if (L.sentSig === sig && L.sentMsg) { el.innerHTML = L.sentMsg + link; return; }
    el.innerHTML = 'Đang lưu điểm…';
    const d = await RANK.submit(ed, r);
    if (d.need) { el.innerHTML = 'Đăng nhập email công ty để lưu điểm và lên bảng xếp hạng. <button type="button" class="ls2-lnk" data-ls2="login">Đăng nhập</button>'; return; }
    if (d.err) { el.innerHTML = 'Chưa lưu được điểm (' + esc(d.err) + ') — app sẽ tự gửi lại. ' + link; return; }
    L.sentSig = sig; L.sentMsg = `Đã lưu <b>${d.best} điểm</b>${d.rank ? ` · bạn đang <b>hạng ${d.rank}/${d.of}</b> tuần này` : ''}. `; save();
    el.innerHTML = L.sentMsg + link;
  }

  /* ── thao tác ── */
  ov.addEventListener('click', e => {
    const t = e.target.closest('[data-ls2]'); if (!t) { if (e.target.closest('.ls2-hid')) { L.sub = 'en'; save(); render(); } return; }
    const k = t.dataset.ls2, ds = t.dataset;
    if (k === 'close') return close();
    if (k === 'step') return go(ds.k, 0);
    if (k === 'flip') return t.classList.toggle('flip');
    if (k === 'tts') return say(ds.t, +ds.r || 0.9);
    if (k === 'seg') return playSeg(+ds.i);
    if (k === 'know') {
      const w = ed.study.words[L.i]; L.known[w.en] = +ds.v; if (ds.v === '0' && addBook(w.en, w.vi, w.ex)) D.toast('Đã thêm vào Sổ từ');
      return L.i + 1 < ed.study.words.length ? go('words', L.i + 1) : go('listen');
    }
    if (k === 'sub') { L.sub = ds.k; save(); return paintLine(true), ov.querySelectorAll('[data-ls2="sub"]').forEach(b => b.classList.toggle('on', b === t)); }
    if (k === 'pp') { if (D.S.ep?.date !== ed.date) { if (!D.setEp(ed)) return; } segEnd = null; audio.paused ? audio.play() : audio.pause(); return setTimeout(() => paintLine(true), 50); }
    if (k === 'back' || k === 'fwd' || k === 'rep') { const c = curTurn(), n = k === 'back' ? Math.max(0, c - 1) : k === 'fwd' ? Math.min(T().length - 1, c + 1) : c; segEnd = null; if (T()[n].t == null || !D.setEp(ed)) return; audio.currentTime = T()[n].t; audio.play(); return; }
    if (k === 'rate') { const st = [0.85, 1, 1.15], cur = store.get('mmh_daily_rate', 1), nx = st[(st.indexOf(cur) + 1) % st.length] || 1; store.set('mmh_daily_rate', nx); audio.playbackRate = nx; t.textContent = `Tốc độ ${String(nx).replace(/^1$/, '1.0')}×`; return; }
    if (k === 'ans') { const a = quiz(); a[L.i] = +ds.j; store.set(qk(ed.date), a); return render(); }
    if (k === 'nextq') return go('quiz', L.i + 1);
    if (k === 'nexts') { stopRec(); return go('speak', L.i + 1); }
    if (k === 'prev') { stopRec(); return go(L.step, Math.max(0, L.i - 1)); }
    if (k === 'next') { stopRec(); audio.pause(); return go(ds.to, 0); }
    if (k === 'mic') return mic(ds.t);
    if (k === 'redo') { store.set(qk(ed.date), {}); L.sentSig = ''; return go('quiz', 0); }
    if (k === 'rank') { close(); location.hash = '#/rank'; return; }
    if (k === 'login') { RANK.login().then(okk => { if (okk) RANK.flush().then(d => { if (d && d.date === ed.date) { L.sentSig = JSON.stringify(result()); L.sentMsg = `Đã lưu <b>${d.best} điểm</b>${d.rank ? ` · bạn đang <b>hạng ${d.rank}/${d.of}</b> tuần này` : ''}. `; save(); } rankBox(); }); }); return; }
  });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // vuốt ngang trên thẻ từ khoá
  let x0 = null;
  ov.addEventListener('touchstart', e => { if (e.target.closest('.ls2-card')) x0 = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60 && L.step === 'words') ov.querySelector(`[data-ls2="know"][data-v="${dx > 0 ? 1 : 0}"]`)?.click(); });

  document.addEventListener('click', e => { if (e.target.closest('[data-ls2="open"]')) { e.preventDefault(); STUDY.open(ed); } });
})();
