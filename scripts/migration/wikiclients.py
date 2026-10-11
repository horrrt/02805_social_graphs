"""Thin, polite clients for the MediaWiki and Wikidata APIs.

Both endpoints reject requests without a User-Agent that names the client, so
every call here sends one (see analysis/week01_api_check.py for the same rule on
the Marvel harvest). Every helper retries with a backoff and raises on give-up,
so a partial harvest never looks like a complete one.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "analysis"))
import fetch as web  # noqa: E402


def user_agent() -> str:
    """Built lazily, at request time, so importing this module never needs
    CONTACT_EMAIL and only a script that actually calls the APIs fails on it."""
    contact = os.environ.get("CONTACT_EMAIL")
    if not contact:
        raise SystemExit("CONTACT_EMAIL is unset: set CONTACT_EMAIL=you@example.com and rerun.")
    return (
        "02805-social-graphs-course-project/0.1 "
        f"(https://github.com/horrrt/02805_social_graphs; {contact})"
    )


WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WDQS = "https://query.wikidata.org/sparql"


MIN_INTERVAL = 0.25  # seconds between requests; the APIs answer 429 above ~5/s
_session = []


def _request(url, data=None, headers=None, timeout=90, tries=8):
    """The response body. fetch.session retries a 429 or 5xx (waiting out any
    Retry-After), a timeout and a dropped connection, and raises on give-up."""
    if not _session:
        _session.append(web.session(user_agent(), tries=tries, min_interval=MIN_INTERVAL))
    s = _session[0]
    r = s.post(url, data=data, headers=headers, timeout=timeout) if data is not None else \
        s.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r.content


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
