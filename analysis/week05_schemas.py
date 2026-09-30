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

class CommonTerm(Model):
    term: str
    count: int = Count
    share: float = Share


class SearchTokenisation(Model):
    method: str
    stoplist: str
    n_pages: int = Field(ge=1)
    n_terms: int = Field(ge=1)
    n_tokens: int = Field(ge=1)
    median_page_tokens: float = Count
    sparsity: float = Share
    most_common: list[CommonTerm] = Field(min_length=1)


class SearchSummary(Model):
    n_queries: int = Field(ge=1)
    n_scored: int = Field(ge=1)
    hits_at_1: int = Count
    hits_at_5: int = Count
    hits_at_1_nostop: int = Count
    hits_at_5_nostop: int = Count
    chance_at_1: float = Share
    chance_at_5: float = Share
    p_at_1: float = Share
    p_at_5: float = Share
    p_at_1_nostop: float = Share
    p_at_5_nostop: float = Share
    n_misses: int = Count
    miss_kinds: dict[str, int]
    misses_won_by_shorter_than_median: int = Count
    misses_with_long_target: int = Count
    random_mean_rank: float = Count


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
    n_tokens: int = Field(ge=1)
    overlap_terms: list[SearchOverlap]


class SearchQuote(Model):
    node_id: str
    name: str
    text: Optional[str] = None


class SearchQuery(Model):
    id: str
    query: str
    expected: Optional[str] = None
    expected_name: Optional[str] = None
    scored: bool
    rank: Optional[int] = Field(default=None, ge=1)
    rank_nostop: Optional[int] = Field(default=None, ge=1)
    hit_at_1: bool
    hit_at_5: bool
    top5: list[SearchHit] = Field(min_length=1)
    expected_overlap: list[SearchOverlap]
    failure_kind: Optional[str] = None
    failure_reason: Optional[str] = None
    quote: Optional[SearchQuote] = None


class SearchChecked(Model):
    query: str
    winner_name: str
    winner_tokens: int = Field(ge=1)
    expected_name: str
    expected_tokens: int = Field(ge=1)
    terms: list[str]
    quote: str = Field(min_length=1)


class SearchPage(Model):
    generated_by: str
    owner: str
    tokenisation: SearchTokenisation
    summary: SearchSummary
    checked: Optional[SearchChecked] = None
    queries: list[SearchQuery] = Field(min_length=1)


class LivePageRow(Model):
    id: str
    name: str
    idx: list[int]
    val: list[int]


class SearchLivePage(Model):
    generated_by: str
    mode: str
    token_rule: str
    stopwords: list[str] = Field(min_length=1)
    top: int = Field(ge=1)
    vocab: list[str] = Field(min_length=1)
    pages: list[LivePageRow] = Field(min_length=1)
    n_pages: int = Field(ge=1)
    n_terms: int = Field(ge=1)


# Section 4 · docs/weeks/week05/data/autocomplete.json, read by week05-autocomplete.js --


class AutocompleteGuessing(Model):
    status: str
    n_groups: int = Count
    n_responses: int = Count
    n_correct: int = Count
    hit_rate: Optional[float] = None
    chance_rate: float = Share
    p_value: Optional[float] = None
    collected_on: Optional[str] = None

    @model_validator(mode="after")
    def honest(self):
        # No hit rate, p-value or date without real answers from other groups.
        if self.n_responses == 0:
            assert self.hit_rate is None and self.p_value is None and self.collected_on is None
            assert self.status == "awaiting_other_groups"
        else:
            assert self.hit_rate == round(self.n_correct / self.n_responses, 4)
            assert self.n_correct <= self.n_responses and self.n_groups >= 1
        return self


class AutocompleteRun(Model):
    length: int = Field(ge=3)
    run: str
    page: str
    sentence: str
    highlight: str
    pages_with_run: int = Field(ge=1)


class AutocompleteFake(Model):
    id: str
    number: int = Field(ge=1)
    character: str
    community_index: int = Count
    community_label: str
    hubs: list[str] = Field(min_length=1)
    size: int = Field(ge=1)
    text: str
    text_unmasked: str
    typical_phrases: list[str]
    longest_run: AutocompleteRun
    longest_run_unmasked: AutocompleteRun


class AutocompleteOption(Model):
    community_index: int = Count
    label: str
    hubs: list[str] = Field(min_length=1)
    size: int = Field(ge=1)


