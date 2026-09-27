"""The deep dive, opened: one expanded view per box, built from the page's own sentences and JSON."""
import math

from kit import *  # noqa: F401,F403
import kit
import build as B

place, usa, ww, jobs = B.place, B.usa, B.ww, B.jobs
scm, scl, sm = B.scm, B.scl, B.sm
lot = B.load("analysis/week04_lottery.json")["lotteries"]
perm = B.load("analysis/week04_perm.json")["years"]["2025"]
ctry = B.load("analysis/week04_countries.json")
oews = B.load("analysis/week04_oews.json")
ties = B.load("analysis/week04_ties.json")
law = B.load("analysis/week04_lawfirms.json")
staff = B.load("analysis/week04_staffing.json")

LEFT_W = 520
FIG_W = 556
CITY = {c["id"]: c for c in place["cities"]}
REGION = {}
for names, region in (
    ("Connecticut Maine Massachusetts New_Hampshire Rhode_Island Vermont New_Jersey New_York Pennsylvania", "Northeast"),
    ("Illinois Indiana Michigan Ohio Wisconsin Iowa Kansas Minnesota Missouri Nebraska North_Dakota South_Dakota", "Midwest"),
    ("Delaware Florida Georgia Maryland North_Carolina South_Carolina Virginia District_of_Columbia West_Virginia Alabama "
     "Kentucky Mississippi Tennessee Arkansas Louisiana Oklahoma Texas", "South"),
    ("Arizona Colorado Idaho Montana Nevada New_Mexico Utah Wyoming California Oregon Washington", "West"),
):
    for n in names.split():
        REGION[n.replace("_", " ")] = region
REGION_TINT = {"West": "#e8edf4", "Midwest": "#dfe6ef", "South": "#f1f4f8", "Northeast": "#d7e0eb"}


# ---------------------------------------------------------------- estimates, so a board is tall enough

def para_h(text, width=LEFT_W, size=13.5):
    return est_lines(text, width, size, 0.5) * size * 1.62


def notice_h(text, width=LEFT_W - 58):
    return est_lines(text, width, 12.5, 0.5) * 12.5 * 1.55 + 26


def fig_h(caption, svg_h, width=FIG_W):
    return est_lines(caption, width, 11.5, 0.5) * 11.5 * 1.45 + 20 + 8 + svg_h + 26


# ---------------------------------------------------------------- the light map

def light_map(w, h, dots, edges=(), regions=False, aria="", labels=(), pad=(6, 6, 6)):
    skip = {"Alaska", "Hawaii", "Puerto Rico"}
    shapes = []
    for f in usa["features"]:
        name = f["properties"]["name"]
        if name in skip:
            continue
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        shapes.append((name, [[B.albers(lon, lat) for lon, lat in ring] for poly in polys for ring in poly]))
    xs = [p[0] for _, s in shapes for r in s for p in r]
    ys = [p[1] for _, s in shapes for r in s for p in r]
    pl, pr, pv = pad
    sc = min((w - pl - pr) / (max(xs) - min(xs)), (h - 2 * pv) / (max(ys) - min(ys)))
    ox = pl + ((w - pl - pr) - sc * (max(xs) - min(xs))) / 2 - sc * min(xs)
    oy = pv + ((h - 2 * pv) - sc * (max(ys) - min(ys))) / 2 - sc * min(ys)

    def P(lon, lat):
        x, y = B.albers(lon, lat)
        return ox + sc * x, oy + sc * y

    out = [svg_open(w, h, aria)]
    for name, s in shapes:
        d = []
        for ring in s:
            pts = B.dp([(ox + sc * x, oy + sc * y) for x, y in ring], 0.5 if w > 300 else 0.8)
            if len(pts) >= 4:
                d.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
        if d:
            fill = REGION_TINT.get(REGION.get(name, ""), MAP_FILL) if regions else MAP_FILL
            out.append(path("".join(d), fill, "#ffffff" if regions else MAP_EDGE, 0.8))
    pos = {cid: P(c["lon"], c["lat"]) for cid, c in CITY.items()}
    if edges:
        wmax = max(e[2] for e in edges)
        for a_, b_, wt in sorted(edges, key=lambda e: e[2]):
            (x1, y1), (x2, y2) = pos[a_], pos[b_]
            out.append(line(x1, y1, x2, y2, INK, 0.4 + 1.8 * math.sqrt(wt / wmax), op=0.28, cap="round"))
    fmax = max(c["filings"] for c in CITY.values())
    for cid, col, scale in sorted(dots, key=lambda d: -CITY[d[0]]["filings"]):
        x, y = pos[cid]
        r = (1.6 + 7.5 * math.sqrt(CITY[cid]["filings"] / fmax)) * scale
        if col is None:
            out.append(circle(x, y, r, "#ffffff", INK_MUTE, 1.2))
        else:
            out.append(circle(x, y, r, col, "#ffffff", 1.1))
    for text_, lon, lat in labels:
        x, y = P(lon, lat)
        out.append(text(x, y, text_, 11, INK_SOFT, 700, "middle", tabular=False))
    out.append("</svg>")
    return "\n".join(out)


# ---------------------------------------------------------------- one expanded view

def view(anchor, crumb, badge, question, scope, answer, left, right, left_h, right_h, prev=None, nxt=None):
    """An opened deep-dive box: its question and answer, the text beside the chart, and the way on."""
    nav = []
    if prev:
        nav.append(f'<a href="{prev[1]}" style="font-size: 12.5px; font-weight: 600; text-decoration: none">← {t(prev[0])}</a>')
    else:
        nav.append("<span></span>")
    if nxt:
        nav.append(f'<a href="{nxt[1]}" style="font-size: 12.5px; font-weight: 600; text-decoration: none">{t(nxt[0])} →</a>')
    inner = (
        '<div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px">'  # no breadcrumb: removed in review
        f'<button type="button" aria-expanded="true" aria-controls="{anchor}-body" style="display: inline-flex; align-items: center; gap: 6px; '
        f'padding: 5px 11px; border-radius: 999px; border: 1px solid {LINE}; background: {INSET}; color: {INK_SOFT}; font-family: inherit; '
        'font-size: 12px; font-weight: 700; cursor: pointer">Close <span aria-hidden="true">▴</span></button></div>\n'
        + q_header(badge, question, scope, t(answer))
        + f'\n<div id="{anchor}-body">\n' + (two_col(left, right, LEFT_W, 40) if right else left) + "\n</div>\n"
        + f'<nav aria-label="More in the deep dive" style="display: flex; justify-content: space-between; gap: 16px; '
        f'border-top: 1px solid {LINE_SOFT}; padding-top: 12px">' + "".join(nav) + "</nav>"
    )
    ans_lines = est_lines(answer, 900, 16, 0.52)
    head_h = 26 + 18 + 25 + 8 + ans_lines * 23
    h = 50 + head_h + 18 + max(left_h, right_h) + 18 + 34
    return card(inner, anchor=anchor), h


def left_col(*blocks):
    """blocks: ('p', text) | ('n', label, text[, glyph]) | ('r', html). Returns html and an estimated height."""
    html, h = [], 0
    for b in blocks:
        if b[0] == "p":
            html.append(para(t(b[1])))
            h += para_h(b[1])
        elif b[0] == "n":
            glyph = b[3] if len(b) > 3 else "bulb"
            html.append(notice(b[1], t(b[2]), glyph))
            h += notice_h(b[2])
        else:
            html.append(b[1])
            h += 32
    h += 14 * (len(blocks) - 1)
    return "\n".join(html), h


def right_col(*figs):
    """figs: (title, caption, svg_html, svg_h)."""
    html = "\n".join(figure(ti, ca, sv) for ti, ca, sv, _ in figs)
    h = sum(fig_h(ca, sh) for _, ca, _, sh in figs) + 14 * (len(figs) - 1)
    return html, h


def board(title, fname, active_letter, opener_html, views, open_room=0):
    body_views = "\n".join(v for v, _ in views)
    content = opener_html + "\n" + body_views
    est = 52 + 36 + 130 + 26 + sum(h for _, h in views) + 26 * (len(views) - 1) + 90 + open_room
    h = int(math.ceil(est * 1.1 / 20) * 20)
    body = "\n".join([topbar("Deep dive"), body_row(rail("+", active_letter), content, 26)])
    return page(title, W, h, body), h


def deep_opener(title, scope, lead, anchor):
    return opener("+", title, scope, t(lead), anchor)


# ================================================================ first round, section 1

