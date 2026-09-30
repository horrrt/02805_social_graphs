"""Week 5 · Turn links into relationships.

Question: Who are the friends, foes and family in the Marvel network?

Owner: Gyula

Page section: docs/weeks/week05/index.html#relations
Output: docs/weeks/week05/data/relations.json, every number the section quotes.

Method
- Sentences: each page split into paragraphs at line breaks, each paragraph into
  sentences by spaCy's rule-based sentencizer (spacy.blank("en")). Heading lines
  set the section, and sentences under References, External links, Notes, See
  also and Further reading are dropped: they cite, they do not describe.
- Names: a target page B is found by its title without the disambiguation
  ("Storm (Marvel Comics)" -> "Storm") and by the real name the node table's
  description puts in parentheses ("The Abomination (Emil Blonsky)" -> "Emil
  Blonsky"), case-sensitive, as a whole word.
- One line per arc: for every link A -> B, the first sentence on A's page that
  names B. Many links come from infoboxes and navigation boxes, which the
  rendered text lost, so some arcs have no sentence; the JSON counts them.
- Labels: a small word list (LEXICON), matched as whole lower-case words on
  that one sentence after every character's name is blanked out: a first
  reading found names supplying the words ("Black Widow", "Doctor Nemesis",
  "the Royal Family"). A sentence matching several labels takes the first in
  PRIORITY (killed, family, enemy, ally, teammate); negation is not handled.
  The rest are unlabelled.
- Precision: SAMPLE sentences per label, drawn with a fixed seed, read by hand;
  the verdicts sit in analysis/week05_relations_checked.csv and the script
  stops if any sampled arc has no verdict. `--sample` prints the draw.
- Communities: Louvain (week04_staffing.louvain) on weighted(), RUNS seeds
  SEED + i. The partition is unstable (most runs differ), so every number is
  taken over all runs, not one partition.
- Test: for each label, the share of its labelled arcs whose two ends sit in
  different communities, averaged over the runs, against SHUFFLES shuffles of
  the labels over the labelled arcs (each label keeps its count). A stricter
  null shuffles labels only among the arcs that leave the same page, so a
  page written in hostile words throughout cannot carry the result.

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
PAGE = ROOT / "docs/weeks/week05/data/relations.json"
CHECKED = Path(__file__).with_name("week05_relations_checked.csv")
SEED = 2805
RUNS = 100
SHUFFLES = 1000
SAMPLE = 12          # sentences read per label
CONCORDANCE = 8      # lines per label on the page
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
    return len(line) < 45 and not line.endswith(".") and len(line.split()) <= 6


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


def variants(row):
    """The names a page goes by in other pages' text, longest first."""
    names = {re.sub(r"\s*\(.*?\)\s*$", "", row["name"]).strip()}
    real = re.match(r"^(?:The )?[^()]*\(([^)]*)\)", str(row["description"]))
    if real:
        for part in re.split(r",|;| alias | also known as ", real.group(1)):
            part = part.strip().strip('"').removeprefix("alias ").strip()
            if len(part) >= 4 and part[0].isupper():
                names.add(part)
    return sorted(names, key=lambda n: (-len(n), n))


def label_of(sentence, names):
    """The label of a sentence, read with every character name blanked out
    (`names` matches them), so a name never supplies the word."""
    masked = names.sub(" ", sentence)
    found = [label for label in PRIORITY if WORD[label].search(masked)]
    return (found[0] if found else "unlabelled"), found


def arcs():
    """One row per arc: its first sentence naming the target, the name matched and the label."""
    nlp = spacy.blank("en")
    nlp.add_pipe("sentencizer")
    text = pages()
    table = nodes()
    names = dict(zip(table.node_id, table.name))
    by_page = {p: sentences(t, nlp) for p, t in sorted(text.items())}
    finder = {r["node_id"]: re.compile(r"(?<![\w-])(?:" + "|".join(map(re.escape, variants(r))) + r")(?![\w-])")
              for _, r in table.iterrows()}
    every = sorted({v for _, r in table.iterrows() for v in variants(r)}, key=lambda n: (-len(n), n))
    all_names = re.compile(r"(?<![\w-])(?:" + "|".join(map(re.escape, every)) + r")(?![\w-])")
    rows = []
    for a, b in sorted(graph().edges()):
        hit = next(((sec, s, m) for sec, s in by_page[a] for m in [finder[b].search(s)] if m), None)
        if hit is None:
            rows.append({"source": a, "target": b, "found": False})
            continue
        section, sentence, match = hit
        label, found = label_of(sentence, all_names)
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
    out = {}
    for label, rows in picked.items():
        read = [verdicts.get((r["source"], r["target"], label)) for r in rows]
        missing = [(r["source"], r["target"]) for r, v in zip(rows, read) if v is None]
        if missing:
            raise SystemExit(f"{CHECKED.name} has no verdict for {label}: {missing}; run --sample and read them")
        right = sum(v["verdict"] == "right" for v in read)
        out[label] = {"read": len(read), "right": right, "share": round(right / len(read), 3),
                      "wrong_examples": [{"source": v["source"], "target": v["target"], "note": v["note"]}
                                         for v in read if v["verdict"] != "right"][:3]}
    return out


