"""Stage 2: attach Wikidata facts to every candidate article.

Two hops. First English Wikipedia's `pageprops` turns article titles into Q-ids
(and resolves redirects, so two titles for one organisation collapse into one
node). Then one SPARQL query per property pulls the facts back in chunks, which
keeps each query cheap enough that the public endpoint answers it.

    python scripts/migration/fetch_wikidata.py [--out DIR]
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from wikiclients import WIKIPEDIA_API, api, batched, sparql

# Properties worth having on an organisation. The comment is the question each
# one answers in the analysis.
ITEM_PROPERTIES = {
    "P31": "instance_of",        # what kind of thing is it
    "P17": "country",            # which country is it of
    "P159": "headquarters",      # where does it sit
    "P131": "admin_area",        # fallback when P17 and P159 are both missing
    "P571": "inception",         # when did it start
    "P576": "dissolved",         # is it still going
    "P856": "website",
    "P463": "member_of",         # organisation-to-organisation membership
    "P749": "parent_org",
    "P355": "subsidiary",
    "P1416": "affiliation",
    "P361": "part_of",
    "P527": "has_part",
    "P625": "coordinates",
}

CHUNK = 300


def titles_to_qids(titles):
    """enwiki pageprops, 50 titles at a time, following redirects."""
    resolved = {}
    info = {}
    redirects = {}
    for i, chunk in enumerate(batched(titles, 50), 1):
        payload = api(
            WIKIPEDIA_API,
            action="query",
            titles="|".join(chunk),
            prop="pageprops|info",
            ppprop="wikibase_item|disambiguation",
            redirects=1,
        )
        query = payload.get("query", {})
        for red in query.get("redirects", []):
            redirects[red["from"]] = red["to"]
        for page in query.get("pages", []):
            if page.get("missing"):
                continue
            props = page.get("pageprops", {})
            if "disambiguation" in props:
                continue
            qid = props.get("wikibase_item")
            if not qid:
                continue
            resolved[page["title"]] = qid
            info[page["title"]] = {
                "pageid": page.get("pageid"),
                "length": page.get("length"),
            }
        print(f"  pageprops chunk {i}: {len(resolved)} with a Q-id", flush=True)
    return resolved, info, redirects


def fetch_property(qids, prop):
    """One SPARQL per property. Values come back as Q-ids or literals."""
    out = {}
    chunks = list(batched(sorted(qids), CHUNK))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT ?item ?value WHERE {{ VALUES ?item {{ {values} }} "
            f"?item wdt:{prop} ?value . }}"
        )
        for row in rows:
            item = row["item"].rsplit("/", 1)[-1]
            value = row["value"]
            if value.startswith("http://www.wikidata.org/entity/Q"):
                value = value.rsplit("/", 1)[-1]
            out.setdefault(item, []).append(value)
        print(f"  {prop} chunk {i}/{len(chunks)}: {len(out)} items so far", flush=True)
    return out


def fetch_labels(qids):
    out = {}
    chunks = list(batched(sorted(qids), CHUNK))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT ?item ?label ?description WHERE {{ VALUES ?item {{ {values} }} "
            f"OPTIONAL {{ ?item rdfs:label ?label . FILTER(lang(?label) = 'en') }} "
            f"OPTIONAL {{ ?item schema:description ?description . "
            f"FILTER(lang(?description) = 'en') }} }}"
        )
        for row in rows:
            item = row["item"].rsplit("/", 1)[-1]
            out[item] = {
                "label": row.get("label", ""),
                "description": row.get("description", ""),
            }
        print(f"  labels chunk {i}/{len(chunks)}", flush=True)
    return out


def fetch_sitelinks(qids):
    """How many language Wikipedias carry the organisation: a reach proxy."""
    out = {}
    chunks = list(batched(sorted(qids), CHUNK))
    for i, chunk in enumerate(chunks, 1):
        values = " ".join(f"wd:{q}" for q in chunk)
        rows = sparql(
            f"SELECT ?item (COUNT(DISTINCT ?site) AS ?n) WHERE {{ "
            f"VALUES ?item {{ {values} }} "
            f"?site schema:about ?item ; schema:isPartOf / wikibase:wikiGroup 'wikipedia' . }} "
            f"GROUP BY ?item"
        )
        for row in rows:
            out[row["item"].rsplit("/", 1)[-1]] = int(row["n"])
        print(f"  sitelinks chunk {i}/{len(chunks)}", flush=True)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="build/migration")
    args = parser.parse_args()
    out = pathlib.Path(args.out)

    candidates = json.loads((out / "candidates.json").read_text())
    print(f"candidates: {len(candidates)}")

    qid_by_title, page_info, redirects = titles_to_qids(candidates)
    (out / "qids.json").write_text(json.dumps(
        {"qid_by_title": qid_by_title, "page_info": page_info, "redirects": redirects},
        indent=1, sort_keys=True))

    qids = set(qid_by_title.values())
    print(f"distinct Q-ids: {len(qids)}")

    claims = {}
    for prop, name in ITEM_PROPERTIES.items():
        print(f"fetching {prop} ({name})", flush=True)
        claims[name] = fetch_property(qids, prop)
    (out / "claims.json").write_text(json.dumps(claims, indent=1, sort_keys=True))

    print("fetching labels", flush=True)
    (out / "labels.json").write_text(json.dumps(fetch_labels(qids), indent=1, sort_keys=True))

    print("fetching sitelink counts", flush=True)
    (out / "sitelinks.json").write_text(json.dumps(fetch_sitelinks(qids), indent=1, sort_keys=True))
    print("done")


if __name__ == "__main__":
    main()
