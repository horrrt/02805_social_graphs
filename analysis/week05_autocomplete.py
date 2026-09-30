"""Week 5 · Community autocomplete.

Question: Does each Marvel community write in its own voice?

Owner: Àngela
Page section: docs/weeks/week05/index.html#autocomplete
Output: docs/weeks/week05/data/autocomplete.json

Train one trigram generator per Louvain community (from week05_communities.py),
generate one fake Wikipedia lead for a new character in each, and leave the
cross-group guessing score empty until real answers arrive. The page still
lets visitors take the quiz themselves.

    python analysis/week05_communities.py   # once
    python analysis/week05_autocomplete.py
"""

from __future__ import annotations

import json
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from week05_text import nodes, pages

ROOT = Path(__file__).resolve().parents[1]
COMM = ROOT / "docs" / "weeks" / "week05" / "data" / "communities.json"
OUT = ROOT / "docs" / "weeks" / "week05" / "data" / "autocomplete.json"

SEED = 2805
MIN_COMMUNITY_SIZE = 8
FAKE_CHARS = [
    "Aetherion",
    "Cobalt Warden",
    "Nyxara",
    "Quillstrike",
    "Iron Hearth",
    "Velvet Specter",
    "Stormglass",
    "Ashen Circuit",
]
START = ("<s>", "<s>")
END = "</s>"
TOKEN_RE = re.compile(r"[A-Za-z0-9]+(?:'[A-Za-z]+)?|[.!?]")


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


def sentences(text: str) -> list[list[str]]:
    """Split on . ! ? keeping only sentence bodies with enough tokens."""
    raw = tokenize(text)
    out, cur = [], []
    for t in raw:
        if t in ".!?":
            if len(cur) >= 4:
                out.append(cur)
            cur = []
        else:
            cur.append(t)
    if len(cur) >= 4:
        out.append(cur)
    return out


def train_trigrams(docs: list[str]) -> dict[tuple[str, str], Counter]:
    model: dict[tuple[str, str], Counter] = defaultdict(Counter)
    for doc in docs:
        for sent in sentences(doc):
            toks = [START[0], START[1], *sent, END]
            for i in range(len(toks) - 2):
                model[(toks[i], toks[i + 1])][toks[i + 2]] += 1
    return model


def next_token(model, prev: tuple[str, str], rng: random.Random) -> str:
    choices = model.get(prev)
    if not choices:
        # Back off to any continuation of the last word, then to a period-end.
        fallback = [(k, c) for k, c in model.items() if k[1] == prev[1]]
        if not fallback:
            return END
        key = rng.choice(sorted(fallback, key=lambda kc: kc[0])[:20])[0]
        choices = model[key]
        prev = key
    items = sorted(choices.items())  # stable order before weighted draw
    words, weights = zip(*items)
    return rng.choices(words, weights=weights, k=1)[0]


def generate(model, rng: random.Random, n_sentences: int = 4, max_tokens: int = 28) -> str:
    parts = []
    attempts = 0
    while len(parts) < n_sentences and attempts < n_sentences * 6:
        attempts += 1
        prev = START
        tokens = []
        for _ in range(max_tokens):
            nxt = next_token(model, prev, rng)
            if nxt == END:
                break
            tokens.append(nxt)
            prev = (prev[1], nxt)
        # Drop sentences that start with a bare number or a single letter (wiki cruft).
        if not tokens or tokens[0].isdigit() or len(tokens[0]) == 1:
            continue
        sentence = " ".join(tokens)
        sentence = sentence[0].upper() + sentence[1:]
        parts.append(sentence + ".")
    return " ".join(parts)


def distinctive_bigrams(model, other_models, k: int = 6) -> list[str]:
    """Bigram contexts that are frequent here and rare elsewhere."""
    scores = []
    for bigram, counter in model.items():
        if bigram == START:
            continue
        here = sum(counter.values())
        if here < 3:
            continue
        elsewhere = sum(sum(m[bigram].values()) for m in other_models if bigram in m)
        score = here / (1 + elsewhere)
        phrase = " ".join(bigram)
        scores.append((score, here, phrase))
    scores.sort(key=lambda t: (-t[0], -t[1], t[2]))
    seen, out = set(), []
    for _, __, phrase in scores:
        if phrase in seen:
            continue
        seen.add(phrase)
        out.append(phrase)
        if len(out) >= k:
            break
    return out


