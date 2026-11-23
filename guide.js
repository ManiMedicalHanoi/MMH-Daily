// MMH Daily — hướng dẫn sử dụng: 6 bước ngắn, tự hiện lần đầu mở app (chờ hộp khác đóng), mở lại bằng nút "?" trên đầu trang.
(function () {
  const D = window.DAILY; if (!D) return;
  const $ = s => document.querySelector(s), store = D.store;
  const KEY = 'mmh_daily_guide_v1';
  const I = (d) => `<svg viewBox="0 0 48 48" aria-hidden="true">${d}</svg>`;
  const STEPS = [
    { ic: I('<rect x="9" y="6" width="30" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 14h18M15 20h18M15 26h11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
      t: 'Đọc báo buổi sáng', x: 'Trang nhất xếp tin theo mức ảnh hưởng tới MMH: nha khoa, nhãn khoa, đấu thầu, thiết bị, BHYT, thị trường. Mục AI & Công nghệ: lãnh đạo OpenAI, Anthropic, Meta… nói gì, công nghệ mới, AI trong sales & marketing. Bấm VI · EN để đổi cả app sang tiếng Anh.',
      te: 'Read the morning paper', xe: 'The front page ranks stories by their impact on MMH: dentistry, ophthalmology, tenders, devices, health insurance, market. AI & Tech: what leaders at OpenAI, Anthropic, Meta… say, new technology, AI in sales & marketing. Tap VI · EN to switch the whole app language.' },
    { ic: I('<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M20 16v16l13-8z" fill="currentColor"/>'),
      t: 'Nghe podcast tiếng Anh', x: 'Vào Nghe podcast ▸ bấm nút tròn. Phụ đề Việt chạy theo giọng đọc; bấm một câu trong lời thoại để nghe lại từ đó. Thanh phát nhỏ ở cuối màn hình đi theo bạn khi xem trang khác. Thứ Năm là AI Pulse — tin AI quốc tế.',
      te: 'Listen to the English podcast', xe: 'Go to Listen ▸ tap the round button. Vietnamese subtitles follow the voice; tap a line in the transcript to play from there. The small player at the bottom follows you to other pages. Thursday is AI Pulse — international AI news.' },
    { ic: I('<path d="M6 17 24 9l18 8-18 8z M14 21v8c0 3 4.5 5.5 10 5.5s10-2.5 10-5.5v-8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>'),
      t: 'Học với Chế độ học', x: 'Ở trang Nghe, bấm Chế độ học: câu đang đọc nổi lên giữa màn hình. Nút lặp lại câu, câu trước / câu sau, giảm tốc 0,75×. Bật "Dừng sau mỗi câu" để nói theo; tắt Tiếng Việt để tự luyện nghe. Từ vựng được gạch chân, chạm để xem nghĩa.',
      te: 'Study mode', xe: 'On the Listen page, tap Study mode: the current line appears in the middle of the screen. Repeat a line, go back or forward, slow down to 0.75×. Turn on "Pause after each line" to speak along; turn off Vietnamese to train your ear. Underlined words show their meaning when tapped.' },
    { ic: I('<path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M11 37l4-4M33 15l4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/>'),
      t: 'Tổng hợp ngay, chọn nguồn', x: 'Bấm Tổng hợp ngay (góc trên). Chọn chủ đề (chỉ chọn AI & Công nghệ ⇒ ra số AI Pulse), bỏ / chọn từng báo trong Nguồn tin, chọn Claude viết (tự nhiên nhất) hoặc Tự động, chọn giọng ElevenLabs hoặc miễn phí, rồi bấm Cập nhật ngay. Cần đăng nhập email công ty. App tự mở số mới khi xong.',
      te: 'Update now, choose sources', xe: 'Tap Update now (top). Pick topics (only AI & Tech ⇒ an AI Pulse episode), switch sources on or off, choose Claude (most natural) or Automatic, choose ElevenLabs or free voices, then run. Sign in with your company email. The app opens the new edition when it is ready.' },
    { ic: I('<rect x="13" y="5" width="22" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 15v12m0 0-5-5m5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
      t: 'Cài app lên máy', x: 'Bấm Cài app (góc trên). Android / máy tính: hộp cài hiện ra, bấm Cài đặt. iPhone: Chia sẻ ▸ Thêm vào MH chính. Sau đó mở MMH Podcast từ biểu tượng như app thường.',
      te: 'Install the app', xe: 'Tap Install app (top). Android / computer: an install box appears, tap Install. iPhone: Share ▸ Add to Home Screen. Then open MMH Podcast from its icon like any app.' },
  ];
  const dlg = document.createElement('div');
  dlg.className = 'dlg gd'; dlg.id = 'gd'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'gd-h');
  document.body.appendChild(dlg);
  let i = 0;
  function paint() {
    const s = STEPS[i], L = D.L || (v => v);
    dlg.innerHTML = `<div class="dlg-box gd-box">
      <div class="gd-k">${L('Hướng dẫn', 'Guide')} · ${i + 1}/${STEPS.length}</div>
      <div class="gd-ic">${s.ic}</div>
      <h2 id="gd-h">${L(s.t, s.te)}</h2><p>${L(s.x, s.xe)}</p>
      <div class="gd-dots">${STEPS.map((_, k) => `<button type="button" data-k="${k}" class="${k === i ? 'on' : ''}" aria-label="${L('Bước', 'Step')} ${k + 1}"></button>`).join('')}</div>
      <div class="u2-ft"><button type="button" class="u2-lnk" data-a="skip">${L('Bỏ qua', 'Skip')}</button><div>
        ${i ? `<button type="button" class="dlg-x" data-a="back">${L('Trước', 'Back')}</button> ` : ''}<button type="button" class="u2-go" data-a="next">${i === STEPS.length - 1 ? L('Bắt đầu dùng', 'Get started') : L('Tiếp', 'Next')}</button></div></div></div>`;
    dlg.querySelector('[data-a=next]').focus();
  }
  const open = (k = 0) => { i = k; paint(); dlg.hidden = false; };
  const close = () => { dlg.hidden = true; store.set(KEY, 1); };
  dlg.addEventListener('click', e => {
    if (e.target === dlg) return close();
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) { i = +b.dataset.k; paint(); }
    else if (b.dataset.a === 'skip') close();
    else if (b.dataset.a === 'back') { i--; paint(); }
    else if (b.dataset.a === 'next') { if (i === STEPS.length - 1) close(); else { i++; paint(); } }
  });
  document.addEventListener('keydown', e => {
    if (dlg.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && i < STEPS.length - 1) { i++; paint(); }
    else if (e.key === 'ArrowLeft' && i) { i--; paint(); }
  });
  window.MMHGuide = { open };
  document.addEventListener('mmh-lang', () => { if (!dlg.hidden) paint(); });
  // nút "?" trên đầu trang
  const mr = $('.mast-r');
  if (mr) {
    const g = (D.L || (v => v))('Hướng dẫn sử dụng', 'User guide');
    mr.insertAdjacentHTML('afterbegin', `<button class="help-btn" id="help-btn" type="button" aria-label="${g}" title="${g}" data-en-aria="User guide" data-en-title="User guide" data-vi-aria="Hướng dẫn sử dụng" data-vi-title="Hướng dẫn sử dụng">?</button> `);
    $('#help-btn').onclick = () => open(0);
  }
  // lần đầu: hiện sau khi trang tải xong, khi không có hộp nào đang mở
  if (!store.get(KEY, 0)) {
    let n = 0;
    const t = setInterval(() => {
      if (++n > 40) return clearInterval(t);
      if ([...document.querySelectorAll('.dlg, .lrn')].some(x => !x.hidden) || !document.querySelector('#view > *')) return;
      clearInterval(t); open(0);
    }, 800);
  }
})();
