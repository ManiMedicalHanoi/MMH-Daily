# Thu N bản mỗi đoạn, chép lời bằng Scribe, chấm điểm (lệch chữ so với kịch bản + từ kém chắc chắn), chọn bản tốt nhất.
import json, re, subprocess, base64, sys, os, unicodedata, difflib, concurrent.futures as cf
S = json.load(open('script.json')); N = int(os.environ.get('TAKES', 3)); ONLY = sys.argv[1:] or [s['id'] for s in S['segments']]
os.makedirs('vo/takes', exist_ok=True)
def nrm(s): s = re.sub(r'\[[^\]]*\]', ' ', s); s = unicodedata.normalize('NFC', s.lower()).replace('khóa', 'khoá'); return re.findall(r"[\wÀ-ỹ]+", s)
def tts(seg, k):
    body = {"text": seg['text'], "model_id": S['model'], "language_code": "vi", "voice_settings": {"stability": 0.5 if k % 2 == 0 else 0.42, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}}
    f = f"vo/takes/{seg['id']}_{k}"; open(f + '.req', 'w').write(json.dumps(body, ensure_ascii=False))
    c = subprocess.run(['curl', '-sS', '-o', f + '.resp', '-w', '%{http_code}', '-H', 'Content-Type: application/json', '-X', 'POST', f"https://api.elevenlabs.io/v1/text-to-speech/{S['voice']}/with-timestamps?output_format=mp3_44100_192", '--data', '@' + f + '.req'], capture_output=True, text=True).stdout
    if c != '200': return None
    j = json.load(open(f + '.resp')); open(f + '.mp3', 'wb').write(base64.b64decode(j['audio_base64'])); json.dump(j['alignment'], open(f + '.align.json', 'w'), ensure_ascii=False)
    r = subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text', '-F', 'model_id=scribe_v1', '-F', 'language_code=vi', '-F', 'file=@' + f + '.mp3'], capture_output=True, text=True).stdout
    st = json.loads(r); json.dump(st, open(f + '.stt.json', 'w'), ensure_ascii=False)
    ref, hyp = nrm(seg['text']), nrm(st['text'])
    sm = difflib.SequenceMatcher(None, ref, hyp); diff = [(' '.join(ref[a:b]), ' '.join(hyp[c:d])) for op, a, b, c, d in sm.get_opcodes() if op != 'equal']
    low = [w['text'] for w in st['words'] if w['type'] == 'word' and w.get('logprob', 0) < -0.7]
    score = sum(max(b - a, d - c) for op, a, b, c, d in sm.get_opcodes() if op != 'equal') * 2 + len(low)
    for x in ('.req', '.resp'): os.remove(f + x)
    return {'id': seg['id'], 'k': k, 'score': score, 'diff': diff, 'low': low, 'dur': st.get('audio_duration_secs')}
jobs = [(s, k) for s in S['segments'] if s['id'] in ONLY for k in range(N)]
with cf.ThreadPoolExecutor(3) as ex: res = [r for r in ex.map(lambda a: tts(*a), jobs) if r]
best = {}
for r in res:
    print(r['id'], r['k'], 'điểm', r['score'], 'lệch', r['diff'], 'kém rõ', r['low'])
    if r['id'] not in best or r['score'] < best[r['id']]['score']: best[r['id']] = r
for i, r in best.items():
    for ext in ('.mp3', '.align.json'): subprocess.run(['cp', f"vo/takes/{i}_{r['k']}{ext}", f"vo/el/{i}{ext}"])
    print('CHỌN', i, r['k'], r['score'])
json.dump(best, open('vo/takes/best.json', 'w'), ensure_ascii=False, indent=1)
