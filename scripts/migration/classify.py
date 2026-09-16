"""Stage 3: decide what is an organisation, and which country it belongs to.

Recall came from the category tree; this is where precision comes from. A
candidate is kept when its Wikidata `instance of` class is, transitively, a
subclass of organization (Q43229). Everything else is written to a second file
rather than thrown away, because the discarded pile is the honest description
of what the crawl swept up.

Country is taken from `country` (P17); failing that from the country of the
headquarters, then of the administrative area, then from the name of the
category the article was found in ("... in Denmark", "... based in Canada").
The rule that fired is recorded per node, so the map can be read with the right
amount of trust.

    python scripts/migration/classify.py [--out DIR]
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from wikiclients import batched, sparql

ORGANIZATION = "Q43229"

# Reported type, most specific first: the first class that matches wins.
TYPE_ORDER = [
    ("intergovernmental organization", "Q245065"),
    ("United Nations body", "Q1786447"),
    ("government agency", "Q327333"),
    ("ministry", "Q192350"),
    ("law enforcement agency", "Q1667921"),
    ("armed organization", "Q17149090"),
    ("court", "Q41487"),
    ("political party", "Q7278"),
    ("trade union", "Q178790"),
    ("religious organization", "Q1530022"),
    ("research institute", "Q31855"),
    ("think tank", "Q1053008"),
    ("university", "Q3918"),
    ("museum", "Q33506"),
    ("charitable organization", "Q708676"),
    ("non-governmental organization", "Q79913"),
    ("nonprofit organization", "Q163740"),
    ("voluntary association", "Q48204"),
    ("company", "Q783794"),
    ("international organization", "Q484652"),
    ("organization", ORGANIZATION),
]

IN_COUNTRY = re.compile(r"\b(?:in|based in|of|from|to)\s+(.+)$")


def subclass_closure(classes, root):
    """Which of `classes` are, transitively, subclasses of `root`?"""
    found = set()
    chunks = list(batched(sorted(classes), 300))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT DISTINCT ?c WHERE {{ VALUES ?c {{ {values} }} "
            f"?c wdt:P279* wd:{root} . }}"
        )
        found.update(r["c"].rsplit("/", 1)[-1] for r in rows)
        print(f"  subclass of {root}, chunk {i}/{len(chunks)}: {len(found)}", flush=True)
    return found


def country_of(qids):
    """P17 for a pile of place items, so a headquarters resolves to a country."""
    out = {}
    chunks = list(batched(sorted(qids), 300))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT ?place ?country WHERE {{ VALUES ?place {{ {values} }} "
            f"?place wdt:P17 ?country . }}"
        )
        for row in rows:
            out[row["place"].rsplit("/", 1)[-1]] = row["country"].rsplit("/", 1)[-1]
        print(f"  place -> country chunk {i}/{len(chunks)}: {len(out)}", flush=True)
    return out


def country_metadata(qids):
    out = {}
    chunks = list(batched(sorted(qids), 300))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT ?c ?label ?iso ?continentLabel WHERE {{ VALUES ?c {{ {values} }} "
            f"OPTIONAL {{ ?c rdfs:label ?label . FILTER(lang(?label) = 'en') }} "
            f"OPTIONAL {{ ?c wdt:P297 ?iso }} "
            f"OPTIONAL {{ ?c wdt:P30 ?continent . "
            f"?continent rdfs:label ?continentLabel . FILTER(lang(?continentLabel) = 'en') }} }}"
        )
        for row in rows:
            qid = row["c"].rsplit("/", 1)[-1]
            slot = out.setdefault(qid, {"label": "", "iso": "", "continent": ""})
            slot["label"] = slot["label"] or row.get("label", "")
            slot["iso"] = slot["iso"] or row.get("iso", "")
            slot["continent"] = slot["continent"] or row.get("continentLabel", "")
        print(f"  country metadata chunk {i}/{len(chunks)}: {len(out)}", flush=True)
    return out


def country_from_categories(categories, name_to_qid):
    for category in categories:
        name = category.split(":", 1)[1]
        match = IN_COUNTRY.search(name)
        if not match:
            continue
        tail = match.group(1).strip()
        for prefix in ("the ",):
            if tail.lower().startswith(prefix):
                tail = tail[len(prefix):]
        qid = name_to_qid.get(tail.lower())
        if qid:
            return qid, category
    return None, None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="build/migration")
    args = parser.parse_args()
    out = pathlib.Path(args.out)

    candidates = json.loads((out / "candidates.json").read_text())
    qid_bundle = json.loads((out / "qids.json").read_text())
    claims = json.loads((out / "claims.json").read_text())
    labels = json.loads((out / "labels.json").read_text())
    sitelinks = json.loads((out / "sitelinks.json").read_text())

    qid_by_title = qid_bundle["qid_by_title"]
    redirects = qid_bundle["redirects"]
    page_info = qid_bundle["page_info"]

    # A redirect and its target share a Q-id; fold the categories together.
    categories_by_qid = {}
    title_by_qid = {}
    for title, cats in candidates.items():
        resolved = redirects.get(title, title)
        qid = qid_by_title.get(resolved)
        if not qid:
            continue
        categories_by_qid.setdefault(qid, set()).update(cats)
        title_by_qid.setdefault(qid, resolved)

    instance_of = claims["instance_of"]
    all_classes = {c for values in instance_of.values() for c in values}
    print(f"distinct instance-of classes: {len(all_classes)}")
    org_classes = subclass_closure(all_classes, ORGANIZATION)
    print(f"of which organisation classes: {len(org_classes)}")

    type_classes = {}
    for name, root in TYPE_ORDER:
        type_classes[name] = subclass_closure(all_classes & org_classes, root) \
            if root != ORGANIZATION else set(org_classes)

    # Places that need resolving to a country.
    places = set()
    for prop in ("headquarters", "admin_area"):
        for values in claims[prop].values():
            places.update(values)
    place_country = country_of(places)

    countries_seen = set()
    for values in claims["country"].values():
        countries_seen.update(values)
    countries_seen.update(place_country.values())

    organisations = {}
    rejected = {}
    for qid, cats in categories_by_qid.items():
        classes = set(instance_of.get(qid, []))
        if not classes & org_classes:
            rejected[qid] = {
                "title": title_by_qid[qid],
                "instance_of": sorted(classes),
                "categories": sorted(cats),
            }
            continue
        org_type = next(
            (name for name, _ in TYPE_ORDER if classes & type_classes[name]),
            "organization",
        )
        organisations[qid] = {
            "title": title_by_qid[qid],
            "instance_of": sorted(classes),
            "org_type": org_type,
            "categories": sorted(cats),
        }
    print(f"organisations: {len(organisations)}   rejected: {len(rejected)}")

    meta = country_metadata(countries_seen)
    name_to_qid = {v["label"].lower(): k for k, v in meta.items() if v["label"]}

    for qid, node in organisations.items():
        direct = claims["country"].get(qid, [])
        if direct:
            node["country"] = direct[0]
            node["country_source"] = "P17"
        else:
            via = None
            for prop, tag in (("headquarters", "P159"), ("admin_area", "P131")):
                for place in claims[prop].get(qid, []):
                    if place in place_country:
                        via, node["country_source"] = place_country[place], tag
                        break
                if via:
                    break
            if via:
                node["country"] = via
            else:
                guess, category = country_from_categories(node["categories"], name_to_qid)
                node["country"] = guess or ""
                node["country_source"] = f"category:{category}" if guess else "none"

        info = page_info.get(node["title"], {})
        node["pageid"] = info.get("pageid")
        node["length"] = info.get("length")
        node["label"] = labels.get(qid, {}).get("label", node["title"])
        node["description"] = labels.get(qid, {}).get("description", "")
        node["wikipedia_languages"] = sitelinks.get(qid, 0)
        for prop in ("inception", "dissolved", "website", "coordinates"):
            values = claims[prop].get(qid, [])
            node[prop] = values[0] if values else ""
        for prop in ("member_of", "parent_org", "subsidiary", "affiliation",
                     "part_of", "has_part"):
            node[prop] = claims[prop].get(qid, [])

    (out / "organisations.json").write_text(json.dumps(organisations, indent=1, sort_keys=True))
    (out / "rejected.json").write_text(json.dumps(rejected, indent=1, sort_keys=True))
    (out / "country_meta.json").write_text(json.dumps(meta, indent=1, sort_keys=True))

    placed = sum(1 for n in organisations.values() if n["country"])
    print(f"with a country: {placed} of {len(organisations)}")


if __name__ == "__main__":
    main()
