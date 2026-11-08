#!/usr/bin/env python3
"""MMH Daily — tạo file podcast MP3 từ kịch bản trong data/editions/<ngày>.json.

Giọng: edge-tts (giọng neural Microsoft, miễn phí). Lỗi ⇒ thử lại; hỏng hẳn ⇒ Piper (offline) nếu đã cài.
Tuỳ chọn: DAILY_VOICE=eleven (+ secret ELEVENLABS_API_KEY) ⇒ giọng ElevenLabs tự nhiên hơn, bộ giọng theo DAILY_VOICES (config.json ▸ voice.presets).
ElevenLabs lỗi / hết credit giữa chừng ⇒ cả số quay về edge-tts (không trộn giọng).
Nhạc hiệu mở / kết tự tạo bằng ffmpeg (hợp âm khác nhau theo chương trình). Âm lượng chuẩn -16 LUFS, MP3 mono 64 kbps.
Ghi lại mốc thời gian từng lượt lời (turns[i].t) để app chạy phụ đề theo giọng đọc.

Chạy: python3 tools/audio.py [ngày yyyy-mm-dd]   (cần ffmpeg + pip install edge-tts)
"""
import asyncio, json, os, subprocess, sys, tempfile, shutil, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SR = 24000
CHORDS = {  # nhạc hiệu: nốt gốc (Hz) theo chương trình
    'briefing': [392.0, 493.9, 587.3], 'twotakes': [349.2, 440.0, 523.3], 'healthdesk': [329.6, 415.3, 493.9],
    'markets': [293.7, 370.0, 440.0], 'editor': [261.6, 329.6, 392.0], 'explainer': [440.0, 523.3, 659.3], 'weekly': [311.1, 392.0, 466.2],
    'thisweek': [349.2, 440.0, 523.3, 659.3], 'notes': [261.6, 311.1, 392.0], 'roundup': [293.7, 370.0, 440.0, 587.3], 'desk': [329.6, 392.0, 493.9],
}
PIPER = {'A': 'en_US-lessac-medium', 'B': 'en_GB-alan-medium'}
FEMALE = {'Ava', 'Emma', 'Jenny', 'Michelle', 'Libby', 'Sonia', 'Natasha', 'Aria', 'Sara', 'Clara', 'Jane', 'Nancy', 'Maisie', 'Hollie', 'Ana'}


def eleven_voices(hosts):
    """Gán giọng ElevenLabs cho từng người dẫn theo bộ giọng (nữ / nam theo tên người dẫn)."""
    cfg = json.loads((ROOT / 'config.json').read_text()).get('voice', {})
    want = os.environ.get('DAILY_VOICES') or (cfg.get('presets') or [{}])[0].get('id')
    p = next((x for x in cfg.get('presets', []) if x['id'] == want), (cfg.get('presets') or [None])[0])
    if not p:
        return None, None
    out, used = {}, set()
    for h in hosts:
        g = 'f' if h['name'] in FEMALE else 'm'
        if p[g]['id'] in used:                       # 2 người cùng giới ⇒ người thứ hai lấy giọng còn lại
            g = 'm' if g == 'f' else 'f'
        out[h['id']] = p[g]['id']; used.add(p[g]['id'])
    return out, cfg.get('model', 'eleven_multilingual_v2')


def tts_eleven(text, voice_id, out, model, prev_text='', next_text=''):
    import urllib.request, urllib.error
    body = {'text': text, 'model_id': model, 'previous_text': prev_text[-600:], 'next_text': next_text[:600],
            'voice_settings': {'stability': 0.42, 'similarity_boost': 0.8, 'style': 0.18, 'use_speaker_boost': True}}
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                out.write_bytes(r.read())
            return out.stat().st_size > 1000
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='ignore')[:200]
            print(f'  ElevenLabs lỗi {e.code}: {msg}')
            if e.code in (401, 402, 403) or 'quota' in msg.lower():
                return False                          # hết credit / sai khoá ⇒ không thử lại
        except Exception as e:
            print(f'  ElevenLabs lỗi mạng (lần {i+1}): {e}')
        time.sleep(3 * (i + 1))
    return False


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def dur(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True).stdout.strip()
    return float(out or 0)