def crossing(arc_pairs, labels, member):
    """Share of arcs crossing communities, per label, for one partition."""
    cross = np.array([member[a] != member[b] for a, b in arc_pairs])
    return {label: float(cross[labels == label].mean()) for label in PRIORITY}


def main():
    rows = arcs()
    picked = sample(rows)
    if "--sample" in sys.argv:
        for label, chosen in picked.items():
            print(f"\n== {label}")
            for r in chosen:
                print(f"{r['source']} -> {r['target']} [{r['name']}] {r['sentence']}")
        return 0
    checked = precision(picked)

    labelled = [r for r in rows if r.get("label") not in (None, "unlabelled")]
    arc_pairs = [(r["source"], r["target"]) for r in labelled]
    labels = np.array([r["label"] for r in labelled])
    sources = np.array([r["source"] for r in labelled])
    gw = weighted()
    partitions = [louvain(gw, SEED + i) for i in range(RUNS)]
    members = [{n: k for k, part in enumerate(parts) for n in part} for parts, _ in partitions]

    rng = np.random.default_rng(SEED)
    groups = [np.flatnonzero(sources == s) for s in sorted(set(sources))]
    real = defaultdict(list)
    shuffled = defaultdict(list)
    within = defaultdict(list)
    for member in members:
        for label, share in crossing(arc_pairs, labels, member).items():
            real[label].append(share)
        cross = np.array([member[a] != member[b] for a, b in arc_pairs])
        for _ in range(SHUFFLES // RUNS):
            perm = rng.permutation(labels)
            local = labels.copy()
            for idx in groups:
                local[idx] = rng.permutation(labels[idx])
            for label in PRIORITY:
                shuffled[label].append(float(cross[perm == label].mean()))
                within[label].append(float(cross[local == label].mean()))

    def compare(label):
        r = float(np.mean(real[label]))
        null = np.array(shuffled[label])
        page = np.array(within[label])
        return {"label": label, "arcs": int((labels == label).sum()), "crossing": round(r, 4),
                "crossing_sd_runs": round(float(np.std(real[label])), 4),
                "null_mean": round(float(null.mean()), 4), "null_sd": round(float(null.std()), 4),
                "z": round((r - null.mean()) / null.std(), 2),
                "p_above": round(float(((null >= r).sum() + 1) / (len(null) + 1)), 4),
                "p_below": round(float(((null <= r).sum() + 1) / (len(null) + 1)), 4),
                "within_page_mean": round(float(page.mean()), 4), "within_page_sd": round(float(page.std()), 4),
                "within_page_z": round((r - page.mean()) / page.std(), 2) if page.std() else None}

    counts = Counter(r.get("label") for r in rows if r["found"])
    found = sum(r["found"] for r in rows)
    concordance = []
    for label in PRIORITY + ["unlabelled"]:
        pool = sorted((r for r in rows if r.get("label") == label), key=lambda r: (r["source"], r["target"]))
        for r in random.Random(f"{SEED}-{label}").sample(pool, min(CONCORDANCE, len(pool))):
            s = r["sentence"]
            concordance.append({"label": label, "page": r["source"], "target": r["target"],
                                "left": s[:r["start"]], "hit": s[r["start"]:r["end"]], "right": s[r["end"]:]})
    q = [parts for parts, _ in partitions]
    out = {
        "meta": {"script": "analysis/week05_relations.py", "owner": "Gyula",
                 "sentences": "paragraphs at line breaks, then spaCy's rule-based sentencizer; "
                              "reference sections dropped",
                 "names": "title without disambiguation, plus the real name in the node description",
                 "labels": "first match in PRIORITY order, whole lower-case words, character names blanked out",
                 "priority": PRIORITY, "lexicon": LEXICON, "runs": RUNS, "shuffles": SHUFFLES, "sample": SAMPLE},
        "coverage": {"arcs": len(rows), "with_sentence": found, "share": round(found / len(rows), 4),
                     "multi_label": sum(len(r.get("labels", [])) > 1 for r in rows)},
        "labels": [{"label": label, "arcs": counts[label], "share": round(counts[label] / found, 4)}
                   for label in PRIORITY + ["unlabelled"]],
        "precision": checked,
        "communities": {"runs": RUNS, "median_count": int(np.median([len(p) for p in q])),
                        "modularity_mean": round(float(np.mean([m for _, m in partitions])), 4)},
        "crossing": [compare(label) for label in PRIORITY],
        "concordance": concordance,
    }
    check(PAGE, out)
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: out[k] for k in ("coverage", "labels", "precision", "communities", "crossing")}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
