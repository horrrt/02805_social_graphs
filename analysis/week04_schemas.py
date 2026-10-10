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


# Section 1 · public/assets/data/week04_place.json, read by week04-place.js ------------

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


# Section 2 · public/weeks/week04/data/jobs.json, read by week04-jobs.js --------------

class JobNode(Model):
    id: str = Field(pattern=r"^\d{2}-\d{4}$")
    title: str
    major: str = Field(pattern=r"^\d{2}$")
    filings: int = Count
    x: float = Share  # fixed network position, scaled to the drawing frame
    y: float = Share
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
    majors: dict[str, int]  # SOC major group -> occupations, over every occupation in the cluster

    @model_validator(mode="after")
    def majors_cover_cluster(self):
        assert sum(self.majors.values()) == self.occupations, "a cluster's major-group counts must sum to its size"
        return self


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
        assert {m for c in self.clusters for m in c.majors} <= set(self.majors), \
            "a cluster's major group without a name"
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



# Section 1 follow-up · public/weeks/week04/data/where_who.json, read by week04-questions.js -

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


# Section 2 follow-up · public/weeks/week04/data/jobs_split.json ---------------------

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
    links: int = Field(ge=1)  # every link of the projection
    link_clusters: int | None = Field(default=None, ge=1)  # None when the link clustering did not finish
    largest_link_community_links: int | None = Field(default=None, ge=1)
    top15_by_communities_per_link: list[LinkComOcc]
    bridges: Bridges2

    @model_validator(mode="after")
    def largest_fits(self):
        assert (self.link_clusters is None) == (self.largest_link_community_links is None), \
            "link_clusters and largest_link_community_links come together"
        if self.largest_link_community_links is not None:
            assert self.largest_link_community_links <= self.links, "a link community larger than all links"
        return self


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


# Section 3 follow-up · public/weeks/week04/data/staffing_moves.json ----------------

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


# Beyond the three networks · public/weeks/week04/data/beyond.json -----------------

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


# Section 1 explorables · public/weeks/week04/data/explore.json, read by
# week04-methods.js, the #cut-methods box -----------------------------------------

class ExploreMetro(Model):
    id: str
    name: str
    community: int = Count


class ExploreFull(Model):
    edges: list[tuple[str, str, int]] = Field(min_length=1)
    total_weight: float = Count
    Q_page_partition: float


class GnCut(Model):
    step: int = Count
    edge: tuple[str, str]
    betweenness: float = Count
    components: int = Field(ge=1)
    split: bool


class GnLevel(Model):
    step: int = Count
    components: int = Field(ge=1)
    partition: dict[str, int]
    Q: float


class GnBest(Model):
    step: int = Count
    components: int = Field(ge=1)
    Q: float


class GirvanNewman(Model):
    cuts: list[GnCut] = Field(min_length=1)
    levels: list[GnLevel] = Field(min_length=1)
    best: GnBest


class LouvainMove(Model):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    node: str
    from_community: int = Field(alias="from")
    to: int
    gain: float
    Q: float


class LouvainLevel(Model):
    level: int = Count
    moves: list[LouvainMove]
    sweeps: int = Count
    communities: int = Field(ge=1)
    Q_start: float
    Q: float
    members: dict[str, list[str]]
    partition_start: dict[str, int]


class LouvainFinal(Model):
    partition: dict[str, int]
    Q: float
    nmi_with_page: float = Share


class ExploreLouvain(Model):
    seed: int = Count
    levels: list[LouvainLevel] = Field(min_length=1)
    final: LouvainFinal


class KCliqueGroup(Model):
    communities: list[list[str]]
    in_two_or_more: list[str]
    in_none: list[str]


class KCliques(Model):
    graph: str
    by_k: dict[str, KCliqueGroup]


class LinkCommunities(Model):
    graph: str
    D: float = Field(ge=0, le=1)
    communities: list[list[tuple[str, str]]]
    by_metro: dict[str, list[int]]


