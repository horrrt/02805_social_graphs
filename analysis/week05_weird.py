"""Week 5 · Who has the weirdest Wikipedia page?

Question: Which Marvel page uses the most varied words for its length, and is
that a real property of the page or formatting and boilerplate?

Owner: Niklas

Page section: docs/weeks/week05/index.html#weird
Output: docs/weeks/week05/data/weird.json (and a copy in analysis/), every
number the section quotes, validated with check(path, data) against the Weird
model in week05_schemas.py.

Method
- Tokens: words() from week05_text under WORD_RULE (letters in any alphabet,
  inner apostrophe or hyphen kept, lowercased, possessive 's removed, digits
  and punctuation dropped). No stopwords removed, no lemmas.
- Weird means varied vocabulary: the moving-average type-token ratio (MATTR).
  Slide a window of WINDOW tokens along the page one token at a time, take the
  share of distinct words in each window, and average. The shortest page has
  193 tokens, so a 100-token window fits every page, and a fixed window keeps
  the long pages from being punished for repeating "the".
- Length control: MATTR has no trend with length, but short pages spread
  more (fewer windows to average). Each page is scored as a z-score against the
  NEIGHBOURS pages nearest to it in length, so a page is only compared with
  pages as long as itself.
- Baseline band for the figure: DRAWS random stretches of the whole corpus
  (every page joined in node_id order) at each of BAND_POINTS lengths, seeded
  with SEED; the band is their mean plus and minus two standard deviations.
  Long pages fall outside it more often than short ones, which is why the
  ranking compares pages with pages rather than with the band.
- Stability: the same ranking with a WINDOW_ALT-token window; how many of the
  top and bottom 10 survive.
- Real or boilerplate: for each shown page, the share of its word types found
  on at most RARE_PAGES pages (proper names and rare words), and the share of
  its tokens inside house phrasing: 8-grams on more than TEMPLATE_PAGES pages,
  section 2's cutoff applied to this section's word rule. Both shares move
  with length, so each shown page is compared with the median of its
  NEIGHBOURS length neighbours; across all pages, the score's rank correlation
  with the house-phrasing share says how much boilerplate pulls a page down.
  Hapax share is left out: it falls as a page grows, so it cannot compare
  pages of different length.
- Pages about several characters sharing one name ("the name of several
  superheroes") are found from their first sentence and counted in the bottom
  tenth against what chance would put there (hypergeometric test).
- Reading: the top and bottom pages were read by hand; READ holds what the
  reading found and QUOTES a sentence past the lead that shows it. The script
  fails if a quote is not a sentence of its page or if the ranking changes
  under the notes.

Read the corpus only through week05_text.

    python analysis/week05_weird.py
"""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from scipy.stats import hypergeom, spearmanr

from check_pages import check
from week05_text import WORD_RULE, nodes, pages, sentences, words

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_suffix(".json")
PAGE = ROOT / "docs/weeks/week05/data/weird.json"
WINDOW = 100          # tokens per MATTR window; the shortest page has 193
WINDOW_ALT = 50       # the second window, for the stability check
NEIGHBOURS = 30       # pages nearest in length that a page is scored against
DRAWS = 2000          # random corpus stretches per band length
BAND_POINTS = 40      # lengths the band is drawn at, spaced evenly on a log scale
SEED = 2805
N = 8                 # house phrasing: 8-grams ...
TEMPLATE_PAGES = 10   # ... on more than this many pages (section 2's rule)
RARE_PAGES = 2        # a rare word type is on at most this many pages
SHOW = 5              # pages shown at each end
STABLE = 10           # pages checked at each end for the stability count
SEVERAL = re.compile(r"\b(?:name|names|alias|codename|title|identity|mantle)\b[^.]{0,40}?\b(?:several|multiple|various)\b")

