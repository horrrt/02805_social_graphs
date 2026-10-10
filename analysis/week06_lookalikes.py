"""Week 6: when two Marvel pages read alike, is it a shared name, a shared story, or Wikipedia's template?

Owner: Gyula (whole post). Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html,
exercise 6.11, openers "Names or meaning?" and "Who is textually close but structurally far away?".

Steps:

1. Rebuild the course's lookalikes exactly: its token rule, TF-IDF as the brief defines it
   (count / page length, times ln(N / df)), cosine, each page's ten nearest pages, and how many
   of those ten are linked in either direction. The course's own figures (raw counts 1.86,
   stopwords removed 2.84, TF-IDF 4.01, ten random pages 0.31) must come back, or the script stops.
2. Take the names out with the brief's own rule (a word capitalised in most of its uses is a
   name) and count again. The null removes as many non-name words, each matched to a name on
   document frequency, 20 times with seeds SEED + i.
3. Take the gendered pronouns out as well, and ask whether a page's neighbours share its
   Wikidata gender (analysis/week06_gender.parquet) more often than shuffled labels allow.
4. Network distance (undirected shortest path) from each page to its ten textual neighbours,
   against all pairs. Pairs with no path form their own bucket.
5. The closest unlinked pairs with names kept and with names removed, each read by hand into
   one of four buckets fixed before reading (READ_BUCKETS), stored in
   analysis/week06_pairs_read.parquet with the words that drove the match. The script stops when a
   pair is unread, when its words changed since the reading, or when a verdict's pair is no
   longer drawn.

Writes analysis/week06_lookalikes.json (the numbers the page quotes) and
public/weeks/week06/data/lookalikes.json (the same numbers and the explorer's per-page neighbours).

    python analysis/week06_lookalikes.py             # about 40 seconds
    python analysis/week06_lookalikes.py --to-read   # print the unread pairs and their sentences
"""

import json
import math
import os
import random
import re
import sys
from collections import Counter
from pathlib import Path

import networkx as nx
import numpy as np
import tables

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE_OUT = ROOT / "public/weeks/week06/data/lookalikes.json"
READ = Path(__file__).with_name("week06_pairs_read.parquet")
GENDER = Path(__file__).with_name("week06_gender.parquet")
SEED = 6
K = 10  # neighbours per page, as in the course's explorable
NULL_RUNS = 20
SHUFFLES = 1000
READ_N = 25  # closest unlinked pairs read by hand, per representation
# The course's explorable data, from a clone of github.com/suneman/socialgraphs2026-web (the go-nuts
# digest keeps one here). Its TF-IDF neighbour lists are checked page by page against ours.
COURSE_LOOKALIKES = Path(os.environ.get("COURSE_REPO", Path.home() / ".cache/socialgraphs2026-web")) / "docs/explorables/lookalikes.json"

# The course's token rule, recovered by matching every page length in its lookalikes.json:
# runs of letters in any alphabet, one inner apostrophe kept, lowercased.
TOKEN = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?")
TOKEN_RULE = "runs of letters in any alphabet with one inner apostrophe kept, lowercased"
# The course's figures for the same pages (brief section 1 and its lookalikes explorable).
COURSE = {"raw": 1.86, "stopwords": 2.84, "tfidf": 4.01, "random": 0.31, "vocab": 27033}
PRONOUNS = {"he", "him", "his", "himself", "she", "her", "hers", "herself",
            "he's", "she's", "he'd", "she'd", "he'll", "she'll"}
READ_BUCKETS = {
    "story": "the pages put both characters on one team, in one storyline or family at the same time, or one names the other in a shared event",
    "mantle": "versions of one character, or characters who held the same codename or title",
    "name": "a shared name word and no shared story: a coincidence of naming",
    "template": "pronouns or Wikipedia's recurring sections (reception lists, media) and no shared story",
}


def tokens(text):
    return TOKEN.findall(text.lower())


def course_neighbours(c, top):
    """How many of the 303 pages have the same ten TF-IDF neighbours as the course's file, matched by page id."""
    if not COURSE_LOOKALIKES.exists():
        raise SystemExit(f"{COURSE_LOOKALIKES} is missing: git clone https://github.com/suneman/socialgraphs2026-web "
                         "into ~/.cache/socialgraphs2026-web or set COURSE_REPO")
    theirs = json.loads(COURSE_LOOKALIKES.read_text())
    ids = theirs["ids"]
    lists = {ids[i]: {ids[n[0]] for n in row} for i, row in enumerate(theirs["modes"]["tfidf"]["neighbors"])}
    return sum(lists[c.ids[i]] == {c.ids[j] for j in top[i]} for i in range(c.n))


