// @ts-nocheck
// DailyCast: video hướng dẫn tạo app bằng Claude Code + GitHub + Google Sheets (Apps Script).
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
const ORDER = ['s1', 's2', 's3', 'map', 'field', 'manager', 'kpi', 'why', 'mech', 'change', 'close'];
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

// ================= TẬP 3 · FieldMap · CRM bản đồ · phong cách "bản đồ là sân khấu" =================
import MAP from './data/map.json';
const M: any = MAP;
const K = { paper: '#F3EFE6', paper2: '#FBF8F1', ink: '#1D2B3A', mute: '#6B7686', line: '#D9D2C3', coral: '#E4572E', blue: '#2E86AB', green: '#2A9D6F', amber: '#F2A541', violet: '#7B61FF' };
const STC = { care: K.blue, revisit: K.amber, won: K.green, new: K.coral };
const STN = { care: 'Đang chăm sóc', revisit: 'Cần gặp lại', won: 'Đã chốt đơn', new: 'Khách mới' };
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const HN = M.prov.find((p) => p.k === 'vn-318');
const HNC = M.cust.filter((c) => c.p === 'vn-318');
const TODAY = [HNC[3], HNC[8], HNC[12], HNC[17]].filter(Boolean);
const CLINIC = HNC[8] || HNC[0];
const STREETS = (() => { const r = rnd(11); const [x0, y0, x1, y1] = HN.box; const L = []; for (let i = 0; i < 46; i++) { let x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), a = r() * Math.PI * 2; const pts = [[x, y]]; for (let j = 0; j < 7; j++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 38; y += Math.sin(a) * 38; pts.push([x, y]); } L.push({ d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L'), w: i < 10 ? 2.2 : 1.2 }); } return L; })();
const RIVER = 'M330 760 C 470 820, 560 880, 660 930 S 820 1010, 880 1090 S 1010 1260, 1090 1360 S 1250 1560, 1330 1700';
const FMMark = ({ s }) => (<svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block' }}><rect width="100" height="100" rx="26" fill={K.coral} /><path d="M50 18a22 22 0 0 0-22 22c0 16 22 40 22 40s22-24 22-40a22 22 0 0 0-22-22zm0 30a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="#fff" /></svg>);
const Tile3 = ({ k, s = 100 }) => <div style={{ width: s, height: s, borderRadius: s * 0.26, background: '#fff', border: `1px solid ${K.line}`, boxShadow: '0 10px 26px rgba(29,43,58,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k === 'fm' ? <FMMark s={s * 0.62} /> : <Logo k={k} s={s * 0.58} />}</div>;
const Paper = ({ x, y, w, h, r = 0, children, style = {}, o = 1, s = 1 }) => <div style={{ ...abs(x, y, w, h), transform: `rotate(${r}deg) scale(${s})`, opacity: o, background: '#fff', borderRadius: 14, boxShadow: '0 18px 40px rgba(29,43,58,.18), 0 2px 4px rgba(29,43,58,.08)', overflow: 'hidden', ...style }}>{children}</div>;
const Big = ({ t, at, children, size, color = K.ink, align = 'left', style = {} }) => { const k = P(t, at, 0.5); return <div style={{ fontSize: size, fontWeight: 800, letterSpacing: -size * 0.035, lineHeight: 1.05, color, textAlign: align, opacity: k, transform: `translateY(${(1 - k) * 30}px)`, textShadow: '0 0 24px #F3EFE6, 0 0 10px #F3EFE6, 0 0 4px #F3EFE6', ...style }}>{children}</div>; };
const Hl = ({ children, c = K.coral }) => <span style={{ color: c }}>{children}</span>;

// máy quay trên bản đồ
const useCam = (t, v) => {
  const SW = v ? 1080 : 1920, SH = v ? 1920 : 1080; const z0 = v ? 0.5 : 0.52;
  const hz = v ? 1.55 : 2.3, pz = v ? 3.2 : 5;
  const pinAt = (z) => (v ? [CLINIC.x, CLINIC.y + (SH * 0.16) / (z0 * z)] : [CLINIC.x + (SW * 0.18) / (z0 * z), CLINIC.y]);
  const hn = [HN.c[0] + (v ? 0 : 60), HN.c[1] + (v ? 60 : 0)];
  const ph = W('map', 'Phóng'), fs = SEG('field').start, ms = SEG('manager').start, ks = SEG('kpi').start, cs = SEG('close').start;
  const keys = [[0, 1000, 985, 1], [ph - 0.2, 1000, 985, 1], [ph + 1.3, hn[0], hn[1], hz], [fs + 0.1, hn[0], hn[1], hz], [fs + 1.5, ...pinAt(pz), pz], [ms + 0.1, ...pinAt(pz), pz], [ms + 1.3, hn[0], hn[1], hz * 0.95], [ks + 0.1, hn[0], hn[1], hz * 0.95], [ks + 1.4, 1000, 985, 1], [cs, 1000, 985, 1], [tl.total, 1000, 985, 0.86]];
  let cx = keys[0][1], cy = keys[0][2], zf = keys[0][3];
  for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t >= b[0]) { cx = b[1]; cy = b[2]; zf = b[3]; continue; } const e = eio((t - a[0]) / Math.max(0.01, b[0] - a[0])); cx = lerp(a[1], b[1], e); cy = lerp(a[2], b[2], e); zf = lerp(a[3], b[3], e); break; }
  const z = z0 * zf; return { cx, cy, z, zf, SW, SH, sx: (x) => (x - cx) * z + SW / 2, sy: (y) => (y - cy) * z + SH / 2 };
};

// ---------- CẢNH ----------
const Story1 = ({ t, v }) => {
  const c = { bay: W('s1', 'Bảy'), minh: W('s1', 'Minh'), ds: W('s1', 'Doanh'), excel: W('s1', 'Excel'), kh: W('s1', 'Thông'), so: W('s1', 'sổ'), zalo: W('s1', 'Zalo'), bc: W('s1', 'báo'), dai: W('s1', 'dài') };
  const drift = (i) => Math.sin(t * 0.7 + i * 1.7) * 6;
  const L = v ? { clock: [70, 330], id: [560, 300], xl: [60, 560], nb: [560, 820], chat: [80, 1040], sh: [70, 1280], st: [700, 560] } : { clock: [110, 120], id: [1420, 110], xl: [120, 340], nb: [780, 300], chat: [1360, 360], sh: [380, 690], st: [1180, 120] };
  const av = 104;
  return (
    <>
      <div style={{ ...abs(v ? (1080 - av) / 2 : 1920 - 110 - av, v ? 70 : 760, av, av) }}><Pop t={t} at={0.2}><div style={{ width: av, height: av, borderRadius: av, border: '4px solid #fff', boxShadow: '0 10px 26px rgba(29,43,58,.2)', overflow: 'hidden', background: '#F6D7C9' }}><Img src={staticFile('media/me.png')} style={{ width: '112%', height: '112%', marginLeft: '-6%', marginTop: '2%' }} /></div></Pop><In t={t} at={0.4}><div style={{ textAlign: 'center', marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: 3, color: K.coral, whiteSpace: 'nowrap', marginLeft: -40, width: av + 80 }}>TẬP 3</div></In></div>
      <In t={t} at={c.bay - 0.2} y={30} style={{ ...abs(L.clock[0], L.clock[1] + drift(0)) }}><Paper x={0} y={0} w={300} h={150} r={-4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, background: K.ink, color: '#fff' }}><svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d={`M12 12 L12 7`} stroke={K.amber} /><path d="M12 12 L15 14" /></svg><div style={{ fontSize: 66, fontWeight: 800, fontFamily: MONO }}>07:00</div></Paper></In>
      <In t={t} at={c.minh - 0.1} y={30} style={{ ...abs(L.id[0], L.id[1] + drift(1)) }}><Paper x={0} y={0} w={420} h={130} r={3} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 20, boxSizing: 'border-box' }}><div style={{ width: 86, height: 86, borderRadius: 43, background: K.coral, color: '#fff', fontSize: 42, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M</div><div><div style={{ fontSize: 34, fontWeight: 800 }}>Minh</div><div style={{ fontSize: 22, color: K.mute }}>Nhân viên kinh doanh</div></div></Paper></In>
      <In t={t} at={c.ds - 0.1} y={40} style={{ ...abs(L.xl[0], L.xl[1] + drift(2)) }}><Paper x={0} y={0} w={v ? 560 : 600} h={330} r={-2}>
        <div style={{ height: 46, background: '#1D6F42', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 19, fontWeight: 700 }}>DoanhSo_2026_v3_final(2).xlsx</div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(4,1fr)', fontFamily: MONO, fontSize: 17 }}>{Array.from({ length: 35 }).map((_, i) => <div key={i} style={{ height: 40, borderRight: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5', padding: '0 8px', lineHeight: '40px', background: i % 5 === 0 ? '#F3F3F3' : '#fff', color: i % 5 === 0 ? '#888' : '#222', overflow: 'hidden' }}>{i % 5 === 0 ? i / 5 + 1 : ['12.400.000', '#REF!', '8.250.000', '=SUM(B2:B9', '3.100.000', '???', '15.600.000'][(i * 3) % 7]}</div>)}</div>
      </Paper></In>
      <In t={t} at={c.so - 0.1} y={40} style={{ ...abs(L.nb[0], L.nb[1] + drift(3)) }}><Paper x={0} y={0} w={v ? 460 : 470} h={v ? 300 : 340} r={5} style={{ background: '#FFFDF5', backgroundImage: 'repeating-linear-gradient(transparent 0 37px, #C9DCEB 37px 38px)', padding: '28px 28px 0 60px', boxSizing: 'border-box', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 25, lineHeight: '38px', color: '#2B3A55' }}>
        <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, width: 2, background: '#F0A7A7' }} />
        <div>Gọi lại PK An Phát ??</div><div>NK Minh Châu: báo giá…</div><div style={{ textDecoration: 'line-through' }}>Hẹn BS Hoa thứ 3</div><div>→ thứ 5? hỏi lại</div><div>Đơn tuần trước: 2 hộp?</div>
      </Paper></In>
      <In t={t} at={c.zalo - 0.2} y={40} style={{ ...abs(L.chat[0], L.chat[1] + drift(4)) }}><div style={{ width: v ? 520 : 470, display: 'flex', flexDirection: 'column', gap: 12, transform: 'rotate(-3deg)' }}>{[['Em ơi gửi lại giá cho chị nhé', 0], ['Đơn tuần trước giao chưa em?', 0], ['Dạ để em kiểm tra ạ', 1], ['Bên chị đang dùng hãng khác rồi', 0]].map(([m, me], i) => <div key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', padding: '14px 20px', borderRadius: 22, background: me ? '#2E86AB' : '#fff', color: me ? '#fff' : K.ink, fontSize: 24, fontWeight: 500, boxShadow: '0 10px 24px rgba(29,43,58,.14)', opacity: P(t, c.zalo + i * 0.25, 0.3) }}>{m}</div>)}</div></In>
      <In t={t} at={c.bc - 0.1} y={40} style={{ ...abs(L.sh[0], L.sh[1] + drift(5)) }}><Paper x={0} y={0} w={v ? 940 : 1180} h={v ? 300 : 300} r={1}>
        <div style={{ height: 46, background: '#188038', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 19, fontWeight: 700 }}>BaoCaoTuan_T11 · Google Sheet</div>
        <div style={{ overflow: 'hidden', height: 254 }}><div style={{ transform: `translateX(${-Math.max(0, t - c.dai) * 160}px)`, whiteSpace: 'nowrap' }}>{['T2: Gặp NK Minh Châu, BS Hoa hỏi giá vật liệu trám, hẹn gửi báo giá, chưa chốt, cần gọi lại, đối thủ đang chào giá thấp hơn, khách muốn xem demo…', 'T3: PK An Phát, không gặp được trưởng khoa, để lại catalogue, hẹn tuần sau, ghi chú: kế toán nói chưa thanh toán đơn cũ…', 'T4: BV Mắt Ánh Dương, họp khoa, giới thiệu sản phẩm mới, cần báo giá chi tiết, chuyển lại cho sếp duyệt chiết khấu…', 'T5: Gọi 6 khách, 2 khách hẹn lại, 1 khách đổi người phụ trách, cập nhật lại số điện thoại…', 'T6: Tổng hợp doanh số tuần, chưa khớp với file Excel, đang kiểm tra lại…'].map((r, i) => <div key={i} style={{ height: 50, lineHeight: '50px', borderBottom: '1px solid #E6E6E6', fontSize: 21, padding: '0 16px', color: '#333' }}>{r}</div>)}</div></div>
      </Paper></In>
      <In t={t} at={c.kh} y={30} style={{ ...abs(L.st[0], L.st[1] + drift(6)) }}><div style={{ width: 230, height: 200, background: '#FFE27A', transform: 'rotate(6deg)', boxShadow: '0 14px 30px rgba(29,43,58,.18)', padding: 22, boxSizing: 'border-box', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 28, color: '#5A4500' }}>Hẹn T5??<br />Gửi giá NK Hoa!!</div></In>
    </>
  );
};

