"""Shared pieces for the Week 4 redesign canvas: tokens, escaping, layout blocks, SVG charts."""
import json
import math
import re
from html.parser import HTMLParser

# Log–Log Legends tokens (design system "Log–Log Legends", tokens.json, clean skin)
INK = "#0f2340"
INK_SOFT = "#46618a"
INK_MUTE = "#7a8fac"
GROUND = "#eef3f9"
CARD = "#ffffff"
LINE = "#dce5f0"
LINE_SOFT = "#eaf0f7"
INSET = "#f7fafd"
PEOPLE = "#f2820c"
PEOPLE_SOFT = "#fde8cf"
PEOPLE_INK = "#9a5205"
ACCESS = "#1f8fd6"
ACCESS_SOFT = "#d9ecf9"
ACCENT = "#14618f"
DEEP = "#0b1f3a"
HERO_TOP = "#173f6d"
HERO_BOTTOM = "#071427"
HERO_INK = "#eaf2fb"
HERO_LEDE = "#b9cde4"
HERO_BODY = "#93aecd"
HERO_LABEL = "#7f9bbd"
HERO_EYEBROW = "#ffb768"
HERO_CAUTION = "#ffd6a8"
GRID = "#e6ecf3"
# The basemap under light maps: enough to place the metros, lighter than any mark drawn on it.
MAP_FILL = "#e6edf5"
MAP_EDGE = "#c3d0e0"
NONE = "#b9c4d2"
STAGE_HINT = "rgba(8, 22, 42, 0.72)"
STAGE_HINT_INK = "#cfe0f2"
HIT_BG = "#e7f6ee"
HIT_INK = "#0d6b3a"
BAND = "rgba(185, 196, 210, 0.62)"
SHADOW = "0 1px 2px rgba(15, 35, 64, 0.06), 0 8px 24px rgba(15, 35, 64, 0.05)"
HERO_BG = f"radial-gradient(120% 130% at 78% 18%, {HERO_TOP} 0%, {DEEP} 55%, {HERO_BOTTOM} 100%)"
SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif"
COND = "'Barlow Condensed', Impact, sans-serif"
MINUS = "−"

W = 1440
SHELL = 1180
MARGIN = (W - SHELL) // 2


# ---------------------------------------------------------------- escaping

def t(s):
    """Escape text content."""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def a(s):
    """Escape an attribute value (double-quoted)."""
    return t(s).replace('"', "&quot;")


def num(x, d=0):
    s = f"{x:,.{d}f}"
    return s.replace("-", MINUS)


def pct(x, d=1):
    return num(100 * x, d) + "%"


def sgn(x, d=1):
    s = f"{x:.{d}f}"
    return s.replace("-", MINUS)


# ---------------------------------------------------------------- page frame

HELMET = (
    "<helmet>\n"
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&amp;display=swap" />\n'
    "<style>\n"
    f"body{{margin:0;background:{GROUND}}}\n"
    f"a{{color:{ACCENT}}}a:hover{{color:{INK}}}\n"
    "summary{cursor:pointer}\n"
    ".pop{display:none}\n"
    ".tip:hover>.pop,.tip:focus-within>.pop,.pop.open{display:block}\n"
    "</style>\n"
    "</helmet>\n"
)


def page(title, w, h, body, script=None, props=None):
    props = dict(props or {})
    props["$preview"] = {"width": w, "height": h}
    pj = json.dumps(props, ensure_ascii=False).replace("&", "&amp;").replace("'", "&#39;")
    if script is None:
        script = "class Component extends DCLogic {\nrenderVals() {\nreturn {};\n}\n}"
    root = (
        f'<div style="width: {w}px; height: {h}px; box-sizing: border-box; overflow: hidden; '
        f"background: {GROUND}; color: {INK}; font-family: {SANS}; display: flex; flex-direction: column; "
        f'-webkit-font-smoothing: antialiased">\n{body}\n</div>'
    )
    return (
        "<!doctype html>\n"
        '<html lang="en">\n<head>\n<meta charset="utf-8" />\n'
        f"<title>{t(title)}</title>\n"
        '<script src="./support.js"></script>\n'
        "</head>\n<body>\n<x-dc>\n"
        + HELMET
        + root
        + "\n</x-dc>\n"
        f"<script type=\"text/x-dc\" data-dc-script data-props='{pj}'>\n{script}\n</script>\n"
        "</body>\n</html>\n"
    )


NAV = [
    ("0", "Opening", "#opening"),
    ("1", "Where", "#place"),
    ("2", "Jobs", "#jobs"),
    ("3", "Staffing", "#who"),
    ("4", "Biggest firms", "#footprint"),
    ("5", "Beyond", "#beyond"),
    ("✓", "Closing", "#closing"),
    ("+", "Deep dive", "#cut"),
]


