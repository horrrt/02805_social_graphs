"""Builds the canvas page "Brief gaps": one board per Week 4 concept the live
page does not show yet, drawn in the recommended deep-dive vocabulary (the
rx-* topic boards) from analysis/week04_brief_gaps.json.

Usage: python build_gaps.py HELMET_SOURCE OUT_DIR
  HELMET_SOURCE  a live RTopic*.dc.html read from the canvas; its <head> links
                 and <helmet> are reused so the boards share the canvas's CSS.
  OUT_DIR        where project/Gap*.dc.html and preview/*.html are written.
Heights come from gaps_heights.json; after a content change, re-measure the
previews against the site CSS and update it.
"""

import json
import re
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = json.loads((ROOT / "analysis/week04_brief_gaps.json").read_text())
EXPLORE = json.loads((ROOT / "docs/weeks/week04/data/explore.json").read_text())
NAMES = {m["id"]: m["name"] for m in EXPLORE["metros"]}
PAGE = {m["id"]: m["community"] for m in EXPLORE["metros"]}

INK, SOFT, FAINT, GRID, RULE, ACCENT = "#0f2340", "#46618a", "#7a8fac", "#e6ecf3", "#dce5f0", "#14618f"
GROUP = {0: "#6d4fd6", 1: "#15896a", 2: "#7a8fac"}
GROUP_NAME = {0: "New York–Dallas", 1: "San Jose–San Francisco", 2: "Detroit–Phoenix"}
CAP, SMALL = 11.5, 12.5  # --fs-caption, --fs-small

TOPBAR = """<div class="topbar">
<div class="shell">
<a class="brand" href="../../">LOG–LOG <b>LEGENDS</b></a>
<a class="site-link" href="../../#weeks">All posts</a>
<nav aria-label="Sections of this post" class="topnav">
<a href="#opening">Opening</a>
<a href="#place">Where</a>
<a href="#jobs">Jobs</a>
<a href="#who">Staffing</a>
<a href="#footprint">Giants out</a>
<a href="#beyond">Beyond</a>
<a class="here" href="#cut">Deep dive</a>
</nav>
</div>
</div>"""


def fmt(x, d=3):
    return f"{x:,.{d}f}".replace("-", "−")


def n(x):
    return f"{x:,.0f}"


def t(x, y, s, size=CAP, fill=FAINT, anchor="start", weight=None, extra=""):
    w = f' font-weight="{weight}"' if weight else ""
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}"{w}{extra}>{escape(str(s))}</text>'


def svg(w, h, label, body):
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{escape(label)}" '
            f'style="display:block">{body}</svg>')


def figure(title, note, body):
    return (f'<figure class="w4-figure"><figcaption><b>{escape(title)}</b><span>{note}</span></figcaption>'
            f'<div class="w4-figure-body">{body}</div></figure>')


def term(key, word, pop):
    return (f'<span class="w4-term"><button aria-describedby="gap-term-{key}" type="button">{word}</button>'
            f'<span class="w4-pop" id="gap-term-{key}" role="tooltip">{pop}</span></span>')


def notice(text):
    return f'<div class="notice"><span class="ico">💡</span><span><b>What to notice</b> <span>{text}</span></span></div>'


def drawers(items):
    out = "".join(f'<details class="rx-drawer"><summary>{escape(k)}</summary><div class="rx-drawer-body">'
                  + "".join(f"<p>{p}</p>" for p in v) + "</div></details>" for k, v in items)
    return f'<div class="rx-drawers rx-foot">{out}</div>'


def card(num, title, answer, sub, parts):
    # With a chart beside the text, the lead paragraph joins the text column.
    opener = '<div class="w4-two"><div>'
    if sub and parts.startswith(opener):
        parts = parts.replace(opener, f'{opener}<p class="sub" style="margin-top:0">{sub}</p>', 1)
        sub = ""
    return (f'<div class="card w4-card"><header class="w4-q"><span class="w4-num">{num}</span><div>'
            f'<h2>{escape(title)}</h2><p class="w4-answer">{answer}</p></div></header>'
            f'{f"<p class=\"sub\">{sub}</p>" if sub else ""}{parts}</div>')


def two(left, fig):
    return f'<div class="w4-two"><div>{left}</div>{fig}</div>'


def row(*figs):
    return f'<div class="rx-fig-row">{"".join(figs)}</div>'


def topic_bar(title, holds):
    return (f'<div class="rx-topic-bar"><a class="rx-back" href="GapGuide.dc.html">← Brief gaps</a><div>'
            f'<h2 class="rx-topic-title">{escape(title)}</h2><p class="rx-topic-holds">{holds}</p></div></div>')


# ------------------------------------------------------------------ charts

def hbars(rows, lo, hi, w=556, label_w=200, tick_vals=(), fmtv=lambda v: fmt(v), aria=""):
    """rows: (label, value, colour, bold, note). Zero line where the axis crosses 0."""
    rh, top = 30, 6
    h = top + rh * len(rows) + 30
    x0, x1 = label_w, w - 60
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    b = []
    for v in tick_vals:
        b.append(f'<line x1="{X(v):.1f}" y1="{top}" x2="{X(v):.1f}" y2="{h - 26}" stroke="{GRID}"/>')
        b.append(t(X(v), h - 10, fmtv(v), anchor="middle"))
    if lo < 0 < hi:
        b.append(f'<line x1="{X(0):.1f}" y1="{top}" x2="{X(0):.1f}" y2="{h - 26}" stroke="{FAINT}"/>')
    for i, (lab, v, col, bold, note) in enumerate(rows):
        y = top + i * rh + rh / 2
        b.append(t(0, y + 4, lab, SMALL, INK, weight=700 if bold else 500))
        a, z = sorted((X(0 if lo < 0 else lo), X(v)))
        b.append(f'<rect x="{a:.1f}" y="{y - 9:.1f}" width="{max(z - a, 1.5):.1f}" height="18" rx="3" fill="{col}">'
                 f'<title>{escape(lab)}: {fmtv(v)}{(", " + note) if note else ""}</title></rect>')
        vx = z + 6 if v >= 0 else a - 6
        b.append(t(vx, y + 4, fmtv(v), CAP, SOFT, "start" if v >= 0 else "end"))
    return svg(w, h, aria, "".join(b))


