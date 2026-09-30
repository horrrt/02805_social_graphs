"""The shape each week 5 page script expects from its JSON, checked with Pydantic.

Each section's model sits under its heading and is mapped to its file in PAGES,
as analysis/week04_schemas.py does. Run python analysis/check_pages.py.
"""

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
    crossing_sd_runs: float = Count
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


class Relations(Model):
    meta: RelMeta
    coverage: Coverage
    labels: list[LabelCount] = Field(min_length=1)
    precision: dict[str, Precision]
    communities: Communities
    crossing: list[Crossing] = Field(min_length=1)
    concordance: list[Line] = Field(min_length=1)

    @model_validator(mode="after")
    def every_label(self):
        assert set(self.precision) == set(LABELS), "a precision row for every label"
        assert {c.label for c in self.crossing} == set(LABELS), "a crossing row for every label"
        return self


PAGES = {
    "docs/weeks/week05/data/copying.json": Copying,
    "docs/weeks/week05/data/relations.json": Relations,
}