const Story2 = ({ t, v }) => {
  const c = { sep: W('s2', 'sếp'), hoi: W('s2', 'hỏi'), luc: W('s2', 'lục'), dl: W('s2', 'Dữ'), chong: W('s2', 'chồng'), ls: W('s2', 'lịch'), kt: W('s2', 'không') };
  const r = rnd(5); const cards = Array.from({ length: v ? 16 : 22 }).map((_, i) => ({ x: r() * (v ? 900 : 1700), y: (v ? 260 : 80) + r() * (v ? 1200 : 820), rot: (r() - 0.5) * 40, ty: Math.floor(r() * 4), d: r() }));
  const mx = (v ? 120 : 200) + ((t - c.luc) * (v ? 260 : 520)) % (v ? 860 : 1520), my = (v ? 800 : 480) + Math.sin(t * 3) * (v ? 260 : 180);
  return (
    <>
      {cards.map((k, i) => { const at = c.chong - 0.3 + k.d * 0.8; const o = P(t, at, 0.4); if (o <= 0) return null; return <div key={i} style={{ ...abs(k.x, k.y + Math.sin(t + i) * 8), opacity: o * 0.9, transform: `rotate(${k.rot}deg) scale(${0.6 + 0.4 * o})` }}><Paper x={0} y={0} w={180} h={120} r={0} style={{ background: ['#fff', '#FFE27A', '#E8F1F8', '#EAF6EE'][k.ty], padding: 14, boxSizing: 'border-box' }}>{Array.from({ length: 4 }).map((_, j) => <div key={j} style={{ height: 8, borderRadius: 4, background: '#C9C2B3', width: `${60 + ((i + j) * 13) % 40}%`, marginBottom: 12 }} />)}</Paper></div>; })}
      {t > c.chong && <svg style={{ ...abs(0, 0, v ? 1080 : 1920, v ? 1920 : 1080) }}>{cards.slice(0, 14).map((k, i) => { const b = cards[(i * 5 + 3) % cards.length]; return <path key={i} d={`M${k.x + 90} ${k.y + 60} Q ${(k.x + b.x) / 2 + 80} ${(k.y + b.y) / 2 - 120} ${b.x + 90} ${b.y + 60}`} stroke={K.coral} strokeWidth="2.5" fill="none" opacity={0.6 * P(t, c.chong + i * 0.05, 0.4)} strokeDasharray="600" strokeDashoffset={600 * (1 - P(t, c.chong + i * 0.05, 0.6))} />; })}</svg>}
      <div style={{ ...abs(v ? 60 : 360, v ? 330 : 140, v ? 960 : 1200) }}>
        <Pop t={t} at={c.sep - 0.1}><div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, background: K.ink, color: '#fff', fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>Sếp</div>
          <div style={{ background: '#fff', borderRadius: '8px 34px 34px 34px', padding: '30px 36px', boxShadow: '0 24px 60px rgba(29,43,58,.2)', fontSize: v ? 44 : 50, fontWeight: 700, lineHeight: 1.3 }}>{typed('Tháng trước mình gặp phòng khám An Phát mấy lần? Họ đang quan tâm sản phẩm gì?', t, c.hoi - 0.2, 26)}</div>
        </div></Pop>
      </div>
      {t > c.luc - 0.1 && t < c.kt + 0.3 && <div style={{ ...abs(mx - 70, my - 70, 140, 140), opacity: P(t, c.luc - 0.1, 0.3) }}><svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke={K.ink} strokeWidth="2"><circle cx="10" cy="10" r="6.5" fill="rgba(255,255,255,.55)" /><path d="M15 15l6 6" strokeWidth="3" strokeLinecap="round" /></svg><div style={{ position: 'absolute', left: 60, top: -20, fontSize: 64, fontWeight: 800, color: K.coral }}>?</div></div>}
      <div style={{ ...abs(0, v ? 1330 : 820, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}>
        <Pop t={t} at={c.kt - 0.1}><div style={{ padding: '18px 40px', border: `5px solid ${K.coral}`, color: K.coral, borderRadius: 18, fontSize: v ? 54 : 62, fontWeight: 800, letterSpacing: 2, transform: 'rotate(-4deg)', background: 'rgba(255,255,255,.85)' }}>KHÔNG THỂ TRA LẠI</div></Pop>
      </div>
    </>
  );
};

const Story3 = ({ t, v }) => {
  const c = { voi: W('s3', 'Với'), nl: W('s3', 'nhập'), tc: W('s3', 'tra'), hai: W('s3', 'hai'), va: W('s3', 'Và'), crm: W('s3', 'CRM'), rieng: W('s3', 'riêng') };
  const out = P(t, c.va - 0.2, 0.6);
  return (
    <>
      <div style={{ ...abs(0, v ? 560 : 260, v ? 1080 : 1920), display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: v ? 20 : 60, opacity: 1 - out, transform: `scale(${1 - out * 0.3})` }}>
        <Big t={t} at={c.nl - 0.1} size={v ? 120 : 150}><Hl>Nhập liệu</Hl></Big>
        <Big t={t} at={c.tc - 0.2} size={v ? 90 : 110} color={K.mute}>+</Big>
        <Big t={t} at={c.tc - 0.1} size={v ? 120 : 150}><Hl c={K.blue}>Tra cứu</Hl></Big>
      </div>
      <div style={{ ...abs(0, v ? 1010 : 500, v ? 1080 : 1920), textAlign: 'center', opacity: 1 - out }}><Big t={t} at={c.hai} size={v ? 46 : 52} color={K.mute} align="center">hai việc tốn thời gian nhất của người bán hàng</Big></div>
      {t > c.va - 0.3 && <TitleBox t={t} at={c.crm - 0.2} v={v} x={v ? 540 : 960} y={v ? 190 : 880} align="center">Một <span style={{ color: K.coral }}>CRM</span> của riêng mình</TitleBox>}
      {t > c.va - 0.3 && t < c.crm + 0.6 && <div style={{ ...abs((v ? 540 : 960) - 60, (v ? 960 : 540) - 60, 120, 120), opacity: P(t, c.va - 0.3, 0.3) * (1 - P(t, c.crm + 0.2, 0.4)), transform: `scale(${0.5 + 1.5 * P(t, c.va, 1)})` }}><FMMark s={120} /></div>}
      {t > c.crm - 0.1 && (() => { const k = eio((t - c.crm + 0.1) / 1.0); const B = v ? [40, 330, 1000, 1240] : [40, 40, 1840, 1000]; const b0 = v ? [440, 860, 200, 200] : [860, 440, 200, 200]; const box = B.map((x, i) => lerp(b0[i], x, k)); return <div style={{ opacity: P(t, c.crm - 0.1, 0.3) }}><UICard box={box} radius={26} layers={[{ src: 'd_full', view: v ? [292, 326, 476, 590] : V_ALL, o: 1 }]} /></div>; })()}
    </>
  );
};

// ---- giao diện CRM Working Map thật (ảnh chụp dữ liệu giả, 1440×900 css, ảnh ×5) ----
const UIW = { d: [1440, 900], m: [390, 844] };
const lerpV = (a, b, e) => a.map((x, i) => lerp(x, b[i], e));
const camV = (t, keys) => { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t >= b[0]) { v = b[1]; continue; } const d = b[2] || 1.1; if (t > b[0] - d) v = lerpV(a[1], b[1], eio((t - (b[0] - d)) / d)); break; } return v; };
const UIImg = ({ src, view, w, h, o = 1, kind = 'd' }) => { const [W0] = UIW[kind]; const s = Math.max(w / view[2], h / view[3]); return <Img src={staticFile(`media/crm_${src}.jpg`)} style={{ position: 'absolute', left: -view[0] * s + (w - view[2] * s) / 2, top: -view[1] * s + (h - view[3] * s) / 2, width: W0 * s, opacity: o }} />; };
const UICard = ({ box, layers, radius = 26, style = {} }) => (
  <div style={{ ...abs(box[0], box[1], box[2], box[3]), borderRadius: radius, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 80px rgba(29,43,58,.22), 0 0 0 1px rgba(29,43,58,.06)', ...style }}>
    {layers.map((L, i) => L.o > 0.001 ? <UIImg key={i} {...L} w={box[2]} h={box[3]} /> : null)}
  </div>
);
// toạ độ css ⇒ toạ độ màn hình trong 1 thẻ
const toScr = (box, view, x, y) => { const s = Math.max(box[2] / view[2], box[3] / view[3]); return [box[0] + (x - view[0]) * s + (box[2] - view[2] * s) / 2, box[1] + (y - view[1]) * s + (box[3] - view[3] * s) / 2, s]; };
const Ring = ({ t, at, box, view, r: [x, y, w, h], out }) => { const k = P(t, at, 0.35); let o = k; if (out !== undefined) o *= 1 - P(t, out, 0.3); if (o <= 0.01) return null; const [sx, sy, s] = toScr(box, view, x, y); return <div style={{ ...abs(sx - 6, sy - 6, w * s + 12, h * s + 12), borderRadius: 16, border: `4px solid ${K.coral}`, boxShadow: '0 0 0 9999px rgba(29,43,58,.0), 0 10px 30px rgba(228,87,46,.25)', opacity: o }} />; };
const Tag = ({ t, at, x, y, text, out, align = 'left' }) => { const k = P(t, at, 0.4); let o = k; if (out !== undefined) o *= 1 - P(t, out, 0.3); if (o <= 0.01) return null; return <div style={{ ...abs(x, y), transform: `translate(${align === 'right' ? '-100%' : align === 'center' ? '-50%' : '0'}, ${(1 - k) * 14}px)`, opacity: o, padding: '12px 22px', borderRadius: 14, background: K.ink, color: '#fff', fontSize: 28, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(29,43,58,.25)' }}>{text}</div>; };
const TitleBox = ({ t, at, children, v, x, y, align = 'left' }) => { const k = P(t, at, 0.5); return <div style={{ ...abs(x, y), transform: `translate(${align === 'center' ? '-50%' : '0'}, ${(1 - k) * 20}px)`, opacity: k, padding: v ? '16px 30px' : '18px 34px', borderRadius: 22, background: 'rgba(255,255,255,.96)', boxShadow: '0 16px 40px rgba(29,43,58,.18)', fontSize: v ? 50 : 54, fontWeight: 800, letterSpacing: -1.4, whiteSpace: 'nowrap', color: K.ink }}>{children}</div>; };
const V_ALL = [0, 0, 1440, 783], V_MAP = [11, 300, 1060, 576], V_CAL = [10, 105, 1062, 577];

const MapScene = ({ t, v }) => {
  const c = { moi: W('map', 'Mọi'), tren: W('map', 'Phía'), duoi: W('map', 'phía', 1), xl: W('map', 'chấm'), xd: W('map', 'chấm', 1), ph: W('map', 'Phóng'), kh: W('map', 'khách', 1) };
  if (v) {
    const box = [40, 330, 1000, 1240]; const VM = [292, 326, 476, 590];
    const zo = P(t, c.ph - 0.1, 0.6), z2 = P(t, c.ph + 1.2, 0.6);
    const vz = camV(t, [[0, VM], [c.ph + 0.5, [330, 340, 400, 496], 0.9]]);
    return (<>
      <TitleBox t={t} at={c.moi - 0.1} v x={540} y={200} align="center">Bản đồ <span style={{ color: K.coral }}>làm việc</span></TitleBox>
      {t < c.duoi + 0.3 ? (
        <div style={{ opacity: 1 - P(t, c.duoi, 0.3) }}><Phone x={250} y={340} w={580}><Shot src="crm_m_wm" /></Phone>
          {t > c.tren - 0.1 && <div style={{ ...abs(262, 425, 556, 112), borderRadius: 18, border: `5px solid ${K.coral}`, opacity: P(t, c.tren - 0.1, 0.3) }} />}</div>
      ) : (
        <UICard box={box} layers={[{ src: 'd_full', view: vz, o: 1 - zo }, { src: 'd_zoom1', view: vz, o: zo * (1 - z2) }, { src: 'd_zoom2', view: vz, o: z2 }]} />
      )}
      <Tag t={t} at={c.xl - 0.1} x={70} y={1480} text="● Xanh lá: đã làm" out={c.ph} />
      <Tag t={t} at={c.xd - 0.1} x={1010} y={1480} align="right" text="● Xanh dương: kế hoạch" out={c.ph} />
      <Tag t={t} at={c.kh - 0.2} x={540} y={1480} align="center" text="Khách cần ghé thăm" />
    </>);
  }
  const box = [40, 40, 1840, 1000];
  const view = camV(t, [[0, V_ALL], [c.duoi + 0.2, V_MAP, 1.0], [c.ph + 0.6, [190, 330, 640, 348], 1.0]]);
  const zo = P(t, c.ph - 0.1, 0.6), z2 = P(t, c.ph + 1.0, 0.6);
  return (<>
    <UICard box={box} layers={[{ src: 'd_full', view, o: 1 - zo }, { src: 'd_zoom1', view, o: zo * (1 - z2) }, { src: 'd_zoom2', view, o: z2 }]} />
    <Ring t={t} at={c.tren - 0.1} box={box} view={view} r={[10, 115, 1060, 200]} out={c.duoi} />
    <TitleBox t={t} at={c.moi - 0.1} x={90} y={880}>Working Map: <span style={{ color: K.coral }}>lịch + bản đồ</span></TitleBox>
    <Tag t={t} at={c.xl - 0.1} x={100} y={90} text="● Xanh lá: việc đã làm" out={c.ph} />
    <Tag t={t} at={c.xd - 0.1} x={520} y={90} text="● Xanh dương: kế hoạch" out={c.ph} />
    <Tag t={t} at={c.kh - 0.2} x={1820} y={90} align="right" text="Khách cần ghé thăm" />
  </>);
};

const Field = ({ t, v }) => {
  const c = { di: W('field', 'Đi'), ghi: W('field', 'ghi'), anh: W('field', 'ảnh'), ng: W('field', 'người'), nd: W('field', 'nội'), bt: W('field', 'bước'), nhung: W('field', 'Những'), ls: W('field', 'lịch'), gon: W('field', 'gọn') };
  const pw = v ? 470 : 470, px = v ? 305 : 1020, py = v ? 330 : 60, u = pw * 0.93 / 390;
  const crush = P(t, c.gon - 0.5, 0.5); const rowsO = P(t, c.nhung - 0.2, 0.4) * (1 - crush);
  return (<>
    {!v && <UICard box={[40, 150, 900, 780]} layers={[{ src: 'd_zoom2', view: [120, 330, 700, 607], o: 1 }]} style={{ opacity: 0.95 }} />}
    <TitleBox t={t} at={c.di - 0.1} v={v} x={v ? 540 : 60} y={v ? 200 : 50} align={v ? 'center' : 'left'}>Ghi nhận <span style={{ color: K.coral }}>ngay tại chỗ</span></TitleBox>
    <In t={t} at={c.ghi - 0.4} y={120}><Phone x={px} y={py} w={pw}><Shot src="crm_m_acc" />
      {t > c.ng - 0.1 && <div style={{ ...abs(18 * u, 628 * u, 354 * u, 140 * u), borderRadius: 14 * u, border: `${4 * u}px solid ${K.coral}`, opacity: P(t, c.ng - 0.1, 0.3) * (1 - P(t, c.nhung - 0.3, 0.3)) }} />}
      {t > c.ls - 0.2 && <div style={{ ...abs(12 * u, 505 * u, 366 * u, 330 * u), borderRadius: 16 * u, border: `${4 * u}px solid ${K.green}`, opacity: P(t, c.ls - 0.2, 0.3) }} />}
    </Phone></In>
    <div style={{ ...abs(v ? 600 : 1520, v ? 1050 : 520), transform: `rotate(${v ? 5 : 6}deg)` }}><Pop t={t} at={c.anh - 0.1}><div style={{ background: '#fff', padding: '14px 14px 50px', boxShadow: '0 24px 50px rgba(29,43,58,.25)', width: v ? 400 : 340 }}><Img src={staticFile('media/p_dental.jpg')} style={{ width: '100%', height: v ? 290 : 250, objectFit: 'cover', display: 'block' }} /><div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, marginTop: 10, color: K.ink }}>Tại phòng khám · 08:42</div></div></Pop></div>
    {rowsO > 0.01 && <div style={{ ...abs(v ? 60 : 100, v ? 1440 : 760, v ? 960 : 860), opacity: rowsO, transform: `scaleY(${1 - crush}) rotate(${crush * -4}deg)`, transformOrigin: '50% 100%', background: '#fff', border: '1px solid #DDD', fontFamily: MONO, fontSize: 19, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,.08)' }}>{['| 11/11 | Minh | NK Smile | gặp BS, hỏi giá, hẹn demo, chưa chốt, cần gọi lại…', '| 11/11 | Minh | NK Kim | không gặp, để lại catalogue, hẹn tuần sau…', '| 12/11 | Minh | BV Hồng Hà | họp khoa, cần báo giá chi tiết, chờ duyệt…'].map((r, i) => <div key={i} style={{ height: 46, lineHeight: '46px', borderBottom: '1px solid #EEE', padding: '0 12px' }}>{r}</div>)}</div>}
  </>);
};

const Manager = ({ t, v }) => {
  const c = { ng: W('manager', 'Người'), tuan: W('manager', 'tuần'), thang: W('manager', 'tháng'), ls: W('manager', 'lịch', 1) };
  const acc = P(t, c.ls - 0.3, 0.6);
  if (v) {
    const box = [40, 330, 1000, 1240];
    return (<>
      <TitleBox t={t} at={c.ng - 0.1} v x={540} y={200} align="center">Quản lý <span style={{ color: K.blue }}>thấy cả đội</span></TitleBox>
      <UICard box={box} layers={[{ src: 'd_month', view: camV(t, [[0, [10, 105, 560, 694]], [c.thang + 0.6, [500, 105, 560, 694], 2.2]]), o: 1 - acc }, { src: 'd_acc', view: [1080, 55, 360, 446], o: acc }]} />
    </>);
  }
  const box = [40, 40, 1840, 1000];
  return (<>
    <UICard box={box} layers={[{ src: 'd_full', view: V_CAL, o: 1 - P(t, c.thang - 0.2, 0.5) }, { src: 'd_month', view: V_CAL, o: P(t, c.thang - 0.2, 0.5) * (1 - acc) }, { src: 'd_acc', view: [520, 40, 920, 500], o: acc }]} />
    <TitleBox t={t} at={c.ng - 0.1} x={90} y={880}>Quản lý <span style={{ color: K.blue }}>thấy cả đội</span></TitleBox>
    <Tag t={t} at={c.tuan - 0.1} x={1820} y={90} align="right" text={t < c.thang - 0.2 ? 'Lịch tuần' : t < c.ls - 0.3 ? 'Lịch tháng' : 'Lịch sử chăm sóc từng khách'} />
  </>);
};

const Kpi = ({ t, v }) => {
  const c = { moi: W('kpi', 'Mọi'), vong: W('kpi', 'vòng'), ds: W('kpi', 'doanh'), dp: W('kpi', 'độ'), nv: W('kpi', 'Nhân'), kh: W('kpi', 'khách') };
  const pv = camV(t, [[0, [1080, 120, 360, 223]], [c.ds + 0.4, [1080, 335, 360, 223], 0.8], [c.nv, [1080, 680, 360, 223], 0.9]]);
  if (v) {
    return (<>
      <TitleBox t={t} at={c.moi - 0.1} v x={540} y={200} align="center">Tính toán <span style={{ color: K.green }}>tự động</span></TitleBox>
      <UICard box={[40, 330, 1000, 560]} layers={[{ src: 'd_full', view: [300, 330, 520, 291], o: 1 - P(t, c.dp - 0.2, 0.5) }, { src: 'd_cov', view: [300, 330, 520, 291], o: P(t, c.dp - 0.2, 0.5) }]} />
      <UICard box={[40, 930, 1000, 620]} layers={[{ src: 'd_full', view: pv, o: 1 }]} />
      <div style={{ ...abs(0, 1470, 1080), display: 'flex', justifyContent: 'center', gap: 14 }}>{[['Ít nhập liệu hơn', c.nv, K.coral], ['Nhiều thời gian cho khách', c.kh, K.green]].map(([l, at, col]) => <Pop key={l} t={t} at={at - 0.1}><div style={{ padding: '12px 22px', borderRadius: 999, background: col, color: '#fff', fontSize: 28, fontWeight: 800 }}>{l}</div></Pop>)}</div>
    </>);
  }
  return (<>
    <UICard box={[40, 40, 1150, 1000]} layers={[{ src: 'd_full', view: [130, 330, 650, 565], o: 1 - P(t, c.dp - 0.2, 0.5) }, { src: 'd_cov', view: [130, 330, 650, 565], o: P(t, c.dp - 0.2, 0.5) }]} />
    <UICard box={[1230, 40, 650, 1000]} layers={[{ src: 'd_full', view: [pv[0], pv[1], 360, 554], o: 1 }]} />
    <TitleBox t={t} at={c.moi - 0.1} x={90} y={880}>Tính toán <span style={{ color: K.green }}>tự động</span></TitleBox>
    <div style={{ ...abs(1230, 960, 650), display: 'flex', justifyContent: 'center', gap: 12 }}>{[['Ít nhập liệu hơn', c.nv, K.coral], ['Nhiều thời gian cho khách', c.kh, K.green]].map(([l, at, col]) => <Pop key={l} t={t} at={at - 0.1}><div style={{ padding: '12px 22px', borderRadius: 999, background: col, color: '#fff', fontSize: 26, fontWeight: 800, boxShadow: '0 10px 24px rgba(0,0,0,.2)' }}>{l}</div></Pop>)}</div>
  </>);
};

const BlurUI = ({ t, v }) => { const a = SEG('why').start - 0.6, b = SEG('close').start - 0.4; if (t < a - 0.1 || t > b + 0.8) return null; const o = P(t, a, 0.6) * (1 - P(t, b, 0.6)); return <AbsoluteFill style={{ opacity: o * 0.55, filter: 'blur(10px)' }}><UICard box={v ? [-200, 200, 1480, 1500] : [0, 0, 1920, 1080]} radius={0} layers={[{ src: 'd_full', view: v ? [200, 120, 900, 912] : V_ALL, o: 1 }]} /></AbsoluteFill>; };

const Close3 = ({ t, v }) => {
  const c = { mot: W('close', 'Một'), lon: W('close', 'lớn'), y: W('close', 'Ý'), cam: W('close', 'Cảm') };
  const view = camV(t, [[0, [190, 330, 640, 348]], [c.lon + 1.5, v ? [250, 120, 940, 1165] : V_ALL, 3.0]]);
  const box = v ? [40, 330, 1000, 1240] : [40, 40, 1840, 1000];
  return (<>
    <UICard box={box} layers={[{ src: 'd_full', view: v ? camV(t, [[0, [330, 340, 400, 496]], [c.lon + 1.5, [292, 300, 540, 670], 3.0]]) : view, o: 1 }]} />
    <TitleBox t={t} at={c.mot - 0.1} v={v} x={v ? 540 : 960} y={v ? 190 : 820} align="center">Một CRM <span style={{ color: K.coral }}>lớn lên cùng doanh nghiệp</span></TitleBox>
    <Tag t={t} at={c.y - 0.1} x={v ? 540 : 960} y={v ? 1480 : 950} align="center" text="Ý tưởng mới đến đâu, ứng dụng thay đổi đến đó" />
  </>);
};

const Why = ({ t, v }) => {
  const c = { ban: W('why', 'Bạn'), crm: W('why', 'CRM'), thue: W('why', 'thuê'), nhung: W('why', 'Nhưng'), kh: W('why', 'khách'), ct: W('why', 'công', 1), qt: W('why', 'Quy'), dl: W('why', 'dữ'), cho: W('why', 'chờ') };
  const months = ['Tháng 1', 'Tháng 3', 'Tháng 6', 'Tháng 9', 'Tháng 12']; const mi = Math.min(4, Math.max(0, Math.floor((t - c.cho) / 0.5)));
  return (
    <>
      <div style={{ ...abs(0, v ? 220 : 100, v ? 1080 : 1920), textAlign: 'center' }}><Big t={t} at={c.ban - 0.1} size={v ? 64 : 76} align="center">“CRM thì có gì mới?”</Big></div>
      <In t={t} at={c.thue - 0.2} y={40} style={{ ...abs(v ? 140 : 260, v ? 420 : 300, v ? 800 : 620) }}>
        <div style={{ background: '#EDEAE3', borderRadius: 30, padding: 34, border: '2px dashed #B9B2A3', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><svg width="56" height="56" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="#8A8273" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8A8273" strokeWidth="2.4" /></svg><div style={{ fontSize: 36, fontWeight: 800, color: '#5F584B' }}>CRM thuê ngoài</div></div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#6F6758', fontWeight: 600 }}><div style={{ width: 34, height: 34, borderRadius: 17, border: '5px solid #D6D0C4', borderTopColor: '#8A8273', transform: `rotate(${t * 300}deg)` }} />Đang chờ nhà cung cấp cập nhật…</div>
          {t > c.cho - 0.2 && <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 120, height: 120, borderRadius: 18, background: '#fff', boxShadow: '0 10px 24px rgba(0,0,0,.1)', overflow: 'hidden', textAlign: 'center' }}><div style={{ background: K.coral, color: '#fff', fontSize: 18, fontWeight: 800, padding: 6 }}>2026</div><div style={{ fontSize: 26, fontWeight: 800, marginTop: 18 }}>{months[mi]}</div></div><div style={{ fontSize: 26, color: '#6F6758', fontWeight: 700 }}>…vẫn đang chờ</div></div>}
        </div>
      </In>
      <div style={{ ...abs(v ? 60 : 1000, v ? 1050 : 300, v ? 960 : 700), display: 'flex', flexDirection: 'column', gap: 18, alignItems: v ? 'center' : 'flex-start' }}>
        {[['Khách hàng thay đổi', c.kh, K.blue], ['Công ty bạn cũng vậy', c.ct, K.violet], ['Quy trình được cải tiến', c.qt, K.green], ['Dữ liệu đổi mỗi năm', c.dl, K.amber]].map(([l, at, col]) => <In key={l} t={t} at={at - 0.15} x={40} y={0}><div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 28px', borderRadius: 20, background: '#fff', boxShadow: '0 14px 30px rgba(29,43,58,.12)', fontSize: v ? 34 : 36, fontWeight: 800 }}><span style={{ width: 14, height: 14, borderRadius: 7, background: col }} />{l}</div></In>)}
      </div>
    </>
  );
};

const REPO = ['kho-backend/', '├─ sheets/', '│   ├─ KhachHang', '│   ├─ ViengTham', '│   ├─ DoanhSo', '│   └─ KPI', '├─ apps-script/', '│   ├─ Code.gs', '│   └─ schema.gs', '└─ frontend/  (bản đồ, biểu đồ)'];
const Mech = ({ t, v }) => {
  const c = { o: W('mech', 'Ở'), toan: W('mech', 'Toàn'), be: W('mech', 'backend'), gom: W('mech', 'gom'), gh: W('mech', 'GitHub'), as: W('mech', 'Apps'), cl: W('mech', 'Claude'), kn: W('mech', 'kết') };
  const sheets = ['KhachHang', 'ViengTham', 'DoanhSo', 'KPI'];
  const fly = eio((t - c.gom) / 0.9);
  const repo = v ? { x: 140, y: 820, w: 800 } : { x: 760, y: 300, w: 640 };
  const sp = (i) => v ? [100 + i * 225, 450] : [120, 260 + i * 150];
  return (
    <>
      <div style={{ ...abs(0, v ? 220 : 90, v ? 1080 : 1920), textAlign: 'center' }}><Big t={t} at={c.o - 0.1} size={v ? 60 : 66} align="center">Ở đây thì <span style={{ color: K.coral }}>khác</span></Big></div>
      {sheets.map((n, i) => { const [x, y] = sp(i); const k = P(t, c.toan - 0.1 + i * 0.12, 0.4); const tx = lerp(x, repo.x + 60, fly), ty = lerp(y, repo.y + 120 + i * 40, fly); return <div key={n} style={{ ...abs(tx, ty), opacity: k * (1 - Math.max(0, fly - 0.85) * 6), transform: `scale(${1 - 0.5 * fly})`, transformOrigin: '0 0' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16, background: '#fff', boxShadow: '0 12px 28px rgba(29,43,58,.14)', fontSize: v ? 22 : 26, fontWeight: 700, width: v ? 190 : 300, boxSizing: 'border-box' }}><Logo k="sheets" s={34} />{n}</div></div>; })}
      {t < c.gom + 0.2 && <div style={{ ...abs(v ? 90 : 90, v ? 380 : 230, v ? 900 : 360, v ? 40 : 640), opacity: P(t, c.be - 0.1, 0.3) * (1 - P(t, c.gom, 0.3)) }}><div style={{ position: 'absolute', inset: 0, border: `3px solid ${K.coral}`, borderRadius: 20 }} /><div style={{ position: 'absolute', left: v ? '50%' : -10, top: v ? -30 : '50%', transform: v ? 'translateX(-50%)' : 'translate(-100%,-50%) rotate(-90deg)', background: K.coral, color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 4, padding: '6px 16px', borderRadius: 10 }}>BACKEND</div></div>}
      <In t={t} at={c.gh - 0.3} y={40} style={{ ...abs(repo.x, repo.y, repo.w) }}>
        <div style={{ background: '#fff', borderRadius: 26, boxShadow: '0 30px 70px rgba(29,43,58,.2)', overflow: 'hidden', border: `2px solid ${K.ink}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', background: K.ink, color: '#fff', fontSize: 26, fontWeight: 700 }}><Img src={staticFile('media/github-icon.svg')} style={{ width: 34, height: 34, filter: 'invert(1)' }} />you / kho-backend</div>
          <div style={{ padding: '18px 26px', fontFamily: MONO, fontSize: v ? 25 : 23, lineHeight: 1.65, whiteSpace: 'pre' }}>{REPO.map((l, i) => <div key={i} style={{ opacity: P(t, c.gh + i * 0.08, 0.3), color: /apps-script|Code|schema/.test(l) && t > c.as - 0.1 ? K.blue : /frontend/.test(l) ? K.coral : K.ink, fontWeight: /apps-script|Code|schema/.test(l) && t > c.as - 0.1 ? 800 : 500 }}>{l}</div>)}</div>
        </div>
      </In>
      {t > c.as - 0.2 && <div style={{ ...abs(v ? 380 : repo.x + repo.w + 40, v ? 1480 : 330), opacity: P(t, c.as - 0.2, 0.3) }}><Tile3 k="gas" s={v ? 110 : 120} /></div>}
      {t > c.cl - 0.3 && (() => { const cx = v ? 540 : 1690, cy = v ? 640 : 700; const k = P(t, c.cl - 0.3, 0.5); return <>
        <svg style={{ ...abs(0, 0, v ? 1080 : 1920, v ? 1920 : 1080) }}><path d={v ? `M${cx} ${cy + 60} L${cx} ${repo.y - 10}` : `M${cx - 70} ${cy} C ${cx - 200} ${cy} ${repo.x + repo.w + 140} ${repo.y + 120} ${repo.x + repo.w + 10} ${repo.y + 120}`} stroke={C.claude} strokeWidth="5" fill="none" strokeDasharray="14 10" strokeDashoffset={-t * 60} opacity={k} /></svg>
        <div style={{ ...abs(cx - 70, cy - 70, 140, 140), opacity: k, transform: `scale(${0.6 + 0.4 * k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 36, boxShadow: `0 0 0 ${8 + 6 * Math.sin(t * 5)}px rgba(217,119,87,.18), 0 20px 50px rgba(29,43,58,.2)` }}><ClaudeMark s={84} spin={t * 25} /></div>
        <div style={{ ...abs(cx - 150, cy + 80, 300), textAlign: 'center', fontSize: 28, fontWeight: 800, opacity: k }}>Claude Code</div>
      </>; })()}
    </>
  );
};

const DIFF = ["function saveVisit(v) {", "  sheet('ViengTham').appendRow([", "    v.date, v.customer, v.result,", "+   v.competitor,          // ô mới", "  ]);", "}", "+ addColumn('ViengTham', 'DoiThu');"];
const Change = ({ t, v }) => {
  const c = { muon: W('change', 'Muốn'), noi: W('change', 'nói'), sua: W('change', 'sửa'), ct: W('change', 'cấu'), gd: W('change', 'giao'), bd: W('change', 'biểu'), vai: W('change', 'Vài'), doi: W('change', 'đội') };
  const st = (i) => v ? { x: 60, y: 320 + i * 300, w: 960 } : { x: 70 + i * 455, y: 300, w: 430 };
  const card = (i, at, title, col, body) => { const s = st(i); return <In key={i} t={t} at={at - 0.2} y={40} style={{ ...abs(s.x, s.y, s.w) }}><div style={{ background: '#fff', borderRadius: 24, padding: 22, boxShadow: '0 20px 50px rgba(29,43,58,.15)', height: v ? 280 : 520, overflow: 'hidden', boxSizing: 'border-box' }}><div style={{ fontSize: 20, fontWeight: 800, color: col, letterSpacing: 2 }}>{title}</div>{body}</div></In>; };
  return (
    <>
      <div style={{ ...abs(0, v ? 210 : 90, v ? 1080 : 1920), textAlign: 'center' }}><Big t={t} at={c.muon - 0.1} size={v ? 56 : 64} align="center">Thêm một ô mới? <span style={{ color: K.coral }}>Nói với Claude</span></Big></div>
      {card(0, c.noi, '1 · YÊU CẦU', C.claude, <div style={{ marginTop: 14, fontSize: v ? 30 : 28, lineHeight: 1.4, fontWeight: 600 }}>{typed('Thêm ô “Đối thủ đang dùng” vào phiếu viếng thăm, có biểu đồ thị phần.', t, c.noi, 30)}<Caret t={t} h={30} /></div>)}
      {card(1, c.sua, '2 · APPS SCRIPT', K.blue, <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 17, lineHeight: v ? 1.45 : 1.6, whiteSpace: 'pre' }}>{DIFF.map((l, i) => <div key={i} style={{ background: l.startsWith('+') ? 'rgba(42,157,111,.16)' : 'transparent', color: l.startsWith('+') ? K.green : K.ink, opacity: l.startsWith('+') ? P(t, c.sua + 0.3 + i * 0.1, 0.3) : 1, fontWeight: l.startsWith('+') ? 700 : 400 }}>{l}</div>)}</div>)}
      {card(2, c.ct, '3 · GOOGLE SHEET', K.green, <div style={{ marginTop: 14, display: 'flex', fontSize: v ? 20 : 17, border: '1px solid #E5E5E5', borderRadius: 8, overflow: 'hidden' }}>{['Ngày', 'Khách', 'Kết quả', 'DoiThu'].map((h, i) => { const nw = i === 3; const k = nw ? P(t, c.ct + 0.2, 0.6) : 1; return <div key={h} style={{ flex: nw ? k : 1, overflow: 'hidden', borderLeft: i ? '1px solid #E5E5E5' : 'none', background: nw ? 'rgba(42,157,111,.12)' : '#fff' }}><div style={{ padding: '8px 10px', fontWeight: 800, background: nw ? 'rgba(42,157,111,.25)' : '#F6F6F6', whiteSpace: 'nowrap' }}>{h}</div>{[0, 1, 2, 3].map((r) => <div key={r} style={{ padding: '8px 10px', borderTop: '1px solid #EEE', whiteSpace: 'nowrap', color: '#444' }}>{nw ? ['Hãng A', 'Hãng B', '—', 'Hãng A'][r] : i === 0 ? `1${r}/11` : i === 1 ? ['NK Minh Châu', 'PK An Phát', 'NK Hoa Sen', 'BV Ánh Dương'][r] : ['Quan tâm', 'Hẹn lại', 'Chốt', 'Quan tâm'][r]}</div>)}</div>; })}</div>)}
      {card(3, c.gd, '4 · GIAO DIỆN + BIỂU ĐỒ', K.coral, <div style={{ marginTop: 14, display: 'flex', gap: 16, alignItems: 'center', flexDirection: v ? 'row' : 'column' }}>
        <div style={{ flex: 1, width: '100%' }}><div style={{ fontSize: 18, fontWeight: 800, color: K.mute }}>ĐỐI THỦ ĐANG DÙNG</div><div style={{ marginTop: 6, height: 52, borderRadius: 14, border: `3px solid ${K.coral}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 22, boxShadow: `0 0 0 ${6 * Math.max(0, Math.sin((t - c.gd) * 5))}px rgba(228,87,46,.2)` }}>{typed('Hãng A', t, c.gd + 0.5, 8)}</div></div>
        <div style={{ opacity: P(t, c.bd - 0.1, 0.4), display: 'flex', alignItems: 'center', gap: 14 }}><svg width="120" height="120" viewBox="0 0 42 42">{[[45, K.coral], [30, K.blue], [25, K.amber]].reduce((acc, [p, col], i, arr) => { const off = arr.slice(0, i).reduce((a, b) => a + b[0], 0); acc.push(<circle key={i} cx="21" cy="21" r="15.9" fill="none" stroke={col} strokeWidth="8" strokeDasharray={`${p * P(t, c.bd, 0.8)} ${100 - p * P(t, c.bd, 0.8)}`} strokeDashoffset={25 - off} />); return acc; }, [])}</svg><div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.6 }}><div style={{ color: K.coral }}>■ Hãng A</div><div style={{ color: K.blue }}>■ Hãng B</div><div style={{ color: K.amber }}>■ Khác</div></div></div>
      </div>)}
      <div style={{ ...abs(0, v ? 1535 : 900, v ? 1080 : 1920), display: 'flex', justifyContent: 'center' }}><Pop t={t} at={c.vai - 0.1}><div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px', borderRadius: 999, background: K.ink, color: '#fff', fontSize: v ? 30 : 32, fontWeight: 800 }}><Check s={34} bg={K.green} />Vài phút sau · cả đội dùng được</div></Pop></div>
      {!v && [0, 1, 2].map((i) => <div key={i} style={{ ...abs(500 + i * 455, 560, 50, 40), fontSize: 40, color: K.mute, opacity: P(t, [c.sua, c.ct, c.gd][i] - 0.3, 0.3) }}>→</div>)}
    </>
  );
};

const End3 = ({ t, v }) => {
  const a = tl.endcard;
  const tools = [['claude', 'Claude Code'], ['github', 'GitHub'], ['sheets', 'Google Sheets'], ['gas', 'Apps Script']];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: `rgba(243,239,230,${0.85 * P(t, a, 0.6)})` }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: v ? -100 : -20 }}>
        <Pop t={t} at={a + 0.1}><div style={{ borderRadius: 50, boxShadow: '0 30px 70px rgba(228,87,46,.35)' }}><FMMark s={v ? 220 : 180} /></div></Pop>
        <In t={t} at={a + 0.4}><div style={{ fontSize: 100, fontWeight: 800, letterSpacing: -3, marginTop: 26 }}>FieldMap</div></In>
        <In t={t} at={a + 0.6}><div style={{ fontSize: 34, color: K.mute, fontWeight: 500 }}>Tập 3 · CRM bản đồ</div></In>
        <div style={{ display: 'flex', gap: v ? 24 : 40, marginTop: v ? 64 : 50 }}>{tools.map(([k, n], i) => <Pop key={k} t={t} at={a + 1.1 + i * 0.12}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: v ? 200 : 190 }}><Tile3 k={k} s={v ? 104 : 96} /><div style={{ fontSize: 23, fontWeight: 700 }}>{n}</div></div></Pop>)}</div>
        <In t={t} at={a + 1.7}><div style={{ fontSize: 30, color: K.ink, fontWeight: 700, marginTop: v ? 60 : 44 }}>Cảm ơn bạn đã xem</div></In>
      </div>
    </AbsoluteFill>
  );
};

const Subs3 = ({ t }) => {
  const s = tl.subs.find((x, i) => t >= x.s - 0.08 && t < (tl.subs[i + 1] ? Math.min(tl.subs[i + 1].s - 0.08, x.e + 0.6) : x.e + 0.6));
  if (!s) return null;
  return <div style={{ ...abs(60, 1640, 960), display: 'flex', justifyContent: 'center' }}><div style={{ background: '#fff', color: K.ink, borderRadius: 14, padding: '14px 26px', fontSize: 40, fontWeight: 700, lineHeight: 1.3, textAlign: 'center', boxShadow: '0 10px 30px rgba(29,43,58,.18)' }}>{s.t}</div></div>;
};

const SfxTrack3 = () => {
  const L = [];
  ORDER.slice(1).forEach((id) => L.push([SB[id][0], 'page_turn', 0.25]));
  L.push([tl.endcard, 'shimmer', 0.3]);
  ['Bảy', 'Minh', 'Doanh', 'sổ', 'Zalo', 'báo'].forEach((w) => L.push([W('s1', w) - 0.1, 'pop', 0.28]));
  L.push([W('s1', 'Bảy'), 'tick', 0.4], [W('s2', 'sếp'), 'notification', 0.3], [W('s2', 'lục'), 'whoosh_soft', 0.2], [W('s2', 'chồng'), 'glitch', 0.18], [W('s2', 'không') - 0.1, 'stamp', 0.4]);
  L.push([W('s3', 'nhập'), 'impact', 0.2], [W('s3', 'tra'), 'impact', 0.2], [W('s3', 'Và') - 0.2, 'whoosh_long', 0.25], [W('s3', 'CRM') - 0.3, 'boom_soft', 0.3], [W('s3', 'CRM'), 'shimmer', 0.25]);
  L.push([W('map', 'chấm'), 'sparkle', 0.25], [W('map', 'Phóng') - 0.2, 'whoosh_long', 0.22], [W('map', 'khách', 1), 'pop', 0.3]);
  L.push([W('field', 'ghi') - 0.4, 'whoosh_soft', 0.22], [W('field', 'ảnh') - 0.1, 'camera', 0.4], [W('field', 'gọn') - 0.6, 'page_turn', 0.3], [W('field', 'gọn'), 'success', 0.25]);
  L.push([W('manager', 'Người'), 'whoosh_soft', 0.22], [W('kpi', 'doanh') - 0.2, 'sparkle', 0.22], [W('kpi', 'Nhân') - 0.1, 'pop', 0.3], [W('kpi', 'khách') - 0.1, 'pop', 0.3]);
  [W('why','khách'), W('why','công',1), W('why','Quy'), W('why','dữ')].forEach((a) => L.push([a - 0.15, 'tick', 0.45]));
  L.push([W('mech', 'gom'), 'whoosh_long', 0.25], [W('mech', 'Claude') - 0.3, 'shimmer', 0.25]);
  L.push([W('change', 'sửa') + 0.3, 'tick', 0.45], [W('change', 'cấu') + 0.2, 'swoosh_short', 0.3], [W('change', 'giao'), 'pop', 0.3], [W('change', 'Vài') - 0.1, 'success', 0.3]);
  L.push([W('close', 'Một') - 0.1, 'swell', 0.25]);
  return (<>{L.map(([a, n, vv], i) => <Sfx key={i} at={a} name={n} vol={vv} />)}<Sequence from={Math.round(W('s2', 'hỏi') * 30)} durationInFrames={80}><Audio src={staticFile('sfx/typing.wav')} volume={0.18} loop /></Sequence><Sequence from={Math.round(W('change', 'nói') * 30)} durationInFrames={70}><Audio src={staticFile('sfx/typing.wav')} volume={0.18} loop /></Sequence></>);
};

export const Main: React.FC<{ v: boolean }> = ({ v }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: K.ink }}>
      <AbsoluteFill style={{ background: K.paper }}>
        <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(29,43,58,.06) 1.2px, transparent 1.3px)', backgroundSize: '26px 26px' }} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(120,100,70,.16) 100%)' }} />
      </AbsoluteFill>
      <BlurUI t={t} v={v} />
      <Scene t={t} id="s1" enter="rise"><Story1 t={t} v={v} /></Scene>
      <Scene t={t} id="s2" enter="zoom"><Story2 t={t} v={v} /></Scene>
      <Scene t={t} id="s3" enter="focus"><Story3 t={t} v={v} /></Scene>
      <Scene t={t} id="map" enter="rise"><MapScene t={t} v={v} /></Scene>
      <Scene t={t} id="field" enter="right"><Field t={t} v={v} /></Scene>
      <Scene t={t} id="manager" enter="left"><Manager t={t} v={v} /></Scene>
      <Scene t={t} id="kpi" enter="rise"><Kpi t={t} v={v} /></Scene>
      <Scene t={t} id="why" enter="zoom"><Why t={t} v={v} /></Scene>
      <Scene t={t} id="mech" enter="focus"><Mech t={t} v={v} /></Scene>
      <Scene t={t} id="change" enter="right"><Change t={t} v={v} /></Scene>
      <Scene t={t} id="close" enter="rise"><Close3 t={t} v={v} /></Scene>
      <Scene t={t} id="end" enter="focus"><End3 t={t} v={v} /></Scene>
      {v && <Subs3 t={t} />}
      <Audio src={staticFile('narration.wav')} />
      <Audio src={staticFile('music.wav')} volume={0.15} />
      <SfxTrack3 />
    </AbsoluteFill>
  );
};

export const ReelThumb: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, overflow: 'hidden' }}>
    <Bg t={0} />
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 62% 58%, rgba(228,87,46,.20), transparent 46%)' }} />
    <div style={{ ...abs(0, 290, 1080), display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ padding: '10px 28px', borderRadius: 999, background: C.ink, color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 3 }}>TẬP 3</div>
      <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: -4, lineHeight: 1.0, marginTop: 26 }}>Tự làm app</div>
      <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: -4, lineHeight: 1.0, color: C.claude }}>CRM bản đồ</div>
      <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: -1.2, marginTop: 18 }}><span style={{ background: C.ink, color: '#fff', padding: '2px 18px', borderRadius: 16 }}>Khách hàng · Lịch · KPI</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
        {['sheets', 'gas', 'github', 'claude'].map((k, i) => <React.Fragment key={k}>{i > 0 && <div style={{ fontSize: 40, color: C.mute, fontWeight: 300 }}>+</div>}<Tile k={k} s={86} /></React.Fragment>)}
      </div>
    </div>
    <div style={{ ...abs(-40, 880, 820, 820), WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)', maskImage: 'linear-gradient(to bottom, #000 72%, transparent 98%)' }}><Img src={staticFile('media/me.png')} style={{ width: '100%', height: '100%' }} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: 'rotate(7deg)', transformOrigin: '830px 1300px' }}>
      <Phone x={660} y={930} w={340}><Shot src="crm_m_wm" /></Phone>
    </div>
    <div style={{ ...abs(520, 900) }}><div style={{ padding: '14px 26px', borderRadius: 999, background: '#fff', border: `3px solid ${C.claude}`, fontSize: 34, fontWeight: 800, boxShadow: '0 14px 34px rgba(22,22,27,.18)', transform: 'rotate(-4deg)' }}>Bản đồ làm việc</div></div>
    <div style={{ ...abs(0, 1700, 1080), textAlign: 'center', fontSize: 32, fontWeight: 700, color: C.mute }}>Google Sheet · Apps Script · GitHub</div>
  </AbsoluteFill>
);
