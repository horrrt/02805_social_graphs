"""Digest one week of the 02805 course brief for a go-nuts post.

Pulls (or updates) the course repo suneman/socialgraphs2026-web into a cache
outside this repo, reads docs/weeks/weekN.html and prints a Markdown digest:
sections, exercises, the go-nuts openers verbatim, the explorables and how
they draw, the Python packages the brief imports and whether .venv-course has
them, the course data files, and what this repo already holds for the week.

    .venv-course/bin/python scripts/go_nuts_brief.py            # latest week
    .venv-course/bin/python scripts/go_nuts_brief.py --week 6 --out project/go-nuts/week06-brief.md
"""

from __future__ import annotations

import argparse
import importlib.util
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

from bs4 import BeautifulSoup

REPO_URL = "https://github.com/suneman/socialgraphs2026-web.git"
LIVE_URL = "https://sunelehmann.com/socialgraphs2026-web/weeks/week{n}.html"
CACHE = Path.home() / ".cache" / "socialgraphs2026-web"
ROOT = Path(__file__).resolve().parents[1]

# Import names that differ from the pip name, or that are stdlib.
PIP_NAME = {"sklearn": "scikit-learn", "bs4": "beautifulsoup4", "community": "python-louvain"}
STDLIB = set(sys.stdlib_module_names)


def sync_repo() -> str:
    if (CACHE / ".git").exists():
        subprocess.run(["git", "-C", str(CACHE), "pull", "-q", "--ff-only"], check=True)
    else:
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--depth", "1", REPO_URL, str(CACHE)], check=True)
    out = subprocess.run(["git", "-C", str(CACHE), "log", "-1", "--format=%h %cs %s"],
                         capture_output=True, text=True, check=True)
    return out.stdout.strip()


def latest_week() -> int:
    weeks = sorted(int(m.group(1)) for p in (CACHE / "docs/weeks").glob("week*.html")
                   if (m := re.fullmatch(r"week(\d+)\.html", p.name)))
    return weeks[-1]


def text(el) -> str:
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()


def go_nuts_block(soup):
    """The go-nuts <h4> and every element after it up to the next heading."""
    head = next((h for h in soup.find_all("h4") if "go nuts" in h.get_text().lower()), None)
    if head is None:
        return None, []
    body = []
    for sib in head.find_all_next():
        if sib.name in ("h2", "h3", "h4"):
            break
        if sib.name == "li" or sib.name == "p" and not sib.find_parent("li"):
            body.append(sib)
    return head, body


def explorable_info(rel: str) -> dict:
    page = CACHE / "docs" / "explorables" / Path(rel).name
    info = {"name": page.stem, "libs": [], "data": [], "svg": False, "canvas": False}
    if not page.exists():
        return info
    html = page.read_text(errors="ignore")
    srcs = re.findall(r'<script[^>]*src="([^"]+)"', html)
    info["libs"] = [Path(s).name for s in srcs]
    code = html
    for s in srcs:
        js = (page.parent / s).resolve()
        if js.exists() and js.stat().st_size < 200_000:
            code += js.read_text(errors="ignore")
    info["data"] = sorted(set(re.findall(r'fetch\(\s*[`"\']([^`"\']+)', code)))
    info["svg"] = bool(re.search(r"<svg|createElementNS|d3\.select|\.append\(\"svg", code))
    info["canvas"] = "canvas" in code
    return info


def imports(soup) -> list[str]:
    mods = set()
    for code in soup.select("pre code"):
        for m in re.finditer(r"^\s*(?:from|import)\s+([A-Za-z_][\w]*)", code.get_text(), re.M):
            mods.add(m.group(1))
    return sorted(mods - STDLIB)


def venv_has(mod: str) -> str:
    py = ROOT.parents[2] / ".venv-course" / "bin" / "python" if ".claude/worktrees" in str(ROOT) \
        else ROOT / ".venv-course" / "bin" / "python"
    if not py.exists():
        return "unknown (.venv-course not found)" if importlib.util.find_spec(mod) is None else "yes (current python)"
    r = subprocess.run([str(py), "-c", f"import {mod}"], capture_output=True)
    return "yes" if r.returncode == 0 else "**MISSING**"


def unlinked_explorables() -> list[str]:
    linked = set()
    for p in (CACHE / "docs/weeks").glob("week*.html"):
        linked |= set(re.findall(r"explorables/([\w-]+)\.html", p.read_text(errors="ignore")))
    have = {p.stem for p in (CACHE / "docs/explorables").glob("*.html")}
    return sorted(have - linked)


