"""The shape each week 4 page script expects from its JSON, checked with Pydantic.

Every model lists the fields the page's JavaScript reads, with their types, and the
cross-references the charts rely on: a node's cluster must be one of the clusters
listed, a link must join nodes that exist, an index must point inside its list.
Section 2 once shipped nodes whose cluster ids were not positions in the cluster list,
and ECharts drew 22 of 60 nodes without a word; check() fails on that instead.

Each script calls check() before it writes its page file. To check the committed
files:

    python analysis/week04_schemas.py

Exits non-zero, naming the file and the field, if any file is off.
"""

import json
import sys
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

ROOT = Path(__file__).resolve().parents[1]


class Model(BaseModel):
    # Fields the page does not read may come and go; the ones listed must be there.
    model_config = ConfigDict(extra="allow")


Share = Field(ge=0, le=1)
Count = Field(ge=0)


# Section 1 · docs/assets/data/week04_place.json, read by week04-place.js ------------

class City(Model):
    id: str
    name: str
    state: str
    lon: float = Field(ge=-125, le=-66)  # the contiguous states the map draws
    lat: float = Field(ge=24, le=50)
    positions: int = Count
    filings: int = Count
    employers: int = Count
    top_employer: str
    top_share: float = Share
    census: Literal["Northeast", "Midwest", "South", "West"]
    community: int = Count


class Community(Model):
    id: int = Count
    label: str
    colour: str
    metros: int = Field(ge=1)


class Backbone(Model):
    alphas: list[float] = Field(min_length=1)
    default_alpha: float
    gc_size: list[int]
    edges_kept: list[int]
    snap_alpha: float
    snap_note: str
    choice_note: str  # why the map opens at default_alpha
    graphs: dict[str, dict]

    @model_validator(mode="after")
    def one_graph_per_alpha(self):
        assert len(self.gc_size) == len(self.edges_kept) == len(self.alphas), "one entry per alpha"
        assert {str(a) for a in self.alphas} == set(self.graphs), "a backbone graph for every alpha"
        assert self.default_alpha in self.alphas and self.snap_alpha in self.alphas
        return self


class NullModel(Model):
    Q: float
    Q_null_mean: float
    Q_null_std: float = Count
    z: float
    seeds: int = Field(ge=1)
    modal_runs: int = Field(ge=1)
    partitions_found: int = Field(ge=1)
    nmi_seeds: float = Share
    nmi_seeds_min: float = Share
    nmi_census_region: float = Share
    nmi_census_division: float = Share
    p_region: float = Share
    p_division: float = Share


class Infomap1(Model):
    modules: int = Field(ge=1)
    sizes: list[int]
    nmi_with_louvain: float = Share
    nmi_census_region: float = Share


class LinkEdge(Model):
    a: str
    b: str
    distance_km: float = Count
    weight: float = Count
    top_employer: str
    top_share: float = Share
    staffing: bool


class Longhaul(Model):
    staffing: list[str]
    edges: list[LinkEdge]
    employer_arcs: dict[str, list[list[str]]]
    arc_employers: list[str] = Field(min_length=1)


class Meta(Model):
    status: Literal["live", "placeholder"]
    scope: str
    script: str


class Place(Model):
    meta: Meta
    cities: list[City] = Field(min_length=2)
    communities: list[Community] = Field(min_length=1)
    census_colours: dict[str, str]
    backbone: Backbone
    null_model: NullModel
    infomap: Infomap1
    longhaul: Longhaul

    @model_validator(mode="after")
    def references(self):
        ids = {c.id for c in self.cities}
        assert all(0 <= c.community < len(self.communities) for c in self.cities), \
            "a city's community is not a position in the communities list"
        assert all(e.a in ids and e.b in ids for e in self.longhaul.edges), "a long-haul link names an unknown city"
        for name in self.longhaul.arc_employers:
            assert name in self.longhaul.employer_arcs, f"no arcs for {name}"
            assert all(a in ids and b in ids for a, b in self.longhaul.employer_arcs[name]), f"{name}: unknown city"
        for alpha, graph in self.backbone.graphs.items():
            assert set(graph["nodes"]) <= ids, f"backbone {alpha}: unknown city"
            assert all(u in ids and v in ids for u, v, _ in graph["edges"]), f"backbone {alpha}: unknown city"
        assert set(self.census_colours) == {"Northeast", "Midwest", "South", "West"}
        return self