def topbar(active=None):
    pills = []
    for n, label, href in NAV:
        on = label == active
        bg = f"background: {ACCESS_SOFT}; color: {ACCENT};" if on else f"color: {INK_SOFT};"
        numc = ACCENT if on else INK_MUTE
        cur = ' aria-current="true"' if on else ""
        pills.append(
            f'<a href="{href}"{cur} style="display: flex; align-items: center; gap: 6px; padding: 7px 12px; '
            f'border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; {bg}">'
            f'<span style="font-variant-numeric: tabular-nums; font-weight: 800; color: {numc}">{t(n)}</span>{t(label)}</a>'
        )
    return (
        f'<header style="flex: none; height: 52px; box-sizing: border-box; background: rgba(255, 255, 255, 0.92); '
        f'border-bottom: 1px solid {LINE}; display: flex; align-items: center; justify-content: center">\n'
        f'<div style="width: {SHELL}px; display: flex; align-items: center; gap: 22px">\n'
        f'<a href="#top" style="display: flex; align-items: center; gap: 7px; text-decoration: none; font-family: {COND}; '
        f'font-weight: 800; font-size: 20px; line-height: 1; letter-spacing: 0.01em; color: {INK}">'
        f'<span style="color: {ACCENT}">✳︎</span><span>LOG–LOG <span style="color: {ACCENT}">LEGENDS</span></span></a>\n'
        f'<a href="#all-posts" style="font-size: 13px; font-weight: 600; color: {INK_SOFT}; text-decoration: none">All posts</a>\n'
        f'<nav aria-label="Sections of this post" style="margin-left: auto; display: flex; gap: 2px">\n'
        + "\n".join(pills)
        + "\n</nav>\n</div>\n</header>"
    )


RAIL = [
    ("0", "Opening", "opening", []),
    ("1", "Where the hiring is", "place", [("A", "place-who", "Do cities group by who hires there instead of by region?"),
                                            ("B", "place-break", "Where does the backbone break, and whose links hold it?")]),
    ("2", "Which jobs go together", "jobs", [("A", "jobs-split", "Do outsourcing firms bundle jobs differently from direct employers?"),
                                              ("B", "jobs-linkcom", "Does any job belong to two clusters at once?")]),
    ("3", "Who staffs whom", "who", [("A", "who-switch", "When a client changes its main vendor, does it stay in its group?"),
                                      ("B", "who-movers", "Which clients change group when filing counts are ignored?"),
                                      ("C", "who-overlap", "Which clients sit in two groups at once?")]),
    ("4", "Without the biggest firms", "footprint", [("A", "footprint-which", "Which firm hides the regions?")]),
    ("5", "Beyond the three networks", "beyond", [("A", "beyond-law", "Do immigration law firms split companies the way vendors do?"),
                                                   ("B", "beyond-perm", "Do outsourcing firms sponsor fewer green cards?"),
                                                   ("C", "beyond-wage", "Do outsourcing firms file at lower wage levels for the same job?")]),
    ("✓", "Closing", "closing", []),
    ("+", "Deep dive", "cut", [("1", "cut-place", "First round: where the hiring is"),
                               ("2", "cut-jobs", "First round: which jobs go together"),
                               ("3", "cut-who", "First round: who staffs whom"),
                               ("M", "cut-more", "More networks"),
                               ("D", "evidence", "Data and methods")]),
]


def _rail_label(text_):
    return (
        '<span class="pop" aria-hidden="true" style="position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%); '
        f'z-index: 40; width: max-content; max-width: 300px; box-sizing: border-box; background: {TIP_BG}; border-radius: 8px; '
        f'padding: 6px 10px; font-size: 12px; line-height: 1.4; font-weight: 600; color: {HERO_INK}; text-align: left; '
        f'white-space: normal; box-shadow: 0 2px 6px rgba(15, 35, 64, 0.08), 0 12px 28px rgba(15, 35, 64, 0.14)">{t(text_)}</span>'
    )


def rail(active, current=None):
    """The numbered index down the left margin. Only the section you are in shows its questions; every item names itself on hover or focus."""
    items = []
    for n, title, anchor, qs in RAIL:
        on = n == active
        sq = (f"background: {ACCENT}; color: #ffffff; border: 1px solid {ACCENT};" if on
              else f"background: {CARD}; color: {ACCENT}; border: 1px solid {LINE};")
        items.append(
            '<span class="tip" style="position: relative; display: inline-flex">'
            f'<a href="#{anchor}" aria-label="{a(n + " · " + title)}" style="width: 36px; height: 36px; box-sizing: border-box; '
            f'border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; '
            f'font-weight: 800; text-decoration: none; font-variant-numeric: tabular-nums; {sq}">{t(n)}</a>'
            + _rail_label(f"{n} · {title}") + "</span>"
        )
        if qs and on:
            dots = []
            for letter, qid, qtitle in qs:
                cur = letter == current
                sub = qtitle if n == "+" else f"{n}{letter} · {qtitle}"
                ds = (f"background: {INK}; color: #ffffff; border: 1px solid {INK};" if cur
                      else f"background: {GROUND}; color: {INK_SOFT}; border: 1px solid {LINE};")
                dots.append(
                    '<span class="tip" style="position: relative; display: inline-flex">'
                    f'<a href="#{qid}" aria-label="{a(sub)}" style="width: 24px; height: 24px; '
                    f'box-sizing: border-box; border-radius: 999px; display: flex; align-items: center; justify-content: center; '
                    f'font-size: 10.5px; font-weight: 800; text-decoration: none; {ds}">{letter}</a>'
                    + _rail_label(sub) + "</span>"
                )
            items.append('<div style="display: flex; flex-direction: column; align-items: center; gap: 5px">' + "".join(dots) + "</div>")
    return (
        f'<nav aria-label="Contents of this post" style="flex: none; width: {MARGIN}px; display: flex; justify-content: center; padding-top: 6px">\n'
        f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 0; '
        f'background: linear-gradient({LINE}, {LINE}) center / 2px 100% no-repeat">\n'
        + "\n".join(items)
        + "\n</div>\n</nav>"
    )


