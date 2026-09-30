"""The shape each week 5 page script expects from its JSON, checked with Pydantic.

Each section's model sits under its heading and is mapped to its file in PAGES,
as analysis/week04_schemas.py does. Run python analysis/check_pages.py.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Model(BaseModel):
    # Fields the page does not read may come and go; the ones listed must be there.
    model_config = ConfigDict(extra="allow")


Share = Field(ge=0, le=1)
Count = Field(ge=0)


# Section 2 · docs/weeks/week05/data/copying.json, read by week05-copying.js ---------

class CopyMeta(Model):
    script: str
    tokeniser: str
    n: int = Field(ge=2)
    n_alt: int = Field(ge=2)
    template_pages: int = Field(ge=2)
    min_passage: int = Field(ge=1)
    pages: int = Field(ge=1)
    tokens: int = Count


class TemplateGram(Model):
    ngram: str
    pages: int = Count


class Template(Model):
    top: list[TemplateGram] = Field(min_length=1)
    ngrams_over_cutoff: int = Count


class CopyHeadline(Model):
    pairs: int = Field(ge=1)
    pages: int = Field(ge=2)
    clusters: int = Field(ge=1)
    largest: int = Field(ge=2)
    linked_share: float = Share
    phrase_pairs: int = Count
    phrase_linked_share: float = Share
    copy_linked: int = Count
    all_pairs: int = Field(ge=1)
    all_linked: int = Count
    all_linked_share: float = Share
    binomial_p: float = Share
    copied_tokens: int = Count


class CopySection(Model):
    section: str
    tokens: int = Count


class CopyNode(Model):
    id: str
    name: str
    cluster: int = Count
    x: float = Share
    y: float = Share
    copied_tokens: int = Count


class CopyLink(Model):
    a: str
    b: str
    tokens: int = Field(ge=1)
    passages: int = Field(ge=1)
    linked: bool
    longest: int = Field(ge=1)
    section_a: str
    section_b: str
    quote: str = Field(min_length=1)


class CopyCluster(Model):
    id: int = Count
    pages: list[str] = Field(min_length=2)
    names: list[str] = Field(min_length=2)
    tokens: int = Field(ge=1)
    pairs: int = Field(ge=1)
    top_pair: tuple[str, str]
    top_section: str


class SweepRow(Model):
    n: int = Field(ge=2)
    template_pages: int = Field(ge=2)
    min_passage: int = Field(ge=1)
    pairs: int = Count
    pages: int = Count
    clusters: int = Count
    largest: int = Count
    linked_share: float | None = Share


class ExtraGroup(Model):
    pages: list[str] = Field(min_length=2)
    names: list[str] = Field(min_length=2)
    pairs: int = Field(ge=1)
    linked: int = Count
    section: str
    example: tuple[str, str]
    quote: str = Field(min_length=1)


class AltExtra(Model):
    n: int = Field(ge=2)
    pairs: int = Count
    groups: list[ExtraGroup]


class Copying(Model):
    meta: CopyMeta
    template: Template
    headline: CopyHeadline
    sections: list[CopySection] = Field(min_length=1)
    nodes: list[CopyNode] = Field(min_length=2)
    links: list[CopyLink] = Field(min_length=1)
    clusters: list[CopyCluster] = Field(min_length=1)
    alt_extra: AltExtra
    sweep: list[SweepRow] = Field(min_length=1)

    @model_validator(mode="after")
    def references(self):
        ids = {n.id for n in self.nodes}
        assert all(link.a in ids and link.b in ids for link in self.links), "a link names an unknown page"
        assert len(self.links) == self.headline.pairs, "one link per copying pair"
        assert len(self.clusters) == self.headline.clusters, "one row per cluster"
        return self


# Section 1 · docs/weeks/week05/data/relations.json, read by week05-relations.js -----

LABELS = ("killed", "family", "enemy", "ally", "teammate")


class RelMeta(Model):
    script: str
    sentences: str
    names: str
    labels: str
    priority: list[str] = Field(min_length=1)
    lexicon: dict[str, list[str]]
    runs: int = Field(ge=1)
    shuffles: int = Field(ge=1)
    sample: int = Field(ge=1)


class Coverage(Model):
    arcs: int = Field(ge=1)
    with_sentence: int = Count
    share: float = Share
    multi_label: int = Count


class LabelCount(Model):
    label: str
    arcs: int = Count
    share: float = Share


class Wrong(Model):
    source: str
    target: str
    note: str


class Precision(Model):
    read: int = Field(ge=1)
    right: int = Count
    share: float = Share
    wrong_examples: list[Wrong]


class Crossing(Model):
    label: str
    arcs: int = Count
    crossing: float = Share
    null_mean: float = Share
    null_sd: float = Count
    z: float
    p_above: float = Share
    p_below: float = Share
    within_page_mean: float = Share
    within_page_sd: float = Count
    within_page_z: float | None


class Line(Model):
    label: str
    page: str
    target: str
    left: str
    hit: str = Field(min_length=1)
    right: str
    verdict: str
    note: str


class Communities(Model):
    runs: int = Field(ge=1)
    median_count: int = Field(ge=1)
    modularity_mean: float


class OnePerPair(Model):
    arcs: int = Field(ge=1)
    crossing: list[Crossing] = Field(min_length=1)


class Relations(Model):
    meta: RelMeta
    coverage: Coverage
    labels: list[LabelCount] = Field(min_length=1)
    precision: dict[str, Precision]
    communities: Communities
    crossing: list[Crossing] = Field(min_length=1)
    one_per_pair: OnePerPair
    concordance: list[Line] = Field(min_length=1)

    @model_validator(mode="after")
    def every_label(self):
        assert set(self.precision) == set(LABELS), "a precision row for every label"
        assert {c.label for c in self.crossing} == set(LABELS), "a crossing row for every label"
        return self



# Sections 3 to 7 --------------------------------------------------------------

class SearchSummary(Model):
    n_queries: int = Field(ge=1)
    hits_at_1: int = Count
    hits_at_5: int = Count
    hit_rate_at_1: float = Share
    hit_rate_at_5: float = Share
    hits_at_1_nostop: int = Count
    hits_at_5_nostop: int = Count
    hit_rate_at_1_nostop: float = Share
    hit_rate_at_5_nostop: float = Share
    chance_at_1: float = Share
    n_failures: int = Count


class SearchOverlap(Model):
    term: str
    query: int = Count
    page: int = Count
    product: int = Count
    is_stop: bool


class SearchHit(Model):
    node_id: str
    name: str
    cosine: float
    overlap_terms: list[SearchOverlap]


class SearchQuery(Model):
    id: str
    query: str
    expected: str
    expected_name: str
    rank: int = Field(ge=1)
    rank_nostop: int = Field(ge=1)
    hit_at_1: bool
    hit_at_5: bool
    top5: list[SearchHit] = Field(min_length=1)
    failure_reason: Optional[str] = None


class SearchPage(Model):
    generated_by: str
    owner: str
    summary: SearchSummary
    queries: list[SearchQuery] = Field(min_length=1)
    baseline: str
    corpus_note: str


class LivePageRow(Model):
    id: str
    name: str
    idx: list[int]
    val: list[int]


class SearchLivePage(Model):
    generated_by: str
    mode: str
    vocab: list[str] = Field(min_length=1)
    pages: list[LivePageRow] = Field(min_length=1)
    n_pages: int = Field(ge=1)
    n_terms: int = Field(ge=1)


class AutocompleteGuessing(Model):
    status: str
    n_responses: int = Count
    n_correct: int = Count
    hit_rate: Optional[float] = None
    chance_rate: float = Share


class AutocompleteFake(Model):
    id: str
    character: str
    community_index: int = Count
    community_label: str
    hubs: list[str] = Field(min_length=1)
    size: int = Field(ge=1)
    text: str
    voice_cues: list[str]


class AutocompletePage(Model):
    generated_by: str
    owner: str
    n_fakes: int = Field(ge=1)
    chance_rate: float = Share
    guessing: AutocompleteGuessing
    options: list[dict] = Field(min_length=1)
    fakes: list[AutocompleteFake] = Field(min_length=1)
    partition: dict


class CommunityHub(Model):
    node_id: str
    name: str
    strength: int = Count


class Community(Model):
    label: str
    size: int = Field(ge=1)
    hubs: list[CommunityHub] = Field(min_length=1)
    members: list[str] = Field(min_length=1)


class CommunitiesPage(Model):
    generated_by: str
    seed: int
    runs: int = Field(ge=1)
    louvain: dict
    null: dict
    communities: list[Community] = Field(min_length=1)
    membership: dict[str, int]


class Week05Payload(Model):
    corpus: dict


PAGES = {
    "docs/weeks/week05/data/copying.json": Copying,
    "docs/weeks/week05/data/relations.json": Relations,
    "docs/weeks/week05/data/search.json": SearchPage,
    "docs/weeks/week05/data/search_live.json": SearchLivePage,
    "docs/weeks/week05/data/autocomplete.json": AutocompletePage,
    "docs/weeks/week05/data/communities.json": CommunitiesPage,
    "analysis/week05_heaps.json": Week05Payload,
    "analysis/week05_fame.json": Week05Payload,
    "analysis/week05_weird.json": Week05Payload,
    "docs/weeks/week05/data/heaps.json": Week05Payload,
    "docs/weeks/week05/data/fame.json": Week05Payload,
    "docs/weeks/week05/data/weird.json": Week05Payload,
}
