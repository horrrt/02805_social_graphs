"""Sentiment Trap: the numbers for the hidden Week 7 game at /play/week07/sentiment-trap/.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week7.html, section 4
(sentiment as a measurement). The game shows one sentence at a time and three instruments' readings
of it, and asks what should make the player distrust the score. Every number it shows comes from
this script; the game's prose is in src/features/sentiment-trap/challenges.ts.

The three instruments are the brief's:

- Word scores: a lookup table. Each word gets its valence from the VADER word list (vaderSentiment
  3.3.2, scores from -4 to +4), and the sentence score is the plain sum. VADER's own rules for
  negation, "but" and capitals are deliberately left out: this is the brief's lookup table, not
  VADER. Sum above 0 reads POSITIVE, below 0 NEGATIVE, 0 NEUTRAL.
- Learned patterns: TF-IDF (unigrams, sklearn defaults) and logistic regression, trained on the
  SST-2 training phrases (movie reviews, the same data the contextual model was fine-tuned on).
  A word's contribution is its TF-IDF value times its learned weight; the reading is P(positive).
  Its accuracy on the SST-2 validation sentences is written out, so the game never quotes one typed
  by hand.
- Contextual model: distilbert-base-uncased-finetuned-sst-2-english at a pinned revision, through
  the transformers sentiment pipeline, pages truncated to 512 word pieces as the brief does.

It scores the brief's four sentences and all 303 Marvel pages with all three. Run on 21 October 2026
with transformers 5.20.2, the contextual model reproduces the brief: POSITIVE 1.000 and NEGATIVE 1.000
for the two movie sentences, POSITIVE 0.998 for the traffic sentence and 0.999 for the hero sentence,
and 179 of the 303 pages NEGATIVE, with Jubilee at 0.987, Doctor Strange at 0.931 and Storm POSITIVE at
1.000. On the same pages the classifier calls 160 NEGATIVE and the word sum 134, and all three agree on
122. The classifier is right on 82.5% of the 872 SST-2 validation sentences. The plain sum stays
positive on "not good" (+1.9) while the classifier (P(positive) 0.26) and the contextual model catch
the negation; all three call the traffic and hero sentences POSITIVE. The script stops if the brief's
sentence results don't come back, since the game's challenges rest on them.

Writes public/play/week07/data/sentiment_trap.json. The model weights and SST-2 download into
build/ (gitignored) on first use, about 270 MB.

    python analysis/week07_sentiment_trap.py           # about a minute after the download
"""

import json
import math
import re
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

sys.path.insert(0, str(Path(__file__).parent))
import fetch  # noqa: E402
import week05_text as t  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/week07/data/sentiment_trap.json"
MODEL = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
REVISION = "714eb0fa89d2f80546fda750413ed43d93601a13"
MODEL_DIR = ROOT / "build/models/distilbert-sst2"
SST2 = "stanfordnlp/sst2"
SST2_REVISION = "8d51e7e4887a4caaa95b3fbebbf53c0490b58bbb"
SST2_DIR = ROOT / "build/raw/sst2"

# The brief's sentences, keyed by the challenge that uses them.
SENTENCES = {
    "good": "The movie was good.",
    "negation": "The movie was not good.",
    "sarcasm": "I just love being stuck in traffic.",
    "confidence": "The hero died, but saved everyone in the city.",
}
# What the brief reports for them; the script checks it gets the same.
BRIEF = {"good": ("POSITIVE", 1.0), "negation": ("NEGATIVE", 1.0), "sarcasm": ("POSITIVE", 0.998), "confidence": ("POSITIVE", 0.999)}
# The pages the brief names, by node_id. The domain challenge shows the first.
NAMED = ["Jubilee_(character)", "Doctor_Strange", "Storm_(Marvel_Comics)"]
WORD = re.compile(r"[a-z]+(?:'[a-z]+)?")


def fetch_inputs():
    base = f"https://huggingface.co/{MODEL}/resolve/{REVISION}/"
    for name in ("config.json", "tokenizer_config.json", "vocab.txt", "model.safetensors"):
        fetch.download(base + name, MODEL_DIR / name)
    base = f"https://huggingface.co/datasets/{SST2}/resolve/{SST2_REVISION}/data/"
    for split in ("train", "validation"):
        fetch.download(f"{base}{split}-00000-of-00001.parquet", SST2_DIR / f"{split}.parquet")


def vader_words():
    import vaderSentiment

    path = Path(vaderSentiment.__file__).parent / "vader_lexicon.txt"
    out = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            out[parts[0]] = float(parts[1])
    return out


def label(x, zero="NEUTRAL"):
    return "POSITIVE" if x > 0 else "NEGATIVE" if x < 0 else zero


def r3(x):
    return round(float(x), 3)


