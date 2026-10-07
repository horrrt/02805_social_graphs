"""Week 6, section 3 follow-up: why do pages lean toward women's pages once names are gone?

Owner: Gyula. A design review asked whether the lean is about women at all, or about pages
with long reception or relationship sections, which women's pages might have more of.
Two tests, both on TF-IDF with names removed (analysis/week06_lookalikes.py):

1. Ablation. Delete every section whose heading names reception, legacy, impact, accolades,
   critics or popularity, or relationships, romance, sexuality or family, and count again how
   many of all ten-nearest slots go to the 52 pages about women. The control deletes the same
   number of words from a page's other sections instead, at a random place, 20 times with
   seeds SEED + i: it keeps how much text goes and changes only which text.
2. Regression. How many lists a page sits in (its count among all 3,030 slots), against
   whether it is about a woman, its log length, its share of words in those two kinds of
   section, and its rate of she and her. Ordinary least squares with HC3 standard errors.

A heading is a line of at most six words with no sentence-ending mark; the plain-text pages
keep their section titles that way. Writes public/weeks/week06/data/lean.json.

    python analysis/week06_lean.py     # about three minutes
"""

import json
import math
import random
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import statsmodels.api as sm

sys.path.insert(0, str(Path(__file__).parent))
import week06_lookalikes as L  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
PAGE_OUT = ROOT / "public/weeks/week06/data/lean.json"
SEED = 6
RUNS = 20
HEADING = re.compile(r"^[^.!?]{1,60}$")
RECEPTION = re.compile(r"recept|legacy|impact|accolade|critic|popular|ranking|cultural", re.I)
RELATIONS = re.compile(r"relationship|romant|sexual|personal life|family", re.I)


def sections(text):
    """(heading, body) pairs in page order; the lead before the first heading is "Lead"."""
    out, head, buf = [], "Lead", []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if HEADING.match(line) and len(line.split()) <= 6:
            out.append((head, " ".join(buf)))
            head, buf = line, []
        else:
            buf.append(line)
    out.append((head, " ".join(buf)))
    return out


def kind(heading):
    return "reception" if RECEPTION.search(heading) else "relations" if RELATIONS.search(heading) else "other"


def no_names_matrix(c, names, texts):
    """TF-IDF with names removed, rebuilt on `texts` (document frequencies recounted)."""
    toks = [L.tokens(x) for x in texts]
    counts = [Counter(d) for d in toks]
    df = Counter(w for cc in counts for w in cc)
    col = {w: i for i, w in enumerate(sorted(df))}
    m = np.zeros((c.n, len(col)))
    for r, cc in enumerate(counts):
        for w, x in cc.items():
            if w not in names:
                m[r, col[w]] = x / len(toks[r]) * math.log(c.n / df[w])
    return m


def lean(c, labels, m):
    """Share of all ten-nearest slots that go to women's pages, and each page's count of slots."""
    _, top = L.neighbours(m)
    slots = Counter(int(j) for i in range(c.n) for j in top[i])
    women = np.flatnonzero(labels == "female")
    return sum(slots[int(i)] for i in women) / (c.n * L.K), np.array([slots.get(i, 0) for i in range(c.n)])


def main():
    c = L.Corpus()
    names = L.name_words(c.text)
    labels = L.gender_labels(c)
    parts = [sections(x) for x in c.text]
    words = [{k: sum(len(L.tokens(b)) for h, b in p if kind(h) == k) for k in ("reception", "relations", "other")}
             for p in parts]

    base, slots = lean(c, labels, no_names_matrix(c, names, c.text))
    cut = [" ".join(b for h, b in p if kind(h) == "other") for p in parts]
    ablated, _ = lean(c, labels, no_names_matrix(c, names, cut))

    control = []
    for i in range(RUNS):
        rng = random.Random(SEED + i)
        texts = []
        for p, w in zip(parts, words):
            other = [x for h, b in p if kind(h) == "other" for x in b.split()]
            k = w["reception"] + w["relations"]
            if k and len(other) > k:
                start = rng.randrange(len(other) - k + 1)
                other = other[:start] + other[start + k:]
            texts.append(" ".join(other + [b for h, b in p if kind(h) != "other"]))
        control.append(lean(c, labels, no_names_matrix(c, names, texts))[0])

    female = (labels == "female").astype(float)
    length = np.array([len(t) for t in c.toks])
    share = lambda k: np.array([w[k] / sum(w.values()) for w in words])  # noqa: E731
    sheher = np.array([(Counter(t)["she"] + Counter(t)["her"]) / len(t) for t in c.toks])
    x = sm.add_constant(np.column_stack([female, np.log(length), share("reception"), share("relations"), sheher]))
    fit = sm.OLS(slots, x).fit(cov_type="HC3")
    terms = ["const", "female", "log_length", "reception_share", "relations_share", "sheher_rate"]
    model = {name: {"coef": round(float(b), 2), "p": round(float(p), 3)} for name, b, p in zip(terms, fit.params, fit.pvalues)}

    women, men = labels == "female", labels == "male"
    out = {
        "runs": RUNS, "seeds": [SEED, SEED + RUNS - 1],
        "pages_with": {"reception": sum(w["reception"] > 0 for w in words), "relations": sum(w["relations"] > 0 for w in words)},
        "section_share": {g: {k: round(float(share(k)[mask].mean()), 3) for k in ("reception", "relations")}
                          for g, mask in (("female", women), ("male", men))},
        "median_words": {"female": int(np.median(length[women])), "male": int(np.median(length[men]))},
        "lean": {"names_removed": round(base, 3), "sections_removed": round(ablated, 3),
                 "control_mean": round(float(np.mean(control)), 3), "control_sd": round(float(np.std(control)), 3),
                 "control_min": round(min(control), 3), "control_max": round(max(control), 3)},
        "slots_mean": {"female": round(float(slots[women].mean()), 1), "male": round(float(slots[men].mean()), 1)},
        "model": {"n": c.n, "r2": round(float(fit.rsquared), 2), "terms": model,
                  "per_doubling": round(float(fit.params[2] * math.log(2)), 1)},
    }
    from check_pages import check

    check(PAGE_OUT, out)
    PAGE_OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
