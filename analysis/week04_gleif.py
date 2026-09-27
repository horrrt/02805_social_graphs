"""Company families from GLEIF: which of our employers and clients share an ultimate parent.

A name matcher cannot join Citibank N.A. to Citigroup or Infosys BPM to Infosys:
they are separate legal entities with their own names and tax numbers. The
Global Legal Entity Identifier Foundation (GLEIF) publishes every registered
entity and, for most large ones, its ultimate accounting parent (CC0). This
script matches our company spellings to that register and proposes family rows
for week04_client_aliases.csv.

Method
- Spellings: every normalized name (week04_names.legal_name for employers and
  green-card filers, week04_names.client for clients) with 20 or more filings
  over FY2022 to FY2026, counting certified H-1B filings, client placements and
  certified green-card filings.
- Register: GLEIF's Golden Copy of 26 September 2026, only entities whose legal
  or headquarters address is in the US and whose status is ACTIVE; their legal
  name and first other name, normalized the same way. A spelling matches an
  entity when the two normalized names are equal: no fuzzy matching.
- Parent: the entity's active IS_ULTIMATELY_CONSOLIDATED_BY relationship; an
  entity that reports none is its own parent. A spelling that matches entities
  with different parents is ambiguous and left alone.
- Proposal: spellings that share an ultimate parent form a group. The group
  takes the one canonical company the alias table already names for a member;
  two different canonicals (Microsoft and LinkedIn) mean the table keeps them
  apart on purpose, and the group is only listed. A member is proposed for the
  merge when its first word and the canonical's share their first four letters
  (Citibank and Citigroup; Infosys BPM and Infosys), which keeps the table's
  rule that separately branded companies stay separate (Whole Foods under
  Amazon). Every other member goes on the review list.

    python analysis/week04_gleif.py            # match and report
    python analysis/week04_gleif.py --write    # also append the proposed rows to the alias table

Output: analysis/week04_gleif.json; with --write, rows appended to
analysis/week04_client_aliases.csv under a comment naming this script.
Source: https://www.gleif.org/en/lei-data/gleif-golden-copy (CC0).
"""

import argparse
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

import week04_names as names
from week04_data import OUT as BUILD, ROOT, load
from week04_staffing import certified, placements, resolver

RAW = ROOT / "build" / "raw" / "gleif"
LEI_FILE = RAW / "gleif-lei2-20260926.csv.zip"
RR_FILE = RAW / "gleif-rr-20260926.csv.zip"
US_EXTRACT = BUILD / "gleif_us.csv.gz"
PARENTS_EXTRACT = BUILD / "gleif_parents.csv.gz"
OUT = Path(__file__).with_suffix(".json")
YEARS = [2022, 2023, 2024, 2025, 2026]
MIN_FILINGS = 20
BRAND = 4  # letters the first words must share
# A spelling made only of these words names a kind of place, not one company:
# "GENERAL HOSPITAL" matches Massachusetts General's legal name, but in the
# filings it is any general hospital.
GENERIC = {"GENERAL", "HOSPITAL", "MEDICAL", "CENTER", "CENTRE", "HEALTH", "SYSTEM", "SYSTEMS", "SERVICES",
           "UNIVERSITY", "COLLEGE", "SCHOOL", "BANK", "CLINIC", "COMMUNITY", "REGIONAL", "MEMORIAL",
           "TECHNOLOGIES", "TECHNOLOGY", "SOLUTIONS", "CONSULTING", "GLOBAL", "INTERNATIONAL", "OF"}


def us_register():
    """US-addressed, active GLEIF entities: LEI and normalized names. Cached, since
    the register is 5 GB unzipped."""
    if US_EXTRACT.exists():
        return pd.read_csv(US_EXTRACT, dtype=str, keep_default_na=False)
    cols = {"LEI": "lei", "Entity.LegalName": "legal", "Entity.OtherEntityNames.OtherEntityName.1": "other",
            "Entity.LegalAddress.Country": "legal_country", "Entity.HeadquartersAddress.Country": "hq_country",
            "Entity.EntityStatus": "status"}
    parts = []
    with zipfile.ZipFile(LEI_FILE) as z, z.open(z.namelist()[0]) as fh:
        for chunk in pd.read_csv(fh, usecols=list(cols), dtype=str, keep_default_na=False, chunksize=250_000):
            chunk = chunk.rename(columns=cols)
            us = chunk[((chunk["legal_country"] == "US") | (chunk["hq_country"] == "US")) & (chunk["status"] == "ACTIVE")]
            parts.append(us[["lei", "legal", "other"]])
            print(f"register: {sum(len(p) for p in parts):,} US entities so far", flush=True)
    frame = pd.concat(parts, ignore_index=True)
    frame["key"] = frame["legal"].map(names.legal_name)
    frame["other_key"] = frame["other"].map(lambda s: names.legal_name(s) if s else "")
    frame.to_csv(US_EXTRACT, index=False)
    return frame


