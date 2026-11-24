// MMH Daily Podcast — BẠN BÈ · MỜI QUA QR · CHỦ ĐỀ QUAN TÂM · TÔNG MÀU · THÔNG BÁO BÀI MỚI · ADMIN (24/11/2026, máy chủ Training Hub v3.51 RH_DailySocial.gs).
// Gắn vào rank.js (window.RANK): tab "Bạn bè" (+ "Mọi người" cho Admin mmh.product) ở trang Tôi, cột "Kết bạn" ở Bảng xếp hạng, trang mời #/add/<mã>,
// thẻ chào + "Bài kiểm tra cho bạn" ở trang Nghe, "Dành cho bạn" ở trang nhất, linh vật tự tạo (Admin), Web Push "tinh tinh" khi có số mới.
(function () {
  const D = window.DAILY, R = window.RANK; if (!D || !R || !R.av) return;
  const esc = D.esc, store = D.store, L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  const APP = 'https://manimedicalhanoi.github.io/MMH-Daily/';
  const VAPID = 'BI6HyiX5a_bjysyRhpTXX02o0AWqCxtMVGcr3LKhxJUvRStnbGEM_-PYlSwUYMpcnlr8xWxh_MbhZcZ6_5Btnlw';
  const TOPICS = [['ai', 'AI & Công nghệ', 'AI & Tech'], ['health', 'Y tế', 'Health'], ['eye', 'Nhãn khoa', 'Ophthalmology'], ['dental', 'Nha khoa', 'Dentistry'],
    ['surgery', 'Ngoại khoa & bệnh viện', 'Surgery & hospitals'], ['tender', 'Đấu thầu & luật', 'Tenders & law'], ['economy', 'Kinh tế', 'Economy'],
    ['politics', 'Chính trị', 'Politics'], ['society', 'Xã hội', 'Society'], ['english', 'Tiếng Anh công sở', 'Workplace English']];
  const TONES = [['teal', '#0E7C6B', '#6FD6BF'], ['coral', '#D9583B', '#FF9C80'], ['violet', '#6A4FC9', '#B9A7F5'], ['ocean', '#1F6FB2', '#7FB6F0'],
    ['amber', '#B87A12', '#F5C25A'], ['rose', '#C23E6B', '#F7A1BE'], ['forest', '#2E7D32', '#8FD08F']];
  const tn = k => (TOPICS.find(t => t[0] === k) || [k, k, k]);

  /* ── tông màu ── */
  function tone(k) {
    const t = TONES.find(x => x[0] === k) || TONES[0];
    const st = document.documentElement.style;
    if (t[0] === 'teal') { delete document.documentElement.dataset.tone; ['--accent', '--accent-ink', '--mint', '--show'].forEach(v => st.removeProperty(v)); }
    else { document.documentElement.dataset.tone = t[0]; st.setProperty('--accent', t[1]); st.setProperty('--accent-ink', t[1]); st.setProperty('--mint', t[2]); }
    store.set('mmh_dy_tone', t[0]);
  }
  tone(store.get('mmh_dy_tone', 'teal'));

  /* ── chủ đề quan tâm ── */
  const myTopics = () => { const me = R.meC(); return (me && me.topics && me.topics.length ? me.topics : store.get('mmh_dy_topics', [])) || []; };
  let tTimer = null;
  function saveTopics(list) {
    store.set('mmh_dy_topics', list);
    const me = R.meC(); if (me) { me.topics = list; R.setMe(me); }
    clearTimeout(tTimer);
    tTimer = setTimeout(async () => { if (!R.tok()) return; try { const d = await D.hub('dyProfile', { tk: R.tok(), topics: list.join(',') }); if (d.ok) R.setMe(d.me); } catch { /* mạng */ } }, 700);
  }
  const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
  /* ── chọn nhân vật: bấm ảnh nhân vật ở trang Tôi / thẻ chào ⇒ hộp chọn, lưu ngay ── */
  function avPick() {
    const me = R.meC(); if (!me) return R.login();
    const C = window.CHARS, ids = (me.admin ? ['chip'] : []).concat(C.ids.filter(k => k !== 'chip'));
    if (String(me.avatar).startsWith('c:')) ids.unshift(me.avatar);
    let sel = me.avatar;
    const dlg = document.createElement('div'); dlg.className = 'rk-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    const paint = () => {
      const c = String(sel).startsWith('c:') ? { n: L('Linh vật riêng', 'My mascot'), vi: '', en: '' } : C.list[sel] || C.list.chip;
      dlg.innerHTML = `<div class="rk-box dy-box dy-avd"><button type="button" class="rk-x" data-x aria-label="${L('Đóng', 'Close')}">✕</button>
        <h3>${L('Chọn nhân vật của bạn', 'Pick your character')}</h3>
        <div class="dy-avprev">${['wave', 'cheer', 'think', 'sleepy'].map(m => R.av(sel, 64, m)).join('')}</div>
        <p class="dy-avn"><b>${esc(c.n)}</b> ${esc(L(c.vi || '', c.en || ''))}</p>
        <div class="dy-pick big">${ids.map(k => `<button type="button" data-k="${esc(k)}" class="${k === sel ? 'on' : ''}">${R.av(k, 56)}<small>${esc(k.startsWith('c:') ? L('Của tôi', 'Mine') : C.list[k].n)}</small></button>`).join('')}</div>
        ${me.admin ? `<button type="button" class="rk-link" data-mk>${L('Tự tạo linh vật riêng (Admin) ›', 'Make your own mascot (Admin) ›')}</button>` : ''}
        <button type="button" class="rk-btn" data-save>${L('Dùng nhân vật này', 'Use this character')}</button></div>`;
    };
    paint(); document.body.appendChild(dlg);
    dlg.addEventListener('click', async e => {
      if (e.target === dlg || e.target.closest('[data-x]')) return dlg.remove();
      const b = e.target.closest('.dy-pick button'); if (b) { sel = b.dataset.k; return paint(); }
      if (e.target.closest('[data-mk]')) { dlg.remove(); location.hash = '#/me'; setTimeout(() => { document.querySelector('[data-dy="tab"][data-k="set"]')?.click(); setTimeout(() => document.querySelector('.dy-maker')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200); }, 600); return; }
      const sv = e.target.closest('[data-save]'); if (!sv) return;
      sv.disabled = true; sv.textContent = L('Đang lưu…', 'Saving…');
      try { const d = await D.hub('dyProfile', { tk: R.tok(), avatar: sel }); if (R.authFail(d)) throw new Error(L('Hãy đăng nhập lại', 'Please sign in again')); if (!d.ok) throw new Error(d.error);
        R.setMe(d.me); if (R.me()) R.me().me = d.me; dlg.remove(); D.toast(L('Đã đổi nhân vật', 'Character updated')); R.repaint(); document.querySelectorAll('.dy-hello').forEach(x => x.remove()); if (D.S.cur && location.hash.startsWith('#/listen')) hello(D.S.cur); }
      catch (er) { sv.disabled = false; sv.textContent = L('Dùng nhân vật này', 'Use this character'); D.toast(er.message); }
    });
  }
  R.avPick = avPick;
  const SHOWT = { aipulse: ['ai'], clinicroom: ['health', 'eye', 'dental', 'surgery'], lawdesk: ['tender', 'politics'], talk: ['health', 'tender', 'economy', 'eye', 'dental', 'surgery'],
    headlines: ['economy', 'politics', 'society', 'health'], english: ['english'], weekly: ['health', 'tender', 'economy'] };
  const KW = { ai: /\bai\b|artificial|tech|robot|digital/i, health: /health|hospital|patient|medic|y tế/i, eye: /eye|cataract|glaucoma|retina|ophthal|vision|phaco/i,
    dental: /dental|dentist|tooth|teeth|orthodont|implant|endodon/i, surgery: /surg|operat|suture|hospital/i, tender: /tender|procure|bid|law|decree|regulat|insurance/i,
    economy: /econom|market|price|yen|tax|trade|invest|budget/i, politics: /politic|government|minister|policy|national assembly/i, society: /society|people|school|population|ageing|aging/i, english: /english|vocab|phrase/i };
  function storyHit(x, t) {
    const tg = x.tags || [];
    return t === 'ai' ? x.sec === 'ai' : t === 'health' ? x.sec === 'health' : t === 'eye' ? tg.includes('eye') : t === 'dental' ? tg.includes('dental')
      : t === 'surgery' ? tg.some(v => v === 'surgery' || v === 'hospital') : t === 'tender' ? tg.some(v => ['tender', 'device', 'insurance', 'policy'].includes(v))
        : t === 'economy' ? x.sec === 'economy' || tg.includes('market') : t === 'politics' ? x.sec === 'politics' : t === 'society' ? x.sec === 'society' : false;
  }
  function picker(sel) {
    return `<div class="dy-topics">${TOPICS.map(([k, v, e]) => `<button type="button" data-dys="topic" data-k="${k}" class="${sel.includes(k) ? 'on' : ''}" aria-pressed="${sel.includes(k)}">${esc(L(v, e))}</button>`).join('')}</div>`;
  }
  // bài kiểm tra gợi ý theo chủ đề (7 số gần nhất chưa làm bài kiểm tra)
  function recs() {
    const tp = myTopics(); if (!tp.length) return [];
    const done = (R.me() && R.me().done) || {};
    return (D.S.index?.editions || []).slice(0, 7).map(e => {
      const hit = tp.filter(t => (SHOWT[e.show] || []).includes(t) || KW[t].test(`${e.title || ''} ${e.lead || ''}`));
      const local = Object.keys(store.get('mmh_daily_quiz:' + e.date, {}) || {}).length;
      return { e, hit, done: !!(done[e.date] && (done[e.date].quiz || done[e.date].lesson)) || local > 0 };
    }).filter(x => x.hit.length && !x.done).sort((a, b) => b.hit.length - a.hit.length).slice(0, 3);
  }

  /* ── bạn bè ── */
  let FR = null, FRAT = 0, FS = null;
  async function friends(force) {
    if (!R.tok()) return null;
    if (FR && !force && Date.now() - FRAT < 60e3) return FR;
    try { const d = await D.hub('dyFriends', { tk: R.tok() }); if (R.authFail(d)) return null; if (d.ok) { FR = d; FRAT = Date.now(); FS = new Set(d.friends.map(x => x.id)); if (window.DUEL) DUEL.badge(); } } catch { /* mạng */ }
    return FR;
  }
  R.friendSet = async () => { await friends(); return FS || new Set(); };
  R.frIn = () => (FR ? FR.inbox.length : 0);
  R.addBtn = id => (FS && FS.has(id)) || (FR && FR.sent.some(x => x.id === id)) ? '' : `<button type="button" class="dy-add" data-dys="req" data-id="${esc(id)}" title="${L('Gửi lời mời kết bạn', 'Send a friend request')}">+</button>`;
  const link = id => `${APP}#/add/${id}`;
  let qrLib = null;
  function qrSvg(text) {
    if (!window.qrcode) return '';
    const q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
    const n = q.getModuleCount(), m = 2; let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" class="dy-qr" role="img" aria-label="QR"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  }
  function loadQr() { return qrLib || (qrLib = new Promise(res => { if (window.qrcode) return res(); const s = document.createElement('script'); s.src = 'qr.js?v=1'; s.onload = res; s.onerror = res; document.head.appendChild(s); })); }
  function shareCard(id, me) {
    return `<section class="ls-box dy-share"><div class="dy-sh-q" id="dy-qr">${qrSvg(link(id))}</div><div class="dy-sh-t">
        <h3>${L('Mời bạn học cùng', 'Invite a friend')}</h3>
        <p>${L('Bạn bè quét QR hoặc mở link để tải app MMH Daily Podcast và kết bạn với bạn. Cùng giữ chuỗi ngày học và thi đua trên bảng xếp hạng.', 'Friends scan the QR or open the link to get MMH Daily Podcast and add you. Keep your streaks and compete together.')}</p>
        <p class="dy-code">${R.av(me.avatar, 26)} ${esc(me.nick)} · ${L('mã', 'code')} <b>${esc(id)}</b></p>
        <div class="dy-btns"><button type="button" class="st-go" data-dys="share" data-id="${esc(id)}">${L('Chia sẻ', 'Share')}</button><button type="button" class="st-go dy-sec" data-dys="copy" data-id="${esc(id)}">${L('Sao chép link', 'Copy link')}</button><button type="button" class="st-go dy-sec" data-dys="qrpng" data-id="${esc(id)}">${L('Tải ảnh QR', 'Save QR')}</button></div></div></section>`;
  }
  function row(x, acts, du) {
    return `<div class="dy-fr${du ? ' du' : ''}">${du ? `<a class="dy-frw" href="#" data-du="path" data-id="${esc(x.id)}" title="${L('Xem lộ trình của', 'View the path of')} ${esc(x.nick)}">` : ''}${R.av(x.avatar, 42, x.studiedToday ? 'happy' : 'sleepy')}<p><b>${esc(x.nick)}</b><small>${L('Cấp', 'Lv')} ${x.lvl} · ${esc(R.lgN(x.league))}${x.streak ? ` · <span class="dy-fl">${R.flame}${x.streak}</span>` : ''}${x.week != null ? ` · ${R.num(x.week)} XP ${L('tuần này', 'this week')}` : ''}${x.email ? ` · ${esc(x.email)}` : ''}${x.lastSeen ? ` · ${R.ago(x.lastSeen)}` : ''}</small></p>${du ? '</a>' : ''}<span class="dy-acts">${acts}</span></div>`;
  }
  function friendsPane() {
    const me = R.meC(); if (!me) return '';
    if (!FR) { friends().then(() => { if (document.getElementById('dy-frp')) R.repaint(); }); return `<div id="dy-frp" class="rk-empty">${L('Đang tải…', 'Loading…')}</div>`; }
    const b = (op, id, t, sec) => `<button type="button" class="dy-mini${sec ? ' sec' : ''}" data-dys="${op}" data-id="${esc(id)}">${t}</button>`;
    const DU = window.DUEL;
    return `<div id="dy-frp"><div id="du-inbox">${DU ? DU.inboxHtml() : ''}</div>
      ${FR.inbox.length ? `<h3 class="dy-h3">${L('Lời mời kết bạn', 'Friend requests')} · ${FR.inbox.length}</h3>${FR.inbox.map(x => row(x, b('accept', x.id, L('Đồng ý', 'Accept')) + b('decline', x.id, L('Từ chối', 'Decline'), 1))).join('')}` : ''}
      <h3 class="dy-h3">${L('Bạn bè', 'Friends')} · ${FR.friends.length}</h3>
      ${FR.friends.length ? FR.friends.map(x => row(x, DU ? DU.acts(x) : b('remove', x.id, L('Bỏ bạn', 'Unfriend'), 1), DU)).join('') : `<p class="rk-none">${L('Chưa có bạn bè. Gửi QR hoặc link bên dưới cho đồng nghiệp nhé!', 'No friends yet. Send the QR or link below to your colleagues!')}</p>`}
      ${shareCard(FR.id || me.id, me)}
      <form class="ls-box dy-addf" data-dys-form="code"><label>${L('Thêm bạn bằng mã', 'Add a friend by code')}<input name="code" maxlength="64" placeholder="${L('Mã 10 ký tự hoặc link mời', '10-character code or invite link')}"></label><button class="st-go dy-sec" type="submit">${L('Gửi lời mời', 'Send request')}</button></form>
      ${FR.sent.length ? `<h3 class="dy-h3">${L('Đã gửi lời mời', 'Sent requests')}</h3>${FR.sent.map(x => row(x, b('cancel', x.id, L('Huỷ', 'Cancel'), 1))).join('')}` : ''}</div>`;
  }
  R.tabs = [me => ['friends', L('Bạn bè', 'Friends'), FR && FR.inbox.length ? FR.inbox.length : 0], me => (me && me.admin ? ['all', L('Mọi người', 'Everyone')] : null)];
  R.panes = { friends: friendsPane, all: allPane };
  R.onPane = k => { if (k === 'friends') loadQr().then(() => { const q = document.getElementById('dy-qr'); if (q && !q.innerHTML && FR) q.innerHTML = qrSvg(link(FR.id)); }); };

  /* ── Admin: mọi người ── */
  let ALL = null, allQ = '';
  function allPane() {
    if (!ALL) { D.hub('dyAll', { tk: R.tok() }).then(d => { ALL = d.ok ? d : { users: [], error: d.error }; R.repaint(); }).catch(e => { ALL = { users: [], error: e.message }; R.repaint(); }); return `<div class="rk-empty">${L('Đang tải…', 'Loading…')}</div>`; }
    if (ALL.error) return `<p class="rk-none">${esc(ALL.error)}</p>`;
    const q = allQ.toLowerCase(), list = ALL.users.filter(u => !q || `${u.nick} ${u.email}`.toLowerCase().includes(q));
    const act = u => u.rel === 'me' ? `<span class="dy-tag">${L('Bạn', 'You')}</span>` : u.rel === 'a' ? `<span class="dy-tag ok">${L('Bạn bè', 'Friends')}</span>` : u.rel === 'p-in' ? `<button type="button" class="dy-mini" data-dys="accept" data-id="${u.id}">${L('Đồng ý', 'Accept')}</button>` : u.rel === 'p-out' ? `<span class="dy-tag">${L('Đã mời', 'Invited')}</span>` : `<button type="button" class="dy-mini" data-dys="req" data-id="${u.id}">${L('Kết bạn', 'Add')}</button>`;
    return `<div class="dy-all"><p class="dy-small">${ALL.n} ${L('tài khoản', 'accounts')} · ${ALL.push} ${L('máy bật thông báo', 'devices with notifications')} · ${L('lời mời của Admin thành bạn bè ngay', 'Admin requests are accepted instantly')}</p>
      <div class="dy-btns"><input class="dy-q" data-dys-q placeholder="${L('Tìm biệt danh / email', 'Search nickname / email')}" value="${esc(allQ)}"><button type="button" class="st-go dy-sec" data-dys="addall">${L('Kết bạn với tất cả', 'Add everyone')}</button></div>
      <div id="dy-allist">${list.map(u => row(u, act(u))).join('') || `<p class="rk-none">${L('Không có ai khớp.', 'No match.')}</p>`}</div></div>`;
  }

  /* ── cài đặt thêm: tông màu, chủ đề, thông báo, linh vật tự tạo (Admin) ── */
  const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone;
  const pushState = () => store.get('mmh_dy_push', 0) && pushOk() && Notification.permission === 'granted';
  R.extraSet = me => {
    const cur = store.get('mmh_dy_tone', 'teal'), mine = String(me.avatar || '').startsWith('c:') ? me.avatar : 'c:4.3.5';
    const [ci, ei, ai] = mine.slice(2).split('.').map(Number), C = window.CHARS && CHARS.CUSTOM;
    return `<p class="dy-lbl">${L('Chủ đề bạn quan tâm (ưu tiên hiển thị + gợi ý bài kiểm tra)', 'Topics you care about (shown first + quiz suggestions)')}</p>${picker(myTopics())}
      <p class="dy-lbl">${L('Tông màu của app', 'App colour')}</p><div class="dy-tones">${TONES.map(([k, a, b]) => `<button type="button" data-dys="tone" data-k="${k}" class="${k === cur ? 'on' : ''}" style="--a:${a};--b:${b}" aria-label="${k}"></button>`).join('')}</div>
      <p class="dy-lbl">${L('Thông báo khi có số podcast mới', 'Notify me when a new episode is out')}</p>
      ${pushOk() && !ios() ? `<button type="button" class="st-go ${pushState() ? 'dy-sec' : ''}" data-dys="push">${pushState() ? L('Đang bật · bấm để tắt', 'On · tap to turn off') : L('Bật thông báo trên máy này', 'Turn on for this device')}</button>`
        : `<p class="dy-small">${ios() ? L('Trên iPhone / iPad: bấm Chia sẻ ▸ Thêm vào Màn hình chính, mở app từ màn hình chính rồi bật thông báo ở đây.', 'On iPhone / iPad: Share ▸ Add to Home Screen, open the app from the home screen, then turn on notifications here.') : L('Trình duyệt này chưa hỗ trợ thông báo.', 'This browser does not support notifications.')}</p>`}
      ${me.admin && C ? `<div class="dy-maker"><p class="dy-lbl">${L('Tự tạo linh vật (Admin)', 'Make your own mascot (Admin)')}</p>
        <div class="dy-mk"><span id="dy-mkv">${R.av(mine, 96, 'wave')}</span><div>
          <p class="dy-small">${L('Màu', 'Colour')}</p><div class="dy-sw2">${C.colors.map((c, i) => `<button type="button" data-dys="mk" data-p="0" data-v="${i}" class="${i === ci ? 'on' : ''}" style="background:${c}"></button>`).join('')}</div>
          <p class="dy-small">${L('Tai / đầu', 'Ears / head')}</p><div class="dy-sw2 t">${C.ears.map((c, i) => `<button type="button" data-dys="mk" data-p="1" data-v="${i}" class="${i === ei ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
          <p class="dy-small">${L('Phụ kiện', 'Accessory')}</p><div class="dy-sw2 t">${C.accs.map((c, i) => `<button type="button" data-dys="mk" data-p="2" data-v="${i}" class="${i === ai ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
          <button type="button" class="st-go dy-sec" data-dys="mkuse" data-k="${esc(mine)}">${L('Dùng linh vật này', 'Use this mascot')}</button></div></div></div>` : ''}`;
  };

  /* ── thông báo đẩy ── */
  const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  async function pushToggle(on) {
    if (!pushOk()) throw new Error(L('Trình duyệt chưa hỗ trợ thông báo', 'Notifications not supported'));
    const reg = await (navigator.serviceWorker.getRegistration() || null) || await navigator.serviceWorker.register('sw.js');
    if (on) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error(L('Bạn chưa cho phép thông báo — bật lại trong cài đặt trình duyệt.', 'Notifications are blocked — allow them in your browser settings.'));
      const r2 = await navigator.serviceWorker.ready;
      const sub = (await r2.pushManager.getSubscription()) || await r2.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID) });
      const d = await D.hub('dyPush', { sub: JSON.stringify(sub), op: 'on', tk: R.tok(), lang: D.S.lang || 'vi' }); if (!d.ok) throw new Error(d.error);
      store.set('mmh_dy_push', 1); D.toast(L('Đã bật — có số mới sẽ báo ngay!', 'On — you\'ll hear about new episodes!'));
    } else {
      const sub = await (reg && reg.pushManager.getSubscription());
      if (sub) { await D.hub('dyPush', { sub: JSON.stringify(sub), op: 'off' }).catch(() => {}); await sub.unsubscribe().catch(() => {}); }
      store.set('mmh_dy_push', 0); D.toast(L('Đã tắt thông báo', 'Notifications off'));
    }
  }

  /* ── thẻ chào trên trang Nghe + "Dành cho bạn" trên trang nhất ── */
  function hello(ed) {
    const host = document.querySelector('.ls'); if (!host || host.querySelector('.dy-hello')) return;
    const me = R.meC(), tp = myTopics(), rc = recs(), w = (R.me() && R.me().week) || [];
    const todayXp = w.length ? w[w.length - 1].xp : 0, goal = me ? me.goal || 50 : 50, gp = Math.min(100, Math.round(todayXp / goal * 100));
    const mood = !me ? 'wave' : me.studiedToday ? 'cheer' : me.gap > 2 ? 'sad' : me.gap > 1 ? 'sleepy' : 'wave';
    const askPush = pushOk() && !ios() && Notification.permission === 'default' && !store.get('mmh_dy_push_no', 0);
    const el = document.createElement('section'); el.className = 'dy-hello';
    el.innerHTML = `<div class="dy-hl">${me ? `<button type="button" class="dy-avb" data-dys="avpick" aria-label="${L('Đổi nhân vật', 'Change character')}">${R.av(me.avatar, 58, mood)}<i>${PEN}</i></button>` : R.av('chip', 58, mood)}<div class="dy-hm">
        ${me ? `<b>${esc(L('Chào ' + me.nick + '!', 'Hi ' + me.nick + '!'))}</b><span>${me.studiedToday ? L('Hôm nay bạn đã học rồi — giỏi quá!', 'You studied today — great job!') : me.gap > 1 ? L('Lâu rồi chưa gặp, học 1 bài ngắn nhé!', 'Long time no see — try a short lesson!') : L('Nghe số hôm nay để giữ chuỗi nhé.', 'Listen today to keep your streak.')}</span>`
          : `<b>${L('Chíp chào bạn!', 'Hi, I\'m Chíp!')}</b><span>${L('Tạo tài khoản để lưu XP, giữ chuỗi ngày học và thi đua cùng đồng nghiệp.', 'Create an account to save XP, keep your streak and compete with colleagues.')}</span>`}</div>
        ${me ? `<a class="dy-hs" href="#/me"><span class="dy-fl">${R.flame}${me.streak}</span><span class="dy-ring sm" style="--p:${gp}"><b>${todayXp}</b></span></a>` : `<button type="button" class="st-go" data-rk="login">${L('Bắt đầu', 'Start')}</button>`}</div>
      ${rc.length ? `<div class="dy-rec"><p class="dy-lbl">${L('Bài kiểm tra cho bạn', 'Quizzes for you')}</p>${rc.map(x => `<button type="button" data-dys="quiz" data-date="${x.e.date}"><b>${esc(D.dateL ? D.dateL(x.e.date) : x.e.date)}</b><span>${esc(String(x.e.title || '').replace(/^[^:]+:\s*/, ''))}</span><i>${x.hit.slice(0, 2).map(t => esc(L(tn(t)[1], tn(t)[2]))).join(' · ')}</i></button>`).join('')}</div>`
        : !tp.length ? `<button type="button" class="dy-pick-t" data-dys="topics">${L('Chọn chủ đề bạn quan tâm để được gợi ý bài kiểm tra phù hợp ›', 'Pick your topics to get quiz suggestions ›')}</button>` : ''}
      ${askPush ? `<div class="dy-push">${R.av('chip', 34, 'wave')}<span>${L('Bật "tinh tinh" khi có số podcast mới?', 'Get a ping when a new episode is out?')}</span><button type="button" class="st-go" data-dys="push1">${L('Bật', 'Turn on')}</button><button type="button" class="dy-x" data-dys="pushno" aria-label="${L('Để sau', 'Later')}">✕</button></div>` : ''}`;
    const hero = host.querySelector('.ls-hero'); host.insertBefore(el, hero || host.firstChild);
    if (hero && !host.querySelector('#dy-lis')) { const li = document.createElement('div'); li.id = 'dy-lis'; li.className = 'dy-lis'; hero.insertAdjacentElement('afterend', li); paintLis(); }
  }
  /* tiến độ nghe số đang xem: nghe tới 80% ⇒ hoàn thành (dyEvent listen ở rank.js) */
  let lpT = 0;
  const OKI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.2 4.2L19 7"/></svg>';
  function paintLis() {
    const el = document.getElementById('dy-lis'), ed = D.S.cur; if (!el || !ed) return;
    const pct = ((store.get('mmh_dy_lpct', {}) || {})[ed.date]) || 0, done = !!((store.get('mmh_dy_lis', {}) || {})[ed.date]);
    el.classList.toggle('ok', done);
    el.innerHTML = done ? `${OKI}<span>${L('Đã nghe xong số này · nhiệm vụ "Nghe hết 1 số" hoàn thành', 'Episode finished · "Finish 1 episode" quest done')}</span>`
      : `<span>${L(`Đã nghe ${pct}% · nghe tới 80% để tính hoàn thành (+10 XP)`, `Listened ${pct}% · reach 80% to finish (+10 XP)`)}</span><i style="--p:${Math.min(100, pct / 0.8)}%"></i>`;
  }
  D.audio.addEventListener('timeupdate', () => {
    const a = D.audio, ep = D.S.ep; if (!ep || !a.duration) return;
    const pct = Math.min(100, Math.round(a.currentTime / a.duration * 100)), m = store.get('mmh_dy_lpct', {}) || {};
    if (pct > (m[ep.date] || 0) && Date.now() - lpT > 2500) { lpT = Date.now(); m[ep.date] = pct; store.set('mmh_dy_lpct', Object.fromEntries(Object.entries(m).slice(-30))); }
    if (D.S.cur && D.S.cur.date === ep.date) paintLis();
  });
  function forYou(ed) {
    const tp = myTopics(), v = document.getElementById('view'); if (!tp.length || !v || v.querySelector('.dy-fy')) return;
    const H = x => (D.S.lang === 'en' ? (x.h_en || x.t) : (x.h_vi || x.t));
    const list = Object.values(ed.stories || {}).filter(x => tp.some(t => storyHit(x, t))).sort((a, b) => (b.mmh || 0) - (a.mmh || 0)).slice(0, 5);
    if (!list.length) return;
    const el = document.createElement('section'); el.className = 'dy-fy';
    el.innerHTML = `<div class="dy-fyh">${R.av((R.meC() || {}).avatar || 'chip', 30, 'happy')}<b>${L('Dành cho bạn', 'For you')}</b><span>${tp.slice(0, 4).map(t => esc(L(tn(t)[1], tn(t)[2]))).join(' · ')}</span><a href="#/me" data-dys="topics">${L('Đổi chủ đề', 'Change')}</a></div>
      <ol>${list.map(x => `<li><a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">${esc(H(x))}</a><small>${esc(x.src || '')}</small></li>`).join('')}</ol>`;
    v.insertBefore(el, v.firstChild);
  }

  /* ── trang mời #/add/<mã> ── */
  R.addPage = () => `<div class="rk dy"><div id="add-body" class="dy-gate"><div class="rk-empty">${L('Đang tải…', 'Loading…')}</div></div></div>`;
  R.addLoad = async id => {
    const el = document.getElementById('add-body'); if (!el) return;
    store.set('mmh_dy_invite', id);
    let d; try { d = await D.hub('dyPeek', { id, tk: R.tok() }); } catch (e) { el.innerHTML = `<p>${esc(e.message)}</p>`; return; }
    if (!d.ok) { el.innerHTML = `${R.av('chip', 96, 'sad')}<h2>${L('Mã mời không còn dùng được', 'This invite no longer works')}</h2><a class="st-go" href="#/listen">${L('Vào app', 'Open the app')}</a>`; return; }
    const u = d.user, rel = d.rel || 'none';
    el.innerHTML = `${R.av(u.avatar, 110, 'wave')}<h2>${esc(u.nick)}</h2><p>${L('mời bạn học tiếng Anh mỗi ngày cùng MMH Daily Podcast', 'invites you to learn English daily with MMH Daily Podcast')} · ${L('Cấp', 'Lv')} ${u.lvl} · ${esc(R.lgN(u.league))}${u.streak ? ` · ${u.streak} ${L('ngày liên tiếp', 'day streak')}` : ''}</p>
      ${rel === 'me' ? `<p>${L('Đây là mã của chính bạn — gửi link này cho bạn bè nhé.', 'This is your own code — send this link to friends.')}</p><a class="st-go" href="#/me">${L('Trang của tôi', 'My profile')}</a>`
        : rel === 'a' ? `<p><b>${L('Hai bạn đã là bạn bè.', 'You are already friends.')}</b></p><a class="st-go" href="#/rank">${L('Xem bảng xếp hạng', 'View ranking')}</a>`
          : rel === 'p-out' ? `<p>${L('Đã gửi lời mời — chờ bạn ấy đồng ý.', 'Request sent — waiting for them to accept.')}</p><a class="st-go" href="#/listen">${L('Học ngay', 'Start learning')}</a>`
            : `<button type="button" class="st-go" data-dys="${rel === 'p-in' ? 'accept' : 'req'}" data-id="${esc(id)}" data-go="1">${!R.tok() ? L('Tạo tài khoản & kết bạn', 'Sign up & add friend') : rel === 'p-in' ? L('Đồng ý kết bạn', 'Accept request') : L('Gửi lời mời kết bạn', 'Send friend request')}</button>`}`;
  };
  async function pendingInvite() {   // vừa đăng nhập / tạo tài khoản qua link mời ⇒ tự gửi lời mời
    const id = store.get('mmh_dy_invite', ''); if (!id || !R.tok()) return;
    store.set('mmh_dy_invite', '');
    try { const d = await D.hub('dyFriendReq', { tk: R.tok(), id }); if (d.ok) { FR = null; D.toast(d.status === 'a' ? L('Đã thành bạn bè!', 'You are now friends!') : L('Đã gửi lời mời kết bạn', 'Friend request sent')); } } catch { /* mạng */ }
  }

  /* ── chào mừng tài khoản mới: chọn chủ đề + thông báo ── */
  R.onNew = me => {
    const dlg = document.createElement('div'); dlg.className = 'rk-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = `<div class="rk-box dy-box dy-onb">${R.av(me.avatar, 92, 'cheer')}<h3>${L('Chào mừng ' + me.nick + '!', 'Welcome, ' + me.nick + '!')}</h3>
      <p class="rk-why">${L('Bạn quan tâm chủ đề nào? App sẽ ưu tiên tin và bài kiểm tra về chủ đề đó.', 'Which topics do you care about? We\'ll show those stories and quizzes first.')}</p>${picker(myTopics())}
      ${pushOk() && !ios() ? `<label class="dy-sw"><input type="checkbox" id="dy-onb-push" checked><span>${L('Báo "tinh tinh" khi có số podcast mới', 'Ping me when a new episode is out')}</span></label>` : ''}
      <button type="button" class="rk-btn" data-dys="onbok">${L('Xong, học thôi!', 'Done — let\'s learn!')}</button></div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('click', async e => {
      const t = e.target.closest('[data-dys]'); if (!t) return;
      if (t.dataset.dys === 'topic') return topicClick(t);
      if (t.dataset.dys === 'onbok') { const p = dlg.querySelector('#dy-onb-push'); dlg.remove(); if (p && p.checked) pushToggle(true).catch(er => D.toast(er.message)); pendingInvite(); D.route(); }
    });
  };
  function topicClick(t) {
    t.classList.toggle('on'); t.setAttribute('aria-pressed', t.classList.contains('on'));
    const list = [...t.parentElement.querySelectorAll('.on')].map(b => b.dataset.k); saveTopics(list);
  }

  /* ── ăn mừng (lên cấp) ── */
  R.celebrate = (text, me) => {
    const el = document.createElement('div'); el.className = 'dy-cele'; el.setAttribute('role', 'status');
    el.innerHTML = `<div>${R.av((me || R.meC() || {}).avatar || 'chip', 120, 'cheer')}<b>${esc(text)}</b>${'<i></i>'.repeat(18)}</div>`;
    document.body.appendChild(el); setTimeout(() => el.classList.add('out'), 2400); setTimeout(() => el.remove(), 2900);
    el.onclick = () => el.remove();
  };

  /* ── thao tác ── */
  document.addEventListener('input', e => { if (e.target.matches('[data-dys-q]')) { allQ = e.target.value; const l = document.getElementById('dy-allist'); if (l && ALL) { const pos = e.target.selectionStart; R.repaint(); const q = document.querySelector('[data-dys-q]'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } } } });
  document.addEventListener('submit', async e => {
    const f = e.target.closest('[data-dys-form]'); if (!f) return; e.preventDefault();
    const m = String(f.code.value).trim().match(/([a-f0-9]{10})\s*$/i); if (!m) return D.toast(L('Mã chưa đúng', 'Invalid code'));
    try { const d = await D.hub('dyFriendReq', { tk: R.tok(), id: m[1].toLowerCase() }); if (!d.ok) throw new Error(d.error); FR = null; D.toast(d.status === 'a' ? L('Đã thành bạn bè!', 'You are now friends!') : L('Đã gửi lời mời', 'Request sent')); await friends(true); R.repaint(); }
    catch (er) { D.toast(er.message); }
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-dys]'); if (!t || t.closest('.rk-dlg')) return;
    const k = t.dataset.dys, id = t.dataset.id;
    try {
      if (k === 'topic') return topicClick(t);
      if (k === 'avpick') return avPick();
      if (k === 'topics') { e.preventDefault(); location.hash = '#/me'; setTimeout(() => document.querySelector('[data-dy="tab"][data-k="set"]')?.click(), 600); return; }
      if (k === 'tone') { tone(t.dataset.k); t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); if (R.tok()) D.hub('dyProfile', { tk: R.tok(), theme: t.dataset.k }).catch(() => {}); return; }
      if (k === 'push' || k === 'push1') { t.disabled = true; await pushToggle(k === 'push1' ? true : !pushState()); t.closest('.dy-push')?.remove(); if (k === 'push') R.repaint(); return; }
      if (k === 'pushno') { store.set('mmh_dy_push_no', 1); t.closest('.dy-push')?.remove(); return; }
      if (k === 'quiz') { const date = t.dataset.date; location.hash = '#/listen/' + date; const ed = await D.loadEd(date); setTimeout(() => window.STUDY && STUDY.open(ed), 500); return; }
      if (k === 'share') { const url = link(id); if (navigator.share) await navigator.share({ title: 'MMH Daily Podcast', text: L('Học tiếng Anh mỗi ngày cùng mình trên MMH Daily Podcast!', 'Learn English daily with me on MMH Daily Podcast!'), url }).catch(() => {}); else { await navigator.clipboard.writeText(url); D.toast(L('Đã sao chép link', 'Link copied')); } return; }
      if (k === 'copy') { await navigator.clipboard.writeText(link(id)); D.toast(L('Đã sao chép link', 'Link copied')); return; }
      if (k === 'qrpng') { await loadQr(); const svg = qrSvg(link(id)), img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 720; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 720, 720); x.drawImage(img, 0, 0, 720, 720); const a = document.createElement('a'); a.download = 'MMH-Daily-Podcast-QR.png'; a.href = c.toDataURL('image/png'); a.click(); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); return; }
      if (k === 'req') {
        if (!R.tok()) { if (await R.login(L('Tạo tài khoản hoặc đăng nhập để kết bạn.', 'Sign up or sign in to add friends.'))) await pendingInvite(); if (t.dataset.go) R.addLoad(id); return; }
        t.disabled = true; const d = await D.hub('dyFriendReq', { tk: R.tok(), id }); if (!d.ok) throw new Error(d.error);
        D.toast(d.status === 'a' ? L('Đã thành bạn bè!', 'You are now friends!') : L('Đã gửi lời mời kết bạn', 'Friend request sent'));
        FR = null; ALL = null; await friends(true); if (t.dataset.go) return R.addLoad(id); if (t.classList.contains('dy-add')) t.remove(); else R.repaint(); return;
      }
      if (['accept', 'decline', 'cancel', 'remove'].includes(k)) {
        if (k === 'remove' && !t.dataset.sure) { t.dataset.sure = 1; t.textContent = L('Chắc chưa?', 'Sure?'); return; }
        t.disabled = true; const d = await D.hub('dyFriendAct', { tk: R.tok(), id, op: k }); if (!d.ok) throw new Error(d.error);
        if (k === 'accept') D.toast(L('Đã thành bạn bè!', 'You are now friends!'));
        if (k === 'remove' && window.DUEL) DUEL.close();
        FR = null; ALL = null; await friends(true); if (t.dataset.go) return R.addLoad(id); R.repaint(); return;
      }
      if (k === 'addall') { if (!t.dataset.sure) { t.dataset.sure = 1; t.textContent = L('Bấm lần nữa để gửi', 'Tap again to confirm'); return; } t.disabled = true; let n = 0; for (const u of (ALL ? ALL.users : []).filter(u => u.rel === 'none' || u.rel === 'p-in')) { const d = await D.hub(u.rel === 'p-in' ? 'dyFriendAct' : 'dyFriendReq', { tk: R.tok(), id: u.id, op: 'accept' }); if (d.ok) n++; } D.toast(L(`Đã kết bạn thêm ${n} người`, `Added ${n} friends`)); FR = null; ALL = null; R.repaint(); return; }
      if (k === 'mk') { t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); const box = t.closest('.dy-maker'), v = [0, 1, 2].map(p => box.querySelector(`[data-p="${p}"].on`)?.dataset.v || 0), code = 'c:' + v.join('.'); box.querySelector('#dy-mkv').innerHTML = R.av(code, 96, 'wave'); box.querySelector('[data-dys="mkuse"]').dataset.k = code; return; }
      if (k === 'mkuse') {
        const pick = document.querySelector('.dy-set .dy-pick'); if (!pick) return; pick.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        let b = pick.querySelector('[data-k^="c:"]'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.dataset.dy = 'pav'; pick.appendChild(b); }
        b.dataset.k = t.dataset.k; b.className = 'on'; b.innerHTML = R.av(t.dataset.k, 44) + `<small>${L('Của tôi', 'Mine')}</small>`; D.toast(L('Bấm "Lưu thay đổi" để dùng linh vật này', 'Tap "Save changes" to use it')); return;
      }
    } catch (er) { D.toast(er.message || String(er)); t.disabled = false; }
  });

  /* ── gắn vào điều hướng của app ── */
  R.after = (r, ed, a) => {
    if (r === 'listen') hello(ed);
    if (!r || r === 'e') forYou(ed);
    if (r === 'add' && a) R.addLoad(a);
    if (r === 'me' || r === 'rank') friends().then(() => { if (r === 'me' && FR && FR.inbox.length) { const b = document.querySelector('[data-dy="tab"][data-k="friends"]'); if (b && !b.querySelector('.dy-dot')) b.insertAdjacentHTML('beforeend', `<i class="dy-dot">${FR.inbox.length}</i>`); } });
  };
  setTimeout(() => { pendingInvite(); if (store.get('mmh_dy_push', 0) && pushOk() && Notification.permission === 'granted') navigator.serviceWorker?.ready.then(r => r.pushManager.getSubscription()).then(s => { if (s) D.hub('dyPush', { sub: JSON.stringify(s), op: 'on', tk: R.tok(), lang: D.S.lang || 'vi' }).catch(() => {}); }).catch(() => {}); }, 5000);
  const me0 = R.meC(); if (me0 && me0.theme && !store.get('mmh_dy_tone', '')) tone(me0.theme);
})();
