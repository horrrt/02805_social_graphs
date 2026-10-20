"""The shape the Week 7 page expects from its JSON, checked with Pydantic.

One file, public/weeks/week07/data/comention.json, written by week07_comention.py:
the numbers the prose quotes (facts), the hand-read pairs, links and sentences,
and the strongest text ties that are not links. Run python analysis/check_pages.py.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="allow")


Share = Field(ge=0, le=1)


class Unit(Model):
    characters: int
    ties: int
    linked: int
    share_linked: float = Share
    share_links_found: float = Share
    null_mean: float = Share
    null_sd: float
    z: Optional[float]


class Units(Model):
    sentence: Unit
    paragraph: Unit
    page: Unit


class Weight(Model):
    bin: str
    ties: int
    linked: int
    share_linked: float = Share
    null_mean: float = Share
    null_sd: float


class Instrument(Model):
    found: int
    right: int
    missed: int
    precision: float = Share
    recall: float = Share


class Instruments(Model):
    names: Instrument
    ner: Instrument
    sentences: int
    mentions: int


class Course(Model):
    sentences: int
    person_spans: int
    distinct: int
    nodes: int
    edges: int
    top: list[tuple[str, str, int]]


class Partnered(Model):
    name: str
    ties: int
    linked: int


class MostUnlinked(Model):
    characters: list[Partnered]
    unlinked: int


class Facts(Model):
    pages: int
    sentences: int
    links: int
    names: dict[str, int]
    mentions: int
    characters_named: int
    raw_person_strings: int
    units: Units
    ner_sentence: Unit
    weights: list[Weight]
    link_only: dict[str, float]
    arcs: dict[str, int]
    pairs_read: dict[str, int]
    links_read: dict[str, int]
    most_unlinked: MostUnlinked
    instrument: Instruments
    course: Course
    runs: int
    seed: int


class Pair(Model):
    a: str
    b: str
    a_id: str
    b_id: str
    sentences: int
    bucket: Literal["story", "title", "passing", "wrong name"]
    note: str
    example: str


class LinkMissed(Model):
    a: str
    b: str
    a_id: str
    b_id: str
    rule: Literal["named", "not named"]
    bucket: Literal["pronoun", "other name", "no mention"]
    note: str


class SentenceRead(Model):
    page: str
    sentence: str
    read: list[str]
    names: list[str]
    ner: list[str]
    note: str


class Unlinked(Model):
    a: str
    b: str
    sentences: int


class Comention(Model):
    facts: Facts
    pairs: list[Pair]
    links_missed: list[LinkMissed]
    sentences_read: list[SentenceRead]
    top_unlinked: list[Unlinked]
    # The explorer. chars: the 303 names, alphabetical; ties: [a, b, sentences, linked 0/1,
    # first sentence naming both, its name spans, the page it is on]; missed: [a, b, one page names the other 0/1].
    chars: list[str] = Field(min_length=303, max_length=303)
    ties: list[tuple[int, int, int, Literal[0, 1], str, list[tuple[int, int]], str]]
    missed: list[tuple[int, int, Literal[0, 1]]]


PAGES = {"public/weeks/week07/data/comention.json": Comention}