class Explore(Model):
    generated_by: str
    year: int
    metros: list[ExploreMetro] = Field(min_length=2)
    full: ExploreFull
    girvan_newman: GirvanNewman
    louvain: ExploreLouvain
    k_cliques: KCliques
    link_communities: LinkCommunities

    @model_validator(mode="after")
    def references(self):
        ids = {m.id for m in self.metros}
        assert all(a in ids and b in ids for a, b, _ in self.full.edges), \
            "a full-network edge names an unknown metro"
        for c in self.girvan_newman.cuts:
            assert c.edge[0] in ids and c.edge[1] in ids, "a Girvan-Newman cut names an unknown metro"
        for lv in self.girvan_newman.levels:
            assert set(lv.partition) <= ids, "a Girvan-Newman level partitions an unknown metro"
        assert set(self.louvain.final.partition) <= ids, "the Louvain final partition names an unknown metro"
        for lv in self.louvain.levels:
            for mv in lv.moves:
                assert mv.node, "a Louvain move needs a node id"
        for group in self.k_cliques.by_k.values():
            covered = {m for community in group.communities for m in community}
            assert covered <= ids, "a k-clique community names an unknown metro"
            assert set(group.in_two_or_more) <= ids and set(group.in_none) <= ids
        touched = {m for community in self.link_communities.communities for a, b in community for m in (a, b)}
        assert touched <= ids, "a link community names an unknown metro"
        assert set(self.link_communities.by_metro) <= ids
        return self


# Section 4 · public/weeks/week04/data/footprint.json, read by week04-questions.js --

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


# Section 4 follow-up · public/weeks/week04/data/footprint_rank.json, read by
# week04-questions.js -----------------------------------------------------

class SingleFirmDrop(Model):
    firm: str
    filings_removed_share: float = Share
    ami_region: float
    p_region: float = Share
    nmi_vs_full: float = Share
    control_ami_mean: float
    control_ami_sd: float
    ami_vs_control_sd: float | None = None


class SweepStep(Model):
    k: int = Field(ge=0, le=20)
    added: list[str]
    filings_removed_share: float = Share
    ami_region: float
    p_region: float = Share
    nmi_vs_full: float = Share
    control_ami_mean: float
    control_ami_sd: float
    ami_vs_control_sd: float | None = None


class Fy2024Drop(Model):
    id: str
    label: str
    filings_removed_share: float = Share
    ami_region: float
    p_region: float = Share
    nmi_vs_full: float = Share
    control_ami_mean: float | None = None
    control_ami_sd: float | None = None
    ami_vs_control_sd: float | None = None


class FootprintRank(Model):
    generated_by: str
    year: int
    single: list[SingleFirmDrop] = Field(min_length=10, max_length=10)
    sweep: list[SweepStep] = Field(min_length=21, max_length=21)
    fy2024: list[Fy2024Drop] = Field(min_length=1)
    finding: dict

    @model_validator(mode="after")
    def sweep_covers_k(self):
        ks = [s.k for s in self.sweep]
        assert ks == list(range(21)), f"sweep must cover k=0..20 in order, got {ks}"
        return self


# Five years of filings · public/weeks/week04/data/years.json, read by
# week04-years.js, the #cut-years box --------------------------------------

class YearStats(Model):
    certified_filings: int = Count
    placed_share: float = Share
    clients: int = Count
    firms: int = Count
    top_firms_by_filings: list[tuple[str, int]] = Field(min_length=1)


class OctJunTotal(Model):
    certified_filings: int = Count


class OctJun(Model):
    totals: dict[Literal["FY2024", "FY2025", "FY2026"], OctJunTotal]
    certified_filings_change_fy25_fy26_percent: float


class YearMonthRow(Model):
    month: str = Field(pattern=r"^\d{4}-(10|11|12|01|02|03|04|05|06)$")
    certified_filings: int = Count
    placed_filings: int = Count


class UscisYear(Model):
    year: int
    placing_initial_denial_rate: float = Share
    direct_initial_denial_rate: float = Share


class LotteryDraw(Model):
    registrations: int = Count


class LotteryFunnel(Model):
    registrations_per_approval: float = Field(gt=0)


