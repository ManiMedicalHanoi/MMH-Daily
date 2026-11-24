// MMH Daily — hướng dẫn sử dụng: 6 bước ngắn (24/11/2026: theo điều hướng 5 mục), tự hiện lần đầu mở app (chờ hộp khác đóng), mở lại bằng nút "?" trên đầu trang.
(function () {
  const D = window.DAILY; if (!D) return;
  const $ = s => document.querySelector(s), store = D.store;
  const KEY = 'mmh_daily_guide_v2';   // 24/11/2026: điều hướng mới ⇒ hiện lại hướng dẫn 1 lần
  const I = (d) => `<svg viewBox="0 0 48 48" aria-hidden="true">${d}</svg>`;
  const STEPS = [
    { ic: I('<rect x="5" y="30" width="38" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="36" r="2" fill="currentColor"/><circle cx="20" cy="36" r="2" fill="currentColor"/><circle cx="28" cy="36" r="2" fill="currentColor"/><circle cx="36" cy="36" r="2" fill="currentColor"/><path d="M12 8h24M12 15h24M12 22h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
      t: '5 mục, ở mọi trang', x: 'Thanh dưới đáy (máy tính: cột trái) luôn có Nghe · Học · Luyện nói · Xếp hạng · Tôi. Mỗi mục nhớ chỗ bạn đang xem: sang mục khác rồi quay lại là về đúng bài đang dở; chạm lại mục đang mở để về đầu mục. Các phần trong một mục nằm ở thanh ngay dưới logo.',
      te: '5 tabs on every page', xe: 'The bar at the bottom (left column on a computer) always has Listen · Learn · Speak · Ranking · Me. Each tab remembers where you were: switch away and back to return to the same lesson; tap the open tab again to go to its start. Parts of a tab sit in the bar right under the logo.' },
    { ic: I('<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M20 16v16l13-8z" fill="currentColor"/>'),
      t: 'Nghe podcast, đọc bản tin', x: 'Nghe ▸ Podcast: bấm nút tròn. Lời thoại hiện tiếng Anh; chạm một câu để nghe lại từ câu đó và xem nghĩa tiếng Việt, chạm một từ trong câu để tra nhanh và lưu vào Sổ từ. "Xem theo câu" mở phụ đề lớn. Nghe ▸ Bản tin: tờ báo buổi sáng, xếp theo mức ảnh hưởng tới MMH.',
      te: 'Listen and read', xe: 'Listen ▸ Podcast: tap the round button. The transcript is in English; tap a line to replay it and see its Vietnamese meaning, tap a word in that line to look it up and save it to your word book. "Line by line" opens big subtitles. Listen ▸ News: the morning paper, ranked by impact on MMH.' },
    { ic: I('<circle cx="21" cy="21" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m30 30 10 10M15 21h12M21 15v12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
      t: 'Chuyên đề: đi sâu một chủ đề', x: 'Nghe ▸ Chuyên đề: Đấu thầu (chỉ Báo Đấu thầu), Văn bản pháp quy, Glôcôm, Võng mạc, Đục thủy tinh thể, Nội nha, Phục hồi răng, Khâu & ghim da. Chỉ nguồn uy tín (cơ quan nhà nước, tạp chí khoa học, báo chuyên ngành, tin hãng), lọc theo loại / nguồn, bài mới có nhãn Mới. Bấm Theo dõi để bài mới hiện đầu trang; chạm từ tiếng Anh để tra.',
      te: 'Deep dives', xe: 'Listen ▸ Deep dives: medical tenders (Bidding Newspaper only), regulations, glaucoma, retina, cataract, endodontics, restorative dentistry, sutures & staplers. Trusted sources only (government, journals, specialist press, company news); filter by type or source; new items are marked New. Tap Follow to see new items first; tap an English word to look it up.' },
    { ic: I('<path d="M6 17 24 9l18 8-18 8z M14 21v8c0 3 4.5 5.5 10 5.5s10-2.5 10-5.5v-8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>'),
      t: 'Học mỗi ngày', x: 'Học là lộ trình kiểu Duolingo: mỗi sáng có bài mới theo số podcast — từ khoá, nghe, kiểm tra, nói theo. Học đều để giữ chuỗi ngày, lấy XP và lên cấp. Nút Bài học cũng có ngay cạnh nút phát ở trang Nghe.',
      te: 'Learn every day', xe: 'Learn is a Duolingo-style path: every morning a new lesson from the podcast — keywords, listening, quiz, speaking. Study daily to keep your streak, earn XP and level up. The Lesson button also sits next to the play button on the Listen page.' },
    { ic: I('<rect x="18" y="6" width="12" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M10 22a14 14 0 0 0 28 0M24 36v6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
      t: 'Luyện nói và phiên dịch', x: 'Luyện nói ▸ Bài nói: 3 mức — điền từ vào câu rồi đọc to, nói có gợi ý, tự nói. Luyện nói ▸ Phiên dịch: chạm "Họ nói" khi khách nói tiếng Anh (chữ Việt hiện ngay), chạm "Tôi nói" rồi nói tiếng Việt để có câu tiếng Anh đọc lại. Sổ từ nhắc ôn từ đã lưu.',
      te: 'Speak and interpret', xe: 'Speak ▸ Lessons: 3 levels — fill the words into the sentence and read it aloud, speak with hints, speak on your own. Speak ▸ Interpreter: tap "They speak" when someone talks in English (Vietnamese appears at once), tap "I speak" and talk in Vietnamese to get an English sentence to read out. The word book reminds you to review saved words.' },
    { ic: I('<path d="M16 42h16M24 34v8M14 8h20v8a10 10 0 0 1-20 0z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 10h6a6 6 0 0 1-6 8M14 10H8a6 6 0 0 0 6 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'),
      t: 'Xếp hạng và bạn bè', x: 'Xếp hạng: giải đấu tuần, bảng tuần / tháng. Thêm bạn bằng mã hoặc QR; xem lộ trình học của bạn bè, gửi thách đấu một bài kiểm tra podcast hoặc gửi lời cổ vũ. Thắng thách đấu được thêm XP.',
      te: 'Ranking and friends', xe: 'Ranking: weekly leagues, week / month boards. Add friends by code or QR; see a friend\'s learning path, challenge them to a podcast quiz or send a cheer. Winning a challenge earns bonus XP.' },
    { ic: I('<rect x="13" y="5" width="22" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 15v12m0 0-5-5m5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
      t: 'Cài app lên máy', x: 'Bấm biểu tượng tải xuống ở đầu trang. Android / máy tính: hộp cài hiện ra, bấm Cài đặt. iPhone: Chia sẻ ▸ Thêm vào MH chính. Sau đó mở MMH Podcast từ biểu tượng như app thường. Bấm VI · EN để đổi cả app sang tiếng Anh.',
      te: 'Install the app', xe: 'Tap the download icon at the top. Android / computer: an install box appears, tap Install. iPhone: Share ▸ Add to Home Screen. Then open MMH Podcast from its icon like any app. Tap VI · EN to switch the whole app to English.' },
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
