"""Week 6 essentials: every term in the brief's Essentials list, used once on the 303 Marvel pages.

Owner: Gyula. The page /weeks/week06/essentials/ has eight sections; this script writes one JSON
per section to public/weeks/week06/data/essentials-*.json, and a summary of every quoted number to
analysis/week06_essentials.json.

Part A, documents (one row per page), uses week06_lookalikes.Corpus and its token rule, so every
number matches the Week 6 post:
  1 weights   TF, DF, IDF and TF-IDF for each page's words
  2 cosine    cosine under raw counts and TF-IDF for curated pairs, split into per-word terms
  3 contrast  a Scattertext comparison of women's and men's pages (Wikidata labels)
  4 topics    LDA with k = 5..12 and two seeds, and how well the seeds agree

Part B, words (one row per word), counts contexts inside each page's token stream:
  5 contexts  a word's row of the word-context matrix at windows 2, 5 and 10
  6 pmi       the same rows as counts, PMI and PPMI
  7 vectors   nearest words under PPMI rows, skip-gram and CBOW (gensim), and negative sampling
  8 glove     the same words' nearest words in pretrained GloVe (glove.6B 50d) against skip-gram

    python analysis/week06_essentials.py            # a few minutes; LDA and word2vec are most of it
    python analysis/week06_essentials.py --part a   # documents only
"""

import argparse
import json
import math
import random
import sys
import zlib
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import week06_lookalikes as L  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE_DIR = ROOT / "public/weeks/week06/data"
GLOVE = ROOT / "build/glove/glove-wiki-gigaword-50.gz"
SEED = 6

# Pages a reader will know; all are in the 303-page snapshot (it has no Thor, Iron Man or Captain America page).
PAGES = ["Spider-Man", "Storm (Marvel Comics)", "Wolverine (character)", "Hulk", "She-Hulk", "Black Widow (Natasha Romanova)",
         "Jean Grey", "Cyclops (Marvel Comics)", "Emma Frost", "Jack Frost (Marvel Comics)", "Human Torch", "Deadpool",
         "Venom (character)", "Eddie Brock", "Doctor Strange", "Scarlet Witch", "Blade (character)", "Morbius",
         "Backhand (character)", "Black Panther (character)", "Ghost Rider", "Captain Marvel (Marvel Comics)", "Hulkling",
         "Spider-Woman (Jessica Drew)"]

TOP = 12  # words per list


def r(x, d=4):
    return round(float(x), d)


def write(name, obj):
    PAGE_DIR.mkdir(parents=True, exist_ok=True)
    (PAGE_DIR / f"essentials-{name}.json").write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False) + "\n")


# ---- 1. weights ------------------------------------------------------------------------------

def weights(c, stop):
    idf = {w: math.log(c.n / c.df[w]) for w in c.vocab}
    pages = []
    for i in range(c.n):
        cnt, size = c.counts[i], len(c.toks[i])
        row = lambda w: [w, cnt[w], c.df[w], r(idf[w], 3), r(cnt[w] / size * idf[w], 5)]  # noqa: E731
        by_count = sorted(cnt, key=lambda w: (-cnt[w], w))[:TOP]
        by_tfidf = sorted(cnt, key=lambda w: (-cnt[w] * idf[w], w))[:TOP]
        pages.append({"name": c.names[i], "size": size, "count": [row(w) for w in by_count], "tfidf": [row(w) for w in by_tfidf]})
    # Compared to what: the stopword list a person writes against the zero weight IDF gives words on every page.
    everywhere = sorted(w for w in c.vocab if c.df[w] == c.n)
    top100 = [w for w, _ in Counter({w: sum(x[w] for x in c.counts) for w in c.vocab}).most_common(100)]
    low = [w for w in c.vocab if idf[w] < 0.1]
    facts = {
        "pages": c.n, "tokens": sum(len(t) for t in c.toks), "vocab": len(c.vocab),
        "everywhere": everywhere, "low_idf": len(low), "low_idf_stop": sum(w in stop for w in low),
        "top100_stop": sum(w in stop for w in top100), "stop_size": len(stop),
        "stop_not_low": sum(1 for w in stop if w in idf and idf[w] >= 0.1),
        "pronouns": {w: {"df": c.df[w], "idf": r(idf[w], 2)} for w in ("he", "his", "she", "her", "mutant", "symbiote", "the")},
    }
    write("weights", {"pages": pages, "facts": facts})
    return facts


