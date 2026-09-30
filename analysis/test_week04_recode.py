"""Section 2's recode moves split 2010 codes through O*NET's crosswalk.

week04_jobs.recode_soc must send 15-1199.08 to 15-2051 (Data Scientists) and
15-1199.01 to 15-1253 (QA testers), not to LEGACY's catch-all 15-1299. A
2010 code with two crosswalk targets falls back to LEGACY, and a 2018 code
passes through unchanged. A code with no real major group (12-1252) takes the
code of another filing with the same title, and is dropped when no other
filing has its title. When correctly coded filings with that title disagree,
the mistyped row takes the code most of them carry. A code that is in a real
major group but no 2018 code (15-1282) takes the same title rule. DOL's R&D
splits go to the occupation they split, an Excel date is read back as a code,
and a 2010 6-digit code with one 2018 successor goes there. The fixture copies
five rows of the crosswalk CSV and lists the 2018 codes it needs, so the test
needs no build data.

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
29-1063.00,"Internists, General",29-1216.00,General Internal Medicine Physicians
"""
KNOWN = frozenset({"15-1252", "15-1253", "15-2051", "15-2041", "15-1299", "17-2071", "11-3021",
                   "29-1216", "29-1229"})

EXPECTED = {
    "15-1199.08": "15-2051",  # the crosswalk's one target
    "15-1199.01": "15-1253",  # the crosswalk's one target
    "15-1132.00": "15-1252",  # two targets: LEGACY's 15-1132
    "15-1199.03": "15-1299",  # not in the fixture: LEGACY's 15-1199
    "15-1252.00": "15-1252",  # a 2018 code, unchanged
    "12-1252": "15-1252",     # no major group 12: the code of the same title
    "40-9999": None,          # no major group 40, and no other filing has its title: dropped
    "15-1282": "15-1252",     # a real major group but no 2018 code: the code of the same title
    "15-1295.00": "15-1252",  # DOL's "Software Developers, Non R&D"
    "17-2074.00": "17-2071",  # DOL's "Electrical Engineers, R&D"
    "3021-11-01 00:00:00": "11-3021",  # Excel's reading of 11-3021
    "29-1063": "29-1216",     # 2010 6-digit code, one 2018 successor in the crosswalk
    "29-1069.00": "29-1229",  # 2010 code that split: RETIRED's "All Other" successor
}
TITLES = {"15-1252.00": "Software Developers", "12-1252": "software developers ", "40-9999": "Nobody Else",
          "15-1282": "Software Developers", "15-1295.00": "Software Developers, Non R&D"}
# One title on two valid codes, two filings on 15-2051 and one on 15-2041: the
# mistyped 12-5021 must take 15-2051, although 15-2041 sorts first.
COMPETING = [("15-2051.00", "Data Scientists"), ("15-2051.00", "Data Scientists"),
             ("15-2041.00", "Data Scientists"), ("12-5021", "Data Scientists")]


def main():
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "crosswalk.csv"
        path.write_text(CROSSWALK)
        crosswalk = single_targets(path)
    frame = recode_soc(pd.DataFrame({"SOC_CODE": list(EXPECTED),
                                     "SOC_TITLE": [TITLES.get(c, c) for c in EXPECTED]}), crosswalk, KNOWN)
    got = {c: (None if pd.isna(o) else o) for c, o in zip(frame["SOC_CODE"], frame["occupation"])}
    failures = [f"{code}: expected {want}, got {got[code]}" for code, want in EXPECTED.items() if got[code] != want]
    valid = dict(zip(frame["SOC_CODE"], frame["soc_valid"]))
    legacy = dict(zip(frame["SOC_CODE"], frame["legacy"]))
    if valid["40-9999"] or legacy["12-1252"]:
        failures.append("a dropped code must be invalid, and a mistyped one is not a 2010 code")
    split = dict(zip(frame["SOC_CODE"], frame["wage_split"]))
    if not split["15-1295.00"] or legacy["15-1295.00"]:
        failures.append("15-1295.00 must count as an R&D split, not a 2010 code")
    outside = sorted(set(frame.loc[frame["soc_valid"], "occupation"]) - KNOWN)
    if outside:
        failures.append(f"recoded to codes that are no 2018 code: {outside}")
    codes, titles = zip(*COMPETING)
    competing = recode_soc(pd.DataFrame({"SOC_CODE": codes, "SOC_TITLE": titles}), crosswalk, KNOWN)
    if competing["occupation"].iloc[-1] != "15-2051":
        failures.append(f"12-5021 with two competing codes: expected 15-2051, got {competing['occupation'].iloc[-1]}")
    for line in failures:
        print(f"FAILED  {line}")
    if not failures:
        print(f"ok      {len(EXPECTED)} codes recoded as expected, and the more common of two competing codes wins")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
