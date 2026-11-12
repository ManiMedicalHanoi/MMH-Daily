// @ts-nocheck
// Tập 4 · Bản chất: video hướng dẫn tự dựng app bằng Claude Code + GitHub + Google Sheet / Drive (Apps Script).
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
const ORDER = ['hook', 'essence', 'roles', 'price', 'travel1', 'travel2', 'tender1', 'tender2', 'brain', 'close'];
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
const Sfx = ({ at, name, vol = 0.3, dur = 2 }) => { const { fps } = useVideoConfig(); return <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(dur * fps)}><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>; };

// ================= TẬP 4 · Bản chất · phong cách "tạp chí / biên tập" =================
import TRIP from './data/trip.json';
const TR: any = TRIP;
const E = { paper: '#F1ECE2', paper2: '#FAF7F1', ink: '#191613', mute: '#7A7268', red: '#C4422B', green: '#2E6B50', blue: '#2C5C8C', gold: '#B4862C', line: '#D9D1C3', violet: '#6B5BD6' };
const SERIF = '"Cormorant Garamond", Georgia, serif';
const UIW4 = { d: [1440, 900], m: [400, 866] };
const camV = (t, keys) => { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t >= b[0]) { v = b[1]; continue; } const d = b[2] || 1.1; if (t > b[0] - d) v = a[1].map((x, j) => lerp(x, b[1][j], eio((t - (b[0] - d)) / d))); break; } return v; };
const UImg = ({ src, view, w, h, o = 1, kind = 'd' }) => { const [W0] = UIW4[kind]; const s = Math.max(w / view[2], h / view[3]); return <Img src={staticFile(`media/${src}.jpg`)} style={{ position: 'absolute', left: -view[0] * s + (w - view[2] * s) / 2, top: -view[1] * s + (h - view[3] * s) / 2, width: W0 * s, opacity: o }} />; };
const UCard = ({ box, layers, radius = 14, children = null }) => (
  <div style={{ ...abs(box[0], box[1], box[2], box[3]), borderRadius: radius, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 70px rgba(40,30,20,.20), 0 0 0 1px rgba(40,30,20,.07)' }}>
    {layers.map((L, i) => L.o > 0.001 ? <UImg key={i} {...L} w={box[2]} h={box[3]} /> : null)}{children}
  </div>
);
const toScr = (box, view, x, y) => { const s = Math.max(box[2] / view[2], box[3] / view[3]); return [box[0] + (x - view[0]) * s + (box[2] - view[2] * s) / 2, box[1] + (y - view[1]) * s + (box[3] - view[3] * s) / 2, s]; };
const Ring = ({ t, at, out = 9999, box, view, r: [x, y, w, h] }) => { const o = P(t, at, 0.35) * (1 - P(t, out, 0.3)); if (o < 0.01) return null; const [sx, sy, s] = toScr(box, view, x, y); return <div style={{ ...abs(sx - 8, sy - 8, w * s + 16, h * s + 16), borderRadius: 14, border: `4px solid ${E.red}`, opacity: o, transform: `scale(${1.06 - 0.06 * P(t, at, 0.4)})`, boxShadow: '0 10px 30px rgba(196,66,43,.25)' }} />; };

// chữ kiểu tạp chí
const Kicker = ({ t, at, x, y, children, color = E.red, size = 24, out = 9999, align = 'left' }) => { const o = P(t, at, 0.45) * (1 - P(t, out, 0.3)); if (o < 0.01) return null; return <div style={{ ...abs(x, y), transform: `translate(${align === 'center' ? '-50%' : '0'}, ${(1 - P(t, at, 0.45)) * 12}px)`, opacity: o, fontSize: size, fontWeight: 800, letterSpacing: size * 0.2, color, whiteSpace: 'nowrap' }}>{children}</div>; };
const Head = ({ t, at, x, y, w = undefined, size = 100, children, align = 'left', italic = false, out = 9999, color = E.ink, lh = 0.98 }) => {
  const k = P(t, at, 0.6); const o = k * (1 - P(t, out, 0.35)); if (o < 0.01) return null;
  return <div style={{ ...abs(x, y, w), transform: `translate(${align === 'center' ? '-50%' : '0'}, ${(1 - k) * 30}px)`, opacity: o, fontFamily: SERIF, fontWeight: italic ? 500 : 700, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: lh, letterSpacing: -size * 0.012, color, textAlign: align === 'center' ? 'center' : 'left', whiteSpace: w ? 'normal' : 'nowrap' }}>{children}</div>;
};
const Cap = ({ t, at, x, y, w = undefined, children, size = 30, out = 9999, align = 'left' }) => { const o = P(t, at, 0.45) * (1 - P(t, out, 0.3)); if (o < 0.01) return null; return <div style={{ ...abs(x, y, w), transform: `translate(${align === 'center' ? '-50%' : '0'}, 0)`, opacity: o, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: size, lineHeight: 1.25, color: E.mute, textAlign: align === 'center' ? 'center' : 'left' }}>{children}</div>; };
// lời chú thích thay theo mốc
const Steps = ({ t, list, x, y, w, size = 34, v = false }) => {
  let cur = -1; list.forEach(([a], i) => { if (t >= a) cur = i; });
  return <div style={{ ...abs(x, y, w) }}>{list.map(([a, title, sub], i) => { const k = P(t, a, 0.45); const on = i === cur; if (k < 0.01) return null; return (
    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: v ? 10 : 18, opacity: k * (on ? 1 : 0.42), transform: `translateY(${(1 - k) * 14}px)` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: size * 1.05, color: on ? E.red : E.mute, width: size * 1.1, flexShrink: 0 }}>{i + 1}</div>
      <div><div style={{ fontSize: size * 0.82, fontWeight: 700, color: E.ink, lineHeight: 1.2 }}>{title}</div>{sub && on && <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: size * 0.82, color: E.mute, marginTop: 2 }}>{sub}</div>}</div>
    </div>); })}</div>;
};
const SrcChip = ({ children, bg = '#fff', color = E.ink, size = 24 }) => <div style={{ padding: `${size * 0.4}px ${size * 0.8}px`, borderRadius: 999, background: bg, color, fontSize: size, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(40,30,20,.12)', display: 'inline-flex', alignItems: 'center', gap: 10 }}>{children}</div>;
const MapsPin = ({ s = 40 }) => (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2C7.6 2 4 5.5 4 9.9 4 15.6 12 22 12 22s8-6.4 8-12.1C20 5.5 16.4 2 12 2z" fill="#EA4335" /><circle cx="12" cy="9.8" r="3.2" fill="#fff" /></svg>);
const Plug = ({ s = 40 }) => (<svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill={E.blue} /><path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>);
const Node = ({ t, at, x, y, kick, name, icons, w = 360, v = false }) => { const k = SPR(t, at, 0.8); if (k < 0.01) return null; return (
  <div style={{ ...abs(x - w / 2, y, w), opacity: cl(k * 2), transform: `scale(${0.85 + 0.15 * k})`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
    <div style={{ display: 'flex', gap: 14 }}>{icons}</div>
    <div style={{ fontSize: v ? 20 : 20, fontWeight: 800, letterSpacing: 4, color: E.red, marginTop: 16 }}>{kick}</div>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 46 : 48, lineHeight: 1.0, marginTop: 4 }}>{name}</div>
  </div>); };
const Ico = ({ k, s = 96 }) => <div style={{ width: s, height: s, borderRadius: s * 0.24, background: '#fff', boxShadow: '0 12px 30px rgba(40,30,20,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k === 'drive' ? <Img src={staticFile('media/google-drive.svg')} style={{ width: s * 0.6 }} /> : k === 'maps' ? <MapsPin s={s * 0.62} /> : k === 'plug' ? <Plug s={s * 0.6} /> : k === 'chrome' ? <Img src={staticFile('media/chrome.svg')} style={{ width: s * 0.6 }} /> : <Logo k={k} s={s * 0.58} />}</div>;
// đường nối có chấm chạy (dữ liệu đi qua)
const Flow = ({ t, at, a, b, color = E.ink, bend = 0, out = 9999, dots = 3, speed = 0.7 }) => {
  const k = P(t, at, 0.7); const o = 1 - P(t, out, 0.3); if (k < 0.01 || o < 0.01) return null;
  const mx = (a[0] + b[0]) / 2 + bend * (b[1] - a[1]) * 0.25, my = (a[1] + b[1]) / 2 - bend * (b[0] - a[0]) * 0.25;
  const pt = (u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]];
  const d = `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  return (<svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o }} width="1" height="1">
    <path d={d} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDashoffset={1 - k} strokeDasharray="1 1" />
    {k > 0.95 && Array.from({ length: dots }).map((_, i) => { const u = ((t - at) * speed + i / dots) % 1; const [px, py] = pt(u); return <circle key={i} cx={px} cy={py} r={7} fill={color} opacity={Math.sin(u * Math.PI)} />; })}
  </svg>);
};

// ---------- đầu trang tạp chí ----------
const SECT = { hook: 'Lời mở', essence: 'Bản chất', roles: 'Giải phẫu một ứng dụng', price: 'Ví dụ 01', travel1: 'Ví dụ 02', travel2: 'Ví dụ 02', tender1: 'Ví dụ 03', tender2: 'Ví dụ 03', brain: 'Kết luận', close: 'Lời cảm ơn' };
const Mast = ({ t, v }) => {
  const id = ORDER.slice().reverse().find((i) => t >= SB[i][0]) || 'hook'; const pg = ORDER.indexOf(id) + 1;
  const o = 1 - P(t, tl.endcard - 0.3, 0.4); if (o < 0.01) return null;
  const k = P(t, SB[id][0], 0.5);
  return (<div style={{ ...abs(v ? 50 : 70, v ? 46 : 34, v ? 980 : 1780), display: 'flex', alignItems: 'baseline', opacity: o * P(t, 0.1, 0.5) }}>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 34 : 32, letterSpacing: 1 }}>Tự dựng app</div>
    <div style={{ fontSize: v ? 17 : 16, fontWeight: 700, letterSpacing: 3, color: E.mute, marginLeft: 18 }}>SỐ 04 · TẬP CUỐI</div>
    <div style={{ marginLeft: 'auto', fontSize: v ? 17 : 16, fontWeight: 700, letterSpacing: 3, color: E.red, opacity: k }}>{SECT[id].toUpperCase()}</div>
    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: v ? 28 : 26, color: E.mute, marginLeft: 18 }}>tr. {String(pg * 2 + 2).padStart(2, '0')}</div>
  </div>);
};
const Paper4 = () => (<AbsoluteFill style={{ background: E.paper }}>
  <AbsoluteFill style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .3 0 0 0 0 .25 0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, transparent 58%, rgba(110,90,60,.14) 100%)' }} />
</AbsoluteFill>);

// ---------- 1. Lời mở: ba số đã ra ----------
const COVERS = [['01', 'DailyCast', 'Podcast tin tức', 'm_listen', 'podcast'], ['02', 'LearnDesk', 'Đào tạo online', 'ld_m_home', 'đào'], ['03', 'FieldMap', 'CRM bán hàng', 'crm_m_wm', 'crm']];
const Cover = ({ n, name, sub, src, w }) => (
  <div style={{ width: w, height: w * 1.36, background: E.paper2, borderRadius: 6, boxShadow: '0 30px 60px rgba(40,30,20,.22), 0 0 0 1px rgba(40,30,20,.06)', padding: w * 0.07, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'baseline' }}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: w * 0.15 }}>{name}</div><div style={{ marginLeft: 'auto', fontFamily: SERIF, fontStyle: 'italic', fontSize: w * 0.075, color: E.mute }}>Số {n}</div></div>
    <div style={{ fontSize: w * 0.045, fontWeight: 800, letterSpacing: w * 0.01, color: E.red, marginTop: w * 0.01 }}>{sub.toUpperCase()}</div>
    <div style={{ flex: 1, marginTop: w * 0.05, borderRadius: w * 0.04, overflow: 'hidden', position: 'relative', background: '#eee' }}><Img src={staticFile(`media/${src}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: '100%' }} /></div>
  </div>);
const Hook4 = ({ t, v }) => {
  const c = { tap: W('hook', 'tập', 1), ban: W('hook', 'bản') };
  const back = P(t, c.tap - 0.2, 0.9); const av = v ? 150 : 130;
  return (<>
    <div style={{ ...abs(v ? 50 : 110, v ? 120 : 140, av, av) }}><Pop t={t} at={0.2}><div style={{ width: av, height: av, borderRadius: av, border: '4px solid #fff', boxShadow: '0 10px 26px rgba(40,30,20,.2)', overflow: 'hidden', background: '#E9D8C6', opacity: 1 - P(t, c.ban - 0.6, 0.5) }}><Img src={staticFile('media/me.png')} style={{ width: '112%', height: '112%', marginLeft: '-6%', marginTop: '2%', objectFit: 'cover' }} /></div></Pop></div>
    <Kicker t={t} at={0.3} x={v ? 50 + av + 24 : 110 + av + 26} y={v ? 160 : 170} out={c.tap - 0.2}>BA SỐ ĐÃ RA</Kicker>
    <Cap t={t} at={0.5} x={v ? 50 + av + 24 : 110 + av + 26} y={v ? 196 : 206} out={c.tap - 0.2} size={v ? 34 : 34}>và một câu hỏi lớn hơn</Cap>
    <Head t={t} at={0.5} x={v ? 50 : 110} y={v ? 320 : 340} size={v ? 120 : 132} w={v ? 980 : 620} out={c.tap - 0.3}>Ba tập, <span style={{ fontStyle: 'italic', color: E.red }}>ba ứng dụng.</span></Head>
    {COVERS.map(([n, name, sub, src, cue], i) => {
      const a = W('hook', cue); const k = SPR(t, a - 0.15, 0.8); if (k < 0.01) return null;
      const w = v ? 300 : 330; const gx = v ? 50 + i * 345 : 790 + i * 370; const gy = v ? 640 + (i === 1 ? 60 : 0) : 250 + (i === 1 ? 50 : 0);
      const rot = (i - 1) * 4;
      const sx = lerp(gx, v ? 140 + i * 290 : 560 + i * 300, back), sy = lerp(gy, v ? 330 : 110, back), sc = lerp(1, v ? 0.6 : 0.55, back);
      return <div key={n} style={{ ...abs(sx, sy), opacity: cl(k * 2) * (1 - 0.55 * P(t, c.ban - 0.3, 0.6)), transform: `rotate(${rot * (1 - back * 0.5)}deg) scale(${(0.8 + 0.2 * k) * sc})`, transformOrigin: 'top left', filter: `blur(${P(t, c.ban - 0.3, 0.6) * 3}px)` }}><Cover n={n} name={name} sub={sub} src={src} w={w} /></div>;
    })}
    <Kicker t={t} at={c.tap} x={v ? 540 : 960} y={v ? 820 : 600} align="center" size={v ? 28 : 26}>TẬP CUỐI · ĐIỀU QUAN TRỌNG HƠN CẢ</Kicker>
    <Head t={t} at={c.ban - 0.15} x={v ? 540 : 960} y={v ? 900 : 650} align="center" size={v ? 250 : 250}>Bản chất<span style={{ color: E.red }}>.</span></Head>
    <Head t={t} at={c.ban + 0.25} x={v ? 540 : 960} y={v ? 1160 : 900} align="center" size={v ? 64 : 56} italic color={E.mute}>của mọi ứng dụng</Head>
  </>);
};

// ---------- 2. Bản chất: lấy · xử lý · trình bày ----------
const RAW = ['865000;sàn B;12/11', 'Máy đo HA ;; 905.000', '842,000 - web NPP', 'sàn a: 860k'];
const Essence = ({ t, v }) => {
  const c = { lay: W('essence', 'lấy'), xu: W('essence', 'xử'), tr: W('essence', 'trình'), th: W('essence', 'tổng'), pt: W('essence', 'phân'), tq: W('essence', 'trực'), ch: W('essence', 'chuyển'), hi: W('essence', 'hiểu', 1), pm: W('essence', 'phần'), tu: W('essence', 'tự') };
  const fade = 1 - P(t, c.hi - 0.2, 0.5);
  const cols = [['01', 'Lấy dữ liệu', c.lay], ['02', 'Xử lý', c.xu], ['03', 'Trình bày', c.tr]];
  const cw = v ? 960 : 540, cx = (i) => v ? 60 : 110 + i * 590, cy = (i) => v ? 300 + i * 360 : 230;
  const vis = (i) => {
    if (i === 0) return <div style={{ fontFamily: MONO, fontSize: v ? 26 : 27, lineHeight: 1.6, color: '#5C544A' }}>{RAW.map((r, j) => <div key={j} style={{ opacity: P(t, c.lay + j * 0.15, 0.3) }}>{r}</div>)}</div>;
    if (i === 1) return <div style={{ fontSize: v ? 26 : 24 }}>{[['Sàn TMĐT B', '795.000'], ['Sàn TMĐT A', '860.000'], ['Web NPP', '842.000'], ['Nhà thuốc', '905.000']].map(([a, b], j) => <div key={j} style={{ display: 'flex', padding: v ? '5px 0' : '6px 0', fontWeight: 600, fontSize: v ? 26 : 28, opacity: P(t, c.xu + j * 0.15, 0.3) }}><span>{a}</span><span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: j === 0 ? E.green : E.ink }}>{b}</span></div>)}</div>;
    return <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: v ? 150 : 170 }}>{[795, 842, 860, 905].map((x, j) => <div key={j} style={{ flex: 1, height: `${(x - 700) / 205 * 100 * P(t, c.tr + j * 0.12, 0.5)}%`, background: j === 0 ? E.red : '#CFC6B6', borderRadius: '6px 6px 0 0' }} />)}</div>;
  };
  return (<>
    <div style={{ opacity: fade }}>
      <Head t={t} at={10.4} x={v ? 60 : 110} y={v ? 130 : 100} size={v ? 74 : 84}>App nào cũng chỉ làm <span style={{ color: E.red }}>ba việc</span></Head>
      {cols.map(([n, name, a], i) => { const k = P(t, a - 0.2, 0.55); if (k < 0.01) return null; return (
        <div key={n} style={{ ...abs(cx(i), cy(i), cw), opacity: k, transform: `translateY(${(1 - k) * 30}px)`, display: v ? 'flex' : 'block', gap: 36 }}>
          <div style={{ width: v ? 330 : undefined, flexShrink: 0 }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 120 : 170, lineHeight: 0.9, color: E.red }}>{n}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 56 : 72, marginTop: 6 }}>{name}</div>
          </div>
          <div style={{ marginTop: v ? 18 : 26, flex: 1, background: E.paper2, borderRadius: 12, padding: v ? 24 : 26, boxShadow: '0 16px 36px rgba(40,30,20,.10)' }}>{vis(i)}</div>
        </div>); })}
      <Head t={t} at={c.th - 0.1} x={v ? 540 : 960} y={v ? 1390 : 790} align="center" size={v ? 52 : 60} italic color={E.mute}>Tổng hợp · phân tích · trực quan hóa</Head>
      <Head t={t} at={c.ch - 0.1} x={v ? 540 : 960} y={v ? 1470 : 880} align="center" size={v ? 76 : 92} w={v ? 980 : undefined}>= chuyển dữ liệu <span style={{ color: E.red, fontStyle: 'italic' }}>từ dạng này sang dạng khác</span></Head>
    </div>
    {t > c.hi - 0.3 && <>
      <Head t={t} at={c.hi} x={v ? 60 : 110} y={v ? 150 : 120} size={v ? 74 : 76} w={v ? 960 : 1500}>Những phần mềm <span style={{ fontStyle: 'italic', color: E.mute }}>tưởng phải đi mua</span></Head>
      {[['Tra giá thị trường', 'thuê bao theo tháng'], ['Trợ lý du lịch', 'nhiều app rời rạc'], ['Số liệu đấu thầu', 'mua gói dữ liệu']].map(([a, b], i) => { const k = SPR(t, c.hi + 0.5 + i * 0.35, 0.8); if (k < 0.01) return null; return (
        <div key={a} style={{ ...abs(v ? 90 : 110 + i * 580, v ? 390 + i * 300 : 360), width: v ? 900 : 540, opacity: cl(k * 2), transform: `rotate(${(i - 1) * 2}deg) scale(${0.85 + 0.15 * k})`, background: '#fff', borderRadius: 10, padding: '30px 34px', boxShadow: '0 24px 50px rgba(40,30,20,.14)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 4, color: E.mute }}>VÍ DỤ 0{i + 1}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 66, marginTop: 6 }}>{a}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: E.mute, marginTop: 4 }}>{b}</div>
        </div>); })}
      {(() => { const k = SPR(t, c.tu - 0.15, 0.6); if (k < 0.01) return null; return <div style={{ ...abs(v ? 540 : 960, v ? 1300 : 760), transform: `translate(-50%,0) rotate(-4deg) scale(${1.4 - 0.4 * k})`, opacity: cl(k * 2), padding: '16px 44px', border: `6px solid ${E.red}`, borderRadius: 16, color: E.red, fontSize: v ? 64 : 70, fontWeight: 800, letterSpacing: 3, background: 'rgba(250,247,241,.92)', whiteSpace: 'nowrap' }}>TỰ DỰNG ĐƯỢC</div>; })()}
    </>}
  </>);
};