# ---- 2. cosine -------------------------------------------------------------------------------

def cosine(c):
    raw, tf = c.raw(), c.tfidf()
    idx = [c.names.index(p) for p in PAGES]

    def split(m, i, j, n=6):
        a, b = m[i] / np.linalg.norm(m[i]), m[j] / np.linalg.norm(m[j])
        part = a * b
        cos = part.sum()
        order = np.argsort(-part)[:n]
        return r(cos), [[c.vocab[k], r(part[k], 4)] for k in order if part[k] > 0]

    pairs = {}
    for x in range(len(idx)):
        for y in range(x + 1, len(idx)):
            i, j = idx[x], idx[y]
            cr, wr = split(raw, i, j)
            ct, wt = split(tf, i, j)
            pairs[f"{x}-{y}"] = {"raw": cr, "rawWords": wr, "tfidf": ct, "tfidfWords": wt}
    # Lengths for the "repeat this page" toggle: raw counts scale, TF (count over length) does not.
    norms = [{"raw": r(np.linalg.norm(raw[i]), 2), "tfidf": r(np.linalg.norm(tf[i]), 5)} for i in idx]
    # Compared to what: cosine of all 45,753 page pairs under each weighting.
    iu = np.triu_indices(c.n, 1)
    dist = {}
    for name, m in (("raw", raw), ("tfidf", tf)):
        u = L.unit(m)
        s = (u @ u.T)[iu]
        dist[name] = {"median": r(np.median(s)), "p90": r(np.percentile(s, 90)), "p99": r(np.percentile(s, 99))}
    # Tripling a page: check the claim numerically rather than assert it.
    # Writing a page out three times: raw counts triple, TF (count over length) and so TF-IDF do not move.
    idf_vec = np.array([math.log(c.n / c.df[w]) for w in c.vocab])

    def tripled_diff(i, j):
        r3 = raw[i] * 3
        t3 = (r3 / r3.sum()) * idf_vec
        cos = lambda x, y: float(L.unit(x[None])[0] @ L.unit(y[None])[0])  # noqa: E731
        return max(abs(cos(r3, raw[j]) - cos(raw[i], raw[j])), abs(cos(t3, tf[j]) - cos(tf[i], tf[j])))
    same = max(tripled_diff(idx[x], idx[y]) for x in range(len(idx)) for y in range(len(idx)) if x != y)
    out = {"pages": PAGES, "pairs": pairs, "norms": norms, "all_pairs": dist, "triple_diff": same}
    write("cosine", out)
    return {"all_pairs": dist, "triple_diff": same, "pairs": len(pairs)}


# ---- 3. contrast (Scattertext) -----------------------------------------------------------------