def deep1():
    sj, ny, sea = CITY["41940"], CITY["35620"], CITY["42660"]
    crumb = "Deep dive · first round · 1 Where the hiring is"
    by_pos = sorted(CITY.values(), key=lambda c: -c["positions"])[:10]
    by_emp = sorted(CITY.values(), key=lambda c: -c["employers"])[:10]
    sa, ha = hbars([(c["name"], c["positions"], c["id"] == "41940") for c in by_pos], 268, lambda v: num(v), label_w=98, value_w=58,
                   aria="The ten metros that request the most positions")
    sb, hb = hbars([(c["name"], c["employers"], c["id"] == "35620") for c in by_emp], 268, lambda v: num(v), label_w=98, value_w=50,
                   aria="The ten metros with the most employers filing")
    pair = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 700; color: {INK}">Most positions</span>{sa}</div>'
        f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 700; color: {INK}">Most employers</span>{sb}</div>'
        "</div>"
    )
    note = (f"San Jose’s {num(sj['filings'])} filings request {num(sj['positions'])} positions, "
            f"{sj['positions'] / sj['filings']:.1f} per filing, and Google files one in ten of them. New York files more "
            f"({num(ny['filings'])}) from three times as many employers ({num(ny['employers'])}), with "
            f"{ny['positions'] / ny['filings']:.1f} positions per filing, and its largest filer, EY, has under 4%.")
    assert sj["top_employer"] == "Google" and 0.095 < sj["top_share"] < 0.11 and ny["top_share"] < 0.04
    assert round(ny["employers"] / sj["employers"]) == 3
    l1, lh1 = left_col(
        ("p", "A position is a seat an employer asks to fill, not a worker who arrived."),
        ("n", "What to notice.", note),
        ("r", reveal_row(
            reveal("How we count", "How we count", "A filing counts once in each metro it names, with at most the positions it requests."),
            reveal("More numbers", "More numbers",
                   f"In Seattle one company, Amazon, files {pct(sea['top_share'], 0)}. Positions reward a few firms asking for many seats; "
                   "employer counts reward a broad market.", icon="plus"))),
    )
    r1, rh1 = right_col(("Positions against employers", "The ten largest metros by each count, FY2025. Dark bars: San Jose on "
                         "positions, New York on employers.", pair, max(ha, hb) + 20))
    v1 = view("place-rank", crumb, "A", "Which cities hire the most?", "FY2025",
              "San Jose asks for the most positions; New York has the most employers.", l1, r1, lh1, rh1,
              None, ("Once the small links go, what’s left of the map?", "#place-backbone"))

    graphs = place["backbone"]["graphs"]
    minis = []
    for a_ in ("0.2", "0.1", "0.05"):
        g = graphs[a_]
        gc = set(g["nodes"])
        dots = [(cid, B.GROUP_ON_LIGHT[CITY[cid]["community"]] if cid in gc else None, 1) for cid in CITY]
        svg = light_map(176, 116, dots, g["edges"], aria=f"Backbone at alpha {a_}")
        minis.append(
            f'<div style="display: flex; flex-direction: column; gap: 4px">{svg}'
            f'<span style="font-size: 12px; font-weight: 700; color: {INK}">α = {a_}</span>'
            f'<span style="font-size: 11.5px; color: {INK_SOFT}">{num(len(g["edges"]))} links · {len(gc)} metros in the largest piece</span></div>'
        )
    smalls = '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px">' + "".join(minis) + "</div>"
    bb = place["backbone"]
    l2, lh2 = left_col(
        ("p", "Cities are linked when they share an employer."),
        ("n", "What to notice.", bb["snap_note"]),
        ("r", reveal_row(reveal("How we cut the hairball", "How we cut the hairball",
                                "Two metros are linked when a company files in both; the weight adds up, over those companies, the smaller "
                                "of its two filing counts. One weight threshold would keep the links among the big hubs and cut a mid-size "
                                "metro’s strongest tie, which is light next to New York and Dallas. The disparity filter keeps a link when "
                                "it carries an unusually large share of either endpoint’s weight at level α, the method the course used "
                                "for the philosophers backbone. Weights come from analysis/week04_where.py.", width=480),
                         reveal("Why these three", "Why these three", bb["choice_note"], icon="plus"))),
    )
    r2, rh2 = right_col(("The backbone as the filter tightens", "Each line is a link the filter keeps. Coloured dots are in the largest "
                         "connected piece, coloured by metro group; hollow dots have fallen out of it.", smalls, 176))
    v2 = view("place-backbone", crumb, "B", "Once the small links go, what’s left of the map?", "disparity filter",
              "Keep every shared-employer link and the map is one blob; keep only the links that are heavy for someone, and it comes apart.",
              l2, r2, lh2, rh2, ("Which cities hire the most?", "#place-rank"),
              ("Is it one national job market or several regional ones?", "#place-regions"))

    rmap = light_map(556, 330, [(cid, B.GROUP_ON_LIGHT[c["community"]], 1.35) for cid, c in CITY.items()], regions=True,
                     aria="The 40 metros coloured by Louvain group over the four Census regions",
                     labels=[("West", -113.5, 41.5), ("Midwest", -94.5, 44.2), ("South", -90.5, 32.6), ("Northeast", -75.5, 43.6)])
    legend = (
        f'<div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: {INK_SOFT}; padding-top: 6px">'
        + "".join(f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; '
                  f'background: {B.GROUP_ON_LIGHT[g_]}"></span>{t(B.GROUP_NAME[g_])}</span>' for g_ in (0, 1, 2))
        + "</div>"
    )
    l3, lh3 = left_col(
        ("n", "What to notice.", "One group holds New York, Dallas, Atlanta, Chicago, Houston, Philadelphia and Charlotte. The other holds San "
              "Jose, San Francisco, Seattle, Los Angeles, San Diego, Austin, Boston and Washington. The 25 smaller metros form the third. "
              "NMI with Census regions is 0.14 and with divisions 0.21, no better than shuffled labels (p = 0.10 and 0.11)."),
        ("r", reveal_row(
            reveal("Compared to what?", "Compared to what?",
                   "The map shows the partition Louvain finds most often, and every number below is computed on it. The null rewires the "
                   "company × metro network so each company and each metro keeps its number of partners, deals the filing counts back "
                   "out at random, and projects it again."),
            reveal("More numbers", "More numbers",
                   "The split is real but weak: modularity is 0.049 against 0.013 for rewired networks that keep each company’s number of "
                   "metros (z = 29), and Louvain finds it in 65 of 100 runs; the other 35 find one other split, into two groups. FY2024 gives "
                   "that two-group split in all 100 runs, so it matches the split shown here at NMI 0.64, against 1.00 between two FY2025 "
                   "runs. Infomap, which follows a random walk between metros instead of counting links, finds no split at all: one module "
                   "holds all 40.", icon="plus", width=480))),
    )
    r3, rh3 = right_col(("Same cities, two labellings", "Shading: the four Census regions. Dots: the three Louvain groups, sized by filings.",
                         rmap + legend, 360))
    v3 = view("place-regions", crumb, "C", "Is it one national job market or several regional ones?", "communities vs Census",
              "Not regional markets. Louvain splits the large hubs into two groups, which cross regions, and leaves the smaller metros as a third.",
              l3, r3, lh3, rh3, ("Once the small links go, what’s left of the map?", "#place-backbone"),
              ("Do the same employers tie distant cities together?", "#place-longhaul"))

    lh = place["longhaul"]
    edges = lh["edges"]
    long_ = [e for e in edges if e["distance_km"] > 1500]
    short_ = [e for e in edges if e["distance_km"] <= 1500]
    counts = (len(long_), sum(e["staffing"] for e in long_), len(short_), sum(e["staffing"] for e in short_))
    lh_ = B.load("analysis/week04_where.json")["longhaul"]
    assert counts == (lh_["long_links"], lh_["long_led_by_shortlist"], lh_["short_links"], lh_["short_led_by_shortlist"]), \
        f"the page's long-haul links {counts} disagree with analysis/week04_where.json"
    sw, sh = 556, 300
    L, Rr, T, Bm = 52, 12, 12, 40
    wmin, wmax = min(e["weight"] for e in edges), max(e["weight"] for e in edges)
    lw0, lw1 = math.log10(wmin * 0.9), math.log10(wmax * 1.1)

    def X(d):
        return L + d * (sw - L - Rr) / 4500

    def Y(v):
        return T + (lw1 - math.log10(v)) * (sh - T - Bm) / (lw1 - lw0)

    g = [svg_open(sw, sh, "Backbone links: distance against weight, by the kind of company that leads each")]
    for v in (1000, 3000, 10000):
        if wmin * 0.9 < v < wmax * 1.1:
            g.append(line(L, Y(v), sw - Rr, Y(v), GRID, 1))
            g.append(text(L - 8, Y(v) + 4, num(v), 11, INK_MUTE, 400, "end"))
    for dkm in (0, 1500, 3000, 4500):
        g.append(text(X(dkm), sh - Bm + 16, f"{num(dkm)} km", 11, INK_MUTE, 400, "middle"))
    g.append(line(X(1500), T, X(1500), sh - Bm, INK_SOFT, 1.2, "4 3"))
    g.append(text(X(1500) + 6, T + 10, "long links →", 11, INK_SOFT, 600, "start", tabular=False))
    for e in sorted(edges, key=lambda e: e["staffing"]):
        g.append(circle(X(e["distance_km"]), Y(e["weight"]), 2.4 + 5 * math.sqrt(e["weight"] / wmax),
                        PEOPLE if e["staffing"] else INK, "#ffffff", 0.8, op=None if e["staffing"] else 0.55))
    g.append(text(sw - Rr, sh - 4, "distance →", 11, INK_MUTE, 400, "end", tabular=False))
    g.append("</svg>")
    key = (
        f'<div style="display: flex; gap: 16px; font-size: 12px; color: {INK_SOFT}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {PEOPLE}"></span>led by one of the five largest placing firms</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {INK}; opacity: 0.55"></span>led by any other company</span></div>'
    )
    l4, lh4 = left_col(
        ("p", "The shortlist is the five firms that place the most filings at client sites: Tata Consultancy Services, Cognizant, Infosys, HCL "
              "and Compunnel."),
        ("n", "What to notice.", f"Of the {counts[0]} backbone links longer than 1,500 km, the shortlist leads {counts[1]} "
                                 f"({counts[1] / counts[0] * 100:.0f}%); it leads {counts[3]} of the {counts[2]} shorter ones "
                                 f"({counts[3] / counts[2] * 100:.0f}%). Distant metros are tied by many companies filing in both."),
        ("r", reveal_row(reveal("More numbers", "More numbers",
                                "Amazon leads the most long links (30), then Cognizant (17), EY (8) and Deloitte (7). The leading company "
                                "carries a median 14% of a long link’s weight, and only one long link, San Jose to Fayetteville (Walmart), "
                                "has a company with half of it.", icon="plus", open_=True))),
    )
    r4, rh4 = right_col(("Distance against weight", "Each point is a link in the backbone at α = 0.2; size grows with its weight, "
                         "on a log scale.", "\n".join(g) + key, sh + 26))
    v4 = view("place-longhaul", crumb, "D", "Do the same employers tie distant cities together?", "who leads the long links",
              "Mostly not. Big direct employers lead the long links, Amazon above all, and a single company rarely carries one.",
              l4, r4, lh4, rh4, ("Is it one national job market or several regional ones?", "#place-regions"),
              ("Which jobs go together: three earlier questions", "Deep2.dc.html"))
    op = deep_opener("Where the hiring is: four earlier questions", "first round · section 1",
                     "Our first round of questions, with their charts.", "cut-place")
    return board("Week 4 · deep dive, first round of section 1", "Deep1.dc.html", "1", op, [v1, v2, v3, v4], open_room=120)


