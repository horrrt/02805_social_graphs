"""Every DESA Table 1 country code below 900 must map or be allowlisted.

fetch_country_layer.desa_flows() already raises if it meets an M49 code under
900 that is neither in the pinned ISO 3166-1/M49 table nor on
UNMAPPED_ALLOWLIST, so a broken mapping cannot silently drop a country the way
the old Wikidata join dropped the Netherlands, Palestine, Taiwan and
Bonaire/Sint Eustatius/Saba. This test re-checks that gate directly against
the workbook, so a regression fails in CI/local runs rather than only being
caught the next time someone reruns the fetch by hand.

Needs build/raw/undesa_stock_2024.xlsx, which is gitignored (see
scripts/rebuild_week03.py); it is downloaded here if missing, which needs the
network. This test does not silently skip: if the workbook cannot be fetched,
it fails with that reason rather than reporting a pass.

    python scripts/migration/test_m49_mapping.py
"""

from __future__ import annotations

import collections
import pathlib
import sys

import pandas as pd

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from fetch_country_layer import DESA_URL, UNMAPPED_ALLOWLIST, download, m49_to_iso3

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
RAW = ROOT / "build" / "raw"


def main() -> int:
    cache = RAW
    cache.mkdir(parents=True, exist_ok=True)
    iso_by_m49, _ = m49_to_iso3(cache)

    path = download(DESA_URL, cache / "undesa_stock_2024.xlsx")
    sheet = pd.read_excel(path, sheet_name="Table 1", header=None, skiprows=11,
                          engine="calamine")

    codes_below_900 = collections.Counter()
    names = {}
    for row in sheet.itertuples(index=False, name=None):
        if pd.isna(row[0]):
            continue
        for code, name in ((str(int(row[4])), str(row[1])), (str(int(row[6])), str(row[5]))):
            if int(code) < 900:
                codes_below_900[code] += 1
                names[code] = name

    unmapped = {code: count for code, count in codes_below_900.items()
               if code not in iso_by_m49 and code not in UNMAPPED_ALLOWLIST}
    unused_allowlist = {code for code in UNMAPPED_ALLOWLIST if code not in codes_below_900}

    failures = []
    if unmapped:
        failures.append(
            "unmapped M49 codes below 900: " +
            ", ".join(f"{c} {names.get(c, '?')} ({n}x)" for c, n in sorted(unmapped.items())))
    if unused_allowlist:
        failures.append(
            "UNMAPPED_ALLOWLIST entries no longer seen in the workbook (stale, remove): "
            + ", ".join(sorted(unused_allowlist)))
    # The four codes A1 fixed must be present and mapped, not just absent from
    # the failure list above by accident (e.g. if DESA stopped reporting them).
    for code, expect_iso3 in {"528": "NLD", "158": "TWN", "275": "PSE", "535": "BES"}.items():
        if code not in codes_below_900:
            failures.append(f"M49 {code} ({expect_iso3}) no longer appears in DESA Table 1; "
                            "the regression this test guards against cannot be checked")
        elif iso_by_m49.get(code) != expect_iso3:
            failures.append(f"M49 {code} maps to {iso_by_m49.get(code)!r}, expected {expect_iso3!r}")

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    print(f"ok: {len(codes_below_900)} distinct M49 country codes below 900, "
          f"all mapped or allowlisted ({len(UNMAPPED_ALLOWLIST)} allowlisted)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
