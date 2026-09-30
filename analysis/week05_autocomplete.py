"""Week 5 · Community autocomplete.

Question: Can someone who has not seen the pages tell which community a fake
page came from?

Owner: Àngela
Page section: docs/weeks/week05/index.html#autocomplete
Output: docs/weeks/week05/data/autocomplete.json

Train one trigram generator per community of at least MIN_COMMUNITY_SIZE pages
(the consensus groups from week05_communities.py, plus any component outside
the giant that is large enough) and write one fake page for a new character in
each. A trigram model estimates P(w3 | w1, w2) from counts: the next word given
the two before it, which is next-token prediction with a two-word window.

Two versions of every model: one trained on the text as it is, one with every
character's name replaced by a placeholder, so a guess cannot rest on spotting
a member's name. The quiz shows the masked fakes.

For each fake the script measures the longest run of words it copies verbatim
from its community's pages, and where that run comes from, and the share of
two-word contexts that have only one continuation (the sparsity that makes a
trigram generator copy).

Guesses from other groups are read from analysis/week05_autocomplete_guesses.csv
(columns: group, fake_id, guess, collected_on) once they exist; until then the
guessing block stays empty.

    python analysis/week05_communities.py   # first
    python analysis/week05_autocomplete.py
"""

from __future__ import annotations

import csv
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

from check_pages import check
from week05_relations import DROP_SECTIONS, is_heading, variants
from week05_text import WORD, WORD_RULE, nodes, pages, sentences, words

ROOT = Path(__file__).resolve().parents[1]
COMM = ROOT / "docs" / "weeks" / "week05" / "data" / "communities.json"
OUT = ROOT / "docs" / "weeks" / "week05" / "data" / "autocomplete.json"
GUESSES = Path(__file__).with_name("week05_autocomplete_guesses.csv")

SEED = 2805
MIN_COMMUNITY_SIZE = 8
N_SENTENCES = 5
CAP = 40  # a sentence that reaches this many words without ending is redrawn, never cut
FAKE_CHARS = [
    "Aetherion",
    "Cobalt Warden",
    "Nyxara",
    "Quillstrike",
    "Iron Hearth",
    "Velvet Specter",
    "Stormglass",
    "Ashen Circuit",
    "Hollow Lark",
]
# The one hand-written sentence of every fake; the generator writes the rest.
TEMPLATE = "{} is a character appearing in American comic books published by Marvel Comics."
START = "<s>"
END = "</s>"
MASK = "xnamex"  # letters only, so the word rule keeps it; never occurs in the corpus
SHOWN_MASK = "[name]"
MONTHS = {"january", "february", "march", "april", "may", "june", "july", "august", "september",
          "october", "november", "december"}


# ---- text to tokens ------------------------------------------------------------


def spans(sentence: str) -> list[tuple[str, str, int, int]]:
    """(word, word as written, start, end) under WORD_RULE, with character
    offsets into the sentence so a copied run can be quoted from the source."""
    out = []
    for m in WORD.finditer(sentence):
        raw = m.group()
        for tail in ("'s", "’s"):
            if raw.lower().endswith(tail) and len(raw) > len(tail):
                raw = raw[: -len(tail)]
        out.append((raw.lower(), raw, m.start(), m.start() + len(raw)))
    return out


def name_index() -> dict[str, list[tuple[str, ...]]]:
    """Every node's names (title without disambiguation, and the real names in
    its description), as case-kept word tuples keyed by their first word,
    longest first."""
    index = defaultdict(set)
    for _, row in nodes().iterrows():
        for name in variants(row):
            toks = tuple(raw for _, raw, _, _ in spans(name))
            if toks:
                index[toks[0]].add(toks)
    return {k: sorted(v, key=lambda t: (-len(t), t)) for k, v in index.items()}