# ================================================================ first round, section 2

SHORT = {
    "Software Quality Assurance Analysts and Testers": "Software QA analysts",
    "Computer Occupations, All Other": "Computer occupations, other",
    "Computer and Information Systems Managers": "IT managers",
    "Computer Systems Analysts": "Computer systems analysts",
    "Electronics Engineers, Except Computer": "Electronics engineers",
    "Operations Research Analysts": "Operations research analysts",
    "Management Analysts": "Management analysts",
    "Computer Network Architects": "Network architects",
    "Elementary School Teachers, Except Special Education": "Elementary school teachers",
}


def short(title):
    return SHORT.get(title, title)


def deep2():
    crumb = "Deep dive · first round · 2 Which jobs go together"
    title = {n["id"]: n["title"] for n in jobs["nodes"]}
    pairs = jobs["pairs"][:12]
    sd_pairs = sum("15-1252" in (p["source"], p["target"]) for p in pairs)
    if sd_pairs != 8:
        print("WARNING Software Developers pairs:", sd_pairs)
    rows = [(f"{short(title[p['source']])} + {short(title[p['target']])}", p["weight"], "15-1252" in (p["source"], p["target"]))
            for p in pairs]
    sv, sh_ = hbars(rows, FIG_W, lambda v: num(v), label_w=330, value_w=52, aria="The twelve strongest occupation pairs")
    l1, lh1 = left_col(
        ("p", "Each bar is a pair among the 60 largest occupations. Its length is the number of companies that filed for both, not the number "
              "of workers requested."),
    )
    r1, rh1 = right_col(("Strongest occupation pairings", "Companies that filed for both occupations in FY2025. Dark bars include "
                         "Software Developers.", sv, sh_))
    v1 = view("jobs-together", crumb, "A", "Which jobs are hired together?", "shared employers",
              f"Software Developers sit in {sd_pairs} of the 12 pairs because almost every sponsoring company hires them.",
              l1, r1, lh1, rh1, None, ("Which jobs belong to two clusters?", "#jobs-bridges"))

    br = jobs["bridges"]
    s_a, h_a = strip_chart([dict(label="First rule", sub="ratio above 1", real=br["lift_above_1"], real_label=num(br["lift_above_1"]),
                                 rref=(br["lift_above_1_by_chance_mean"], f"rewired {num(round(br['lift_above_1_by_chance_mean']))}"))],
                           (0, 500), FIG_W, [0, 100, 200, 300, 400, 500], lambda v: num(v), label_w=150, badge_w=20,
                           aria="Occupations passing the first rule, real against rewired")
    s_b, h_b = strip_chart([dict(label="Strict rule", sub="beats every rewired network", bold=True, real=br["all_occupations"],
                                 real_label=num(br["all_occupations"]),
                                 rref=(br["expected_false_positives"], f"by chance {num(round(br['expected_false_positives']))}"))],
                           (0, 25), FIG_W, [0, 5, 10, 15, 20, 25], lambda v: num(v), label_w=150, badge_w=20,
                           aria="Occupations passing the strict rule, against the number expected by chance")
    cl = jobs["clusters"]
    ctab = (
        f'<table style="width: 100%; border-collapse: collapse; font-size: 12.5px; font-variant-numeric: tabular-nums">'
        + "".join(f'<tr style="border-top: 1px solid {LINE_SOFT}"><td style="padding: 6px 8px 6px 0; color: {INK}; font-weight: 600">'
                  f'{t(c["label"])}</td><td style="padding: 6px 0; text-align: right; color: {INK_SOFT}">{num(c["occupations"])} occupations</td></tr>'
                  for c in cl)
        + "</table>"
    )
    answer2 = (f"Only {num(br['all_occupations'])} of {num(br['tested'])} pass, fewer than the "
               f"{num(round(br['expected_false_positives']))} a test this strict passes by chance, so no occupation clearly belongs to two clusters.")
    l2, lh2 = left_col(
        ("p", "We looked for occupations that also belong to a second cluster, with more employer ties there than any rewired network gives them."),
        ("r", reveal_row(reveal("How the test works", "How the test works",
                                "An occupation’s second cluster is the one its employer ties exceed most over the expectation modularity "
                                "uses (its strength times the cluster’s, over twice the total weight). A ratio above 1, our first rule, "
                                f"marks {num(br['lift_above_1'])} occupations, but the rewired networks mark "
                                f"{num(round(br['lift_above_1_by_chance_mean']))} on average with the same cluster labels. So an occupation "
                                "now counts only when its ratio beats its own ratio in every rewired network.", width=480))),
    )
    r2, rh2 = right_col(
        ("Occupations that pass each rule", "Dots: the real network. Dashed marks: what rewired networks give with the same cluster labels.",
         s_a + s_b, h_a + h_b),
        ("The largest clusters", "Each named after its largest occupation.", ctab, 36 * len(cl)),
    )
    v2 = view("jobs-bridges", crumb, "B", "Which jobs belong to two clusters?", "overlap", answer2, l2, r2, lh2, rh2,
              ("Which jobs are hired together?", "#jobs-together"), ("Do the clusters follow official job groups?", "#jobs-groups"))

    q = jobs["quality"]
    majors = jobs["majors"]
    nodes = jobs["nodes"]
    cl_ids = [c["id"] for c in cl]
    tot = {cid: sum(n["filings"] for n in nodes if n["cluster"] == cid) for cid in cl_ids}
    maj_ids = sorted({n["major"] for n in nodes}, key=lambda m: -sum(n["filings"] for n in nodes if n["major"] == m))[:8]
    cells = [[(sum(n["filings"] for n in nodes if n["cluster"] == cid and n["major"] == m) / tot[cid]) if tot[cid] else 0 for cid in cl_ids]
             for m in maj_ids]
    hsv, hh = heat([majors.get(m, m) for m in maj_ids], [short(c["label"]) for c in cl], cells, FIG_W,
                   aria="Share of each cluster's filings by official major group, among the 60 largest occupations")
    s_n, h_n = strip_chart([dict(label="NMI", sub="with the official groups", real=q["nmi"], real_label=f"{q['nmi']:.2f}",
                                 rref=(q["nmi_shuffled"]["mean"], f"shuffled {q['nmi_shuffled']['mean']:.2f}")),
                            dict(label="AMI", sub="corrected for chance", real=q["ami"], real_label=f"{q['ami']:.2f}", divider=True)],
                           (0, 0.3), FIG_W, [0, 0.1, 0.2, 0.3], lambda v: f"{v:.1f}", label_w=150, badge_w=20, zero_line=0,
                           aria="Agreement between the clusters and the official groups, against shuffled labels")
    lb = jobs["backbone"]
    l3, lh3 = left_col(
        ("p", "The government groups occupations by their first two SOC digits. We compare those labels with the clusters found from hiring "
              "patterns."),
        ("n", "What to notice.", "The software cluster also holds engineers, accountants and managers: companies hire across the official groups."),
        ("r", reveal_row(
            reveal("How the comparison works", "How the comparison works",
                   "The shuffled bars keep the clusters fixed and scramble only the official labels. We keep certified H-1B filings and "
                   "identify companies by tax number, as in the other sections. A link counts the companies that filed for both "
                   f"occupations. Filings still on 2010 computer codes ({num(jobs['meta']['legacy_filings_recoded'])} filings) move to "
                   "their 2018 successors. Louvain runs 100 times on the full projection and the best modularity run is kept; the runs "
                   f"agree at a median NMI of {q['louvain']['nmi_between_runs_median']:.2f}. The null rewires the company × occupation "
                   f"network {num(q['null']['runs'])} times, keeping each company’s number of occupations and each occupation’s "
                   "number of companies, and projects it again; real and rewired networks are scored on their largest connected piece "
                   f"(z = {num(round(q['null']['z']))}).", width=480),
            reveal("Backbone, FY2024 and Infomap", "Backbone, FY2024 and Infomap",
                   f"The disparity filter at α = {lb['alpha']}, as in the place section, keeps {num(lb['links'])} of "
                   f"{num(lb['links_total'])} links and {num(lb['occupations_linked'])} occupations. Louvain on that backbone finds "
                   f"{num(lb['clusters_on_backbone'])} clusters, which match the full network’s at NMI {lb['nmi_with_full_clusters']:.2f}, "
                   f"against {lb['nmi_between_full_runs_median']:.2f} between two runs on the full network: the clusters only partly survive "
                   "the filter. NMI and AMI leave out occupations alone in a cluster and are compared with 100 shuffles of the "
                   f"major-group labels. The same method on FY2024 gives clusters that match FY2025 at NMI "
                   f"{jobs['comparison']['nmi_between_years']:.2f} on the {num(jobs['comparison']['shared_occupations'])} occupations "
                   f"both years share. Infomap, the random-walk method, finds {num(q['infomap']['modules_of_two_or_more'])} clusters of "
                   f"two or more occupations; they agree with Louvain’s at NMI {q['infomap']['nmi_with_louvain']:.2f} and match the "
                   f"official groups at {q['infomap']['nmi_with_soc']:.2f}.", icon="plus", width=480, open_=True))),
    )
    r3, rh3 = right_col(
        ("Cluster × official major group", "Share of each cluster’s filings in each major group, among the 60 largest occupations.",
         hsv, hh),
        ("Observed match against shuffled labels", "Dot: the clusters’ match with the official groups. Dashed: the mean of 100 shuffles.",
         s_n, h_n),
    )
    answer3 = (f"The clusters follow the official groups only in part: NMI {q['nmi']:.2f} against {q['nmi_shuffled']['mean']:.2f} for "
               f"shuffled labels (AMI {q['ami']:.2f}), over the {num(q['occupations'])} occupations in clusters of two or more.")
    v3 = view("jobs-groups", crumb, "C", "Do the clusters follow official job groups?", "SOC comparison", answer3, l3, r3, lh3, rh3,
              ("Which jobs belong to two clusters?", "#jobs-bridges"), ("Who staffs whom: the first round", "Deep3a.dc.html"))
    op = deep_opener("Which jobs go together: three earlier questions", "first round · section 2",
                     "Our first round of questions, with their charts.", "cut-jobs")
    return board("Week 4 · deep dive, first round of section 2", "Deep2.dc.html", "2", op, [v1, v2, v3], open_room=260)


