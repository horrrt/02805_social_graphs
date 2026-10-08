"""Fetch one CC0 sound from Freesound for each Cold Read game-over card, trim it
and save public/play/cold-read/audio/fx-NNN.mp3, plus fx-credits.json with each
clip's Freesound id, title, author, link and licence.

Only CC0 clips are taken, so no credit is required; the list is kept anyway.
It uses Freesound's HQ preview MP3, which a plain API key can fetch.

The key is read from $FREESOUND_API_KEY or ~/.config/freesound/api_key.
Run from the repo root (needs ffmpeg):
  python3 scripts/cold-read-voices/clips.py            # every card
  python3 scripts/cold-read-voices/clips.py 8 92 98    # some cards
"""
import json
import re
import os
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

# Card number -> Freesound search text. Shorter, punchier clips are preferred.
QUERIES = {
    1: "cartoon fall thud", 2: "glass shatter", 3: "cartoon tongue blep", 4: "cartoon birds dizzy",
    5: "slurp drool", 6: "raspberry blowing", 7: "coin spin", 8: "sword slash blood splatter",
    9: "glass crack sad", 10: "crunchy eating", 11: "whisper", 12: "laser pew",
    13: "circular saw", 14: "squish splat", 15: "impact hit cinematic", 16: "camera shutter",
    17: "horse gallop party horn", 18: "wrong answer buzzer", 19: "8 bit game over", 20: "microphone drop",
    21: "dramatic sting", 22: "deep boom impact", 23: "slow motion bass drop", 24: "sad violin",
    25: "fire crackling", 26: "funeral march brass", 27: "bonk hit", 28: "radio static military",
    29: "error beep computer", 30: "dust wind whoosh", 31: "footsteps walking away", 32: "slow clapping",
    33: "popcorn crunch", 34: "face slap", 35: "pencil scribble", 36: "muffled talking",
    37: "man laughing hysterical", 38: "party horn confetti", 39: "huh question", 40: "boo crowd",
    41: "kiss mwah", 42: "tea sip slurp", 43: "fuse hiss", 44: "bubble gum pop",
    45: "snoring", 46: "page flip book", 47: "man grunt effort", 48: "whoosh swish",
    49: "electric guitar riff", 50: "crowd booing", 51: "crying sobbing", 52: "calculator beeps",
    53: "hmm thinking", 54: "balloon pop", 55: "small fanfare", 56: "eating chewing",
    57: "spit take spray", 58: "zoom whir", 59: "ice cream splat", 60: "keyboard typing",
    61: "fishing reel splash", 62: "flag flapping wind", 63: "rubber duck squeak", 64: "slip fall cartoon",
    65: "clock ticking", 66: "church bell toll", 67: "ghost wooo", 68: "blow out candle",
    69: "sword swoosh spin", 70: "zip string", 71: "whoosh loop", 72: "bubbles pop",
    73: "paper throw whoosh", 74: "light bulb buzz pop", 75: "sad piano", 76: "om meditation chant",
    77: "watch ticking tapping", 78: "magic sparkle", 79: "cheerleader cheer", 80: "confused huh",
    81: "rain thunder", 82: "punch", 83: "cards shuffle", 84: "paint brush stroke",
    85: "barbell drop", 86: "snowball splat", 87: "kazoo", 88: "bubble pipe pop",
    89: "fan flutter", 90: "pen check tick", 91: "splash plop", 92: "jumpscare scream",
    93: "recording beep", 94: "sad trombone", 95: "old lady laugh", 96: "horror heartbeat",
    97: "tv static", 98: "sitcom laugh track", 99: "stamp thud", 100: "toilet flush",
    101: "weightlifting grunt strain", 102: "cartoon boing",
    103: "falling whistle", 104: "rope snap", 105: "coins pouring", 106: "rubber band snap", 107: "boing bounce", 108: "footsteps walking long", 109: "crickets night", 110: "bridge collapse", 111: "magnet click snap together", 112: "mouse click", 113: "notification pop", 114: "message sent whoosh", 115: "kick out door slam", 116: "crowd ooh", 117: "shout echo cave", 118: "pop cork", 119: "thread snap", 120: "birds flapping wings", 121: "rubber stamp", 122: "notification pings", 123: "computer beep boop", 124: "party horn", 125: "error buzz", 126: "rising tone", 127: "wobble spring", 128: "ball rolling", 129: "conveyor belt machine", 130: "scanner beep", 131: "keyboard typing fast", 132: "power down", 133: "robot dance electronic beat", 134: "computer processing", 135: "heartbeat monitor flatline", 136: "electric zap", 137: "falling into hole", 138: "tape slow down", 139: "magic shimmer", 140: "typing click", 141: "metal clinking pile", 142: "arcade win jingle", 143: "sword slash blood splatter", 144: "jumpscare scream", 145: "horse gallop party horn",
}