# Section 2 · docs/weeks/week04/data/jobs.json, read by week04-jobs.js --------------

class JobNode(Model):
    id: str = Field(pattern=r"^\d{2}-\d{4}$")
    title: str
    major: str = Field(pattern=r"^\d{2}$")
    filings: int = Count
    cluster: int = Count
    clusters: list[int] = Field(min_length=1, max_length=2)
    bridge: bool
    partners: list[tuple[str, str, int]]

    @model_validator(mode="after")
    def own_cluster_first(self):
        assert self.clusters[0] == self.cluster, "a node's first cluster must be its own"
        assert self.bridge == (len(self.clusters) == 2), "bridge means exactly two clusters"
        assert len(set(self.clusters)) == len(self.clusters), "a cluster listed twice"
        return self


class JobLink(Model):
    source: str
    target: str
    weight: int = Field(ge=1)


class Cluster(Model):
    id: int = Count
    label: str
    occupations: int = Field(ge=1)


class Shuffled(Model):
    runs: int = Field(ge=1)
    mean: float = Share
    max: float = Share


class Infomap2(Model):
    modules: int = Field(ge=1)
    modules_of_two_or_more: int = Count
    nmi_with_louvain: float = Share
    nmi_with_soc: float = Share


class JobLouvain(Model):
    nmi_between_runs_median: float = Share


class JobNull(Model):
    runs: int = Field(ge=1)
    real: float
    null: float
    z: float


class JobQuality(Model):
    nmi: float = Share
    ami: float = Field(ge=-1, le=1)
    occupations: int = Field(ge=1)
    nmi_shuffled: Shuffled
    infomap: Infomap2
    louvain: JobLouvain
    null: JobNull


class Bridges(Model):
    all_occupations: int = Count
    tested: int = Count
    expected_false_positives: float = Count
    lift_above_1: int = Count
    lift_above_1_by_chance_mean: float = Count


class JobBackbone(Model):
    alpha: float = Share
    links: int = Count
    links_total: int = Count
    occupations_linked: int = Count
    clusters_on_backbone: int = Field(ge=1)
    nmi_with_full_clusters: float = Share
    nmi_between_full_runs_median: float = Share


class JobMeta(Model):
    year: int
    filings: int = Count
    occupations: int = Count
    legacy_filings_recoded: int = Count


class Comparison(Model):
    nmi_between_years: float = Share
    shared_occupations: int = Count


class Jobs(Model):
    meta: JobMeta
    majors: dict[str, str]
    nodes: list[JobNode] = Field(min_length=2)
    edges: list[JobLink]
    pairs: list[JobLink] = Field(min_length=1)
    clusters: list[Cluster] = Field(min_length=1)
    quality: JobQuality
    comparison: Comparison
    bridges: Bridges
    backbone: JobBackbone

    @model_validator(mode="after")
    def references(self):
        ids = {n.id for n in self.nodes}
        cluster_ids = {c.id for c in self.clusters}
        assert all(n.cluster in cluster_ids for n in self.nodes), \
            "a node's cluster is not in the clusters list, so the network cannot colour it"
        assert all(e.source in ids and e.target in ids for e in self.edges), "a link joins an unknown node"
        assert all(p.source in ids and p.target in ids for p in self.pairs), "a pair names an unknown node"
        assert {n.major for n in self.nodes} <= set(self.majors), "a major group without a name"
        linked = {e.source for e in self.edges} | {e.target for e in self.edges}
        assert ids <= linked, f"{len(ids - linked)} occupations have no drawn link"
        return self


# Section 3 · staffing_clients.json and staffing_communities.json ------------------

class Client(Model):
    name: str
    sector: str
    filings: int = Field(ge=1)
    vendors: int = Field(ge=1)
    top: list[tuple[int, int]] = Field(min_length=1)
    rest: int = Count

    @model_validator(mode="after")
    def adds_up(self):
        assert sum(n for _, n in self.top) + self.rest == self.filings, f"{self.name}: vendors do not sum to filings"
        counts = [n for _, n in self.top]
        assert counts == sorted(counts, reverse=True), f"{self.name}: vendors out of order"
        return self


class FlowNode(Model):
    name: str
    placed: int = Count


