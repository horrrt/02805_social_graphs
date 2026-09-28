"""Section 2's recode moves split 2010 codes through O*NET's crosswalk.

week04_jobs.recode_soc must send 15-1199.08 to 15-2051 (Data Scientists) and
15-1199.01 to 15-1253 (QA testers), not to LEGACY's catch-all 15-1299. A
2010 code with two crosswalk targets falls back to LEGACY, and a 2018 code
passes through unchanged. A code with no real major group (12-1252) takes the
code of another filing with the same title, and is dropped when no other
filing has its title. The fixture copies four rows of the crosswalk CSV,
so the test needs no build data.

    python analysis/test_week04_recode.py
"""

import sys
import tempfile
from pathlib import Path

import pandas as pd

from week04_jobs import recode_soc, single_targets

CROSSWALK = """O*NET-SOC 2010 Code,O*NET-SOC 2010 Title,O*NET-SOC 2019 Code,O*NET-SOC 2019 Title
15-1199.01,Software Quality Assurance Engineers and Testers,15-1253.00,Software Quality Assurance Analysts and Testers
15-1199.08,Business Intelligence Analysts,15-2051.01,Business Intelligence Analysts
15-1132.00,"Software Developers, Applications",15-1252.00,Software Developers
15-1132.00,"Software Developers, Applications",15-1253.00,Software Quality Assurance Analysts and Testers
"""

EXPECTED = {
    "15-1199.08": "15-2051",  # the crosswalk's one target
    "15-1199.01": "15-1253",  # the crosswalk's one target
    "15-1132.00": "15-1252",  # two targets: LEGACY's 15-1132
    "15-1199.03": "15-1299",  # not in the fixture: LEGACY's 15-1199
    "15-1252.00": "15-1252",  # a 2018 code, unchanged
    "12-1252": "15-1252",     # no major group 12: the code of the same title
    "40-9999": None,          # no major group 40, and no other filing has its title: dropped
}
TITLES = {"15-1252.00": "Software Developers", "12-1252": "software developers ", "40-9999": "Nobody Else"}


def main():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "crosswalk.csv"
        path.write_text(CROSSWALK)
        crosswalk = single_targets(path)
    frame = recode_soc(pd.DataFrame({"SOC_CODE": list(EXPECTED),
                                     "SOC_TITLE": [TITLES.get(c, c) for c in EXPECTED]}), crosswalk)
    got = {c: (None if pd.isna(o) else o) for c, o in zip(frame["SOC_CODE"], frame["occupation"])}
    failures = [f"{code}: expected {want}, got {got[code]}" for code, want in EXPECTED.items() if got[code] != want]
    valid = dict(zip(frame["SOC_CODE"], frame["soc_valid"]))
    legacy = dict(zip(frame["SOC_CODE"], frame["legacy"]))
    if valid["40-9999"] or legacy["12-1252"]:
        failures.append("a dropped code must be invalid, and a mistyped one is not a 2010 code")
    for line in failures:
        print(f"FAILED  {line}")
    if not failures:
        print(f"ok      {len(EXPECTED)} codes recoded as expected")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
