"""Move the redesign boards' wording into the Week 4 page (PORT_PLAN.md 3.2).

    python port_text.py RTop ROpening [--dry-run]

For each board, in the order given:

1. Parse the board's <main> and the page's <main> into light trees that keep
   source offsets, so the page is edited by splicing and never re-serialised.
2. Pair cards by key (the id, or "<nearest ancestor id>><last class>"), the
   same key number_audit.mjs uses. A board card with no page partner stops.
3. Pair text slots inside each card by kind, in document order. A slot the
   board has and the page lacks stops the run, except a drawer row or an
   answers list, which is inserted after its board neighbour's partner.
4. Clean the board slot: give w4-term ids the card's name, turn &#x27; into ',
   drop style attributes the page slot does not already carry, and put back
   the page's own copy of every node a script writes (PORT_PLAN 0.6).
5. Hold a slot, keeping the page's text, when the board slot carries a number
   the page does not: the page was rerun after the boards were drawn, so a
   differing board number is stale. Held slots are logged; a hand-written
   replacement goes in port_overrides.json under "<board>|<card>|<kind>#<i>".
6. Apply the fix-ups of PORT_PLAN 3.7, splice, then guard the whole page:
   skeleton multiset, balanced tags, unique ids, script-owned nodes byte for
   byte, no term inside a heading, summary, button or table, definitions of
   60 words at most. A failed guard writes nothing.

Writes the page and review/week04-final/audit/port_text.md (one section per
board, appended), including text that still differs from the board and the
house-style lint of 3.7.
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / "docs/weeks/week04/index.html"
BOARDS = ROOT / "review/week04-final/project"
AUDIT = ROOT / "review/week04-final/audit"
BOARD_DIR = BOARDS
OVERRIDES = Path(__file__).with_name("port_overrides.json")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


# --- parsing ---------------------------------------------------------------


class Node:
    __slots__ = ("tag", "attrs", "start", "start_end", "end_start", "end", "parent", "children")

    def __init__(self, tag, attrs, start, start_end, parent):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.start, self.start_end = start, start_end
        self.end_start = self.end = start_end
        self.children: list[Node] = []

    @property
    def cls(self) -> set[str]:
        return set((self.attrs.get("class") or "").split())

    @property
    def id(self) -> str | None:
        return self.attrs.get("id")

    def ancestors(self):
        n = self.parent
        while n is not None:
            yield n
            n = n.parent

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()

    def elements(self):
        return [c for c in self.children]


class Tree(HTMLParser):
    def __init__(self, src: str):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.root = Node("#root", {}, 0, 0, None)
        self.stack = [self.root]
        self.errors: list[str] = []
        self.feed(src)
        self.close()
        for n in self.stack[1:]:
            self.errors.append(f"<{n.tag}> at {n.start} never closes")

    def _pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self._pos()
        text = self.get_starttag_text()
        node = Node(tag, dict(attrs), start, start + len(text), self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        start = self._pos()
        text = self.get_starttag_text()
        node = Node(tag, dict(attrs), start, start + len(text), self.stack[-1])
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        start = self._pos()
        end = self.src.index(">", start) + 1
        if self.stack[-1].tag != tag:
            self.errors.append(f"</{tag}> at {start} closes <{self.stack[-1].tag}>")
            if not any(n.tag == tag for n in self.stack[1:]):
                return
            while self.stack[-1].tag != tag:
                self.stack.pop()
        node = self.stack.pop()
        node.end_start, node.end = start, end

    def find(self, pred, under: Node | None = None):
        return [n for n in (under or self.root).walk() if n is not self.root and pred(n)]

    def main(self) -> Node:
        found = self.find(lambda n: n.tag == "main")
        if not found:
            raise SystemExit("no <main>")
        return found[0]

    def outer(self, n: Node) -> str:
        return self.src[n.start : n.end]

    def inner(self, n: Node) -> str:
        return self.src[n.start_end : n.end_start]


# --- what counts as a card, a slot, a script-owned node --------------------


def is_card(n: Node) -> bool:
    c = n.cls
    return (
        n.id in ("top", "findings", "cut-catalogue")
        or (n.tag == "header" and "w4-opener" in c)
        or bool(c & {"w4-card", "w4-intro", "rx-topic-bar"})
    )


def card_of(n: Node) -> Node | None:
    return next((a for a in n.ancestors() if is_card(a)), None)


def card_keys(tree: Tree) -> dict[Node, str]:
    """Same keys as number_audit.mjs: id, else '<ancestor id>><last class>'."""
    seen: Counter = Counter()
    keys = {}
    for n in tree.find(is_card, tree.main()):
        if n.id:
            keys[n] = n.id
            continue
        host = next((a.id for a in n.ancestors() if a.id), "(page)")
        kind = "opener" if n.tag == "header" else (n.attrs.get("class") or "").split()[-1]
        base = f"{host}>{kind}"
        k = base if not seen[base] else f"{base}#{seen[base]}"
        seen[base] += 1
        keys[n] = k
    return keys


JS_IDS = {
    "place-status", "place-null-stats", "place-alpha-table", "place-snap-note", "place-alpha-choice",
    "place-region-legend", "place-employer", "place-draft-banner", "jobs-status", "jobs-inspector",
    "jobs-node-inspector", "jobs-bridge-list", "where-break-links", "jobs-linkcom-table",
    "who-movers-table", "who-overlap-table", "staffing-figure", "methods-status",
}
# Term ids the scripts create at run time (PORT_PLAN 3.3, termify); the page
# must never carry them too.
JS_TERM_IDS = {f"w4-term-{x}" for x in (
    "cut-skills-direct-onet", "cut-skills-direct-similarity", "cut-pagerank-explore-pagerank",
    "cut-pagerank-explore-degree", "cut-pagerank-iteration-pagerank", "years-card-registrations",
    "roles-card-crosswalk", "w4m-panel-gn-modularity", "w4m-panel-overlap-clique", "place-backbone-giant",
)}
JS_PREFIXES = ("place-sel-", "hero-sel-", "chart-", "years-", "roles-", "w4m-", "skills-", "pagerank-")


def is_js_owned(n: Node) -> bool:
    i = n.id or ""
    return (
        i in JS_IDS
        or i.startswith(JS_PREFIXES)
        or any(k in n.attrs for k in ("data-strip", "data-more", "data-finding"))
        or bool(n.cls & {"chart-host", "w4-figure-body"})
        or (n.tag == "tbody" and bool(i))
        or (n.tag == "tbody" and any(a.id == "staffing-community-stats" for a in n.ancestors()))
    )


def js_key(n: Node) -> str:
    if n.id:
        return f"#{n.id}"
    for k in ("data-strip", "data-more", "data-finding"):
        if k in n.attrs:
            return f"[{k}={n.attrs[k]}]"
    host = next((a for a in n.ancestors() if a.id), None)
    sig = (n.tag, n.attrs.get("class"))
    same = [m for m in host.walk() if (m.tag, m.attrs.get("class")) == sig] if host else [n]
    return f"#{host.id if host else ''}>{n.tag}.{n.attrs.get('class')}@{same.index(n)}"


def slot_kind(n: Node) -> str | None:
    """Text slots of PORT_PLAN 3.2 step 3, plus the hero and opener lines that
    the plan's table leaves out (logged as an extension in the report)."""
    c, p = n.cls, n.parent
    pc = p.cls if p else set()
    anc = list(n.ancestors())
    in_q = any(a.tag == "header" and "w4-q" in a.cls for a in anc)
    if in_q and n.tag == "h2":
        return "q-title"
    if in_q and "w4-answer" in c:
        return "q-answer"
    if "rx-kicker" in c:
        return "kicker"
    if n.tag == "p" and c & {"sub", "w4-box-intro", "fineprint", "w4-scope-note"}:
        return "para"
    if n.tag == "p" and any("w4-example" in a.cls for a in anc):
        return "para"
    if n.tag == "span" and p is not None and p.tag == "div" and "notice" in pc:
        spans = [x for x in p.children if x.tag == "span"]
        if spans and spans[-1] is n:
            return "notice"
    if p is not None and "plot" in pc and n.tag == "h3":
        return "plot-title"
    if p is not None and "plot" in pc and n.tag == "p" and "axis-note" in c:
        return "axis-note"
    if n.tag == "figcaption" and p is not None and p.tag == "figure":
        return "figcaption"
    if n.tag in ("h3", "h4") and p is not None and is_card(p):
        return "heading"
    if n.tag == "p" and c & {"rx-topic-holds", "rx-moved"}:
        return "topic"
    if n.tag == "em" and any("rx-tcard-head" in a.cls for a in anc[:3]):
        return "topic"
    if n.tag == "ol" and "rx-answers" in c:
        return "answers"
    if n.tag == "div" and "rx-drawers" in c:
        return "drawers"
    # Extension: hero and opener lines.
    if n.tag == "p" and "w4-hero-text" in pc and c & {"body", "caution"}:
        return "hero"
    if n.tag in ("h2", "p") and p is not None and any(a.tag == "header" and "w4-opener" in a.cls for a in anc):
        return "opener"
    if n.tag in ("h3", "p") and p is not None and p.tag == "div" and p.parent is not None and "w4-finding" in p.parent.cls:
        return "finding"
    return None


