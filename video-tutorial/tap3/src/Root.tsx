import React from 'react';
import { Composition, Still, continueRender, delayRender, staticFile } from 'remotion';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import '@fontsource/be-vietnam-pro/500-italic.css';
import '@fontsource/be-vietnam-pro/600-italic.css';
import TL from './data/timeline.json';
import { Main, ReelThumb } from './Video';

// chờ font (Be Vietnam Pro cho chữ Việt, JetBrains Mono cho code) trước khi chụp khung
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const mono = [400, 600].map((w) => new FontFace('JetBrains Mono', `url(${staticFile(`fonts/jbm-${w}.woff2`)}) format('woff2')`, { weight: String(w) }));
  Promise.all(mono.map((f) => f.load().then((ff) => { (document as any).fonts.add(ff); })))
    .then(() => Promise.all(['400', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px "Be Vietnam Pro"`, 'Được ắ ỗ ữ ạ 0123'))))
    .then(() => document.fonts.load('italic 600 40px "Be Vietnam Pro"', 'Được'))
    .then(() => continueRender(h)).catch(() => continueRender(h));
}

const D = Math.ceil((TL as any).total * 30);

export const Root: React.FC = () => (
  <>
    <Composition id="DailyCast-16x9" component={Main as any} durationInFrames={D} fps={30} width={1920} height={1080} defaultProps={{ v: false }} />
    <Composition id="DailyCast-9x16" component={Main as any} durationInFrames={D} fps={30} width={1080} height={1920} defaultProps={{ v: true }} />
    <Still id="Thumb-9x16" component={ReelThumb} width={1080} height={1920} />
  </>
);
