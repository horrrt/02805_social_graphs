"""The shape the Week 6 page expects from its JSON, checked with Pydantic.

One file, public/weeks/week06/data/lookalikes.json, written by week06_lookalikes.py:
the numbers the prose quotes (facts) and each page's ten neighbours with names kept
and removed (the explorer). Run python analysis/check_pages.py.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="allow")


Share = Field(ge=0, le=1)
Bucket = Literal["story", "mantle", "name", "template"]


class Course(Model):
    raw: float
    stopwords: float
    tfidf: float
    random: float
    vocab: int


class Names(Model):
    types: int
    rule: str
    tfidf_share: float = Share
    hits: float
    lists_unchanged: int
    mean_kept: float
    first_linked: int
    first_linked_no_names: int


class Null(Model):
    runs: int
    words_removed: int
    mean: float
    sd: float
    weight_removed: float = Share


class Pronouns(Model):
    words: list[str]
    hits: float


class GenderTest(Model):
    observed: float
    null_mean: float
    null_sd: float
    z: float


class GenderRep(Model):
    female: GenderTest
    male: GenderTest
    gap: GenderTest
    female_all_slots: float = Share
    slots_to_women: float = Share
    hubs: list[tuple[str, int]]
    women_in_ten: dict[str, float]
    men_lists_half_women: int


class Gender(Model):
    labelled: int
    unlabelled: int
    unlabelled_shared_name: int
    other: dict[str, int]
    female: int
    male: int
    shuffles: int
    tfidf: GenderRep
    no_names: GenderRep
    no_names_pronouns: GenderRep
    words: dict[Literal["no_names", "no_names_pronouns"], list[tuple[str, float]]]
    lists: dict[Literal["gain", "same", "lose", "men_gain"], int]
    women_in_ten_all: dict[Literal["tfidf", "no_names"], float]


class Shares(Model):
    one: float = Field(alias="1", ge=0, le=1)
    two: float = Field(alias="2", ge=0, le=1)
    three: float = Field(alias="3", ge=0, le=1)
    four: float = Field(alias="4+", ge=0, le=1)
    none: float = Share


class Distance(Model):
    tfidf: Shares
    no_names: Shares
    all: Shares


class Read(Model):
    n: int
    buckets: dict[str, str]
    tfidf: dict[Bucket, int]
    no_names: dict[Bucket, int]
    no_names_both_women: int


class Pair(Model):
    rep: Literal["tfidf", "no_names"]
    a: str
    b: str
    words: list[str]
    cos_tfidf: float
    cos_no_names: float
    name_share: float
    distance: Optional[int]
    bucket: Bucket
    note: str


class Facts(Model):
    pages: int
    k: int
    tokens: int
    course: Course
    course_same_neighbours: int
    seeds: tuple[int, int]
    stopword_vocab: int
    names_only: dict[str, float]
    on_every_page: list[str]
    names: Names
    null: Null
    pronouns: Pronouns
    gender: Gender
    distance: Distance
    read: Read
    pairs: list[Pair]


# [neighbour index, cosine, linked 0/1, distance (0 = no path), up to 4 driving words]
Neighbour = tuple[int, float, Literal[0, 1], int, list[str]]


class Lookalikes(Model):
    facts: Facts
    names: list[str] = Field(min_length=303, max_length=303)
    gender: list[str]
    degree: list[int]
    kept: list[list[Neighbour]]
    removed: list[list[Neighbour]]


PAGES = {"public/weeks/week06/data/lookalikes.json": Lookalikes}


# public/weeks/week06/data/lean.json, written by week06_lean.py: section 3's follow-up --------

class Term(Model):
    coef: float
    p: float = Share


class Lean(Model):
    runs: int
    seeds: tuple[int, int]
    pages_with: dict[Literal["reception", "relations"], int]
    section_share: dict[Literal["female", "male"], dict[Literal["reception", "relations"], float]]
    median_words: dict[Literal["female", "male"], int]
    lean: dict[str, float]
    slots_mean: dict[Literal["female", "male"], float]
    model: dict[str, object]


PAGES["public/weeks/week06/data/lean.json"] = Lean


# public/weeks/week06/data/essentials-*.json, written by week06_essentials.py: one file per section ------------

class WeightsPage(Model):
    name: str
    size: int
    count: list[tuple[str, int, int, float, float]]
    tfidf: list[tuple[str, int, int, float, float]]


class Weights(Model):
    pages: list[WeightsPage] = Field(min_length=303, max_length=303)
    facts: dict[str, object]


class CosinePair(Model):
    raw: float = Share
    tfidf: float = Share
    rawWords: list[tuple[str, float]]
    tfidfWords: list[tuple[str, float]]


class Cosine(Model):
    pages: list[str]
    pairs: dict[str, CosinePair]
    norms: list[dict[str, float]]


class Contrast(Model):
    pages: dict[Literal["female", "male"], int]
    terms: list[tuple[str, int, int, float, float, float, bool]]
    top: dict[str, list[tuple[str, float]]]
    null: dict[str, float]


class Fit(Model):
    topics: list[list[tuple[str, float]]]
    mix: list[list[float]] = Field(min_length=303, max_length=303)


class Topics(Model):
    names: list[str] = Field(min_length=303, max_length=303)
    fits: dict[str, Fit]
    stability: dict[str, dict[str, object]]


class Contexts(Model):
    targets: list[str]
    rows: dict[str, dict[Literal["2", "5", "10"], list[tuple[str, int]]]]
    grid: dict[str, list]


class Pmi(Model):
    targets: list[str]
    rows: dict[str, dict[str, object]]


class Vectors(Model):
    targets: list[str]
    near: dict[str, dict[Literal["ppmi", "skipgram", "cbow"], list[tuple[str, float]]]]
    examples: list[dict[str, object]] = Field(min_length=3, max_length=3)


class Glove(Model):
    targets: list[str]
    compare: dict[str, dict[str, list]]


for _name, _model in (("weights", Weights), ("cosine", Cosine), ("contrast", Contrast), ("topics", Topics),
                      ("contexts", Contexts), ("pmi", Pmi), ("vectors", Vectors), ("glove", Glove)):
    PAGES[f"public/weeks/week06/data/essentials-{_name}.json"] = _model
