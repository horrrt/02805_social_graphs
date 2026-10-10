"""Stage 5: write the dataset out as tables (analysis/tables.py), in the shape the Marvel files use.

Four files land in data/:

  migration_nodes.parquet      one organisation per row, with country and type
  migration_edges.parquet      A -> B when A's article links to B's
  migration_org_edges.parquet  typed Wikidata ties: member of, parent, affiliation
  migration_countries.parquet  the per-country roll-up

plus a facts JSON so a post can quote numbers without re-running the harvest.

    python scripts/migration/emit.py [--out DIR] [--data DIR]
"""

from __future__ import annotations

import argparse
import collections
import datetime
import io
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "analysis"))

import scope
import tables

WIKIDATA_TIES = ["member_of", "parent_org", "subsidiary", "affiliation",
                 "part_of", "has_part"]


def clean(value):
    if value is None:
        return ""
    return str(value).replace("\t", " ").replace("\n", " ").strip()


def node_id(title):
    return title.replace(" ", "_")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="build/migration")
    parser.add_argument("--data", default="data")
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    data = pathlib.Path(args.data)
    data.mkdir(parents=True, exist_ok=True)

    organisations = json.loads((out / "organisations.json").read_text())
    country_meta = json.loads((out / "country_meta.json").read_text())
    link_edges = [tuple(e) for e in json.loads((out / "link_edges.json").read_text())]
    categories = json.loads((out / "categories.json").read_text())
    stamp = datetime.date.today().isoformat()

    ids = {qid: node_id(node["title"]) for qid, node in organisations.items()}

    header = (
        f"# 02805 global migration organisations — harvested {stamp}\n"
        f"# English Wikipedia category tree under {len(scope.SEED_CATEGORIES)} migration "
        f"roots ({len(categories)} categories visited, depth {scope.MAX_DEPTH}),\n"
        f"# kept when Wikidata says the item is an organization (P31/P279* Q43229).\n"
    )

    with io.StringIO() as fh:
        fh.write(header)
        fh.write("# node_id matches migration_edges.parquet. country_source records which "
                 "rule placed the organisation.\n")
        fh.write("node_id\tname\twikidata_id\torg_type\tcountry\tcountry_iso\t"
                 "continent\tinception\tdissolved\twikipedia_languages\twebsite\turl\tdescription\t"
                 "country_source\tcategories\n")
        for qid in sorted(organisations, key=lambda q: ids[q]):
            node = organisations[qid]
            country = node.get("country", "")
            meta = country_meta.get(country, {})
            fh.write("\t".join(clean(x) for x in [
                ids[qid],
                node["label"] or node["title"],
                qid,
                node["org_type"],
                meta.get("label", ""),
                meta.get("iso", ""),
                meta.get("continent", ""),
                (node.get("inception") or "")[:10],
                (node.get("dissolved") or "")[:10],
                node.get("wikipedia_languages", 0),
                node.get("website", ""),
                "https://en.wikipedia.org/wiki/" + node_id(node["title"]),
                node.get("description", ""),
                node.get("country_source", ""),
                "|".join(c.split(":", 1)[1] for c in node["categories"]),
            ]) + "\n")
        tables.save_text(data / "migration_nodes.parquet", fh.getvalue())

    with io.StringIO() as fh:
        fh.write(header)
        fh.write(f"# {len(organisations)} nodes, {len(link_edges)} directed arcs. "
                 "Isolated organisations exist — take the node set from migration_nodes.parquet.\n")
        fh.write("# source\ttarget\n")
        for source, target in sorted(link_edges, key=lambda e: (ids[e[0]], ids[e[1]])):
            fh.write(f"{ids[source]}\t{ids[target]}\n")
        tables.save_text(data / "migration_edges.parquet", fh.getvalue(), names=["source", "target"])

    typed = []
    for qid, node in organisations.items():
        for tie in WIKIDATA_TIES:
            for other in node.get(tie, []):
                if other in organisations and other != qid:
                    typed.append((ids[qid], ids[other], tie))
    with io.StringIO() as fh:
        fh.write(header)
        fh.write("# Declared organisation-to-organisation ties from Wikidata, not "
                 "article links. Both endpoints are in migration_nodes.parquet.\n")
        fh.write("# source\ttarget\trelation\n")
        for row in sorted(set(typed)):
            fh.write("\t".join(row) + "\n")
        tables.save_text(data / "migration_org_edges.parquet", fh.getvalue(), names=["source", "target", "relation"])

    per_country = collections.Counter()
    types_per_country = collections.defaultdict(collections.Counter)
    for node in organisations.values():
        per_country[node.get("country", "")] += 1
        types_per_country[node.get("country", "")][node["org_type"]] += 1
    with io.StringIO() as fh:
        fh.write(header)
        fh.write("# One row per country. 'unplaced' counts organisations no rule "
                 "could place, mostly international bodies.\n")
        fh.write("country\tcountry_iso\tcontinent\twikidata_id\torganisations\ttop_types\n")
        for country, count in per_country.most_common():
            meta = country_meta.get(country, {})
            top = ", ".join(f"{t} {n}" for t, n in types_per_country[country].most_common(3))
            fh.write("\t".join(clean(x) for x in [
                meta.get("label", "") or ("unplaced" if not country else country),
                meta.get("iso", ""), meta.get("continent", ""), country, count, top,
            ]) + "\n")
        tables.save_text(data / "migration_countries.parquet", fh.getvalue())

    facts = {
        "harvested": stamp,
        "seed_categories": len(scope.SEED_CATEGORIES),
        "categories_visited": len(categories),
        "max_depth": scope.MAX_DEPTH,
        "organisations": len(organisations),
        "link_arcs": len(link_edges),
        "wikidata_ties": len(set(typed)),
        "countries": sum(1 for c in per_country if c),
        "unplaced": per_country.get("", 0),
        "org_types": dict(collections.Counter(
            n["org_type"] for n in organisations.values()).most_common()),
        "top_countries": [
            {"country": country_meta.get(c, {}).get("label", c), "count": n}
            for c, n in per_country.most_common(25) if c
        ],
    }
    (data / "migration_facts.json").write_text(json.dumps(facts, indent=1))
    print(json.dumps(facts, indent=1)[:1200])


if __name__ == "__main__":
    main()
