"""Week 5 · Heaps' law of the Marvel universe.

Question: Do minor characters bring new words, or repeat the famous ones?

Owner: Niklas

Page section: src/app/(week05)/weeks/week05/page.tsx#heaps
Output: public/weeks/week05/data/heaps.json, every number the section quotes.

Method
- Words: words() from week05_text under WORD_RULE, the rule sections 5 to 7
  share. A token is one occurrence of a word, a type one distinct word.
- Read the pages one after another and count, after every token, how many
  types have appeared so far. Three orders: most-linked first (in-degree in
  graph(), highest first), least-linked first (lowest first), both with ties
  broken by node id, and RUNS random orders (random.Random(SEED + i) over the
  sorted node ids) as the baseline.
- Compare the orders at equal numbers of TOKENS, never at equal numbers of
  pages: the ten most-linked pages are far longer than the ten least-linked,
  so a page count mostly measures page length. Every curve is read off on one
  log-spaced grid of token counts, and at CHECKPOINTS.
- The gap of an ordered curve to random is in standard deviations of the
  random orders (z). Every order ends on the same vocabulary by construction,
  so the random spread shrinks to zero at the end and z grows there; the
  checkpoints stay well short of the end and the gap in types is kept too.
  Each checkpoint also records how many pages each order has begun. So the
  checkpoints are not picked by hand, the JSON also gives, per order, the
  longest run of grid points with z beyond SPAN_Z in its direction.
- A second baseline keeps page length: LENGTH_RUNS times, in-degree is
  shuffled among the pages of each length fifth (LENGTH_BINS bins by words,
  seed LENGTH_SEED + i) and the pages are read in that shuffled link order.
  Long pages still come early in most-linked order, so a gap that survives
  this baseline is not page length.
- Heaps' law V = K n^beta: least squares of log V on log n over the grid
  points from FIT_FROM tokens to the end, on the random-order mean, and on
  each random order for the spread of beta. The slope on the lower and upper
  halves of that range (split at their geometric middle) says whether the
  curve flattens on log-log axes. No beta per ordered curve: it moves with
  the choice of grid points.
- The late pages: the last LATE pages in most-linked order and the types they
  add that no earlier page used. A type counts as a likely name when every
  occurrence in the corpus starts with a capital letter; a rough proxy, since
  a common word seen only at the start of sentences counts too (the JSON
  counts those). Baseline: the same share among the types the last LATE pages
  of each random order add.
- What we checked: for each late page its new types, one sentence (sentences()
  helper) holding a new name and one holding a new other word, with the word
  marked. The script asserts each quote is a substring of the page.

Read the corpus and the network only through week05_text.

    python analysis/week05_heaps.py
"""

import json
import random
import sys
from collections import Counter
from pathlib import Path

import numpy as np

from check_pages import check
from week05_text import WORD, WORD_RULE, graph, pages, sentences, words

PAGE_OUT = Path(__file__).resolve().parents[1] / "public/weeks/week05/data/heaps.json"
SEED = 505
RUNS = 500
GRID_POINTS = 41
GRID_FROM = 1_000
FIT_FROM = 10_000
CHECKPOINTS = [100_000, 400_000]
FIRST = 10
LATE = 100
SAMPLE = 12
TAIL = 0.9
MAX_WORDS = 40
SPAN_Z = 1.5
LENGTH_BINS = 5
LENGTH_RUNS = 500
LENGTH_SEED = 5050


def raw_words(text):
    """words(text) with each word's surface form and position: (word, surface, start).
    words() matches on the lowercased text, and lowercasing can lengthen a letter
    ("İ" becomes "i" and a combining dot), so match the same way and map back."""
    lowered, where = [], []
    for i, ch in enumerate(text):
        low = ch.lower()
        lowered.append(low)
        where.extend([i] * len(low))
    where.append(len(text))
    out = []
    for m in WORD.finditer("".join(lowered)):
        w = m.group()
        for tail in ("'s", "’s"):
            if w.endswith(tail) and len(w) > len(tail):
                w = w[: -len(tail)]
        start, end = where[m.start()], where[m.end() - 1] + 1
        out.append((w, text[start:end], start))
    return out


def initial(text, start):
    """True when a word starting at `start` opens a line or follows . ! or ?"""
    before = text[:start].rstrip(" \t\"'“‘([")
    return not before or before[-1] in "\n.!?:"