class AutocompleteSummary(Model):
    one_continuation_min: float = Share
    one_continuation_max: float = Share
    bigram_one_continuation_min: float = Share
    bigram_one_continuation_max: float = Share
    run_min: int = Field(ge=3)
    run_max: int = Field(ge=3)
    example: str


class AutocompletePartition(Model):
    runs: int = Field(ge=1)
    null_runs: int = Field(ge=1)
    modularity_mean: float
    modularity_sd: float = Count
    null_mean: float
    null_sd: float = Count
    null_z: float


class AutocompletePage(Model):
    generated_by: str
    owner: str
    tokenisation: dict[str, str | int]
    n_fakes: int = Field(ge=2)
    chance_rate: float = Share
    quiz_variant: str
    guessing: AutocompleteGuessing
    options: list[AutocompleteOption] = Field(min_length=2)
    fakes: list[AutocompleteFake] = Field(min_length=2)
    summary: AutocompleteSummary
    partition: AutocompletePartition

    @model_validator(mode="after")
    def one_fake_per_option(self):
        assert self.n_fakes == len(self.fakes) == len(self.options)
        assert self.chance_rate == round(1 / self.n_fakes, 4) == self.guessing.chance_rate
        assert {f.community_index for f in self.fakes} == {o.community_index for o in self.options}
        assert any(f.id == self.summary.example for f in self.fakes)
        return self


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
    network: dict
    louvain: dict
    consensus: dict
    null: dict
    communities: list[Community] = Field(min_length=1)
    membership: dict[str, int]


# Section 5 · docs/weeks/week05/data/heaps.json, read by week05-heaps.js ------------

class HeapsMeta(Model):
    script: str
    owner: str
    word_rule: str
    pages: int = Field(ge=1)
    tokens: int = Field(ge=1)
    types: int = Field(ge=1)
    order_rule: str
    seed: int
    runs: int = Field(ge=200)
    grid_points: int = Field(ge=2)


class FirstPages(Model):
    pages: int = Field(ge=1)
    most_linked_tokens: int = Count
    least_linked_tokens: int = Count


class HeapsPoint(Model):
    tokens: int = Field(ge=1)
    most_linked: int = Count
    least_linked: int = Count
    random_mean: float = Count
    random_sd: float = Count
    random_p5: float = Count
    random_p95: float = Count
    z_most_linked: float | None
    z_least_linked: float | None


class HeapsCheckpoint(HeapsPoint):
    pages_most_linked: int = Field(ge=1)
    pages_least_linked: int = Field(ge=1)
    in_degree_most_linked: int = Count
    in_degree_least_linked: int = Count


class HeapsSpan(Model):
    order: str
    to: int = Field(ge=1)
    points: int = Field(ge=1)
    z_min: float
    z_max: float


class HeapsFit(Model):
    k: float = Field(gt=0)
    beta: float = Field(gt=0, le=1)
    fit_from: int = Field(ge=1)
    fit_to: int = Field(ge=1)
    beta_runs_mean: float
    beta_runs_sd: float = Count
    beta_runs_p5: float
    beta_runs_p95: float
    split_at: int = Field(ge=1)
    beta_lower: float
    beta_upper: float
    tail_from: int = Field(ge=1)
    tail_new_per_1000: float = Count


class HeapsLate(Model):
    pages: int = Field(ge=1)
    max_in_degree: int = Count
    tokens: int = Field(ge=1)
    new_types: int = Count
    new_per_1000: float = Count
    names: int = Count
    others: int = Count
    name_share: float = Share
    names_initial_only: int = Count
    names_sample: list[str] = Field(min_length=1)
    others_sample: list[str] = Field(min_length=1)
    random_new_types_mean: float = Count
    random_new_types_sd: float = Count
    random_new_per_1000_mean: float = Count
    random_new_per_1000_sd: float = Count
    random_name_share_mean: float = Share
    random_name_share_sd: float = Count


class HeapsPassage(Model):
    page: str
    kind: str
    word: str
    surface: str = Field(min_length=1)
    sentence: str = Field(min_length=1)


class Heaps(Model):
    meta: HeapsMeta
    first_pages: FirstPages
    grid: list[HeapsPoint] = Field(min_length=2)
    checkpoints: list[HeapsCheckpoint] = Field(min_length=1)
    spans: list[HeapsSpan] = Field(min_length=2)
    heaps: HeapsFit
    late: HeapsLate
    passages: list[HeapsPassage] = Field(min_length=1)

    @model_validator(mode="after")
    def consistent(self):
        assert self.grid[-1].tokens == self.meta.tokens, "the grid ends on the whole corpus"
        assert self.grid[-1].random_mean == self.meta.types, "every order ends on the whole vocabulary"
        assert self.late.names + self.late.others == self.late.new_types, "names and others split the new types"
        assert all(p.surface in p.sentence for p in self.passages), "the marked word is in its sentence"
        return self


