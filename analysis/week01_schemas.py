"""The shape the Week 1 page (and the lobby, Week 2 and /play/) expects from its JSON.

Same approach as week04_schemas.py: each model lists the fields the page scripts
read and the cross-references they rely on. arcade_graph.json is shared by the
lobby, Week 1 and Week 2, so its model covers what all three read.
"""

import math
from typing import Literal

from pydantic import Field, model_validator

from week04_schemas import Count, Model, Share

NODES = 303
LINKS = 1784


# docs/assets/data/arcade_graph.json: lobby.js, packs.js, transit.js via arcade-core

class ArcadeNode(Model):
    id: str
    name: str
    url: str = Field(pattern=r"^https?://")
    kin: int = Count
    kout: int = Count
    degree: int = Count
    component: Literal["core", "island", "isolate"]
    community: int = Count
    x: float = Field(ge=0, le=930)
    y: float = Field(ge=0, le=630)


class ArcadeGraph(Model):
    nodes: list[ArcadeNode] = Field(min_length=NODES, max_length=NODES)
    links: list[tuple[str, str]] = Field(min_length=LINKS, max_length=LINKS)
    communities: list

    @model_validator(mode="after")
    def references(self):
        ids = [n.id for n in self.nodes]
        assert len(set(ids)) == len(ids), "node ids repeat"
        known = set(ids)
        # graph() and drawNetwork skip unknown ids without a word: fail here instead.
        assert all(a in known and b in known for a, b in self.links), "a link names an unknown node"
        assert all(a != b for a, b in self.links), "a self-loop"
        assert len(set(self.links)) == len(self.links), "a repeated link"
        assert all(0 <= n.community < len(self.communities) for n in self.nodes), "community out of range"
        assert sum(n.kin == 0 for n in self.nodes) == 58, "the page says 58 articles have no incoming links"
        assert sum(n.degree == 0 for n in self.nodes) == 17, "the page says 17 isolates"
        return self


# docs/assets/data/week01_packs.json: packs.js

class Card(Model):
    id: str
    weight: int = Field(ge=1)
    probability: float = Field(gt=0, le=1)


class Bin(Model):
    degree: int = Count
    count: int = Field(ge=1)


class Collector(Model):
    expectedDraws: float = Field(gt=0)
    expectedPacksRounded: int = Field(ge=1)
    expectedPacksLower: float
    expectedPacksUpper: float
    uniformExpectedDraws: float = Field(gt=0)
    uniformExpectedPacks: int = Field(ge=1)
    minimumRateCards: int = Field(ge=1)
    isolateMarginalShare: float = Share
    simulationTrials: int = Field(ge=1)

    @model_validator(mode="after")
    def consistent(self):
        assert self.expectedPacksLower <= self.expectedPacksRounded <= self.expectedPacksUpper + 1
        harmonic = NODES * sum(1 / k for k in range(1, NODES + 1))
        assert math.isclose(self.uniformExpectedDraws, harmonic, rel_tol=1e-9), "equal-odds baseline is 303 * H(303)"
        assert self.expectedDraws > self.uniformExpectedDraws, "unequal odds cannot finish faster"
        return self


class Packs(Model):
    totalWeight: int = Field(ge=1)
    cards: list[Card] = Field(min_length=NODES, max_length=NODES)
    histogram: list[Bin] = Field(min_length=1)
    collector: Collector

    @model_validator(mode="after")
    def adds_up(self):
        # A total above the weights' sum makes the draw loop over-draw the last card.
        assert self.totalWeight == sum(c.weight for c in self.cards), "totalWeight is not the sum of weights"
        assert math.isclose(sum(c.probability for c in self.cards), 1, abs_tol=1e-9), "probabilities do not sum to 1"
        assert all(math.isclose(c.probability, c.weight / self.totalWeight) for c in self.cards)
        degrees = [b.degree for b in self.histogram]
        assert degrees == sorted(set(degrees)), "histogram degrees repeat or are out of order"
        assert sum(b.count for b in self.histogram) == NODES, "histogram does not cover 303 cards"
        assert self.collector.minimumRateCards == sum(c.weight == 1 for c in self.cards)
        return self


# docs/assets/data/marvel_story.json: /play/ (signal.js)

class StoryNode(Model):
    id: str
    kin: int = Count
    kout: int = Count
    grp: Literal["giant", "island", "isolate"]


class StoryLink(Model):
    s: str
    t: str


class Story(Model):
    nodes: list[StoryNode] = Field(min_length=NODES, max_length=NODES)
    links: list[StoryLink] = Field(min_length=LINKS, max_length=LINKS)
    signal: dict

    @model_validator(mode="after")
    def references(self):
        ids = {n.id for n in self.nodes}
        assert all(link.s in ids and link.t in ids for link in self.links), "a link names an unknown node"
        assert sum(n.grp == "island" for n in self.nodes) == 9, "the island has nine members"
        return self


PAGES = {
    "docs/assets/data/arcade_graph.json": ArcadeGraph,
    "docs/assets/data/week01_packs.json": Packs,
    "docs/assets/data/marvel_story.json": Story,
}
