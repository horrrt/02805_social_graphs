"""The shape each week 5 page script expects from its JSON, checked with Pydantic.

    python analysis/check_pages.py
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="allow")


Share = Field(ge=0, le=1)
Count = Field(ge=0)


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