def dendrogram(layout, heights, cut_groups, w, h, aria, top_down=False):
    """layout from week04_brief_gaps.dendrogram_layout; heights[i] is merge i's level (1-based).
    Bottom-up: merge 1 near the leaves. Top-down trees pass heights counted from the root."""
    n = len(layout["leaves"])
    left, right, top, base = 14, w - 14, 26, h - 100
    step = (right - left) / (n - 1)
    X = lambda x: left + x * step
    maxh = max(heights)
    Y = lambda lv: base - lv / maxh * (base - top)
    b = []
    xs = {int(v): x for v, x in layout["vertex_x"].items()}
    for m in layout["merges"]:
        xs[m["node"]] = m["x"]
    ys = {i: base for i in range(n)}
    for m, lv in zip(layout["merges"], heights):
        ys[m["node"]] = Y(lv)
    for m in layout["merges"]:
        a, c, v = m["a"], m["b"], m["node"]
        yv = ys[v]
        for ch in (a, c):
            b.append(f'<line x1="{X(xs[ch]):.1f}" y1="{ys[ch]:.1f}" x2="{X(xs[ch]):.1f}" y2="{yv:.1f}" stroke="{INK}" stroke-width="1.2"/>')
        b.append(f'<line x1="{X(xs[a]):.1f}" y1="{yv:.1f}" x2="{X(xs[c]):.1f}" y2="{yv:.1f}" stroke="{INK}" stroke-width="1.2"/>')
    if cut_groups:
        # the cut sits between the merge that leaves cut_groups pieces and the next one up
        lv_cut = n - cut_groups  # merges done when cut_groups pieces remain
        yc = (Y(heights[lv_cut - 1]) + Y(heights[lv_cut])) / 2 if lv_cut < len(heights) else top
        b.append(f'<line x1="{left - 6}" y1="{yc:.1f}" x2="{right + 6}" y2="{yc:.1f}" stroke="{ACCENT}" stroke-dasharray="5 4" stroke-width="1.5"/>')
    for lf in layout["leaves"]:
        x = X(lf["x"])
        col = GROUP[PAGE[lf["id"]]]
        b.append(f'<circle cx="{x:.1f}" cy="{base:.1f}" r="4" fill="{col}"><title>{escape(lf["name"])}: {GROUP_NAME[PAGE[lf["id"]]]}</title></circle>')
        b.append(f'<text x="{x - 4:.1f}" y="{base + 10:.1f}" font-size="{CAP}" fill="{SOFT}" transform="rotate(90 {x - 4:.1f} {base + 10:.1f})">{escape(lf["name"])}</text>')
    return svg(w, h, aria, "".join(b))


def merges_from_levels(levels, ids):
    """Girvan-Newman levels (coarse to fine partitions) -> bottom-up merges over vertex indices."""
    idx = {k: i for i, k in enumerate(ids)}
    parts = [lv["partition"] for lv in levels]  # components 2..40
    n = len(ids)
    groups_of = lambda p: {frozenset(k for k in ids if p[k] == c) for c in set(p.values())}
    finest = groups_of(parts[-1])
    assert len(finest) == n
    node_of = {frozenset([k]): idx[k] for k in ids}
    merges, level_of = [], []
    nxt = n
    prev = finest
    for depth in range(len(parts) - 2, -2, -1):
        coarse = groups_of(parts[depth]) if depth >= 0 else {frozenset(ids)}
        new = [g for g in coarse if g not in prev]
        assert len(new) == 1
        g = new[0]
        kids = [p for p in prev if p <= g]
        assert len(kids) == 2
        merges.append((node_of[kids[0]], node_of[kids[1]]))
        node_of[g] = nxt
        nxt += 1
        level_of.append(depth + 2)  # the GN level (number of pieces) this split creates... top-down depth
        prev = coarse
    return merges, level_of


def layout_from_merges(n, merges, ids):
    children = {n + i: m for i, m in enumerate(merges)}
    root = n + len(merges) - 1
    leaves = []

    def walk(v):
        if v < n:
            leaves.append(v)
        else:
            walk(children[v][0])
            walk(children[v][1])

    walk(root)
    x = {v: i for i, v in enumerate(leaves)}
    out = []
    for i, (a, b) in enumerate(merges):
        x[n + i] = (x[a] + x[b]) / 2
        out.append({"a": a, "b": b, "node": n + i, "x": x[n + i]})
    return {"leaves": [{"id": ids[v], "name": NAMES[ids[v]], "x": x[v]} for v in leaves], "merges": out,
            "vertex_x": {str(v): x[v] for v in range(n)}}


def backbone_order():
    """igraph vertex order used by week04_brief_gaps.backbone_greedy: nx node insertion order = explore metros."""
    return [m["id"] for m in EXPLORE["metros"]]


