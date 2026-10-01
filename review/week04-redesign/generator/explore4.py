"""The course's four community explorables, rebuilt on the 40-metro network from public/weeks/week04/data/explore.json."""
import json
import math

from kit import *  # noqa: F401,F403
import kit
import build as B
import extra as E

EX = B.load("public/weeks/week04/data/explore.json")
place = B.place
CITY = {c["id"]: c for c in place["cities"]}
IDS = [m["id"] for m in EX["metros"]]
NAME = {m["id"]: m["name"] for m in EX["metros"]}
GROUP = {m["id"]: m["community"] for m in EX["metros"]}
RAMP = [INK, "#56708f", "#9fb0c6"]   # the three largest pieces, one ink ramp: pieces are not the metro groups
MW, MH = 780, 470


def base_map(title_aria):
    P, states = E.project(MW, MH, (40, 16, 12))
    pos = {cid: P(c["lon"], c["lat"]) for cid, c in CITY.items()}
    return pos, [svg_open(MW, MH, title_aria), states]


def dot(cid, pos, fill_hole=None, fill=None, r_extra=0):
    fmax = max(c["filings"] for c in CITY.values())
    x, y = pos[cid]
    r = E.dot_r(CITY[cid], fmax, 10) + r_extra
    if fill_hole:
        return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" style="fill: {{{{ {fill_hole} }}}}; stroke: #ffffff; '
                'stroke-width: 1.2px"></circle>')
    return circle(x, y, r, fill, "#ffffff", 1.2)


def btn(label, hole, primary=False, pressed_hole=None):
    bg, fg = (INK, "#ffffff") if primary else (CARD, INK)
    pr = f' aria-pressed="{{{{ {pressed_hole} }}}}"' if pressed_hole else ""
    return (f'<button type="button" onClick="{{{{ {hole} }}}}"{pr} style="padding: 8px 14px; border-radius: 9px; border: 1px solid {LINE}; '
            f'background: {bg}; color: {fg}; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer">{t(label)}</button>')


def shell(title, lead, controls, left, right, below=""):
    return card(
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        + label_caps("Explore · after the course’s week 4", ACCENT)
        + f'<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: {INK}">{t(title)}</h3>'
        + para(lead, measure="860px") + "</div>\n"
        + f'<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">{controls}</div>\n'
        + f'<div style="display: grid; grid-template-columns: {MW}px minmax(0, 1fr); gap: 24px; align-items: start">\n{left}\n'
        + f'<div aria-live="polite" style="display: flex; flex-direction: column; gap: 12px">{right}</div>\n</div>'
        + (f"\n{below}" if below else "")
    )


def readout_row(label, hole):
    return (f'<div style="display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-top: 1px solid {LINE_SOFT}">'
            f'<span style="font-size: 12.5px; color: {INK_SOFT}">{t(label)}</span>'
            f'<span style="font-size: 12.5px; font-weight: 700; color: {INK}; text-align: right; font-variant-numeric: tabular-nums">{{{{ {hole} }}}}</span></div>')


def board_page(title, fname_active, rail_letter, body_card, script, h):
    body = "\n".join([topbar("Where"), body_row(rail("1", rail_letter), body_card, 24)])
    return page(title, W, h, body, script), h


def steps02(lo, hi, step=0.02):
    """Round axis bounds and ticks every `step` that hold [lo, hi]."""
    a, b = math.floor(lo / step + 1e-9) * step, math.ceil(hi / step - 1e-9) * step
    return (a, b), [round(a + i * step, 6) for i in range(int(round((b - a) / step)) + 1)]