// ---------- 3. Giải phẫu một ứng dụng ----------
const Roles = ({ t, v }) => {
  const c = { dr: W('roles', 'drive'), sh: W('roles', 'sheet'), kho: W('roles', 'kho'), ap: W('roles', 'apps'), can: W('roles', 'can'), gh: W('roles', 'github'), hi: W('roles', 'hiện'), cl: W('roles', 'claude'), ket: W('roles', 'kết'), mp: W('roles', 'maps'), ung: W('roles', 'ứng') };
  const L = v ? { kho: [270, 1060], be: [540, 1330], gh: [810, 1060], cl: [540, 640], mp: [250, 330], ext: [830, 330] } : { kho: [330, 560], be: [960, 760], gh: [1590, 560], cl: [960, 330], mp: [470, 200], ext: [1450, 200] };
  const ic = v ? 92 : 100; const half = ic / 2;
  return (<>
    <Head t={t} at={28.9} x={v ? 60 : 110} y={v ? 130 : 110} size={v ? 70 : 64} w={v ? 900 : 600}>Giải phẫu <span style={{ fontStyle: 'italic', color: E.red }}>một ứng dụng</span></Head>
    <Flow t={t} at={c.can} a={[L.kho[0] + 60, L.kho[1] + half]} b={[L.be[0] - 60, L.be[1] + half]} bend={-0.6} color={E.green} out={c.ket - 0.3} />
    <Flow t={t} at={c.hi - 0.2} a={[L.be[0] + 60, L.be[1] + half]} b={[L.gh[0] - 60, L.gh[1] + half]} bend={-0.6} color={E.blue} out={c.ket - 0.3} />
    {[L.kho, L.be, L.gh].map((p, i) => <Flow key={i} t={t} at={c.ket + i * 0.15} a={[L.cl[0], L.cl[1] + 70]} b={[p[0], p[1] - 10]} bend={i === 1 ? 0 : (i === 0 ? 0.3 : -0.3)} color={E.red} />)}
    {[L.mp, L.ext].map((p, i) => <Flow key={i} t={t} at={(i ? c.ung : c.mp) - 0.1} a={[p[0] + (i ? -120 : 120), p[1] + 40]} b={[L.cl[0] + (i ? 80 : -80), L.cl[1]]} bend={i ? 0.3 : -0.3} color={E.blue} />)}
    <Node t={t} at={c.dr - 0.2} x={L.kho[0]} y={L.kho[1]} v={v} kick="KHO DỮ LIỆU" name="Drive · Sheet" icons={<><Ico k="drive" s={ic} />{t > c.sh - 0.2 && <Pop t={t} at={c.sh - 0.2}><Ico k="sheets" s={ic} /></Pop>}</>} />
    <Node t={t} at={c.ap - 0.2} x={L.be[0]} y={L.be[1]} v={v} kick="BACKEND XỬ LÝ" name="Apps Script" icons={<Ico k="gas" s={ic} />} />
    <Node t={t} at={c.gh - 0.2} x={L.gh[0]} y={L.gh[1]} v={v} kick="MẶT TIỀN" name="GitHub" icons={<Ico k="github" s={ic} />} />
    {(() => { const k = SPR(t, c.cl - 0.2, 0.9); if (k < 0.01) return null; const s = v ? 150 : 140; return (
      <div style={{ ...abs(L.cl[0] - 200, L.cl[1] - s / 2 + 10, 400), opacity: cl(k * 2), transform: `scale(${0.8 + 0.2 * k})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: s, height: s, borderRadius: s, background: '#fff', boxShadow: `0 0 0 ${10 + 6 * Math.sin(t * 3)}px rgba(196,66,43,.10), 0 20px 50px rgba(40,30,20,.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClaudeMark s={s * 0.55} /></div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 4, color: E.red, marginTop: 14 }}>BỘ NÃO</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 54 : 52 }}>Claude Code</div>
      </div>); })()}
    {[[L.mp, c.mp, 'maps', 'Google Maps'], [L.ext, c.ung, 'plug', 'Ứng dụng bên ngoài']].map(([p, a, k, n]: any) => { const kk = SPR(t, a - 0.2, 0.8); if (kk < 0.01) return null; return <div key={n} style={{ ...abs(p[0] - 170, p[1], 340), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: cl(kk * 2), transform: `scale(${0.85 + 0.15 * kk})` }}><Ico k={k} s={v ? 70 : 74} /><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: v ? 40 : 40, lineHeight: 1 }}>{n}</div></div>; })}
    <Cap t={t} at={c.can} x={v ? 540 : 645} y={v ? 1250 : 735} align="center" size={v ? 28 : 28} out={c.ket - 0.3}>can thiệp thẳng vào Sheet, Drive</Cap>
    <Cap t={t} at={c.hi} x={v ? 540 : 1275} y={v ? 1560 : 735} align="center" size={v ? 28 : 28} out={c.ket - 0.3}>dữ liệu hiện lên thành giao diện</Cap>
  </>);
};

