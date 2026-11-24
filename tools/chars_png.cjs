// Dựng ảnh PNG nhân vật cho email nhắc học / mã kích hoạt (Training Hub RH_DailyAcct.gs dùng media/chars/chip-<sắc thái>.png).
// Chạy: NODE_PATH=$(npm root -g) node tools/chars_png.cjs   (cần Playwright)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'media/chars');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 240, height: 240 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:transparent"><script>${fs.readFileSync(path.join(root, 'chars.js'), 'utf8')}</script><div id=o style="width:240px;height:240px"></div></body></html>`);
  const jobs = [];
  for (const id of ['chip']) for (const m of ['happy', 'wave', 'cheer', 'think', 'sleepy', 'sad']) jobs.push([id, m, m]);
  jobs.push(['chip', 'wave', 'remind']);
  for (const id of await p.evaluate(() => CHARS.ids)) jobs.push([id, 'happy', '']);
  for (const [id, m, name] of jobs) {
    await p.evaluate(([id, m]) => { document.getElementById('o').innerHTML = CHARS.svg(id, m, { bg: true }); document.querySelector('svg').style.cssText = 'width:240px;height:240px;display:block'; }, [id, m]);
    await p.locator('svg').screenshot({ path: path.join(out, name ? `${id}-${name}.png` : `${id}.png`), omitBackground: true });
  }
  await b.close(); console.log('xong', jobs.length, 'ảnh');
})();
