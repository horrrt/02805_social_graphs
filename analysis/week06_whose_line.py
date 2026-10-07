"""Cold Read, round 2 (Whose Line): word rates in two Marvel communities, for the hidden Week 6 game.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html, section 2 and
exercise 6.3 (compare two corpora with Scattertext). The game puts two of the network's communities
against each other. A word appears; the player says which community's pages use it more, whether
both use it alike, or whether one page alone makes it look distinctive. Then the word lands on a
Scattertext-style plot: uses per 10,000 words in one community against the other, both axes log.

Communities are the eight largest groups of the Week 5 consensus partition
(public/weeks/week05/data/communities.json, analysis/week05_communities.py), each named by its
best-connected page. Text and tokens follow the course (week06_lookalikes.py). Names (the brief's
capitalisation rule) and NLTK stopwords are left out, so the game is about vocabulary.

For each pair of communities A and B, with r = uses per 10,000 words and a pseudocount of 0.5 uses:
  lean    log2(r_A / r_B) >= 1.5 (about 2.8 times) or <= -1.5
  shared  |log2(r_A / r_B)| <= 0.4
  fluke   leans, but one page holds at least 60% of the leaning group's uses
Every candidate is used at least 12 times in the two groups together. Each pair keeps up to 10 words
per class, chosen by frequency, and the 300 most used words as the plot's background cloud.

Writes public/play/cold-read/data/whose_line.json.

    NLTK_DATA=build/nltk_data python analysis/week06_whose_line.py   # about 5 seconds
"""

import json
import math
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
from week06_lookalikes import name_words, stopwords, tokens  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
COMMUNITIES = ROOT / "public/weeks/week05/data/communities.json"
OUT = ROOT / "public/play/cold-read/data/whose_line.json"
GROUPS, LEAN, SHARED, FLUKE, MIN_USES, PER_CLASS, CLOUD = 8, 1.5, 0.4, 0.6, 12, 10, 300


def main():
    comm = json.loads(COMMUNITIES.read_text())
    groups = [c for c in comm["communities"] if c["where"] == "giant"][:GROUPS]
    text = t.pages()
    names = t.nodes().set_index("node_id").name
    skip = name_words(text.values()) | stopwords()
    counts = {p: Counter(w for w in tokens(text[p]) if w not in skip) for p in text}
    sizes = {p: len(tokens(text[p])) for p in text}

    stats = []
    for c in groups:
        total = Counter()
        for p in c["members"]:
            total.update(counts[p])
        stats.append({"uses": total, "tokens": sum(sizes[p] for p in c["members"]), "members": c["members"]})

    def spread(w, g):
        per = sorted(((counts[p][w], p) for p in stats[g]["members"] if counts[p][w]), reverse=True)
        return per

    pairs = []
    for a, b in combinations(range(len(groups)), 2):
        A, B = stats[a], stats[b]
        rate = lambda s, w: (s["uses"][w] + 0.5) / s["tokens"] * 1e4  # noqa: E731
        vocab = [w for w in set(A["uses"]) | set(B["uses"]) if A["uses"][w] + B["uses"][w] >= MIN_USES]
        vocab.sort(key=lambda w: (-(A["uses"][w] + B["uses"][w]), w))  # ties by word, so every run picks the same
        classes = {"a": [], "b": [], "both": [], "fluke": []}
        for w in vocab:
            lr = math.log2(rate(A, w) / rate(B, w))
            if abs(lr) <= SHARED:
                kind = "both"
            elif abs(lr) >= LEAN:
                g = a if lr > 0 else b
                per = spread(w, g)
                share = per[0][0] / sum(n for n, _ in per)
                kind = "fluke" if share >= FLUKE and len(per) >= 1 and sum(n for n, _ in per) >= MIN_USES * 0.75 else ("a" if lr > 0 else "b")
            else:
                continue
            if len(classes[kind]) < PER_CLASS:
                classes[kind].append(w)
        if min(len(v) for v in classes.values()) < 2:
            continue

        def term(w):
            lean = a if math.log2(rate(A, w) / rate(B, w)) > 0 else b
            per = spread(w, lean)
            return {"w": w, "x": round(rate(A, w), 3), "y": round(rate(B, w), 3), "ua": A["uses"][w], "ub": B["uses"][w],
                    "pa": sum(1 for p in A["members"] if counts[p][w]), "pb": sum(1 for p in B["members"] if counts[p][w]),
                    "top": names[per[0][1]], "share": round(per[0][0] / sum(n for n, _ in per), 3)}

        pairs.append({
            "a": a, "b": b,
            "cards": {k: [term(w) for w in v] for k, v in classes.items()},
            "cloud": [[round(rate(A, w), 2), round(rate(B, w), 2)] for w in vocab[:CLOUD]],
        })

    out = {
        "source": "Week 5 consensus communities; 303 Marvel pages (course snapshot); rates per 10,000 words, names and stopwords removed",
        "groups": [{"label": c["label"], "size": c["size"], "tokens": s["tokens"],
                    "hubs": [{"name": h["name"]} for h in c["hubs"][:3]]} for c, s in zip(groups, stats)],
        "pairs": pairs,
    }
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    flukes = sum(len(p["cards"]["fluke"]) for p in pairs)
    print(f"{len(pairs)} of {len(groups) * (len(groups) - 1) // 2} community pairs playable, {flukes} fluke cards; "
          f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")
    p = pairs[0]
    for k, v in p["cards"].items():
        print(f"  {groups[p['a']]['label']} vs {groups[p['b']]['label']} {k}: " + ", ".join(
            f"{c['w']} ({c['x']:.1f}/{c['y']:.1f}{', ' + c['top'] + ' ' + str(int(c['share'] * 100)) + '%' if k == 'fluke' else ''})" for c in v[:5]))


if __name__ == "__main__":
    main()
