"""The boundary of the migration dataset, written down in one place.

The crawl walks the English Wikipedia category tree outward from a set of
domain roots. Recall comes from the tree; precision comes later, from Wikidata
(`classify.py` keeps only items that are instances of an organization). So the
patterns here are deliberately generous: a category is followed when its name
sounds like migration, or like an organisation sitting under a migration
parent, and dropped only when it is clearly a bucket of people, media or
maintenance pages.
"""

import re

# Domain roots. Every one was checked to exist and to carry members; the
# `-isation` spellings are redirects on English Wikipedia and are omitted.
SEED_CATEGORIES = [
    # The migration domain itself
    "Category:Human migration",
    "Category:Forced migration",
    "Category:Immigration",
    "Category:Emigration",
    "Category:Refugees",
    "Category:Asylum seekers",
    "Category:Statelessness",
    "Category:Illegal immigration",
    "Category:Population transfers",
    "Category:Immigration law",
    "Category:Border control",
    "Category:Border guards",
    "Category:Human trafficking",
    "Category:People smuggling",
    "Category:Remittances",
    "Category:Expatriate organizations",
    # Organisation trees, which is what the dataset is actually about
    "Category:Migration-related organizations",
    "Category:Refugee aid organizations",
    "Category:Diaspora organizations",
    "Category:Immigrant rights organizations",
    "Category:Organizations that combat human trafficking",
    "Category:Immigration-related organizations in the United States",
    "Category:Immigration-related organizations in the United Kingdom",
    "Category:Organizations for North Korean defectors",
    "Category:Organizations supporting immigration and travel to Israel",
]

# A category whose name matches this is on topic and gets followed.
ON_TOPIC = re.compile(
    r"(migrat|migrant|immigr|emigr|refugee|asylum|diaspora|expatriat|displac"
    r"|resettle|stateless|border|deport|repatriat|remittance|traffick|smuggl"
    r"|guest ?worker|overseas |exile|evacuee|boat people|undocumented"
    r"|naturali[sz]ation|nationality law|citizenship|defector|returnee"
    r"|integration polic|multicultural|minority rights|foreign worker)",
    re.I,
)

# A category under an on-topic parent that names an organisation is followed
# too: this is how the per-country community-organisation trees get reached.
ORG_WORD = re.compile(
    r"\b(organi[sz]ations?|associations?|agenc(y|ies)|charit(y|ies)|foundations?"
    r"|institutes?|councils?|networks?|societ(y|ies)|unions?|federations?"
    r"|committees?|commissions?|NGOs?|non-?profits?|centres?|centers?"
    r"|bureaus?|authorities|departments?|ministries|services?|missions?)\b",
    re.I,
)

# Buckets of people, creative works or wiki bookkeeping. Dropped before the
# on-topic test, so a people category never opens a sub-tree of biographies.
OFF_TOPIC = re.compile(
    r"\b(births|deaths|emigrants|immigrants|expatriates|descent|ancestry"
    r"|sportspeople|footballers|cricketers|players|coaches|writers|novelists"
    r"|poets|journalists|actors|actresses|musicians|singers|rappers|composers"
    r"|artists|painters|photographers|politicians|diplomats|scientists"
    r"|academics|scholars|economists|lawyers|judges|soldiers|criminals"
    r"|alumni|recipients|nominees|winners"
    r"|films?|documentaries|television|episodes|songs|albums|singles|novels"
    r"|books|plays|paintings|sculptures|video games|comics|magazines"
    r"|newspapers|podcasts|memoirs|autobiographies|poetry|literature"
    r"|templates?|stubs?|redirects|wikiprojects?|portals?|userboxes"
    r"|establishments|disestablishments)\b"
    r"|\bpeople (of|from|by|with)\b"
    r"|\blists? of\b"
    r"|\bby year\b"
    r"|\b(1[0-9]|20)\d\d\b",
    re.I,
)

MAX_DEPTH = 4