class YearsFinding(Model):
    fy2025_certified_filings: int = Count
    fy22_to_fy23_certified_change_percent: int
    fy25_to_fy26_certified_change_percent: float
    oct_2025_certified_filings: int = Count
    oct_2024_certified_filings: int = Count


class Years(Model):
    generated_by: str
    years: dict[Literal["2022", "2023", "2024", "2025", "2026"], YearStats]
    oct_jun: OctJun
    monthly: dict[Literal["FY2024", "FY2025", "FY2026"], list[YearMonthRow]]
    uscis_series: list[UscisYear] = Field(min_length=5, max_length=5)
    uscis_min_filings: int = Count
    lottery_draws: dict[Literal["2022", "2023", "2024"], LotteryDraw]
    lottery_funnels: dict[Literal["2023", "2024"], LotteryFunnel]
    finding: YearsFinding

    @model_validator(mode="after")
    def checks(self):
        for fy, rows in self.monthly.items():
            assert len(rows) == 9, f"{fy}: the monthly series must cover nine months"
            assert [m.month[5:] for m in rows] == ["10", "11", "12", "01", "02", "03", "04", "05", "06"], \
                f"{fy}: months must run October to June in order"
        assert [u.year for u in self.uscis_series] == [2022, 2023, 2024, 2025, 2026], \
            "uscis_series must cover FY2022 to FY2026 in order"
        shares = [self.years[y].placed_share for y in ("2023", "2024", "2025", "2026")]
        assert shares == sorted(shares, reverse=True), "the placed share must fall every year from FY2023"
        assert "HCL" not in dict(self.years["2026"].top_firms_by_filings), \
            "HCL is expected to leave FY2026's top firms by filings"
        return self


# Deep dive · Roles · public/weeks/week04/data/roles.json, read by week04-roles.js -

class RolesPartial(Model):
    year: Literal["2026"]
    months: int = Field(gt=0, le=12)
    window: str


class RoleSeries(Model):
    name: str
    code: str | None
    top_in: list[Literal["FY2022", "FY2023", "FY2024", "FY2025", "FY2026"]]
    counts: list[int] = Field(min_length=5, max_length=5)
    oct_jun: list[int] = Field(min_length=5, max_length=5)


class RoleFinding(Model):
    name: str
    code: str | None
    share_fy2022_percent: float
    share_fy2025_percent: float
    change_pp: float
    direction: Literal["grew", "shrank"]
    entered_top: bool
    left_top: bool


class RoleSplit(Model):
    top_n: int = Field(ge=2)
    other_name: str
    series: list[RoleSeries] = Field(min_length=2)
    finding: RoleFinding


class RolesMeta(Model):
    legacy_codes: int = Field(gt=0)
    legacy_targets: int = Field(gt=0)
    crosswalk_codes: int = Field(ge=0)


class Roles(Model):
    generated_by: str
    years: list[Literal["2022", "2023", "2024", "2025", "2026"]] = Field(min_length=5, max_length=5)
    partial: RolesPartial
    totals: dict[Literal["2022", "2023", "2024", "2025", "2026"], int] = Field(min_length=5, max_length=5)
    oct_jun_totals: dict[Literal["2022", "2023", "2024", "2025", "2026"], int] = Field(min_length=5, max_length=5)
    splits: dict[Literal["occupations", "groups", "employer", "placement"], RoleSplit]
    legacy_recoded: dict[str, int]
    meta: RolesMeta
    uncoded: dict[str, int]

    @model_validator(mode="after")
    def checks(self):
        years = ["2022", "2023", "2024", "2025", "2026"]
        for name, split in self.splits.items():
            for i, y in enumerate(years):
                total = sum(s.counts[i] for s in split.series)
                assert total == self.totals[y], f"{name} {y}: series counts must sum to the certified total"
                oj_total = sum(s.oct_jun[i] for s in split.series)
                assert oj_total == self.oct_jun_totals[y], \
                    f"{name} {y}: series October-to-June counts must sum to the October-to-June total"
        return self