# What reading each page found. Keys must be exactly the top and bottom SHOW.
READ = {
    "Coldblood": "A short cyborg page whose powers section lists body parts and abilities, each named once, "
                 "in ordinary words.",
    "Super_Rabbit": "A funny-animal hero from Timely, Marvel's predecessor, so the house lead is missing. "
                    "The text runs through comic titles, dates and artists.",
    "Ravage_2099": "Long interview quotes from the artist and the editor, in spoken English the encyclopedia "
                   "pages do not use.",
    "Paladin_(comics)": "A mercenary's record that moves from one team-up to the next, each with a new cast.",
    "Sabra_(character)": "Hebrew names, Israeli places and the story of the character's creation, "
                         "in words few other pages use.",
    "Ms._Marvel": "The name of four heroines. Each part repeats the codename in the same sentence frame, "
                  "then sales rankings repeat another.",
    "Gorgon_(Inhuman)": "A media list, line after line of \"Gorgon appears in …, voiced by …\", "
                        "much of it house phrasing.",
    "Hawkeye_(comics)": "A short page about several Hawkeyes that repeats the name in nearly every sentence.",
    "Abomination_(character)": "One long record of fights with the Hulk: \"the Abomination\" and \"the Hulk\" "
                               "return in almost every sentence.",
    "Captain_Marvel_(Marvel_Comics)": "The name of several heroes. Each version opens with the same frame, "
                                      "\"The second Captain Marvel is …\".",
}
# A sentence past the lead of each of the top three pages, then the bottom
# page, that shows why it scores as it does.
QUOTES = {
    "Coldblood": "He has a wetware-grafted computer grafted to his organic brain, a plasti-steel-reinforced "
                 "skeleton, an artificial heart, synthetic hemoglobin, and artificial right eye.",
    "Super_Rabbit": "Aside from creator Ernie Hart, other artists who contributed to his adventures included "
                    "Mike Sekowsky, Al Jaffee, and inker Violet Barclay.",
    "Ravage_2099": "The guys started to shake hands, then gave each other a big hug.",
    "Ms._Marvel": "Kamala Khan is the fourth character to use the codename of Ms. Marvel.",
}


def window_types(ts, w):
    """Distinct words in each w-token window of ts, sliding one token at a time."""
    out = np.empty(len(ts) - w + 1)
    c = Counter(ts[:w])
    k = len(c)
    out[0] = k
    for i in range(1, len(ts) - w + 1):
        old, new = ts[i - 1], ts[i + w - 1]
        c[old] -= 1
        k -= c[old] == 0
        c[new] += 1
        k += c[new] == 1
        out[i] = k
    return out


def mattr(ts, w):
    return float(window_types(ts, w).mean() / w)


