"""Cold Read, round 3 (Mix Desk): an LDA topic model of the Marvel pages, for the hidden Week 6 game.

Owner: Gyula. Brief: https://sunelehmann.com/socialgraphs2026-web/weeks/week6.html, section 3 (topic
models) and its Python example, followed exactly: scikit-learn's CountVectorizer with English
stopwords plus the names (words capitalised in most of their uses), letters only, min_df=5,
max_df=0.5, then LatentDirichletAllocation with 8 topics and random_state=0. A topic is a distribution
over words; a page is a mixture of topics.

The game shows a page's most used words and asks the player to spread 10 chips over the 8 topics to
match the page's mixture (theta). Then each word is coloured by the topic most likely to have produced
it on that page: argmax_k theta[d, k] * beta[k, w].

Pages in the game have a lead image, at least 500 words in the model's vocabulary, a top topic between
30% and 92%, and a second topic of at least 8%: a real mix. LDA gives most pages one dominant topic, so
the game draws from the pages that mix.

Writes public/play/cold-read/data/mix_desk.json.

    python analysis/week06_mix_desk.py   # about 20 seconds
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, CountVectorizer

sys.path.insert(0, str(Path(__file__).parent))
import week05_text as t  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
IMAGES = Path(__file__).with_name("week06_cold_read_images.json")
OUT = ROOT / "public/play/cold-read/data/mix_desk.json"
K, SEED, TOP_WORDS, PAGE_WORDS = 8, 0, 10, 30
MIN_WORDS, TOP_RANGE, SECOND = 500, (0.3, 0.92), 0.08
MIN_PAGES = 40


def main():
    text = t.pages()
    ids = sorted(text)
    names = t.nodes().set_index("node_id").name
    images = json.loads(IMAGES.read_text())

    # The brief's name rule, on its own token pattern.
    seen, capitalized = Counter(), Counter()
    for doc in text.values():
        for w in re.findall(r"[A-Za-z]+", doc):
            seen[w.lower()] += 1
            capitalized[w.lower()] += w[0].isupper()
    proper = {w for w in seen if capitalized[w] > seen[w] / 2}

    vectorizer = CountVectorizer(stop_words=list(ENGLISH_STOP_WORDS | proper), min_df=5, max_df=0.5,
                                 token_pattern=r"(?u)\b[a-zA-Z]{2,}\b")
    X = vectorizer.fit_transform(text[i] for i in ids)
    vocab = vectorizer.get_feature_names_out()
    lda = LatentDirichletAllocation(n_components=K, random_state=SEED)
    theta = lda.fit_transform(X)
    beta = lda.components_ / lda.components_.sum(axis=1, keepdims=True)

    topics = []
    for k in range(K):
        top = np.argsort(-beta[k])[:TOP_WORDS]
        topics.append({"words": [[str(vocab[i]), round(float(beta[k, i]), 4)] for i in top]})
        print(f"topic {k}: " + " ".join(vocab[i] for i in top))

    pages = []
    for d, i in enumerate(ids):
        row = X[d].toarray().ravel()
        mix = np.sort(theta[d])[::-1]
        if i not in images or row.sum() < MIN_WORDS or not (TOP_RANGE[0] <= mix[0] <= TOP_RANGE[1]) or mix[1] < SECOND:
            continue
        top = np.argsort(-row)[:PAGE_WORDS]
        pages.append({
            "name": names[i],
            "img": images[i]["thumb"].split("?")[0],
            "theta": [round(float(x), 3) for x in theta[d]],
            "words": [[str(vocab[w]), int(row[w]), int(np.argmax(theta[d] * beta[:, w]))] for w in top if row[w] > 0],
        })
    print(f"{len(pages)} of {len(ids)} pages are a real mix and playable")
    if len(pages) < MIN_PAGES:
        raise SystemExit(f"fewer than {MIN_PAGES} playable pages")

    out = {
        "source": "scikit-learn LDA, 8 topics, random_state 0, on the 303 Marvel pages with names removed (Week 6 brief, section 3)",
        "K": K,
        "vocab": int(len(vocab)),
        "topics": topics,
        "pages": pages,
    }
    OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