def contrast(c, names):
    """Scattertext's two-corpus comparison: each word placed by its frequency rank among women's and among
    men's pages, and scored by the log-odds ratio with an informative Dirichlet prior (Monroe et al. 2008),
    whose z-score has a null: shuffle the labels over the same pages and count words past |z| > 1.96."""
    import pandas as pd
    import scattertext as st

    labels = L.gender_labels(c)
    keep = [i for i in range(c.n) if labels[i] in ("female", "male")]
    real = [labels[i] for i in keep]

    def counts(lab):
        f, m = Counter(), Counter()
        for i, g in zip(keep, lab):
            (f if g == "female" else m).update(c.counts[i])
        return f, m

    f, m = counts(real)
    terms = sorted(w for w in set(f) | set(m) if f[w] + m[w] >= 20)
    prior = pd.Series({w: f[w] + m[w] for w in terms})
    scorer = st.LogOddsRatioInformativeDirichletPrior(prior, sigma=10, scale_type="class-size")

    def z(fc, mc):
        return pd.Series(scorer.get_zeta_i_j_given_separate_counts(pd.Series([fc[w] for w in terms], index=terms),
                                                                     pd.Series([mc[w] for w in terms], index=terms)),
                         index=terms)

    zs = z(f, m)
    rf = pd.Series({w: f[w] for w in terms}).rank(pct=True)
    rm = pd.Series({w: m[w] for w in terms}).rank(pct=True)
    rows = sorted(([w, f[w], m[w], r(rf[w], 3), r(rm[w], 3), r(zs[w], 2), w in names] for w in terms), key=lambda x: -abs(x[5]))
    beyond = int((zs.abs() > 1.96).sum())
    # Compared to what: the same count with the women/men labels shuffled over the same 197 pages.
    rng = np.random.default_rng(SEED)
    null, null_top = [], []
    for _ in range(20):
        nz = z(*counts(list(rng.permutation(real)))).abs()
        null.append(int((nz > 1.96).sum()))
        null_top.append(float(nz.max()))

    def top(side, names_ok, n=15):
        sel = [x for x in rows if names_ok or not x[6]]
        sel.sort(key=lambda x: -x[5] if side == "female" else x[5])
        return [[x[0], x[5]] for x in sel[:n]]

    out = {
        "pages": {"female": real.count("female"), "male": real.count("male")},
        "words": {"female": sum(f.values()), "male": sum(m.values())},
        "terms": rows, "min_count": 20,
        "top": {"female": top("female", True), "male": top("male", True),
                "female_no_names": top("female", False), "male_no_names": top("male", False)},
        "beyond": beyond, "plotted": len(terms),
        "null": {"runs": 20, "mean": r(np.mean(null), 1), "min": min(null), "max": max(null),
                 "top_z_mean": r(np.mean(null_top), 1), "top_z_max": r(max(null_top), 1)},
        "beyond_null_top": int((zs.abs() > max(null_top)).sum()),
    }
    write("contrast", out)
    return {k: out[k] for k in ("pages", "words", "top", "beyond", "plotted", "null", "beyond_null_top")}


# ---- 4. topics (LDA) --------------------------------------------------------------------------

