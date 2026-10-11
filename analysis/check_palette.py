"""Check the community colours in src/styles/post.css.

The network views colour up to eight groups with --group-0 to --group-7 and
leave the rest grey (--group-none), on a light card and on the dark surface
(.gv-dark). This script reads those tokens and reports, for each theme:

- the smallest distance between two group colours in CAM02-UCS (a perceptual
  colour space; about 1 is a just-noticeable difference), for normal vision and
  for simulated deuteranopia and protanopia (Machado, Oliveira & Fernandes 2009,
  severity 100, through colorspacious);
- the same distance from each group colour to the grey, so a coloured node never
  reads as unassigned;
- each colour's WCAG contrast against the background, which a node needs to
  stand out (3:1 is the WCAG minimum for graphics);
- the contrast of a label written inside a node (--on-group-*), which small
  text needs at 4.5:1.

It exits with status 1 when a floor below is missed.

    python analysis/check_palette.py
"""

import itertools
import re
import sys
from pathlib import Path

import numpy as np
from colorspacious import cspace_convert

CSS = Path(__file__).resolve().parents[1] / "src/styles/post.css"
# Eight colours cannot all sit far apart: Tol's muted palette, built for colour
# blindness, has its closest normal-vision pair (rose and wine) near 13.
FLOORS = {"normal": 12.0, "deuteranopia": 6.0, "protanopia": 6.0}
GREY_FLOOR = 12.0
CONTRAST_FLOOR = 3.0
LABEL_FLOOR = 4.5
VISION = {
    "normal": None,
    "deuteranopia": {"name": "sRGB1+CVD", "cvd_type": "deuteranomaly", "severity": 100},
    "protanopia": {"name": "sRGB1+CVD", "cvd_type": "protanomaly", "severity": 100},
}


def block(css, selector):
    """The custom properties set in the first rule for `selector`."""
    m = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", css)
    if not m:
        raise SystemExit(f"no {selector} rule in {CSS.name}")
    return dict(re.findall(r"(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;", m.group(1)))


def rgb(hexs):
    return np.array([int(hexs[i:i + 2], 16) / 255 for i in (1, 3, 5)])


def seen(hexs, how):
    c = rgb(hexs)
    if VISION[how]:
        c = np.clip(cspace_convert(c, VISION[how], "sRGB1"), 0, 1)
    return cspace_convert(c, "sRGB1", "CAM02-UCS")


def contrast(a, b):
    def lum(h):
        c = rgb(h)
        c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
        return float(np.dot([0.2126, 0.7152, 0.0722], c))
    hi, lo = sorted([lum(a), lum(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def check(theme, tokens):
    groups = [tokens[f"--group-{i}"] for i in range(8)]
    grey, ground = tokens["--group-none"], tokens["--graph-ground"]
    ok = True
    print(f"{theme}: ground {ground}, grey {grey}")
    for how, floor in FLOORS.items():
        pts = [seen(h, how) for h in groups]
        d, i, j = min((float(np.linalg.norm(pts[i] - pts[j])), i, j) for i, j in itertools.combinations(range(8), 2))
        g = min(float(np.linalg.norm(p - seen(grey, how))) for p in pts)
        flag = "" if d >= floor and (how != "normal" or g >= GREY_FLOOR) else "  <- below the floor"
        ok &= not flag
        print(f"  {how:13s} closest pair {d:5.1f} (group {i} and {j}, floor {floor:.0f}); nearest to grey {g:5.1f}{flag}")
    for i, h in enumerate(groups + [grey]):
        ink = tokens[f"--on-group-{i if i < 8 else 'none'}"]
        c = contrast(h, ink)
        flag = "" if c >= LABEL_FLOOR else "  <- label under 4.5:1"
        ok &= not flag
        print(f"  label on {'group ' + str(i) if i < 8 else 'grey'} {h} in {ink}: {c:4.2f}{flag}")
    for i, h in enumerate(groups):
        c = contrast(h, ground)
        flag = "" if c >= CONTRAST_FLOOR else "  <- under 3:1"
        ok &= not flag
        print(f"  group {i} {h} contrast {c:4.2f}{flag}")
    return ok


def main():
    css = CSS.read_text()
    light = block(css, ".corridor .gv")
    dark = {**light, **block(css, ".corridor .gv.gv-dark")}
    ok = check("light", light) & check("dark", dark)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