def our_side(n: int) -> list[str]:
    nn = f"{n:02d}"
    prev = f"{n - 1:02d}"
    lines = []
    route = ROOT / "src" / "app" / f"(week{nn})"
    lines.append(f"- Post route `src/app/(week{nn})/`: {'exists' if route.exists() else 'not started'}")
    for label, wk in (("This week's", nn), ("Last week's (reuse candidates)", prev)):
        files = sorted(p.name for p in (ROOT / "analysis").glob(f"week{wk}_*") if p.suffix in (".py", ".csv", ".json"))
        lines.append(f"- {label} analysis files: " + (", ".join(f"`{f}`" for f in files) if files else "none"))
    pat = re.compile(rf"week-?0?{n}(?!\d)", re.I)
    wts = subprocess.run(["git", "-C", str(ROOT), "worktree", "list"], capture_output=True, text=True).stdout
    brs = subprocess.run(["git", "-C", str(ROOT), "branch", "-a", "--format=%(refname:short)"],
                         capture_output=True, text=True).stdout
    hits = sorted({l.split()[-1].strip("[]") for l in wts.splitlines() if pat.search(l)}
                  | {b for b in brs.splitlines() if pat.search(b)})
    lines.append("- Other branches or worktrees for this week: " + (", ".join(f"`{h}`" for h in hits) or "none"))
    notes = ROOT / "project" / f"WEEK{nn}.md"
    lines.append(f"- Notes `project/WEEK{nn}.md`: {'exists' if notes.exists() else 'none yet'}")
    return lines


def digest(n: int, commit: str) -> str:
    page = CACHE / "docs" / "weeks" / f"week{n}.html"
    soup = BeautifulSoup(page.read_text(), "html.parser")
    title = text(soup.find("h1")) if soup.find("h1") else f"Week {n}"
    out = [f"# Week {n} go-nuts digest: {title}", "",
           f"Course repo `{commit}`, read {date.today().isoformat()}. Live page: {LIVE_URL.format(n=n)}", ""]

    out += ["## Sections and exercises", ""]
    for h in soup.find_all(["h2", "h4"]):
        t = text(h)
        if h.name == "h2" and t not in ("Essentials", "Goodies"):
            out.append(f"- **{t}**")
        elif h.name == "h4":
            out.append(f"  - {t}")
    out.append("")

    head, body = go_nuts_block(soup)
    out += ["## Go nuts, verbatim", ""]
    if head is None:
        out.append("No go-nuts section on this page yet.")
    else:
        out.append(f"**{text(head)}**")
        out.append("")
        for el in body:
            out.append(("- " if el.name == "li" else "") + text(el))
            out.append("")

    test = soup.select_one(".on-the-test")
    if test:
        out += ["## On the test", "", text(test), ""]

    frames = re.findall(r'<iframe[^>]*src="([^"]+)"', page.read_text())
    exps = [explorable_info(f) for f in frames if "explorables/" in f]
    vids = [f for f in frames if "youtube" in f]
    out += ["## Explorables (how the course draws this week)", "",
            "| Explorable | Scripts | Data it loads | SVG | Canvas |", "|---|---|---|---|---|"]
    for e in exps:
        out.append(f"| {e['name']} | {', '.join(e['libs']) or 'inline'} | {', '.join(e['data']) or 'inline'} "
                   f"| {'yes' if e['svg'] else ''} | {'yes' if e['canvas'] else ''} |")
    out += ["", f"Videos: {len(vids)}.", "",
            f"House chart style: `docs/explorables/vizkit.js`. Code and data: `{CACHE}/docs/explorables/`.", ""]

    mods = imports(soup)
    out += ["## Python the brief imports", "", "| Import | pip name | In .venv-course |", "|---|---|---|"]
    for m in mods:
        out.append(f"| {m} | {PIP_NAME.get(m, m)} | {venv_has(m)} |")
    out.append("")

    readme = CACHE / "docs" / "data" / "README.md"
    if readme.exists():
        rows = [l for l in readme.read_text().splitlines() if l.startswith("| `")]
        out += ["## Course data files", "", "| File | Arrives | What |", "|---|---|---|"] + rows + [""]
    files = sorted((CACHE / "docs" / "data").glob("*")) + sorted((CACHE / "docs" / "explorables" / "data").glob("*"))
    files += sorted((CACHE / "docs" / "explorables").glob("*.json"))
    out += ["All released files (sizes in KB). Explorable data shows what the course already computed; "
            "use it to calibrate, not as our result:", ""]
    out += [f"- `{f.relative_to(CACHE / 'docs')}` {f.stat().st_size // 1024}" for f in files
            if f.suffix not in (".md", ".html")]
    out.append("")

    future = unlinked_explorables()
    if future:
        out += ["## Explorables in the repo that no week links yet (next week's preview)", "",
                ", ".join(f"`{f}`" for f in future), ""]

    out += ["## This repo", ""] + our_side(n) + [""]
    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", type=int, help="week number (default: latest in the course repo)")
    ap.add_argument("--out", type=Path, help="write the digest here instead of stdout")
    args = ap.parse_args()
    commit = sync_repo()
    n = args.week or latest_week()
    md = digest(n, commit)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(md)
        print(f"wrote {args.out} (week {n}, {len(md.split())} words)")
    else:
        print(md)


if __name__ == "__main__":
    main()
