"""Company identity for the week 4 networks: which filings belong to one company.

"Same company" means: entities that share a tax number (FEIN); divisions that
carry the parent's name (Citigroup Technology, Verizon Sourcing, Amazon Web
Services); and renames or mergers into one company (SunTrust into Truist, FCA
into Stellantis). Separately branded acquisitions stay separate (LinkedIn,
Aetna, Optum), as do spin-offs once separated (GE HealthCare), and bare names
that could mean several companies (FIDELITY, CAPITAL) are left unmerged. Every
merge beyond a shared tax number is written down: week04_client_aliases.csv
for company families, week04_name_merges.csv for misspellings. Nothing is
merged by similarity at run time.

The pure name rules:
- normalize(): upper case, no punctuation or legal suffix, spaced acronyms of
  up to four letters folded ("A D P" is ADP; "A.P.P.L.E." stays apart from
  Apple).
- family(): the alias table, looked up by the normalized name and by the same
  name without spaces ("WELLSFARGO" is Wells Fargo).
- client(): also drops placeholders ("Home Address", "Remote"), keeps the end
  client of a chain ("TALENTSOURCE LLC/FIDELITY INVESTMENTS") and the trade
  name after "DBA".

Resolver adds what the filings know. An employer is its tax number wherever it
has one, so every spelling and typo under one FEIN is one company; FY2022 and
FY2023, which have none, borrow the FEIN of the same name in FY2024 to FY2026
when that name had exactly one. A client whose name matches an employer name
that had exactly one FEIN takes that FEIN, so a firm has one key as employer and
as client. week04_names_check.py tests all of this against tax numbers.
"""

import csv
import re
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

ALIASES = Path(__file__).with_name("week04_client_aliases.csv")
# Misspellings of a much more common name, found and filtered by
# week04_names_check.py --build-merges; one row per variant, reviewable.
MERGES = Path(__file__).with_name("week04_name_merges.csv")
# SEC industry for listed companies, built by week04_sec.py.
SEC = Path(__file__).with_name("week04_sec_sectors.csv")

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
DBA = re.compile(r"\b(?:DBA|DOING BUSINESS AS|AKA)\b")
# Trailing phrases that describe the site rather than name the company.
SITE_PHRASE = re.compile(r"\s*[-(,]\s*(CLIENT LOCATION|CLIENT SITE|CLIENT|END CLIENT|PROJECT).*$")
MAX_ACRONYM = 4


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
    """Join runs of up to four single characters ("A D P" is ADP, "J P MORGAN" is
    JP MORGAN), then strip any suffix that exposes ("AMAZON U S" loses US). A
    longer run is a spelled-out word and stays apart ("A P P L E" is not Apple)."""
    out, run = [], []
    for w in words + [""]:
        if len(w) == 1 and w.isalnum():
            run.append(w)
            continue
        if run:
            out.extend(["".join(run)] if len(run) <= MAX_ACRONYM else run)
            run = []
        if w:
            out.append(w)
    while out and out[-1] in SUFFIXES:
        out.pop()
    return " ".join(out)


def compact(key):
    return key.replace(" ", "")


@lru_cache(maxsize=None)
def aliases():
    """normalized name -> (canonical name, NAICS sector or '')."""
    if not ALIASES.exists():
        return {}
    with open(ALIASES, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["name"]: (r["canonical"], r["naics2"]) for r in rows}


@lru_cache(maxsize=None)
def _compact_aliases():
    return {compact(k): v for k, v in aliases().items()}


@lru_cache(maxsize=None)
def canonicals():
    return {c for c, _ in aliases().values()}


@lru_cache(maxsize=None)
def merges():
    """misspelt key -> the key it misspells."""
    if not MERGES.exists():
        return {}
    with open(MERGES, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["variant"]: r["target"] for r in rows}


def family(key):
    """The company a normalized name belongs to, if the table names one; else the name
    (with a listed misspelling replaced by the name it misspells)."""
    key = merges().get(key, key)
    hit = aliases().get(key) or _compact_aliases().get(compact(key))
    return hit[0] if hit else key


@lru_cache(maxsize=None)
def _sectors():
    return {name: code for name, code in aliases().values() if code}