def mask(toks: list[tuple[str, str, int, int]], names: dict) -> list[tuple[str, int, int]]:
    """Replace each name, matched case-sensitively as whole words, by MASK.
    Case-sensitive so "Storm" goes and "storm" stays."""
    out, i = [], 0
    while i < len(toks):
        for name in names.get(toks[i][1], ()):
            if tuple(t[1] for t in toks[i : i + len(name)]) == name:
                out.append((MASK, toks[i][2], toks[i + len(name) - 1][3]))
                i += len(name)
                break
        else:
            out.append((toks[i][0], toks[i][2], toks[i][3]))
            i += 1
    return out


def corpus(text: dict[str, str], names: dict) -> list[dict]:
    """Sentences of every page, headings and reference sections dropped."""
    out = []
    for page in sorted(text):
        section = "Lead"
        for line in text[page].split("\n"):
            line = line.strip()
            if not line:
                continue
            if is_heading(line):
                section = line
                continue
            if section in DROP_SECTIONS:
                continue
            for s in sentences(line):
                toks = spans(s)
                if not toks:
                    continue
                # The same words as words(s), whose lowercasing changes the
                # length of a few letters (İ in İzmir); those pages differ there only.
                assert len(s.lower()) != len(s) or [t[0] for t in toks] == words(s), s
                out.append(
                    {
                        "page": page,
                        "text": s,
                        "plain": [(t[0], t[2], t[3]) for t in toks],
                        "masked": mask(toks, names),
                    }
                )
    return out


# ---- the trigram model -----------------------------------------------------------


def train(sents: list[list[str]]) -> dict[tuple[str, str], Counter]:
    model: dict[tuple[str, str], Counter] = defaultdict(Counter)
    for toks in sents:
        padded = [START, START, *toks, END]
        for i in range(len(padded) - 2):
            model[(padded[i], padded[i + 1])][padded[i + 2]] += 1
    return model


def generate(model, rng: random.Random, n: int) -> tuple[list[list[str]], int, int, int]:
    """n sentences by ancestral sampling from START. Every context the walk
    reaches was seen in training, so no backoff is needed. Returns the
    sentences, the redraws (sentences that hit CAP), and how many of the words
    kept had a single candidate, out of all words kept."""
    out, redrawn, forced, steps = [], 0, 0, 0
    while len(out) < n:
        prev, toks, s_forced = (START, START), [], 0
        while len(toks) < CAP:
            choices = model[prev]
            words_, weights = zip(*sorted(choices.items()))  # stable order before the draw
            nxt = rng.choices(words_, weights=weights, k=1)[0]
            if nxt == END:
                break
            s_forced += len(choices) == 1
            toks.append(nxt)
            prev = (prev[1], nxt)
        else:
            redrawn += 1
            continue
        out.append(toks)
        forced += s_forced
        steps += len(toks)
    return out, redrawn, forced, steps


def one_continuation(model) -> float:
    return sum(len(c) == 1 for c in model.values()) / len(model)


def bigram_one_continuation(sents: list[list[str]]) -> float:
    """The same share for one-word contexts: P(w2 | w1) summed over w0."""
    follow = defaultdict(set)
    for toks in sents:
        padded = [START, *toks, END]
        for a, b in zip(padded, padded[1:]):
            follow[a].add(b)
    return sum(len(v) == 1 for v in follow.values()) / len(follow)


def render(sents: list[list[str]]) -> str:
    out = []
    for toks in sents:
        s = " ".join(SHOWN_MASK if t == MASK else t for t in toks)
        out.append(s[0].upper() + s[1:] + ".")
    return " ".join(out)


