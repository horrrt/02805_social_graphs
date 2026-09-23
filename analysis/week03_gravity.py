"""What is left after gravity.

The post already shows two marginals: richer destinations hold a larger
foreign-born share, and people in rich destinations came from further away.
Neither is a model, so "wealth buys distance" is currently a sentence about
two separate charts rather than a claim anything was held fixed for.

Gravity is the standard baseline in the migration literature and it is almost
embarrassingly good: the number of people on a corridor goes up with the size
of both ends and down with the distance between them. Fit that, and what is
interesting is not the fit — it is the residual. A corridor carrying five
times what gravity predicts is carrying something gravity does not know
about: a shared language, an old empire, a guest-worker agreement, a war.

    python analysis/week03_gravity.py [--year 2024]

Specification. Poisson pseudo-maximum-likelihood on the raw counts, which is
the standard choice here (Santos Silva and Tenreyro 2006): the outcome is a
count, it spans six orders of magnitude, and log-linear least squares on
log(people) both drops every zero corridor and biases the coefficients
whenever the error variance depends on the mean, which it does.

Fitted with statsmodels, whose GLM carries the heteroskedasticity-robust
covariance the method actually calls for. This used to be scikit-learn's
PoissonRegressor with a hand-rolled pair bootstrap bolted on, because that
estimator reports no standard errors at all. The coefficients were never in
doubt: sklearn, statsmodels and the committed bootstrap agree to three
decimals on every term. What changed is where the intervals come from, and
the HC1 sandwich runs a little wider than 200 resamples did, which is the
direction to be wrong in.

    E[people] = exp(b0 + b1 log(pop_o) + b2 log(pop_d)
                       + b3 log(gdp_o) + b4 log(gdp_d)
                       + b5 log(km) + b6 contiguous)

Contiguity is approximated by a distance under 1,000 km between country
centres, because the repo carries coordinates and no border table. That is a
crude proxy and it is reported as one.

What this is not. Every term is a correlate measured in the same year as the
outcome, so nothing here identifies a cause. A large positive residual says
"more people than size and distance explain", not "the empire caused it".
The residual ranking is a way of finding the corridors worth explaining, not
an explanation.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib

import numpy as np
import statsmodels.api as sm

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "assets" / "data"
OUT = ROOT / "analysis"

TERMS = [
    "log origin population",
    "log destination population",
    "log origin GDP per head",
    "log destination GDP per head",
    "log distance",
    "under 1,000 km",
]


def build(year: int):
    corridors = json.loads((DATA / "week03_corridors.json").read_text())
    edges = json.loads((DATA / "week03_edges.json").read_text())
    nodes = corridors["nodes"]
    ind = corridors["indicators"]
    countries = edges["countries"]
    yi = edges["years"].index(year)

    rows, people, pairs = [], [], []
    for origin_i, dest_i, stocks, km, *_rest in edges["edges"]:
        count = stocks[yi]
        o, d = countries[origin_i], countries[dest_i]
        io, idd = ind.get(o), ind.get(d)
        if not io or not idd or not km:
            continue
        if not (io.get("pop") and idd.get("pop") and io.get("gdp") and idd.get("gdp")):
            continue
        rows.append([
            math.log(io["pop"]),
            math.log(idd["pop"]),
            math.log(io["gdp"]),
            math.log(idd["gdp"]),
            math.log(km),
            1.0 if km < 1000 else 0.0,
        ])
        people.append(count)
        pairs.append((o, d, km))
    return (
        np.asarray(rows),
        np.asarray(people, dtype=float),
        pairs,
        {iso3: nodes[iso3]["name"] for iso3 in nodes},
    )


def fit_quality(y, fitted):
    """Two numbers, because one of them alone misleads.

    On raw counts the correlation is dominated by the handful of corridors
    carrying millions, so a poor fit everywhere else barely shows. On logs it
    reports how well the model does across the range, which is where the
    other eight thousand corridors live.
    """
    raw = 0.0 if y.std() == 0 or fitted.std() == 0 else float(np.corrcoef(y, fitted)[0, 1] ** 2)
    logged = float(np.corrcoef(np.log1p(y), np.log1p(fitted))[0, 1] ** 2)
    return round(raw, 4), round(logged, 4)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=2024)
    args = parser.parse_args()

    X, y, pairs, names = build(args.year)
    print(f"{len(y)} corridors with population and GDP at both ends, {args.year}")
    print(f"{int((y == 0).sum())} of them carry nobody, and PPML keeps them")

    # add_constant, because statsmodels fits no intercept unless it is given
    # one, and a gravity model without an intercept is a different model.
    model = sm.GLM(y, sm.add_constant(X), family=sm.families.Poisson()).fit(cov_type="HC1")
    fitted = model.fittedvalues
    r2, r2_log = fit_quality(y, fitted)
    beta = model.params[1:]
    bounds = model.conf_int()
    lo, hi = bounds[1:, 0], bounds[1:, 1]

    # The contiguity dummy is a proxy — under 1,000 km between country
    # centres, because this repo has coordinates and no border table — and it
    # comes out negative, where the literature has it strongly positive. With
    # log distance already in the model it is picking up curvature at the
    # short end plus a crowd of microstates, not the effect of a border.
    # Refitting without it says how much the rest of the model leans on it,
    # which is the question a bad proxy raises.
    plain = sm.GLM(
        y, sm.add_constant(X[:, :-1]), family=sm.families.Poisson()
    ).fit(cov_type="HC1")
    plain_r2, plain_r2_log = fit_quality(y, plain.fittedvalues)
    plain_beta = plain.params[1:]

    print(f"\nPPML gravity, R² {r2:.3f} on counts, {r2_log:.3f} on logs")
    coefficients = {}
    for i, term in enumerate(TERMS):
        b = beta[i]
        print(f"  {term:30s} {b:+7.3f}   95% CI [{lo[i]:+.3f}, {hi[i]:+.3f}]")
        coefficients[term] = {
            "beta": round(float(b), 4),
            "ci": [round(float(lo[i]), 4), round(float(hi[i]), 4)],
            # An elasticity: a 1% rise in the term moves the corridor by
            # beta per cent, for the logged terms.
            "crosses_zero": bool(lo[i] < 0 < hi[i]),
        }

    # What gravity does not explain. The ratio is the honest residual on a
    # multiplicative model; a difference would just rank the biggest corridors.
    ratio = np.where(fitted > 0, y / np.maximum(fitted, 1e-9), 0.0)
    order = np.argsort(-ratio)
    over = []
    for idx in order:
        o, d, km = pairs[idx]
        if y[idx] < 50000:
            continue
        over.append({
            "origin": o,
            "destination": d,
            "origin_name": names.get(o, o),
            "destination_name": names.get(d, d),
            "people": int(y[idx]),
            "predicted": int(round(fitted[idx])),
            "ratio": round(float(ratio[idx]), 1),
            "km": km,
        })
        if len(over) == 20:
            break

    under = []
    for idx in order[::-1]:
        o, d, km = pairs[idx]
        if fitted[idx] < 50000:
            continue
        under.append({
            "origin": o,
            "destination": d,
            "origin_name": names.get(o, o),
            "destination_name": names.get(d, d),
            "people": int(y[idx]),
            "predicted": int(round(fitted[idx])),
            "ratio": round(float(ratio[idx]), 3),
            "km": km,
        })
        if len(under) == 10:
            break

    print("\nCarrying most above what gravity predicts (50,000 people or more):")
    for row in over[:12]:
        print(f"  {row['origin_name'][:22]:<22} → {row['destination_name'][:22]:<22} "
              f"{row['people']:>9,}  vs {row['predicted']:>8,}  ×{row['ratio']}")

    print("\nWithout the contiguity proxy:")
    for i, term in enumerate(TERMS[:-1]):
        print(f"  {term:30s} {plain_beta[i]:+7.3f}   (with it: {beta[i]:+.3f})")
    print(f"  R² {plain_r2:.3f} on counts, {plain_r2_log:.3f} on logs")

    print("\nCarrying least, where gravity expects a crowd")
    print("  (read as reporting, not absence: DESA files small origins under 'other')")
    for row in under[:6]:
        print(f"  {row['origin_name'][:22]:<22} → {row['destination_name'][:22]:<22} "
              f"{row['people']:>9,}  vs {row['predicted']:>8,}  ×{row['ratio']}")

    report = {
        "generated": "analysis/week03_gravity.py",
        "year": args.year,
        "method": "Poisson pseudo-maximum-likelihood, Santos Silva and Tenreyro (2006)",
        "corridors": int(len(y)),
        "zero_corridors": int((y == 0).sum()),
        "standard_errors": "HC1 heteroskedasticity-robust sandwich, statsmodels GLM",
        "r2_counts": r2,
        "r2_logs": r2_log,
        "coefficients": coefficients,
        "without_contiguity": {
            "note": "The contiguity dummy is a distance proxy, not a border table, "
                    "and it comes out negative where the literature has it positive. "
                    "This refit says how much the other terms lean on it.",
            "r2_counts": plain_r2,
            "r2_logs": plain_r2_log,
            "coefficients": {
                term: round(float(plain_beta[i]), 4) for i, term in enumerate(TERMS[:-1])
            },
        },
        "note": "Correlates in one year, so nothing here identifies a cause. A large "
                "ratio marks a corridor worth explaining, not an explanation. "
                "Contiguity is a distance under 1,000 km between country centres, "
                "which is a proxy for sharing a border and not a border table.",
        "over": over,
        "under_note": "Read these as reporting, not as absence. DESA's table is "
                      "ragged: a country whose statistics office files small origins "
                      "under 'other' reports a zero where people plainly live, so the "
                      "bottom of this list is a map of who counts carefully rather "
                      "than of who stayed home.",
        "under": under,
    }
    path = OUT / "week03_gravity.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"\nwrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
