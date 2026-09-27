"""Five-year trends and three explorables, in the patterns of the course pages, on Week 4's own data."""
import json
import math

from kit import *  # noqa: F401,F403
import kit
import build as B
import deep as D

staff = B.load("analysis/week04_staffing.json")
shift = B.load("analysis/week04_shift.json")
ctry = B.load("analysis/week04_countries.json")
lot = B.load("analysis/week04_lottery.json")["lotteries"]
place, ww, scl, scm = B.place, B.ww, B.scl, B.scm
YEARS = ["2022", "2023", "2024", "2025", "2026"]
YL = {y: f"FY{y}" for y in YEARS}
CITY = {c["id"]: c for c in place["cities"]}


def fy_note():
    return "FY runs October to September. FY2026 covers October 2025 to June 2026 and is drawn hollow."


# ---------------------------------------------------------------- small chart builders for series

def year_line(series, width, height, fmt, aria, y_max=None, y_min=0, color=INK, labels=True, left=56):
    """One series over FY2022 to FY2026; the last point (nine months) is hollow and joined with a dashed segment."""
    L, R, T, Bm = left, 24, 18, 30
    vals = [v for _, v in series]
    y1 = y_max if y_max is not None else max(vals) * 1.15
    X = lambda i: L + i * (width - L - R) / (len(series) - 1)
    Y = lambda v: T + (y1 - v) * (height - T - Bm) / (y1 - y_min)
    out = [svg_open(width, height, aria)]
    for k in range(4):
        v = y_min + (y1 - y_min) * k / 3
        out.append(line(L, Y(v), width - R, Y(v), GRID, 1))
        out.append(text(L - 8, Y(v) + 4, fmt(v), 11, INK_MUTE, 400, "end"))
    pts = [(X(i), Y(v)) for i, (_, v) in enumerate(series)]
    out.append(path("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts[:-1]), "none", color, 2.4))
    out.append(line(pts[-2][0], pts[-2][1], pts[-1][0], pts[-1][1], color, 2, "4 4"))
    for i, ((lab, v), (x, y)) in enumerate(zip(series, pts)):
        last = i == len(series) - 1
        out.append(circle(x, y, 5, "#ffffff" if last else color, color if last else "#ffffff", 2))
        if labels:
            out.append(text(x, y - 11, fmt(v), 11.5, INK, 700, "middle"))
        out.append(text(x, height - 10, lab, 11, INK_MUTE, 600 if not last else 400, "middle", tabular=False))
    out.append("</svg>")
    return "\n".join(out), height


def two_lines(a, b, width, height, fmt, aria, y_max, names, colors):
    """Two series over the five fiscal years, labelled at their ends."""
    L, R, T, Bm = 56, 110, 18, 30
    X = lambda i: L + i * (width - L - R) / 4
    Y = lambda v: T + (y_max - v) * (height - T - Bm) / y_max
    out = [svg_open(width, height, aria)]
    for k in range(5):
        v = y_max * k / 4
        out.append(line(L, Y(v), width - R, Y(v), GRID, 1))
        out.append(text(L - 8, Y(v) + 4, fmt(v), 11, INK_MUTE, 400, "end"))
    for series, col, name in ((a, colors[0], names[0]), (b, colors[1], names[1])):
        pts = [(X(i), Y(v)) for i, v in enumerate(series)]
        out.append(path("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts[:-1]), "none", col, 2.4))
        out.append(line(pts[-2][0], pts[-2][1], pts[-1][0], pts[-1][1], col, 2, "4 4"))
        for i, (x, y) in enumerate(pts):
            last = i == 4
            out.append(circle(x, y, 4.5, "#ffffff" if last else col, col if last else "#ffffff", 2))
            out.append(text(x, y - 10, fmt(series[i]), 11, INK, 700, "middle"))
        out.append(text(pts[-1][0] + 12, pts[-1][1] + 4, name, 12, INK, 700, "start", tabular=False))
    for i, y in enumerate(YEARS):
        out.append(text(X(i), height - 10, YL[y], 11, INK_MUTE, 600, "middle", tabular=False))
    out.append("</svg>")
    return "\n".join(out), height


def year_bars(series, width, height, fmt, aria, partial_last=True, sub=None):
    L, R, T, Bm = 12, 12, 26, 44
    n = len(series)
    cw = (width - L - R) / n
    vmax = max(v for _, v in series) * 1.12
    out = [svg_open(width, height, aria)]
    base = height - Bm
    for i, (lab, v) in enumerate(series):
        x = L + i * cw + cw * 0.18
        w = cw * 0.64
        hgt = (base - T) * v / vmax
        last = partial_last and i == n - 1
        out.append(rect(x, base - hgt, w, hgt, CARD if last else INK, 3, INK if last else None, 1.6))
        out.append(text(x + w / 2, base - hgt - 7, fmt(v), 11.5, INK, 700, "middle"))
        out.append(text(x + w / 2, base + 16, lab, 11, INK_SOFT, 600, "middle", tabular=False))
        if sub and sub[i]:
            out.append(text(x + w / 2, base + 30, sub[i], 10.5, INK_MUTE, 400, "middle", tabular=False))
    out.append(line(L, base, width - R, base, LINE, 1))
    out.append("</svg>")
    return "\n".join(out), height


MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"]
# Older years lighter; the newest year carries the section's own hue.
SEASON_INK = {"FY2024": "#b3c1d3", "FY2025": "#7a8fac", "FY2026": INK}
SEASON_PEOPLE = {"FY2024": "#f9cf9f", "FY2025": "#f6a95a", "FY2026": PEOPLE}


def nice_axis(vmax):
    """Zero-based axis: the lowest round top tick that holds vmax in three to six steps."""
    best = None
    mag = 10 ** math.floor(math.log10(vmax / 4))
    for m in (1, 2, 2.5, 5, 10, 20):
        step = m * mag
        top = step * math.ceil(vmax / step)
        if 3 <= top / step <= 6 and (best is None or top < best[1]):
            best = (step, top)
    return best


def spread(ys, gap=13):
    """Nudge label y positions apart so no two sit closer than gap, keeping their order."""
    order = sorted(range(len(ys)), key=lambda i: ys[i])
    pos = [ys[i] for i in order]
    for _ in range(60):
        moved = False
        for k in range(1, len(pos)):
            d = pos[k] - pos[k - 1]
            if d < gap - 0.01:
                pos[k - 1] -= (gap - d) / 2
                pos[k] += (gap - d) / 2
                moved = True
        if not moved:
            break
    out = [0.0] * len(ys)
    for k, i in enumerate(order):
        out[i] = pos[k]
    return out


def season_chart(rows, key, colors, width, height, aria, note=None):
    """October to June on one axis, one line per fiscal year, each labelled at its June end."""
    L, R, T, Bm = 56, 62, 16, 30
    years = list(rows)
    for y in years:
        assert [m["month"][5:] for m in rows[y]] == ["10", "11", "12", "01", "02", "03", "04", "05", "06"], y
    step, top = nice_axis(max(m[key] for y in years for m in rows[y]))
    X = lambda i: L + i * (width - L - R) / 8
    Y = lambda v: T + (top - v) * (height - T - Bm) / top
    out = [svg_open(width, height, aria)]
    for k in range(int(round(top / step)) + 1):
        v = k * step
        out.append(line(L, Y(v), width - R, Y(v), LINE if v == 0 else GRID, 1))
        out.append(text(L - 8, Y(v) + 4, num(v), 11, INK_MUTE, 400, "end"))
    for i, mo in enumerate(MONTHS):
        out.append(text(X(i), height - 10, mo, 11, INK_MUTE, 400, "middle", tabular=False))
    ends = []
    for y in years:
        newest = y == years[-1]
        pts = [(X(i), Y(m[key])) for i, m in enumerate(rows[y])]
        out.append(path("M" + " L".join(f"{px:.1f} {py:.1f}" for px, py in pts), "none", colors[y], 2.6 if newest else 2))
        ends.append(pts[-1][1])
    for y, ly in zip(years, spread(ends)):
        newest = y == years[-1]
        out.append(text(width - R + 8, ly + 4, y, 11.5, INK if newest else INK_MUTE, 700 if newest else 600, "start", tabular=False))
    if note:
        i, label = note
        m = rows[years[-1]][i]
        out.append(circle(X(i), Y(m[key]), 4.5, "#ffffff", colors[years[-1]], 2))
        out.append(text(X(i) + 12, Y(m[key]) - 6, label, 11.5, INK, 700, "start", tabular=False))
    out.append("</svg>")
    return "\n".join(out)


def panel(title, caption, svg, span=1):
    return (
        f'<div style="grid-column: span {span}; background: {CARD}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW}; '
        'padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 8px">'
        f'<span style="font-size: 15px; font-weight: 700; color: {INK}">{t(title)}</span>'
        f'<span style="font-size: 12px; line-height: 1.45; color: {INK_SOFT}">{t(caption)}</span>{svg}</div>'
    )


# ================================================================ five years

def five_years():
    ys = staff["years"]
    cert = [(YL[y] if y != "2026" else "FY2026", ys[y]["certified_filings"]) for y in YEARS]
    s1, h1 = year_bars(cert, 540, 250, lambda v: num(v), "Certified H-1B filings per fiscal year",
                       sub=["", "", "", "", "Oct–Jun only"])
    oj = shift["oct_jun"]["totals"]
    like = [(k, oj[k]["certified_filings"]) for k in ("FY2024", "FY2025", "FY2026")]
    s1b, h1b = year_bars(like, 540, 220, lambda v: num(v), "Certified filings from October to June, three years", partial_last=False)

    # The JSON holds October to June of each year, the window FY2026 covers, so the years share one Oct-Jun axis.
    rows = {fy: shift["monthly"][fy] for fy in ("FY2024", "FY2025", "FY2026")}
    oct25 = rows["FY2026"][0]
    assert oct25["month"] == "2025-10"
    sub = lambda title, svg: (f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 13px; '
                              f'font-weight: 700; color: {INK}">{t(title)}</span>{svg}</div>')
    monthly = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px">'
        + sub("Certified filings", season_chart(rows, "certified_filings", SEASON_INK, 552, 280,
                                                "Certified H-1B filings per month, October to June, FY2024 to FY2026",
                                                (0, f"Shutdown, October 2025: {num(oct25['certified_filings'])}")))
        + sub("Placed at a client", season_chart(rows, "placed_filings", SEASON_PEOPLE, 552, 280,
                                                 "Certified filings that place the worker at a client, per month, October to June, "
                                                 "FY2024 to FY2026"))
        + "</div>"
    )

    share = [(YL[y], ys[y]["placed_share"]) for y in YEARS]
    s3, h3 = year_line(share, 540, 230, lambda v: f"{v * 100:.1f}%", "Share of certified filings that place a worker at a client",
                       y_max=0.26, y_min=0.14, color=PEOPLE)

    firms = ["Tata Consultancy Services", "Cognizant", "Infosys", "HCL"]
    per = {}
    for y in YEARS:
        per[y] = {f[0] if isinstance(f, list) else f["firm"]: (f[1] if isinstance(f, list) else f["filings"]) for f in ys[y]["top_firms_by_filings"]}
    smalls = []
    ymax_f = max(per[y].get(f, 0) for y in YEARS for f in firms) * 1.18
    for f in firms:
        series = [(YL[y][-2:].join(["'", ""]) if False else YL[y].replace("FY20", "’"), per[y].get(f)) for y in YEARS]
        have = [(lab, v) for lab, v in series if v is not None]
        if len(have) < 5:
            series = have
        sv, sh_ = mini_years(series, 262, 150, ymax_f, len(have) == 5)
        smalls.append(f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12.5px; font-weight: 700; color: {INK}">'
                      f'{t(f)}</span>{sv}</div>')
    vend = '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">' + "".join(smalls) + "</div>"

    us = B.load("analysis/week04_staffing.json")["uscis_series"]
    s5, h5 = two_lines([r["placing"]["initial_denial_rate"] for r in us], [r["direct"]["initial_denial_rate"] for r in us], 540, 240,
                       lambda v: f"{v * 100:.1f}%", "USCIS denials of first-time petitions, placing firms against direct employers",
                       0.04, ["placing firms", "direct employers"], [PEOPLE, ACCESS])

    lr = ctry["lottery"]
    draws = [("March 2021", lr["2022"]["registrations"]), ("March 2022", lr["2023"]["registrations"]), ("March 2023", lr["2024"]["registrations"])]
    s6, h6 = year_bars(draws, 540, 230, lambda v: num(v), "H-1B lottery registrations per draw", partial_last=False,
                       sub=["FY2022 cap", "FY2023 cap", "FY2024 cap"])
    per_app = [lot["2023"]["funnel"]["registrations_per_approval"], lot["2024"]["funnel"]["registrations_per_approval"]]

    cl = [ys[y]["clients"] for y in YEARS]
    fm = [ys[y]["firms"] for y in YEARS]
    s7, h7 = two_lines(cl, fm, 540, 240, lambda v: num(v), "Client companies and placing firms per year", 24000,
                       ["client companies", "firms that place"], [INK, PEOPLE])

    fall = shift["oct_jun"]["totals_change"]["fy25_to_fy26"]["certified_filings"]["percent"]
    lead = (f"Certified filings fell 14% in FY2023, rose to 537,796 in FY2025, and fell {abs(fall):.1f}% in FY2026 against the same "
            "months a year earlier. The share placed at a client fell every year from FY2023: 22.6%, 21.3%, 19.5%, and 18.1% in the "
            "first nine months of FY2026.")
    assert fall < 0 and oj["FY2026"]["certified_filings"] < oj["FY2025"]["certified_filings"]
    assert oj["FY2026"]["placed_share"] < oj["FY2025"]["placed_share"]
    chk = (ys["2023"]["certified_filings"] / ys["2022"]["certified_filings"] - 1, [round(ys[y]["placed_share"] * 100, 1) for y in YEARS])
    assert round(chk[0] * 100) == -14 and chk[1][1:] == [22.6, 21.3, 19.5, 18.1], chk
    head = (
        opener("↗", "Five years of filings", "FY2022 to FY2026", t(lead), "five-years")
        + "\n"
        + notice("How to read the years.", t(fy_note() + " October 2025, the month of the federal shutdown, holds 1,306 certified "
                                                        "filings against 35,258 a year earlier, so compare FY2026 with earlier years on "
                                                        "matching months."), "!")
    )
    grid = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">'
        + panel("Certified H-1B filings", "Each fiscal year. FY2026 is outlined: nine months, not a year.", s1)
        + panel("The same months, compared", "October to June of each year: the fair way to set FY2026 beside the two before it.", s1b)
        + panel("Month by month", "October to June of each fiscal year, the months FY2026 covers.", monthly, span=2)
        + panel("Placed at a client", "Share of certified filings that put the worker at another company.", s3)
        + panel("USCIS denials", "Share of first-time petitions denied, employers with 20 or more certified filings. FY2026 runs "
                "October to June.", s5)
        + panel("The four largest placing firms", "Placed filings each firm files per fiscal year, on one scale. Hollow: FY2026, nine months. HCL "
                "leaves the top eight in FY2026.", vend, span=2)
        + panel("The lottery", f"Registrations per draw. One approved petition took {per_app[0]:.1f} registrations in the March 2022 "
                f"draw and {per_app[1]:.1f} in March 2023; USCIS’s data ends there.", s6)
        + panel("Clients and firms", "Client companies named on a placed filing, and the firms that place workers, per fiscal year.", s7)
        + "</div>"
    )
    content = head + "\n" + grid
    body = "\n".join([topbar("None"), body_row(rail("none"), content, 24)])
    return page("Week 4 · five years of filings", W, 2640, body)


def mini_years(series, width, height, ymax, full):
    L, R, T, Bm = 8, 8, 20, 24
    X = lambda i: L + i * (width - L - R) / 4
    Y = lambda v: T + (ymax - v) * (height - T - Bm) / ymax
    out = [svg_open(width, height, "Filings per fiscal year")]
    out.append(line(L, Y(0), width - R, Y(0), LINE, 1))
    pts = [(X(i), Y(v)) for i, (_, v) in enumerate(series)]
    solid = pts[:-1] if full else pts
    out.append(path("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in solid), "none", INK, 2.2))
    if full:
        out.append(line(pts[-2][0], pts[-2][1], pts[-1][0], pts[-1][1], INK, 1.8, "4 4"))
    for i, ((lab, v), (x, y)) in enumerate(zip(series, pts)):
        last = full and i == len(series) - 1
        out.append(circle(x, y, 4, "#ffffff" if last else INK, INK if last else "#ffffff", 1.6))
        out.append(text(x, y - 8, num(v), 10.5, INK, 700, "middle"))
        out.append(text(x, height - 6, lab, 10.5, INK_MUTE, 400, "middle", tabular=False))
    out.append("</svg>")
    return "\n".join(out), height


# ================================================================ explore: the 40 metros (the week 3 inspector)

def project(w, h, pads=(30, 16, 12)):
    skip = {"Alaska", "Hawaii", "Puerto Rico"}
    shapes = []
    for f in B.usa["features"]:
        if f["properties"]["name"] in skip:
            continue
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        shapes.append([[B.albers(lon, lat) for lon, lat in ring] for poly in polys for ring in poly])
    xs = [p[0] for s in shapes for r in s for p in r]
    ys_ = [p[1] for s in shapes for r in s for p in r]
    pl, pr, pv = pads
    sc = min((w - pl - pr) / (max(xs) - min(xs)), (h - 2 * pv) / (max(ys_) - min(ys_)))
    ox = pl + ((w - pl - pr) - sc * (max(xs) - min(xs))) / 2 - sc * min(xs)
    oy = pv + ((h - 2 * pv) - sc * (max(ys_) - min(ys_))) / 2 - sc * min(ys_)

    def P(lon, lat):
        x, y = B.albers(lon, lat)
        return ox + sc * x, oy + sc * y

    states = []
    for s in shapes:
        d = []
        for ring in s:
            pts = B.dp([(ox + sc * x, oy + sc * y) for x, y in ring], 0.5)
            if len(pts) >= 4:
                d.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
        if d:
            states.append(path("".join(d), MAP_FILL, MAP_EDGE, 0.8))
    return P, "\n".join(states)


def dot_r(c, fmax, big=11.5):
    return 2.6 + big * math.sqrt(c["filings"] / fmax)


def explore_metros():
    mw, mh = 780, 470
    P, states = project(mw, mh, (40, 16, 12))
    pos = {cid: P(c["lon"], c["lat"]) for cid, c in CITY.items()}
    fmax = max(c["filings"] for c in CITY.values())
    edges = place["backbone"]["graphs"]["0.2"]["edges"]
    wmax = max(e[2] for e in edges)
    who = {r["id"]: r for r in ww["rows"]}
    third = {"low": "lowest third", "mid": "middle third", "high": "top third"}
    ranked = [c["id"] for c in sorted(CITY.values(), key=lambda c: -c["filings"])]
    ids = ranked
    svg = [svg_open(mw, mh, "The 40 metro areas: click one to inspect it"), states]
    for a_, b_, wt in sorted(edges, key=lambda e: e[2]):
        (x1, y1), (x2, y2) = pos[a_], pos[b_]
        svg.append(line(x1, y1, x2, y2, INK, 0.3 + 1.4 * math.sqrt(wt / wmax), op=0.12, cap="round"))
    for cid in ids:
        mine = [e for e in edges if cid in (e[0], e[1])]
        svg.append(f'<g visibility="{{{{ v_{cid} }}}}">')
        for a_, b_, wt in mine:
            (x1, y1), (x2, y2) = pos[a_], pos[b_]
            svg.append(line(x1, y1, x2, y2, INK, 0.8 + 3 * math.sqrt(wt / wmax), op=0.8, cap="round"))
        svg.append("</g>")
    for cid in sorted(ids, key=lambda i: -CITY[i]["filings"]):
        x, y = pos[cid]
        r = dot_r(CITY[cid], fmax)
        svg.append(circle(x, y, r, B.GROUP_ON_LIGHT[CITY[cid]["community"]], "#ffffff", 1.2))
    for cid in ids:
        x, y = pos[cid]
        r = dot_r(CITY[cid], fmax)
        svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r + 5:.1f}" onClick="{{{{ pick_{cid} }}}}" aria-hidden="true" '
                   'style="fill: #ffffff; opacity: 0; cursor: pointer"></circle>')
    svg.append('<circle cx="{{ selX }}" cy="{{ selY }}" r="{{ selR }}" style="fill: none; stroke: %s; stroke-width: 2.2px"></circle>' % INK)
    svg.append('<text x="{{ selX }}" y="{{ labY }}" style="font-size: 12px; fill: %s; font-weight: 700; text-anchor: middle">{{ name }}</text>' % INK)
    svg.append("</svg>")

    M = {}
    for i, cid in enumerate(ranked):
        c = CITY[cid]
        w = who[cid]
        mine = sorted([e for e in edges if cid in (e[0], e[1])], key=lambda e: -e[2])
        x, y = pos[cid]
        r = dot_r(c, fmax)
        M[cid] = {
            "name": c["name"], "state": c["state"], "group": B.GROUP_NAME[c["community"]], "gcol": B.GROUP_ON_LIGHT[c["community"]],
            "filings": num(c["filings"]), "employers": num(c["employers"]),
            "top": f"{c['top_employer']}, {pct(c['top_share'])}", "placed": pct(w["placed_share"], 0), "region": c["census"],
            "links": [{"to": CITY[e[1] if e[0] == cid else e[0]]["name"], "w": num(e[2])} for e in mine[:3]],
            "x": round(x, 1), "y": round(y, 1), "r": round(r + 4, 1), "ly": round(y - r - 8, 1),
        }
    buttons = "".join(
        f'<button type="button" onClick="{{{{ pick_{cid} }}}}" aria-pressed="{{{{ p_{cid} }}}}" style="display: flex; align-items: center; gap: 6px; '
        f'padding: 5px 8px; border-radius: 8px; border: 1px solid {LINE}; background: {{{{ bg_{cid} }}}}; color: {INK}; font-family: inherit; '
        f'font-size: 11.5px; font-weight: 600; text-align: left; cursor: pointer"><span style="width: 8px; height: 8px; border-radius: 999px; '
        f'flex: none; background: {B.GROUP_ON_LIGHT[CITY[cid]["community"]]}"></span>{t(CITY[cid]["name"])}</button>'
        for cid in ranked)
    rows = [("Filings", "filings"), ("Companies", "employers"), ("Largest filer", "top"), ("Placed at a client", "placed"),
            ("Census region", "region")]
    dl = "".join(
        f'<div style="display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-top: 1px solid {LINE_SOFT}">'
        f'<dt style="font-size: 12px; color: {INK_SOFT}">{t(k)}</dt><dd style="margin: 0; font-size: 12px; font-weight: 700; color: {INK}; '
        f'text-align: right; font-variant-numeric: tabular-nums">{{{{ {v} }}}}</dd></div>' for k, v in rows)
    inspector = (
        f'<aside aria-label="Selected metro" aria-live="polite" style="background: {CARD}; border: 1px solid {LINE}; border-radius: 14px; '
        'padding: 16px 18px; display: flex; flex-direction: column; gap: 10px">'
        + label_caps("Selected metro")
        + f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-size: 20px; font-weight: 700; color: {INK}">{{{{ name }}}}</span>'
        f'<span style="font-size: 12px; color: {INK_MUTE}">{{{{ state }}}} · FY2025</span></div>'
        f'<div><span style="display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 999px; background: {GROUND}; '
        f'border: 1px solid {LINE}; font-size: 11.5px; font-weight: 600; color: {INK}"><span style="width: 9px; height: 9px; border-radius: 999px; '
        'background: {{ gcol }}"></span>{{ group }} group</span></div>'
        f'<dl style="margin: 0">{dl}</dl>'
        + label_caps("Strongest links", INK_MUTE, 10.5)
        + '<sc-for list="{{ links }}" as="l" hint-placeholder-count="3">'
        f'<div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0"><span style="color: {INK}">{{{{ l.to }}}}</span>'
        f'<span style="color: {INK_SOFT}; font-variant-numeric: tabular-nums">{{{{ l.w }}}}</span></div></sc-for></aside>'
    )
    card_html = card(
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        + label_caps("Explore", ACCENT)
        + f'<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: {INK}">The 40 metros, one at a time</h3>'
        + para("Click a metro on the map or in the list. The inspector shows who files there, and the map lights up the links the backbone "
               "keeps for it at α = 0.2. Colours are the three metro groups.", measure="760px")
        + "</div>\n"
        '<div style="display: grid; grid-template-columns: 780px minmax(0, 1fr); gap: 24px; align-items: start">\n'
        f'<div style="display: flex; flex-direction: column; gap: 12px">{"".join(svg)}'
        f'<div role="group" aria-label="Pick a metro" style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px">{buttons}</div></div>\n'
        f'{inspector}\n</div>'
    )
    js_m = json.dumps(M, ensure_ascii=False)
    script = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const M = {js_m};\n"
        f"const IDS = {json.dumps(ranked)};\n"
        "const st = this.state || {};\n"
        "const sel = M[st.sel] ? st.sel : '35620';\n"
        "const m = M[sel];\n"
        "const out = { name: m.name, state: m.state, group: m.group, gcol: m.gcol, filings: m.filings, employers: m.employers,\n"
        "  top: m.top, placed: m.placed, region: m.region, links: m.links,\n"
        "  selX: m.x, selY: m.y, selR: m.r, labY: m.ly };\n"
        "IDS.forEach((id) => {\n"
        "  out['pick_' + id] = () => this.setState({ sel: id });\n"
        "  out['v_' + id] = id === sel ? 'visible' : 'hidden';\n"
        "  out['p_' + id] = id === sel;\n"
        f"  out['bg_' + id] = id === sel ? '{ACCESS_SOFT}' : '{CARD}';\n"
        "});\n"
        "return out;\n"
        "}\n"
        "}"
    )
    body = "\n".join([topbar("Where"), body_row(rail("1"), card_html, 24)])
    return page("Week 4 · explore the 40 metros", W, 1460, body, script), 1460, M, ranked


# ================================================================ explore: strip the hairball (course week 4, section 8)

ALPHAS = ["0.5", "0.3", "0.2", "0.1", "0.05"]


def explore_backbone():
    mw, mh = 800, 470
    P, states = project(mw, mh, (40, 16, 12))
    pos = {cid: P(c["lon"], c["lat"]) for cid, c in CITY.items()}
    fmax = max(c["filings"] for c in CITY.values())
    graphs = place["backbone"]["graphs"]
    svg = [svg_open(mw, mh, "The metro backbone at the chosen alpha"), states]
    for i, a_ in enumerate(ALPHAS):
        g = graphs[a_]
        gc = set(g["nodes"])
        wmax = max(e[2] for e in g["edges"])
        svg.append(f'<g visibility="{{{{ v{i} }}}}">')
        for x_, y_, wt in sorted(g["edges"], key=lambda e: e[2]):
            (x1, y1), (x2, y2) = pos[x_], pos[y_]
            svg.append(line(x1, y1, x2, y2, INK, 0.35 + 2.2 * math.sqrt(wt / wmax), op=0.3, cap="round"))
        for cid, c in sorted(CITY.items(), key=lambda kv: -kv[1]["filings"]):
            x, y = pos[cid]
            r = dot_r(c, fmax, 10)
            if cid in gc:
                svg.append(circle(x, y, r, B.GROUP_ON_LIGHT[c["community"]], "#ffffff", 1.1))
            else:
                svg.append(circle(x, y, r, "#ffffff", INK_MUTE, 1.3))
        svg.append("</g>")
    svg.append("</svg>")

    bs = ww["backbone_sweep"]
    cw, ch = 1136, 220
    L, R, T, Bm = 56, 20, 18, 40
    lx0, lx1 = math.log10(0.004), math.log10(1.0)
    X = lambda al: L + (math.log10(max(al, 0.004)) - lx0) * (cw - L - R) / (lx1 - lx0)
    Y = lambda v: T + (40 - v) * (ch - T - Bm) / 40
    g2 = [svg_open(cw, ch, "Metros in the largest connected piece as alpha falls")]
    for v in (0, 10, 20, 30, 40):
        g2.append(line(L, Y(v), cw - R, Y(v), GRID, 1))
        g2.append(text(L - 8, Y(v) + 4, str(v), 11, INK_MUTE, 400, "end"))
    pts = sorted(((max(p["alpha"], 0.004), p["gc_size"]) for p in bs), key=lambda p: -p[0])
    d = f"M{X(pts[0][0]):.1f} {Y(pts[0][1]):.1f}"
    prev = pts[0][1]
    for al, gcs in pts[1:]:
        d += f" L{X(al):.1f} {Y(prev):.1f} L{X(al):.1f} {Y(gcs):.1f}"
        prev = gcs
    g2.append(path(d, "none", INK, 2))
    for al in (0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1.0):
        g2.append(text(X(al), ch - 20, f"{al:g}", 11, INK_MUTE, 400, "middle"))
    g2.append(text(cw - R, ch - 4, "α, looser to the right →", 11, INK_MUTE, 400, "end", tabular=False))
    g2.append('<line x1="{{ mx }}" y1="%d" x2="{{ mx }}" y2="%d" style="stroke: %s; stroke-width: 1.6px"></line>' % (T - 6, ch - Bm, ACCENT))
    g2.append('<circle cx="{{ mx }}" cy="{{ my }}" r="6" style="fill: none; stroke: %s; stroke-width: 2px"></circle>' % ACCENT)
    g2.append("</svg>")

    bb = place["backbone"]
    info = {
        "0.5": "668 links of the full 780: still close to the hairball.",
        "0.3": "419 links, and every metro still in one piece.",
        "0.2": bb["choice_note"].split(". ")[0] + ".",
        "0.1": "59 links, and 32 metros left in the largest piece.",
        "0.05": bb["snap_note"].split("; ")[0] + ".",
    }
    S = []
    for a_ in ALPHAS:
        idx = bb["alphas"].index(float(a_))
        gcs = bb["gc_size"][idx]
        S.append({"alpha": a_, "links": num(bb["edges_kept"][idx]), "gc": str(gcs), "info": info[a_],
                  "mx": round(X(float(a_)), 1), "my": round(Y(gcs), 1)})
    assert [s["links"] for s in S] == [num(v) for v in (668, 419, 180, 59, 25)], S
    seg = "".join(
        f'<button type="button" onClick="{{{{ s{i} }}}}" aria-pressed="{{{{ p{i} }}}}" style="padding: 7px 14px; border-radius: 999px; '
        f'border: 1px solid {LINE}; background: {{{{ bg{i} }}}}; color: {{{{ fg{i} }}}}; font-family: inherit; font-size: 13px; font-weight: 700; '
        f'cursor: pointer; font-variant-numeric: tabular-nums">{a_}</button>' for i, a_ in enumerate(ALPHAS))
    card_html = card(
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        + label_caps("Explore", ACCENT)
        + f'<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: {INK}">Strip the hairball</h3>'
        + para("Every pair of the 40 metros shares some employer, so the full network is one hairball of 780 links. The disparity filter keeps "
               "a link when it carries an unusually large share of either metro’s total weight; " + gloss("α", "alpha")
               + " is the test’s threshold, and a smaller α keeps fewer links. Step α down and watch the map come apart.",
               measure="820px")
        + "</div>\n"
        f'<div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap"><span style="font-size: 13px; font-weight: 700; color: {INK}">α</span>'
        f'<div role="group" aria-label="Disparity filter alpha" style="display: flex; gap: 6px">{seg}</div>'
        f'<label for="alpha-i" style="font-size: 12px; color: {INK_SOFT}">or slide</label>'
        f'<input id="alpha-i" type="range" min="0" max="4" step="1" value="{{{{ i }}}}" onChange="{{{{ onI }}}}" style="width: 220px; accent-color: {ACCENT}" /></div>\n'
        '<div style="display: grid; grid-template-columns: 800px minmax(0, 1fr); gap: 24px; align-items: start">\n'
        + "".join(svg)
        + f'\n<div aria-live="polite" style="display: flex; flex-direction: column; gap: 14px; padding-top: 6px">'
        + stat_tile("{{ links }}", "links kept")
        + stat_tile("{{ gc }} of 40", "metros in the largest connected piece")
        + f'<p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: {INK}">{{{{ info }}}}</p>'
        + f'<p style="margin: 0; font-size: 12px; line-height: 1.5; color: {INK_SOFT}">Coloured dots: the largest connected piece, coloured by metro '
        "group. Hollow dots: metros cut off from it.</p></div>\n</div>\n"
        + figure("Metros in the largest piece as the filter tightens", "Each step is one or more links removed, least significant first. "
                 "The ring marks the α chosen above.", "\n".join(g2))
    )
    js_s = json.dumps(S, ensure_ascii=False)
    script = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const S = {js_s};\n"
        "const st = this.state || {};\n"
        "const i = typeof st.i === 'number' ? st.i : 2;\n"
        "const s = S[i];\n"
        "const set = (v) => this.setState({ i: Math.max(0, Math.min(4, v)) });\n"
        "const out = { i: i, links: s.links, gc: s.gc, info: s.info, mx: s.mx, my: s.my, onI: (e) => set(Number(e.target.value)) };\n"
        "for (let k = 0; k < 5; k++) {\n"
        "  out['v' + k] = k === i ? 'visible' : 'hidden';\n"
        "  out['p' + k] = k === i;\n"
        f"  out['bg' + k] = k === i ? '{ACCENT}' : '{CARD}';\n"
        f"  out['fg' + k] = k === i ? '#ffffff' : '{INK}';\n"
        "  out['s' + k] = () => set(k);\n"
        "}\n"
        "return out;\n"
        "}\n"
        "}"
    )
    body = "\n".join([topbar("Where"), body_row(rail("1", "B"), card_html, 24)])
    return page("Week 4 · explore the backbone", W, 1500, body, script), 1500, S


