// MMH Daily Podcast — LỜI THOẠI THÔNG MINH (24/11/2026, người dùng: "phần dịch ngay tại chỗ đoạn hội thoại chưa thực sự hữu dụng").
// Trang Nghe / MMH Report: mặc định chỉ tiếng Anh; CHẠM 1 CÂU ⇒ nghe lại từ câu đó + hiện nghĩa tiếng Việt ngay dưới câu;
// trong câu đang mở, CHẠM 1 TỪ ⇒ thẻ tra nhanh (nghĩa theo bài học của số / thuật ngữ MMH / Google Dịch), nghe phát âm, lưu vào Sổ từ.
// Từ khoá của số được gạch chân sẵn — chạm là tra, ở bất kỳ câu nào.
(function () {
  const D = window.DAILY; if (!D) return;
  const esc = D.esc, store = D.store, L = (vi, en) => (D.L ? D.L(vi, en) : vi);
  const norm = w => String(w || '').toLowerCase().replace(/[’']/g, "'").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  const stems = w => { const x = norm(w); const out = [x]; if (/ies$/.test(x)) out.push(x.slice(0, -3) + 'y'); if (/es$/.test(x)) out.push(x.slice(0, -2)); if (/s$/.test(x)) out.push(x.slice(0, -1)); if (/ed$/.test(x)) out.push(x.slice(0, -2), x.slice(0, -1)); if (/ing$/.test(x)) out.push(x.slice(0, -3), x.slice(0, -3) + 'e'); if (/'s$/.test(x)) out.push(x.slice(0, -2)); return [...new Set(out)].filter(Boolean); };

  /* ── từ điển của số: từ khoá bài học + từ vựng số báo (cả cụm nhiều chữ) ── */
  function vocabOf(ed) {
    if (!ed) return [];
    if (ed._tv) return ed._tv;
    const seen = new Set(), out = [];
    [...(ed.study?.words || []), ...(ed.vocab || []), ...(ed.study?.phrases || []).map(p => ({ en: p.en || p.p || '', vi: p.vi || '', ex: p.ex || '' }))].forEach(v => {
      const en = String(v.en || '').trim(); const k = en.toLowerCase();
      if (!en || !v.vi || seen.has(k) || en.split(/\s+/).length > 5) return; seen.add(k); out.push({ en, vi: v.vi, ex: v.ex || '' });
    });
    return (ed._tv = out.sort((a, b) => b.en.length - a.en.length));
  }
  // gạch chân từ khoá của số trong 1 câu tiếng Anh (khớp theo từng chữ; chữ cuối của cụm nhận cả số nhiều / chia động từ)
  function mark(text, ed) {
    const vs = vocabOf(ed); if (!vs.length) return esc(text);
    const toks = String(text).split(/(\s+)/);
    const words = toks.filter(t => t && !/^\s+$/.test(t)).map(norm);
    const taken = new Array(words.length).fill(false), at = new Map();
    for (const v of vs) {
      const vw = v.en.toLowerCase().split(/\s+/).map(norm).filter(Boolean); if (!vw.length) continue;
      for (let s0 = 0; s0 + vw.length <= words.length; s0++) {
        if (taken.slice(s0, s0 + vw.length).some(Boolean)) continue;
        const ok = vw.every((t, k) => words[s0 + k] === t || (k === vw.length - 1 && stems(words[s0 + k]).includes(t)));
        if (!ok) continue;
        for (let k = 0; k < vw.length; k++) taken[s0 + k] = true;
        at.set(s0, { e: s0 + vw.length - 1, v });
        break;
      }
    }
    let out = '', w = 0;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!t) continue;
      if (/^\s+$/.test(t)) { out += esc(t); continue; }
      const m = at.get(w);
      if (!m) { out += esc(t); w++; continue; }
      let seg = '', j = i, ww = w;
      for (; j < toks.length; j++) { const x = toks[j]; if (!x) continue; seg += x; if (!/^\s+$/.test(x)) { if (ww === m.e) break; ww++; } }
      const pm = seg.match(/^([\s\S]*?)([^A-Za-z0-9]*)$/);
      out += `<mark class="vw" data-w="${esc(m.v.en)}">${esc(pm[1])}</mark>${esc(pm[2])}`;
      w = ww + 1; i = j;
    }
    return out;
  }
  // mở 1 câu: bọc từng chữ để chạm tra được (giữ nguyên phần đã gạch chân)
  function wrapWords(span) {
    if (!span || span.dataset.w) return; span.dataset.w = '1';
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part) || !/[A-Za-z]/.test(part)) { f.appendChild(document.createTextNode(part)); return; }
            const m = part.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
            if (m[1]) f.appendChild(document.createTextNode(m[1]));
            const s = document.createElement('span'); s.className = 'w'; s.textContent = m[2]; f.appendChild(s);
            if (m[3]) f.appendChild(document.createTextNode(m[3]));
          });
          n.replaceWith(f);
        } else if (n.nodeType === 1 && !n.classList.contains('vw')) walk(n);
      });
    };
    walk(span);
  }

  /* ── thuật ngữ MMH (context/glossary.tsv, tải khi cần) ── */
  let GL = null, glP = null;
  const glossary = () => GL ? Promise.resolve(GL) : (glP = glP || fetch('context/glossary.tsv', { cache: 'force-cache' }).then(r => r.ok ? r.text() : '').then(t => {
    GL = new Map(); t.split('\n').slice(1).forEach(l => { const [en, vi] = l.split('\t'); if (en && vi && !GL.has(en.toLowerCase())) GL.set(en.toLowerCase(), vi.trim()); }); return GL;
  }).catch(() => (GL = new Map())));
  /* ── Google Dịch: nghĩa theo từ loại ── */
  const GD = new Map();
  async function gdict(w) {
    if (GD.has(w)) return GD.get(w);
    let out = null;
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&dj=1&q=${encodeURIComponent(w)}`, { signal: AbortSignal.timeout(7000) });
      if (r.ok) {
        const j = await r.json();
        const POS = { noun: 'danh từ', verb: 'động từ', adjective: 'tính từ', adverb: 'trạng từ', preposition: 'giới từ', pronoun: 'đại từ', conjunction: 'liên từ', interjection: 'thán từ', abbreviation: 'viết tắt', phrase: 'cụm từ' };
        out = { tr: (j.sentences || []).map(s => s.trans || '').join('').trim(), dict: (j.dict || []).slice(0, 3).map(d => ({ pos: POS[d.pos] || d.pos || '', terms: (d.terms || []).slice(0, 5) })) };
      }
    } catch { /* mạng */ }
    GD.set(w, out); return out;
  }

  /* ── thẻ tra nhanh ── */
  let card = null, cur = null;
  function ensureCard() {
    if (card) return card;
    card = document.createElement('div'); card.className = 'txc'; card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
    document.body.appendChild(card);
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-txc]'); if (!b) return;
      const k = b.dataset.txc;
      if (k === 'x') hide();
      if (k === 'say') say(cur.w);
      if (k === 'save') { if (save(cur)) { b.disabled = true; b.textContent = L('Đã lưu vào Sổ từ', 'Saved'); } else { b.disabled = true; b.textContent = L('Đã có trong Sổ từ', 'Already saved'); } }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    document.addEventListener('click', e => { if (card && !card.hidden && !e.target.closest('.txc,.w,.vw')) hide(); }, true);
    addEventListener('hashchange', hide);
    return card;
  }
  function hide() { if (card) card.hidden = true; document.querySelectorAll('.w.on,.vw.on').forEach(x => x.classList.remove('on')); }
  function say(w) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = 0.9;
    const v = speechSynthesis.getVoices().find(x => /en[-_]US/i.test(x.lang) && /natural|online|google|samantha|aria|jenny/i.test(x.name)) || speechSynthesis.getVoices().find(x => /en[-_]US/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function save(c) {
    const W = store.get('mmh_coach_words', []) || [];
    if (W.some(x => String(x.en).toLowerCase() === c.w.toLowerCase())) return false;
    const today = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
    W.unshift({ en: c.w, vi: c.vi || '', ex: c.ex || '', src: c.srcName || ('Podcast ' + (c.date || '')), at: Date.now(), due: today, step: 0 });
    store.set('mmh_coach_words', W);
    if (window.SHELL) SHELL.sync();
    return true;
  }
  async function lookup(el, ed) {
    ensureCard(); hide(); el.classList.add('on');
    const raw = el.dataset.w || el.textContent, w = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''); if (!w) return;
    const line = el.closest('p'), ex = line ? ((line.querySelector('.en') || line).textContent || '').trim() : '';
    const vs = vocabOf(ed), hit = vs.find(v => v.en.toLowerCase() === w.toLowerCase()) || vs.find(v => stems(w).includes(v.en.toLowerCase()));
    cur = { w: hit ? hit.en : w, vi: hit ? hit.vi : '', ex: hit?.ex || ex, date: ed?.date, srcName: ed?.srcName };
    paint(el, { loading: !hit });
    if (!hit) {
      const [gl, gd] = await Promise.all([glossary(), gdict(w)]);
      const g = stems(w).map(s => gl.get(s)).find(Boolean);
      if (cur.w !== w) return;
      cur.vi = g || (gd && gd.tr && gd.tr.toLowerCase() !== w.toLowerCase() ? gd.tr : '');
      cur.dict = gd?.dict || []; cur.src = g ? 'MMH' : 'Google';
      paint(el, {});
    }
  }
  function paint(el, o) {
    const c = cur, saved = (store.get('mmh_coach_words', []) || []).some(x => String(x.en).toLowerCase() === c.w.toLowerCase());
    card.innerHTML = `<div class="txc-h"><b lang="en">${esc(c.w)}</b><button type="button" class="txc-ic" data-txc="say" aria-label="${L('Nghe phát âm', 'Pronounce')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></button><span class="grow"></span><button type="button" class="txc-ic" data-txc="x" aria-label="${L('Đóng', 'Close')}">✕</button></div>
      ${o.loading ? `<p class="txc-vi muted">${L('Đang tra…', 'Looking up…')}</p>` : `<p class="txc-vi">${c.vi ? esc(c.vi) : L('Chưa tìm thấy nghĩa.', 'No meaning found.')}</p>`}
      ${(c.dict || []).length ? `<div class="txc-d">${c.dict.map(d => `<div><i>${esc(d.pos)}</i> ${esc(d.terms.join(', '))}</div>`).join('')}</div>` : ''}
      ${c.ex ? `<p class="txc-ex" lang="en">${esc(c.ex.length > 160 ? c.ex.slice(0, 157) + '…' : c.ex)}</p>` : ''}
      <div class="txc-f"><span class="muted">${c.src === 'Google' ? 'Google Dịch' : c.src === 'MMH' ? L('Thuật ngữ MMH', 'MMH glossary') : c.srcName ? L('Từ vựng chuyên đề', 'Deep-dive word') : L('Từ khoá của số này', 'This episode\'s keyword')}</span>
        <button type="button" class="txc-b" data-txc="save"${saved || o.loading ? ' disabled' : ''}>${saved ? L('Đã có trong Sổ từ', 'Already saved') : L('+ Lưu vào Sổ từ', '+ Save to word book')}</button></div>`;
    card.hidden = false;
    // máy tính: đặt thẻ ngay dưới từ; điện thoại: thẻ cố định ở đáy màn hình
    if (innerWidth > 760) {
      const r = el.getBoundingClientRect(), cw = 340;
      card.style.left = Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2)) + 'px';
      const below = r.bottom + 10, h = card.offsetHeight || 180;
      card.style.top = (below + h > innerHeight - 12 ? Math.max(12, r.top - h - 10) : below) + 'px';
    } else { card.style.left = ''; card.style.top = ''; }
  }

  /* ── chạm trong lời thoại ── */
  // trả true nếu đã xử lý (tra từ) ⇒ trang KHÔNG tua tới câu đó
  function onTap(e, ed) {
    const p = e.target.closest('p[data-i]'); if (!p) return false;
    const w = e.target.closest('.vw') || (p.classList.contains('open') ? e.target.closest('.w') : null);
    if (w) { e.preventDefault(); lookup(w, ed); return true; }
    const tx = p.parentElement;
    tx.querySelectorAll('p.open').forEach(x => { if (x !== p) x.classList.remove('open'); });
    p.classList.add('open'); wrapWords(p.querySelector('.en'));
    return false;
  }
  window.TX = { mark, onTap, lookup, vocabOf, hide, wrapWords };
})();