def first_seen(order, ids):
    """Positions (sorted) at which each type first appears, and the types in that order."""
    seq = np.concatenate([ids[n] for n in order])
    types, first = np.unique(seq, return_index=True)
    rank = np.argsort(first, kind="stable")
    return first[rank], types[rank]


def fit(n, v):
    """Least squares of log v on log n: (K, beta)."""
    beta, log_k = np.polyfit(np.log(n), np.log(v), 1)
    return float(np.exp(log_k)), float(beta)


def main():
    text = pages()
    network = graph()
    nodes = sorted(text)
    tokens = {n: words(text[n]) for n in nodes}

    # Surface forms: which types only ever occur capitalised, and which of those
    # only at the start of a sentence or a line.
    lower_seen, mid_seen = set(), set()
    for n in nodes:
        found = raw_words(text[n])
        assert [w for w, _, _ in found] == tokens[n], n
        for w, surface, start in found:
            if not surface[0].isupper():
                lower_seen.add(w)
            elif not initial(text[n], start):
                mid_seen.add(w)

    vocab = sorted({w for n in nodes for w in tokens[n]})
    index = {w: i for i, w in enumerate(vocab)}
    ids = {n: np.array([index[w] for w in tokens[n]], dtype=np.int64) for n in nodes}
    is_name = np.array([w not in lower_seen for w in vocab])
    total = int(sum(len(a) for a in ids.values()))

    grid = np.unique(np.round(np.logspace(np.log10(GRID_FROM), np.log10(total), GRID_POINTS)).astype(np.int64))
    tail_from = int(round(TAIL * total))
    points = np.array(sorted({*grid.tolist(), *CHECKPOINTS, tail_from}), dtype=np.int64)

    def types_at(first):
        return np.searchsorted(first, points, side="left")

    most = sorted(nodes, key=lambda n: (-network.in_degree(n), n))
    least = sorted(nodes, key=lambda n: (network.in_degree(n), n))
    curve_most = types_at(first_seen(most, ids)[0])
    curve_least = types_at(first_seen(least, ids)[0])

    # The random orders, and in each the types its last LATE pages add.
    runs, late_new, late_names, late_rate = [], [], [], []
    for i in range(RUNS):
        order = list(nodes)
        random.Random(SEED + i).shuffle(order)
        first, types = first_seen(order, ids)
        runs.append(types_at(first))
        late_tokens = sum(len(ids[n]) for n in order[-LATE:])
        new = types[first >= total - late_tokens]
        late_new.append(len(new))
        late_names.append(float(is_name[new].mean()))
        late_rate.append(1000 * len(new) / late_tokens)
    runs = np.array(runs)
    mean, sd = runs.mean(axis=0), runs.std(axis=0, ddof=1)

    # The length-matched baseline: in-degree shuffled within each length fifth.
    length = np.array([len(ids[n]) for n in nodes])
    edges = np.quantile(length, np.linspace(0, 1, LENGTH_BINS + 1)[1:-1])
    fifth = np.searchsorted(edges, length, side="right")
    indeg = np.array([network.in_degree(n) for n in nodes])
    pos = {n: j for j, n in enumerate(nodes)}
    held_most, held_least = [], []
    for i in range(LENGTH_RUNS):
        rng = random.Random(LENGTH_SEED + i)
        fake = indeg.copy()
        for b in range(LENGTH_BINS):
            where = [j for j in range(len(nodes)) if fifth[j] == b]
            values = [int(indeg[j]) for j in where]
            rng.shuffle(values)
            fake[where] = values
        held_most.append(types_at(first_seen(sorted(nodes, key=lambda n: (-fake[pos[n]], n)), ids)[0]))
        held_least.append(types_at(first_seen(sorted(nodes, key=lambda n: (fake[pos[n]], n)), ids)[0]))
    held_most, held_least = np.array(held_most), np.array(held_least)
    p5, p95 = np.percentile(runs, [5, 95], axis=0)
    at = {int(p): k for k, p in enumerate(points)}

    def z(curve, k):
        return float((curve[k] - mean[k]) / sd[k]) if sd[k] > 0 else None

    # Heaps' law on the random-order mean, and on every random order.
    on_grid = [at[int(p)] for p in grid]
    fit_idx = [k for k in on_grid if points[k] >= FIT_FROM]
    fit_n = points[fit_idx]
    k_mean, beta_mean = fit(fit_n, mean[fit_idx])
    betas = np.array([fit(fit_n, r[fit_idx])[1] for r in runs])
    middle = float(np.sqrt(fit_n[0] * fit_n[-1]))
    lower = [k for k in fit_idx if points[k] <= middle]
    upper = [k for k in fit_idx if points[k] >= middle]
    beta_lower = fit(points[lower], mean[lower])[1]
    beta_upper = fit(points[upper], mean[upper])[1]
    k_end, k_tail = at[total], at[tail_from]
    tail_rate = 1000 * float(mean[k_end] - mean[k_tail]) / (total - tail_from)

    # The late pages in most-linked order: the types they add, split into
    # likely names and other words, with a sentence for one of each.
    seen = set()
    for n in most[:-LATE]:
        seen.update(tokens[n])
    late_pages = most[-LATE:]
    added = Counter()
    page_new = {}
    for n in late_pages:
        fresh = [w for w in tokens[n] if w not in seen]
        page_new[n] = Counter(fresh)
        added.update(fresh)
        seen.update(tokens[n])
    new_types = sorted(added)
    names = [w for w in new_types if w not in lower_seen]
    others = [w for w in new_types if w in lower_seen]
    initial_only = [w for w in names if w not in mid_seen]
    late_tokens = sum(len(tokens[n]) for n in late_pages)

    def sample(ws):
        return sorted(ws, key=lambda w: (-added[w], w))[:SAMPLE]

    def pick(kind, skip=()):
        """The late page (not in skip) with most new types of this kind, and its
        first sentence of 8 to MAX_WORDS words that holds one of them, other than
        a word of the page's own title, exactly once."""
        want = (lambda w: w not in lower_seen) if kind == "name" else (lambda w: w in lower_seen)
        ranked = sorted((n for n in late_pages if n not in skip),
                        key=lambda n: (-sum(1 for w in page_new[n] if want(w)), n))
        for n in ranked:
            title = set(words(n.replace("_", " ")))
            fresh = sorted((w for w in page_new[n] if want(w) and w not in title), key=lambda w: (-page_new[n][w], w))
            for s in sentences(text[n]):
                if s[-1] not in ".!?" or not 8 <= len(words(s)) <= MAX_WORDS:
                    continue
                for w in fresh:
                    hits = [surface for word, surface, _ in raw_words(s) if word == w]
                    if hits and s.lower().count(hits[0].lower()) == 1:
                        assert s in text[n], (n, s)
                        return {"page": n, "kind": kind, "word": w, "surface": hits[0], "sentence": s,
                                "page_new_types": len(page_new[n]), "in_degree": network.in_degree(n)}
        raise SystemExit(f"no sentence for a new {kind}")

    named = pick("name")
    other = pick("other", skip={named["page"]})

    def reading(order, n):
        """Pages begun after n tokens, and the in-degree of the last one."""
        ends = np.cumsum([len(ids[m]) for m in order])
        begun = min(int(np.searchsorted(ends, n, side="left")) + 1, len(order))
        return begun, network.in_degree(order[begun - 1])

    def held(curve, runs_, k):
        m, v = float(runs_[:, k].mean()), float(runs_[:, k].std(ddof=1))
        return m, v, (float((curve[k] - m) / v) if v > 0 else None)

    def checkpoint(k):
        row = cut(k)
        for key, curve, runs_ in (("most_linked", curve_most, held_most), ("least_linked", curve_least, held_least)):
            m, v, zz = held(curve, runs_, k)
            row[f"length_held_mean_{key}"], row[f"length_held_sd_{key}"], row[f"z_length_held_{key}"] = m, v, zz
        for key, order in (("most_linked", most), ("least_linked", least)):
            row[f"pages_{key}"], row[f"in_degree_{key}"] = reading(order, int(points[k]))
        return row

    def span(key, sign):
        """The longest run of grid points (the last excluded, where sd is 0) with
        z beyond 1.5 in the direction `sign`: its token range and z range."""
        rows = [cut(at[int(p)]) for p in grid[:-1]]
        best, run = [], []
        for r in rows:
            run = run + [r] if sign * r[f"z_{key}"] > SPAN_Z else []
            if len(run) > len(best):
                best = run
        zs = [r[f"z_{key}"] for r in best]
        return {"order": key, "from": best[0]["tokens"], "to": best[-1]["tokens"], "points": len(best),
                "z_min": min(zs), "z_max": max(zs)}

    def cut(k):
        return {
            "tokens": int(points[k]),
            "most_linked": int(curve_most[k]),
            "least_linked": int(curve_least[k]),
            "random_mean": float(mean[k]),
            "random_sd": float(sd[k]),
            "random_p5": float(p5[k]),
            "random_p95": float(p95[k]),
            "z_most_linked": z(curve_most, k),
            "z_least_linked": z(curve_least, k),
        }

    payload = {
        "meta": {
            "script": "analysis/week05_heaps.py",
            "owner": "Niklas",
            "word_rule": WORD_RULE,
            "pages": len(nodes),
            "arcs": network.number_of_edges(),
            "zero_indegree_pages": sum(network.in_degree(n) == 0 for n in nodes),
            "tokens": total,
            "types": len(vocab),
            "order_rule": "in-degree in the directed link network among the 303 pages, ties broken by node id",
            "seed": SEED,
            "runs": RUNS,
            "length_bins": LENGTH_BINS,
            "length_runs": LENGTH_RUNS,
            "length_seed": LENGTH_SEED,
            "grid_points": len(grid),
            "grid_from": GRID_FROM,
        },
        "first_pages": {
            "pages": FIRST,
            "most_linked_tokens": sum(len(tokens[n]) for n in most[:FIRST]),
            "least_linked_tokens": sum(len(tokens[n]) for n in least[:FIRST]),
        },
        "grid": [cut(at[int(p)]) for p in grid],
        "checkpoints": [checkpoint(at[c]) for c in CHECKPOINTS],
        "spans": [span("least_linked", 1), span("most_linked", -1)],
        "heaps": {
            "k": k_mean,
            "beta": beta_mean,
            "fit_from": int(fit_n[0]),
            "fit_to": int(fit_n[-1]),
            "fit_points": len(fit_idx),
            "beta_runs_mean": float(betas.mean()),
            "beta_runs_sd": float(betas.std(ddof=1)),
            "beta_runs_p5": float(np.percentile(betas, 5)),
            "beta_runs_p95": float(np.percentile(betas, 95)),
            "split_at": int(round(middle)),
            "beta_lower": beta_lower,
            "beta_upper": beta_upper,
            "tail_from": tail_from,
            "tail_new_per_1000": tail_rate,
        },
        "late": {
            "pages": LATE,
            "max_in_degree": max(network.in_degree(n) for n in late_pages),
            "tokens": late_tokens,
            "new_types": len(new_types),
            "new_per_1000": 1000 * len(new_types) / late_tokens,
            "names": len(names),
            "others": len(others),
            "name_share": len(names) / len(new_types),
            "names_initial_only": len(initial_only),
            "names_sample": sample(names),
            "others_sample": sample(others),
            "random_new_types_mean": float(np.mean(late_new)),
            "random_new_types_sd": float(np.std(late_new, ddof=1)),
            "random_new_per_1000_mean": float(np.mean(late_rate)),
            "random_new_per_1000_sd": float(np.std(late_rate, ddof=1)),
            "random_name_share_mean": float(np.mean(late_names)),
            "random_name_share_sd": float(np.std(late_names, ddof=1)),
        },
        "passages": [named, other],
    }
    check(PAGE_OUT, payload)
    encoded = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    PAGE_OUT.write_text(encoded, encoding="utf-8")
    h, late = payload["heaps"], payload["late"]
    print(f"{total:,} tokens, {len(vocab):,} types; beta {h['beta']:.3f} "
          f"({h['beta_runs_p5']:.3f} to {h['beta_runs_p95']:.3f}), halves {beta_lower:.3f} / {beta_upper:.3f}")
    for c in payload["checkpoints"]:
        print(f"{c['tokens']:,} tokens: most {c['most_linked']:,} (z {c['z_most_linked']:.1f}), "
              f"least {c['least_linked']:,} (z {c['z_least_linked']:.1f}), random {c['random_mean']:.0f} ± {c['random_sd']:.0f}")
    print(f"late {LATE} pages: {late['new_types']:,} new types, {late['names']:,} names ({late['name_share']:.0%}, "
          f"random {late['random_name_share_mean']:.0%})")


if __name__ == "__main__":
    sys.exit(main())
