// MMH Daily — gọi Claude (chỉ khi có ANTHROPIC_API_KEY). Mặc định Claude Haiku 5.5 (gói Tiết kiệm, ~0,5 USD/tháng);
// đổi bằng biến DAILY_MODEL (vd. claude-sonnet-5-5). Trả về JSON đúng schema (structured outputs), nhận theo luồng.
export const MODEL = process.env.DAILY_MODEL || 'claude-haiku-5-5';
/* Gemini (từ 23/11/2026): có GEMINI_API_KEY mà không có ANTHROPIC_API_KEY ⇒ viết bằng Gemini (gói miễn phí của người dùng).
   Google bận (503 / 429 / 500) ⇒ chờ rồi thử lại, đổi sang mẫu Flash khác. KHÔNG in khoá ra log (kho công khai). */
export const PROVIDER = process.env.ANTHROPIC_API_KEY ? 'claude' : process.env.GEMINI_API_KEY ? 'gemini' : '';
const GEM = 'https://generativelanguage.googleapis.com/v1beta';
let gemModels = null, gemLast = '';
async function gemList() {
  if (gemModels) return gemModels;
  const r = await fetch(GEM + '/models?pageSize=200', { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY } });
  if (!r.ok) throw new Error('Gemini models ' + r.status);
  const d = await r.json();
  const sc = id => { const v = parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0); return v * 10 + (/flash/.test(id) ? 30 : 0) + (/latest$/.test(id) ? 5 : 0) - (/lite/.test(id) ? 8 : 0) - (/preview|exp/.test(id) ? 12 : 0); };
  gemModels = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && /flash/.test(m.name)
    && !/(tts|image|embed|live|audio|native|thinking-exp)/i.test(m.name)).map(m => m.name.replace(/^models\//, '')).sort((a, b) => sc(b) - sc(a));
  if (process.env.GEMINI_MODEL) gemModels.unshift(process.env.GEMINI_MODEL);
  return gemModels;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function geminiJson({ system, user, schema, maxTokens }) {
  const prompt = user + '\n\nReturn ONLY one JSON object that matches this JSON Schema exactly (all required keys, no extra keys):\n' + JSON.stringify(schema);
  let last;
  const t0all = Date.now();
  /* Gói miễn phí hay bị Google báo "quá tải" (503) vào giờ cao điểm ⇒ hết danh sách mà chỉ toàn 503 thì nghỉ 3 phút, thử lại cả danh sách (tối đa 3 vòng, ~15 phút). */
  for (let round = 0; round < 3; round++) {
  if (round) { console.log(`  Gemini: mọi mẫu đang quá tải ⇒ nghỉ 3 phút rồi thử lại (vòng ${round + 1}/3)`); await sleep(180000); }
  let busyOnly = true;
  for (const model of (await gemList()).slice(0, 10)) {
    if (Date.now() - t0all > 16 * 60e3) break;
    for (let a = 0; a < 2; a++) {
      const t0 = Date.now();
      let r;
      try {
        r = await fetch(`${GEM}/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(300000), headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: Math.min(maxTokens, 60000) } }) });
      } catch (e) { last = e; break; }
      if (r.ok) {
        const d = await r.json();
        const txt = (d.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
        const u = d.usageMetadata || {};
        console.log(`  Gemini ${model}: vào ${u.promptTokenCount} · ra ${u.candidatesTokenCount} token · ${((Date.now() - t0) / 1000).toFixed(0)} giây`);
        try { gemLast = model; return JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch (e) { last = new Error('Gemini trả JSON hỏng'); continue; }
      }
      const body = await r.text().catch(() => '');
      const msg = ((body.match(/"message"\s*:\s*"([^"]{0,220})/) || [])[1] || '').replace(/\\n/g, ' ');
      last = new Error(`Gemini ${model} ${r.status}${msg ? ': ' + msg : ''}`);
      console.log(`  Gemini ${model} ${r.status}${msg ? ' — ' + msg : ''}`);
      if (r.status === 404 || r.status === 400) break;                                  // mẫu không dùng được ⇒ mẫu khác
      if (r.status === 429 && /limit: ?0|quota|exceeded|billing/i.test(msg)) { busyOnly = false; break; } // hết / không có hạn mức miễn phí ⇒ đổi mẫu ngay
      if ([429, 500, 502, 503, 504].includes(r.status)) { if (a === 0) { await sleep(r.status === 429 ? 15000 : 6000); continue; } break; }
      throw last;
    }
  }
  if (!busyOnly) break;
  }
  throw last || new Error('Gemini không trả lời');
}
export const usedModel = () => PROVIDER === 'gemini' ? gemLast : MODEL;
let client;
export async function askJson({ system, user, schema, maxTokens = 32000, effort = 'low' }) {
  if (PROVIDER === 'gemini') return geminiJson({ system, user, schema, maxTokens });
  if (!client) { const { default: Anthropic } = await import('@anthropic-ai/sdk'); client = new Anthropic(); }
  const stream = client.messages.stream({
    model: MODEL, max_tokens: maxTokens,
    output_config: { effort, format: { type: 'json_schema', schema } },
    // lời dặn chung (bối cảnh MMH + WRITING + PODCAST) giống nhau ở mọi lượt trong ngày ⇒ đệm lời nhắc: lượt sau chỉ tính ~10% giá phần này
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: user }],
  });
  const res = await stream.finalMessage();
  if (res.stop_reason === 'refusal') throw new Error('Claude từ chối: ' + (res.stop_details?.category || ''));
  if (res.stop_reason === 'max_tokens') throw new Error('Claude trả lời bị cắt (max_tokens)');
  const u = res.usage || {};
  console.log(`  Claude ${MODEL}: vào ${u.input_tokens} (+ đệm đọc ${u.cache_read_input_tokens || 0} · ghi ${u.cache_creation_input_tokens || 0}) · ra ${u.output_tokens} token`);
  return JSON.parse(res.content.filter(b => b.type === 'text').map(b => b.text).join(''));
}
const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });
export const S = { str: { type: 'string' }, obj, arr: items => ({ type: 'array', items }) };
