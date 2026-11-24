// MMH Daily — tạo ảnh nhân vật (bản nháp để người dùng duyệt) bằng Gemini (model tạo ảnh). Chạy trên GitHub: workflow "Nhân vật — tạo ảnh nháp".
// node tools/mascots.mjs <thư mục ra> [id,id…]
import fs from 'node:fs';
import path from 'node:path';
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Thiếu GEMINI_API_KEY'); process.exit(1); }
const OUT = process.argv[2] || 'mascot-out';
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const STYLE = 'Cute chibi kawaii mascot character for a mobile English-learning app, one character only, full body, big head small body, '
  + 'big shiny eyes, soft rounded shapes, clean flat vector illustration with gentle soft shading, thick smooth outline in dark navy, '
  + 'harmonious palette of warm cream, soft teal (#127C6E) and one accent color, plain solid warm cream background (#F6F2EA), '
  + 'centered with generous padding, square 1:1, sticker / app avatar style, consistent character series. No text, no letters, no logo, no watermark.';
const C = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'mascots.json'), 'utf8'));
const list = await (await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + KEY)).json();
const models = (list.models || []).map(m => m.name.replace(/^models\//, '')).filter(n => /image/.test(n) && !/imagen/.test(n));
const rank = n => (/gemini-3/.test(n) ? 50 : /2\.5/.test(n) ? 30 : 0) + (/pro/.test(n) ? 5 : 0) - (/preview/.test(n) ? 1 : 0);
models.sort((a, b) => rank(b) - rank(a));
console.log('Model tạo ảnh:', models.join(', ') || '(không có)');
if (!models.length) process.exit(1);
const report = [];
for (const c of C.chars) {
  if (ONLY.length && !ONLY.includes(c.id)) continue;
  for (const [mood, extra] of Object.entries(c.moods || { happy: '' })) {
    const prompt = `${STYLE}\nCharacter: ${c.look}\nPose and mood: ${extra || c.pose}`;
    let ok = false;
    for (const m of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '1:1' } } }) });
        const j = await r.json();
        const part = (j.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
        if (!part) { console.log(c.id, mood, m, 'không có ảnh', r.status, JSON.stringify(j.error || j.candidates?.[0]?.finishReason || '').slice(0, 200)); continue; }
        const ext = /png/.test(part.inlineData.mimeType) ? 'png' : 'jpg';
        fs.writeFileSync(path.join(OUT, `${c.id}-${mood}.${ext}`), Buffer.from(part.inlineData.data, 'base64'));
        console.log('✓', c.id, mood, m); report.push({ id: c.id, mood, model: m }); ok = true; break;
      } catch (e) { console.log(c.id, mood, m, 'lỗi', e.message); }
    }
    if (!ok) report.push({ id: c.id, mood, fail: true });
    await new Promise(r => setTimeout(r, 1500));
  }
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
