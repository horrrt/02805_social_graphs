"""Builds RTopicWherePlus: the recommended "Where the hiring is" deep-dive board
with the three brief-gap additions in place, so they can be judged before they
go to the page.

- a new question box, "Which way do the strongest ties run?" (G3)
- a fifth methods tab, Greedy, between Modularity and Louvain (G2)
- the Modularity tab gains the formula and a Census-regions marker (G1, cut down)

Usage: python build_gaps_inplace.py LIVE_RTopicWhere.dc.html OUT_DIR
Writes OUT_DIR/project/RTopicWherePlus.dc.html and two boards that open it at
the Greedy and Modularity tabs.
"""

import re
import sys
from pathlib import Path

import build_gaps as bg

N_OLD = 7
PATHS, GREEDY = 7, 8  # new panel indices


def tabs(pressed):
    names = [("gn", "Girvan–Newman", 3), ("mod", "Modularity", 4), ("greedy", "Greedy", GREEDY),
             ("louvain", "Louvain", 5), ("overlap", "Overlap", 6)]
    return ('<div class="w4m-tabs">' + "".join(
        f'<button aria-pressed="{str(k == pressed).lower()}" class="w4m-tab" data-panel="{k}" type="button" onClick="{{{{pick{i}}}}}">{lab}</button>'
        for k, lab, i in names) + "</div>")


def greedy_panel():
    gf = bg.DATA["greedy"]
    ids = bg.backbone_order()
    lay = bg.layout_from_merges(40, [(m["a"], m["b"]) for m in gf["layout"]["merges"]], ids)
    tree = bg.dendrogram(lay, list(range(1, 40)), gf["best"]["groups"], 620, 420,
                         "Greedy merging on all 780 weighted links, bottom up")
    tree = tree.replace('style="display:block"', 'style="display:block;width:100%;height:100%"')
    q3 = next(r["Q"] for r in gf["q_by_groups"] if r["groups"] == 3)
    curve = bg.qcurve(gf["q_by_groups"], w=1044, h=230)
    return f"""<div class="rx-panel" style="display: {{{{d{GREEDY}}}}}"><div class="card w4-card"><div class="w4m">
{tabs("greedy")}
<section class="w4m-panel" data-panel="greedy">
<p class="w4m-eyebrow">Explore · after the course's week 4</p>
<h3 class="w4m-title">Greedy merging, from the bottom up</h3>
<p class="w4m-lead">Start with every metro alone, join the two groups whose merger raises modularity most, and repeat until one group is left; then keep the level with the highest modularity. A merge is never undone. It peaks at two groups, Q = {gf['best']['Q']:.3f}: the 12 largest hubs against the other 28 metros. Louvain finds the same two groups in 35 of its 100 runs; the page shows the three it finds in the other 65, which score {0.049:.3f}.</p>
<div class="w4m-grid">
<div class="w4m-map" style="position: relative">{tree}</div>
<div aria-live="polite" class="w4m-side">
<div class="w4m-stats">
<div class="w4m-stat"><b>2 groups</b><span>at the best level, Q = {gf['best']['Q']:.3f}</span></div>
</div>
<div class="w4m-rows">
<div class="w4m-row"><span>The page's three groups</span><b>0.049</b></div>
<div class="w4m-row"><span>Greedy's own three-group level</span><b>{q3:.3f}</b></div>
<div class="w4m-row"><span>Louvain runs that find these two groups</span><b>35 of 100</b></div>
<div class="w4m-row"><span>Agreement with the page's groups</span><b>NMI {gf['nmi_with_page']:.2f}</b></div>
</div>
<p class="w4m-note">The dendrogram reads bottom up: each horizontal line is one merge. Dashed: the cut at the best level. Dots: the page's three groups. Like Louvain, greedy merging uses all 780 weighted links; the Girvan–Newman tab runs on the backbone.</p>
</div>
</div>
<figure class="w4m-figure">
<figcaption>
<span class="w4m-fig-title">Modularity after each merge</span>
<span class="w4m-fig-caption">Read right to left: 40 metros alone, then one merge at a time. The filled dot is the best level; the ring is the page's three groups.</span>
</figcaption>
{curve}
</figure>
</section>
</div></div></div>"""


def paths_panel():
    body = bg.g3()
    card = body[body.index('<div class="card w4-card">'):]
    card = card.replace('<span class="w4-num">G3</span>', '<span class="w4-num">4</span>', 1)
    return f'<div class="rx-panel" style="display: {{{{d{PATHS}}}}}">{card}</div>'


