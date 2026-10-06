"""Week 5 · Turn links into relationships.

Question: Who are the friends, foes and family in the Marvel network?

Owner: Gyula

Page section: src/app/(week05)/weeks/week05/page.tsx#relations
Output: public/weeks/week05/data/relations.json, every number the section quotes.

Method
- Sentences: each page split into paragraphs at line breaks, each paragraph into
  sentences by spaCy's rule-based sentencizer (spacy.blank("en")). Heading lines
  set the section, and sentences under References, External links, Notes, See
  also and Further reading are dropped: they cite, they do not describe.
- Names: a target page B is found by its title without the disambiguation
  ("Storm (Marvel Comics)" -> "Storm") and by each two-word real name the node
  table's description puts in brackets ("The Abomination (Emil Blonsky)" ->
  "Emil Blonsky"), case-sensitive, as a whole word. A name two or more pages go
  by ("Spider-Woman", "Ghost Rider") is dropped: its sentence cannot say which
  page it means. Pages left with no name get no sentence; the JSON counts them.
- One line per arc: for every link A -> B, the first sentence on A's page that
  names B. Many links come from infoboxes and navigation boxes, which the
  rendered text lost, so some arcs have no sentence; the JSON counts them.
- Labels: a small word list (LEXICON), matched as whole lower-case words on
  that one sentence: a capitalised word is usually part of a name or title
  ("Black Widow", "Doctor Nemesis", "the Royal Family"). A sentence matching
  several labels takes the first in PRIORITY (killed, family, enemy, ally,
  teammate); negation is not handled. The rest are unlabelled.
- Precision: SAMPLE sentences per label, drawn with a fixed seed, read by hand;
  the verdicts sit in analysis/week05_relations_checked.csv with the sentence
  each one judged. The script stops if a sampled arc has no verdict, if its
  sentence differs from the one read, or if a verdict's arc is no longer
  drawn. `--sample` prints the draw.
- Communities: Louvain (week04_staffing.louvain) on weighted(), RUNS seeds
  SEED + i. The partition is unstable (most runs differ), so every number is
  taken over all runs, not one partition.
- Test: each labelled arc's crossing frequency, the share of runs in which its
  two ends sit in different communities; for each label, its arcs' mean
  frequency against SHUFFLES shuffles of the labels over the same arcs (each
  label keeps its count). A stricter null shuffles labels only among the arcs
  that leave the same page, so a page written in hostile words throughout
  cannot carry the result. Both again with one arc per pair of characters, as
  a reciprocal pair (A -> B and B -> A) otherwise counts twice.

Read the corpus and the network only through week05_text.

    python analysis/week05_relations.py            # writes the JSON
    python analysis/week05_relations.py --sample   # prints the sentences to read
"""

import csv
import json
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import spacy

from check_pages import check
from week04_staffing import louvain
from week05_text import graph, nodes, pages, weighted

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "public/weeks/week05/data/relations.json"
CHECKED = Path(__file__).with_name("week05_relations_checked.csv")
SEED = 2805
RUNS = 100
SHUFFLES = 1000
SAMPLE = 12          # sentences read per label
DROP_SECTIONS = {"References", "External links", "Notes", "See also", "Further reading"}
PRIORITY = ["killed", "family", "enemy", "ally", "teammate"]
LEXICON = {
    "killed": ["kill", "kills", "killed", "killing", "murder", "murders", "murdered", "slain", "slay", "slays", "slew"],
    "family": ["married", "marry", "marries", "wife", "husband", "son", "daughter", "father", "mother", "brother",
               "sister", "cousin", "uncle", "aunt", "niece", "nephew", "twin", "parent", "parents", "grandfather",
               "grandmother", "grandson", "granddaughter", "fiance", "fiancé", "fiancée"],
    "enemy": ["enemy", "enemies", "archenemy", "arch-enemy", "archenemies", "nemesis", "foe", "foes", "rival", "rivals",
              "villain", "villains", "battle", "battles", "battled", "fight", "fights", "fought", "defeat",
              "defeats", "defeated", "attack", "attacks", "attacked"],
    "ally": ["ally", "allies", "allied", "friend", "friends", "befriend", "befriends", "befriended", "partner",
             "partners", "sidekick", "mentor", "mentors", "mentored", "lover", "girlfriend", "boyfriend"],
    "teammate": ["team", "teams", "teammate", "teammates", "join", "joins", "joined", "member", "members",
                 "recruit", "recruits", "recruited", "founding"],
}
# Lower case only: a capitalised word is usually part of a name or a title
# ("Black Widow", "Doctor Nemesis", "Marvel Team-Up", "the Royal Family").
WORD = {label: re.compile(r"(?<![\w-])(?:" + "|".join(map(re.escape, words)) + r")(?![\w-])")
        for label, words in LEXICON.items()}


