"""Cold Read, round 1 (Clue Shop): the clue decks for the hidden Week 6 game at /play/cold-read/.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html, section 1
(TF-IDF and cosine). The game hides one Marvel page and deals eight face-down word cards from it.
Each card shows only how often its word appears on the page and on how many of the 303 pages it
appears. Flipping a card reveals the word and re-ranks the pages by cosine similarity between the
flipped words and each page's TF-IDF vector. Players who flip cards that are frequent here and rare
elsewhere win; that rule is TF-IDF.

TF-IDF is the brief's definition and the one week06_lookalikes.py checks against the course:
count / page length, times ln(N / df), with the course's token rule. Names follow the brief's rule
(a word capitalised in more than half of its uses).

Each deck holds three kinds of card, chosen per page:
  loud  3 cards: the page's most frequent words among those on at least half the pages, with at
        most one on every page (the on 303 of 303, then words like his or marvel)
  mid   2 cards: the highest TF-IDF words on 30 to 150 pages
  sharp 3 cards: the highest TF-IDF words on at most 12 pages
"Names hidden" builds a second deck with every name word left out.

A page enters the game only when its three sharp cards alone rank it first, all eight cards do too,
and its loud cards alone do not, in both decks. The script prints how often that holds and stops if fewer than 60 pages pass.

Writes public/play/cold-read/data/clue_shop.json.

    python analysis/week06_cold_read.py   # about 2 seconds
"""

import json
import math
import sys
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
from week06_lookalikes import name_words, tokens  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/cold-read/data/clue_shop.json"
MIN_TOKENS = 1200  # shorter pages have too few distinct words to deal a full deck
LOUD_DF, MID_DF, SHARP_DF = 0.5, (30, 150), 12
MIN_PAGES = 60


def main():
    text = t.pages()
    ids = sorted(text)
    n = len(ids)
    names = t.nodes().set_index("node_id").name
    toks = [tokens(text[i]) for i in ids]
    counts = [Counter(d) for d in toks]
    df = Counter(w for c in counts for w in c)
    is_name = name_words(text[i] for i in ids)

    def tfidf(w, p):
        return counts[p][w] / len(toks[p]) * math.log(n / df[w])

    # Each page's TF-IDF vector length, so a posting's weight is that page's unit-vector entry and
    # a query's score is its cosine with the page, up to the query's own length, which every page shares.
    norm = [math.sqrt(sum(tfidf(w, p) ** 2 for w in counts[p])) for p in range(n)]
    pages_with = {}
    for p, c in enumerate(counts):
        for w in c:
            pages_with.setdefault(w, []).append(p)

    def rank_first(words, p):
        # The game's ranking: the flipped words as a query weighted by IDF, cosine with each page.
        score = np.zeros(n)
        for w in words:
            for q in pages_with[w]:
                score[q] += math.log(n / df[w]) * tfidf(w, q) / norm[q]
        return score.max() > 0 and int(score.argmax()) == p and (score == score[p]).sum() == 1

    def deck(p, hide_names):
        c = counts[p]
        pool = [w for w in c if not (hide_names and w in is_name)]
        by_tfidf = sorted(pool, key=lambda w: -tfidf(w, p))
        common = sorted((w for w in pool if df[w] >= LOUD_DF * n), key=lambda w: -c[w])
        loud = [w for w in common if df[w] == n][:1] + [w for w in common if df[w] < n][:2]
        mid = [w for w in by_tfidf if MID_DF[0] <= df[w] <= MID_DF[1] and c[w] >= 2][:2]
        sharp = [w for w in by_tfidf if df[w] <= SHARP_DF and c[w] >= 2][:3]
        if len(loud) < 3 or len(mid) < 2 or len(sharp) < 3:
            return None
        if not rank_first(sharp, p) or not rank_first(loud + mid + sharp, p) or rank_first(loud, p):
            return None
        return {"loud": loud, "mid": mid, "sharp": sharp}

    rounds, used = [], set()
    tried = [p for p in range(n) if len(toks[p]) >= MIN_TOKENS]
    for p in tried:
        on, off = deck(p, False), deck(p, True)
        if on and off:
            rounds.append({"page": p, "on": on, "off": off})
            for d in (on, off):
                for ws in d.values():
                    used.update(ws)
    print(f"{len(rounds)} of {len(tried)} pages with at least {MIN_TOKENS} tokens are winnable on rare cards and on the full deck "
          f"and not on common ones, with names and without")
    if len(rounds) < MIN_PAGES:
        raise SystemExit(f"fewer than {MIN_PAGES} playable pages")

    words = {}
    for w in sorted(used):
        post = [[q, round(tfidf(w, q) / norm[q], 5)] for q in pages_with[w]]
        # A word on every page has idf 0 and no postings; every other word keeps one per page.
        words[w] = {"df": df[w], "name": int(w in is_name), "post": post if df[w] < n else []}

    def cards(d, p):
        return [{"w": w, "kind": kind, "n": counts[p][w]} for kind, ws in d.items() for w in ws]

    out = {
        "source": "Marvel Wikipedia pages (course marvel_pages.zip), 303 pages; TF-IDF = count/length x ln(N/df)",
        "N": n,
        "pages": [{"name": names[i], "tokens": len(toks[p])} for p, i in enumerate(ids)],
        "rounds": [{"page": r["page"], "on": cards(r["on"], r["page"]), "off": cards(r["off"], r["page"])} for r in rounds],
        "words": words,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB, {len(words)} words)")


if __name__ == "__main__":
    main()
