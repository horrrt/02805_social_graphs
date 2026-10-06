"""Week 5 · Does network fame buy you more words?

Question: Do more-linked characters get longer pages, and why do the pages far
from that relationship sit where they do?

Owner: Niklas

Page section: src/app/(week05)/weeks/week05/page.tsx#fame
Output: public/weeks/week05/data/fame.json (and the same file beside this script),
every number the section quotes, validated with check() before it is written.

Method
- Length: the number of words on a page under week05_text.words() (WORD_RULE,
  the rule sections 5, 6 and 7 share).
- Network: in-degree in week05_text.graph(), the 1,784 links among the 303
  pages. A link from outside these 303 pages does not count.
- Fit: ordinary least squares of ln(words) on ln(1 + in-degree), all 303 pages,
  isolates included (1 + keeps the 58 pages nobody links to). A residual is in
  natural-log units: exp(residual) is how many times the predicted length a
  page is. Pearson on the two logs, Spearman on the raw counts.
- Baseline: SHUFFLES shuffles of in-degree over the pages (seed SEED); the
  real Pearson against the shuffled ones, with a permutation p-value.
- Second measures: Spearman of length with out-degree and with PageRank.
- Outliers: the TOP pages with the largest residuals and the TOP with the
  smallest. For each we measured what could explain its gap:
  - isolate: no link in or out;
  - mentions against links: how many other pages name it (its title without
    the disambiguation and the real name in its node description, the name
    rule of section 1, week05_relations.name_table()) and how many of those link
    to it;
  - hub page: its first sentence says several characters share its title
    (week05_text.shared_name(), as in section 7), a page
    for a shared codename, short by design;
  - headings: its section headings before the reference sections, against
    the median page;
  - the counterfactual: its length over the length the line predicts if every
    page that names it (rule or codename) linked to it (ratio_if_linked).
  NOTES then holds what reading each page found: a codename the name rule
  misses, the team its linkers share, the passage that supports the reason.
  Every count in a note is measured here; every quote is asserted to be on
  its page.
- Pattern tests over all 303 pages, each against SHUFFLES seeded shuffles:
  do unlinked mentions go with a positive residual (Spearman), and do hub
  pages sit below the line (mean residual)?

    python analysis/week05_fame.py
"""

import json
import math
import re
import statistics
import sys
from pathlib import Path

import networkx as nx
import numpy as np
from scipy import stats

from check_pages import check
from week05_relations import is_heading, name_table
from week05_text import SHARED_NAME_RULE, WORD_RULE, graph, nodes, pages, shared_name, words

OUT = Path(__file__).with_suffix(".json")
PAGE_OUT = Path(__file__).resolve().parents[1] / "public/weeks/week05/data/fame.json"
SEED = 2805
SHUFFLES = 1000
TOP = 5
REFERENCE_HEADINGS = {"References", "External links", "Notes", "See also", "Further reading"}
NAME_RULE = "its title without the disambiguation, plus the real name its node description gives in brackets, as a whole word; a name several pages go by counts for the main page only"
HEADING_RULE = "a line under 45 characters, of at most six words, not ending in a full stop, before the reference sections"