def qcurve(qs, w=556, h=250):
    left, right, top, base = 48, w - 16, 20, h - 44
    ks = [r["groups"] for r in qs]
    lo, hi = -0.04, 0.065
    import math
    X = lambda k: left + math.log(k) / math.log(40) * (right - left)
    Y = lambda q: base - (q - lo) / (hi - lo) * (base - top)
    b = []
    for v in (-0.04, -0.02, 0, 0.02, 0.04, 0.06):
        b.append(f'<line x1="{left}" x2="{right}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="{GRID}"/>')
        b.append(t(left - 8, Y(v) + 4, fmt(v, 2), anchor="end"))
    for k in (1, 2, 3, 5, 10, 20, 40):
        b.append(t(X(k), base + 16, k, anchor="middle", fill=SOFT))
    b.append(t((left + right) / 2, base + 36, "groups left after each merge, log scale (40 = every metro alone)", anchor="middle"))
    pts = " ".join(f"{X(r['groups']):.1f},{Y(r['Q']):.1f}" for r in qs)
    b.append(f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>')
    best = max(qs, key=lambda r: r["Q"])
    b.append(f'<circle cx="{X(best["groups"]):.1f}" cy="{Y(best["Q"]):.1f}" r="6" fill="{INK}"><title>Greedy merging peaks at {best["groups"]} groups, Q = {best["Q"]:.3f}</title></circle>')
    b.append(t(X(best["groups"]) + 10, Y(best["Q"]) - 8, f"Peak: 2 groups, Q = {best['Q']:.3f}", SMALL, INK, weight=700))
    q3 = 0.049
    b.append(f'<circle cx="{X(3):.1f}" cy="{Y(q3):.1f}" r="6" fill="#fff" stroke="{GROUP[0]}" stroke-width="2.2"><title>The page: Louvain\'s three groups, Q = 0.049</title></circle>')
    b.append(t(X(3) + 12, Y(q3) + 16, "The page: Louvain's 3 groups, Q = 0.049", SMALL, SOFT))
    return svg(w, h, "Modularity after each greedy merge, by the number of groups left", "".join(b))


def route_chain(ex, w=508, h=200):
    names, ws = ex["route"], ex["route_weights"]
    left, right = 30, w - 30
    y = 86
    xs = [left + i / (len(names) - 1) * (right - left) for i in range(len(names))]
    b = []
    b.append(f'<path d="M{xs[0]:.1f},{y} Q{(xs[0] + xs[-1]) / 2:.1f},{y + 120} {xs[-1]:.1f},{y}" fill="none" stroke="{FAINT}" stroke-width="1.2" stroke-dasharray="4 3"/>')
    b.append(t((xs[0] + xs[-1]) / 2, y + 74, f"direct link: {n(ex['direct_weight'])}, length 1/{n(ex['direct_weight'])}", CAP, SOFT, "middle"))
    for i in range(len(names) - 1):
        wv = ws[i]
        sw = 1.5 + 5 * (wv / max(ws))
        b.append(f'<line x1="{xs[i]:.1f}" y1="{y}" x2="{xs[i + 1]:.1f}" y2="{y}" stroke="{INK}" stroke-width="{sw:.1f}"/>')
        b.append(t((xs[i] + xs[i + 1]) / 2, y - 14, n(wv), SMALL, INK, "middle", 700))
    ids = {v: k for k, v in NAMES.items()}
    for x, nm in zip(xs, names):
        col = GROUP[PAGE[ids[nm]]]
        b.append(f'<circle cx="{x:.1f}" cy="{y}" r="9" fill="{col}" stroke="#fff" stroke-width="2"/>')
        b.append(t(x, y + 28, nm, SMALL, INK, "middle", 600))
    total = sum(1 / v for v in ws)
    b.append(t(w / 2, 22, f"route length {total:.4f}  ·  direct length {1 / ex['direct_weight']:.4f}", CAP, SOFT, "middle"))
    return svg(w, h, f"The strongest route from {names[0]} to {names[-1]}", "".join(b))


def dumbbells(rows, w=556):
    rh, top, lab_w = 30, 26, 230
    h = top + rh * len(rows) + 34
    x0, x1 = lab_w, w - 20
    X = lambda r: x0 + (r - 1) / 288 * (x1 - x0)
    b = []
    for v in (1, 50, 100, 150, 200, 250, 289):
        b.append(f'<line x1="{X(v):.1f}" y1="{top - 6}" x2="{X(v):.1f}" y2="{h - 30}" stroke="{GRID}"/>')
        b.append(t(X(v), h - 14, v, anchor="middle"))
    b.append(t(x0, 12, "rank of 289, 1 = most central", CAP, FAINT))
    for i, r in enumerate(rows):
        y = top + i * rh + rh / 2
        title = r["title"].replace(", Except Special and Career/Technical Education", "").replace(", Except Special Education", "")
        b.append(t(0, y + 4, title if len(title) < 34 else title[:32] + "…", SMALL, INK, weight=600))
        a, z = X(r["eigen_rank"]), X(r["pagerank_rank"])
        b.append(f'<line x1="{a:.1f}" y1="{y:.1f}" x2="{z:.1f}" y2="{y:.1f}" stroke="{RULE}" stroke-width="3"/>')
        b.append(f'<circle cx="{a:.1f}" cy="{y:.1f}" r="5.5" fill="#fff" stroke="{INK}" stroke-width="2"><title>{escape(r["title"])}: eigenvector rank {r["eigen_rank"]}</title></circle>')
        b.append(f'<circle cx="{z:.1f}" cy="{y:.1f}" r="5.5" fill="{ACCENT}"><title>{escape(r["title"])}: PageRank rank {r["pagerank_rank"]}, {r["degree"]} partners</title></circle>')
    return svg(w, h, "Eigenvector rank against PageRank rank for the ten occupations that move most", "".join(b))


def gamma_charts(rows, w=508, h=240):
    left, right, top, base = 48, w - 16, 20, h - 50
    gs = [r["gamma"] for r in rows]
    X = lambda g: left + gs.index(g) / (len(gs) - 1) * (right - left)
    import math
    Yc = lambda c: base - math.log10(c) / math.log10(40) * (base - top)
    a = []
    for v in (1, 3, 10, 40):
        a.append(f'<line x1="{left}" x2="{right}" y1="{Yc(v):.1f}" y2="{Yc(v):.1f}" stroke="{GRID}"/>')
        a.append(t(left - 8, Yc(v) + 4, v, anchor="end"))
    for g in gs:
        a.append(t(X(g), base + 16, f"{g:g}", anchor="middle", fill=SOFT))
    a.append(t((left + right) / 2, base + 38, "resolution γ (1 = standard modularity)", anchor="middle"))
    a.append(f'<line x1="{X(1.0):.1f}" x2="{X(1.0):.1f}" y1="{top}" y2="{base}" stroke="{FAINT}" stroke-dasharray="4 3"/>')
    a.append(f'<polyline points="{" ".join(f"{X(r["gamma"]):.1f},{Yc(r["groups_median"]):.1f}" for r in rows)}" fill="none" stroke="{INK}" stroke-width="2.2"/>')
    for r in rows:
        a.append(f'<g><title>γ = {r["gamma"]:g}: median {r["groups_median"]:g} groups over 100 runs (range {r["groups_min"]} to {r["groups_max"]})</title>'
                 f'<circle cx="{X(r["gamma"]):.1f}" cy="{Yc(r["groups_median"]):.1f}" r="4.5" fill="#fff" stroke="{INK}" stroke-width="2"/></g>')
        a.append(t(X(r["gamma"]), Yc(r["groups_median"]) - 10, f'{r["groups_median"]:g}', SMALL, INK, "middle", 700))
    chart1 = svg(w, h, "Groups Louvain finds at each resolution", "".join(a))
    Yn = lambda v: base - v * (base - top)
    b = []
    for v in (0, 0.25, 0.5, 0.75, 1):
        b.append(f'<line x1="{left}" x2="{right}" y1="{Yn(v):.1f}" y2="{Yn(v):.1f}" stroke="{GRID}"/>')
        b.append(t(left - 8, Yn(v) + 4, fmt(v, 2), anchor="end"))
    for g in gs:
        b.append(t(X(g), base + 16, f"{g:g}", anchor="middle", fill=SOFT))
    b.append(t((left + right) / 2, base + 38, "resolution γ", anchor="middle"))
    b.append(f'<line x1="{X(1.0):.1f}" x2="{X(1.0):.1f}" y1="{top}" y2="{base}" stroke="{FAINT}" stroke-dasharray="4 3"/>')
    live = [r for r in rows if r["groups_median"] > 1]
    for key, col, lab, dash in (("nmi_page", GROUP[0], "the page's 3 groups", ""), ("nmi_census", ACCENT, "Census regions", ' stroke-dasharray="6 4"')):
        b.append(f'<polyline points="{" ".join(f"{X(r["gamma"]):.1f},{Yn(r[key]):.1f}" for r in live)}" fill="none" stroke="{col}" stroke-width="2.2"{dash}/>')
        for r in live:
            b.append(f'<circle cx="{X(r["gamma"]):.1f}" cy="{Yn(r[key]):.1f}" r="4" fill="{col}"><title>γ = {r["gamma"]:g}: NMI with {lab} {r[key]:.2f}</title></circle>')
        last = live[-1]
        b.append(t(X(last["gamma"]) - 4, Yn(last[key]) + (-10 if key == "nmi_census" else 18), lab, SMALL, col, "end", 700))
    chart2 = svg(w, h, "How closely Louvain's groups match the page and Census regions at each resolution", "".join(b))
    return chart1, chart2


def swatches(cols, proposed, w=556):
    rowsd = [("As drawn", "hex"), ("Deuteranopia", "deuteranopia"), ("Protanopia", "protanopia")]
    rh, top, lab_w, sw = 44, 26, 130, 116
    h = top + rh * (len(rowsd) * 2) + 40
    gap = 20
    b = [t(lab_w + j * (sw + gap), 14, nm, CAP, SOFT) for j, nm in enumerate(("New York–Dallas", "San Jose–S. Francisco", "Detroit–Phoenix"))]
    y = top
    for title, pal in (("Now", cols), ("Proposed", proposed)):
        b.append(t(0, y + 14, title, SMALL, INK, weight=700))
        for lab, key in rowsd:
            b.append(t(0, y + 34, lab, CAP, SOFT))
            for j in range(3):
                c = pal[str(j)][key]
                b.append(f'<rect x="{lab_w + j * (sw + gap)}" y="{y + 20}" width="{sw}" height="22" rx="4" fill="{c}"><title>{title}, {lab.lower()}: {c}</title></rect>')
            y += rh * 0.62
        y += 26
    return svg(w, int(y + 8), "The three metro group colours as drawn and as seen with red-green colour blindness", "".join(b))


# ------------------------------------------------------------------ boards

def board(title, height, body, helmet_head, helmet_block):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>{escape(title)}</title>
<script src="./support.js"></script>
{helmet_head}
</head>
<body>
<x-dc>
{helmet_block}
<div class="corridor rx" style="width: 1440px; height: {height}px; overflow: hidden; background: #eef3f9">{TOPBAR}<main id="main"><div class="shell"><section class="step" id="cut">
{body}
</section></div></main></div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview": {{"width": 1440, "height": {height}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


def g1():
    m = DATA["modularity_by_hand"]
    gv = DATA["grouped_vs_right"]
    W = DATA["metros"]["total_weight"]
    rows = "".join(
        f'<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:{GROUP[r["community"]]};margin-right:8px"></span>{escape(r["label"])}</td>'
        f'<td class="num">{r["metros"]}</td><td class="num">{n(r["w_in"])}</td><td class="num">{fmt(r["inside_share"], 4)}</td>'
        f'<td class="num">{n(r["strength"])}</td><td class="num">{fmt(r["expected_share"], 4)}</td><td class="num"><b>{fmt(r["contribution"], 4)}</b></td></tr>'
        for r in m["rows"])
    table = (f'<div class="rx-table-block"><h4>The sum, group by group</h4><table><thead><tr><th>Group</th><th class="num">Metros</th>'
             f'<th class="num">Weight inside, w<sub>c</sub></th><th class="num">w<sub>c</sub> / W</th><th class="num">Strength, s<sub>c</sub></th>'
             f'<th class="num">(s<sub>c</sub> / 2W)²</th><th class="num">Adds to Q</th></tr></thead><tbody>{rows}'
             f'<tr><td>All three</td><td class="num">40</td><td class="num" colspan="4" style="text-align:right;color:{SOFT}">W = {n(W)}</td><td class="num"><b>{fmt(m["Q"], 3)}</b></td></tr></tbody></table></div>')
    formula = (f'<div class="plot" style="margin-top:14px"><h3>The formula</h3><p class="axis-note">For each group c, the share of all link weight that falls inside it, minus the share a network with the same strengths would put there by chance.</p>'
               f'<p style="font-size:var(--fs-strong);margin:10px 0 0;color:{INK}">Q = Σ<sub>c</sub> [ w<sub>c</sub> / W − ( s<sub>c</sub> / 2W )² ]</p></div>')
    chart = hbars([
        ("Two groups (greedy merging)", 0.0571, INK, True, "Louvain finds it in 35 of 100 runs"),
        ("Louvain's three groups, on the page", gv["louvain_groups"], GROUP[0], True, ""),
        ("Census regions", gv["census_regions"], ACCENT, True, "the grouping a reader would call right"),
        ("Everything in one group", gv["everything_in_one"], FAINT, False, ""),
        ("Three groups, labels shuffled", gv["shuffled_groups_mean"], "#b9cadf", False, f"mean of 1,000 shuffles, sd {gv['shuffled_groups_sd']:.3f}"),
    ], -0.03, 0.065, tick_vals=(-0.02, 0, 0.02, 0.04, 0.06), aria="Modularity of five ways to group the 40 metros")
    left = (formula + notice(f"Census regions score Q = {gv['census_regions']:.3f}, barely above one big group, while the page's groups score {gv['louvain_groups']:.3f}. "
                             "Q says how grouped a split is. It cannot say whether the split is the right one."))
    body = topic_bar("Where the hiring is", "Would join the box <i>Are the three metro groups more than chance?</i> and the Modularity tab.") + card(
        "G1", "What does each metro group add to modularity?",
        f"Each group holds slightly more filing weight than chance would give it, and the three surpluses add up to Q = {m['Q']:.3f}.",
        "The brief works modularity out by hand, one community at a time. Here is the same sum for section 1's three groups.",
        two(left, figure("Grouped is not the same as right", "Modularity of five ways to split the same 40 metros.", chart)) + table + drawers([
            ("Method", [f"W is the total link weight of section 1's full network, {n(W)}: two metros are linked when a company files in both, "
                        "weighted by the smaller of its two filing counts. A metro's strength is the sum of its link weights; s<sub>c</sub> adds them up over the group. "
                        "The sum matches igraph's modularity to nine decimal places."]),
            ("More numbers", [f"1,000 shuffles of the three group labels, keeping the group sizes, average Q = {gv['shuffled_groups_mean']:.3f} "
                              f"(sd {gv['shuffled_groups_sd']:.3f}). Putting every metro in one group gives exactly 0."]),
        ]))
    return body


def g2():
    gb = DATA["greedy_backbone"]
    gf = DATA["greedy"]
    ids = backbone_order()
    n_ = 40
    # bottom-up greedy on the backbone
    lay_g = layout_from_merges(n_, [(m["a"], m["b"]) for m in gb["layout"]["merges"]], ids)
    heights_g = list(range(1, n_))
    # top-down Girvan-Newman: merges rebuilt from its levels, drawn with the first split at the top
    merges, _ = merges_from_levels(EXPLORE["girvan_newman"]["levels"], ids)
    lay_gn = layout_from_merges(n_, merges, ids)
    heights_gn = list(range(1, n_))
    d1 = dendrogram(lay_g, heights_g, gb["best"]["groups"], 508, 330, "Greedy merging on the backbone, bottom up")
    d2 = dendrogram(lay_gn, heights_gn, None, 508, 330, "Girvan–Newman on the backbone, top down", top_down=True)
    lead = figure("Modularity after each merge", "Greedy merging on the full weighted network, read right to left.", qcurve(gf["q_by_groups"]))
    big = [NAMES[k] for k, v in gf["best_partition"].items() if v == gf["best_partition"]["35620"]]
    left = notice(f"The peak splits off the {len(big)} largest hubs ({', '.join(big[:6])} and {len(big) - 6} more) from the other {40 - len(big)} metros. "
                  "Louvain finds this same split in 35 of its 100 runs; the page shows the three-group split it finds in the other 65, which scores lower.")
    body = topic_bar("Where the hiring is", "Would become a fifth tab in the community methods: Greedy.") + card(
        "G2", "Does merging from the bottom up find the same groups?",
        f"No. Greedy merging peaks at two groups with Q = {gf['best']['Q']:.3f}, higher than the page's three groups at 0.049.",
        f"Greedy merging (Newman 2004) starts with every metro alone and joins the two groups whose merger raises modularity most, until one group is left. It keeps the level with the highest Q, and never undoes a merge. The {term('dendro', 'dendrogram', 'A tree of every level at once: metros at the bottom, the whole network at the top, each join or split one horizontal line.')} records every level.",
        two(left, lead) + row(
            figure("Bottom up: greedy merging", f"On the 180 backbone links, unweighted. The dashed line cuts at the best level, 2 groups, Q = {gb['best']['Q']:.3f}. Dots: the page's three groups.", d1),
            figure("Top down: Girvan–Newman", "Same backbone. Each cut strands one metro, so the tree is a ladder and the best level scores Q = −0.000.", d2),
        ) + drawers([
            ("Background", ["Girvan–Newman builds its tree from the top, cutting the link with the highest edge betweenness and recomputing. Greedy merging builds from the bottom. "
                            "On the backbone New York and Dallas link to all 39 other metros, so every cut strands a single metro and Girvan–Newman never finds a group. Greedy merging, which only looks at modularity, finds two."]),
            ("Method", ["igraph's community_fastgreedy (Clauset, Newman and Moore 2004), which is Newman's 2004 greedy algorithm with faster bookkeeping. "
                        "The chart beside the text runs it on the full weighted network of 780 links; the two trees run on the unweighted α = 0.2 backbone, the network Girvan–Newman uses on the page."]),
            ("More numbers", [f"Greedy merging's own three-group level scores Q = 0.056, also above the page's 0.049. Its two groups agree with the page's three at NMI {gf['nmi_with_page']:.2f}. "
                              f"On the backbone the two greedy groups agree with the page at NMI {gb['nmi_with_page']:.2f}."]),
        ]))
    return body


def g3():
    wp = DATA["weighted_paths"]
    ex = next(e for e in wp["examples"] if e["from"] == "Memphis" and e["to"] == "San Diego")
    via = hbars([(r["metro"], r["routes"], GROUP[r["group"]], True, "") for r in wp["via"]], 0, 600,
                w=508, label_w=110, tick_vals=(0, 200, 400, 600), fmtv=lambda v: n(v),
                aria="Metros that sit in the middle of the strongest routes")
    hops = wp["hop_counts"]
    body = topic_bar("Where the hiring is", "Would join section 1's deep dive, next to the backbone.") + card(
        "G3", "Which way do the strongest ties run?",
        f"Through Dallas. When a heavy link counts as short, {wp['detour_share']:.0%} of metro pairs are closer by a detour than by their own link, and {wp['via'][0]['routes']} of the {wp['detour_pairs']} detours pass through Dallas.",
        "Every pair of the 40 metros shares an employer, so without weights every metro is one hop from every other. The brief measures a weighted link's length as 1/w, so a heavy link is short, and finds the shortest route with Dijkstra's algorithm.",
        notice(f"Only four metros ever sit in the middle of a route: Dallas, New York, San Jose and Washington. {hops['1']} pairs keep their direct link, {hops['2']} go through one other metro and {hops['3']} through two. "
               f"Memphis and San Diego share {n(ex['direct_weight'])} in link weight, but the route through Dallas and San Jose is shorter.") + row(
            figure("Where the detours run", f"How many of the {wp['detour_pairs']} indirect shortest routes pass through each metro. Colours: the page's three groups.", via),
            figure("One route: Memphis to San Diego", "Line width and label: the link's weight. The dashed curve is the direct link.", route_chain(ex)),
        ) + drawers([
            ("Method", ["Each link's length is 1 divided by its weight, the smaller-count overlap section 1 uses. networkx's Dijkstra finds the shortest route for all 780 pairs; "
                        "weighted betweenness uses the same lengths."]),
            ("More numbers", ["Weighted betweenness ranks the same four metros: Dallas 534, New York 97, San Jose 90 and Washington 38; every other metro scores 0. "
                              "Dallas also has the largest strength. Washington is only 9th by strength but 4th by betweenness: all 38 of its routes start or end in Baltimore, whose strongest link runs to Washington."]),
        ]))
    return body


def g4():
    e = DATA["eigenvector"]
    rows = e["pagerank_lifts"] + e["pagerank_drops"]
    sp = e["spearman"]
    teach = [r for r in e["pagerank_lifts"] if "Teachers" in r["title"]]
    left = notice(f"The three school-teacher jobs have {min(r['degree'] for r in teach)} to {max(r['degree'] for r in teach)} partners each, mostly one another. "
                  f"Eigenvector centrality ranks them {min(r['eigen_rank'] for r in teach)}th to {max(r['eigen_rank'] for r in teach)}th of {e['nodes']}, because their neighbours are not central. "
                  f"PageRank puts them {min(r['pagerank_rank'] for r in teach)}th to {max(r['pagerank_rank'] for r in teach)}th. Managers and HR specialists, tied into the software core, fall the other way.")
    body = topic_bar("Jobs and skills", "Would join the PageRank box as a third ranking beside degree and strength.") + card(
        "G4", "Does it matter how central a job's neighbours are?",
        f"Somewhat. Eigenvector centrality and PageRank agree at Spearman {sp['eigen_pagerank']:.2f}: eigenvector rewards the dense software core, PageRank lifts small, tight clusters.",
        f"{term('eig', 'Eigenvector centrality', 'A job scores high when the jobs it links to score high. Start every score at 1, replace each with the weighted sum of its neighbours, rescale, repeat.')} "
        "scores a job by its neighbours' scores. PageRank splits each job's vote among its links and adds random jumps, so a link from a job with few partners counts for more. "
        f"On this undirected network PageRank tracks strength closely (Spearman {sp['pagerank_strength']:.2f}).",
        two(left, figure("Who moves between the two rankings", "Hollow: eigenvector rank. Filled: PageRank rank. The five jobs PageRank lifts most, then the five it drops most.", dumbbells(rows))) + drawers([
            ("Method", [f"The same {e['nodes']}-occupation backbone PageRank runs on (α = 0.05, {n(e['edges'])} links), weighted by shared companies. "
                        "networkx's eigenvector_centrality_numpy; PageRank at d = 0.85 as in the PageRank box."]),
            ("More numbers", [f"Spearman with degree: eigenvector {sp['eigen_degree']:.2f}, PageRank {sp['pagerank_degree']:.2f}. With strength: eigenvector {sp['eigen_strength']:.2f}, PageRank {sp['pagerank_strength']:.2f}. "
                              f"The two share {e['top15_overlap_eigen_pagerank']} of their top 15."]),
        ]))
    return body


def g5():
    rs = DATA["resolution"]
    lv = DATA["leiden"]
    c1, c2 = gamma_charts(rs)
    r125 = next(r for r in rs if r["gamma"] == 1.25)
    r15 = next(r for r in rs if r["gamma"] == 1.5)
    r1 = next(r for r in rs if r["gamma"] == 1.0)
    min_in = min(r["w_in"] for r in DATA["modularity_by_hand"]["rows"])
    methods = [
        ("Louvain, the page", "3", "0.049", "65 of 100 runs"),
        ("Louvain, other runs", "2", "0.057", "35 of 100 runs"),
        ("Greedy merging", "2", "0.057", "the same two groups"),
        ("Leiden", "2 or 3", "0.049 or 0.057", "the same two splits as Louvain"),
        ("Infomap", "1", "0", "no split, as the page reports"),
        ("Stochastic block model", "not fitted", "", "needs graph-tool, which pip cannot install"),
    ]
    trs = "".join(f'<tr><td>{a}</td><td class="num">{b}</td><td class="num">{c}</td><td class="soft">{d}</td></tr>' for a, b, c, d in methods)
    table = (f'<div class="rx-table-block"><h4>Every method on the 40 metros</h4><table><thead><tr><th>Method</th><th class="num">Groups</th>'
             f'<th class="num">Q</th><th>Note</th></tr></thead><tbody>{trs}</tbody></table></div>')
    body = topic_bar("Where the hiring is", "Would join the Louvain tab as the brief's optional extras: resolution, Leiden and block models.") + card(
        "G5", "How many groups are there if you change what counts as a group?",
        f"Anything from one to forty. Below γ = 1 Louvain finds one group; at 1.25 it finds {r125['groups_median']:g} and at 1.5 it finds {r15['groups_median']:g}, and those finer groups follow Census regions more closely.",
        f"The {term('gamma', 'resolution γ', 'A dial on modularity: Q<sub>γ</sub> = Σ<sub>c</sub> [ w<sub>c</sub>/W − γ (s<sub>c</sub>/2W)² ]. γ = 1 is standard modularity; a larger γ favours smaller groups.')} "
        "scales modularity's chance term. The brief uses it to fix the resolution limit: maximising Q merges groups with fewer than about √(2m) links inside.",
        notice(f"At γ = 1 the finer groups agree with Census regions at NMI {r1['nmi_census']:.2f}; at γ = 1.5 they reach {r15['nmi_census']:.2f}, while their agreement with the page drops to {r15['nmi_page']:.2f}. "
               f"The resolution limit does not bite at γ = 1: in filing weight √(2W) is {n(DATA['resolution_limit_sqrt_2W'])}, and the smallest group holds {n(min_in)} inside.") + row(
            figure("Groups found at each resolution", "Median over 100 Louvain runs, log scale. Dashed: γ = 1.", c1),
            figure("What the groups follow", "NMI with the page's three groups and with the four Census regions.", c2),
        ) + table + drawers([
            ("Method", ["igraph's community_multilevel with its resolution parameter and community_leiden with the modularity objective, 100 seeds each, on the full weighted network. "
                        "√(2m) is the brief's rule of thumb for links; with filing weights we use √(2W) as the same yardstick."]),
            ("Why Leiden changes nothing here", ["Leiden fixes Louvain's disconnected communities. Every metro links to every other in the full network, so no group can come apart, "
                                                 f"and Leiden returns the same two splits at the same modularity (best {lv['leiden_Q_max']:.3f})."]),
        ]))
    return body


def g6():
    cols = DATA["colours"]
    proposed_hex = {0: "#6d4fd6", 1: "#0e6b52", 2: "#b3c1d4"}
    prop = proposed(proposed_hex)
    lum = {k: v["luminance"] for k, v in cols.items()}
    ratio = (max(lum["1"], lum["2"]) + 0.05) / (min(lum["1"], lum["2"]) + 0.05)
    pratio = (max(prop["1"]["luminance"], prop["2"]["luminance"]) + 0.05) / (min(prop["1"]["luminance"], prop["2"]["luminance"]) + 0.05)
    rules = [
        ("1", "Backbone first, with a method you can defend", "Yes. The disparity filter at α = 0.2 keeps 180 of 780 links, and the α control shows what each setting removes."),
        ("2", "Lay out the backbone, not the full network", "Yes, with a twist: metros sit at their cities, so the map needs no layout algorithm."),
        ("3", "Communities from the full data, groups labelled", f"Half. Louvain runs on all 780 links and each group carries a name, but green and slate differ in lightness by only {ratio:.1f} to 1."),
        ("4", "Size nodes by degree, strength or centrality", "Yes. Bubbles are sized by requested positions, a metro's total like strength."),
        ("5", "Label the important nodes", "Yes. The hero names its largest metros without a click; the rest label on hover."),
    ]
    trs = "".join(f'<tr><td>{a}</td><td>{escape(b)}</td><td class="soft">{c}</td></tr>' for a, b, c in rules)
    table = (f'<table><thead><tr><th>Rule</th><th>The brief</th><th>The hero map</th></tr></thead><tbody>{trs}</tbody></table>')
    body = topic_bar("Data and methods", "Would join the notes on how the charts are drawn; the colour fix would change every map.") + card(
        "G6", "Does the hero map follow the brief's five drawing rules?",
        "Four and a half of five. The groups are labelled, but two of their three colours merge for readers with red-green colour blindness.",
        "The brief gives five rules, in order, for drawing a network. Here is the hero map against each.",
        two(table + notice(f"Seen with deuteranopia, green turns grey and sits next to slate. A darker green and a lighter slate lift the lightness gap from {ratio:.1f} to {pratio:.1f} to 1 "
                           "and leave violet alone, as well as the orange and blue that already mark placed and direct filings."),
            figure("The three group colours, simulated", "Machado et al. (2009) at full severity. Proposed: green #0e6b52, slate #b3c1d4.", swatches(cols, prop))) + drawers([
            ("Method", ["Each colour goes through the Machado, Oliveira and Fernandes (2009) matrices in linear RGB. The lightness gap is the WCAG contrast ratio between the two colours' relative luminance."]),
        ]))
    return body


def proposed(hexes):
    import numpy as np
    M = {"deuteranopia": np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
         "protanopia": np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]])}

    def lin(h):
        c = np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])
        return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

    def to_hex(l):
        l = np.clip(l, 0, 1)
        c = np.where(l <= 0.0031308, 12.92 * l, 1.055 * l ** (1 / 2.4) - 0.055)
        return "#" + "".join(f"{round(v * 255):02x}" for v in c)

    out = {}
    for k, h in hexes.items():
        l = lin(h)
        out[str(k)] = {"hex": h, "luminance": round(float(np.dot([0.2126, 0.7152, 0.0722], l)), 3),
                       **{v: to_hex(m @ l) for v, m in M.items()}}
    return out


