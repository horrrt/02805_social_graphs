"""Shared loaders for week 5: the 303 Marvel pages and the network they join onto.

Every week 5 script reads the corpus and the graph through this module, so all
seven sections count the same pages and the same links.

    from week05_text import pages, graph, weighted

Data, all from the course data page (https://sunelehmann.com/socialgraphs2026-web/data/),
frozen 26 August 2026 and committed under data/:

- data/marvel_pages.zip: plain-text article for each of the 303 characters.
  Filenames are URL-encoded node_ids (Mark_Hazzard%3A_Merc), so pages() unquotes
  them; skip that and one page silently fails to join.
- data/week1_nodes.tsv, data/week1_edges.tsv: the directed link network.
  17 characters have no links, so graph() adds every node before any edge.
- data/week4_edges_weighted.tsv: the same 1,784 links with a count of how often
  A's article links to B's. weighted() sums both directions, as the course does.

NLTK data and the tiktoken encodings download on first use. Keep them out of
the repository by pointing both caches into build/:

    export NLTK_DATA=build/nltk_data TIKTOKEN_CACHE_DIR=build/tiktoken
"""

import hashlib
import re
import urllib.parse
import zipfile
from pathlib import Path

import networkx as nx
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SHA256 = {
    "marvel_pages.zip": "36023ca077053b3df5bd55630754cb514c3f9dbecbd70afcb2283e5bcc0017ee",
    "week4_edges_weighted.tsv": "aea9d7f84f942b40befc04f87e482b06385c64ea0461b0af886ace442a059666",
}


def _verified(name):
    path = DATA / name
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != SHA256[name]:
        raise SystemExit(f"{path} is not the course snapshot (sha256 {digest})")
    return path


def nodes():
    """The 303-row node table: node_id, names, Wikidata id, URL and blurb."""
    return pd.read_csv(DATA / "week1_nodes.tsv", sep="\t", comment="#", quoting=3)


def pages():
    """Page text keyed by node_id. Fails unless the keys are exactly the 303 nodes."""
    with zipfile.ZipFile(_verified("marvel_pages.zip")) as z:
        text = {
            urllib.parse.unquote(n.split("/")[-1][:-4]): z.read(n).decode("utf-8")
            for n in z.namelist()
            if n.endswith(".txt") and "README" not in n
        }
    ids = set(nodes().node_id)
    if set(text) != ids:
        raise SystemExit(f"pages and nodes disagree: {sorted(set(text) ^ ids)[:5]}")
    return text


def graph():
    """The directed link network, 303 nodes and 1,784 arcs, isolates included."""
    edges = pd.read_csv(DATA / "week1_edges.tsv", sep="\t", comment="#", names=["source", "target"])
    g = nx.DiGraph()
    g.add_nodes_from(nodes().node_id)
    g.add_edges_from(edges.itertuples(index=False))
    return g


def weighted():
    """Undirected weighted network: weight is A→B plus B→A link counts."""
    edges = pd.read_csv(_verified("week4_edges_weighted.tsv"), sep="\t", comment="#",
                        names=["source", "target", "weight"])
    g = nx.Graph()
    g.add_nodes_from(nodes().node_id)
    for s, t, w in edges.itertuples(index=False):
        if g.has_edge(s, t):
            g[s][t]["weight"] += w
        else:
            g.add_edge(s, t, weight=w)
    return g


# One word rule for the sections that count words (5, 6 and 7): a word is a run
# of letters, any alphabet ("Pérez" stays whole), with an apostrophe or hyphen
# inside it kept ("spider-man", "t'challa"); digits and punctuation are dropped;
# everything is lowercased and a possessive 's is taken off, so "Spider-Man's"
# and "Spider-Man" are one word.
WORD = re.compile(r"[^\W\d_]+(?:['’-][^\W\d_]+)*")
WORD_RULE = ("runs of letters in any alphabet, an inner apostrophe or hyphen kept, lowercased, "
             "a possessive 's removed; digits and punctuation dropped")


def words(text):
    """The words of a text under WORD_RULE."""
    out = []
    for w in WORD.findall(text.lower()):
        for tail in ("'s", "’s"):
            if w.endswith(tail) and len(w) > len(tail):
                w = w[: -len(tail)]
        out.append(w)
    return out


_NLP = None


def sentences(text):
    """The sentences of a page: paragraphs at line breaks, then spaCy's
    rule-based sentencizer, which knows "Dr." and "U.S." do not end a sentence.
    Heading lines come back as their own short "sentences"; drop them if needed."""
    global _NLP
    if _NLP is None:
        import spacy

        _NLP = spacy.blank("en")
        _NLP.add_pipe("sentencizer")
    out = []
    for para in text.split("\n"):
        para = para.strip()
        if para:
            out.extend(s.text.strip() for s in _NLP(para).sents if s.text.strip())
    return out



# A page about several characters who share one name ("Quasar is the name of
# several superheroes"): its first sentence calls the title the name, alias,
# codename, title, identity or mantle of several, or two, three..., characters,
# or a name used by them. Sections 6 and 7 both use it.
_COUNT = r"(?:several|multiple|various|two|three|four|five|six)"
SHARED_NAME = re.compile(
    r"\b(?:name|names|alias|codename|title|identity|mantle)\b[^.]{0,40}?\b" + _COUNT + r"\b"
    r"|\bused by " + _COUNT + r"\b"
    r"|\bname of a number of (?:\w+ )?characters\b"
)
SHARED_NAME_RULE = ("its first sentence calls the title the name, alias, codename, title, identity or "
                    "mantle of several (or two, three...) characters, or a name used by them")


def shared_name(text):
    """Whether a page is about several characters who share its title."""
    first = sentences(text)
    return bool(first) and bool(SHARED_NAME.search(first[0]))

if __name__ == "__main__":
    text, g, gw = pages(), graph(), weighted()
    print(f"{len(text)} pages, {sum(map(len, text.values())):,} characters")
    print(f"directed: {g.number_of_nodes()} nodes, {g.number_of_edges()} arcs")
    print(f"weighted: {gw.number_of_nodes()} nodes, {gw.number_of_edges()} edges")
