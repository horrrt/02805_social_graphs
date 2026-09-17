"""Git merge driver for the two pages that carry a generated build stamp.

Rebasing week 3 across branches meant resolving the same conflict eight
times in a row, every one of them a `?v=` hash that a script regenerates
anyway. The stamp is derived, so it should never be something a human
arbitrates.

This driver blanks the stamp in all three versions, merges what is left with
the normal three-way algorithm, and lets scripts/stamp_week03.py put the real
value back. A genuine conflict in the surrounding markup still conflicts, and
still needs a person; only the generated token stops asking.

    git config merge.stamped.name "build-stamped HTML"
    git config merge.stamped.driver "python3 scripts/merge_stamped.py %O %A %B %L"

with .gitattributes pointing the two pages at it. Both are installed by
scripts/stamp_week03.py --hook.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

TOKEN = re.compile(rb"\?v=[0-9a-f]+")
PLACEHOLDER = b"?v=0000000000"


def main() -> int:
    if len(sys.argv) < 4:
        print("usage: merge_stamped.py %O %A %B [%L]", file=sys.stderr)
        return 2
    base, current, other = (pathlib.Path(p) for p in sys.argv[1:4])
    originals = {p: p.read_bytes() for p in (base, current, other)}
    for path, body in originals.items():
        path.write_bytes(TOKEN.sub(PLACEHOLDER, body))

    merged = subprocess.run(
        ["git", "merge-file", "-L", "ours", "-L", "base", "-L", "theirs",
         str(current), str(base), str(other)],
        capture_output=True,
    )
    # git merge-file writes its result into the "current" file and returns the
    # number of conflicts left, or a negative number on error.
    if merged.returncode < 0:
        for path, body in originals.items():
            path.write_bytes(body)
        sys.stderr.write(merged.stderr.decode("utf-8", "replace"))
        return 1
    return merged.returncode


if __name__ == "__main__":
    raise SystemExit(main())