def guide():
    gf = DATA["greedy"]
    cards = [
        ("GapModularity.dc.html", "G1", "Modularity by hand", "Where the hiring is",
         "The per-group sum behind Q = 0.049, and Census regions scoring 0.002: grouped is not right."),
        ("GapGreedy.dc.html", "G2", "Greedy merging and the dendrogram", "Where the hiring is",
         f"Greedy merging peaks at 2 groups, Q = {gf['best']['Q']:.3f}. Bottom-up and top-down trees side by side."),
        ("GapPaths.dc.html", "G3", "Weighted paths", "Where the hiring is",
         "With 1/w lengths, 85% of pairs take a detour, and Dallas sits on 534 of them."),
        ("GapEigen.dc.html", "G4", "Eigenvector centrality", "Jobs and skills",
         "Agrees with PageRank at Spearman 0.71; PageRank lifts the school teachers from about 275th to about 30th."),
        ("GapResolution.dc.html", "G5", "Resolution, Leiden, block models", "Where the hiring is",
         "γ from 1 to 1.5 takes Louvain from 3 groups to 27. Leiden agrees with Louvain; no block model fitted."),
        ("GapDrawing.dc.html", "G6", "The five drawing rules", "Data and methods",
         "The hero map passes four and a half; green and slate fail for colour-blind readers."),
    ]
    tiles = "".join(
        f'<div class="rx-tcard"><a class="rx-tcard-head" href="{f}"><span><b>{num} · {escape(ti)}</b><em>{escape(topic)}</em></span></a>'
        f'<p style="margin:0;font-size:var(--fs-small);line-height:1.55;color:{INK}">{escape(fi)}</p></div>'
        for f, num, ti, topic, fi in cards)
    decisions = [
        ("Two groups or three in section 1?",
         "The page shows Louvain's most frequent split, three groups at Q = 0.049. Louvain's other 35 runs, greedy merging and Leiden's best all reach Q = 0.057 with two groups: the 12 largest hubs against the rest. "
         "Keep three and say why, or switch to two and redo section 1's numbers."),
        ("Which boards go to the page?", "G1 and G2 fit the community methods box as a formula strip and a fifth tab; G3 and G4 are new boxes; G5 and G6 are notes."),
        ("Change the group colours?", "Only if G6's fix is wanted: it touches every map that colours by group."),
    ]
    dl = "".join(f'<li style="padding:12px 0;border-top:1px solid #eaf0f7"><b style="font-size:var(--fs-strong)">{escape(q)}</b>'
                 f'<p style="margin:4px 0 0;font-size:var(--fs-body);line-height:1.6;color:{SOFT}">{escape(a)}</p></li>' for q, a in decisions)
    body = (f'<header class="w4-opener"><span aria-hidden="true" class="w4-opener-num">+</span><div><h2>Brief gaps</h2>'
            f'<p>The Week 4 concepts the page does not show yet, worked on our own networks.</p></div></header>'
            f'<p class="sub rx-cut-intro">Each board is drawn as a deep-dive box so it can move to the page as it stands. Every number comes from analysis/week04_brief_gaps.py.</p>'
            f'<div class="rx-tgrid">{tiles}</div>'
            f'<div class="card w4-card" style="margin-top:22px"><h3 style="margin:0 0 4px;font-size:var(--fs-h3)">To decide</h3><ol style="list-style:none;margin:0;padding:0">{dl}</ol></div>')
    return body