def line_chart(xs, ys, width, height, y_rng, aria, ref=None, ref_label=None, fmt=lambda v: f"{v:.3f}", x_label="", marker=True, ticks=None):
    L, R, T, Bm = 56, 20, 16, 36
    y0, y1 = y_rng
    n = len(xs)
    X = lambda i: L + i * (width - L - R) / max(n - 1, 1)
    Y = lambda v: T + (y1 - v) * (height - T - Bm) / (y1 - y0)
    out = [svg_open(width, height, aria)]
    for v in (ticks if ticks is not None else [y0 + (y1 - y0) * k / 4 for k in range(5)]):
        out.append(line(L, Y(v), width - R, Y(v), GRID, 1))
        out.append(text(L - 8, Y(v) + 4, fmt(v), 11, INK_MUTE, 400, "end"))
    if ref is not None:
        out.append(line(L, Y(ref), width - R, Y(ref), INK_MUTE, 1.4, "5 4"))
        if ref_label:
            out.append(text(width - R, Y(ref) - 6, ref_label, 11, INK_SOFT, 600, "end", tabular=False))
    out.append(path("M" + " L".join(f"{X(i):.1f} {Y(v):.1f}" for i, v in enumerate(ys)), "none", INK, 2))
    if x_label:
        out.append(text(width - R, height - 6, x_label, 11, INK_MUTE, 400, "end", tabular=False))
    if marker:
        out.append('<line x1="{{ mx }}" y1="%d" x2="{{ mx }}" y2="%d" style="stroke: %s; stroke-width: 1.4px"></line>' % (T - 4, height - Bm, ACCENT))
        out.append('<circle cx="{{ mx }}" cy="{{ my }}" r="5.5" style="fill: #ffffff; stroke: %s; stroke-width: 2px"></circle>' % ACCENT)
    out.append("</svg>")
    return "\n".join(out), (lambda i: round(X(i), 1)), (lambda v: round(Y(v), 1))


# ================================================================ 1 · Girvan–Newman, one cut at a time