def is_heading(line):
    """A section heading: a short line with no full stop. A short line with a
    bracket is a list entry ("Black Widow (Natasha Romanoff)"), not a heading."""
    return len(line) < 45 and not line.endswith(".") and len(line.split()) <= 6 and "(" not in line


def sentences(text, nlp):
    """[(section, sentence)] in page order, reference sections left out."""
    out, section = [], "Lead"
    for para in text.split("\n"):
        line = para.strip()
        if not line:
            continue
        if is_heading(line):
            section = line
            continue
        if section not in DROP_SECTIONS:
            out.extend((section, s.text.strip()) for s in nlp(line).sents)
    return out


def candidates(row):
    """Every name a page might go by in other pages' text: its title without the
    disambiguation, and each real name the description gives in brackets
    ("The Abomination (Emil Blonsky)"), cleaned of labels ("Earth name: ..."),
    lists ("A or B") and nicknames ("Johnathon "Johnny" Blaze" -> "Johnny Blaze").
    A real name needs two words: a first name alone ("Matt") matches too much."""
    names = {re.sub(r"\s*\(.*?\)\s*$", "", row["name"]).strip()}
    real = re.match(r"^(?:The )?[^()]*\(([^)]*)\)", str(row["description"]))
    if real:
        for part in re.split(r",|;| alias | also known as | or ", real.group(1)):
            part = re.sub(r"^[\w ]+:\s*", "", part.strip()).strip('"').removeprefix("alias ").strip()
            nick = re.match(r'^(\w+) "(\w+)" (.+)$', part)
            if nick:
                part = f"{nick.group(2)} {nick.group(3)}"
            if re.match(r"^[A-Z][\w.'-]+( [A-Z][\w.'-]+)+$", part):
                names.add(part)
    return names


# A disambiguation that only says "this is the comics character": the main page.
GENERIC = {"character", "characters", "comics", "Marvel Comics", "Marvel"}


def name_table(table):
    """{node_id: names, longest first}. A name several pages go by ("Spider-Man"
    for Spider-Man and Spider-Man (Marvel Mangaverse)) goes to the one main page,
    the one whose title has no disambiguation or a generic one, since a sentence
    naming "Spider-Man" means the main character; with no single main page
    ("Johnny Blaze"?) the name is dropped, as the sentence cannot say which."""
    found = {r["node_id"]: candidates(r) for _, r in table.iterrows()}
    title = dict(zip(table.node_id, table.name))
    owners = defaultdict(list)
    for k, names in found.items():
        for n in names:
            owners[n].append(k)

    def main_page(pages):
        plain = [k for k in pages if (m := re.search(r"\(([^)]*)\)\s*$", title[k])) is None or m.group(1) in GENERIC]
        return plain[0] if len(plain) == 1 else None

    keep = {n: ks[0] if len(ks) == 1 else main_page(ks) for n, ks in owners.items()}
    return {k: sorted((n for n in names if keep[n] == k), key=lambda n: (-len(n), n)) for k, names in found.items()}


def label_of(sentence):
    found = [label for label in PRIORITY if WORD[label].search(sentence)]
    return (found[0] if found else "unlabelled"), found