def longest_run(fake: list[list[str]], docs: list[dict], key: str) -> dict:
    """The longest run of words in one generated sentence that also appears,
    word for word, inside one training sentence; its source and its reach."""
    at = defaultdict(list)
    for d, doc in enumerate(docs):
        toks = [t[0] for t in doc[key]]
        for p in range(len(toks) - 2):
            at[tuple(toks[p : p + 3])].append((d, p))
    best = (0, 0, 0, 0, 0)  # length, fake sentence, start, doc, position
    for f, toks in enumerate(fake):
        for i in range(len(toks) - 2):
            for d, p in at.get(tuple(toks[i : i + 3]), ()):
                src = docs[d][key]
                k = 3
                while i + k < len(toks) and p + k < len(src) and src[p + k][0] == toks[i + k]:
                    k += 1
                if k > best[0]:
                    best = (k, f, i, d, p)
    k, f, i, d, p = best
    run = fake[f][i : i + k]
    reach = sorted(
        {
            docs[e]["page"]
            for e, q in at.get(tuple(run[:3]), ())
            if [t[0] for t in docs[e][key][q : q + k]] == run
        }
    )
    src = docs[d]
    start, end = src[key][p][1], src[key][p + k - 1][2]
    return {
        "length": k,
        "sentence_length": len(fake[f]),
        "run": " ".join(SHOWN_MASK if t == MASK else t for t in run),
        "page": src["page"],
        "sentence": src["text"],
        "highlight": src["text"][start:end],
        "pages_with_run": len(reach),
    }


def typical_phrases(model, others, k: int = 6) -> list[str]:
    """Word pairs frequent in this community's pages and rare in the others'.
    Scored on the whole table, not on the fake."""
    scores = []
    for pair, counter in model.items():
        if {START, END, MASK} & set(pair):
            continue
        here = sum(counter.values())
        if here < 3:
            continue
        elsewhere = sum(sum(m[pair].values()) for m in others if pair in m)
        scores.append((here / (1 + elsewhere), here, " ".join(pair)))
    scores.sort(key=lambda t: (-t[0], -t[1], t[2]))
    return [phrase for *_, phrase in scores[:k]]


def name_like(docs: list[dict]) -> set[str]:
    """Words the mask leaves that still read as names: capitalised in at least
    90% of their (two or more) appearances away from a sentence's first word.
    Other characters (Rick Jones), surnames alone (Cage) and team names; month
    names and one-letter words (I, the M of M.D.) do not count."""
    caps, seen = Counter(), Counter()
    for d in docs:
        for word, start, end in d["masked"][1:]:
            if word != MASK:
                seen[word] += 1
                caps[word] += d["text"][start].isupper()
    return {w for w, n in seen.items() if n >= 2 and caps[w] >= 0.9 * n and len(w) > 1 and w not in MONTHS}


def names_in(fake: list[list[str]], members: list[str], table) -> list[str]:
    """Names of the community's own members that the fake spells out."""
    text = " " + " ".join(" ".join(t) for t in fake) + " "
    found = []
    for _, row in table[table.node_id.isin(members)].iterrows():
        for name in variants(row):
            low = " ".join(words(name))
            if low and f" {low} " in text:
                found.append(name)
    return sorted(set(found))


# ---- guesses from other groups ---------------------------------------------------


def guessing(fakes: list[dict], k: int) -> dict:
    answer = {f["id"]: f["community_index"] for f in fakes}
    rows = []
    if GUESSES.exists():
        with GUESSES.open(encoding="utf-8") as fh:
            rows = sorted(csv.DictReader(fh), key=lambda r: (r["group"], r["fake_id"]))
    for r in rows:
        assert r["fake_id"] in answer, f"unknown fake {r['fake_id']}"
    n = len(rows)
    correct = sum(answer[r["fake_id"]] == int(r["guess"]) for r in rows)
    p_value = None
    if n:
        from scipy.stats import binomtest

        p_value = round(float(binomtest(correct, n, 1 / k, alternative="greater").pvalue), 4)
    return {
        "status": "collected" if n else "awaiting_other_groups",
        "n_groups": len({r["group"] for r in rows}),
        "n_responses": n,
        "n_correct": correct,
        "hit_rate": round(correct / n, 4) if n else None,
        "chance_rate": round(1 / k, 4),
        "p_value": p_value,
        "collected_on": max(r["collected_on"] for r in rows) if n else None,
        "channel": "the week 5 Teams channel",
    }