def body_row(rail_html, content, gap=28):
    return (
        '<div style="flex: none; display: flex; align-items: flex-start; padding-top: 36px">\n'
        + rail_html
        + f'\n<div style="width: {SHELL}px; flex: none; display: flex; flex-direction: column; gap: {gap}px">\n'
        + content
        + "\n</div>\n</div>"
    )


def chip(text, tone="plain"):
    tones = {
        "plain": f"background: {CARD}; color: {INK_SOFT}; border: 1px solid {LINE};",
        "inset": f"background: {INSET}; color: {INK_SOFT}; border: 1px solid {LINE_SOFT};",
        "people": f"background: {PEOPLE_SOFT}; color: {PEOPLE_INK}; border: 1px solid {PEOPLE_SOFT};",
        "access": f"background: {ACCESS_SOFT}; color: {ACCENT}; border: 1px solid {ACCESS_SOFT};",
        "hero": "background: rgba(255, 255, 255, 0.06); color: #b9cde4; border: 1px solid rgba(255, 255, 255, 0.12);",
    }
    return (
        f'<span style="flex: none; display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; '
        f'font-size: 11.5px; font-weight: 600; white-space: nowrap; {tones[tone]}">{t(text)}</span>'
    )


def label_caps(text, color=INK_MUTE, size=11, track="0.1em"):
    return (
        f'<div style="font-size: {size}px; line-height: 1.2; font-weight: 700; letter-spacing: {track}; '
        f'text-transform: uppercase; color: {color}">{t(text)}</div>'
    )


def opener(numeral, title, scope, finding_html, anchor):
    """A section's opening: large numeral and title on the ground, the finding under it."""
    return (
        f'<section id="{anchor}" style="display: flex; gap: 22px; align-items: flex-start; padding: 12px 0 2px">\n'
        f'<div aria-hidden="true" style="flex: none; width: 58px; font-size: 64px; line-height: 0.86; font-weight: 800; '
        f'letter-spacing: -0.04em; color: {ACCENT}; font-variant-numeric: tabular-nums">{t(numeral)}</div>\n'
        '<div style="display: flex; flex-direction: column; gap: 10px; padding-top: 2px">\n'
        '<div style="display: flex; align-items: center; gap: 14px">\n'
        f'<h2 style="margin: 0; font-size: 30px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; color: {INK}">{t(title)}</h2>\n'
        + "</div>\n"
        f'<p style="margin: 0; max-width: 860px; font-size: 18px; line-height: 1.45; font-weight: 600; letter-spacing: -0.005em; color: {INK}; text-wrap: pretty">{finding_html}</p>\n'
        "</div>\n</section>"
    )


def para(html, size=13.5, color=INK_SOFT, measure="68ch", weight=400, extra=""):
    return (
        f'<p style="margin: 0; max-width: {measure}; font-size: {size}px; line-height: 1.62; font-weight: {weight}; '
        f'color: {color}; text-wrap: pretty{extra}">{html}</p>'
    )


BULB = (
    '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="flex: none; margin-top: 1px">'
    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" '
    f'style="fill: none; stroke: {ACCENT}; stroke-width: 1.6px; stroke-linecap: round; stroke-linejoin: round"></path></svg>'
)


def notice(title, html, glyph="bulb"):
    ico = BULB if glyph == "bulb" else (
        f'<span aria-hidden="true" style="flex: none; width: 18px; text-align: center; font-weight: 800; color: {ACCENT}">{t(glyph)}</span>'
    )
    return (
        f'<div style="display: flex; gap: 11px; align-items: flex-start; background: {INSET}; border: 1px solid {LINE_SOFT}; '
        f'border-radius: 10px; padding: 12px 14px">\n{ico}\n'
        f'<p style="margin: 0; font-size: 12.5px; line-height: 1.55; color: {INK_SOFT}; text-wrap: pretty">'
        f'<b style="color: {INK}">{t(title)}</b> {html}</p>\n</div>'
    )


def disclosure(summary, inner=""):
    return (
        f'<details style="border: 1px solid {LINE_SOFT}; border-radius: 10px; background: {INSET}">\n'
        f'<summary style="padding: 11px 14px; font-size: 13px; font-weight: 700; color: {INK}">{t(summary)}</summary>\n'
        f'<div style="padding: 0 14px 12px">{inner}</div>\n</details>'
    )


def card(inner, pad="24px 28px 26px", gap=18, anchor=None, extra=""):
    idattr = f' id="{anchor}"' if anchor else ""
    return (
        f'<article{idattr} style="background: {CARD}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW}; '
        f'padding: {pad}; display: flex; flex-direction: column; gap: {gap}px{extra}">\n{inner}\n</article>'
    )


