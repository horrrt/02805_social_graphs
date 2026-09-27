"""Build the Week 4 redesign canvas. Every number comes from the page's own JSON."""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from kit import *  # noqa: F401,F403
import kit

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.abspath(os.path.join(HERE, "..", "boards"))
os.makedirs(OUT, exist_ok=True)

BLOB_2A = "/_blob/4a754a06a0967dc82458bc9a26519519"
BLOB_3C = "/_blob/df79a7e8d40c36aa4745a7ed892c1797"
BLOB_TODAY = "/_blob/6a95ec422ef672b3e629f58b5bfb767a"
DS_URL = "https://claude.ai/artifact/2DfxHtPMWbJSRnDk19Hxf8"
DS_VERSION = "1790425882-cfa5"
HEIGHTS = {"Main": 3500, "Section3": 3200, "Section4": 2600, "Closing": 1950, "ChartKit": 3400}


def load(rel):
    with open(os.path.join(REPO, rel)) as f:
        return json.load(f)


place = load("docs/assets/data/week04_place.json")
usa = load("docs/assets/data/usa.json")
ww = load("docs/weeks/week04/data/where_who.json")
fp = load("docs/weeks/week04/data/footprint.json")
fr = load("docs/weeks/week04/data/footprint_rank.json")
sm = load("docs/weeks/week04/data/staffing_moves.json")
scm = load("docs/weeks/week04/data/staffing_communities.json")
scl = load("docs/weeks/week04/data/staffing_clients.json")
bey = load("docs/weeks/week04/data/beyond.json")
jsp = load("docs/weeks/week04/data/jobs_split.json")
jobs = load("docs/weeks/week04/data/jobs.json")

F = sm["finding"]
# The three metro groups get hues of their own, so orange and blue keep one meaning (placed, direct) on the whole page.
# Map tints sit at one lightness on the navy hero (7:1 and up on deep); the darker pair marks the same groups on white.
GROUP_COLOR = {0: "#b69cff", 1: "#4fd1a5", 2: "#c3cfdd"}
GROUP_ON_LIGHT = {0: "#6d4fd6", 1: "#15896a", 2: "#7a8fac"}
GROUP_NAME = {c["id"]: c["label"] for c in place["communities"]}
GROUP_NOTE = {0: "seven large hubs", 1: "eight tech hubs", 2: "the other 25"}


# ================================================================ the hero map

def albers(lon, lat):
    p1, p2, p0, l0 = map(math.radians, (29.5, 45.5, 37.5, -96.0))
    n = (math.sin(p1) + math.sin(p2)) / 2
    c = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    r0 = math.sqrt(c - 2 * n * math.sin(p0)) / n
    ph, la = math.radians(lat), math.radians(lon)
    th = n * (la - l0)
    r = math.sqrt(c - 2 * n * math.sin(ph)) / n
    return r * math.sin(th), -(r0 - r * math.cos(th))