def topics(c, names, stop):
    from scipy.optimize import linear_sum_assignment
    from sklearn.decomposition import LatentDirichletAllocation

    vocab = [w for w in c.vocab if w not in names and w not in stop and 5 <= c.df[w] <= c.n // 2 and len(w) > 2]
    col = {w: k for k, w in enumerate(vocab)}
    x = np.zeros((c.n, len(vocab)))
    for i, cnt in enumerate(c.counts):
        for w, n in cnt.items():
            if w in col:
                x[i, col[w]] = n
    fits, stability = {}, {}
    for k in range(5, 13):
        runs = []
        for seed in (0, 1):
            lda = LatentDirichletAllocation(n_components=k, random_state=seed, learning_method="batch", max_iter=50, n_jobs=1)
            theta = lda.fit_transform(x)
            phi = lda.components_ / lda.components_.sum(axis=1, keepdims=True)
            runs.append((theta, phi))
            fits[f"{k}-{seed}"] = {
                "topics": [[[vocab[j], r(phi[t, j], 4)] for j in np.argsort(-phi[t])[:10]] for t in range(k)],
                "mix": [[r(v, 2) for v in row] for row in theta],
            }
        # Match seed 1's topics to seed 0's by overlap of their top 10 words.
        tops = [[set(np.argsort(-phi[t])[:10]) for t in range(k)] for _, phi in runs]
        overlap = np.array([[len(a & b) / 10 for b in tops[1]] for a in tops[0]])
        rows_, cols_ = linear_sum_assignment(-overlap)
        matched = overlap[rows_, cols_]
        stability[str(k)] = {"mean_overlap": r(matched.mean(), 2), "kept": int((matched >= 0.5).sum()),
                             "overlap": [r(overlap[t, cols_[list(rows_).index(t)]], 1) for t in range(k)],
                             "match": [int(cols_[list(rows_).index(t)]) for t in range(k)]}
        print(f"k={k} mean top-10 overlap {matched.mean():.2f}, {int((matched >= 0.5).sum())} of {k} topics kept", flush=True)
    out = {"names": c.names, "vocab_size": len(vocab), "fits": fits, "stability": stability,
           "rule": "names, NLTK stopwords and words under three letters removed; words on 5 to 151 pages kept"}
    write("topics", out)
    return {"vocab_size": len(vocab), "stability": {k: {kk: v[kk] for kk in ("mean_overlap", "kept")} for k, v in stability.items()}}


# ---- Part B: words ---------------------------------------------------------------------------

# Target words for sections 5 to 8: Marvel-flavoured words, words with a second meaning, and two pronouns.
TARGETS = ["storm", "web", "hammer", "mutant", "symbiote", "vampire", "shield", "armor", "magic", "vision", "beast",
           "thing", "wolverine", "spider", "venom", "phoenix", "hulk", "fire", "ice", "blood", "school", "team",
           "villain", "hero", "she", "he"]
WINDOWS = (2, 5, 10)


def stable_hash(s):
    """gensim seeds each word's starting vector with this; Python's own hash changes per run."""
    return zlib.crc32(s.encode())


def contexts(c, window, col):
    """The word-context matrix: cell (w, x) counts how often x sits within `window` tokens of w, inside one page.
    Symmetric, so row sums equal column sums."""
    from scipy.sparse import coo_matrix

    rows, cols = [], []
    for toks in c.toks:
        ids = np.array([col[w] for w in toks])
        for d in range(1, window + 1):
            rows += [ids[:-d], ids[d:]]
            cols += [ids[d:], ids[:-d]]
    rows, cols = np.concatenate(rows), np.concatenate(cols)
    m = coo_matrix((np.ones(len(rows), dtype=np.int64), (rows, cols)), shape=(len(col), len(col))).tocsr()
    m.sum_duplicates()
    return m


def words_part(c, stop):
    from gensim.models import KeyedVectors, Word2Vec

    freq = Counter(w for t in c.toks for w in t)
    targets = [w for w in TARGETS if freq[w] >= 20]

    # 5 and 6: rows of the word-context matrix, and PMI / PPMI at window 5.
    vocab_all, col_all = c.vocab, c.col
    rows5, pmi_rows, grid = {}, {}, None
    MIN = 5
    for window in WINDOWS:
        m = contexts(c, window, col_all)
        row_tot = np.asarray(m.sum(axis=1)).ravel()
        total = row_tot.sum()
        for w in targets:
            k = col_all[w]
            row = m.getrow(k)
            ctx = {vocab_all[j]: int(n) for j, n in zip(row.indices, row.data)}
            rows5.setdefault(w, {})[str(window)] = sorted(ctx.items(), key=lambda x: (-x[1], x[0]))[:15]
            if window == 5:
                pmi = {x: math.log(n * total / (row_tot[k] * row_tot[col_all[x]])) for x, n in ctx.items()}
                by_count = sorted(ctx.items(), key=lambda x: (-x[1], x[0]))
                kept = {x: v for x, v in pmi.items() if ctx[x] >= MIN and v > 0}
                neg = sorted(((x, v) for x, v in pmi.items() if v < 0), key=lambda x: -ctx[x[0]])[:8]
                pmi_rows[w] = {
                    "count": [[x, n, r(pmi[x], 2)] for x, n in by_count[:12]],
                    "pmi_any": [[x, ctx[x], r(v, 2)] for x, v in sorted(pmi.items(), key=lambda x: (-x[1], x[0]))[:12]],
                    "ppmi": [[x, ctx[x], r(v, 2)] for x, v in sorted(kept.items(), key=lambda x: (-x[1], x[0]))[:12]],
                    "negative": [[x, ctx[x], r(v, 2)] for x, v in neg],
                    "cells": len(ctx), "negative_cells": sum(v < 0 for v in pmi.values()), "min_count": MIN,
                    "the": {"count_rank": next((i + 1 for i, (x, _) in enumerate(by_count) if x == "the"), None),
                            "pmi": r(pmi["the"], 2) if "the" in pmi else None},
                }
        if window == 5:
            g_words = ["storm", "web", "hammer", "symbiote", "vampire", "magic"]
            g_ctx = ["the", "of", "weather", "spider", "thor", "suit", "blood", "spells"]
            grid = {"rows": g_words, "cols": g_ctx, "cells": [[int(m[col_all[w], col_all[x]]) for x in g_ctx] for w in g_words]}
            m5, tot5, total5 = m, row_tot, total
    write("contexts", {"targets": targets, "windows": list(WINDOWS), "rows": rows5, "grid": grid})
    write("pmi", {"targets": targets, "rows": pmi_rows})

    # 7: nearest words under PPMI rows (window 5, words seen 20+ times), skip-gram and CBOW.
    vocab = sorted(w for w, n in freq.items() if n >= 20)
    idx = np.array([col_all[w] for w in vocab])
    sub = m5[idx][:, idx].tocoo()
    v = np.log(sub.data * total5 / (tot5[idx][sub.row] * tot5[idx][sub.col]))
    from scipy.sparse import csr_matrix
    pos = v > 0
    pm = csr_matrix((v[pos], (sub.row[pos], sub.col[pos])), shape=(len(vocab), len(vocab)))
    col = {w: k for k, w in enumerate(vocab)}
    norm = np.sqrt(np.asarray(pm.multiply(pm).sum(axis=1))).ravel()
    norm[norm == 0] = 1

    def ppmi_near(w, n=10):
        k = col[w]
        sims = (pm @ pm[k].T).toarray().ravel() / (norm * norm[k])
        sims[k] = -1
        return [[vocab[j], r(sims[j], 3)] for j in np.argsort(-sims)[:n]]

    sents = [t for t in c.toks if t]
    models = {}
    for name, sg in (("skipgram", 1), ("cbow", 0)):
        runs = []
        for seed in (SEED, SEED + 1):
            mdl = Word2Vec(sents, vector_size=100, window=5, min_count=20, sg=sg, negative=5, epochs=20,
                           seed=seed, workers=1, hashfxn=stable_hash)
            runs.append(mdl.wv)
        models[name] = runs
    near = {}
    overlap = {"skipgram": [], "cbow": []}
    for w in targets:
        near[w] = {"ppmi": ppmi_near(w)}
        for name, (a, b) in models.items():
            near[w][name] = [[x, r(s, 3)] for x, s in a.most_similar(w, topn=10)]
            overlap[name].append(len({x for x, _ in a.most_similar(w, topn=10)} & {x for x, _ in b.most_similar(w, topn=10)}) / 10)
    # Compared to what: the same score for words drawn at random from the vocabulary.
    rng = random.Random(SEED)
    sample = rng.sample(vocab, 200)
    a = models["skipgram"][0]
    rand_cos = float(np.mean([a.similarity(x, y) for x, y in zip(sample[:100], sample[100:])]))
    # The fair baseline for a top ten: the same mean over the ten nearest of random vocabulary words.
    rand_top = float(np.mean([sim for x in sample[:100] for _, sim in a.most_similar(x, topn=10)]))
    near_cos = float(np.mean([s for w in targets for _, s in a.most_similar(w, topn=10)]))

    # Negative sampling, made visible: three sentences, their positive pairs and sampled negatives.
    weights_ = np.array([freq[w] ** 0.75 for w in vocab])
    weights_ /= weights_.sum()
    nrng = np.random.default_rng(SEED)
    examples = []
    for page, centre in (("Storm (Marvel Comics)", "storm"), ("Venom (character)", "symbiote"), ("Spider-Man", "web")):
        toks = c.toks[c.names.index(page)]
        i = toks.index(centre)
        ctx = [toks[j] for j in range(max(0, i - 5), min(len(toks), i + 6)) if j != i]
        negs = [vocab[k] for k in nrng.choice(len(vocab), size=5, p=weights_)]
        examples.append({"page": page, "centre": centre, "window": toks[max(0, i - 5): i + 6], "positive": ctx, "negative": negs})
    write("vectors", {"targets": targets, "near": near, "examples": examples,
                      "settings": {"dim": 100, "window": 5, "min_count": 20, "negative": 5, "epochs": 20, "vocab": len(vocab)}})

    # 8: GloVe (Wikipedia 2014 + Gigaword 5, 6B tokens, 50 dimensions) against skip-gram on the 303 pages.
    glove = KeyedVectors.load_word2vec_format(str(GLOVE), binary=False)
    # Both lists rank the same candidates: words seen 20+ times on the pages that GloVe also knows.
    shared_vocab = [w for w in vocab if w in glove.key_to_index]
    gmat = np.array([glove[w] for w in shared_vocab])
    gmat /= np.linalg.norm(gmat, axis=1, keepdims=True)
    compare = {}
    for w in targets:
        if w not in glove.key_to_index:
            continue
        q = glove[w] / np.linalg.norm(glove[w])
        sims = gmat @ q
        order = [k for k in np.argsort(-sims) if shared_vocab[k] != w][:10]
        g = [[shared_vocab[k], r(sims[k], 3)] for k in order]
        ours = [[x, r(s_, 3)] for x, s_ in a.most_similar(w, topn=50) if x in glove.key_to_index][:10]
        compare[w] = {"glove": g, "marvel": ours, "shared": sorted({x for x, _ in g} & {x for x, _ in ours}),
                      "glove_open": [[x, r(s_, 3)] for x, s_ in glove.most_similar(w, topn=10)]}
    write("glove", {"targets": list(compare), "compare": compare, "candidates": len(shared_vocab),
                    "glove": "glove.6B, 50 dimensions, Wikipedia 2014 + Gigaword 5"})

    return {
        "targets": targets, "vocab_20": len(vocab),
        "the": {w: pmi_rows[w]["the"] for w in targets},
        "negative_cells": {w: [pmi_rows[w]["negative_cells"], pmi_rows[w]["cells"]] for w in targets},
        "seed_overlap": {k: r(np.mean(v), 2) for k, v in overlap.items()},
        "skipgram_near_cos": r(near_cos, 3), "skipgram_random_cos": r(rand_cos, 3), "skipgram_random_top": r(rand_top, 3),
        "glove_shared": {w: len(v["shared"]) for w, v in compare.items()}, "glove_candidates": len(shared_vocab),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--part", choices=["a", "b", "all"], default="all")
    args = ap.parse_args()
    c = L.Corpus()
    names = L.name_words(c.text)
    stop = L.stopwords()
    facts = json.loads(OUT.read_text()) if OUT.exists() else {}
    if args.part in ("a", "all"):
        facts["weights"] = weights(c, stop)
        facts["cosine"] = cosine(c)
        facts["contrast"] = contrast(c, names)
        facts["topics"] = topics(c, names, stop)
    if args.part in ("b", "all"):
        facts["words"] = words_part(c, stop)
    OUT.write_text(json.dumps(facts, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps(facts, indent=1, ensure_ascii=False)[:6000])


if __name__ == "__main__":
    main()