def gn_board():
    gn = EX["girvan_newman"]
    pos, svg = base_map("The metro backbone at alpha 0.2 as Girvan and Newman's method removes links")
    edges = [tuple(sorted((a_, b_))) for a_, b_, _ in place["backbone"]["graphs"]["0.2"]["edges"]]
    cut_step = {tuple(sorted(c["edge"])): c["step"] for c in gn["cuts"]}
    assert all(e in cut_step for e in edges), "every backbone link must be cut once"
    order = sorted(edges, key=lambda e: cut_step[e])
    svg.append('<g>')
    for i, (a_, b_) in enumerate(order):
        (x1, y1), (x2, y2) = pos[a_], pos[b_]
        svg.append(line(x1, y1, x2, y2, INK_MUTE, 0.8, "2 3", op=0.35))
    svg.append("</g>")
    for i, (a_, b_) in enumerate(order):
        (x1, y1), (x2, y2) = pos[a_], pos[b_]
        svg.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" visibility="{{{{ e{i} }}}}" '
                   f'style="stroke: {INK}; stroke-width: 1.4px; opacity: 0.5"></line>')
    svg.append('<line x1="{{ nx1 }}" y1="{{ ny1 }}" x2="{{ nx2 }}" y2="{{ ny2 }}" visibility="{{ nvis }}" '
               f'style="stroke: {INK}; stroke-width: 4px; stroke-linecap: round"></line>')
    for cid in sorted(IDS, key=lambda i: -CITY[i]["filings"]):
        svg.append(dot(cid, pos, fill_hole=f"f_{cid}"))
    svg.append("</svg>")

    levels = gn["levels"]
    best = gn["best"]
    first0 = {"step": 0, "components": 1, "partition": {cid: 0 for cid in IDS}, "Q": 0.0}
    lv = [first0] + levels
    qs = [l_["Q"] for l_ in lv]
    # What the text claims, checked against the data: the two hubs link to every other metro, and every split strands one metro.
    deg = {}
    for a_, b_ in edges:
        deg[a_] = deg.get(a_, 0) + 1
        deg[b_] = deg.get(b_, 0) + 1
    hubs = [cid for cid, d_ in sorted(deg.items(), key=lambda kv: -kv[1]) if d_ == len(IDS) - 1]
    assert [NAME[h_] for h_ in hubs] == ["New York", "Dallas"], hubs
    assert max(qs[1:]) < 0, "the text says no split scores above zero"
    for l_ in levels:
        sizes_ = sorted({c_: list(l_["partition"].values()).count(c_) for c_ in set(l_["partition"].values())}.values(), reverse=True)
        assert sizes_[1:] == [1] * (len(sizes_) - 1) or l_["components"] > len(IDS) - 5, "the text says each split strands one metro"
    best_level = next(l_ for l_ in levels if l_["step"] == best["step"])
    cnt = {}
    for c_ in best_level["partition"].values():
        cnt[c_] = cnt.get(c_, 0) + 1
    first_out = [NAME[m_] for m_, c_ in best_level["partition"].items() if cnt[c_] == 1]
    assert len(first_out) == 1 and best_level is levels[0]
    (y0, y1), ticks = steps02(min(qs), 0.001)
    chart, XI, YV = line_chart(list(range(len(lv))), qs, 1136, 200, (y0, y1), "Modularity of the pieces after each split",
                               ref=0.0, ref_label="0: the backbone as one piece", fmt=lambda v: num(v, 2), x_label="split →", ticks=ticks)
    steps = []
    n = len(gn["cuts"])
    for s_ in range(n + 1):
        cur = max((l_ for l_ in lv if l_["step"] <= s_), key=lambda l_: l_["step"])
        li = lv.index(cur)
        comp = cur["partition"]
        sizes = {}
        for cid, lab in comp.items():
            sizes[lab] = sizes.get(lab, 0) + 1
        top3 = [lab for lab, _ in sorted(sizes.items(), key=lambda kv: (-kv[1], str(kv[0])))[:3]]
        fills = {cid: (RAMP[top3.index(comp[cid])] if comp[cid] in top3 and sizes[comp[cid]] > 1 else "#ffffff") for cid in IDS}
        nxt = gn["cuts"][s_] if s_ < n else None
        steps.append({
            "fills": fills, "li": li, "comps": str(cur["components"]),
            "sizes": " · ".join(str(v) for v in sorted(sizes.values(), reverse=True)[:4]) + (" …" if len(sizes) > 4 else ""),
            "Q": num(cur["Q"], 4),
            "next": (f"{NAME[nxt['edge'][0]]}–{NAME[nxt['edge'][1]]}" if nxt else "none left"),
            "bet": (f"{nxt['betweenness']:.1f}" if nxt else "–"),
            "nx": ([round(v, 1) for v in (*pos[nxt["edge"][0]], *pos[nxt["edge"][1]])] if nxt else [0, 0, 0, 0]),
            "mx": XI(li), "my": YV(cur["Q"]),
        })
    split_steps = sorted({l_["step"] for l_ in levels})
    right = (
        stat_tile("{{ stepText }}", "links removed")
        + stat_tile("{{ comps }}", "pieces, largest first: {{ sizes }}")
        + '<div style="display: flex; flex-direction: column">'
        + readout_row("Next to go", "next") + readout_row("Its edge betweenness", "bet") + readout_row("Modularity of these pieces", "Q")
        + "</div>"
        + f'<p style="margin: 0; font-size: 12px; line-height: 1.5; color: {INK_SOFT}">Thick line: the next link to go, the one carrying '
        "the most shortest paths. Dashed: links already cut. Hollow dots: metros cut off on their own.</p>"
    )
    controls = btn("Step", "step", True) + btn("Next split", "split") + btn("Back", "back") + btn("Reset", "reset")
    lead = (f"Cut the link that carries the most shortest paths, recompute, repeat, and keep the level of pieces with the highest "
            f"modularity. On the {len(edges)} backbone links it finds no groups: {NAME[hubs[0]]} and {NAME[hubs[1]]} link to every other "
            f"metro, so each split strands a single metro, starting with {first_out[0]}.")
    below = figure("Modularity after each split", f"No split scores above zero: the best, which cuts off only {first_out[0]}, scores "
                   f"{num(best['Q'], 4)}. The ring marks where you are.", chart)
    body = shell("Girvan–Newman, one cut at a time", lead, controls, "\n".join(svg), right, below)
    js = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const S = {json.dumps(steps, ensure_ascii=False)};\n"
        f"const ORDER_STEP = {json.dumps([cut_step[e] for e in order])};\n"
        f"const SPLITS = {json.dumps(split_steps)};\n"
        f"const IDS = {json.dumps(IDS)};\n"
        "const st = this.state || {};\n"
        "const s = typeof st.s === 'number' ? st.s : 0;\n"
        "const n = S.length - 1;\n"
        "const go = (v) => this.setState({ s: Math.max(0, Math.min(n, v)) });\n"
        "const cur = S[s];\n"
        "const out = { stepText: s + ' of ' + n, comps: cur.comps, sizes: cur.sizes, Q: cur.Q, next: cur.next, bet: cur.bet,\n"
        "  nx1: cur.nx[0], ny1: cur.nx[1], nx2: cur.nx[2], ny2: cur.nx[3], nvis: s < n ? 'visible' : 'hidden', mx: cur.mx, my: cur.my,\n"
        "  step: () => go(s + 1), back: () => go(s - 1), reset: () => go(0),\n"
        "  split: () => { const nxt = SPLITS.find((x) => x > s); go(nxt === undefined ? n : nxt); } };\n"
        "ORDER_STEP.forEach((k, i) => { out['e' + i] = k > s ? 'visible' : 'hidden'; });\n"
        "IDS.forEach((id) => { out['f_' + id] = cur.fills[id]; });\n"
        "return out;\n"
        "}\n"
        "}"
    )
    return board_page("Week 4 · explore Girvan–Newman", "ExploreGN", "B", body, js, 1480), steps


