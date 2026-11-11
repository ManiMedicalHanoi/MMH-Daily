import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const B = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)[0];
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id: 'Thumb-9x16', browserExecutable: B });
await renderStill({ serveUrl, composition: comp, output: path.resolve(process.argv[2]), imageFormat: 'jpeg', jpegQuality: 95, scale: 2, browserExecutable: B });
console.log('ok');
