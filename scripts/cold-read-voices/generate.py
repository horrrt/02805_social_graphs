"""Speak every Cold Read game-over line with Kokoro-82M (Apache 2.0) and save
public/play/cold-read/audio/go-NNN.mp3, one per card, loudness-normalised.

Setup, once:
  uv venv -p 3.11 /tmp/kv && uv pip install -p /tmp/kv kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin (kokoro-onnx release model-files-v1.0)
Run from the repo root with a short TMPDIR (espeak-ng truncates long data paths):
  TMPDIR=/tmp /tmp/kv/bin/python scripts/cold-read-voices/generate.py <model dir>
Needs ffmpeg on PATH. The lines are in lines.py next to this file.
"""
import os
import subprocess
import sys
import tempfile
import time

import soundfile as sf
from kokoro_onnx import Kokoro

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, MAIN  # noqa: E402

MODELS = sys.argv[1]
OUT = os.path.join("public", "play", "cold-read", "audio")
os.makedirs(OUT, exist_ok=True)
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
t0 = time.time()
total = len(LINES)
with tempfile.TemporaryDirectory() as tmp:
    for i, (n, spec) in enumerate(sorted(LINES.items()), 1):
        if len(spec) == 2:
            (voice, speed), text = MAIN, spec[1]
        else:
            voice, speed, text = spec
        samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us" if voice.startswith("a") else "en-gb")
        wav = os.path.join(tmp, f"{n}.wav")
        sf.write(wav, samples, sr)
        mp3 = os.path.join(OUT, f"go-{n:03d}.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5",
                        "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", mp3], check=True)
        el = time.time() - t0
        print(f"{i}/{total} ({i * 100 // total}%) card {n}: {len(samples) / sr:.1f}s, ~{el / i * (total - i):.0f}s left", flush=True)