class Flows(Model):
    vendors: list[FlowNode] = Field(min_length=2)
    clients: list[FlowNode] = Field(min_length=1)
    links: list[tuple[int, int, int]]
    from_top_vendors: int = Count
    client_filings: int = Count

    @model_validator(mode="after")
    def references(self):
        assert all(0 <= v < len(self.vendors) and 0 <= c < len(self.clients) and n > 0
                   for v, c, n in self.links), "a flow points outside its lists"
        into = [0] * len(self.clients)
        for _, c, n in self.links:
            into[c] += n
        assert into == [c.placed for c in self.clients], "a client's bands do not add up to its filings"
        return self


class StaffingYear(Model):
    shown: list[Client] = Field(min_length=1)
    flows: Flows


class StaffingClients(Model):
    min_filings: int = Field(ge=1)
    firms: list[str] = Field(min_length=1)
    years: dict[Literal["2022", "2023", "2024", "2025", "2026"], StaffingYear]

    @model_validator(mode="after")
    def firm_indices(self):
        for year, data in self.years.items():
            assert all(0 <= f < len(self.firms) for c in data.shown for f, _ in c.top), f"FY{year}: unknown firm"
            assert all(c.filings >= self.min_filings for c in data.shown), f"FY{year}: a client below the cut"
        return self


class Compare(Model):
    real: float
    null: float


class WeightsCheck(Model):
    real_inside_share: float = Share
    shuffled_inside_share: float = Share
    links_to_multi_vendor_clients_share: float = Share
    filings_to_multi_vendor_clients_share: float = Share


class Modularity(Model):
    communities_median: int = Field(ge=1)
    rewired_components_median: int = Field(ge=1)
    weighted_vs_rewired: Compare
    wiring_only: Compare
    weights_only: Compare
    weights_check: WeightsCheck


class WeightedVsUnweighted(Model):
    communities_median_unweighted: int = Field(ge=1)
    nmi_median: float = Share
    nmi_between_seeds_weighted: float = Share
    nmi_between_seeds_unweighted: float = Share


class LabelNmi(Model):
    nmi_community_industry: float = Share
    nmi_community_main_vendor_same_clients: float = Share
    # AMI can dip below zero when a split matches worse than chance.
    ami_community_industry: float = Field(ge=-1, le=1)
    ami_community_main_vendor_same_clients: float = Field(ge=-1, le=1)


class Partition(LabelNmi):
    share_with_own_main_vendor: float = Share


class IndustryOrVendor(Partition):
    unweighted: Partition


class Infomap3(LabelNmi):
    modules: int = Field(ge=1)
    nmi_with_louvain: float = Share


class StaffingCommunities(Model):
    modularity: Modularity
    weighted_vs_unweighted: WeightedVsUnweighted
    industry_or_vendor: IndustryOrVendor
    infomap: Infomap3



# Section 1 follow-up · docs/weeks/week04/data/where_who.json, read by week04-questions.js -

class WhereWhoRow(Model):
    id: str
    name: str
    community: int = Count
    region: str
    division: str
    placed_share: float = Share
    naics54_share: float = Share
    placed_share_tercile: Literal["low", "mid", "high"]
    naics54_share_tercile: Literal["low", "mid", "high"]


class LabelScore(Model):
    nmi: float = Share
    ami: float = Field(ge=-1, le=1)
    p_shuffle: float = Share
    median_ami_over_100_runs: float = Field(ge=-1, le=1)


class WhereWhoFinding(Model):
    q1_answer: str
    q1_best_who_hires_ami: float
    q1_best_census_ami: float
    q1_scores: dict[str, LabelScore]
    naics54_dominant_metros: int = Count
    q2_alpha_drops_below_40: float
    q2_max_single_drop: int = Count
    q2_breaking_steps_in_window: int = Count
    q2_leaders: list[tuple[str, int]]
    q2_gc_size_alpha_0_1: int = Count
    q2_gc_size_alpha_0_05: int = Count
    q2_breaking_links_led_by_shortlist: int = Count
    q2_breaking_links_flagged: int = Count
    q2_backbone_shortlist_share: float = Share
    q2_flagged_shortlist_share: float = Share
    q2_hypergeom_p: float = Share


class SweepPoint(Model):
    alpha: float = Count
    gc_size: int = Count


class BreakStep(Model):
    alpha: float = Count
    edges: list[tuple[str, str]]
    weight: list[int]
    gc_before: int = Count
    gc_after: int = Count


class BreakingLink(Model):
    a: str
    b: str
    a_name: str
    b_name: str
    alpha: float = Count
    weight: int = Count
    top_employer: str
    top_share: float = Share
    shortlist: bool