# Deep dive · Skills · public/weeks/week04/data/skills.json, read by week04-skills.js -

class SkillsExample(Model):
    a: str
    a_title: str
    b: str
    b_title: str
    similarity: float = Field(ge=-1, le=1)


class SkillsGroup(Model):
    n: int = Count
    mean: float | None
    sd: float | None
    examples: list[SkillsExample]


class SkillsTest(Model):
    real: float
    null_free_mean: float
    p_free: float = Field(gt=0, le=1)
    null_within_major_mean: float
    p_within_major: float = Field(gt=0, le=1)


class SkillsQuarter(SkillsGroup):
    quarter: int = Field(ge=1, le=4)
    lift_from: float = Field(ge=0)
    lift_to: float = Field(ge=0)


class SkillsStrength(Model):
    year: int
    measure: str
    pairs: int = Count
    pairs_with_cohiring: int = Count
    pairs_same_major: int = Count
    majors: int = Count
    perms: int = Field(ge=100)
    seed: int
    spearman: SkillsTest
    quarters: list[SkillsQuarter] = Field(min_length=4, max_length=4)


class Cohiring(Model):
    source: dict
    occupations: int = Field(ge=2)
    occupations_without_a_profile: int = Count
    direct_ties: SkillsGroup
    same_cluster_other_pairs: SkillsGroup
    different_cluster_pairs: SkillsGroup
    all_pairs: SkillsGroup
    strength: SkillsStrength
    cluster_gap: SkillsTest


class Skills(Model):
    meta: dict
    cohiring: Cohiring


# Deep dive · Skills radar · public/weeks/week04/data/skills_radar.json, read by
# week04-skills-radar.js ----------------------------------------------------

class RadarGroup(Model):
    label: str
    ids: list[str] = Field(min_length=1)
    names: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def same_length(self):
        assert len(self.ids) == len(self.names), "ids and names must list the same descriptors"
        return self


class RadarMeta(Model):
    generated_by: str
    scale: str
    groups: dict[Literal["skills", "knowledge", "work_activities"], RadarGroup]


class RadarOccupation(Model):
    code: str
    title: str
    filings: int = Count
    in_network: bool
    cluster: int | None
    ratings: list[float]

    @model_validator(mode="after")
    def ratings_in_range(self):
        assert all(1 <= v <= 5 for v in self.ratings), "every rating must be an O*NET Importance value, 1 to 5"
        return self


class SkillsRadar(Model):
    meta: RadarMeta
    occupations: list[RadarOccupation] = Field(min_length=1)
    default: list[str] = Field(min_length=1, max_length=5)

    @model_validator(mode="after")
    def references(self):
        total = sum(len(g.ids) for g in self.meta.groups.values())
        codes = {o.code for o in self.occupations}
        for o in self.occupations:
            assert len(o.ratings) == total, f"{o.code}: ratings must list one value per descriptor ({total})"
        for code in self.default:
            assert code in codes, f"default code {code} is not in occupations"
        return self


# Deep dive · PageRank · public/weeks/week04/data/pagerank.json, read by week04-pagerank.js -

class PagerankRow(Model):
    code: str
    title: str
    filings: int = Count
    degree: int = Count
    strength: int = Count
    degree_rank: int = Field(ge=1)
    pagerank: float = Field(ge=0)
    rank: int = Field(ge=1)


class PagerankIterRow(Model):
    code: str
    title: str
    pagerank: float = Field(ge=0)


class PagerankStep(Model):
    step: int = Count
    rows: list[PagerankIterRow] = Field(min_length=1)

    @model_validator(mode="after")
    def sorted_by_own_score(self):
        scores = [r.pagerank for r in self.rows]
        assert scores == sorted(scores, reverse=True), \
            f"step {self.step}: rows must be this step's own top scores, in order"
        return self


class PagerankIteration(Model):
    alpha: float
    steps: list[PagerankStep] = Field(min_length=1)
    max_error_vs_nx_pagerank: float = Field(ge=0)


