"""The shape the Week 3 post (corridor.js, questions.js, echarts-views.js) expects.

Same approach as week04_schemas.py: fields the page scripts read, and the
cross-references they rely on. Year keys are ints in the corridors and edges
files and strings inside nodes, totals and the cartography file.
"""

import json
from pathlib import Path

from pydantic import Field, model_validator

from week04_schemas import Count, Model

ROOT = Path(__file__).resolve().parents[1]
ISO3 = Field(pattern=r"^[A-Z]{3}$")
ROLES = {"ultra-peripheral", "peripheral", "connector", "kinless", "provincial hub", "connector hub", "kinless hub"}


def corridors():
    return json.loads((ROOT / "docs/assets/data/week03_corridors.json").read_text())


# docs/assets/data/week03_corridors.json ---------------------------------------

class YearBlock(Model):
    in_strength: int = Count
    out_strength: int = Count
    in_degree: int = Count
    out_degree: int = Count
    betweenness: float = Count
    pagerank: float = Field(gt=0)
    in_strength_rank: int = Field(ge=1)
    out_strength_rank: int = Field(ge=1)
    in_degree_rank: int = Field(ge=1)
    out_degree_rank: int = Field(ge=1)
    betweenness_rank: int = Field(ge=1)
    pagerank_rank: int = Field(ge=1)
    z: float | None = None


class Partner(Model):
    other: str = ISO3
    weight: int = Field(ge=1)


class Source(Model):
    other: str = ISO3
    gives: float = Count
    share: float = Field(ge=0, le=1)  # rounded to 4 places, so a tiny share reads 0.0
    sender_rank: int = Field(ge=1)


class Node(Model):
    iso3: str = ISO3
    iso2: str
    name: str
    coord: tuple[float, float] | None  # [lat, lon]
    flight_partners: int = Count
    flight_in_degree: int = Count
    flight_strength: int = Count
    flight_betweenness: float = Count
    top_in: list[Partner] = Field(max_length=5)
    top_out: list[Partner] = Field(max_length=5)
    pagerank_sources: list[Source] = Field(max_length=3)
    years: dict[str, YearBlock]


class Totals(Model):
    corridors: int = Count
    countries: int = Count
    people: int = Count


class NullEntry(Model):
    null_mean: float = Count
    null_sd: float = Count
    z: float


class Corridors(Model):
    years: list[int] = Field(min_length=1)
    null_year: int
    shuffles: int = Field(ge=1)
    countries: list[str]
    corridor_count: int = Count
    focus: dict
    flight_snapshot: dict
    totals: dict[str, Totals]
    null_summary: dict[str, NullEntry]
    broker_summary: dict
    indicators: dict[str, dict]
    nodes: dict[str, Node]

    @model_validator(mode="after")
    def references(self):
        assert self.years == sorted(self.years) and self.null_year in self.years
        assert len(set(self.countries)) == len(self.countries) and set(self.countries) == set(self.nodes)
        assert self.focus["iso3"] in self.nodes, "the focus country is not a node"
        assert self.corridor_count == self.totals[str(self.null_year)].corridors
        for key, node in self.nodes.items():
            assert node.iso3 == key, f"{key}: iso3 differs from its key"
            assert node.flight_partners <= len(self.nodes) - 1, f"{key}: more flight partners than countries"
            assert set(node.years) <= {str(y) for y in self.years}, f"{key}: unknown year"
            for p in node.top_in + node.top_out + node.pagerank_sources:
                assert p.other in self.nodes, f"{key}: partner {p.other} is not a node"
            weights = [p.weight for p in node.top_in]
            assert weights == sorted(weights, reverse=True), f"{key}: top_in out of order"
            for year, block in node.years.items():
                # z belongs to the null year only; the page reads it from there.
                assert (block.z is not None) == (year == str(self.null_year)), f"{key} {year}: z in the wrong year"
        with_null = {k for k, n in self.nodes.items() if str(self.null_year) in n.years}
        assert set(self.null_summary) == with_null, "null_summary does not cover the null year's countries"
        assert set(self.indicators) <= set(self.nodes)
        return self


# docs/assets/data/week03_edges.json and week03_flights.json ---------------------

