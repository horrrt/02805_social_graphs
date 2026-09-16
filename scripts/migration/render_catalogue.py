"""Render the source catalogue from scripts/migration/sources.py.

Writes MIGRATION_DATA_CATALOGUE.md for reading and data/migration_sources.tsv
for filtering. Run it after any edit to sources.py; never edit the outputs.

    python scripts/migration/render_catalogue.py
"""

from __future__ import annotations

import collections
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import sources

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DOC = ROOT / "MIGRATION_DATA_CATALOGUE.md"
QUESTIONS_DOC = ROOT / "MIGRATION_QUESTIONS.md"
TSV = ROOT / "data" / "migration_sources.tsv"

TSV_COLUMNS = ["id", "name", "family", "publisher", "unit", "coverage", "years",
               "cadence", "access", "fmt", "api", "licence", "network",
               "metrics", "limits", "url", "checked"]


def slug(text):
    """GitHub's heading anchor rule: lowercase, drop punctuation, spaces to hyphens."""
    keep = [c for c in text.lower() if c.isalnum() or c in " -_"]
    return "".join(keep).strip().replace(" ", "-")


def cell(value):
    if isinstance(value, list):
        value = " | ".join(value)
    return str(value).replace("\t", " ").replace("\n", " ")


LOCAL_NOTES = {
    "migration_nodes.tsv": "Migration organisations harvested from the Wikipedia "
        "category tree and classified through Wikidata. See `wikidata-orgs` below.",
    "migration_edges.tsv": "Article-link arcs among those organisations: A -> B when "
        "A's English Wikipedia article links to B's.",
    "migration_org_edges.tsv": "Declared Wikidata ties among the same organisations: "
        "member of, parent organisation, subsidiary, affiliation, part of.",
    "migration_countries.tsv": "Per-country roll-up of the organisation set.",
    "migration_flows.tsv": "UN DESA bilateral migrant stock, 1990 to 2024. "
        "See `undesa-ims` below.",
    "migration_displacement.tsv": "UNHCR origin/asylum populations for one year. "
        "See `unhcr-rdf` below.",
    "migration_country_indicators.tsv": "World Bank country indicators. "
        "See `wb-wdi` below.",
    "migration_sources.tsv": "This catalogue, as a table.",
}


def local_files():
    """What is already on disk here, counted rather than claimed."""
    rows = []
    for path in sorted((ROOT / "data").glob("migration_*.tsv")):
        header, body, comments = None, 0, []
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("#"):
                    comments.append(line.lstrip("# ").rstrip())
                elif header is None:
                    header = line.rstrip("\n").split("\t")
                else:
                    body += 1
        rows.append({
            "file": path.name,
            "rows": body,
            "columns": header or [],
            "note": LOCAL_NOTES.get(path.name, comments[0] if comments else ""),
        })
    return rows