INSERTABLE = {"drawers", "answers"}


def slots(tree: Tree, card: Node) -> list[tuple[str, Node]]:
    out = []

    def visit(n: Node):
        for ch in n.children:
            if is_card(ch):
                continue
            k = slot_kind(ch)
            if k:
                out.append((k, ch))
            else:
                visit(ch)

    visit(card)
    return out


# --- text helpers ------------------------------------------------------------

TERM_RE = re.compile(
    r'<span class="w4-term">\s*<button[^>]*>([^<]*)</button>\s*<span class="w4-pop"[^>]*>([^<]*)</span>\s*</span>'
)


def flatten(fragment: str) -> str:
    s = TERM_RE.sub(r"\1", fragment)
    s = re.sub(r'<span class="w4-pop[^"]*"[^>]*>[^<]*</span>', " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def pops(fragment: str) -> list[str]:
    return [m.group(2) for m in TERM_RE.finditer(fragment)]


NUM = re.compile(r"(?<![A-Za-z0-9])(?:[−-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|[−-]?\d+(?:\.\d+)?(?:%|×)?)")
WORDS = re.compile(
    r"\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen"
    r"|sixteen|seventeen|eighteen|nineteen|twenty|twice|half|a third|a quarter|one in \w+)\b",
    re.I,
)


def numbers(text: str) -> list[str]:
    return NUM.findall(text.replace("−", "-")) + [w.lower() for w in WORDS.findall(text)]


def missing(have: list[str], want: list[str]) -> list[str]:
    """Items of `want` not covered by the multiset `have`."""
    left = Counter(have)
    out = []
    for x in want:
        if left[x] > 0:
            left[x] -= 1
        else:
            out.append(x)
    return out


def reindent(board_inner: str, page_inner: str) -> str:
    """Give the board text the page slot's line layout."""
    lines = [ln.strip() for ln in board_inner.strip().splitlines()]
    lines = [ln for ln in lines if ln]
    if "\n" not in page_inner:
        return " ".join(lines)
    lead = re.match(r"\s*", page_inner).group(0)
    tail = re.search(r"\s*$", page_inner).group(0)
    indent = lead.rsplit("\n", 1)[-1]
    return lead + ("\n" + indent).join(lines) + tail


FIXUPS = [  # PORT_PLAN 3.7
    ("The slider is the disparity-filter α from Week 4.", "The control sets the disparity-filter α from Week 4."),
    ("Colours are the communities of card C.", "Colours are section 1's three metro groups."),
    ("the pairs S1 already counts", "the pairs box 3 already counts"),
    ("the direct ties S1 already counts", "the direct ties box 3 already counts"),
    ("Same row grouping as S1's chart", "Same row grouping as box 3's chart"),
    ("matches nx.pagerank's own fixed point", "matches the standard PageRank routine's fixed point"),
]

LINT = [
    ("em dash", re.compile("—")),
    ("FY year", re.compile(r"\bFY ?20\d\d")),
    (".py", re.compile(r"\.py\b")),
    ("nx.", re.compile(r"\bnx\.")),
    ("box code", re.compile(r"\b[SPMRE][1-9]\b")),
    ("card letter", re.compile(r"\bcard [A-G]\b")),
    ("preview", re.compile(r"\bpreviews?\b", re.I)),
    ("TODO", re.compile(r"TODO")),
]


def visible_text(src: str) -> str:
    s = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", src)
    s = re.sub(r"<!--[\s\S]*?-->", " ", s)
    s = re.sub(r"<[^>]+>", "\n", s)
    return s


def lint(src: str) -> Counter:
    hits: Counter = Counter()
    for line in visible_text(src).splitlines():
        line = line.strip()
        for name, rx in LINT:
            for m in rx.finditer(line):
                hits[(name, line[max(0, m.start() - 40) : m.end() + 40])] += 1
    return hits


# --- guards ------------------------------------------------------------------

TEXT_TAGS = {"p", "span", "a", "b", "em", "mark", "strong", "i", "br", "sub", "sup", "small", "code", "button"}
DRAWER_PARTS = {"rx-drawers", "rx-drawer", "rx-drawer-body"}


def skeleton(tree: Tree) -> Counter:
    in_slot: set[int] = set()
    for n in tree.find(lambda n: slot_kind(n) is not None, tree.main()):
        for d in n.walk():
            if d is not n:
                in_slot.add(id(d))
    sk: Counter = Counter()
    for n in tree.main().walk():
        c = n.cls
        if c & ({"w4-term", "w4-pop"} | DRAWER_PARTS) or "rx-answers" in c:
            continue
        if n.tag == "summary" and n.parent is not None and "rx-drawer" in n.parent.cls:
            continue
        if n.tag == "button" and n.parent is not None and "w4-term" in n.parent.cls:
            continue
        if n.tag == "li" and n.parent is not None and "rx-answers" in n.parent.cls:
            continue
        if id(n) in in_slot and n.tag in TEXT_TAGS:
            continue
        data = tuple(sorted((k, v) for k, v in n.attrs.items() if k.startswith("data-")))
        sk[(n.tag, n.id, data, tuple(sorted(c)))] += 1
    return sk


def js_nodes(tree: Tree) -> dict[str, str]:
    return {js_key(n): tree.outer(n) for n in tree.find(is_js_owned, tree.main())}


def guard(before: Tree, after: Tree) -> list[str]:
    fails = []
    new_errors = [e for e in after.errors if e.split(" at ")[0] not in {x.split(" at ")[0] for x in before.errors}]
    if len(after.errors) > len(before.errors) or new_errors:
        fails.append(f"tags: {len(before.errors)} parse errors before, {len(after.errors)} after: {after.errors[:5]}")
    a, b = skeleton(before), skeleton(after)
    if a != b:
        fails.append(f"skeleton: lost {dict(a - b)}, gained {dict(b - a)}")
    ids = Counter(n.id for n in after.root.walk() if n.id)
    dup = [i for i, c in ids.items() if c > 1]
    if dup:
        fails.append(f"duplicate ids: {dup}")
    ja, jb = js_nodes(before), js_nodes(after)
    changed = [k for k in ja if ja[k] != jb.get(k)] + [k for k in jb if k not in ja]
    if changed:
        fails.append(f"script-owned nodes changed: {changed}")
    for t in after.find(lambda n: "w4-term" in n.cls, after.main()):
        bad = [a.tag for a in t.ancestors() if a.tag in ("h1", "h2", "h3", "summary", "button", "table")]
        if bad:
            fails.append(f"term inside <{bad[0]}> at offset {t.start}: {flatten(after.outer(t))[:60]}")
        pop = next((p for p in t.walk() if "w4-pop" in p.cls), None)
        if pop is not None and len(flatten(after.inner(pop)).split()) > 60:
            fails.append(f"term definition over 60 words: {flatten(after.inner(pop))[:60]}…")
    return fails


# --- the transfer --------------------------------------------------------------


class Stop(Exception):
    pass


def clean(board: Tree, slot: Node, page: Tree, pslot: Node | None, pcard: Node, term_host: str,
          registry: set[str], log: dict, outer: bool) -> str:
    """Board slot HTML, ready for the page. `outer` keeps the slot's own tags."""
    lo, hi = (slot.start, slot.end) if outer else (slot.start_end, slot.end_start)
    # Script-owned descendants: the page's own copy goes back verbatim.
    edits = []
    # Tables are data, not text: the page's own table goes back verbatim,
    # paired by its tbody id or else by order within the slot.
    btables = [n for n in slot.walk() if n.tag == "table"]
    ptables = [m for m in pslot.walk() if m.tag == "table"] if pslot is not None else []
    for i, t in enumerate(btables):
        tid = next((d.id for d in t.walk() if d.tag == "tbody" and d.id), None)
        mine = [m for m in ptables if tid and any(d.id == tid for d in m.walk())] or (
            [ptables[i]] if not tid and i < len(ptables) else [])
        if not mine:
            mine = page.find(lambda m: m.tag == "table" and tid and any(d.id == tid for d in m.walk()), pcard)
        if not mine:
            raise Stop(f"board slot holds a table ({tid or i}) the page slot lacks")
        edits.append((t.start, t.end, page.outer(mine[0])))
    in_table = {id(d) for t in btables for d in t.walk()}
    for n in slot.walk():
        if id(n) in in_table:
            continue
        if n is slot or not is_js_owned(n) or any(is_js_owned(a) for a in n.ancestors() if a is not slot and a.start >= slot.start):
            continue
        key = js_key(n)
        mine = [m for m in page.find(lambda m: is_js_owned(m) and js_key(m) == key, pcard)]
        if not mine:
            raise Stop(f"board slot holds script-owned {key}, which the page card lacks")
        if flatten(board.outer(n)) != flatten(page.outer(mine[0])):
            log["js_text"].append((key, flatten(board.outer(n))[:200], flatten(page.outer(mine[0]))[:200]))
        edits.append((n.start, n.end, page.outer(mine[0])))
    if pslot is not None:
        for m in pslot.walk():
            if m is not pslot and is_js_owned(m) and not any(page.outer(m) in e[2] for e in edits):
                raise Stop(f"page slot holds script-owned {js_key(m)}, which the board slot lacks")
    html = board.src[lo:hi]
    for s, e, rep in sorted(edits, reverse=True):
        html = html[: s - lo] + rep + html[e - lo :]
    page_html = page.outer(pslot) if pslot is not None else ""
    # Styles: only those the page slot already carries survive.
    html = re.sub(r'\sstyle="([^"]*)"', lambda m: m.group(0) if m.group(0) in page_html else "", html)
    html = html.replace("&#x27;", "'")
    # Term ids: w4-term-x-<slug> becomes w4-term-<card>-<slug>, unique page-wide.
    # Ids the page slot already carries are free to reuse, so a rerun is a no-op.
    own = {m.id for m in pslot.walk() if m.id} if pslot is not None else set()

    def rename(m):
        slug = m.group(1)
        base = f"w4-term-{term_host}-{slug}"
        new, i = base, 2
        while new in registry and new not in own:
            new, i = f"{base}-{i}", i + 1
        registry.add(new)
        log["terms"].append(new)
        return new

    ids = {}
    for old in dict.fromkeys(re.findall(r'id="(w4-term-x-[\w-]+)"', html)):
        ids[old] = rename(re.match(r"w4-term-x-([\w-]+)", old))
    for old, new in ids.items():
        html = html.replace(f'"{old}"', f'"{new}"')
    for old, new in FIXUPS:
        if old in html:
            html = html.replace(old, new)
            log["fixups"].append(new)
    return html


def port(board_name: str, page_src: str, before_cards: dict, overrides: dict) -> tuple[str, dict]:
    board = Tree((BOARD_DIR / f"{board_name}.dc.html").read_text())
    page = Tree(page_src)
    bkeys, pkeys = card_keys(board), card_keys(page)
    pby = {k: n for n, k in pkeys.items()}
    registry = {n.id for n in page.root.walk() if n.id} | JS_TERM_IDS
    log = {"board": board_name, "cards": [], "js_text": [], "terms": [], "fixups": [], "held": [],
           "pop_numbers": [], "residual": [], "skipped": [], "dropped_numbers": []}
    edits: list[tuple[int, int, str]] = []
    for bcard, key in bkeys.items():
        if key not in pby:
            raise Stop(f"{board_name}: board card {key} has no page partner")
        pcard = pby[key]
        if is_js_owned(pcard):
            log["skipped"].append(f"{key}: a script builds this card (PORT_PLAN 3.3)")
            continue
        host = key.split(">")[0].split("#")[0]
        card_nums = numbers(flatten(page.outer(pcard))) + [n for p in pops(page.outer(pcard)) for n in numbers(p)]
        rendered = before_cards.get(key, {})
        card_nums += rendered.get("n_text", []) + rendered.get("n_js", []) + rendered.get("n_pop", [])
        bs, ps = slots(board, bcard), slots(page, pcard)
        bk, pk = Counter(k for k, _ in bs), Counter(k for k, _ in ps)
        for k in bk | pk:
            if bk[k] > pk[k] and k not in INSERTABLE:
                raise Stop(f"{board_name}: card {key} has {bk[k]} {k} slot(s) on the board, {pk[k]} on the page")
            if pk[k] > bk[k]:
                raise Stop(f"{board_name}: card {key} has {pk[k]} {k} slot(s) on the page, {bk[k]} on the board")
        changed = []
        seen: Counter = Counter()
        pairs = {}
        for k, bslot in bs:
            i = seen[k]
            seen[k] += 1
            page_matches = [n for kk, n in ps if kk == k]
            pslot = page_matches[i] if i < len(page_matches) else None
            pairs[id(bslot)] = pslot
            label = f"{k}#{i}"
            okey = f"{board_name}|{key}|{label}"
            snap = (set(registry), {k2: list(v) for k2, v in log.items() if isinstance(v, list)})
            new = clean(board, bslot, page, pslot, pcard, host, registry, log, outer=pslot is None)
            if okey in overrides:
                new = overrides[okey]
                log["held"].append((key, label, "override used", []))
            old_text = flatten(page.inner(pslot)) if pslot is not None else ""
            # Stale-number rule.
            have = numbers(old_text) + [n for p in pops(page.inner(pslot)) for n in numbers(p)] if pslot is not None else []
            if k in INSERTABLE:
                have = card_nums
            extra = missing(have, numbers(flatten(new)))
            if extra and okey not in overrides:
                log["held"].append((key, label, flatten(new)[:300], extra))
                continue
            for p in pops(new):
                pn = missing(card_nums, numbers(p))
                if pn:
                    log["pop_numbers"].append((key, label, flatten(p)[:200], pn))
            if pslot is not None:
                if re.sub(r"\s+", " ", new).strip() == re.sub(r"\s+", " ", page.inner(pslot)).strip():
                    continue
                per = None
                if k == "drawers" and okey not in overrides:
                    after_row = (set(registry), {k2: list(v) for k2, v in log.items() if isinstance(v, list)})
                    registry.clear()
                    registry.update(snap[0])
                    for k2, v in snap[1].items():
                        log[k2][:] = v
                    per = drawer_edits(board, bslot, page, pslot, pcard, host, registry, log)
                    if per is None:  # back to the whole-row clean's ids and log
                        registry.clear()
                        registry.update(after_row[0])
                        for k2, v in after_row[1].items():
                            log[k2][:] = v
                if per is not None:
                    if not per:
                        continue
                    edits.extend(per)
                else:
                    edits.append((pslot.start_end, pslot.end_start, reindent(new, page.inner(pslot))))
                changed.append((label, old_text, flatten(new)))
            else:
                edits.append(insertion(board, bslot, page, bcard, pcard, new, key))
                changed.append((label + " (added)", "", flatten(new)))
        if changed:
            log["cards"].append((key, changed))
    out = page_src
    for s, e, rep in sorted(edits, key=lambda x: x[0], reverse=True):
        out = out[:s] + rep + out[e:]
    after = Tree(out)
    fails = guard(page, after)
    if fails:
        raise Stop(f"{board_name}: guard failed\n  " + "\n  ".join(fails))
    # Numbers a card loses (the board drops them), and text that still
    # differs from the board outside script-owned nodes.
    akeys = {k: n for n, k in card_keys(after).items()}

    def card_numbers(tree: Tree, card: Node) -> list[str]:
        html = tree.outer(card)
        return numbers(flatten(html)) + [n for p in pops(html) for n in numbers(p)]

    for bcard, key in bkeys.items():
        if key in akeys and not is_js_owned(akeys[key]):
            dropped = missing(card_numbers(after, akeys[key]), card_numbers(page, pby[key]))
            if dropped:
                log["dropped_numbers"].append((key, dropped))
            d = residual(board, bcard, after, akeys[key])
            if d:
                log["residual"].append((key, d))
    return out, log


def drawer_edits(board: Tree, bslot: Node, page: Tree, pslot: Node, pcard: Node, host: str,
                 registry: set[str], log: dict):
    """Splice a drawer row one <details> at a time, so a drawer whose text the
    board leaves alone keeps the page's bytes. None when the two rows order
    their shared drawers differently (the caller then replaces the row)."""

    def name(tree: Tree, d: Node) -> str:
        s = next((c for c in d.children if c.tag == "summary"), None)
        return flatten(tree.inner(s)) if s is not None else ""

    def same(a: str, b: str) -> bool:
        return flatten(a).replace("&#x27;", "'") == flatten(b).replace("&#x27;", "'")

    bd = [d for d in bslot.children if d.tag == "details"]
    pd = [d for d in pslot.children if d.tag == "details"]
    if not pd or len(bd) != len(bslot.children) or len(pd) != len(pslot.children):
        return None
    bnames = [name(board, d) for d in bd]
    pmap = {name(page, d): d for d in pd}
    if len(pmap) != len(pd) or len(set(bnames)) != len(bnames):
        return None
    if [n for n in bnames if n in pmap] != [name(page, d) for d in pd if name(page, d) in bnames]:
        return None
    line_start = page.src.rfind("\n", 0, pd[0].start) + 1
    indent = re.match(r"[ \t]*", page.src[line_start:]).group(0)
    edits, inserts, prev = [], {}, None
    for d in pd:
        if name(page, d) not in bnames:
            ls = page.src.rfind("\n", 0, d.start)
            edits.append((ls if page.src[ls + 1 : d.start].strip() == "" else d.start, d.end, ""))
    for d in bd:
        mine = pmap.get(name(board, d))
        html = clean(board, d, page, mine, pcard, host, registry, log, outer=True)
        one = re.sub(r"\s*\n\s*", " ", html.strip())
        if mine is not None:
            if not same(html, page.outer(mine)):
                edits.append((mine.start, mine.end, one))
            prev = mine
        elif prev is not None:
            inserts.setdefault(prev.end, []).append("\n" + indent + one)
        else:
            inserts.setdefault(pd[0].start, []).append(one + "\n" + indent)
    edits += [(at, at, "".join(parts)) for at, parts in inserts.items()]
    return edits


def insertion(board: Tree, bslot: Node, page: Tree, bcard: Node, pcard: Node, html: str, key: str):
    """Where a drawer row or answers list the page lacks goes: after the page
    partner of the board slot's previous sibling, or at the end of the
    partner of its parent, found by the element path from the card."""

    def path(n: Node, card: Node) -> list[tuple[str, int]]:
        out = []
        while n is not card:
            out.append((n.tag, n.parent.children.index(n)))
            n = n.parent
        return out[::-1]

    def follow(card: Node, steps) -> Node:
        n = card
        for tag, i in steps:
            if i >= len(n.children) or n.children[i].tag != tag:
                raise Stop(f"card {key}: the page's structure differs from the board's around the inserted {bslot.tag}")
            n = n.children[i]
        return n

    parent = follow(pcard, path(bslot.parent, bcard)) if bslot.parent is not bcard else pcard
    sibs = bslot.parent.children
    i = sibs.index(bslot)
    if i == len(sibs) - 1:
        anchor = parent.children[-1] if parent.children else None
        if anchor is None:
            raise Stop(f"card {key}: nowhere to insert")
        if len(parent.children) != len(sibs) - 1:
            raise Stop(f"card {key}: the page column has {len(parent.children)} children, the board {len(sibs) - 1} before the insert")
    else:
        anchor = follow(pcard, path(sibs[i - 1], bcard)) if i else None
        if anchor is None:
            raise Stop(f"card {key}: inserted {bslot.tag} has no previous sibling")
    line_start = page.src.rfind("\n", 0, anchor.start) + 1
    indent = re.match(r"[ \t]*", page.src[line_start:]).group(0)
    one_line = re.sub(r"\s*\n\s*", " ", html.strip())
    return (anchor.end, anchor.end, "\n" + indent + one_line)


def residual(board: Tree, bcard: Node, page: Tree, pcard: Node) -> list[str]:
    def text(tree: Tree, card: Node) -> list[str]:
        src = tree.outer(card)
        cuts = sorted(
            (n.start - card.start, n.end - card.start)
            for n in tree.find(lambda n: n is not card and (is_js_owned(n) or is_card(n) or n.tag in ("svg", "img", "table", "select")), card)
        )
        keep, at = [], 0
        for s, e in cuts:
            if s >= at:
                keep.append(src[at:s])
                at = e
        keep.append(src[at:])
        return flatten(" ".join(keep)).replace("&#x27;", "'").split()

    a, b = text(page, pcard), text(board, bcard)
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op != "equal":
            out.append(f"page «{' '.join(a[i1:i2])}» board «{' '.join(b[j1:j2])}»")
    return out


def report(log: dict, lint_before: Counter, lint_after: Counter) -> str:
    L = [f"## {log['board']}", ""]
    L.append("Slot table extension in use: hero lines (`.w4-hero-text > p.body, p.caution`), opener lines "
             "(`header.w4-opener h2, p`) and finding lines (`.w4-finding > div > h3, p`).")
    L.append("")
    if not log["cards"]:
        L.append("No slot changed.")
    for key, changed in log["cards"]:
        L.append(f"### {key}")
        for label, old, new in changed:
            L.append(f"- **{label}**")
            L.append(f"  - before: {old or '(none)'}")
            L.append(f"  - after: {new}")
        L.append("")
    for title, rows in [
        ("Terms added", [f"`{t}`" for t in log["terms"]]),
        ("Fix-ups applied (3.7)", log["fixups"]),
        ("Cards a script builds (skipped, see 3.3)", log["skipped"]),
        ("Held slots: board number not on the page (stale-number rule)",
         [f"{k} {lab}: board numbers {x} not in the page slot; board text: {t}" for k, lab, t, x in log["held"]]),
        ("Numbers the board drops (accepted, list in the PR body)",
         [f"{k}: {d}" for k, d in log["dropped_numbers"]]),
        ("Numbers in new term definitions (check each is a scale, not a result)",
         [f"{k} {lab}: {x} in «{t}»" for k, lab, t, x in log["pop_numbers"]]),
        ("Script-owned text that differs from the board (3.3)",
         [f"{k}: board «{b}» page «{p}»" for k, b, p in log["js_text"]]),
        ("Text that still differs from the board, outside script-owned nodes",
         [f"{k}: {d}" for k, ds in log["residual"] for d in ds]),
    ]:
        L.append(f"**{title}:** " + ("none" if not rows else ""))
        L.extend(f"- {r}" for r in rows)
        L.append("")
    new_hits = lint_after - lint_before
    L.append("**Style lint (3.7) on the page text:** " + ("no new hits" if not new_hits else ""))
    L.extend(f"- new: {n}: «{ctx}»" for (n, ctx), c in new_hits.items())
    L.extend(f"- already on the page: {n}: «{ctx}»" for (n, ctx), c in (lint_after & lint_before).items())
    L.append("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("boards", nargs="+")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--page", default=str(PAGE))
    ap.add_argument("--before", default=str(AUDIT / "before.json"))
    ap.add_argument("--board-dir", default=str(BOARDS), help="read boards from here (for testing the tool)")
    args = ap.parse_args()
    global BOARD_DIR
    BOARD_DIR = Path(args.board_dir)
    before_cards = json.loads(Path(args.before).read_text())["cards"]
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}
    src = Path(args.page).read_text()
    parts = []
    for name in args.boards:
        lint_before = lint(src)
        try:
            src, log = port(name, src, before_cards, overrides)
        except Stop as e:
            print(f"STOP: {e}", file=sys.stderr)
            sys.exit(1)
        parts.append(report(log, lint_before, lint(src)))
        print(parts[-1])
    if not args.dry_run:
        Path(args.page).write_text(src)
        rep = AUDIT / "port_text.md"
        head = "" if rep.exists() else "# Text transfer report\n\nWritten by `tools/port_text.py`, one section per board.\n\n"
        with rep.open("a") as f:
            f.write(head + "\n".join(parts) + "\n")


if __name__ == "__main__":
    main()