# ================================================================ 2 · Move a metro, watch modularity

def modularity_board():
    full = EX["full"]
    nm = place["null_model"]
    pos, svg = base_map("The 40 metros coloured by the group you have put them in; click one to move it")
    for cid in sorted(IDS, key=lambda i: -CITY[i]["filings"]):
        svg.append(dot(cid, pos, fill_hole=f"f_{cid}"))
    fmax = max(c["filings"] for c in CITY.values())
    for cid in IDS:
        x, y = pos[cid]
        r = E.dot_r(CITY[cid], fmax, 10) + 5
        svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" onClick="{{{{ mv_{cid} }}}}" aria-hidden="true" '
                   'style="fill: #ffffff; opacity: 0; cursor: pointer"></circle>')
    svg.append("</svg>")
    lo, hi = -0.02, 0.07
    sw = 440
    SX = lambda v: 12 + (min(max(v, lo), hi) - lo) * (sw - 24) / (hi - lo)
    strip = [svg_open(sw, 70, "Your modularity against the rewired networks and Louvain's")]
    strip.append(line(12, 30, sw - 12, 30, LINE, 1))
    strip.append(rect(SX(nm["Q_null_mean"] - nm["Q_null_std"]), 24, SX(nm["Q_null_mean"] + nm["Q_null_std"]) - SX(nm["Q_null_mean"] - nm["Q_null_std"]), 12, BAND, 6))
    strip.append(line(SX(nm["Q_null_mean"]), 21, SX(nm["Q_null_mean"]), 39, INK_MUTE, 2))
    strip.append(text(SX(nm["Q_null_mean"]), 54, f"rewired {nm['Q_null_mean']:.3f}", 11, INK_SOFT, 400, "middle"))
    strip.append(line(SX(full["Q_page_partition"]), 16, SX(full["Q_page_partition"]), 44, INK_SOFT, 1.3, "3 2"))
    strip.append(text(SX(full["Q_page_partition"]), 12, f"Louvain {full['Q_page_partition']:.3f}", 11, INK_SOFT, 600, "middle"))
    strip.append('<circle cx="{{ qx }}" cy="30" r="7" style="fill: %s; stroke: #ffffff; stroke-width: 2px"></circle>' % INK)
    for v in (-0.02, 0, 0.02, 0.04, 0.06):
        strip.append(text(SX(v), 68, num(v, 2), 10.5, INK_MUTE, 400, "middle"))
    strip.append("</svg>")
    right = (
        stat_tile("{{ Q }}", "modularity of your three groups, on all 780 weighted links")
        + "".join(strip)
        + '<div style="display: flex; flex-direction: column">'
        + readout_row("Metros per group", "sizes") + readout_row("Last move", "last") + "</div>"
        + f'<p style="margin: 0; font-size: 12px; line-height: 1.5; color: {INK_SOFT}">Grey band: rewired networks in which each company '
        "keeps its number of metros, Louvain’s best on each, mean and one standard deviation.</p>"
    )
    controls = btn("Louvain’s groups", "reset", True) + btn("Shuffle the labels", "shuffle") + btn("Everyone in one group", "one")
    lead = ("Click a metro to move it to the next group and watch modularity, the share of link weight inside the groups minus what chance "
            "would put there. Louvain’s three groups score 0.049; shuffled labels, or one big group, score about zero.")
    body = shell("Move a metro, watch modularity", lead, controls, "\n".join(svg), right)
    js = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const E = {json.dumps(full['edges'])};\n"
        f"const W = {full['total_weight']};\n"
        f"const IDS = {json.dumps(IDS)};\n"
        f"const NAME = {json.dumps(NAME, ensure_ascii=False)};\n"
        f"const PAGE = {json.dumps(GROUP)};\n"
        f"const COL = {json.dumps([B.GROUP_ON_LIGHT[g_] for g_ in (0, 1, 2)])};\n"
        f"const LO = {lo}, HI = {hi}, SW = {sw};\n"
        "const st = this.state || {};\n"
        "const g = st.g || PAGE;\n"
        "const strength = {}; IDS.forEach((id) => { strength[id] = 0; });\n"
        "E.forEach(([a, b, w]) => { strength[a] += w; strength[b] += w; });\n"
        "const inside = [0, 0, 0], tot = [0, 0, 0];\n"
        "E.forEach(([a, b, w]) => { if (g[a] === g[b]) inside[g[a]] += w; });\n"
        "IDS.forEach((id) => { tot[g[id]] += strength[id]; });\n"
        "let Q = 0; for (let c = 0; c < 3; c++) { Q += inside[c] / W - Math.pow(tot[c] / (2 * W), 2); }\n"
        "const sizes = [0, 0, 0]; IDS.forEach((id) => { sizes[g[id]] += 1; });\n"
        "const qx = 12 + (Math.min(Math.max(Q, LO), HI) - LO) * (SW - 24) / (HI - LO);\n"
        "const out = { Q: Q.toFixed(3), qx: qx, sizes: sizes.join(' \\u00b7 '), last: st.last || 'none yet',\n"
        "  reset: () => this.setState({ g: PAGE, last: 'back to Louvain\\u2019s groups' }),\n"
        "  one: () => { const n = {}; IDS.forEach((id) => { n[id] = 0; }); this.setState({ g: n, last: 'everyone in one group' }); },\n"
        "  shuffle: () => { const labs = IDS.map((id) => g[id]); for (let i = labs.length - 1; i > 0; i--) {\n"
        "    const j = Math.floor(Math.random() * (i + 1)); const t = labs[i]; labs[i] = labs[j]; labs[j] = t; }\n"
        "    const n = {}; IDS.forEach((id, i) => { n[id] = labs[i]; }); this.setState({ g: n, last: 'labels shuffled, sizes kept' }); } };\n"
        "IDS.forEach((id) => {\n"
        "  out['f_' + id] = COL[g[id]];\n"
        "  out['mv_' + id] = () => { const n = Object.assign({}, g); n[id] = (g[id] + 1) % 3;\n"
        "    this.setState({ g: n, last: NAME[id] + ' to group ' + (n[id] + 1) }); };\n"
        "});\n"
        "return out;\n"
        "}\n"
        "}"
    )
    return board_page("Week 4 · explore modularity", "ExploreModularity", None, body, js, 1180)


