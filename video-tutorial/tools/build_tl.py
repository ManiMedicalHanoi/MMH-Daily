import json, subprocess, re, numpy as np, soundfile as sf
S = json.load(open('script.json')); SR = 48000
LEAD, GAP, END = 0.9, 0.75, 6.5
GAPS = {'step1': 1.1, 'prompt': 0.9, 'daily': 1.0, 'close': 1.0, 'ep2': 1.1}
t = LEAD; segs = {}; chunks = []; audio = [np.zeros(int(LEAD * SR))]
for i, s in enumerate(S['segments']):
    if i: g = GAPS.get(s['id'], GAP); audio.append(np.zeros(int(g * SR))); t += g
    wav = subprocess.run(['ffmpeg', '-v', 'error', '-i', f"vo/el/{s['id']}.mp3", '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(wav, dtype=np.float32); d = len(x) / SR
    al = json.load(open(f"vo/el/{s['id']}.align.json")); ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words = []; cur = ''; ws = None
    for c, a, b in zip(ch, st, en):
        if c.isspace():
            if cur: words.append({'w': cur, 's': round(t + ws, 3), 'e': round(t + pe, 3)}); cur = ''
            continue
        if not cur: ws = a
        cur += c; pe = b
    if cur: words.append({'w': cur, 's': round(t + ws, 3), 'e': round(t + pe, 3)})
    segs[s['id']] = {'start': round(t, 3), 'end': round(t + d, 3), 'words': words}
    # phụ đề: tách theo dấu câu, tối đa 7 từ
    buf = []
    for w in words:
        buf.append(w)
        if re.search(r'[.,:?!]$', w['w']) or len(buf) >= 7:
            chunks.append({'s': buf[0]['s'], 'e': buf[-1]['e'], 't': ' '.join(x['w'] for x in buf).rstrip(',')}); buf = []
    if buf: chunks.append({'s': buf[0]['s'], 'e': buf[-1]['e'], 't': ' '.join(x['w'] for x in buf)})
    audio.append(x.astype(np.float64)); t += d
total = t + END; audio.append(np.zeros(int(END * SR)))
y = np.concatenate(audio); sf.write('vo/narration.wav', np.stack([y, y], 1), SR)
json.dump({'total': round(total, 3), 'endcard': round(t + 0.6, 3), 'segs': segs, 'subs': chunks}, open('timeline.json', 'w'), ensure_ascii=False)
print('total', round(total, 2)); [print(k, v['start'], v['end']) for k, v in segs.items()]