# Cards whose search picks the wrong thing: a Freesound id chosen by hand (all CC0).
PINNED = {32: 757174, 36: 238387, 70: 176570, 71: 234553, 106: 152413, 117: 859347, 129: 168989, 133: 332064, 134: 260103, 137: 538151, 143: 323526, 144: 712416, 145: 197212}
FIELDS = "id,name,username,url,license,duration,previews,avg_rating,num_downloads"

API = "https://freesound.org/apiv2"
BANNED = re.compile(r"fuck|shit|bitch|damn|crap|\bass\b", re.I)
OUT = os.path.join("public", "play", "cold-read", "audio")
CREDITS = os.path.join(OUT, "fx-credits.json")


def onset(path):
    """Seconds of near-silence before a clip's first real sound."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "8000", "-"], capture_output=True, check=True).stdout
    x = np.abs(np.frombuffer(raw, np.float32))
    if not len(x):
        return 0.0
    loud = np.flatnonzero(x > max(x.max() * 0.1, 0.01))
    return max(loud[0] / 8000 - 0.02, 0.0) if len(loud) else 0.0


def key():
    k = os.environ.get("FREESOUND_API_KEY")
    if not k:
        path = os.path.expanduser("~/.config/freesound/api_key")
        if os.path.exists(path):
            k = open(path).read().strip()
    if not k:
        sys.exit("No Freesound key: set FREESOUND_API_KEY or write it to ~/.config/freesound/api_key")
    return k


def get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Token {token}", "User-Agent": "cold-read-clips"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def search(text, token):
    q = urllib.parse.urlencode({
        "query": text,
        "filter": 'license:"Creative Commons 0" duration:[0.2 TO 15]',
        "sort": "score",
        "fields": FIELDS,
        "page_size": 15,
    })
    res = json.loads(get(f"{API}/search/text/?{q}", token))["results"]
    # Keep it clean: skip clips whose titles swear.
    res = [r for r in res if not BANNED.search(r["name"])]
    # Prefer well-rated, often-downloaded, short clips among the best matches.
    res.sort(key=lambda r: (-(r.get("avg_rating") or 0) * 0.5 - min(r.get("num_downloads") or 0, 5000) / 2000 + r["duration"] / 6))
    return res


def main():
    token = key()
    os.makedirs(OUT, exist_ok=True)
    credits = json.load(open(CREDITS)) if os.path.exists(CREDITS) else {}
    cards = [int(a) for a in sys.argv[1:]] or sorted(QUERIES)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        for i, n in enumerate(cards, 1):
            if n in PINNED:
                h = json.loads(get(f"{API}/sounds/{PINNED[n]}/?fields={FIELDS}", token))
                assert "publicdomain/zero" in h["license"], (n, h["license"])
                hits = [h]
                words = []
            else:
                words = QUERIES[n].split()
            # The full search first, then shorter ones, until something matches.
            tries = [" ".join(words[a:b]) for size in range(len(words), 0, -1) for a in range(len(words) - size + 1) for b in [a + size]]
            for t in tries:
                hits = search(t, token)
                time.sleep(1.1)
                if hits:
                    break
            if not hits:
                print(f"{i}/{len(cards)} card {n}: no CC0 match for {QUERIES[n]!r}", flush=True)
                continue
            h = hits[0]
            raw = os.path.join(tmp, f"{n}.mp3")
            open(raw, "wb").write(get(h["previews"]["preview-hq-mp3"], token))
            out = os.path.join(OUT, f"fx-{n:03d}.mp3")
            # Cut the lead-in silence so the sound lands when the card plays it,
            # then at most 3.5 s, quick fade out, levelled to sit under the voice.
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{onset(raw):.3f}", "-i", raw, "-t", "3.5",
                            "-af", "afade=t=out:st=3.1:d=0.4,loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "24000",
                            "-codec:a", "libmp3lame", "-b:a", "48k", out], check=True)
            credits[str(n)] = {"id": h["id"], "name": h["name"], "author": h["username"], "url": h["url"], "license": h["license"]}
            el = time.time() - t0
            print(f"{i}/{len(cards)} ({i * 100 // len(cards)}%) card {n}: {h['name']!r} by {h['username']}, ~{el / i * (len(cards) - i):.0f}s left", flush=True)
            time.sleep(1.1)  # Freesound allows 60 requests a minute
    json.dump(dict(sorted(credits.items(), key=lambda kv: int(kv[0]))), open(CREDITS, "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