# ================================================================ 3 · Louvain, move by move

def louvain_board():
    lv = EX["louvain"]
    nm = place["null_model"]
    final = lv["final"]["partition"]
    pos, svg = base_map("The 40 metros as Louvain moves them between communities")
    for cid in sorted(IDS, key=lambda i: -CITY[i]["filings"]):
        svg.append(dot(cid, pos, fill_hole=f"f_{cid}"))
    svg.append('<circle cx="{{ hx }}" cy="{{ hy }}" r="{{ hr }}" visibility="{{ hvis }}" style="fill: none; stroke: %s; stroke-width: 2.4px"></circle>' % INK)
    svg.append("</svg>")
    # replay the moves to get every metro's community after each move
    seq = []
    labels = None
    for level in lv["levels"]:
        members = level["members"]
        labels = dict(level["partition_start"])
        node_comm = {nid: labels[ms[0]] for nid, ms in members.items()}
        if not seq:
            seq.append({"lab": dict(labels), "Q": level["Q_start"], "moved": [], "level": level["level"], "gain": None})
        for mv in level["moves"]:
            node_comm[mv["node"]] = mv["to"]
            for m_ in members[mv["node"]]:
                labels[m_] = mv["to"]
            seq.append({"lab": dict(labels), "Q": mv["Q"], "moved": members[mv["node"]], "level": level["level"], "gain": mv["gain"]})
    start_q = None
    fmax = max(c["filings"] for c in CITY.values())
    # colour: a community of two or more metros takes the colour of the final group most of its metros end in
    steps = []
    for k, sq in enumerate(seq):
        comm = {}
        for cid, lab in sq["lab"].items():
            comm.setdefault(lab, []).append(cid)
        fills = {}
        for lab, ms in comm.items():
            if len(ms) < 2:
                for m_ in ms:
                    fills[m_] = "#ffffff"
                continue
            votes = {}
            for m_ in ms:
                votes[final[m_]] = votes.get(final[m_], 0) + 1
            fg = max(votes.items(), key=lambda kv: (kv[1], -int(kv[0]) if str(kv[0]).isdigit() else 0))[0]
            page_g = max({GROUP[m_] for m_ in ms if final[m_] == fg}, key=lambda g_: sum(1 for m_ in ms if GROUP[m_] == g_))
            for m_ in ms:
                fills[m_] = B.GROUP_ON_LIGHT[page_g]
        moved = sq["moved"]
        hx, hy, hr = (0, 0, 0)
        if len(moved) == 1:
            x, y = pos[moved[0]]
            hx, hy, hr = round(x, 1), round(y, 1), round(E.dot_r(CITY[moved[0]], fmax, 10) + 5, 1)
        steps.append({"fills": fills, "n": len(comm), "Q": num(sq["Q"], 3),
                      "moved": (", ".join(NAME[m_] for m_ in moved[:3]) + (f" and {len(moved) - 3} more" if len(moved) > 3 else "")) or "none yet",
                      "level": str(sq["level"] + 1), "gain": ("–" if sq["gain"] is None else f"+{sq['gain']:.4f}"),
                      "h": [hx, hy, hr], "hvis": "visible" if len(moved) == 1 else "hidden"})
    qs = [sq["Q"] for sq in seq]
    (y0, y1), ticks = steps02(min(qs), max(max(qs), nm["Q_null_mean"]) * 1.1)
    chart, XI, YV = line_chart(list(range(len(qs))), qs, 1136, 220, (y0, y1), "Modularity after each move",
                               ref=nm["Q_null_mean"], ref_label=f"rewired networks {nm['Q_null_mean']:.3f}", x_label="move →",
                               fmt=lambda v: num(v, 2), ticks=ticks)
    for k, s_ in enumerate(steps):
        s_["mx"], s_["my"] = XI(k), YV(qs[k])
    level_ends = []
    cum = 0
    for level in lv["levels"]:
        cum += len(level["moves"])
        level_ends.append(cum)
    right = (
        stat_tile("{{ Q }}", "modularity after this move")
        + stat_tile("{{ n }}", "communities")
        + '<div style="display: flex; flex-direction: column">'
        + readout_row("Move", "stepText") + readout_row("Level", "level") + readout_row("Moved", "moved") + readout_row("Gain in modularity", "gain")
        + "</div>"
        + f'<p style="margin: 0; font-size: 12px; line-height: 1.5; color: {INK_SOFT}">Hollow dots are alone in their community. A '
        "community of two or more takes the colour of the metro group most of its members end in.</p>"
    )
    controls = btn("Step", "step", True) + btn("Finish this level", "level_") + btn("Back", "back") + btn("Reset", "reset")
    WORDS = {2: "two", 3: "three", 4: "four", 5: "five"}
    lv0, lvl_last = lv["levels"][0], lv["levels"][-1]
    assert lv["final"]["nmi_with_page"] == 1.0 and len(lv["levels"]) == 2 and not lvl_last["moves"]
    lead = (f"Louvain starts with every metro alone and moves one at a time to the neighbouring community that raises modularity most. "
            f"In this run (seed {lv['seed']}, all {len(EX['full']['edges'])} weighted links), {len(lv0['moves'])} moves over "
            f"{WORDS.get(lv0['sweeps'], lv0['sweeps'])} sweeps lift Q from {num(lv0['Q_start'], 3)} to {lv['final']['Q']:.3f} and "
            f"land on the page’s {WORDS[lv0['communities']]} metro groups; the second level finds nothing to merge.")
    below = figure("Modularity after each move", "The dashed line is where Louvain lands on rewired networks. The ring marks the current move.", chart)
    body = shell("Louvain, move by move", lead, controls, "\n".join(svg), right, below)
    js = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const S = {json.dumps(steps, ensure_ascii=False)};\n"
        f"const ENDS = {json.dumps(level_ends)};\n"
        f"const IDS = {json.dumps(IDS)};\n"
        "const st = this.state || {};\n"
        "const n = S.length - 1;\n"
        "const s = typeof st.s === 'number' ? st.s : 0;\n"
        "const go = (v) => this.setState({ s: Math.max(0, Math.min(n, v)) });\n"
        "const cur = S[s];\n"
        "const out = { Q: cur.Q, n: String(cur.n), stepText: s + ' of ' + n, level: cur.level, moved: cur.moved, gain: cur.gain,\n"
        "  hx: cur.h[0], hy: cur.h[1], hr: cur.h[2], hvis: cur.hvis, mx: cur.mx, my: cur.my,\n"
        "  step: () => go(s + 1), back: () => go(s - 1), reset: () => go(0),\n"
        "  level_: () => { const e = ENDS.find((x) => x > s); go(e === undefined ? n : e); } };\n"
        "IDS.forEach((id) => { out['f_' + id] = cur.fills[id]; });\n"
        "return out;\n"
        "}\n"
        "}"
    )
    return board_page("Week 4 · explore Louvain", "ExploreLouvain", None, body, js, 1500)


