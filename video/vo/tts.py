"""Đọc video/vo/request.json ⇒ gọi ElevenLabs ⇒ video/vo/out/. Không in khoá; log chỉ in mã trạng thái."""
import json, os, base64, urllib.request, urllib.error, urllib.parse, pathlib
R = json.load(open('video/vo/request.json')); O = pathlib.Path('video/vo/out'); O.mkdir(parents=True, exist_ok=True)
K = os.environ.get('ELEVENLABS_API_KEY', ''); st = {'has_key': bool(K), 'items': {}}
def call(url, body=None, accept='application/json'):
    h = {'xi-api-key': K, 'Accept': accept}
    if body is not None: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=180) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
c, b = call('https://api.elevenlabs.io/v1/user/subscription'); st['sub'] = c
if c == 200:
    s = json.loads(b); st['chars'] = [s.get('character_count'), s.get('character_limit')]; st['tier'] = s.get('tier')
else: st['sub_err'] = b.decode(errors='ignore')[:200]
for q in R.get('list', []):
    c, b = call('https://api.elevenlabs.io/v1/shared-voices?' + urllib.parse.urlencode(q['params']))
    if c == 200:
        vs = [{k: v.get(k) for k in ('voice_id', 'public_owner_id', 'name', 'accent', 'gender', 'age', 'descriptive', 'use_case', 'language', 'description', 'usage_character_count_1y', 'preview_url')} for v in json.loads(b).get('voices', [])]
        (O / f"voices_{q['name']}.json").write_text(json.dumps(vs, ensure_ascii=False, indent=1))
    else: st['list_err_' + q['name']] = b.decode(errors='ignore')[:200]
    st['list_' + q['name']] = c
for it in R.get('items', []):
    body = {'text': it['text'], 'model_id': it.get('model', 'eleven_multilingual_v2'), 'voice_settings': it.get('settings', {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.3, 'use_speaker_boost': True})}
    for k in ('previous_text', 'next_text', 'language_code'):
        if it.get(k): body[k] = it[k]
    c, b = call(f"https://api.elevenlabs.io/v1/text-to-speech/{it['voice']}/with-timestamps?output_format=mp3_44100_192", body)
    if c == 200:
        j = json.loads(b)
        (O / f"{it['id']}.mp3").write_bytes(base64.b64decode(j['audio_base64']))
        (O / f"{it['id']}.align.json").write_text(json.dumps(j.get('alignment'), ensure_ascii=False))
    else: st['items'][it['id'] + '_err'] = b.decode(errors='ignore')[:200]
    st['items'][it['id']] = c
(O / 'status.json').write_text(json.dumps(st, ensure_ascii=False, indent=1)); print(json.dumps({k: v for k, v in st.items() if k != 'chars'}))