def main():
    fetch_inputs()
    lexicon = vader_words()

    train = pd.read_parquet(SST2_DIR / "train.parquet")
    valid = pd.read_parquet(SST2_DIR / "validation.parquet")
    tfidf = TfidfVectorizer()
    clf = LogisticRegression(max_iter=2000)
    clf.fit(tfidf.fit_transform(train.sentence), train.label)
    accuracy = float((clf.predict(tfidf.transform(valid.sentence)) == valid.label).mean())
    vocab = tfidf.vocabulary_
    coef = clf.coef_[0]
    print(f"TF-IDF + logistic regression: {len(train):,} training phrases, validation accuracy {accuracy:.3f}", flush=True)

    from transformers import pipeline

    contextual = pipeline("sentiment-analysis", model=str(MODEL_DIR), tokenizer=str(MODEL_DIR), device="cpu")

    def classify(text):
        x = tfidf.transform([text])
        p = clf.predict_proba(x)[0, 1]
        row = x.tocoo()
        names = tfidf.get_feature_names_out()
        parts = {names[j]: v * coef[j] for j, v in zip(row.col, row.data)}
        return p, parts

    def read(text):
        words = WORD.findall(text.lower())
        total = sum(lexicon.get(w, 0.0) for w in words)
        p, parts = classify(text)
        c = contextual(text, truncation=True, max_length=512)[0]
        return {
            "words": [{"w": w, "valence": lexicon.get(w), "weight": r3(coef[vocab[w]]) if w in vocab else None} for w in words],
            "lexicon": {"sum": r3(total), "label": label(total)},
            "classifier": {
                "p": r3(p),
                "label": label(p - 0.5),
                "parts": [{"w": w, "contribution": r3(v)} for w, v in sorted(parts.items(), key=lambda kv: -abs(kv[1]))],
            },
            "contextual": {"label": c["label"], "score": r3(c["score"])},
        }

    sentences = {k: {"text": s, **read(s)} for k, s in SENTENCES.items()}
    for k, (want, score) in BRIEF.items():
        got = sentences[k]["contextual"]
        if got["label"] != want or abs(got["score"] - score) > 0.0015:
            raise SystemExit(f"{k}: contextual model says {got}, the brief says {want} {score}")

    text = t.pages()
    names = t.nodes().set_index("node_id").name
    ids = sorted(text)
    rows, start = [], time.time()
    for i, node in enumerate(ids, 1):
        page = text[node]
        words = WORD.findall(page.lower())
        total = sum(lexicon.get(w, 0.0) for w in words)
        p, _ = classify(page)
        c = contextual(page, truncation=True, max_length=512)[0]
        rows.append({"id": node, "name": re.sub(r" \(.*\)$", "", names[node]), "lexicon": label(total), "classifier": label(p - 0.5),
                     "contextual": c["label"], "score": r3(c["score"])})
        if i % 50 == 0 or i == len(ids):
            left = (time.time() - start) / i * (len(ids) - i)
            print(f"  pages {i}/{len(ids)} ({i / len(ids):.0%}), about {math.ceil(left)} s left", flush=True)

    def negative(key):
        return sum(r[key] == "NEGATIVE" for r in rows)

    by_name = {r["id"]: r for r in rows}
    missing = [n for n in NAMED if n not in by_name]
    if missing:
        raise SystemExit(f"named pages not found: {missing}")
    shown = by_name[NAMED[0]]
    opening = t.sentences(text[shown["id"]])[0]
    agree = sum(r["lexicon"] == r["classifier"] == r["contextual"] for r in rows)

    out = {
        "instruments": {
            "lexicon": {"source": "VADER word list (vaderSentiment 3.3.2)", "words": len(lexicon)},
            "classifier": {"train": "SST-2 training phrases (movie reviews)", "trainSize": len(train),
                           "validSize": len(valid), "accuracy": r3(accuracy)},
            "contextual": {"model": MODEL.split("/")[-1], "revision": REVISION[:7],
                           "trainedOn": "SST-2 (movie reviews)"},
        },
        "sentences": sentences,
        "pages": {
            "total": len(rows),
            "negative": {k: negative(k) for k in ("lexicon", "classifier", "contextual")},
            "allAgree": agree,
            "named": [{"name": by_name[n]["name"], "label": by_name[n]["contextual"], "score": by_name[n]["score"]} for n in NAMED],
            "shown": {"name": shown["name"], "opening": opening, "words": len(WORD.findall(text[shown["id"]].lower())),
                      **{k: v for k, v in read(text[shown["id"]]).items() if k != "words"}},
        },
    }
    out["pages"]["shown"]["classifier"]["parts"] = out["pages"]["shown"]["classifier"]["parts"][:6]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    neg = out["pages"]["negative"]
    print(f"pages NEGATIVE: contextual {neg['contextual']}, classifier {neg['classifier']}, word sum {neg['lexicon']} "
          f"of {len(rows)}; all three agree on {agree}")
    for k, s in sentences.items():
        print(f"{k:11} lex {s['lexicon']['sum']:+.1f}  clf P(pos) {s['classifier']['p']:.3f}  "
              f"ctx {s['contextual']['label']} {s['contextual']['score']:.3f}  {s['text']}")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    np.random.seed(0)
    main()