# ================================================================ first round, section 3 (Gyula's)

def deep3a():
    crumb = "Deep dive · first round · 3 Who staffs whom"
    k24 = lot["2024"]["by_kind"]
    reg = [("Direct employers", k24["direct"]["registrations_per_approval"], ACCESS, None),
           ("Placing firms", k24["placing"]["registrations_per_approval"], PEOPLE, None),
           ("Firms under 20 filings", k24["small"]["registrations_per_approval"], CARD, INK)]
    became = [("Direct employers", k24["direct"]["selected_that_became_petitions"], ACCESS, None),
              ("Placing firms", k24["placing"]["selected_that_became_petitions"], PEOPLE, None),
              ("Firms under 20 filings", k24["small"]["selected_that_became_petitions"], CARD, INK)]
    s1, h1 = colored_bars(reg, FIG_W, lambda v: f"{v:.1f}", label_w=170, aria="Registrations per approved petition, by kind of employer")
    s2, h2 = colored_bars(became, FIG_W, lambda v: pct(v, 0), label_w=170, max_v=1,
                          aria="Share of drawn registrations that became a petition, by kind of employer")
    l1, lh1 = left_col(
        ("p", "A filing is a request to employ someone, not a hire."),
        ("p", "Direct employers sent 5.1 registrations per approved petition, placing firms 9.1, and firms with fewer than 20 filings 12.2; "
              "those small firms sent 53% of the 758,967 registrations. Most of the gap is drawn tickets nobody used."),
        ("r", reveal_row(
            reveal("How we count", "How we count",
                   "The worksites file lists every client a filing names; we leave out the 16% of client entries that name no company, such "
                   "as “Home Address”, and the 1,881 where a firm names itself. Counted that way, 101,763 filings (18.9%) name a client "
                   "company: the worker is employed by one company and works at another, down from 21.9% in FY2022."),
            reveal("The lottery", "The lottery",
                   "The lottery shows the same split one step earlier. Each new H-1B worker starts as a registration that USCIS draws at "
                   "random, and USCIS gave Bloomberg News every registration from the March 2023 draw after a FOIA lawsuit. Every petition "
                   "that followed names its filing, so we can follow a ticket to its client."),
            reveal("More numbers", "More numbers",
                   "Placing firms also fare worse at USCIS: every year from FY2022 on, it denied about twice the share of their first-time "
                   "petitions, 2.7% against 1.2% for direct employers in FY2022 and 3.4% against 2.0% from October 2025 to June 2026. When "
                   "USCIS drew a direct employer’s registration, a petition followed 76% of the time; a placing firm’s, 50%; a small "
                   "firm’s, 35%. That step carries 74% of the gap between placing and direct firms, and the draw itself 24%. Much of it "
                   "comes from workers registered by several employers: 54% of registrations named one, and when USCIS drew one, a petition "
                   "followed 23% of the time, against 81% for a worker registered once. 18,307 of the petitions lead to a client company. "
                   "Citigroup received the most, 342 through 38 firms.", icon="plus", width=500, align="right"))),
    )
    r1, rh1 = right_col(
        ("Registrations per approved petition", "The March 2023 draw, by the kind of employer that registered the worker.", s1, h1),
        ("Drawn registrations that became a petition", "Same draw. A drawn ticket with no petition is a seat nobody took up.", s2, h2),
    )
    v1 = view("who-q1", crumb, "A", "How many workers sit at a client?", "FY2025 · March 2023 draw",
              "In FY2025, 104,732 of the 537,796 certified filings (19.5%) mark a client site.", l1, r1, lh1, rh1,
              None, ("Do clients group by industry or by the firm that staffs them?", "#who-q2"))

    iv = scm["industry_or_vendor"]
    s3, h3 = strip_chart([
        dict(label="Main vendor", sub="each link counted once", real=iv["unweighted"]["ami_community_main_vendor_same_clients"],
             real_label=f"{iv['unweighted']['ami_community_main_vendor_same_clients']:.2f}"),
        dict(label="Industry", sub="each link counted once", real=iv["unweighted"]["ami_community_industry"],
             real_label=f"{iv['unweighted']['ami_community_industry']:.2f}", hollow=True),
        dict(label="Main vendor", sub="weighted by filings", real=iv["ami_community_main_vendor_same_clients"],
             real_label=f"{iv['ami_community_main_vendor_same_clients']:.2f}", divider=True),
        dict(label="Industry", sub="weighted by filings", real=iv["ami_community_industry"],
             real_label=f"{iv['ami_community_industry']:.2f}", hollow=True),
    ], (0, 0.6), FIG_W, [0, 0.2, 0.4, 0.6], lambda v: f"{v:.1f}", label_w=150, badge_w=20, zero_line=0, row_h=52,
        aria="How well the groups match each client's main vendor and industry")
    l2, lh2 = left_col(
        ("p", "With every firm–client link counted once, Louvain splits the network into about 65 groups, and the split beats rewired networks "
              "that keep everyone’s number of partners (modularity 0.57 against 0.53). Among the 1,209 clients with a known industry and two or "
              "more firms, the groups match the main vendor at an adjusted mutual information (AMI) of 0.11 and the industry at 0.07; both "
              "beat shuffled labels."),
        ("r", reveal_row(
            reveal("Why AMI", "Why AMI", "AMI corrects NMI for chance, which matters here: these clients have 478 main vendors but only 17 industries."),
            reveal("With filing counts", "With filing counts",
                   "Counting filings pulls clients to their main vendor (AMI 0.48 against 0.07), but that split scores below rewired networks "
                   "with the same filing counts (0.60 against 0.74), and the vendor’s head start is built in: the vendor is a node in the same "
                   "network, and 86% of these clients land in its group.", icon="plus"))),
    )
    r2, rh2 = right_col(("How well the groups match vendor and industry", "AMI, 0 = labels dealt at random. Filled: the main vendor; "
                         "hollow: the industry.", s3, h3))
    v2 = view("who-q2", crumb, "B", "Do clients group by industry or by the firm that staffs them?", "FY2025",
              "By both, weakly, and slightly more by vendor.", l2, r2, lh2, rh2,
              ("How many workers sit at a client?", "#who-q1"), ("Who relies on a single vendor?", "#who-q3"))

    y25 = scl["years"]["2025"]
    fl = y25["flows"]
    one_share_clients = 14678 / 18900
    st1, hs1 = stacked_rows([("Clients", [one_share_clients, 1 - one_share_clients]), ("Placed filings", [0.22, 0.78])],
                            FIG_W, ["one firm", "two or more firms"], aria="Clients that use one firm: their share of clients and of filings",
                            tints=[INK, "#d3dce8"])
    top8 = fl["from_top_vendors"] / fl["client_filings"]
    st2, hs2 = stacked_rows([("The 20 largest clients", [top8, 1 - top8])], FIG_W,
                            ["from the eight largest firms", "from every other firm"],
                            aria="Where the 20 largest clients' filings come from", tints=[INK, "#d3dce8"])
    l3, lh3 = left_col(
        ("p", "14,678 of the 18,900 clients use one firm, but they hold 22% of placed filings. Of the 629 clients with 20 or more filings, 69 get "
              "over 90% from one firm, and the median one gets 37% from its largest."),
        ("r", reveal_row(reveal("More numbers", "More numbers",
                                "Citigroup, the largest client, uses 114 firms, and Tata Consultancy Services supplies a quarter. The eight "
                                "largest firms supply only 27% of what the 20 largest clients receive.", icon="plus"))),
    )
    r3, rh3 = right_col(
        ("One firm, many clients, few filings", "Clients that use a single firm, as a share of all clients and of all placed filings, FY2025.",
         st1, hs1),
        ("Who supplies the largest clients", f"The {num(fl['client_filings'])} filings the 20 largest clients receive.", st2, hs2),
    )
    v3 = view("who-q3", crumb, "C", "Who relies on a single vendor?", "FY2025", "Small clients.", l3, r3, lh3, rh3,
              ("Do clients group by industry or by the firm that staffs them?", "#who-q2"), ("Does it hold from year to year?", "#who-q4"))

    stab = scm["stability"]
    s4, h4 = strip_chart([dict(label=f"FY{s['from']} → FY{s['to']}", sub=f"{num(s['shared_clients'])} shared clients",
                               real=s["unweighted_nmi"], real_label=f"{s['unweighted_nmi']:.2f}",
                               rref=(s["unweighted_same_year_nmi"], f"same year {s['unweighted_same_year_nmi']:.2f}")) for s in stab],
                         (0, 0.6), FIG_W, [0, 0.2, 0.4, 0.6], lambda v: f"{v:.1f}", label_w=150, badge_w=20,
                         aria="Agreement of consecutive years' groups, against two runs of the same year")
    l4, lh4 = left_col(
        ("p", "On the clients present in both years, consecutive years agree at NMI 0.21 to 0.27, about half the 0.48 to 0.50 between two runs "
              "of the same year on the same clients."),
        ("p", "These are applications, so they show what employers asked for, not why."),
        ("r", reveal_row(
            reveal("FY2026", "FY2026 breaks the pattern at the top",
                   "We compare January to June of each year, because October 2025, the month of the federal shutdown, holds 1,306 certified "
                   "filings against 35,258 a year earlier. From January to June, certified filings fell 5.8% after rising 9.5% the year "
                   "before, and filings that name a client company fell 16.5% after holding flat (-0.1%). Tata Consultancy Services filed "
                   "2,079, down from 5,256. Of the 349 clients it supplied most from January to June 2025, 223 still appear, and 111 of those "
                   "now get most of their workers from another firm, most often Infosys. Across clients with five or more filings in both "
                   "years, 47% changed their main vendor, against 44% a year earlier.", icon="plus", width=500, open_=True),
            reveal("Scope", "Scope", "We compared vendor and industry on FY2025 only."))),
    )
    r4, rh4 = right_col(("Consecutive years against the same year", "NMI of the groups on shared clients. Dots: two consecutive years. "
                         "Dashed: two runs of the same year.", s4, h4))
    v4 = view("who-q4", crumb, "D", "Does it hold from year to year?", "FY2022 to FY2026", "Only in part.", l4, r4, lh4, rh4,
              ("Who relies on a single vendor?", "#who-q3"), ("Who files the paperwork?", "Deep3b.dc.html"))
    op = deep_opener("Who staffs whom: four earlier questions", "first round · section 3",
                     "Our first round of questions, with their charts.", "cut-who")
    return board("Week 4 · deep dive, first round of section 3", "Deep3a.dc.html", "3", op, [v1, v2, v3, v4], open_room=280)


