"""Cold Read, round 5 (Hot & Cold): word vectors for the hidden Week 6 game at /play/cold-read/round-5/.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html, section 6 (dense
word embeddings, compared with cosine). The game hides one word from the Marvel pages; every guess
scores its cosine similarity to the hidden word, and its rank among all the words the game knows.

The vectors are GloVe (Pennington, Socher and Manning 2014), the 100-dimension model trained on
Wikipedia 2014 and Gigaword 5, released under the Public Domain Dedication and License. The brief
shows that Word2Vec trained on the 303 pages alone gives noisy neighbours, so the game uses these
pretrained vectors and keeps only words that appear on the Marvel pages.

  vocabulary  words of letters only, used at least 4 times across the 303 pages, known to GloVe and
              not an NLTK stopword (GloVe puts the, of and yet near almost every word, so they
              would crowd every neighbourhood), the 9,000 most used (course token rule)
  targets     on 8 to 150 pages and used at least 12 times, not a stopword or a name (the brief's
              rule), 4 letters or more, outside GloVe's 4,000 most frequent words (so Marvel's words,
              like mutant, beat everyday ones, like street), not an inflected form of a known word
              (kills, decides, attacking), and with
              a clear neighbourhood: its ten nearest words in the vocabulary average a cosine of at
              least 0.55. The 300 most used on the pages are kept.

Vectors are scaled to unit length, so a dot product is a cosine, then stored as int8 with one scale per
row (the same packing as the course's universe map).

Needs build/glove/glove-wiki-gigaword-100.gz (gensim-data release, about 130 MB, fetched with aria2c)
and NLTK stopwords in $NLTK_DATA.

Writes public/play/cold-read/data/hot_cold.json and hot_cold.bin.

    NLTK_DATA=build/nltk_data python analysis/week06_hot_cold.py   # about 60 seconds
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
from week06_lookalikes import name_words, stopwords, tokens  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
GLOVE = ROOT / "build/glove/glove-wiki-gigaword-100.gz"
OUT = ROOT / "public/play/cold-read/data/hot_cold.json"
BIN = OUT.with_suffix(".bin")
VOCAB, MIN_USES = 9000, 4
TARGET_DF, TARGET_USES, CLEAR, COMMON, TARGETS = (8, 150), 12, 0.55, 4000, 300
MIN_TARGETS = 100


def inflected(w, known):
    """An inflected form whose stem the game also knows (kills, decides, possessed, attacking, truly)."""
    stems = {"ing": ("", "e"), "ly": ("",), "ies": ("y",), "es": ("",), "s": ("",), "ed": ("", "e"), "ied": ("y",)}
    return any(w.endswith(end) and len(w) > len(end) + 2 and w[: -len(end)] + add in known
               for end, adds in stems.items() for add in adds)


def main():
    from gensim.models import KeyedVectors

    if not GLOVE.exists():
        raise SystemExit(f"{GLOVE} is missing: aria2c -x 16 -s 16 -d build/glove -o glove-wiki-gigaword-100.gz "
                         "https://github.com/RaRe-Technologies/gensim-data/releases/download/glove-wiki-gigaword-100/"
                         "glove-wiki-gigaword-100.gz")
    text = t.pages()
    toks = [tokens(text[i]) for i in sorted(text)]
    uses = Counter(w for d in toks for w in d)
    df = Counter(w for d in toks for w in set(d))
    names = name_words(text.values())
    stop = stopwords()

    glove = KeyedVectors.load_word2vec_format(GLOVE, binary=False)
    words = [w for w, n in uses.most_common()
             if n >= MIN_USES and re.fullmatch(r"[a-z]+", w) and w not in stop and w in glove.key_to_index][:VOCAB]
    m = np.array([glove[w] for w in words], dtype=np.float64)
    m /= np.linalg.norm(m, axis=1, keepdims=True)

    sims = m @ m.T
    np.fill_diagonal(sims, -1)
    clear = np.sort(sims, axis=1)[:, -10:].mean(axis=1)
    targets = [i for i, w in enumerate(words)
               if TARGET_DF[0] <= df[w] <= TARGET_DF[1] and uses[w] >= TARGET_USES and len(w) >= 4
               and w not in names and clear[i] >= CLEAR and glove.key_to_index[w] >= COMMON]
    known = set(words)
    targets = [i for i in targets if not inflected(words[i], known)][:TARGETS]
    print(f"{len(words)} words in the vocabulary, {len(targets)} targets")
    if len(targets) < MIN_TARGETS:
        raise SystemExit(f"fewer than {MIN_TARGETS} targets")
    for i in targets[:: max(1, len(targets) // 8)]:
        near = np.argsort(-sims[i])[:6]
        print(f"  {words[i]:>12}: " + ", ".join(f"{words[j]} {sims[i, j]:.2f}" for j in near))

    scale = np.abs(m).max(axis=1) / 127
    q = np.round(m / scale[:, None]).astype(np.int8)
    BIN.write_bytes(q.tobytes())
    out = {
        "source": "GloVe 6B 100d (Pennington, Socher, Manning 2014; PDDL), words from the 303 Marvel pages",
        "dims": int(m.shape[1]),
        "vocab": words,
        "scale": [round(float(s), 7) for s in scale],
        "df": [df[w] for w in words],
        "targets": targets,
    }
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB) and {BIN.name} ({BIN.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