class PagerankMover(Model):
    code: str
    title: str
    rank_d0_5: int = Field(ge=1)
    rank_d0_99: int = Field(ge=1)
    rank_shift: int
    degree_rank: int = Field(ge=1)
    degree: int = Count
    strength: int = Count
    pagerank_d0_5: float = Field(ge=0)
    pagerank_d0_99: float = Field(ge=0)


class Pagerank(Model):
    meta: dict
    damping: list[float] = Field(min_length=3)
    rankings: dict[str, list[PagerankRow]]
    iteration: PagerankIteration
    movers: list[PagerankMover] = Field(min_length=1)
    finding: dict

    @model_validator(mode="after")
    def references(self):
        assert set(self.rankings) == {str(d) for d in self.damping}, \
            "rankings keys must be str(d) for every damping value"
        for d, rows in self.rankings.items():
            ranks = [r.rank for r in rows]
            assert ranks == list(range(1, len(rows) + 1)), f"rankings[{d}] is not ranked in order"
        return self


# Deep dive · More networks · public/weeks/week04/data/more.json, read by
# week04-vis-more.js -------------------------------------------------------

class MorePermRow(Model):
    label: str
    lca_filings: int = Count
    ratio: float = Field(ge=0)


class MorePerm(Model):
    median_ratio: float = Field(ge=0)
    rows: list[MorePermRow] = Field(min_length=6, max_length=6)


class MoreCountryRow(Model):
    country: str
    share: float = Share


class MoreModularityRow(Model):
    real: float
    null: float
    null_sd: float
    z: float


class MoreCountryLabels(Model):
    ami_region: float  # AMI can fall below zero
    ami_week3: float
    p_region_shuffled_nmi: float = Share
    p_week3_shuffled_nmi: float = Share


class MoreCountries(Model):
    top: list[MoreCountryRow] = Field(min_length=8, max_length=8)
    modularity: dict[Literal["unweighted", "weighted"], MoreModularityRow]
    labels: MoreCountryLabels


class MoreDensityRow(Model):
    metro: str
    name: str
    rate: float = Field(ge=0)


class MoreDensity(Model):
    national_rate: float = Field(ge=0)
    rows: list[MoreDensityRow] = Field(min_length=10, max_length=10)
    new_york: MoreDensityRow


class MoreStrengthRow(Model):
    label: str
    strength: int = Count
    health_care: bool


class MoreStrength(Model):
    rows: list[MoreStrengthRow] = Field(min_length=5, max_length=5)


class MoreLotterySeries(Model):
    label: str
    values: list[float] = Field(min_length=2, max_length=2)


class MoreUscisDraw(Model):
    # One March draw from USCIS's Historical Data table.
    label: str = Field(pattern=r"^March \d{4}$")
    eligible: int = Field(ge=1)
    multiple: int = Count  # eligible registrations for workers registered more than once
    selected: int = Field(ge=1)

    @model_validator(mode="after")
    def parts_fit(self):
        assert self.multiple <= self.eligible, "more multiple registrations than eligible ones"
        assert self.selected <= self.eligible, "more selected registrations than eligible ones"
        return self


class MoreLottery(Model):
    draws: list[str] = Field(min_length=2, max_length=2)
    series: list[MoreLotterySeries] = Field(min_length=3, max_length=3)
    all_draws: list[MoreUscisDraw] = Field(min_length=2)  # every draw since 2020, oldest first

    @model_validator(mode="after")
    def all_draws_in_order(self):
        years = [int(d.label.split()[1]) for d in self.all_draws]
        assert years == sorted(set(years)), "all_draws must run oldest first, one per year"
        assert set(self.draws) <= {d.label for d in self.all_draws}, "a slopegraph draw USCIS does not list"
        return self


class More(Model):
    generated_by: str
    perm: MorePerm
    countries: MoreCountries
    density: MoreDensity
    strength: MoreStrength
    lottery: MoreLottery
# Deep dive · section 3 first round, law firms, ties and lottery ·
# public/weeks/week04/data/staffing_deep.json, read by week04-vis-staffing.js -

