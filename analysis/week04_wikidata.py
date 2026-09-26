"""Sector for unlisted companies in the week 4 networks, from Wikidata.

week04_sec.py matches our companies to the SEC's list of listed issuers by exact
name; most clients and filing firms are never listed, so this script matches
the rest to Wikidata items instead. Wikidata needs no key: a company's English
label or aliases are searched with the MediaWiki API (wbsearchentities), the
candidates are checked against our own name rules (names.client, and the
resolver's client() so a bridged FEIN key still matches), and only a candidate
that is some kind of organisation (P31 transitively a subclass of Q43229,
checked with a cached SPARQL query) survives. Ties break on sitelinks. A
company's sector comes from its own NAICS code (P3224), else the NAICS of its
industry items (P452), else the reviewed table in week04_wikidata_industries.csv
for an industry Wikidata never coded, else a SIC code (P3242 ->
week04_sec.sector_of_sic) on the company or its industries; industries vote by
majority and a tie is recorded rather than guessed.

Only exact matches after normalization count, same as week04_sec.py: a company
Wikidata spells differently stays unlabelled with a reason, rather than guessed.

Targets are every client and filing firm with 5 or more certified H-1B filings
summed over FY2022-FY2025 that neither the reviewed alias table nor the SEC
already covers (week04_sec.py's MIN_FILINGS). --priority restricts the run to
FY2025's multi-vendor clients in the giant component (section 3's
industry-or-vendor test set) that still have no sector; the full queue (every
target, priority first) is the default for a later, longer run.

    python analysis/week04_wikidata.py --priority   # the test set only, for section 3
    python analysis/week04_wikidata.py              # every target, priority first

Work is fetched a chunk of CHUNK_TARGETS targets at a time: candidate search for
the whole chunk runs on a thread pool of WORKERS workers, then every candidate
QID the chunk turned up is fetched and class-checked in as few batched requests
as possible (one SPARQL VALUES query per CHUNK_CLASSES unseen classes, instead
of one per target). A shared token-bucket limiter caps every thread's requests
to the MediaWiki API at RATE/second combined; SPARQL_CONCURRENCY caps concurrent
queries to query.wikidata.org; a 429 or 503 waits out the response's Retry-After
(or backs off if it has none). Every response is cached under
build/raw/week04/wikidata/ (one file per search query, per (entity, property
set), and one shared, lock-guarded file for the class-membership check) via an
atomic write-then-replace, safe for concurrent writers, so a rerun makes zero
requests and only continues where it stopped. Set WIKIDATA_BUDGET_SECONDS to
stop after that long; unset, the script runs to completion.

Output: analysis/week04_wikidata_sectors.csv (key, label, filings, qid,
wikidata_label, match, industry_qids, industry_labels, naics2, source_codes,
reason), read by week04_names.naics2(); analysis/week04_wikidata.json for the
summary numbers, ambiguous ties and sector conflicts.
"""

import argparse
import concurrent.futures as cf
import csv
import hashlib
import json
import os
import re
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import pandas as pd
import requests

import week04_names as names
from week04_data import RAW, load
from week04_sec import sector_of_sic
from week04_staffing import certified, giant_of, graph, placements, resolver, tracked

OUT = Path(__file__).with_name("week04_wikidata_sectors.csv")
SUMMARY = Path(__file__).with_suffix(".json")
# Reviewed by hand from this script's own "no sector" industry breakdown
# (the P452 items that leave a matched company unlabelled); the rule for
# which industries get a sector is written at the top of the file itself.
INDUSTRY_TABLE = Path(__file__).with_name("week04_wikidata_industries.csv")
CACHE = RAW / "wikidata"
SEARCH_CACHE = CACHE / "search"
ENTITY_CACHE = CACHE / "entities"
CLASS_CACHE = CACHE / "classes.json"

AGENT = "02805-social-graphs course project (https://github.com/horrrt/02805_social_graphs)"
API = "https://www.wikidata.org/w/api.php"
SPARQL = "https://query.wikidata.org/sparql"
ORG = "Q43229"  # organization; every seed class (business, company, enterprise, public company) is one
YEARS = (2022, 2023, 2024, 2025)
MIN_FILINGS = 5  # same threshold as week04_sec.py
BATCH = 50  # QIDs per wbgetentities request (the API's own limit)
CHUNK_CLASSES = 25  # unseen P31 classes per class-membership SPARQL query
CHUNK_TARGETS = 200  # targets fetched together, so class-membership batches across many at once
WORKERS = 4
RATE = 5.0  # MediaWiki API requests/second, shared by every worker
SPARQL_CONCURRENCY = 2

