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


PAGES = {
    "docs/assets/data/week04_place.json": Place,
    "docs/weeks/week04/data/jobs.json": Jobs,
    "docs/weeks/week04/data/staffing_clients.json": StaffingClients,
    "docs/weeks/week04/data/staffing_communities.json": StaffingCommunities,
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