# ================================================================ 4 · Overlap: k-cliques and link communities

def overlap_board():
    kc = EX["k_cliques"]["by_k"]
    lc = EX["link_communities"]
    pos, svg = base_map("Overlapping communities on the metro backbone")
    base_edges = place["backbone"]["graphs"]["0.2"]["edges"]
    for a_, b_, _ in base_edges:
        (x1, y1), (x2, y2) = pos[a_], pos[b_]
        svg.append(line(x1, y1, x2, y2, INK_MUTE, 0.8, op=0.3))
    layers = []   # (key, html)
    fmax = max(c["filings"] for c in CITY.values())
    edge_set = {tuple(sorted((a_, b_))) for a_, b_, _ in base_edges}
    for k in ("3", "4", "5", "6"):
        for j, com in enumerate(kc[k]["communities"]):
            key = f"k{k}_{j}"
            ms = set(com)
            html = [f'<g visibility="{{{{ {key} }}}}">']
            for a_, b_ in sorted(e for e in edge_set if e[0] in ms and e[1] in ms):
                (x1, y1), (x2, y2) = pos[a_], pos[b_]
                html.append(line(x1, y1, x2, y2, INK, 2.2, op=0.85, cap="round"))
            html.append("</g>")
            layers.append((key, "".join(html)))
    for j, com in enumerate(lc["communities"]):
        key = f"l_{j}"
        html = [f'<g visibility="{{{{ {key} }}}}">']
        for a_, b_ in com:
            (x1, y1), (x2, y2) = pos[a_], pos[b_]
            html.append(line(x1, y1, x2, y2, INK, 2.6, op=0.9, cap="round"))
        html.append("</g>")
        layers.append((key, "".join(html)))
    svg += [h_ for _, h_ in layers]
    for cid in sorted(IDS, key=lambda i: -CITY[i]["filings"]):
        svg.append(dot(cid, pos, fill_hole=f"f_{cid}"))
        x, y = pos[cid]
        r = E.dot_r(CITY[cid], fmax, 10) + 4
        svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" visibility="{{{{ o_{cid} }}}}" style="fill: none; stroke: {INK}; stroke-width: 1.6px"></circle>')
    svg.append("</svg>")

    views = {}
    for k in ("3", "4", "5", "6"):
        comms = kc[k]["communities"]
        two = set(kc[k]["in_two_or_more"])
        none_ = len(kc[k]["in_none"])
        views[f"k{k}"] = {
            "title": f"k = {k}", "count": len(comms),
            "extra": ("One community holding every metro." if none_ == 0 else f"One community; {none_} metros left out, drawn hollow.")
            if len(comms) == 1 else f"{len(two)} metros in two or more, {none_} in none",
            "items": [{"key": f"k{k}_{j}", "members": sorted(com, key=lambda c_: -CITY[c_]["filings"]),
                       "names": ", ".join(NAME[c_] for c_ in sorted(com, key=lambda c_: -CITY[c_]["filings"])[:6]) + (f" and {len(com) - 6} more" if len(com) > 6 else "")}
                      for j, com in enumerate(comms)],
            "two": sorted(two),
        }
    two_l = sorted({cid for cid, cs in lc["by_metro"].items() if len(cs) >= 2})
    most = sorted(two_l, key=lambda c_: (-len(lc["by_metro"][c_]), -CITY[c_]["filings"]))[:2]
    views["link"] = {
        "title": "link communities", "count": len(lc["communities"]),
        "extra": f"{len(two_l)} metros sit in two or more: {NAME[most[0]]} and {NAME[most[1]]} in {len(lc['by_metro'][most[0]])} each."
        if len(lc["by_metro"][most[0]]) == len(lc["by_metro"][most[1]]) else f"{len(two_l)} metros sit in two or more.",
        "items": [{"key": f"l_{j}", "members": sorted({m_ for e in com for m_ in e}, key=lambda c_: -CITY[c_]["filings"]),
                   "names": ", ".join(NAME[c_] for c_ in sorted({m_ for e in com for m_ in e}, key=lambda c_: -CITY[c_]["filings"])[:6])}
                  for j, com in enumerate(lc["communities"])],
        "two": two_l,
    }
    modes = ["link", "k3", "k4", "k5", "k6"]
    seg = "".join(
        f'<button type="button" onClick="{{{{ m_{m} }}}}" aria-pressed="{{{{ mp_{m} }}}}" style="padding: 7px 12px; border-radius: 999px; border: 1px solid {LINE}; '
        f'background: {{{{ mbg_{m} }}}}; color: {{{{ mfg_{m} }}}}; font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer">'
        f'{"Link communities" if m == "link" else "k = " + m[1]}</button>' for m in modes)
    controls = seg + btn("Next community", "nextc", True)
    right = (
        stat_tile("{{ count }}", "communities · {{ title }}")
        + f'<p style="margin: 0; font-size: 12.5px; color: {INK_SOFT}">{{{{ extra }}}}</p>'
        + '<div style="display: flex; flex-direction: column">' + readout_row("Showing", "which") + "</div>"
        + f'<p style="margin: 0; font-size: 13px; line-height: 1.5; color: {INK}">{{{{ names }}}}</p>'
        + f'<p style="margin: 0; font-size: 12px; line-height: 1.5; color: {INK_SOFT}">Dark links and filled dots: the community shown. '
        "Rings: metros that belong to two or more communities at this setting.</p>"
    )
    ks = [k for k in ("3", "4", "5", "6")]
    assert all(len(kc[k]["communities"]) == 1 for k in ks), "the text says clique percolation finds one community at every k"
    lead = (f"A partition puts each metro in one group; these two methods let it sit in several. Link communities group the links, and a "
            f"metro joins every community its links are in. Clique percolation finds a single community at every k from {ks[0]} to "
            f"{ks[-1]}: a larger k only leaves more of the fringe out.")
    body = shell("Overlap: k-cliques and link communities", lead, controls, "\n".join(svg), right)
    js = (
        "class Component extends DCLogic {\n"
        "renderVals() {\n"
        f"const V = {json.dumps(views, ensure_ascii=False)};\n"
        f"const MODES = {json.dumps(modes)};\n"
        f"const IDS = {json.dumps(IDS)};\n"
        f"const LAYERS = {json.dumps([k_ for k_, _ in layers])};\n"
        "const st = this.state || {};\n"
        "const mode = st.mode || 'link';\n"
        "const v = V[mode];\n"
        "const j = v.items.length ? (st.j || 0) % v.items.length : 0;\n"
        "const item = v.items[j] || { key: '', members: [], names: 'No community at this setting.' };\n"
        "const inItem = new Set(item.members); const two = new Set(v.two);\n"
        "const out = { count: String(v.count), title: v.title, extra: v.extra, names: item.names,\n"
        "  which: v.items.length ? (j + 1) + ' of ' + v.items.length : 'none',\n"
        "  nextc: () => this.setState({ mode: mode, j: j + 1 }) };\n"
        "LAYERS.forEach((k) => { out[k] = k === item.key ? 'visible' : 'hidden'; });\n"
        f"IDS.forEach((id) => {{ out['f_' + id] = inItem.has(id) ? '{INK}' : '#ffffff'; out['o_' + id] = two.has(id) ? 'visible' : 'hidden'; }});\n"
        "MODES.forEach((m) => { out['m_' + m] = () => this.setState({ mode: m, j: 0 }); out['mp_' + m] = m === mode;\n"
        f"  out['mbg_' + m] = m === mode ? '{ACCENT}' : '{CARD}'; out['mfg_' + m] = m === mode ? '#ffffff' : '{INK}'; }});\n"
        "return out;\n"
        "}\n"
        "}"
    )
    return board_page("Week 4 · explore overlapping communities", "ExploreOverlap", None, body, js, 1160)


def all_boards():
    gn = gn_board()[0]
    return [
        ("ExploreGN.dc.html", "Explore · Girvan–Newman, one cut at a time", gn[0], gn[1]),
        ("ExploreModularity.dc.html", "Explore · move a metro, watch modularity", *modularity_board()),
        ("ExploreLouvain.dc.html", "Explore · Louvain, move by move", *louvain_board()),
        ("ExploreOverlap.dc.html", "Explore · k-cliques and link communities", *overlap_board()),
    ]
