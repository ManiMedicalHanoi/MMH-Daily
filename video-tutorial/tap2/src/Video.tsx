// @ts-nocheck
// Tập 2 · LearnDesk: nền tảng đào tạo online (Drive + Sheet + Apps Script + GitHub). Phong cách ra mắt sản phẩm, khác Tập 1.
// Một component cho 2 khổ: v = false (16:9, 1920×1080) · v = true (9:16, 1080×1920). Dựng 4K bằng --scale=2.
// Mọi mốc hình lấy theo mốc từng từ của lời đọc ElevenLabs (src/data/timeline.json) qua W(đoạn, từ).
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import TL from './data/timeline.json';

const tl: any = TL;
const C = {
  bg: '#F6F5F1', ink: '#16161B', mute: '#6C6B74', line: '#E4E1D9', card: '#FFFFFF',
  claude: '#D97757', claudeL: '#FBEDE7', gh: '#1F2328', ghGreen: '#1F883D', sheet: '#188038', sheetL: '#E6F4EA',
  gas: '#4285F4', gasL: '#E8F0FE', purple: '#8250DF', cream: '#FAF9F5',
};
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

// ---------- thời gian ----------
const cl = (x) => Math.max(0, Math.min(1, x));
const eo = (x) => 1 - Math.pow(1 - cl(x), 3);
const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const P = (t, a, d = 0.5) => eo((t - a) / d);
const SPR = (t, a, d = 0.75) => { const x = (t - a) / d; if (x <= 0) return 0; if (x >= 1) return 1; return 1 - Math.exp(-6 * x) * Math.cos(10 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[.,:?!;"“”()…]/g, '');
const W = (id, needle, nth = 0, off = 0) => {
  const s = tl.segs[id]; if (needle == null) return s.start + off;
  const n = norm(needle); let k = 0;
  for (const w of s.words) { if (norm(w.w).startsWith(n)) { if (k === nth) return w.s + off; k++; } }
  throw new Error(`Không thấy mốc "${needle}" trong đoạn ${id}`);
};
const SEG = (id) => tl.segs[id];
const ORDER = ['hook', 'four', 'arch', 'step1', 'step2', 'learner', 'lesson', 'quiz', 'cert', 'video', 'uses', 'ep3'];
const SB: any = {};
ORDER.forEach((id, i) => { SB[id] = [i === 0 ? 0 : SEG(id).start - 0.45, i < ORDER.length - 1 ? SEG(ORDER[i + 1]).start - 0.45 : tl.endcard]; });
SB.end = [tl.endcard, tl.total + 1];

const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };

// ---------- khối dùng chung ----------
const abs = (x, y, w?, h?) => ({ position: 'absolute', left: x, top: y, width: w, height: h });

const In = ({ t, at, d = 0.55, y = 26, x = 0, s = 0.96, out = undefined, style = {}, children }) => {
  const k = P(t, at, d); let o = k;
  if (out !== undefined) o *= 1 - P(t, out, 0.35);
  if (o <= 0.001) return null;
  return <div style={{ ...style, opacity: o, transform: `translate(${(1 - k) * x}px, ${(1 - k) * y}px) scale(${s + (1 - s) * k})` }}>{children}</div>;
};
const Pop = ({ t, at, style = {}, children }) => {
  const k = SPR(t, at, 0.7); if (k <= 0.001) return null;
  return <div style={{ ...style, opacity: cl(k * 2), transform: `scale(${0.6 + 0.4 * k})` }}>{children}</div>;
};

const Scene = ({ t, id, enter = 'rise', children }) => {
  const [from, to] = SB[id];
  if (t < from - 0.02 || t > to + 0.5) return null;
  const a = id === 'hook' ? 1 : P(t, from, 0.55); const b = P(t, to, 0.45);
  const o = a * (1 - b); if (o <= 0.001) return null;
  let tr = '';
  if (enter === 'rise') tr = `translateY(${(1 - a) * 60}px)`;
  if (enter === 'zoom') tr = `scale(${0.92 + 0.08 * a})`;
  if (enter === 'left') tr = `translateX(${(1 - a) * 120}px)`;
  if (enter === 'right') tr = `translateX(${(a - 1) * 120}px)`;
  tr += ` scale(${1 - b * 0.04})`;
  const blur = (enter === 'focus' ? (1 - a) * 14 : 0) + b * 6;
  return <AbsoluteFill style={{ opacity: o, transform: tr, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>;
};

const Bg = ({ t }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 12% 8%, rgba(217,119,87,.17), transparent 38%), radial-gradient(circle at 92% 88%, rgba(24,128,56,.12), transparent 42%), radial-gradient(circle at 88% 10%, rgba(66,133,244,.09), transparent 36%)' }} />
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(22,22,27,.075) 1.3px, transparent 1.4px)', backgroundSize: '34px 34px', backgroundPosition: `${t * 5}px ${t * 2.5}px` }} />
  </AbsoluteFill>
);

// ---------- biểu tượng ----------
const ClaudeMark = ({ s = 80, color = C.claude, spin = 0 }) => {
  const rays = [[0, 1], [29, 0.8], [58, 0.95], [88, 0.76], [118, 1], [149, 0.84], [180, 0.97], [209, 0.79], [239, 1], [268, 0.83], [299, 0.94], [329, 0.78]];
  return (
    <svg width={s} height={s} viewBox="-50 -50 100 100" style={{ transform: `rotate(${spin}deg)`, display: 'block' }}>
      {rays.map(([a, l], i) => { const r = (a * Math.PI) / 180; return <line key={i} x1={0} y1={0} x2={Math.cos(r) * 44 * l} y2={Math.sin(r) * 44 * l} stroke={color} strokeWidth={8.5} strokeLinecap="round" />; })}
    </svg>
  );
};
const ElMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="24" fill="#000" /><rect x="35" y="24" width="9" height="52" rx="2" fill="#fff" /><rect x="56" y="24" width="9" height="52" rx="2" fill="#fff" /></svg>);
const ActionsMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="24" fill="#2088FF" /><circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeWidth="7" /><path d="M44 38 L62 50 L44 62Z" fill="#fff" /></svg>);
const ClockMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="24" fill="#16161B" /><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeWidth="6" /><line x1="50" y1="50" x2="50" y2="28" stroke={C.claude} strokeWidth="6" strokeLinecap="round" /><line x1="50" y1="50" x2="36" y2="58" stroke="#fff" strokeWidth="6" strokeLinecap="round" /></svg>);
const NewsMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="24" fill="#FFF4E5" /><rect x="22" y="24" width="56" height="52" rx="6" fill="#fff" stroke="#E0A458" strokeWidth="4" /><rect x="30" y="33" width="40" height="7" rx="2" fill="#E0A458" /><rect x="30" y="46" width="18" height="18" rx="2" fill="#F3C98B" /><rect x="52" y="46" width="18" height="4" rx="2" fill="#E0A458" /><rect x="52" y="54" width="18" height="4" rx="2" fill="#E0A458" /><rect x="52" y="62" width="12" height="4" rx="2" fill="#E0A458" /></svg>);
const RankMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="24" fill="#EEF2FF" /><rect x="24" y="56" width="12" height="20" rx="3" fill="#8DA2FB" /><rect x="44" y="40" width="12" height="36" rx="3" fill="#6366F1" /><rect x="64" y="26" width="12" height="50" rx="3" fill="#4338CA" /></svg>);
const ServerMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect x="22" y="20" width="56" height="24" rx="5" fill="none" stroke="#16161B" strokeWidth="6" /><rect x="22" y="54" width="56" height="24" rx="5" fill="none" stroke="#16161B" strokeWidth="6" /><circle cx="34" cy="32" r="4" fill="#16161B" /><circle cx="34" cy="66" r="4" fill="#16161B" /><line x1="12" y1="88" x2="88" y2="10" stroke="#D93025" strokeWidth="8" strokeLinecap="round" /></svg>);
const Lock = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block' }}><rect x="5" y="10" width="14" height="10" rx="2" fill="#8A8892" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8A8892" strokeWidth="2.4" /></svg>);
const Check = ({ s = 22, color = '#fff', bg = C.ghGreen }) => (<svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block' }}><circle cx="12" cy="12" r="12" fill={bg} /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);

const Logo = ({ k, s }) => {
  if (k === 'drive') return <Img src={staticFile('media/google-drive.svg')} style={{ width: s, height: s * 0.895, display: 'block' }} />;
  if (k === 'ld') return <LdMark s={s} />;
  if (k === 'remotion') return <RemotionMark s={s} />;
  if (k === 'claude') return <ClaudeMark s={s} />;
  if (k === 'github' || k === 'pages') return <Img src={staticFile('media/github-icon.svg')} style={{ width: s, height: s * 0.976, display: 'block' }} />;
  if (k === 'sheets') return <Img src={staticFile('media/google-sheets.svg')} style={{ width: s * 0.727, height: s, display: 'block' }} />;
  if (k === 'gas') return <Img src={staticFile('media/apps-script.svg')} style={{ width: s, height: s, display: 'block' }} />;
  if (k === 'el') return <ElMark s={s} />;
  if (k === 'actions') return <ActionsMark s={s} />;
  if (k === 'clock') return <ClockMark s={s} />;
  if (k === 'news') return <NewsMark s={s} />;
  if (k === 'rank') return <RankMark s={s} />;
  if (k === 'dailycast') return <Img src={staticFile('media/dailycast.svg')} style={{ width: s, height: s, display: 'block' }} />;
  return null;
};
const Tile = ({ k, s = 110, ring = null, style = {} }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.26, background: '#fff', border: `${Math.max(1, s * 0.012)}px solid ${ring || C.line}`, boxShadow: '0 10px 30px rgba(22,22,27,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <Logo k={k} s={s * 0.58} />
  </div>
);

// cửa sổ trình duyệt
const Win = ({ box, url, children, bg = '#fff' }) => (
  <div style={{ ...abs(box.x, box.y, box.w, box.h), background: bg, borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 40px 90px rgba(22,22,27,.16), 0 3px 8px rgba(22,22,27,.06)' }}>
    <div style={{ height: 52, background: '#F0EEE8', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9, borderBottom: `1px solid ${C.line}` }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
      <div style={{ marginLeft: 16, flex: 1, maxWidth: 760, height: 32, background: '#fff', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 18, color: C.mute }}><Lock />{url}</div>
    </div>
    <div style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, background: bg }}>{children}</div>
  </div>
);

// điện thoại
const Phone = ({ x, y, w, children }) => {
  const h = w * 2.1, pad = w * 0.035;
  return (
    <div style={{ ...abs(x, y, w, h), borderRadius: w * 0.15, background: '#101014', padding: pad, boxShadow: '0 50px 100px rgba(10,10,20,.30), 0 0 0 2px #2A2A31 inset' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.12, overflow: 'hidden', background: '#fff' }}>
        {children}
        <div style={{ position: 'absolute', top: w * 0.022, left: '50%', width: w * 0.27, height: w * 0.075, marginLeft: -w * 0.135, borderRadius: 99, background: '#101014' }} />
      </div>
    </div>
  );
};
const Shot = ({ src, y = 0, o = 1 }) => (<Img src={staticFile(`media/${src}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', transform: `translateY(${y}px)`, opacity: o }} />);

// con trỏ chuột: keys [{t, x, y, c (click), d (thời gian di chuyển)}]
const Cursor = ({ t, keys, s = 1 }) => {
  if (!keys.length || t < keys[0].t - 0.4) return null;
  let x = keys[0].x, y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i], d = b.d || 0.5;
    if (t >= b.t) { x = b.x; y = b.y; continue; }
    if (t > b.t - d) { const k = eio((t - (b.t - d)) / d); x = lerp(x, b.x, k); y = lerp(y, b.y, k); }
    break;
  }
  const clk = keys.find((k) => k.c && t >= k.t && t < k.t + 0.5);
  const press = keys.some((k) => k.c && t >= k.t - 0.06 && t < k.t + 0.14);
  const o = P(t, keys[0].t - 0.4, 0.3);
  return (
    <>
      {clk && <div style={{ ...abs(x - 40 * s, y - 40 * s, 80 * s, 80 * s), borderRadius: 99, border: `${4 * s}px solid ${C.claude}`, opacity: 1 - (t - clk.t) / 0.5, transform: `scale(${0.3 + (t - clk.t) * 2})` }} />}
      <svg width={36 * s} height={36 * s} viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 6 * s, top: y - 3 * s, opacity: o, transform: `scale(${press ? 0.86 : 1})`, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.3))' }}>
        <path d="M5 2 L5 19 L9.5 15 L12.5 22 L15.5 20.6 L12.6 13.8 L18.5 13.6 Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </>
  );
};
const Tap = ({ t, at, x, y, s = 1 }) => {
  if (t < at || t > at + 0.55) return null;
  const k = (t - at) / 0.55;
  return <div style={{ ...abs(x - 34 * s, y - 34 * s, 68 * s, 68 * s), borderRadius: 99, background: 'rgba(22,22,27,.18)', border: `${3 * s}px solid rgba(255,255,255,.9)`, opacity: 1 - k, transform: `scale(${0.5 + k * 0.9})` }} />;
};
const Caret = ({ t, h = 36, color = C.claude }) => <span style={{ display: 'inline-block', width: 3, height: h, background: color, marginLeft: 3, verticalAlign: 'middle', opacity: Math.floor(t * 2.4) % 2 ? 0.15 : 1 }} />;
const typed = (text, t, at, cps = 22) => text.slice(0, Math.max(0, Math.floor((t - at) * cps)));

// tô màu code đơn giản
const TOK = /('[^']*'?|"[^"]*"?|\/\/.*$|#.*$|\b(?:const|let|function|return|new|async|await|for|of)\b|\b[A-Za-z_]\w*(?=\()|^\s*[a-z-]+(?=:))/g;
const PAL = {
  dark: { base: '#E4E4EA', kw: '#C792EA', str: '#C3E88D', fn: '#82AAFF', com: '#7D8794', key: '#F78C6C', ln: '#5B5F6B' },
  light: { base: '#1F1F1F', kw: '#AF00DB', str: '#A31515', fn: '#795E26', com: '#008000', key: '#0451A5', ln: '#9A9A9A' },
};
const colorize = (s, p) => {
  const out = []; let last = 0; let m; TOK.lastIndex = 0;
  while ((m = TOK.exec(s))) {
    if (m.index > last) out.push(<span key={last}>{s.slice(last, m.index)}</span>);
    const v = m[0];
    const c = v.startsWith("'") || v.startsWith('"') ? p.str : v.startsWith('//') || v.startsWith('#') ? p.com : /^(const|let|function|return|new|async|await|for|of)$/.test(v) ? p.kw : /^\s*[a-z-]+$/.test(v) && s[m.index + v.length] === ':' ? p.key : p.fn;
    out.push(<span key={m.index} style={{ color: c }}>{v}</span>);
    last = m.index + v.length; if (v.length === 0) TOK.lastIndex++;
  }
  if (last < s.length) out.push(<span key={last}>{s.slice(last)}</span>);
  return out;
};
// mode 'type' (gõ dần) hoặc 'paste' (dán: từng dòng hiện nhanh)
const Code = ({ lines, t, at, mode = 'type', cps = 140, fs = 20, theme = 'dark', caret = true }) => {
  const p = PAL[theme]; let budget = (t - at) * cps; let caretAt = -1;
  const rows = lines.map((ln, i) => {
    let shown = null;
    if (mode === 'type') { if (budget > 0) { const n = Math.min(ln.length, Math.floor(budget)); shown = ln.slice(0, n); if (n < ln.length || i === lines.length - 1) caretAt = caretAt < 0 ? i : caretAt; } budget -= ln.length + 3; }
    else shown = t >= at + i * 0.045 ? ln : null;
    return { shown, i };
  });
  const flash = mode === 'paste' ? 1 - P(t, at + 0.3, 0.9) : 0;
  return (
    <div style={{ fontFamily: MONO, fontSize: fs, lineHeight: 1.6, color: p.base, whiteSpace: 'pre' }}>
      {rows.filter(({ shown }) => shown !== null).map(({ shown, i }) => (
        <div key={i} style={{ display: 'flex', background: shown !== null && flash > 0 ? `rgba(66,133,244,${0.13 * flash})` : 'transparent' }}>
          <span style={{ width: fs * 2.2, color: p.ln, textAlign: 'right', paddingRight: fs * 0.9, flexShrink: 0 }}>{i + 1}</span>
          <span>{shown === null ? '' : colorize(shown, p)}{caret && mode === 'type' && i === caretAt && t < at + 30 ? <Caret t={t} h={fs * 1.1} color={theme === 'dark' ? '#fff' : '#111'} /> : null}</span>
        </div>
      ))}
    </div>
  );
};

// ---------- khung "Bước n" ----------
const StepFrame = ({ t, v, id, n, title, logos, items, url, children }) => {
  const [from] = SB[id];
  const box = v ? { x: 50, y: 400, w: 980, h: 960 } : { x: 620, y: 140, w: 1210, h: 830 };
  const cur = items.reduce((a, it, i) => (t >= it[1] - 0.15 ? i : a), -1);
  return (
    <>
      {v ? (
        <div style={{ ...abs(60, 215, 960, 150), display: 'flex', alignItems: 'center', gap: 28 }}>
          <Pop t={t} at={from + 0.15}><div style={{ width: 112, height: 112, borderRadius: 30, background: C.ink, color: '#fff', fontSize: 64, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div></Pop>
          <In t={t} at={from + 0.3} x={-30} y={0}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.claude }}>BƯỚC {n}</div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>{title}</div>
          </In>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>{logos.map((k, i) => <Pop key={k} t={t} at={from + 0.45 + i * 0.12}><Tile k={k} s={84} /></Pop>)}</div>
        </div>
      ) : (
        <div style={{ ...abs(110, 170, 450, 800) }}>
          <Pop t={t} at={from + 0.15}><div style={{ width: 120, height: 120, borderRadius: 32, background: C.ink, color: '#fff', fontSize: 70, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div></Pop>
          <In t={t} at={from + 0.3} x={-30} y={0} style={{ marginTop: 30 }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, color: C.claude }}>BƯỚC {n}</div>
            <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.08, marginTop: 6 }}>{title}</div>
          </In>
          <div style={{ display: 'flex', gap: 14, marginTop: 26 }}>{logos.map((k, i) => <Pop key={k} t={t} at={from + 0.45 + i * 0.12}><Tile k={k} s={78} /></Pop>)}</div>
          <div style={{ marginTop: 40 }}>
            {items.map(([lab, at], i) => {
              const done = i < cur, on = i === cur, k = P(t, at - 0.15, 0.4);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, height: 66, opacity: 0.35 + 0.65 * k, transform: `translateX(${on ? 8 : 0}px)` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 17, border: `3px solid ${done || on ? C.claude : '#C9C6BE'}`, background: done ? C.claude : on ? C.claudeL : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800 }}>{done ? '✓' : ''}</div>
                  <div style={{ fontSize: 28, fontWeight: on ? 700 : 500, color: on ? C.ink : C.mute }}>{lab}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <In t={t} at={from + 0.2} y={40} s={0.98}><Win box={box} url={url}>{children(box.w, box.h - 52)}</Win></In>
    </>
  );
};

// ================= CẢNH =================
const Hook = ({ t, v }) => {
  const c = { pod: W('hook', 'podcast'), gom: W('hook', 'sáng'), doc: W('hook', 'nghe'), lt: W('hook', 'lập'), mc: W('hook', 'máy'), dong: W('hook', 'đồng'), hai: W('hook', 'Chỉ') };
  const ph = v ? { x: 355, y: 455, w: 370 } : { x: 1230, y: 92, w: 425 };
  const sw = ph.w * 0.93, sh = ph.w * 2.1 - ph.w * 0.07;
  const cx = ph.x + ph.w / 2, cy = ph.y + ph.w * 1.05;
  const news = ['VnExpress', 'Tuổi Trẻ', 'VTV', 'Reuters', 'Lao Động', 'Nikkei Asia', 'Bloomberg'];
  const zeros = [['0', 'lập trình viên', c.lt], ['0', 'máy chủ riêng', c.mc], ['≈0', 'đồng chi phí', c.dong]];
  const zpos = v ? [[40, 640], [745, 830], [40, 1020]] : [[120, 600], [430, 600], [740, 600]];
  const av = v ? 128 : 124, fl = Math.sin(t * 1.6) * 4;
  return (
    <>
      <div style={{ ...abs(v ? (1080 - av) / 2 : 120, (v ? 30 : 104) + fl, av, av) }}>
        <Pop t={t} at={0.15}>
          <div style={{ width: av, height: av, borderRadius: av, background: 'linear-gradient(150deg, #FBE3D8, #F4B9A0)', border: '5px solid #fff', boxShadow: '0 14px 34px rgba(217,119,87,.30)', overflow: 'hidden', boxSizing: 'border-box' }}>
            <Img src={staticFile('media/me.png')} style={{ width: '112%', height: '112%', marginLeft: '-6%', marginTop: '2%', objectFit: 'cover' }} />
          </div>
        </Pop>
      </div>
      <div style={{ ...abs(v ? 40 : 120, v ? 185 : 250, v ? 1000 : 1000), textAlign: v ? 'center' : 'left' }}>
        <In t={t} at={0.25}><div style={{ fontSize: v ? 25 : 24, letterSpacing: 4, fontWeight: 700, color: C.claude }}>TẬP 1 · CLAUDE CODE · GITHUB · ELEVENLABS</div></In>
        <In t={t} at={c.pod - 0.3}><div style={{ fontSize: v ? 80 : 100, fontWeight: 800, lineHeight: 1.04, marginTop: 16, letterSpacing: -2.5 }}>Một app podcast</div></In>
        <In t={t} at={c.gom - 0.15}><div style={{ fontSize: v ? 80 : 100, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5 }}><span style={{ color: C.claude }}>tự đọc báo</span> mỗi sáng</div></In>
      </div>
      <In t={t} at={0.1} y={80} s={0.94}>
        <Phone x={ph.x} y={ph.y} w={ph.w}>
          <Shot src="m_front" o={1 - P(t, c.doc - 0.1, 0.4)} />
          <Shot src="m_listen" o={P(t, c.doc - 0.1, 0.4)} />
          {t > c.doc && <div style={{ ...abs(sw * 0.168 - 40, sh * 0.857 - 40, 80, 80), borderRadius: 99, border: '4px solid rgba(160,110,220,.8)', transform: `scale(${1 + ((t - c.doc) % 1.2) * 0.7})`, opacity: 1 - ((t - c.doc) % 1.2) / 1.2 }} />}
        </Phone>
      </In>
      {news.map((n, i) => {
        const a = c.gom + i * 0.17, k = (t - a) / 1.0;
        if (k <= 0 || k >= 1) return null;
        const ang = (v ? -160 + i * 50 : -120 + i * 38) * (Math.PI / 180), R = v ? 560 : 640;
        const sx = cx + Math.cos(ang) * R * (v ? 0.9 : 1), sy = cy + Math.sin(ang) * R * (v ? 0.75 : 0.62);
        const e = eio(k);
        return <div key={n} style={{ ...abs(lerp(sx, cx, e) - 90, lerp(sy, cy, e) - 28), padding: '12px 22px', background: '#fff', borderRadius: 14, boxShadow: '0 10px 26px rgba(22,22,27,.14)', fontSize: v ? 28 : 26, fontWeight: 700, whiteSpace: 'nowrap', opacity: Math.min(1, k * 5) * (1 - Math.max(0, (k - 0.75) * 4)), transform: `scale(${1 - e * 0.5})` }}>{n}</div>;
      })}
      {zeros.map(([b, l, at], i) => (
        <div key={l} style={{ ...abs(zpos[i][0], zpos[i][1]) }}>
          <Pop t={t} at={at - 0.1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 22, padding: v ? '14px 24px' : '16px 24px', boxShadow: '0 14px 34px rgba(22,22,27,.12)' }}>
              <div style={{ fontSize: v ? 58 : 58, fontWeight: 800, color: C.claude, letterSpacing: -2 }}>{b}</div>
              <div style={{ fontSize: v ? 26 : 25, fontWeight: 600, lineHeight: 1.15, width: v ? 150 : 150 }}>{l}</div>
            </div>
          </Pop>
        </div>
      ))}
      <div style={{ ...abs(v ? 0 : 120, v ? 1268 : 790, v ? 1080 : 1000), display: 'flex', alignItems: 'center', justifyContent: v ? 'center' : 'flex-start', gap: 18 }}>
        {['claude', 'github', 'el'].map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 && <In t={t} at={c.hai + 0.1 + i * 0.12}><div style={{ fontSize: 44, fontWeight: 300, color: C.mute }}>+</div></In>}
            <Pop t={t} at={c.hai + i * 0.12}><Tile k={k} s={v ? 104 : 100} /></Pop>
          </React.Fragment>
        ))}
        <In t={t} at={c.hai + 0.5} x={-20} y={0}><div style={{ fontSize: v ? 30 : 32, fontWeight: 700, marginLeft: 14, lineHeight: 1.2 }}>2 phút<br /><span style={{ color: C.mute, fontWeight: 500 }}>để biết cách làm</span></div></In>
      </div>
    </>
  );
};

const Trio = ({ t, v }) => {
  const c = { ba: W('trio', 'ba'), cc: W('trio', 'Claude'), gh: W('trio', 'GitHub'), kho: W('trio', 'nơi'), td: W('trio', 'tự'), web: W('trio', 'web'), el: W('trio', 'ElevenLabs'), bien: W('trio', 'biến') };
  const cards = [
    { k: 'claude', name: 'Claude Code', role: 'Người viết code', at: c.cc, col: C.claude, chips: [['Bạn ra lệnh, Claude viết', c.cc + 0.8]] },
    { k: 'github', name: 'GitHub', role: 'Kho chứa + máy chạy + web', at: c.gh, col: C.gh, chips: [['Repository · kho code', c.kho], ['Actions · chạy tự động', c.td], ['Pages · web miễn phí', c.web]] },
    { k: 'el', name: 'ElevenLabs', role: 'Giọng đọc như người thật', at: c.el, col: '#111111', chips: [['API · chữ thành giọng nói', c.bien + 0.4]] },
  ];
  const act = cards.reduce((a, cd, i) => (t >= cd.at - 0.1 ? i : a), -1);
  const cw = v ? 960 : 500, chh = v ? 300 : 560;
  return (
    <>
      <In t={t} at={c.ba - 0.3}><div style={{ ...abs(0, v ? 225 : 150, v ? 1080 : 1920), textAlign: 'center', fontSize: v ? 58 : 60, fontWeight: 800, letterSpacing: -1.5 }}>Công thức <span style={{ color: C.claude }}>3 mảnh ghép</span></div></In>
      {cards.map((cd, i) => {
        const x = v ? 60 : 150 + i * 560, y = v ? 340 + i * 340 : 270;
        const on = i === act;
        return (
          <React.Fragment key={cd.k}>
            {!v && i > 0 && <In t={t} at={cd.at - 0.2}><div style={{ ...abs(x - 52, y + chh / 2 - 40, 44), textAlign: 'center', fontSize: 64, fontWeight: 300, color: C.mute }}>+</div></In>}
            <In t={t} at={cd.at - 0.25} y={50} style={{ ...abs(x, y, cw, chh) }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 30, background: '#fff', border: `${on ? 3 : 1.5}px solid ${on ? cd.col : C.line}`, boxShadow: on ? `0 30px 70px rgba(22,22,27,.16)` : '0 12px 30px rgba(22,22,27,.07)', padding: v ? 34 : 40, boxSizing: 'border-box', display: 'flex', flexDirection: v ? 'row' : 'column', gap: v ? 34 : 24, alignItems: v ? 'center' : 'flex-start', transform: `translateY(${on ? -8 : 0}px)` }}>
                <Tile k={cd.k} s={v ? 150 : 140} ring={on ? cd.col : null} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: v ? 48 : 46, fontWeight: 800, letterSpacing: -1 }}>{cd.name}</div>
                  <div style={{ fontSize: v ? 28 : 28, color: C.mute, marginTop: 4, fontWeight: 500 }}>{cd.role}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: v ? 'row' : 'column', gap: 10, marginTop: v ? 16 : 26 }}>
                    {cd.chips.map(([lab, at]) => (
                      <Pop key={lab} t={t} at={at}><div style={{ padding: v ? '8px 16px' : '10px 18px', borderRadius: 12, background: i === 0 ? C.claudeL : i === 1 ? '#EEF0F3' : '#EFEFEF', fontSize: v ? 24 : 24, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap' }}>{lab}</div></Pop>
                    ))}
                  </div>
                </div>
              </div>
            </In>
          </React.Fragment>
        );
      })}
    </>
  );
};

const Arch = ({ t, v }) => {
  const c = { vay: W('arch', 'Vậy'), hai: W('arch', 'hai'), nhin: W('arch', 'nhìn'), ngam: W('arch', 'ngầm'), may: W('arch', 'máy'), bat: W('arch', 'bật'), doc: W('arch', 'đọc'), cl: W('arch', 'Claude'), el: W('arch', 'ElevenLabs'), cap: W('arch', 'cập'), kc: W('arch', 'Không') };
  const steps = [
    { k: 'news', t: 'Đọc tin', s: 'từ các trang báo', at: c.doc },
    { k: 'claude', t: 'Claude viết', s: 'tóm tắt + kịch bản', at: c.cl },
    { k: 'el', t: 'ElevenLabs', s: 'đọc thành giọng', at: c.el },
    { k: 'pages', t: 'Cập nhật', s: 'trang web', at: c.cap },
  ];
  const act = steps.reduce((a, s, i) => (t >= s.at - 0.1 ? i : a), -1);
  let pi = 0; for (let i = 0; i < 3; i++) { if (t >= steps[i + 1].at - 0.1) pi = i + 1; else if (t > steps[i].at) { pi = i + eio((t - steps[i].at) / Math.max(0.3, steps[i + 1].at - 0.1 - steps[i].at)); break; } else break; }
  const back = t > c.cap + 0.2; const pulse = back ? Math.max(0, Math.sin((t - c.cap - 0.2) * 5)) * (1 - P(t, c.cap + 1.6, 0.6)) : 0;
  const L = v ? { x: 60, y: 315, w: 960, h: 230 } : { x: 110, y: 290, w: 520, h: 480 };
  const Rb = v ? { x: 60, y: 600, w: 960, h: 660 } : { x: 700, y: 290, w: 1110, h: 480 };
  const card = (on, col) => ({ width: '100%', height: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 30, border: `2.5px solid ${on ? col : C.line}`, boxShadow: on ? '0 26px 60px rgba(22,22,27,.12)' : '0 10px 26px rgba(22,22,27,.06)' });
  return (
    <>
      <In t={t} at={c.vay - 0.3}><div style={{ ...abs(0, v ? 215 : 145, v ? 1080 : 1920), textAlign: 'center', fontSize: v ? 54 : 60, fontWeight: 800, letterSpacing: -1.4 }}>Vậy app <span style={{ color: C.claude }}>chạy thế nào?</span></div></In>
      <In t={t} at={c.nhin - 0.2} y={40} style={{ ...abs(L.x, L.y, L.w, L.h) }}>
        <div style={{ ...card(true, C.gh), padding: v ? '26px 34px' : 40, display: 'flex', flexDirection: v ? 'row' : 'column', alignItems: v ? 'center' : 'flex-start', gap: v ? 30 : 20, boxShadow: pulse > 0 ? `0 0 0 ${12 * pulse}px rgba(217,119,87,.25), 0 26px 60px rgba(22,22,27,.12)` : undefined }}>
          <Tile k="pages" s={v ? 130 : 120} />
          <div>
            <div style={{ fontSize: v ? 22 : 20, fontWeight: 700, letterSpacing: 3, color: C.gh }}>PHẦN NHÌN THẤY</div>
            <div style={{ fontSize: v ? 44 : 46, fontWeight: 800, letterSpacing: -1 }}>Trang web</div>
            <div style={{ fontSize: v ? 27 : 27, color: C.mute }}>GitHub Pages · miễn phí</div>
            {!v && <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 20, background: '#F3F2EE', borderRadius: 10, padding: '8px 14px', display: 'inline-block' }}>index.html · app.js · today.mp3</div>}
            {back && <div style={{ marginTop: v ? 10 : 22, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: '#E6F4EA', color: C.sheet, fontSize: v ? 24 : 24, fontWeight: 700, opacity: P(t, c.cap + 0.2, 0.3) }}><Check s={24} bg={C.sheet} />Số mới đã lên</div>}
          </div>
        </div>
      </In>
      <In t={t} at={c.ngam - 0.2} y={40} style={{ ...abs(Rb.x, Rb.y, Rb.w, Rb.h) }}>
        <div style={{ ...card(true, '#2088FF'), padding: v ? '30px 34px' : '36px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Tile k="actions" s={v ? 110 : 104} />
            <div>
              <div style={{ fontSize: v ? 22 : 20, fontWeight: 700, letterSpacing: 3, color: '#2088FF' }}>PHẦN CHẠY NGẦM</div>
              <div style={{ fontSize: v ? 42 : 42, fontWeight: 800, letterSpacing: -1 }}>GitHub Actions</div>
              <In t={t} at={c.may - 0.1} x={-16} y={0}><div style={{ fontSize: v ? 26 : 26, color: C.mute }}>Máy tính của GitHub, <b style={{ color: C.ink, opacity: P(t, c.bat - 0.1, 0.3) }}>mỗi sáng tự bật</b></div></In>
            </div>
          </div>
          {v ? (
            <div style={{ position: 'relative', marginTop: 34 }}>
              <div style={{ ...abs(46, 46, 6, 112 * 3), background: '#E2DED5', borderRadius: 3, opacity: P(t, c.doc - 0.25, 0.4) }} />
              {act >= 0 && <div style={{ ...abs(46, 46, 6, 112 * pi), background: C.claude, borderRadius: 3 }} />}
              {steps.map((s, i) => (
                <In key={i} t={t} at={s.at - 0.25} x={-20} y={0} style={{ ...abs(0, i * 112, 880, 96) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 26, height: 96 }}>
                    <Tile k={s.k} s={96} ring={i === act ? C.claude : null} />
                    <div><div style={{ fontSize: 36, fontWeight: 800, color: i <= act ? C.ink : C.mute }}>{s.t}</div><div style={{ fontSize: 26, color: C.mute }}>{s.s}</div></div>
                    {i < act && <div style={{ marginLeft: 'auto' }}><Check s={34} bg={C.sheet} /></div>}
                  </div>
                </In>
              ))}
            </div>
          ) : (
            <div style={{ position: 'relative', marginTop: 50, height: 260 }}>
              <div style={{ ...abs(120, 56, 3 * 250, 6), background: '#E2DED5', borderRadius: 3, opacity: P(t, c.doc - 0.25, 0.4) }} />
              {act >= 0 && <div style={{ ...abs(120, 56, 250 * pi, 6), background: C.claude, borderRadius: 3 }} />}
              {act >= 0 && <div style={{ ...abs(120 + 250 * pi - 14, 45, 28, 28), borderRadius: 14, background: C.claude, boxShadow: '0 0 0 10px rgba(217,119,87,.22)' }} />}
              {steps.map((s, i) => (
                <In key={i} t={t} at={s.at - 0.25} y={24} style={{ ...abs(i * 250, 0, 240) }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ transform: `scale(${i === act ? 1.1 : 1})` }}><Tile k={s.k} s={112} ring={i === act ? C.claude : null} /></div>
                    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 16, color: i <= act ? C.ink : C.mute }}>{s.t}</div>
                    <div style={{ fontSize: 22, color: C.mute }}>{s.s}</div>
                  </div>
                </In>
              ))}
            </div>
          )}
        </div>
      </In>
      {!v && back && (
        <div style={{ ...abs(640, 528, 60, 6), background: `repeating-linear-gradient(90deg, ${C.claude} 0 10px, transparent 10px 16px)`, opacity: P(t, c.cap + 0.2, 0.3) }} />
      )}
      <div style={{ ...abs(0, v ? 1325 : 880, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}>
        <Pop t={t} at={c.kc}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 30px 14px 20px', background: '#fff', borderRadius: 999, border: `2px solid ${C.ink}`, boxShadow: '0 16px 36px rgba(22,22,27,.14)' }}>
            <ServerMark s={64} /><div style={{ fontSize: 34, fontWeight: 800 }}>Không cần máy chủ riêng</div>
          </div>
        </Pop>
      </div>
    </>
  );
};

const GhBar = ({ text }) => (
  <div style={{ height: 64, background: C.gh, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 16 }}>
    <Img src={staticFile('media/github-icon.svg')} style={{ width: 36, height: 36, filter: 'invert(1)' }} />
    <div style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>{text}</div>
  </div>
);

const Step1 = ({ t, v }) => {
  const c = { tao: W('step1', 'tạo'), kho: W('step1', 'kho'), dat: W('step1', 'đặt'), bat: W('step1', 'bật'), pages: W('step1', 'Pages') };
  const items = [['Tạo repository mới', c.tao], ['Đặt tên: dailycast', c.dat], ['Bật GitHub Pages', c.bat]];
  const B = c.bat - 0.1;
  return (
    <StepFrame t={t} v={v} id="step1" n={1} title="Tạo kho GitHub" logos={['github']} items={items} url={t < B ? 'github.com/new' : 'github.com/you/dailycast/settings/pages'}>
      {(CW, CH) => {
        const px = v ? 44 : 70, fs = v ? 1.12 : 1;
        if (t < B) {
          const name = typed('dailycast', t, c.dat - 0.05, 14);
          return (
            <>
              <GhBar text="GitHub" />
              <div style={{ ...abs(px, 100), fontSize: 38 * fs, fontWeight: 700 }}>Create a new repository</div>
              <div style={{ ...abs(px, 156, CW - px * 2), fontSize: 21 * fs, color: C.mute }}>A repository contains all project files, including the revision history.</div>
              <div style={{ ...abs(px, 236), fontSize: 22 * fs, fontWeight: 600 }}>Owner &nbsp;/&nbsp; Repository name *</div>
              <div style={{ ...abs(px, 276, 170, 60), border: '1.5px solid #D0D7DE', borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 24 * fs, background: '#F6F8FA' }}>you ▾</div>
              <div style={{ ...abs(px + 188, 284), fontSize: 30, color: C.mute }}>/</div>
              <div style={{ ...abs(px + 214, 276, v ? CW - px * 2 - 214 : 470, 60), border: `2px solid ${t > c.dat - 0.2 ? '#0969DA' : '#D0D7DE'}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 26 * fs, fontFamily: MONO, boxShadow: t > c.dat - 0.2 ? '0 0 0 4px rgba(9,105,218,.15)' : 'none' }}>{name}{t > c.dat - 0.2 && <Caret t={t} h={30} color="#0969DA" />}</div>
              <In t={t} at={c.dat + 0.75} y={8}><div style={{ ...abs(px, 352), display: 'flex', gap: 10, alignItems: 'center', fontSize: 21 * fs, color: C.ghGreen, fontWeight: 600 }}><Check s={24} /> dailycast is available.</div></In>
              {[['Public', 'Anyone on the internet can see this repository.', true], ['Private', 'You choose who can see and commit.', false]].map(([a, b, on], i) => (
                <div key={a} style={{ ...abs(px, 420 + i * 72, CW - px * 2), display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${on ? '#0969DA' : '#8C959F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <div style={{ width: 14, height: 14, borderRadius: 7, background: '#0969DA' }} />}</div>
                  <div><div style={{ fontSize: 23 * fs, fontWeight: 600 }}>{a}</div><div style={{ fontSize: 19 * fs, color: C.mute }}>{b}</div></div>
                </div>
              ))}
              <div style={{ ...abs(px, 600, 280 * fs, 64), borderRadius: 12, background: C.ghGreen, color: '#fff', fontSize: 23 * fs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t > c.bat - 0.42 && t < c.bat - 0.3 ? 0.95 : 1})` }}>Create repository</div>
              <Cursor t={t} s={fs} keys={[{ t: c.tao, x: CW * 0.75, y: CH * 0.8 }, { t: c.dat - 0.25, x: px + 330, y: 306, c: 1 }, { t: c.bat - 0.4, x: px + 150 * fs, y: 632, c: 1, d: 0.55 }]} />
            </>
          );
        }
        const mx = v ? 44 : 340, open = t > c.bat + 0.25 && t < c.bat + 0.95, chosen = t >= c.bat + 0.85;
        return (
          <>
            <GhBar text="you / dailycast" />
            <div style={{ ...abs(0, 64, CW, 50), borderBottom: '1px solid #D0D7DE', display: 'flex', gap: 30, padding: '0 28px', alignItems: 'center', fontSize: 21 * fs }}>
              {['Code', 'Issues', 'Pull requests', 'Actions', 'Settings'].map((x) => <div key={x} style={{ height: 50, display: 'flex', alignItems: 'center', fontWeight: x === 'Settings' ? 700 : 400, borderBottom: x === 'Settings' ? `3px solid ${C.claude}` : 'none' }}>{x}</div>)}
            </div>
            {!v && <div style={{ ...abs(40, 140, 260) }}>{['General', 'Collaborators', 'Branches', 'Actions', 'Pages', 'Secrets'].map((x) => <div key={x} style={{ height: 50, display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 21, borderRadius: 8, background: x === 'Pages' ? '#F0EEE8' : 'transparent', fontWeight: x === 'Pages' ? 700 : 400, borderLeft: x === 'Pages' ? `4px solid ${C.claude}` : '4px solid transparent' }}>{x}</div>)}</div>}
            <div style={{ ...abs(mx, 140), fontSize: 36 * fs, fontWeight: 700 }}>GitHub Pages</div>
            <div style={{ ...abs(mx, 206), fontSize: 25 * fs, fontWeight: 700 }}>Build and deployment</div>
            <div style={{ ...abs(mx, 258), fontSize: 21 * fs, color: C.mute }}>Source</div>
            <div style={{ ...abs(mx, 294, 380 * fs, 58), border: `2px solid ${open ? '#0969DA' : '#D0D7DE'}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 23 * fs, fontWeight: 600, background: '#F6F8FA' }}>{chosen ? 'GitHub Actions' : 'Deploy from a branch'} &nbsp;▾</div>
            {open && <div style={{ ...abs(mx, 358, 380 * fs, 120), background: '#fff', border: '1px solid #D0D7DE', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,.15)', overflow: 'hidden' }}>{['Deploy from a branch', 'GitHub Actions'].map((x, i) => <div key={x} style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 22 * fs, background: i === 1 && t > c.bat + 0.55 ? '#DDF4FF' : '#fff', fontWeight: i === 1 ? 700 : 400 }}>{x}</div>)}</div>}
            <In t={t} at={c.pages + 0.2} y={20}>
              <div style={{ ...abs(mx, 400, CW - mx - 44, v ? 140 : 96), background: '#DAFBE1', border: '1.5px solid #4AC26B', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', flexWrap: v ? 'wrap' : 'nowrap', alignContent: 'center' }}>
                <Check s={32} />
                <div style={{ fontSize: 22 * fs }}>Your site is live at <b style={{ fontFamily: MONO }}>you.github.io/dailycast</b></div>
              </div>
            </In>
            <Cursor t={t} s={fs} keys={[{ t: B, x: CW * 0.6, y: CH * 0.7 }, { t: c.bat + 0.25, x: mx + 220, y: 323, c: 1, d: 0.35 }, { t: c.bat + 0.8, x: mx + 200, y: 448, c: 1, d: 0.35 }]} />
          </>
        );
      }}
    </StepFrame>
  );
};

const CODE_GS = [
  "const SS = SpreadsheetApp.getActive();",
  "function doGet(e) {",
  "  const rows = SS.getSheetByName('episodes')",
  "    .getDataRange().getValues();",
  "  return out({ episodes: rows });",
  "}",
  "function doPost(e) {",
  "  const d = JSON.parse(e.postData.contents);",
  "  SS.getSheetByName('listeners')",
  "    .appendRow([new Date(), d.user, d.ep]);",
  "  return out({ ok: true });",
  "}",
  "const out = (o) => ContentService",
  "  .createTextOutput(JSON.stringify(o))",
  "  .setMimeType(ContentService.MimeType.JSON);",
];

const SheetGrid = ({ t, CW, top, bottom, v, cols, rows, rowAt = () => -1, flashNew = false, fs = 21 }) => {
  const rh = v ? 52 : 46, rn = 50; const cw = (CW - rn) / cols.length;
  return (
    <div style={{ ...abs(0, top, CW, bottom - top), overflow: 'hidden', fontSize: fs }}>
      <div style={{ display: 'flex', height: 34, background: '#F8F9FA', borderBottom: '1px solid #E0E0E0', fontSize: 16, color: '#5F6368' }}>
        <div style={{ width: rn }} />{cols.map((_, i) => <div key={i} style={{ width: cw, textAlign: 'center', lineHeight: '34px', borderLeft: '1px solid #E0E0E0' }}>{String.fromCharCode(65 + i)}</div>)}
      </div>
      {[cols, ...rows].map((r, ri) => {
        const at = ri === 0 ? -1 : rowAt(ri - 1); if (ri > 0 && t < at) return null;
        const fl = flashNew && ri > 0 ? 1 - P(t, at + 0.2, 0.8) : 0;
        return (
          <div key={ri} style={{ display: 'flex', height: rh, borderBottom: '1px solid #ECECEC', background: fl > 0 ? `rgba(24,128,56,${0.18 * fl})` : ri === 0 ? '#FAFAFA' : '#fff', opacity: ri === 0 ? 1 : P(t, at, 0.3) }}>
            <div style={{ width: rn, textAlign: 'center', lineHeight: `${rh}px`, fontSize: 15, color: '#5F6368', background: '#F8F9FA' }}>{ri + 1}</div>
            {r.map((cell, ci) => <div key={ci} style={{ width: cw, lineHeight: `${rh}px`, padding: '0 12px', borderLeft: '1px solid #ECECEC', fontWeight: ri === 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', boxSizing: 'border-box', color: cell === '✓' ? C.sheet : C.ink }}>{cell}</div>)}
          </div>
        );
      })}
    </div>
  );
};

const SheetTop = ({ v, CW, menuHi = null, title = 'DailyCast · Dữ liệu' }) => {
  const items = v ? ['Tệp', 'Chèn', 'Dữ liệu', 'Tiện ích mở rộng', 'Trợ giúp'] : ['Tệp', 'Chỉnh sửa', 'Xem', 'Chèn', 'Định dạng', 'Dữ liệu', 'Công cụ', 'Tiện ích mở rộng', 'Trợ giúp'];
  const fs = v ? 22 : 19; let x = 84; const xs = items.map((it) => { const a = x; x += it.length * fs * 0.56 + 30; return a; });
  return (
    <>
      <div style={{ ...abs(22, 14) }}><Logo k="sheets" s={46} /></div>
      <div style={{ ...abs(84, 8), fontSize: v ? 25 : 23, fontWeight: 500 }}>{title}</div>
      {items.map((it, i) => <div key={it} style={{ ...abs(xs[i] - 8, 42, it.length * fs * 0.56 + 16, 30), fontSize: fs, lineHeight: '30px', paddingLeft: 8, borderRadius: 6, background: menuHi === it ? '#E8F0FE' : 'transparent', color: C.ink }}>{it}</div>)}
      <div style={{ ...abs(CW - 150, 16, 120, 44), borderRadius: 22, background: '#C2E7FF', fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chia sẻ</div>
      <div style={{ ...abs(0, 84, CW, 44), background: '#F1F4F9', borderTop: '1px solid #E3E3E3', display: 'flex', gap: 14, alignItems: 'center', padding: '0 20px' }}>{Array.from({ length: v ? 12 : 18 }).map((_, i) => <div key={i} style={{ width: 24, height: 14, borderRadius: 4, background: '#D5DAE1' }} />)}</div>
      <div style={{ ...abs(0, 128, CW, 38), borderBottom: '1px solid #E3E3E3', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', fontSize: 18, color: C.mute }}><i>fx</i></div>
    </>
  );
  // vị trí mục "Tiện ích mở rộng" dùng cho menu + con trỏ
};
const menuX = (v, it = 'Tiện ích mở rộng') => { const items = v ? ['Tệp', 'Chèn', 'Dữ liệu', 'Tiện ích mở rộng', 'Trợ giúp'] : ['Tệp', 'Chỉnh sửa', 'Xem', 'Chèn', 'Định dạng', 'Dữ liệu', 'Công cụ', 'Tiện ích mở rộng', 'Trợ giúp']; const fs = v ? 22 : 19; let x = 84; for (const i of items) { if (i === it) return { x, w: i.length * fs * 0.56 }; x += i.length * fs * 0.56 + 30; } return { x, w: 100 }; };
const SheetTabs = ({ CW, CH, active, tabs = ['episodes', 'sources', 'listeners'] }) => (
  <div style={{ ...abs(0, CH - 52, CW, 52), background: '#F8F9FA', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
    {tabs.map((x) => <div key={x} style={{ padding: '8px 18px', fontSize: 19, borderRadius: 8, background: x === active ? '#E6F4EA' : 'transparent', color: x === active ? C.sheet : C.mute, fontWeight: x === active ? 700 : 500 }}>{x}</div>)}
    <div style={{ marginLeft: 'auto', fontSize: 16, color: '#9A9AA2', fontStyle: 'italic' }}>Dữ liệu minh hoạ</div>
  </div>
);

const VOICES = [['Ninh Đôn', 'Trẻ · miền Bắc · hào hứng'], ['Đức', 'MC · Hà Nội · tự tin'], ['Tony Hoang', 'Chia sẻ kiến thức'], ['Trung Caha', 'Rõ ràng · trò chuyện']];
const Wave = ({ t, n = 28, h = 40, on = false, color = '#111' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: h }}>
    {Array.from({ length: n }).map((_, i) => { const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)); const a = on ? 0.35 + 0.65 * Math.abs(Math.sin(t * 9 + i * 0.8)) : 1; return <div key={i} style={{ width: 4, height: h * base * a, borderRadius: 2, background: color, opacity: on ? 1 : 0.35 }} />; })}
  </div>
);
const ElTop = ({ CW, tab }) => (
  <div style={{ ...abs(0, 0, CW, 66), display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px', borderBottom: '1px solid #EEE' }}>
    <ElMark s={34} /><div style={{ fontSize: 24, fontWeight: 700 }}>ElevenLabs</div>
    <div style={{ marginLeft: 24, display: 'flex', gap: 22, fontSize: 20, color: C.mute }}>{['Giọng đọc', 'Khoá API'].map((x) => <div key={x} style={{ fontWeight: x === tab ? 700 : 500, color: x === tab ? C.ink : C.mute }}>{x}</div>)}</div>
  </div>
);

const Step2 = ({ t, v }) => {
  const c = { vao: W('step2', 'vào'), chon: W('step2', 'chọn'), giong: W('step2', 'giọng'), tao: W('step2', 'tạo'), dan: W('step2', 'Dán'), sec: W('step2', 'Secrets'), kho: W('step2', 'GitHub'), cat: W('step2', 'cất') };
  const items = [['Chọn giọng đọc', c.chon], ['Tạo khoá API', c.tao], ['Cất khoá vào GitHub Secrets', c.dan]];
  const B = c.tao - 0.25, Cc = c.dan - 0.2;
  const url = t < B ? 'elevenlabs.io/app/voice-library' : t < Cc ? 'elevenlabs.io/app/settings/api-keys' : 'github.com/you/dailycast/settings/secrets/actions';
  return (
    <StepFrame t={t} v={v} id="step2" n={2} title="Giọng đọc ElevenLabs" logos={['el', 'github']} items={items} url={url}>
      {(CW, CH) => {
        const fs = v ? 1.12 : 1, px = v ? 36 : 50;
        if (t < B) {
          const cols = 2, gw = (CW - px * 2 - 24) / cols, gh = v ? 200 : 190;
          const picked = t > c.giong + 0.5;
          return (
            <>
              <ElTop CW={CW} tab="Giọng đọc" />
              <div style={{ ...abs(px, 92), fontSize: 34 * fs, fontWeight: 700 }}>Thư viện giọng</div>
              <div style={{ ...abs(px, 148), display: 'flex', gap: 10 }}>{['Tiếng Việt', 'Nam', 'Kể chuyện'].map((x) => <div key={x} style={{ padding: '7px 16px', borderRadius: 999, background: '#F2F2F2', fontSize: 19 * fs, fontWeight: 600 }}>{x}</div>)}</div>
              {VOICES.map(([n, d], i) => {
                const x = px + (i % cols) * (gw + 24), y = 210 + Math.floor(i / cols) * (gh + 22); const on = i === 0 && t > c.chon;
                return (
                  <In key={n} t={t} at={c.vao - 0.2 + i * 0.1} y={16} style={{ ...abs(x, y, gw, gh) }}>
                    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 18, border: `${on ? 2.5 : 1.5}px solid ${on ? '#111' : '#E6E6E6'}`, padding: 20, background: '#fff', boxShadow: on ? '0 14px 30px rgba(0,0,0,.12)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 26, background: on ? '#111' : '#F2F2F2', color: on ? '#fff' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{on ? '❚❚' : '▶'}</div>
                        <div><div style={{ fontSize: 25 * fs, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 18 * fs, color: C.mute }}>{d}</div></div>
                      </div>
                      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Wave t={t} on={on} n={v ? 22 : 24} h={42} />
                        {i === 0 && <div style={{ padding: '8px 14px', borderRadius: 10, background: picked ? C.sheet : '#111', color: '#fff', fontSize: 17 * fs, fontWeight: 700, whiteSpace: 'nowrap' }}>{picked ? 'Đã chọn ✓' : 'Dùng giọng này'}</div>}
                      </div>
                    </div>
                  </In>
                );
              })}
              <Cursor t={t} s={fs} keys={[{ t: c.vao, x: CW * 0.8, y: CH * 0.85 }, { t: c.chon + 0.05, x: px + 46, y: 210 + 46, c: 1, d: 0.5 }, { t: c.giong + 0.45, x: px + gw - 80, y: 210 + 20 + 66 + 18 + 21, c: 1, d: 0.45 }]} />
            </>
          );
        }
        if (t < Cc) {
          const made = t > c.tao + 0.35, copied = t > c.tao + 1.3;
          return (
            <>
              <ElTop CW={CW} tab="Khoá API" />
              <div style={{ ...abs(px, 92), fontSize: 34 * fs, fontWeight: 700 }}>Khoá API</div>
              <div style={{ ...abs(CW - px - 200 * fs, 92, 200 * fs, 52), borderRadius: 12, background: '#111', color: '#fff', fontSize: 20 * fs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t > c.tao - 0.05 && t < c.tao + 0.12 ? 0.94 : 1})` }}>+ Tạo khoá</div>
              {made && (
                <div style={{ ...abs(px, 180, CW - px * 2), borderRadius: 18, border: '1.5px solid #E6E6E6', padding: 26, boxSizing: 'border-box', opacity: P(t, c.tao + 0.35, 0.3), transform: `translateY(${(1 - P(t, c.tao + 0.35, 0.35)) * 20}px)` }}>
                  <div style={{ fontSize: 20 * fs, color: C.mute }}>Tên khoá</div>
                  <div style={{ fontSize: 26 * fs, fontWeight: 700, marginTop: 4 }}>DailyCast</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{['Text to Speech', 'Voices'].map((x) => <div key={x} style={{ padding: '6px 14px', borderRadius: 999, background: '#E6F4EA', color: C.sheet, fontSize: 18 * fs, fontWeight: 700 }}>✓ {x}</div>)}</div>
                  <div style={{ marginTop: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: v ? 'wrap' : 'nowrap' }}>
                    <div style={{ flex: 1, minWidth: 300, fontFamily: MONO, fontSize: (v ? 24 : 22), background: '#F6F6F6', borderRadius: 10, padding: '14px 18px' }}>sk_••••••••••••••••••••7c1e</div>
                    <div style={{ padding: '14px 22px', borderRadius: 10, background: copied ? C.sheet : '#111', color: '#fff', fontSize: 20 * fs, fontWeight: 700, whiteSpace: 'nowrap' }}>{copied ? 'Đã sao chép ✓' : 'Sao chép'}</div>
                  </div>
                </div>
              )}
              <Cursor t={t} s={fs} keys={[{ t: B, x: CW * 0.5, y: CH * 0.6 }, { t: c.tao - 0.05, x: CW - px - 100 * fs, y: 118, c: 1, d: 0.45 }, { t: c.tao + 1.25, x: CW - px - 90 * fs, y: v ? 180 + 26 + 24 + 34 + 52 + 20 + 30 : 180 + 26 + 24 + 34 + 52 + 20 + 26, c: 1, d: 0.5 }]} />
            </>
          );
        }
        const nm = typed('ELEVENLABS_API_KEY', t, c.dan, 20); const added = t > c.kho + 0.45;
        return (
          <>
            <GhBar text="you / dailycast" />
            <div style={{ ...abs(px, 96), fontSize: 30 * fs, fontWeight: 700 }}>Actions secrets / New secret</div>
            <div style={{ ...abs(px, 160), fontSize: 21 * fs, fontWeight: 600 }}>Name *</div>
            <div style={{ ...abs(px, 196, CW - px * 2, 60), border: `2px solid ${t < c.sec ? '#0969DA' : '#D0D7DE'}`, borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: MONO, fontSize: 24 * fs }}>{nm}{t < c.sec && <Caret t={t} h={30} color="#0969DA" />}</div>
            <div style={{ ...abs(px, 278), fontSize: 21 * fs, fontWeight: 600 }}>Secret *</div>
            <div style={{ ...abs(px, 314, CW - px * 2, 110), border: `2px solid ${t >= c.sec && t < c.kho + 0.3 ? '#0969DA' : '#D0D7DE'}`, borderRadius: 10, padding: '16px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 24 * fs, letterSpacing: 2 }}>{t > c.sec ? '•'.repeat(Math.min(28, Math.floor((t - c.sec) * 60))) : ''}</div>
            <div style={{ ...abs(px, 446, 210 * fs, 58), borderRadius: 12, background: C.ghGreen, color: '#fff', fontSize: 22 * fs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t > c.kho + 0.25 && t < c.kho + 0.42 ? 0.94 : 1})` }}>Add secret</div>
            {added && (
              <div style={{ ...abs(px, 530, CW - px * 2), opacity: P(t, c.kho + 0.45, 0.3) }}>
                <div style={{ background: '#DAFBE1', border: '1.5px solid #4AC26B', borderRadius: 14, padding: '16px 22px', display: 'flex', gap: 14, alignItems: 'center', fontSize: 22 * fs }}><Check s={30} /> Đã cất khoá. Không ai xem lại được, kể cả bạn.</div>
                <div style={{ marginTop: 16, border: '1px solid #D0D7DE', borderRadius: 12, padding: '14px 20px', display: 'flex', gap: 14, alignItems: 'center', fontFamily: MONO, fontSize: 21 * fs }}><Lock s={22} />ELEVENLABS_API_KEY<span style={{ marginLeft: 'auto', fontFamily: FONT, color: C.mute, fontSize: 18 * fs }}>vừa cập nhật</span></div>
              </div>
            )}
            <Cursor t={t} s={fs} keys={[{ t: Cc + 0.1, x: CW * 0.7, y: CH * 0.75 }, { t: c.dan - 0.05, x: px + 300, y: 226, c: 1, d: 0.4 }, { t: c.sec - 0.05, x: px + 300, y: 360, c: 1, d: 0.4 }, { t: c.kho + 0.3, x: px + 105 * fs, y: 475, c: 1, d: 0.45 }]} />
          </>
        );
      }}
    </StepFrame>
  );
};

// giao diện Claude Code
const ClaudeTop = ({ CW, repo = null, status = null, t = 0 }) => (
  <div style={{ ...abs(0, 0, CW, 66), display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px', borderBottom: '1px solid #ECE9E1' }}>
    <ClaudeMark s={32} /><div style={{ fontSize: 24, fontWeight: 700 }}>Claude Code</div>
    {repo && <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: '#F0EEE6', fontSize: 19, fontWeight: 600 }}><Logo k="github" s={20} />{repo}</div>}
    {status && <div style={{ marginLeft: 'auto', fontSize: 19, fontWeight: 600, color: status.done ? C.sheet : C.claude, display: 'flex', alignItems: 'center', gap: 10 }}>{status.done ? <Check s={24} bg={C.sheet} /> : <div style={{ width: 22, height: 22, borderRadius: 11, border: `3px solid ${C.claudeL}`, borderTopColor: C.claude, transform: `rotate(${t * 400}deg)` }} />}{status.label}</div>}
  </div>
);
const URL_CHIP = (fs) => (
  <div style={{ display: 'inline-block', fontFamily: MONO, fontSize: fs, background: '#F0EEE6', borderRadius: 10, padding: '8px 14px', lineHeight: 1.4, color: C.ink }}>
    Backend Apps Script: https://script.google.com/macros/s/AKfycbx9Qe…/exec
  </div>
);

const Step3 = ({ t, v }) => {
  const c = { mo: W('step3', 'mở'), kn: W('step3', 'kết'), chon: W('step3', 'chọn') };
  const items = [['Mở Claude Code', c.mo], ['Kết nối GitHub', c.kn], ['Chọn kho dailycast', c.chon]];
  return (
    <StepFrame t={t} v={v} id="step3" n={3} title="Kết nối Claude Code" logos={['claude', 'github']} items={items} url="claude.ai/code">
      {(CW, CH) => {
        const fs = v ? 1.12 : 1; const IW = v ? CW - 60 : 900, ix = (CW - IW) / 2, iy = v ? 420 : 330, ih = v ? 330 : 260;
        const connected = t > c.kn + 0.45; const repoOn = t > c.chon + 0.55; const dd = t > c.chon - 0.05 && t < c.chon + 0.65;
        const by = v ? 250 : 210;
        return (
          <AbsoluteFill style={{ background: C.cream }}>
            <ClaudeTop CW={CW} />
            <div style={{ ...abs(0, v ? 120 : 110, CW), textAlign: 'center', fontSize: 42 * fs, fontWeight: 500, fontFamily: 'Georgia, serif', color: '#3D3929' }}>Bạn muốn xây gì hôm nay?</div>
            <In t={t} at={c.mo} y={14}>
              <div style={{ ...abs((CW - 560 * fs) / 2, by, 560 * fs, 76), background: '#fff', border: '1px solid #E5E2DA', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px 0 22px', boxSizing: 'border-box' }}>
                <Logo k="github" s={34} /><div style={{ fontSize: 23 * fs, fontWeight: 600 }}>GitHub</div>
                <div style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: 10, background: connected ? '#E6F4EA' : C.ink, color: connected ? C.sheet : '#fff', fontSize: 20 * fs, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>{connected ? <>Đã kết nối <Check s={22} bg={C.sheet} /></> : 'Kết nối'}</div>
              </div>
            </In>
            <div style={{ ...abs(ix, iy, IW, ih), background: '#fff', border: `1.5px solid ${t > c.chon + 0.7 ? C.claude : '#E5E2DA'}`, borderRadius: 24, boxShadow: '0 18px 44px rgba(60,50,30,.10)' }}>
              <div style={{ ...abs(24, 22, IW - 48), fontSize: 24 * fs, color: '#A19D92' }}>Mô tả việc cần làm…{t > c.chon + 0.8 && <Caret t={t} h={30} />}</div>
              <div style={{ ...abs(20, ih - 66, 320 * fs, 48), borderRadius: 12, border: '1.5px solid #E5E2DA', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 20 * fs, fontWeight: 600, background: repoOn ? '#F0EEE6' : '#fff' }}><Logo k="github" s={22} />{repoOn ? 'you/dailycast' : 'Chọn kho'}<span style={{ marginLeft: 'auto', color: C.mute }}>▾</span></div>
              <div style={{ ...abs(IW - 74, ih - 70, 54, 54), borderRadius: 27, background: '#E8C8BA', color: '#fff', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>↑</div>
            </div>
            {dd && <div style={{ ...abs(ix + 20, iy + ih - 14, 360 * fs), background: '#fff', borderRadius: 14, boxShadow: '0 18px 44px rgba(0,0,0,.18)', padding: '8px 0', opacity: P(t, c.chon - 0.05, 0.2) }}>{['you/dailycast', 'you/blog-ca-nhan', 'you/ghi-chu'].map((x, i) => <div key={x} style={{ height: 54, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', fontSize: 21 * fs, background: i === 0 && t > c.chon + 0.3 ? '#FBEDE7' : '#fff', fontWeight: i === 0 ? 700 : 400 }}><Logo k="github" s={20} />{x}</div>)}</div>}
            <Cursor t={t} s={fs} keys={[{ t: c.mo, x: CW * 0.7, y: CH * 0.8 }, { t: c.kn + 0.25, x: (CW + 560 * fs) / 2 - 70, y: by + 38, c: 1, d: 0.5 }, { t: c.chon, x: ix + 150, y: iy + ih - 42, c: 1, d: 0.45 }, { t: c.chon + 0.5, x: ix + 140, y: iy + ih - 14 + 8 + 27, c: 1, d: 0.3 }]} />
          </AbsoluteFill>
        );
      }}
    </StepFrame>
  );
};

const PROMPT_TXT = 'Làm cho mình app podcast DailyCast: mỗi sáng 5:45 tự gom tin từ các báo lớn, chọn tin quan trọng, viết tóm tắt và kịch bản, đọc thành giọng nói bằng ElevenLabs (khoá đã cất trong GitHub Secrets), đăng lên GitHub Pages và cài được lên điện thoại.';
const BIGBOX = (v) => (v ? { x: 50, y: 300, w: 980, h: 1090 } : { x: 210, y: 120, w: 1500, h: 810 });

const Prompt = ({ t, v }) => {
  const s = SEG('prompt'); const at = s.start + 0.35; const send = SEG('build').start - 0.55;
  const cps = PROMPT_TXT.length / Math.max(2, send - 0.25 - at);
  const box = BIGBOX(v), CW = box.w, CH = box.h - 52, fs = v ? 1.12 : 1;
  const IW = CW - (v ? 60 : 140), ix = (CW - IW) / 2, iy = v ? 210 : 190, ih = CH - iy - (v ? 60 : 70);
  const tv = W('prompt', 'tiếng');
  return (
    <>
      <Win box={box} url="claude.ai/code" bg={C.cream}>
        <ClaudeTop CW={CW} repo="you/dailycast" />
        <div style={{ ...abs(0, v ? 100 : 96, CW), textAlign: 'center', fontSize: (v ? 40 : 40), fontWeight: 500, fontFamily: 'Georgia, serif', color: '#3D3929' }}>Bạn muốn xây gì hôm nay?</div>
        <div style={{ ...abs(ix, iy, IW, ih), background: '#fff', border: `2px solid ${C.claude}`, borderRadius: 26, boxShadow: '0 24px 60px rgba(60,50,30,.12)' }}>
          <div style={{ ...abs(30, 26, IW - 60) }}>
            <div style={{ marginTop: 4, fontSize: v ? 42 : 40, lineHeight: 1.45, fontWeight: 500, color: C.ink }}>{typed(PROMPT_TXT, t, at, cps)}{t < send + 0.2 && <Caret t={t} h={v ? 46 : 44} />}</div>
          </div>
          <div style={{ ...abs(26, ih - 74, 300, 52), borderRadius: 12, background: '#F0EEE6', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontSize: 21, fontWeight: 600 }}><Logo k="github" s={24} />you/dailycast</div>
          <div style={{ ...abs(IW - 88, ih - 84, 64, 64), borderRadius: 32, background: C.claude, color: '#fff', fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, transform: `scale(${t > send - 0.1 && t < send + 0.15 ? 0.85 : 1 + 0.06 * Math.max(0, Math.sin((t - send) * 8)) * (t > send - 1.2 && t < send ? 1 : 0)})`, boxShadow: t > send - 1.2 ? '0 0 0 10px rgba(217,119,87,.18)' : 'none' }}>↑</div>
          <Tap t={t} at={send} x={IW - 56} y={ih - 52} />
        </div>
      </Win>
      <div style={{ ...abs(0, v ? 205 : 962, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}>
        <Pop t={t} at={tv - 0.1}><div style={{ padding: '12px 28px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: v ? 34 : 30, fontWeight: 700 }}>Gõ tiếng Việt, như nói chuyện</div></Pop>
      </div>
    </>
  );
};

const FILES = {
  'app.js': ["const res = await fetch('data/today.json');", 'const ep = await res.json();', '', 'renderStories(ep.stories);      // tin theo chuyên mục', 'player.src = ep.audio;          // MP3 giọng ElevenLabs', 'showSubtitles(ep.turns);        // phụ đề song ngữ', '', "navigator.serviceWorker.register('sw.js');  // cài như app"],
  'tools/collect.mjs': ["import config from '../config.json' with { type: 'json' };", '', 'const pool = [];', 'for (const feed of config.feeds) {   // hàng chục nguồn', '  const items = await readRSS(feed.url);', '  pool.push(...items.map(scoreStory));', '}', 'const top = pickTop(dedupe(pool), 12);', "await save('data/today.json', top);"],
  'tools/voice.py': ['import os, requests', "KEY = os.environ['ELEVENLABS_API_KEY']   # lấy từ GitHub Secrets", '', 'def speak(text, voice):', '    r = requests.post(', "        f'https://api.elevenlabs.io/v1/text-to-speech/{voice}',", "        headers={'xi-api-key': KEY},", "        json={'text': text, 'model_id': 'eleven_v3'})", "    open('audio/today.mp3', 'wb').write(r.content)"],
  '.github/workflows/daily.yml': ['name: DailyCast', 'on:', '  schedule:', "    - cron: '45 22 * * *'   # 05:45 giờ VN", 'jobs:', '  build:', '    runs-on: ubuntu-latest', '    env:', '      ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}', '    steps:', '      - run: node tools/collect.mjs', '      - run: python3 tools/voice.py'],
  'terminal': ['$ git add . && git commit -m "DailyCast v1"', '$ git push origin main', '✓ Đã đẩy lên GitHub · main'],
};

const Build = ({ t, v }) => {
  const c = { k: W('build', 'kế'), gd: W('build', 'giao'), gom: W('build', 'lấy'), goi: W('build', 'gọi'), lich: W('build', 'lịch'), day: W('build', 'đẩy'), viec: W('build', 'Việc'), duyet: W('build', 'duyệt') };
  const todo = [['Lên kế hoạch kiến trúc', c.k, null], ['Giao diện · app.js, app.css', c.gd, 'app.js'], ['Gom tin · tools/collect.mjs', c.gom, 'tools/collect.mjs'], ['Giọng đọc · tools/voice.py', c.goi, 'tools/voice.py'], ['Lịch chạy · daily.yml', c.lich, '.github/workflows/daily.yml'], ['git push → main', c.day, 'terminal']];
  const box = BIGBOX(v), CW = box.w, CH = box.h - 52;
  const curI = todo.reduce((a, it, i) => (t >= it[1] - 0.1 ? i : a), 0);
  const fileIdx = todo.reduce((a, it, i) => (it[2] && t >= it[1] - 0.1 ? i : a), 1);
  const file = todo[fileIdx][2]; const fAt = todo[fileIdx][1];
  const allDone = t > c.day + 1.0;
  const L = v ? { x: 30, y: 90, w: CW - 60 } : { x: 30, y: 90, w: 560 };
  const R = v ? { x: 30, y: 600, w: CW - 60, h: CH - 630 } : { x: 620, y: 90, w: CW - 650, h: CH - 120 };
  const ih = v ? 56 : 66;
  return (
    <Win box={box} url="claude.ai/code/session" bg={C.cream}>
      <ClaudeTop CW={CW} repo="you/dailycast" t={t} status={allDone ? { done: true, label: 'Hoàn tất' } : { done: false, label: 'Claude đang làm…' }} />
      <div style={{ ...abs(L.x, L.y, L.w), background: '#EFEDE5', borderRadius: 16, padding: '14px 18px', boxSizing: 'border-box', fontSize: 19, lineHeight: 1.4, color: '#4A4740', height: v ? 84 : 96, overflow: 'hidden' }}>{PROMPT_TXT}</div>
      <div style={{ ...abs(L.x, L.y + (v ? 104 : 124)), fontSize: 22, fontWeight: 700, color: C.mute, letterSpacing: 2 }}>KẾ HOẠCH</div>
      {todo.map(([lab, at], i) => {
        const done = i < curI || allDone, on = i === curI && !allDone; const k = P(t, at - 0.2, 0.35);
        return (
          <div key={i} style={{ ...abs(L.x, L.y + (v ? 142 : 166) + i * ih, L.w, ih - 8), display: 'flex', alignItems: 'center', gap: 16, opacity: 0.35 + 0.65 * k, background: on ? '#fff' : 'transparent', borderRadius: 14, padding: '0 14px', boxSizing: 'border-box', boxShadow: on ? '0 8px 20px rgba(60,50,30,.08)' : 'none' }}>
            {done ? <Check s={30} bg={C.claude} /> : on ? <div style={{ width: 26, height: 26, borderRadius: 13, border: `4px solid ${C.claudeL}`, borderTopColor: C.claude, transform: `rotate(${t * 420}deg)` }} /> : <div style={{ width: 26, height: 26, borderRadius: 13, border: '3px solid #CFCBC0' }} />}
            <div style={{ fontSize: v ? 25 : 23, fontWeight: on ? 700 : 500, fontFamily: /·|→/.test(lab) ? FONT : FONT }}>{lab}</div>
          </div>
        );
      })}
      <div style={{ ...abs(R.x, R.y, R.w, R.h), background: '#1C1C22', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
        <div style={{ height: 50, background: '#25252D', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, color: '#C9C9D2', fontFamily: MONO, fontSize: 18 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: C.claude }} />{file === 'terminal' ? 'terminal' : file}<span style={{ marginLeft: 'auto', color: '#7D8794', fontFamily: FONT }}>{file === 'terminal' ? '' : 'Claude đang viết'}</span>
        </div>
        <div style={{ padding: '16px 10px' }}><Code key={file} lines={FILES[file]} t={t} at={fAt + 0.1} mode="type" cps={file === 'terminal' ? 70 : 150} fs={v ? 21 : 19} theme="dark" /></div>
      </div>
      {t > c.viec - 0.4 && (
        <div style={{ ...abs(v ? R.x + 30 : L.x, v ? R.y + R.h - 150 : CH - 150, v ? R.w - 60 : L.w, 120), background: '#fff', borderRadius: 18, border: '1.5px solid #E5E2DA', boxShadow: '0 24px 60px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', boxSizing: 'border-box', opacity: P(t, c.viec - 0.4, 0.3), transform: `translateY(${(1 - P(t, c.viec - 0.4, 0.4)) * 30}px)` }}>
          <Logo k="github" s={40} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 22, fontWeight: 700 }}>Pull request #1</div><div style={{ fontSize: 18, color: C.mute }}>DailyCast v1 · sẵn sàng để duyệt</div></div>
          <div style={{ padding: '12px 22px', borderRadius: 10, background: t > c.duyet + 0.1 ? C.purple : C.ghGreen, color: '#fff', fontSize: 20, fontWeight: 700 }}>{t > c.duyet + 0.1 ? 'Merged ✓' : 'Merge'}</div>
          <Tap t={t} at={c.duyet} x={(v ? R.w - 60 : L.w) - 70} y={60} />
        </div>
      )}
    </Win>
  );
};

const Daily = ({ t, v }) => {
  const c = { tdy: W('daily', 'Từ'), nam: W('daily', 'Năm'), gha: W('daily', 'GitHub'), gom: W('daily', 'đọc'), cham: W('daily', 'chấm'), cl: W('daily', 'Claude'), el: W('daily', 'ElevenLabs'), web: W('daily', 'Pages'), so: W('daily', 'số') };
  const N = [
    { k: 'clock', t: '05:45', s: 'Mỗi sáng', at: c.nam, log: '▶ Bắt đầu workflow daily.yml' },
    { k: 'actions', t: 'GitHub Actions', s: 'Thức dậy', at: c.gha, log: '✓ Máy chạy GitHub đã sẵn sàng' },
    { k: 'news', t: 'Đọc tin báo', s: 'Hàng chục trang báo', at: c.gom, log: '✓ Đọc tin mới từ hàng chục trang báo (RSS)' },
    { k: 'rank', t: 'Chấm điểm', s: 'Chọn tin quan trọng', at: c.cham, log: '✓ Chấm điểm, chọn tin quan trọng' },
    { k: 'claude', t: 'Claude', s: 'Tóm tắt + kịch bản', at: c.cl, log: '✓ Claude viết tóm tắt + kịch bản podcast' },
    { k: 'el', t: 'ElevenLabs', s: 'Kịch bản → giọng đọc', at: c.el, log: '✓ ElevenLabs đọc kịch bản thành MP3' },
    { k: 'pages', t: 'GitHub Pages', s: 'Đăng số mới lên app', at: c.web, log: '✓ Lưu vào kho, GitHub Pages đăng số mới lên app' },
  ];
  const tms = ['05:45:00', '05:45:06', '05:45:31', '05:45:48', '05:46:20', '05:47:42', '05:48:10'];
  const act = N.reduce((a, n, i) => (t >= n.at - 0.1 ? i : a), -1);
  // vị trí gói dữ liệu chạy dọc dây nối
  let pi = 0; for (let i = 0; i < N.length - 1; i++) { if (t >= N[i + 1].at - 0.1) pi = i + 1; else if (t > N[i].at) { pi = i + eio((t - N[i].at) / Math.max(0.3, N[i + 1].at - 0.1 - N[i].at)); break; } else break; }
  const show = t > N[0].at - 0.2;
  if (v) {
    const y0 = 330, rh = 142, lx = 136;
    return (
      <>
        <In t={t} at={c.tdy - 0.3}><div style={{ ...abs(0, 215, 1080), textAlign: 'center', fontSize: 54, fontWeight: 800, letterSpacing: -1.3 }}>Mỗi sáng, <span style={{ color: C.claude }}>tự vận hành</span></div></In>
        <div style={{ ...abs(lx - 3, y0 + 50, 6, rh * 6), background: '#E2DED5', borderRadius: 3 }} />
        {show && <div style={{ ...abs(lx - 3, y0 + 50, 6, rh * pi), background: C.claude, borderRadius: 3 }} />}
        {show && <div style={{ ...abs(lx - 14, y0 + 50 + rh * pi - 14, 28, 28), borderRadius: 14, background: C.claude, boxShadow: '0 0 0 10px rgba(217,119,87,.22)' }} />}
        {N.map((n, i) => {
          const on = i <= act; const cur = i === act;
          return (
            <In key={i} t={t} at={n.at - 0.25} x={-30} y={0} style={{ ...abs(70, y0 + i * rh, 950, 112) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 30, height: 112, background: cur ? '#fff' : 'rgba(255,255,255,.55)', borderRadius: 24, padding: '0 22px 0 0', boxShadow: cur ? '0 16px 40px rgba(22,22,27,.12)' : 'none', border: cur ? `2px solid ${C.claude}` : '1.5px solid transparent' }}>
                <Tile k={n.k} s={100} style={{ marginLeft: 16 }} />
                <div><div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.8, color: on ? C.ink : C.mute }}>{n.t}</div><div style={{ fontSize: 27, color: C.mute }}>{n.s}</div></div>
                {on && !cur && <div style={{ marginLeft: 'auto' }}><Check s={36} bg={C.sheet} /></div>}
              </div>
            </In>
          );
        })}
      </>
    );
  }
  const nw = 214, gap = 30, x0 = (1920 - (nw * 7 + gap * 6)) / 2, yIcon = 360;
  const cx = (i) => x0 + i * (nw + gap) + nw / 2;
  return (
    <>
      <In t={t} at={c.tdy - 0.3}><div style={{ ...abs(0, 150, 1920), textAlign: 'center', fontSize: 60, fontWeight: 800, letterSpacing: -1.5 }}>Mỗi sáng, hệ thống <span style={{ color: C.claude }}>tự vận hành</span></div></In>
      <div style={{ ...abs(cx(0), yIcon - 3, cx(6) - cx(0), 6), background: '#E2DED5', borderRadius: 3 }} />
      {show && <div style={{ ...abs(cx(0), yIcon - 3, (nw + gap) * pi, 6), background: C.claude, borderRadius: 3 }} />}
      {N.map((n, i) => {
        const on = i <= act, cur = i === act;
        return (
          <In key={i} t={t} at={n.at - 0.25} y={30} style={{ ...abs(x0 + i * (nw + gap), yIcon - 62, nw, 250) }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ transform: `scale(${cur ? 1.12 : 1})` }}><Tile k={n.k} s={124} ring={cur ? C.claude : null} /></div>
              <div style={{ fontSize: 27, fontWeight: 800, marginTop: 18, color: on ? C.ink : C.mute, whiteSpace: 'nowrap' }}>{n.t}</div>
              <div style={{ fontSize: 20, color: C.mute, marginTop: 4 }}>{n.s}</div>
            </div>
          </In>
        );
      })}
      {show && <div style={{ ...abs(cx(0) + (nw + gap) * pi - 16, yIcon - 16 - 92, 32, 32), borderRadius: 16, background: C.claude, boxShadow: '0 0 0 10px rgba(217,119,87,.22)' }} />}
      <In t={t} at={N[0].at - 0.3} y={30} style={{ ...abs(x0, 640, nw * 7 + gap * 6, 370) }}>
        <div style={{ width: '100%', height: '100%', background: '#17171D', borderRadius: 22, padding: '22px 30px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 22, lineHeight: 1.62, boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
          <div style={{ color: '#7D8794', fontSize: 18, marginBottom: 6 }}>GitHub Actions · daily.yml · nhật ký chạy</div>
          {N.map((n, i) => t >= n.at - 0.05 && i < 6 ? <div key={i} style={{ color: i === 0 ? '#82AAFF' : '#C3E88D', opacity: P(t, n.at - 0.05, 0.25) }}><span style={{ color: '#5B5F6B' }}>{tms[i]}</span>  {n.log}</div> : null)}
          {t >= N[6].at - 0.05 && <div style={{ color: '#C3E88D', opacity: P(t, N[6].at - 0.05, 0.25) }}><span style={{ color: '#5B5F6B' }}>{tms[6]}</span>  {N[6].log}</div>}
        </div>
      </In>
    </>
  );
};

const HomeScreen = ({ t, at, sw, sh }) => {
  const cols = ['#FF9F0A', '#30D158', '#0A84FF', '#FF375F', '#5E5CE6', '#64D2FF', '#FFD60A', '#BF5AF2', '#8E8E93', '#FF6B35', '#34C759', '#007AFF', '#AF52DE', '#FF2D55', '#5AC8FA', '#A2845E'];
  const g = sw * 0.06, s = (sw - g * 5) / 4;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #2D3A5C 0%, #6B5B95 55%, #D98E73 100%)' }}>
      <div style={{ ...abs(0, sh * 0.055, sw), textAlign: 'center', color: '#fff', fontSize: sw * 0.06, fontWeight: 600 }}>9:41</div>
      {Array.from({ length: 20 }).map((_, i) => {
        const r = Math.floor(i / 4), cc = i % 4, x = g + cc * (s + g), y = sh * 0.13 + r * (s + g * 1.6);
        if (i === 4) {
          const k = SPR(t, at, 0.8);
          return <div key={i} style={{ ...abs(x, y, s, s + 30), opacity: cl(k * 2), transform: `scale(${0.3 + 0.7 * k})` }}><Img src={staticFile('media/dailycast.svg')} style={{ width: s, height: s, borderRadius: s * 0.23, boxShadow: '0 6px 16px rgba(0,0,0,.3)' }} /><div style={{ color: '#fff', fontSize: sw * 0.035, textAlign: 'center', marginTop: 4, fontWeight: 600 }}>DailyCast</div></div>;
        }
        return <div key={i} style={{ ...abs(x, y, s, s), borderRadius: s * 0.23, background: cols[i % cols.length], opacity: 0.85 }} />;
      })}
      <div style={{ ...abs(g, sh - s - g * 2.4, sw - g * 2, s + g * 1.2), borderRadius: s * 0.35, background: 'rgba(255,255,255,.25)' }} />
    </AbsoluteFill>
  );
};

const Phone2 = ({ t, v }) => {
  const c = { mo: W('phone', 'Mở'), cai: W('phone', 'Cài'), mh: W('phone', 'màn'), that: W('phone', 'thật'), nghe: W('phone', 'Nghe'), luyen: W('phone', 'luyện'), doc: W('phone', 'đọc') };
  const ph = v ? { x: 330, y: 330, w: 420 } : { x: 300, y: 95, w: 425 };
  const sw = ph.w * 0.93, sh = ph.w * 2.1 - ph.w * 0.07;
  const s1 = c.cai + 0.3, s3 = c.mh - 0.35, s4 = c.nghe - 0.25, s5 = c.luyen - 0.25, s6 = c.doc - 0.25;
  const bar = sh * 0.085;
  const steps = [['Mở link you.github.io/dailycast', c.mo], ['Bấm “Cài app”', c.cai], ['Biểu tượng trên màn hình chính', c.mh]];
  const feats = [['Podcast có phụ đề song ngữ', c.nghe], ['Chế độ học: luyện từng câu', c.luyen], ['Đọc tin theo chuyên mục', c.doc]];
  const allL = [...steps, ...feats]; const curL = allL.reduce((a, x, i) => (t >= x[1] - 0.2 ? i : a), 0);
  return (
    <>
      <In t={t} at={SB.phone[0] + 0.1} y={70} s={0.95}>
        <Phone x={ph.x} y={ph.y} w={ph.w}>
          {t < s3 && (
            <>
              <div style={{ ...abs(0, bar, sw, sh - bar), overflow: 'hidden' }}><Shot src="m_front" /></div>
              <div style={{ ...abs(0, 0, sw, bar), background: '#F2F2F5', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8, boxSizing: 'border-box' }}><div style={{ background: '#fff', borderRadius: 10, padding: '5px 14px', fontSize: sw * 0.042, color: '#333', display: 'flex', gap: 6, alignItems: 'center' }}><Lock s={13} />you.github.io/dailycast</div></div>
              {t > s1 && <AbsoluteFill style={{ background: `rgba(0,0,0,${0.4 * P(t, s1, 0.3)})` }} />}
              {t > s1 && (
                <div style={{ ...abs(0, sh - sh * 0.36 * P(t, s1, 0.4), sw, sh * 0.36), background: '#fff', borderRadius: '26px 26px 0 0', padding: sw * 0.07, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', gap: sw * 0.045, alignItems: 'center' }}><Img src={staticFile('media/dailycast.svg')} style={{ width: sw * 0.2, height: sw * 0.2, borderRadius: sw * 0.05 }} /><div><div style={{ fontSize: sw * 0.065, fontWeight: 800 }}>Cài DailyCast</div><div style={{ fontSize: sw * 0.042, color: C.mute }}>you.github.io</div></div></div>
                  <div style={{ marginTop: sw * 0.06, height: sw * 0.14, borderRadius: sw * 0.035, background: '#0A84FF', color: '#fff', fontSize: sw * 0.05, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t > s1 + 0.55 && t < s1 + 0.75 ? 0.95 : 1})` }}>Cài đặt</div>
                </div>
              )}
              <Tap t={t} at={c.cai - 0.05} x={sw * 0.79} y={bar + sh * 0.031} s={0.7} />
              <Tap t={t} at={s1 + 0.6} x={sw / 2} y={sh - sw * 0.2} s={0.8} />
            </>
          )}
          {t >= s3 && t < s4 + 0.3 && <AbsoluteFill style={{ opacity: P(t, s3, 0.3) * (1 - P(t, s4, 0.3)) }}><HomeScreen t={t} at={c.mh} sw={sw} sh={sh} /><Tap t={t} at={c.that} x={sw * 0.06 + (sw - sw * 0.3) / 8} y={sh * 0.13 + (sw - sw * 0.3) / 4 + sw * 0.06 * 1.6 + (sw - sw * 0.3) / 8} s={0.8} /></AbsoluteFill>}
          {t >= s4 && t < s5 + 0.3 && <AbsoluteFill style={{ opacity: P(t, s4, 0.35) * (1 - P(t, s5, 0.3)), transform: `scale(${1.15 - 0.15 * P(t, s4, 0.5)})` }}><Shot src="m_listen" /></AbsoluteFill>}
          {t >= s5 && t < s6 + 0.3 && <AbsoluteFill style={{ opacity: P(t, s5, 0.3) * (1 - P(t, s6, 0.3)), background: '#111' }}><Shot src="m_learn" /><div style={{ ...abs(sw * 0.03, sh * (0.37 + 0.155 * Math.min(1, Math.floor((t - s5) / 0.9))), sw * 0.94, sh * 0.15), borderRadius: 12, border: '3px solid #2BB59A', background: 'rgba(43,181,154,.08)' }} /></AbsoluteFill>}
          {t >= s6 && <AbsoluteFill style={{ opacity: P(t, s6, 0.3) }}><Shot src="m_front_long" y={-sw * 3.2 * eio((t - s6 - 0.4) / 3.5)} /></AbsoluteFill>}
        </Phone>
      </In>
      {v ? (
        <>
          <In t={t} at={SB.phone[0] + 0.2}><div style={{ ...abs(0, 215, 1080), textAlign: 'center', fontSize: 54, fontWeight: 800, letterSpacing: -1.3 }}>Cài như <span style={{ color: C.claude }}>app thật</span></div></In>
          <div style={{ ...abs(0, 1245, 1080), display: 'flex', justifyContent: 'center' }}>
            {allL.map(([lab, at], i) => i === curL && <Pop key={i} t={t} at={at - 0.2}><div style={{ padding: '14px 28px', borderRadius: 999, background: i < 3 ? C.ink : '#fff', color: i < 3 ? '#fff' : C.ink, border: i < 3 ? 'none' : `2px solid ${C.claude}`, fontSize: 32, fontWeight: 700, boxShadow: '0 12px 30px rgba(22,22,27,.14)' }}>{i < 3 ? `${i + 1}. ` : ''}{lab}</div></Pop>)}
          </div>
        </>
      ) : (
        <div style={{ ...abs(860, 150, 960) }}>
          <In t={t} at={SB.phone[0] + 0.2}><div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.05 }}>Cài lên điện thoại<br /><span style={{ color: C.claude }}>như app thật</span></div></In>
          <div style={{ marginTop: 40 }}>{steps.map(([lab, at], i) => <In key={i} t={t} at={at - 0.2} x={-30} y={0}><div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 70, opacity: curL === i ? 1 : 0.55 }}><div style={{ width: 46, height: 46, borderRadius: 23, background: C.ink, color: '#fff', fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div><div style={{ fontSize: 31, fontWeight: curL === i ? 700 : 500 }}>{lab}</div></div></In>)}</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 40, flexWrap: 'wrap' }}>{feats.map(([lab, at], i) => <Pop key={i} t={t} at={at - 0.2}><div style={{ padding: '18px 24px', borderRadius: 20, background: '#fff', border: `2px solid ${curL === i + 3 ? C.claude : C.line}`, fontSize: 27, fontWeight: 700, boxShadow: curL === i + 3 ? '0 16px 36px rgba(22,22,27,.12)' : 'none', width: 280 }}>{lab}</div></Pop>)}</div>
        </div>
      )}
    </>
  );
};

const Deep = ({ t, v }) => {
  const c = { sau: W('deep', 'Muốn'), th: W('deep', 'Tổng'), cd: W('deep', 'chủ'), ng: W('deep', 'báo'), gd: W('deep', 'giọng'), nam: W('deep', 'nam'), vp: W('deep', 'Vài'), so: W('deep', 'số') };
  const ph = v ? { x: 330, y: 300, w: 420 } : { x: 1300, y: 95, w: 425 };
  const sw = ph.w * 0.93, sh = ph.w * 2.1 - ph.w * 0.07, fs = sw / 400;
  const open = t > c.th + 0.1;
  const topics = ['Y tế', 'Kinh tế', 'Công nghệ', 'Thế giới', 'Xã hội'];
  const srcs = ['VnExpress', 'Tuổi Trẻ', 'VTV', 'Reuters'];
  const onT = (i) => (i === 0 && t > c.cd) || (i === 2 && t > c.cd + 0.3);
  const onS = (i) => (i === 0 && t > c.ng) || (i === 3 && t > c.ng + 0.3);
  const voices = [['ElevenLabs', 'Nam'], ['ElevenLabs', 'Nữ'], ['Miễn phí', 'Giọng máy']];
  const vSel = t > c.nam ? 0 : t > c.gd + 0.15 ? 1 : -1;
  const prog = ['Gom tin', 'Claude viết', 'Giọng ElevenLabs', 'Đăng số mới']; const pStart = c.vp - 0.1, pEnd = c.so - 0.1;
  const opts = [['Chủ đề', 'Y tế · Công nghệ', c.cd], ['Báo', 'VnExpress · Reuters …', c.ng], ['Giọng đọc', 'ElevenLabs · nam hoặc nữ', c.gd]];
  const curO = opts.reduce((a, o, i) => (t >= o[2] - 0.15 ? i : a), -1);
  const lab = (x) => <div style={{ fontSize: 14 * fs, fontWeight: 700, marginTop: 16 * fs, letterSpacing: 1, color: '#555' }}>{x}</div>;
  const chip = (x, on) => <div key={x} style={{ padding: `${6 * fs}px ${12 * fs}px`, borderRadius: 999, fontSize: 15 * fs, fontWeight: 600, background: on ? '#121212' : '#fff', color: on ? '#fff' : C.ink, border: '1.5px solid #D9D4C8' }}>{x}</div>;
  return (
    <>
      {v ? (
        <>
          <In t={t} at={SB.deep[0] + 0.2}><div style={{ ...abs(0, 215, 1080), textAlign: 'center', fontSize: 50, fontWeight: 800, letterSpacing: -1.2 }}>Bấm <span style={{ color: C.claude }}>Tổng hợp ngay</span></div></In>
          <div style={{ ...abs(0, 1245, 1080), display: 'flex', justifyContent: 'center' }}>
            {opts.map(([a, b, at], i) => i === curO && <Pop key={i} t={t} at={at - 0.15}><div style={{ padding: '14px 28px', borderRadius: 999, background: '#fff', border: `2px solid ${C.claude}`, fontSize: 32, fontWeight: 700, boxShadow: '0 12px 30px rgba(22,22,27,.14)' }}>{a}: <span style={{ color: C.claude }}>{b}</span></div></Pop>)}
          </div>
        </>
      ) : (
        <div style={{ ...abs(150, 170, 1050) }}>
          <In t={t} at={SB.deep[0] + 0.2}><div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.05 }}>Tổng hợp <span style={{ color: C.claude }}>theo ý bạn</span></div></In>
          <In t={t} at={c.th - 0.1}><div style={{ fontSize: 30, color: C.mute, marginTop: 14 }}>Một nút bấm trên app, GitHub Actions làm phần còn lại</div></In>
          <div style={{ marginTop: 40 }}>
            {opts.map(([a, b, at], i) => (
              <In key={i} t={t} at={at - 0.15} x={-30} y={0}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, height: 104, marginBottom: 14, padding: '0 26px', borderRadius: 22, background: '#fff', border: `2px solid ${curO === i ? C.claude : C.line}`, boxShadow: curO === i ? '0 16px 36px rgba(22,22,27,.10)' : 'none', width: 860 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 27, background: curO === i ? C.claude : C.ink, color: '#fff', fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <div><div style={{ fontSize: 30, fontWeight: 800 }}>{a}</div><div style={{ fontSize: 24, color: C.mute }}>{b}</div></div>
                  {i === 2 && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}><ElMark s={48} /><Wave t={t} on={t > c.gd} n={18} h={44} /></div>}
                </div>
              </In>
            ))}
          </div>
          {t > c.so - 0.15 && <Pop t={t} at={c.so - 0.15}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 10, padding: '14px 26px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: 30, fontWeight: 700 }}><Check s={34} bg="#2BB59A" />Số mới đã lên, nghe ngay</div></Pop>}
        </div>
      )}
      <In t={t} at={SB.deep[0] + 0.25} y={60} s={0.95}>
        <Phone x={ph.x} y={ph.y} w={ph.w}>
          <Shot src="m_front" />
          {open && <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * P(t, c.th + 0.1, 0.3)})` }} />}
          {open && (
            <div style={{ ...abs(0, sh - sh * 0.8 * P(t, c.th + 0.1, 0.45), sw, sh * 0.8), background: '#FBF9F4', borderRadius: '28px 28px 0 0', padding: `${24 * fs}px ${22 * fs}px`, boxSizing: 'border-box' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 30 * fs, fontWeight: 700 }}>Tổng hợp ngay</div>
              <div style={{ fontSize: 15 * fs, color: C.mute, marginTop: 4 }}>Chọn chủ đề, nguồn báo và giọng đọc</div>
              {lab('CHỦ ĐỀ')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 * fs, marginTop: 8 * fs }}>{topics.map((x, i) => chip(x, onT(i)))}</div>
              {lab('NGUỒN BÁO')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 * fs, marginTop: 8 * fs }}>{srcs.map((x, i) => chip(x, onS(i)))}</div>
              {lab('GIỌNG ĐỌC')}
              <div style={{ display: 'flex', gap: 7 * fs, marginTop: 8 * fs }}>{voices.map(([a, b], i) => { const on = i === vSel; return <div key={i} style={{ flex: 1, padding: 9 * fs, borderRadius: 12 * fs, border: `2px solid ${on ? '#0E7C6B' : '#D9D4C8'}`, background: on ? '#E7F4F1' : '#fff' }}><div style={{ display: 'flex', alignItems: 'center', gap: 5 * fs, fontSize: 13.5 * fs, fontWeight: 700 }}>{i < 2 && <ElMark s={16 * fs} />}{a}</div><div style={{ fontSize: 13 * fs, color: C.mute }}>{b}</div></div>; })}</div>
              {t < pStart ? (
                <div style={{ marginTop: 20 * fs, height: 48 * fs, borderRadius: 12 * fs, background: '#0E7C6B', color: '#fff', fontSize: 17 * fs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Bắt đầu tổng hợp</div>
              ) : (
                <div style={{ marginTop: 14 * fs }}>{prog.map((x, i) => { const at = lerp(pStart, pEnd, i / prog.length) + 0.1, done = t > at + 0.3; return <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 10 * fs, height: 30 * fs, fontSize: 16 * fs, fontWeight: 600, opacity: t > at ? 1 : 0.35 }}>{done ? <Check s={20 * fs} bg="#0E7C6B" /> : <div style={{ width: 18 * fs, height: 18 * fs, borderRadius: 99, border: `3px solid #CFE8E2`, borderTopColor: '#0E7C6B', transform: `rotate(${t * 400}deg)` }} />}{x}</div>; })}</div>
              )}
            </div>
          )}
          {t > c.so - 0.1 && <div style={{ ...abs(sw * 0.06, ph.w * 0.13 + (1 - P(t, c.so - 0.1, 0.4)) * -60, sw * 0.88), background: '#121212', color: '#fff', borderRadius: 16 * fs, padding: `${12 * fs}px ${16 * fs}px`, display: 'flex', alignItems: 'center', gap: 10 * fs, fontSize: 16 * fs, fontWeight: 700, boxShadow: '0 12px 30px rgba(0,0,0,.3)' }}><Check s={22 * fs} bg="#2BB59A" />Số mới đã sẵn sàng · nghe ngay</div>}
          <Tap t={t} at={c.th - 0.05} x={sw * 0.665} y={sh * 0.031} s={0.7} />
          <Tap t={t} at={c.vp - 0.15} x={sw / 2} y={sh - 70 * fs} s={0.7} />
        </Phone>
      </In>
    </>
  );
};

const Close = ({ t, v }) => {
  const c = { kd: W('close', 'không'), bc: W('close', 'buổi'), con: W('close', 'Còn'), hay: W('close', 'Cứ'), cc: W('close', 'Claude') };
  const q = 'Ý tưởng tiếp theo của bạn là gì?';
  const stats = [['0 đ', 'Chi phí máy chủ', c.kd - 0.2], ['1 buổi chiều', 'Thời gian dựng app', c.bc - 0.2]];
  return (
    <>
      {stats.map(([b, l, at], i) => (
        <div key={i} style={{ ...abs(v ? 90 : 300 + i * 680, v ? 260 + i * 300 : 170, v ? 900 : 640, v ? 260 : 290) }}>
          <Pop t={t} at={at}>
            <div style={{ width: v ? 900 : 640, height: v ? 260 : 290, background: '#fff', borderRadius: 32, border: `1.5px solid ${C.line}`, boxShadow: '0 22px 50px rgba(22,22,27,.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: i === 0 ? 130 : 96, fontWeight: 800, letterSpacing: -4, color: C.claude, lineHeight: 1.05 }}>{b}</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: C.mute, marginTop: 8 }}>{l}</div>
            </div>
          </Pop>
        </div>
      ))}
      <In t={t} at={c.con - 0.2} y={30} style={{ ...abs(v ? 90 : 360, v ? 900 : 540, v ? 900 : 1200, v ? 190 : 150) }}>
        <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 28, border: `2.5px solid ${C.claude}`, boxShadow: '0 22px 50px rgba(217,119,87,.18)', display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', boxSizing: 'border-box' }}>
          <ClaudeMark s={64} spin={t * 20} />
          <div style={{ fontSize: v ? 44 : 48, fontWeight: 700 }}>{typed(q, t, c.con, 16)}<Caret t={t} h={52} /></div>
        </div>
      </In>
      <div style={{ ...abs(0, v ? 1150 : 760, v ? 1080 : 1920), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', gap: 22 }}>{['claude', 'github', 'el'].map((k, i) => <Pop key={k} t={t} at={c.hay + i * 0.1}><Tile k={k} s={v ? 100 : 96} /></Pop>)}</div>
        <In t={t} at={c.cc - 0.1}><div style={{ fontSize: v ? 44 : 46, fontWeight: 800, letterSpacing: -1 }}>Hãy để <span style={{ color: C.claude }}>Claude Code</span> viết nó.</div></In>
      </div>
    </>
  );
};

const Ep2 = ({ t, v }) => {
  const c = { tap: W('ep2', 'tập'), gs: W('ep2', 'Google'), gh: W('ep2', 'GitHub'), bd: W('ep2', 'bộ'), dn: W('ep2', 'doanh'), hen: W('ep2', 'Hẹn') };
  const apps = ['Quản lý khách hàng', 'Báo cáo công việc', 'Kho hàng', 'Đào tạo nội bộ', 'Đặt lịch, duyệt việc'];
  const S = v ? 170 : 170;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: v ? -60 : 40, width: v ? 1000 : 1600 }}>
        <Pop t={t} at={c.tap - 0.15}><div style={{ padding: '12px 34px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: v ? 34 : 32, fontWeight: 800, letterSpacing: 4 }}>TẬP 2 · SẮP RA MẮT</div></Pop>
        <div style={{ display: 'flex', alignItems: 'center', gap: v ? 26 : 40, marginTop: v ? 60 : 44 }}>
          <Pop t={t} at={c.gs - 0.1}><Tile k="sheets" s={S} ring={C.sheet} /></Pop>
          <In t={t} at={c.gs + 0.2}><div style={{ fontSize: 80, fontWeight: 300, color: C.mute }}>+</div></In>
          <Pop t={t} at={c.gh - 0.1}><Tile k="github" s={S} ring={C.gh} /></Pop>
        </div>
        <In t={t} at={c.gs}><div style={{ fontSize: v ? 72 : 86, fontWeight: 800, letterSpacing: -2.5, marginTop: v ? 46 : 36, textAlign: 'center', lineHeight: 1.05 }}>Google Sheet <span style={{ color: C.mute, fontWeight: 400 }}>+</span> GitHub</div></In>
        <In t={t} at={c.bd - 0.1}><div style={{ fontSize: v ? 40 : 40, fontWeight: 600, marginTop: 18, textAlign: 'center' }}>Combo cho <span style={{ color: C.sheet }}>mọi ứng dụng trong doanh nghiệp</span></div></In>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: v ? 54 : 40, maxWidth: v ? 960 : 1500 }}>
          {apps.map((a, i) => <Pop key={a} t={t} at={c.dn - 0.1 + i * 0.12}><div style={{ padding: v ? '14px 24px' : '14px 26px', borderRadius: 16, background: '#fff', border: `1.5px solid ${C.line}`, boxShadow: '0 10px 24px rgba(22,22,27,.08)', fontSize: v ? 30 : 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}><Logo k="sheets" s={30} />{a}</div></Pop>)}
        </div>
        <In t={t} at={c.hen - 0.1}><div style={{ fontSize: v ? 34 : 32, color: C.claude, fontWeight: 700, marginTop: v ? 54 : 40 }}>Hẹn gặp bạn ở tập sau →</div></In>
      </div>
    </AbsoluteFill>
  );
};

const End = ({ t, v }) => {
  const a = tl.endcard;
  const tools = [['claude', 'Claude Code'], ['github', 'GitHub'], ['el', 'ElevenLabs']];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: v ? -120 : -40 }}>
        <Pop t={t} at={a + 0.1}><Img src={staticFile('media/dailycast.svg')} style={{ width: v ? 260 : 220, height: v ? 260 : 220, borderRadius: 56, boxShadow: '0 30px 70px rgba(229,72,77,.35)' }} /></Pop>
        <In t={t} at={a + 0.4}><div style={{ fontSize: v ? 104 : 104, fontWeight: 800, letterSpacing: -3, marginTop: 30 }}>DailyCast</div></In>
        <In t={t} at={a + 0.6}><div style={{ fontSize: v ? 36 : 36, color: C.mute, fontWeight: 500 }}>Tập 1 · Podcast tự đọc báo mỗi sáng</div></In>
        <In t={t} at={a + 1.1}><div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700, color: C.claude, marginTop: v ? 70 : 54 }}>LÀM BẰNG</div></In>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: v ? 18 : 40, marginTop: 22, width: v ? 1040 : 1500 }}>
          {tools.map(([k, n], i) => <Pop key={k} t={t} at={a + 1.3 + i * 0.12}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: v ? 160 : 190 }}><Tile k={k} s={v ? 110 : 100} /><div style={{ fontSize: v ? 24 : 24, fontWeight: 700 }}>{n}</div></div></Pop>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// thanh chương
const CH = [['Ý tưởng', 'trio'], ['Nguyên lý', 'arch'], ['Bước 1', 'step1'], ['Bước 2', 'step2'], ['Bước 3', 'step3'], ['Prompt', 'prompt'], ['Tự vận hành', 'daily'], ['Trên điện thoại', 'phone'], ['Tập 2', 'ep2']];
const Chapters = ({ t, v }) => {
  if (t < SB.trio[0] + 0.2 || t > tl.endcard + 0.3) return null;
  const o = P(t, SB.trio[0] + 0.2, 0.5) * (1 - P(t, tl.endcard - 0.2, 0.4));
  const cur = CH.reduce((a, c, i) => (t >= SB[c[1]][0] + 0.2 ? i : a), 0);
  if (v) {
    return (
      <div style={{ ...abs(0, 120, 1080), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: o }}>
        <div style={{ display: 'flex', gap: 10 }}>{CH.map((c, i) => <div key={i} style={{ width: i === cur ? 44 : 14, height: 14, borderRadius: 7, background: i <= cur ? C.claude : '#D8D4CA' }} />)}</div>
      </div>
    );
  }
  return (
    <div style={{ ...abs(0, 40, 1920), display: 'flex', justifyContent: 'center', gap: 10, opacity: o }}>
      {CH.map(([lab], i) => <div key={i} style={{ padding: '8px 18px', borderRadius: 999, fontSize: 19, fontWeight: 700, background: i === cur ? C.ink : i < cur ? '#fff' : 'transparent', color: i === cur ? '#fff' : i < cur ? C.ink : '#A9A6AE', border: i < cur ? `1px solid ${C.line}` : '1px solid transparent' }}>{i < cur ? '✓ ' : ''}{lab}</div>)}
    </div>
  );
};

// phụ đề (chỉ bản 9:16)
const Subs = ({ t }) => {
  const s = tl.subs.find((x, i) => t >= x.s - 0.08 && t < (tl.subs[i + 1] ? Math.min(tl.subs[i + 1].s - 0.08, x.e + 0.6) : x.e + 0.6));
  if (!s) return null;
  return (
    <div style={{ ...abs(60, 1530, 960), display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(22,22,27,.88)', color: '#fff', borderRadius: 18, padding: '14px 26px', fontSize: 40, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3, textAlign: 'center', maxWidth: 960 }}>{s.t}</div>
    </div>
  );
};

// âm thanh
const Sfx = ({ at, name, vol = 0.3, dur = 2 }) => { const { fps } = useVideoConfig(); return <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(dur * fps)}><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>; };

// ================= TẬP 2 · LearnDesk · phong cách "ra mắt sản phẩm" (nền tối, thiết bị 3D, chữ lớn) =================
const D = { bg: '#05070B', ink: '#F8FAFC', mute: '#94A3B8', teal: '#2DD4BF', teal2: '#0D9488', amber: '#F59E0B', glass: 'rgba(255,255,255,.06)', gline: 'rgba(255,255,255,.13)' };
const GRAD = 'linear-gradient(90deg,#5EEAD4,#2DD4BF 40%,#FBBF24)';
const LdMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><defs><linearGradient id="ldg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2DD4BF" /><stop offset="1" stopColor="#0D9488" /></linearGradient></defs><rect width="100" height="100" rx="26" fill="url(#ldg)" /><path d="M14 40 L50 22 L86 40 L50 58Z" fill="none" stroke="#fff" strokeWidth="7" strokeLinejoin="round" /><path d="M28 48 V66 C40 76 60 76 72 66 V48" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" /></svg>);
const RemotionMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><defs><linearGradient id="rmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4F9CFF" /><stop offset="1" stopColor="#0B5FFF" /></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#rmg)" /><path d="M34 26 L74 50 L34 74Z" fill="#fff" stroke="#fff" strokeWidth="8" strokeLinejoin="round" /></svg>);
const Logo2 = ({ k, s, dark = false }) => {
  if (k === 'drive') return <Img src={staticFile('media/google-drive.svg')} style={{ width: s, height: s * 0.895, display: 'block' }} />;
  if (k === 'ld') return <LdMark s={s} />;
  if (k === 'remotion') return <RemotionMark s={s} />;
  if (k === 'github' && dark) return <Img src={staticFile('media/github-icon.svg')} style={{ width: s, height: s * 0.976, display: 'block', filter: 'invert(1)' }} />;
  return <Logo k={k} s={s} />;
};
const Tile2 = ({ k, s = 110, ring = null, style = {} }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.26, background: '#fff', border: `${Math.max(1, s * 0.012)}px solid ${ring || C.line}`, boxShadow: '0 10px 30px rgba(22,22,27,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}><Logo2 k={k} s={s * 0.58} /></div>
);
const Glass = ({ k, s = 120, glow = D.teal, on = true, style = {} }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.28, background: 'linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', border: `1.5px solid ${on ? glow : D.gline}`, boxShadow: on ? `0 0 ${s * 0.5}px ${glow}55, inset 0 1px 0 rgba(255,255,255,.25)` : 'inset 0 1px 0 rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}><Logo2 k={k} s={s * 0.56} dark /></div>
);
const DarkBg = ({ t }) => (
  <AbsoluteFill style={{ background: D.bg, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', width: 1400, height: 1400, left: -400 + Math.sin(t * 0.25) * 140, top: -600 + Math.cos(t * 0.2) * 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,.22), transparent 60%)' }} />
    <div style={{ position: 'absolute', width: 1300, height: 1300, right: -500 + Math.cos(t * 0.22) * 120, bottom: -650 + Math.sin(t * 0.18) * 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.16), transparent 60%)' }} />
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: `0 ${t * 8}px`, maskImage: 'radial-gradient(ellipse at 50% 60%, #000 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 60%, #000 20%, transparent 75%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.6) 100%)' }} />
  </AbsoluteFill>
);
// chữ chạy từng từ, mờ → nét
const Kin = ({ t, at, text, size, grad = false, weight = 800, stagger = 0.07, color = D.ink, align = 'left', lh = 1.04 }) => {
  const words = text.split(' ');
  return (
    <div style={{ fontSize: size, fontWeight: weight, letterSpacing: -size * 0.035, lineHeight: lh, textAlign: align, color }}>
      {words.map((w, i) => { const k = P(t, at + i * stagger, 0.55); return <span key={i} style={{ display: 'inline-block', marginRight: size * 0.24, opacity: k, filter: `blur(${(1 - k) * 12}px)`, transform: `translateY(${(1 - k) * size * 0.35}px)`, ...(grad ? { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}) }}>{w}</span>; })}
    </div>
  );
};
const Sweep = ({ t, at, d = 1.1 }) => { const k = (t - at) / d; if (k < 0 || k > 1) return null; return <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${k * 140 - 40}%, rgba(255,255,255,.22) ${k * 140 - 25}%, transparent ${k * 140 - 10}%)`, pointerEvents: 'none' }} />; };
const Numeral = ({ t, at, n, v }) => <div style={{ ...abs(v ? 40 : 60, v ? 150 : 40), fontSize: v ? 300 : 360, fontWeight: 800, letterSpacing: -20, color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,.08)', opacity: P(t, at, 0.8), lineHeight: 1 }}>{n}</div>;
const Label = ({ t, at, text, style = {}, color = D.teal }) => <div style={{ ...style, opacity: P(t, at, 0.4), transform: `translateY(${(1 - P(t, at, 0.4)) * 14}px)`, fontSize: style.fontSize || 24, fontWeight: 800, letterSpacing: 5, color }}>{text}</div>;
// điện thoại nghiêng 3D + bóng phản chiếu
const Phone3D = ({ x, y, w, ry = 0, rx = 0, rz = 0, s = 1, children, reflect = true, o = 1 }) => {
  const h = w * 2.1;
  return (
    <div style={{ ...abs(x, y, w, h), perspective: 1800, opacity: o }}>
      <div style={{ width: '100%', height: '100%', transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s})`, transformStyle: 'preserve-3d' }}>
        <Phone x={0} y={0} w={w}>{children}</Phone>
        {reflect && <div style={{ position: 'absolute', left: 0, top: h + 14, width: w, height: h * 0.35, transform: 'scaleY(-1)', opacity: 0.18, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to top, #000, transparent 70%)', maskImage: 'linear-gradient(to top, #000, transparent 70%)' }}><div style={{ position: 'absolute', bottom: 0, width: w, height: h }}><Phone x={0} y={0} w={w}>{children}</Phone></div></div>}
      </div>
    </div>
  );
};
const Laptop = ({ x, y, w, ry = 0, rx = 0, s = 1, children }) => {
  const sh = w * 0.625;
  return (
    <div style={{ ...abs(x, y, w, sh + w * 0.06), perspective: 2200 }}>
      <div style={{ width: '100%', height: '100%', transform: `rotateY(${ry}deg) rotateX(${rx}deg) scale(${s})`, transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: sh, borderRadius: w * 0.02, background: '#0A0C10', padding: w * 0.012, boxSizing: 'border-box', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1.5px #2A2E36' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.008, overflow: 'hidden', background: '#fff' }}>{children}</div>
        </div>
        <div style={{ position: 'absolute', left: -w * 0.06, top: sh, width: w * 1.12, height: w * 0.035, borderRadius: `0 0 ${w * 0.03}px ${w * 0.03}px`, background: 'linear-gradient(#3A3F48, #1A1D22)' }} />
      </div>
    </div>
  );
};
const TEAL = '#0F766E';
// khung bài giảng chuyển động (giống video Remotion), nền ảnh thật
const LessonPlayer = ({ t, at, w, h }) => {
  const u = w / 972; const k = Math.max(0, t - at);
  const items = ['“Giá cao quá”', '“Để tôi suy nghĩ”', '“Đang dùng bên khác”'];
  const bars = [0.4, 0.62, 0.52, 0.85, 0.7];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <Img src={staticFile('media/p_dental.jpg')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + k * 0.012})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,7,11,.92) 0%, rgba(5,7,11,.55) 55%, rgba(5,7,11,.15))' }} />
      <div style={{ position: 'absolute', left: 70 * u, top: 64 * u, color: '#fff' }}>
        <div style={{ fontSize: 18 * u, fontWeight: 800, letterSpacing: 3 * u, color: '#5EEAD4', opacity: P(t, at, 0.4) }}>BÀI 4 · KỸ NĂNG BÁN HÀNG</div>
        <div style={{ fontSize: 60 * u, fontWeight: 800, letterSpacing: -1.5 * u, lineHeight: 1.05, marginTop: 8 * u, clipPath: `inset(0 ${100 - 100 * P(t, at + 0.2, 0.7)}% 0 0)` }}>5 câu từ chối<br />thường gặp</div>
        <div style={{ marginTop: 26 * u, display: 'flex', flexDirection: 'column', gap: 12 * u }}>
          {items.map((x, i) => <div key={i} style={{ display: 'flex', gap: 14 * u, alignItems: 'center', fontSize: 26 * u, fontWeight: 600, opacity: P(t, at + 0.8 + i * 0.35, 0.3), transform: `translateX(${(1 - P(t, at + 0.8 + i * 0.35, 0.4)) * -30 * u}px)` }}><span style={{ width: 36 * u, height: 36 * u, borderRadius: 9 * u, background: '#0D9488', fontSize: 18 * u, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>{x}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 80 * u, bottom: 90 * u, display: 'flex', gap: 14 * u, alignItems: 'flex-end', height: 240 * u }}>
        {bars.map((b, i) => <div key={i} style={{ width: 38 * u, height: `${b * 100 * P(t, at + 0.5 + i * 0.12, 0.6)}%`, borderRadius: `${8 * u}px ${8 * u}px 0 0`, background: i === 3 ? '#F59E0B' : 'rgba(94,234,212,.9)' }} />)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60 * u, display: 'flex', alignItems: 'center', gap: 16 * u, padding: `0 ${24 * u}px`, color: '#fff', fontSize: 18 * u }}>
        <span>❚❚</span><span>{`3:${String(12 + Math.floor(k)).padStart(2, '0')}`}</span>
        <div style={{ flex: 1, height: 5 * u, background: 'rgba(255,255,255,.3)', borderRadius: 3 * u }}><div style={{ width: `${Math.min(95, 38 + k * 1.2)}%`, height: '100%', background: '#2DD4BF', borderRadius: 3 * u }} /></div><span>8:30</span>
      </div>
    </div>
  );
};
const Callout = ({ t, at, x, y, text, side = 'right', len = 120, out }) => {
  const k = P(t, at, 0.45); let o = k; if (out !== undefined) o *= 1 - P(t, out, 0.3); if (o <= 0.01) return null;
  return (
    <div style={{ ...abs(x, y), opacity: o, display: 'flex', alignItems: 'center', flexDirection: side === 'right' ? 'row' : 'row-reverse', transform: side === 'right' ? 'none' : 'translateX(-100%)' }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, background: D.teal, boxShadow: `0 0 0 ${6 + 4 * Math.sin(t * 5)}px rgba(45,212,191,.25)`, flexShrink: 0, transform: 'translate(-8px,0)' }} />
      <div style={{ width: len * k, height: 2, background: `linear-gradient(${side === 'right' ? 90 : 270}deg, ${D.teal}, rgba(45,212,191,.2))` }} />
      <div style={{ padding: '12px 22px', borderRadius: 16, background: 'rgba(15,23,32,.75)', border: `1px solid ${D.gline}`, color: '#fff', fontSize: 28, fontWeight: 700, whiteSpace: 'nowrap', backdropFilter: 'blur(10px)' }}>{text}</div>
    </div>
  );
};

const Hook2 = ({ t, v }) => {
  const c = { nen: W('hook', 'nền'), vid: W('hook', 'video'), kt: W('hook', 'kiểm'), cc: W('hook', 'chứng'), cd: W('hook', 'chủ'), dn: W('hook', 'Doanh'), th: W('hook', 'thầy') };
  const words = [['Học.', c.vid], ['Kiểm tra.', c.kt], ['Chứng chỉ.', c.cc], ['Chủ động.', c.cd]];
  const cur = words.reduce((a, w, i) => (t >= w[1] - 0.15 ? i : a), -1);
  const av = v ? 120 : 110; const rise = (d) => eo(P(t, 0.2 + d, 1.2));
  const cx = v ? 540 : 1450, cy = v ? 540 : 150, pw = v ? 300 : 300;
  return (
    <>
      <div style={{ ...abs(v ? (1080 - av) / 2 : 110, (v ? 20 : 90) + Math.sin(t * 1.6) * 4, av, av) }}>
        <Pop t={t} at={0.15}><div style={{ width: av, height: av, borderRadius: av, background: 'linear-gradient(150deg,#134E4A,#0D9488)', border: '3px solid rgba(255,255,255,.85)', boxShadow: '0 0 40px rgba(45,212,191,.45)', overflow: 'hidden', boxSizing: 'border-box' }}><Img src={staticFile('media/me.png')} style={{ width: '112%', height: '112%', marginLeft: '-6%', marginTop: '2%' }} /></div></Pop>
      </div>
      <div style={{ ...abs(v ? 40 : 110, v ? 170 : 240, v ? 1000 : 900), textAlign: v ? 'center' : 'left' }}>
        <Label t={t} at={0.3} text="TẬP 2 · LEARNDESK" style={{ fontSize: v ? 24 : 24 }} />
        <div style={{ marginTop: 18 }}><Kin t={t} at={c.nen - 0.3} text="Nền tảng" size={v ? 92 : 104} align={v ? 'center' : 'left'} /></div>
        <Kin t={t} at={c.nen + 0.05} text="đào tạo online" size={v ? 92 : 104} grad align={v ? 'center' : 'left'} />
      </div>
      {[['ld_m_lesson', -1], ['ld_m_result', 1], ['ld_m_home', 0]].map(([src, side], i) => {
        const r = rise(i * 0.12 + (side === 0 ? 0.25 : 0)); const spread = side * (v ? 250 : 250) * r;
        return <Phone3D key={src} x={cx - pw / 2 + spread} y={(v ? 520 : 200) + (1 - r) * 420 + (side === 0 ? 0 : 60) + Math.sin(t * 1.2 + i) * 6} w={side === 0 ? pw : pw * 0.86} ry={side * -24 * r} rx={4} o={r}><Shot src={src} /></Phone3D>;
      })}
      <div style={{ ...abs(v ? 0 : 110, v ? 1255 : 560, v ? 1080 : 900), height: v ? 120 : 150, textAlign: v ? 'center' : 'left' }}>
        {words.map(([w, at], i) => { if (i !== cur) return null; const k = P(t, at - 0.15, 0.35); return <div key={w} style={{ position: 'absolute', left: 0, right: 0, fontSize: v ? 96 : 120, fontWeight: 800, letterSpacing: -4, color: i === 3 ? 'transparent' : '#fff', backgroundImage: i === 3 ? GRAD : 'none', WebkitBackgroundClip: 'text', opacity: k, transform: `scale(${1.25 - 0.25 * k})`, transformOrigin: v ? 'center' : 'left', filter: `blur(${(1 - k) * 10}px)` }}>{w}</div>; })}
      </div>
      <div style={{ ...abs(v ? 0 : 110, v ? 1400 : 760, v ? 1080 : 900), display: 'flex', gap: 14, justifyContent: v ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
        {[['Doanh nghiệp', 'đào tạo nội bộ', c.dn], ['Thầy cô', 'lớp học online', c.th]].map(([a, b, at]) => (
          <In key={a} t={t} at={at - 0.15} y={20}><div style={{ padding: '14px 26px', borderRadius: 999, background: D.glass, border: `1px solid ${D.gline}`, color: '#fff', fontSize: v ? 28 : 30, fontWeight: 700 }}>{a} <span style={{ color: D.teal }}>· {b}</span></div></In>
        ))}
      </div>
      <Sweep t={t} at={c.nen + 0.6} />
    </>
  );
};

const Four = ({ t, v }) => {
  const c = { cong: W('four', 'Công'), gh: W('four', 'GitHub'), dr: W('four', 'Drive'), sh: W('four', 'Sheet'), as: W('four', 'Apps'), cau: W('four', 'cầu') };
  const P4 = [
    { k: 'github', n: 'GitHub', r: 'đăng giao diện web', at: c.gh, col: '#E5E7EB' },
    { k: 'drive', n: 'Google Drive', r: 'cất video, tài liệu', at: c.dr, col: '#4285F4' },
    { k: 'sheets', n: 'Google Sheet', r: 'tài khoản · điểm · chứng chỉ', at: c.sh, col: '#22C55E' },
    { k: 'gas', n: 'Apps Script', r: 'cầu nối đọc / ghi', at: c.as, col: '#60A5FA' },
  ];
  const cx = v ? 540 : 960, cy = v ? 820 : 560, R = v ? 330 : 360;
  const slot = (i) => v ? [[cx - 260, cy - 330], [cx + 260, cy - 330], [cx - 260, cy + 330], [cx + 260, cy + 330]][i] : [[cx - 560, cy - 200], [cx + 560, cy - 200], [cx - 560, cy + 200], [cx + 560, cy + 200]][i];
  const act = P4.reduce((a, p, i) => (t >= p.at - 0.15 ? i : a), -1);
  return (
    <>
      <div style={{ ...abs(0, v ? 200 : 110, v ? 1080 : 1920), textAlign: 'center' }}><Kin t={t} at={c.cong - 0.25} text="Bốn mảnh ghép" size={v ? 72 : 88} align="center" /></div>
      {P4.map((p, i) => {
        const [sx, sy] = slot(i); const k = P(t, p.at - 0.15, 0.4); if (k <= 0) return null;
        const settle = eio((t - (p.at + 0.9)) / 0.6); const big = i === act && settle < 1;
        const x = lerp(cx, sx, settle), y = lerp(cy, sy, settle), s = lerp(v ? 1.5 : 1.7, 1, settle);
        return (
          <React.Fragment key={p.k}>
            <svg style={{ ...abs(0, 0, v ? 1080 : 1920, v ? 1920 : 1080), overflow: 'visible', opacity: settle * 0.7 }}><line x1={cx} y1={cy} x2={sx} y2={sy} stroke={p.col} strokeWidth="2" strokeDasharray="6 10" strokeDashoffset={-t * 40} /></svg>
            <div style={{ ...abs(x, y), transform: `translate(-50%,-50%) scale(${s * (0.7 + 0.3 * k)})`, opacity: k, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: 420 }}>
              <Glass k={p.k} s={v ? 150 : 140} glow={p.col} on={i === act} />
              <div style={{ fontSize: v ? 44 : 42, fontWeight: 800, color: '#fff', marginTop: 18 }}>{p.n}</div>
              <div style={{ fontSize: v ? 28 : 26, color: D.mute, marginTop: 4 }}>{p.r}</div>
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ ...abs(cx, cy), transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * P(t, c.cau, 0.5)})`, opacity: P(t, c.as + 1.0, 0.4) }}>
        <div style={{ width: v ? 200 : 210, height: v ? 200 : 210, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,.35), rgba(45,212,191,0) 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ borderRadius: 30, boxShadow: '0 0 60px rgba(45,212,191,.6)' }}><LdMark s={v ? 110 : 116} /></div></div>
      </div>
    </>
  );
};

const Arch2 = ({ t, v }) => {
  const c = { ng: W('arch', 'Nguyên'), hoc: W('arch', 'Người'), goi: W('arch', 'gọi'), as1: W('arch', 'Apps'), kt: W('arch', 'kiểm'), lay: W('arch', 'lấy'), gui: W('arch', 'gửi'), diem: W('arch', 'điểm'), tat: W('arch', 'Tất') };
  const N = v ? { ph: [540, 520], gas: [540, 900], sh: [280, 1220], dr: [800, 1220] } : { ph: [380, 560], gas: [960, 560], sh: [1530, 360], dr: [1530, 760] };
  const curve = (a, b) => { const [x1, y1] = N[a], [x2, y2] = N[b]; return v ? `M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}` : `M${x1} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`; };
  const bez = (a, b, e) => { const [x1, y1] = N[a], [x2, y2] = N[b]; const [c1x, c1y, c2x, c2y] = v ? [x1, (y1 + y2) / 2, x2, (y1 + y2) / 2] : [(x1 + x2) / 2, y1, (x1 + x2) / 2, y2]; const u = 1 - e; return [u * u * u * x1 + 3 * u * u * e * c1x + 3 * u * e * e * c2x + e * e * e * x2, u * u * u * y1 + 3 * u * u * e * c1y + 3 * u * e * e * c2y + e * e * e * y2]; };
  const pulse = (a, b, at, label, col, per = 1.6) => {
    if (t < at) return null; const ph = ((t - at) % per) / per; const e = eio(ph); const [x, y] = bez(a, b, e); const o = P(t, at, 0.3) * cl(Math.min(ph / 0.15, (1 - ph) / 0.15));
    return <><div style={{ ...abs(x - 14, y - 14, 28, 28), borderRadius: 14, background: col, boxShadow: `0 0 30px 10px ${col}88`, opacity: o }} /><div style={{ ...abs(x, y - 56), transform: 'translateX(-50%)', fontSize: v ? 24 : 22, fontWeight: 700, color: '#fff', padding: '6px 14px', borderRadius: 10, background: 'rgba(0,0,0,.55)', border: `1px solid ${col}`, whiteSpace: 'nowrap', opacity: o }}>{label}</div></>;
  };
  const W_ = v ? 1080 : 1920, H_ = v ? 1920 : 1080;
  const panel = (id, title, k, at, rows) => { const [x, y] = N[id]; const w = v ? 460 : 470, h = v ? 250 : 280; return (
    <In t={t} at={at - 0.2} y={30} style={{ ...abs(x - w / 2, y - h / 2, w, h) }}>
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 26, background: 'linear-gradient(160deg, rgba(255,255,255,.1), rgba(255,255,255,.03))', border: `1.5px solid ${D.gline}`, padding: 20, color: '#fff', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Logo2 k={k} s={42} dark /><div style={{ fontSize: 30, fontWeight: 800 }}>{title}</div></div>
        {rows}
      </div>
    </In>); };
  return (
    <>
      <div style={{ ...abs(0, v ? 200 : 100, W_), textAlign: 'center' }}><Kin t={t} at={c.ng - 0.25} text="Cách nó vận hành" size={v ? 70 : 80} align="center" /></div>
      <svg style={{ ...abs(0, 0, W_, H_), overflow: 'visible' }}>
        {[['ph', 'gas', c.goi], ['gas', 'sh', c.kt], ['gas', 'dr', c.lay]].map(([a, b, at]) => <path key={a + b} d={curve(a, b)} stroke="rgba(94,234,212,.45)" strokeWidth="3" fill="none" strokeDasharray="2000" strokeDashoffset={2000 * (1 - P(t, at - 0.2, 0.8))} />)}
      </svg>
      <Phone3D x={N.ph[0] - (v ? 120 : 130)} y={N.ph[1] - (v ? 252 : 273)} w={v ? 240 : 260} ry={v ? 0 : 14} rx={3} reflect={false} o={P(t, c.hoc - 0.2, 0.5)}><Shot src="ld_m_login" /></Phone3D>
      <div style={{ ...abs(N.gas[0], N.gas[1]), transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * P(t, c.as1 - 0.2, 0.5)})`, opacity: P(t, c.as1 - 0.2, 0.4) }}>
        <div style={{ width: 230, height: 230, borderRadius: '50%', background: `radial-gradient(circle, rgba(96,165,250,${0.35 + 0.1 * Math.sin(t * 4)}), transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Glass k="gas" s={130} glow="#60A5FA" /></div>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: 30, fontWeight: 800, marginTop: -10 }}>Apps Script</div>
      </div>
      {panel('sh', 'Google Sheet', 'sheets', c.kt, <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>{[['lan.n@congty.vn', 'Học viên'], ['duc.t@congty.vn', 'Học viên'], ['chi.d@congty.vn', 'Quản lý']].map(([a, b], i) => <div key={a} style={{ display: 'flex', fontFamily: MONO, fontSize: 18, padding: '7px 12px', borderRadius: 8, background: i === 0 && t > c.kt + 0.6 ? 'rgba(34,197,94,.25)' : 'rgba(255,255,255,.05)' }}><span>{a}</span><span style={{ marginLeft: 'auto', color: D.mute }}>{b}</span></div>)}</div>)}
      {panel('dr', 'Google Drive', 'drive', c.lay, <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>{['dental', 'tooth', 'whitening'].map((p, i) => <div key={p} style={{ flex: 1, height: v ? 130 : 150, borderRadius: 12, overflow: 'hidden', position: 'relative', outline: i === 0 && t > c.lay + 0.6 ? `3px solid ${D.teal}` : 'none' }}><Img src={staticFile(`media/p_${p}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><div style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 14, fontWeight: 800, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '2px 6px', borderRadius: 5 }}>MP4</div></div>)}</div>)}
      {pulse('ph', 'gas', c.goi, 'đăng nhập', D.teal)}
      {pulse('gas', 'sh', c.kt + 0.15, 'kiểm tra tài khoản', '#22C55E')}
      {pulse('gas', 'dr', c.lay + 0.15, 'lấy video', '#4285F4')}
      {pulse('gas', 'ph', c.gui, 'bài học', '#60A5FA')}
      {pulse('ph', 'sh', c.diem, 'điểm số', D.amber, 2)}
      <div style={{ ...abs(0, v ? 1450 : 920, W_), display: 'flex', justifyContent: 'center' }}>
        <Pop t={t} at={c.tat}><div style={{ display: 'flex', alignItems: 'baseline', gap: 18, color: '#fff' }}><span style={{ fontSize: v ? 84 : 96, fontWeight: 800, letterSpacing: -3, backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>0 đ</span><span style={{ fontSize: v ? 34 : 38, fontWeight: 700 }}>máy chủ riêng</span></div></Pop>
      </div>
    </>
  );
};

const Step1b = ({ t, v }) => {
  const c = { bt: W('step1', 'Bắt'), chuan: W('step1', 'chuẩn'), thu: W('step1', 'thư'), file: W('step1', 'file'), kh: W('step1', 'khoá'), ch: W('step1', 'câu'), nh: W('step1', 'người'), kq: W('step1', 'kết') };
  const files = [['dental', 'Bài 1 · Vì sao khách từ chối.mp4'], ['care', 'Bài 2 · Lắng nghe bác sĩ.mp4'], ['tooth', 'Bài 3 · Vật liệu trám.mp4'], [null, 'Tài liệu · Mô hình LAER.pdf'], ['whitening', 'Bài 4 · Tư vấn tẩy trắng.mp4'], ['inspect', 'Bài 5 · Kiểm soát chất lượng.mp4']];
  const B = c.file - 0.2; const sk = eio((t - B) / 0.8);
  const tabs = [['Khoá học', c.kh, [['KN01', 'Tư vấn bán hàng phòng khám'], ['SP03', 'Vật liệu trám composite'], ['QT02', 'Kiểm soát chất lượng']]], ['Câu hỏi', c.ch, [['KN01', 'Bước đầu của mô hình LAER?'], ['KN01', 'Bác sĩ nói “giá cao” thì…'], ['SP03', 'Ưu điểm composite nano?']]], ['Người học', c.nh, [['lan.n', 'Nguyễn Thị Lan · Kinh doanh'], ['duc.t', 'Trần Minh Đức · Kinh doanh'], ['chi.d', 'Đặng Mai Chi · Đào tạo']]], ['Kết quả', c.kq, [['lan.n', 'KN01 · 9/10 · LD-2026-0417'], ['chi.d', 'KN01 · 10/10 · LD-2026-0418'], ['anh.l', 'SP03 · 8/10 · LD-2026-0402']]]];
  const act = tabs.reduce((a, x, i) => (t >= x[1] - 0.15 ? i : a), 0);
  const cols = v ? 2 : 3, cw = v ? 420 : 400, chh = v ? 300 : 260, gx = v ? 40 : 40;
  const gw = cols * cw + (cols - 1) * gx, x0 = ((v ? 1080 : 1920) - gw) / 2, y0 = v ? 470 : 300;
  return (
    <>
      <Numeral t={t} at={c.bt} n="01" v={v} />
      <div style={{ ...abs(v ? 60 : 120, v ? 220 : 90) }}><Label t={t} at={c.bt} text="BƯỚC MỘT" /><div style={{ marginTop: 10 }}><Kin t={t} at={c.chuan - 0.1} text="Chuẩn bị kho dữ liệu" size={v ? 64 : 72} /></div></div>
      {t < B + 0.8 && <div style={{ position: 'absolute', inset: 0, opacity: 1 - sk, perspective: 2000 }}>
        <div style={{ ...abs(x0, y0 - 60), display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 30, fontWeight: 700, opacity: P(t, c.thu - 0.2, 0.4) }}><Logo2 k="drive" s={44} />Drive › LearnDesk › Bài giảng</div>
        <div style={{ position: 'absolute', inset: 0, transform: `rotateX(${18 - 18 * P(t, c.thu, 1.2)}deg)`, transformOrigin: '50% 60%' }}>
          {files.map(([p, n], i) => {
            const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (chh + 30); const k = P(t, c.thu - 0.2 + i * 0.12, 0.6);
            return <div key={n} style={{ ...abs(x, y - (1 - k) * 260, cw, chh), opacity: k, borderRadius: 22, overflow: 'hidden', background: 'rgba(255,255,255,.06)', border: `1px solid ${D.gline}`, boxShadow: '0 30px 60px rgba(0,0,0,.45)', transform: `rotate(${(1 - k) * (i % 2 ? 6 : -6)}deg)` }}>
              <div style={{ height: chh - 64, position: 'relative', background: '#fff' }}>{p ? <Img src={staticFile(`media/p_${p}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Img src={staticFile('media/ft_pdf2.svg')} style={{ width: 90, height: 90 }} /></div>}{p && <div style={{ position: 'absolute', left: '50%', top: '50%', width: 60, height: 60, marginLeft: -30, marginTop: -30, borderRadius: 30, background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</div>}</div>
              <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 16px', color: '#fff', fontSize: v ? 22 : 20, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
            </div>;
          })}
        </div>
      </div>}
      {t > B && <div style={{ position: 'absolute', inset: 0, opacity: sk }}>
        <div style={{ ...abs(v ? 60 : 120, v ? 430 : 250), display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 30, fontWeight: 700 }}><Logo2 k="sheets" s={34} />Google Sheet · LearnDesk</div>
        {tabs.map(([name, at, rows], i) => {
          const on = i === act; const depth = i - act; const k = P(t, B + i * 0.12, 0.5);
          const bx = v ? 90 : 520, by = v ? 560 : 330, bw = v ? 900 : 1000, bh = v ? 420 : 400;
          return <div key={name} style={{ ...abs(bx + depth * (v ? 0 : 40) + (depth < 0 ? -2000 : 0), by + depth * (v ? 60 : 50), bw, bh), opacity: k * (depth < 0 ? 0 : 1 - Math.min(depth, 3) * 0.22), transform: `scale(${1 - Math.max(0, depth) * 0.05})`, zIndex: 10 - Math.abs(depth), borderRadius: 24, background: on ? 'linear-gradient(160deg,#10231F,#0B1512)' : 'rgba(255,255,255,.05)', border: `1.5px solid ${on ? '#22C55E' : D.gline}`, boxShadow: on ? '0 30px 80px rgba(0,0,0,.6), 0 0 40px rgba(34,197,94,.25)' : 'none', padding: 28, boxSizing: 'border-box', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: '8px 18px', borderRadius: 10, background: on ? '#22C55E' : 'rgba(255,255,255,.1)', color: on ? '#04140B' : '#fff', fontSize: 26, fontWeight: 800 }}>{name}</div><div style={{ color: D.mute, fontSize: 22 }}>trang {i + 1}/4</div></div>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>{rows.map(([a, b], j) => <div key={j} style={{ display: 'flex', gap: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,.06)', fontSize: v ? 25 : 24, opacity: on ? P(t, at + j * 0.1, 0.3) : 0.6 }}><span style={{ fontFamily: MONO, color: '#86EFAC', width: v ? 110 : 120 }}>{a}</span><span>{b}</span></div>)}</div>
          </div>;
        })}
      </div>}
    </>
  );
};

const FILES2 = {
  'quiz.js': ["const qs = shuffle(await api('questions', { course }));", 'startTimer(10 * 60);                  // 10 phút', 'function grade(answers) {', '  const right = answers.filter((a, i) => a === qs[i].key).length;', '  return { score: right, pass: right >= 8 };', '}'],
  'Code.gs': ['function doGet(e) {', '  const user = checkUser(e.parameter.token);  // Sheet', "  return out(listCourses(user));             // Sheet + Drive", '}', 'function doPost(e) {', '  const r = JSON.parse(e.postData.contents);', "  SS.getSheetByName('ketqua').appendRow([r.email, r.score]);", '  return out({ ok: true, cert: makeCert(r) });', '}'],
};
const Step2b = ({ t, v }) => {
  const c = { b2: W('step2', 'Bước'), nho: W('step2', 'nhờ'), gd: W('step2', 'Giao'), lam: W('step2', 'làm'), cc: W('step2', 'chứng'), day: W('step2', 'đẩy'), as: W('step2', 'Apps'), tk: W('step2', 'triển'), link: W('step2', 'link') };
  const chips = [['index.html', c.gd, 'gh'], ['quiz.js', c.lam, 'gh'], ['cert.js', c.cc, 'gh'], ['Code.gs', c.as, 'gas']];
  const tw = v ? 960 : 980, th = v ? 520 : 520, tx = v ? 60 : 120, ty = v ? 560 : 330;
  const ghP = v ? [300, 1290] : [1420, 330], gasP = v ? [780, 1290] : [1420, 700];
  const file = t < c.as - 0.1 ? 'quiz.js' : 'Code.gs'; const fAt = file === 'quiz.js' ? c.gd : c.as;
  return (
    <>
      <Numeral t={t} at={c.b2} n="02" v={v} />
      <div style={{ ...abs(v ? 60 : 120, v ? 220 : 90) }}><Label t={t} at={c.b2} text="BƯỚC HAI" color={C.claude} /><div style={{ marginTop: 10 }}><Kin t={t} at={c.nho - 0.1} text="Claude Code viết code" size={v ? 64 : 72} /></div></div>
      <In t={t} at={c.nho - 0.2} y={40} style={{ ...abs(tx, ty, tw, th), perspective: 2000 }}>
        <div style={{ width: '100%', height: '100%', transform: v ? 'none' : 'rotateY(8deg)', borderRadius: 22, background: 'rgba(12,14,18,.92)', border: `1px solid ${D.gline}`, boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 60px rgba(217,119,87,.18)', overflow: 'hidden' }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: `1px solid ${D.gline}`, color: '#E5E7EB', fontSize: 21, fontWeight: 700 }}><ClaudeMark s={30} spin={t * 30} />Claude Code<span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 17, color: D.mute }}>{file}</span></div>
          <div style={{ padding: '18px 10px' }}><Code key={file} lines={FILES2[file]} t={t} at={fAt + 0.1} cps={160} fs={v ? 21 : 20} theme="dark" /></div>
        </div>
      </In>
      {[['github', ghP, c.day, 'GitHub Pages'], ['gas', gasP, c.as, 'Apps Script']].map(([k, [x, y], at, n]) => (
        <div key={k} style={{ ...abs(x - 80, y - 80), opacity: P(t, at - 0.6, 0.4), display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160 }}>
          <Glass k={k} s={140} glow={k === 'gas' ? '#60A5FA' : '#E5E7EB'} on={t > at} /><div style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginTop: 12, whiteSpace: 'nowrap' }}>{n}</div>
        </div>
      ))}
      {chips.map(([n, at, dest], i) => {
        const [dx, dy] = dest === 'gas' ? gasP : ghP; const sx = v ? tx + tw * (0.2 + i * 0.2) : tx + tw + 110, sy = v ? ty + th + 40 : ty + 60 + i * 110;
        const go = dest === 'gas' ? c.tk : c.day; const e = eio((t - go - i * 0.08) / 0.7);
        const x = lerp(sx, dx, cl(e)), y = lerp(sy, dy, cl(e)); const k = P(t, at, 0.35);
        if (k <= 0 || e >= 1) return null;
        return <div key={n} style={{ ...abs(x, y), transform: `translate(-50%,-50%) scale(${1 - 0.5 * cl(e)})`, opacity: k * (1 - Math.max(0, e - 0.8) * 5), padding: '12px 20px', borderRadius: 14, background: 'rgba(217,119,87,.18)', border: `1.5px solid ${C.claude}`, color: '#fff', fontFamily: MONO, fontSize: 24, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(217,119,87,.35)' }}>{n}</div>;
      })}
      <div style={{ ...abs(0, v ? 1460 : 940, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}>
        <Pop t={t} at={c.link - 0.1}><div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 999, background: 'rgba(96,165,250,.14)', border: '1.5px solid #60A5FA', color: '#fff', fontFamily: MONO, fontSize: v ? 24 : 26, boxShadow: '0 0 40px rgba(96,165,250,.35)' }}><Check s={30} bg="#22C55E" />script.google.com/…/exec</div></Pop>
      </div>
    </>
  );
};

const Learner = ({ t, v }) => {
  const c = { gio: W('learner', 'Giờ'), dn: W('learner', 'Đăng'), tc: W('learner', 'trang'), kh: W('learner', 'khoá'), sp: W('learner', 'kiến'), qt: W('learner', 'quy'), kn: W('learner', 'kỹ') };
  const pw = v ? 470 : 430, px = (v ? 540 : 960) - pw / 2, py = v ? 420 : 70; const u = pw * 0.93 / 400;
  const home = t > c.tc - 0.3; const ry = Math.sin(t * 0.6) * 6 - 4;
  return (
    <>
      <div style={{ ...abs(v ? 0 : 110, v ? 210 : 120, v ? 1080 : 560), textAlign: v ? 'center' : 'left' }}><Label t={t} at={c.gio} text="NGƯỜI HỌC" /><div style={{ marginTop: 10 }}><Kin t={t} at={c.gio} text={v ? 'Mở app là học' : 'Mở app là học ngay'} size={v ? 64 : 76} align={v ? 'center' : 'left'} /></div></div>
      <Phone3D x={px} y={py} w={pw} ry={ry} rx={3} reflect={!v}>
        <Shot src="ld_m_login" o={1 - P(t, c.tc - 0.3, 0.35)} />
        {home && <AbsoluteFill style={{ opacity: P(t, c.tc - 0.3, 0.35), transform: `scale(${1.08 - 0.08 * P(t, c.tc - 0.3, 0.6)})` }}><Shot src="ld_m_home" /></AbsoluteFill>}
        <Tap t={t} at={c.dn + 0.3} x={200 * u} y={770 * u} s={0.9} />
      </Phone3D>
      <Callout t={t} at={c.dn} x={v ? px + 40 : px - 20} y={v ? py - 50 : py + 640} side={v ? 'right' : 'left'} len={v ? 40 : 90} text="Tài khoản được cấp sẵn" out={c.tc - 0.2} />
      <Callout t={t} at={c.tc} x={v ? px + pw - 40 : px + pw + 20} y={v ? py + 180 * u + 60 : py + 220} side={v ? 'left' : 'right'} len={v ? 40 : 100} text="Bài đang học dở · 62%" />
      <Callout t={t} at={c.kh} x={v ? px + 40 : px - 20} y={v ? py + pw * 2.1 + 40 : py + 600} side={v ? 'right' : 'left'} len={v ? 40 : 100} text="Khoá theo nhóm" />
      <div style={{ ...abs(v ? 0 : 1420, v ? 1520 : 640, v ? 1080 : 440), display: 'flex', flexDirection: v ? 'row' : 'column', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[['Kiến thức sản phẩm', c.sp, 'tooth'], ['Quy trình', c.qt, 'inspect'], ['Kỹ năng bán hàng', c.kn, 'care']].map(([l, at, p]) => <Pop key={l} t={t} at={at - 0.1}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 20px 8px 8px', borderRadius: 999, background: D.glass, border: `1px solid ${D.gline}`, color: '#fff', fontSize: v ? 24 : 26, fontWeight: 700 }}><Img src={staticFile(`media/p_${p}.jpg`)} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />{l}</div></Pop>)}
      </div>
    </>
  );
};

const Lesson = ({ t, v }) => {
  const c = { bam: W('lesson', 'Bấm'), vid: W('lesson', 'video'), dr: W('lesson', 'Drive'), tl: W('lesson', 'tài'), ch: W('lesson', 'chương'), hoc: W('lesson', 'Học'), luu: W('lesson', 'lưu') };
  const push = P(t, SB.lesson[0], 6);
  if (v) {
    const lw = 980, lx = 50, ly = 470, sc = lw * 0.976 / 1440;
    return (
      <>
        <div style={{ ...abs(0, 210, 1080), textAlign: 'center' }}><Kin t={t} at={c.bam - 0.1} text="Bấm là học" size={66} align="center" /></div>
        <Laptop x={lx} y={ly} w={lw} rx={8} s={0.98 + push * 0.04}>
          <Img src={staticFile('media/ld_d_lesson.jpg')} style={{ width: '100%', display: 'block' }} />
          <div style={{ ...abs(272 * sc, 26 * sc, 732 * sc, 412 * sc), borderRadius: 22 * sc, overflow: 'hidden' }}><LessonPlayer t={t} at={c.vid} w={732 * sc} h={412 * sc} /></div>
        </Laptop>
        <div style={{ ...abs(0, 1150, 1080), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {[['Video phát ngay từ Drive', c.dr], ['Tài liệu PDF · danh sách chương', c.tl], ['Tự lưu tiến độ', c.luu]].map(([l, at]) => <In key={l} t={t} at={at - 0.2} y={16}><div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 34, fontWeight: 700 }}><Check s={36} bg={D.teal2} />{l}</div></In>)}
        </div>
      </>
    );
  }
  const lw = 1240, lx = 340, ly = 170, sc = lw * 0.976 / 1440;
  return (
    <>
      <Laptop x={lx} y={ly} w={lw} ry={-6 + push * 4} rx={6} s={0.96 + push * 0.06}>
        <Img src={staticFile('media/ld_d_lesson.jpg')} style={{ width: '100%', display: 'block' }} />
        <div style={{ ...abs(272 * sc, 26 * sc, 732 * sc, 412 * sc), borderRadius: 22 * sc, overflow: 'hidden' }}><LessonPlayer t={t} at={c.vid} w={732 * sc} h={412 * sc} /></div>
        <Sweep t={t} at={c.vid + 0.2} />
      </Laptop>
      <Callout t={t} at={c.dr - 0.1} x={lx + 260} y={ly + 520} side="left" len={110} text="Video phát ngay từ Drive" />
      <Callout t={t} at={c.ch - 0.2} x={lx + lw - 150} y={ly + 140} side="right" len={80} text="Tài liệu · danh sách chương" />
      <Callout t={t} at={c.luu - 0.2} x={lx + 320} y={ly + 120} side="left" len={140} text="Tự lưu tiến độ" />
    </>
  );
};

const QUIZ_OPTS = ['Giảm giá ngay để chốt đơn', 'Lắng nghe, ghi nhận băn khoăn', 'Gửi thêm catalogue qua email', 'Hẹn gọi lại vào tuần sau'];
const Quiz = ({ t, v }) => {
  const c = { hx: W('quiz', 'Học'), kt: W('quiz', 'kiểm'), dao: W('quiz', 'đảo'), gh: W('quiz', 'giới'), cham: W('quiz', 'chấm') };
  const sh = eio((t - c.dao) / 0.9); const ord0 = [0, 1, 2, 3], ord1 = [2, 0, 3, 1];
  const pos = (slot) => v ? [90, 760 + slot * 150] : [(slot % 2) * 820 + 140, 560 + Math.floor(slot / 2) * 170];
  const ow = v ? 900 : 780, oh = v ? 124 : 140;
  const secs = 600 - Math.max(0, Math.floor((t - c.gh) * 9)); const ringK = cl((t - c.gh) / 4);
  const graded = t > c.cham; const pick = t > c.gh + 0.8;
  return (
    <>
      <div style={{ ...abs(v ? 60 : 140, v ? 230 : 110, v ? 960 : 1300) }}>
        <Label t={t} at={c.hx} text="CÂU 3 / 10" />
        <div style={{ marginTop: 14 }}><Kin t={t} at={c.kt - 0.3} text="Bác sĩ nói “Để tôi suy nghĩ thêm”. Bạn làm gì trước tiên?" size={v ? 56 : 62} stagger={0.04} lh={1.15} /></div>
      </div>
      <div style={{ ...abs(v ? 800 : 1600, v ? 120 : 120, 170, 170), opacity: P(t, c.gh - 0.2, 0.4) }}>
        <svg width="170" height="170" viewBox="0 0 170 170"><circle cx="85" cy="85" r="74" stroke="rgba(255,255,255,.12)" strokeWidth="10" fill="none" /><circle cx="85" cy="85" r="74" stroke={D.amber} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={465} strokeDashoffset={465 * ringK * 0.25} transform="rotate(-90 85 85)" /></svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 36, fontWeight: 800, fontFamily: MONO }}>{`${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`}</div>
      </div>
      {QUIZ_OPTS.map((l, i) => {
        const a = pos(ord0.indexOf(i)), b = pos(ord1.indexOf(i)); const e = cl(sh); const arc = Math.sin(e * Math.PI) * (i % 2 ? 60 : -60);
        const x = lerp(a[0], b[0], e) + (v ? arc : 0), y = lerp(a[1], b[1], e) + (v ? 0 : arc); const k = P(t, c.kt + i * 0.1, 0.4);
        const sel = pick && i === 1, ok = graded && i === 1; const slotNow = Math.round(lerp(ord0.indexOf(i), ord1.indexOf(i), e));
        return <div key={i} style={{ ...abs(x, y, ow, oh), opacity: k * (graded && !ok ? 0.45 : 1), display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', boxSizing: 'border-box', borderRadius: 26, background: ok ? 'rgba(34,197,94,.2)' : sel ? 'rgba(45,212,191,.16)' : 'rgba(255,255,255,.06)', border: `2px solid ${ok ? '#22C55E' : sel ? D.teal : D.gline}`, color: '#fff', fontSize: v ? 34 : 34, fontWeight: 700, boxShadow: ok ? '0 0 50px rgba(34,197,94,.35)' : 'none', transform: `scale(${ok ? 1 + 0.04 * SPR(t, c.cham, 0.6) : 1})` }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: ok ? '#22C55E' : sel ? D.teal : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: ok || sel ? '#04140B' : '#fff', flexShrink: 0 }}>{'ABCD'[slotNow]}</div>{l}
        </div>;
      })}
      <Label t={t} at={c.dao} text="↻ ĐẢO THỨ TỰ" style={{ ...abs(v ? 90 : 140, v ? 690 : 500), fontSize: 22 }} color={D.amber} />
      {graded && <div style={{ ...abs(0, v ? 1390 : 920, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}><Pop t={t} at={c.cham}><div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}><span style={{ fontSize: v ? 110 : 120, fontWeight: 800, letterSpacing: -4, backgroundImage: GRAD, WebkitBackgroundClip: 'text', color: 'transparent' }}>9/10</span><span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>chấm tự động</span></div></Pop></div>}
    </>
  );
};

const Cert = ({ t, v }) => {
  const c = { dat: W('cert', 'Đạt'), cc: W('cert', 'chứng'), ma: W('cert', 'mã'), tai: W('cert', 'tải'), con: W('cert', 'Còn'), ql: W('cert', 'quản'), bang: W('cert', 'bảng') };
  const flip = eio((t - (c.dat - 0.2)) / 1.0); const adm = P(t, c.con - 0.3, 0.8);
  const cw = v ? 900 : 980, ch = cw * 0.62; const cx = v ? 90 : 470 - adm * 330, cy = v ? 470 - adm * 140 : 250;
  const sh = ((t - c.cc) % 2.4) / 2.4;
  const q = [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1];
  const lw = v ? 980 : 1100, sc = lw * 0.976 / 1440;
  return (
    <>
      <div style={{ ...abs(cx, cy, cw, ch), perspective: 2000, opacity: 1 - adm * (v ? 0.65 : 0.35) }}>
        <div style={{ width: '100%', height: '100%', transform: `rotateY(${(1 - flip) * 80 - (v ? 0 : adm * 18)}deg) rotateX(${4 - adm * 4}deg) scale(${1 - adm * 0.25})`, transformOrigin: v ? '50% 0%' : '0% 50%', borderRadius: 34, background: 'linear-gradient(135deg,#0E1622,#1B2533)', border: '2px solid rgba(248,227,163,.55)', boxShadow: '0 50px 120px rgba(0,0,0,.6), 0 0 80px rgba(201,154,46,.18)', padding: cw * 0.06, boxSizing: 'border-box', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 14, border: '1.5px solid rgba(248,227,163,.3)', borderRadius: 26 }} />
          <div style={{ fontSize: cw * 0.024, letterSpacing: cw * 0.006, fontWeight: 800, backgroundImage: 'linear-gradient(90deg,#F8E3A3,#C99A2E)', WebkitBackgroundClip: 'text', color: 'transparent' }}>CHỨNG CHỈ HOÀN THÀNH</div>
          <div style={{ fontSize: cw * 0.07, fontWeight: 800, marginTop: cw * 0.03, letterSpacing: -2 }}>Nguyễn Thị Lan</div>
          <div style={{ fontSize: cw * 0.026, color: '#CBD5E1', marginTop: 8, maxWidth: '70%' }}>đã hoàn thành khoá “Tư vấn bán hàng cho phòng khám nha khoa” · 9/10</div>
          <div style={{ position: 'absolute', right: cw * 0.06, top: cw * 0.06, width: cw * 0.16, height: cw * 0.16, borderRadius: '50%', background: 'conic-gradient(from 30deg,#F8E3A3,#C99A2E,#F8E3A3,#B7862A,#F8E3A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${t * 20}deg)`, boxShadow: '0 0 40px rgba(201,154,46,.5)' }}><div style={{ width: '78%', height: '78%', borderRadius: '50%', background: 'linear-gradient(135deg,#FCE9B2,#D9A93F)' }} /></div>
          <div style={{ position: 'absolute', left: cw * 0.06, bottom: cw * 0.06, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: cw * 0.11, height: cw * 0.11, background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: 5, borderRadius: 8, boxSizing: 'border-box' }}>{q.map((b, i) => <i key={i} style={{ background: b ? '#0B1324' : 'transparent' }} />)}</div>
            <div style={{ fontSize: cw * 0.024, color: '#94A3B8' }}>Mã xác thực<br /><b style={{ color: '#fff', fontSize: cw * 0.032, fontFamily: MONO, boxShadow: t > c.ma ? `0 3px 0 ${D.amber}` : 'none' }}>LD-2026-0417</b></div>
          </div>
          {t > c.cc && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${sh * 160 - 50}%, rgba(255,240,200,.18) ${sh * 160 - 35}%, transparent ${sh * 160 - 20}%)` }} />}
        </div>
      </div>
      {!v && t < c.con && <div style={{ ...abs(1500, 330), display: 'flex', flexDirection: 'column', gap: 18 }}>{[['Mã xác thực riêng', c.ma], ['Tải về PDF', c.tai]].map(([l, at]) => <In key={l} t={t} at={at - 0.2} x={30} y={0}><div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 32, fontWeight: 700 }}><Check s={36} bg={D.teal2} />{l}</div></In>)}</div>}
      {v && <div style={{ ...abs(0, 210, 1080), textAlign: 'center' }}>{t < c.con - 0.3 ? <Kin t={t} at={c.dat - 0.2} text="Đạt là có chứng chỉ" size={62} align="center" /> : <Kin t={t} at={c.con - 0.3} text="Bảng cho quản lý" size={62} align="center" />}</div>}
      {!v && <div style={{ ...abs(110, 90) }}>{t < c.con - 0.3 ? <Kin t={t} at={c.dat - 0.2} text="Đạt là có chứng chỉ" size={66} /> : <Kin t={t} at={c.con - 0.3} text="Người quản lý thấy hết" size={66} />}</div>}
      {adm > 0 && <div style={{ opacity: adm, transform: `translateX(${(1 - adm) * 200}px)` }}>
        <Laptop x={v ? 50 : 720} y={v ? 900 : 260} w={lw} ry={v ? 0 : -10} rx={6}><Img src={staticFile('media/ld_d_admin.jpg')} style={{ width: '100%', display: 'block' }} />{t > c.bang - 0.2 && <div style={{ ...abs(250 * sc, 140 * sc, 1160 * sc, 140 * sc), border: `4px solid ${D.amber}`, borderRadius: 16, opacity: P(t, c.bang - 0.2, 0.3) }} />}</Laptop>
      </div>}
    </>
  );
};

const VideoScene = ({ t, v }) => {
  const c = { vay: W('video', 'Vậy'), cl: W('video', 'Claude'), dua: W('video', 'đưa'), kb: W('video', 'kịch'), rm: W('video', 'Remotion'), chu: W('video', 'chữ'), bd: W('video', 'biểu'), hm: W('video', 'hình'), lt: W('video', 'lồng'), xuat: W('video', 'Xuất'), tha: W('video', 'thả'), moi: W('video', 'mới') };
  const studio = t > c.rm - 0.4;
  const box = v ? { x: 50, y: 470, w: 980, h: 900 } : { x: 170, y: 190, w: 1580, h: 780 }; const CW = box.w, CH = box.h - 52;
  const pv = v ? { x: 20, y: 70, w: CW - 40 } : { x: 510, y: 70, w: 840 }; pv.h = pv.w * 9 / 16;
  const tl0 = 52 + pv.y + pv.h + 10; const tracks = [['Chữ chuyển động', c.chu, '#F59E0B'], ['Biểu đồ', c.bd, '#2DD4BF'], ['Hình minh hoạ', c.hm, '#A78BFA'], ['Lồng tiếng · ElevenLabs', c.lt, '#E5E7EB']];
  const playX = cl((t - c.rm) / 9); const exp = t > c.xuat - 0.1; const ep = cl((t - c.xuat) / 1.0);
  return (
    <>
      <div style={{ ...abs(v ? 0 : 110, v ? 210 : 70, v ? 1080 : 1700), textAlign: v ? 'center' : 'left' }}>{!studio ? <Kin t={t} at={c.vay - 0.2} text="Video bài giảng ở đâu ra?" size={v ? 60 : 70} align={v ? 'center' : 'left'} /> : <Kin t={t} at={c.rm - 0.4} text="Claude Code dựng bằng Remotion" size={v ? 54 : 64} align={v ? 'center' : 'left'} />}</div>
      {!studio ? (
        <In t={t} at={c.cl - 0.2} y={40} style={{ ...abs(v ? 60 : 360, v ? 560 : 330, v ? 960 : 1200, v ? 560 : 440) }}>
          <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 30, background: 'linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.03))', border: `1.5px solid ${C.claude}`, boxShadow: '0 0 60px rgba(217,119,87,.2)', padding: 36, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 700 }}><ClaudeMark s={40} spin={t * 30} />Claude Code</div>
            <In t={t} at={c.dua - 0.1}><div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,.08)', fontSize: 24, fontWeight: 600 }}><Img src={staticFile('media/ft_pdf2.svg')} style={{ width: 34, height: 34 }} />Tai-lieu-LAER.pdf</div></In>
            <div style={{ marginTop: 22, fontSize: v ? 36 : 36, lineHeight: 1.45, fontWeight: 500 }}>{typed('Từ tài liệu này, viết kịch bản và dựng video bài giảng 2 phút bằng Remotion, lồng tiếng ElevenLabs.', t, c.dua, 30)}<Caret t={t} h={40} /></div>
          </div>
        </In>
      ) : (
        <In t={t} at={c.rm - 0.4} y={30} s={0.96} style={{ ...abs(box.x, box.y, box.w, box.h), perspective: 2400 }}>
          <div style={{ width: '100%', height: '100%', transform: v ? 'none' : 'rotateX(6deg)', background: '#0E1014', borderRadius: 22, overflow: 'hidden', boxShadow: '0 50px 120px rgba(0,0,0,.7), 0 0 0 1px #2A2D35', position: 'relative' }}>
            <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: '#16181D', borderBottom: '1px solid #262A31', color: '#E5E7EB', fontSize: 20, fontWeight: 600 }}><RemotionMark s={30} />Remotion Studio<span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 17 }}>{v ? '' : 'Bai-4-Tu-choi · 1920×1080'}</span>
              <div style={{ marginLeft: 16, padding: '8px 16px', borderRadius: 8, background: exp ? '#16A34A' : '#0B5FFF', color: '#fff', fontSize: 17 }}>{exp ? (ep < 1 ? `Đang xuất MP4 ${Math.round(ep * 100)}%` : 'Đã xuất MP4 ✓') : 'Xuất video'}</div></div>
            {!v && <div style={{ ...abs(0, 52, 280, CH), borderRight: '1px solid #262A31', padding: 18, boxSizing: 'border-box', color: '#9CA3AF', fontSize: 17 }}><div style={{ fontWeight: 700, color: '#E5E7EB', marginBottom: 12 }}>Compositions</div>{['Bai-1-Vi-sao', 'Bai-2-Lang-nghe', 'Bai-3-Vat-lieu', 'Bai-4-Tu-choi'].map((x, i) => <div key={x} style={{ padding: '8px 10px', borderRadius: 8, background: i === 3 ? '#1F2A44' : 'transparent', color: i === 3 ? '#fff' : '#9CA3AF', marginBottom: 4 }}>{x}</div>)}</div>}
            <div style={{ ...abs(pv.x, 52 + pv.y - 52 + 14, pv.w, pv.h), borderRadius: 10, overflow: 'hidden' }}><LessonPlayer t={t} at={c.chu - 0.3} w={pv.w} h={pv.h} /></div>
            <div style={{ ...abs(pv.x, tl0, pv.w, CH - tl0 + 52) }}>
              {tracks.map(([l, at, col], i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', height: v ? 54 : 40, gap: 12 }}>
                  <div style={{ width: v ? 300 : 240, color: t > at - 0.1 ? '#fff' : '#6B7280', fontSize: v ? 21 : 17, fontWeight: 600, whiteSpace: 'nowrap' }}>{l}</div>
                  <div style={{ flex: 1, height: v ? 34 : 26, borderRadius: 6, background: '#1A1D23', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: `${i * 8}%`, top: 0, bottom: 0, width: `${(i === 3 ? 90 : 50 + i * 10) * P(t, at - 0.1, 0.5)}%`, background: col, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 6, overflow: 'hidden', boxShadow: t > at - 0.1 && t < at + 0.8 ? `0 0 20px ${col}` : 'none' }}>{i === 3 && Array.from({ length: 70 }).map((_, j) => <div key={j} style={{ width: 3, height: `${30 + 60 * Math.abs(Math.sin(j * 1.3 + t * 3))}%`, background: '#111', opacity: 0.7, flexShrink: 0 }} />)}</div>
                  </div>
                </div>
              ))}
              <div style={{ position: 'absolute', left: `calc(${v ? 312 : 252}px + (100% - ${v ? 312 : 252}px) * ${playX})`, top: -4, bottom: 0, width: 3, background: '#EF4444', boxShadow: '0 0 10px #EF4444' }} />
            </div>
          </div>
        </In>
      )}
      {exp && ep >= 1 && t < c.tha + 0.7 && (() => { const e = eio(cl((t - c.tha) / 0.7)); const sx = box.x + box.w / 2, sy = box.y + box.h / 2, dx = v ? 540 : 1700, dy = v ? 1500 : 880; return <div style={{ ...abs(lerp(sx, dx, e), lerp(sy, dy, e)), transform: `translate(-50%,-50%) scale(${1 - 0.6 * e})`, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 26px', borderRadius: 18, background: '#fff', fontSize: 28, fontWeight: 800, boxShadow: '0 20px 60px rgba(0,0,0,.6)', opacity: 1 - Math.max(0, e - 0.85) * 6 }}><div style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden' }}><Img src={staticFile('media/p_dental.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>bai-4.mp4</div>; })()}
      {t > c.tha - 0.1 && <div style={{ ...abs(v ? 270 : 1480, v ? 1440 : 820) }}><Pop t={t} at={c.tha - 0.1}><div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 26px', borderRadius: 22, background: 'rgba(255,255,255,.08)', border: `1.5px solid ${D.teal}`, boxShadow: '0 0 50px rgba(45,212,191,.3)', color: '#fff' }}><Logo2 k="drive" s={48} /><div><div style={{ fontSize: 26, fontWeight: 800 }}>Drive › Bài giảng</div><div style={{ fontSize: 22, color: D.teal, fontWeight: 700, opacity: P(t, c.moi - 0.2, 0.3) }}>+ 1 bài mới trong khoá học</div></div></div></Pop></div>}
    </>
  );
};

const Uses = ({ t, v }) => {
  const c = { mot: W('uses', 'Một'), hn: W('uses', 'hội'), sp: W('uses', 'kiến'), qt: W('uses', 'quy'), kn: W('uses', 'kỹ'), lop: W('uses', 'lớp') };
  const U = [['meeting', 'Hội nhập', 'nhân viên mới', c.hn], ['tooth', 'Kiến thức', 'sản phẩm', c.sp], ['inspect', 'Quy trình', 'làm việc', c.qt], ['care', 'Kỹ năng', 'bán hàng', c.kn], ['smile', 'Lớp học', 'online của bạn', c.lop]];
  const act = U.reduce((a, u, i) => (t >= u[3] - 0.2 ? i : a), 0);
  if (v) {
    return (
      <>
        <div style={{ ...abs(0, 210, 1080), textAlign: 'center' }}><Kin t={t} at={c.mot - 0.2} text="Một nền tảng," size={66} align="center" /><Kin t={t} at={c.mot + 0.2} text="nhiều cách dùng" size={66} grad align="center" /></div>
        {U.map(([p, a, b, at], i) => {
          const d = i - act; const k = P(t, at - 0.3, 0.5); const x = 540 + d * 560 - 330, y = 470;
          return <div key={p} style={{ ...abs(x, y, 660, 860), opacity: k * (d === 0 ? 1 : 0.35), transform: `scale(${d === 0 ? 1 : 0.86})`, borderRadius: 40, overflow: 'hidden', boxShadow: d === 0 ? '0 40px 100px rgba(0,0,0,.6)' : 'none' }}>
            <Img src={staticFile(`media/p_${p}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.1 * P(t, at - 0.3, 3)})` }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.85))' }} />
            <div style={{ position: 'absolute', left: 40, bottom: 40, color: '#fff' }}><div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{a}</div><div style={{ fontSize: 36, color: '#5EEAD4', fontWeight: 700, marginTop: 6 }}>{b}</div></div>
          </div>;
        })}
      </>
    );
  }
  const cw = 330, gap = 22, x0 = (1920 - (5 * cw + 4 * gap)) / 2;
  return (
    <>
      <div style={{ ...abs(0, 90, 1920), textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 22 }}><Kin t={t} at={c.mot - 0.2} text="Một nền tảng," size={72} /><Kin t={t} at={c.mot + 0.2} text="nhiều cách dùng" size={72} grad /></div>
      {U.map(([p, a, b, at], i) => {
        const k = P(t, at - 0.3, 0.6); const on = i === act; const h = on ? 680 : 560;
        return <div key={p} style={{ ...abs(x0 + i * (cw + gap), 260 + (680 - h) / 2 + (1 - k) * 120, cw, h), opacity: k * (on ? 1 : 0.6), borderRadius: 34, overflow: 'hidden', boxShadow: on ? '0 40px 90px rgba(0,0,0,.6), 0 0 0 2px #2DD4BF' : '0 20px 40px rgba(0,0,0,.4)' }}>
          <Img src={staticFile(`media/p_${p}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.1 * P(t, at - 0.3, 3)})` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.88))' }} />
          <div style={{ position: 'absolute', left: 26, bottom: 28, color: '#fff' }}><div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{a}</div><div style={{ fontSize: 26, color: '#5EEAD4', fontWeight: 700, marginTop: 4 }}>{b}</div></div>
        </div>;
      })}
    </>
  );
};

const CUST = [['Nha khoa Minh Châu', 'Hà Nội · 12 đơn', 'Thân thiết', '#FDE68A'], ['Phòng khám An Phát', 'Đà Nẵng · 5 đơn', 'Mới', '#BFDBFE'], ['Bệnh viện Bình Minh', 'TP.HCM · 8 đơn', 'Tiềm năng', '#DDD6FE']];
const Ep3 = ({ t, v }) => {
  const c = { tap: W('ep3', 'tập'), crm: W('ep3', 'CRM'), tra: W('ep3', 'tra'), ql: W('ep3', 'quản'), dt: W('ep3', 'điện'), hen: W('ep3', 'Hẹn') };
  return (
    <AbsoluteFill>
      <div style={{ ...abs(0, v ? 230 : 120, v ? 1080 : 1920), textAlign: 'center', fontSize: v ? 260 : 300, fontWeight: 800, letterSpacing: -12, color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,.16)', opacity: P(t, c.tap - 0.3, 0.6), lineHeight: 1 }}>TẬP 3</div>
      <div style={{ ...abs(v ? 0 : 140, v ? 540 : 400, v ? 1080 : 900), textAlign: v ? 'center' : 'left' }}>
        <Label t={t} at={c.tap - 0.1} text="SẮP RA MẮT" color={D.amber} />
        <div style={{ marginTop: 10 }}><Kin t={t} at={c.crm - 0.1} text="App CRM" size={v ? 120 : 140} grad align={v ? 'center' : 'left'} /></div>
        <div style={{ marginTop: 14 }}><Kin t={t} at={c.tra - 0.1} text="Tra cứu và quản lý khách hàng ngay trên điện thoại" size={v ? 40 : 42} weight={600} stagger={0.04} align={v ? 'center' : 'left'} lh={1.3} /></div>
      </div>
      <In t={t} at={c.tra} y={60} style={{ ...abs(v ? 150 : 1120, v ? 900 : 300, v ? 780 : 640) }}>
        <div style={{ borderRadius: 34, background: 'linear-gradient(160deg, rgba(255,255,255,.1), rgba(255,255,255,.03))', border: `1.5px solid ${D.gline}`, padding: 26, boxShadow: '0 40px 100px rgba(0,0,0,.6)', color: '#fff' }}>
          <div style={{ height: 66, borderRadius: 18, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 26, color: '#CBD5E1', gap: 12 }}><svg width="26" height="26" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#CBD5E1" strokeWidth="2.5" fill="none" /><path d="M16 16l5 5" stroke="#CBD5E1" strokeWidth="2.5" /></svg>{typed('Minh Châu', t, c.tra + 0.3, 10) || 'Tìm khách hàng…'}</div>
          {CUST.map(([n, d, tag, col], i) => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 8px', borderBottom: i < 2 ? `1px solid ${D.gline}` : 'none', opacity: P(t, c.ql - 0.4 + i * 0.15, 0.3), background: i === 0 && t > c.tra + 1.3 ? 'rgba(45,212,191,.12)' : 'transparent', borderRadius: 14 }}><div style={{ width: 60, height: 60, borderRadius: 30, background: col, color: '#0B1324', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>{n.split(' ').slice(-2).map((x) => x[0]).join('')}</div><div><div style={{ fontSize: 28, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 22, color: D.mute }}>{d}</div></div><div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,.1)', fontSize: 20, fontWeight: 700 }}>{tag}</div></div>)}
        </div>
      </In>
      <div style={{ position: 'absolute', bottom: v ? 330 : 90, left: 0, right: 0, textAlign: 'center' }}><In t={t} at={c.hen - 0.1}><div style={{ fontSize: 36, color: '#fff', fontWeight: 700 }}>Hẹn gặp bạn ở tập sau</div></In></div>
    </AbsoluteFill>
  );
};

const End2 = ({ t, v }) => {
  const a = tl.endcard;
  const tools = [['claude', 'Claude Code'], ['github', 'GitHub'], ['drive', 'Google Drive'], ['sheets', 'Google Sheets'], ['gas', 'Apps Script'], ['remotion', 'Remotion'], ['el', 'ElevenLabs']];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: v ? -120 : -30 }}>
        <Pop t={t} at={a + 0.1}><div style={{ borderRadius: 56, boxShadow: '0 0 120px rgba(45,212,191,.55)' }}><LdMark s={v ? 230 : 190} /></div></Pop>
        <div style={{ marginTop: 26 }}><Kin t={t} at={a + 0.4} text="LearnDesk" size={v ? 100 : 104} align="center" /></div>
        <In t={t} at={a + 0.7}><div style={{ fontSize: 34, color: D.mute, fontWeight: 500 }}>Tập 2 · Nền tảng đào tạo online</div></In>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: v ? 22 : 30, marginTop: v ? 70 : 54, width: v ? 940 : 1600 }}>
          {tools.map(([k, n], i) => <Pop key={k} t={t} at={a + 1.2 + i * 0.1}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: v ? 200 : 180 }}><Glass k={k} s={v ? 104 : 96} on={false} /><div style={{ fontSize: 22, fontWeight: 700, color: '#E5E7EB' }}>{n}</div></div></Pop>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Subs2 = ({ t }) => {
  const s = tl.subs.find((x, i) => t >= x.s - 0.08 && t < (tl.subs[i + 1] ? Math.min(tl.subs[i + 1].s - 0.08, x.e + 0.6) : x.e + 0.6));
  if (!s) return null;
  return <div style={{ ...abs(60, 1600, 960), display: 'flex', justifyContent: 'center' }}><div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', color: '#fff', borderRadius: 18, padding: '14px 26px', fontSize: 40, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3, textAlign: 'center', backdropFilter: 'blur(10px)' }}>{s.t}</div></div>;
};

const SfxTrack2 = () => {
  const L = [];
  ORDER.slice(1).forEach((id) => L.push([SB[id][0], 'whoosh', 0.2]));
  L.push([tl.endcard, 'shimmer', 0.32], [0.2, 'swell', 0.25]);
  ['video', 'kiểm', 'chứng', 'chủ'].forEach((w) => L.push([W('hook', w) - 0.15, 'boom_soft', 0.22]));
  ['GitHub', 'Drive', 'Sheet', 'Apps'].forEach((w) => L.push([W('four', w) - 0.15, 'impact', 0.18]));
  L.push([W('four', 'cầu'), 'shimmer', 0.22], [W('arch', 'Tất'), 'boom_soft', 0.3]);
  ['gọi', 'kiểm', 'lấy', 'gửi', 'điểm'].forEach((w) => L.push([W('arch', w), 'swoosh_short', 0.22]));
  L.push([W('step1', 'thư'), 'whoosh_long', 0.2], [W('step1', 'file') - 0.2, 'swoosh_short', 0.3]);
  ['khoá', 'câu', 'người', 'kết'].forEach((w) => L.push([W('step1', w) - 0.15, 'tick', 0.45]));
  L.push([W('step2', 'đẩy'), 'whoosh', 0.25], [W('step2', 'triển'), 'whoosh', 0.25], [W('step2', 'link') - 0.1, 'success', 0.28]);
  L.push([W('learner', 'Đăng') + 0.3, 'click', 0.45], [W('learner', 'trang') - 0.3, 'whoosh_soft', 0.2]);
  ['kiến', 'quy', 'kỹ'].forEach((w) => L.push([W('learner', w) - 0.1, 'pop', 0.28]));
  L.push([W('lesson', 'video') + 0.2, 'shimmer', 0.2], [W('quiz', 'đảo'), 'whoosh_long', 0.22], [W('quiz', 'giới') + 0.8, 'click', 0.45], [W('quiz', 'chấm'), 'success', 0.3]);
  L.push([W('cert', 'Đạt') - 0.2, 'sparkle', 0.3], [W('cert', 'Còn') - 0.3, 'whoosh', 0.22]);
  L.push([W('video', 'Remotion') - 0.4, 'whoosh', 0.25], [W('video', 'Xuất') - 0.1, 'riser', 0.2], [W('video', 'thả'), 'whoosh_soft', 0.3], [W('video', 'mới') - 0.2, 'ding', 0.28]);
  ['hội', 'kiến', 'quy', 'kỹ', 'lớp'].forEach((w) => L.push([W('uses', w) - 0.3, 'swoosh_short', 0.25]));
  L.push([W('ep3', 'tập') - 0.3, 'boom_soft', 0.3], [W('ep3', 'CRM') - 0.1, 'impact', 0.22]);
  return (<>{L.map(([a, n, vv], i) => <Sfx key={i} at={a} name={n} vol={vv} />)}<Sequence from={Math.round(W('video', 'đưa') * 30)} durationInFrames={75}><Audio src={staticFile('sfx/typing.wav')} volume={0.2} loop /></Sequence></>);
};

export const Main: React.FC<{ v: boolean }> = ({ v }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: D.ink }}>
      <DarkBg t={t} />
      <Scene t={t} id="hook" enter="focus"><Hook2 t={t} v={v} /></Scene>
      <Scene t={t} id="four" enter="zoom"><Four t={t} v={v} /></Scene>
      <Scene t={t} id="arch" enter="focus"><Arch2 t={t} v={v} /></Scene>
      <Scene t={t} id="step1" enter="rise"><Step1b t={t} v={v} /></Scene>
      <Scene t={t} id="step2" enter="right"><Step2b t={t} v={v} /></Scene>
      <Scene t={t} id="learner" enter="zoom"><Learner t={t} v={v} /></Scene>
      <Scene t={t} id="lesson" enter="focus"><Lesson t={t} v={v} /></Scene>
      <Scene t={t} id="quiz" enter="left"><Quiz t={t} v={v} /></Scene>
      <Scene t={t} id="cert" enter="zoom"><Cert t={t} v={v} /></Scene>
      <Scene t={t} id="video" enter="focus"><VideoScene t={t} v={v} /></Scene>
      <Scene t={t} id="uses" enter="right"><Uses t={t} v={v} /></Scene>
      <Scene t={t} id="ep3" enter="zoom"><Ep3 t={t} v={v} /></Scene>
      <Scene t={t} id="end" enter="focus"><End2 t={t} v={v} /></Scene>
      {v && <Subs2 t={t} />}
      <Audio src={staticFile('narration.wav')} />
      <Audio src={staticFile('music.wav')} volume={0.17} />
      <SfxTrack2 />
    </AbsoluteFill>
  );
};

export const ReelThumb: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, overflow: 'hidden' }}>
    <Bg t={0} />
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 62% 58%, rgba(15,118,110,.22), transparent 46%)' }} />
    <div style={{ ...abs(0, 290, 1080), display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ padding: '10px 28px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 3 }}>TẬP 2</div>
      <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: -4, lineHeight: 1.0, marginTop: 26 }}>Tự làm app</div>
      <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: -4, lineHeight: 1.0, color: C.claude }}>đào tạo online</div>
      <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: -1.2, marginTop: 18 }}><span style={{ background: C.ink, color: '#fff', padding: '2px 18px', borderRadius: 16 }}>Học · Kiểm tra · Chứng chỉ</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
        {['drive', 'sheets', 'gas', 'github'].map((k, i) => <React.Fragment key={k}>{i > 0 && <div style={{ fontSize: 40, color: C.mute, fontWeight: 300 }}>+</div>}<Tile2 k={k} s={86} /></React.Fragment>)}
      </div>
    </div>
    <div style={{ ...abs(-40, 880, 820, 820), WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)', maskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)' }}><Img src={staticFile('media/me.png')} style={{ width: '100%', height: '100%' }} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(7deg)', transformOrigin: '830px 1300px' }}>
      <Phone x={660} y={930} w={340}><Shot src="ld_m_home" /></Phone>
    </div>
    <div style={{ ...abs(540, 900) }}><div style={{ padding: '14px 26px', borderRadius: 999, background: '#fff', border: `3px solid ${C.claude}`, fontSize: 34, fontWeight: 800, boxShadow: '0 14px 34px rgba(22,22,27,.18)', transform: 'rotate(-4deg)' }}>Học online · chủ động</div></div>
    <div style={{ ...abs(0, 1700, 1080), textAlign: 'center', fontSize: 32, fontWeight: 700, color: C.mute }}>Drive · Sheet · Apps Script · GitHub</div>
  </AbsoluteFill>
);