def name_words(texts):
    """The brief's rule: a word capitalised in more than half of its uses is a name."""
    seen, cap = Counter(), Counter()
    for text in texts:
        for w in TOKEN.findall(text):
            seen[w.lower()] += 1
            cap[w.lower()] += w[0].isupper()
    return {w for w in seen if cap[w] > seen[w] / 2}


def stopwords():
    from nltk.corpus import stopwords as sw

    return set(sw.words("english"))


class Corpus:
    def __init__(self):
        text = t.pages()
        self.ids = sorted(text)
        self.n = len(self.ids)
        self.text = [text[i] for i in self.ids]
        self.toks = [tokens(x) for x in self.text]
        self.counts = [Counter(d) for d in self.toks]
        self.df = Counter(w for c in self.counts for w in c)
        self.vocab = sorted(self.df)
        self.col = {w: i for i, w in enumerate(self.vocab)}
        g = t.graph().to_undirected()
        self.linked = np.array([[g.has_edge(a, b) for b in self.ids] for a in self.ids])
        self.dist = dict(nx.all_pairs_shortest_path_length(g))
        names = t.nodes().set_index("node_id").name
        self.names = [names[i] for i in self.ids]

    def matrix(self, weight):
        m = np.zeros((self.n, len(self.vocab)))
        for r, c in enumerate(self.counts):
            for w, x in c.items():
                m[r, self.col[w]] = weight(w, x, r)
        return m

    def raw(self):
        return self.matrix(lambda w, x, r: x)

    def tfidf(self):
        return self.matrix(lambda w, x, r: x / len(self.toks[r]) * math.log(self.n / self.df[w]))

    def drop(self, m, words):
        m = m.copy()
        m[:, [self.col[w] for w in words if w in self.col]] = 0
        return m

    def distance(self, i, j):
        return self.dist[self.ids[i]].get(self.ids[j])


def unit(m):
    return m / np.linalg.norm(m, axis=1, keepdims=True)


def neighbours(m):
    """Cosine matrix (diagonal -1) and each page's K nearest pages, ties broken by row order."""
    u = unit(m)
    s = u @ u.T
    np.fill_diagonal(s, -1)
    return s, np.argsort(-s, axis=1, kind="stable")[:, :K]


def hits(c, top):
    return float(np.mean([c.linked[i, top[i]].sum() for i in range(c.n)]))


def matched_removal(c, m, names, rng):
    """Remove one non-name word per name word, matched on document frequency, without replacement."""
    pools = {}
    for w in c.vocab:
        if w not in names:
            pools.setdefault(c.df[w], []).append(w)
    for p in pools.values():
        rng.shuffle(p)
    removed = []
    for w in sorted(names & set(c.vocab), key=lambda x: (c.df[x], x)):
        d = c.df[w]
        avail = [k for k in pools if pools[k]]
        best = min(avail, key=lambda k: (abs(k - d), k))
        removed.append(pools[best].pop())
    return c.drop(m, removed), len(removed)


def gender_labels(c):
    rows = {r["node_id"]: r["gender"] for r in tables.rows(GENDER)}
    return np.array([rows[i] for i in c.ids])


def same_gender(top, labels, focus):
    """For pages labelled `focus`: the share of their labelled neighbours (male or female) with the same label."""
    known = np.isin(labels, ["male", "female"])
    num = den = 0
    for i in np.flatnonzero(labels == focus):
        js = [j for j in top[i] if known[j]]
        num += sum(labels[j] == focus for j in js)
        den += len(js)
    return num / den


def female_share(top, labels, focus):
    """For pages labelled `focus`: the share of their labelled neighbours (male or female) who are women."""
    known = np.isin(labels, ["male", "female"])
    num = den = 0
    for i in np.flatnonzero(labels == focus):
        js = [j for j in top[i] if known[j]]
        num += sum(labels[j] == "female" for j in js)
        den += len(js)
    return num / den


