"""The course's own Marvel numbers, recomputed by our pipeline before we build on it.

The weekly briefs quote figures for the shared snapshot. If our loaders and
our nulls are the course's, we get the same figures at the precision the
brief prints them; if we do not, every later number inherits the difference.

- Network (briefs 1 to 3): read from analysis/week01_facts.json. Any miss
  exits non-zero.
- Random network (brief 2): the course draws G(n, p) with p = 0.031; our
  week 2 null draws G(n, m) with the same n and m, 1,000 times
  (analysis/week02_nullmodels_facts.json). The biggest hub's degree is its
  share of link ends times 2m. A miss exits non-zero.
- Text (brief 5): the brief quotes tokens, types and the share of types used
  once without naming a tokenizer. We report our word rule
  (week05_text.WORD_RULE) and spaCy's tokenizer with punctuation and spaces
  dropped, and record the gap rather than tune either rule to close it.

Briefs reviewed 6 October 2026 at
https://sunelehmann.com/socialgraphs2026-web/weeks/week{1,2,3,5}.html. They
change; reread them before trusting this file.

    python analysis/course_reference.py      # about a minute, most of it spaCy
"""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
BRIEF = "https://sunelehmann.com/socialgraphs2026-web/weeks/week{}.html"
REVIEWED = "2026-10-06"


def network_checks():
    f = json.loads((ROOT / "analysis/week01_facts.json").read_text())
    nulls = json.loads((ROOT / "analysis/week02_nullmodels_facts.json").read_text())
    er = {q["key"]: q["er"] for q in nulls["quantities"]}
    two_m = 2 * f["n_undirected"]
    betsy = max(f["top_out"], key=lambda r: r["kout"])
    # (brief week, what, the brief's value, ours, decimals the brief prints)
    return [
        (1, "nodes", 303, f["n_nodes"], 0),
        (1, "directed links", 1784, f["n_arcs"], 0),
        (1, "undirected pairs", 1434, f["n_undirected"], 0),
        (1, "pairs linked both ways", 350, f["mutual_pairs"], 0),
        (1, "average undirected degree", 9.5, f["mean_degree"], 1),
        (1, "isolates", 17, f["n_isolates"], 0),
        (1, "characters on the one island", 9, f["n_island_members"], 0),
        (1, "highest in-degree (Spider-Man)", 106, f["max_in"], 0),
        (1, f"highest out-degree ({betsy['name']})", 28, f["max_out"], 0),
        (3, "average distance in the giant component", 2.67, f["giant_avg_path"], 2),
        (3, "diameter of the giant component", 6, f["giant_diameter"], 0),
        (3, "largest strongly connected component", 229, f["largest_scc"], 0),
        (2, "random network: biggest hub's degree, mean", 19, er["hub_share"]["mean"] * two_m, 0),
        (2, "random network: average distance, mean", 2.8, er["avg_path_giant"]["mean"], 1),
    ]


def counts(tokens):
    c = Counter(tokens)
    return {"tokens": sum(c.values()), "types": len(c),
            "hapax_share": round(sum(v == 1 for v in c.values()) / len(c), 3)}


def text_checks():
    sys.path.insert(0, str(Path(__file__).parent))
    import spacy
    import week05_text as t

    texts = [text for _, text in sorted(t.pages().items())]
    words = [w for text in texts for w in t.words(text)]
    # Words our rule keeps whole and spaCy splits: Spider-Man, o'clock.
    ours = {**counts(words), "kept_whole": sum(any(c in w for c in "-'’") for w in words)}
    nlp = spacy.blank("en")
    nlp.max_length = 10 ** 7
    spacy_rule = counts([w.lower_ for d in nlp.pipe(texts) for w in d if not (w.is_space or w.is_punct)])
    return {"brief": BRIEF.format(5), "course": {"tokens": 727000, "types": 27000, "hapax_share": 0.36},
            "ours": {"rule": t.WORD_RULE, **ours},
            "spacy": {"rule": "spaCy's English tokenizer, lowercased, punctuation and spaces dropped", **spacy_rule}}


def main():
    rows, misses = [], []
    for week, what, course, ours, digits in network_checks():
        match = round(ours, digits) == course
        rows.append({"brief": BRIEF.format(week), "what": what, "course": course,
                     "ours": round(ours, 4), "digits": digits, "match": match})
        if not match:
            misses.append(f"{what}: course {course}, ours {ours}")
    out = {"reviewed": REVIEWED, "network": rows, "text": text_checks()}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    for r in rows:
        print(f"{'ok  ' if r['match'] else 'MISS'} {r['what']}: course {r['course']}, ours {r['ours']}")
    print(json.dumps(out["text"], indent=1))
    if misses:
        raise SystemExit("our pipeline does not reproduce the course's numbers: " + "; ".join(misses))
    return 0


if __name__ == "__main__":
    sys.exit(main())