def neighbours(lengths, k):
    """{page: the k other pages nearest to it in length}, ties broken by node_id."""
    order = sorted(lengths, key=lambda p: (lengths[p], p))
    out = {}
    for i, p in enumerate(order):
        lo = max(0, min(i - k // 2, len(order) - k - 1))
        out[p] = [q for q in order[lo:lo + k + 1] if q != p][:k]
    return out


def neighbour_z(values, near):
    """Each page's z-score against its length neighbours."""
    z = {}
    for p, others in near.items():
        v = np.array([values[q] for q in others])
        z[p] = float((values[p] - v.mean()) / v.std(ddof=1))
    return z


def corpus_stretches(corpus, w, length, rng, cumsum):
    """MATTR of DRAWS random length-token stretches of the joined corpus."""
    m = length - w + 1
    starts = rng.integers(0, len(corpus) - length + 1, DRAWS)
    return (cumsum[starts + m] - cumsum[starts]) / m / w


def main():
    text = pages()
    ids = sorted(text)
    names = dict(zip(nodes().node_id, nodes().name))
    toks = {p: words(text[p]) for p in ids}
    lengths = {p: len(toks[p]) for p in ids}

    # the score, and the same score with the second window
    score = {p: mattr(toks[p], WINDOW) for p in ids}
    score_alt = {p: mattr(toks[p], WINDOW_ALT) for p in ids}
    near = neighbours(lengths, NEIGHBOURS)
    z = neighbour_z(score, near)
    z_alt = neighbour_z(score_alt, near)
    ranked = sorted(ids, key=lambda p: (-z[p], p))
    ranked_alt = sorted(ids, key=lambda p: (-z_alt[p], p))
    rank = {p: i + 1 for i, p in enumerate(ranked)}

    # the corpus band: random stretches of the joined corpus at each length
    corpus = [t for p in ids for t in toks[p]]
    cumsum = np.concatenate([[0.0], np.cumsum(window_types(corpus, WINDOW))])
    rng = np.random.default_rng(SEED)
    grid = sorted({int(round(x)) for x in np.geomspace(min(lengths.values()), max(lengths.values()), BAND_POINTS)})
    band = []
    for length in grid:
        s = corpus_stretches(corpus, WINDOW, length, rng, cumsum)
        band.append({"tokens": length, "mean": round(float(s.mean()), 4), "sd": round(float(s.std(ddof=1)), 4)})
    # each page against the band at its own length, for the outside-the-band count
    band_z = {}
    for p in ids:
        s = corpus_stretches(corpus, WINDOW, lengths[p], rng, cumsum)
        band_z[p] = (score[p] - s.mean()) / s.std(ddof=1)
    median_len = float(np.median(list(lengths.values())))
    short = [p for p in ids if lengths[p] <= median_len]
    long_ = [p for p in ids if lengths[p] > median_len]
    outside = lambda group: sum(abs(band_z[p]) > 2 for p in group) / len(group)

    # length checks on the score
    L = np.array([lengths[p] for p in ids])
    q1, q3 = np.quantile(L, [0.25, 0.75])
    zs = np.array([z[p] for p in ids])
    raw = np.array([score[p] for p in ids])

    # real or boilerplate: rare word types and house phrasing
    df = Counter(t for p in ids for t in set(toks[p]))
    gram_pages = defaultdict(set)
    for p in ids:
        ts = toks[p]
        for i in range(len(ts) - N + 1):
            gram_pages[tuple(ts[i:i + N])].add(p)
    common = {g for g, where in gram_pages.items() if len(where) > TEMPLATE_PAGES}
    lead = max(common, key=lambda g: (len(gram_pages[g]), g))

    def rare_share(p):
        types = set(toks[p])
        return sum(df[t] <= RARE_PAGES for t in types) / len(types)

    def boiler_share(p):
        ts = toks[p]
        covered = np.zeros(len(ts), bool)
        for i in range(len(ts) - N + 1):
            if tuple(ts[i:i + N]) in common:
                covered[i:i + N] = True
        return float(covered.mean())

    rare = {p: rare_share(p) for p in ids}
    boiler = {p: boiler_share(p) for p in ids}
    median_rare = float(np.median(list(rare.values())))
    median_boiler = float(np.median(list(boiler.values())))
    # both shares move with length (the lead phrasing is a bigger slice of a
    # short page), so each shown page is compared with its length neighbours
    near_rare = {p: float(np.median([rare[q] for q in near[p]])) for p in ids}
    near_boiler = {p: float(np.median([boiler[q] for q in near[p]])) for p in ids}
    boiler_z = spearmanr(zs, [boiler[p] for p in ids])

    # pages about several characters sharing one name, from their first sentence
    first = {p: sentences(text[p])[0] for p in ids}
    several = sorted(p for p in ids if SEVERAL.search(first[p]))
    decile = len(ids) // 10
    in_bottom = [p for p in ranked[-decile:] if p in several]
    expected = decile * len(several) / len(ids)
    p_value = float(hypergeom.sf(len(in_bottom) - 1, len(ids), len(several), decile))

    top, bottom = ranked[:SHOW], ranked[::-1][:SHOW]
    if set(READ) != set(top) | set(bottom):
        for p in top + bottom:
            print(rank[p], p, lengths[p], round(z[p], 2), round(rare[p], 3), round(boiler[p], 3), p in several,
                  first[p][:90], file=sys.stderr)
        raise SystemExit("READ does not match the pages shown: read the new ones and update it")
    quotes = []
    for p, sentence in QUOTES.items():
        assert sentence in text[p], f"{p}: quote is not on the page"
        assert sentence in sentences(text[p])[1:], f"{p}: quote is not a sentence past the lead"
        quotes.append({"node": p, "name": names[p], "rank": rank[p], "text": sentence})
    assert [q["node"] for q in quotes[:3]] == ranked[:3], "the first three quotes are the top three pages"
    assert quotes[3]["node"] == ranked[-1], "the last quote is the bottom page"

    def row(p):
        return {
            "node": p,
            "name": names[p],
            "rank": rank[p],
            "tokens": lengths[p],
            "mattr": round(score[p], 4),
            "z": round(z[p], 2),
            "z_alt": round(z_alt[p], 2),
            "rank_alt": ranked_alt.index(p) + 1,
            "rare_share": round(rare[p], 4),
            "rare_near": round(near_rare[p], 4),
            "boilerplate_share": round(boiler[p], 4),
            "boilerplate_near": round(near_boiler[p], 4),
            "several": p in several,
            "read": READ[p],
        }

    payload = {
        "meta": {
            "script": "analysis/week05_weird.py",
            "owner": "Niklas",
            "token_rule": WORD_RULE,
            "sentences": "paragraphs split at line breaks, then spaCy's rule-based sentencizer",
            "window": WINDOW,
            "window_alt": WINDOW_ALT,
            "neighbours": NEIGHBOURS,
            "draws": DRAWS,
            "seed": SEED,
            "n": N,
            "template_pages": TEMPLATE_PAGES,
            "rare_pages": RARE_PAGES,
            "score": "MATTR over a sliding window, z-scored against the pages nearest in length",
        },
        "corpus": {
            "pages": len(ids),
            "tokens": len(corpus),
            "min_tokens": min(lengths.values()),
            "max_tokens": max(lengths.values()),
            "median_tokens": median_len,
            "mattr_mean": round(float(raw.mean()), 4),
            "median_rare_share": round(median_rare, 4),
            "median_boilerplate_share": round(median_boiler, 4),
            "common_ngrams": len(common),
            "lead_ngram": " ".join(lead),
            "lead_ngram_pages": len(gram_pages[lead]),
        },
        "checks": {
            "spearman_length": round(float(spearmanr(zs, L)[0]), 3),
            "spearman_length_raw": round(float(spearmanr(raw, L)[0]), 3),
            "raw_sd_shortest": round(float(raw[L <= q1].std(ddof=1)), 4),
            "raw_sd_longest": round(float(raw[L >= q3].std(ddof=1)), 4),
            "z_sd_shortest": round(float(zs[L <= q1].std(ddof=1)), 2),
            "z_sd_longest": round(float(zs[L >= q3].std(ddof=1)), 2),
            "top10_shorter_than_median": sum(lengths[p] < median_len for p in ranked[:STABLE]),
            "outside_band_short": round(outside(short), 4),
            "outside_band_long": round(outside(long_), 4),
            "spearman_rare_length": round(float(spearmanr([rare[p] for p in ids], L)[0]), 3),
            "spearman_boilerplate_length": round(float(spearmanr([boiler[p] for p in ids], L)[0]), 3),
            "spearman_z_boilerplate": round(float(boiler_z[0]), 3),
            "spearman_z_boilerplate_p": float(boiler_z[1]),
        },
        "stability": {
            "window_alt": WINDOW_ALT,
            "checked": STABLE,
            "top_survivors": len(set(ranked[:STABLE]) & set(ranked_alt[:STABLE])),
            "bottom_survivors": len(set(ranked[-STABLE:]) & set(ranked_alt[-STABLE:])),
            "spearman": round(float(spearmanr([z[p] for p in ids], [z_alt[p] for p in ids])[0]), 3),
        },
        "several": {
            "pages": len(several),
            "bottom_decile": decile,
            "in_bottom_decile": len(in_bottom),
            "expected": round(expected, 2),
            "p": p_value,
            "names": [names[p] for p in in_bottom],
        },
        "summary": {
            "shown": SHOW,
            "top_boilerplate_below_near": sum(boiler[p] < near_boiler[p] for p in top),
            "bottom_boilerplate_above_near": sum(boiler[p] > near_boiler[p] for p in bottom),
            "top_rare_above_near": sum(rare[p] > near_rare[p] for p in top),
            "bottom_rare_below_near": sum(rare[p] < near_rare[p] for p in bottom),
            "band_points": len(band),
        },
        "top": [row(p) for p in top],
        "bottom": [row(p) for p in bottom],
        "quotes": quotes,
        "band": band,
        "points": [{"node": p, "name": names[p], "tokens": lengths[p], "mattr": round(score[p], 4),
                    "near_mattr": round(float(np.mean([score[q] for q in near[p]])), 4),
                    "z": round(z[p], 2), "rank": rank[p]} for p in ranked],
    }
    check(PAGE, payload)
    encoded = json.dumps(payload, indent=1, ensure_ascii=False) + "\n"
    OUT.write_text(encoded, encoding="utf-8")
    PAGE.write_text(encoded, encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ("corpus", "checks", "stability", "several", "summary")}, indent=1))
    for r in payload["top"] + payload["bottom"]:
        print(r["rank"], r["name"], r["tokens"], r["mattr"], r["z"], r["rank_alt"], r["rare_share"], r["boilerplate_share"], r["several"])


if __name__ == "__main__":
    sys.exit(main())
