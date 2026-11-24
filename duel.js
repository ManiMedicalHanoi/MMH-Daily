// MMH Daily Podcast — BẠN BÈ HỌC CÙNG NHAU (24/11/2026, người dùng: "kết bạn rồi thấy lộ trình học của nhau, gửi điểm / thách đố qua lại").
// · Lộ trình của bạn: 14 ngày XP, các số podcast đã học, hoạt động gần đây, so XP tuần này.
// · Thách đấu: chọn 1 số podcast ⇒ làm bài kiểm tra nghe ⇒ gửi điểm cho bạn ⇒ bạn làm cùng bộ câu hỏi ⇒ ai đúng nhiều hơn thắng (+15 XP; hoà +8 mỗi người).
// · Cổ vũ: gửi 1 câu ngắn. Hộp thư nằm ở Xếp hạng ▸ Bạn bè (và Tôi ▸ Bạn bè).
// Máy chủ: Training Hub v3.52 ▸ RH_DailyDuel.gs (dyPath · dyDuel · dyDuels · dyDuelDone · dyDuelAns).
(function () {
  const D = window.DAILY, R = window.RANK; if (!D || !R) return;
  const esc = D.esc, store = D.store, audio = D.audio;
  const L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  const dm = s => { const [, m, d] = String(s || '').split('-'); return d ? `${+d}/${+m}` : ''; };
  let DU = null, DUAT = 0, busy = false;

  async function duels(force) {
    if (!R.tok()) return null;
    if (DU && !force && Date.now() - DUAT < 60000) return DU;
    try { const d = await D.hub('dyDuels', { tk: R.tok() }); if (R.authFail(d)) return null; if (d.ok) { DU = d; DUAT = Date.now(); badge(); } } catch { /* mạng */ }
    return DU;
  }
  const openIn = () => (DU ? DU.inbox.filter(x => x.status === 'open') : []);
  function badge() { if (window.SHELL) SHELL.badge('rank', openIn().length + (R.frIn ? R.frIn() : 0)); }   // thách đấu / cổ vũ mới + lời mời kết bạn

  /* ── khung trượt (dùng chung cho lộ trình / chọn bài / cổ vũ / kết quả) ── */
  let sh = null;
  function sheet(html, cls) {
    if (!sh) {
      sh = document.createElement('div'); sh.className = 'du-ov'; sh.hidden = true; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
      document.body.appendChild(sh);
      sh.addEventListener('click', e => { if (e.target === sh) closeSheet(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && sh && !sh.hidden) closeSheet(); });
    }
    sh.innerHTML = `<div class="du-box ${cls || ''}"><button type="button" class="du-x" data-du="close" aria-label="${L('Đóng', 'Close')}">✕</button>${html}</div>`;
    sh.hidden = false; document.documentElement.classList.add('du-on');
    return sh.firstElementChild;
  }
  function closeSheet() { if (sh) sh.hidden = true; document.documentElement.classList.remove('du-on'); }

  /* ── lộ trình của 1 người bạn ── */
  const KN = { listen: ['Nghe', 'Listened'], quiz: ['Kiểm tra', 'Quiz'], lesson: ['Bài học', 'Lesson'], vocab: ['Từ khoá', 'Keywords'], speak: ['Nói theo', 'Speaking'], coach: ['Luyện nói', 'Coach'], read: ['Đọc', 'Read'], flash: ['Thẻ từ', 'Cards'], dictation: ['Chính tả', 'Dictation'] };
  async function path(id) {
    const box = sheet(`<div class="du-load">${L('Đang tải lộ trình…', 'Loading…')}</div>`, 'du-path');
    let d; try { d = await D.hub('dyPath', { tk: R.tok(), id }); } catch (e) { box.querySelector('.du-load').textContent = e.message; return; }
    if (R.authFail(d)) { closeSheet(); return; }
    if (!d.ok) { box.querySelector('.du-load').textContent = d.error || L('Không tải được.', 'Could not load.'); return; }
    const u = d.user, mx = Math.max(10, ...d.week.map(w => w.xp)), wk = d.wk || { me: 0, them: 0 }, tot = Math.max(1, wk.me + wk.them);
    const acc = d.stats.asked ? Math.round(d.stats.right / d.stats.asked * 100) : null;
    const wdn = s => new Date(s + 'T00:00:00').toLocaleDateString(D.S.lang === 'en' ? 'en-GB' : 'vi-VN', { weekday: 'narrow' });
    box.innerHTML = `<button type="button" class="du-x" data-du="close" aria-label="${L('Đóng', 'Close')}">✕</button>
      <div class="du-hd">${R.av(u.avatar, 72, u.studiedToday ? 'cheer' : 'sleepy')}<div><h3>${esc(u.nick)}</h3>
        <p>${L('Cấp', 'Level')} ${u.lvl} · ${esc(R.lgN(u.league))}${u.streak ? ` · <span class="dy-fl">${R.flame}${u.streak}</span> ${L('ngày', 'days')}` : ''}${u.studiedToday ? ` · ${L('hôm nay đã học', 'studied today')}` : ''}</p></div></div>
      ${d.me ? '' : `<div class="du-vs"><div><b>${L('Bạn', 'You')}</b><span>${R.num(wk.me)} XP</span></div><div class="du-vsb"><i style="width:${Math.round(wk.me / tot * 100)}%"></i></div><div><b>${esc(u.nick)}</b><span>${R.num(wk.them)} XP</span></div></div><p class="du-small">${L('XP tuần này', 'XP this week')}</p>`}
      <div class="du-tiles"><div><b>${d.stats.lessons}</b><small>${L('bài học xong', 'lessons')}</small></div><div><b>${acc == null ? '–' : acc + '%'}</b><small>${L('trả lời đúng', 'correct')}</small></div><div><b>${d.stats.best || 0}</b><small>${L('chuỗi dài nhất', 'best streak')}</small></div></div>
      <h4>${L('14 ngày qua', 'Last 14 days')}</h4>
      <div class="du-bars">${d.week.map(w => `<div title="${dm(w.d)} · ${w.xp} XP"><i style="height:${Math.round(w.xp / mx * 100)}%" class="${w.xp ? 'on' : ''}"></i><small>${esc(wdn(w.d))}</small></div>`).join('')}</div>
      <h4>${L('Lộ trình: các số podcast đã học', 'Path: episodes studied')}</h4>
      ${d.eps.length ? `<div class="du-eps">${d.eps.map(e => `<a class="du-ep" href="#/listen/${esc(e.date)}" data-du="close"><span class="du-dot${e.kinds.includes('lesson') ? ' done' : ''}"></span><span><b>${esc(R.SHOW[e.show] || D.showName(e.show) || e.show || '')}</b><small>${dm(e.date)} · ${e.kinds.map(k => esc(L(...(KN[k] || [k, k])))).join(' · ')}</small></span><em>+${e.xp} XP</em></a>`).join('')}</div>` : `<p class="du-small">${L('Chưa học số nào trong 3 tuần qua.', 'No episodes studied in the last 3 weeks.')}</p>`}
      ${d.me ? '' : `<div class="du-acts"><button type="button" class="st-go" data-du="duel" data-id="${esc(u.id)}" data-nick="${esc(u.nick)}">${L('Thách đấu', 'Challenge')}</button><button type="button" class="st-go dy-sec" data-du="cheer" data-id="${esc(u.id)}" data-nick="${esc(u.nick)}">${L('Cổ vũ', 'Cheer')}</button></div>
        <p class="du-foot"><button type="button" class="du-lnk" data-dys="remove" data-id="${esc(u.id)}">${L('Bỏ bạn', 'Unfriend')}</button></p>`}`;
  }

  /* ── thách đấu: chọn số podcast ── */
  const myScore = date => {
    const a = store.get('mmh_duel_my:' + date, null), b = store.get('mmh_dy_res:' + date, null);
    const x = [a, b && b.quizN ? { right: b.quiz, n: b.quizN, at: b.at } : null].filter(Boolean).sort((p, q) => (q.at || 0) - (p.at || 0))[0];
    return x || null;
  };
  function pick(id, nick) {
    const eps = (D.S.index?.editions || []).filter(e => e.study > 0).slice(0, 8);
    if (!eps.length) { D.toast(L('Chưa có số podcast nào có bài kiểm tra.', 'No episode has a quiz yet.')); return; }
    sheet(`<h3>${L('Thách đấu', 'Challenge')} ${esc(nick)}</h3>
      <p class="du-small">${L('Chọn 1 số podcast. Bạn làm bài kiểm tra nghe trước, rồi gửi điểm cho', 'Pick an episode. Take its listening quiz first, then send your score to')} ${esc(nick)}. ${L('Ai đúng nhiều hơn thắng — thắng +15 XP, hoà +8 XP mỗi người.', 'Higher score wins — the winner gets +15 XP, a tie +8 XP each.')}</p>
      <div class="du-pick">${eps.map(e => { const s = myScore(e.date); return `<button type="button" data-du="ep" data-date="${esc(e.date)}" data-id="${esc(id)}" data-nick="${esc(nick)}"><span><b>${esc(D.showName(e.show))}</b><small>${D.dateL(e.date)} · ${e.study} ${L('câu', 'questions')}</small></span>${s ? `<em>${L('Bạn', 'You')}: ${s.right}/${s.n}</em>` : `<em class="new">${L('Chưa làm', 'Not taken')}</em>`}</button>`; }).join('')}</div>`, 'du-pickbox');
  }
  function epChoice(date, id, nick) {
    const s = myScore(date), e = (D.S.index?.editions || []).find(x => x.date === date);
    if (!s) return play(date, { id, nick, send: true });
    sheet(`<h3>${esc(D.showName(e?.show))} · ${dm(date)}</h3><p class="du-small">${L('Bạn đã làm bài này', 'You already took this quiz')}: <b>${s.right}/${s.n}</b>.</p>
      <div class="du-acts col"><button type="button" class="st-go" data-du="send" data-date="${esc(date)}" data-id="${esc(id)}" data-nick="${esc(nick)}">${L('Gửi điểm', 'Send my score')} ${s.right}/${s.n} ${L('cho', 'to')} ${esc(nick)}</button>
        <button type="button" class="st-go dy-sec" data-du="replay" data-date="${esc(date)}" data-id="${esc(id)}" data-nick="${esc(nick)}">${L('Làm lại để lấy điểm mới', 'Retake for a new score')}</button></div>`);
  }
  async function send(date, id, nick, s, msg) {
    if (busy) return; busy = true;
    const e = (D.S.index?.editions || []).find(x => x.date === date);
    try {
      const d = await D.hub('dyDuel', { tk: R.tok(), id, kind: 'quiz', date, show: e?.show || '', right: s.right, n: s.n, msg: msg || '', rid: 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) });
      if (!d.ok) throw new Error(d.error);
      DU = null; sheet(`<div class="du-done">${R.av((R.meC() || {}).avatar || 'chip', 88, 'cheer')}<h3>${L('Đã gửi thách đấu!', 'Challenge sent!')}</h3><p class="du-small">${esc(nick)} ${L('sẽ thấy lời thách đấu ở Xếp hạng ▸ Bạn bè. Kết quả hiện ở đây khi bạn ấy làm xong.', 'will see it in Ranking ▸ Friends. The result shows up here when they finish.')}</p><button type="button" class="st-go" data-du="close">${L('Xong', 'Done')}</button></div>`);
      refreshHub();
    } catch (er) { D.toast(er.message); }
    busy = false;
  }

  /* ── làm bài kiểm tra (chung cho người gửi và người nhận) ── */
  let Q = null;
  async function play(date, ctx) {
    let ed; try { ed = await D.loadEd(date); } catch { D.toast(L('Không tải được số này.', 'Could not load this episode.')); return; }
    const qs = ed.study?.quiz || []; if (!qs.length) { D.toast(L('Số này chưa có bài kiểm tra.', 'This episode has no quiz.')); return; }
    Q = { ed, qs, i: 0, ans: [], ctx, seg: null };
    paintQ();
  }
  function playSeg(i) {
    const T = Q.ed.podcast.turns || [], t0 = T[i]?.t; if (t0 == null || !D.setEp(Q.ed)) { D.toast(L('Podcast chưa có âm thanh', 'No audio yet')); return; }
    const nx = T.slice(i + 1).find(t => t.t != null); Q.seg = nx ? nx.t - 0.15 : null; audio.currentTime = t0; audio.play();
  }
  audio.addEventListener('timeupdate', () => { if (Q && Q.seg != null && audio.currentTime >= Q.seg) { audio.pause(); Q.seg = null; } });
  function paintQ() {
    const { qs, i, ans, ctx } = Q, q = qs[i], my = ans[i];
    const vs = ctx.duel ? `<span>${esc(ctx.duel.who?.nick || '')}: ${ctx.duel.fromRight}/${ctx.duel.fromN}</span>` : `<span>${L('Thách đấu', 'Challenge')} ${esc(ctx.nick || '')}</span>`;
    sheet(`<div class="du-qh"><b>${esc(D.showName(Q.ed.show || Q.ed.podcast?.show))} · ${dm(Q.ed.date)}</b>${vs}</div>
      <div class="du-prog">${qs.map((_, k) => `<i class="${k < i || (k === i && my != null) ? (ans[k] === qs[k].a ? 'ok' : 'no') : k === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="du-small">${L('Câu', 'Question')} ${i + 1}/${qs.length}</p>
      <h3 class="du-q">${esc(q.q)}</h3>
      <div class="ls2-opts du-opts">${q.opts.map((o, j) => `<button type="button" data-du="ans" data-j="${j}" class="${my == null ? '' : j === q.a ? 'ok' : j === my ? 'no' : 'dim'}"${my != null ? ' disabled' : ''}><i>${'ABCD'[j]}</i>${esc(o)}</button>`).join('')}</div>
      ${my != null ? `<div class="ls2-fb ${my === q.a ? 'ok' : 'no'}"><b>${my === q.a ? L('Đúng rồi!', 'Correct!') : L('Chưa đúng.', 'Not quite.')}</b> ${esc(q.why || '')}</div>` : `<button type="button" class="du-lnk" data-du="seg" data-i="${q.turn}">${L('Nghe lại đoạn có đáp án', 'Replay the part with the answer')}</button>`}
      <div class="du-acts">${my != null ? `<button type="button" class="st-go" data-du="${i + 1 < qs.length ? 'nextq' : 'finish'}">${i + 1 < qs.length ? L('Câu tiếp ›', 'Next ›') : L('Xem kết quả', 'See result')}</button>` : ''}</div>`, 'du-quiz');
  }
  async function finish() {
    const { qs, ans, ed, ctx } = Q, n = qs.length, right = qs.filter((q, k) => ans[k] === q.a).length;
    audio.pause(); Q.seg = null;
    store.set('mmh_duel_my:' + ed.date, { right, n, at: Date.now() });
    if (R.event) R.event('quiz', { date: ed.date, show: ed.podcast?.show || '', right, n });   // XP bài kiểm tra như thường
    if (ctx.send) {
      sheet(`<div class="du-done">${R.av((R.meC() || {}).avatar || 'chip', 80, right / n >= 0.75 ? 'cheer' : 'think')}<h3>${L('Bạn đúng', 'You got')} ${right}/${n}</h3>
        <p class="du-small">${L('Gửi điểm này để thách', 'Send this score to challenge')} ${esc(ctx.nick)}?</p>
        <input class="du-msg" maxlength="140" placeholder="${L('Lời nhắn (không bắt buộc) — vd. Thử xem hơn mình không!', 'Message (optional) — e.g. Can you beat me?')}">
        <div class="du-acts col"><button type="button" class="st-go" data-du="sendnow" data-date="${esc(ed.date)}" data-id="${esc(ctx.id)}" data-nick="${esc(ctx.nick)}">${L('Gửi thách đấu', 'Send challenge')}</button><button type="button" class="st-go dy-sec" data-du="close">${L('Để sau', 'Later')}</button></div></div>`);
      return;
    }
    // người nhận: báo kết quả
    const box = sheet(`<div class="du-load">${L('Đang chấm…', 'Scoring…')}</div>`);
    let d; try { d = await D.hub('dyDuelDone', { tk: R.tok(), did: ctx.duel.id, right, n }); } catch (e) { box.querySelector('.du-load').textContent = e.message; return; }
    if (!d.ok) { box.querySelector('.du-load').textContent = d.error; return; }
    if (d.me) R.setMe(d.me);
    const who = ctx.duel.who?.nick || '', res = d.result;
    sheet(`<div class="du-done">${R.av((R.meC() || {}).avatar || 'chip', 88, res === 'win' ? 'cheer' : res === 'tie' ? 'happy' : 'think')}
      <h3>${res === 'win' ? L('Bạn thắng!', 'You won!') : res === 'tie' ? L('Hoà!', 'It\'s a tie!') : L(who + ' thắng lần này', who + ' wins this time')}</h3>
      <div class="du-score"><div><b>${right}/${n}</b><span>${L('Bạn', 'You')}</span></div><i>vs</i><div><b>${ctx.duel.fromRight}/${ctx.duel.fromN}</b><span>${esc(who)}</span></div></div>
      <p class="du-small">${d.bonus ? L(`+${d.bonus} XP thưởng thách đấu`, `+${d.bonus} bonus XP`) : L('Thử thách đấu lại bằng một số khác nhé!', 'Challenge them back with another episode!')}</p>
      <div class="du-acts col">${ctx.duel.who ? `<button type="button" class="st-go" data-du="duel" data-id="${esc(ctx.duel.who.id)}" data-nick="${esc(who)}">${L('Thách đấu lại', 'Challenge back')}</button>` : ''}<button type="button" class="st-go dy-sec" data-du="close">${L('Xong', 'Done')}</button></div></div>`);
    if (res === 'win' && window.FUN) try { FUN.sound('done'); FUN.confetti(sh); } catch { /* */ }
    DU = null; refreshHub();
  }

  /* ── cổ vũ ── */
  const CHEERS = [['Cố lên!', 'Keep going!'], ['Giữ chuỗi ngày học nhé!', 'Keep your streak!'], ['Học cùng nhau nào!', 'Let\'s study together!'], ['Giỏi quá!', 'Great job!'], ['Hôm nay nghe podcast chưa?', 'Listened to today\'s episode?']];
  function cheer(id, nick, back) {
    sheet(`<h3>${back ? L('Cổ vũ lại', 'Cheer back') : L('Cổ vũ', 'Cheer')} ${esc(nick)}</h3>
      <div class="du-chips">${CHEERS.map(([v, e]) => `<button type="button" data-du="cheerpick">${esc(L(v, e))}</button>`).join('')}</div>
      <input class="du-msg" maxlength="140" placeholder="${L('Hoặc tự viết một câu…', 'Or write your own…')}">
      <div class="du-acts col"><button type="button" class="st-go" data-du="cheersend" data-id="${esc(id)}" data-nick="${esc(nick)}">${L('Gửi lời cổ vũ', 'Send cheer')}</button></div>`);
  }
  async function cheerSend(id, nick, msg) {
    if (busy) return; busy = true;
    try {
      const d = await D.hub('dyDuel', { tk: R.tok(), id, kind: 'cheer', msg, rid: 'C' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) });
      if (!d.ok) throw new Error(d.error);
      closeSheet(); D.toast(L('Đã gửi lời cổ vũ tới ', 'Cheer sent to ') + nick); DU = null; refreshHub();
    } catch (er) { D.toast(er.message); }
    busy = false;
  }

  /* ── hộp thư trong Bạn bè ── */
  function inboxHtml() {
    if (!R.tok()) return '';
    if (!DU) { duels().then(d => { if (d) refreshHub(); }); return ''; }
    const inQ = DU.inbox.filter(x => x.kind === 'quiz' && x.status === 'open'), inC = DU.inbox.filter(x => x.kind === 'cheer' && x.status === 'open');
    const res = [...DU.sent.filter(x => x.kind === 'quiz' && x.status === 'done'), ...DU.inbox.filter(x => x.kind === 'quiz' && x.status === 'done')]
      .sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt))).slice(0, 4);
    const waiting = DU.sent.filter(x => x.kind === 'quiz' && x.status === 'open').slice(0, 3);
    if (!inQ.length && !inC.length && !res.length && !waiting.length) return '';
    const who = x => x.who ? `${R.av(x.who.avatar, 38, 'happy')}` : '';
    const ep = x => `${esc(R.SHOW[x.show] || D.showName(x.show) || '')} ${dm(x.date)}`;
    return `<section class="du-in"><h3 class="dy-h3">${L('Thách đấu & cổ vũ', 'Challenges & cheers')}</h3>
      ${inQ.map(x => `<div class="du-card hot">${who(x)}<p><b>${esc(x.who?.nick || '')}</b> ${L('thách bạn bài kiểm tra', 'challenges you to the quiz')} <span class="du-ep2">${ep(x)}</span><small>${esc(x.who?.nick || '')} ${L('đúng', 'got')} ${x.fromRight}/${x.fromN}${x.msg ? ` · “${esc(x.msg)}”` : ''} · ${R.ago(x.at)}</small></p>
        <span class="du-cb"><button type="button" class="dy-mini" data-du="accept" data-did="${esc(x.id)}">${L('Nhận', 'Accept')}</button><button type="button" class="dy-mini sec" data-du="decline" data-did="${esc(x.id)}">${L('Bỏ qua', 'Skip')}</button></span></div>`).join('')}
      ${inC.map(x => `<div class="du-card">${who(x)}<p><b>${esc(x.who?.nick || '')}</b>: “${esc(x.msg)}”<small>${R.ago(x.at)}</small></p>
        <span class="du-cb"><button type="button" class="dy-mini" data-du="cheerback" data-did="${esc(x.id)}" data-id="${esc(x.who?.id || '')}" data-nick="${esc(x.who?.nick || '')}">${L('Cổ vũ lại', 'Cheer back')}</button><button type="button" class="dy-mini sec" data-du="seen" data-did="${esc(x.id)}">OK</button></span></div>`).join('')}
      ${res.map(x => { const mineWin = x.result === 'tie' ? 'tie' : (x.mine ? x.result === 'from' : x.result === 'to') ? 'win' : 'lose';
        const me = x.mine ? [x.fromRight, x.fromN] : [x.toRight, x.toN], th = x.mine ? [x.toRight, x.toN] : [x.fromRight, x.fromN];
        return `<div class="du-card res ${mineWin}">${who(x)}<p><b>${mineWin === 'win' ? L('Bạn thắng', 'You won against') : mineWin === 'tie' ? L('Hoà với', 'Tie with') : L('Bạn thua', 'You lost to')} ${esc(x.who?.nick || '')}</b><small>${ep(x)} · ${L('bạn', 'you')} ${me[0]}/${me[1]} · ${esc(x.who?.nick || '')} ${th[0]}/${th[1]}</small></p></div>`; }).join('')}
      ${waiting.map(x => `<div class="du-card wait">${who(x)}<p>${L('Chờ', 'Waiting for')} <b>${esc(x.who?.nick || '')}</b> ${L('làm bài', 'to take')} ${ep(x)}<small>${L('bạn', 'you')} ${x.fromRight}/${x.fromN} · ${R.ago(x.at)}</small></p></div>`).join('')}
    </section>`;
  }
  const acts = x => `<button type="button" class="dy-mini" data-du="path" data-id="${esc(x.id)}">${L('Lộ trình', 'Path')}</button><button type="button" class="dy-mini" data-du="duel" data-id="${esc(x.id)}" data-nick="${esc(x.nick)}">${L('Thách đấu', 'Challenge')}</button><button type="button" class="dy-mini sec" data-du="cheer" data-id="${esc(x.id)}" data-nick="${esc(x.nick)}">${L('Cổ vũ', 'Cheer')}</button>`;
  function refreshHub() {
    const h = document.getElementById('du-inbox'); if (h) h.innerHTML = inboxHtml();
    badge();
  }

  /* ── thao tác ── */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-du]'); if (!t) return;
    const k = t.dataset.du, ds = t.dataset;
    if (t.tagName === 'A' && k !== 'close') e.preventDefault();
    if (!R.tok() && k !== 'close') { if (await R.login(L('Đăng nhập để học cùng bạn bè.', 'Sign in to study with friends.'))) R.repaint(); return; }
    try {
      if (k === 'close') { closeSheet(); return; }   // link trong khung (vd. số podcast) vẫn mở trang như thường
      if (k === 'path') return path(ds.id);
      if (k === 'duel') return pick(ds.id, ds.nick);
      if (k === 'ep') return epChoice(ds.date, ds.id, ds.nick);
      if (k === 'replay') return play(ds.date, { id: ds.id, nick: ds.nick, send: true });
      if (k === 'send') { const s = myScore(ds.date); if (s) return send(ds.date, ds.id, ds.nick, s, ''); return; }
      if (k === 'sendnow') { const s = myScore(ds.date), m = sh.querySelector('.du-msg'); if (s) return send(ds.date, ds.id, ds.nick, s, m ? m.value.trim() : ''); return; }
      if (k === 'ans') { if (Q.ans[Q.i] != null) return; Q.ans[Q.i] = +ds.j; const ok = Q.ans[Q.i] === Q.qs[Q.i].a; if (window.FUN) try { FUN.sound(ok ? 'ok' : 'no'); } catch { /* */ } return paintQ(); }
      if (k === 'nextq') { Q.i++; return paintQ(); }
      if (k === 'finish') return finish();
      if (k === 'seg') return playSeg(+ds.i);
      if (k === 'accept') { const x = (DU?.inbox || []).find(y => y.id === ds.did); if (x) return play(x.date, { duel: x }); return; }
      if (k === 'decline' || k === 'seen') { t.disabled = true; await D.hub('dyDuelAns', { tk: R.tok(), did: ds.did, op: k }); const x = (DU?.inbox || []).find(y => y.id === ds.did); if (x) x.status = k === 'seen' ? 'seen' : 'no'; refreshHub(); return; }
      if (k === 'cheer') return cheer(ds.id, ds.nick);
      if (k === 'cheerback') { D.hub('dyDuelAns', { tk: R.tok(), did: ds.did, op: 'seen' }).catch(() => {}); const x = (DU?.inbox || []).find(y => y.id === ds.did); if (x) x.status = 'seen'; return cheer(ds.id, ds.nick, true); }
      if (k === 'cheerpick') { const m = sh.querySelector('.du-msg'); if (m) m.value = t.textContent; sh.querySelectorAll('[data-du="cheerpick"]').forEach(b => b.classList.toggle('on', b === t)); return; }
      if (k === 'cheersend') { const m = sh.querySelector('.du-msg'); return cheerSend(ds.id, ds.nick, (m && m.value.trim()) || L(CHEERS[0][0], CHEERS[0][1])); }
    } catch (er) { D.toast(er.message || String(er)); }
  });

  window.DUEL = { path, pick, play, cheer, duels, inboxHtml, acts, refreshHub, badge, close: closeSheet };
  setTimeout(() => duels(), 4000);   // số đỏ ở mục Xếp hạng khi có lời thách đấu mới
})();