def dp(pts, eps):
    if len(pts) < 4:
        return pts
    if pts[0] == pts[-1]:
        # A closed ring has no chord to measure against and would collapse to two points: split it at its far side first.
        far = max(range(1, len(pts) - 1), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
        return dp(pts[: far + 1], eps)[:-1] + dp(pts[far:], eps)
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        dist = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
        if dist > best:
            best, idx = dist, i
    if best > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def hero_map(w=604, h=392, selected="35620"):
    skip = {"Alaska", "Hawaii", "Puerto Rico"}
    shapes = []
    for f in usa["features"]:
        if f["properties"]["name"] in skip:
            continue
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        shapes.append([[albers(lon, lat) for lon, lat in ring] for poly in polys for ring in poly])
    xs = [p[0] for s in shapes for r in s for p in r]
    ys = [p[1] for s in shapes for r in s for p in r]
    pl, pr, pv = 64, 8, 6  # room on the left for the Bay Area labels
    sc = min((w - pl - pr) / (max(xs) - min(xs)), (h - 2 * pv) / (max(ys) - min(ys)))
    ox = pl + ((w - pl - pr) - sc * (max(xs) - min(xs))) / 2 - sc * min(xs)
    oy = pv + ((h - 2 * pv) - sc * (max(ys) - min(ys))) / 2 - sc * min(ys)

    def P(lon, lat):
        x, y = albers(lon, lat)
        return ox + sc * x, oy + sc * y

    out = [svg_open(w, h, "Map of the 40 metro areas with the most certified H-1B filings in FY2025, "
                          "sized by filings and coloured by Louvain group, with the links the disparity filter keeps at alpha 0.2")]
    for s in shapes:
        d = []
        for ring in s:
            pts = [(ox + sc * x, oy + sc * y) for x, y in ring]
            pts = dp(pts, 0.7)
            if len(pts) < 4:
                continue
            d.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
        if d:
            out.append(path("".join(d), "rgba(255, 255, 255, 0.035)", "rgba(185, 205, 228, 0.20)", 0.6))

    cities = {c["id"]: c for c in place["cities"]}
    pos = {cid: P(c["lon"], c["lat"]) for cid, c in cities.items()}
    edges = place["backbone"]["graphs"]["0.2"]["edges"]
    wmax = max(e[2] for e in edges)
    for a_, b_, wt in sorted(edges, key=lambda e: e[2]):
        ga, gb = cities[a_]["community"], cities[b_]["community"]
        (x1, y1), (x2, y2) = pos[a_], pos[b_]
        sw = 0.5 + 2.4 * math.sqrt(wt / wmax)
        if ga == gb and ga != 2:
            out.append(line(x1, y1, x2, y2, GROUP_COLOR[ga], sw, op=0.34, cap="round"))
        else:
            out.append(line(x1, y1, x2, y2, HERO_LEDE, sw, op=0.13, cap="round"))

    fmax = max(c["filings"] for c in cities.values())

    def R(c):
        return 2.6 + 12.4 * math.sqrt(c["filings"] / fmax)

    for c in sorted(cities.values(), key=lambda c: -c["filings"]):
        x, y = pos[c["id"]]
        out.append(circle(x, y, R(c), GROUP_COLOR[c["community"]], DEEP, 1.4))
    sx, sy = pos[selected]
    out.append(circle(sx, sy, R(cities[selected]) + 5, "none", HERO_INK, 1.6))

    # label offsets in px from the dot's centre, as functions of its radius
    labels = {
        "35620": (lambda r: (-4, -(r + 9)), "end"),        # New York: above left, clear of Boston and the ring
        "19100": (lambda r: (r + 6, 4), "start"),          # Dallas
        "41940": (lambda r: (-(r + 5), 12), "end"),        # San Jose
        "41860": (lambda r: (-(r + 5), -4), "end"),        # San Francisco
        "42660": (lambda r: (r + 6, 4), "start"),          # Seattle
        "12060": (lambda r: (r + 6, 5), "start"),          # Atlanta
        "16980": (lambda r: (0, -(r + 7)), "middle"),      # Chicago
        "19820": (lambda r: (r + 5, -6), "start"),         # Detroit
        "38060": (lambda r: (r + 5, 4), "start"),          # Phoenix
    }
    for cid, (off, anchor) in labels.items():
        c = cities[cid]
        x, y = pos[cid]
        dx, dy = off(R(c))
        sel = cid == selected
        out.append(text(x + dx, y + dy, c["name"], 11 if sel else 10.5, HERO_INK if sel else HERO_LEDE, 700 if sel else 600, anchor, tabular=False))
    out.append("</svg>")
    return "\n".join(out), cities, pos


def inspector(cities, selected="35620"):
    c = cities[selected]
    who = {r["id"]: r for r in ww["rows"]}[selected]
    ranks = sorted(cities.values(), key=lambda x: -x["filings"])
    rank = [x["id"] for x in ranks].index(selected) + 1
    third = {"low": "lowest third", "mid": "middle third", "high": "top third"}
    rows = [
        ("Filings", num(c["filings"])),
        ("Companies", num(c["employers"])),
        ("Largest filer", f"{c['top_employer']}, {pct(c['top_share'])}"),
        ("Placed at a client", pct(who["placed_share"], 0)),
        ("Census region", c["census"]),
    ]
    dl = "\n".join(
        f'<div style="display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-top: 1px solid {LINE_SOFT}">'
        f'<dt style="font-size: 12px; color: {INK_SOFT}">{t(k)}</dt>'
        f'<dd style="margin: 0; font-size: 12px; font-weight: 700; color: {INK}; text-align: right; font-variant-numeric: tabular-nums">{t(v)}</dd></div>'
        for k, v in rows
    )
    edges = [e for e in place["backbone"]["graphs"]["0.2"]["edges"] if selected in (e[0], e[1])]
    edges.sort(key=lambda e: -e[2])
    links = "\n".join(
        f'<div style="display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 3px 0">'
        f'<span style="color: {INK}">{t(cities[e[1] if e[0] == selected else e[0]]["name"])}</span>'
        f'<span style="color: {INK_SOFT}; font-variant-numeric: tabular-nums">{num(e[2])}</span></div>'
        for e in edges[:3]
    )
    return (
        f'<aside aria-label="Selected metro" style="background: {CARD}; border-radius: 14px; box-shadow: {SHADOW}; padding: 16px 18px 14px; '
        'display: flex; flex-direction: column; gap: 10px">\n'
        + label_caps("Selected metro")
        + '\n<div style="display: flex; flex-direction: column; gap: 6px">'
        f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-size: 18px; font-weight: 700; color: {INK}">{t(c["name"])}</span>'
        f'<span style="font-size: 12px; color: {INK_MUTE}">{t(c["state"])} · FY2025</span></div>'
        f'<div><span style="display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 999px; '
        f'background: {GROUND}; border: 1px solid {LINE}; font-size: 11.5px; font-weight: 600; color: {INK}">'
        f'<span style="width: 9px; height: 9px; border-radius: 999px; background: {GROUP_ON_LIGHT[c["community"]]}"></span>'
        f'{t(GROUP_NAME[c["community"]])} group</span></div></div>\n'
        f'<dl style="margin: 0">\n{dl}\n</dl>\n'
        f'<div style="display: flex; flex-direction: column; gap: 2px; border-top: 1px solid {LINE_SOFT}; padding-top: 8px">'
        + label_caps("Strongest links", INK_MUTE, 10.5)
        + f"\n{links}\n</div>\n</aside>"
    )


# ================================================================ Main: top of the page

def board_main():
    map_svg, cities, pos = hero_map()
    counts = {g: sum(1 for c in cities.values() if c["community"] == g) for g in (0, 1, 2)}
    legend = "\n".join(
        f'<div style="display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: {HERO_LEDE}">'
        f'<span style="flex: none; width: 11px; height: 11px; border-radius: 999px; background: {GROUP_COLOR[g]}"></span>'
        f'<span><b style="color: {HERO_INK}; font-weight: 600">{t(GROUP_NAME[g])}</b> · {t(GROUP_NOTE[g])}</span></div>'
        for g in (0, 1, 2)
    )
    assert counts == {0: 7, 1: 8, 2: 25}, counts
    left = (
        '<div style="display: flex; flex-direction: column; gap: 18px">\n'
        f'<p style="margin: 0; font-size: 14px; line-height: 1.6; color: {HERO_BODY}; text-wrap: pretty">'
        "Where the hiring is, which occupations travel together, which firms staff the seats, what changes without "
        "the biggest firms, and what the filings show beyond the networks, all from the same Department of Labor disclosures.</p>\n"
        f'<p style="margin: 0; border-left: 3px solid {HERO_EYEBROW}; padding: 2px 0 2px 12px; font-size: 14px; font-style: italic; '
        f'font-weight: 600; color: {HERO_CAUTION}">A shared employer is not a shared labour market.</p>\n'
        '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px">\n'
        + label_caps("The map · three Louvain groups", HERO_LABEL, 10.5, "0.12em")
        + "\n" + legend + "\n"
        f'<div style="display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: {HERO_LEDE}">'
        f'<span style="flex: none; width: 11px; height: 2px; background: {HERO_LEDE}"></span>'
        "<span>Lines: the links the disparity filter keeps at α = 0.2</span></div>\n"
        "</div>\n"
        f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; border-top: 1px solid rgba(255, 255, 255, 0.10); padding-top: 16px">'
        + stat_tile("537,796", "certified H-1B filings, FY2025", True)
        + stat_tile("40", "metro areas with the most filings, 84.5% of the year’s total", True)
        + "</div>\n</div>"
    )
    stage = (
        '<div style="display: flex; flex-direction: column; align-items: center; gap: 10px">\n'
        + map_svg
        + f'\n<span style="padding: 6px 12px; border-radius: 999px; background: {STAGE_HINT}; border: 1px solid rgba(255, 255, 255, 0.12); '
        f'font-size: 12px; color: {STAGE_HINT_INK}">Hover a metro to inspect it. Click to pin it.</span>\n</div>'
    )
    hero = (
        f'<section id="top-hero" style="flex: none; background: {HERO_BG}; border-radius: 0 0 14px 14px; padding: 38px 64px 40px; '
        'display: flex; flex-direction: column; gap: 10px">\n'
        f'<p style="margin: 0; font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: {HERO_EYEBROW}">'
        "Week 4 · Communities &amp; backbones</p>\n"
        f'<h1 style="margin: 0; font-size: 56px; line-height: 0.98; font-weight: 700; letter-spacing: -0.03em; color: {HERO_INK}">'
        "Who hires America’s foreign workers?</h1>\n"
        '<div style="display: grid; grid-template-columns: 372px 604px 268px; gap: 28px; margin-top: 20px; align-items: start">\n'
        + left + "\n" + stage + "\n" + inspector(cities) + "\n</div>\n</section>"
    )

    # ---- five findings
    q = place["null_model"]
    jn = jobs["quality"]["null"]
    jm = jobs["quality"]["louvain"]["modularity_mean"]
    met = {v["id"]: v for v in fp["metros"]["variants"]}
    b3 = bey["q3"]
    minis = {
        "1": mini_strip(300, (0, 0.06), q["Q"], f"{q['Q']:.3f}", (q["Q_null_mean"], q["Q_null_std"]),
                        f"rewired {q['Q_null_mean']:.3f}", aria="Modularity of the metro network against rewired networks"),
        "2": mini_strip(300, (0, 0.35), jm, f"{jm:.2f}", (jn["null"], jn["null_sd"]), f"rewired {jn['null']:.2f}",
                        aria="Modularity of the occupation network against rewired networks"),
        "3": mini_strip(300, (0, 0.3), F["q1_pooled_observed_share"], pct(F["q1_pooled_observed_share"]),
                        (F["q1_pooled_null_mean"], F["q1_pooled_null_sd"]), f"random vendor {pct(F['q1_pooled_null_mean'])}",
                        aria="Share of vendor switches that stay inside the client's group"),
        "4": mini_strip(300, (-0.03, 0.2), met["drop_top10_filings"]["ami_region"], f"{met['drop_top10_filings']['ami_region']:.2f}",
                        (met["control_top10_filings"]["ami_region"], met["control_top10_filings"]["ami_region_sd"]),
                        "random cuts", ref=met["full"]["ami_region"], ref_label=None,
                        aria="Match with Census regions without the ten largest filers"),
        "5": mini_strip(300, (0, 6), b3["mantel_haenszel_odds_ratio"], f"{b3['mantel_haenszel_odds_ratio']:.1f}×",
                        ref=1, ref_label="1 = same odds", ci=tuple(b3["odds_ratio_cluster_ci95"]),
                        aria="Odds of a low wage level, placed against direct filings"),
    }
    notes = {
        "1": f"Modularity against rewired networks · z = {q['z']:.0f}",
        "2": f"Modularity against rewired networks · z = {jn['z']:.0f}",
        "3": f"Vendor switches that stay in the group · z = {F['q1_pooled_z']:.0f}",
        "4": f"Match with Census regions without the ten largest filers · dashed: all firms, {met['full']['ami_region']:.2f}",
        "5": "Odds of wage level I or II, placed against direct, same job · 95% interval",
    }
    findings = [
        ("1", "Where the hiring is", "#place",
         "Cities group by who hires there, not by region, and no single link holds the map together."),
        ("2", "Which jobs go together", "#jobs",
         "Employers reveal bundles of work. Outsourcing firms bundle jobs differently from direct employers of the same size."),
        ("3", "Who staffs whom", "Section3.dc.html",
         "One certified H-1B filing in five names a client company as the worksite. Yet a client that changes vendor "
         "stays inside its group far more often than chance."),
        ("4", "Without the biggest firms", "Section4.dc.html",
         "Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; "
         "the job clusters shift but hold."),
        ("5", "Beyond the three networks", "#beyond",
         "The section 3 groups barely show in lawyers or green cards; the outsourcing firms stand out in the wage levels they file."),
    ]
    frows = []
    for i, (n, title, href, sentence) in enumerate(findings):
        border = f"border-top: 1px solid {LINE_SOFT};" if i else ""
        frows.append(
            f'<div style="display: grid; grid-template-columns: 36px minmax(0, 1fr) 300px 96px; gap: 24px; align-items: center; padding: 16px 0; {border}">\n'
            f'<span style="width: 30px; height: 30px; border-radius: 8px; background: {ACCESS_SOFT}; color: {ACCENT}; font-size: 13px; '
            f'font-weight: 800; display: flex; align-items: center; justify-content: center">{n}</span>\n'
            '<div style="display: flex; flex-direction: column; gap: 4px">'
            f'<span style="font-size: 15px; font-weight: 700; color: {INK}">{t(title)}</span>'
            f'<span style="font-size: 13.5px; line-height: 1.55; color: {INK_SOFT}; text-wrap: pretty">{t(sentence)}</span></div>\n'
            '<div style="display: flex; flex-direction: column; gap: 2px">'
            + minis[n]
            + f'<span style="font-size: 11px; line-height: 1.35; color: {INK_MUTE}">{t(notes[n])}</span></div>\n'
            f'<a href="{href}" style="justify-self: end; font-size: 13px; font-weight: 600; text-decoration: none; color: {ACCENT}">Section {n} →</a>\n'
            "</div>"
        )
    key = (
        f'<div style="display: flex; align-items: center; gap: 18px; font-size: 12px; color: {INK_SOFT}">'
        f'<span style="display: flex; align-items: center; gap: 7px"><span style="width: 11px; height: 11px; border-radius: 999px; background: {INK}"></span>the real network</span>'
        f'<span style="display: flex; align-items: center; gap: 7px"><span style="width: 26px; height: 10px; border-radius: 6px; background: {BAND}"></span>random baseline, mean ± 1 sd</span>'
        "</div>"
    )
    findings_card = (
        f'<section aria-label="Five findings" style="width: {SHELL}px; align-self: center; margin-top: 32px; background: {CARD}; border: 1px solid {LINE}; '
        f'border-radius: 14px; box-shadow: {SHADOW}; padding: 22px 28px 10px; box-sizing: border-box; display: flex; flex-direction: column">\n'
        '<div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px">'
        + label_caps("Five sections, five findings", INK_SOFT)
        + key + "</div>\n" + "\n".join(frows) + "\n</section>"
    )

    # ---- opening
    fields = [
        ("Employer", "The company asking to hire", "Links all three networks", "access"),
        ("Worksite", "A city, grouped into its metro area", "1 · Where", "plain"),
        ("Occupation", "The job, as an official occupation code", "2 · Jobs", "plain"),
        ("Client", "The company the worker is placed at, when it is not the employer", "3 · Staffing", "plain"),
        ("Wage level", "I (entry) to IV (fully competent)", "5 · Beyond", "plain"),
        ("Law firm", "Who prepared the filing", "5 · Beyond", "plain"),
    ]
    frow = "\n".join(
        f'<div style="display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 9px 0; '
        f'{"border-top: 1px solid " + LINE_SOFT + ";" if i else ""}">'
        f'<span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: {INK_SOFT}">{t(k)}</span>'
        f'<span style="font-size: 13px; line-height: 1.4; color: {INK}">{t(v)}</span>{chip(s, tone)}</div>'
        for i, (k, v, s, tone) in enumerate(fields)
    )
    anatomy = (
        f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 16px 8px; display: flex; flex-direction: column; gap: 4px">'
        f'<span style="font-size: 13.5px; font-weight: 700; color: {INK}">What one filing names</span>'
        f'<span style="font-size: 11.5px; color: {INK_SOFT}; padding-bottom: 6px">Each section builds its network from one of these fields.</span>'
        + frow + "</div>"
    )
    keys = [
        (f'<span style="width: 12px; height: 12px; border-radius: 999px; background: {INK}"></span>', "The real network", "What the filings show."),
        (f'<span style="width: 28px; height: 11px; border-radius: 6px; background: {BAND}; display: flex; justify-content: center">'
         f'<span style="width: 2px; height: 11px; background: {INK_MUTE}"></span></span>',
         "Random baseline", "Mean and one standard deviation over rewired networks or random draws."),
        (f'<span style="width: 12px; height: 12px; border-radius: 3px; background: {PEOPLE}"></span>', "Placed at a client", "Filings that put the worker at another company."),
        (f'<span style="width: 12px; height: 12px; border-radius: 3px; background: {ACCESS}"></span>', "Direct employer", "Filings for the employer’s own site."),
        (f'<span style="width: 22px; height: 0; border-top: 2px dashed {INK_SOFT}"></span>', "Reference", "The full network, or equal odds."),
        ('<span style="display: flex; gap: 3px">'
         + "".join(f'<span style="width: 8px; height: 8px; border-radius: 999px; background: {GROUP_ON_LIGHT[g_]}"></span>' for g_ in (0, 1, 2))
         + "</span>", "Metro groups", "Violet, green and slate mark the three Louvain groups, on maps only."),
    ]
    keyrows = "\n".join(
        f'<div style="display: grid; grid-template-columns: 30px 128px minmax(0, 1fr); gap: 10px; align-items: center; font-size: 12px">'
        f'<span style="display: flex; justify-content: center">{sw}</span><b style="color: {INK}; font-weight: 700">{t(k)}</b>'
        f'<span style="color: {INK_SOFT}">{t(v)}</span></div>'
        for sw, k, v in keys
    )
    howto = (
        f'<div style="border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px">'
        f'<span style="font-size: 13.5px; font-weight: 700; color: {INK}">How to read the charts</span>{keyrows}</div>'
    )
    opening_left = "\n".join([
        para("It names the job, the worksite, the wage, and the company asking for permission to employ them. The Department of "
             "Labor records the filing even when the worker never arrives, changes employer, or is ultimately not hired."),
        para(f'<b style="color: {INK}">Why start with companies?</b> A job title tells us what work is requested; a company tells us '
             "which jobs, places, and clients are connected by the same hiring system. That makes the employer the thread linking "
             "the three networks in this story. The network is about shared filings, not friendships between workers or companies."),
        notice("Read the scope carefully.", "These are visa-sponsored filings, not all hiring in America. They leave out workers without "
               "H-1B sponsorship, employers that never file, rejected or withdrawn applications, and the wider conditions that shape "
               "who gets hired.", "!"),
        f'<p style="margin: 0; padding-top: 12px; border-top: 1px solid {LINE_SOFT}; font-size: 14px; line-height: 1.5; font-weight: 600; color: {INK}">'
        "Unless stated otherwise, the figures below use certified H-1B filings in FY2025. One filing is a request, not a guaranteed job.</p>",
    ])
    opening = (
        opener("0", "Opening", "what the filings show",
               "An H-1B filing is an employer’s request to hire a non-US worker in a specialty occupation.", "opening")
        + "\n"
        + card(two_col(opening_left, anatomy + "\n" + howto, 540, 40))
    )

    # ---- section 1
    link_svg = [svg_open(250, 150, "Example of how two metros are linked")]
    link_svg.append(line(125, 34, 52, 112, INK_SOFT, 2.4, cap="round"))
    link_svg.append(line(125, 34, 198, 112, INK_SOFT, 1.4, cap="round"))
    link_svg.append(path("M52 112 Q125 150 198 112", "none", INK, 2.2, dash="5 4"))
    link_svg.append(rect(100, 16, 50, 26, INK, 6))
    link_svg.append(text(125, 33, "Company", 10.5, "#ffffff", 700, "middle", tabular=False))
    link_svg.append(circle(52, 112, 13, CARD, INK, 2))
    link_svg.append(circle(198, 112, 13, CARD, INK, 2))
    link_svg.append(text(52, 116, "A", 11, INK, 800, "middle"))
    link_svg.append(text(198, 116, "B", 11, INK, 800, "middle"))
    link_svg.append(text(70, 66, "12 filings", 11, INK_SOFT, 600, "end"))
    link_svg.append(text(180, 66, "5 filings", 11, INK_SOFT, 600, "start"))
    link_svg.append(text(125, 146, "link A–B gains 5", 11, INK, 700, "middle"))
    link_svg.append("</svg>")
    how_link = (
        f'<div style="display: flex; gap: 16px; align-items: center; background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 12px 14px">'
        + "\n".join(link_svg)
        + f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; font-weight: 700; color: {INK}">How two metros get linked</span>'
        f'<span style="font-size: 12px; line-height: 1.5; color: {INK_SOFT}">An example, not data. A company that files in both metros adds the smaller of its two '
        "filing counts to their link.</span></div></div>"
    )
    mod_svg, _ = strip_chart(
        [dict(label="Modularity", sub="40 metros, 3 groups", real=q["Q"], real_label=f"{q['Q']:.3f}",
              base=(q["Q_null_mean"], q["Q_null_std"]), base_label=f"rewired {q['Q_null_mean']:.3f} ± {q['Q_null_std']:.3f}",
              badge=f"z = {q['z']:.0f}")],
        (0, 0.06), 556, [0, 0.02, 0.04, 0.06], lambda v: f"{v:.2f}", label_w=132, badge_w=66,
        aria="Modularity of the metro groups against rewired networks")
    s1_right = figure("Weak but real", "The groups against 100 rewired networks in which each company keeps its number of metros.", mod_svg)
    s1_open = (
        opener("1", "Where the hiring is", "companies × cities · FY2025",
               "Cities group by who hires there, not by region, and no single link holds the map together.", "place")
        + "\n"
        + two_col(
            para("The cities are the 40 metro areas with the most filings, 84.5% of the year’s total. Louvain splits the 40 metros "
                 "into three groups: seven large hubs led by New York and Dallas, eight tech hubs led by San Jose and San Francisco, "
                 "and the other 25. The split is weak but real: " + gloss("modularity") + " 0.049 against 0.013 for "
                 + gloss("rewired networks", "rewired") + " in which each company keeps its number of metros (" + gloss("z")
                 + " = 29). The two questions below ask what the groups follow and where the network comes apart.")
            + "\n" + how_link + "\n"
            + reveal_row(reveal("How a link is weighed", "How a link is weighed",
                                "Two metros are linked when the same company files in both; the link weighs, summed over those "
                                "companies, the smaller of the company’s two filing counts.")),
            s1_right, 540, 40)
    )
    sc1 = ww["finding"]["q1_scores"]
    lab = [("naics54_share_tercile", "IT-services share", "thirds · who hires"),
           ("placed_share_tercile", "Placed share", "thirds · who hires"),
           ("census_division", "Census division", "where the city is"),
           ("census_region", "Census region", "where the city is")]
    rows1a = []
    for i, (key_, name, sub) in enumerate(lab):
        s = sc1[key_]
        rows1a.append(dict(label=name, sub=sub, real=s["ami"], hollow=s["p_shuffle"] >= 0.05,
                           real_label=f"{s['ami']:.2f}", badge=f"p = {s['p_shuffle']:.3f}", divider=(i == 2)))
    svg1a, _ = strip_chart(rows1a, (0, 0.2), 556, [0, 0.05, 0.1, 0.15, 0.2], lambda v: f"{v:.2f}", label_w=150, badge_w=84,
                           zero_line=0, axis_title="AMI with the Louvain groups · 0 = labels dealt at random",
                           aria="Adjusted mutual information between the metro groups and four labellings")
    q1a = card(
        q_header("1A", "Do cities group by who hires there instead of by region?", "communities vs four labellings",
                 "By who hires. The groups follow how much of a city’s hiring runs through consulting and IT-services firms better than they follow Census regions.",
                 "AMI 0.17 vs 0.06")
        + "\n"
        + two_col(
            para("Each dot is the adjusted mutual information (AMI) between the Louvain groups and one labelling: 0 means no better "
                 "than labels dealt at random, 1 means the same grouping.")
            + "\n"
            + notice("What to notice.", "The IT-services share matches the groups at AMI 0.17 (p = 0.002) and the placed share at 0.12 "
                     "(p = 0.012). Census regions reach 0.06 (p = 0.11) and divisions 0.06 (p = 0.08), no better than chance. The match "
                     "is modest: most of what makes two metros alike stays unexplained.")
            + "\n"
            + reveal_row(
                reveal("How we tested it", "How we tested it",
                       "We gave each metro four labels: its Census region, its Census division, the third it falls in by the share of "
                       "its filings that place a worker at a client, and the third it falls in by the share filed by professional and "
                       "technical services firms (NAICS 54, the sector of IT consultancies). Thirds, because 35 of the 40 metros have "
                       "that sector as their largest, so “largest sector” says almost nothing. AMI corrects for the number of labels, "
                       "so four regions and three thirds compare fairly.", open_=True),
                reveal("More numbers", "More numbers",
                       "Seven of the eight tech-hub metros sit in the lowest third by placed share: there, companies mostly hire for "
                       "themselves. In the New York–Dallas group the median metro places 27% of its filings at a client and files 60% "
                       "through IT-services firms.", icon="plus")),
            figure("How well each labelling matches the Louvain groups",
                   "AMI for each labelling of the 40 metros; p is the share of 1,000 shuffles of that labelling that match at least as well. "
                   "Filled dots beat the shuffles, hollow dots do not.", svg1a),
            540, 40),
        anchor="place-who",
    )

    content = "\n".join([opening, s1_open, q1a])
    body = "\n".join([topbar("Opening"), hero, findings_card, body_row(rail("0"), content, 30)])
    return page("Week 4 · top of the page", W, HEIGHTS["Main"], body)


# ================================================================ Section 3

def board_section3():
    wo = scm["modularity"]["wiring_only"]
    iv = scm["industry_or_vendor"]["unweighted"]
    shown = {c["name"]: c for c in scl["years"]["2025"]["shown"]}
    boa = shown["Bank of America"]
    firms = scl["firms"]
    vend = [(firms[i], n) for i, n in boa["top"]]
    rest_n = boa["rest"]
    rest_firms = boa["vendors"] - len(vend)

    # ego diagram: vendors on the left, the client on the right
    ew, eh = 560, 250
    out = [svg_open(ew, eh, f"Bank of America and the {boa['vendors']} firms that place H-1B workers there in FY2025")]
    rows = vend + [(f"{rest_firms} other firms", rest_n)]
    top, gap_ = 14, (eh - 28) / (len(rows) - 1)
    cx, cy = ew - 70, eh / 2
    vmax = max(n for _, n in rows)
    for i, (name, n) in enumerate(rows):
        y = top + i * gap_
        other = i == len(rows) - 1
        sw = 1 + 11 * (n / vmax)
        x_end = 212
        out.append(path(f"M{x_end} {y:.1f} C{x_end + 120} {y:.1f} {cx - 120} {cy:.1f} {cx - 30} {cy:.1f}", "none",
                        PEOPLE, sw, op=0.3 if other else 0.62))
        out.append(text(0, y + 4, name, 12, INK_SOFT if other else INK, 400 if other else 600, "start", tabular=False))
        out.append(text(x_end - 8, y + 4, num(n), 12, INK_SOFT, 600, "end"))
    out.append(circle(cx, cy, 30, INK))
    out.append(text(cx, cy - 2, "Bank of", 10.5, "#ffffff", 700, "middle", tabular=False))
    out.append(text(cx, cy + 11, "America", 10.5, "#ffffff", 700, "middle", tabular=False))
    out.append(text(cx, cy + 50, f"{num(boa['filings'])} filings", 11.5, INK, 700, "middle"))
    out.append("</svg>")
    ego = figure("One client and the firms that staff it",
                 f"Bank of America, FY2025: {num(boa['filings'])} filings placed by {boa['vendors']} firms. Each link is one firm → client "
                 "pair; its width counts the filings between them.", "\n".join(out))

    mod_svg, _ = strip_chart(
        [dict(label="Modularity", sub="each link counted once", real=wo["real"], real_label=f"{wo['real']:.2f}",
              base=(wo["null"], wo["null_sd"]), base_label=f"rewired {wo['null']:.2f}", badge=f"z = {wo['z']:.0f}"),
         dict(label="Matches main vendor", sub="AMI, clients with 2+ vendors", real=iv["ami_community_main_vendor_same_clients"],
              real_label=f"{iv['ami_community_main_vendor_same_clients']:.2f}", divider=True),
         dict(label="Matches industry", sub="AMI, same clients", real=iv["ami_community_industry"],
              real_label=f"{iv['ami_community_industry']:.2f}")],
        (0, 0.8), 560, [0, 0.2, 0.4, 0.6, 0.8], lambda v: f"{v:.1f}", label_w=170, badge_w=62,
        aria="Modularity against rewired networks, and how well the groups match vendor and industry")
    readout = figure("Weak groups, beyond chance",
                     "Modularity against rewired networks in which every firm and client keeps its number of partners; "
                     "AMI of the groups with each client’s main vendor and with its industry (0 = random labels).", mod_svg)

    tiles = (
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 14px 0 2px; '
        f'border-top: 1px solid {LINE}">'
        + stat_tile("21,759", "firms and clients in the largest connected piece")
        + stat_tile("41,212", "firm → client links, weighted by filings")
        + stat_tile("1 in 5", "certified H-1B filings names a client company")
        + "</div>"
    )
    head = (
        opener("3", "Who staffs whom", "firm → client · FY2025",
               "One certified H-1B filing in five names a client company as the worksite. Held to a random baseline, clients group only "
               "weakly, and slightly more by the firm that staffs them than by industry. Yet a client that changes vendor stays inside its "
               "group far more often than chance.", "who")
        + "\n"
        + two_col(
            para("Here the network links an outsourcing firm to each client company where it places workers, and a link weighs the "
                 "filings between them. The three questions below ask whether the groups behave like markets.")
            + "\n"
            + reveal_row(reveal("How the network is built", "How the network is built",
                                "Louvain runs on the largest connected piece: 21,759 firms and clients, 41,212 links. Counted once per "
                                "link, the groups beat rewired networks in which every firm and client keeps its number of partners "
                                "(modularity 0.57 against 0.53), and they match each client’s main vendor (AMI 0.11) a little better "
                                "than its industry (0.07)."))
            + "\n" + tiles + "\n" + readout,
            ego, 540, 40)
    )

    # ---- 3A
    rows = []
    for p in sm["q1_pairs"]:
        rows.append(dict(label=f"FY{p['from']} → FY{p['to']}", sub=f"{p['switches_scored']} switches",
                         real=p["observed_share_same_community"], real_label=pct(p["observed_share_same_community"]),
                         base=(p["null"]["mean"], p["null"]["sd"]), base_label=f"random {pct(p['null']['mean'])}",
                         badge=f"z = {p['null']['z']:.0f}"))
    nsw = sum(p["switches_scored"] for p in sm["q1_pairs"])
    rows.append(dict(label="Pooled", sub=f"{num(nsw)} switches", bold=True, real=F["q1_pooled_observed_share"],
                     real_label=pct(F["q1_pooled_observed_share"]), base=(F["q1_pooled_null_mean"], F["q1_pooled_null_sd"]),
                     base_label=f"random {pct(F['q1_pooled_null_mean'])} ± {pct(F['q1_pooled_null_sd'])}",
                     badge=f"z = {F['q1_pooled_z']:.0f}"))
    rows.append(dict(label="Stricter baseline", sub="firms already at the client", divider=True,
                     real=F["q1_pooled_stricter_observed_share"], real_label=pct(F["q1_pooled_stricter_observed_share"]),
                     base=(F["q1_pooled_stricter_null_mean"], F["q1_pooled_stricter_null_sd"]),
                     base_label=f"{pct(F['q1_pooled_stricter_null_mean'])} ± {pct(F['q1_pooled_stricter_null_sd'])}",
                     badge=f"z = {F['q1_pooled_stricter_z']:.0f}"))
    svg3a, _ = strip_chart(rows, (0, 0.32), 556, [0, 0.1, 0.2, 0.3], lambda v: f"{v * 100:.0f}%", label_w=152, badge_w=66,
                           aria="Share of vendor switches that stay inside the client's group, real against random")
    q3a = card(
        q_header("3A", "When a client changes its main vendor, does it stay in its group?", "FY2022 to FY2025",
                 "Yes, nearly eight times as often as for a random vendor: one switch in four stays inside the client’s group.",
                 f"{pct(F['q1_pooled_observed_share'])} vs {pct(F['q1_pooled_null_mean'])}")
        + "\n"
        + two_col(
            para("We followed the clients with five or more filings in two consecutive years and found 1,261 switches of main vendor "
                 "between FY2022 and FY2025. For each, we asked whether the new vendor sat in the client’s Louvain group of the earlier year.")
            + "\n"
            + notice("What to notice.", "Pooled over the three pairs of years, 26.5% of switches stay in the group against 3.2% ± 0.5% for "
                     "random vendors (z = 47). Much of that is familiarity: 62% of new main vendors already placed someone at the client the "
                     "year before. The groups hold some information about where a client turns next beyond the vendors it already knows.")
            + "\n"
            + reveal_row(
                reveal("How we tested it", "How we tested it",
                       "A client’s main vendor is the firm that files most placements there in a year. The baseline draws a new vendor at "
                       "random, a large firm as often as its filings make it likely."),
                reveal("The stricter baseline", "The stricter baseline",
                       "A stricter baseline that draws only among the firms already at the client narrows the gap to 26.8% against "
                       "20.8% ± 0.7% (z = 9), a lift of 1.29 rather than 8.3.", icon="plus")),
            figure("Switches that stay inside the client’s group",
                   "Share of switches whose new main vendor is in the client’s group of the earlier year. Dots are the real switches; grey "
                   "bands the baseline’s mean and one standard deviation over 1,000 draws.", svg3a),
            540, 40),
        anchor="who-switch",
    )

    # ---- 3B
    svg3b, _ = strip_chart([
        dict(label="Two weighted runs", sub="ten pairs of seeds",
             brange=(F["q2_noise_floor_weighted_min"], F["q2_noise_floor_weighted_max"], F["q2_noise_floor_weighted"]),
             base_label=f"median {pct(F['q2_noise_floor_weighted'])}"),
        dict(label="Two unweighted runs", sub="ten pairs of seeds",
             brange=(F["q2_noise_floor_unweighted_min"], F["q2_noise_floor_unweighted_max"], F["q2_noise_floor_unweighted"]),
             base_label=f"median {pct(F['q2_noise_floor_unweighted'])}"),
        dict(label="Weighted vs unweighted", sub="the comparison", bold=True, real=F["q2_share_move"],
             real_label=pct(F["q2_share_move"]), divider=True),
    ], (0, 0.7), 556, [0, 0.2, 0.4, 0.6], lambda v: f"{v * 100:.0f}%", label_w=160, badge_w=20,
        aria="Share of clients that change group: two noise floors and the weighted against unweighted comparison")
    svg3b2, _ = strip_chart([
        dict(label="Movers", sub="share with 2+ vendors", real=F["q2_movers_2plus_vendor_share"],
             real_label=pct(F["q2_movers_2plus_vendor_share"]),
             rref=(F["q2_all_clients_2plus_vendor_share"], f"all clients {pct(F['q2_all_clients_2plus_vendor_share'])}")),
    ], (0, 0.5), 556, [0, 0.1, 0.2, 0.3, 0.4, 0.5], lambda v: f"{v * 100:.0f}%", label_w=160, badge_w=20,
        aria="Share of movers with two or more vendors, against all clients")
    movers = sm["q2_top_movers"][:8]
    mtable = (
        f'<table style="width: 100%; border-collapse: collapse; font-size: 12.5px; font-variant-numeric: tabular-nums">'
        f'<thead><tr style="color: {INK_MUTE}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em">'
        '<th style="text-align: left; padding: 6px 8px 6px 0; font-weight: 700">Client</th>'
        '<th style="text-align: right; padding: 6px 8px; font-weight: 700">Filings</th>'
        '<th style="text-align: right; padding: 6px 8px; font-weight: 700">Vendors</th>'
        '<th style="text-align: left; padding: 6px 8px; font-weight: 700">Group, weighted</th>'
        '<th style="text-align: left; padding: 6px 0 6px 8px; font-weight: 700">Group, unweighted</th></tr></thead><tbody>'
        + "".join(
            f'<tr style="border-top: 1px solid {LINE_SOFT}"><td style="padding: 6px 8px 6px 0; color: {INK}; font-weight: 600">{t(m["client"])}</td>'
            f'<td style="padding: 6px 8px; text-align: right; color: {INK}">{num(m["filings"])}</td>'
            f'<td style="padding: 6px 8px; text-align: right; color: {INK}">{num(m["vendors"])}</td>'
            f'<td style="padding: 6px 8px; color: {INK_SOFT}">{t(m["weighted_community_top_firm"])}</td>'
            f'<td style="padding: 6px 0 6px 8px; color: {INK_SOFT}">{t(m["unweighted_community_top_firm"])}</td></tr>'
            for m in movers)
        + "</tbody></table>"
        + f'<p style="margin: 8px 0 0; font-size: 11.5px; color: {INK_MUTE}">A group is named after its largest firm. First 8 of 15.</p>'
    )
    q3b = card(
        q_header("3B", "Which clients change group when filing counts are ignored?", "weighted vs unweighted",
                 "Two in three, but much of that is Louvain’s own noise, and the movers are not mainly the clients with several vendors.",
                 f"{pct(F['q2_share_move'])} move")
        + "\n"
        + two_col(
            para("We ran Louvain with links weighted by filings and with every link counting one, matched each weighted group to the "
                 "unweighted group it overlaps most, and called a client a mover when its matched group changed. Two runs of the same kind "
                 "with different seeds set the noise floor.")
            + "\n"
            + notice("What to notice.", "64.4% of clients move between the weighted and unweighted partitions. Two runs of the same kind move "
                     "fewer: a median 33.3% between two weighted seeds and 53.1% between two unweighted ones, over ten pairs of seeds each "
                     "(ranges 26.8% to 39.3% and 49.4% to 55.9%).")
            + "\n"
            + reveal_row(reveal("More numbers", "More numbers",
                                "We expected the movers to be clients with several vendors, since only their filing counts can pull them one "
                                "way or another. They are, but barely: 31.8% of movers have two or more vendors, against 26.8% of all clients. "
                                "The largest movers are the largest clients: Citigroup sits with Tata Consultancy Services when filings count "
                                "and with EY when they do not; Bank of America moves from Infosys’ group to IBM’s.", icon="plus"))
            + "\n" + disclosure("The 15 largest movers", mtable),
            figure("Share of clients that change group",
                   "Grey bands span ten pairs of seeds of the same kind, median marked: the noise floor. The dot compares the weighted partition "
                   "with the unweighted one. All three use the same matching of groups.", svg3b)
            + "\n"
            + figure("Are the movers the clients with several vendors?",
                     "Share of movers with two or more vendors; the dashed mark is the share among all clients.", svg3b2),
            540, 40),
        anchor="who-movers",
    )

    # ---- 3C
    svg3c, _ = strip_chart([
        dict(label="Split clients", sub="second group ≥ 20% of filings", bold=True, real=F["q3_two_community_clients"],
             real_label=num(F["q3_two_community_clients"]), base=(F["q3_null_mean"], F["q3_null_sd"]),
             base_label=f"rewired {num(F['q3_null_mean'])} ± {num(F['q3_null_sd'])}", badge=f"z = {sgn(F['q3_z'], 0)}"),
    ], (1600, 2300), 556, [1600, 1800, 2000, 2200], lambda v: num(v), label_w=160, badge_w=70,
        aria="Clients split between two groups, real against 100 rewired networks")
    top = sm["q3_top_clients"][:7]
    bars = []
    for c in top:
        s1, s2 = c["shares"]
        bars.append(
            f'<tr style="border-top: 1px solid {LINE_SOFT}">'
            f'<td style="padding: 7px 8px 7px 0; color: {INK}; font-weight: 600; white-space: nowrap">{t(c["client"])}</td>'
            f'<td style="padding: 7px 8px; text-align: right; color: {INK}">{num(c["filings"])}</td>'
            '<td style="padding: 7px 8px; width: 210px">'
            f'<div style="display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: {LINE_SOFT}">'
            f'<span style="width: {s1 * 100:.1f}%; background: {INK}"></span><span style="width: {s2 * 100:.1f}%; background: {INK_MUTE}"></span></div>'
            f'<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 3px; font-size: 11px; color: {INK_SOFT}">'
            f'<span>{t(c["communities"][0])} {pct(s1, 0)}</span><span>{t(c["communities"][1])} {pct(s2, 0)}</span></div></td></tr>'
        )
    split_table = (
        f'<table style="width: 100%; border-collapse: collapse; font-size: 12.5px; font-variant-numeric: tabular-nums">'
        f'<thead><tr style="color: {INK_MUTE}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em">'
        '<th style="text-align: left; padding: 6px 8px 6px 0; font-weight: 700">Client</th>'
        '<th style="text-align: right; padding: 6px 8px; font-weight: 700">Filings</th>'
        '<th style="text-align: left; padding: 6px 8px; font-weight: 700">First and second group, share of filings</th></tr></thead><tbody>'
        + "".join(bars) + "</tbody></table>"
    )
    stell = next(c for c in sm["q3_top_clients"] if c["client"] == "Stellantis")
    usaa = next(c for c in sm["q3_top_clients"] if c["client"] == "USAA")
    q3c = card(
        q_header("3C", "Which clients sit in two groups at once?", "split loyalties",
                 "1,823 clients get a fifth or more of their filings from a second group, fewer than in rewired networks that keep each "
                 "client’s filing counts.", f"z = {sgn(F['q3_z'], 0)}")
        + "\n"
        + two_col(
            para("A Louvain partition gives each client one group, but a client with several vendors can draw on firms from different "
                 "groups.")
            + "\n"
            + notice("What to notice.", "The rewired networks give 2,154 ± 20 split clients (z = −16), so real clients draw on fewer "
                     "groups than the same filing counts spread at random would. Read the count as the groups following clients’ main "
                     "suppliers, not as a separate measure of loyalty.")
            + "\n"
            + reveal_row(
                reveal("How we tested it", "How we tested it",
                       "We counted clients whose second group supplies at least 20% of their filings, and did the same on 100 rewired "
                       "networks in which every firm keeps its number of clients and every client keeps its filing counts, only attached "
                       "to different firms."),
                reveal("Two cautions", "Two cautions",
                       "Louvain builds the groups from these filing counts, so it already tends to put a client with its heaviest vendors; "
                       "and rewired networks split into different groups from the real one.", open_=True),
                reveal("More numbers", "More numbers",
                       f"The largest split clients are banks, insurers and manufacturers. USAA gets {pct(usaa['shares'][0], 0)} of its "
                       f"filings from HCL’s group and {pct(usaa['shares'][1], 0)} from Tata Consultancy Services’; Stellantis "
                       f"{pct(stell['shares'][0], 0)} from L&T Technology Services’ group and {pct(stell['shares'][1], 0)} from Tata "
                       "Consultancy Services’.", icon="plus", align="right")),
            figure("Clients split between two groups",
                   "The count for the real network against 100 rewired networks: mean and one standard deviation.", svg3c)
            + "\n"
            + figure("The largest split clients",
                     "Share of each client’s filings from its first and second group; a group is named after its largest firm.",
                     split_table),
            540, 40),
        anchor="who-overlap",
    )

    content = "\n".join([head, q3a, q3b, q3c])
    body = "\n".join([topbar("Staffing"), body_row(rail("3", "A"), content, 26)])
    return page("Week 4 · section 3, who staffs whom", W, HEIGHTS["Section3"], body)


# ================================================================ Section 4: the one interaction

def board_section4():
    met = {v["id"]: v for v in fp["metros"]["variants"]}
    job = {v["id"]: v for v in fp["jobs"]["variants"]}
    full = met["full"]["ami_region"]
    ami_svg, _ = strip_chart([
        dict(label="Five placing firms out", sub=f"{pct(met['drop_shortlist']['filings_removed_share'])} of filings",
             real=met["drop_shortlist"]["ami_region"], real_label=f"{met['drop_shortlist']['ami_region']:.2f}",
             base=(met["control_shortlist"]["ami_region"], met["control_shortlist"]["ami_region_sd"]), base_label="random cuts",
             badge=f"{fp['finding']['metros']['drop_shortlist_vs_control']['ami_region_vs_control_sd']:.1f} sd"),
        dict(label="Ten largest filers out", sub=f"{pct(met['drop_top10_filings']['filings_removed_share'])} of filings", bold=True,
             real=met["drop_top10_filings"]["ami_region"], real_label=f"{met['drop_top10_filings']['ami_region']:.2f}",
             base=(met["control_top10_filings"]["ami_region"], met["control_top10_filings"]["ami_region_sd"]), base_label="random cuts",
             badge=f"{fp['finding']['metros']['drop_top10_vs_control']['ami_region_vs_control_sd']:.1f} sd"),
    ], (-0.05, 0.2), 556, [-0.05, 0, 0.05, 0.1, 0.15, 0.2], lambda v: sgn(v, 2), label_w=160, badge_w=62,
        ref=full, ref_label=f"all firms {full:.2f}", top=26, aria="AMI with Census regions after removing named firms, against random cuts")
    nmi_rows = []
    for net, variants, name in (("metros", met, "Metros"), ("jobs", job, "Jobs")):
        for drop, ctrl, what in (("drop_shortlist", "control_shortlist", "five placing firms out"),
                                 ("drop_top10_filings", "control_top10_filings", "ten largest out")):
            key_ = "drop_shortlist_vs_control" if drop == "drop_shortlist" else "drop_top10_vs_control"
            sd = fp["finding"][net][key_]["nmi_vs_control_sd"]
            nmi_rows.append(dict(label=name, sub=what, real=variants[drop]["nmi_vs_full"], real_label=f"{variants[drop]['nmi_vs_full']:.2f}",
                                 base=(variants[ctrl]["nmi_vs_full"], variants[ctrl]["nmi_vs_full_sd"]),
                                 badge=f"{sgn(sd, 1)} sd", divider=(net == "jobs" and drop == "drop_shortlist")))
    nmi_svg, _ = strip_chart(nmi_rows, (0.3, 1.0), 556, [0.4, 0.6, 0.8, 1.0], lambda v: f"{v:.1f}", label_w=160, badge_w=66,
                             ref=1.0, ref_label="unchanged", top=26, row_h=52,
                             aria="NMI between the groups after a removal and the full network's groups, against random cuts")
    head = (
        opener("4", "Without the biggest firms", "metros and jobs · FY2025",
               "Take out the largest filers, Amazon above all, and the metro groups start to follow Census regions; the job clusters shift but hold.",
               "footprint")
        + "\n"
        + two_col(
            para("A handful of companies file a large share of everything: the five largest placing firms (Tata Consultancy Services, "
                 "Cognizant, Infosys, HCL, Compunnel) file 5.6% of the filings in the 40 metros, and the ten largest filers of any kind "
                 "19.1%. A company that files everywhere links every pair of metros and every pair of its jobs, so its footprint could be "
                 "all the structure there is.")
            + "\n"
            + notice("What to notice.", "Without the ten largest filers (Amazon, Cognizant, Google, Microsoft, EY, Meta, Deloitte, Apple, Tata "
                     "Consultancy Services, Infosys), the metro groups match Census regions at " + gloss("AMI") + " 0.13 (p = 0.013), against "
                     "0.06 for the full network and 0.01 ± 0.03 for random cuts, 4.6 standard deviations away. The national employers are "
                     "what hide the regional pattern. The job clusters hold at NMI 0.90 and 0.82, but random cuts of the same volume leave "
                     "them closer still (0.96 and 0.88, 3.0 and 3.2 standard deviations away), so the biggest firms do shape which jobs "
                     "cluster together.")
            + "\n"
            + reveal_row(
                reveal("How we tested it", "How we tested it",
                       "We removed each set, reran 100 Louvain runs on the metro network and on the job network (weighted here by filings, "
                       "since a count of companies barely moves when ten of 59,196 leave), and compared the groups with the full network’s. "
                       "Removing less data changes the groups too, so each removal sits beside 50 random cuts of companies that remove the "
                       "same share of filings."),
                reveal("More numbers", "More numbers",
                       "Removing the five placing firms changes little: the groups stay close to the full network’s (NMI 0.92, random cuts "
                       "0.85 ± 0.14), and the regional match rises only to 0.09, inside the range of random cuts (0.04 ± 0.05). Without the "
                       "ten largest filers the clusters also sharpen, modularity rising from 0.28 to 0.32. Every version still beats its own "
                       "rewired networks by a wide margin (z = 25 or more).", icon="plus")),
            figure("Do the metro groups follow Census regions?",
                   "AMI between the metro groups and the four Census regions. Dots remove named firms; grey bands are random cuts of the same "
                   "share of filings, mean and one standard deviation over 50. Dashed: the full network.", ami_svg)
            + "\n"
            + figure("How much do the groups change?",
                     "NMI between the groups after a removal and the full network’s groups: 1 means unchanged.", nmi_svg),
            540, 40)
    )

    # ---- the interaction: remove the largest filers one at a time
    sweep = fr["sweep"]
    cw, ch = 1100, 300
    L, Rr, T, B = 56, 24, 28, 44
    d0, d1 = -0.03, 0.22

    def X(k):
        return L + k * (cw - L - Rr) / 20

    def Y(v):
        return T + (d1 - min(max(v, d0), d1)) * (ch - T - B) / (d1 - d0)

    g = [svg_open(cw, ch, "AMI between the metro groups and Census regions as the k largest filers are removed, against random cuts")]
    for v in (0, 0.05, 0.1, 0.15, 0.2):
        g.append(line(L, Y(v), cw - Rr, Y(v), GRID, 1))
        g.append(text(L - 10, Y(v) + 4, sgn(v, 2), 11, INK_MUTE, 400, "end"))
    upper = " ".join(f"L{X(s['k']):.1f} {Y(s['control_ami_mean'] + s['control_ami_sd']):.1f}" for s in sweep)
    lower = " ".join(f"L{X(s['k']):.1f} {Y(s['control_ami_mean'] - s['control_ami_sd']):.1f}" for s in reversed(sweep))
    g.append(path("M" + upper[1:] + " " + lower + " Z", BAND))
    g.append(path("M" + " L".join(f"{X(s['k']):.1f} {Y(s['control_ami_mean']):.1f}" for s in sweep), "none", INK_MUTE, 1.5))
    g.append(line(L, Y(full), cw - Rr, Y(full), INK_SOFT, 1.2, "4 3"))
    g.append(text(cw - Rr, Y(full) - 6, f"all firms {full:.2f}", 11, INK_SOFT, 600, "end"))
    g.append(path("M" + " L".join(f"{X(s['k']):.1f} {Y(s['ami_region']):.1f}" for s in sweep), "none", INK, 2.2))
    for s in sweep:
        g.append(circle(X(s["k"]), Y(s["ami_region"]), 3.6, INK, "#ffffff", 1.2))
    for k_ in range(0, 21, 2):
        g.append(text(X(k_), ch - B + 18, str(k_), 11, INK_MUTE, 400, "middle"))
    g.append(text(X(20), ch - 6, "largest filers removed →", 11, INK_MUTE, 400, "end", tabular=False))
    g.append(text(X(1) + 8, Y(sweep[1]["ami_region"]) - 10, f"Amazon alone {sweep[1]['ami_region']:.2f}", 11.5, INK, 700, "start", tabular=False))
    g.append(text(X(18), Y(sweep[18]["ami_region"]) - 12, f"top 17 to 19: {sweep[18]['ami_region']:.2f}", 11, INK_SOFT, 600, "middle", tabular=False))
    g.append(text(X(20) - 8, Y(sweep[20]["ami_region"]) + 4, f"{sweep[20]['ami_region']:.2f}", 11.5, INK, 700, "end"))
    g.append('<line x1="{{ markX }}" y1="%d" x2="{{ markX }}" y2="%d" style="stroke: %s; stroke-width: 1.5px"></line>' % (T - 6, ch - B, ACCENT))
    g.append('<circle cx="{{ markX }}" cy="{{ markY }}" r="8" style="fill: none; stroke: %s; stroke-width: 2px"></circle>' % ACCENT)
    g.append("</svg>")
    sweep_svg = "\n".join(g)

    # readout strip, driven by k
    rw, r0, r1 = 1100, 170, 1030
    rd0, rd1 = -0.03, 0.22

    def RX(v):
        return r0 + (min(max(v, rd0), rd1) - rd0) * (r1 - r0) / (rd1 - rd0)

    def f2(v):
        s_ = f"{v:.2f}"
        return "0.00" if s_ == "-0.00" else s_.replace("-", MINUS)

    S = []
    for s in sweep:
        m, sd = s["control_ami_mean"], s["control_ami_sd"]
        lo, hi = RX(m - sd), RX(m + sd)
        if hi - lo < 4:
            c = (lo + hi) / 2
            lo, hi = c - 2, c + 2
        z = s["ami_vs_control_sd"]
        if z is None:
            verdict = "with every company in the network: no better than chance at matching Census regions."
        elif z < 20:
            verdict = (f"against {f2(m)} ± {f2(sd)} for random cuts of the same volume: "
                       f"{z:.1f} standard deviations above them.")
        else:
            verdict = (f"against {f2(m)} ± {f2(sd)} for random cuts of the same volume, "
                       "whose spread is tiny at this step.")
        S.append({
            "removed": [f for s2 in sweep[1: s["k"] + 1] for f in s2["added"]],
            "share": pct(s["filings_removed_share"]),
            "dotX": round(RX(s["ami_region"]), 1),
            "bandX": round(lo, 1), "bandW": round(hi - lo, 1), "meanX": round(RX(m), 1),
            "realLabel": f2(s["ami_region"]),
            "verdict": verdict,
            "markX": round(X(s["k"]), 1), "markY": round(Y(s["ami_region"]), 1),
            "groups": f"{s['communities']} groups",
        })
    readout = (
        svg_open(rw, 64, "Match with Census regions for the current removal, against random cuts")
        + "\n" + line(r0, 30, r1, 30, LINE, 1)
        + "\n" + text(0, 26, "Match with Census regions", 12, INK, 700, "start", tabular=False)
        + "\n" + text(0, 42, "AMI, 40 metros", 11, INK_MUTE, 400, "start", tabular=False)
        + "\n" + line(RX(full), 16, RX(full), 44, INK_SOFT, 1.2, "4 3")
        + "\n" + text(RX(full), 58, f"all firms {full:.2f}", 11, INK_SOFT, 600, "middle")
        + '\n<rect x="{{ bandX }}" y="24" width="{{ bandW }}" height="12" rx="6" style="fill: %s"></rect>' % BAND
        + '\n<line x1="{{ meanX }}" y1="21" x2="{{ meanX }}" y2="39" style="stroke: %s; stroke-width: 2px"></line>' % INK_MUTE
        + '\n<circle cx="{{ dotX }}" cy="30" r="7.5" style="fill: %s; stroke: #ffffff; stroke-width: 2px"></circle>' % INK
        + '\n<text x="{{ dotX }}" y="14" style="font-size: 13px; fill: %s; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums">{{ realLabel }}</text>' % INK
        + "\n</svg>"
    )
    controls = (
        '<div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap">\n'
        f'<label for="giants-k" style="font-size: 13px; font-weight: 700; color: {INK}">Largest filers removed</label>\n'
        f'<button type="button" onClick="{{{{ dec }}}}" disabled="{{{{ atMin }}}}" aria-label="Put the last firm back" '
        f'style="width: 36px; height: 36px; border-radius: 9px; border: 1px solid {LINE}; background: {CARD}; color: {INK}; font-size: 18px; '
        f'font-weight: 700; cursor: pointer">{MINUS}</button>\n'
        f'<input id="giants-k" type="range" min="0" max="20" step="1" value="{{{{ k }}}}" onChange="{{{{ onK }}}}" '
        f'style="width: 420px; accent-color: {ACCENT}" />\n'
        f'<button type="button" onClick="{{{{ inc }}}}" disabled="{{{{ atMax }}}}" aria-label="Remove the next largest filer" '
        f'style="width: 36px; height: 36px; border-radius: 9px; border: 1px solid {LINE}; background: {CARD}; color: {INK}; font-size: 18px; '
        'font-weight: 700; cursor: pointer">+</button>\n'
        f'<span style="font-size: 22px; font-weight: 700; color: {INK}; font-variant-numeric: tabular-nums; min-width: 40px">{{{{ k }}}}</span>\n'
        f'<span style="font-size: 12.5px; color: {INK_SOFT}">of 20 · <b style="color: {INK}">{{{{ share }}}}</b> of the filings in the 40 metros · {{{{ groups }}}}</span>\n'
        "</div>"
    )
    chips = (
        '<div style="display: flex; flex-wrap: wrap; gap: 6px; min-height: 26px; align-items: center">\n'
        f'<sc-if value="{{{{ none }}}}" hint-placeholder-val="{{{{ false }}}}"><span style="font-size: 12.5px; color: {INK_SOFT}">'
        "No firm removed: every company files.</span></sc-if>\n"
        '<sc-for list="{{ removed }}" as="f" hint-placeholder-count="1">'
        f'<span style="padding: 4px 10px; border-radius: 999px; background: {GROUND}; border: 1px solid {LINE}; font-size: 12px; '
        f'font-weight: 600; color: {INK}">{{{{ f.name }}}}</span></sc-for>\n'
        "</div>"
    )
    verdict = (
        f'<p style="margin: 0; font-size: 14px; line-height: 1.5; color: {INK}"><b>{{{{ realLabel }}}}</b> '
        f'<span style="color: {INK_SOFT}">{{{{ verdict }}}}</span></p>'
    )

    single = fr["single"]
    srows = []
    for s in single:
        srows.append(dict(label=s["firm"], sub=f"{pct(s['filings_removed_share'])} of filings", bold=s["firm"] == "Amazon",
                          real=s["ami_region"], real_label=sgn(s["ami_region"], 2),
                          base=(s["control_ami_mean"], s["control_ami_sd"]), badge=f"{sgn(s['ami_vs_control_sd'], 1)} sd"))
    single_svg, _ = strip_chart(srows, (-0.05, 0.2), 556, [-0.05, 0, 0.05, 0.1, 0.15, 0.2], lambda v: sgn(v, 2),
                                label_w=178, badge_w=66, row_h=46, ref=full, ref_label=f"all firms {full:.2f}", top=26,
                                aria="AMI with Census regions with one firm removed, against random cuts of the same volume")
    interaction = card(
        q_header("4A", "Which firm hides the regions?", "remove them one at a time", "Amazon.",
                 f"{single[0]['ami_vs_control_sd']:.1f} sd without it")
        + "\n"
        + para("We removed each of the ten largest filers alone, and then the top 1, 2, 3 … 20 filers in turn, each time beside random "
               "cuts of companies that remove the same share of filings (50 for a single firm, 20 for each step of the sweep).", measure="900px")
        + "\n"
        + f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px">\n'
        + controls + "\n" + chips + "\n" + readout + "\n" + verdict + "\n</div>\n"
        + figure("The largest filers removed in turn",
                 "AMI with Census regions after removing the k largest filers (line) against random cuts of the same volume (grey band, "
                 "one standard deviation). The ring marks the current step.", sweep_svg)
        + "\n"
        + two_col(
            notice("What to notice.", "Amazon files 5.1% of the filings in the 40 metros. Without it alone, the metro groups match Census "
                   "regions at AMI 0.14 (3.5 standard deviations above its random cuts), more than the 0.13 without all ten. No other single "
                   "firm pushes the match up beyond its random cuts: removing EY, Meta, Deloitte or Apple alone tips Louvain into a two-group "
                   "split that ignores regions (AMI \u22120.005).")
            + "\n"
            + reveal_row(reveal("More numbers", "More numbers",
                                "Removed in rank order, the largest filers keep the match above random cuts at every step from one to twenty, "
                                "but not smoothly: it dips to about 0.07 without the top 17 to 19, where several partitions compete, and peaks "
                                "at 0.20 without the top 20. FY2024 tells the same story more strongly. Its full network shows no regional "
                                "match (AMI \u22120.005); without its ten largest filers the match is 0.22 (p = 0.001), against \u22120.01 "
                                "\u00b1 0.01 for random cuts.", icon="plus", open_=True)),
            figure("One firm out at a time",
                   "AMI with Census regions with one firm removed (dot) and random cuts of the same volume (grey, mean and one standard "
                   "deviation). Dashed: the full network.", single_svg),
            540, 40),
        anchor="footprint-which",
    )
    js_S = json.dumps(S, ensure_ascii=False)
    script = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const S = {js_S};\n"
        "const st = this.state || {};\n"
        "const k = typeof st.k === 'number' ? st.k : 1;\n"
        "const s = S[k];\n"
        "const set = (v) => this.setState({ k: Math.max(0, Math.min(20, v)) });\n"
        "return {\n"
        "k: k,\n"
        "removed: s.removed.map((n) => ({ name: n })),\n"
        "none: k === 0,\n"
        "share: s.share,\n"
        "groups: s.groups,\n"
        "dotX: s.dotX,\n"
        "bandX: s.bandX,\n"
        "bandW: s.bandW,\n"
        "meanX: s.meanX,\n"
        "realLabel: s.realLabel,\n"
        "verdict: s.verdict,\n"
        "markX: s.markX,\n"
        "markY: s.markY,\n"
        "atMin: k === 0,\n"
        "atMax: k === 20,\n"
        "dec: () => set(k - 1),\n"
        "inc: () => set(k + 1),\n"
        "onK: (e) => set(Number(e.target.value)),\n"
        "};\n"
        "}\n"
        "}"
    )
    content = "\n".join([head, interaction])
    body = "\n".join([topbar("Biggest firms"), body_row(rail("4", "A"), content, 26)])
    return page("Week 4 · section 4, remove the biggest firms", W, HEIGHTS["Section4"], body, script)