# ================================================================ explore: clients by size and loyalty, five years

def explore_clients():
    firms = scl["firms"]
    xw, xh = 720, 440
    L, R, T, Bm = 56, 16, 16, 44
    x0, x1 = math.log10(20), math.log10(3000)
    X = lambda v: L + (math.log10(min(max(v, 20), 3000)) - x0) * (xw - L - R) / (x1 - x0)
    Y = lambda s: T + (1 - s) * (xh - T - Bm)
    svg = [svg_open(xw, xh, "Client companies by placed filings and by the share from their largest vendor")]
    for v in (0, 0.25, 0.5, 0.75, 1):
        svg.append(line(L, Y(v), xw - R, Y(v), GRID, 1))
        svg.append(text(L - 8, Y(v) + 4, f"{v * 100:.0f}%", 11, INK_MUTE, 400, "end"))
    for v in (20, 50, 100, 200, 500, 1000, 2000):
        svg.append(line(X(v), T, X(v), xh - Bm, GRID, 1))
        svg.append(text(X(v), xh - Bm + 16, num(v), 11, INK_MUTE, 400, "middle"))
    svg.append(text(xw - R, xh - 6, "placed filings the client receives → (log scale)", 11, INK_MUTE, 400, "end", tabular=False))
    svg.append(f'<text x="{L - 44}" y="{T + 4}" style="font-size: 11px; fill: {INK_MUTE}; text-anchor: start">from its largest vendor</text>')
    counts = {}
    for i, y in enumerate(YEARS):
        shown = scl["years"][y]["shown"]
        counts[y] = len(shown)
        svg.append(f'<g visibility="{{{{ v{i} }}}}">')
        for c in shown:
            share = c["top"][0][1] / c["filings"] if c["top"] else 0
            svg.append(circle(X(c["filings"]), Y(share), 3, INK, None, op=0.3))
        svg.append("</g>")
    svg.append('<circle cx="{{ cx }}" cy="{{ cy }}" r="9" visibility="{{ ringVis }}" style="fill: none; stroke: %s; stroke-width: 2.4px"></circle>' % INK)
    svg.append('<text x="{{ cx }}" y="{{ ly }}" visibility="{{ ringVis }}" style="font-size: 12px; fill: %s; font-weight: 700; text-anchor: middle">{{ client }}</text>' % INK)
    svg.append("</svg>")

    in_all = [c["name"] for c in scl["years"]["2025"]["shown"]
              if all(any(d["name"] == c["name"] for d in scl["years"][y]["shown"]) for y in YEARS)]
    picks = in_all[:10]
    C = {}
    for name in picks:
        per = {}
        spark = []
        for y in YEARS:
            c = next(d for d in scl["years"][y]["shown"] if d["name"] == name)
            share = c["top"][0][1] / c["filings"]
            vend = [{"n": firms[fi], "v": num(n), "w": f"{100 * n / c['filings']:.1f}%"} for fi, n in c["top"][:6]]
            if c["rest"]:
                vend.append({"n": f"{num(c['vendors'] - len(c['top']))} other firms", "v": num(c["rest"]), "w": f"{100 * c['rest'] / c['filings']:.1f}%"})
            per[y] = {"filings": num(c["filings"]), "vendors": num(c["vendors"]), "top": firms[c["top"][0][0]], "share": pct(share),
                      "cx": round(X(c["filings"]), 1), "cy": round(Y(share), 1), "vend": vend}
            spark.append(c["filings"])
        C[name] = {"per": per, "spark": spark}
    # a sparkline per client: filings per year
    sw, sh = 300, 90
    smax = max(max(C[n]["spark"]) for n in picks) * 1.1
    SX = lambda i: 14 + i * (sw - 28) / 4
    SY = lambda v: 10 + (smax - v) * (sh - 30) / smax
    spark_svg = [svg_open(sw, sh, "The selected client's placed filings per fiscal year")]
    for k, name in enumerate(picks):
        pts = [(SX(i), SY(v)) for i, v in enumerate(C[name]["spark"])]
        spark_svg.append(f'<g visibility="{{{{ sp{k} }}}}">')
        spark_svg.append(path("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts[:-1]), "none", INK, 2))
        spark_svg.append(line(pts[-2][0], pts[-2][1], pts[-1][0], pts[-1][1], INK, 1.6, "3 3"))
        for i, (x, y) in enumerate(pts):
            spark_svg.append(circle(x, y, 3.2, "#ffffff" if i == 4 else INK, INK if i == 4 else "#ffffff", 1.4))
        spark_svg.append("</g>")
    for i, y in enumerate(YEARS):
        spark_svg.append(text(SX(i), sh - 4, YL[y].replace("FY20", "’"), 10.5, INK_MUTE, 400, "middle", tabular=False))
    spark_svg.append('<line x1="{{ spx }}" y1="6" x2="{{ spx }}" y2="%d" style="stroke: %s; stroke-width: 1.4px; stroke-dasharray: 3 2"></line>' % (sh - 18, ACCENT))
    spark_svg.append("</svg>")

    yseg = "".join(
        f'<button type="button" onClick="{{{{ y{i} }}}}" aria-pressed="{{{{ yp{i} }}}}" style="padding: 7px 12px; border-radius: 999px; border: 1px solid {LINE}; '
        f'background: {{{{ ybg{i} }}}}; color: {{{{ yfg{i} }}}}; font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer">'
        f'{YL[y]}{" · Oct–Jun" if y == "2026" else ""}</button>' for i, y in enumerate(YEARS))
    cseg = "".join(
        f'<button type="button" onClick="{{{{ c{k} }}}}" aria-pressed="{{{{ cp{k} }}}}" style="padding: 5px 10px; border-radius: 8px; border: 1px solid {LINE}; '
        f'background: {{{{ cbg{k} }}}}; color: {INK}; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer">{t(name)}</button>'
        for k, name in enumerate(picks))
    inspector = (
        f'<aside aria-label="Selected client" aria-live="polite" style="background: {CARD}; border: 1px solid {LINE}; border-radius: 14px; '
        'padding: 16px 18px; display: flex; flex-direction: column; gap: 10px">'
        + label_caps("Selected client")
        + f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-size: 20px; font-weight: 700; color: {INK}">{{{{ client }}}}</span>'
        f'<span style="font-size: 12px; color: {INK_MUTE}">{{{{ year }}}}</span></div>'
        + '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">'
        + stat_tile("{{ filings }}", "placed filings") + stat_tile("{{ vendors }}", "firms place workers here")
        + "</div>"
        + f'<p style="margin: 0; font-size: 12.5px; color: {INK_SOFT}">Largest vendor: <b style="color: {INK}">{{{{ top }}}}</b>, {{{{ share }}}} of its filings.</p>'
        + label_caps("Who supplies it", INK_MUTE, 10.5)
        + '<sc-for list="{{ vend }}" as="f" hint-placeholder-count="6">'
        '<div style="display: flex; flex-direction: column; gap: 3px; padding: 3px 0">'
        f'<div style="display: flex; justify-content: space-between; gap: 8px; font-size: 12px"><span style="color: {INK}">{{{{ f.n }}}}</span>'
        f'<span style="color: {INK_SOFT}; font-variant-numeric: tabular-nums">{{{{ f.v }}}}</span></div>'
        f'<div style="height: 6px; border-radius: 3px; background: {LINE_SOFT}"><div style="height: 6px; border-radius: 3px; background: {PEOPLE}; width: {{{{ f.w }}}}"></div></div>'
        "</div></sc-for>"
        + label_caps("Placed filings, FY2022 to FY2026", INK_MUTE, 10.5)
        + "".join(spark_svg)
        + "</aside>"
    )
    card_html = card(
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        + label_caps("Explore", ACCENT)
        + f'<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: {INK}">Clients by size and by loyalty, five years</h3>'
        + para("One dot per client company with 20 or more H-1B filings that placed a worker there in the year. Further right, more filings; "
               "higher up, more of them from a single outsourcing firm. Pick a year, then a client, to see who supplies it.", measure="820px")
        + "</div>\n"
        f'<div style="display: flex; flex-direction: column; gap: 10px"><div role="group" aria-label="Fiscal year" style="display: flex; gap: 6px; flex-wrap: wrap">{yseg}</div>'
        f'<div role="group" aria-label="Client" style="display: flex; gap: 6px; flex-wrap: wrap">{cseg}</div></div>\n'
        '<div style="display: grid; grid-template-columns: 720px minmax(0, 1fr); gap: 24px; align-items: start">\n'
        f'<div style="display: flex; flex-direction: column; gap: 8px">{"".join(svg)}'
        f'<span style="font-size: 12px; color: {INK_SOFT}">{{{{ count }}}} clients with 20 or more placed filings in {{{{ year }}}}.</span></div>\n'
        + inspector + "\n</div>"
    )
    per_year_counts = {y: num(counts[y]) for y in YEARS}
    js = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const C = {json.dumps(C, ensure_ascii=False)};\n"
        f"const PICKS = {json.dumps(picks, ensure_ascii=False)};\n"
        f"const YEARS = {json.dumps(YEARS)};\n"
        f"const LABEL = {json.dumps({y: YL[y] + (' (Oct' + chr(8211) + 'Jun)' if y == '2026' else '') for y in YEARS}, ensure_ascii=False)};\n"
        f"const COUNT = {json.dumps(per_year_counts)};\n"
        f"const SPX = {json.dumps([round(SX(i), 1) for i in range(5)])};\n"
        "const st = this.state || {};\n"
        "const yi = typeof st.yi === 'number' ? st.yi : 3;\n"
        "const ci = typeof st.ci === 'number' ? st.ci : 0;\n"
        "const y = YEARS[yi];\n"
        "const name = PICKS[ci];\n"
        "const p = C[name].per[y];\n"
        "const out = { client: name, year: LABEL[y], count: COUNT[y], filings: p.filings, vendors: p.vendors, top: p.top, share: p.share,\n"
        "  vend: p.vend, cx: p.cx, cy: p.cy, ly: p.cy - 14, ringVis: 'visible', spx: SPX[yi] };\n"
        "for (let k = 0; k < 5; k++) {\n"
        "  out['v' + k] = k === yi ? 'visible' : 'hidden';\n"
        "  out['y' + k] = () => this.setState({ yi: k });\n"
        "  out['yp' + k] = k === yi;\n"
        f"  out['ybg' + k] = k === yi ? '{ACCENT}' : '{CARD}';\n"
        f"  out['yfg' + k] = k === yi ? '#ffffff' : '{INK}';\n"
        "}\n"
        "for (let k = 0; k < PICKS.length; k++) {\n"
        "  out['c' + k] = () => this.setState({ ci: k });\n"
        "  out['cp' + k] = k === ci;\n"
        f"  out['cbg' + k] = k === ci ? '{ACCESS_SOFT}' : '{CARD}';\n"
        "  out['sp' + k] = k === ci ? 'visible' : 'hidden';\n"
        "}\n"
        "return out;\n"
        "}\n"
        "}"
    )
    body = "\n".join([topbar("Staffing"), body_row(rail("3"), card_html, 24)])
    return page("Week 4 · explore the clients", W, 1320, body, js), 1320, picks


def all_boards():
    fy = five_years()
    em = explore_metros()
    eb = explore_backbone()
    ec = explore_clients()
    return [
        ("FiveYears.dc.html", "Five years of filings, FY2022 to FY2026", fy, 2640, False),
        ("ExploreMetros.dc.html", "Explore · the 40 metros, one at a time", em[0], em[1], True),
        ("ExploreBackbone.dc.html", "Explore · strip the hairball", eb[0], eb[1], True),
        ("ExploreClients.dc.html", "Explore · clients by size and loyalty, five years", ec[0], ec[1], True),
    ]
