// node snap.mjs <16x9|9x16> t1,t2,... [scale] → ../snap/<fmt>/f_*.jpg + grid
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const [fmt, ts, sc = '0.5'] = process.argv.slice(2);
const B = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)[0];
const out = path.resolve('../snap', fmt); fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id: `DailyCast-${fmt}`, browserExecutable: B });
const times = ts.split(',').map(Number);
for (const s of times) {
  await renderStill({ serveUrl, composition: comp, frame: Math.min(comp.durationInFrames - 1, Math.round(s * 30)), output: path.join(out, `f_${s.toFixed(2).padStart(6, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 85, scale: Number(sc), browserExecutable: B });
}
console.log('ok', times.length);