# What reading each outlier's page found. `codename` is a name the name rule
# misses, counted on other pages with series titles and the Captain Britain
# Corps set aside (`skip`); `cast` is a word every page linking to it shares;
# `own` are words the page itself must use (asserted). The reason's numbers
# are filled in from the measurements.
NOTES = {
    "Brian_Braddock": {
        "codename": "Captain Britain", "skip": r"(?! and MI| & MI|: | Corps| #|\")",
        "reason": "The link network undercounts him. His codename, Captain Britain, is on {codename_pages} "
                  "other pages (since 2020 it is also Betsy Braddock's), but only {codename_linked} of them "
                  "links to his page. If all of them linked, the line would put him at "
                  "{ratio_if_linked} predicted instead of {ratio}.",
        "quote": ("Union_Jack_(Marvel_Comics)", "For a time he fought crime on his own, serving as a hero for the "
                  "common man as opposed to the aristocratic Captain Britain.", "Captain Britain"),
    },
    "Miracleman_(character)": {
        "own": ["Marvelman", "Eclipse Comics", "1954–1963"],
        "reason": "An isolate: no link in or out, and no other page names him. He began as a British "
                  "character whom Marvel licensed in 2010, and his {headings} headings follow his "
                  "publication history from 1954 on.",
        "quote": ("Miracleman_(character)", "Marvel licensed the characters from Anglo directly and in 2010 began a "
                  "series of reprints of classic material under the Marvelman name.", "Marvel licensed"),
    },
    "Betsy_Braddock": {
        "own": ["Psylocke", "Captain Britain"],
        "reason": "Not undercounted: {in_degree} pages link to her, more than the {mentions} that name "
                  "Betsy Braddock. Her page has {headings} headings because it tells two careers, as "
                  "Psylocke and as Captain Britain.",
        "quote": ("Betsy_Braddock", "Following nearly 30 years of publication history, both women were returned "
                  "to their original bodies, and Betsy took up the mantle of Captain Britain from her brother "
                  "while Kwannon became the new Psylocke.", "Captain Britain"),
    },
    "U.S._Agent": {
        "own": ["Marvel Cinematic Universe"],
        "reason": "Named on {mentions} other pages, {mention_only} of them without a link. Counting those "
                  "as links only moves him from {ratio} to {ratio_if_linked} predicted: the length is in his "
                  "{headings} headings, from his first stories to the Marvel Cinematic Universe.",
        "quote": ("Stingray_(Marvel_Comics)", "His actions earn him the respect of U.S. Agent.", "U.S. Agent"),
    },
    "Isaiah_Bradley": {
        "own": ["Truth: Red, White & Black", "Reaction and analysis"],
        "reason": "No page links to him, and only {mentions} other page names him. His page is long because it covers the "
                  "2003 series Truth: Red, White & Black and what critics wrote about it.",
        "quote": ("Isaiah_Bradley", "Sharon Packer, in her 2010 book Superheroes and Superegos: Analyzing the Minds "
                  "Behind the Masks, wrote that the events and characters of Truth: Red, White & Black convey "
                  "important messages about race relations, conspiracy theories, and performance enhancement "
                  "in sports.", "Truth: Red, White & Black"),
    },
    "Quasar_(character)": {
        "holders": ["Wendell Vaughn", "Phyla-Vell", "Richard Rider", "Avril Kincaid"],
        "reason": "A page for a shared codename: {holders} characters have been Quasar, each with one "
                  "section here, and {in_degree} pages link to the name.",
        "quote": ("Quasar_(character)", "Quasar is the name of several superheroes appearing in American comic "
                  "books published by Marvel Comics.", "the name of several superheroes"),
    },
    "Blue_Bullet": {
        "cast": "Invaders",
        "reason": "Both pages that link to him mention the Invaders, the wartime team he fought, and his own "
                  "page has {headings} headings: it lists three issues, and he dies in the third.",
        "quote": ("Blue_Bullet", "The character subsequently appears in The Invaders #4 (August 1993), in which "
                  "he dies.", "in which he dies"),
    },
    "Ch'od": {
        "cast": "Starjammers",
        "reason": "All {cast_with} pages that link to him mention the Starjammers, his crew: he "
                  "gets links as a team member, and his page has {headings} headings.",
        "quote": ("Raza_Longknife", "met and formed the band of smugglers and space pirates known as the Starjammers; "
                  "with Corsair, Hepzibah, and Ch'od, and associated himself with the group.", "Ch'od"),
    },
    "Lei_Kung_(character)": {
        "cast": "K'un-Lun",
        "reason": "All {cast_with} pages that link to him mention K'un-Lun, Iron Fist's city: he is known "
                  "as Iron Fist's teacher, and his own page has {headings} headings.",
        "quote": ("Iron_Fist_(character)", "Yü-Ti apprentices him to Lei Kung the Thunderer, who teaches him "
                  "martial arts.", "Lei Kung"),
    },
    "Toxyn": {
        "cast": "Morituri",
        "reason": "All {cast_with} pages that link to her mention the Morituri, her team, and she was in "
                  "that one series until her death; her page has {headings} headings.",
        "quote": ("Toxyn", "She was a regular cast member until her death in issue #21.", "until her death"),
    },
}


WORDS = ["zero", "one", "two", "three", "four", "five", "six"]


def flat(text):
    return " ".join(text.split())


def times(ratio):
    """A page's length over its predicted length, as the page prints it: ×8.0, ×0.18."""
    return f"×{ratio:.1f}" if ratio >= 1 else f"×{ratio:.2f}"


def headings(text):
    """Section headings before the reference sections."""
    out = []
    for line in text.split("\n"):
        line = line.strip()
        if not line or not is_heading(line):
            continue
        if line in REFERENCE_HEADINGS:
            break
        out.append(line)
    return out


def whole(name, tail=""):
    return re.compile(r"(?<![\w-])" + re.escape(name) + r"(?![\w-])" + tail)


def pearson(x, y):
    return float(np.corrcoef(x, y)[0, 1])


