// node render.mjs <16x9|9x16> <out.mp4> [from-to frames] → 4K (scale 2)
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const [fmt, out, range] = process.argv.slice(2);
const B = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)[0];
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id: `DailyCast-${fmt}`, browserExecutable: B });
let last = 0; const t0 = Date.now();
await renderMedia({ serveUrl, composition: comp, codec: 'h264', crf: 17, x264Preset: process.env.PRESET || 'veryfast', pixelFormat: 'yuv420p', scale: 2, outputLocation: path.resolve(out), browserExecutable: B, concurrency: Number(process.env.CONC || 4),
  audioBitrate: '256k', frameRange: range ? range.split('-').map(Number) : null, chromiumOptions: { gl: 'swangle' },
  onProgress: ({ progress, renderedFrames }) => { const p = Math.floor(progress * 100); if (p >= last + 5) { last = p; console.log(`${p}% frames=${renderedFrames} ${((Date.now() - t0) / 1000).toFixed(0)}s`); } } });
console.log('done', ((Date.now() - t0) / 1000).toFixed(0), 's');