# Common direct P31 classes that are certainly some kind of organization: skips
# the SPARQL P279* check entirely (it measured 15-35s per query live, sometimes
# much more, so avoiding it whenever a candidate's own class is already this
# obvious matters). Verified by hand against a live wbgetentities call on these
# QIDs' English labels: the original "insurance company" and "consulting firm"
# guesses (Q1145276, Q2085381) turned out to be "fictional country" and
# "publishing house" and are replaced below with the correct QIDs.
ALLOWLIST_LABELS = {
    "Q4830453": "business", "Q783794": "company", "Q6881511": "enterprise",
    "Q891723": "public company", "Q1589009": "privately held company",
    "Q658255": "subsidiary company", "Q167037": "corporation", "Q43229": "organization",
    "Q1058914": "software company", "Q18388277": "technology company", "Q22687": "bank",
    "Q2143354": "insurance company", "Q16917": "hospital", "Q3918": "university",
    "Q163740": "nonprofit organization", "Q2089936": "consulting company",
    "Q613142": "law firm", "Q778575": "conglomerate", "Q161726": "multinational corporation",
}
ALLOWLIST = frozenset(ALLOWLIST_LABELS)
MAX_RETRIES = 6

BUDGET = float(os.environ["WIKIDATA_BUDGET_SECONDS"]) if os.environ.get("WIKIDATA_BUDGET_SECONDS") else None

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": AGENT})
REQUESTS_MADE = 0
REQUESTS_LOCK = threading.Lock()
CLASS_LOCK = threading.Lock()
POOL = cf.ThreadPoolExecutor(max_workers=WORKERS)


class TokenBucket:
    """A shared rate limiter: at most `rate` requests/second, however many
    threads are asking."""

    def __init__(self, rate):
        self.rate = rate
        self.tokens = rate
        self.updated = time.monotonic()
        self.lock = threading.Lock()

    def take(self):
        while True:
            with self.lock:
                now = time.monotonic()
                self.tokens = min(self.rate, self.tokens + (now - self.updated) * self.rate)
                self.updated = now
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                wait = (1 - self.tokens) / self.rate
            time.sleep(wait)


API_LIMITER = TokenBucket(RATE)
SPARQL_SEM = threading.Semaphore(SPARQL_CONCURRENCY)


def _retry_after(r):
    """Seconds to wait before retrying, from a 429/503's Retry-After header
    (a delta-seconds or an HTTP date), or None if it didn't send one."""
    val = r.headers.get("Retry-After")
    if not val:
        return None
    try:
        return float(val)
    except ValueError:
        try:
            dt = parsedate_to_datetime(val)
            return max(0.0, (dt - datetime.now(timezone.utc)).total_seconds())
        except (TypeError, ValueError):
            return None


def _get(url, params, sparql=False):
    """A polite GET: the shared token bucket for the MediaWiki API, a
    concurrency cap for SPARQL, Retry-After honoured on 429/503, and a backoff
    retry on a timeout or dropped connection (query.wikidata.org is occasionally
    slow under its own load, independent of anything we're doing). SPARQL gets
    fewer retries and a capped backoff: a P279* transitive query either answers
    in well under a minute or is unlikely to on this attempt at all, so giving
    up sooner and letting resolve_classes() defer that chunk beats stalling the
    whole run for several minutes on one query."""
    global REQUESTS_MADE
    retries = 3 if sparql else MAX_RETRIES
    last = None
    for attempt in range(retries):
        if sparql:
            SPARQL_SEM.acquire()
        else:
            API_LIMITER.take()
        try:
            r = SESSION.get(url, params=params, timeout=90 if sparql else 30)
        except requests.exceptions.RequestException as exc:
            last = exc
            time.sleep(min(16, 2 ** attempt))
            continue
        finally:
            if sparql:
                SPARQL_SEM.release()
        with REQUESTS_LOCK:
            REQUESTS_MADE += 1
        if r.status_code in (429, 503):
            time.sleep(min(16, _retry_after(r) or 2 ** attempt))
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"gave up after {retries} retries: {url}") from last