def render_markdown():
    by_family = collections.defaultdict(list)
    for source in sources.SOURCES:
        by_family[source["family"]].append(source)

    out = []
    out.append("# Global migration data: what exists, what is in it, what it will not tell you\n")
    out.append(
        f"{len(sources.SOURCES)} sources across {len(sources.FAMILIES)} families, "
        "written for the 02805 project. Each entry says what one row is, because "
        "that decides whether the source is a network or a table of country "
        "attributes. The limitations are the point: most of these datasets are "
        "fine and most published uses of them are not.\n"
    )
    out.append(
        "`checked` marks the few sources this repo actually pulled and counted. "
        "Everything else is written from prior knowledge and should be confirmed "
        "against the publisher before a number from it goes in a post.\n"
    )
    out.append(
        "Machine-readable version: [`data/migration_sources.tsv`](data/migration_sources.tsv). "
        "Source of truth: [`scripts/migration/sources.py`](scripts/migration/sources.py). "
        "Regenerate with `python scripts/migration/render_catalogue.py`.\n"
    )

    out.append("## Contents\n")
    for key, title, blurb in sources.FAMILIES:
        count = len(by_family[key])
        out.append(f"- [{title}](#{slug(title)}) ({count}) — {blurb}")
    out.append("")

    by_id = {source["id"]: source for source in sources.SOURCES}

    out.append("## The four questions, and what each one needs\n")
    out.append(
        "The measure does not pick the dataset. The question does, and for all four "
        "of these the obvious dataset gives a confident wrong answer. Read the trap "
        "before the list.\n"
    )
    for q in sources.QUESTIONS:
        out.append(f"#### {q['measure']}: {q['question']}\n")
        out.append(f"**What the edges have to be.** {q['edges']}\n")
        out.append(f"**The trap.** {q['trap']}\n")
        out.append("| Role | Source | What it adds here |")
        out.append("| --- | --- | --- |")
        for role, key in (("Primary", "primary"), ("Supporting", "supporting")):
            for source_id in q[key]:
                source = by_id[source_id]
                out.append(
                    f"| {role} | [{source['name']}](#{slug(source['name'])}) | "
                    f"{cell(source['network'])} |"
                )
        out.append("")
        out.append(f"**What is missing.** {q['gap']}\n")

    out.append("## The short answer\n")
    out.append(
        "If you want one weighted directed country network, take **UN DESA "
        "International Migrant Stock** and read its reporting-granularity "
        "limitation first. If you want flows rather than stocks, take **Abel and "
        "Cohen**. If you want high frequency, take **Eurostat monthly asylum "
        "applications** and accept that it is Europe. If you want a network that "
        "is not about people moving, take **visa requirements** or the "
        "**organisation link network** in this repo.\n"
    )

    local = local_files()
    if local:
        out.append("## Already harvested into this repo\n")
        out.append("Row counts are from the files on disk, not from the publisher's "
                   "documentation. Rebuild any of them with "
                   "`python scripts/migration/run_all.py`.\n")
        out.append("| File | Rows | Columns | What it is |")
        out.append("| --- | ---: | --- | --- |")
        for row in local:
            columns = ", ".join(f"`{c}`" for c in row["columns"])
            out.append(f"| [`data/{row['file']}`](data/{row['file']}) | "
                       f"{row['rows']:,} | {columns} | {row['note']} |")
        out.append("")

    for key, title, blurb in sources.FAMILIES:
        out.append(f"## {title}\n")
        out.append(f"{blurb}\n")
        for source in by_family[key]:
            out.append(f"### {source['name']}\n")
            out.append(f"{source['publisher']}. <{source['url']}>\n")
            out.append("| | |")
            out.append("| --- | --- |")
            out.append(f"| One row is | {cell(source['unit'])} |")
            out.append(f"| Coverage | {cell(source['coverage'])} |")
            out.append(f"| Years | {cell(source['years'])} |")
            out.append(f"| Updated | {cell(source['cadence'])} |")
            out.append(f"| Access | {cell(source['access'])} |")
            out.append(f"| Format | {cell(source['fmt'])} |")
            out.append(f"| API | {cell(source['api'])} |")
            out.append(f"| Licence | {cell(source['licence'])} |")
            out.append(f"| Network shape | {cell(source['network'])} |")
            out.append("")
            out.append("**Metrics**\n")
            for metric in source["metrics"]:
                out.append(f"- {metric}")
            out.append("")
            out.append("**Limitations**\n")
            for limit in source["limits"]:
                out.append(f"- {limit}")
            out.append("")
            if source["checked"] != "not fetched":
                out.append(f"*Checked: {source['checked']}*\n")

    DOC.write_text("\n".join(out), encoding="utf-8")
    return len(out)


def render_tsv():
    with TSV.open("w", encoding="utf-8") as fh:
        fh.write("# Index of migration data sources. Rendered from "
                 "scripts/migration/sources.py; do not edit by hand.\n")
        fh.write("# 'metrics' and 'limits' hold pipe-separated lists.\n")
        fh.write("\t".join(TSV_COLUMNS) + "\n")
        for source in sources.SOURCES:
            fh.write("\t".join(cell(source[c]) for c in TSV_COLUMNS) + "\n")