def parent_names(leis):
    """Legal names of the given LEIs wherever they are registered (Infosys
    Limited is Indian), from a second pass over the register. Cached."""
    if PARENTS_EXTRACT.exists():
        cached = pd.read_csv(PARENTS_EXTRACT, dtype=str, keep_default_na=False)
        if set(leis) <= set(cached["lei"]):
            return dict(zip(cached["lei"], cached["legal"]))
    found = []
    with zipfile.ZipFile(LEI_FILE) as z, z.open(z.namelist()[0]) as fh:
        for chunk in pd.read_csv(fh, usecols=["LEI", "Entity.LegalName"], dtype=str, keep_default_na=False,
                                 chunksize=500_000):
            found.append(chunk[chunk["LEI"].isin(leis)])
    frame = pd.concat(found).rename(columns={"LEI": "lei", "Entity.LegalName": "legal"})
    frame.to_csv(PARENTS_EXTRACT, index=False)
    return dict(zip(frame["lei"], frame["legal"]))


def ultimate_parents():
    """child LEI -> ultimate parent LEI, from active relationships."""
    with zipfile.ZipFile(RR_FILE) as z, z.open(z.namelist()[0]) as fh:
        rr = pd.read_csv(fh, dtype=str, keep_default_na=False, usecols=[
            "Relationship.StartNode.NodeID", "Relationship.EndNode.NodeID",
            "Relationship.RelationshipType", "Relationship.RelationshipStatus"])
    rr = rr[(rr["Relationship.RelationshipType"] == "IS_ULTIMATELY_CONSOLIDATED_BY")
            & (rr["Relationship.RelationshipStatus"] == "ACTIVE")]
    return dict(zip(rr["Relationship.StartNode.NodeID"], rr["Relationship.EndNode.NodeID"]))


def spellings():
    """normalized spelling -> filings over FY2022 to FY2026, all three sources."""
    counts = Counter()
    for year in YEARS:
        lca = certified(year)
        counts.update(lca["EMPLOYER_NAME"].map(names.legal_name).value_counts().to_dict())
        sites = load(f"worksites_fy{year}")
        sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y")
                      & sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])]
        counts.update(sites["SECONDARY_ENTITY_BUSINESS_NAME"].map(names.client).dropna().value_counts().to_dict())
        perm = load(f"perm_fy{year}")
        status = perm["CASE_STATUS"].str.upper().str.replace(r"\s*-\s*", "-", regex=True)
        perm = perm[status.isin({"CERTIFIED", "CERTIFIED-EXPIRED"})]
        counts.update(perm["EMP_BUSINESS_NAME"].map(names.legal_name).value_counts().to_dict())
        print(f"FY{year}: {len(counts):,} spellings so far", flush=True)
    counts.pop("", None)
    return {k: n for k, n in counts.items() if n >= MIN_FILINGS}


def brand(word_a, word_b):
    return len(word_a) >= BRAND and len(word_b) >= BRAND and word_a[:BRAND] == word_b[:BRAND]