def q_header(badge, question, scope, answer_html, stat=None):
    stat_html = ""
    if stat:
        stat_html = (
            f'<span style="flex: none; padding: 4px 10px; border-radius: 999px; background: {GROUND}; color: {INK}; '
            f'font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap">{t(stat)}</span>'
        )
    return (
        '<header style="display: flex; align-items: flex-start; gap: 14px">\n'
        f'<span style="flex: none; min-width: 40px; height: 30px; padding: 0 8px; box-sizing: border-box; border-radius: 8px; '
        f'background: {ACCESS_SOFT}; color: {ACCENT}; font-size: 13px; font-weight: 800; display: flex; align-items: center; '
        f'justify-content: center; font-variant-numeric: tabular-nums">{t(badge)}</span>\n'
        '<div style="flex: 1; display: flex; flex-direction: column; gap: 8px">\n'
        '<div style="display: flex; align-items: center; gap: 12px">\n'
        f'<h3 style="margin: 0; font-size: 20px; line-height: 1.25; font-weight: 700; letter-spacing: -0.01em; color: {INK}">{t(question)}</h3>\n'
        + "</div>\n"
        f'<p style="margin: 0; max-width: 900px; font-size: 16px; line-height: 1.45; font-weight: 600; color: {INK}; text-wrap: pretty">{answer_html}</p>\n'
        "</div>\n</header>"
    )


def two_col(left, right, left_w=540, gap=40):
    return (
        f'<div style="display: grid; grid-template-columns: {left_w}px minmax(0, 1fr); gap: {gap}px; align-items: start">\n'
        f'<div style="display: flex; flex-direction: column; gap: 14px">\n{left}\n</div>\n'
        f'<div style="display: flex; flex-direction: column; gap: 14px">\n{right}\n</div>\n'
        "</div>"
    )


def figure(title, caption, svg_html, extra=""):
    return (
        '<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px">\n'
        f'<figcaption style="display: flex; flex-direction: column; gap: 3px">'
        f'<span style="font-size: 13.5px; font-weight: 700; color: {INK}">{t(title)}</span>'
        f'<span style="font-size: 11.5px; line-height: 1.45; color: {INK_SOFT}">{t(caption)}</span></figcaption>\n'
        f'<div style="background: {INSET}; border: 1px solid {LINE_SOFT}; border-radius: 10px; padding: 14px 14px 10px">\n'
        f"{svg_html}\n</div>{extra}\n</figure>"
    )


def stat_tile(value, label, dark=False):
    vc, lc = (HERO_INK, HERO_LABEL) if dark else (INK, INK_SOFT)
    return (
        '<div style="display: flex; flex-direction: column; gap: 3px">'
        f'<span style="font-size: 22px; line-height: 1.1; font-weight: 700; letter-spacing: -0.01em; color: {vc}; '
        f'font-variant-numeric: tabular-nums">{t(value)}</span>'
        f'<span style="font-size: 12px; line-height: 1.35; color: {lc}">{t(label)}</span></div>'
    )


# ---------------------------------------------------------------- SVG primitives

def tw(s, size=11, weight=400):
    """Rough text width in px for the system sans."""
    f = 0.56 if weight >= 600 else 0.52
    return len(str(s)) * size * f


def svg_open(w, h, label):
    return (
        f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{a(label)}" '
        f'style="display: block; overflow: visible; max-width: 100%; height: auto; font-family: {SANS}">'
    )


def line(x1, y1, x2, y2, stroke, sw=1, dash=None, op=None, cap="butt"):
    s = f"stroke: {stroke}; stroke-width: {sw}px; stroke-linecap: {cap}"
    if dash:
        s += f"; stroke-dasharray: {dash}"
    if op is not None:
        s += f"; opacity: {op}"
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" style="{s}"></line>'


def rect(x, y, w, h, fill, rx=0, stroke=None, sw=1, op=None):
    s = f"fill: {fill}"
    if stroke:
        s += f"; stroke: {stroke}; stroke-width: {sw}px"
    if op is not None:
        s += f"; opacity: {op}"
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w, 0):.1f}" height="{h:.1f}" rx="{rx}" style="{s}"></rect>'


def circle(cx, cy, r, fill, stroke=None, sw=1.5, op=None):
    s = f"fill: {fill}"
    if stroke:
        s += f"; stroke: {stroke}; stroke-width: {sw}px"
    if op is not None:
        s += f"; opacity: {op}"
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" style="{s}"></circle>'


def text(x, y, s, size=11, fill=INK_MUTE, weight=400, anchor="start", italic=False, tabular=True):
    st = f"font-size: {size}px; fill: {fill}; font-weight: {weight}; text-anchor: {anchor}"
    if italic:
        st += "; font-style: italic"
    if tabular:
        st += "; font-variant-numeric: tabular-nums"
    return f'<text x="{x:.1f}" y="{y:.1f}" style="{st}">{t(s)}</text>'


def path(d, fill="none", stroke=None, sw=1, op=None, dash=None, join="round"):
    s = f"fill: {fill}"
    if stroke:
        s += f"; stroke: {stroke}; stroke-width: {sw}px; stroke-linejoin: {join}; stroke-linecap: round"
    if dash:
        s += f"; stroke-dasharray: {dash}"
    if op is not None:
        s += f"; opacity: {op}"
    return f'<path d="{d}" style="{s}"></path>'


