"""Check every week's page data against the fields its page scripts read.

    python analysis/check_pages.py

Runs the Pydantic models in every analysis/weekNN_schemas.py over the committed
JSON files and exits non-zero, naming the file and the field, if any file does
not match. A new week's schema module is picked up by its name alone.

Scripts validate a page file before writing it with check(path, data):

    from check_pages import check
    check(PAGE, payload)
    PAGE.write_text(json.dumps(payload))
"""

import importlib
import json
import sys
from pathlib import Path

from pydantic import ValidationError

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WEEKS = sorted(p.stem for p in HERE.glob("week[0-9][0-9]_schemas.py"))


def pages():
    """Every page file each week's schema module knows, mapped to its model."""
    found = {}
    for module in WEEKS:
        found.update(importlib.import_module(module).PAGES)
    return found


def check(path, data):
    """Validate a page file's contents before it is written; raises SystemExit naming the problem."""
    rel = Path(path).resolve().relative_to(ROOT).as_posix()
    model = pages().get(rel)
    if model is None:
        raise SystemExit(f"{rel} has no model: add one to PAGES in its week's analysis/weekNN_schemas.py")
    try:
        # Checked as it will be written: tuples become lists, keys become strings.
        model.model_validate(json.loads(json.dumps(data)))
    except ValidationError as err:
        raise SystemExit(f"{rel} does not match what the page reads:\n{err}") from None


def main():
    failed = 0
    for rel, model in pages().items():
        try:
            model.model_validate(json.loads((ROOT / rel).read_text()))
            print(f"ok      {rel}")
        except ValidationError as err:
            failed += 1
            print(f"FAILED  {rel}\n{err}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
