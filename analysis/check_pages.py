"""Check every week's page data against the fields its page scripts read.

    python analysis/check_pages.py

Runs the Pydantic models in week01_schemas.py to week04_schemas.py over the
committed JSON files and exits non-zero, naming the file and the field, if any
file does not match. Each week's scripts also check their own files before
writing them.
"""

import importlib
import json
import sys
from pathlib import Path

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
WEEKS = ["week01_schemas", "week02_schemas", "week03_schemas", "week04_schemas"]


def main():
    failed = 0
    for module in WEEKS:
        try:
            pages = importlib.import_module(module).PAGES
        except ModuleNotFoundError:
            print(f"skip    {module} (no schema module yet)")
            continue
        for rel, model in pages.items():
            try:
                model.model_validate(json.loads((ROOT / rel).read_text()))
                print(f"ok      {rel}")
            except ValidationError as err:
                failed += 1
                print(f"FAILED  {rel}\n{err}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