def smart_text(x, y, s, lo, hi, size=11, fill=INK_SOFT, weight=400):
    """Centre a label on x but keep it inside [lo, hi]."""
    w = tw(s, size, weight)
    if x - w / 2 < lo:
        return text(lo, y, s, size, fill, weight, "start")
    if x + w / 2 > hi:
        return text(hi, y, s, size, fill, weight, "end")
    return text(x, y, s, size, fill, weight, "middle")


# ---------------------------------------------------------------- the real-vs-baseline strip

def strip_chart(rows, domain, width, ticks, tick_fmt, label_w=170, row_h=60, badge_w=70,
                axis_title=None, aria="", ref=None, ref_label=None, top=10, zero_line=None):
    """Rows of 'real network against its random baseline' on one shared axis.

    Each row: label, sub, real, real_label, real_color, base=(mean, sd) or brange=(lo, hi, mid),
    base_label, ci=(lo, hi), badge, bold, hollow, pair=[(value, color, label), ...].
    """
    d0, d1 = domain
    x0 = label_w
    x1 = width - badge_w
    k = (x1 - x0) / (d1 - d0)

    def X(v):
        return x0 + (min(max(v, d0), d1) - d0) * k

    n = len(rows)
    h = top + n * row_h + 34 + (14 if axis_title else 0)
    out = [svg_open(width, h, aria)]
    ybot = top + n * row_h
    for tv in ticks:
        out.append(line(X(tv), top - 4, X(tv), ybot, GRID, 1))
        out.append(text(X(tv), ybot + 16, tick_fmt(tv), 11, INK_MUTE, 400, "middle"))
    if zero_line is not None:
        out.append(line(X(zero_line), top - 4, X(zero_line), ybot, INK_MUTE, 1))
    if ref is not None:
        out.append(line(X(ref), top - 6, X(ref), ybot, INK_SOFT, 1.2, "4 3"))
        if ref_label:
            out.append(smart_text(X(ref), top - 10, ref_label, x0, x1, 11, INK_SOFT, 600))
    if axis_title:
        out.append(text(x1, ybot + 32, axis_title, 11, INK_MUTE, 400, "end"))
    for i, r in enumerate(rows):
        cy = top + i * row_h + row_h / 2 - 2
        if r.get("divider"):
            out.append(line(0, top + i * row_h + 2, x1 + badge_w, top + i * row_h + 2, LINE, 1, "2 3"))
        lw = 700 if r.get("bold") else 600
        out.append(text(0, cy - (3 if r.get("sub") else -4), r["label"], 12, INK, lw, "start", tabular=False))
        if r.get("sub"):
            out.append(text(0, cy + 12, r["sub"], 11, INK_MUTE, 400, "start"))
        out.append(line(x0, cy, x1, cy, LINE, 1))
        if "base" in r:
            m, sd = r["base"]
            lo, hi = X(m - sd), X(m + sd)
            if hi - lo < 4:
                c = (lo + hi) / 2
                lo, hi = c - 2, c + 2
            out.append(rect(lo, cy - 6, hi - lo, 12, BAND, 6))
            out.append(line(X(m), cy - 9, X(m), cy + 9, INK_MUTE, 2))
            if r.get("base_label"):
                out.append(smart_text(X(m), cy + 25, r["base_label"], x0, x1, 11, INK_SOFT))
        if "brange" in r:
            lo_v, hi_v, mid = r["brange"]
            out.append(rect(X(lo_v), cy - 6, X(hi_v) - X(lo_v), 12, BAND, 6))
            out.append(line(X(mid), cy - 9, X(mid), cy + 9, INK_MUTE, 2))
            if r.get("base_label"):
                out.append(smart_text(X(mid), cy + 25, r["base_label"], x0, x1, 11, INK_SOFT))
        if "rref" in r:
            v, lab = r["rref"]
            out.append(line(X(v), cy - 10, X(v), cy + 10, INK_SOFT, 1.4, "3 2"))
            if lab:
                out.append(smart_text(X(v), cy + 25, lab, x0, x1, 11, INK_SOFT))
        if "ci" in r:
            lo_v, hi_v = r["ci"]
            out.append(line(X(lo_v), cy, X(hi_v), cy, INK, 2))
            out.append(line(X(lo_v), cy - 5, X(lo_v), cy + 5, INK, 2))
            out.append(line(X(hi_v), cy - 5, X(hi_v), cy + 5, INK, 2))
        if "pair" in r:
            (va, ca, la), (vb, cb, lb) = r["pair"]
            out.append(line(X(va), cy, X(vb), cy, LINE, 4, cap="round"))
            for v, c, lab, other in ((va, ca, la, vb), (vb, cb, lb, va)):
                out.append(circle(X(v), cy, 6.5, c, "#ffffff", 2))
                if lab:
                    right = v >= other
                    out.append(text(X(v) + (11 if right else -11), cy + 4, lab, 11.5, INK, 700, "start" if right else "end"))
        if r.get("real") is not None:
            col = r.get("real_color", INK)
            if r.get("hollow"):
                out.append(circle(X(r["real"]), cy, 6, "#ffffff", col, 2))
            else:
                out.append(circle(X(r["real"]), cy, 6.5, col, "#ffffff", 2))
            if r.get("real_label"):
                out.append(smart_text(X(r["real"]), cy - 13, r["real_label"], x0, x1, 12, INK, 700))
        if r.get("badge"):
            bw = max(tw(r["badge"], 11, 700) + 16, 44)
            bx = min(x1 + 12, width - bw)  # a long badge ends at the chart's edge, not past it
            out.append(rect(bx, cy - 10, bw, 20, GROUND, 10))
            out.append(text(bx + bw / 2, cy + 4, r["badge"], 11, INK, 700, "middle"))
    out.append("</svg>")
    return "\n".join(out), h