// ---------- 4. Ví dụ 01 · tra giá ----------
const PV = { all: [0, 0, 1440, 900], chart: [250, 200, 715, 345], alert: [955, 200, 470, 345], table: [250, 545, 1170, 355] };
const SRCS = ['Sàn TMĐT A', 'Sàn TMĐT B', 'Web nhà phân phối', 'Chuỗi nhà thuốc', 'Báo giá đại lý', 'Website hãng'];
const Price = ({ t, v }) => {
  const c = { tra: W('price', 'tra'), tr: W('price', 'trước'), gg: W('price', 'google'), chep: W('price', 'chép'), gio: W('price', 'giờ'), thu: W('price', 'thu'), ng: W('price', 'nguồn'), ghi: W('price', 'ghi'), so: W('price', 'so'), bd: W('price', 'biểu'), ng2: W('price', 'nguồn', 1), cl: W('price', 'claude'), th: W('price', 'thấp'), gi: W('price', 'giảm'), nh: W('price', 'nhìn') };
  const box = v ? [40, 560, 1000, 625] : [600, 170, 1250, 781];
  const old = t < c.gio - 0.1; const oldO = P(t, c.tr - 0.2, 0.4) * (1 - P(t, c.gio - 0.4, 0.35));
  const ui = P(t, c.so - 0.3, 0.6);
  const view = camV(t, [[0, PV.all], [c.bd + 0.2, PV.chart, 1.0], [c.ng2 + 0.3, PV.alert, 1.0], [c.th + 0.1, PV.table, 1.0], [c.gi + 0.2, PV.chart, 0.9], [c.nh + 0.1, PV.all, 0.9]]);
  const q = 'giá máy đo huyết áp bắp tay';
  return (<>
    <Kicker t={t} at={48.9} x={v ? 60 : 90} y={v ? 140 : 180}>VÍ DỤ 01</Kicker>
    <Head t={t} at={c.tra - 0.1} x={v ? 60 : 90} y={v ? 180 : 222} size={v ? 96 : 108} w={v ? 960 : 490}>Tra giá thị trường</Head>
    <div style={{ display: v ? 'none' : 'block' }}>
      <Steps t={t} x={90} y={480} w={480} size={42} list={[[c.tr, 'Trước: Google từng sản phẩm', 'rồi chép tay vào bảng'], [c.gio, 'Mỗi sáng 06:00 tự quét', '6 nguồn bạn đã cấp quyền'], [c.ghi, 'Ghi vào Sheet, so sánh, vẽ biểu đồ', null], [c.ng2, 'Claude gợi ý nguồn đáng tin', null], [c.th, 'Rẻ nhất ở đâu, ai vừa giảm giá', 'nhìn là thấy']]} />
    </div>
    {v && <div style={{ ...abs(60, 1250, 960) }}><Steps t={t} x={0} y={0} w={960} size={46} v list={[[c.tr, 'Trước: Google từng sản phẩm, chép tay', null], [c.gio, 'Mỗi sáng 06:00 tự quét 6 nguồn', null], [c.ghi, 'Ghi vào Sheet, so sánh, vẽ biểu đồ', null], [c.ng2, 'Claude gợi ý nguồn đáng tin', null], [c.th, 'Rẻ nhất ở đâu, ai vừa giảm giá', null]].filter(([a], i, arr) => t >= a && (i === arr.length - 1 || t < arr[i + 1][0]))} /></div>}
    {old && oldO > 0.01 && <div style={{ opacity: oldO }}>
      <div style={{ ...abs(box[0], box[1], box[2] * 0.62, box[3]), background: '#fff', borderRadius: 14, boxShadow: '0 30px 70px rgba(40,30,20,.18)', padding: v ? 26 : 34 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: v ? 64 : 70, borderRadius: 40, border: '1px solid #DDD', padding: '0 26px', fontSize: v ? 24 : 28, color: '#333' }}><span style={{ fontSize: 26 }}>⌕</span>{typed(q, t, c.tr + 0.1, 20)}<Caret t={t} h={30} color="#333" /></div>
        {[['Sàn TMĐT A · Máy đo huyết áp bắp tay…', '860.000đ'], ['Nhà thuốc · Máy đo huyết áp tự động', '905.000đ'], ['Nhà phân phối · Bảng giá 2026', '842.000đ'], ['Sàn TMĐT B · Giảm giá hôm nay', '795.000đ']].map(([a, b], i) => <div key={i} style={{ marginTop: v ? 22 : 30, opacity: P(t, c.gg - 0.4 + i * 0.2, 0.3) }}><div style={{ fontSize: v ? 22 : 25, color: '#1A0DAB', fontWeight: 600 }}>{a}</div><div style={{ fontSize: v ? 20 : 22, color: '#555', marginTop: 4 }}>Giá: <b style={{ color: '#111' }}>{b}</b> · cập nhật …</div></div>)}
      </div>
      <div style={{ ...abs(box[0] + box[2] * 0.5, box[1] + box[3] * 0.38, box[2] * 0.5), background: '#fff', borderRadius: 10, boxShadow: '0 24px 60px rgba(40,30,20,.24)', overflow: 'hidden', opacity: P(t, c.chep - 0.6, 0.4), transform: `rotate(2deg)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#E6F4EA', fontWeight: 800, fontSize: 22, color: '#188038' }}><Logo k="sheets" s={26} />Bảng giá (nhập tay)</div>
        {['Sàn TMĐT A|860000', 'Nhà thuốc|905000', 'NPP|842000', 'Sàn TMĐT B|'].map((r, i) => { const [a, b] = r.split('|'); return <div key={i} style={{ display: 'flex', borderTop: '1px solid #E5E5E5', fontSize: 22, fontFamily: MONO }}><div style={{ width: '58%', padding: '10px 14px', borderRight: '1px solid #E5E5E5' }}>{a}</div><div style={{ padding: '10px 14px' }}>{i < 3 ? typed(b, t, c.chep - 0.5 + i * 0.35, 18) : ''}{i === 3 && <Caret t={t} h={24} color="#188038" />}</div></div>; })}
      </div>
    </div>}
    {!old && t < c.so && <div style={{ ...abs(box[0], box[1], box[2], box[3]) }}>
      <div style={{ ...abs(box[2] / 2 - 120, box[3] / 2 - 120, 240, 240), opacity: P(t, c.gio - 0.1, 0.4), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 240, boxShadow: '0 24px 60px rgba(40,30,20,.18)' }}>
        <Logo k="sheets" s={96} /><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 54, marginTop: 6 }}>06:00</div>
      </div>
      {SRCS.map((s, i) => { const ang = (i / SRCS.length) * Math.PI * 2 - Math.PI / 2; const R0 = v ? 420 : 470, R1 = 150; const fly = P(t, c.ghi - 0.4 + i * 0.08, 0.7); const r = lerp(R0, R1, fly); const x = box[2] / 2 + Math.cos(ang) * r * (v ? 1 : 1.25), y = box[3] / 2 + Math.sin(ang) * r * (v ? 0.62 : 0.66); const k = SPR(t, c.thu + i * 0.12, 0.7); if (k < 0.01) return null; return <div key={s} style={{ ...abs(x, y), transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * k) * (1 - fly * 0.6)})`, opacity: cl(k * 2) * (1 - P(t, c.ghi + 0.3 + i * 0.08, 0.3)) }}><SrcChip size={v ? 26 : 30}><Check s={28} bg={E.green} />{s}</SrcChip></div>; })}
    </div>}
    {ui > 0.01 && <div style={{ opacity: ui, transform: `translateY(${(1 - ui) * 40}px)` }}>
      <UCard box={box} layers={[{ src: 'pr_d', view, o: 1 }]} />
      <Ring t={t} at={c.cl - 0.1} out={c.th - 0.3} box={box} view={view} r={[985, 329, 407, 60]} />
      <Ring t={t} at={c.th + 0.1} out={c.gi} box={box} view={view} r={[615, 630, 90, 250]} />
      <Ring t={t} at={c.gi + 0.4} out={c.nh} box={box} view={view} r={[790, 405, 130, 60]} />
    </div>}
  </>);
};