def gender_test(c, top, labels, rng):
    """Women among the labelled neighbours of women and of men, and the gap between the two.

    A shuffle deals the labels out again over the same pages and keeps every neighbour list,
    so a page that sits in many lists (a hub) is a woman's page only by chance. If women's
    pages are hubs, men's neighbours are pulled toward women too, and each share alone rises
    above its shuffle; the gap between women and men is the part hubs cannot explain.
    """
    known = np.flatnonzero(np.isin(labels, ["male", "female"]))
    stat = lambda lab: (female_share(top, lab, "female"), female_share(top, lab, "male"))  # noqa: E731
    obs = stat(labels)
    null = []
    for _ in range(SHUFFLES):
        shuffled = labels.copy()
        shuffled[known] = rng.permutation(labels[known])
        null.append(stat(shuffled))
    null = np.array(null)
    out = {}
    for k, (key, o, col) in enumerate((("female", obs[0], null[:, 0]), ("male", obs[1], null[:, 1]),
                                       ("gap", obs[0] - obs[1], null[:, 0] - null[:, 1]))):
        mu, sd = float(np.mean(col)), float(np.std(col))
        out[key] = {"observed": round(o, 3), "null_mean": round(mu, 3), "null_sd": round(sd, 3), "z": round((o - mu) / sd, 1)}
    # Every neighbour slot of the women's pages, unlabelled neighbours included.
    women = np.flatnonzero(labels == "female")
    out["female_all_slots"] = round(float(np.mean([labels[j] == "female" for i in women for j in top[i]])), 3)
    # How often the women's pages appear in anyone's ten nearest, against their share of pages.
    slots = Counter(int(j) for i in range(c.n) for j in top[i])
    out["slots_to_women"] = round(sum(slots[int(i)] for i in women) / (c.n * K), 3)
    out["hubs"] = [[c.names[j], n] for j, n in sorted(slots.items(), key=lambda x: (-x[1], x[0]))[:3]]
    # Women among all ten nearest pages (labelled or not), averaged over women's and over men's lists.
    out["women_in_ten"] = {focus: round(float(np.mean([sum(labels[j] == "female" for j in top[i])
                                                        for i in np.flatnonzero(labels == focus)])), 1)
                           for focus in ("female", "male")}
    out["men_lists_half_women"] = int(sum(sum(labels[j] == "female" for j in top[i]) >= K / 2
                                          for i in np.flatnonzero(labels == "male")))
    return out


def pair_words(c, m, top, labels, focus, n=8):
    """The words that carry the matches between `focus` pages and their `focus` neighbours, by share of the summed cosine."""
    u = unit(m)
    total = np.zeros(len(c.vocab))
    for i in np.flatnonzero(labels == focus):
        for j in top[i]:
            if labels[j] == focus:
                total += u[i] * u[j]
    order = np.argsort(-total, kind="stable")[:n]
    return [[c.vocab[k], round(float(total[k] / total.sum()), 3)] for k in order]


def bucket(d):
    return "none" if d is None else ("4+" if d >= 4 else str(d))


def distance_shares(c, pairs):
    n = Counter(bucket(c.distance(i, j)) for i, j in pairs)
    total = sum(n.values())
    return {k: round(n[k] / total, 3) for k in ("1", "2", "3", "4+", "none")}


def drivers(u, i, j, vocab, n=6):
    contrib = u[i] * u[j]
    return [vocab[k] for k in np.argsort(-contrib, kind="stable")[:n] if contrib[k] > 0]


def closest_unlinked(c, s, n):
    iu, ju = np.triu_indices(c.n, 1)
    keep = ~c.linked[iu, ju]
    iu, ju = iu[keep], ju[keep]
    order = np.lexsort((ju, iu, -s[iu, ju]))[:n]
    return [(int(iu[k]), int(ju[k])) for k in order]


def read_verdicts(c, drawn, to_read):
    """Check every drawn pair has a current verdict; return the verdict rows."""
    verdicts = {}
    if READ.exists():
        for r in tables.rows(READ):
            verdicts[(r["representation"], r["a"], r["b"])] = r
    missing, stale = [], []
    for rep, i, j, words in drawn:
        key = (rep, c.ids[i], c.ids[j])
        v = verdicts.get(key)
        if v is None:
            missing.append((rep, i, j, words))
        elif v["words"] != " ".join(words):
            stale.append(key)
        elif v["bucket"] not in READ_BUCKETS:
            raise SystemExit(f"{key}: bucket {v['bucket']!r} is not one of {list(READ_BUCKETS)}")
    extra = set(verdicts) - {(rep, c.ids[i], c.ids[j]) for rep, i, j, _ in drawn}
    if to_read:
        for rep, i, j, words in missing:
            print(f"\n=== {rep} | {c.ids[i]} | {c.ids[j]} | {' '.join(words)}")
            for k in (i, j):
                sents = t.sentences(c.text[k])
                print(f"  [{c.ids[k]}] {sents[0][:300]}")
                for w in words[:3]:
                    hit = next((x for x in sents[1:] if w in tokens(x)), None)
                    if hit:
                        print(f"    ({w}) {hit[:260]}")
        return None
    if missing or stale or extra:
        raise SystemExit(f"{READ.name}: {len(missing)} drawn pairs unread, {len(stale)} read against other words, "
                         f"{len(extra)} verdicts for pairs no longer drawn. Run with --to-read.")
    return [verdicts[(rep, c.ids[i], c.ids[j])] for rep, i, j, _ in drawn]


