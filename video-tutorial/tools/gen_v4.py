# Đọc liền theo cụm cảnh (ngữ điệu nối tự nhiên) bằng eleven_v4 → chọn bản đúng nhất (Scribe) → cắt ra từng cảnh theo mốc từng chữ.
import json, re, subprocess, base64, unicodedata, difflib, os, sys, concurrent.futures as cf
S = json.load(open('script.json')); V = S['voice']; M = S['model']; N = int(os.environ.get('TAKES', 3))
CH = [['hook', 'trio', 'arch'], ['step1', 'step2', 'step3', 'prompt', 'build'], ['daily', 'phone', 'deep', 'close', 'ep2']]
ONLY = sys.argv[1:]
seg = {s['id']: s['text'] for s in S['segments']}
os.makedirs('vo/v4', exist_ok=True)
def nrm(s): s = unicodedata.normalize('NFC', s.lower()).replace('khóa', 'khoá'); s = s.replace('5:45', 'năm giờ bốn lăm').replace('5 giờ 45', 'năm giờ bốn lăm'); return re.findall(r"[\wÀ-ỹ]+", s)
def take(ci, k):
    ids = CH[ci]; text = ' '.join(seg[i] for i in ids)
    body = {"text": text, "model_id": M, "language_code": "vi", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.3 + 0.05 * k, "use_speaker_boost": True}}
    if ci > 0: body['previous_text'] = seg[CH[ci - 1][-1]]
    if ci < len(CH) - 1: body['next_text'] = seg[CH[ci + 1][0]]
    f = f"vo/v4/c{ci}_{k}"; open(f + '.req', 'w').write(json.dumps(body, ensure_ascii=False))
    c = subprocess.run(['curl', '-sS', '-o', f + '.resp', '-w', '%{http_code}', '-H', 'Content-Type: application/json', '-X', 'POST', f"https://api.elevenlabs.io/v1/text-to-speech/{V}/with-timestamps?output_format=mp3_44100_192", '--data', '@' + f + '.req'], capture_output=True, text=True).stdout
    if c != '200': print(ci, k, c, open(f + '.resp').read()[:200]); return None
    j = json.load(open(f + '.resp')); open(f + '.mp3', 'wb').write(base64.b64decode(j['audio_base64'])); json.dump(j['alignment'], open(f + '.align.json', 'w'), ensure_ascii=False)
    st = json.loads(subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text', '-F', 'model_id=scribe_v1', '-F', 'language_code=vi', '-F', 'file=@' + f + '.mp3'], capture_output=True, text=True).stdout)
    ref, hyp = nrm(text), nrm(st['text']); sm = difflib.SequenceMatcher(None, ref, hyp)
    d = [(' '.join(ref[a:b]), ' '.join(hyp[c2:d2])) for op, a, b, c2, d2 in sm.get_opcodes() if op != 'equal']
    ign = {('actions', 'action'), ('dailycast', 'daily cast'), ('dailycast', 'dailycast')}
    d = [x for x in d if x not in ign]
    os.remove(f + '.req'); os.remove(f + '.resp')
    return {'ci': ci, 'k': k, 'score': sum(len(a.split()) + len(b.split()) for a, b in d), 'diff': d, 'dur': st.get('audio_duration_secs'), 'text': text}
jobs = [(ci, k) for ci in range(len(CH)) if not ONLY or str(ci) in ONLY for k in range(N)]
with cf.ThreadPoolExecutor(3) as ex: res = [r for r in ex.map(lambda a: take(*a), jobs) if r]
best = json.load(open('vo/v4/best.json')) if os.path.exists('vo/v4/best.json') else {}
for r in sorted(res, key=lambda r: (r['ci'], r['k'])):
    print(f"cụm {r['ci']} bản {r['k']} {r['dur']:.1f}s điểm {r['score']} lệch {r['diff']}")
    if str(r['ci']) not in best or r['score'] < best[str(r['ci'])]['score'] or str(r['ci']) in ONLY and r['k'] == min((x for x in res if x['ci'] == r['ci']), key=lambda x: x['score'])['k']:
        best[str(r['ci'])] = r
json.dump(best, open('vo/v4/best.json', 'w'), ensure_ascii=False, indent=1)
# cắt từng cảnh theo mốc ký tự, điểm cắt ở giữa khoảng lặng giữa hai cảnh
for ci, ids in enumerate(CH):
    b = best[str(ci)]; f = f"vo/v4/c{ci}_{b['k']}"; al = json.load(open(f + '.align.json'))
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']; full = ''.join(chars)
    pos = 0; spans = []
    for i in ids:
        a = full.index(seg[i], pos); spans.append((a, a + len(seg[i]))); pos = a + len(seg[i])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f + '.mp3'], capture_output=True, text=True).stdout)
    for n, (i, (a, z)) in enumerate(zip(ids, spans)):
        t0 = 0 if n == 0 else (en[spans[n - 1][1] - 1] + st[a]) / 2
        t1 = dur if n == len(ids) - 1 else (en[z - 1] + st[spans[n + 1][0]]) / 2
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t0:.3f}', '-to', f'{t1:.3f}', '-i', f + '.mp3', '-c:a', 'libmp3lame', '-b:a', '192k', f'vo/el/{i}.mp3'])
        json.dump({'characters': chars[a:z], 'character_start_times_seconds': [x - t0 for x in st[a:z]], 'character_end_times_seconds': [x - t0 for x in en[a:z]]}, open(f'vo/el/{i}.align.json', 'w'), ensure_ascii=False)
    print('cụm', ci, 'chọn bản', b['k'], 'điểm', b['score'])
