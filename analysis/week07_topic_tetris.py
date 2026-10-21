"""Topic Tetris: the same nine Marvel pages grouped three ways, for the hidden Week 7 game.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html, section 3 (different
ways to split up the same corpus). The game drops nine page blocks three times, and each round asks the
player to put every page in one of three groups. The pages never change; the representation does:

- Words: Week 6's LDA (analysis/week06_mix_desk.fit(): 8 topics on word counts, names removed). A page's
  group is its highest-weight topic.
- Meaning: the brief's document embeddings (page_vectors() from analysis/week07_two_stripes.py:
  all-MiniLM-L6-v2, 180-word passages, mean vector) split by k-means into K_MEANING clusters, seeded. BERTopic clusters the same
  vectors with UMAP and HDBSCAN; k-means is the simpler stand-in, and its four clusters match the four
  topics the brief's BERTopic run found.
- Connections: Week 5's link communities (public/weeks/week05/data/communities.json, consensus Louvain on
  the weighted link network).

All three run on the 303 pages; the game shows nine of them, and three groups of each method. The pages
are picked by hand (PAGES) from those that pass every check below, for familiar names and for how far
they move between rounds.

The board shows each round's evidence, and the script checks that the evidence alone gives the answer,
so no page is a guess:

- Words: each group lists its topic's top words (WORDS_SHOWN, none shared by two shown topics); each block
  shows the page's most used of those words with counts (CHIPS). The group whose listed words the page
  uses most must be the page's topic.
- Meaning: each group shows ANCHORS pages nearest its cluster's centre (not in the game); each block shows
  its NEAREST closest anchors by cosine. Most of those must belong to the page's cluster.
- Connections: each group shows its community's hubs (not in the game); each block shows how many links
  (counted both ways, as Week 5 does) it has into each shown community. Its own community must have the
  most, outright.

Group letters are arbitrary per method, so each round's letters are matched to the round before by most
shared pages (Hungarian assignment); a page only "moves" when it really leaves its companions. The script
stops when a page fails a check, a round shows other than three groups, or fewer than MIN_MOVES pages move
between two rounds.

Writes public/play/topic-tetris/data/topic_tetris.json.

    python analysis/week07_topic_tetris.py   # about 20 seconds (the LDA), plus 2 minutes the first time the vectors are cached
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from scipy.optimize import linear_sum_assignment
from sklearn.cluster import KMeans

sys.path.insert(0, str(Path(__file__).parent))
import stamps  # noqa: E402
import week05_text as t  # noqa: E402
import week06_mix_desk as lda  # noqa: E402
from week07_two_stripes import MAX_WORDS, MODEL, page_vectors, passages  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
COMMUNITIES = ROOT / "public/weeks/week05/data/communities.json"
PORTRAITS = ROOT / "src/kit/portraits.generated.ts"
OUT = ROOT / "public/play/topic-tetris/data/topic_tetris.json"

# The nine pages, in the order they fall every round.
PAGES = [
    "Storm_(Marvel_Comics)",
    "Morbius",
    "Doctor_Strange",
    "Jean_Grey",
    "Human_Torch",
    "Vulcan_(Marvel_Comics)",
    "Deadpool",
    "Quicksilver_(Marvel_Comics)",
    "Union_Jack_(Marvel_Comics)",
]
K_MEANING, SEED = 4, 0
WORDS_SHOWN, CHIPS, ANCHORS, NEAREST, HUBS = 6, 4, 4, 3, 3
MIN_MOVES = 3
LETTERS = "ABC"


def topic_words(beta, vocab, shown):
    """Each shown topic's top words, skipping any word in another shown topic's top list."""
    tops = {k: [int(w) for w in np.argsort(-beta[k])[:40]] for k in shown}
    out = {}
    for k in shown:
        others = {w for j in shown if j != k for w in tops[j][:WORDS_SHOWN * 2]}
        out[k] = [w for w in tops[k] if w not in others][:WORDS_SHOWN]
    return out


def align(prev, groups, assign):
    """Letters for this round's groups: the matching that keeps the most pages with the same letter."""
    overlap = np.array([[sum(prev[p] == a and assign[p] == g for p in PAGES) for g in groups] for a in LETTERS])
    rows, cols = linear_sum_assignment(-overlap)
    return {groups[c]: LETTERS[r] for r, c in zip(rows, cols)}


