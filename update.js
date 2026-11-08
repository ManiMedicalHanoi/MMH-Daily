// MMH Daily — "Tổng hợp ngay": chọn chủ đề, nguồn báo, người viết, giọng đọc ⇒ bấm 1 nút ngay trên app.
// App KHÔNG giữ token: Training Hub (dailyRun) kiểm phiên email công ty rồi chạy GitHub Actions / mở phiên Claude hộ.
(function () {
  const D = window.DAILY; if (!D) return;
  const $ = s => document.querySelector(s), esc = D.esc, store = D.store;
  const HUB = 'https://script.google.com/macros/s/AKfycbwsX4cQEoH4LNlmcNfe8qWIM9K6EiDEXy7PjhP9bHY2citL6xHn5L1unsAlQJHyL9EP/exec';
  const CFG = window.DAILY_CFG || {};
  const dlg = $('#upd-dlg'), box = dlg && dlg.querySelector('.dlg-box');
  if (!dlg || !box) return;
  dlg.classList.add('upd2');

  const SEL_KEY = 'mmh_daily_sel2';
  let SRC = null, sel = Object.assign({ kind: 'daily', writer: 'auto', voice: 'edge', preset: 'news', topics: [], off: [] }, store.get(SEL_KEY, {}));
  let flags = null, admin = false, login = null, running = store.get('mmh_daily_run', null), poll = null, preview = null;
  const save = () => store.set(SEL_KEY, sel);

  async function hubPost(action, params) {
    const body = new URLSearchParams({ action, payload: JSON.stringify(params) });
    const r = await fetch(HUB, { method: 'POST', body, credentials: 'omit' });
    return r.json();
  }
  const tk = () => D.tkGet();

  async function loadSrc() {
    if (SRC) return SRC;
    try { SRC = await (await fetch('data/sources.json?t=' + Date.now(), { cache: 'no-store' })).json(); } catch { SRC = { groups: [], topics: [], voice: { presets: [] } }; }
    return SRC;
  }
  async function loadFlags() {
    if (!tk()) return null;
    try { const d = await D.hub('dailyKey', { tk: tk() }); if (d.ok) { admin = !!d.admin; flags = d.run || {}; D.IN.key = D.IN.key || d.key; } else if (d.code === 'AUTH') D.tkSet(''); } catch { /* mạng */ }
    return flags;
  }

  // ── giao diện ──
  const ICO = {
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z M14 3v4h4 M9 11h6 M9 15h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  };
  const nSel = () => { const all = SRC.groups.flatMap(g => g.outlets); return [all.filter(o => !sel.off.includes(o.dom)).length, all.length]; };
  function view() {
    if (running) return progressView();
    if (!tk()) return loginView();
    const [on, all] = nSel();
    const pr = SRC.voice?.presets || [];
    return `<div class="u2-head"><h2 id="upd-h">Tổng hợp bản tin ngay</h2><button type="button" class="u2-x" data-act="close" aria-label="Đóng">×</button></div>
      <div class="u2-seg" role="tablist">${[['daily', 'Tin tức & thị trường'], ['weekly', 'Bản tin nội bộ']].map(([k, l]) => `<button type="button" role="tab" data-kind="${k}" class="${sel.kind === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${sel.kind === 'daily' ? `
      <section class="u2-sec"><h3>Chủ đề <small>bỏ trống = tất cả · số trong ngoặc = tin 48 giờ qua</small></h3>
        <div class="u2-chips">${SRC.topics.map(t => `<button type="button" data-topic="${t.id}" class="${sel.topics.includes(t.id) ? 'on' : ''}">${esc(t.vi)} <i>${t.n}</i></button>`).join('')}</div></section>
      <section class="u2-sec"><details ${store.get('mmh_daily_srcopen', false) ? 'open' : ''} id="u2-src"><summary><h3>Nguồn tin <small>${on}/${all} báo đang chọn</small></h3></summary>
        ${SRC.groups.map(g => { const k = g.outlets.filter(o => !sel.off.includes(o.dom)).length; return `<div class="u2-grp"><label class="u2-gh"><input type="checkbox" data-grp="${g.id}" ${k === g.outlets.length ? 'checked' : ''}> <b>${esc(g.vi)}</b> <span>${k}/${g.outlets.length}</span></label>
          <div class="u2-outs">${g.outlets.map(o => `<label class="${o.n ? '' : 'dim'}"><input type="checkbox" data-dom="${o.dom}" ${sel.off.includes(o.dom) ? '' : 'checked'}> ${esc(o.name)}${o.n ? ` <i>${o.n}</i>` : ''}</label>`).join('')}</div></div>`; }).join('')}
      </details></section>` : `<p class="u2-note">${ICO.lock} Tổng kết tuần từ Report Hub, CRM, thầu, đào tạo. Dữ liệu được mã hoá; chỉ nhân sự đăng nhập email công ty mới nghe / đọc được.</p>`}
      <section class="u2-sec"><h3>Người viết</h3><div class="u2-opts">
        ${opt('writer', 'claude', 'Claude viết', 'Lời thoại tự nhiên nhất, chọn tin có chủ đích. 10–20 phút. Dùng gói Claude, không tốn thêm.', flags && !(sel.kind === 'weekly' ? flags.claudeIn : flags.claude) ? 'Chưa kết nối — sẽ chạy bản tự động' : '')}
        ${opt('writer', 'auto', 'Tự động', 'Khoảng 5 phút, câu mẫu + dịch máy. Miễn phí.')}</div></section>
      <section class="u2-sec"><h3>Giọng đọc</h3><div class="u2-opts">
        ${opt('voice', 'eleven', 'Tự nhiên (ElevenLabs)', 'Giọng người thật hơn, ngắt nghỉ tự nhiên. Tốn credit ElevenLabs (~6–8 nghìn ký tự / số).')}
        ${opt('voice', 'edge', 'Miễn phí (Microsoft)', 'Rõ ràng, hơi đều giọng.')}</div>
        ${sel.voice === 'eleven' ? `<div class="u2-voices">${pr.map(p => `<label class="u2-voice${sel.preset === p.id ? ' on' : ''}"><input type="radio" name="u2-pre" value="${p.id}" ${sel.preset === p.id ? 'checked' : ''}><span><b>${esc(p.vi)}</b></span>
          <button type="button" class="u2-pv" data-pv="${esc(p.f.preview)}" title="Nghe thử ${esc(p.f.name)}">${ICO.play}${esc(p.f.name)}</button><button type="button" class="u2-pv" data-pv="${esc(p.m.preview)}" title="Nghe thử ${esc(p.m.name)}">${ICO.play}${esc(p.m.name)}</button></label>`).join('')}</div>` : ''}</section>
      <p class="u2-msg" id="u2-msg" role="status"></p>
      <div class="u2-ft">${admin ? '<button type="button" class="u2-lnk" data-act="setup">Thiết lập (Admin)</button>' : '<span></span>'}<div><button type="button" class="dlg-x" data-act="close">Đóng</button> <button type="button" class="u2-go" data-act="run">Cập nhật ngay</button></div></div>
      ${admin && store.get('mmh_daily_setup', false) ? setupView() : ''}`;
  }
  const opt = (k, v, t, d, warn) => `<label class="u2-opt${sel[k] === v ? ' on' : ''}"><input type="radio" name="u2-${k}" value="${v}" ${sel[k] === v ? 'checked' : ''}><span><b>${t}</b><em>${d}</em>${warn ? `<small>${warn}</small>` : ''}</span></label>`;
  function loginView(msg) {
    const L = login || {};
    return `<div class="u2-head"><h2 id="upd-h">Tổng hợp bản tin ngay</h2><button type="button" class="u2-x" data-act="close" aria-label="Đóng">×</button></div>
      <p class="dlg-sub">Đăng nhập bằng email công ty (giống Report Hub / CRM) để chọn nguồn và cập nhật.</p>
      ${L.sent ? `<form id="u2-f2" class="u2-login"><label for="u2-code">Mã 6 số đã gửi tới <b>${esc(L.email)}</b></label><input id="u2-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required><button class="u2-go" type="submit">Đăng nhập</button><button class="u2-lnk" type="button" data-act="relogin">Đổi email</button></form>`
        : `<form id="u2-f1" class="u2-login"><label for="u2-email">Email công ty</label><input id="u2-email" type="email" placeholder="ten@manimedicalhanoi.com" value="${esc(L.email || '')}" required><button class="u2-go" type="submit">Gửi mã</button></form>`}
      ${msg ? `<p class="u2-msg err">${esc(msg)}</p>` : ''}`;
  }
  function setupView() {
    const f = flags || {};
    return `<form class="u2-setup" id="u2-setup"><h3>Thiết lập (Admin)</h3>
      <p>Token chỉ lưu trên máy chủ Training Hub, không hiện lại trên app.</p>
      <label>Token GitHub (fine-grained, kho MMH-Daily, quyền Actions: Read and write) ${f.gh ? '<b class="ok">đã có</b>' : '<b class="no">chưa có</b>'}<input id="u2-gh" type="password" autocomplete="off" placeholder="github_pat_…"></label>
      <label>Routine tin tức — Fire URL ${f.claude ? '<b class="ok">đã có</b>' : '<b class="no">chưa có</b>'}<input id="u2-rt" placeholder="https://api.anthropic.com/v1/claude_code/routines/trig_…/fire"></label>
      <label>Routine tin tức — token<input id="u2-rtk" type="password" autocomplete="off" placeholder="sk-ant-oat01-…"></label>
      <label>Routine nội bộ — Fire URL ${f.claudeIn ? '<b class="ok">đã có</b>' : '<b class="no">chưa có</b>'}<input id="u2-rti" placeholder="https://api.anthropic.com/v1/claude_code/routines/trig_…/fire"></label>
      <label>Routine nội bộ — token<input id="u2-rtik" type="password" autocomplete="off"></label>
      <label>Lượt ElevenLabs tối đa / ngày<input id="u2-elm" type="number" min="0" max="50" value="${f.elevenMax ?? 6}"></label>
      <div class="u2-ft"><span></span><button class="u2-go" type="submit">Lưu thiết lập</button></div></form>`;
  }
  const STEP = { 'Gom tin': 'Đang gom tin từ các báo', 'Dựng số báo': 'Đang dựng số báo', 'Tạo podcast': 'Đang tạo giọng đọc', 'MP3 lên Releases': 'Đang lưu file âm thanh',
    'Giọng đọc cho số báo Claude Code viết': 'Đang tạo giọng đọc', 'Bản tin nội bộ — gom + viết': 'Đang gom số liệu nội bộ', 'Bản tin nội bộ — giọng đọc + mã hoá': 'Đang tạo giọng + mã hoá',
    'Bản tin nội bộ Claude viết — giọng đọc + mã hoá': 'Đang tạo giọng + mã hoá', 'Lưu dữ liệu': 'Đang lưu', 'Dựng trang (kèm MP3 21 ngày + bản tin nội bộ 8 tuần, đã mã hoá)': 'Đang đăng trang', deploy: 'Đang đăng trang' };
  function progressView() {
    const r = running, st = r.st || {};
    const pct = r.mode === 'claude' ? null : st.status === 'completed' ? 100 : Math.min(92, Math.round((Date.now() - r.at) / (6 * 60e3) * 100));
    return `<div class="u2-head"><h2 id="upd-h">Đang tổng hợp…</h2><button type="button" class="u2-x" data-act="close" aria-label="Đóng">×</button></div>
      <div class="u2-prog"><div class="u2-bar"><i style="width:${pct ?? 30}%"${pct == null ? ' class="ind"' : ''}></i></div>
      <p><b>${esc(r.mode === 'claude' ? 'Claude đang đọc tin và viết kịch bản' : (STEP[st.step] || (st.status === 'completed' ? 'Xong — đang chờ trang cập nhật' : 'Đã gửi yêu cầu, chờ máy chạy')))}</b></p>
      <p class="u2-small">${r.kind === 'weekly' ? 'Bản tin nội bộ' : 'Tin tức'} · ${r.voice === 'eleven' ? 'giọng ElevenLabs' : 'giọng miễn phí'} · bắt đầu ${new Date(r.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.
        Có thể đóng hộp này, app tự báo khi có số mới.</p>
      ${r.session ? `<p><a class="u2-lnk" href="${esc(r.session)}" target="_blank" rel="noopener">Xem Claude đang làm</a></p>` : ''}
      ${st.conclusion === 'failure' ? `<p class="u2-msg err">Lượt chạy bị lỗi. <a href="${esc(st.url)}" target="_blank" rel="noopener">Xem chi tiết</a></p>` : ''}</div>
      <div class="u2-ft"><button type="button" class="u2-lnk" data-act="cancelwatch">Tạo lượt khác</button><button type="button" class="dlg-x" data-act="close">Đóng</button></div>`;
  }
  function paint(msg) { box.innerHTML = msg ? loginView(msg) : view(); }
  const setMsg = (t, err) => { const m = $('#u2-msg'); if (m) { m.textContent = t; m.className = 'u2-msg' + (err ? ' err' : ''); } };

  // ── chạy ──
  async function run() {
    const btn = box.querySelector('[data-act=run]'); btn.disabled = true; setMsg('Đang gửi yêu cầu…');
    const all = SRC.groups.flatMap(g => g.outlets.map(o => o.dom));
    const on = all.filter(d => !sel.off.includes(d));
    const p = { tk: tk(), kind: sel.kind, writer: sel.writer, voice: sel.voice, voices: sel.voice === 'eleven' ? sel.preset : '',
      topics: sel.kind === 'daily' ? sel.topics.join(',') : '', sources: sel.kind === 'daily' && on.length < all.length ? on.join(',') : '' };
    try {
      const d = await hubPost('dailyRun', p);
      if (!d.ok) {
        if (d.code === 'AUTH') { D.tkSet(''); paint(d.error); wire(); return; }
        if (d.code === 'NOSETUP') { setMsg(d.error + ' Tạm thời dùng: ', true); $('#u2-msg').insertAdjacentHTML('beforeend', `<a href="https://github.com/${CFG.repo || 'ManiMedicalHanoi/MMH-Daily'}/actions/workflows/daily.yml" target="_blank" rel="noopener">chạy trên GitHub</a>.`); btn.disabled = false; return; }
        throw new Error(d.error || 'Không chạy được');
      }
      running = { kind: sel.kind, mode: d.mode, voice: sel.voice, at: Date.now(), since: D.S.index?.updated || '', inSince: D.IN.idx?.updated || '', session: d.session || '', st: {} };
      store.set('mmh_daily_run', running);
      if (d.note) D.toast(d.note);
      paint(); wire(); watch();
    } catch (e) { setMsg(e.message, true); btn.disabled = false; }
  }
  function watch() {
    clearInterval(poll);
    const tick = async () => {
      if (!running) return clearInterval(poll);
      if (running.mode !== 'claude' && tk()) {
        try { const s = await D.hub('dailyStatus', { tk: tk() }); if (s.ok && s.run && new Date(s.run.created) >= new Date(running.at - 120e3)) running.st = s.run; } catch { /* thử lại */ }
      }
      try {
        const j = await (await fetch('data/index.json?t=' + Date.now(), { cache: 'no-store' })).json();
        const ij = await fetch('data/internal/index.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
        const done = running.kind === 'weekly' ? (ij && ij.updated > (running.inSince || '')) : j.updated > running.since;
        if (done) {
          D.S.index = j; D.S.eds = {}; if (ij) { D.IN.idx = ij; D.IN.eds = {}; }
          const k = running.kind; running = null; store.set('mmh_daily_run', null); clearInterval(poll);
          D.toast(k === 'weekly' ? 'Đã có bản tin nội bộ mới' : 'Đã có số báo mới');
          dlg.hidden = true; $('#upd-btn').classList.remove('busy');
          location.hash = k === 'weekly' ? '#/noibo' : '#/listen'; D.route();
          return;
        }
      } catch { /* mạng */ }
      if (Date.now() - running.at > 60 * 60e3) { running = null; store.set('mmh_daily_run', null); clearInterval(poll); }
      store.set('mmh_daily_run', running);
      $('#upd-btn')?.classList.toggle('busy', !!running);
      if (!dlg.hidden && running) { paint(); wire(); }
    };
    $('#upd-btn').classList.add('busy');
    poll = setInterval(tick, 20e3); setTimeout(tick, 4000);
  }

  // ── sự kiện ──
  function wire() {
    const f1 = $('#u2-f1'), f2 = $('#u2-f2'), fs = $('#u2-setup');
    if (f1) f1.onsubmit = async e => { e.preventDefault(); const email = $('#u2-email').value.trim().toLowerCase(); f1.querySelector('button').disabled = true;
      try { const d = await D.hub('rhAuthStart', { email }); if (!d.ok) throw new Error(d.error); login = { email, sent: true }; paint(); wire(); } catch (er) { paint(er.message); wire(); } };
    if (f2) f2.onsubmit = async e => { e.preventDefault(); f2.querySelector('[type=submit]').disabled = true;
      try { const d = await D.hub('rhAuthVerify', { email: login.email, code: $('#u2-code').value }); if (!d.ok) throw new Error(d.error); D.tkSet(d.token); login = null; await loadFlags(); paint(); wire(); } catch (er) { paint(er.message); wire(); } };
    if (fs) fs.onsubmit = async e => {
      e.preventDefault(); const v = id => $(id).value.trim();
      try { const d = await hubPost('dailySetup', { tk: tk(), ghToken: v('#u2-gh'), rtUrl: v('#u2-rt'), rtToken: v('#u2-rtk'), rtUrlIn: v('#u2-rti'), rtTokenIn: v('#u2-rtik'), elevenMax: v('#u2-elm') });
        if (!d.ok) throw new Error(d.error); flags = d.setup; D.toast(d.message); paint(); wire(); } catch (er) { D.toast(er.message); }
    };
    const src = $('#u2-src'); if (src) src.ontoggle = () => store.set('mmh_daily_srcopen', src.open);
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.kind) { sel.kind = b.dataset.kind; save(); paint(); wire(); }
    else if (b.dataset.topic) { const t = b.dataset.topic; sel.topics = sel.topics.includes(t) ? sel.topics.filter(x => x !== t) : [...sel.topics, t]; save(); b.classList.toggle('on'); }
    else if (b.dataset.pv) { e.preventDefault(); if (preview) preview.pause(); if (preview?.src === b.dataset.pv && !preview.ended && b.classList.contains('on')) { b.classList.remove('on'); return; }
      box.querySelectorAll('.u2-pv.on').forEach(x => x.classList.remove('on')); preview = new Audio(b.dataset.pv); preview.play().catch(() => D.toast('Không phát được bản nghe thử')); b.classList.add('on'); preview.onended = () => b.classList.remove('on'); }
    else if (b.dataset.act === 'close') { dlg.hidden = true; if (preview) preview.pause(); }
    else if (b.dataset.act === 'run') run();
    else if (b.dataset.act === 'relogin') { login = { email: login?.email }; paint(); wire(); }
    else if (b.dataset.act === 'setup') { store.set('mmh_daily_setup', !store.get('mmh_daily_setup', false)); paint(); wire(); }
    else if (b.dataset.act === 'cancelwatch') { running = null; store.set('mmh_daily_run', null); clearInterval(poll); $('#upd-btn').classList.remove('busy'); paint(); wire(); }
  });
  box.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'u2-writer' || t.name === 'u2-voice') { sel[t.name.slice(3)] = t.value; save(); paint(); wire(); }
    else if (t.name === 'u2-pre') { sel.preset = t.value; save(); box.querySelectorAll('.u2-voice').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); }
    else if (t.dataset.dom) { sel.off = t.checked ? sel.off.filter(d => d !== t.dataset.dom) : [...new Set([...sel.off, t.dataset.dom])]; save(); paint(); wire(); }
    else if (t.dataset.grp) { const g = SRC.groups.find(x => x.id === t.dataset.grp); const doms = g.outlets.map(o => o.dom);
      sel.off = t.checked ? sel.off.filter(d => !doms.includes(d)) : [...new Set([...sel.off, ...doms])]; save(); paint(); wire(); }
  });

  async function open(o) {
    if (o && o.kind) { sel.kind = o.kind; save(); }
    dlg.hidden = false;
    box.innerHTML = '<p class="u2-small">Đang tải…</p>';
    await Promise.all([loadSrc(), loadFlags()]);
    paint(); wire();
  }
  const btn = $('#upd-btn');
  btn.onclick = () => open();                          // thay hộp cũ (chỉ có link) bằng bảng chọn
  window.MMHUpdate = { open };
  if (running) { if (Date.now() - running.at < 60 * 60e3) watch(); else { running = null; store.set('mmh_daily_run', null); } }
})();