class ByKindRate(Model):
    registrations_per_approval: float = Field(gt=0)
    selected_that_became_petitions: float = Share


class StaffingDeepQ1(Model):
    client_company_share: float = Share
    by_kind: dict[Literal["direct", "placing", "small"], ByKindRate]


class StaffingDeepQ3(Model):
    clients: int = Count
    single_vendor_clients: int = Count
    single_vendor_filing_share: float = Share
    big_clients: int = Count
    big_clients_over_90pct_one_vendor: int = Count
    big_clients_median_top_vendor_share: float = Share


class PercentPair(Model):
    fy24_to_fy25: float
    fy25_to_fy26: float


class SharePair(Model):
    before: float = Share
    after: float = Share


class JanJunChange(Model):
    certified_filings_percent: PercentPair
    client_company_filings_percent: PercentPair
    main_vendor_changed_share: SharePair


class StaffingDeepQ4(Model):
    jan_jun_change: JanJunChange


class OutsourcingShare(Model):
    no_firm_share_pooled: float = Share
    top5_share_pooled: float = Share


class StaffingDeepLawyers(Model):
    outsourcing: dict[Literal["placing", "direct"], OutsourcingShare]
    top_firms_by_filings: list[tuple[str, int]] = Field(min_length=5, max_length=5)


class WeightShuffleNull(Model):
    mean_rho: float
    sd_rho: float = Field(gt=0)


class WageDistribution(Model):
    placing: dict[Literal["1", "2", "3", "4"], float]
    direct: dict[Literal["1", "2", "3", "4"], float]


class StaffingDeepTies(Model):
    spearman_weight_overlap_rho: float
    weight_shuffle_null: WeightShuffleNull
    defined_links: int = Count
    wage_distribution_placing_vs_direct_filings: WageDistribution


class LotteryYearShare(Model):
    high_mates_share: float = Share
    high_mates_share_shuffled: float = Share


class StaffingDeepLottery(LotteryYearShare):
    ami_median: float
    ami_min: float
    ami_max: float
    previous_year: LotteryYearShare


class StaffingDeep(Model):
    generated_by: str
    q1: StaffingDeepQ1
    q3: StaffingDeepQ3
    q4: StaffingDeepQ4
    lawyers: StaffingDeepLawyers
    ties: StaffingDeepTies
    lottery: StaffingDeepLottery


# Deep dive · public/weeks/week04/data/entities_<name>.json, read by week04-entities.js --

class EntityLookups(Model):
    occupation: list[tuple[str, str]] = Field(min_length=1)
    place: list[tuple[str, str]] = Field(min_length=1)
    sector: list[tuple[str, str]] = Field(min_length=1)
    level: list[str] = Field(min_length=4, max_length=4)


class EntityProfiles(Model):
    community: list[int] = Field(min_length=1)
    occupation: list[int]
    place: list[int]
    sector: list[int]
    level: list[int]
    h1b: list[int]
    perm: list[int]
    pagerank_rank: list[int]


class EntityCommunity(Model):
    id: int = Count
    name: str
    profiles: int = Field(ge=1)
    workers: int = Field(ge=1)
    h1b: int = Count
    perm: int = Count
    top_employers: list[tuple[str, int]]
    fields: dict[str, list[tuple[str, float]]]
    x: float = Field(ge=0, le=1000)  # the community's disc
    y: float = Field(ge=0, le=1000)
    r: float = Field(gt=0)


class EntityItems(Model):
    """Item k is profile k, so profiles carry its counts; items add the name."""
    name: list[str]