@lru_cache(maxsize=None)
def _sec_sectors():
    if not SEC.exists():
        return {}
    with open(SEC, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.startswith("#"))
        return {r["key"]: r["naics2"] for r in rows if r["naics2"]}


def naics2(key):
    """A company's NAICS sector: the reviewed table's, else the SEC's, else ''."""
    return _sectors().get(key) or _sec_sectors().get(key, "")


def sector_source(key):
    return "reviewed" if key in _sectors() else "sec" if key in _sec_sectors() else ""


def legal_name(raw):
    """The normalized legal name: the part before a "DBA"."""
    return normalize(DBA.split(normalize(raw))[0])


@lru_cache(maxsize=None)
def client(raw):
    """The client a secondary-entity name names, by name alone, or None for a placeholder."""
    # "d/b/a" marks a trade name, not a chain: protect it from the "/" split.
    s = re.sub(r"(?i)\bd\s*/\s*b\s*/\s*a\b", " DBA ", raw).strip()
    if not s:
        return None
    # A chain "VENDOR/CLIENT" names the end client last.
    if "/" in s:
        parts = [p for p in re.split(r"\s*/\s*", s) if len(normalize(p)) > 2]
        if parts:
            s = parts[-1]
    s = SITE_PHRASE.sub("", s.upper())
    trade = DBA.split(normalize(s))
    key = normalize(trade[-1]) if len(trade) > 1 and trade[-1].strip() else normalize(s)
    if not key or PLACEHOLDER.search(key) or PLACEHOLDER.search(s):
        return None
    return family(key)


def fein_of(value):
    """A usable tax number: nine digits, not all the same."""
    digits = re.sub(r"\D", "", value or "")
    return digits if len(digits) == 9 and len(set(digits)) > 1 else ""


class Resolver:
    """Company keys from the filings: tax number first, the alias table for families.

    Build it from the (employer name, FEIN) pairs of every year that has FEINs.
    employer(name, fein) and client(raw) return keys; label(key) a display name.
    """

    def __init__(self, names, feins):
        by_fein = defaultdict(Counter)
        by_name = defaultdict(set)
        for name, fein in zip(names, feins):
            f = fein_of(fein)
            if not f:
                continue
            key = legal_name(name)
            by_fein[f][key] += 1
            by_name[compact(key)].add(f)
        # A name bridges to a tax number only when it had exactly one.
        self.bridge = {k: next(iter(fs)) for k, fs in by_name.items() if len(fs) == 1}
        # A FEIN joins a family through a spelling that carries at least a fifth
        # of its filings ("IBM" beside "INTERNATIONAL BUSINESS MACHINES"), so one
        # mistyped filing cannot pull a whole company into the wrong family.
        self.family_of, self.labels, self.major = {}, {}, {}
        for f, counter in by_fein.items():
            major = counter.most_common(1)[0][0]
            self.major[f] = major
            total = sum(counter.values())
            fam = next((family(n) for n, c in counter.most_common()
                        if c >= 0.2 * total and family(n) != n), major)
            key = fam if fam != major else f"FEIN {f}"
            self.family_of[f] = key
            self.labels.setdefault(key, fam if fam != major else tidy(major))

    def employer(self, name, fein=""):
        f = fein_of(fein) or self.bridge.get(compact(legal_name(name)), "")
        if f in self.family_of:
            return self.family_of[f]
        return family(legal_name(name))

    def client(self, raw):
        key = client(raw)
        if key is None or key in canonicals():
            return key
        f = self.bridge.get(compact(key))
        return self.family_of.get(f, key)

    def label(self, key):
        return self.labels.get(key) or (key if key != key.upper() else tidy(key))


def tidy(key):
    """Title case for a normalized key; short acronyms and small words stay readable."""
    small = {"Of", "The", "And", "For", "At", "In", "On"}
    out = []
    for i, w in enumerate(key.split()):
        if len(w) <= 3 and w.isalpha() and w.title() not in small:
            out.append(w)  # IBM, HCL, EY, ADP
        else:
            t = w.title()
            out.append(t.lower() if i and t in small else t)
    return " ".join(out)