def deep3b():
    crumb = "Deep dive · first round · 3 Who staffs whom"
    o = law["outsourcing"]
    s1, h1 = strip_chart([
        dict(label="No outside law firm", sub="share of filings", pair=[(o["placing"]["no_firm_share_pooled"], PEOPLE, pct(o["placing"]["no_firm_share_pooled"], 0)),
                                                                    (o["direct"]["no_firm_share_pooled"], ACCESS, pct(o["direct"]["no_firm_share_pooled"], 0))]),
        dict(label="To the five largest", sub="share of filings", pair=[(o["placing"]["top5_share_pooled"], PEOPLE, pct(o["placing"]["top5_share_pooled"], 0)),
                                                                     (o["direct"]["top5_share_pooled"], ACCESS, pct(o["direct"]["top5_share_pooled"], 0))]),
    ], (0, 0.6), FIG_W, [0, 0.2, 0.4, 0.6], lambda v: f"{v * 100:.0f}%", label_w=150, badge_w=24,
        aria="Law firm use: outsourcing firms against direct employers")
    top = law["years"]["2025"]["concentration"]["top_firms_by_filings"][:5]
    pretty = {"Fragomen DEL REY Bernsen and Loewy": "Fragomen", "Berry Appleman and Leiden": "Berry Appleman & Leiden",
              "Ogletree Deakins Nash Smoak and Stewart PC": "Ogletree Deakins", "EY LAW": "EY Law",
              "Corporate Immigration Partners PC": "Corporate Immigration Partners"}
    s1b, h1b = hbars([(pretty.get(n, n), v, i == 0) for i, (n, v) in enumerate(top)], FIG_W, lambda v: num(v), label_w=200, value_w=60,
                     aria="The five law firms that file the most")
    key = (f'<div style="display: flex; gap: 16px; font-size: 12px; color: {INK_SOFT}">'
           f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {PEOPLE}"></span>outsourcing firms</span>'
           f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {ACCESS}"></span>direct employers</span></div>')
    l1, lh1 = left_col(
        ("p", "Outsourcing firms mostly do without: they file 52% of their applications with no outside firm and send 3% to the five largest, "
              "while direct employers send those five 48%."),
        ("r", reveal_row(
            reveal("More numbers", "More numbers",
                   "Fragomen alone files 78,531 for 3,129 employers. Per employer the averages are 2% and 30%, and none of 1,000 shuffles of "
                   "which employer is which produced a gap that wide.", icon="plus"),
            reveal("The law-firm network", "The law-firm network",
                   "Two law firms share filings when the same employer uses both: for each such employer, the smaller of its filings through "
                   "either. That network has one giant hub, the case the disparity filter was made for. A weight threshold of four shared "
                   "filings keeps 771 links and spends 26% of them on the five largest firms. The disparity filter at α = 0.2 keeps 697 "
                   "and spends 19%. It also keeps 115 small firms the threshold drops, such as one law office whose link to BBI Law Group is "
                   "3 of its 5 shared filings and 3 of BBI’s 342. The threshold keeps the larger connected core, 395 firms against the "
                   "filter’s 351. Another 144 firms stay only because they form a pair linked to nobody else, where neither end can judge "
                   "the link.", width=500),
            reveal("Its groups", "Its groups",
                   "Louvain finds 34 groups at modularity 0.67, against 0.55 for rewired networks that keep each employer’s and each law "
                   "firm’s number of partners (z = 12). The groups are barely regional (NMI 0.05 with Census regions, though above every "
                   "shuffle), and the largest gather around shared employers. Google, Apple and Meta share Fragomen, Ogletree Deakins and "
                   "Berry Appleman & Leiden; Tata Consultancy, LTIMindtree and Salesforce share Usilaw, Goel & Anderson and Chugh; Vialto, "
                   "once PwC’s law firm, serves Doordash and Databricks. The groups move from year to year: FY2024 and FY2025 agree at NMI "
                   "0.30 on the 1,041 law firms in both, against 0.88 between two runs of FY2025. Figures from analysis/week04_lawfirms.py.",
                   width=500, align="right"))),
    )
    r1, rh1 = right_col(
        ("Who uses an outside law firm", "Pooled over employers with 20 or more filings, FY2025.", key + s1, h1 + 22),
        ("The five largest law firms", "Certified H-1B filings each prepared in FY2025.", s1b, h1b),
    )
    v1 = view("who-lawyers", crumb, "E", "Who files the paperwork?", "employer × law firm · FY2025",
              "Three filings in four name an outside law firm, and five firms file 40% of those.", l1, r1, lh1, rh1,
              ("Does it hold from year to year?", "Deep3a.dc.html"), ("With filing counts or without?", "#staffing-community-stats"))

    m = scm["modularity"]
    wvu = scm["weighted_vs_unweighted"]
    iv = scm["industry_or_vendor"]
    s2, h2 = strip_chart([
        dict(label="Each link counted once", sub="against rewired", real=m["wiring_only"]["real"], real_label=f"{m['wiring_only']['real']:.2f}",
             base=(m["wiring_only"]["null"], m["wiring_only"]["null_sd"]), base_label=f"rewired {m['wiring_only']['null']:.2f}",
             badge=f"z = {m['wiring_only']['z']:.0f}"),
        dict(label="Weighted by filings", sub="against rewired", real=m["weighted_vs_rewired"]["real"],
             real_label=f"{m['weighted_vs_rewired']['real']:.2f}", base=(m["weighted_vs_rewired"]["null"], m["weighted_vs_rewired"]["null_sd"]),
             base_label=f"rewired {m['weighted_vs_rewired']['null']:.2f}", badge=f"z = {sgn(m['weighted_vs_rewired']['z'], 0)}", divider=True),
        dict(label="Weighted by filings", sub="counts shuffled on real links", real=m["weights_only"]["real"],
             real_label=f"{m['weights_only']['real']:.2f}", base=(m["weights_only"]["null"], m["weights_only"]["null_sd"]),
             base_label=f"shuffled {m['weights_only']['null']:.2f}", badge=f"z = {sgn(m['weights_only']['z'], 0)}"),
    ], (0.4, 0.8), FIG_W, [0.4, 0.5, 0.6, 0.7, 0.8], lambda v: f"{v:.1f}", label_w=170, badge_w=76,
        aria="Modularity of the firm to client network, real against rewired, with and without filing counts")
    row = lambda label, a_, b_: (f'<tr style="border-top: 1px solid {LINE_SOFT}"><td style="padding: 5px 8px 5px 0; color: {INK}">{t(label)}</td>'
                                 f'<td style="padding: 5px 8px; text-align: right; color: {INK}; font-weight: 600">{a_}</td>'
                                 f'<td style="padding: 5px 0 5px 8px; text-align: right; color: {INK}; font-weight: 600">{b_}</td></tr>')
    two = lambda v: f"{v:.2f}"
    table = (
        f'<table style="width: 100%; border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums">'
        f'<thead><tr style="color: {INK_MUTE}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em">'
        '<th style="text-align: left; padding: 5px 8px 5px 0; font-weight: 700"></th>'
        '<th style="text-align: right; padding: 5px 8px; font-weight: 700">Weighted</th>'
        '<th style="text-align: right; padding: 5px 0 5px 8px; font-weight: 700">Unweighted</th></tr></thead><tbody>'
        + row("Communities (median run)", num(m["communities_median"]), num(wvu["communities_median_unweighted"]))
        + row("NMI between two seeds", two(wvu["nmi_between_seeds_weighted"]), two(wvu["nmi_between_seeds_unweighted"]))
        + row("AMI with client industry", two(iv["ami_community_industry"]), two(iv["unweighted"]["ami_community_industry"]))
        + row("AMI with main vendor", two(iv["ami_community_main_vendor_same_clients"]), two(iv["unweighted"]["ami_community_main_vendor_same_clients"]))
        + row("Clients in their main vendor’s group", pct(iv["share_with_own_main_vendor"], 0), pct(iv["unweighted"]["share_with_own_main_vendor"], 0))
        + "</tbody></table>"
    )
    wc = m["weights_check"]
    im = scm["infomap"]
    answer2 = (f"The two partitions share an NMI of {wvu['nmi_median']:.2f}, less than two runs of either kind with different seeds "
               f"({wvu['nmi_between_seeds_weighted']:.2f} weighted, {wvu['nmi_between_seeds_unweighted']:.2f} unweighted), so the filing "
               "counts change the grouping.")
    l2, lh2 = left_col(
        ("p", f"They pull it toward vendors: AMI with each client’s main vendor rises from "
              f"{iv['unweighted']['ami_community_main_vendor_same_clients']:.2f} to {iv['ami_community_main_vendor_same_clients']:.2f} when "
              f"filings count, while AMI with industry stays near {iv['ami_community_industry']:.2f}."),
        ("r", reveal_row(
            reveal("How the null works", "How the null works",
                   "The null rewires the network so every firm and client keeps its number of partners, and deals the filing counts back "
                   f"out at random. Rewiring breaks the network into a median of {num(m['rewired_components_median'])} pieces, each a free "
                   "community, so we score each rewired network on its largest piece, as we do the real one."),
            reveal("More numbers", "More numbers",
                   f"Without weights the real network wins ({m['wiring_only']['real']:.2f} against {m['wiring_only']['null']:.2f}). With "
                   f"weights it loses ({m['weighted_vs_rewired']['real']:.2f} against {m['weighted_vs_rewired']['null']:.2f}), and it loses "
                   f"when only the filing counts are shuffled on the real links ({m['weights_only']['null']:.2f}). The real counts leave "
                   f"{pct(1 - wc['real_inside_share'], 0)} of filings on links between groups, against {pct(1 - wc['shuffled_inside_share'], 0)} "
                   f"with shuffled counts: clients that use several firms hold {pct(wc['links_to_multi_vendor_clients_share'], 0)} of the "
                   f"links but {pct(wc['filings_to_multi_vendor_clients_share'], 0)} of the filings, and only their links can cross: a "
                   "client with one firm sits in that firm’s group.", icon="plus", width=480),
            reveal("Infomap", "Infomap",
                   f"Infomap, which follows a random walk instead of counting links, splits the same network into {num(im['modules'])} small "
                   f"modules, most of them a firm with its clients. They agree with Louvain at NMI {im['nmi_with_louvain']:.2f} and, like "
                   "weighted Louvain, follow the vendor far more than the industry (AMI "
                   f"{im['ami_community_main_vendor_same_clients']:.2f} against {im['ami_community_industry']:.2f}). Finer partitions "
                   "raise every NMI; AMI corrects for that, so it is the number to compare across methods.", align="right"))),
    )
    r2, rh2 = right_col(
        ("Modularity with and without filing counts", "Dots: the real network. Grey: rewired networks, or the real links with their "
         "filing counts shuffled.", s2, h2),
        ("Weighted and unweighted, side by side", "Louvain on the firm–client network for FY2025, 100 runs each.", table, 6 * 26 + 26),
    )
    v2 = view("staffing-community-stats", crumb, "F", "With filing counts or without?", "weighted vs unweighted", answer2, l2, r2, lh2, rh2,
              ("Who files the paperwork?", "#who-lawyers"), ("Strong ties, weak ties and pay", "#staffing-ties"))

    wt = ties["weak_ties"]["2025"]
    s3, h3 = strip_chart([dict(label="Filings against overlap", sub=f"Spearman, {num(wt['defined_links'])} links",
                               real=wt["spearman_weight_overlap"]["rho"], real_label=sgn(wt["spearman_weight_overlap"]["rho"], 2),
                               base=(wt["weight_shuffle_null"]["mean_rho"], wt["weight_shuffle_null"]["sd_rho"]), base_label="counts shuffled",
                               badge=f"z = {sgn(wt['weight_shuffle_null']['z'], 1)}")],
                         (-0.06, 0.04), FIG_W, [-0.06, -0.04, -0.02, 0, 0.02, 0.04], lambda v: sgn(v, 2), label_w=170, badge_w=76,
                         zero_line=0, aria="Correlation of link weight with neighbourhood overlap, real against shuffled filing counts")
    wd = ties["wage"]["wage_distribution_placing_vs_direct_filings"]
    s3b, h3b = stacked_rows([("Outsourcing firms", [wd["placing"][k] for k in "1234"]), ("Direct employers", [wd["direct"][k] for k in "1234"])],
                            FIG_W, ["Level I", "Level II", "Level III", "Level IV"], aria="Wage levels of outsourcing firms and direct employers")
    l3, lh3 = left_col(
        ("p", "Over the 28,104 links where overlap is defined, filings and overlap correlate at Spearman -0.04; with the filing counts shuffled "
              "over the same links the correlation is 0.00 ± 0.01 (z = -6.3; FY2024 gives z = -3.7). Heavy links mostly belong to the "
              "largest firms, whose many clients rarely share other firms, so part of this is size."),
        ("p", "Outsourcing firms file 66% of their applications at level II and 5% at level IV; direct employers file 35% and 22%."),
        ("r", reveal_row(
            reveal("The idea", "The idea",
                   "Among friends, the strongest ties sit inside tight groups where your close friends also know each other, and weak ties "
                   "bridge the groups (Granovetter 1973; Onnela and colleagues confirmed it on millions of phone users in 2007). A link’s "
                   "overlap measures the tightness: of the firm’s other clients and the client’s other firms, the share that are linked "
                   "to each other."),
            reveal("More numbers", "More numbers",
                   "Links with one filing have a mean overlap of 0.065, links with 21 or more 0.034. It agrees with the result above: the real "
                   "filing counts put weight on links between groups. Each filing states one of four wage levels, from entry (I) to fully "
                   "competent (IV). Averaged per client over the filings that reach it, the groups explain 13% of the variance in wage level; "
                   "averaged per firm over all its filings, 3%. None of 1,000 shuffles of the group labels reached either. A client’s "
                   "filings come from the vendors that also decide its group, so part of the 13% is built in. From January to June 2026, "
                   "level IV rose to 17.7% of all filings from 13.6% a year earlier, and level I fell to 18.0% from 21.8%. Figures from "
                   "analysis/week04_ties.py and analysis/week04_shift.py.", icon="plus", width=500))),
    )
    r3, rh3 = right_col(
        ("Heavy links, looser neighbourhoods", "Spearman correlation between a link’s filings and its overlap, against 100 shuffles of the "
         "filing counts over the same links.", s3, h3),
        ("Wage levels as filed", "Share of each kind of employer’s FY2025 filings at each prevailing-wage level.", s3b, h3b),
    )
    v3 = view("staffing-ties", crumb, "G", "Strong ties, weak ties and pay", "overlap · wage levels",
              "Here the pattern runs the other way, faintly.", l3, r3, lh3, rh3,
              ("With filing counts or without?", "#staffing-community-stats"),
              ("Do the firms that register the same workers staff the same clients?", "#staffing-lottery"))

    ct = lot["2024"]["community_test"]["unweighted"]
    s4, h4 = strip_chart([dict(label="High firms’ groups", sub="share of high firms", real=ct["high_mates_share"],
                               real_label=pct(ct["high_mates_share"]), rref=(ct["high_mates_share_shuffled"], f"shuffled {pct(ct['high_mates_share_shuffled'])}"))],
                         (0.45, 0.6), FIG_W, [0.45, 0.5, 0.55, 0.6], lambda v: f"{v * 100:.0f}%", label_w=170, badge_w=20,
                         aria="Share of high firms in a high firm's group, real against shuffled labels")
    s4b, h4b = strip_chart([dict(label="AMI with the groups", sub="median of 100 runs", real=ct["ami_median"],
                                 real_label=f"{ct['ami_median']:.3f}", ci=(ct["ami_min"], ct["ami_max"]))],
                           (0, 0.1), FIG_W, [0, 0.025, 0.05, 0.075, 0.1], lambda v: f"{v:.3f}", label_w=170, badge_w=20, zero_line=0,
                           aria="AMI between high and low firms and the staffing groups")
    l4, lh4 = left_col(
        ("p", "If the high firms clustered, a high firm’s Louvain group would be mostly high firms. It is 51.2% high, against 50.0% when the "
              "labels are shuffled (p = 0.001 over 1,000 shuffles), and AMI with the groups is 0.004 over 100 runs."),
        ("r", reveal_row(
            reveal("How we tested it", "How we tested it",
                   "We took the 2,942 firms in the FY2023 staffing network that sent 20 or more registrations to the March 2023 draw, and "
                   "split them at the median share of workers another employer had also registered (78%)."),
            reveal("More numbers", "More numbers",
                   "The March 2022 draw against the FY2022 network gives 51.9% against 50.0%. The lottery data is USCIS’s, obtained by "
                   "Bloomberg News; figures from analysis/week04_lottery.py.", icon="plus", open_=True))),
    )
    r4, rh4 = right_col(
        ("Do high firms cluster?", "Share of high firms in a high firm’s group. Dashed: the same with the labels shuffled.", s4, h4),
        ("Agreement with the groups", "AMI between the high/low split and the staffing groups; the line spans 100 runs.", s4b, h4b),
    )
    v4 = view("staffing-lottery", crumb, "H", "Do the firms that register the same workers staff the same clients?", "March 2023 draw",
              "Registering the same workers is spread across the staffing groups; it does not mark a cluster of firms.", l4, r4, lh4, rh4,
              ("Strong ties, weak ties and pay", "#staffing-ties"), ("More networks", "DeepMoreA.dc.html"))
    op = deep_opener("Who staffs whom: the law firms, the weights and the lottery", "first round · section 3",
                     "The rest of the first round for section 3.", "cut-who-2")
    return board("Week 4 · deep dive, section 3 continued", "Deep3b.dc.html", "3", op, [v1, v2, v3, v4], open_room=160)


# ================================================================ more networks

def deep_more_a():
    crumb = "Deep dive · more networks"
    hi = {e["employer"]: e for e in perm["highest_ratio_among_big_filers"]}
    lo = {e["employer"]: e for e in perm["lowest_ratio_among_big_filers"]}
    rows = []
    for name, src, label in (("Oracle America", hi, "Oracle"), ("Uber Technologies", hi, "Uber"), ("Salesforce", hi, "Salesforce"),
                             ("Amazon", lo, "Amazon"), ("Cognizant", lo, "Cognizant"), ("Google", lo, "Google")):
        e = src[name]
        rows.append(dict(label=label, sub=f"{num(e['lca_filings'])} H-1B filings", real=e["ratio"], real_label=f"{e['ratio']:.0f}",
                         divider=(label == "Amazon")))
    s1, h1 = strip_chart(rows, (0, 100), FIG_W, [0, 25, 50, 75, 100], lambda v: f"{v:.0f}", label_w=150, badge_w=20, row_h=44,
                         ref=perm["scored_median_ratio"], ref_label=f"median employer {perm['scored_median_ratio']:.1f}", top=26,
                         aria="Green cards per 100 H-1B filings for the named employers")
    l1, lh1 = left_col(
        ("p", "In FY2025 the median employer with 20 or more H-1B filings filed 13.2 green cards per 100 of them, and the two counts rank "
              "employers only loosely alike (Spearman 0.50)."),
        ("p", "As with degree and strength in the course, the exceptions carry the story: Oracle filed 95 green cards per 100 H-1B filings, "
              "Uber 64 and Salesforce 45, while Amazon (22,509 H-1B filings), Cognizant (11,085) and Google (8,657) filed almost none."),
        ("n", "Scope.", "Only 65% of certified green cards come from an employer we can match to an H-1B filer.", "!"),
        ("r", reveal_row(reveal("More numbers", "More numbers",
                                "Whether outsourcing firms sponsor fewer is section 5B. Clients sponsor their own staff too: Wells Fargo receives "
                                "1,547 H-1B filings from vendors, files 624 of its own and 167 green cards. Firms with more clients sponsor "
                                "slightly more green cards, not fewer (Spearman 0.13). Figures from analysis/week04_perm.py.", icon="plus"))),
    )
    r1, rh1 = right_col(("Green cards per 100 H-1B filings", "The six employers the text names, FY2025; not a ranking. Dashed: the median employer with 20 or more H-1B filings.",
                         s1, h1))
    v1 = view("deeper-perm", crumb, "M1", "Who keeps them? Green cards as the strong tie", "PERM against H-1B · FY2025",
              "An H-1B filing is a weak tie between an employer and a worker; a green-card filing (PERM) is a strong one, because the employer "
              "sponsors the worker to stay.", l1, r1, lh1, rh1, None, ("Where are they from? A network of countries", "#deeper-countries"))

    top = ctry["perm"]["2023"]["descriptive"]["top"][:8]
    s2, h2 = hbars([(c["country"].title().replace("South Korea", "South Korea"), c["share"], i < 2) for i, c in enumerate(top)], FIG_W,
                   lambda v: pct(v), label_w=110, value_w=56, aria="Shares of FY2023 certified green-card filings by citizenship")
    mo = ctry["modularity"]
    s2b, h2b = strip_chart([
        dict(label="Links counted once", sub="against rewired", real=mo["wiring_only"]["real"], real_label=f"{mo['wiring_only']['real']:.2f}",
             base=(mo["wiring_only"]["null"], mo["wiring_only"]["null_sd"]), base_label=f"rewired {mo['wiring_only']['null']:.2f}",
             badge=f"z = {mo['wiring_only']['z']:.1f}"),
        dict(label="Weighted by green cards", sub="against rewired", real=mo["weighted_vs_rewired"]["real"],
             real_label=f"{mo['weighted_vs_rewired']['real']:.2f}", base=(mo["weighted_vs_rewired"]["null"], mo["weighted_vs_rewired"]["null_sd"]),
             base_label=f"rewired {mo['weighted_vs_rewired']['null']:.2f}", badge=f"z = {sgn(mo['weighted_vs_rewired']['z'], 1)}"),
    ], (0, 0.5), FIG_W, [0, 0.1, 0.2, 0.3, 0.4, 0.5], lambda v: f"{v:.1f}", label_w=170, badge_w=76,
        aria="Modularity of the country network against rewired copies")
    l2, lh2 = left_col(
        ("p", "India holds 52% of those filings and China 12%; among lottery registrations, India holds 77% in the March 2022 draw and 81% in "
              "March 2023. Link two countries by the green cards their citizens receive at the same employers and 55 countries remain. "
              "Louvain splits them into three groups."),
        ("r", reveal_row(
            reveal("How we kept it private", "How we kept it private",
                   "A worker’s citizenship is personal, so we read it only in memory and keep counts per country and employer, dropping "
                   "every count under 10. That drops 96% of the cells and 43% of FY2023’s certified green-card filings. Figures from "
                   "analysis/week04_countries.py; no row about a person leaves the script."),
            reveal("More numbers", "More numbers",
                   "Counted once each, the links group a little more than rewired copies (modularity 0.10 against 0.06); weighted by shared "
                   "green cards, they group less (0.26 against 0.40). India and China share one group with Canada, Belarus and Costa Rica, "
                   "and India keeps 79% of its weight inside it. Among the ten largest sponsors, Google’s green cards are the most varied, "
                   "4.7 effective countries with India at 30%, against Amazon’s 3.0 at 67%. The third group gathers the Philippines, "
                   "Kenya, Ghana, Zimbabwe, Ethiopia, Cameroon and Jamaica. Wayne Farms, a poultry company, filed 832 green cards in the "
                   "counted cells, none for Indian citizens.", icon="plus", width=500))),
    )
    r2, rh2 = right_col(
        ("Citizenship of FY2023’s green cards", "Share of certified green-card filings in the counted cells.", s2, h2),
        ("Do countries group?", "Modularity of the country network against rewired copies.", s2b, h2b),
    )
    v2 = view("deeper-countries", crumb, "M2", "Where are they from? A network of countries", "green cards by citizenship · FY2023",
              "The groups match world regions (AMI 0.10) and Week 3’s migration communities (0.10) only weakly: green-card hiring does "
              "not sort countries into regional blocs.", l2, r2, lh2, rh2,
              ("Who keeps them? Green cards as the strong tie", "#deeper-perm"),
              ("Where is the hiring densest? Filings per 1,000 jobs", "#deeper-density"))

    mr = oews["metro_rates"]
    top = mr["top_by_intensity"][:10]
    ny = next(m for m in mr["top_by_count"] if m["metro"] == "35620")
    rows3 = [(m["name"].split(",")[0], m["rate"], m["metro"] == "41940") for m in top] + [("New York", ny["rate"], "outline")]
    s3, h3 = hbars(rows3, FIG_W, lambda v: f"{v:.1f}", label_w=130, value_w=50, ref=mr["national_rate_per_1000"],
                   ref_label=f"national {mr['national_rate_per_1000']:.1f}", aria="Certified H-1B filings per 1,000 jobs by metro")
    l3, lh3 = left_col(
        ("p", "Among the 203 metros with 100,000 jobs or more, count and density rank alike (Spearman 0.90), yet only 5 of the 10 largest by "
              "count stay in the top 10 by density: Dallas, San Jose, San Francisco, Seattle and Austin."),
        ("n", "Scope.", "A filing is a request, not a hire, so a rate can run high.", "!"),
        ("r", reveal_row(
            reveal("How we divide", "How we divide",
                   "Section 1 counts filings. Divide each metro’s FY2025 filings by its jobs in the Bureau of Labor Statistics’ May 2025 "
                   "employment survey (OEWS) and the map shifts: nationally it is 4.5 filings per 1,000 jobs. Figures from "
                   "analysis/week04_oews.py."),
            reveal("More numbers", "More numbers",
                   "For software developers alone the national rate is 139 filings per 1,000 jobs, and Fayetteville, Arkansas, the metro around "
                   "Bentonville, reaches 896, 6.4 times the national share.", icon="plus", open_=True))),
    )
    r3, rh3 = right_col(("Filings per 1,000 jobs", "The ten densest metros with 100,000 jobs or more, and New York (outlined), which files "
                         "the most. Dashed: the national rate.", s3, h3 + 12))
    v3 = view("deeper-density", crumb, "M3", "Where is the hiring densest? Filings per 1,000 jobs", "OEWS May 2025 · FY2025",
              "New York files the most, 65,935, but that is 6.9 per 1,000 jobs; San Jose files 42.9, Trenton 17.2 and Seattle 16.8.",
              l3, r3, lh3, rh3, ("Where are they from? A network of countries", "#deeper-countries"),
              ("Strength against degree", "DeepMoreB.dc.html"))
    op = deep_opener("More networks", "green cards · countries · jobs per metro",
                     "Six more networks from the same filings.", "cut-more")
    return board("Week 4 · deep dive, more networks", "DeepMoreA.dc.html", "M", op, [v1, v2, v3], open_room=200)


def deep_more_b():
    crumb = "Deep dive · more networks"
    hs = ties["strength_vs_degree"]["clients"]["high_strength_low_degree"][:5]
    s1, h1 = hbars([(c["label"], c["strength"], i < 4 and c["label"] != "Northwestern Mutual Life") for i, c in enumerate(hs)], FIG_W,
                   lambda v: num(v), label_w=190, value_w=50, aria="The clients with the most filings from a single firm")
    l1, lh1 = left_col(
        ("p", "In the FY2025 firm–client network the two rank firms almost alike (Spearman 0.91) and clients less so (0.75)."),
        ("r", reveal_row(reveal("The idea", "The idea",
                                "The course compares a node’s degree (how many partners) with its strength (how many filings over all its "
                                "links), and finds the exceptions tell the story. Figures from analysis/week04_ties.py."))),
    )
    r1, rh1 = right_col(("The heaviest one-to-one ties", "The clients with the most filings from a single firm are Ultimate Therapy, 133 "
                         "filings from one firm; Sigma Rehab, 95; Post Rehab Services, 61; and Grady Memorial Hospital, 58. Dark bars: "
                         "health care.", s1, h1))
    v1 = view("deeper-strength", crumb, "M4", "Strength against degree: where do the heavy links go?", "firm → client · FY2025",
              "Three of the top five are therapy and rehab clinics: the heaviest one-to-one ties belong to health care, not IT.",
              l1, r1, lh1, rh1, ("Where is the hiring densest?", "DeepMoreA.dc.html"),
              ("The lottery a year apart", "#deeper-lottery"))

    a23, a24 = lot["2023"], lot["2024"]
    series = [("All employers", a23["funnel"]["registrations_per_approval"], a24["funnel"]["registrations_per_approval"], INK, True),
              ("Placing firms", a23["by_kind"]["placing"]["registrations_per_approval"], a24["by_kind"]["placing"]["registrations_per_approval"], PEOPLE, False),
              ("Direct employers", a23["by_kind"]["direct"]["registrations_per_approval"], a24["by_kind"]["direct"]["registrations_per_approval"], ACCESS, False)]
    s2, h2 = slope(series, FIG_W, (3, 10), "March 2022", "March 2023", lambda v: f"{v:.1f}", height=250,
                   aria="Registrations per approved petition, March 2022 against March 2023")
    l2, lh2 = left_col(
        ("p", "Between the March 2022 and March 2023 draws, registrations for a worker whom another employer had also registered rose from 35% "
              "to 54% of the total, and the share of drawn registrations that became a petition fell from 74% to 49%."),
        ("p", "The order held both years: direct employers needed the fewest (4.3, then 5.1), placing firms more (6.3, then 9.1)."),
        ("r", reveal_row(reveal("More numbers", "More numbers",
                                "Of the March 2023 petitions, 20% lead to a client company, 66% of those through placing firms. Citigroup "
                                "received 342, 94% through placing firms; Microsoft 150, 95%, with LTIMindtree supplying 47%; AT&T 153, with "
                                "Tech Mahindra supplying 41%. USCIS also denied 2.0% of the placing firms’ lottery petitions against 1.1% of "
                                "direct employers’. Figures from analysis/week04_lottery.py.", icon="plus", width=480))),
    )
    r2, rh2 = right_col(("Registrations per approved petition", "Each line joins one kind of employer across the two draws.", s2, h2))
    v2 = view("deeper-lottery", crumb, "M5", "The lottery a year apart, and who receives the winners", "March 2022 and March 2023 draws",
              "One approved petition took 5.2 registrations in 2022 and 8.5 in 2023.", l2, r2, lh2, rh2,
              ("Strength against degree", "#deeper-strength"), ("USCIS denials, year by year", "#deeper-uscis"))

    us = staff["uscis_series"]
    lab = lambda r: "FY2026, Oct–Jun" if r["year"] == 2026 else f"FY{r['year']}"
    s3, h3 = strip_chart([dict(label=lab(r), sub=f"{num(r['placing']['employers'])} placing, {num(r['direct']['employers'])} direct",
                               pair=[(r["placing"]["initial_denial_rate"], PEOPLE, f"{r['placing']['initial_denial_rate'] * 100:.2f}%"),
                                     (r["direct"]["initial_denial_rate"], ACCESS, f"{r['direct']['initial_denial_rate'] * 100:.2f}%")])
                          for r in us], (0, 0.04), FIG_W, [0, 0.01, 0.02, 0.03, 0.04], lambda v: f"{v * 100:.0f}%", label_w=170,
                         badge_w=44, row_h=46, aria="Share of first-time H-1B petitions denied, placing firms against direct employers")
    key = (f'<div style="display: flex; gap: 16px; font-size: 12px; color: {INK_SOFT}">'
           f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {PEOPLE}"></span>placing firms</span>'
           f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: {ACCESS}"></span>direct employers</span></div>')
    l3, lh3 = left_col(
        ("p", "Share of first-time H-1B petitions USCIS denied, for employers with 20 or more certified filings that year. Placing firms put half "
              "or more of their filings at a client."),
        ("r", reveal_row(reveal("Source", "Source", "From the hub’s Tableau export; FY2026 runs October to June. Figures from "
                                                     "analysis/week04_staffing.py (uscis_series).", open_=True))),
    )
    r3, rh3 = right_col(("First-time petitions denied", "Each row is a year; the gap between the dots is the gap between the two kinds of "
                         "employer.", key + s3, h3 + 22))
    v3 = view("deeper-uscis", crumb, "M6", "USCIS denials, year by year", "first-time petitions · FY2022 to June 2026",
              "Placing firms also fare worse at USCIS: every year from FY2022 on, it denied about twice the share of their first-time petitions.",
              l3, r3, lh3, rh3, ("The lottery a year apart", "#deeper-lottery"), ("Data and methods", "DeepMethods.dc.html"))
    op = deep_opener("More networks, continued", "strong ties · the lottery · USCIS denials",
                     "Six more networks from the same filings.", "cut-more-2")
    return board("Week 4 · deep dive, more networks continued", "DeepMoreB.dc.html", "M", op, [v1, v2, v3], open_room=140)


# ================================================================ data and methods

SCRIPTS = [
    ("The three networks", [
        ("week04_where.py", "builds the place network and writes docs/assets/data/week04_place.json."),
        ("week04_jobs.py", "builds the occupation network."),
        ("week04_staffing.py", "and week04_staffing_figure.py build the firm → client network and its figure."),
    ]),
    ("Around them", [
        ("week04_shift.py", "compares January to June of FY2024, FY2025 and FY2026."),
        ("week04_ties.py", "tests strong and weak ties and wage levels."),
        ("week04_lawfirms.py", "builds the law-firm network and its backbones."),
        ("week04_lottery.py", "follows lottery registrations to petitions, filings and clients."),
        ("week04_perm.py", "compares green cards with H-1B filings."),
        ("week04_countries.py", "counts green cards by country and employer, hides every count under 10, and builds the country network."),
        ("week04_oews.py", "divides filings by the Bureau of Labor Statistics’ OEWS jobs per metro and occupation."),
    ]),
    ("Names and industries", [
        ("week04_names.py", "decides which names are the same company."),
        ("week04_names_check.py", "tests its rules against tax numbers."),
        ("week04_sec.py", "adds industry codes from the SEC."),
        ("week04_wikidata.py", "adds them from Wikidata (CC0) for clients the SEC does not list, through a reviewed table of Wikidata industries."),
    ]),
    ("The questions in sections 1 to 5", [
        ("week04_where_who.py · week04_jobs_split.py · week04_staffing_moves.py · week04_footprint.py · "
         "week04_footprint_rank.py · week04_beyond.py", "answer the questions in sections 1 to 5, each against its own null model."),
    ]),
    ("Checks", [("week04_schemas.py", "checks every JSON file against the fields the page reads.")]),
]


def deep_methods():
    crumb = "Deep dive · data and methods"
    sources = [
        ("US Department of Labor, Office of Foreign Labor Certification", "LCA disclosures and worksites file, public domain",
         "https://www.dol.gov/agencies/eta/foreign-labor/performance"),
        ("USCIS H-1B Employer Data Hub", "FY2022 to June 2026", "https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub"),
        ("H-1B lottery registrations", "the FY2022 to FY2024 draws, USCIS data obtained by Bloomberg News under FOIA",
         "https://github.com/BloombergGraphics/2024-h1b-immigration-data"),
        ("Census CBSA delineations", "counties to metro areas",
         "https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html"),
        ("Bureau of Labor Statistics OEWS", "jobs per metro and occupation, May 2025", "https://www.bls.gov/oes/tables.htm"),
        ("SEC EDGAR", "industry codes of listed clients", "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"),
        ("Wikidata", "industries of clients the SEC does not list, CC0", "https://www.wikidata.org/"),
    ]
    src_html = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 9px 0; border-top: 1px solid {LINE_SOFT}">'
        f'<a href="{a(u)}" style="font-size: 13px; font-weight: 700; color: {ACCENT}">{t(n)} \u2197</a>'
        f'<span style="font-size: 12.5px; color: {INK_SOFT}">{t(d)}</span></div>' for n, d, u in sources)
    left = (f'<div style="display: flex; flex-direction: column; gap: 4px; max-width: 760px">{label_caps("Sources", INK_SOFT)}'
            f'{src_html}</div>')
    left_h = 26 + 7 * 58
    v1 = view("evidence", crumb, "D", "Data and methods", "sources and scripts",
              "Each script writes the numbers its section quotes to a JSON file the page reads.", left, None, left_h, 0,
              ("USCIS denials, year by year", "DeepMoreB.dc.html"), ("AI use and how we checked it", "#ai-use"))

    l2, lh2 = left_col(
        ("p", "The numbers come from the public Department of Labor files through the scripts linked in Data and methods. Each script writes "
              "the numbers its section quotes to a JSON file the page reads. week04_schemas.py checks each file against the fields the page "
              "uses, week04_names_check.py tests the company-name rules against tax numbers, and the site tests fail when the numbers in a "
              "card or in this closing drift from its script’s output. We checked generated tables, comparisons, source scope, and the page "
              "behaviour against the local data before including a claim."),
    )
    v2 = view("ai-use", crumb, "AI", "AI use and how we checked it", "from the closing",
              "AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual "
              "presentation.", l2, None, lh2, 0, ("Data and methods", "#evidence"), ("Back to the closing", "Closing.dc.html"))
    op = deep_opener("Data and methods", "sources · scripts · checks", "The data and methods behind every number.", "evidence-top")
    return board("Week 4 · deep dive, data and methods", "DeepMethods.dc.html", "D", op, [v1, v2], open_room=40)


def all_boards():
    """[(file name, board title, html, height)] in reading order."""
    out = []
    for fname, title, fn in (
        ("Deep1.dc.html", "Deep dive · first round, section 1", deep1),
        ("Deep2.dc.html", "Deep dive · first round, section 2", deep2),
        ("Deep3a.dc.html", "Deep dive · first round, section 3", deep3a),
        ("Deep3b.dc.html", "Deep dive · section 3, law firms, weights, lottery", deep3b),
        ("DeepMoreA.dc.html", "Deep dive · more networks, 1 to 3", deep_more_a),
        ("DeepMoreB.dc.html", "Deep dive · more networks, 4 to 6", deep_more_b),
        ("DeepMethods.dc.html", "Deep dive · data and methods", deep_methods),
    ):
        html, h = fn()
        out.append((fname, title, html, h))
    return out