def modularity_edits(s):
    rows = bg.DATA["modularity_by_hand"]["rows"]
    census = bg.DATA["grouped_vs_right"]["census_regions"]
    start = s.index('<div class="rx-panel" style="display: {{d4}}">')
    end = s.index('<div class="rx-panel" style="display: {{d5}}">')
    p = s[start:end]
    p = p.replace("Louvain’s three groups score 0.049; shuffled labels, or one big group, score about zero.",
                  f"Louvain’s three groups score 0.049; shuffled labels, or one big group, score about zero. "
                  f"Census regions, the grouping a reader might call right, score only {census:.3f}: modularity says how grouped a split is, not whether it is the right one.")
    p = p.replace('<button class="w4m-btn" data-act="one" type="button">Everyone in one group</button>',
                  '<button class="w4m-btn" data-act="one" type="button">Everyone in one group</button>\n'
                  '<button class="w4m-btn" data-act="census" type="button">Census regions</button>')
    # Census marker on the strip: x = 102.7 at 0.00, 90.65 px per 0.02.
    x = 102.7 + census / 0.02 * 90.65
    p = p.replace('<circle class="w4m-strip-mk"',
                  f'<line x1="{x:.1f}" y1="18" x2="{x:.1f}" y2="42" stroke="#14618f" stroke-width="2"></line>'
                  f'<text x="{x:.1f}" y="12" font-size="11.5" fill="#14618f" text-anchor="middle">Census {census:.3f}</text>'
                  '<circle class="w4m-strip-mk"')
    formula = ('<figure class="w4m-figure"><figcaption><span class="w4m-fig-title">The formula</span>'
               '<span class="w4m-fig-caption">For each group c: the share of all link weight that falls inside it, minus the share a network with the same metro totals would put there by chance. '
               + ", ".join(f"{r['label']} adds {r['contribution']:.3f}" for r in rows)
               + f", {bg.DATA['modularity_by_hand']['Q']:.3f} in all.</span></figcaption>"
               '<p style="margin:4px 0 0;font-size:var(--fs-strong);color:#0f2340">Q = Σ<sub>c</sub> [ w<sub>c</sub> / W − ( s<sub>c</sub> / 2W )² ]'
               '<span style="margin-left:16px;font-size:var(--fs-small);color:#46618a">w<sub>c</sub>: filing weight inside c · s<sub>c</sub>: the summed strength of its metros · W: all 780 links, 1,234,499</span></p></figure>')
    p = p.replace("</section>\n\n\n</div></div></div>", formula + "</section>\n</div></div></div>")
    assert formula in p, "Modularity panel end not found"
    return s[:start] + p + s[end:]


def main():
    src = Path(sys.argv[1]).read_text()
    out = Path(sys.argv[2])
    s = src
    # every methods tab row gets the Greedy tab, wired to the panels
    for key in ("gn", "mod", "louvain", "overlap"):
        s = re.sub(r'<div class="w4m-tabs">.*?</div>', lambda m, k=key: tabs(k) if f'aria-pressed="true" class="w4m-tab" data-panel="{k}"' in m.group() else m.group(), s, flags=re.S)
    s = modularity_edits(s)
    # contents: the new question after the three, Greedy after Modularity
    s = s.replace('Where is the hiring densest? Filings per 1,000 jobs</button>',
                  'Where is the hiring densest? Filings per 1,000 jobs</button>'
                  f'<button type="button" class="rx-toc-item" onClick="{{{{pick{PATHS}}}}}" aria-pressed="{{{{on{PATHS}}}}}" style="{{{{st{PATHS}}}}}">Which way do the strongest ties run?</button>', 1)
    s = s.replace('Are the three metro groups more than chance?</button>',
                  'Are the three metro groups more than chance?</button>'
                  f'<button type="button" class="rx-toc-item" onClick="{{{{pick{GREEDY}}}}}" aria-pressed="{{{{on{GREEDY}}}}}" style="{{{{st{GREEDY}}}}}">Does merging from the bottom up find the same groups?</button>', 1)
    s = s.replace('<span class="rx-topic-count">7 boxes</span>', '<span class="rx-topic-count">9 boxes</span>')
    last = s.index("</section></div></main>")
    s = s[:last] + paths_panel() + greedy_panel() + s[last:]
    s = s.replace("const n = 7,", "const n = 9,").replace("Math.min(6, Math.max(0, Number(props.start) || 0))",
                                                         f"Math.min(8, Math.max(0, props.start == null ? {PATHS} : Number(props.start) || 0))")
    s = re.sub(r"<title>[^<]*</title>", "<title>Deep dive · Where the hiring is, with the three additions</title>", s, count=1)
    s = re.sub(r"<(line|circle|polyline|path|rect)([^<>]*?)/>", r"<\1\2></\1>", s)
    for k in ("pick7", "pick8", "d7", "d8", "Census regions</button>", "Greedy merging, from the bottom up"):
        assert k in s, k
    (out / "project").mkdir(parents=True, exist_ok=True)
    (out / "project/RTopicWherePlus.dc.html").write_text(s)
    head = src[src.index("<head>"):src.index("</head>") + 7]
    head_links = "\n".join(l for l in head.splitlines() if l.startswith("<link"))
    for name, start, title in (("RTopicWherePlus-greedy", GREEDY, "the new Greedy tab"),
                               ("RTopicWherePlus-modularity", 4, "the Modularity tab with the formula and Census regions")):
        (out / f"project/{name}.dc.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Deep dive · Where the hiring is, with the three additions, opened at {title}</title>
<script src="./support.js"></script>
{head_links}
</head>
<body>
<x-dc>
<helmet>
<style>
body{{margin:0;background:#eef3f9}}
</style>
</helmet>
<div style="width: 1440px; height: 1860px; overflow: hidden; background: #eef3f9">
<dc-import name="RTopicWherePlus" start="{start}" hint-size="1440px,1860px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview": {{"width": 1440, "height": 1860}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
""")
    print("ok")


if __name__ == "__main__":
    main()