// ---------- 5. Ví dụ 02 · du lịch: ba tab ----------
const ChromeTab = ({ w }) => (<div style={{ position: 'absolute', inset: 0, background: '#fff', padding: w * 0.05, paddingTop: w * 0.16 }}>
  <div style={{ height: w * 0.11, borderRadius: w * 0.06, background: '#F1F3F4', display: 'flex', alignItems: 'center', padding: `0 ${w * 0.04}px`, fontSize: w * 0.04, color: '#444' }}>quán ăn ngon gần Phố Wall</div>
  {[['Top 10 quán ăn trưa khu tài chính', '4,6 ★ · 2,1 nghìn đánh giá'], ['Phố Stone Street có gì?', 'Blog du lịch · 8 phút đọc'], ['Giờ mở cửa · Bảo tàng gần đây', 'Trang thông tin'], ['Nên ăn gì ở New York?', 'Diễn đàn · 120 bình luận']].map(([a, b], i) => <div key={i} style={{ marginTop: w * 0.06 }}><div style={{ fontSize: w * 0.046, color: '#1A0DAB', fontWeight: 600, lineHeight: 1.25 }}>{a}</div><div style={{ fontSize: w * 0.034, color: '#666', marginTop: 3 }}>{b}</div></div>)}
</div>);
const MapTab = () => (<div style={{ position: 'absolute', inset: 0 }}><Img src={staticFile('media/nyc_map.jpg')} style={{ position: 'absolute', left: 0, top: -40, width: '100%' }} /><div style={{ position: 'absolute', left: '58%', top: '52%' }}><MapsPin s={56} /></div></div>);
const Travel1 = ({ t, v }) => {
  const c = { du: W('travel1', 'du'), t1: W('travel1', 'tab'), t2: W('travel1', 'tab', 1), ch: W('travel1', 'chụp'), cy: W('travel1', 'chuyển') };
  const tabs = [['Google Maps', 'tìm đường', <MapTab />, c.t1], ['Chrome', 'chỗ ăn, chỗ chơi', null, c.t2], ['Camera', 'chụp để dịch', <Shot src="tr_menu_raw" />, c.ch]];
  const pw = v ? 300 : 320;
  const sw = t > c.cy - 0.2 ? Math.floor((t - c.cy + 0.2) / 0.35) % 3 : -1;
  return (<>
    <Kicker t={t} at={72.4} x={v ? 60 : 90} y={v ? 140 : 180}>VÍ DỤ 02</Kicker>
    <Head t={t} at={c.du - 0.2} x={v ? 60 : 90} y={v ? 180 : 222} size={v ? 92 : 108} w={v ? 960 : 540}>Đi du lịch nước ngoài</Head>
    {tabs.map(([n, sub, body, a]: any, i) => {
      const k = SPR(t, a - 0.2, 0.8); if (k < 0.01) return null;
      const front = sw >= 0 ? sw === i : i === tabs.filter(([, , , aa]: any) => t >= aa - 0.2).length - 1;
      const x = v ? 45 + i * 340 : 680 + i * 400, y = v ? 470 + (front ? -20 : 20) : 150 + (front ? -20 : 20);
      return (<div key={n} style={{ ...abs(x, y), opacity: cl(k * 2), transform: `rotate(${(i - 1) * 4}deg) scale(${(0.85 + 0.15 * k) * (front ? 1 : 0.93)})`, zIndex: front ? 5 : i, transition: 'none' }}>
        <div style={{ position: 'relative', width: pw, height: pw * 2.1 }}><Phone x={0} y={0} w={pw}>{i === 1 ? <ChromeTab w={pw * 0.93} /> : body}</Phone></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 22 }}><Ico k={i === 0 ? 'maps' : i === 1 ? 'chrome' : 'plug'} s={54} /><div><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, lineHeight: 1 }}>{n}</div><div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, color: E.mute }}>{sub}</div></div></div>
      </div>);
    })}
    {!v && <Cap t={t} at={c.cy - 0.1} x={90} y={520} w={480} size={44}>Cứ thế chuyển qua chuyển lại giữa ba ứng dụng…</Cap>}
    {v && <Cap t={t} at={c.cy - 0.1} x={540} y={1420} w={960} size={44} align="center">Cứ thế chuyển qua chuyển lại…</Cap>}
  </>);
};

