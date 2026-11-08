// MMH Daily — Chế độ học: nghe podcast với phụ đề chạy theo từng câu (Anh + Việt), lặp câu, dừng sau mỗi câu để nói theo,
// ẩn tiếng Anh / tiếng Việt để luyện nghe, từ vựng của số được gạch chân (chạm để xem nghĩa).
(function () {
  const D = window.DAILY; if (!D) return;
  const $ = s => document.querySelector(s), esc = D.esc, store = D.store, audio = D.audio;
  const P = Object.assign({ vi: true, en: true, pause: false }, store.get('mmh_daily_learn', {}));
  const saveP = () => store.set('mmh_daily_learn', P);
  let ed = null, turns = [], idx = -1, stopAt = null, loopOne = false;

  const ov = document.createElement('div');
  ov.className = 'lrn'; ov.id = 'lrn'; ov.hidden = true;
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Chế độ học');
  document.body.appendChild(ov);

  const IC = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor"/></svg>',
    rep: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 4v6h-6l2.3-2.3A6 6 0 1 0 18 12h2a8 8 0 0 1-16 0z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  function vocabWrap(text) {
    let h = esc(text);
    for (const v of ed.vocab || []) {
      const w = esc(v.en); if (!w) continue;
      h = h.replace(new RegExp(`\\b(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i'), `<mark class="lrn-v" tabindex="0" data-vi="${esc(v.vi)}">$1</mark>`);
    }
    return h;
  }
  function render() {
    const hosts = Object.fromEntries(ed.podcast.hosts.map(h => [h.id, h.name]));
    ov.innerHTML = `<div class="lrn-top"><div><b>${esc(ed.podcast.title || ed.podcast.name)}</b><span>Chế độ học · chạm một câu để nghe lại</span></div>
        <button type="button" class="lrn-ic" data-a="close" aria-label="Đóng">${IC.x}</button></div>
      <div class="lrn-list" id="lrn-list">${turns.map((t, i) => `<p data-i="${i}"><b>${esc(hosts[t.sp] || t.sp)}</b><span class="en">${vocabWrap(t.text)}</span>${t.vi ? `<span class="vi">${esc(t.vi)}</span>` : ''}</p>`).join('')}</div>
      <div class="lrn-bar">
        <div class="lrn-tog">
          <label><input type="checkbox" data-p="en" ${P.en ? 'checked' : ''}> Tiếng Anh</label>
          <label><input type="checkbox" data-p="vi" ${P.vi ? 'checked' : ''}> Tiếng Việt</label>
          <label title="Tự dừng sau mỗi câu để bạn nói theo"><input type="checkbox" data-p="pause" ${P.pause ? 'checked' : ''}> Dừng sau mỗi câu</label>
        </div>
        <div class="lrn-ctl">
          <button type="button" class="lrn-ic" data-a="prev" aria-label="Câu trước" title="Câu trước (←)">${IC.prev}</button>
          <button type="button" class="lrn-ic" data-a="rep" aria-label="Nghe lại câu này" title="Nghe lại câu này (R)">${IC.rep}</button>
          <button type="button" class="lrn-play" data-a="play" aria-label="Phát / tạm dừng" title="Phát / tạm dừng (Space)">${audio.paused ? D.ICON.play : D.ICON.pause}</button>
          <button type="button" class="lrn-ic" data-a="next" aria-label="Câu sau" title="Câu sau (→)">${IC.next}</button>
          <button type="button" class="lrn-spd" data-a="spd" title="Tốc độ">${String(store.get('mmh_daily_rate', 1))}×</button>
        </div>
        <div class="lrn-tip" id="lrn-tip" hidden></div>
      </div>`;
    applyP(); idx = -1; onTime();
  }
  const applyP = () => { ov.classList.toggle('no-en', !P.en); ov.classList.toggle('no-vi', !P.vi); };
  const startOf = i => turns[i]?.t ?? 0;
  const endOf = i => (turns[i + 1]?.t ?? (audio.duration || ed.podcast.audio?.dur || 1e9)) - 0.15;
  function cur(t) { let k = -1; turns.forEach((x, i) => { if (x.t != null && x.t <= t + 0.15) k = i; }); return k; }
  function go(i, play = true) {
    i = Math.max(0, Math.min(turns.length - 1, i));
    if (!D.setEp(ed)) return;
    audio.currentTime = startOf(i) + 0.01; stopAt = P.pause || loopOne ? endOf(i) : null;
    if (play) audio.play().catch(() => {});
    hi(i);
  }
  function hi(i) {
    if (i === idx) return; idx = i;
    const ps = ov.querySelectorAll('#lrn-list p');
    ps.forEach((p, k) => { p.classList.toggle('now', k === i); p.classList.toggle('past', k < i); });
    const el = ps[i], list = $('#lrn-list');
    if (el && list) list.scrollTo({ top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function onTime() {
    if (ov.hidden || !ed || D.S.ep?.date !== ed.date) return;
    const t = audio.currentTime, i = cur(t);
    if (stopAt != null && t >= stopAt) {
      if (loopOne) { audio.currentTime = startOf(idx) + 0.01; return; }
      audio.pause(); stopAt = null;
    }
    if (i !== idx) { hi(i); if (P.pause && !audio.paused && i >= 0) stopAt = endOf(i); }
    const pb = ov.querySelector('.lrn-play'); if (pb) pb.innerHTML = audio.paused ? D.ICON.play : D.ICON.pause;
  }
  audio.addEventListener('timeupdate', onTime);
  audio.addEventListener('play', onTime); audio.addEventListener('pause', onTime);

  ov.addEventListener('click', e => {
    const m = e.target.closest('.lrn-v');
    if (m) { const tip = $('#lrn-tip'); tip.textContent = `${m.textContent}: ${m.dataset.vi}`; tip.hidden = false; clearTimeout(tip.t); tip.t = setTimeout(() => (tip.hidden = true), 3500); return; }
    const p = e.target.closest('#lrn-list p'); if (p) { loopOne = false; go(+p.dataset.i); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'close') close();
    else if (a === 'play') { if (!D.setEp(ed)) return; if (audio.paused) { if (P.pause && idx >= 0 && audio.currentTime >= endOf(idx) - 0.2) go(idx + 1); else audio.play(); } else audio.pause(); }
    else if (a === 'prev') { loopOne = false; go(idx - 1); }
    else if (a === 'next') { loopOne = false; go(idx + 1); }
    else if (a === 'rep') { loopOne = false; stopAt = null; go(idx < 0 ? 0 : idx); if (!P.pause) stopAt = endOf(Math.max(0, idx)); }
    else if (a === 'spd') { const steps = [0.75, 0.85, 1, 1.15]; const c = store.get('mmh_daily_rate', 1); const nx = steps[(steps.indexOf(c) + 1) % steps.length] || 1; store.set('mmh_daily_rate', nx); audio.playbackRate = nx; b.textContent = nx + '×'; }
  });
  ov.addEventListener('change', e => { const k = e.target.dataset.p; if (!k) return; P[k] = e.target.checked; saveP(); applyP(); if (k === 'pause') stopAt = P.pause && idx >= 0 ? endOf(idx) : null; });
  document.addEventListener('keydown', e => {
    if (ov.hidden || e.target.closest('input,textarea')) return;
    if (e.key === 'Escape') close();
    else if (e.key === ' ') { e.preventDefault(); ov.querySelector('[data-a=play]').click(); }
    else if (e.key === 'ArrowLeft') ov.querySelector('[data-a=prev]').click();
    else if (e.key === 'ArrowRight') ov.querySelector('[data-a=next]').click();
    else if (e.key === 'r' || e.key === 'R') ov.querySelector('[data-a=rep]').click();
  });

  async function open(e) {
    ed = e || D.S.cur; if (!ed?.podcast) return;
    turns = (ed.podcast.turns || []).filter(t => t.text);
    if (!ed.podcast.audio) { D.toast('Âm thanh của số này chưa sẵn sàng'); return; }
    if (/^i-/.test(ed.date) && !ed.podcast.audio.blob) {          // bản tin nội bộ: giải mã âm thanh trước (nút phát của trang làm việc này)
      document.querySelector('#ls-play')?.click();
      for (let k = 0; k < 40 && !ed.podcast.audio.blob; k++) await new Promise(r => setTimeout(r, 500));
      if (!ed.podcast.audio.blob) return;
    }
    D.setEp(ed); render(); ov.hidden = false; document.documentElement.classList.add('lrn-on');
    ov.querySelector('[data-a=play]').focus();
  }
  function close() { ov.hidden = true; stopAt = null; loopOne = false; document.documentElement.classList.remove('lrn-on'); }
  window.MMHLearn = { open, close };

  // gắn nút "Chế độ học" vào trang Nghe và trang Nội bộ (mỗi lần trang vẽ lại)
  const inject = () => {
    const ctl = document.querySelector('#view .ls-ctl'); if (!ctl || ctl.querySelector('.learn-btn')) return;
    ctl.insertAdjacentHTML('beforeend', '<button type="button" class="learn-btn" title="Phụ đề chạy theo từng câu, lặp câu, nói theo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5 12 3l9 3.5-9 3.5z M7 8.6V13c0 1.7 2.2 3 5 3s5-1.3 5-3V8.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Chế độ học</button>');
    ctl.querySelector('.learn-btn').onclick = () => open(D.S.cur);
  };
  new MutationObserver(inject).observe(document.getElementById('view'), { childList: true, subtree: false });
  inject();
})();