def jingle(path, notes, length=3.2, rev=False):
    """Hợp âm rải nhẹ: 3 nốt nối nhau, tắt dần; rev = bản kết (rải ngược, ngắn hơn)."""
    seq = list(reversed(notes)) if rev else notes
    parts = []
    for i, f in enumerate(seq):
        t0 = i * 0.18
        parts.append(f"0.16*sin(2*PI*{f}*t)*exp(-2.4*(t-{t0}))*gt(t,{t0})")
        parts.append(f"0.05*sin(2*PI*{f*2}*t)*exp(-3.5*(t-{t0}))*gt(t,{t0})")
    expr = '+'.join(parts)
    run(['ffmpeg', '-y', '-f', 'lavfi', '-i', f"aevalsrc='{expr}':s={SR}:d={length}", '-af', f'afade=t=out:st={length-0.8}:d=0.8', '-ac', '1', str(path)])


def silence(path, sec):
    run(['ffmpeg', '-y', '-f', 'lavfi', '-i', f'anullsrc=r={SR}:cl=mono', '-t', str(sec), str(path)])


async def tts_edge(text, voice, out, rate):
    import edge_tts
    for i in range(4):
        try:
            await edge_tts.Communicate(text, voice, rate=rate).save(str(out))
            if out.exists() and out.stat().st_size > 1000:
                return True
        except Exception as e:  # mạng chập chờn / bị giới hạn ⇒ thử lại
            print(f'  edge-tts lỗi ({voice}, lần {i+1}): {e}')
        await asyncio.sleep(2 * (i + 1))
    return False


def tts_piper(text, sp, out):
    model = PIPER.get(sp, PIPER['A'])
    try:
        subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-f', str(out)], input=text.encode(), check=True, capture_output=True, timeout=120)
        return out.exists()
    except Exception as e:
        print('  piper lỗi:', e)
        return False


