"""The shape the Week 2 post (transit.js, ride.mjs) and Screen Test expect from their JSON.

Same approach as week04_schemas.py. arcade_graph.json is checked in
week01_schemas.py; the cross-file checks here read it for node ids and degrees.
"""

import json
import math
from pathlib import Path

from pydantic import Field, model_validator

from week04_schemas import Count, Model

ROOT = Path(__file__).resolve().parents[1]


def arcade():
    graph = json.loads((ROOT / "docs/assets/data/arcade_graph.json").read_text())
    return {n["id"]: n for n in graph["nodes"]}, {frozenset(link) for link in graph["links"]}


# docs/assets/data/week02_transit.json: transit.js ---------------------------------

class Station(Model):
    id: str
    x: float = Field(ge=0, le=1030)
    y: float = Field(ge=0, le=780)


class Line(Model):
    id: int = Field(ge=1)  # 0 is the "All tracks" view
    stations: list[str] = Field(min_length=2)


class Bin(Model):
    value: int = Count
    count: int = Count


class Null(Model):
    mean: float
    histogram: list[Bin] = Field(min_length=1)


class Closure(Model):
    id: str
    label: str
    degree: int = Count
    null: Null


class Transit(Model):
    stations: list[Station] = Field(min_length=2)
    lines: list[Line] = Field(min_length=1)
    closures: list[Closure] = Field(min_length=1)

    @model_validator(mode="after")
    def references(self):
        nodes, links = arcade()
        ids = [s.id for s in self.stations]
        assert len(set(ids)) == len(ids) and set(ids) <= set(nodes), "a station is repeated or not an article"
        assert [line.id for line in self.lines] == list(range(1, len(self.lines) + 1)), "line ids must run 1..L"
        segments = [frozenset(pair) for line in self.lines for pair in zip(line.stations, line.stations[1:])]
        assert all(s in set(ids) for line in self.lines for s in line.stations), "a line visits an unknown station"
        assert all(seg in links for seg in segments), "a line joins two stations with no link between them"
        assert len(set(segments)) == len(segments), "two lines share a segment"
        for c in self.closures:
            assert c.id in nodes and nodes[c.id]["component"] == "core", f"{c.id}: closures must be core articles"
            assert c.degree == nodes[c.id]["degree"], f"{c.id}: degree differs from arcade_graph.json"
            values = [b.value for b in c.null.histogram]
            assert values == sorted(set(values)), f"{c.id}: histogram values repeat or are out of order"
            assert sum(b.count for b in c.null.histogram) == 1000, f"{c.id}: histogram does not hold 1,000 draws"
        return self


# docs/assets/data/week02_screentest.json: prototypes/screen-test ----------------

class Meta(Model):
    n: int = Field(ge=1)
    m: int = Field(ge=1)
    kbar: float = Field(gt=0)
    samples: int = Field(ge=1)


class Summary(Model):
    n: int = Field(ge=1)
    path: float = Field(gt=0)
    clus: float = Field(ge=0, le=1)
    kmax: int = Field(ge=1)


class Row(Model):
    key: str
    label: str
    real: float
    mu: float
    sd: float
    z: float
    p: float = Field(gt=0, le=1)


class Net(Model):
    pos: list[tuple[float, float]]
    edges: list[tuple[int, int]]
    deg: list[int]
    ccdf: list[tuple[int, float]]

    @model_validator(mode="after")
    def consistent(self):
        n = len(self.pos)
        assert all(0 <= x <= 1 and 0 <= y <= 1 for x, y in self.pos), "positions leave the unit square"
        assert all(0 <= a < n and 0 <= b < n for a, b in self.edges), "an edge index is out of range"
        degree = [0] * n
        for a, b in self.edges:
            degree[a] += 1
            degree[b] += 1
        assert degree == self.deg, "deg does not match the edges"
        ks = [k for k, _ in self.ccdf]
        ps = [p for _, p in self.ccdf]
        assert ks == sorted(ks) and all(a >= b for a, b in zip(ps, ps[1:])), "ccdf is not a ccdf"
        return self


class ScreenTest(Model):
    meta: Meta
    models: dict[str, Summary]
    rows: list[Row] = Field(min_length=1)
    null: dict
    nets: dict[str, Net]
    chars: list[tuple[str, int, float, str, str]]
    adj: list[list[int]]

    @model_validator(mode="after")
    def references(self):
        assert set(self.models) >= {"marvel", "er", "ws", "ba"} and set(self.nets) >= {"marvel", "er", "ws", "ba"}
        # The page reads clustering as rows[0]: a reordering would silently show another quantity.
        assert self.rows[0].key == "clus", "rows[0] must be clustering"
        assert sum(r.key == "paradox" for r in self.rows) == 1, "exactly one paradox row"
        assert all(math.isfinite(r.z) for r in self.rows), "a z-score is not finite"
        assert len(self.null["clus"]) == self.meta.samples, "null draws differ from meta.samples"
        n = self.meta.n
        assert len(self.chars) == len(self.adj) == n == len(self.nets["marvel"].pos), "sizes disagree"
        for i, nbrs in enumerate(self.adj):
            assert all(0 <= j < n and j != i and i in self.adj[j] for j in nbrs), f"adj[{i}] is not symmetric"
            assert self.chars[i][1] == len(nbrs) == self.nets["marvel"].deg[i], f"chars[{i}] degree disagrees"
        return self


PAGES = {
    "docs/assets/data/week02_transit.json": Transit,
    "docs/assets/data/week02_screentest.json": ScreenTest,
}