class WhereWho(Model):
    rows: list[WhereWhoRow] = Field(min_length=1)
    finding: WhereWhoFinding
    backbone_sweep: list[SweepPoint] = Field(min_length=1)
    breaking_links: list[BreakingLink] = Field(min_length=1)

    @model_validator(mode="after")
    def references(self):
        ids = {r.id for r in self.rows}
        assert all(link.a in ids and link.b in ids for link in self.breaking_links), \
            "a breaking link names a metro not in rows"
        return self


# Section 2 follow-up · docs/weeks/week04/data/jobs_split.json ---------------------

class OccShare(Model):
    id: str
    title: str
    filings: int = Count
    share: float = Share


class UniqueGroup(Model):
    count: int = Count
    top: list[dict]


class JobsSplitFinding(Model):
    q1_verdict: str
    q1_observed_nmi: float = Share
    q1_observed_ami: float = Field(ge=-1, le=1)
    q1_observed_n: int = Count
    q1_null_count_matched_nmi_mean: float = Share
    q1_null_count_matched_nmi_sd: float = Count
    q1_null_filings_matched_nmi_mean: float = Share
    q1_null_filings_matched_nmi_sd: float = Count
    q1_null_matched_nmi_mean: float = Share
    q1_null_matched_nmi_sd: float = Count
    q1_null_matched_filing_share: float = Share
    q1_matched_z: float
    q1_matched_verdict: str
    q1_placing_companies: int = Count
    q1_direct_companies: int = Count
    q1_placing_filing_share: float = Share
    q1_placing_modularity: float
    q1_direct_modularity: float
    q2_status: str
    q2_on: str | None = None
    q2_D_at_cut: float | None = None
    q2_link_clusters_of_3_or_more: int | None = None
    q2_spearman_communities_vs_degree: float | None = None
    q2_bridges_count: int | None = None
    q2_bridges_in_top15_count: int | None = None


class JobsSplitQ1(Model):
    placing_top_occupations: list[OccShare] = Field(min_length=1)
    direct_top_occupations: list[OccShare] = Field(min_length=1)
    only_in_placing: UniqueGroup
    only_in_direct: UniqueGroup


class LinkComOcc(Model):
    id: str
    title: str
    links: int = Count
    communities: int = Count
    communities_per_link: float = Field(ge=0)


class BridgeOcc(Model):
    id: str
    title: str
    links: int = Count


class Bridges2(Model):
    all_occupations: list[BridgeOcc]
    count: int = Count
    in_top15: list[str]
    in_top15_count: int = Count


class JobsSplitQ2(Model):
    top15_by_communities_per_link: list[LinkComOcc]
    bridges: Bridges2


class JobsSplit(Model):
    generated_by: str
    year: int
    finding: JobsSplitFinding
    q1: JobsSplitQ1
    q2: JobsSplitQ2

    @model_validator(mode="after")
    def references(self):
        shown = {o.id for o in self.q2.top15_by_communities_per_link}
        bridges = {b.id for b in self.q2.bridges.all_occupations}
        flagged = set(self.q2.bridges.in_top15)
        assert flagged <= shown, "a flagged bridge is not in the top15 table"
        assert flagged <= bridges, "a flagged bridge is not among the bridge occupations"
        return self


# Section 3 follow-up · docs/weeks/week04/data/staffing_moves.json ----------------

class SwitchNull(Model):
    mean: float = Share
    sd: float = Count
    z: float
    p: float = Share


class Q1Pair(Model):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    from_year: int = Field(alias="from")
    to: int
    switches_scored: int = Count
    observed_share_same_community: float = Share
    null: SwitchNull
    lift: float | None = None
    answer: str


class StaffingMovesFinding(Model):
    q1_pooled_observed_share: float = Share
    q1_pooled_null_mean: float = Share
    q1_pooled_null_sd: float = Count
    q1_pooled_p: float = Share
    q1_pooled_z: float
    q1_pooled_lift: float | None = None
    q1_answer: str
    q1_share_new_vendor_already_linked: float = Share
    q1_pooled_stricter_observed_share: float | None = None
    q1_pooled_stricter_null_mean: float | None = None
    q1_pooled_stricter_null_sd: float | None = None
    q1_pooled_stricter_z: float | None = None
    q1_pooled_stricter_lift: float | None = None
    q2_share_move: float = Share
    q2_noise_floor_weighted: float = Share
    q2_noise_floor_weighted_min: float = Share
    q2_noise_floor_weighted_max: float = Share
    q2_noise_floor_unweighted: float = Share
    q2_noise_floor_unweighted_min: float = Share
    q2_noise_floor_unweighted_max: float = Share
    q2_movers_2plus_vendor_share: float = Share
    q2_all_clients_2plus_vendor_share: float = Share
    q2_answer: str
    q3_two_community_clients: int = Count
    q3_null_mean: float
    q3_null_sd: float = Count
    q3_z: float
    q3_verdict: str
    q3_control_within_client_shuffle_count: int | None = None


