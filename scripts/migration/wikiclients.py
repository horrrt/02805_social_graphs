"""Thin, polite clients for the MediaWiki and Wikidata APIs.

Both endpoints reject requests without a User-Agent that names the client, so
every call here sends one (see analysis/week01_api_check.py for the same rule on
the Marvel harvest). Every helper retries with a backoff and raises on give-up,
so a partial harvest never looks like a complete one.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = (
    "02805-social-graphs-course-project/0.1 "
    "(https://github.com/horrrt/02805_social_graphs; gyula.kurthy1@gmail.com)"
)
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WDQS = "https://query.wikidata.org/sparql"


MIN_INTERVAL = 0.25  # seconds between requests; the APIs answer 429 above ~5/s
_last_call = [0.0]


def _throttle():
    gap = time.monotonic() - _last_call[0]
    if gap < MIN_INTERVAL:
        time.sleep(MIN_INTERVAL - gap)
    _last_call[0] = time.monotonic()


def _request(url, data=None, headers=None, timeout=90, tries=8):
    head = {"User-Agent": USER_AGENT}
    head.update(headers or {})
    last = None
    for attempt in range(tries):
        _throttle()
        try:
            req = urllib.request.Request(url, data=data, headers=head)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last = exc
            wait = int(exc.headers.get("Retry-After") or 0) or min(60, 2 ** attempt)
            print(f"  retry {attempt + 1}/{tries} in {wait}s: {exc}", file=sys.stderr)
            time.sleep(wait)
        except (urllib.error.URLError, OSError) as exc:
            last = exc
            wait = min(60, 2 ** attempt)
            print(f"  retry {attempt + 1}/{tries} in {wait}s: {exc}", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"request failed after {tries} tries: {url}") from last


def api(endpoint, **params):
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    url = endpoint + "?" + urllib.parse.urlencode(params)
    return json.loads(_request(url))


def api_paged(endpoint, key, **params):
    """Follow `continue` until the API stops handing out more of `key`."""
    out = []
    params = dict(params)
    while True:
        payload = api(endpoint, **params)
        block = payload.get("query", {})
        value = block.get(key, [])
        if isinstance(value, dict):  # prop= queries key by page id
            out.extend(value.values())
        else:
            out.extend(value)
        if "continue" not in payload:
            return out
        params.update(payload["continue"])


def api_paged_pages(endpoint, **params):
    """Page-keyed prop queries: merge continuations per page instead of appending."""
    merged = {}
    params = dict(params)
    while True:
        payload = api(endpoint, **params)
        for page in payload.get("query", {}).get("pages", []):
            slot = merged.setdefault(page["title"], page)
            for field, value in page.items():
                if isinstance(value, list) and slot is not page:
                    slot.setdefault(field, [])
                    slot[field] = slot[field] + value
        if "continue" not in payload:
            return list(merged.values())
        params.update(payload["continue"])


def sparql(query):
    data = urllib.parse.urlencode({"query": query}).encode()
    raw = _request(
        WDQS,
        data=data,
        headers={
            "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=300,
    )
    payload = json.loads(raw)
    keys = payload["head"]["vars"]
    return [
        {k: row[k]["value"] for k in keys if k in row}
        for row in payload["results"]["bindings"]
    ]


def batched(seq, size):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i:i + size]
