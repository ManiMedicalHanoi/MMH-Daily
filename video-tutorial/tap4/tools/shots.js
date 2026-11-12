const { chromium } = require('playwright');
const base = 'file://' + process.argv[2] + '/index.html'; const out = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const ph = await b.newContext({ viewport: { width: 400, height: 866 }, deviceScaleFactor: 4, isMobile: true, hasTouch: true });
  const dk = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  const J = [[dk, 'pr_d', '#price'], [dk, 'td_d', '#tender'], [ph, 'td_m', '#tender-m'], [ph, 'tr_m', '?dy=75#trip'], [ph, 'tr_nav', '?dy=75&mode=nav#trip'], [ph, 'tr_menu', '#trip-tr'], [ph, 'tr_menu_raw', '?raw=1#trip-tr']];
  for (const [ctx, n, u] of J) { const p = await ctx.newPage(); await p.goto(base + u); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${n}.jpg`, quality: 92 }); await p.close(); }
  await b.close();
})();