def mini_strip(w, domain, real, real_label, base=None, base_label=None, ref=None, ref_label=None,
               ci=None, aria=""):
    """A one-row strip without an axis, for summaries."""
    d0, d1 = domain
    h = 58
    x0, x1 = 6, w - 6
    k = (x1 - x0) / (d1 - d0)

    def X(v):
        return x0 + (min(max(v, d0), d1) - d0) * k

    cy = 28
    out = [svg_open(w, h, aria), line(x0, cy, x1, cy, LINE, 1)]
    if base:
        m, sd = base
        lo, hi = X(m - sd), X(m + sd)
        if hi - lo < 4:
            c = (lo + hi) / 2
            lo, hi = c - 2, c + 2
        out.append(rect(lo, cy - 6, hi - lo, 12, BAND, 6))
        out.append(line(X(m), cy - 9, X(m), cy + 9, INK_MUTE, 2))
        if base_label:
            out.append(smart_text(X(m), cy + 24, base_label, 0, w, 11, INK_SOFT))
    if ref is not None:
        out.append(line(X(ref), cy - 11, X(ref), cy + 11, INK_SOFT, 1.3, "3 2"))
        if ref_label:
            out.append(smart_text(X(ref), cy + 24, ref_label, 0, w, 11, INK_SOFT))
    if ci:
        lo_v, hi_v = ci
        out.append(line(X(lo_v), cy, X(hi_v), cy, INK, 2))
        out.append(line(X(lo_v), cy - 5, X(lo_v), cy + 5, INK, 2))
        out.append(line(X(hi_v), cy - 5, X(hi_v), cy + 5, INK, 2))
    out.append(circle(X(real), cy, 6.5, INK, "#ffffff", 2))
    out.append(smart_text(X(real), cy - 13, real_label, 0, w, 12, INK, 700))
    out.append("</svg>")
    return "\n".join(out)


# ---------------------------------------------------------------- markup check

VOID = {"meta", "link", "br", "img", "input", "hr", "source", "col", "area", "base", "wbr"}
SVG_SELF_OK = set()


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag, attrs):
        if tag not in VOID:
            self.errors.append(f"self-closed <{tag}> at {self.getpos()}")

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"stray </{tag}> at {self.getpos()}")
            return
        top, pos = self.stack.pop()
        if top != tag:
            self.errors.append(f"</{tag}> at {self.getpos()} closes <{top}> from {pos}")


def check_markup(src):
    p = Balance()
    p.feed(src)
    p.close()
    errs = list(p.errors)
    if p.stack:
        errs.append(f"unclosed: {p.stack[-5:]}")
    for m in re.finditer(r"\{\{(.*?)\}\}", src):
        inner = m.group(1).strip()
        if not re.fullmatch(r"[A-Za-z_$][\w$]*(\.[\w$]+)*|true|false|\d+", inner):
            errs.append(f"hole is not a dotted lookup: {m.group(0)}")
    return errs


# ---------------------------------------------------------------- reveal on hover or keyboard focus

TIP_BG = "rgba(11, 31, 58, 0.97)"
TIP_TEXT = "#cfe0f2"
_ids = [0]

INFO_SVG = (
    '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="flex: none">'
    '<circle cx="12" cy="12" r="9" style="fill: none; stroke: currentColor; stroke-width: 2px"></circle>'
    '<path d="M12 11v6M12 7.6v.4" style="fill: none; stroke: currentColor; stroke-width: 2.2px; stroke-linecap: round"></path></svg>'
)
PLUS_SVG = (
    '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="flex: none">'
    '<circle cx="12" cy="12" r="9" style="fill: none; stroke: currentColor; stroke-width: 2px"></circle>'
    '<path d="M12 8v8M8 12h8" style="fill: none; stroke: currentColor; stroke-width: 2px; stroke-linecap: round"></path></svg>'
)


def _pop(pid, title, body_html, open_, width, side, top="calc(100% + 8px)"):
    cls = "pop open" if open_ else "pop"
    head = (f'<b style="display: block; margin-bottom: 4px; color: {HERO_INK}; font-weight: 700">{t(title)}</b>' if title else "")
    return (
        f'<span class="{cls}" id="{pid}" role="tooltip" style="position: absolute; {side}; top: {top}; width: {width}px; '
        f'z-index: 40; box-sizing: border-box; background: {TIP_BG}; border: 1px solid rgba(255, 255, 255, 0.12); '
        'border-radius: 9px; padding: 12px 14px; box-shadow: 0 2px 6px rgba(15, 35, 64, 0.08), 0 18px 44px rgba(15, 35, 64, 0.16); '
        f'font-size: 12.5px; line-height: 1.55; font-weight: 400; font-style: normal; color: {TIP_TEXT}; text-align: left; '
        f'white-space: normal; letter-spacing: 0">{head}{body_html}</span>'
    )


