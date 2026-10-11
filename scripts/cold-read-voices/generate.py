"""Speak every Cold Read game-over line with Kokoro-82M (Apache 2.0) and save
public/play/cold-read/audio/go-NNN.mp3, one per voiced card, loudness-normalised.

Each line follows its delivery in lines.py: phrases are spoken one by one,
trimmed, pitch-shifted (ffmpeg asetrate + atempo, so the length stays), set to
their own loudness and joined with the pauses written between them.

Setup, once:
  uv venv -p 3.11 /tmp/kv && uv pip install -p /tmp/kv kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin (kokoro-onnx release model-files-v1.0)
Run from the repo root with a short TMPDIR (espeak-ng truncates long data paths):
  TMPDIR=/tmp /tmp/kv/bin/python scripts/cold-read-voices/generate.py <model dir> [card ...]
Needs ffmpeg on PATH.
"""
import os
import subprocess
import sys
import tempfile
import time

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, E  # noqa: E402

MODELS = sys.argv[1]
ONLY = {int(a) for a in sys.argv[2:]}
OUT = os.path.join("public", "play", "cold-read", "audio")
SR = 24000
BREATH = 0.06  # seconds between two phrases with no pause written
os.makedirs(OUT, exist_ok=True)
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))


def trim(x, floor=0.012, pad=0.03):
    """Cut the near-silence Kokoro leaves at both ends of a phrase."""
    loud = np.flatnonzero(np.abs(x) > floor)
    if not len(loud):
        return x
    p = int(pad * SR)
    return x[max(loud[0] - p, 0): loud[-1] + p]


def shift(x, semitones, tmp):
    """Change the pitch, keep the length."""
    if not semitones:
        return x
    f = 2 ** (semitones / 12)
    src, dst = os.path.join(tmp, "in.wav"), os.path.join(tmp, "out.wav")
    sf.write(src, x, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", f"asetrate={SR * f:.0f},aresample={SR},atempo={1 / f:.5f}", dst], check=True)
    y, _ = sf.read(dst, dtype="float32")
    return y


def speak(voice, speed, delivery, tmp):
    parts, last_was_pause = [], True
    for seg in delivery:
        if isinstance(seg, float):
            parts.append(np.zeros(int(seg * SR), dtype=np.float32))
            last_was_pause = True
            continue
        seg = E(seg) if isinstance(seg, str) else seg
        if not last_was_pause:
            parts.append(np.zeros(int(BREATH * SR), dtype=np.float32))
        x, sr = k.create(seg["t"], voice=voice, speed=speed * seg["speed"], lang="en-us" if voice.startswith("a") else "en-gb")
        assert sr == SR
        x = shift(trim(x), seg["pitch"], tmp) * (10 ** (seg["gain"] / 20))
        parts.append(x.astype(np.float32))
        last_was_pause = False
    return np.concatenate(parts)


# A silent card plays only its recorded effect: drop any old voice file for it.
for n, spec in LINES.items():
    old = os.path.join(OUT, f"go-{n:03d}.mp3")
    if spec is None and os.path.exists(old):
        os.remove(old)
todo = sorted((n, spec) for n, spec in LINES.items() if spec is not None and (not ONLY or n in ONLY))
t0 = time.time()
total = len(todo)
with tempfile.TemporaryDirectory() as tmp:
    for i, (n, (voice, speed, delivery)) in enumerate(todo, 1):
        if isinstance(delivery, str):
            delivery = [delivery]
        x = speak(voice, speed, delivery, tmp)
        wav = os.path.join(tmp, f"{n}.wav")
        sf.write(wav, x, SR)
        mp3 = os.path.join(OUT, f"go-{n:03d}.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5",
                        "-ac", "1", "-ar", str(SR), "-codec:a", "libmp3lame", "-b:a", "48k", mp3], check=True)
        el = time.time() - t0
        print(f"{i}/{total} ({i * 100 // total}%) card {n}: {len(x) / SR:.1f}s, ~{el / i * (total - i):.0f}s left", flush=True)