async def main():
    # python3 tools/audio.py [ngày]  hoặc  python3 tools/audio.py --ed <file.json> --out <thư mục mp3>
    args = sys.argv[1:]
    ed_path = Path(args[args.index('--ed') + 1]) if '--ed' in args else None
    out_dir = Path(args[args.index('--out') + 1]) if '--out' in args else ROOT / 'audio'
    if ed_path is None:
        eds = ROOT / 'data' / 'editions'
        date = args[0] if args and not args[0].startswith('--') else sorted(p.stem for p in eds.glob('*.json'))[-1]
        ed_path = eds / f'{date}.json'
    ed = json.loads(ed_path.read_text())
    date = ed['date']
    pod = ed['podcast']
    voices = {h['id']: h['voice'] for h in pod['hosts']}
    tmp = Path(tempfile.mkdtemp())
    t_start = time.time()

    # 1. giọng đọc từng lượt (song song 4 lượt)
    sem = asyncio.Semaphore(4)
    rate = os.environ.get('DAILY_RATE', '+0%')
    engine = {'edge': 0, 'piper': 0, 'fail': 0, 'eleven': 0}
    turns = pod['turns']
    files = None
    req = pod.get('voiceReq') or {}                  # số do Claude viết: lựa chọn giọng đi kèm số báo
    if req.get('engine') and not os.environ.get('DAILY_VOICE'):
        os.environ['DAILY_VOICE'] = req['engine']
        if req.get('preset'): os.environ['DAILY_VOICES'] = req['preset']
    if os.environ.get('DAILY_VOICE') == 'eleven' and os.environ.get('ELEVENLABS_API_KEY'):
        ev, model = eleven_voices(pod['hosts'])
        chars = sum(len(t['text']) for t in turns)
        print(f'ElevenLabs: {len(turns)} lượt · {chars} ký tự · model {model}')
        if ev:
            def el(i):
                t = turns[i]
                same = lambda j: 0 <= j < len(turns) and turns[j]['sp'] == t['sp']
                mp3 = tmp / f'e{i:03d}.mp3'
                ok = tts_eleven(t['text'], ev.get(t['sp'], list(ev.values())[0]), mp3, model,
                                turns[i - 1]['text'] if same(i - 1) else '', turns[i + 1]['text'] if same(i + 1) else '')
                return mp3 if ok else None
            esem = asyncio.Semaphore(3)               # ElevenLabs giới hạn số lượt song song theo gói
            async def el_async(i):
                async with esem:
                    return await asyncio.to_thread(el, i)
            res = await asyncio.gather(*[el_async(i) for i in range(len(turns))])
            if all(res):
                files = res; engine['eleven'] = len(res)
                pod['voice'] = {'engine': 'eleven', 'preset': os.environ.get('DAILY_VOICES', ''), 'chars': chars}
            else:
                print('ElevenLabs không tạo đủ các lượt ⇒ dùng giọng miễn phí cho cả số')
    elif os.environ.get('DAILY_VOICE') == 'eleven':
        print('Chưa có secret ELEVENLABS_API_KEY ⇒ dùng giọng miễn phí')

    async def one(i, turn):
        mp3 = tmp / f't{i:03d}.mp3'
        async with sem:
            ok = await tts_edge(turn['text'], voices.get(turn['sp'], list(voices.values())[0]), mp3, rate)
        if ok:
            engine['edge'] += 1
            return mp3
        wav = tmp / f't{i:03d}.wav'
        if tts_piper(turn['text'], turn['sp'], wav):
            engine['piper'] += 1
            return wav
        engine['fail'] += 1
        return None

    if files is None:
        files = await asyncio.gather(*[one(i, t) for i, t in enumerate(turns)])
        pod['voice'] = {'engine': 'edge'}
    if engine['fail'] > len(files) * 0.2:
        sys.exit(f'Quá nhiều lượt không tạo được giọng: {engine}')

    # 2. ghép: nhạc hiệu · lời · nhạc kết; ghi mốc thời gian
    notes = CHORDS.get(pod['show'], CHORDS['briefing'])
    intro, outro = tmp / 'intro.wav', tmp / 'outro.wav'
    jingle(intro, notes, 3.2)
    jingle(outro, notes, 2.6, rev=True)
    gaps = {k: tmp / f'gap{k}.wav' for k in ('s', 'm')}
    silence(gaps['s'], 0.35)
    silence(gaps['m'], 0.6)
    seq, t = [], 0.0
    seq.append(intro); t += dur(intro)
    prev = None
    for i, f in enumerate(files):
        turn = pod['turns'][i]
        if f is None:
            turn['t'] = None
            continue
        wav = tmp / f'n{i:03d}.wav'
        run(['ffmpeg', '-y', '-i', str(f), '-ar', str(SR), '-ac', '1', str(wav)])
        if prev is not None:
            g = gaps['s'] if prev == turn['sp'] else gaps['m']
            seq.append(g); t += dur(g)
        turn['t'] = round(t, 2)
        seq.append(wav); t += dur(wav)
        prev = turn['sp']
    seq.append(gaps['m']); seq.append(outro)

    lst = tmp / 'list.txt'
    lst.write_text(''.join(f"file '{p}'\n" for p in seq))
    raw = tmp / 'raw.wav'
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(raw)])
    out_dir.mkdir(parents=True, exist_ok=True)
    mp3 = out_dir / f'{date}.mp3'
    title = pod.get('title', 'MMH Daily')
    run(['ffmpeg', '-y', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '1', '-b:a', '64k',
         '-metadata', f'title={title}', '-metadata', 'artist=MMH Daily', '-metadata', 'album=MMH Daily', '-metadata', f'date={date}', str(mp3)])
    pod['audio'] = {'file': f'audio/{date}.mp3' if out_dir == ROOT / 'audio' else str(mp3), 'dur': round(dur(mp3), 1), 'bytes': mp3.stat().st_size, 'engine': engine}
    ed_path.write_text(json.dumps(ed, ensure_ascii=False, separators=(',', ':')))
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"Podcast {date}: {pod['audio']['dur']/60:.1f} phút · {pod['audio']['bytes']/1e6:.1f} MB · giọng {engine} · {time.time()-t_start:.0f} s")


if __name__ == '__main__':
    asyncio.run(main())