def reveal(label, title, body, open_=False, width=440, align="left", icon="info", html=False):
    """A pill button whose text shows on hover or keyboard focus. The text stays in the page for screen readers."""
    _ids[0] += 1
    pid = f"more-{_ids[0]}"
    ico = INFO_SVG if icon == "info" else PLUS_SVG
    side = "left: 0" if align == "left" else "right: 0"
    return (
        '<span class="tip" style="position: relative; display: inline-flex">'
        f'<button type="button" aria-describedby="{pid}" style="display: inline-flex; align-items: center; gap: 6px; '
        f'padding: 6px 11px; border-radius: 999px; border: 1px solid {LINE}; background: {CARD}; color: {ACCENT}; '
        f'font-family: inherit; font-size: 12px; font-weight: 700; line-height: 1.1; cursor: help">{ico}{t(label)}</button>'
        + _pop(pid, title, body if html else t(body), open_, width, side)
        + "</span>"
    )


def term(word, body, open_=False, width=330):
    """A term in running text; its definition shows on hover or keyboard focus."""
    _ids[0] += 1
    pid = f"term-{_ids[0]}"
    return (
        '<span class="tip" style="position: relative; display: inline">'
        f'<button type="button" aria-describedby="{pid}" style="padding: 0; margin: 0; border: 0; '
        f'border-bottom: 1px dotted {INK_SOFT}; background: none; font: inherit; color: inherit; cursor: help">{t(word)}</button>'
        + _pop(pid, None, t(body), open_, width, "left: 0", "calc(100% + 6px)")
        + "</span>"
    )


def reveal_row(*items):
    return '<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">' + "".join(items) + "</div>"


GLOSS = {
    "AMI": "Adjusted mutual information: how well two groupings of the same things agree, corrected for chance. "
           "0 means no better than labels dealt at random, 1 means the same grouping.",
    "NMI": "Normalized mutual information: how well two groupings agree, from 0 to 1. It is not corrected for chance, "
           "so finer groupings score higher; AMI corrects for that.",
    "modularity": "How much more of the link weight falls inside the groups than a random network with the same "
                  "number of links per node would put there. Higher means sharper groups.",
    "z": "How many standard deviations the real value sits from the random baseline’s mean. Beyond about 2 either "
         "way is rare by chance.",
    "rewired": "A random copy of the network in which every node keeps its number of partners, but the partners are dealt "
               "out again at random.",
    "alpha": "The disparity filter keeps a link when it carries an unusually large share of either endpoint’s weight. "
             "α is the test’s threshold: a smaller α keeps fewer links.",
    "Louvain": "The community method used throughout: it merges nodes into groups while that raises modularity.",
}


def gloss(word, key=None, open_=False):
    return term(word, GLOSS[key or word], open_)


# ---------------------------------------------------------------- more charts

def est_lines(text_or_len, width, size=13.5, factor=0.5):
    n = text_or_len if isinstance(text_or_len, int) else len(re.sub(r"<[^>]+>", "", str(text_or_len)))
    return max(1, math.ceil(n * size * factor / max(width, 1)))


def hbars(rows, width, fmt, label_w=190, aria="", row_h=26, max_v=None, ref=None, ref_label=None,
          value_w=70, top=6, bottom=18):
    """Horizontal bars. rows: (label, value, emphasis) with emphasis True, False or 'outline'."""
    x0 = label_w
    x1 = width - value_w
    mv = max_v or max(v for _, v, *_ in rows)
    h = top + len(rows) * row_h + bottom
    out = [svg_open(width, h, aria)]

    def X(v):
        return x0 + (x1 - x0) * v / mv

    if ref is not None:
        out.append(line(X(ref), top - 2, X(ref), top + len(rows) * row_h, INK_SOFT, 1.2, "4 3"))
        if ref_label:
            out.append(smart_text(X(ref), h - 3, ref_label, x0, width, 11, INK_SOFT, 600))
    for i, row in enumerate(rows):
        label, v = row[0], row[1]
        emph = row[2] if len(row) > 2 else False
        y = top + i * row_h
        bh = row_h - 9
        out.append(text(x0 - 10, y + bh / 2 + 4, label, 12, INK, 700 if emph is True else 400, "end", tabular=False))
        if emph == "outline":
            out.append(rect(x0, y, max(X(v) - x0, 1), bh, CARD, 3, INK, 1.4))
        else:
            out.append(rect(x0, y, max(X(v) - x0, 1), bh, INK, 3, op=None if emph is True else 0.42))
        out.append(text(X(v) + 6, y + bh / 2 + 4, fmt(v), 11.5, INK, 700 if emph is True else 600, "start"))
    out.append("</svg>")
    return "\n".join(out), h


def colored_bars(rows, width, fmt, label_w=150, aria="", row_h=30, max_v=None, value_w=64, top=4):
    """Horizontal bars in given colours: rows (label, value, fill, stroke or None)."""
    x0, x1 = label_w, width - value_w
    mv = max_v or max(r[1] for r in rows)
    h = top + len(rows) * row_h + 4
    out = [svg_open(width, h, aria)]
    for i, (label, v, fill, stroke) in enumerate(rows):
        y = top + i * row_h
        bh = row_h - 10
        out.append(text(x0 - 10, y + bh / 2 + 4, label, 12, INK, 600, "end", tabular=False))
        w = max((x1 - x0) * v / mv, 1)
        out.append(rect(x0, y, w, bh, fill, 3, stroke, 1.4 if stroke else 1))
        out.append(text(x0 + w + 6, y + bh / 2 + 4, fmt(v), 11.5, INK, 700, "start"))
    out.append("</svg>")
    return "\n".join(out), h


