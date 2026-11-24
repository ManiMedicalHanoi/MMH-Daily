// MMH Daily Podcast — bộ NHÂN VẬT (linh vật) vẽ bằng SVG: Chíp (linh vật hệ thống) + 12 bạn học, phong cách đã duyệt 24/11/2026:
// tròn mũm mĩm, màu chuyển mềm, không viền, má hồng; 6 sắc thái: happy (vui) · wave (chào) · cheer (ăn mừng) · think (suy nghĩ khi làm bài) ·
// sleepy (buồn ngủ) · sad (buồn khi lâu không học). Linh vật tự tạo (Admin): mã "c:<màu>.<tai>.<phụ kiện>" — CHARS.custom.
// Dùng: CHARS.svg(id, mood, {bg:true}) ⇒ chuỗi <svg>. Ảnh PNG cho email (chip-wave.png…) dựng từ file này: tools/chars_png.mjs.
(function () {
  let uid = 0;
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (h, t, a) => { const A = hx(h), B = hx(t); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
  const lite = (h, a) => mix(h, '#ffffff', a), dark = (h, a) => mix(h, '#000000', a);
  const INK = '#2B2B33';

  // bảng nhân vật: n = tên, vi / en = mô tả, b = màu thân, y = bụng, l = tay chân, k = kiểu tai / đặc điểm
  const C = {
    chip: { n: 'Chíp', vi: 'Linh vật hệ thống', en: 'Our mascot', b: '#FFD54A', y: '#FFF2BF', l: '#FBC531', f: '#F39B3A', k: 'chick' },
    mochi: { n: 'Mochi', vi: 'Mèo trắng mọt sách', en: 'Bookworm cat', b: '#F6F3EE', y: '#FFFFFF', l: '#ECE6DE', f: '#E7DFD4', k: 'cat', acc: 'scarf' },
    tofu: { n: 'Tofu', vi: 'Shiba lạc quan', en: 'Cheerful shiba', b: '#F2A25C', y: '#FFE7CC', l: '#E8914A', f: '#D98040', k: 'shiba' },
    capy: { n: 'Capy', vi: 'Capybara chill', en: 'Chill capybara', b: '#B98B63', y: '#E3C7A6', l: '#A87A53', f: '#8F6645', k: 'capy' },
    pip: { n: 'Pip', vi: 'Cánh cụt lịch lãm', en: 'Dapper penguin', b: '#2F4A66', y: '#FFFFFF', l: '#263D55', f: '#F39B3A', k: 'penguin' },
    kiko: { n: 'Kiko', vi: 'Cáo mê podcast', en: 'Podcast fox', b: '#EE7A3E', y: '#FFF1E6', l: '#DB6A30', f: '#C95E2A', k: 'fox' },
    bao: { n: 'Bảo', vi: 'Gấu trúc ham học', en: 'Studious panda', b: '#F7F6F2', y: '#FFFFFF', l: '#2E2E34', f: '#2E2E34', k: 'panda' },
    rang: { n: 'Răng Xinh', vi: 'Team Nha khoa', en: 'Dental team', b: '#F4F8FB', y: '#FFFFFF', l: '#DCE7EF', f: '#DCE7EF', k: 'tooth' },
    iris: { n: 'Iris', vi: 'Cừu kính cận · team Nhãn khoa', en: 'Ophthalmic team sheep', b: '#F6F1EA', y: '#EADCCB', l: '#7A6250', f: '#6A5444', k: 'sheep' },
    bit: { n: 'Bit', vi: 'Robot AI tí hon', en: 'Tiny AI robot', b: '#EEF2F6', y: '#FFFFFF', l: '#DCE3EA', f: '#C9D2DB', k: 'robot' },
    so: { n: 'Sò', vi: 'Rái cá MC', en: 'MC otter', b: '#9C6B45', y: '#E6CBAE', l: '#8A5C3A', f: '#7A5033', k: 'otter', acc: 'bowtie' },
    nhim: { n: 'Nhím', vi: 'Nhím chăm chỉ', en: 'Hard-working hedgehog', b: '#F3D3A3', y: '#FFF0DA', l: '#E2B985', f: '#C99A65', k: 'hedgehog' },
    hana: { n: 'Hana', vi: 'Thỏ hồng Nhật Bản', en: 'Pink bunny', b: '#F7B5C9', y: '#FFE6EE', l: '#EFA0B8', f: '#E68FAA', k: 'bunny' }
  };
  const MOODS = { happy: ['Vui', 'Happy'], wave: ['Chào', 'Hi'], cheer: ['Ăn mừng', 'Cheer'], think: ['Suy nghĩ', 'Thinking'], sleepy: ['Buồn ngủ', 'Sleepy'], sad: ['Buồn', 'Sad'] };

  /* ── linh vật tự tạo (Admin): màu · tai · phụ kiện ── */
  const CUSTOM = {
    colors: ['#FFD54A', '#F2A25C', '#EE7A3E', '#F7B5C9', '#B9A7F5', '#8FD3C1', '#7FB6F0', '#B98B63', '#F6F3EE', '#2F4A66'],
    ears: ['none', 'cat', 'bear', 'bunny', 'fox', 'chick', 'antenna', 'sprout'],
    accs: ['none', 'glasses', 'headphones', 'bowtie', 'scarf', 'crown', 'flower', 'stetho']
  };
  function parseCustom(s) {
    const m = /^c:(\d)\.(\d)\.(\d)$/.exec(String(s || '')); if (!m) return null;
    const b = CUSTOM.colors[+m[1]] || CUSTOM.colors[0];
    return { n: '', b, y: lite(b, 0.62), l: dark(b, 0.08), f: dark(b, 0.18), k: 'c-' + (CUSTOM.ears[+m[2]] || 'none'), acc: CUSTOM.accs[+m[3]] || 'none' };
  }

  /* ── các bộ phận ── */
  const E = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  function grad(id, base) {
    return `<radialGradient id="${id}" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="${lite(base, 0.45)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark(base, 0.12)}"/></radialGradient>`;
  }
  function earsBack(c, g) {   // vẽ SAU thân
    const k = c.k.replace(/^c-/, ''), b = c.b;
    switch (k) {
      case 'cat': return `<path d="M54 78 L58 30 L92 60Z" fill="url(#${g})"/><path d="M146 78 L142 30 L108 60Z" fill="url(#${g})"/><path d="M62 66 L64 42 L84 60Z" fill="#F6B8C4"/><path d="M138 66 L136 42 L116 60Z" fill="#F6B8C4"/>`;
      case 'shiba': case 'fox': return `<path d="M50 82 L56 28 L94 58Z" fill="url(#${g})"/><path d="M150 82 L144 28 L106 58Z" fill="url(#${g})"/><path d="M60 70 L62 42 L84 58Z" fill="${k === 'fox' ? '#3A2A24' : '#FFE7CC'}" opacity="${k === 'fox' ? .85 : 1}"/><path d="M140 70 L138 42 L116 58Z" fill="${k === 'fox' ? '#3A2A24' : '#FFE7CC'}" opacity="${k === 'fox' ? .85 : 1}"/>`;
      case 'bear': case 'capy': case 'otter': return E(60, 64, 15, 14, dark(b, 0.1)) + E(140, 64, 15, 14, dark(b, 0.1)) + E(60, 66, 8, 7, dark(b, 0.28));
      case 'panda': return E(58, 62, 18, 17, '#2E2E34') + E(142, 62, 18, 17, '#2E2E34');
      case 'bunny': return `<ellipse cx="76" cy="38" rx="14" ry="36" fill="url(#${g})" transform="rotate(-10 76 38)"/><ellipse cx="124" cy="38" rx="14" ry="36" fill="url(#${g})" transform="rotate(10 124 38)"/><ellipse cx="76" cy="40" rx="7" ry="26" fill="#FFD9E5" transform="rotate(-10 76 40)"/><ellipse cx="124" cy="40" rx="7" ry="26" fill="#FFD9E5" transform="rotate(10 124 40)"/>`;
      case 'sheep': return E(50, 92, 16, 10, '#7A6250', 'transform="rotate(-25 50 92)"') + E(150, 92, 16, 10, '#7A6250', 'transform="rotate(25 150 92)"');
      case 'hedgehog': { let s = ''; for (let i = 0; i < 13; i++) { const a = Math.PI * (0.95 + i * 0.09), x = 100 + Math.cos(a) * 64, y = 108 + Math.sin(a) * 60; const a2 = a - 0.12, a3 = a + 0.12;
          s += `<path d="M${(100 + Math.cos(a2) * 50).toFixed(1)} ${(108 + Math.sin(a2) * 46).toFixed(1)} L${(100 + Math.cos(a) * 78).toFixed(1)} ${(108 + Math.sin(a) * 74).toFixed(1)} L${(100 + Math.cos(a3) * 50).toFixed(1)} ${(108 + Math.sin(a3) * 46).toFixed(1)}Z" fill="${i % 2 ? '#8A5A3C' : '#9E6A47'}"/>`; void x; void y; }
        return s + E(100, 80, 58, 40, '#946140'); }
      case 'fox-tail': return '';
    }
    return '';
  }
  function tail(c) {
    if (c.k === 'fox') return `<path d="M142 150 C186 150 196 110 178 92 C176 120 160 132 140 136Z" fill="#EE7A3E"/><path d="M178 92 C186 102 186 114 180 122 C176 112 176 102 178 92Z" fill="#FFF1E6"/>`;
    if (c.k === 'shiba') return `<path d="M148 140 C176 140 180 112 164 108 C156 106 152 116 160 120 C164 124 156 132 146 130Z" fill="#E8914A"/>`;
    return '';
  }
  function body(c, g, gy) {
    if (c.k === 'tooth') return `<path d="M50 92 C50 54 80 50 100 60 C120 50 150 54 150 92 C150 126 142 148 134 170 C128 186 114 184 112 170 L108 152 C104 144 96 144 92 152 L88 170 C86 184 72 186 66 170 C58 148 50 126 50 92Z" fill="url(#${g})"/>`;
    if (c.k === 'robot') return `<rect x="40" y="58" width="120" height="110" rx="46" fill="url(#${g})"/>`;
    let s = `<ellipse cx="100" cy="110" rx="62" ry="58" fill="url(#${g})"/>`;
    if (c.k === 'penguin') s += E(100, 120, 44, 46, `url(#${gy})`);
    else if (c.k === 'sheep') s += `<g fill="#FFFFFF">${[[64, 62], [82, 52], [100, 48], [118, 52], [136, 62], [148, 80], [52, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join('')}</g>` + E(100, 114, 40, 34, '#EADCCB');
    else if (c.k !== 'panda' && c.k !== 'chick') s += E(100, 136, 36, 28, `url(#${gy})`);
    else s += E(100, 136, 34, 26, `url(#${gy})`);
    if (c.k === 'fox' || c.k === 'shiba') s += E(100, 120, 30, 18, c.y);
    if (c.k === 'capy') s += E(100, 118, 26, 16, dark(c.b, 0.12));
    if (c.k === 'otter') s += E(100, 118, 28, 17, c.y);
    return s;
  }
  function arms(c, mood) {
    if (c.k === 'tooth') return '';
    const L = c.l, f = (x, y, r) => E(x, y, 13, 19, L, `transform="rotate(${r} ${x} ${y})"`);
    if (mood === 'wave') return f(44, 122, 20) + f(160, 80, -35);
    if (mood === 'cheer') return f(40, 82, 35) + f(160, 82, -35);
    if (mood === 'think') return f(44, 122, 20) + E(128, 128, 13, 15, L);
    if (mood === 'sad' || mood === 'sleepy') return f(50, 130, 8) + f(150, 130, -8);
    return f(42, 120, 22) + f(158, 120, -22);
  }
  function feet(c) {
    if (c.k === 'tooth' || c.k === 'robot') return c.k === 'robot' ? E(78, 168, 14, 7, c.f) + E(122, 168, 14, 7, c.f) : '';
    return E(80, 166, 14, 8, c.f) + E(120, 166, 14, 8, c.f);
  }
  function eyes(c, mood) {
    const xs = [80, 120], y = c.k === 'tooth' ? 96 : 104, ink = c.k === 'robot' ? '#6FE3CF' : INK;
    let s = '';
    if (c.k === 'panda') s += E(78, y + 1, 14, 17, '#2E2E34', 'transform="rotate(-20 78 105)"') + E(122, y + 1, 14, 17, '#2E2E34', 'transform="rotate(20 122 105)"');
    if (c.k === 'robot') s += `<rect x="58" y="80" width="84" height="48" rx="22" fill="#1F2A33"/>`;
    const open = (x, dx = 0, dy = 0) => c.k === 'panda'
      ? E(x, y, 7.5, 8.5, '#fff') + E(x + dx, y + 1 + dy, 4.5, 5.5, INK) + `<circle cx="${x + dx + 1.6}" cy="${y - 1.5 + dy}" r="1.6" fill="#fff"/>`
      : c.k === 'robot' ? E(x, y, 6, 8, ink)
        : E(x + dx, y + dy, 7, 8.5, ink) + `<circle cx="${x + dx + 2.4}" cy="${y + dy - 3}" r="2.7" fill="#fff"/>`;
    const arcUp = x => `<path d="M${x - 8} ${y + 2} Q${x} ${y - 8} ${x + 8} ${y + 2}" stroke="${c.k === 'panda' ? '#fff' : ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    const arcDn = x => `<path d="M${x - 8} ${y - 1} Q${x} ${y + 6} ${x + 8} ${y - 1}" stroke="${c.k === 'panda' ? '#fff' : ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    if (mood === 'wave' || mood === 'cheer') s += xs.map(arcUp).join('');
    else if (mood === 'sleepy') s += xs.map(arcDn).join('');
    else if (mood === 'think') s += xs.map(x => open(x, -2, -2)).join('');
    else s += xs.map(x => open(x)).join('');
    if (mood === 'sad' && c.k !== 'robot') s += `<path d="M70 ${y - 14} L88 ${y - 18}M130 ${y - 14} L112 ${y - 18}" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".8"/>` + `<path d="M124 ${y + 9} q-4 7 0 10 q4 -3 0 -10Z" fill="#7CC4F2"/>`;
    if (c.k === 'sheep' || /glasses/.test(c.acc || '')) s += `<g fill="none" stroke="#1E8C7E" stroke-width="3.2"><circle cx="80" cy="${y}" r="13"/><circle cx="120" cy="${y}" r="13"/><path d="M93 ${y} H107"/></g>`;
    return s;
  }
  function mouth(c, mood) {
    const y = c.k === 'tooth' ? 112 : 120;
    if (c.k === 'robot') return mood === 'sad' ? `<path d="M90 120 q10 -7 20 0" stroke="#6FE3CF" stroke-width="3" fill="none" stroke-linecap="round"/>` : `<path d="M90 116 q10 8 20 0" stroke="#6FE3CF" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (c.k === 'chick' || c.k === 'penguin') return mood === 'cheer' ? `<path d="M92 ${y - 4} L108 ${y - 4} L100 ${y + 8}Z" fill="#F39B3A"/><path d="M93 ${y - 2} L107 ${y - 2}" stroke="#D9772A" stroke-width="2"/>` : `<path d="M92 ${y - 5} Q100 ${y - 9} 108 ${y - 5} L100 ${y + 3}Z" fill="#F39B3A"/>`;
    let s = '';
    if (c.k === 'capy' || c.k === 'otter') s += E(100, y - 6, 6, 4, '#3A2A24');
    else if (c.k !== 'tooth' && c.k !== 'sheep') s += `<path d="M97 ${y - 7} L103 ${y - 7} L100 ${y - 4}Z" fill="${c.k === 'cat' || c.k === 'bunny' ? '#F08BA0' : '#3A2A24'}"/>`;
    if (mood === 'sad') return s + `<path d="M93 ${y + 4} Q100 ${y - 2} 107 ${y + 4}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (mood === 'cheer') return s + `<path d="M92 ${y - 1} Q100 ${y + 12} 108 ${y - 1}Z" fill="#B23A48"/><path d="M95 ${y + 4} Q100 ${y + 9} 105 ${y + 4}" fill="#F07A8A"/>`;
    if (mood === 'sleepy') return s + E(100, y + 1, 3, 2.5, INK);
    return s + `<path d="M93 ${y - 2} q3.5 5 7 0 q3.5 5 7 0" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
  function blush(c) { if (c.k === 'robot') return E(64, 116, 7, 4, '#FF9AA2', 'opacity=".5"') + E(136, 116, 7, 4, '#FF9AA2', 'opacity=".5"'); const y = c.k === 'tooth' ? 108 : 118; return E(66, y, 9.5, 5.5, '#FF8FA0', 'opacity=".42"') + E(134, y, 9.5, 5.5, '#FF8FA0', 'opacity=".42"'); }
  function top(c) {   // vẽ TRƯỚC thân: chỏm lông, lá, quả cam, ăng-ten…
    const k = c.k.replace(/^c-/, '');
    if (k === 'chick') return `<path d="M96 56 C90 40 98 34 102 42 C104 32 114 36 106 56Z" fill="#FBC531"/>`;
    if (k === 'sprout' || c.k === 'tooth') return `<path d="M100 ${c.k === 'tooth' ? 60 : 54} C96 44 86 42 80 46 C86 52 94 54 100 ${c.k === 'tooth' ? 60 : 54}Z M100 ${c.k === 'tooth' ? 60 : 54} C104 40 116 36 124 40 C118 50 108 54 100 ${c.k === 'tooth' ? 60 : 54}Z" fill="#1E9C86"/>`;
    if (k === 'antenna' || c.k === 'robot') return `<path d="M100 58 V40" stroke="#C9D2DB" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="36" r="7" fill="#FFC94A"/>`;
    if (c.k === 'capy') return `<circle cx="104" cy="52" r="12" fill="#F5A13A"/><path d="M104 40 C110 34 118 36 118 36 C114 42 108 42 104 40Z" fill="#2F9E6E"/>`;
    if (c.k === 'hedgehog') return `<g transform="rotate(-28 128 62)"><rect x="112" y="58" width="36" height="9" rx="3" fill="#FFD54A"/><path d="M148 58 L158 62.5 L148 67Z" fill="#F2C9A0"/><path d="M155 61 L158 62.5 L155 64Z" fill="#333"/><rect x="108" y="58" width="6" height="9" rx="2" fill="#F08BA0"/></g>`;
    return '';
  }
  function acc(c, mood) {
    const a = c.acc || (c.k === 'pip' ? '' : '');
    let s = '';
    if (c.k === 'penguin' || a === 'bowtie') s += `<path d="M100 146 L86 139 L86 153Z M100 146 L114 139 L114 153Z" fill="#1E9C86"/><circle cx="100" cy="146" r="4" fill="#178574"/>`;
    if (a === 'scarf') s += `<path d="M62 140 Q100 156 138 140 L138 150 Q100 166 62 150Z" fill="#1E9C86"/>`;
    if (a === 'headphones' || c.k === 'fox') s += `<path d="M48 104 C48 50 152 50 152 104" stroke="#1E9C86" stroke-width="7" fill="none"/>` + E(46, 108, 9, 14, '#178574') + E(154, 108, 9, 14, '#178574');
    if (a === 'crown') s += `<path d="M78 60 L84 40 L94 54 L100 36 L106 54 L116 40 L122 60Z" fill="#FFC94A"/>`;
    if (a === 'flower' || c.k === 'bunny') s += `<g transform="translate(${c.k === 'bunny' ? 132 : 130} ${c.k === 'bunny' ? 66 : 62})">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-6" rx="4.5" ry="6" fill="#FFF" transform="rotate(${r})"/>`).join('')}<circle r="3.5" fill="#FFC94A"/></g>`;
    if (a === 'stetho') s += `<path d="M78 136 Q100 160 122 136" stroke="#1E9C86" stroke-width="3.5" fill="none"/><circle cx="122" cy="150" r="5" fill="#178574"/>`;
    void mood; return s;
  }
  function deco(mood) {
    if (mood === 'cheer') return `<path d="M30 54 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" fill="#FFC94A"/><path d="M168 44 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4Z" fill="#6FD6BF"/><circle cx="40" cy="96" r="3" fill="#F07A8A"/><circle cx="166" cy="104" r="3" fill="#6FB4F2"/>`;
    if (mood === 'wave') return `<path d="M178 58 q6 6 0 12 M186 52 q10 12 0 24" stroke="#9AA3AE" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (mood === 'think') return `<circle cx="150" cy="56" r="4" fill="#C9CFD6"/><circle cx="160" cy="42" r="6" fill="#C9CFD6"/><text x="168" y="34" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="24" fill="#1E9C86">?</text>`;
    if (mood === 'sleepy') return `<text x="150" y="58" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="16" fill="#9AA3AE">z</text><text x="162" y="42" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="22" fill="#9AA3AE">z</text>`;
    if (mood === 'sad') return `<g fill="#C9CFD6"><ellipse cx="160" cy="40" rx="20" ry="11"/><ellipse cx="148" cy="44" rx="12" ry="9"/></g><path d="M150 56 v6 M160 56 v8 M170 56 v6" stroke="#8EC9F0" stroke-width="2.4" stroke-linecap="round"/>`;
    return '';
  }

  function svg(id, mood = 'happy', opt = {}) {
    const c = String(id || '').startsWith('c:') ? (parseCustom(id) || C.chip) : (C[id] || C.chip);
    if (!MOODS[mood]) mood = 'happy';
    const g = 'mg' + (++uid), gy = g + 'y';
    const bg = opt.bg ? `<rect width="200" height="200" rx="${opt.round ? 100 : 46}" fill="${opt.bg === true ? '#F3EFE7' : opt.bg}"/>` : '';
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" ${opt.cls ? `class="${opt.cls}"` : ''} aria-hidden="true"><defs>${grad(g, c.b)}${grad(gy, c.y)}</defs>${bg}
      <ellipse cx="100" cy="178" rx="50" ry="7" fill="#000" opacity=".08"/>${tail(c)}${earsBack(c, g)}${feet(c)}${body(c, g, gy)}${arms(c, mood)}${top(c)}${eyes(c, mood)}${blush(c)}${mouth(c, mood)}${acc(c, mood)}${deco(mood)}</svg>`;
  }
  const name = id => String(id || '').startsWith('c:') ? 'Linh vật riêng' : (C[id] || C.chip).n;
  window.CHARS = { svg, name, list: C, MOODS, CUSTOM, parseCustom, ids: Object.keys(C) };
})();