// ---------- 6. TripLens: một ứng dụng làm hết ----------
const Travel2 = ({ t, v }) => {
  const c = { se: W('travel2', 'sẽ'), vi: W('travel2', 'vị'), tt: W('travel2', 'trực'), cd: W('travel2', 'chỉ', 1), dich: W('travel2', 'dịch'), td: W('travel2', 'thực'), gt: W('travel2', 'giới'), dd: W('travel2', 'địa') };
  const pw = v ? 470 : 420; const px = v ? 305 : 760, py = v ? 380 : 120;
  const inner = pw * 0.93; const sc = inner / 400; const pad = pw * 0.035;
  const scr = t < c.cd - 0.2 ? 'tr_m' : t < c.dich - 0.2 ? 'tr_nav' : t < c.gt - 0.2 ? 'menu' : 'tr_m';
  const R = TR.route; const segL = R.slice(1).map((p, i) => Math.hypot(p[0] - R[i][0], p[1] - R[i][1])); const tot = segL.reduce((a, b) => a + b, 0);
  const prog = cl((t - c.vi) / (c.gt + 2.5 - c.vi)) * 0.55; let d = prog * tot, i0 = 0; while (i0 < segL.length - 1 && d > segL[i0]) { d -= segL[i0]; i0++; }
  const u = cl(d / segL[i0]); const dot = [lerp(R[i0][0], R[i0 + 1][0], u), lerp(R[i0][1], R[i0 + 1][1], u) - 75];
  const feats = [[c.vi, 'Vị trí cập nhật trực tiếp'], [c.cd, 'Chỉ đường từng bước'], [c.dich, 'Dịch biển hiệu, thực đơn'], [c.gt, 'Giới thiệu điểm trên đường']];
  const k = P(t, c.se - 0.2, 0.6);
  return (<>
    <Head t={t} at={c.se - 0.2} x={v ? 60 : 90} y={v ? 150 : 222} size={v ? 88 : 108} w={v ? 960 : 600}>Một ứng dụng <span style={{ fontStyle: 'italic', color: E.red }}>làm hết</span></Head>
    {!v && <Cap t={t} at={c.se + 0.5} x={90} y={430} w={560} size={34}>TripLens · Claude nối Google Maps, dịch và thông tin địa điểm vào một màn hình</Cap>}
    <div style={{ opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
      <Phone x={px} y={py} w={pw}>
        {scr !== 'menu' && <Shot src={scr} />}
        {scr === 'menu' && <><Shot src="tr_menu_raw" /><Shot src="tr_menu" o={P(t, c.td - 0.1, 0.5)} /></>}
        {scr !== 'menu' && t > c.vi - 0.2 && <div style={{ position: 'absolute', left: dot[0] * sc - 13, top: dot[1] * sc - 13, width: 26, height: 26, borderRadius: 13, background: '#1A73E8', border: '4px solid #fff', boxShadow: `0 0 0 ${10 + 6 * Math.sin(t * 5)}px rgba(26,115,232,.2)` }} />}
        {scr === 'tr_m' && t > c.gt && <div style={{ position: 'absolute', left: 10, right: 10, top: 640 * sc, height: 72 * sc, borderRadius: 14, border: `4px solid ${E.red}`, opacity: P(t, c.gt, 0.3) }} />}
      </Phone>
      {t > c.gt && (() => { const kk = SPR(t, c.dd - 0.1, 0.7); return <div style={{ ...abs(v ? 140 : 90, v ? 1520 : 640), opacity: cl(kk * 2), transform: `scale(${0.8 + 0.2 * kk})` }}><SrcChip size={v ? 26 : 26} bg={E.ink} color="#fff"><span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{[0, 1, 2, 3, 4].map((j) => <span key={j} style={{ width: 5, height: 10 + 14 * Math.abs(Math.sin(t * 6 + j)), background: '#fff', borderRadius: 3 }} />)}</span>Đang giới thiệu: Nhà thờ Trinity</SrcChip></div>; })()}
    </div>
    {!v && <div style={{ ...abs(1300, 300, 540) }}>{feats.map(([a, n], i) => { const kk = P(t, a - 0.15, 0.45); if (kk < 0.01) return null; const on = i === feats.filter(([aa]) => t >= aa - 0.15).length - 1; return <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 30, opacity: kk * (on ? 1 : 0.5), transform: `translateX(${(1 - kk) * 40}px)` }}><Check s={44} bg={on ? E.red : E.green} /><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 50, lineHeight: 1.05 }}>{n}</div></div>; })}</div>}
    {v && (() => { const f = feats.filter(([aa]) => t >= aa - 0.15).slice(-1)[0]; if (!f) return null; return <div style={{ ...abs(0, 1440, 1080), display: 'flex', justifyContent: 'center' }}><div key={f[1]} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: P(t, f[0] - 0.15, 0.3) }}><Check s={40} bg={E.red} /><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 54 }}>{f[1]}</div></div></div>; })()}
  </>);
};

