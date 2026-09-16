"""Stage 4: the article link graph among the organisations.

Same rule the course uses on Marvel: an arc A -> B when A's English Wikipedia
article links to B's. Outgoing links are read for every node and then filtered
to the node set, so the result is the induced subgraph and nothing leaks in from
outside the dataset. Redirects are folded into their target first, so a link to
"UNHCR" and a link to "United Nations High Commissioner for Refugees" count once.

    python scripts/migration/fetch_links.py [--out DIR]
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from wikiclients import WIKIPEDIA_API, api, batched


def outgoing_links(titles):
    """prop=links, 50 articles per request, following every continuation."""
    links = {t: set() for t in titles}
    chunks = list(batched(titles, 50))
    for i, chunk in enumerate(chunks, 1):
        params = dict(
            action="query",
            titles="|".join(chunk),
            prop="links",
            plnamespace=0,
            pllimit=500,
            redirects=1,
        )
        pages_seen = 0
        while True:
            payload = api(WIKIPEDIA_API, **params)
            for page in payload.get("query", {}).get("pages", []):
                title = page["title"]
                if title not in links:
                    continue
                pages_seen += 1
                for link in page.get("links", []):
                    links[title].add(link["title"])
            if "continue" not in payload:
                break
            params.update(payload["continue"])
        total = sum(len(v) for v in links.values())
        print(f"  links chunk {i}/{len(chunks)}: {total} raw links", flush=True)
    return links


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="build/migration")
    args = parser.parse_args()
    out = pathlib.Path(args.out)

    organisations = json.loads((out / "organisations.json").read_text())
    redirects = json.loads((out / "qids.json").read_text())["redirects"]

    title_to_qid = {node["title"]: qid for qid, node in organisations.items()}
    # A link may point at a redirect; map those titles onto the node they mean.
    for source, target in redirects.items():
        if target in title_to_qid:
            title_to_qid.setdefault(source, title_to_qid[target])

    titles = sorted({node["title"] for node in organisations.values()})
    print(f"fetching links for {len(titles)} articles")
    raw = outgoing_links(titles)

    edges = set()
    for title, targets in raw.items():
        source = title_to_qid.get(title)
        if not source:
            continue
        for target_title in targets:
            target = title_to_qid.get(target_title)
            if target and target != source:
                edges.add((source, target))

    (out / "link_edges.json").write_text(json.dumps(sorted(edges), indent=0))
    print(f"arcs inside the node set: {len(edges)}")


if __name__ == "__main__":
    main()