# Section 7 · docs/weeks/week05/data/weird.json, read by week05-weird.js -------------

class WeirdMeta(Model):
    script: str
    owner: str
    token_rule: str
    sentences: str
    window: int = Field(ge=2)
    window_alt: int = Field(ge=2)
    neighbours: int = Field(ge=2)
    draws: int = Field(ge=2)
    seed: int
    n: int = Field(ge=2)
    template_pages: int = Field(ge=2)
    rare_pages: int = Field(ge=1)


class WeirdCorpus(Model):
    pages: int = Field(ge=1)
    tokens: int = Field(ge=1)
    min_tokens: int = Field(ge=1)
    max_tokens: int = Field(ge=1)
    median_tokens: float = Count
    mattr_mean: float = Share
    median_rare_share: float = Share
    median_boilerplate_share: float = Share
    common_ngrams: int = Count
    lead_ngram: str
    lead_ngram_pages: int = Field(ge=1)


class WeirdChecks(Model):
    spearman_length: float = Field(ge=-1, le=1)
    spearman_length_raw: float = Field(ge=-1, le=1)
    raw_sd_shortest: float = Count
    raw_sd_longest: float = Count
    z_sd_shortest: float = Count
    z_sd_longest: float = Count
    top10_shorter_than_median: int = Field(ge=0, le=10)
    outside_band_short: float = Share
    outside_band_long: float = Share
    spearman_rare_length: float = Field(ge=-1, le=1)
    spearman_boilerplate_length: float = Field(ge=-1, le=1)
    spearman_z_boilerplate: float = Field(ge=-1, le=1)
    spearman_z_boilerplate_p: float = Share


class WeirdStability(Model):
    window_alt: int = Field(ge=2)
    checked: int = Field(ge=1)
    top_survivors: int = Count
    bottom_survivors: int = Count
    spearman: float = Field(ge=-1, le=1)


class WeirdSeveral(Model):
    pages: int = Count
    bottom_decile: int = Field(ge=1)
    in_bottom_decile: int = Count
    expected: float = Count
    p: float = Share
    names: list[str]


class WeirdRow(Model):
    node: str
    name: str
    rank: int = Field(ge=1)
    tokens: int = Field(ge=1)
    mattr: float = Share
    z: float
    z_alt: float
    rank_alt: int = Field(ge=1)
    rare_share: float = Share
    rare_near: float = Share
    boilerplate_share: float = Share
    boilerplate_near: float = Share
    several: bool
    read: str = Field(min_length=1)


class WeirdQuote(Model):
    node: str
    name: str
    rank: int = Field(ge=1)
    text: str = Field(min_length=1)


class WeirdBand(Model):
    tokens: int = Field(ge=1)
    mean: float = Share
    sd: float = Count


class WeirdPoint(Model):
    node: str
    name: str
    tokens: int = Field(ge=1)
    mattr: float = Share
    near_mattr: float = Share
    z: float
    rank: int = Field(ge=1)


class WeirdSummary(Model):
    shown: int = Field(ge=1)
    top_boilerplate_below_near: int = Count
    bottom_boilerplate_above_near: int = Count
    top_rare_above_near: int = Count
    bottom_rare_below_near: int = Count
    band_points: int = Field(ge=2)


class Weird(Model):
    meta: WeirdMeta
    corpus: WeirdCorpus
    checks: WeirdChecks
    stability: WeirdStability
    several: WeirdSeveral
    summary: WeirdSummary
    top: list[WeirdRow] = Field(min_length=1)
    bottom: list[WeirdRow] = Field(min_length=1)
    quotes: list[WeirdQuote] = Field(min_length=4)
    band: list[WeirdBand] = Field(min_length=2)
    points: list[WeirdPoint] = Field(min_length=1)

    @model_validator(mode="after")
    def consistent(self):
        assert len(self.points) == self.corpus.pages, "one point per page"
        assert [p.rank for p in self.points] == list(range(1, len(self.points) + 1)), "points in rank order"
        nodes = {p.node for p in self.points}
        assert all(r.node in nodes for r in self.top + self.bottom + self.quotes), "a row names an unknown page"
        assert self.stability.top_survivors <= self.stability.checked >= self.stability.bottom_survivors
        assert self.several.in_bottom_decile == len(self.several.names), "one name per page in the bottom tenth"
        return self