def first_word(s):
    return names.normalize(s).split()[0] if names.normalize(s) else ""


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--write", action="store_true", help="append the proposed rows to the alias table")
    args = parser.parse_args()

    ours = spellings()
    register = us_register()
    by_key = defaultdict(set)
    ours = {k: n for k, n in ours.items() if not set(k.split()) <= GENERIC}
    for lei, key, other in zip(register["lei"], register["key"], register["other_key"]):
        if key in ours:
            by_key[key].add(lei)
        if other and other in ours:
            by_key[other].add(lei)
    parent_of = ultimate_parents()
    legal = dict(zip(register["lei"], register["legal"]))

    matched, ambiguous = {}, []
    for key, leis in by_key.items():
        parents = {parent_of.get(lei, lei) for lei in leis}
        if len(parents) == 1:
            matched[key] = parents.pop()
        else:
            ambiguous.append({"spelling": key, "filings": ours[key], "parents": sorted(parents)})

    groups = defaultdict(list)
    for key, parent in matched.items():
        groups[parent].append(key)

    aliases = names.aliases()
    legal.update(parent_names({p for p in groups}))
    proposed, review, kept_apart, new_families = [], [], [], []
    for parent, keys in groups.items():
        parent_name = legal.get(parent, parent)
        # The parent itself may be a company the table names (Infosys Limited
        # for Infosys Public Services), even when no US spelling of it matched.
        parent_family = names.family(names.legal_name(parent_name))
        families = {names.family(k) for k in keys} | ({parent_family} if parent_family in names.canonicals() else set())
        if len(families) < 2:
            continue  # the table already has them as one company
        canon = {aliases[k][0] for k in keys if k in aliases} | {f for f in families if f in names.canonicals()}
        entry = {"parent_lei": parent, "parent": parent_name,
                 "members": sorted(({"spelling": k, "filings": ours[k], "now": names.family(k)} for k in keys),
                                   key=lambda m: -m["filings"])}
        if len(canon) > 1:
            kept_apart.append({**entry, "canonicals": sorted(canon)})
            continue
        top = max(keys, key=lambda k: ours[k])
        # No member is in the table yet: the most-filed member names the company.
        known = bool(canon)
        target = canon.pop() if canon else names.tidy(top)
        joining = [k for k in keys if names.family(k) != target and k != top and brand(first_word(k), first_word(target))]
        others = [k for k in keys if names.family(k) != target and k != top and k not in joining]
        for k in others:
            review.append({"name": k, "canonical": target, "filings": ours[k], "parent": parent_name})
        if not joining:
            continue  # nothing would merge; a row would only rename a key
        # The company keeps its industry: the table's, else the one the SEC or
        # Wikidata tables hold under its current key (often "FEIN ...").
        sector = (next((s for c, s in aliases.values() if c == target and s), "")
                  or names.naics2(resolver().client(top) or top))
        # The most-filed spelling needs the brand too (Auris Health is J&J's, but its own brand).
        rows = joining + ([top] if names.family(top) != target and brand(first_word(top), first_word(target)) else [])
        if top not in rows and names.family(top) != target and top not in others:
            review.append({"name": top, "canonical": target, "filings": ours[top], "parent": parent_name})
        for k in rows:
            # Only a company the reviewed table already names takes new rows
            # unasked; a family the script would have to name itself (Siemens,
            # where a spin-off shares the parent) waits for review.
            (proposed if known else new_families).append(
                {"name": k, "canonical": target, "naics2": sector, "filings": ours[k], "parent": parent_name})

    proposed.sort(key=lambda r: -r["filings"])
    review.sort(key=lambda r: -r["filings"])
    out = {
        "generated_by": "analysis/week04_gleif.py",
        "source": "GLEIF Golden Copy, 26 September 2026 (CC0): LEI records and relationship records",
        "min_filings": MIN_FILINGS,
        "spellings": len(ours),
        "spelling_filings": sum(ours.values()),
        "us_active_entities": len(register),
        "spellings_matched": len(by_key),
        "matched_filing_share": round(sum(ours[k] for k in by_key) / sum(ours.values()), 4),
        "spellings_with_one_parent": len(matched),
        "ambiguous": sorted(ambiguous, key=lambda a: -a["filings"])[:40],
        "ambiguous_count": len(ambiguous),
        "groups_with_2plus_companies": sum(len({names.family(k) for k in ks}) > 1 for ks in groups.values()),
        "proposed_rows": proposed,
        "proposed_filings": sum(r["filings"] for r in proposed),
        "review": review,
        "new_families": sorted(new_families, key=lambda r: -r["filings"]),
        "kept_apart": kept_apart,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps({k: v for k, v in out.items() if k not in ("proposed_rows", "review", "kept_apart", "ambiguous")}, indent=1))
    print(f"{len(proposed)} proposed rows, {len(new_families)} rows for new families and {len(review)} "
          f"other spellings to review, {len(kept_apart)} groups kept apart")
    for r in proposed[:25]:
        print(f"  {r['name']!r:45} -> {r['canonical']!r:25} {r['filings']:>6}  ({r['parent']})")

    if args.write and proposed:
        present = set(aliases)
        rows = [r for r in proposed if r["name"] not in present]
        with open(names.ALIASES, "a", encoding="utf-8") as fh:
            fh.write("# From GLEIF ultimate parents (analysis/week04_gleif.py), 26 Sep 2026: same parent, same brand.\n")
            for r in rows:
                fh.write(f"{r['name']},{r['canonical']},{r['naics2']}\n")
        print(f"appended {len(rows)} rows to {names.ALIASES.name}")


if __name__ == "__main__":
    main()