def arcs():
    """One row per arc: its first sentence naming the target, the name matched and the label."""
    nlp = spacy.blank("en")
    nlp.add_pipe("sentencizer")
    text = pages()
    table = nodes()
    names = dict(zip(table.node_id, table.name))
    by_page = {p: sentences(t, nlp) for p, t in sorted(text.items())}
    usable = name_table(table)
    finder = {k: re.compile(r"(?<![\w-])(?:" + "|".join(map(re.escape, v)) + r")(?![\w-])") if v else None
              for k, v in usable.items()}
    rows = []
    for a, b in sorted(graph().edges()):
        hit = None
        if finder[b] is not None:
            hit = next(((sec, s, m) for sec, s in by_page[a] for m in [finder[b].search(s)] if m), None)
        if hit is None:
            rows.append({"source": a, "target": b, "found": False, "nameless": finder[b] is None})
            continue
        section, sentence, match = hit
        label, found = label_of(sentence)
        rows.append({"source": a, "target": b, "found": True, "section": section, "sentence": sentence,
                     "name": match.group(), "start": match.start(), "end": match.end(),
                     "label": label, "labels": found, "source_name": names[a], "target_name": names[b]})
    return rows


def sample(rows):
    """SAMPLE labelled arcs per label, seeded; the ones read by hand."""
    rng = random.Random(SEED)
    picked = {}
    for label in PRIORITY:
        pool = sorted((r for r in rows if r.get("label") == label), key=lambda r: (r["source"], r["target"]))
        picked[label] = rng.sample(pool, min(SAMPLE, len(pool)))
    return picked


def precision(picked):
    verdicts = {}
    with CHECKED.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            verdicts[(row["source"], row["target"], row["label"])] = row
    drawn = {(r["source"], r["target"], label) for label, rows in picked.items() for r in rows}
    stale = sorted(set(verdicts) - drawn)
    if stale:
        raise SystemExit(f"{CHECKED.name} has verdicts the sample no longer draws: {stale}; delete them")
    out, lines = {}, []
    for label, rows in picked.items():
        read = [verdicts.get((r["source"], r["target"], label)) for r in rows]
        missing = [(r["source"], r["target"]) for r, v in zip(rows, read) if v is None]
        if missing:
            raise SystemExit(f"{CHECKED.name} has no verdict for {label}: {missing}; run --sample and read them")
        # A verdict holds for the sentence that was read. The same arc can draw
        # another sentence after a change to the corpus or the matching.
        changed = [(r["source"], r["target"]) for r, v in zip(rows, read) if v["sentence"] != r["sentence"]]
        if changed:
            raise SystemExit(f"{CHECKED.name}: the {label} sentence changed for {changed}; read the new one")
        right = sum(v["verdict"] == "right" for v in read)
        out[label] = {"read": len(read), "right": right, "share": round(right / len(read), 3),
                      "wrong_examples": [{"source": v["source"], "target": v["target"], "note": v["note"]}
                                         for v in read if v["verdict"] != "right"][:3]}
        for r, v in zip(rows, read):
            s = r["sentence"]
            lines.append({"label": label, "page": r["source"], "target": r["target"], "left": s[:r["start"]],
                          "hit": s[r["start"]:r["end"]], "right": s[r["end"]:], "verdict": v["verdict"],
                          "note": v["note"]})
    return out, lines


def test(freq, labels, groups, rng):
    """Each label's mean crossing frequency against SHUFFLES shuffles of the
    labels over the same arcs, globally and within each source page's arcs."""
    null, local = defaultdict(list), defaultdict(list)
    for _ in range(SHUFFLES):
        perm = rng.permutation(labels)
        within = labels.copy()
        for idx in groups:
            within[idx] = rng.permutation(labels[idx])
        for label in PRIORITY:
            null[label].append(float(freq[perm == label].mean()))
            local[label].append(float(freq[within == label].mean()))
    out = []
    for label in PRIORITY:
        r = float(freq[labels == label].mean())
        n, w = np.array(null[label]), np.array(local[label])
        out.append({"label": label, "arcs": int((labels == label).sum()), "crossing": round(r, 4),
                    "null_mean": round(float(n.mean()), 4), "null_sd": round(float(n.std()), 4),
                    "z": round((r - n.mean()) / n.std(), 2),
                    "p_above": round(float(((n >= r).sum() + 1) / (len(n) + 1)), 4),
                    "p_below": round(float(((n <= r).sum() + 1) / (len(n) + 1)), 4),
                    "within_page_mean": round(float(w.mean()), 4), "within_page_sd": round(float(w.std()), 4),
                    "within_page_z": round((r - w.mean()) / w.std(), 2) if w.std() else None})
    return out