class TopMover(Model):
    client: str
    filings: int = Count
    vendors: int = Count
    main_vendor: str
    weighted_community_top_firm: str
    unweighted_community_top_firm: str


class TopOverlapClient(Model):
    client: str
    sector: str
    filings: int = Count
    communities: list[str] = Field(min_length=2, max_length=2)
    shares: list[float] = Field(min_length=2, max_length=2)
    main_vendor: str | None = None


class StaffingMoves(Model):
    generated_by: str
    year: int
    finding: StaffingMovesFinding
    q1_pairs: list[Q1Pair] = Field(min_length=1)
    q2_top_movers: list[TopMover] = Field(min_length=1)
    q3_top_clients: list[TopOverlapClient] = Field(min_length=1)


# Beyond the three networks · docs/weeks/week04/data/beyond.json -----------------

class LawFirmRow(Model):
    law_firm: str
    filings: int = Count
    employers: int = Count


class BeyondFinding(Model):
    q1_same_split_as_vendors: bool
    q1_ami: float = Field(ge=-1, le=1)
    q1_ami_z_vs_rewired: float
    q1_ami_rewired_mean: float = Field(ge=-1, le=1)
    q1_ami_rewired_sd: float = Count
    q1_nmi: float = Share
    q2_between_communities_matters: bool
    q2_permutation_p: float = Share
    q2_placing_pooled_ratio: float = Field(ge=0)
    q2_direct_pooled_ratio: float = Field(ge=0)
    q2_direct_pooled_ci95: list[float] = Field(min_length=2, max_length=2)
    q2_perm_match_rate_20plus_h1b_employers: float = Share
    q3_placed_pays_lower_level: bool
    q3_odds_ratio: float = Field(gt=0)
    q3_odds_ratio_ci95: list[float] = Field(min_length=2, max_length=2)
    q3_odds_ratio_cluster_ci95: list[float] = Field(min_length=2, max_length=2)
    q3_wage_ratio_placed_min: float | None = Field(ge=0, default=None)
    q3_wage_ratio_placed_max: float | None = Field(ge=0, default=None)
    q3_wage_ratio_direct_min: float | None = Field(ge=0, default=None)
    q3_wage_ratio_direct_max: float | None = Field(ge=0, default=None)


class BeyondQ1(Model):
    lawfirm_column_coverage: float = Share
    distinct_raw_spellings: int = Count
    distinct_law_firms_after_normalize: int = Count
    spellings_collapsed: int = Count
    modularity_best: float
    modularity_z_vs_rewired: float
    nmi_with_staffing_partition: float = Share
    nmi_shuffle_p: float = Share
    ami_with_staffing_partition: float = Field(ge=-1, le=1)
    ami_shuffle_p: float = Share
    ami_z_vs_rewired: float
    single_law_firm_filing_share: float = Share


class GroupStats(Model):
    employers: int = Count
    h1b_filings: int = Count
    perm_filings: int = Count
    pooled_ratio: float = Field(ge=0)
    pooled_ci95: list[float] = Field(min_length=2, max_length=2)
    median_ratio: float = Field(ge=0)
    median_ci95: list[float] = Field(min_length=2, max_length=2)
    perm_match_rate: float = Share
    perm_match_rate_by_filings: float = Share


class BeyondQ2(Model):
    placing_firms_20plus_placed: GroupStats
    direct_firms_20plus_h1b: GroupStats
    permutation_p: float = Share
    between_community_variance: float = Field(ge=0)


class Community6(Model):
    community: int
    firms: int = Count
    h1b_filings: int = Count
    perm_filings: int = Count
    pooled_ratio: float = Field(ge=0)
    top_firms: list[str] = Field(min_length=1)
    largest_firm_filing_share: float = Share


class NamedPermYear(Model):
    all_statuses_name_match: int = Count
    certified_or_expired_resolver_match: int = Count


class NamedPermCompany(Model):
    fy2024: NamedPermYear
    fy2025: NamedPermYear


