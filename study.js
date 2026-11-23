// MMH Daily — "Học từ số này" ở trang Nghe: từ mới, cụm hay / câu móc, ngữ pháp, bài kiểm tra nghe (máy chủ soạn sẵn: ed.study, tools/edition.mjs ▸ studyWrite).
// Mỗi mục gắn với một lượt lời ⇒ "Nghe lại" tua đúng câu. Kết quả bài kiểm tra lưu trên máy: localStorage mmh_daily_quiz:<ngày>. "＋ Sổ từ" ghi vào Sổ từ của Luyện nói (mmh_coach_words).
(function () {
  const D = window.DAILY; if (!D) return;
  const esc = D.esc, store = D.store;
  const TABS = [['quiz', 'Kiểm tra nghe'], ['words', 'Từ mới'], ['phrases', 'Cụm hay'], ['grammar', 'Ngữ pháp']];
  const KIND = { gist: 'Ý chính', detail: 'Chi tiết', vocab: 'Từ trong ngữ cảnh', inference: 'Suy luận' };
  let cur = null, tab = store.get('mmh_daily_sttab', 'quiz');
  const qKey = d => 'mmh_daily_quiz:' + d;

  const again = i => `<button class="st-ag" type="button" data-st-turn="${i}" title="Nghe lại câu này">Nghe lại</button>`;
  const inBook = en => (store.get('mmh_coach_words', []) || []).some(w => w.en.toLowerCase() === String(en).toLowerCase());
  const addBtn = (en, vi, ex) => inBook(en) ? '<span class="st-in">Đã có trong Sổ từ</span>'
    : `<button class="st-add" type="button" data-st-add="${esc(en)}" data-vi="${esc(vi)}" data-ex="${esc(ex || '')}">＋ Sổ từ</button>`;

  function quizHtml(ed) {
    const Q = ed.study.quiz || [], ans = store.get(qKey(ed.date), {});
    const done = Q.filter((_, i) => ans[i] != null).length, right = Q.filter((q, i) => ans[i] === q.a).length;
    const head = done === Q.length && Q.length
      ? `<div class="st-score"><b>${right}/${Q.length}</b> câu đúng${right === Q.length ? ' · Rất tốt!' : right >= Q.length * 0.6 ? ' · Khá ổn, nghe lại câu sai nhé' : ' · Nghe lại cả bài rồi làm lại nhé'}<button class="st-ag" type="button" data-st-reset>Làm lại</button></div>`
      : `<p class="st-tip">Nghe podcast trước (có thể ẩn lời thoại), rồi trả lời. ${done ? `Đã làm ${done}/${Q.length}.` : ''}<label class="st-hide"><input type="checkbox" id="st-hidetx"${store.get('mmh_daily_sthide', false) ? ' checked' : ''}> Ẩn lời thoại khi làm bài</label></p>`;
    return head + `<ol class="st-q">${Q.map((q, i) => {
      const a = ans[i];
      return `<li><div class="st-qh"><span class="st-k">${KIND[q.kind] || ''}</span>${esc(q.q)}</div><div class="st-opts">${q.opts.map((o, j) =>
        `<button type="button" data-st-q="${i}" data-st-o="${j}" class="${a == null ? '' : j === q.a ? 'ok' : j === a ? 'no' : 'dim'}"${a != null ? ' disabled' : ''}>${'ABCD'[j]}. ${esc(o)}</button>`).join('')}</div>
        ${a != null ? `<div class="st-why">${a === q.a ? 'Đúng.' : 'Chưa đúng.'} ${esc(q.why)} ${again(q.turn)}</div>` : ''}</li>`;
    }).join('')}</ol>`;
  }
  const words = ed => `<dl class="st-dl">${ed.study.words.map(w => `<dt>${esc(w.en)}</dt><dd>${esc(w.vi)}<div class="st-ex">“${esc(w.ex)}” ${again(w.turn)} ${addBtn(w.en, w.vi, w.ex)}</div></dd>`).join('')}</dl>`;
  const phrases = ed => `<dl class="st-dl">${ed.study.phrases.map(p => `<dt>${esc(p.en)}</dt><dd>${esc(p.vi)}${p.use ? `<div class="st-use">${esc(p.use)}</div>` : ''}<div class="st-ex">${again(p.turn)} ${addBtn(p.en, p.vi, '')}</div></dd>`).join('')}</dl>`;
  const grammar = ed => `<dl class="st-dl">${ed.study.grammar.map(g => `<dt>${esc(g.p)}</dt><dd>${esc(g.vi)}<div class="st-ex">“${esc(g.ex)}” ${again(g.turn)}</div></dd>`).join('')}</dl>`;

  function body(ed) { return { quiz: quizHtml, words, phrases, grammar }[tab](ed); }
  function paint() {
    const box = document.getElementById('st-body'); if (!box || !cur) return;
    box.innerHTML = body(cur);
    document.querySelectorAll('#st-tabs button').forEach(b => b.classList.toggle('on', b.dataset.stTab === tab));
    hideTx();
  }
  function hideTx() {
    const tx = document.getElementById('tx'); if (!tx) return;
    const Q = cur?.study?.quiz || [], ans = store.get(qKey(cur?.date), {});
    tx.classList.toggle('st-blur', tab === 'quiz' && store.get('mmh_daily_sthide', false) && Q.some((_, i) => ans[i] == null));
  }

  window.STUDY = {
    html(ed) {
      cur = ed; const s = ed.study;
      if (!s || !(s.quiz?.length || s.words?.length)) return '';
      if (!TABS.some(([k]) => k === tab && s[k]?.length)) tab = s.quiz?.length ? 'quiz' : 'words';
      setTimeout(hideTx, 0);
      return `<section class="ls-box st" id="study"><h3>Học từ số này<small>bấm "Nghe lại" để nghe đúng câu đó</small></h3>
        <div class="subsel" id="st-tabs" role="tablist">${TABS.filter(([k]) => s[k]?.length).map(([k, l]) => `<button type="button" data-st-tab="${k}" class="${k === tab ? 'on' : ''}">${l} <i>${s[k].length}</i></button>`).join('')}</div>
        <div id="st-body">${body(ed)}</div></section>`;
    }
  };

  document.addEventListener('change', e => { if (e.target.id === 'st-hidetx') { store.set('mmh_daily_sthide', e.target.checked); hideTx(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-st-tab],[data-st-q],[data-st-turn],[data-st-add],[data-st-reset]'); if (!t || !cur) return;
    const ds = t.dataset;
    if (ds.stTab) { tab = ds.stTab; store.set('mmh_daily_sttab', tab); paint(); return; }
    if (ds.stQ != null) { const a = store.get(qKey(cur.date), {}); a[ds.stQ] = +ds.stO; store.set(qKey(cur.date), a); paint(); return; }
    if (ds.stReset != null) { store.set(qKey(cur.date), {}); paint(); return; }
    if (ds.stAdd) {
      const W = store.get('mmh_coach_words', []) || [], d = new Date(), today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!W.some(w => w.en.toLowerCase() === ds.stAdd.toLowerCase())) W.unshift({ en: ds.stAdd, vi: ds.vi || '', ex: ds.ex || '', src: 'Podcast ' + D.viDate(cur.date), at: Date.now(), due: today, step: 0 });
      store.set('mmh_coach_words', W); D.toast('Đã thêm vào Sổ từ'); paint(); return;
    }
    if (ds.stTurn != null) {
      const turn = cur.podcast.turns[+ds.stTurn]; if (!turn || turn.t == null || !D.setEp(cur)) { D.toast('Podcast chưa có âm thanh'); return; }
      D.audio.currentTime = turn.t; if (D.audio.paused) D.audio.play();
    }
  });
})();