def main():
    text = pages()
    network = graph()
    table = nodes().set_index("node_id")
    ids = sorted(text)
    rng = np.random.default_rng(SEED)

    tokens = np.array([len(words(text[n])) for n in ids])
    indeg = np.array([network.in_degree(n) for n in ids])
    outdeg = np.array([network.out_degree(n) for n in ids])
    rank = nx.pagerank(network)
    x, y = np.log1p(indeg), np.log(tokens)
    slope, intercept = (float(v) for v in np.polyfit(x, y, 1))
    predicted = np.exp(intercept + slope * x)
    residual = y - (intercept + slope * x)
    r = pearson(x, y)

    # Baseline: in-degree shuffled over the pages, same lengths, same degrees.
    null = np.array([pearson(rng.permutation(x), y) for _ in range(SHUFFLES)])

    # Mentions against links, for every page, under section 1's name rule.
    names = name_table(nodes())
    finder = {n: re.compile(r"(?<![\w-])(?:" + "|".join(map(re.escape, names[n])) + r")(?![\w-])")
              for n in ids if names[n]}
    naming = {n: {m for m in ids if m != n and n in finder and finder[n].search(text[m])} for n in ids}
    linking = {n: set(network.predecessors(n)) for n in ids}
    mention_only = np.array([len(naming[n] - linking[n]) for n in ids])
    rho_mentions = float(stats.spearmanr(residual, mention_only)[0])
    null_mentions = np.array([stats.spearmanr(residual, rng.permutation(mention_only))[0] for _ in range(SHUFFLES)])

    # Hub pages for a shared codename.
    hub = np.array([shared_name(text[n]) for n in ids])
    gap = float(residual[hub].mean() - residual[~hub].mean())
    null_gap = []
    for _ in range(SHUFFLES):
        h = rng.permutation(hub)
        null_gap.append(residual[h].mean() - residual[~h].mean())
    null_gap = np.array(null_gap)

    heads = {n: headings(text[n]) for n in ids}
    isolate = (indeg == 0) & (outdeg == 0)
    at = {n: i for i, n in enumerate(ids)}
    order = sorted(ids, key=lambda n: (-residual[at[n]], n))
    above, below = order[:TOP], order[::-1][:TOP]
    if set(above + below) != set(NOTES):
        raise SystemExit(f"the outliers moved: {sorted(set(above + below) ^ set(NOTES))}; reread their pages")

    outliers = []
    for side, group in (("above", above), ("below", below)):
        for place, n in enumerate(group, 1):
            i, note = at[n], NOTES[n]
            linkers = sorted(linking[n])
            for word in note.get("own", []):
                assert word in text[n], f"{n} should use {word!r}"
            codename, on = None, []
            if "codename" in note:
                pat = whole(note["codename"], note["skip"])
                on = sorted(m for m in ids if m != n and pat.search(text[m]))
                codename = {"name": note["codename"], "pages": len(on), "linked": sum(m in linking[n] for m in on),
                            "own": len(pat.findall(text[n])), "page_ids": on}
            cast = None
            if "cast" in note:
                cast = {"word": note["cast"], "linkers": len(linkers), "with_word": sum(note["cast"] in text[m] for m in linkers)}
                assert cast["with_word"] == cast["linkers"], f"every page linking to {n} should mention {note['cast']}"
            holders = note.get("holders", [])
            assert all(h in heads[n] for h in holders), f"each holder of {n} should head a section"
            # The counterfactual: every page that names it links to it too.
            if_linked = len(linking[n] | naming[n] | set(on))
            ratio_if_linked = tokens[i] / math.exp(intercept + slope * math.log1p(if_linked))
            page, quote, highlight = note["quote"]
            assert quote in flat(text[page]), f"the quote for {n} is not on {page}"
            assert highlight in quote
            links = None if page == n else network.has_edge(page, n)
            if n in ("Brian_Braddock", "U.S._Agent"):
                assert links is False, f"{page} should name {n} without linking to it"
            fields = {
                "in_degree": int(indeg[i]), "mentions": len(naming[n]), "mention_only": int(mention_only[i]),
                "headings": len(heads[n]), "ratio": times(math.exp(residual[i])),
                "ratio_if_linked": times(ratio_if_linked), "holders": WORDS[len(holders)],
                "codename_pages": codename and codename["pages"], "codename_linked": codename and codename["linked"],
                "cast_with": cast and cast["with_word"],
            }
            outliers.append({
                "id": n,
                "name": n.replace("_", " "),
                "side": side,
                "place": place,
                "in_degree": int(indeg[i]),
                "out_degree": int(outdeg[i]),
                "tokens": int(tokens[i]),
                "predicted": round(float(predicted[i])),
                "residual": float(residual[i]),
                "ratio": float(math.exp(residual[i])),
                "isolate": bool(isolate[i]),
                "hub": bool(hub[i]),
                "headings": len(heads[n]),
                "mentions": len(naming[n]),
                "mentions_linked": len(naming[n] & linking[n]),
                "mention_only": int(mention_only[i]),
                "in_degree_if_linked": if_linked,
                "ratio_if_linked": float(ratio_if_linked),
                "holders": holders,
                "codename": codename,
                "cast": cast,
                "reason": note["reason"].format(**fields),
                "quote": {"page": page, "text": quote, "highlight": highlight, "links": links},
            })

    payload = {
        "meta": {
            "script": "analysis/week05_fame.py",
            "owner": "Niklas",
            "word_rule": WORD_RULE,
            "length": "words per page under week05_text.words()",
            "network": "in-degree among the 303 pages (week05_text.graph()); links from outside them do not count",
            "fit": "ordinary least squares of ln(words) on ln(1 + in-degree), all 303 pages",
            "residual": "ln(words) minus the fitted value; exp(residual) is the page's length over the predicted length",
            "name_rule": NAME_RULE,
            "hub_rule": SHARED_NAME_RULE,
            "heading_rule": HEADING_RULE,
            "seed": SEED,
            "shuffles": SHUFFLES,
        },
        "corpus": {
            "pages": len(ids),
            "arcs": network.number_of_edges(),
            "zero_in_degree": int((indeg == 0).sum()),
            "isolates": int(isolate.sum()),
            "median_tokens": int(statistics.median(tokens.tolist())),
            "median_headings": statistics.median(len(heads[n]) for n in ids),
            "hubs": int(hub.sum()),
        },
        "fit": {
            "slope": slope,
            "intercept": intercept,
            "base_tokens": math.exp(intercept),
            "per_doubling": 2 ** slope,
            "pearson": r,
            "spearman": float(stats.spearmanr(indeg, tokens)[0]),
            "residual_sd": float(residual.std(ddof=2)),
            "null_mean": float(null.mean()),
            "null_sd": float(null.std(ddof=1)),
            "null_max": float(null.max()),
            "p": (1 + int((np.abs(null) >= abs(r)).sum())) / (SHUFFLES + 1),
        },
        "other_measures": [
            {"measure": "out-degree", "spearman": float(stats.spearmanr(outdeg, tokens)[0])},
            {"measure": "PageRank", "spearman": float(stats.spearmanr([rank[n] for n in ids], tokens)[0])},
        ],
        "patterns": {
            "mentions": {
                "rho": rho_mentions,
                "null_mean": float(null_mentions.mean()),
                "null_sd": float(null_mentions.std(ddof=1)),
                "p": (1 + int((np.abs(null_mentions) >= abs(rho_mentions)).sum())) / (SHUFFLES + 1),
                "above_with_mention_only": sum(o["mention_only"] > 0 or bool(o["codename"] and o["codename"]["pages"] > o["codename"]["linked"])
                                               for o in outliers if o["side"] == "above"),
            },
            "hubs": {
                "pages": int(hub.sum()),
                "mean_residual": float(residual[hub].mean()),
                "rest_mean_residual": float(residual[~hub].mean()),
                "gap": gap,
                "null_sd": float(null_gap.std(ddof=1)),
                "p": (1 + int((np.abs(null_gap) >= abs(gap)).sum())) / (SHUFFLES + 1),
                "below": sum(o["hub"] for o in outliers if o["side"] == "below"),
            },
        },
        "points": [
            {
                "id": n,
                "name": n.replace("_", " "),
                "in_degree": int(indeg[at[n]]),
                "out_degree": int(outdeg[at[n]]),
                "tokens": int(tokens[at[n]]),
                "predicted": round(float(predicted[at[n]])),
                "residual": round(float(residual[at[n]]), 4),
                "ratio": round(math.exp(residual[at[n]]), 4),
                "isolate": bool(isolate[at[n]]),
                "hub": bool(hub[at[n]]),
            }
            for n in ids
        ],
        "outliers": outliers,
    }
    check(OUT, payload)
    check(PAGE_OUT, payload)
    encoded = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    OUT.write_text(encoded, encoding="utf-8")
    PAGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    PAGE_OUT.write_text(encoded, encoding="utf-8")
    f, pm, ph = payload["fit"], payload["patterns"]["mentions"], payload["patterns"]["hubs"]
    print(f"r {f['pearson']:.3f} (shuffled {f['null_mean']:.3f} ± {f['null_sd']:.3f}), rho {f['spearman']:.3f}, "
          f"slope {slope:.3f}, base {f['base_tokens']:.0f} words")
    print(f"mentions rho {pm['rho']:.3f} p {pm['p']:.3f}; hubs {ph['pages']} gap {ph['gap']:.3f} p {ph['p']:.3f}")
    for o in outliers:
        print(f"{o['side']} {o['place']} {o['name']}: x{o['ratio']:.1f} | {o['reason']}")


if __name__ == "__main__":
    sys.exit(main())
