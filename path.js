// MMH Daily Podcast — LỘ TRÌNH HỌC kiểu Duolingo (#/learn) + nhiệm vụ hằng ngày + đánh giá hiệu quả / trình độ (24/11/2026).
// Mỗi số podcast = 1 bài trên đường học (4 bước: từ khoá · nghe · kiểm tra · nói theo — study.js); mỗi tuần = 1 chặng, cuối chặng có rương "Ôn tập tuần"
// (Sổ từ của Luyện nói). Sao của bài: 1 = đã nghe / bắt đầu · 2 = học xong · 3 = kiểm tra ≥ 80% và nói theo ≥ 70%.
// Hiệu quả: tính từ nhật ký XP máy chủ (dyMe ▸ log: quiz đúng / tổng, từ khoá đã biết, % nói theo, điểm Luyện nói) + kết quả lưu trên máy.
(function () {
  const D = window.DAILY, R = window.RANK; if (!D || !R) return;
  const esc = D.esc, store = D.store, L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  const SHOW = { talk: 'MMH Talk', clinicroom: 'The Clinic Room', lawdesk: 'Law & Tender Desk', headlines: 'Morning Headlines', english: 'English at Work', aipulse: 'AI Pulse', weekly: 'Week in Review' };
  const COL = { talk: '#1F5E8C', clinicroom: '#2E7D8C', lawdesk: '#5B3F8C', headlines: '#A23B3B', english: '#8A5A00', aipulse: '#3949AB', weekly: '#B8641B' };
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>',
    chest: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2" fill="#C98A2E"/><path d="M3 9a5 4 0 0 1 5-4h8a5 4 0 0 1 5 4z" fill="#E0A43F"/><rect x="3" y="11" width="18" height="2.4" fill="#8E5D1C"/><rect x="10.3" y="10" width="3.4" height="5" rx="1" fill="#FFD54A"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monday = s => { const d = new Date(s + 'T00:00:00'), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return ymd(d); };
  const fmt = s => { const [, m, d] = s.split('-'); return `${+d}/${+m}`; };

  /* ── trạng thái từng bài ── */
  // lịch sử các lần học (study.js ghi mmh_dy_hist:<ngày>, học lại KHÔNG xoá) ⇒ lần tốt nhất
  function bestOf(date) {
    const H = store.get('mmh_dy_hist:' + date, []) || [], r0 = store.get('mmh_dy_res:' + date, null), all = r0 ? [...H, r0] : H;
    const sc = r => (r.quizN ? r.quiz / r.quizN : 0) * 100 + (r.speak || 0) / 10;
    return all.length ? all.reduce((a, b) => (sc(b) > sc(a) ? b : a)) : null;
  }
  R.bestOf = bestOf;
  function stateOf(date) {
    const done = ((R.me() || {}).done || {})[date] || {}, l = store.get('mmh_daily_lesson:' + date, {}) || {}, res = bestOf(date);
    const lis = (store.get('mmh_dy_lis', {}) || {})[date];
    let stars = 0;
    if (done.listen || lis || l.step) stars = 1;
    if (done.lesson || l.step === 'done') stars = 2;
    if (res && res.quizN && res.quiz / res.quizN >= 0.8 && (res.speak == null || res.speak >= 70) && stars >= 2) stars = 3;
    return { stars, started: !!(l.step && l.step !== 'words') || stars > 0, step: l.step };
  }
  function units() {   // chặng 1 = podcast 7 ngày (số có bài học); các chặng sau = bài Luyện nói theo chủ đề công việc (coach/lessons.js)
    const eds = (D.S.index?.editions || []).filter(e => e.study).slice().reverse();
    const U = eds.length ? [{ kind: 'pod', name: L('Podcast mỗi ngày', 'Daily podcast'), sub: L('7 ngày gần nhất', 'last 7 days'), items: eds.map(e => ({ kind: 'pod', e })) }] : [];
    (window.COACH_TOPICS || []).forEach(t => {
      const ls = (window.COACH_LESSONS || []).filter(x => x.topic === t.id); if (!ls.length) return;
      U.push({ kind: 'coach', name: t.vi, sub: L('Luyện nói', 'Speaking'), items: ls.map(x => ({ kind: 'coach', x })) });
    });
    return U;
  }
  const PASS = 70;
  function coachStars(id) { const p = (store.get('mmh_coach_prog', {}) || {})[id] || {}; return [1, 2, 3].filter(l => (p['l' + l] || 0) >= PASS).length; }
  const starsOf = it => it.kind === 'pod' ? stateOf(it.e.date).stars : coachStars(it.x.id);
  const startedOf = it => it.kind === 'pod' ? stateOf(it.e.date).started : !!((store.get('mmh_coach_prog', {}) || {})[it.x.id]);
  /* ── nhiệm vụ hằng ngày (từ nhật ký máy chủ hôm nay) ── */
  // nhiệm vụ hằng ngày: bấm vào ⇒ tới đúng việc cần làm tiếp
  const latestStudy = () => (D.S.index?.editions || []).find(e => e.study) || (D.S.index?.editions || [])[0];
  const lisPct = date => ((store.get('mmh_dy_lpct', {}) || {})[date]) || 0;
  function quests() {
    const me = R.meC(), d = R.me() || {}, today = d.today || ymd(new Date()), last = (D.S.index?.editions || [])[0];
    const log = (d.log || []).filter(x => x.at && ymd(new Date(x.at)) === today);
    const w = d.week || [], xp = w.length ? w[w.length - 1].xp : 0, goal = me ? me.goal || 50 : 50;
    const right = log.filter(x => /quiz|vocab|flash|read|dictation/.test(x.kind)).reduce((s, x) => { try { return s + (JSON.parse(x.d || '{}').right || 0); } catch { return s; } }, 0);
    const lisDone = log.some(x => x.kind === 'listen') || !!(last && (store.get('mmh_dy_lis', {}) || {})[last.date]);
    const lp = last ? Math.min(80, lisPct(last.date)) : 0;
    return [
      { t: L(`Đạt ${goal} XP`, `Earn ${goal} XP`), h: L('Học bài tiếp theo trên lộ trình', 'Do the next lesson on your path'), v: xp, n: goal, go: 'next' },
      { t: L('Nghe hết 1 số podcast', 'Finish 1 podcast episode'), h: lisDone ? L('Đã nghe xong', 'Done') : L(`Nghe tới 80% số mới nhất (đang ${lp}%)`, `Listen to 80% of the latest episode (now ${lp}%)`), v: lisDone ? 80 : lp, n: 80, unit: '%', go: 'listen' },
      { t: L('Trả lời đúng 8 câu', 'Get 8 answers right'), h: L('Làm bài kiểm tra nghe của số mới', 'Take the listening quiz of the latest episode'), v: Math.min(8, right), n: 8, go: 'quiz' },
      { t: L('Nói theo hoặc Luyện nói 1 lần', 'Speak once (repeat or coach)'), h: L('Mở Luyện nói, nói 1 đoạn', 'Open Speaking and say one passage'), v: log.some(x => x.kind === 'speak' || x.kind === 'coach') ? 1 : 0, n: 1, go: 'speak' }
    ];
  }
  const CHEV = '<svg class="pa-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>';
  const questHtml = () => `<section class="pa-q"><h3>${L('Nhiệm vụ hôm nay', 'Daily quests')}</h3>${quests().map(q => { const p = Math.min(100, Math.round(q.v / q.n * 100)), ok = p >= 100;
      return `<button type="button" class="pa-qi${ok ? ' ok' : ''}" data-pa="quest" data-go="${q.go}"><span>${ICON.chest}</span><div><b>${esc(q.t)}</b><small>${esc(q.h)}</small><i style="--p:${p}%"><em>${q.unit ? `${q.v}${q.unit} / ${q.n}${q.unit}` : `${Math.min(q.v, q.n)} / ${q.n}`}</em></i></div>${ok ? '' : CHEV}</button>`; }).join('')}
    ${R.tok() ? '' : `<p class="dy-small">${L('Đăng nhập để tính nhiệm vụ và XP.', 'Sign in to track quests and XP.')}</p>`}</section>`;

  /* ── trang Lộ trình ── */
  const OFF = [0, 46, 78, 46, 0, -46, -78, -46];
  function page() {
    const me = R.meC(), U = units();
    let cur = null;
    for (const u of U) for (const it of u.items) if (!cur && starsOf(it) < (it.kind === 'pod' ? 2 : 1)) cur = it;
    const w = (R.me() || {}).week || [], xp = w.length ? w[w.length - 1].xp : 0;
    const head = `<div class="pa-top">${me ? `<a href="#/me" class="pa-me">${R.av(me.avatar, 34)}</a><span class="pa-s fire">${R.flame}${me.streak}</span><span class="pa-s gem">${ICON.star}${R.num(me.xp)}</span><span class="pa-s lg">${esc(R.lgN(me.league))}</span><span class="pa-s">${xp}/${me.goal || 50} XP</span>`
      : `<button type="button" class="st-go" data-rk="login">${L('Đăng nhập / Tạo tài khoản', 'Sign in / Create account')}</button>`}</div>`;
    let k = 0;
    const body = U.map((u, ui) => {
      const done = u.items.filter(it => starsOf(it) >= (it.kind === 'pod' ? 2 : 1)).length;
      const nodes = u.items.map(it => {
        const st = starsOf(it), off = OFF[k++ % OFF.length], isCur = it === cur, pod = it.kind === 'pod', fin = st >= (pod ? 2 : 1);
        const col = pod ? (COL[it.e.show] || '#0E7C6B') : ['#2E7D8C', '#B8641B', '#3949AB', '#5B3F8C', '#1F5E8C', '#A23B3B'][ui % 6];
        const lab = pod ? `<b>${esc(D.showName ? D.showName(it.e.show) : (SHOW[it.e.show] || it.e.show))}</b> · ${fmt(it.e.date)}` : `<b>${esc(it.x.vi.length > 34 ? it.x.vi.slice(0, 32) + '…' : it.x.vi)}</b>`;
        return `<div class="pa-n${isCur ? ' cur' : ''}${fin ? ' done' : ''}" style="--o:${off}px">
          ${isCur ? `<div class="pa-tip">${startedOf(it) ? L('Học tiếp', 'Continue') : L('Bắt đầu', 'Start')}</div>` : ''}
          <button type="button" ${pod ? `data-pa="open" data-date="${it.e.date}"` : `data-pa="coach" data-id="${esc(it.x.id)}"`} style="--c:${col}" aria-label="${pod ? 'Podcast ' + fmt(it.e.date) : esc(it.x.vi)}">${fin ? ICON.star : pod ? ICON.play : ICON.mic}</button>
          <span class="pa-st">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}">${ICON.star}</i>`).join('')}</span>
          <span class="pa-l">${lab}</span>
          ${isCur ? `<span class="pa-mas">${R.av(me ? me.avatar : 'chip', 64, startedOf(it) ? 'think' : 'wave')}</span>` : ''}</div>`;
      }).join('');
      const chest = `<div class="pa-n chest${done === u.items.length ? ' open' : ''}" style="--o:${OFF[k++ % OFF.length]}px"><button type="button" data-pa="review" aria-label="${L('Ôn tập', 'Review')}">${ICON.chest}</button><span class="pa-l"><b>${L('Ôn tập', 'Review')}</b> · ${L('Sổ từ', 'Word book')}</span></div>`;
      return `<section class="pa-u"><header class="pa-uh" style="--i:${ui % 4}"><div><small>${L('Chặng', 'Unit')} ${ui + 1} · ${esc(u.sub)}</small><b>${esc(u.name)}</b></div><span>${done}/${u.items.length}</span></header><div class="pa-path">${nodes}${chest}</div></section>`;
    }).join('');
    return `<div class="rk dy pa">${head}${questHtml()}${body || `<div class="rk-empty">${L('Chưa có bài nào.', 'No lessons yet.')}</div>`}
      <p class="rk-foot"><a class="rk-link" href="#/archive">${L('Số cũ hơn ›', 'Older episodes ›')}</a></p></div>`;
  }
  function after() { setTimeout(() => document.querySelector('.pa-n.cur')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200); }

  /* ── hiệu quả học + trình độ ước tính (trang Tôi) ── */
  function skills(d) {
    const log = (d && d.log) || [], sum = { listen: [0, 0], vocab: [0, 0], speak: [0, 0], coach: [0, 0] };
    log.forEach(x => { let o = {}; try { o = JSON.parse(x.d || '{}'); } catch {}
      if (x.kind === 'quiz' && o.n) { sum.listen[0] += o.right || 0; sum.listen[1] += o.n; }
      if ((x.kind === 'vocab' || x.kind === 'flash') && o.n) { sum.vocab[0] += o.right || 0; sum.vocab[1] += o.n; }
      if (x.kind === 'speak' && o.pct != null) { sum.speak[0] += o.pct; sum.speak[1]++; }
      if (x.kind === 'coach' && o.pct != null) { sum.coach[0] += o.pct; sum.coach[1]++; } });
    // bổ sung kết quả lưu trên máy (khi chưa đăng nhập)
    if (!log.length) Object.keys(localStorage).filter(k => k.startsWith('mmh_dy_res:')).forEach(k => { const r = store.get(k, null); if (!r) return;
      if (r.quizN) { sum.listen[0] += r.quiz; sum.listen[1] += r.quizN; } if (r.wordsN) { sum.vocab[0] += r.known || 0; sum.vocab[1] += r.wordsN; } if (r.speak != null) { sum.speak[0] += r.speak; sum.speak[1]++; } });
    const pct = (a, avg) => a[1] ? Math.round(avg ? a[0] / a[1] : a[0] / a[1] * 100) : null;
    return [
      ['listen', L('Nghe hiểu', 'Listening'), pct(sum.listen), sum.listen[1] + L(' câu', ' questions')],
      ['vocab', L('Từ vựng', 'Vocabulary'), pct(sum.vocab), sum.vocab[1] + L(' từ', ' words')],
      ['speak', L('Nói theo', 'Repeat aloud'), pct(sum.speak, 1), sum.speak[1] + L(' lượt', sum.speak[1] === 1 ? ' try' : ' tries')],
      ['coach', L('Luyện nói', 'Speaking coach'), pct(sum.coach, 1), sum.coach[1] ? sum.coach[1] + L(' đoạn', sum.coach[1] === 1 ? ' passage' : ' passages') : L('Chưa luyện', 'Not yet')]
    ];
  }
  function level(sk) {
    const v = sk.filter(s => s[2] != null).map(s => s[2]); if (!v.length) return null;
    const a = v.reduce((x, y) => x + y, 0) / v.length;
    return a >= 90 ? ['B2', L('Tự tin trao đổi chuyên môn', 'Confident at work')] : a >= 78 ? ['B1+', L('Nghe hiểu tốt tin chuyên ngành', 'Follows industry news well')]
      : a >= 62 ? ['B1', L('Hiểu ý chính, cần thêm từ vựng', 'Gets the gist, building vocabulary')] : a >= 45 ? ['A2+', L('Đang tiến bộ — nghe lại đoạn sai', 'Improving — replay missed parts')] : ['A2', L('Mới bắt đầu — học đều mỗi ngày', 'Just starting — study a little daily')];
  }
  R.stats = d => {
    const sk = skills(d), lv = level(sk);
    return `<section class="ls-box pa-sk"><div class="pa-skh"><h3>${L('Hiệu quả học (35 ngày)', 'Learning results (35 days)')}</h3>${lv ? `<span class="pa-lv"><b>${lv[0]}</b>${esc(lv[1])}</span>` : ''}</div>
      ${sk.map(([k, n, p, c]) => `<div class="pa-skr"><span>${esc(n)}</span><i><em style="width:${p || 0}%" class="${p == null ? '' : p >= 80 ? 'ok' : p >= 60 ? 'mid' : 'low'}"></em></i><b>${p == null ? '–' : p + '%'}</b><small>${esc(c)}</small></div>`).join('')}
      <p class="dy-small">${L('Trình độ ước tính theo khung CEFR từ kết quả làm bài gần đây — chỉ để tham khảo.', 'Estimated CEFR level from recent results — for guidance only.')}</p></section>${questHtml()}`;
  };

  /* ── thao tác ── */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-pa]'); if (!t) return;
    if (t.dataset.pa === 'quest') {
      const g = t.dataset.go, e = latestStudy();
      if (g === 'speak') { location.href = 'coach/'; return; }
      if (g === 'listen') { location.hash = '#/listen'; setTimeout(() => { const ed = D.S.cur; if (ed && D.S.ep?.date !== ed.date) D.setEp(ed); if (D.audio.paused) D.audio.play().catch(() => {}); }, 700); return; }
      if (g === 'next') { if (!location.hash.startsWith('#/learn')) { location.hash = '#/learn'; return; } document.querySelector('.pa-n.cur > button')?.click(); return; }
      if (g === 'quiz' && e) { const ed = await D.loadEd(e.date); if (window.STUDY && ed.study) { STUDY.open(ed); setTimeout(() => document.querySelector('[data-ls2="step"][data-k="quiz"]')?.click(), 50); } return; }
      return;
    }
    if (t.dataset.pa === 'review') { location.href = 'coach/#/words'; return; }
    if (t.dataset.pa === 'coach') { location.href = 'coach/#/l/' + encodeURIComponent(t.dataset.id); return; }
    const date = t.dataset.date; t.disabled = true;
    try { const ed = await D.loadEd(date); if (window.STUDY && ed.study && (ed.study.quiz?.length || ed.study.words?.length)) STUDY.open(ed); else { location.hash = '#/listen/' + date; } }
    catch { D.toast(L('Không tải được bài này', 'Could not load this lesson')); }
    finally { t.disabled = false; }
  });
  // vẽ lại lộ trình khi đóng bài học (sao mới)
  setTimeout(() => { const ov = document.querySelector('.ls2'); if (ov) new MutationObserver(() => { if (ov.hidden && location.hash.startsWith('#/learn')) { const v = document.getElementById('view'); if (v && v.querySelector('.pa')) { v.innerHTML = page(); after(); } } }).observe(ov, { attributes: true, attributeFilter: ['hidden'] }); }, 1000);

  R.learnPage = page; R.learnAfter = after;
})();
