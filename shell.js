// MMH Daily Podcast — KHUNG CHUNG cho mọi trang (24/11/2026, người dùng: "chuyển qua lại giữa các chức năng chưa thông minh, giao diện chưa nhất quán").
// Một thanh điều hướng 5 mục ở MỌI trang (trang chính + Luyện nói / Phiên dịch): điện thoại = thanh dưới đáy, máy tính = cột trái.
//   Nghe (podcast · bản tin · MMH Report) · Học (lộ trình) · Luyện nói (bài nói · phiên dịch · sổ từ) · Xếp hạng (thi đua, bạn bè) · Tôi.
// Mỗi mục NHỚ chỗ đang xem (3 giờ): bấm sang mục khác rồi quay lại ⇒ về đúng trang / bài đang dở; bấm lại mục đang mở ⇒ về đầu mục.
// Thanh phân đoạn (#segs) ngay dưới đầu trang cho các phần trong cùng một mục — cùng một vị trí, cùng một kiểu ở mọi trang.
(function () {
  const IN_COACH = /\/coach\/(index\.html)?$/.test(location.pathname);
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* riêng tư */ } }
  };
  const EN = () => ls.get('mmh_daily_lang', 'vi') === 'en';
  const L = (vi, en) => (EN() ? en : vi);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    listen: svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'),
    learn: svg('<path d="M3 7.5 12 4l9 3.5-9 3.5z"/><path d="M7 9.6V14c0 1.7 2.2 3 5 3s5-1.3 5-3V9.6"/>'),
    speak: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    rank: svg('<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>'),
    me: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  };
  // [mục, chữ VI, chữ EN, gốc của mục (dạng chuẩn: tính từ thư mục gốc app)]
  const TABS = [
    ['listen', 'Nghe', 'Listen', '#/listen'],
    ['learn', 'Học', 'Learn', '#/learn'],
    ['speak', 'Luyện nói', 'Speak', 'coach/#/'],
    ['rank', 'Xếp hạng', 'Ranking', '#/rank'],
    ['me', 'Tôi', 'Me', '#/me'],
  ];
  // phần trong từng mục: [khoá, VI, EN, gốc]
  const SEGS = {
    listen: [['pod', 'Podcast', 'Podcast', '#/listen'], ['news', 'Bản tin', 'News', '#/'], ['report', 'MMH Report', 'MMH Report', '#/report']],
    speak: [['lessons', 'Bài nói', 'Lessons', 'coach/#/'], ['live', 'Phiên dịch', 'Interpreter', 'coach/#/live'], ['words', 'Sổ từ', 'Word book', 'coach/#/words']],
  };
  const TTL = 3 * 36e5, MEM = 'mmh_tab_mem';

  // vị trí hiện tại ở dạng chuẩn: '#/listen/2026-11-24' · 'coach/#/live'
  const here = () => (IN_COACH ? 'coach/' : '') + (location.hash && location.hash !== '#' ? location.hash : '#/');
  // dạng chuẩn ⇒ href dùng được trên trang đang mở
  const rel = h => (IN_COACH ? (h.startsWith('coach/') ? h.slice(6) : '../' + h) : h);
  const part = h => h.replace(/^coach\//, '').replace(/^#\/?/, '').split('/');
  function tabOf(h) {
    if (h.startsWith('coach/')) return 'speak';
    const r = part(h)[0];
    if (r === 'learn') return 'learn';
    if (r === 'rank' || r === 'add') return 'rank';
    if (r === 'me') return 'me';
    return 'listen';
  }
  function segOf(h) {
    const r = part(h)[0];
    if (h.startsWith('coach/')) return r === 'live' ? 'live' : r === 'words' ? 'words' : r === 'set' ? 'set' : 'lessons';
    if (r === 'listen') return 'pod';
    if (r === 'report' || r === 'noibo') return 'report';
    return 'news';
  }
  const fresh = x => x && x.h && Date.now() - x.at < TTL;

  function remember() {
    const h = here(), m = ls.get(MEM, {}), now = Date.now();
    m[tabOf(h)] = { h, at: now };
    m['seg:' + segOf(h)] = { h, at: now };
    ls.set(MEM, m);
  }
  // người ngoài công ty (đăng ký bằng email khác) không cần MMH Report
  function staff() {
    const me = ls.get('mmh_dy_me', null);
    if (!me || !me.email) return true;
    let co = false; try { co = !!localStorage.getItem('mmh_tk'); } catch { /* riêng tư */ }
    return co || /@(manimedicalhanoi\.com|mani\.inc)$/i.test(me.email);
  }

  const bar = () => document.getElementById('tabbar');
  function build() {
    const b = bar(); if (!b) return;
    b.setAttribute('aria-label', L('Điều hướng chính', 'Main navigation'));
    b.innerHTML = `<a class="tb-logo" href="${rel('#/listen')}" aria-label="MMH Daily Podcast"><img src="${IN_COACH ? '../' : ''}icons/icon.svg" alt="" width="36" height="36"><span>MMH Daily <i>Podcast</i></span></a>`
      + TABS.map(([k]) => `<a data-tab-k="${k}"${k === 'me' ? ' class="tab-me"' : ''}>${k === 'me' ? '<span class="tab-av" data-dy-tab></span><i class="tab-st" data-dy-streak hidden></i>' : IC[k]}<span class="tb-l"></span><i class="tb-n" hidden></i></a>`).join('');
    b.addEventListener('click', e => {
      const a = e.target.closest('a[data-tab-k]'); if (!a) return;
      // bấm lại mục đang mở mà đã ở đầu mục ⇒ cuộn lên đầu trang
      if (a.classList.contains('on') && a.getAttribute('href') === rel(here())) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    paintMe();
  }
  function paintMe() {
    const me = ls.get('mmh_dy_me', null);
    document.documentElement.classList.toggle('is-admin', !!(me && me.admin));
    document.querySelectorAll('#tabbar [data-dy-tab]').forEach(el => {
      el.innerHTML = me && window.CHARS ? `<span class="dy-av" style="--s:24px" aria-hidden="true">${CHARS.svg(me.avatar || 'chip', 'happy', { bg: '#F3EFE7', round: true })}</span>` : IC.me;
    });
    document.querySelectorAll('#tabbar [data-dy-streak]').forEach(el => { el.textContent = me && me.streak ? me.streak : ''; el.hidden = !(me && me.streak); });
  }
  function sync() {
    remember();
    const h = here(), cur = tabOf(h), m = ls.get(MEM, {}), b = bar();
    if (b) {
      if (!b.querySelector('[data-tab-k]')) build();
      TABS.forEach(([k, vi, en, root]) => {
        const a = b.querySelector(`[data-tab-k="${k}"]`); if (!a) return;
        a.href = rel(k !== cur && fresh(m[k]) ? m[k].h : root);
        a.classList.toggle('on', k === cur);
        if (k === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        a.querySelector('.tb-l').textContent = L(vi, en);
      });
      const lg = b.querySelector('.tb-logo'); if (lg) lg.href = rel('#/listen');
    }
    paintSegs(h, cur, m);
    const sb = document.getElementById('set-btn'); if (sb) sb.classList.toggle('on', segOf(h) === 'set');
    document.documentElement.dataset.shtab = cur;   // KHÔNG dùng data-tab (app.js bắt [data-tab] khi bấm)
  }
  function paintSegs(h, cur, m) {
    const el = document.getElementById('segs'); if (!el) return;
    const list = (SEGS[cur] || []).filter(([k]) => k !== 'report' || staff());
    if (!list.length) { el.hidden = true; el.innerHTML = ''; return; }
    const on = segOf(h);
    el.hidden = false;
    el.setAttribute('aria-label', L('Các phần', 'Sections'));
    el.innerHTML = list.map(([k, vi, en, root]) => {
      const href = k !== on && fresh(m['seg:' + k]) ? m['seg:' + k].h : root;
      const n = k === 'words' ? dueWords() : 0;
      return `<a href="${esc(rel(href))}" data-seg="${k}" class="${k === on ? 'on' : ''}"${k === on ? ' aria-current="page"' : ''}>${esc(L(vi, en))}${n ? `<i>${n}</i>` : ''}</a>`;
    }).join('');
  }
  function dueWords() {
    const d = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
    return (ls.get('mmh_coach_words', []) || []).filter(w => w && w.due && w.due <= d).length;
  }

  window.SHELL = {
    sync, paintMe, here, rel, tabOf,
    // số đỏ trên một mục (vd. lời mời kết bạn ở Xếp hạng)
    badge(k, n) { const i = document.querySelector(`#tabbar [data-tab-k="${k}"] .tb-n`); if (i) { i.textContent = n > 9 ? '9+' : n || ''; i.hidden = !n; } },
  };
  window.addEventListener('hashchange', sync);
  document.addEventListener('mmh-lang', sync);
  window.addEventListener('storage', e => { if (e.key === 'mmh_dy_me') paintMe(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
})();