def main():
    src = Path(sys.argv[1]).read_text()
    out = Path(sys.argv[2])
    head = src[src.index('<script src="./support.js"></script>') + len('<script src="./support.js"></script>'):src.index("</head>")].strip()
    helmet = src[src.index("<helmet>"):src.index("</helmet>") + len("</helmet>")]
    boards = {
        "GapGuide.dc.html": ("Brief gaps · guide and decisions", guide()),
        "GapModularity.dc.html": ("Brief gaps · modularity by hand", g1()),
        "GapGreedy.dc.html": ("Brief gaps · greedy merging and the dendrogram", g2()),
        "GapPaths.dc.html": ("Brief gaps · weighted paths", g3()),
        "GapEigen.dc.html": ("Brief gaps · eigenvector centrality", g4()),
        "GapResolution.dc.html": ("Brief gaps · resolution, Leiden and block models", g5()),
        "GapDrawing.dc.html": ("Brief gaps · the five drawing rules", g6()),
    }
    # Board heights measured from the previews (content bottom + 90 px), kept beside this script.
    hpath = Path(__file__).with_name("gaps_heights.json")
    heights = json.loads(hpath.read_text()) if hpath.exists() else {}
    (out / "project").mkdir(parents=True, exist_ok=True)
    (out / "preview").mkdir(parents=True, exist_ok=True)
    css = "".join(f'<link rel="stylesheet" href="{ROOT}/docs/assets/css/{c}">' for c in (
        "type.css", "corridor.css", "week04.css", "week04-deep.css", "week04-methods.css", "week04-rx.css"))
    style = helmet.replace("<helmet>", "").replace("</helmet>", "")
    for f, (title, body) in boards.items():
        h = heights.get(f, 2400)
        # The canvas runtime wants every SVG element closed explicitly, as the other boards do.
        dc = re.sub(r"<(line|circle|polyline|path|rect)([^<>]*?)/>", r"<\1\2></\1>", board(title, h, body, head, helmet))
        (out / "project" / f).write_text(dc)
        (out / "preview" / f.replace(".dc.html", ".html")).write_text(
            f'<!doctype html><html><head><meta charset="utf-8">{css}{style}</head><body style="margin:0">'
            f'<div class="corridor rx" id="root" style="width:1440px;background:#eef3f9">{TOPBAR}<main id="main"><div class="shell"><section class="step" id="cut">{body}</section></div></main></div></body></html>')
    print("\n".join(f"{f}: {heights.get(f, 2400)}" for f in boards))


if __name__ == "__main__":
    main()