def main() -> int:
    if not COMM.exists():
        raise SystemExit("run analysis/week05_communities.py first")

    communities = json.loads(COMM.read_text())
    text = pages()
    names = dict(zip(nodes().node_id, nodes().name))
    rng = random.Random(SEED)

    # Train only on communities large enough to have a voice.
    usable = [
        (i, c)
        for i, c in enumerate(communities["communities"])
        if c["size"] >= MIN_COMMUNITY_SIZE and not c.get("outside_giant")
    ]
    if len(usable) < 2:
        raise SystemExit("need at least two communities of size >= MIN_COMMUNITY_SIZE")

    models = []
    meta = []
    for idx, (i, c) in enumerate(usable):
        docs = [text[n] for n in c["members"] if n in text]
        model = train_trigrams(docs)
        models.append(model)
        n_trigrams = sum(sum(ctr.values()) for ctr in model.values())
        meta.append(
            {
                "community_index": i,
                "label": c["label"],
                "size": c["size"],
                "hubs": [h["name"] for h in c["hubs"][:3]],
                "n_pages_used": len(docs),
                "n_trigram_observations": n_trigrams,
                "n_contexts": len(model),
            }
        )

    fakes = []
    for idx, (i, c) in enumerate(usable):
        char_name = FAKE_CHARS[idx % len(FAKE_CHARS)]
        # Seeded per community so editing one fake does not reshuffle the rest.
        local = random.Random(SEED + 1000 + i)
        body = generate(models[idx], local, n_sentences=5, max_tokens=26)
        # Lead in Wikipedia style, with the invented name up front.
        lead = (
            f"{char_name} is a character appearing in American comic books published by Marvel Comics. "
            f"{body}"
        )
        others = [m for j, m in enumerate(models) if j != idx]
        cues = distinctive_bigrams(models[idx], others)
        # Quote a real passage from a hub page so the visitor can compare voice.
        hub_id = c["hubs"][0]["node_id"]
        hub_text = text[hub_id]
        quote = hub_text[:220].replace("\n", " ").strip() + ("…" if len(hub_text) > 220 else "")

        fakes.append(
            {
                "id": f"fake-{idx}",
                "character": char_name,
                "community_index": i,
                "community_label": c["label"],
                "hubs": [h["name"] for h in c["hubs"][:3]],
                "size": c["size"],
                "text": lead,
                "voice_cues": cues,
                "real_quote": {"node_id": hub_id, "name": names[hub_id], "text": quote},
            }
        )

    # Shuffle display order with a fixed seed (answers stay in community fields).
    order = list(range(len(fakes)))
    rng.shuffle(order)
    display = [fakes[i] for i in order]

    options = [
        {"community_index": m["community_index"], "label": m["label"], "hubs": m["hubs"], "size": m["size"]}
        for m in meta
    ]

    payload = {
        "generated_by": "analysis/week05_autocomplete.py",
        "owner": "Àngela",
        "seed": SEED,
        "tokenisation": {
            "method": "regex words + sentence-final .!?, lowercased",
            "model": "trigram: P(w3 | w1, w2) estimated by counts inside each community",
            "generation": "ancestral sampling from the community's trigram table, 5 sentences",
            "min_community_size": MIN_COMMUNITY_SIZE,
        },
        "communities_used": meta,
        "n_fakes": len(display),
        "chance_rate": round(1 / len(display), 4),
        "guessing": {
            "status": "awaiting_other_groups",
            "n_responses": 0,
            "n_correct": 0,
            "hit_rate": None,
            "chance_rate": round(1 / len(display), 4),
            "note": (
                "Leave empty until other course groups submit guesses. "
                "The page quiz lets visitors try; that score is not the hand-in number."
            ),
        },
        "options": options,
        "fakes": display,
        "communities_source": "docs/weeks/week05/data/communities.json",
        "partition": {
            "modularity": communities["louvain"]["modularity"],
            "mode_share": communities["louvain"]["mode_share"],
            "null_z": communities["null"]["z"],
            "communities_in_giant": communities["louvain"]["communities_in_giant"],
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        from check_pages import check

        check(OUT, payload)
    except SystemExit as err:
        if "has no model" not in str(err):
            raise

    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)}: {len(display)} fake pages from "
        f"{len(meta)} communities (min size {MIN_COMMUNITY_SIZE}); "
        f"guessing status={payload['guessing']['status']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
