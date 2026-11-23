// MMH Daily — điểm học theo tài khoản + bảng xếp hạng (thi đua). Máy chủ: Training Hub ▸ RH_DailyScore.gs (dailyScore / dailyBoard, sheet DAILY_SCORES).
// Đăng nhập = phiên email công ty `mmh_tk` (dùng chung Report Hub / CRM / Tender Map trên cùng trang github.io): email + mật khẩu (rhAuthPw, gửi bằng POST) hoặc mã 6 số qua email.
// study.js gọi RANK.submit(ed, kết quả) ở bước Tổng kết; trang #/rank = Bảng xếp hạng tuần / tháng + hoạt động gần đây.
(function () {
  const D = window.DAILY; if (!D) return;
  const esc = D.esc, store = D.store;
  const SHOW = { talk: 'MMH Talk', clinicroom: 'The Clinic Room', lawdesk: 'Law & Tender Desk', headlines: 'Morning Headlines', english: 'English at Work', weekly: 'Week in Review' };
  const pend = () => store.get('mmh_daily_score_q', []);          // điểm chờ gửi (chưa đăng nhập / mất mạng)

  async function post(action, params) {
    const r = await fetch(D.HUB, { method: 'POST', body: new URLSearchParams({ action, ...params }), credentials: 'omit' });
    return r.json();
  }

  /* ── đăng nhập ── */
  let dlg = null;
  function login(why) {
    return new Promise(done => {
      dlg?.remove();
      dlg = document.createElement('div'); dlg.className = 'rk-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
      let st = { step: 'pw', email: store.get('mmh_daily_email', '') };
      const paint = (msg = '') => {
        dlg.innerHTML = `<form class="rk-box" autocomplete="on"><button type="button" class="rk-x" aria-label="Đóng">✕</button>
          <h3>Đăng nhập email công ty</h3><p class="rk-why">${esc(why || 'Để lưu điểm theo tài khoản và lên bảng xếp hạng.')}</p>
          ${st.step === 'code'
            ? `<p class="rk-why">Đã gửi mã 6 số tới <b>${esc(st.email)}</b>.</p><input name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="Mã 6 số" required><button class="rk-btn" type="submit">Đăng nhập</button><button type="button" class="rk-link" data-rk="back">Quay lại</button>`
            : `<input name="email" type="email" autocomplete="username" placeholder="ten@manimedicalhanoi.com" value="${esc(st.email)}" required>
               <input name="pw" type="password" autocomplete="current-password" placeholder="Mật khẩu (như Report Hub / CRM)">
               <button class="rk-btn" type="submit">Đăng nhập</button><button type="button" class="rk-link" data-rk="code">Chưa có mật khẩu? Nhận mã qua email</button>`}
          ${msg ? `<p class="rk-err">${esc(msg)}</p>` : ''}</form>`;
        const f = dlg.querySelector('form');
        f.onsubmit = async e => {
          e.preventDefault(); const b = f.querySelector('.rk-btn'); b.disabled = true; b.textContent = 'Đang kiểm tra…';
          try {
            if (st.step === 'code') {
              const d = await D.hub('rhAuthVerify', { email: st.email, code: f.code.value.trim() }); if (!d.ok) throw new Error(d.error);
              return ok(d.token);
            }
            st.email = f.email.value.trim().toLowerCase(); store.set('mmh_daily_email', st.email);
            if (!f.pw.value) return sendCode();
            const d = await post('rhAuthPw', { email: st.email, pw: f.pw.value });
            if (d.ok) return ok(d.token);
            if (d.code === 'NOPW') return sendCode();
            throw new Error(d.error || 'Không đăng nhập được');
          } catch (er) { paint(er.message); }
        };
        dlg.querySelector('.rk-x').onclick = () => { dlg.remove(); done(false); };
        dlg.querySelector('[data-rk="code"]')?.addEventListener('click', () => { st.email = (f.email.value || st.email).trim().toLowerCase(); if (st.email) sendCode(); else paint('Nhập email công ty trước.'); });
        dlg.querySelector('[data-rk="back"]')?.addEventListener('click', () => { st.step = 'pw'; paint(); });
        setTimeout(() => f.querySelector('input:not([value=""])') ? f.querySelector('[name=pw],[name=code]')?.focus() : f.querySelector('input')?.focus(), 30);
      };
      const sendCode = async () => {
        try { const d = await D.hub('rhAuthStart', { email: st.email }); if (!d.ok) throw new Error(d.error); st.step = 'code'; paint(); }
        catch (er) { paint(er.message); }
      };
      const ok = tk => { D.tkSet(tk); dlg.remove(); D.toast('Đã đăng nhập'); done(true); };
      paint(); document.body.appendChild(dlg);
    });
  }

  /* ── gửi điểm ── */
  async function send(it) {
    const d = await D.hub('dailyScore', { tk: D.tkGet(), ...it });
    if (d.code === 'AUTH') { D.tkSet(''); throw Object.assign(new Error(d.error), { auth: true }); }
    if (!d.ok) throw new Error(d.error || 'Không lưu được điểm');
    return d;
  }
  let flushing = null;
  function flush() {                                     // gửi điểm đang chờ; trả kết quả lượt cuối gửi được (hoặc null)
    if (flushing) return flushing;
    flushing = (async () => {
      const q = pend(); if (!q.length || !D.tkGet()) return null;
      const left = []; let last = null;
      for (const it of q) { try { last = Object.assign(await send(it), { date: it.date }); } catch (e) { left.push(it); if (e.auth) break; } }
      store.set('mmh_daily_score_q', left); return last;
    })().finally(() => { flushing = null; });
    return flushing;
  }
  async function submit(ed, r) {
    const it = { date: ed.date, show: ed.podcast.show, quiz: r.quiz, quizN: r.quizN, speak: r.speak == null ? '' : r.speak, spoken: r.spoken, words: r.words,
      rid: 'ds' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    if (!D.tkGet()) { store.set('mmh_daily_score_q', [...pend().filter(x => x.date !== it.date), it]); return { need: true }; }
    try { return await send(it); }
    catch (e) { store.set('mmh_daily_score_q', [...pend().filter(x => x.date !== it.date), it]); return { need: !!e.auth, err: e.message }; }
  }

  /* ── trang Bảng xếp hạng ── */
  let period = 'week';
  const fmtD = s => { const [y, m, d] = String(s).split('-'); return `${+d}/${+m}`; };
  const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : Math.round(m / 1440) + ' ngày trước'; };
  function page() {
    return `<div class="rk"><div class="rk-head"><div><p class="ls-k">Thi đua học tiếng Anh</p><h1 class="ls-t">Bảng xếp hạng</h1>
        <p class="rk-sub">Điểm mỗi bài = câu nghe đúng × 10 + điểm nói theo (tối đa 20) + 10 hoàn thành. Làm lại một bài chỉ tính lần cao nhất.</p></div>
        <div class="ls2-sub rk-per">${[['week', 'Tuần này'], ['month', 'Tháng này']].map(([k, n]) => `<button type="button" data-rk="per" data-k="${k}" class="${period === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div id="rk-body"><div class="rk-empty">Đang tải…</div></div></div>`;
  }
  async function load() {
    const el = document.getElementById('rk-body'); if (!el) return;
    if (!D.tkGet()) { el.innerHTML = `<div class="rk-empty">Đăng nhập email công ty để xem bảng xếp hạng và lưu điểm của bạn.<br><button class="st-go" type="button" data-rk="login">Đăng nhập</button></div>`; return; }
    await flush();
    let d; try { d = await D.hub('dailyBoard', { tk: D.tkGet(), period }); } catch (e) { el.innerHTML = `<div class="rk-empty">${esc(e.message)}</div>`; return; }
    if (d.code === 'AUTH') { D.tkSet(''); return load(); }
    if (!d.ok) { el.innerHTML = `<div class="rk-empty">${esc(d.error || 'Không tải được bảng xếp hạng.')}</div>`; return; }
    const me = (d.me || '').toLowerCase(), mine = d.rows.findIndex(x => x.pic.toLowerCase() === me);
    const top = d.rows.slice(0, 3), medal = ['#D4A43A', '#A9B0BB', '#B87A4B'];
    el.innerHTML = `<p class="rk-range">${fmtD(d.from)} – ${fmtD(d.to)} · ${d.rows.length} người tham gia${mine >= 0 ? ` · bạn đang <b>hạng ${mine + 1}</b>` : ' · bạn chưa làm bài nào trong kỳ này'}</p>
      ${top.length ? `<div class="rk-pod">${top.map((x, i) => `<div class="rk-p${x.pic.toLowerCase() === me ? ' me' : ''}" style="--m:${medal[i]}"><i>${i + 1}</i><b>${esc(x.pic)}</b><span>${x.points} điểm</span></div>`).join('')}</div>` : ''}
      <ol class="rk-list">${d.rows.map((x, i) => `<li class="${x.pic.toLowerCase() === me ? 'me' : ''}"><span class="rk-n">${i + 1}</span><span class="rk-who"><b>${esc(x.pic)}</b><small>${esc(x.dept || '')}</small></span>
        <span class="rk-st">${x.lessons} bài · nghe ${x.quizN ? Math.round(x.quiz / x.quizN * 100) : 0}%${x.speak != null ? ` · nói ${x.speak}%` : ''}</span><span class="rk-pt">${x.points}</span></li>`).join('') || '<li class="rk-none">Chưa ai làm bài trong kỳ này. Hãy là người đầu tiên!</li>'}</ol>
      <h2 class="ls-sh">Hoạt động gần đây</h2>
      <div class="rk-feed">${(d.recent || []).map(x => `<div><b>${esc(x.pic)}</b> làm bài <a href="#/listen/${esc(x.date)}">${esc(SHOW[x.show] || x.show)} ${fmtD(x.date)}</a> · nghe đúng ${x.quiz}/${x.quizN}${x.speak != null && x.speak !== '' ? ` · nói ${x.speak}%` : ''} · <b>${x.points} điểm</b>${x.plays > 1 ? ` · làm ${x.plays} lần` : ''}<small>${ago(x.at)}</small></div>`).join('') || '<p class="rk-none">Chưa có lượt làm bài.</p>'}</div>
      <p class="rk-foot">Đang đăng nhập: ${esc(d.me)} · <button class="rk-link" type="button" data-rk="out">Đăng xuất</button></p>`;
  }
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-rk]'); if (!t || t.closest('.rk-dlg')) return;
    const k = t.dataset.rk;
    if (k === 'per') { period = t.dataset.k; document.querySelectorAll('[data-rk="per"]').forEach(b => b.classList.toggle('on', b === t)); return load(); }
    if (k === 'login') { if (await login()) load(); return; }
    if (k === 'out') { D.tkSet(''); return load(); }
  });

  window.RANK = { page, load, submit, login, flush, pending: () => pend().length };
  setTimeout(flush, 4000);
})();