def render_questions_page():
    """The reading page: four questions, the trap in each, the data each needs."""
    by_id = {source["id"]: source for source in sources.SOURCES}
    out = []
    out.append("# Four questions about global migration, and the data each one needs\n")
    out.append(
        "Working notes from the 02805 Social Graphs and Interactions project at DTU, "
        "September 2026. We moved the project off the shared Marvel graph and onto "
        "global migration, and these are the four questions we want to answer with "
        "network measures.\n"
    )
    out.append(
        "The point of this page is the traps. Each of the four questions has a "
        "plausible wrong answer that falls straight out of the standard dataset "
        "without complaining. Knowing which dataset answers which question turned "
        "out to be most of the work, so we wrote it down.\n"
    )
    out.append(
        "The full reference, with 82 sources and their limitations, is in "
        "[MIGRATION_DATA_CATALOGUE.md](MIGRATION_DATA_CATALOGUE.md). Every source "
        "named below links into it.\n"
    )

    out.append("## What a network of migration even is\n")
    out.append(
        "Two different graphs get called the migration network, and they answer "
        "different questions.\n"
    )
    out.append(
        "The **country network** has one node per country and an arc from A to B "
        "weighted by how many people born in A now live in B. The UN's International "
        "Migrant Stock is the canonical version: 232 destinations, 238 origins, "
        "measured every five years since 1990. It is a stock, so it counts who is "
        "there now, not who moved this year.\n"
    )
    out.append(
        "The **organisation network** has one node per body that works on migration: "
        "UNHCR, the Danish Refugee Council, a national border agency, a Polish "
        "cultural institute in London. We harvest ours from Wikipedia and Wikidata, "
        "with an arc from A to B when A's article links to B's. An article link is "
        "not a relationship, which is a limitation we carry on every claim.\n"
    )
    out.append(
        "Most of what follows is about the country network, because three of the four "
        "questions are about countries.\n"
    )

    for q in sources.QUESTIONS:
        out.append(f"## {q['measure']}\n")
        out.append(f"> {q['question']}\n")
        out.append(f"**The trap.** {q['trap']}\n")
        out.append(f"**What the edges have to be.** {q['edges']}\n")
        out.append("**What to use**\n")
        for source_id in q["primary"]:
            source = by_id[source_id]
            note = q["notes"].get(source_id, source["network"])
            out.append(f"- [**{source['name']}**](MIGRATION_DATA_CATALOGUE.md#"
                       f"{slug(source['name'])}) — {note}")
        out.append("")
        extra = [i for i in q["supporting"] if i in q["notes"]]
        if extra:
            out.append("**Worth having**\n")
            for source_id in extra:
                source = by_id[source_id]
                out.append(f"- [{source['name']}](MIGRATION_DATA_CATALOGUE.md#"
                           f"{slug(source['name'])}) — {q['notes'][source_id]}")
            out.append("")
        rest = [i for i in q["supporting"] if i not in q["notes"]]
        if rest:
            names = ", ".join(
                f"[{by_id[i]['name']}](MIGRATION_DATA_CATALOGUE.md#{slug(by_id[i]['name'])})"
                for i in rest)
            out.append(f"Also relevant: {names}.\n")
        out.append(f"**What is missing.** {q['gap']}\n")

    out.append("## How to read the catalogue\n")
    out.append(
        "Every entry says what one row is, because that decides whether a source is a "
        "network or a table of country attributes. Sources marked *checked* were "
        "pulled and counted here; the rest are written from prior knowledge and should "
        "be confirmed against the publisher before a number from them goes anywhere.\n"
    )
    out.append(
        "The list lives in [`scripts/migration/sources.py`](scripts/migration/sources.py) "
        "and both documents are generated from it by "
        "[`scripts/migration/render_catalogue.py`](scripts/migration/render_catalogue.py). "
        "Edit the Python, not the Markdown.\n"
    )
    out.append("*Log-Log Legends: \u00c0ngela Bux\u00f3, Gyula K\u00fcrthy, Niklas Johansen.*\n")

    QUESTIONS_DOC.write_text("\n".join(out), encoding="utf-8")
    return len(out)


def main():
    lines = render_markdown()
    question_lines = render_questions_page()
    render_tsv()
    print(f"wrote {DOC.relative_to(ROOT)} ({lines} lines)")
    print(f"wrote {QUESTIONS_DOC.relative_to(ROOT)} ({question_lines} lines)")
    print(f"wrote {TSV.relative_to(ROOT)} ({len(sources.SOURCES)} rows)")


if __name__ == "__main__":
    main()