# ================================================================ Closing and the appendix

def board_closing():
    bs = ww["backbone_sweep"]
    sw, sh = 470, 150
    L, Rr, T, B = 34, 10, 14, 30
    lx0, lx1 = math.log10(0.004), math.log10(1.0)

    def X(al):
        return L + (math.log10(max(al, 0.004)) - lx0) * (sw - L - Rr) / (lx1 - lx0)

    def Y(v):
        return T + (40 - v) * (sh - T - B) / 40

    g = [svg_open(sw, sh, "Metros in the largest connected piece as the disparity filter tightens")]
    g.append(rect(X(0.05), T, X(0.1) - X(0.05), sh - T - B, LINE_SOFT))
    for v in (0, 20, 40):
        g.append(line(L, Y(v), sw - Rr, Y(v), GRID, 1))
        g.append(text(L - 8, Y(v) + 4, str(v), 11, INK_MUTE, 400, "end"))
    pts = sorted(((max(p["alpha"], 0.004), p["gc_size"]) for p in bs), key=lambda p: -p[0])
    d = f"M{X(pts[0][0]):.1f} {Y(pts[0][1]):.1f}"
    prev = pts[0][1]
    for al, gcs in pts[1:]:
        d += f" L{X(al):.1f} {Y(prev):.1f} L{X(al):.1f} {Y(gcs):.1f}"
        prev = gcs
    g.append(path(d, "none", INK, 2))
    for al, lab in ((0.01, "0.01"), (0.1, "0.1"), (1.0, "1")):
        g.append(text(X(al), sh - B + 16, lab, 11, INK_MUTE, 400, "middle"))
    g.append(text(sw - Rr, sh - 4, "α, disparity filter →", 11, INK_MUTE, 400, "end", tabular=False))
    g.append(text((X(0.05) + X(0.1)) / 2, T + 12, "α 0.05–0.1", 10.5, INK_SOFT, 700, "middle", tabular=False))
    g.append("</svg>")
    snap_svg = "\n".join(g)

    surprise1 = mini_strip(470, (0, 0.3), F["q1_pooled_observed_share"], pct(F["q1_pooled_observed_share"]),
                           (F["q1_pooled_null_mean"], F["q1_pooled_null_sd"]), f"random vendor {pct(F['q1_pooled_null_mean'])}",
                           aria="Vendor switches that stay in the group, against a random vendor")

    def surprise(before, after, visual):
        return (
            f'<div style="border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px">'
            f'<p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: {INK_SOFT}">{before}</p>'
            f'<p style="margin: 0; font-size: 14px; line-height: 1.45; font-weight: 600; color: {INK}">{after}</p>{visual}</div>'
        )

    right = (
        f'<span style="font-size: 15px; font-weight: 700; color: {INK}">What surprised us.</span>\n'
        + surprise("The staffing groups looked weak in our first round, following industry about as much as vendor,",
                   "yet 26.5% of vendor switches stay inside them, against 3.2% for a random vendor.", surprise1)
        + "\n"
        + surprise("And the backbone that seemed to snap between α = 0.1 and 0.05",
                   "never snaps: no single link cuts off more than two metros.", snap_svg)
    )
    left = "\n".join([
        para("Cities group by who hires there, not by region. Outsourcing firms bundle jobs differently from direct employers of the same size. And when a client drops its "
             "main vendor, the new one comes from the same Louvain group nearly eight times as often as a random vendor would, though mostly "
             "because clients return to firms they already use. Take out the ten largest filers, most of them national tech and consulting "
             "employers, and the metro groups start to follow Census regions; Amazon alone does all of that.", size=14.5, color=INK),
        para("Where outsourcing shows most is outside the networks: a filing that places a worker at a client has 3.6 times the odds of a "
             "lower wage level for the same occupation. Lawyers and green cards barely follow the staffing groups.", size=14.5, color=INK),
        notice("One important limit.", "A shared employer link means that the same companies file for both occupations or in both places. "
               "It does not prove that the jobs are performed together, that one caused the other, or that the network represents workers "
               "who were actually hired.", "!"),
    ])
    closing = (
        opener("✓", "Closing", "one reading of the network",
               "The groups in these networks are weak, but they are not noise.", "closing")
        + "\n" + card(two_col(left, right, 560, 44))
    )

    first_round = [
        ("1", "Where the hiring is", "Deep1.dc.html",
         ["Which cities hire the most?", "Once the small links go, what’s left of the map?",
          "Is it one national job market or several regional ones?", "Do the same employers tie distant cities together?"]),
        ("2", "Which jobs go together", "Deep2.dc.html",
         ["Which jobs are hired together?", "Which jobs belong to two clusters?", "Do the clusters follow official job groups?"]),
        ("3", "Who staffs whom", "Deep3a.dc.html",
         ["How many workers sit at a client?", "Do clients group by industry or by the firm that staffs them?",
          "Who relies on a single vendor?", "Does it hold from year to year?"]),
        ("3", "Who staffs whom, continued", "Deep3b.dc.html",
         ["Who files the paperwork?", "With filing counts or without?", "Strong ties, weak ties and pay",
          "Do the firms that register the same workers staff the same clients?"]),
    ]

    def linkrow(title, href):
        return (
            f'<a href="{href}" style="display: flex; justify-content: space-between; gap: 12px; align-items: baseline; padding: 8px 0; '
            f'border-top: 1px solid {LINE_SOFT}; text-decoration: none">'
            f'<span style="font-size: 13px; font-weight: 600; color: {INK}">{t(title)}</span>'
            f'<span aria-hidden="true" style="color: {ACCENT}; font-weight: 700">→</span></a>'
        )

    def colhead(title, sub):
        return (f'<div style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 700; color: {INK}">'
                f'{t(title)}</span><span style="font-size: 12px; color: {INK_SOFT}">{t(sub)}</span></div>')

    col1 = (
        '<div style="display: flex; flex-direction: column; gap: 10px">'
        + colhead("Our first round of questions", "Sections 1 to 3, with their charts")
        + "".join(
            f'<div style="display: flex; flex-direction: column"><span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; '
            f'text-transform: uppercase; color: {INK_SOFT}; padding: 8px 0 4px">{n} · {t(sec)}</span>'
            + "".join(linkrow(q_, href) for q_ in qs) + "</div>"
            for n, sec, href, qs in first_round)
        + "</div>"
    )
    more = [("Who keeps them? Green cards as the strong tie", "DeepMoreA.dc.html"),
            ("Where are they from? A network of countries", "DeepMoreA.dc.html"),
            ("Where is the hiring densest? Filings per 1,000 jobs", "DeepMoreA.dc.html"),
            ("Strength against degree: where do the heavy links go?", "DeepMoreB.dc.html"),
            ("The lottery a year apart, and who receives the winners", "DeepMoreB.dc.html"),
            ("USCIS denials, year by year", "DeepMoreB.dc.html")]
    col2 = (
        '<div style="display: flex; flex-direction: column; gap: 10px">'
        + colhead("More networks", "Green cards, countries, jobs per metro, strong ties, the lottery and USCIS denials")
        + '<div style="display: flex; flex-direction: column; padding-top: 4px">' + "".join(linkrow(c, h) for c, h in more) + "</div></div>"
    )
    col3 = (
        '<div style="display: flex; flex-direction: column; gap: 10px">'
        + colhead("Data and methods", "Sources, scripts and checks behind every number")
        + '<div style="display: flex; flex-direction: column; padding-top: 4px">'
        + linkrow("Sources and the scripts that made each number", "DeepMethods.dc.html")
        + linkrow("AI use and how we checked it", "DeepMethods.dc.html")
        + "</div>"
        + f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px">'
        + para("AI coding assistants helped structure the page, wrote analysis and page code, drafted and revised text, and tested the visual "
               "presentation.", size=12.5)
        + "</div></div>"
    )
    appendix = (
        opener("+", "Deep dive", "earlier questions · more networks · data and methods",
               "Each answer still holds; the questions above replaced them because they test the communities against something that "
               "could have come out the other way.", "cut")
        + "\n"
        + card('<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 36px; align-items: start">'
               + col1 + col2 + col3 + "</div>")
    )
    foot = (
        f'<footer style="flex: none; margin-top: 48px; border-top: 1px solid {LINE}; padding: 22px 0 0 {MARGIN}px; display: flex; '
        f'flex-direction: column; gap: 6px; font-size: 12px; color: {INK_MUTE}">'
        "<span>Sources: US DOL OFLC LCA / worksites (public domain) · Census CBSA delineations · Week 4 methods: communities, weights, backbones</span>"
        f'<span>Who hires America’s foreign workers? · <a href="#top" style="color: {INK_SOFT}">Log–Log Legends</a> · DTU 02805</span></footer>'
    )
    content = "\n".join([closing, appendix])
    body = "\n".join([topbar("Closing"), body_row(rail("✓"), content, 30), foot])
    return page("Week 4 · closing and go deeper", W, HEIGHTS["Closing"], body)


