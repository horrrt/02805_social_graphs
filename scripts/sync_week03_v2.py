"""Generate the Apple edition of the week 3 post from the arcade edition.

The two editions of Corridor Control differ only in depth and in the chrome
tags the site tests look for: the markup, the stylesheet and the script are the
same. Copying by hand is how the earlier v2 pages drifted, so this does the
transform and tests/site.test.mjs checks the result still matches.

    python scripts/sync_week03_v2.py [--check]

--check exits non-zero instead of writing, for use in a test or a hook.
"""

from __future__ import annotations

import argparse
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "weeks" / "week03" / "index.html"
TARGET = ROOT / "docs" / "v2" / "weeks" / "week03" / "index.html"


def transform(html: str) -> str:
    # The build stamp travels with the file names, so nothing special is needed
    # here beyond leaving the query strings alone.
    # The twin sits one directory deeper, so shared assets move up one level.
    out = html.replace('href="../../assets/', 'href="../../../assets/')
    out = out.replace('src="../../assets/', 'src="../../../assets/')
    # site-root keeps the shared chrome and the lobby link inside the edition.
    out = out.replace(
        '<link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
        '<meta content="../../" name="site-root" />\n'
        '    <link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
    )
    out = out.replace('<body class="corridor">', '<body class="corridor theme-apple">')
    out = out.replace(
        "<title>Corridor Control · Log–Log Arcade</title>",
        "<title>Corridor Control · Log–Log Arcade · Apple edition</title>",
    )
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    wanted = transform(SOURCE.read_text(encoding="utf-8"))
    current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else None

    if args.check:
        if current != wanted:
            sys.exit(
                f"{TARGET.relative_to(ROOT)} is stale. "
                "Run: python scripts/sync_week03_v2.py"
            )
        print("v2 twin matches the arcade edition")
        return

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(wanted, encoding="utf-8")
    print(
        f"wrote {TARGET.relative_to(ROOT)}"
        + ("" if current is None else " (was stale)" if current != wanted else " (unchanged)")
    )


if __name__ == "__main__":
    main()