def main() -> int:
    if not COMM.exists():
        raise SystemExit("run analysis/week05_communities.py first")
    communities = json.loads(COMM.read_text(encoding="utf-8"))
    table = nodes()
    names = name_index()
    text = pages()
    docs = corpus(text, names)
    assert not any(t[0] == MASK for d in docs for t in d["plain"]), "the placeholder occurs in the corpus"

    usable = [
        (i, c) for i, c in enumerate(communities["communities"]) if c["size"] >= MIN_COMMUNITY_SIZE
    ]
    left_out = [c for c in communities["communities"] if c["size"] < MIN_COMMUNITY_SIZE]
    k = len(usable)
    assert len(FAKE_CHARS) >= k, "add a fake character name"

    by_comm = [[d for d in docs if d["page"] in set(c["members"])] for _, c in usable]
    masked = [train([[t[0] for t in d["masked"]] for d in ds]) for ds in by_comm]
    plain = [train([[t[0] for t in d["plain"]] for d in ds]) for ds in by_comm]

    fakes, meta = [], []
    for idx, (i, c) in enumerate(usable):
        ds = by_comm[idx]
        m_sents = [[t[0] for t in d["masked"]] for d in ds]
        fake_m, redrawn_m, forced_m, steps_m = generate(masked[idx], random.Random(SEED + 1000 + i), N_SENTENCES)
        fake_p, redrawn_p, _, _ = generate(plain[idx], random.Random(SEED + 2000 + i), N_SENTENCES)
        char = FAKE_CHARS[idx]
        run_m = longest_run(fake_m, ds, "masked")
        run_p = longest_run(fake_p, ds, "plain")
        meta.append(
            {
                "community_index": i,
                "label": c["label"],
                "size": c["size"],
                "where": c["where"],
                "hubs": [h["name"] for h in c["hubs"][:3]],
                "n_sentences": len(ds),
                "n_tokens": sum(len(s) for s in m_sents),
                "n_contexts": len(masked[idx]),
                "one_continuation": round(one_continuation(masked[idx]), 4),
                "bigram_one_continuation": round(bigram_one_continuation(m_sents), 4),
            }
        )
        proper = name_like(ds)
        fakes.append(
            {
                "id": f"fake-{idx}",
                "character": char,
                "community_index": i,
                "community_label": c["label"],
                "hubs": [h["name"] for h in c["hubs"][:3]],
                "size": c["size"],
                "text": f"{TEMPLATE.format(char)} {render(fake_m)}",
                "text_unmasked": f"{TEMPLATE.format(char)} {render(fake_p)}",
                "typical_phrases": typical_phrases(masked[idx], [m for j, m in enumerate(masked) if j != idx]),
                "longest_run": run_m,
                "longest_run_unmasked": run_p,
                "forced_steps": forced_m,
                "steps": steps_m,
                "redrawn": redrawn_m,
                "name_like": sorted({t for s in fake_m for t in s if t in proper}),
                "own_names": names_in(fake_m, c["members"], table),
                "own_names_unmasked": names_in(fake_p, c["members"], table),
            }
        )

    for f in fakes:
        for run in (f["longest_run"], f["longest_run_unmasked"]):
            assert run["sentence"] in text[run["page"]], run["page"]
            assert run["highlight"] in run["sentence"]

    # Display order shuffled with a fixed seed; the answers stay in community fields.
    order = list(range(len(fakes)))
    random.Random(SEED).shuffle(order)
    display = [fakes[j] for j in order]
    for n, f in enumerate(display, 1):
        f["number"] = n

    # "What we checked": the fake whose longest copied run is longest among runs
    # that come from a single page, so the run has one source to quote.
    single = [f for f in display if f["longest_run"]["pages_with_run"] == 1]
    example = max(single, key=lambda f: (f["longest_run"]["length"], -f["number"]))

    runs = [f["longest_run"]["length"] for f in display]
    one = [m["one_continuation"] for m in meta]
    two = [m["bigram_one_continuation"] for m in meta]
    payload = {
        "generated_by": "analysis/week05_autocomplete.py",
        "owner": "Àngela",
        "seed": SEED,
        "tokenisation": {
            "sentences": "week05_text.sentences(): paragraphs at line breaks, then spaCy's rule-based sentencizer",
            "dropped": "heading lines (under 45 characters, no full stop, six words or fewer) and every sentence under "
                       + ", ".join(sorted(DROP_SECTIONS)),
            "words": WORD_RULE,
            "names": "every node's title without disambiguation and each real name in its description, matched "
                     f"case-sensitively as whole words, replaced by {SHOWN_MASK} in the masked models",
            "model": "trigram: P(w3 | w1, w2) from counts inside one community, sentences padded with <s> <s> and </s>; "
                     "no smoothing and no backoff, since sampling only reaches contexts seen in training",
            "generation": f"{N_SENTENCES} sentences sampled word by word from <s> <s> until </s>; a sentence that "
                          f"reaches {CAP} words is thrown away and redrawn",
            "template": TEMPLATE.format("NAME") + " (hand-written first sentence)",
            "sentences_per_fake": N_SENTENCES,
            "cap": CAP,
            "min_community_size": MIN_COMMUNITY_SIZE,
        },
        "communities_used": meta,
        "left_out": {
            "groups": len(left_out),
            "pages": sum(c["size"] for c in left_out),
            "largest": max((c["size"] for c in left_out), default=0),
        },
        "n_fakes": len(display),
        "chance_rate": round(1 / k, 4),
        "quiz_variant": "masked",
        "guessing": guessing(display, k),
        "options": [
            {"community_index": m["community_index"], "label": m["label"], "hubs": m["hubs"], "size": m["size"]}
            for m in meta
        ],
        "fakes": display,
        "summary": {
            "one_continuation_min": min(one),
            "one_continuation_max": max(one),
            "bigram_one_continuation_min": min(two),
            "bigram_one_continuation_max": max(two),
            "run_min": min(runs),
            "run_max": max(runs),
            "runs_single_page": sum(f["longest_run"]["pages_with_run"] == 1 for f in display),
            "forced_share": round(sum(f["forced_steps"] for f in display) / sum(f["steps"] for f in display), 4),
            "redrawn": sum(f["redrawn"] for f in display),
            "own_names_unmasked": sum(bool(f["own_names_unmasked"]) for f in display),
            "own_names_masked": sum(bool(f["own_names"]) for f in display),
            "name_like_fakes": sum(bool(f["name_like"]) for f in display),
            "example": example["id"],
        },
        "partition": {
            "runs": communities["runs"],
            "giant_nodes": communities["network"]["giant_nodes"],
            "nodes": communities["network"]["nodes"],
            "isolates": communities["network"]["isolates"],
            "other_component_nodes": communities["network"]["other_component_nodes"],
            "communities_in_giant": communities["consensus"]["communities"],
            "consensus_threshold": communities["consensus"]["threshold"],
            "consensus_seeds_agreeing": communities["consensus"]["seeds_agreeing"],
            "consensus_modularity": communities["consensus"]["modularity"],
            "mode_count": communities["louvain"]["mode_count"],
            "distinct_partitions": communities["louvain"]["distinct_partitions"],
            "common_k": communities["louvain"]["common_k"],
            "common_k_runs": communities["louvain"]["common_k_runs"],
            "nmi_median": communities["louvain"]["nmi_median"],
            "nmi_p05": communities["louvain"]["nmi_p05"],
            "nmi_p95": communities["louvain"]["nmi_p95"],
            "modularity_mean": communities["louvain"]["modularity_mean"],
            "modularity_sd": communities["louvain"]["modularity_sd"],
            "null_mean": communities["null"]["modularity_mean"],
            "null_sd": communities["null"]["modularity_sd"],
            "null_z": communities["null"]["z"],
            "null_runs": communities["null_runs"],
            "null_method": communities["null"]["method"],
        },
        "communities_source": "docs/weeks/week05/data/communities.json",
    }

    check(OUT, payload)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    s = payload["summary"]
    print(
        f"wrote {OUT.relative_to(ROOT)}: {len(display)} fakes from {k} communities; "
        f"one continuation {s['one_continuation_min']:.0%}-{s['one_continuation_max']:.0%} of two-word contexts; "
        f"longest runs {s['run_min']}-{s['run_max']} words; own names {s['own_names_unmasked']} unmasked, "
        f"{s['own_names_masked']} masked; guessing {payload['guessing']['status']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