LEVEL_TINTS = ["#d3dce8", "#9fb0c6", "#56708f", INK]


def stacked_rows(rows, width, labels, aria="", label_w=150, row_h=34, tints=LEVEL_TINTS, legend=True):
    """100% stacked bars: rows (label, [shares...]); segments share one ink ramp."""
    x0, x1 = label_w, width - 8
    h = len(rows) * row_h + (30 if legend else 6)
    out = [svg_open(width, h, aria)]
    for i, (label, shares) in enumerate(rows):
        y = i * row_h + 4
        bh = row_h - 12
        out.append(text(x0 - 10, y + bh / 2 + 4, label, 12, INK, 600, "end", tabular=False))
        x = x0
        for j, s in enumerate(shares):
            w = (x1 - x0) * s
            out.append(rect(x, y, max(w - 1, 0.5), bh, tints[j], 0))
            if w > 30:
                out.append(text(x + w / 2, y + bh / 2 + 4, f"{s * 100:.0f}%", 11, "#ffffff" if tints[j] in (INK, "#56708f") else INK, 700, "middle"))
            x += w
    if legend:
        lx = x0
        ly = len(rows) * row_h + 16
        for j, lab in enumerate(labels):
            out.append(rect(lx, ly - 9, 11, 11, tints[j], 2))
            out.append(text(lx + 16, ly, lab, 11, INK_SOFT, 600, "start", tabular=False))
            lx += 26 + tw(lab, 11, 600)
    out.append("</svg>")
    return "\n".join(out), h


def slope(series, width, y_domain, left_label, right_label, fmt, aria="", height=210):
    """Two-point slope chart: series (label, a, b, colour, bold)."""
    L, R, T, B = 150, 150, 26, 24
    y0, y1 = y_domain

    def Y(v):
        return T + (y1 - v) * (height - T - B) / (y1 - y0)

    xa, xb = L, width - R
    out = [svg_open(width, height, aria)]
    out.append(text(xa, 14, left_label, 11.5, INK_SOFT, 700, "middle", tabular=False))
    out.append(text(xb, 14, right_label, 11.5, INK_SOFT, 700, "middle", tabular=False))
    out.append(line(xa, T - 4, xa, height - B + 4, LINE, 1))
    out.append(line(xb, T - 4, xb, height - B + 4, LINE, 1))
    for label, va, vb, col, bold in series:
        out.append(line(xa, Y(va), xb, Y(vb), col, 3 if bold else 2.2, cap="round"))
        out.append(circle(xa, Y(va), 5.5, col, "#ffffff", 2))
        out.append(circle(xb, Y(vb), 5.5, col, "#ffffff", 2))
        out.append(text(xa - 12, Y(va) + 4, f"{label}  {fmt(va)}", 12, INK, 700 if bold else 600, "end", tabular=False))
        out.append(text(xb + 12, Y(vb) + 4, fmt(vb), 12, INK, 700 if bold else 600, "start"))
    out.append("</svg>")
    return "\n".join(out), height


def heat(rows, cols, cells, width, aria="", label_w=210, cell_h=28, fmt=lambda v: f"{v * 100:.0f}%"):
    """A small heatmap, one ink ramp; column labels sit flat on up to two lines, never rotated."""
    head = 40
    cw = (width - label_w) / len(cols)
    h = head + len(rows) * cell_h + 4
    out = [svg_open(width, h, aria)]
    for j, c in enumerate(cols):
        cx = label_w + j * cw + cw / 2
        words, lines_, cur = c.split(), [], ""
        for w_ in words:
            if cur and tw(cur + " " + w_, 11, 600) > cw - 6:
                lines_.append(cur)
                cur = w_
            else:
                cur = (cur + " " + w_).strip()
        lines_.append(cur)
        lines_ = lines_[:2]
        for k, ln in enumerate(lines_):
            out.append(text(cx, head - 8 - 13 * (len(lines_) - 1 - k), ln, 11, INK_SOFT, 600, "middle", tabular=False))
    vmax = max(max(r) for r in cells) or 1
    for i, rname in enumerate(rows):
        y = head + i * cell_h
        out.append(text(label_w - 10, y + cell_h / 2 + 4, rname, 12, INK, 600, "end", tabular=False))
        for j, v in enumerate(cells[i]):
            a_ = v / vmax
            if a_ > 0:
                out.append(rect(label_w + j * cw + 1, y + 1, cw - 2, cell_h - 2, INK, 3, op=round(max(a_, 0.06), 3)))
            else:
                out.append(rect(label_w + j * cw + 1, y + 1, cw - 2, cell_h - 2, GROUND, 3))
            if v >= 0.05:
                out.append(text(label_w + j * cw + cw / 2, y + cell_h / 2 + 4, fmt(v), 10.5, "#ffffff" if a_ > 0.45 else INK, 700, "middle"))
    out.append("</svg>")
    return "\n".join(out), h