def main(to_read=False):
    c = Corpus()
    raw, tfidf = c.raw(), c.tfidf()
    names = name_words(c.text)
    no_names = c.drop(tfidf, names)
    no_pron = c.drop(no_names, PRONOUNS)

    s_raw, top_raw = neighbours(raw)
    _, top_stop = neighbours(c.drop(raw, stopwords()))
    s_tf, top_tf = neighbours(tfidf)
    s_nn, top_nn = neighbours(no_names)
    _, top_np = neighbours(no_pron)
    density = c.linked.sum() / (c.n * (c.n - 1))
    course = {"raw": hits(c, top_raw), "stopwords": hits(c, top_stop), "tfidf": hits(c, top_tf),
              "random": K * density, "vocab": len(c.vocab)}
    for key, value in COURSE.items():
        if round(course[key], 2 if key != "vocab" else 0) != value:
            raise SystemExit(f"course figure {key}: ours {course[key]:.3f}, course {value}")
    everywhere = sorted(w for w in c.vocab if c.df[w] == c.n)
    same_lists = course_neighbours(c, top_tf)
    if same_lists != c.n:
        raise SystemExit(f"only {same_lists} of {c.n} pages have the course's ten TF-IDF neighbours")

    null, null_weight = [], []
    total = tfidf.sum()
    for i in range(NULL_RUNS):
        m, n_removed = matched_removal(c, tfidf, names, random.Random(SEED + i))
        null.append(hits(c, neighbours(m)[1]))
        null_weight.append((total - m.sum()) / total)
    only_names = tfidf.copy()
    only_names[:, [c.col[w] for w in c.vocab if w not in names]] = 0
    if (only_names.sum(axis=1) == 0).any():
        raise SystemExit("a page has no name word left to compare on")
    _, top_on = neighbours(only_names)

    is_name = np.array([w in names for w in c.vocab])
    labels = gender_labels(c)
    rng = np.random.default_rng(SEED)
    gender = {rep: gender_test(c, top, labels, rng)
              for rep, top in (("tfidf", top_tf), ("no_names", top_nn), ("no_names_pronouns", top_np))}
    women_in = lambda top: np.array([sum(labels[j] == "female" for j in top[i]) for i in range(c.n)])  # noqa: E731
    shift = women_in(top_nn) - women_in(top_tf)
    gender["lists"] = {"gain": int((shift > 0).sum()), "same": int((shift == 0).sum()), "lose": int((shift < 0).sum()),
                       "men_gain": int((shift[labels == "male"] > 0).sum())}
    gender["women_in_ten_all"] = {"tfidf": round(float(women_in(top_tf).mean()), 1), "no_names": round(float(women_in(top_nn).mean()), 1)}
    gender["words"] = {"no_names": pair_words(c, no_names, top_nn, labels, "female"),
                       "no_names_pronouns": pair_words(c, no_pron, top_np, labels, "female")}

    all_pairs = [(i, j) for i in range(c.n) for j in range(c.n) if i != j]
    dist = {rep: distance_shares(c, [(i, j) for i in range(c.n) for j in top[i]])
            for rep, top in (("tfidf", top_tf), ("no_names", top_nn))}
    dist["all"] = distance_shares(c, all_pairs)

    u_tf, u_nn = unit(tfidf), unit(no_names)
    drawn = [("tfidf", i, j, drivers(u_tf, i, j, c.vocab)) for i, j in closest_unlinked(c, s_tf, READ_N)]
    drawn += [("no_names", i, j, drivers(u_nn, i, j, c.vocab)) for i, j in closest_unlinked(c, s_nn, READ_N)]
    verdicts = read_verdicts(c, drawn, to_read)
    if to_read:
        return

    def name_share(i, j):
        contrib = u_tf[i] * u_tf[j]
        return float(contrib[is_name].sum() / contrib.sum())

    pairs_out = []
    for (rep, i, j, words), v in zip(drawn, verdicts):
        pairs_out.append({"rep": rep, "a": c.names[i], "b": c.names[j], "words": words,
                          "cos_tfidf": round(float(s_tf[i, j]), 3), "cos_no_names": round(float(s_nn[i, j]), 3),
                          "name_share": round(name_share(i, j), 2), "distance": c.distance(i, j),
                          "bucket": v["bucket"], "note": v["note"]})
    read = {rep: Counter(p["bucket"] for p in pairs_out if p["rep"] == rep) for rep in ("tfidf", "no_names")}
    both_women = sum(rep == "no_names" and labels[i] == labels[j] == "female" for rep, i, j, _ in drawn)

    changed = [len(set(top_tf[i]) & set(top_nn[i])) for i in range(c.n)]
    facts = {
        "pages": c.n, "k": K, "token_rule": TOKEN_RULE, "tokens": sum(map(len, c.toks)),
        "course": {k: round(v, 3) for k, v in course.items()}, "course_published": COURSE,
        "course_same_neighbours": same_lists, "seeds": [SEED, SEED + NULL_RUNS - 1],
        "stopword_vocab": sum(w not in stopwords() for w in c.vocab),
        "on_every_page": everywhere,
        "names": {"types": int(is_name.sum()), "rule": "capitalised in more than half of its uses",
                  "tfidf_share": round(float(tfidf[:, is_name].sum() / tfidf.sum()), 3),
                  "hits": round(hits(c, top_nn), 2),
                  "lists_unchanged": sum(x == K for x in changed), "mean_kept": round(float(np.mean(changed)), 2),
                  "first_linked": int(sum(c.linked[i, top_tf[i][0]] for i in range(c.n))),
                  "first_linked_no_names": int(sum(c.linked[i, top_nn[i][0]] for i in range(c.n)))},
        "names_only": {"hits": round(hits(c, top_on), 2)},
        "null": {"runs": NULL_RUNS, "words_removed": n_removed, "mean": round(float(np.mean(null)), 3),
                 "weight_removed": round(float(np.mean(null_weight)), 3),
                 "sd": round(float(np.std(null)), 3), "min": round(min(null), 2), "max": round(max(null), 2)},
        "pronouns": {"words": sorted(PRONOUNS), "hits": round(hits(c, top_np), 2),
                     "pages": {w: c.df[w] for w in ("he", "his", "she", "her")},
                     "idf": {w: round(math.log(c.n / c.df[w]), 2) for w in ("he", "his", "she", "her")}},
        "gender": {"labelled": int(np.isin(labels, ["male", "female"]).sum()),
                   "unlabelled": int((labels == "not recorded").sum()),
                   "other": dict(Counter(x for x in labels if x not in ("male", "female", "not recorded"))),
                   "unlabelled_shared_name": sum(labels[i] == "not recorded" and t.shared_name(c.text[i]) for i in range(c.n)),
                   "female": int((labels == "female").sum()), "male": int((labels == "male").sum()),
                   "shuffles": SHUFFLES, **gender},
        "distance": dist,
        "read": {"n": READ_N, "buckets": READ_BUCKETS, **{k: dict(v) for k, v in read.items()},
                 "no_names_both_women": int(both_women)},
        "pairs": pairs_out,
    }
    OUT.write_text(json.dumps(facts, indent=1, ensure_ascii=False) + "\n")

    def entry(i, j, s, u):
        return [int(j), round(float(s[i, j]), 3), int(c.linked[i, j]), c.distance(i, j) or 0,
                drivers(u, i, j, c.vocab, 4)]

    page = {"facts": facts, "names": c.names, "gender": labels.tolist(),
            "degree": [int(c.linked[i].sum()) for i in range(c.n)],
            "kept": [[entry(i, j, s_tf, u_tf) for j in top_tf[i]] for i in range(c.n)],
            "removed": [[entry(i, j, s_nn, u_nn) for j in top_nn[i]] for i in range(c.n)]}
    from check_pages import check

    check(PAGE_OUT, page)
    PAGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PAGE_OUT.write_text(json.dumps(page, separators=(",", ":"), ensure_ascii=False) + "\n")
    print(json.dumps({k: facts[k] for k in ("course", "names", "null", "pronouns", "gender", "distance", "read")},
                     indent=1))


if __name__ == "__main__":
    main(to_read="--to-read" in sys.argv)
