// MMH Daily Podcast — học vui kiểu Duolingo trong bài học "Học bài này" (study.js) (24/11/2026):
// nhân vật của bạn đứng cạnh bài (suy nghĩ khi làm bài, ăn mừng khi đúng, buồn khi sai), âm thanh đúng / sai / hoàn thành (WebAudio, không tải file),
// chuỗi câu đúng liên tiếp, màn hoàn thành có pháo giấy. Tắt âm: nút loa trên thanh bài học (localStorage mmh_dy_sound).
(function () {
  const D = window.DAILY, R = window.RANK; if (!D || !R || !R.av) return;
  const store = D.store, L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  let ac = null;
  const on = () => store.get('mmh_dy_sound', 1) !== 0;
  function beep(f, dur, type = 'sine', vol = 0.12, at = 0) {
    if (!on()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch { /* máy không hỗ trợ */ }
  }
  const SND = {
    ok: () => { beep(660, 0.1); beep(990, 0.16, 'sine', 0.12, 0.09); },
    no: () => { beep(240, 0.16, 'triangle', 0.1); beep(180, 0.22, 'triangle', 0.09, 0.12); },
    done: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.2, 'sine', 0.11, i * 0.12))
  };
  const OK = [['Chuẩn luôn!', 'Spot on!'], ['Giỏi quá!', 'Great job!'], ['Tuyệt vời!', 'Awesome!'], ['Đúng rồi!', 'Correct!'], ['Nghe tai thính ghê!', 'Sharp ears!']];
  const NO = [['Không sao, nghe lại đoạn này nhé!', 'No worries — replay this part!'], ['Suýt đúng rồi!', 'So close!'], ['Câu này khó đó, thử nghe lại.', 'Tricky one — listen again.']];
  const pick = a => { const x = a[Math.floor(Math.random() * a.length)]; return L(x[0], x[1]); };
  const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  const MUTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';

  let ov = null, seen = new Set(), combo = 0, moodT = null, lastStep = '', expect = null;   // expect: chỉ phản hồi khi người học vừa bấm trả lời / nói
  function mascot(mood, say) {
    const me = R.meC(); let m = ov.querySelector('.fun-mas');
    if (!m) { m = document.createElement('div'); m.className = 'fun-mas'; ov.appendChild(m); }
    m.innerHTML = `${say ? `<p class="fun-say">${say}</p>` : ''}${R.av(me ? me.avatar : 'chip', 72, mood)}`;
    m.classList.remove('pop'); void m.offsetWidth; m.classList.add('pop');
  }
  function base() {
    if (ov.querySelector('.ls2-sum')) return 'cheer';
    if (ov.querySelector('.ls2-opts')) return 'think';
    if (ov.querySelector('#ls2-mic')) return 'wave';
    return 'happy';
  }
  function soundBtn() {
    const top = ov.querySelector('.ls2-top'); if (!top || top.querySelector('.fun-snd')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fun-snd'; b.setAttribute('aria-label', L('Bật / tắt âm thanh', 'Sound on / off'));
    b.innerHTML = on() ? SPK : MUTE; b.onclick = () => { store.set('mmh_dy_sound', on() ? 0 : 1); b.innerHTML = on() ? SPK : MUTE; if (on()) SND.ok(); };
    top.appendChild(b);
  }
  function check() {
    if (ov.hidden) { seen = new Set(); combo = 0; lastStep = ''; return; }
    soundBtn();
    const step = (ov.querySelector('.ls2-sum') && 'done') || (ov.querySelector('.ls2-opts') && 'quiz') || (ov.querySelector('#ls2-mic, .ls2-say') && 'speak') || (ov.querySelector('#ls2-line') && 'listen') || 'words';
    const kTxt = (ov.querySelector('.ls2-k') || {}).textContent || '';
    const fb = ov.querySelector('.ls2-opts ~ .ls2-fb, #ls2-res .ls2-fb');
    if (fb) {
      const key = step + '|' + kTxt + '|' + fb.className + '|' + fb.textContent.slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        if (!expect || expect.k !== step || Date.now() - expect.at > 40000) return;
        expect = null;
        const good = fb.classList.contains('ok'), mid = fb.classList.contains('mid');
        if (good) { combo++; SND.ok(); mascot('cheer', combo >= 3 && step === 'quiz' ? L(`${combo} câu đúng liền!`, `${combo} in a row!`) : pick(OK)); }
        else { combo = 0; SND.no(); mascot(mid ? 'think' : 'sad', mid ? L('Khá rồi, nói lại một lần nữa!', 'Nearly — say it once more!') : pick(NO)); }
        clearTimeout(moodT); moodT = setTimeout(() => !ov.hidden && mascot(base()), 2600);
        return;
      }
    }
    if (step !== lastStep) {
      lastStep = step;
      if (step === 'done' && !seen.has('done|' + kTxt)) { seen.add('done|' + kTxt); SND.done(); mascot('cheer', L('Xong bài rồi! Tự hào về bạn!', 'Lesson complete! So proud of you!')); confetti(); }
      else if (step !== 'done') mascot(base(), step === 'quiz' ? L('Nghe kỹ rồi chọn nhé!', 'Listen closely, then choose!') : step === 'speak' ? L('Nói to, rõ từng chữ nhé!', 'Speak up, nice and clear!') : '');
    }
  }
  function confetti(host) {
    const c = document.createElement('div'); c.className = 'fun-conf';
    c.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="--x:${Math.round(Math.random() * 100)}%;--d:${(Math.random() * 0.6).toFixed(2)}s;--r:${Math.round(Math.random() * 360)}deg;--c:${['#FFC94A', '#6FD6BF', '#F07A8A', '#7FB6F0', '#B9A7F5'][i % 5]}"></i>`).join('');
    (host || ov || document.body).appendChild(c); setTimeout(() => c.remove(), 2600);
  }
  window.FUN = { sound: k => SND[k] && SND[k](), confetti };   // duel.js (thách đấu) dùng chung âm thanh + pháo giấy
  setTimeout(function wire() {
    ov = document.querySelector('.ls2'); if (!ov) return setTimeout(wire, 800);
    ov.addEventListener('click', e => { const t = e.target.closest('[data-ls2]'); if (!t) return; if (t.dataset.ls2 === 'ans') expect = { k: 'quiz', at: Date.now() }; if (t.dataset.ls2 === 'mic') expect = { k: 'speak', at: Date.now() }; }, true);
    new MutationObserver(() => { clearTimeout(wire.t); wire.t = setTimeout(check, 60); }).observe(ov, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  }, 600);
})();