def first_seen(assign):
    """Round one's letters: A for the first page's group, then in falling order."""
    order = list(dict.fromkeys(assign[p] for p in PAGES))
    return {g: LETTERS[i] for i, g in enumerate(order)}


def main():
    inputs = stamps.Inputs(__file__)
    for path in (t.DATA / "week1_nodes.parquet", t.DATA / "marvel_pages.zip", t.DATA / "week4_edges_weighted.parquet", PORTRAITS):
        inputs.add(path)
    nodes = t.nodes().set_index("node_id")
    names = nodes.name
    with_portrait = set(re.findall(r'"([^"]+)"', PORTRAITS.read_text()))

    # Words: the Week 6 LDA.
    ids, vocab, X, theta, beta = lda.fit()
    row = {node: d for d, node in enumerate(ids)}
    w_assign = {p: int(np.argmax(theta[row[p]])) for p in PAGES}

    # Meaning: the brief's page vectors, k-means.
    text = t.pages()
    V = page_vectors([text[i] for i in ids], fresh=False).astype(np.float64)
    chunks = sum(len(passages(text[i])) for i in ids)
    km = KMeans(K_MEANING, n_init=10, random_state=SEED).fit(V)
    m_assign = {p: int(km.labels_[row[p]]) for p in PAGES}

    # Connections: the Week 5 communities and the weighted links they were found on.
    communities = json.loads(inputs.read(COMMUNITIES))
    membership = communities["membership"]
    graph = t.weighted()
    c_assign = {p: membership[p] for p in PAGES}

    rounds, letters, problems = [], None, []
    for key, assign in (("words", w_assign), ("meaning", m_assign), ("connections", c_assign)):
        groups = sorted(set(assign.values()))
        if len(groups) != 3:
            raise SystemExit(f"{key}: the pages fall in {len(groups)} groups, not 3")
        new = first_seen(assign) if letters is None else align(letters, groups, assign)
        if letters is not None:
            moved = [p for p in PAGES if letters[p] != new[assign[p]]]
            print(f"{key}: {len(moved)} pages move: {', '.join(names[p] for p in moved)}")
            if len(moved) < MIN_MOVES:
                problems.append(f"{key}: only {len(moved)} pages move")
        letters = {p: new[assign[p]] for p in PAGES}
        by_letter = sorted(groups, key=lambda g: new[g])
        rounds.append({"key": key, "groups": by_letter, "letter": new, "assign": assign})

    out_rounds, out_pages = [], {p: {"id": p, "name": names[p], "about": nodes.description[p]} for p in PAGES}

    # Round 1, words.
    r = rounds[0]
    shown = topic_words(beta, vocab, r["groups"])
    listed = {w: i for i, k in enumerate(r["groups"]) for w in shown[k]}
    out_rounds.append({"key": "words", "groups": [
        {"letter": r["letter"][k], "topic": k + 1, "words": [str(vocab[w]) for w in shown[k]]} for k in r["groups"]]})
    for p in PAGES:
        counts = X[row[p]].toarray().ravel()
        chips = sorted(listed, key=lambda w: (-counts[w], vocab[w]))[:CHIPS]
        chips = [w for w in chips if counts[w] > 0]
        score = Counter()
        for w in chips:
            score[listed[w]] += int(counts[w])
        group = r["groups"].index(w_assign[p])
        if not score or score.most_common(1)[0][0] != group or list(score.values()).count(max(score.values())) > 1:
            problems.append(f"words: {names[p]}'s listed words point to {dict(score)}, its topic is group {group}")
        out_pages[p]["words"] = {
            "group": group,
            "share": round(float(theta[row[p], w_assign[p]]), 2),
            "chips": [[str(vocab[w]), int(counts[w]), listed[w]] for w in chips],
        }

    # Round 2, meaning.
    r = rounds[1]
    anchors = []
    for i, k in enumerate(r["groups"]):
        members = [d for d in np.where(km.labels_ == k)[0] if ids[d] not in PAGES and names[ids[d]] in with_portrait]
        picked = []
        for p in PAGES:  # each game page's own closest cluster-mates first
            if m_assign[p] == k:
                mates = sorted(members, key=lambda d: -float(V[d] @ V[row[p]]))[:NEAREST - 1]
                picked += [d for d in mates if d not in picked]
        central = sorted(members, key=lambda d: -float(V[d] @ km.cluster_centers_[k]))
        picked += [d for d in central if d not in picked]
        anchors.append([(ids[d], i) for d in picked[:ANCHORS]])
    out_rounds.append({"key": "meaning", "clusters": K_MEANING, "groups": [
        {"letter": r["letter"][k], "cluster": k + 1, "size": int((km.labels_ == k).sum()),
         "anchors": [names[a] for a, _ in anchors[i]]} for i, k in enumerate(r["groups"])]})
    flat = [a for group in anchors for a in group]
    for p in PAGES:
        sims = sorted(((float(V[row[p]] @ V[row[a]]), a, i) for a, i in flat), reverse=True)[:NEAREST]
        votes = Counter(i for _, _, i in sims)
        group = r["groups"].index(m_assign[p])
        if votes.most_common(1)[0][0] != group or votes[group] < 2:
            problems.append(f"meaning: {names[p]}'s nearest anchors vote {dict(votes)}, its cluster is group {group}")
        out_pages[p]["meaning"] = {"group": group, "near": [[names[a], round(s, 2), i] for s, a, i in sims]}

    # Round 3, connections.
    r = rounds[2]
    labels = {i: c for i, c in enumerate(communities["communities"])}
    out_rounds.append({"key": "connections", "communities": communities["consensus"]["communities"], "groups": [
        {"letter": r["letter"][k], "community": k + 1, "size": labels[k]["size"],
         "hubs": [h["name"] for h in labels[k]["hubs"] if h["node_id"] not in PAGES][:HUBS]}
        for k in r["groups"]]})
    for p in PAGES:
        into = Counter()
        for n, edge in graph[p].items():
            into[membership[n]] += edge["weight"]
        links = [int(into[k]) for k in r["groups"]]
        group = r["groups"].index(c_assign[p])
        if links[group] <= max(x for i, x in enumerate(links) if i != group):
            problems.append(f"connections: {names[p]}'s links {links} do not single out group {group}")
        partners = sorted((n for n in graph[p] if n in PAGES), key=lambda n: (-graph[p][n]["weight"], n))
        out_pages[p]["connections"] = {
            "group": group,
            "links": links,
            "elsewhere": int(sum(into.values()) - sum(links)),
            "partners": [names[n] for n in partners],
        }

    if problems:
        raise SystemExit("checks failed:\n  " + "\n  ".join(problems))
    for p in PAGES:
        print(f"{names[p]:28} " + "  ".join(LETTERS[out_pages[p][k]["group"]] for k in ("words", "meaning", "connections")))

    out = {
        "source": {
            "pages": len(ids),
            "words": f"Week 6's LDA: scikit-learn, {lda.K} topics, random_state {lda.SEED}, names removed",
            "meaning": f"{MODEL}, {MAX_WORDS}-word passages averaged per page ({chunks} passages), "
                       f"k-means with {K_MEANING} clusters, random_state {SEED}",
            "connections": "Week 5's link communities: consensus of 100 Louvain runs on the weighted link network",
            "topics": lda.K,
            "passages": chunks,
        },
        "rounds": out_rounds,
        "pages": [out_pages[p] for p in PAGES],
        **inputs.stamp(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