// ---------- 7. Ví dụ 03 · đấu thầu ----------
const MESSY = ['IB2600418231 ;Mua sắm VTTH..; 4.820.000.000', 'ib2600418655,  vật tư NHA KHOA ,1,26 tỷ', 'IB2600418231 ;Mua sắm VTTH..; 4.820.000.000', '  Chỉ khâu PT các loại|2100000000|'];
const CLEAN = [['IB2600418231', 'Vật tư tiêu hao y tế', '4,82 tỷ'], ['IB2600418655', 'Vật tư nha khoa', '1,26 tỷ'], ['IB2600419012', 'Chỉ khâu phẫu thuật', '2,10 tỷ']];
const Tender1 = ({ t, v }) => {
  const c = { dt: W('tender1', 'đấu'), thay: W('tender1', 'thay'), ban: W('tender1', 'bạn'), tai: W('tender1', 'tải'), ms: W('tender1', 'mua', 1), lam: W('tender1', 'làm'), cap: W('tender1', 'cập'), tq: W('tender1', 'trực'), thu: W('tender1', 'thử') };
  const ui = P(t, c.tq - 0.2, 0.6); const box = v ? [40, 760, 1000, 625] : [620, 330, 1220, 740];
  const stepsO = 1 - P(t, c.tq - 0.3, 0.5);
  const panels = [['Tải dữ liệu công khai', 'từ hệ thống mua sắm công', c.tai], ['Làm sạch', 'gộp, bỏ trùng, chuẩn hoá', c.lam], ['Cập nhật tự động', 'mỗi ngày, không cần nhắc', c.cap]];
  return (<>
    <Kicker t={t} at={95.8} x={v ? 60 : 90} y={v ? 140 : 180}>VÍ DỤ 03</Kicker>
    <Head t={t} at={c.dt - 0.2} x={v ? 60 : 90} y={v ? 180 : 222} size={v ? 92 : 108} w={v ? 960 : 1400}>Theo dõi đấu thầu</Head>
    <div style={{ opacity: 1 - P(t, c.ban - 0.2, 0.4) }}>
      {(() => { const k = SPR(t, c.thay - 0.1, 0.7); if (k < 0.01) return null; return <div style={{ ...abs(v ? 140 : 560, v ? 520 : 420, v ? 800 : 800), opacity: cl(k * 2), transform: `rotate(-2deg) scale(${0.85 + 0.15 * k})`, background: '#fff', borderRadius: 10, padding: 36, boxShadow: '0 24px 50px rgba(40,30,20,.14)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 4, color: E.mute }}>CÁCH QUEN THUỘC</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64, marginTop: 6 }}>Mua số liệu từ bên cung cấp</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: E.mute, marginTop: 6 }}>gói dữ liệu trả phí, tải về rồi tự lọc</div>
      </div>; })()}
    </div>
    <div style={{ opacity: stepsO }}>
      {t > c.ban - 0.3 && <Cap t={t} at={c.ban - 0.2} x={v ? 60 : 90} y={v ? 300 : 345} w={v ? 960 : 1400} size={v ? 40 : 42}>Hoặc: bạn tự dựng công cụ của riêng mình</Cap>}
      {panels.map(([a, b, at]: any, i) => { const k = P(t, at - 0.2, 0.55); if (k < 0.01) return null; return (
        <div key={a} style={{ ...abs(v ? 60 : 90 + i * 590, v ? 400 + i * 360 : 430, v ? 960 : 540), opacity: k, transform: `translateY(${(1 - k) * 30}px)`, background: E.paper2, borderRadius: 12, padding: 30, boxShadow: '0 16px 36px rgba(40,30,20,.10)', minHeight: v ? 320 : 420 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 80, color: E.red, lineHeight: 0.9 }}>{i + 1}</div><div><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, lineHeight: 1 }}>{a}</div><div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, color: E.mute }}>{b}</div></div></div>
          <div style={{ marginTop: 24 }}>
            {i === 0 && <div style={{ display: 'flex', gap: 16 }}>{['.xlsx', '.xlsx', '.csv'].map((x, j) => <div key={j} style={{ width: 96, height: 120, borderRadius: 10, background: '#fff', boxShadow: '0 8px 18px rgba(40,30,20,.12)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14, fontWeight: 800, fontSize: 20, color: '#188038', opacity: P(t, at + j * 0.2, 0.3), transform: `translateY(${(1 - P(t, at + j * 0.2, 0.4)) * -40}px)` }}>{x}</div>)}</div>}
            {i === 1 && <div style={{ position: 'relative', height: 180 }}>
              <div style={{ position: 'absolute', inset: 0, fontFamily: MONO, fontSize: 17, lineHeight: 1.7, color: '#8B5E4A', opacity: 1 - P(t, at + 0.5, 0.5) }}>{MESSY.map((m, j) => <div key={j} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{m}</div>)}</div>
              <div style={{ position: 'absolute', inset: 0, opacity: P(t, at + 0.5, 0.5) }}>{CLEAN.map((r, j) => <div key={j} style={{ display: 'flex', gap: 12, padding: '7px 0', fontSize: 21, fontWeight: 600 }}><span style={{ fontFamily: MONO, color: E.mute, fontSize: 17 }}>{r[0]}</span><span>{r[1]}</span><span style={{ marginLeft: 'auto', fontWeight: 800 }}>{r[2]}</span></div>)}</div>
            </div>}
            {i === 2 && <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}><svg width="110" height="110" viewBox="0 0 24 24" style={{ transform: `rotate(${(t - at) * 120}deg)` }}><path d="M20 12a8 8 0 1 1-2.3-5.6" fill="none" stroke={E.green} strokeWidth="2.2" strokeLinecap="round" /><path d="M18.5 3v4h-4" fill="none" stroke={E.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 56 }}>17:00</div></div>}
          </div>
        </div>); })}
    </div>
    {ui > 0.01 && <div style={{ opacity: ui, transform: `translateY(${(1 - ui) * 40}px)` }}><UCard box={box} layers={[{ src: 'td_d', view: camV(t, [[0, [0, 0, 1440, 900]], [c.thu, [250, 100, 1180, 738], 1.2]]), o: 1 }]} /></div>}
    <Head t={t} at={c.thu} x={v ? 540 : 90} y={v ? 1440 : 480} size={v ? 58 : 66} italic color={E.red} align={v ? 'center' : 'left'} w={v ? undefined : 480}>Tiết kiệm được bao nhiêu thời gian?</Head>
    {!v && <Cap t={t} at={c.tq} x={620} y={1080 - 10 - 30} size={26}>Hình · TenderWatch, dữ liệu mẫu</Cap>}
  </>);
};

// ---------- 8. 17:00 · hệ thống tự làm ----------
const Tender2 = ({ t, v }) => {
  const c = { em: W('tender2', 'email'), thay: W('tender2', 'thay'), nam: W('tender2', 'năm'), quet: W('tender2', 'quét'), tai: W('tender2', 'tải'), dua: W('tender2', 'đưa'), cap: W('tender2', 'cập'), bao: W('tender2', 'báo'), chinh: W('tender2', 'chính') };
  const ib = v ? [60, 300, 960] : [90, 330, 560];
  const mid = v ? [60, 760] : [740, 330]; const ph = v ? [610, 740, 400] : [1440, 150, 380];
  const scan = t > c.quet && t < c.quet + 1.2 ? (t - c.quet) / 1.2 : -1;
  const mails = ['Thông tin thầu ngày 12/11 · phần 1', 'Thông tin thầu ngày 12/11 · phần 2', 'Kết quả mở thầu ngày 12/11'];
  const filesK = P(t, c.tai, 0.8); const rows = Math.floor(412 * P(t, c.dua, 1.2));
  return (<>
    <Head t={t} at={111.0} x={v ? 60 : 90} y={v ? 150 : 150} size={v ? 74 : 70} w={v ? 960 : 900}>Nếu đã mua số liệu?</Head>
    {(() => { const k = SPR(t, c.nam - 0.15, 0.8); if (k < 0.01) return null; return <div style={{ ...abs(v ? 760 : 1060, v ? 150 : 140), opacity: cl(k * 2), transform: `scale(${0.8 + 0.2 * k})`, fontFamily: SERIF, fontWeight: 700, fontSize: v ? 96 : 110, color: E.red, lineHeight: 1 }}>17:00</div>; })()}
    <In t={t} at={c.em - 0.3} y={30}><div style={{ ...abs(ib[0], ib[1], ib[2]), background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(40,30,20,.16)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 34, height: 26, borderRadius: 5, background: E.red, display: 'inline-block' }} />Hộp thư · thông tin thầu</div>
      {mails.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderTop: '1px solid #EEE', background: scan >= 0 && Math.floor(scan * 3) === i ? '#FFF3E8' : t > c.quet + 1.2 ? '#F6FBF8' : '#fff', opacity: P(t, c.em + i * 0.2, 0.3) }}>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 23 }}>{m}</div><div style={{ fontSize: 19, color: E.mute, marginTop: 3 }}>2 tệp đính kèm · .xlsx</div></div>
        {t > c.quet + 0.4 * (i + 1) ? <Check s={30} bg={E.green} /> : <div style={{ fontSize: 18, color: E.mute, fontWeight: 700 }}>16:4{i}</div>}
      </div>)}
    </div></In>
    {t > c.thay - 0.2 && t < c.nam && <Cap t={t} at={c.thay - 0.2} out={c.nam - 0.3} x={ib[0]} y={ib[1] + 370} w={ib[2]} size={34}>Không còn tải từng tệp bằng tay</Cap>}
    {/* Drive + Sheet */}
    {t > c.tai - 0.3 && <div style={{ ...abs(mid[0], mid[1]), opacity: P(t, c.tai - 0.3, 0.4) }}>
      <div style={{ display: 'flex', gap: v ? 26 : 26, flexDirection: 'column' }}>
        <div style={{ width: v ? 500 : 520, background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 20px 50px rgba(40,30,20,.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Img src={staticFile('media/google-drive.svg')} style={{ width: 44 }} /><div style={{ fontWeight: 800, fontSize: 25 }}>ThauHangNgay/</div></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>{[0, 1, 2, 3, 4].map((j) => { const kk = P(t, c.tai + j * 0.15, 0.4); return <div key={j} style={{ width: 70, height: 84, borderRadius: 8, background: '#E6F4EA', color: '#188038', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8, opacity: kk, transform: `translateY(${(1 - kk) * -50}px)` }}>.xlsx</div>; })}</div>
        </div>
        {t > c.dua - 0.3 && <div style={{ width: v ? 500 : 520, background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 20px 50px rgba(40,30,20,.14)', opacity: P(t, c.dua - 0.3, 0.4) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Logo k="sheets" s={44} /><div style={{ fontWeight: 800, fontSize: 25 }}>TongHopThau</div></div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 72, marginTop: 10, lineHeight: 1 }}>+{rows}<span style={{ fontSize: 30, fontStyle: 'italic', color: E.mute, fontWeight: 500 }}> dòng đã làm sạch</span></div>
        </div>}
      </div>
    </div>}
    {t > c.cap - 0.3 && <In t={t} at={c.cap - 0.3} y={60}><Phone x={ph[0]} y={ph[1]} w={ph[2]}><Shot src="td_m" />
      {(() => { const kk = SPR(t, c.bao - 0.1, 0.7); return <div style={{ position: 'absolute', left: 10, right: 10, top: 14 + (1 - cl(kk)) * -120, background: 'rgba(255,255,255,.97)', borderRadius: 18, padding: '12px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.25)', display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ width: 38, height: 38, borderRadius: 10, background: E.violet, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>T</div><div><div style={{ fontSize: 15, fontWeight: 800 }}>TenderWatch · 17:03</div><div style={{ fontSize: 14 }}>14 gói thầu mới khớp từ khoá</div></div></div>; })()}
    </Phone></In>}
    <Cap t={t} at={c.chinh - 0.1} x={v ? 800 : ph[0] + ph[2] / 2} y={v ? 1560 : 970} align="center" size={v ? 34 : 34}>ứng dụng do chính bạn dựng</Cap>
  </>);
};

// ---------- 9. Kết luận ----------
const IDEAS = ['Tra giá', 'Du lịch', 'Đấu thầu', 'CRM', 'Đào tạo', 'Podcast', 'Kho hàng', 'Lịch hẹn', 'Chấm công', 'Hợp đồng', 'Khảo sát', 'Báo cáo tuần', 'Tuyển dụng', 'Bảo hành', 'Sự kiện', 'Công nợ', 'Đơn hàng', 'Thư viện', 'Hồ sơ thầu', 'Chăm sóc khách', 'Lộ trình', 'Ngân sách', 'Nhập hàng', 'Phản hồi'];
const Brain = ({ t, v }) => {
  const c = { ung: W('brain', 'ứng'), ban: W('brain', 'bản'), xu: W('brain', 'xử'), ch: W('brain', 'chuyển'), hay: W('brain', 'hãy'), cl: W('brain', 'claude'), dr: W('brain', 'drive'), kho: W('brain', 'kho'), gh: W('brain', 'github'), sang: W('brain', 'sáng') };
  const up = P(t, c.hay - 0.2, 0.8);
  return (<>
    <div style={{ opacity: 1 - P(t, c.sang - 0.4, 0.5) }}>
      <div style={{ transform: `translateY(${-up * (v ? 120 : 90)}px) scale(${1 - up * 0.22})`, transformOrigin: v ? '540px 300px' : '960px 200px' }}>
        <Head t={t} at={c.ung - 0.2} x={v ? 540 : 960} y={v ? 300 : 230} align="center" size={v ? 110 : 120} w={v ? 980 : 1700}>“Ứng dụng không có gì <span style={{ fontStyle: 'italic', color: E.red }}>bí ẩn</span>.”</Head>
        <Kicker t={t} at={c.ban - 0.1} x={v ? 540 : 960} y={v ? 640 : 420} align="center" size={26}>BẢN CHẤT CHỈ LÀ MỘT YÊU CẦU</Kicker>
        <Head t={t} at={c.xu - 0.1} x={v ? 540 : 960} y={v ? 700 : 470} align="center" size={v ? 76 : 80} italic>xử lý dữ liệu <span style={{ color: E.red, fontStyle: 'normal' }}>&</span> chuyển dạng dữ liệu</Head>
      </div>
      {(() => { const k = P(t, c.cl - 0.3, 0.6); if (k < 0.01) return null; const y = v ? 980 : 690; const xs = v ? [240, 540, 840] : [620, 960, 1300]; return <div style={{ opacity: k }}>
        <Flow t={t} at={c.dr - 0.2} a={[xs[1] - 60, y + 50]} b={[xs[0] + 60, y + 50]} color={E.green} bend={0.4} />
        <Flow t={t} at={c.kho - 0.2} a={[xs[1] + 60, y + 50]} b={[xs[2] - 60, y + 50]} color={E.blue} bend={-0.4} />
        {[[xs[0], 'drive', 'quyền truy cập Drive', c.dr], [xs[1], 'claude', 'Claude', c.cl], [xs[2], 'github', 'kho backend trên GitHub', c.kho]].map(([x, k2, n, a]: any) => { const kk = SPR(t, a - 0.2, 0.8); if (kk < 0.01) return null; return <div key={k2} style={{ ...abs(x - 160, y, 320), display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: cl(kk * 2), transform: `scale(${0.8 + 0.2 * kk})` }}><Ico k={k2} s={100} /><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 38, marginTop: 14, textAlign: 'center', lineHeight: 1.05 }}>{n}</div></div>; })}
      </div>; })()}
    </div>
    {t > c.sang - 0.6 && <>
      {IDEAS.map((n, i) => { const cols = v ? 3 : 6; const r = Math.floor(i / cols), q = i % cols; const x = v ? 60 + q * 330 : 90 + q * 295, y = v ? 560 + r * 120 : 360 + r * 120; const k = SPR(t, c.sang - 0.3 + (r + q) * 0.07, 0.6); if (k < 0.01) return null; return <div key={n} style={{ ...abs(x, y, v ? 300 : 270), opacity: cl(k * 2), transform: `scale(${0.7 + 0.3 * k})`, background: i < 3 ? E.ink : '#fff', color: i < 3 ? '#fff' : E.ink, borderRadius: 10, padding: '20px 18px', fontFamily: SERIF, fontWeight: 700, fontSize: 36, textAlign: 'center', boxShadow: '0 12px 26px rgba(40,30,20,.10)' }}>{n}</div>; })}
      <Head t={t} at={c.sang - 0.2} x={v ? 540 : 960} y={v ? 200 : 140} align="center" size={v ? 92 : 100} w={v ? 980 : 1800}>Sáng tạo <span style={{ fontStyle: 'italic', color: E.red }}>gần như không giới hạn</span></Head>
    </>}
  </>);
};

// ---------- 10. Lời cảm ơn + trang cuối ----------
const Close4 = ({ t, v }) => {
  const c = { cam: W('close', 'cảm'), gio: W('close', 'giờ'), dau: W('close', 'đầu') };
  return (<>
    <Head t={t} at={c.cam - 0.2} x={v ? 540 : 960} y={v ? 420 : 250} align="center" size={v ? 92 : 104} w={v ? 980 : 1700}>Cảm ơn bạn đã đồng hành</Head>
    <Cap t={t} at={c.cam + 0.6} x={v ? 540 : 960} y={v ? 640 : 390} align="center" size={v ? 40 : 42}>cùng chuỗi Tự dựng app, bốn số</Cap>
    <Head t={t} at={c.gio - 0.1} x={v ? 540 : 960} y={v ? 820 : 520} align="center" size={v ? 80 : 88} italic color={E.red} w={v ? 960 : 1600}>Ứng dụng đầu tiên bạn muốn dựng là gì?</Head>
    {(() => { const k = P(t, c.dau, 0.5); if (k < 0.01) return null; return <div style={{ ...abs(v ? 90 : 560, v ? 1120 : 720, v ? 900 : 800), opacity: k, background: '#fff', borderRadius: 14, padding: '26px 30px', boxShadow: '0 20px 50px rgba(40,30,20,.14)', display: 'flex', alignItems: 'center', gap: 18 }}><ClaudeMark s={46} /><div style={{ fontSize: 34, color: E.mute, fontWeight: 500 }}>{typed('Mình muốn dựng một ứng dụng…', t, c.dau + 0.2, 16)}</div><Caret t={t} h={36} color={E.red} /></div>; })()}
  </>);
};
const End4 = ({ t, v }) => {
  const a = tl.endcard;
  return (<>
    <Head t={t} at={a} x={v ? 540 : 960} y={v ? 250 : 120} align="center" size={v ? 110 : 110}>Tự dựng app</Head>
    <Kicker t={t} at={a + 0.2} x={v ? 540 : 960} y={v ? 390 : 250} align="center" size={24}>TRỌN BỘ BỐN SỐ</Kicker>
    {[...COVERS, ['04', 'Bản chất', 'Tập cuối', 'tr_m', '']].map(([n, name, sub, src], i) => { const k = SPR(t, a + 0.3 + i * 0.15, 0.8); if (k < 0.01) return null; const w = v ? 400 : 330; const x = v ? 60 + (i % 2) * 560 : 170 + i * 410, y = v ? 500 + Math.floor(i / 2) * 590 : 340; return <div key={n} style={{ ...abs(x, y), opacity: cl(k * 2), transform: `rotate(${(i - 1.5) * 2}deg) scale(${0.85 + 0.15 * k})` }}><Cover n={n} name={name} sub={sub} src={src} w={w} /></div>; })}
    <div style={{ ...abs(0, v ? 1700 : 900, v ? 1080 : 1920), display: 'flex', justifyContent: 'center', gap: 22, opacity: P(t, a + 1, 0.5) }}>{['drive', 'sheets', 'gas', 'github', 'claude'].map((k) => <Ico key={k} k={k} s={v ? 80 : 84} />)}</div>
  </>);
};

const Subs4 = ({ t }) => {
  const s = tl.subs.find((x, i) => t >= x.s - 0.08 && t < (tl.subs[i + 1] ? Math.min(tl.subs[i + 1].s - 0.08, x.e + 0.6) : x.e + 0.6));
  if (!s) return null;
  return <div style={{ ...abs(60, 1650, 960), display: 'flex', justifyContent: 'center' }}><div style={{ background: E.ink, color: '#fff', borderRadius: 10, padding: '14px 26px', fontSize: 40, fontWeight: 700, lineHeight: 1.3, textAlign: 'center' }}>{s.t}</div></div>;
};
const SfxTrack4 = () => {
  const L = [];
  ORDER.slice(1).forEach((id) => L.push([SB[id][0], 'page_turn', 0.28]));
  L.push([tl.endcard, 'shimmer', 0.3]);
  ['podcast', 'đào', 'crm'].forEach((w) => L.push([W('hook', w) - 0.15, 'pop', 0.3])); L.push([W('hook', 'bản') - 0.2, 'boom_soft', 0.35]);
  ['lấy', 'xử', 'trình'].forEach((w) => L.push([W('essence', w) - 0.2, 'tick', 0.45])); L.push([W('essence', 'chuyển'), 'whoosh_soft', 0.25], [W('essence', 'phần'), 'pop', 0.28], [W('essence', 'tự') - 0.15, 'stamp', 0.4]);
  ['drive', 'sheet', 'apps', 'github'].forEach((w) => L.push([W('roles', w) - 0.2, 'pop', 0.3])); L.push([W('roles', 'claude') - 0.2, 'shimmer', 0.3], [W('roles', 'kết'), 'whoosh_long', 0.22], [W('roles', 'maps') - 0.2, 'pop', 0.28]);
  L.push([W('price', 'giờ'), 'tick', 0.45], [W('price', 'ghi') - 0.2, 'whoosh', 0.22], [W('price', 'so') - 0.2, 'swoosh_short', 0.3], [W('price', 'claude') - 0.1, 'sparkle', 0.25], [W('price', 'giảm') + 0.3, 'pop', 0.3]);
  L.push([W('travel1', 'tab') - 0.2, 'pop', 0.28], [W('travel1', 'tab', 1) - 0.2, 'pop', 0.28], [W('travel1', 'chụp'), 'camera', 0.4], [W('travel1', 'chuyển'), 'glitch', 0.16]);
  L.push([W('travel2', 'sẽ') - 0.2, 'whoosh_long', 0.25], [W('travel2', 'chỉ', 1) - 0.2, 'swoosh_short', 0.28], [W('travel2', 'thực'), 'sparkle', 0.25], [W('travel2', 'giới') - 0.1, 'notification', 0.25]);
  L.push([W('tender1', 'tải'), 'whoosh_soft', 0.22], [W('tender1', 'làm'), 'swoosh_short', 0.28], [W('tender1', 'cập'), 'tick', 0.4], [W('tender1', 'trực') - 0.2, 'whoosh', 0.22]);
  L.push([W('tender2', 'email') - 0.3, 'notification', 0.25], [W('tender2', 'năm') - 0.15, 'impact', 0.25], [W('tender2', 'tải'), 'whoosh_soft', 0.22], [W('tender2', 'đưa'), 'swoosh_short', 0.26], [W('tender2', 'báo') - 0.1, 'notification', 0.32], [W('tender2', 'chính'), 'success', 0.25]);
  L.push([W('brain', 'ứng') - 0.2, 'swell', 0.25], [W('brain', 'claude') - 0.2, 'shimmer', 0.25], [W('brain', 'sáng') - 0.3, 'riser', 0.25], [W('close', 'giờ') - 0.1, 'sparkle', 0.25]);
  return (<>{L.map(([a, n, vv], i) => <Sfx key={i} at={a} name={n} vol={vv} />)}<Sequence from={Math.round(W('price', 'trước') * 30)} durationInFrames={150}><Audio src={staticFile('sfx/typing.wav')} volume={0.16} loop /></Sequence><Sequence from={Math.round(W('close', 'đầu') * 30)} durationInFrames={60}><Audio src={staticFile('sfx/typing.wav')} volume={0.14} loop /></Sequence></>);
};

export const Main: React.FC<{ v: boolean }> = ({ v }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: E.ink }}>
      <Paper4 />
      <Mast t={t} v={v} />
      <Scene t={t} id="hook" enter="rise"><Hook4 t={t} v={v} /></Scene>
      <Scene t={t} id="essence" enter="rise"><Essence t={t} v={v} /></Scene>
      <Scene t={t} id="roles" enter="focus"><Roles t={t} v={v} /></Scene>
      <Scene t={t} id="price" enter="right"><Price t={t} v={v} /></Scene>
      <Scene t={t} id="travel1" enter="rise"><Travel1 t={t} v={v} /></Scene>
      <Scene t={t} id="travel2" enter="zoom"><Travel2 t={t} v={v} /></Scene>
      <Scene t={t} id="tender1" enter="right"><Tender1 t={t} v={v} /></Scene>
      <Scene t={t} id="tender2" enter="rise"><Tender2 t={t} v={v} /></Scene>
      <Scene t={t} id="brain" enter="focus"><Brain t={t} v={v} /></Scene>
      <Scene t={t} id="close" enter="rise"><Close4 t={t} v={v} /></Scene>
      <Scene t={t} id="end" enter="focus"><End4 t={t} v={v} /></Scene>
      {v && <Subs4 t={t} />}
      <Audio src={staticFile('narration.wav')} />
      <Audio src={staticFile('music.wav')} volume={0.15} />
      <SfxTrack4 />
    </AbsoluteFill>
  );
};

