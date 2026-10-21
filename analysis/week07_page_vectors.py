"""Document embeddings of the 303 Marvel pages, the Week 7 brief's corpus atlas rule.

Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html, section 2 (walk through a corpus) and
its Python example, followed exactly: all-MiniLM-L6-v2 from sentence-transformers, each page cut into
passages of at most 180 words along sentence boundaries, every passage embedded with unit length, and the
page's vector the mean of its passage vectors, scaled back to unit length. The encoder reads at most 256
word pieces, so embedding whole pages would keep only their first paragraph or two.

Needs sentence-transformers, which the brief installs for Week 7 but the course environment does not carry
(it pulls in PyTorch). Run it once with any Python that has it; it reads the zip directly, so it needs
nothing else from this repository:

    pip install sentence-transformers
    python analysis/week07_page_vectors.py   # about a minute; downloads the 90 MB model on first use

Writes build/week07/page_vectors.npy (303 x 384, float32) and build/week07/page_vectors.json (the
node_ids in row order, the model, the passage rule and the zip's sha256). build/ stays out of git;
analysis/week07_topic_tetris.py reads both and checks the zip hash before it trusts them.
"""

import hashlib
import json
import re
import urllib.parse
import zipfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "data" / "marvel_pages.zip"
OUT = ROOT / "build" / "week07" / "page_vectors"
MODEL = "all-MiniLM-L6-v2"
MAX_WORDS = 180


def passages(text, max_words=MAX_WORDS):
    """The brief's chunking rule: sentences joined until the next would pass max_words."""
    out, current, n = [], [], 0
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        words = len(sentence.split())
        if current and n + words > max_words:
            out.append(" ".join(current))
            current, n = [], 0
        current.append(sentence)
        n += words
    if current:
        out.append(" ".join(current))
    return out


def main():
    from sentence_transformers import SentenceTransformer

    with zipfile.ZipFile(ZIP) as z:
        text = {
            urllib.parse.unquote(n.split("/")[-1][:-4]): z.read(n).decode("utf-8")
            for n in z.namelist()
            if n.endswith(".txt") and "README" not in n
        }
    ids = sorted(text)
    model = SentenceTransformer(MODEL)
    vectors, chunks = [], 0
    for i, node in enumerate(ids, 1):
        parts = passages(text[node])
        chunks += len(parts)
        v = model.encode(parts, normalize_embeddings=True).mean(axis=0)
        vectors.append(v / np.linalg.norm(v))
        if i % 50 == 0 or i == len(ids):
            print(f"{i}/{len(ids)} pages embedded")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    np.save(OUT.with_suffix(".npy"), np.array(vectors, dtype=np.float32))
    OUT.with_suffix(".json").write_text(json.dumps({
        "model": MODEL,
        "passage_words": MAX_WORDS,
        "passages": chunks,
        "zip_sha256": hashlib.sha256(ZIP.read_bytes()).hexdigest(),
        "ids": ids,
    }, indent=1))
    print(f"{chunks:,} passages -> {len(ids)} vectors in {OUT.relative_to(ROOT)}.npy")


if __name__ == "__main__":
    main()