def _safe(text):
    """A filesystem-safe cache key: a short slug plus a hash, so two different
    queries never collide and the file name stays readable."""
    slug = re.sub(r"[^A-Za-z0-9]+", "_", text).strip("_")[:60]
    return f"{slug}_{hashlib.md5(text.encode()).hexdigest()[:8]}"


def _atomic_write(path, text):
    """Write-then-replace: safe for several threads writing different (or even
    the same) cache file at once, since a reader only ever sees a whole file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    tmp.write_text(text)
    os.replace(tmp, path)


def search(query):
    """wbsearchentities candidates for one name, cached under SEARCH_CACHE."""
    dest = SEARCH_CACHE / f"{_safe(query)}.json"
    if dest.exists():
        return json.loads(dest.read_text())
    data = _get(API, {"action": "wbsearchentities", "search": query, "language": "en",
                       "type": "item", "limit": 7, "format": "json"})
    _atomic_write(dest, json.dumps(data))
    return data


def get_entities(qids, props):
    """wbgetentities for many QIDs, cached one file per (QID, props): a labels-only
    fetch and a claims fetch of the same item are cached separately, so neither
    shadows the other. Uncached QIDs are fetched in batches of BATCH, in
    parallel on the shared thread pool (still throttled by the same limiter)."""
    props_key = props.replace("|", "-")
    qids = list(dict.fromkeys(qids))
    result, missing = {}, []
    for q in qids:
        dest = ENTITY_CACHE / f"{q}__{props_key}.json"
        if dest.exists():
            result[q] = json.loads(dest.read_text())
        else:
            missing.append(q)

    def fetch(chunk):
        data = _get(API, {"action": "wbgetentities", "ids": "|".join(chunk), "props": props,
                           "languages": "en", "format": "json"})
        out = {}
        for q, ent in data.get("entities", {}).items():
            _atomic_write(ENTITY_CACHE / f"{q}__{props_key}.json", json.dumps(ent))
            out[q] = ent
        return out

    chunks = [missing[i:i + BATCH] for i in range(0, len(missing), BATCH)]
    if chunks:
        for f in cf.as_completed([POOL.submit(fetch, c) for c in chunks]):
            result.update(f.result())
    return result


def _resolve_classes_query(chunk):
    """One class-membership SPARQL query for this exact chunk. On failure
    (timeout or anything else), a chunk of more than one class splits in half
    and each half retries the same way; a single class that still fails is
    logged and reported as unresolved rather than raised, so one bad class
    never crashes the run. Returns (good, unresolved): good = classes
    confirmed transitively a subclass of organization; unresolved = classes
    still unknown (left out of the cache; a later run tries them again)."""
    values = " ".join(f"wd:{c}" for c in chunk)
    query = f"SELECT DISTINCT ?cls WHERE {{ VALUES ?cls {{ {values} }} ?cls wdt:P279* wd:{ORG} . }}"
    try:
        data = _get(SPARQL, {"query": query, "format": "json"}, sparql=True)
        return {b["cls"]["value"].rsplit("/", 1)[-1] for b in data["results"]["bindings"]}, set()
    except Exception as exc:
        if len(chunk) == 1:
            print(f"resolve_classes: {chunk[0]} still fails alone "
                  f"({exc.__class__.__name__}: {exc}); leaving unresolved for the next run", flush=True)
            return set(), set(chunk)
        print(f"resolve_classes: a chunk of {len(chunk)} classes failed "
              f"({exc.__class__.__name__}: {exc}); splitting in half and retrying", flush=True)
        mid = len(chunk) // 2
        good1, unresolved1 = _resolve_classes_query(chunk[:mid])
        good2, unresolved2 = _resolve_classes_query(chunk[mid:])
        return good1 | good2, unresolved1 | unresolved2


def resolve_classes(cls_qids):
    """Which of these P31 classes are some kind of organization. ALLOWLIST
    covers the common classes without any SPARQL; only classes outside it and
    not already cached go to the P279* transitive-closure check, in chunks of
    CHUNK_CLASSES, in parallel up to SPARQL_CONCURRENCY at once (that query
    measured 15-35s live, occasionally much more under load, and sometimes
    fails outright — see _resolve_classes_query for how a failure is contained
    rather than left to crash the run). classes.json is one file shared by
    every chunk of targets, so the whole read-check-write cycle is under
    CLASS_LOCK."""
    with CLASS_LOCK:
        known = json.loads(CLASS_CACHE.read_text()) if CLASS_CACHE.exists() else {}
        new_allowlisted = [c for c in cls_qids if c in ALLOWLIST and c not in known]
        for c in new_allowlisted:
            known[c] = True
        todo = [c for c in dict.fromkeys(cls_qids) if c not in known and c not in ALLOWLIST]
        if not todo:
            if new_allowlisted:
                _atomic_write(CLASS_CACHE, json.dumps(known))
            return known

        chunks = [todo[i:i + CHUNK_CLASSES] for i in range(0, len(todo), CHUNK_CLASSES)]
        good, unresolved = set(), set()
        for f in cf.as_completed([POOL.submit(_resolve_classes_query, c) for c in chunks]):
            g, u = f.result()
            good |= g
            unresolved |= u
        resolved = set(todo) - unresolved
        for c in resolved:
            known[c] = c in good
        if resolved or new_allowlisted:
            _atomic_write(CLASS_CACHE, json.dumps(known))
        return known


def matching_text(entity, key):
    """The label or alias that maps to key by our own name rules, and which kind
    it was ("label" or "alias"), or (None, None)."""
    lab = entity.get("labels", {}).get("en", {}).get("value")
    if lab and key in (names.client(lab), resolver().client(lab)):
        return lab, "label"
    for a in entity.get("aliases", {}).get("en", []):
        if key in (names.client(a["value"]), resolver().client(a["value"])):
            return a["value"], "alias"
    return None, None


def sector_of_naics(two_digit):
    """A two-digit NAICS code as a sector, in week04_sec.sector_of_sic's grouped
    convention (31-33 manufacturing, 44-45 retail, 48-49 transportation)."""
    grouped = {"31": "31-33", "32": "31-33", "33": "31-33", "44": "44-45", "45": "44-45",
               "48": "48-49", "49": "48-49"}
    code = grouped.get(two_digit, two_digit)
    valid = {"11", "21", "22", "23", "31-33", "42", "44-45", "48-49", "51", "52", "53", "54",
             "55", "56", "61", "62", "71", "72", "81", "92"}
    return code if code in valid else ""


def majority(values):
    """The most common value and whether it is tied with another (a conflict)."""
    counts = Counter(values)
    top, n = counts.most_common(1)[0]
    return top, sum(1 for c in counts.values() if c == n) > 1


def claim_values(claims, prop):
    """The plain values of a claim: strings for an external ID, QIDs for an item."""
    out = []
    for c in claims.get(prop, []):
        snak = c["mainsnak"]
        if snak.get("snaktype") != "value":
            continue
        v = snak["datavalue"]["value"]
        out.append(v["id"] if isinstance(v, dict) else v)
    return out


def industry_sector_table():
    """qid -> reviewed NAICS sector, from week04_wikidata_industries.csv. Built
    by hand (see that file's header) from this script's own industries that
    otherwise leave a matched company unlabelled."""
    if not INDUSTRY_TABLE.exists():
        return {}
    with open(INDUSTRY_TABLE, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["qid"]: r["naics2"] for r in rows if r["naics2"]}


def sector_of(claims, industry_entities, industry_table):
    """(sector, source, conflict) from a company's own NAICS/SIC, else a
    majority of its industries' NAICS, else the reviewed industry table, else a
    majority of its industries' SIC. A tie in a majority is a conflict, not a
    guess."""
    own_naics = claim_values(claims, "P3224")
    if own_naics:
        s = sector_of_naics(own_naics[0][:2])
        if s:
            return s, "P3224 (company)", False
    industries = claim_values(claims, "P452")
    ind_naics = [sector_of_naics(v[:2]) for i in industries
                 for v in claim_values(industry_entities.get(i, {}).get("claims", {}), "P3224")]
    ind_naics = [s for s in ind_naics if s]
    if ind_naics:
        s, conflict = majority(ind_naics)
        return s, "P3224 (industry)", conflict
    ind_reviewed = [industry_table[i] for i in industries if industry_table.get(i)]
    if ind_reviewed:
        s, conflict = majority(ind_reviewed)
        return s, "reviewed industry table", conflict
    own_sic = claim_values(claims, "P3242")
    if own_sic:
        s = sector_of_sic(own_sic[0])
        if s:
            return s, "P3242 (company)", False
    ind_sic = [sector_of_sic(v) for i in industries
               for v in claim_values(industry_entities.get(i, {}).get("claims", {}), "P3242")]
    ind_sic = [s for s in ind_sic if s]
    if ind_sic:
        s, conflict = majority(ind_sic)
        return s, "P3242 (industry)", conflict
    return "", "", False


def our_targets():
    """Client and filing-firm keys with MIN_FILINGS+ certified filings, FY2022 to
    FY2025, that neither the reviewed table nor the SEC already covers; the
    full queue puts FY2025's multi-vendor clients in the giant component
    (section 3's test set) first."""
    counts = pd.Series(dtype=float)
    raw = defaultdict(Counter)  # key -> Counter of the raw names that resolved to it
    year_rows = {}
    for year in YEARS:
        lca = certified(year)
        for n, k in zip(lca["EMPLOYER_NAME"], lca["employer"]):
            raw[k][n] += 1
        rows, _, _ = placements(year, lca)
        year_rows[year] = (lca, rows)
        sites = load(f"worksites_fy{year}")
        sites = sites[sites["SECONDARY_ENTITY"].str.upper().str.startswith("Y")]
        sites = sites[sites["CASE_NUMBER"].isin(lca["CASE_NUMBER"])]
        for n in sites["SECONDARY_ENTITY_BUSINESS_NAME"]:
            k = resolver().client(n)
            if k:
                raw[k][n] += 1
        counts = counts.add(lca["employer"].value_counts(), fill_value=0)
        counts = counts.add(rows["client"].value_counts(), fill_value=0)
    # A handful of filings carry a blank employer name (6 of them, FY2022-FY2023),
    # which resolver().employer() passes through as "": not a company to look up.
    counts = counts[counts.index != ""]
    targets = counts[counts >= MIN_FILINGS]
    # The reviewed table and the SEC only: names.naics2() would also count our own
    # last run's wikidata CSV, which would shrink "todo" (and so the CSV, since it
    # only ever writes today's todo) by exactly the keys we already solved.
    reviewed_or_sec = lambda k: names._sectors().get(k) or names._sec_sectors().get(k, "")
    have_sector = pd.Series(targets.index, index=targets.index).map(reviewed_or_sec).astype(bool)
    todo = targets[~have_sector]

    lca2025, rows2025 = year_rows[2025]
    giant_clients = {n[1] for n in giant_of(graph(rows2025)) if n[0] == "C"}
    per_client = rows2025.groupby(["client", "employer"]).size().rename("filings").reset_index()
    vendors = per_client.groupby("client")["employer"].nunique()
    # The full test set week04_staffing.main() scores communities against (2+
    # vendors, in the giant component): coverage lift is reported over all of it,
    # even the handful too small to be a target in their own right.
    test_all = set(vendors[vendors >= 2].index) & giant_clients
    test_todo = test_all & set(todo.index)

    # Filings desc, key as a tiebreaker: a set has no stable iteration order across
    # runs, so without one, targets tied on filings would reshuffle every rerun.
    priority = sorted(test_todo, key=lambda k: (-todo[k], k))
    rest = sorted(set(todo.index) - test_todo, key=lambda k: (-todo[k], k))
    return targets, todo, priority, priority + rest, raw, test_all


def candidates_for(key, raw_counter):
    """Search queries for one target: its label, and (if different) the most
    common raw filing name. Runs on a worker thread."""
    label = resolver().label(key)
    queries = [label]
    common = raw_counter.get(key)
    if common:
        raw_name = common.most_common(1)[0][0]
        if raw_name.upper() != label.upper():
            queries.append(raw_name)
    seen, candidates = set(), []
    for q in queries:
        for hit in search(q).get("search", []):
            if hit["id"] not in seen:
                seen.add(hit["id"])
                candidates.append(hit["id"])
    return key, candidates


def fetch_chunk(chunk_keys, raw_counter):
    """Every network round trip for up to CHUNK_TARGETS targets: candidate
    search in parallel across targets, the exact-name filter, one batched
    company check for every candidate the whole chunk turned up (instead of one
    SPARQL query per target), and the industries of each accepted match. Returns
    key -> a raw dict finalize() turns into a CSV row, or a "reason" dict."""
    futures = {POOL.submit(candidates_for, key, raw_counter): key for key in chunk_keys}
    candidates_by_key = {}
    for f in cf.as_completed(futures):
        key, candidates = f.result()
        candidates_by_key[key] = candidates

    all_candidates = sorted({q for cs in candidates_by_key.values() for q in cs})
    stage1 = get_entities(all_candidates, "labels|aliases")

    accepted_by_key = {}
    for key, candidates in candidates_by_key.items():
        accepted = []
        for qid in candidates:
            ent = stage1.get(qid)
            if not ent:
                continue
            text, kind = matching_text(ent, key)
            if text:
                accepted.append((qid, text, kind))
        accepted_by_key[key] = accepted

    all_accepted = sorted({q for accs in accepted_by_key.values() for q, *_ in accs})
    stage2 = get_entities(all_accepted, "claims|sitelinks")

    all_p31 = sorted({c for qid in all_accepted
                       for c in claim_values(stage2.get(qid, {}).get("claims", {}), "P31")})
    classes = resolve_classes(all_p31)

    best_by_key = {}
    for key, accepted in accepted_by_key.items():
        companies = [(qid, text, kind) for qid, text, kind in accepted
                     if any(classes.get(c) for c in
                            claim_values(stage2.get(qid, {}).get("claims", {}), "P31"))]
        if not companies:
            best_by_key[key] = None
            continue
        sitelinked = sorted(companies, key=lambda c: -len(stage2.get(c[0], {}).get("sitelinks", {})))
        best_qid, best_text, kind = sitelinked[0]
        ambiguous = (len(sitelinked) > 1 and len(stage2[sitelinked[0][0]].get("sitelinks", {}))
                     == len(stage2[sitelinked[1][0]].get("sitelinks", {})))
        best_by_key[key] = (best_qid, kind, ambiguous)

    all_industries = sorted({i for best in best_by_key.values() if best
                              for i in claim_values(stage2[best[0]].get("claims", {}), "P452")})
    industry_entities = get_entities(all_industries, "claims|labels") if all_industries else {}

    results = {}
    for key in chunk_keys:
        if not candidates_by_key.get(key):
            results[key] = {"reason": "no Wikidata candidates for this name"}
        elif not accepted_by_key.get(key):
            results[key] = {"reason": "no candidate's label or alias matches our name rules exactly"}
        elif not best_by_key.get(key):
            results[key] = {"reason": "matched a name but no candidate is a kind of organization"}
        else:
            best_qid, kind, ambiguous = best_by_key[key]
            results[key] = {
                "qid": best_qid,
                "wikidata_label": stage1.get(best_qid, {}).get("labels", {}).get("en", {}).get("value", ""),
                "match": kind,
                "ambiguous": ambiguous,
                "claims": stage2[best_qid].get("claims", {}),
                "industry_entities": industry_entities,
            }
    return results


def finalize(raw_result, industry_table):
    """A chunk's raw per-key result -> the fields a CSV row needs, computing the
    sector now that the reviewed industry table is available."""
    if "qid" not in raw_result:
        return raw_result
    claims = raw_result["claims"]
    industry_entities = raw_result["industry_entities"]
    industries = claim_values(claims, "P452")
    sector, source, conflict = sector_of(claims, industry_entities, industry_table)
    industry_labels = [industry_entities.get(i, {}).get("labels", {}).get("en", {}).get("value", i)
                        for i in industries]
    return {
        "qid": raw_result["qid"], "wikidata_label": raw_result["wikidata_label"], "match": raw_result["match"],
        "industry_qids": "|".join(industries), "industry_labels": "|".join(industry_labels),
        "naics2": sector, "source_codes": source,
        "reason": "" if sector else "no NAICS or SIC on the company or its industries",
        "ambiguous": raw_result["ambiguous"], "conflict": conflict,
    }


COLUMNS = ["key", "label", "filings", "qid", "wikidata_label", "match", "industry_qids",
           "industry_labels", "naics2", "source_codes", "reason"]


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--priority", action="store_true",
                         help="only FY2025's multi-vendor clients (section 3's test set) without a sector")
    args = parser.parse_args()

    started = time.time()
    targets, todo, priority, order_full, raw, test_all = our_targets()
    order = priority if args.priority else order_full
    industry_table = industry_sector_table()

    print(f"{len(targets):,} targets with {MIN_FILINGS}+ filings FY2022-FY2025; "
          f"{len(todo):,} without a sector yet ({todo.sum() / targets.sum():.1%} of target filings); "
          f"FY2025 multi-vendor clients (section 3's test set): {len(test_all):,} in all, "
          f"{len(priority):,} without a sector. Running "
          f"{'priority-only' if args.priority else 'the full queue'} ({len(order):,} targets) "
          f"with {WORKERS} workers, {RATE:.0f} req/s, {len(industry_table)} reviewed industries", flush=True)

    rows, ambiguous, conflicts, reasons = [], [], [], Counter()
    processed, budget_hit, chunk_results = 0, False, {}
    for i in tracked("Wikidata matching", len(order)):
        if BUDGET and time.time() - started > BUDGET:
            budget_hit = True
            break
        if i % CHUNK_TARGETS == 0:
            chunk_results = fetch_chunk(order[i:i + CHUNK_TARGETS], raw)
        key = order[i]
        result = finalize(chunk_results[key], industry_table)
        processed += 1
        if "qid" not in result:
            reasons[result["reason"]] += 1
            continue
        if result.pop("ambiguous"):
            ambiguous.append({"key": key, "label": resolver().label(key), "qid": result["qid"]})
        if result.pop("conflict"):
            conflicts.append({"key": key, "label": resolver().label(key), "naics2": result["naics2"],
                               "industry_labels": result["industry_labels"]})
        rows.append({"key": key, "label": resolver().label(key), "filings": int(todo[key]), **result})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as fh:
        fh.write("# Client and filing-firm keys matched to a Wikidata company by exact normalized "
                 "name (week04_names.client/resolver().client), restricted to items that are some kind "
                 "of organization; NAICS/SIC from the company or its industries via week04_wikidata.py. "
                 "A row with no naics2 matched a company but found no usable code; see 'reason'.\n")
        writer = csv.DictWriter(fh, COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    matched = len(rows)
    with_sector = sum(1 for r in rows if r["naics2"])
    # The reviewed table and the SEC's sectors are already on disk and cached from
    # import time; only the CSV this run just wrote needs its cache cleared to be seen.
    names._wikidata_sectors.cache_clear()

    # Coverage lift: FY2025 multi-vendor clients in the giant component (section 3's
    # industry-or-vendor test set). "Before" is the reviewed table and the SEC alone.
    wikidata_keys = {r["key"] for r in rows if r["naics2"]}
    r2025, _, _ = placements(2025, certified(2025))
    totals_2025 = r2025.groupby("client").size()

    def filing_share(keys):
        return round(float(totals_2025[list(keys)].sum() / totals_2025.sum()), 4) if keys else 0.0

    before = [c for c in test_all if c not in wikidata_keys and names.naics2(c)]
    after = [c for c in test_all if names.naics2(c)]

    rng_sample = __import__("random").Random(2805)
    accepted_rows = [r for r in rows if r["qid"]]
    sample = rng_sample.sample(accepted_rows, min(30, len(accepted_rows)))

    summary = {
        "generated_by": "analysis/week04_wikidata.py",
        "priority_only": args.priority,
        "workers": WORKERS,
        "rate_per_second": RATE,
        "requests_made": REQUESTS_MADE,
        "budget_seconds": BUDGET,
        "budget_hit": budget_hit,
        "targets": int(len(targets)),
        "targets_filing_share_note": "MIN_FILINGS=5, summed FY2022-FY2025, clients and filing firms",
        "todo_before_wikidata": int(len(todo)),
        "todo_filing_share_of_targets": round(float(todo.sum() / targets.sum()), 4),
        "queued": int(len(order)),
        "processed": processed,
        "matched": matched,
        "matched_with_sector": with_sector,
        "matched_with_sector_by_source": dict(Counter(r["source_codes"] for r in rows if r["naics2"])),
        "unmatched_reasons": dict(reasons.most_common()),
        "ambiguous_ties": ambiguous,
        "sector_conflicts": conflicts,
        "coverage_lift_fy2025_multi_vendor_clients": {
            "clients": len(test_all),
            "filing_share_of_fy2025": filing_share(test_all),
            "with_sector_before": len(before),
            "with_sector_after": len(after),
            "filing_share_before": filing_share(before),
            "filing_share_after": filing_share(after),
        },
        "sample_accepted_matches": [
            {"key": r["key"], "label": r["label"], "wikidata_label": r["wikidata_label"], "qid": r["qid"],
             "naics2": r["naics2"]} for r in sample],
        "seconds": round(time.time() - started),
    }
    SUMMARY.write_text(json.dumps(summary, indent=1, default=str) + "\n")
    print(json.dumps({k: v for k, v in summary.items() if k not in
                      ("sample_accepted_matches", "ambiguous_ties", "sector_conflicts")}, indent=1))


if __name__ == "__main__":
    main()