def main():
    rows = arcs()
    picked = sample(rows)
    if "--sample" in sys.argv:
        for label, chosen in picked.items():
            print(f"\n== {label}")
            for r in chosen:
                print(f"{r['source']} -> {r['target']} [{r['name']}] {r['sentence']}")
        return 0
    checked, lines = precision(picked)

    labelled = [r for r in rows if r.get("label") not in (None, "unlabelled")]
    arc_pairs = [(r["source"], r["target"]) for r in labelled]
    labels = np.array([r["label"] for r in labelled])
    sources = np.array([r["source"] for r in labelled])
    gw = weighted()
    partitions = [louvain(gw, SEED + i) for i in range(RUNS)]
    members = [{n: k for k, part in enumerate(parts) for n in part} for parts, _ in partitions]

    # How often each arc joins two communities, over all the runs: the runs
    # disagree, so the test shuffles labels over these frequencies, which is
    # the same average the real share takes.
    freq = np.array([[m[a] != m[b] for a, b in arc_pairs] for m in members]).mean(axis=0)
    groups = [np.flatnonzero(sources == s) for s in sorted(set(sources))]
    crossing = test(freq, labels, groups, np.random.default_rng(SEED))
    # A reciprocal pair (A -> B and B -> A) counts twice above; keep one arc per
    # pair of characters, the first in sorted order, and test again.
    first = {}
    for i, (a, b) in enumerate(arc_pairs):
        first.setdefault(tuple(sorted((a, b))), i)
    keep = np.array(sorted(first.values()))
    one_per_pair = test(freq[keep], labels[keep], [np.flatnonzero(sources[keep] == s) for s in sorted(set(sources[keep]))],
                        np.random.default_rng(SEED))

    counts = Counter(r.get("label") for r in rows if r["found"])
    found = sum(r["found"] for r in rows)
    q = [parts for parts, _ in partitions]
    out = {
        "meta": {"script": "analysis/week05_relations.py", "owner": "Gyula",
                 "sentences": "paragraphs at line breaks, then spaCy's rule-based sentencizer; "
                              "reference sections dropped",
                 "names": "title without disambiguation, plus the two-word real names in the node description; "
                          "names shared by two or more pages dropped",
                 "labels": "first match in PRIORITY order, whole lower-case words",
                 "priority": PRIORITY, "lexicon": LEXICON, "runs": RUNS, "shuffles": SHUFFLES, "sample": SAMPLE},
        "coverage": {"arcs": len(rows), "with_sentence": found, "share": round(found / len(rows), 4),
                     "nameless_targets": sum(1 for v in name_table(nodes()).values() if not v),
                     "arcs_to_nameless": sum(r.get("nameless", False) for r in rows),
                     "multi_label": sum(len(r.get("labels", [])) > 1 for r in rows)},
        "labels": [{"label": label, "arcs": counts[label], "share": round(counts[label] / found, 4)}
                   for label in PRIORITY + ["unlabelled"]],
        "precision": checked,
        "communities": {"runs": RUNS, "median_count": int(np.median([len(p) for p in q])),
                        "modularity_mean": round(float(np.mean([m for _, m in partitions])), 4)},
        "crossing": crossing,
        "one_per_pair": {"arcs": int(len(keep)), "crossing": one_per_pair},
        # The sentences read by hand for the precision check, with the verdicts.
        "concordance": lines,
    }
    check(PAGE, out)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: out[k] for k in ("coverage", "labels", "precision", "communities", "crossing")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
