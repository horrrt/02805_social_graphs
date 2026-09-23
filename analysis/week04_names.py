"""Company-name cleaning for the week 4 staffing network.

Clients in the H-1B filings have no tax number, only a name typed by the
employer's lawyer, so the same bank arrives as "Citibank", "Citibank, N.A."
and "CITIBANK NA". normalize() folds spelling and spaced acronyms ("A D P" is
ADP); family() also drops trailing generic words ("FIDELITY TECHNOLOGY" is
Fidelity) and applies the corporate-family table in week04_client_aliases.csv.
client() adds the cases only a client name has: placeholders ("Home Address",
"Remote"), chains ("TALENTSOURCE LLC/FIDELITY INVESTMENTS" is Fidelity) and
trade names ("HAIER US APPLIANCE SOLUTIONS DBA GE APPLIANCES" is GE Appliances).
employer() keys the filing firm the same way, so a firm keeps one key in every
year, including FY2022 and FY2023, which carry no tax number.
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
    r"|\bWFH\b|TBD|TO BE DETERMINED|^HOUSE$|^ADDRESS|WORKER S ADDRESS|HOME WORKSITE"
    r"|CLIENT LOCATION|CLIENT SITE|VARIOUS|MULTIPLE|NOT APPLICABLE|^N ?A$|^NONE$|^SAME AS"
    r"|^EMPLOYEE\b|BENEFICIAR|^CLIENT$|^UNKNOWN"
)
# Trailing words that name a division, not a different company. family() drops
# them one at a time until the name matches the alias table or would become
# too short or end in a connective ("BANK OF AMERICA" never loses AMERICA).
GENERIC = {
    "BANK", "BANKING", "SERVICES", "SERVICE", "TECHNOLOGY", "TECHNOLOGIES", "GLOBAL",
    "OPERATIONS", "INSTITUTIONAL", "SOLUTIONS", "NATIONAL", "ASSOCIATION", "CORPORATE",
    "INTERNATIONAL", "NORTH", "AMERICA", "AMERICAS", "SYSTEMS", "INFORMATION", "SOURCING",
    "CONSULTING", "PVT", "PRIVATE", "DIGITAL", "IT", "ENTERPRISES", "ENTERPRISE",
}
CONNECTIVE = {"OF", "AND", "FOR", "THE", "DE", "IN"}
DBA = re.compile(r"\b(?:DBA|D B A|DOING BUSINESS AS|AKA|A K A)\b")
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
    return _collapse(words)


def _collapse(words):
    """Join runs of single characters ("A D P" is ADP, "J P MORGAN" is JP MORGAN),
    then strip any suffix that exposes ("AMAZON U S" loses US)."""
    out, run = [], []
    for w in words + [""]:
        if len(w) == 1 and w.isalnum():
            run.append(w)
            continue
        if run:
            out.append("".join(run))
            run = []
        if w:
            out.append(w)
    while out and out[-1] in SUFFIXES:
        out.pop()
    return " ".join(out)


@lru_cache(maxsize=None)
def aliases():
    """normalized name -> (canonical name, 2-digit NAICS or '')."""
    if not ALIASES.exists():
        return {}
    with open(ALIASES, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["name"]: (r["canonical"], r["naics2"]) for r in rows}


def family(key):
    """The company a normalized name belongs to: its alias, or the name without
    trailing division words ("CAPITAL ONE SERVICES" is Capital One)."""
    table = aliases()
    if key in table:
        return table[key][0]
    words = key.split()
    while len(words) > 1 and words[-1] in GENERIC:
        shorter = " ".join(words[:-1])
        if shorter in table:
            return table[shorter][0]
        if words[-2] in CONNECTIVE or len(shorter) < 4:
            break
        words = words[:-1]
    return " ".join(words)


@lru_cache(maxsize=None)
def employer(raw):
    """The key of the firm that filed: its company family. The legal name before
    a "DBA" is the one that filed."""
    return family(DBA.split(normalize(raw))[0].strip()) or raw.strip().upper()


@lru_cache(maxsize=None)
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
    # A trade name after "DBA" is the name the company is known by.
    trade = DBA.split(normalize(s))
    key = trade[-1].strip() if len(trade) > 1 and trade[-1].strip() else normalize(s)
    if not key or PLACEHOLDER.search(key) or PLACEHOLDER.search(s):
        return None
    return family(key)


@lru_cache(maxsize=None)
def _sectors():
    return {name: code for name, code in aliases().values() if code}


def naics2(canonical):
    """The reviewed NAICS sector of a client, if the alias table has one."""
    return _sectors().get(canonical, "")
