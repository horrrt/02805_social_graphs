"""Cold Read, round 4 (Tezgüino): word-context rows from the Marvel pages, for the hidden Week 6 game.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html, sections 4 and 5
(the tezgüino example, word-context matrices, PMI and PPMI). The game hides a word and shows only its
row of the word-context matrix: the words that appear within k tokens of it. The player can widen the
window, switch the weights from raw counts to PPMI, or peek at a real sentence with the word blacked
out, each for points, then picks the hidden word from four.

Tokens follow the course's rule (week06_lookalikes.py) and windows stay inside a sentence. For each
window k from 1 to 4, every token adds its neighbours within k on either side to its row. PMI is
log2(P(w, c) / (P(w) P(c))) with all three probabilities from that matrix, as the brief defines it;
PPMI keeps the positive part. PMI favours rare contexts, so a context word must occur at least 10 times
in the corpus and twice next to the hidden word to be listed.

Hidden words: round 5's hidden words (week06_hot_cold.py: Marvel's own vocabulary, not names, not
inflected forms) that are used at least 25 times on at least 8 pages. Each keeps its 10 strongest contexts per window and weighting, and
3 short sentences (8 to 28 tokens) that use it, from different pages.

Writes public/play/cold-read/data/tezguino.json.

    python analysis/week06_tezguino.py   # about 30 seconds (after week06_hot_cold.py)
"""

import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402
from week06_lookalikes import TOKEN  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/cold-read/data/tezguino.json"
WINDOWS = (1, 2, 3, 4)
MIN_USES, MIN_PAGES, TOP, MIN_CONTEXT, MIN_PAIR = 25, 8, 10, 10, 2
SENTENCES, SENT_LEN = 3, (8, 28)
MIN_TARGETS = 100
HOT_COLD = ROOT / "public/play/cold-read/data/hot_cold.json"


def main():
    text = t.pages()
    # Sentences as lists of (surface form, lower-case token).
    sentences = []
    for page in sorted(text):
        for s in re.split(r"(?<=[.!?])\s+", text[page]):
            toks = TOKEN.findall(s)
            if toks:
                sentences.append((page, s.strip(), [w.lower() for w in toks]))

    uses = Counter(w for _, _, toks in sentences for w in toks)
    df = Counter(w for page in text for w in set(TOKEN.findall(text[page].lower())))
    hot = json.loads(HOT_COLD.read_text())
    marvel = {hot["vocab"][i] for i in hot["targets"]}
    targets = sorted(w for w in marvel if uses[w] >= MIN_USES and df[w] >= MIN_PAGES)
    target_set = set(targets)

    rows = {}
    for k in WINDOWS:
        rowsum = Counter()
        pair = defaultdict(Counter)
        for _, _, toks in sentences:
            for i, w in enumerate(toks):
                ctx = toks[max(0, i - k):i] + toks[i + 1:i + 1 + k]
                rowsum[w] += len(ctx)
                if w in target_set:
                    pair[w].update(ctx)
        total = sum(rowsum.values())
        for w in targets:
            counts = [(c, n) for c, n in pair[w].most_common() if c != w]
            pmi = []
            for c, n in counts:
                if n < MIN_PAIR or uses[c] < MIN_CONTEXT:
                    continue
                v = round(math.log2((n / total) / ((rowsum[w] / total) * (rowsum[c] / total))), 2)
                if v > 0:  # after rounding, so no listed context shows as 0.00
                    pmi.append((c, v))
            pmi.sort(key=lambda x: -x[1])
            rows.setdefault(w, {"counts": {}, "ppmi": {}})
            rows[w]["counts"][k] = [[c, n] for c, n in counts[:TOP]]
            rows[w]["ppmi"][k] = [[c, v] for c, v in pmi[:TOP]]

    out_targets = []
    for w in targets:
        if any(len(rows[w]["ppmi"][k]) < 5 for k in WINDOWS):
            continue
        picked, pages = [], set()
        for page, s, toks in sentences:
            if w in toks and page not in pages and SENT_LEN[0] <= len(toks) <= SENT_LEN[1]:
                masked = re.sub(rf"(?i)\b{re.escape(w)}\b", "■", s)
                if "■" in masked:
                    picked.append(masked)
                    pages.add(page)
            if len(picked) == SENTENCES:
                break
        if len(picked) < SENTENCES:
            continue
        out_targets.append({"w": w, "uses": uses[w], "df": df[w], "rows": rows[w], "sentences": picked})

    print(f"{len(out_targets)} of {len(targets)} candidate words are playable")
    if len(out_targets) < MIN_TARGETS:
        raise SystemExit(f"fewer than {MIN_TARGETS} playable words")
    for x in out_targets[:: max(1, len(out_targets) // 5)]:
        print(f"  {x['w']}: counts k=2 " + ", ".join(c for c, _ in x["rows"]["counts"][2][:6])
              + " | ppmi k=2 " + ", ".join(c for c, _ in x["rows"]["ppmi"][2][:6]))
    OUT.write_text(json.dumps({"source": "303 Marvel pages (course snapshot), course token rule, windows inside sentences",
                               "windows": list(WINDOWS), "words": out_targets}, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