# ================================================================ Chart kit

def board_kit():
    jn_q1 = jsp["finding"]
    col_key = [
        (INK, "dot", "The real network", "What we measured in the filings. Always the dark dot or line.", "Every chart"),
        (BAND, "band", "Random baseline", "Mean and one standard deviation of the null: rewired networks, random draws or random cuts. Always grey.", "Every chart"),
        (PEOPLE, "sq", "Placed at a client", "Outsourcing firms, and filings that put the worker at another company.", "2A, 5B, 5C"),
        (ACCESS, "sq", "Direct employer", "Filings for the employer’s own site. Never a baseline.", "2A, 5B, 5C"),
        (None, "groups", "Metro groups", "The three Louvain groups of section 1. Maps only, never in a result chart.", "The hero map, section 1"),
    ]
    tiles = []
    for c, kind, name, meaning, where in col_key:
        if kind == "groups":
            sw_ = ('<span style="display: flex; gap: 5px">'
                   + "".join(f'<span style="width: 16px; height: 16px; border-radius: 999px; background: {GROUP_ON_LIGHT[g_]}"></span>'
                             for g_ in (0, 1, 2)) + "</span>")
        elif kind == "dot":
            sw_ = f'<span style="width: 18px; height: 18px; border-radius: 999px; background: {c}"></span>'
        elif kind == "band":
            sw_ = (f'<span style="width: 48px; height: 16px; border-radius: 8px; background: {c}; display: flex; justify-content: center">'
                   f'<span style="width: 2px; height: 16px; background: {INK_MUTE}"></span></span>')
        else:
            sw_ = f'<span style="width: 18px; height: 18px; border-radius: 4px; background: {c}"></span>'
        tiles.append(
            f'<div style="background: {CARD}; border: 1px solid {LINE}; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px">'
            f'<div style="height: 20px; display: flex; align-items: center">{sw_}</div>'
            f'<span style="font-size: 15px; font-weight: 700; color: {INK}">{t(name)}</span>'
            f'<span style="font-size: 12.5px; line-height: 1.5; color: {INK_SOFT}">{t(meaning)}</span>'
            f'<span style="font-size: 11.5px; color: {INK_MUTE}">{t(where)}</span></div>'
        )
    key_row = '<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px">' + "".join(tiles) + "</div>"

    # anatomy: the pooled 3A strip, large, with callouts
    aw = 1100
    anat, _ = strip_chart([
        dict(label="Pooled switches", sub="FY2022 to FY2025", bold=True, real=F["q1_pooled_observed_share"],
             real_label=pct(F["q1_pooled_observed_share"]), base=(F["q1_pooled_null_mean"], F["q1_pooled_null_sd"]),
             base_label=f"random {pct(F['q1_pooled_null_mean'])} ± {pct(F['q1_pooled_null_sd'])}", badge=f"z = {F['q1_pooled_z']:.0f}"),
    ], (0, 0.32), aw, [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], lambda v: f"{v * 100:.0f}%", label_w=170, badge_w=80, row_h=70,
        aria="Anatomy of a strip: the real network against its random baseline")
    callouts = [
        ("1", "Label and population", "What the row counts, and how many."),
        ("2", "Random baseline", "Grey band: one standard deviation each side of the mean tick."),
        ("3", "The real network", "Dark dot with its value above it."),
        ("4", "Distance", "z, standard deviations or p, outside the axis."),
    ]
    call_html = '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">' + "".join(
        f'<div style="display: flex; gap: 10px"><span style="flex: none; width: 22px; height: 22px; border-radius: 999px; background: {INK}; '
        f'color: #ffffff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center">{n}</span>'
        f'<span style="display: flex; flex-direction: column; gap: 2px"><b style="font-size: 13px; color: {INK}">{t(h)}</b>'
        f'<span style="font-size: 12px; line-height: 1.45; color: {INK_SOFT}">{t(d)}</span></span></div>'
        for n, h, d in callouts) + "</div>"
    met = {v["id"]: v for v in fp["metros"]["variants"]}
    b3 = bey["q3"]
    variants_svg, _ = strip_chart([
        dict(label="Above random", sub="3A, pooled", real=F["q1_pooled_observed_share"], real_label=pct(F["q1_pooled_observed_share"]),
             base=(F["q1_pooled_null_mean"], F["q1_pooled_null_sd"]), base_label="random", badge=f"z = {F['q1_pooled_z']:.0f}"),
    ], (0, 0.32), 540, [0, 0.1, 0.2, 0.3], lambda v: f"{v * 100:.0f}%", label_w=130, badge_w=66, aria="A result above random")
    variants_svg2, _ = strip_chart([
        dict(label="Below random", sub="3C, split clients", real=F["q3_two_community_clients"], real_label=num(F["q3_two_community_clients"]),
             base=(F["q3_null_mean"], F["q3_null_sd"]), base_label="rewired", badge=f"z = {sgn(F['q3_z'], 0)}"),
    ], (1600, 2300), 540, [1600, 1900, 2200], lambda v: num(v), label_w=130, badge_w=66, aria="A result below random")
    variants_svg3, _ = strip_chart([
        dict(label="Inside random", sub="4, five placing firms out", real=met["drop_shortlist"]["ami_region"],
             real_label=f"{met['drop_shortlist']['ami_region']:.2f}",
             base=(met["control_shortlist"]["ami_region"], met["control_shortlist"]["ami_region_sd"]), base_label="random cuts",
             badge=f"{fp['finding']['metros']['drop_shortlist_vs_control']['ami_region_vs_control_sd']:.1f} sd"),
    ], (-0.05, 0.2), 540, [0, 0.1, 0.2], lambda v: f"{v:.1f}", label_w=130, badge_w=66, aria="A result inside the random range")
    variants_svg4, _ = strip_chart([
        dict(label="An interval", sub="5C, odds ratio", real=b3["mantel_haenszel_odds_ratio"], real_label=f"{b3['mantel_haenszel_odds_ratio']:.2f}",
             ci=tuple(b3["odds_ratio_cluster_ci95"]), rref=(1, "same odds"), badge="95%"),
    ], (0, 6), 540, [0, 1, 2, 3, 4, 5, 6], lambda v: f"{v:.0f}", label_w=130, badge_w=66, aria="An estimate with its interval")
    anatomy = card(
        f'<span style="font-size: 17px; font-weight: 700; color: {INK}">One strip for every “real against random” answer</span>\n'
        + f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 18px 16px 8px">{anat}</div>\n'
        + call_html + "\n"
        + '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 40px">'
        + "".join(f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 12px 14px 4px">{s}</div>'
                  for s in (variants_svg, variants_svg2, variants_svg3, variants_svg4))
        + "</div>"
    )

    # before / after: 2A
    base_rows = [
        dict(label="Count-matched", sub="same number of companies", base=(jn_q1["q1_null_count_matched_nmi_mean"], jn_q1["q1_null_count_matched_nmi_sd"]),
             base_label=f"{jn_q1['q1_null_count_matched_nmi_mean']:.2f} ± {jn_q1['q1_null_count_matched_nmi_sd']:.2f}",
             real=jn_q1["q1_observed_nmi"]),
        dict(label="Filing-matched", sub="same share of filings", base=(jn_q1["q1_null_filings_matched_nmi_mean"], jn_q1["q1_null_filings_matched_nmi_sd"]),
             base_label=f"{jn_q1['q1_null_filings_matched_nmi_mean']:.2f} ± {jn_q1['q1_null_filings_matched_nmi_sd']:.2f}",
             real=jn_q1["q1_observed_nmi"]),
        dict(label="Size-matched", sub="the fair baseline", bold=True, base=(jn_q1["q1_null_matched_nmi_mean"], jn_q1["q1_null_matched_nmi_sd"]),
             base_label=f"{jn_q1['q1_null_matched_nmi_mean']:.2f} ± {jn_q1['q1_null_matched_nmi_sd']:.2f}",
             real=jn_q1["q1_observed_nmi"], real_label=f"{jn_q1['q1_observed_nmi']:.2f}", badge=f"z = {sgn(jn_q1['q1_matched_z'], 1)}"),
    ]
    after2a, _ = strip_chart(base_rows, (0.2, 0.8), 540, [0.2, 0.4, 0.6, 0.8], lambda v: f"{v:.1f}", label_w=140, badge_w=74,
                             axis_title="NMI between the two groups’ clusters",
                             aria="Observed agreement between the two groups' clusters against three random splits")
    pl = {o["title"]: o["share"] for o in jsp["q1"]["placing_top_occupations"]}
    dr = {o["title"]: o["share"] for o in jsp["q1"]["direct_top_occupations"]}
    occ = ["Software Developers", "Computer Occupations, All Other", "Data Scientists",
           "Software Quality Assurance Analysts and Testers", "Computer Systems Analysts"]
    short = {"Software Quality Assurance Analysts and Testers": "Software QA analysts and testers",
             "Computer Occupations, All Other": "Computer occupations, all other"}
    mix_rows = [dict(label=short.get(o, o), pair=[(pl.get(o, 0), PEOPLE, pct(pl.get(o, 0), 0)), (dr.get(o, 0), ACCESS, pct(dr.get(o, 0), 0))])
                for o in occ]
    after2a_mix, _ = strip_chart(mix_rows, (0, 0.4), 540, [0, 0.1, 0.2, 0.3, 0.4], lambda v: f"{v * 100:.0f}%", label_w=200, badge_w=14,
                                 row_h=40, aria="Share of each group's filings for the largest occupations: outsourcing firms against direct employers")
    mix_key = (
        f'<div style="display: flex; gap: 16px; font-size: 12px; color: {INK_SOFT}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 11px; height: 11px; border-radius: 999px; background: {PEOPLE}"></span>outsourcing firms</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 11px; height: 11px; border-radius: 999px; background: {ACCESS}"></span>direct employers</span></div>'
    )

    def before_after(title, before_src, before_h, before_notes, after_html):
        notes = "".join(f'<li style="margin: 0">{t(n)}</li>' for n in before_notes)
        return card(
            f'<span style="font-size: 17px; font-weight: 700; color: {INK}">{t(title)}</span>\n'
            '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; align-items: start">\n'
            '<div style="display: flex; flex-direction: column; gap: 10px">'
            + label_caps("Today", INK_SOFT)
            + f'<img src="{before_src}" alt="{a(title)} as the page draws it today" style="width: 540px; height: {before_h}px; display: block; '
            f'border: 1px solid {LINE}; border-radius: 10px" />'
            f'<ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; line-height: 1.5; color: {INK_SOFT}">{notes}</ul></div>\n'
            '<div style="display: flex; flex-direction: column; gap: 10px">'
            + label_caps("Proposed", ACCENT)
            + after_html + "</div>\n</div>"
        )

    ba_2a = before_after(
        "2A · Observed agreement against random splits", BLOB_2A, 213,
        ["The size-matched baseline is blue, the colour that means direct employers in the chart beside it.",
         "Value labels sit on the whisker caps: 0.44, 0.59, 0.61.",
         "Occupation names are cut: “Software Quality Assurance Anal…”."],
        f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 14px 6px">{after2a}</div>'
        + f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 12px 14px 6px; display: flex; flex-direction: column; gap: 8px">'
        + mix_key + after2a_mix + "</div>",
    )
    after3c, _ = strip_chart([
        dict(label="Split clients", sub="second group ≥ 20%", bold=True, real=F["q3_two_community_clients"],
             real_label=num(F["q3_two_community_clients"]), base=(F["q3_null_mean"], F["q3_null_sd"]),
             base_label=f"rewired {num(F['q3_null_mean'])} ± {num(F['q3_null_sd'])}", badge=f"z = {sgn(F['q3_z'], 0)}"),
    ], (1600, 2300), 540, [1600, 1800, 2000, 2200], lambda v: num(v), label_w=140, badge_w=70,
        aria="Clients split between two groups, real against rewired")
    ba_3c = before_after(
        "3C · Clients split between two groups", BLOB_3C, 143,
        ["A full-width chart, 250 px tall, for two numbers.",
         "Bars from zero hide the gap that matters: 331 clients against a spread of 20.",
         "The axis title is clipped at the top."],
        f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 14px 6px">{after3c}</div>'
        + para("The same two numbers in 110 px. The strip reads at once: the real count sits far below the rewired band.", size=12.5),
    )
    wage_rows = [dict(label=short.get(o["title"], o["title"]), sub=f"{num(o['filings'])} filings",
                      pair=[(o["placed_low_share"], PEOPLE, pct(o["placed_low_share"], 0)), (o["direct_low_share"], ACCESS, pct(o["direct_low_share"], 0))])
                 for o in bey["q3_top5_soc"]]
    wage_svg, _ = strip_chart(wage_rows, (0.3, 1.0), 1100, [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], lambda v: f"{v * 100:.0f}%",
                              label_w=260, badge_w=20, row_h=48, axis_title="Share of filings at wage level I or II",
                              aria="Share of filings at wage level I or II, placed at a client against the employer's own site, for the five largest occupations")
    wage = card(
        f'<span style="font-size: 17px; font-weight: 700; color: {INK}">5C · Labels read in full, never rotated</span>\n'
        + para("Occupations go down the side, so their names fit. One row per job, placed and direct on the same line: the gap is the finding.",
               size=12.5, measure="900px")
        + "\n"
        + f'<div style="display: flex; gap: 16px; font-size: 12px; color: {INK_SOFT}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 11px; height: 11px; border-radius: 999px; background: {PEOPLE}"></span>placed at a client</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 11px; height: 11px; border-radius: 999px; background: {ACCESS}"></span>employer’s own site</span></div>\n'
        + f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 16px 6px">{wage_svg}</div>'
    )
    rules = [
        ("Always on the page", "The answer, the comparison with the baseline, and the caveat that limits the claim."),
        ("Behind a button", "How we tested it, the rest of the numbers, and the words a reader may not know."),
        ("How it opens", "On hover and on keyboard focus. The text stays in the page, so screen readers and search still read it."),
        ("What goes in", "Buttons hold the page\u2019s own sentences, moved word for word. Only the short definitions behind dotted terms are new."),
    ]
    rules_html = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 3px; padding: 10px 0; border-top: 1px solid {LINE_SOFT}">'
        f'<b style="font-size: 13px; color: {INK}">{t(h)}</b><span style="font-size: 12.5px; line-height: 1.5; color: {INK_SOFT}">{t(d)}</span></div>'
        for h, d in rules)
    demo_method = reveal_row(
        reveal("How we tested it", "How we tested it",
               "A client’s main vendor is the firm that files most placements there in a year. The baseline draws a new vendor at random, "
               "a large firm as often as its filings make it likely.", open_=True, width=420),
        reveal("More numbers", "More numbers", "Shown on hover or focus, like the button beside it.", icon="plus"))
    demo_term = (
        f'<p style="margin: 0; font-size: 13.5px; line-height: 1.62; color: {INK_SOFT}">The groups match each client’s main vendor at '
        + term("AMI", GLOSS["AMI"], open_=True) + " 0.11 and its industry at 0.07.</p>"
    )
    reveal_card = card(
        f'<span style="font-size: 17px; font-weight: 700; color: {INK}">Short on the page, the rest one hover away</span>\n'
        '<div style="display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 48px; align-items: start">\n'
        f'<div style="display: flex; flex-direction: column">{rules_html}</div>\n'
        '<div style="display: flex; flex-direction: column; gap: 14px">'
        + label_caps("A button, open", INK_SOFT)
        + f'<div style="height: 250px">{demo_method}</div>'
        + label_caps("A term, open", INK_SOFT)
        + f'<div style="height: 150px">{demo_term}</div>'
        + "</div>\n</div>"
    )
    head = (
        f'<header style="flex: none; padding: 44px {MARGIN}px 8px; display: flex; flex-direction: column; gap: 8px">'
        f'<span style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: {ACCENT}">Week 4 · chart kit</span>'
        f'<h1 style="margin: 0; font-size: 34px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; color: {INK}">One way to read every chart</h1>'
        f'<p style="margin: 0; max-width: 760px; font-size: 14px; line-height: 1.6; color: {INK_SOFT}">Almost every answer on the page compares the '
        "real network with a random baseline. One meaning per colour, and one strip for every comparison, make it read the same in every "
        "section.</p></header>"
    )
    body = (
        head
        + f'\n<div style="flex: none; width: {SHELL}px; align-self: center; display: flex; flex-direction: column; gap: 24px; padding-top: 18px">\n'
        + key_row + "\n" + anatomy + "\n" + reveal_card + "\n" + ba_2a + "\n" + ba_3c + "\n" + wage + "\n</div>"
    )
    return page("Week 4 · chart kit", W, HEIGHTS["ChartKit"], body)


def board_today():
    h = 5063 + 72
    body = (
        f'<div style="flex: none; height: 72px; box-sizing: border-box; padding: 20px 24px; display: flex; flex-direction: column; gap: 4px">'
        f'<span style="font-size: 15px; font-weight: 700; color: {INK}">Week 4 today</span>'
        f'<span style="font-size: 12px; color: {INK_SOFT}">The live page at 1440 px, shown at half size, for comparison.</span></div>'
        f'<img src="{BLOB_TODAY}" alt="The Week 4 page as it is today, full length" style="width: 720px; height: 5063px; display: block" />'
    )
    return page("Week 4 today", 720, h, body), h


# ================================================================ write
