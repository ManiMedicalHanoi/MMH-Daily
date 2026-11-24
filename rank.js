// MMH Daily Podcast — TÀI KHOẢN HỌC VIÊN (kiểu Duolingo) + Bảng xếp hạng + trang "Tôi".
// Máy chủ: Training Hub ▸ RH_DailyAcct.gs (v3.50): dyHello · dyCode · dyVerify · dyLogin · dyMe · dyProfile · dyPw · dyEvent · dyBoard.
// Ai cũng tạo được tài khoản bằng email bất kỳ (mã kích hoạt qua email ⇒ mật khẩu + biệt danh + nhân vật). Phiên lưu ở localStorage.mmh_daily_tk
// (KHÔNG ghi đè mmh_tk của Report Hub / CRM); người đã đăng nhập email công ty ở app khác (mmh_tk) dùng luôn, máy chủ tự tạo tài khoản học viên.
// XP do máy chủ tính: mọi hoạt động học gửi dyEvent (hàng chờ mmh_dy_q khi chưa đăng nhập / mất mạng, tự gửi lại).
(function () {
  const D = window.DAILY; if (!D) return;
  const R = window.RANK = window.RANK || {};   // social.js gắn thêm: tabs / panes / extraSet / friendSet / addBtn / onNew / celebrate
  const esc = D.esc, store = D.store, L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  const SHOW = { talk: 'MMH Talk', clinicroom: 'The Clinic Room', lawdesk: 'Law & Tender Desk', headlines: 'Morning Headlines', english: 'English at Work', aipulse: 'AI Pulse', weekly: 'Week in Review' };
  const KIND = { listen: ['Nghe podcast', 'Listened'], quiz: ['Kiểm tra nghe', 'Listening quiz'], vocab: ['Từ khoá', 'Keywords'], read: ['Đọc', 'Reading'], dictation: ['Chép chính tả', 'Dictation'],
    speak: ['Nói theo', 'Speaking'], lesson: ['Xong bài học', 'Finished a lesson'], coach: ['Luyện nói', 'Speaking coach'], flash: ['Thẻ từ', 'Flashcards'] };
  const AV = { chip: ['Chíp', '#0E7C6B'], mochi: ['Mochi', '#7C8BA1'], tofu: ['Tofu', '#D98B3A'], capy: ['Capy', '#8B6A4E'], pip: ['Pip', '#3A5CAA'], kiko: ['Kiko', '#C8553D'], bao: ['Bảo', '#4A4A4A'],
    rang: ['Răng Xinh', '#3FA7B4'], iris: ['Iris', '#2F8F83'], bit: ['Bit', '#5B6CD9'], so: ['Sò', '#9A6B3F'], nhim: ['Nhím', '#7A5C3A'], hana: ['Hana', '#D9708F'] };
  const PICK = Object.keys(AV).filter(k => k !== 'chip');
  const pickFor = me => (me && me.admin ? ['chip', ...PICK] : PICK);
  const LEAGUES = [['Đồng', 'Bronze', '#B87A4B'], ['Bạc', 'Silver', '#A9B0BB'], ['Vàng', 'Gold', '#D4A43A'], ['Ngọc', 'Sapphire', '#4FA3D9'], ['Kim cương', 'Diamond', '#9FE3F0']];
  const GOALS = [[20, 'Nhẹ nhàng', 'Casual'], [50, 'Đều đặn', 'Regular'], [100, 'Nghiêm túc', 'Serious'], [150, 'Bứt phá', 'Intense']];

  /* ── phiên + gọi máy chủ ── */
  const tok = () => D.tkGet();
  const meC = () => store.get('mmh_dy_me', null);
  const setMe = me => { if (me) { store.set('mmh_dy_me', me); paintTab(); } };
  async function post(action, params) {
    const r = await fetch(D.HUB, { method: 'POST', body: new URLSearchParams({ action, ...params }), credentials: 'omit' });
    return r.json();
  }
  function authFail(d) { if (d && d.code === 'AUTH') { D.tkSet(''); store.set('mmh_dy_me', null); paintTab(); return true; } return false; }
  function logout() { try { localStorage.removeItem('mmh_daily_tk'); localStorage.setItem('mmh_daily_out', '1'); } catch { /* riêng tư */ } store.set('mmh_dy_me', null); paintTab(); }
  const av = (k, size = 40, mood = 'happy') => {   // nhân vật vẽ bằng SVG (chars.js); chưa tải được ⇒ vòng tròn chữ cái
    if (window.CHARS) return `<span class="dy-av" style="--s:${size}px" aria-hidden="true">${CHARS.svg(k || 'chip', mood, { bg: '#F3EFE7', round: true })}</span>`;
    const a = AV[k] || AV.chip;
    return `<span class="dy-av dy-av0" style="--c:${a[1]};--s:${size}px" aria-hidden="true"><b>${esc(a[0].slice(0, 1))}</b></span>`;
  };
  const lgN = i => LEAGUES[i] ? L(LEAGUES[i][0], LEAGUES[i][1]) : '';
  const num = n => Number(n || 0).toLocaleString(D.S.lang === 'en' ? 'en-US' : 'vi-VN');
  const fmtD = s => { const [, m, d] = String(s).split('-'); return d ? `${+d}/${+m}` : ''; };
  const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); return m < 1 ? L('vừa xong', 'just now') : m < 60 ? m + L(' phút trước', ' min ago') : m < 1440 ? Math.round(m / 60) + L(' giờ trước', ' h ago') : Math.round(m / 1440) + L(' ngày trước', ' d ago'); };
  const flame = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2-5 0 2 1 3 2 3 0-3 1-6 1-8z" fill="currentColor"/></svg>';
  const ice = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M4 7l16 10M20 7 4 17M9 3l3 3 3-3M9 21l3-3 3 3"/></svg>';

  /* ── đăng nhập / tạo tài khoản ── */
  let dlg = null;
  function login(why) {
    return new Promise(done => {
      dlg?.remove();
      dlg = document.createElement('div'); dlg.className = 'rk-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
      const st = { step: 'email', email: store.get('mmh_daily_email', ''), hello: null, why: 'new', avatar: PICK[Math.floor(Math.random() * PICK.length)], busy: false };
      const head = (t, s) => `<button type="button" class="rk-x" aria-label="${L('Đóng', 'Close')}">✕</button><div class="dy-hd">${av(st.hello?.avatar || st.avatar, 56)}<div><h3>${t}</h3>${s ? `<p class="rk-why">${s}</p>` : ''}</div></div>`;
      const paint = (msg = '') => {
        st.busy = false; let h;
        if (st.step === 'email') h = head(L('Học tiếng Anh mỗi ngày', 'Learn English every day'), esc(why || L('Đăng nhập hoặc tạo tài khoản để lưu XP, giữ chuỗi ngày học và lên bảng xếp hạng.', 'Sign in or create an account to save XP, keep your streak and join the ranking.'))) +
          `<input name="email" type="email" autocomplete="username" placeholder="${L('Email của bạn', 'Your email')}" value="${esc(st.email)}" required>
           <button class="rk-btn" type="submit">${L('Tiếp tục', 'Continue')}</button>
           <p class="dy-small">${L('Dùng email bất kỳ. Lần đầu sẽ nhận mã kích hoạt qua email.', 'Any email works. The first time you get an activation code by email.')}</p>`;
        else if (st.step === 'pw') h = head(L('Chào ', 'Welcome back, ') + esc(st.hello.nick || ''), esc(st.email)) +
          `<input type="email" name="u" autocomplete="username" value="${esc(st.email)}" hidden>
           <input name="pw" type="password" autocomplete="current-password" placeholder="${L('Mật khẩu', 'Password')}" required>
           <button class="rk-btn" type="submit">${L('Đăng nhập', 'Sign in')}</button>
           <div class="dy-row2"><button type="button" class="rk-link" data-dy="back">‹ ${L('Email khác', 'Other email')}</button><button type="button" class="rk-link" data-dy="forgot">${L('Quên mật khẩu?', 'Forgot password?')}</button></div>`;
        else {
          const isNew = st.why === 'new', fresh = !st.hello?.exists;
          h = head(isNew ? L('Kích hoạt tài khoản', 'Activate your account') : L('Đặt lại mật khẩu', 'Reset your password'), L('Đã gửi mã 6 số tới ', 'We sent a 6-digit code to ') + `<b>${esc(st.email)}</b>` + L(' (xem cả thư mục Spam).', ' (check Spam too).')) +
            `<input type="email" name="u" autocomplete="username" value="${esc(st.email)}" hidden>
             <input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="${L('Mã 6 số', '6-digit code')}" required>
             <input name="pw" type="password" autocomplete="new-password" minlength="6" placeholder="${isNew ? L('Tạo mật khẩu (ít nhất 6 ký tự)', 'Create a password (6+ characters)') : L('Mật khẩu mới', 'New password')}" required>
             ${fresh ? `<input name="nick" maxlength="24" placeholder="${L('Biệt danh hiện trên bảng xếp hạng', 'Nickname shown on the ranking')}" required>
             <p class="dy-lbl">${L('Chọn nhân vật của bạn', 'Pick your character')}</p><div class="dy-pick">${PICK.map(k => `<button type="button" data-dy="av" data-k="${k}" class="${k === st.avatar ? 'on' : ''}" title="${esc(AV[k][0])}">${av(k, 44)}<small>${esc(AV[k][0])}</small></button>`).join('')}</div>` : ''}
             <button class="rk-btn" type="submit">${isNew ? L('Bắt đầu học', 'Start learning') : L('Đặt mật khẩu & đăng nhập', 'Save & sign in')}</button>
             <div class="dy-row2"><button type="button" class="rk-link" data-dy="back">‹ ${L('Quay lại', 'Back')}</button><button type="button" class="rk-link" data-dy="resend">${L('Gửi lại mã', 'Resend code')}</button></div>`;
        }
        dlg.innerHTML = `<form class="rk-box dy-box" autocomplete="on" novalidate>${h}${msg ? `<p class="rk-err" role="alert">${esc(msg)}</p>` : ''}</form>`;
        const f = dlg.querySelector('form');
        f.onsubmit = e => { e.preventDefault(); submit(f); };
        dlg.querySelector('.rk-x').onclick = () => { dlg.remove(); done(false); };
        setTimeout(() => f.querySelector('input:not([hidden]):not([value]), input[name=pw], input[name=code], input[name=email]')?.focus(), 30);
      };
      const busy = (f, on) => { st.busy = on; const b = f.querySelector('.rk-btn'); if (b) { b.disabled = on; if (on) b.textContent = L('Đang kiểm tra…', 'Checking…'); } };
      async function sendCode(why) {
        const d = await D.hub('dyCode', { email: st.email, why });
        if (!d.ok && d.code !== 'WAIT') throw new Error(d.error || L('Chưa gửi được mã', 'Could not send the code'));
        st.why = d.why || why; st.step = 'code'; paint(d.ok ? '' : d.error);
      }
      async function submit(f) {
        if (st.busy) return;
        busy(f, true);
        try {
          if (st.step === 'email') {
            st.email = f.email.value.trim().toLowerCase();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email)) throw new Error(L('Email chưa đúng định dạng.', 'Please enter a valid email.'));
            store.set('mmh_daily_email', st.email);
            const d = await D.hub('dyHello', { email: st.email }); if (!d.ok) throw new Error(d.error);
            st.hello = d;
            if (d.exists && d.hasPw) { st.step = 'pw'; return paint(); }
            return await sendCode('new');
          }
          if (st.step === 'pw') {
            const d = await post('dyLogin', { email: st.email, pw: f.pw.value });
            if (d.ok) return ok(d);
            if (d.code === 'NOPW' || d.code === 'NOUSER') return await sendCode('new');
            throw new Error(d.error || L('Không đăng nhập được', 'Could not sign in'));
          }
          const p = { email: st.email, code: f.code.value.trim(), pw: f.pw.value };
          if (f.nick) { p.nick = f.nick.value.trim(); p.avatar = st.avatar; if (p.nick.length < 2) throw new Error(L('Biệt danh cần ít nhất 2 ký tự.', 'Nickname needs at least 2 characters.')); }
          if (p.pw.length < 6) throw new Error(L('Mật khẩu cần ít nhất 6 ký tự.', 'Password needs at least 6 characters.'));
          const d = await post('dyVerify', p);
          if (!d.ok) throw new Error(d.error || L('Mã chưa đúng', 'Wrong code'));
          return ok(d);
        } catch (er) { busy(f, false); paint(er.message); }
      }
      dlg.addEventListener('click', async e => {
        const t = e.target.closest('[data-dy]'); if (!t) return;
        const k = t.dataset.dy;
        if (k === 'av') { st.avatar = t.dataset.k; dlg.querySelectorAll('[data-dy="av"]').forEach(b => b.classList.toggle('on', b === t)); dlg.querySelector('.dy-hd .dy-av')?.replaceWith(document.createRange().createContextualFragment(av(st.avatar, 56))); return; }
        if (k === 'back') { st.step = st.step === 'code' && st.hello?.hasPw ? 'pw' : 'email'; return paint(); }
        try { if (k === 'forgot') await sendCode('reset'); if (k === 'resend') await sendCode(st.why); } catch (er) { paint(er.message); }
      });
      const ok = d => {
        D.tkSet(d.token); setMe(d.me); dlg.remove(); if (d.isNew && R.onNew) setTimeout(() => R.onNew(d.me), 400);
        D.toast(d.isNew ? L('Chào mừng bạn! Bắt đầu học thôi.', 'Welcome! Let’s start learning.') : L('Đã đăng nhập', 'Signed in'));
        flush(); done(true);
      };
      paint(); document.body.appendChild(dlg);
    });
  }

  /* ── hoạt động học ⇒ XP (dyEvent), có hàng chờ ── */
  const Q = () => store.get('mmh_dy_q', []);
  const rid = () => 'dy' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function enqueue(it) { const q = Q().filter(x => !(it.key && x.key === it.key)); q.push(it); store.set('mmh_dy_q', q.slice(-40)); }
  async function send(it) {
    const { key, ...p } = it;
    const d = await D.hub('dyEvent', { tk: tok(), ...p });
    if (authFail(d)) throw Object.assign(new Error(d.error), { auth: true });
    if (!d.ok) throw new Error(d.error || L('Chưa lưu được', 'Not saved'));
    if (d.me) setMe(d.me);
    return d;
  }
  function sum(rs) {   // gộp kết quả nhiều hoạt động
    const o = { xp: 0, me: null, levelUp: 0, goalHit: false, repeat: false };
    rs.forEach(d => { o.xp += d.xp || 0; o.me = d.me || o.me; o.levelUp = Math.max(o.levelUp, d.levelUp || 0); o.goalHit = o.goalHit || d.goalHit; o.repeat = o.repeat || d.repeat; });
    return o;
  }
  function cheer(o) {
    if (!o || !o.me) return;
    if (o.levelUp && R.celebrate) R.celebrate(L(`Lên cấp ${o.levelUp}!`, `Level ${o.levelUp}!`), o.me);
    else if (o.levelUp) D.toast(L(`Lên cấp ${o.levelUp}!`, `Level ${o.levelUp} reached!`));
    else if (o.goalHit) D.toast(L('Đạt mục tiêu hôm nay!', 'Daily goal reached!'));
    else if (o.xp) D.toast(`+${o.xp} XP`);
  }
  let flushing = null;
  function flush() {   // gửi hàng chờ; trả kết quả gộp (hoặc null)
    if (flushing) return flushing;
    flushing = (async () => {
      const q = Q(); if (!q.length || !tok()) return null;
      const left = [], got = [];
      for (const it of q) { try { got.push(Object.assign(await send(it), { date: it.date })); } catch (e) { left.push(it); if (e.auth) break; } }
      store.set('mmh_dy_q', left);
      if (!got.length) return null;
      const o = Object.assign(sum(got), { date: got[got.length - 1].date }); cheer(o); return o;
    })().finally(() => { flushing = null; });
    return flushing;
  }
  async function event(kind, p = {}, opt = {}) {
    const it = { kind, rid: rid(), ...p }; if (opt.key) it.key = opt.key;
    if (!tok()) { enqueue(it); return { need: true }; }
    try { const d = await send(it); if (!opt.quiet) cheer(d); return d; }
    catch (e) { enqueue(it); return { need: !!e.auth, err: e.message }; }
  }
  // study.js ▸ Tổng kết: từ khoá + kiểm tra nghe + nói theo + hoàn thành bài
  async function submit(ed, r) {
    const base = { date: ed.date, show: ed.podcast?.show || '' }, k = ed.date + '|';
    const items = [
      r.wordsN ? { kind: 'vocab', ...base, right: r.known || 0, n: r.wordsN, key: k + 'vocab' } : null,
      r.quizN ? { kind: 'quiz', ...base, right: r.quiz, n: r.quizN, key: k + 'quiz' } : null,
      r.spoken ? { kind: 'speak', ...base, pct: r.speak || 0, n: r.spoken, key: k + 'speak' } : null,
      { kind: 'lesson', ...base, words: r.words || 0, key: k + 'lesson' }
    ].filter(Boolean).map(x => ({ ...x, rid: rid() }));
    if (!tok()) { items.forEach(enqueue); return { need: true }; }
    const got = [];
    for (const it of items) { try { got.push(await send(it)); } catch (e) { enqueue(it); if (e.auth) { items.slice(items.indexOf(it) + 1).forEach(enqueue); return { need: true }; } } }
    if (!got.length) return { err: L('mất kết nối', 'offline') };
    const o = sum(got); cheer(o); return o;
  }
  // nghe podcast ≥ 80% (hoặc hết bài) ⇒ 1 lần / số
  D.audio.addEventListener('timeupdate', () => {
    const a = D.audio, ep = D.S.ep; if (!ep || !a.duration || a.currentTime / a.duration < 0.8) return;
    const sent = store.get('mmh_dy_lis', {}); if (sent[ep.date]) return;
    sent[ep.date] = 1; store.set('mmh_dy_lis', Object.fromEntries(Object.entries(sent).slice(-30)));
    event('listen', { date: ep.date, show: ep.podcast?.show || '', pct: Math.round(a.currentTime / a.duration * 100), sec: Math.round(a.currentTime) }, { key: ep.date + '|listen' });
  });

  /* ── tab "Tôi" (ảnh nhân vật nhỏ ở thanh dưới / menu) ── */
  function paintTab() {
    const me = meC();
    document.querySelectorAll('[data-dy-tab]').forEach(el => { el.innerHTML = me ? av(me.avatar, 24) : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'; });
    document.querySelectorAll('[data-dy-streak]').forEach(el => { el.textContent = me && me.streak ? me.streak : ''; el.hidden = !(me && me.streak); });
  }

  /* ── trang Bảng xếp hạng ── */
  let period = store.get('mmh_dy_per', 'league');
  function page() {
    return `<div class="rk dy"><div class="rk-head"><div><p class="ls-k">${L('Thi đua học tiếng Anh', 'English learning challenge')}</p><h1 class="ls-t">${L('Bảng xếp hạng', 'Ranking')}</h1>
        <p class="rk-sub">${L('XP có được khi nghe podcast, làm bài kiểm tra, học từ khoá, nói theo và luyện nói. Làm lại một bài chỉ được 20% XP.', 'Earn XP by listening, taking quizzes, learning keywords, repeating lines and speaking practice. Repeating a lesson gives 20% XP.')}</p></div>
        <div class="ls2-sub rk-per">${[['league', L('Giải đấu', 'League')], ['friends', L('Bạn bè', 'Friends')], ['week', L('Tuần', 'Week')], ['month', L('Tháng', 'Month')]].map(([k, n]) => `<button type="button" data-rk="per" data-k="${k}" class="${period === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div id="rk-body"><div class="rk-empty">${L('Đang tải…', 'Loading…')}</div></div></div>`;
  }
  const gate = (t, s) => `<div class="dy-gate">${av('chip', 96, 'wave')}<h2>${t}</h2><p>${s}</p><button class="st-go" type="button" data-rk="login">${L('Đăng nhập / Tạo tài khoản', 'Sign in / Create account')}</button></div>`;
  async function load() {
    const el = document.getElementById('rk-body'); if (!el) return;
    if (!tok()) { el.innerHTML = gate(L('Cùng đồng nghiệp thi đua', 'Compete with your colleagues'), L('Tạo tài khoản miễn phí bằng email để lưu XP, giữ chuỗi ngày học và leo hạng từ Đồng lên Kim cương.', 'Create a free account with your email to save XP, keep your streak and climb from Bronze to Diamond.')); return; }
    flush();
    let d; try { d = await D.hub('dyBoard', { tk: tok(), period: period === 'friends' ? 'week' : period }); if (period === 'friends' && d.ok && R.friendSet) { const fs = await R.friendSet(); d.rows = d.rows.filter(x => x.me || fs.has(x.id)); d.recent = (d.recent || []).filter(x => fs.has(x.id) || x.id === (meC() || {}).id); } } catch (e) { el.innerHTML = `<div class="rk-empty">${esc(e.message)}</div>`; return; }
    if (authFail(d)) return load();
    if (!d.ok) { el.innerHTML = `<div class="rk-empty">${esc(d.error || L('Không tải được bảng xếp hạng.', 'Could not load the ranking.'))}</div>`; return; }
    if (!document.getElementById('rk-body')) return;
    const rows = d.rows || [], mine = rows.findIndex(x => x.me), me = meC(), lg = d.league || 0, promo = (d.promo || [])[lg];
    const medal = ['#D4A43A', '#A9B0BB', '#B87A4B'];
    const lgBar = period === 'league' ? `<div class="dy-lg" style="--lg:${LEAGUES[lg][2]}">
        <div class="dy-lgs">${LEAGUES.map((x, i) => `<i class="${i === lg ? 'on' : i < lg ? 'past' : ''}" style="--lg:${x[2]}" title="${esc(lgN(i))}"></i>`).join('')}</div>
        <b>${L('Giải ', '')}${esc(lgN(lg))}${L('', ' League')}</b><span>${lg < 4 && promo ? L(`Đạt ${promo} XP trong tuần để lên giải ${lgN(lg + 1)}. Dưới 30 XP sẽ xuống giải.`, `Earn ${promo} XP this week to move up to ${lgN(lg + 1)}. Under 30 XP moves you down.`) : L('Giải cao nhất — giữ phong độ nhé!', 'Top league — keep it up!')}</span></div>` : '';
    el.innerHTML = `${lgBar}<p class="rk-range">${fmtD(d.from)} – ${fmtD(d.to)} · ${rows.length} ${L('người tham gia', 'learners')}${mine >= 0 ? ` · ${L('bạn đang', 'you are')} <b>${L('hạng ', '#')}${mine + 1}</b>` : ` · ${L('bạn chưa có XP trong kỳ này', 'no XP yet this period')}`}</p>
      ${rows.length ? `<div class="rk-pod">${rows.slice(0, 3).map((x, i) => `<div class="rk-p${x.me ? ' me' : ''}" style="--m:${medal[i]}">${av(x.avatar, 54)}<i>${i + 1}</i><b>${esc(x.nick)}</b><span>${num(x.xp)} XP</span></div>`).join('')}</div>` : ''}
      <ol class="rk-list">${rows.map((x, i) => `<li class="${x.me ? 'me' : ''}"><span class="rk-n">${i + 1}</span><span class="rk-who dy-who">${av(x.avatar, 36)}<span><b>${esc(x.nick)}</b><small>${L('Cấp', 'Lv')} ${x.lvl} · ${esc(lgN(x.league))}</small></span></span>
        <span class="rk-st">${x.streak ? `<span class="dy-fl">${flame}${x.streak}</span>` : ''}${x.lessons ? ` · ${x.lessons} ${L('bài', 'lessons')}` : ''}</span><span class="rk-pt">${num(x.xp)}<small>XP</small>${!x.me && x.id && R.addBtn ? R.addBtn(x.id) : ''}</span></li>`).join('') || `<li class="rk-none">${period === 'friends' ? L('Chưa có bạn bè nào có XP tuần này. Mời bạn học cùng ở trang Tôi ▸ Bạn bè.', 'No friends with XP this week. Invite friends from Me ▸ Friends.') : L('Chưa ai có XP trong kỳ này. Hãy là người đầu tiên!', 'No XP yet this period. Be the first!')}</li>`}</ol>
      <h2 class="ls-sh">${L('Hoạt động gần đây', 'Recent activity')}</h2>
      <div class="rk-feed dy-feed">${(d.recent || []).map(x => `<div>${av(x.avatar, 32)}<p><b>${esc(x.nick)}</b> · ${esc(L(...(KIND[x.kind] || [x.kind, x.kind])))}${x.date ? ` <a href="#/listen/${esc(x.date)}">${esc(SHOW[x.show] || x.show || '')} ${fmtD(x.date)}</a>` : ''}<small>${ago(x.at)}</small></p><em>+${x.xp} XP</em></div>`).join('') || `<p class="rk-none">${L('Chưa có hoạt động.', 'No activity yet.')}</p>`}</div>
      ${me ? `<p class="rk-foot">${av(me.avatar, 22)} ${esc(me.nick)} · <a class="rk-link" href="#/me">${L('Trang của tôi ›', 'My profile ›')}</a></p>` : ''}`;
  }

  /* ── trang "Tôi" ── */
  function mePage() {
    return `<div class="rk dy"><div id="me-body"><div class="rk-empty">${L('Đang tải…', 'Loading…')}</div></div></div>`;
  }
  let meTab = 'stat';
  async function meLoad() {
    const el = document.getElementById('me-body'); if (!el) return;
    if (!tok()) { el.innerHTML = gate(L('Tài khoản học của bạn', 'Your learning account'), L('Theo dõi XP, cấp độ, chuỗi ngày học, mục tiêu mỗi ngày và lịch sử học. Nhận email nhắc học buổi tối nếu muốn.', 'Track XP, level, streak, daily goal and history. Get an evening reminder email if you like.')); return; }
    const cached = meC(); if (cached) el.innerHTML = meHtml({ me: cached, week: [], log: null });
    flush();
    let d; try { d = await D.hub('dyMe', { tk: tok(), log: 1 }); } catch (e) { if (!cached) el.innerHTML = `<div class="rk-empty">${esc(e.message)}</div>`; return; }
    if (authFail(d)) return meLoad();
    if (!d.ok) { el.innerHTML = `<div class="rk-empty">${esc(d.error || '')}</div>`; return; }
    if (d.token) D.tkSet(d.token);
    setMe(d.me); ME = d;
    if (document.getElementById('me-body')) el.innerHTML = meHtml(d);
  }
  let ME = null;
  function meHtml(d) {
    const me = d.me, week = d.week || [], todayXp = week.length ? week[week.length - 1].xp : 0, goal = me.goal || 50;
    const pct = Math.min(100, Math.round((me.xp - me.lvlFrom) / Math.max(1, me.lvlTo - me.lvlFrom) * 100)), gp = Math.min(100, Math.round(todayXp / goal * 100));
    const max = Math.max(goal, ...week.map(w => w.xp), 1), wd = s => new Date(s + 'T00:00:00').toLocaleDateString(D.S.lang === 'en' ? 'en-US' : 'vi-VN', { weekday: 'short' });
    const roll = d.roll && d.roll.to !== d.roll.from ? `<div class="dy-roll ${d.roll.to > d.roll.from ? 'up' : 'down'}">${d.roll.to > d.roll.from ? L(`Chúc mừng! Bạn đã lên giải ${lgN(d.roll.to)} (${d.roll.xp} XP tuần trước).`, `Congrats! You moved up to ${lgN(d.roll.to)} (${d.roll.xp} XP last week).`) : L(`Tuần trước ${d.roll.xp} XP — bạn xuống giải ${lgN(d.roll.to)}. Tuần này lấy lại nhé!`, `Last week ${d.roll.xp} XP — you moved down to ${lgN(d.roll.to)}. Win it back this week!`)}</div>` : '';
    const acc = me.asked ? Math.round(me.right / me.asked * 100) : null;
    return `${roll}<section class="dy-hero">${av(me.avatar, 88)}<div class="dy-hi"><p class="ls-k">${esc(me.email)}</p><h1 class="ls-t">${esc(me.nick)}</h1>
        <div class="dy-chips"><span class="dy-chip" style="--lg:${LEAGUES[me.league][2]}">${L('Giải ', '')}${esc(lgN(me.league))}${L('', ' League')}</span><span class="dy-chip">${L('Cấp', 'Level')} ${me.lvl}</span>${me.admin ? `<span class="dy-chip">Admin</span>` : ''}</div>
        <div class="dy-xpbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <p class="dy-xpt">${num(me.xp)} XP · ${L('còn', '')} ${num(me.lvlTo - me.xp)} XP ${L('lên cấp', 'to level')} ${me.lvl + 1}</p></div></section>
      <div class="dy-tiles">
        <div class="dy-tile fire${me.studiedToday ? ' lit' : ''}"><span>${flame}</span><b>${me.streak}</b><small>${L('ngày liên tiếp', 'day streak')}${me.best > me.streak ? ` · ${L('kỷ lục', 'best')} ${me.best}` : ''}</small></div>
        <div class="dy-tile goal"><span class="dy-ring" style="--p:${gp}"><b>${gp}%</b></span><b>${todayXp}/${goal}</b><small>${L('XP hôm nay', 'XP today')}</small></div>
        <div class="dy-tile"><span>${ice}</span><b>${me.freeze}</b><small>${L('lần đóng băng chuỗi', 'streak freezes')}</small></div>
        <div class="dy-tile"><b>${me.lessons}</b><small>${L('bài học xong', 'lessons done')}</small></div>
        <div class="dy-tile"><b>${acc == null ? '–' : acc + '%'}</b><small>${L('câu trả lời đúng', 'correct answers')}${me.asked ? ` · ${me.right}/${me.asked}` : ''}</small></div>
        <div class="dy-tile"><b>${me.words}</b><small>${L('từ đã ghi Sổ từ', 'words saved')}</small></div>
      </div>
      ${!me.studiedToday ? `<a class="dy-cta" href="#/listen">${L('Hôm nay chưa học — nghe số mới 8 phút để giữ chuỗi', 'Not studied today — listen to today’s episode to keep your streak')} ›</a>` : ''}
      ${R.stats ? R.stats(d) : ''}
      ${week.length ? `<section class="ls-box dy-week"><h3>${L('7 ngày qua', 'Last 7 days')}</h3><div class="dy-bars" style="--g:${Math.round(goal / max * 100)}%">${week.map(w => `<div title="${w.xp} XP"><i style="height:${Math.round(w.xp / max * 100)}%" class="${w.xp >= goal ? 'ok' : ''}"></i><small>${esc(wd(w.d))}</small></div>`).join('')}</div><p class="dy-small">${L('Vạch ngang = mục tiêu mỗi ngày', 'Line = daily goal')}</p></section>` : ''}
      <div class="ls2-sub dy-tabs">${tabs(me).map(([k, n, c]) => `<button type="button" data-dy="tab" data-k="${k}" class="${meTab === k ? 'on' : ''}">${n}${c ? `<i class="dy-dot">${c}</i>` : ''}</button>`).join('')}</div>
      <div id="dy-pane">${pane(meTab, d)}</div>
      <p class="rk-foot"><a class="rk-link" href="#/rank">${L('Xem bảng xếp hạng ›', 'View the ranking ›')}</a></p>`;
  }
  function tabs(me) {
    const t = [['stat', L('Lịch sử', 'History')]];
    (R.tabs || []).forEach(f => { const x = f(me); if (x) t.push(x); });
    t.push(['set', L('Cài đặt', 'Settings')]);
    if (!t.some(x => x[0] === meTab)) meTab = 'stat';
    return t;
  }
  function pane(k, d) { if (k === 'set') return setHtml(d.me); if (R.panes && R.panes[k]) return R.panes[k](d); return histHtml(d.log); }
  function histHtml(log) {
    if (log == null) return `<div class="rk-empty">${L('Đang tải…', 'Loading…')}</div>`;
    const rows = log.filter(x => KIND[x.kind] && x.xp > 0);
    if (!rows.length) return `<p class="rk-none">${L('Chưa có hoạt động. Nghe podcast hôm nay để có XP đầu tiên!', 'No activity yet. Listen to today’s podcast for your first XP!')}</p>`;
    return `<div class="rk-feed dy-feed">${rows.map(x => `<div><p><b>${esc(L(...KIND[x.kind]))}</b>${x.date ? ` · <a href="#/listen/${esc(x.date)}">${esc(SHOW[x.show] || x.show || '')} ${fmtD(x.date)}</a>` : ''}${det(x.d)}<small>${ago(x.at)}</small></p><em>+${x.xp} XP</em></div>`).join('')}</div>`;
  }
  function det(s) { try { const o = JSON.parse(s || '{}'); return o.n ? ` · ${o.right != null ? o.right + '/' + o.n : ''}${o.pct ? ' ' + o.pct + '%' : ''}` : o.pct ? ` · ${o.pct}%` : ''; } catch { return ''; } }
  function setHtml(me) {
    return `<form class="ls-box dy-set" data-dy-form="prof">
        <label>${L('Biệt danh', 'Nickname')}<input name="nick" maxlength="24" value="${esc(me.nick)}"></label>
        <p class="dy-lbl">${L('Nhân vật', 'Character')}</p><div class="dy-pick">${pickFor(me).map(k => `<button type="button" data-dy="pav" data-k="${k}" class="${k === me.avatar ? 'on' : ''}" title="${esc(AV[k][0])}">${av(k, 44)}<small>${esc(AV[k][0])}</small></button>`).join('')}${String(me.avatar).startsWith('c:') ? `<button type="button" data-dy="pav" data-k="${esc(me.avatar)}" class="on">${av(me.avatar, 44)}<small>${L('Của tôi', 'Mine')}</small></button>` : ''}</div>
        ${R.extraSet ? R.extraSet(me) : ''}
        <p class="dy-lbl">${L('Mục tiêu mỗi ngày', 'Daily goal')}</p><div class="dy-goals">${GOALS.map(([g, v, e]) => `<button type="button" data-dy="goal" data-k="${g}" class="${g === me.goal ? 'on' : ''}"><b>${g} XP</b><small>${L(v, e)}</small></button>`).join('')}</div>
        <label class="dy-sw"><input type="checkbox" name="notify" ${me.notify ? 'checked' : ''}><span>${L('Email nhắc học buổi tối khi hôm đó chưa học', 'Evening reminder email when I haven’t studied')}</span></label>
        <button class="st-go" type="submit">${L('Lưu thay đổi', 'Save changes')}</button></form>
      <form class="ls-box dy-set" data-dy-form="pw"><h3>${L('Đổi mật khẩu', 'Change password')}</h3>
        <input type="email" name="u" autocomplete="username" value="${esc(me.email)}" hidden>
        <input name="old" type="password" autocomplete="current-password" placeholder="${L('Mật khẩu hiện tại (bỏ trống nếu chưa từng đặt)', 'Current password (leave empty if never set)')}">
        <input name="pw" type="password" autocomplete="new-password" minlength="6" placeholder="${L('Mật khẩu mới (ít nhất 6 ký tự)', 'New password (6+ characters)')}">
        <button class="st-go dy-sec" type="submit">${L('Đổi mật khẩu', 'Change password')}</button></form>
      <p class="rk-foot"><button class="rk-link" type="button" data-dy="out">${L('Đăng xuất khỏi máy này', 'Sign out on this device')}</button></p>`;
  }

  document.addEventListener('submit', async e => {
    const f = e.target.closest('[data-dy-form]'); if (!f) return; e.preventDefault();
    const b = f.querySelector('button[type=submit]'); b.disabled = true;
    try {
      if (f.dataset.dyForm === 'prof') {
        const sel = k => f.querySelector(`[data-dy="${k}"].on`)?.dataset.k;
        const d = await D.hub('dyProfile', { tk: tok(), nick: f.nick.value.trim(), avatar: sel('pav') || '', goal: sel('goal') || '', notify: f.notify.checked ? 1 : 0, lang: D.S.lang || 'vi' });
        if (authFail(d)) return meLoad();
        if (!d.ok) throw new Error(d.error);
        setMe(d.me); D.toast(L('Đã lưu', 'Saved')); if (ME) { ME.me = d.me; document.getElementById('me-body').innerHTML = meHtml(ME); }
      } else {
        if ((f.pw.value || '').length < 6) throw new Error(L('Mật khẩu mới cần ít nhất 6 ký tự.', 'New password needs at least 6 characters.'));
        const d = await post('dyPw', { tk: tok(), old: f.old.value, pw: f.pw.value });
        if (authFail(d)) return meLoad();
        if (!d.ok) throw new Error(d.error);
        D.tkSet(d.token); setMe(d.me); f.reset(); D.toast(L('Đã đổi mật khẩu', 'Password changed'));
      }
    } catch (er) { D.toast(er.message || L('Chưa lưu được', 'Not saved')); }
    finally { b.disabled = false; }
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-rk],[data-dy]'); if (!t || t.closest('.rk-dlg')) return;
    const k = t.dataset.rk || t.dataset.dy;
    if (k === 'per') { period = t.dataset.k; store.set('mmh_dy_per', period); document.querySelectorAll('[data-rk="per"]').forEach(b => b.classList.toggle('on', b === t)); return load(); }
    if (k === 'login') { if (await login()) { load(); meLoad(); } return; }
    if (k === 'out') { logout(); D.toast(L('Đã đăng xuất', 'Signed out')); return meLoad(); }
    if (k === 'tab') { meTab = t.dataset.k; document.querySelectorAll('[data-dy="tab"]').forEach(b => b.classList.toggle('on', b === t)); const p = document.getElementById('dy-pane'); if (p && ME) { p.innerHTML = pane(meTab, ME); R.onPane && R.onPane(meTab); } return; }
    if (k === 'pav' || k === 'goal') { t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); return; }
  });

  // mở app: gửi hàng chờ + gia hạn phiên + cập nhật ảnh nhân vật / chuỗi ngày
  paintTab();
  setTimeout(async () => {
    if (!tok()) return;
    await flush();
    try { const d = await D.hub('dyMe', { tk: tok(), log: 1 }); if (authFail(d)) return; if (d.ok) { if (d.token) D.tkSet(d.token); setMe(d.me); if (!ME) ME = d; } } catch { /* mạng */ }
  }, 3000);
  try { localStorage.removeItem('mmh_daily_score_q'); } catch { /* cũ (v3.48) */ }

  Object.assign(R, { page, load, mePage, meLoad, submit, event, login, flush, logout, pending: () => Q().length, av, tok, post, meC, setMe, authFail, gate, num, ago, fmtD, lgN, LEAGUES, flame, KIND, SHOW, L, me: () => ME, repaint: () => { const el = document.getElementById('me-body'); if (el && ME) el.innerHTML = meHtml(ME); } });
})();
