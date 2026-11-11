// node frames.mjs <16x9|9x16> <dir> → khung JPEG 4K ; node frames.mjs audio <out.wav> → chỉ âm thanh
import { bundle } from '@remotion/bundler';
import { renderFrames, renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const [fmt, out, range] = process.argv.slice(2);
const B = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)[0];
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id: `DailyCast-${fmt === 'audio' ? '16x9' : fmt}`, browserExecutable: B });
const t0 = Date.now();
if (fmt === 'audio') {
  await renderMedia({ serveUrl, composition: comp, codec: 'wav', outputLocation: path.resolve(out), browserExecutable: B, concurrency: 4 });
} else {
  fs.mkdirSync(out, { recursive: true }); let last = 0;
  await renderFrames({ serveUrl, composition: comp, outputDir: out, imageFormat: 'jpeg', jpegQuality: 94, scale: 2, concurrency: 4, frameRange: range ? range.split('-').map(Number) : null, browserExecutable: B, onStart: () => {},
    onFrameUpdate: (n) => { const p = Math.floor((n / comp.durationInFrames) * 100); if (p >= last + 5) { last = p; console.log(`${p}% ${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`); } } });
}
console.log('done', ((Date.now() - t0) / 1000).toFixed(0), 's');