export const ReelThumb: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: FONT, color: E.ink, overflow: 'hidden' }}>
    <Paper4 />
    <div style={{ ...abs(60, 70, 960), display: 'flex', alignItems: 'baseline' }}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44 }}>Tự dựng app</div><div style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 800, letterSpacing: 5, color: E.red }}>SỐ 04 · TẬP CUỐI</div></div>
    <div style={{ ...abs(60, 230, 960), fontFamily: SERIF, fontWeight: 700, fontSize: 210, lineHeight: 0.9, letterSpacing: -3 }}>Bản chất<span style={{ color: E.red }}>.</span></div>
    <div style={{ ...abs(64, 440, 960), fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 78, color: E.mute }}>của mọi ứng dụng</div>
    <div style={{ ...abs(64, 560, 960), fontSize: 34, fontWeight: 700, lineHeight: 1.4 }}>Dữ liệu vào <span style={{ color: E.red }}>→</span> xử lý <span style={{ color: E.red }}>→</span> hiển thị</div>
    <div style={{ ...abs(64, 640), display: 'flex', gap: 14 }}>{['drive', 'sheets', 'gas', 'github', 'claude'].map((k) => <Ico key={k} k={k} s={84} />)}</div>
    <div style={{ ...abs(-60, 900, 800, 800), WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)', maskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)' }}><Img src={staticFile('media/me.png')} style={{ width: '100%', height: '100%' }} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(6deg)', transformOrigin: '850px 1300px' }}><Phone x={650} y={860} w={360}><Shot src="tr_m" /></Phone></div>
    <div style={{ ...abs(0, 1740, 1080), textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: E.mute }}>Tra giá · Du lịch · Đấu thầu</div>
  </AbsoluteFill>
);