class Edges(Model):
    countries: list[str]
    years: list[int]
    fields: list[str]
    edges: list[tuple[int, int, list[int], int, int, int]]

    @model_validator(mode="after")
    def references(self):
        c = corridors()
        assert self.countries == c["countries"], "edges and corridors list countries differently"
        assert self.years == c["years"]
        # The page reads each edge by position.
        assert self.fields == ["origin", "destination", "stocks", "km", "female", "forced"], "field order changed"
        n, seen = len(self.countries), set()
        for oi, di, stocks, km, female, forced in self.edges:
            assert 0 <= oi < n and 0 <= di < n and oi != di, "an edge index is out of range"
            assert (oi, di) not in seen, "a repeated corridor"
            seen.add((oi, di))
            assert len(stocks) == len(self.years) and min(stocks) >= 0 and max(stocks) > 0, "bad stocks"
            assert km >= 0 and female >= -1 and forced >= 0
        people = {str(y): sum(e[2][i] for e in self.edges) for i, y in enumerate(self.years)}
        assert all(people[y] == t["people"] for y, t in c["totals"].items()), "totals.people differs from the edges"
        return self


class Flights(Model):
    countries: list[str]
    fields: list[str]
    edges: list[tuple[int, int, int]]

    @model_validator(mode="after")
    def references(self):
        c = corridors()
        assert self.countries == c["countries"], "flights and corridors list countries differently"
        assert list(self.fields) == ["origin", "destination", "routes"], "field order changed"
        n = len(self.countries)
        assert all(0 <= a < n and 0 <= b < n and a != b and r > 0 for a, b, r in self.edges), "bad flight edge"
        assert len({(a, b) for a, b, _ in self.edges}) == len(self.edges), "a repeated flight pair"
        partners = [set() for _ in range(n)]
        for a, b, _ in self.edges:
            partners[a].add(b)
            partners[b].add(a)
        for i, iso in enumerate(self.countries):
            assert len(partners[i]) == c["nodes"][iso]["flight_partners"], f"{iso}: flight_partners disagrees"
        return self


# docs/assets/data/week03_cartography.json -------------------------------------

class Placement(Model):
    role: str
    stability: float = Field(gt=0, le=1)
    z: float
    p: float = Field(ge=0, le=1)


class Moved(Model):
    iso3: str = ISO3
    name: str
    to: str
    rise: float


class Cartography(Model):
    threshold: int
    seeds: int = Field(ge=1)
    roles: dict[str, str]  # role -> the description the page shows
    years: list[str]
    by_year: dict[str, dict[str, Placement]]
    moved: list[Moved]

    @model_validator(mode="after")
    def references(self):
        c = corridors()
        # The page looks each role up in its own TYPES table: an unknown role throws.
        assert set(self.roles) == ROLES, "roles differ from the seven the page draws"
        assert self.years == [str(y) for y in c["years"]]
        for year, placements in self.by_year.items():
            for iso, place in placements.items():
                assert iso in c["nodes"] and year in c["nodes"][iso]["years"], f"{iso} {year}: not a node that year"
                assert place.role in ROLES, f"{iso} {year}: unknown role {place.role}"
        rises = [m.rise for m in self.moved]
        assert rises == sorted(rises, reverse=True), "moved is not sorted by rise"
        return self


# docs/assets/data/week03_asylum.json and week03_closures.json -------------------

class Origin(Model):
    name: str
    total: int = Count
    months: list[int | None]


class Asylum(Model):
    months: list[str]
    totals: list[int]
    reporting: int = Field(ge=1)
    origins: dict[str, Origin]

    @model_validator(mode="after")
    def consistent(self):
        assert self.months == sorted(self.months) and len(self.totals) == len(self.months)
        assert "SY" in self.origins, "the page opens on Syria"
        for key, o in self.origins.items():
            assert len(o.months) == len(self.months), f"{key}: month count differs"
            assert o.total == sum(v or 0 for v in o.months), f"{key}: total is not the sum of months"
            assert all(v is None or v <= t for v, t in zip(o.months, self.totals)), f"{key}: above the monthly total"
        return self


class Closures(Model):
    days: dict[str, list[int]]
    levels: list[str] = Field(min_length=5, max_length=5)
    countries: int = Field(ge=1)

    @model_validator(mode="after")
    def consistent(self):
        assert list(self.days) == sorted(self.days)
        assert all(len(v) == 5 and sum(v) <= self.countries for v in self.days.values()), "a day's levels overflow"
        return self


PAGES = {
    "docs/assets/data/week03_corridors.json": Corridors,
    "docs/assets/data/week03_edges.json": Edges,
    "docs/assets/data/week03_flights.json": Flights,
    "docs/assets/data/week03_cartography.json": Cartography,
    "docs/assets/data/week03_asylum.json": Asylum,
    "docs/assets/data/week03_closures.json": Closures,
}