class EntityPage(Model):
    generated_by: str
    entity: str
    unit: str
    year: int
    dots: Literal["workers", "items"]
    top: int = Field(ge=1)
    spacing: float = Field(gt=0)  # a disc's radius is spacing * sqrt(workers)
    lookups: EntityLookups
    profiles: EntityProfiles
    communities: list[EntityCommunity] = Field(min_length=1)
    summary: dict
    facts: dict
    items: EntityItems | None = None

    @model_validator(mode="after")
    def indexes_resolve(self):
        p, n = self.profiles, len(self.profiles.community)
        for name in ("community", "occupation", "place", "sector", "level", "h1b", "perm", "pagerank_rank"):
            assert len(getattr(p, name)) == n, f"profiles.{name} has a length other than community"
        assert all(-1 <= c < len(self.communities) for c in p.community), "a community outside the list"
        assert [c.id for c in self.communities] == list(range(len(self.communities))), "community ids out of order"
        for name in ("occupation", "place", "sector"):
            size = len(getattr(self.lookups, name))
            assert all(0 <= i < size for i in getattr(p, name)), f"a {name} index outside its lookup"
        assert all(0 <= v < 4 for v in p.level), "a wage level outside I to IV"
        if self.dots == "items":
            assert self.items is not None, "dots per item need the items"
            assert len(self.items.name) == n, "items and profiles differ in length"
        return self


class NetNodes(Model):
    name: list[str] = Field(min_length=2)
    kind: list[Literal["firm", "client", "employer"]]
    strength: list[int]
    community: list[int]
    x: list[float]
    y: list[float]


class NetLinks(Model):
    source: list[int]
    target: list[int]
    weight: list[int]
    p: list[float]


class NetCommunity(Model):
    id: int = Count
    label: str
    nodes: int = Field(ge=1)
    strength: int = Count
    head: int = Count
    top: list[str]


class EntityNetwork(Model):
    generated_by: str
    network: str
    title: str
    top: int = Field(ge=1)
    alphas: list[float] = Field(min_length=1)
    alpha: float
    nodes: NetNodes
    links: NetLinks
    all_links: int = Count
    curve: list[tuple[float, int, int, int]] = Field(min_length=2)
    at: dict[str, dict[str, int]]
    communities: list[NetCommunity] = Field(min_length=1)
    louvain: dict
    null: dict

    @model_validator(mode="after")
    def indexes_resolve(self):
        n = len(self.nodes.name)
        for name in ("kind", "strength", "community", "x", "y"):
            assert len(getattr(self.nodes, name)) == n, f"nodes.{name} has a length other than name"
        m = len(self.links.source)
        assert len(self.links.target) == len(self.links.weight) == len(self.links.p) == m
        assert all(0 <= v < n for v in self.links.source + self.links.target), "a link to a missing node"
        assert all(0 <= c < len(self.communities) for c in self.nodes.community), "a community outside the list"
        assert all(0 <= c.head < n for c in self.communities), "a community head outside the nodes"
        assert self.alpha in self.alphas and set(self.at) == {str(a) for a in self.alphas}
        return self


PAGES = {
    "public/assets/data/week04_place.json": Place,
    "public/weeks/week04/data/jobs.json": Jobs,
    "public/weeks/week04/data/staffing_clients.json": StaffingClients,
    "public/weeks/week04/data/staffing_communities.json": StaffingCommunities,
    "public/weeks/week04/data/where_who.json": WhereWho,
    "public/weeks/week04/data/jobs_split.json": JobsSplit,
    "public/weeks/week04/data/skills.json": Skills,
    "public/weeks/week04/data/skills_radar.json": SkillsRadar,
    "public/weeks/week04/data/pagerank.json": Pagerank,
    "public/weeks/week04/data/staffing_moves.json": StaffingMoves,
    "public/weeks/week04/data/beyond.json": Beyond,
    "public/weeks/week04/data/footprint.json": Footprint,
    "public/weeks/week04/data/footprint_rank.json": FootprintRank,
    "public/weeks/week04/data/explore.json": Explore,
    "public/weeks/week04/data/years.json": Years,
    "public/weeks/week04/data/roles.json": Roles,
    "public/weeks/week04/data/more.json": More,
    "public/weeks/week04/data/staffing_deep.json": StaffingDeep,
    "public/weeks/week04/data/entities_workers.json": EntityPage,
    "public/weeks/week04/data/entities_companies.json": EntityPage,
    "public/weeks/week04/data/entities_network_staffing.json": EntityNetwork,
    "public/weeks/week04/data/entities_network_lawfirms.json": EntityNetwork,
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
