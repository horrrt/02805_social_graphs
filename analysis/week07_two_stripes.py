"""Two Stripes: the rounds for the hidden Week 7 game at /play/week07/two-stripes/.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html, section 2
(walk through a corpus). The game lights one Marvel page on a 2D map of all 303 and rings four
candidate dots. Each candidate also shows its document vector as a row of signed bars. The
player taps the page they think is the target's nearest, then sees every candidate's cosine
similarity to the target and the target's true nearest page. Players who match whole vectors win;
players who tap the dot that touches the target lose on PCA maps. That rule is the brief's: nearest
neighbours are computed in the original embedding space, not read off the map.

The vectors are the brief's: all-MiniLM-L6-v2, each page cut into passages of at most 180 words
along sentence boundaries, every passage embedded with unit length, the page vector the mean of its
passage vectors, scaled back to unit length. Similarity is cosine in those 384 dimensions.

The maps are the brief's two drawings of the same vectors: PCA (two components) and t-SNE
(perplexity 30, PCA initialisation, seeded). Coordinates are rescaled to 0..1 for drawing only.

The bars are each page's vector minus the corpus mean, rotated onto the principal axes (the
rotation is PCA with every component kept), so bar 1 and bar 2 are exactly the PCA map's two
coordinates. The game draws the first STRIPES as signed bars at their real heights, all on one
scale (the tallest 2% clipped), and outlines the target's bars over each candidate's. Rotation
keeps lengths and angles of the centred vectors, so matching the bars' shape is comparing vectors.
Centring moves some neighbours (the centred nearest page is the raw nearest for about 70% of
pages), which is why every round is checked against raw cosine rather than assuming the two agree.
A first playtest with 48 cells in five shades failed: the eye counts matching colours, while cosine
weights the big values.

A round has a target and four candidates: its true nearest page by cosine, the two pages whose dots
sit closest to it on that map (the third closest when the true nearest is one of them), and one page
outside its ten nearest. A round enters the game only when the true nearest beats every other
candidate by at least MARGIN in cosine, and a bot reading only the shown bars picks it with its
bars at least STRIP_GAP closer (cosine of the shown bars) than the next candidate's.

The script prints how often three strategies pick the true nearest over every page (the dot nearest
on the map, the bar match, a random tap), and how often the map dot is right in the rounds kept.
t-SNE rounds are not filtered on the map dot: t-SNE keeps most local neighbourhoods, and the game
says so rather than dealing only the rounds where it fails. On the 303 pages, run on 21 October
2026: PCA map dot 4%, bar match 91%; t-SNE map dot 61%, bar match 64%; random 25%. Kept: 208 PCA
and 64 t-SNE rounds. It stops when the bar match fails to beat the map on PCA rounds by MIN_GAP,
or when fewer than MIN_ROUNDS rounds pass per map.

Writes public/play/week07/data/two_stripes.json. Caches the page vectors in
build/week07_minilm_pages.npy (gitignored); --fresh recomputes them.

    python analysis/week07_two_stripes.py           # about 2 minutes the first time, seconds after
"""

import base64
import json
import random
import re
import sys
from pathlib import Path

import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/week07/data/two_stripes.json"
CACHE = ROOT / "build/week07_minilm_pages.npy"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MAX_WORDS = 180  # the brief's passage rule
SEED = 7
K = 10  # a page's ten nearest pages, as in the course's atlas
STRIPES = 24  # bars shown per page: few enough to read by eye
MARGIN = 0.06  # the true nearest must beat the next candidate by this much cosine
STRIP_GAP = 0.15  # and its shown bars must beat the next candidate's by this much
MIN_ROUNDS = 60  # per map
MIN_GAP = 0.4  # bar match minus map dot, share of PCA pages won, before filtering


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


def page_vectors(texts, fresh):
    if CACHE.exists() and not fresh:
        v = np.load(CACHE)
        if v.shape == (len(texts), 384):
            return v
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(MODEL, device="cpu")
    chunks = [passages(x) for x in texts]
    flat = [c for cs in chunks for c in cs]
    print(f"encoding {len(flat):,} passages from {len(texts)} pages (max {model.max_seq_length} word pieces)")
    enc = model.encode(flat, normalize_embeddings=True, batch_size=64, show_progress_bar=True)
    out, i = [], 0
    for cs in chunks:
        m = enc[i:i + len(cs)].mean(axis=0)
        out.append(m / np.linalg.norm(m))
        i += len(cs)
    v = np.array(out, dtype=np.float32)
    CACHE.parent.mkdir(exist_ok=True)
    np.save(CACHE, v)
    return v


def scaled(xy):
    lo, hi = xy.min(axis=0), xy.max(axis=0)
    return (xy - lo) / (hi - lo)


def candidates(i, nearest, map_order, far, rng):
    """True nearest, the two map-nearest other pages, one page outside the ten nearest."""
    true = int(nearest[i, 0])
    near_dots = [int(j) for j in map_order[i] if j != i and j != true][:2]
    pick = rng.choice([j for j in far[i] if j not in near_dots])
    out = [true, *near_dots, int(pick)]
    rng.shuffle(out)
    return out