# Section 6 · docs/weeks/week05/data/fame.json, read by week05-fame.js (owner Niklas)

class FameMeta(Model):
    script: str
    owner: str
    word_rule: str
    fit: str
    name_rule: str
    hub_rule: str
    seed: int
    shuffles: int = Field(ge=1)


class FameCorpus(Model):
    pages: int = Field(ge=1)
    arcs: int = Field(ge=1)
    zero_in_degree: int = Count
    isolates: int = Count
    median_tokens: int = Count
    median_headings: float = Count
    hubs: int = Count


class FameFit(Model):
    slope: float
    intercept: float
    base_tokens: float = Field(gt=0)
    per_doubling: float = Field(gt=0)
    pearson: float = Field(ge=-1, le=1)
    spearman: float = Field(ge=-1, le=1)
    null_mean: float
    null_sd: float = Count
    null_max: float
    p: float = Share


class FameMeasure(Model):
    measure: str
    spearman: float = Field(ge=-1, le=1)


class FameMentions(Model):
    rho: float = Field(ge=-1, le=1)
    null_mean: float
    null_sd: float = Count
    p: float = Share
    above_with_mention_only: int = Count


class FameHubs(Model):
    pages: int = Count
    mean_residual: float
    rest_mean_residual: float
    gap: float
    null_sd: float = Count
    p: float = Share
    below: int = Count


class FamePatterns(Model):
    mentions: FameMentions
    hubs: FameHubs


class FamePoint(Model):
    id: str
    name: str
    in_degree: int = Count
    out_degree: int = Count
    tokens: int = Field(ge=1)
    predicted: int = Field(ge=1)
    residual: float
    ratio: float = Field(gt=0)
    isolate: bool
    hub: bool


class FameCodename(Model):
    name: str
    pages: int = Count
    linked: int = Count
    own: int = Count
    page_ids: list[str]


class FameCast(Model):
    word: str
    linkers: int = Count
    with_word: int = Count


class FameQuote(Model):
    page: str
    text: str = Field(min_length=1)
    highlight: str = Field(min_length=1)
    links: bool | None


class FameOutlier(FamePoint):
    side: str
    place: int = Field(ge=1)
    headings: int = Count
    mentions: int = Count
    mentions_linked: int = Count
    mention_only: int = Count
    in_degree_if_linked: int = Count
    ratio_if_linked: float = Field(gt=0)
    holders: list[str]
    codename: FameCodename | None
    cast: FameCast | None
    reason: str = Field(min_length=1)
    quote: FameQuote

    @model_validator(mode="after")
    def quote_marks_something(self):
        assert self.quote.highlight in self.quote.text, "the highlight must be in the quote"
        assert self.side in ("above", "below")
        return self


class Fame(Model):
    meta: FameMeta
    corpus: FameCorpus
    fit: FameFit
    other_measures: list[FameMeasure] = Field(min_length=1)
    patterns: FamePatterns
    points: list[FamePoint] = Field(min_length=1)
    outliers: list[FameOutlier] = Field(min_length=2)

    @model_validator(mode="after")
    def one_point_per_page(self):
        ids = [p.id for p in self.points]
        assert len(ids) == len(set(ids)) == self.corpus.pages, "one point per page"
        assert all(o.id in set(ids) for o in self.outliers), "an outlier names an unknown page"
        assert sum(p.isolate for p in self.points) == self.corpus.isolates
        return self


class Week05Payload(Model):
    corpus: dict


PAGES = {
    "docs/weeks/week05/data/copying.json": Copying,
    "docs/weeks/week05/data/relations.json": Relations,
    "docs/weeks/week05/data/search.json": SearchPage,
    "docs/weeks/week05/data/search_live.json": SearchLivePage,
    "docs/weeks/week05/data/autocomplete.json": AutocompletePage,
    "docs/weeks/week05/data/communities.json": CommunitiesPage,
    "analysis/week05_heaps.json": Heaps,
    "analysis/week05_fame.json": Fame,
    "analysis/week05_weird.json": Weird,
    "docs/weeks/week05/data/heaps.json": Heaps,
    "docs/weeks/week05/data/fame.json": Fame,
    "docs/weeks/week05/data/weird.json": Weird,
}