class BeyondQ3Crude(Model):
    placed_low_share: float = Share
    direct_low_share: float = Share
    placed_filings: int = Count
    direct_filings: int = Count


class TopDrop(Model):
    placed_filing_share: float = Share
    odds_ratio: float = Field(gt=0)
    strata_kept: int = Count


class WageRatioRange(Model):
    placed_min: float | None = Field(ge=0, default=None)
    placed_max: float | None = Field(ge=0, default=None)
    direct_min: float | None = Field(ge=0, default=None)
    direct_max: float | None = Field(ge=0, default=None)


class BeyondQ3(Model):
    pw_wage_level_coverage: float = Share
    crude: BeyondQ3Crude
    strata_kept_20plus_each_side: int = Count
    strata_or_above_1_share: float = Share
    mantel_haenszel_odds_ratio: float = Field(gt=0)
    odds_ratio_ci95: list[float] = Field(min_length=2, max_length=2)
    odds_ratio_cluster_ci95: list[float] = Field(min_length=2, max_length=2)
    odds_ratio_after_dropping_top_placing_firms: dict[str, TopDrop]
    cmh_p: float = Field(ge=0, le=1)
    breslow_day_p: float | None = Field(ge=0, le=1, default=None)
    wage_ratio_coverage: float = Share
    wage_ratio_medians_range: WageRatioRange


class Top5Soc(Model):
    soc7: str
    title: str
    filings: int = Count
    placed_low_share: float = Share
    direct_low_share: float = Share


class Beyond(Model):
    generated_by: str
    year: int
    finding: BeyondFinding
    q1: BeyondQ1
    q1_top_law_firms: list[LawFirmRow] = Field(min_length=1)
    q2: BeyondQ2
    q2_top6_communities: list[Community6] = Field(min_length=1)
    q2_named_perm: dict[str, NamedPermCompany]
    q3: BeyondQ3
    q3_top5_soc: list[Top5Soc] = Field(min_length=1)


# Section 4 · docs/weeks/week04/data/footprint.json, read by week04-questions.js --

class DropVariant(Model):
    id: str
    control: bool
    filings_removed_share: float = Share
    Q: float
    nmi_vs_full: float = Share
    nmi_vs_full_sd: float | None = None
    ami_region: float | None = None
    ami_region_sd: float | None = None


class DropSet(Model):
    variants: list[DropVariant]

    @model_validator(mode="after")
    def every_drop(self):
        ids = {v.id for v in self.variants}
        need = {"full", "drop_shortlist", "control_shortlist", "drop_top10_filings", "control_top10_filings"}
        assert need <= ids, f"footprint variants missing: {sorted(need - ids)}"
        assert all(v.nmi_vs_full_sd is not None for v in self.variants if v.control), \
            "a control row needs the sd its whisker draws"
        return self


class Footprint(Model):
    metros: DropSet
    jobs: DropSet

    @model_validator(mode="after")
    def regions(self):
        assert all(v.ami_region is not None for v in self.metros.variants), "metro rows need ami_region"
        return self


PAGES = {
    "docs/assets/data/week04_place.json": Place,
    "docs/weeks/week04/data/jobs.json": Jobs,
    "docs/weeks/week04/data/staffing_clients.json": StaffingClients,
    "docs/weeks/week04/data/staffing_communities.json": StaffingCommunities,
    "docs/weeks/week04/data/where_who.json": WhereWho,
    "docs/weeks/week04/data/jobs_split.json": JobsSplit,
    "docs/weeks/week04/data/staffing_moves.json": StaffingMoves,
    "docs/weeks/week04/data/beyond.json": Beyond,
    "docs/weeks/week04/data/footprint.json": Footprint,
}


def check(path, data):
    """Validate a page file's contents before it is written; raises SystemExit naming the problem."""
    rel = str(Path(path).resolve().relative_to(ROOT))
    try:
        # Checked as it will be written: tuples become lists, keys become strings.
        PAGES[rel].model_validate(json.loads(json.dumps(data)))
    except ValidationError as err:
        raise SystemExit(f"{rel} does not match what the page reads:\n{err}") from None


def main():
    failed = 0
    for rel, model in PAGES.items():
        try:
            model.model_validate(json.loads((ROOT / rel).read_text()))
            print(f"ok      {rel}")
        except ValidationError as err:
            failed += 1
            print(f"FAILED  {rel}\n{err}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