def main(fresh=False):
    text = t.pages()
    ids = sorted(text)
    n = len(ids)
    names = t.nodes().set_index("node_id").name
    v = page_vectors([text[i] for i in ids], fresh)

    cos = v @ v.T
    np.fill_diagonal(cos, -np.inf)
    nearest = np.argsort(-cos, axis=1, kind="stable")[:, :K]
    in_top = [set(nearest[i]) for i in range(n)]
    far = [[j for j in range(n) if j != i and j not in in_top[i]] for i in range(n)]

    rot = PCA(random_state=SEED).fit(v)
    strips = rot.transform(v)
    var = rot.explained_variance_ratio_
    maps = {
        "pca": strips[:, :2],
        "tsne": TSNE(n_components=2, perplexity=30, init="pca", learning_rate="auto",
                     random_state=SEED).fit_transform(v),
    }
    # One scale for every bar: the 98th percentile of their sizes, the few taller ones clipped. The
    # bot below reads these clipped bars, so the round filter checks exactly what the player sees.
    scale = float(np.quantile(np.abs(strips[:, :STRIPES]), 0.98))
    shown = np.round(np.clip(strips[:, :STRIPES] / scale, -1, 1) * 127).astype(np.int8)

    rng = random.Random(SEED)
    rounds, report = [], {}
    for key, xy in maps.items():
        d2 = ((xy[:, None, :] - xy[None, :, :]) ** 2).sum(-1)
        np.fill_diagonal(d2, np.inf)
        order = np.argsort(d2, axis=1, kind="stable")
        hit = {"map": [], "strip": [], "random": []}
        kept, kept_map = 0, 0
        for i in range(n):
            cands = candidates(i, nearest, order, far, rng)
            true = int(nearest[i, 0])
            by_map = min(cands, key=lambda j: d2[i, j])
            sh = shown.astype(float)
            s = sh[cands] @ sh[i] / (np.linalg.norm(sh[cands], axis=1) * np.linalg.norm(sh[i]))
            by_strip = cands[int(np.argmax(s))]
            hit["map"].append(by_map == true)
            hit["strip"].append(by_strip == true)
            hit["random"].append(0.25)
            others = sorted((cos[i, j] for j in cands if j != true), reverse=True)
            gap = np.diff(np.sort(s))[-1]
            if cos[i, true] - others[0] >= MARGIN and by_strip == true and gap >= STRIP_GAP:
                kept += 1
                kept_map += by_map == true
                rounds.append({"map": key, "target": i, "candidates": cands,
                               "cos": [round(float(cos[i, j]), 3) for j in cands],
                               "rank": [int(list(np.argsort(-cos[i], kind="stable")).index(j)) + 1 for j in cands]})
        rate = {k: round(float(np.mean(x)), 3) for k, x in hit.items()}
        dot_is_nearest = float(np.mean([order[i, 0] == nearest[i, 0] for i in range(n)]))
        report[key] = {"all_rounds": rate, "kept": kept, "kept_map": round(kept_map / kept, 3),
                       "dot_is_nearest": round(dot_is_nearest, 3)}
        print(f"{key}: map dot {rate['map']:.0%}, bar match {rate['strip']:.0%}, random 25% over {n} rounds; "
              f"{kept} kept, where the map dot is right {kept_map / kept:.0%}; "
              f"the dot touching a page is its nearest page for {dot_is_nearest:.0%} of pages")

    if report["pca"]["all_rounds"]["strip"] - report["pca"]["all_rounds"]["map"] < MIN_GAP:
        raise SystemExit("the bar match does not beat the map clearly on PCA rounds")
    for key in maps:
        if report[key]["kept"] < MIN_ROUNDS:
            raise SystemExit(f"only {report[key]['kept']} {key} rounds pass (need {MIN_ROUNDS})")

    out = {
        "source": f"Marvel Wikipedia pages (course marvel_pages.zip), {n} pages; {MODEL}, passages of at most "
                  f"{MAX_WORDS} words averaged per page; cosine in 384 dimensions",
        "model": MODEL,
        "dims": int(v.shape[1]),
        "stripes": STRIPES,
        "variance": {"two_axes": round(float(var[:2].sum()), 3),
                     "shown": round(float(var[:STRIPES].sum()), 3),
                     "per_axis": [round(float(x), 4) for x in var[:STRIPES]]},
        "pages": [{"name": str(names[i]), "near": [int(j) for j in nearest[k]],
                   "nearCos": [round(float(cos[k, j]), 3) for j in nearest[k]]}
                  for k, i in enumerate(ids)],
        "maps": {key: [[round(float(a), 4), round(float(b), 4)] for a, b in scaled(xy)] for key, xy in maps.items()},
        "strips": base64.b64encode(shown.tobytes()).decode(),
        "solver": report,
        "rounds": rounds,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(rounds)} rounds, two axes hold {var[:2].sum():.1%} of the variance, "
          f"{STRIPES} bars hold {var[:STRIPES].sum():.1%}")


if __name__ == "__main__":
    main(fresh="--fresh" in sys.argv)
