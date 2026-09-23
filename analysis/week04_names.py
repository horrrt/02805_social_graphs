"""Company-name cleaning for the week 4 staffing network.

Clients in the H-1B filings have no tax number, only a name typed by the
employer's lawyer, so the same bank arrives as "Citibank", "Citibank, N.A."
and "CITIBANK NA". normalize() folds spelling; client() also drops
placeholders ("Home Address", "Remote"), keeps the end client of a chain
("TALENTSOURCE LLC/FIDELITY INVESTMENTS" is Fidelity), and applies the
reviewed corporate-family table in week04_client_aliases.csv.
"""

import csv
import re
from functools import lru_cache
from pathlib import Path

ALIASES = Path(__file__).with_name("week04_client_aliases.csv")

SUFFIXES = {
    "AND", "INC", "INCORPORATED", "LLC", "L L C", "LTD", "LIMITED", "CORP", "CORPORATION", "CO",
    "COMPANY", "LLP", "LP", "PLC", "NA", "N A", "THE", "US", "USA", "GROUP", "HOLDINGS",
}
# A worker placed at home, or no real client named.
PLACEHOLDER = re.compile(
    r"HOME ADDRESS|HOME OFFICE|HOME LOCATION|RESIDEN|TELECOMMUT|TELEWORK|REMOTE|WORK FROM HOME"
    r"|\bWFH\b|TBD|TO BE DETERMINED|^HOUSE$|^ADDRESS|WORKER S ADDRESS"
    r"|CLIENT LOCATION|CLIENT SITE|VARIOUS|MULTIPLE|NOT APPLICABLE|^N ?A$|^NONE$|^SAME AS"
    r"|^EMPLOYEE\b|BENEFICIAR|^CLIENT$|^UNKNOWN"
)
# Trailing phrases that describe the site rather than name the company.
SITE_PHRASE = re.compile(r"\s*[-(,]\s*(CLIENT LOCATION|CLIENT SITE|CLIENT|END CLIENT|PROJECT).*$")


def normalize(name):
    """Upper case, no punctuation, no legal suffix: a spelling-free key."""
    s = name.upper().replace("&", " AND ")
    s = re.sub(r"[^A-Z0-9 ]+", " ", s)
    words = s.split()
    while words and words[-1] in SUFFIXES:
        words.pop()
    while words and words[0] == "THE":
        words.pop(0)
    # Two-word suffixes ("N A", "L L C") arrive as single letters.
    while len(words) >= 2 and " ".join(words[-2:]) in SUFFIXES:
        words = words[:-2]
    return " ".join(words)


@lru_cache(maxsize=None)
def aliases():
    """normalized name -> (canonical name, 2-digit NAICS or '')."""
    if not ALIASES.exists():
        return {}
    with open(ALIASES, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["name"]: (r["canonical"], r["naics2"]) for r in rows}


def client(raw):
    """The canonical end client, or None for a placeholder."""
    s = raw.strip()
    if not s:
        return None
    # A chain "VENDOR/CLIENT" names the end client last.
    if "/" in s:
        parts = [p for p in re.split(r"\s*/\s*", s) if len(normalize(p)) > 2]
        if parts:
            s = parts[-1]
    s = SITE_PHRASE.sub("", s.upper())
    key = normalize(s)
    if not key or PLACEHOLDER.search(key) or PLACEHOLDER.search(s):
        return None
    return aliases().get(key, (key, ""))[0]


@lru_cache(maxsize=None)
def _sectors():
    return {name: code for name, code in aliases().values() if code}


def naics2(canonical):
    """The reviewed NAICS sector of a client, if the alias table has one."""
    return _sectors().get(canonical, "")
