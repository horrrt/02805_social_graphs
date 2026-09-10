"""Unequal-probability card collector, derived from the frozen in-degrees."""
import math
from collections import Counter

import numpy as np
from scipy.integrate import quad

from arcade_data import load, write


def expectation(weights, total):
    """Poissonization: E[draws] = integral P(not all coupons seen at t) dt.

    With arrival rate one, each coupon has an independent exponential clock
    of rate p_i. E[Poisson time to completion] equals E[discrete draws].
    Group equal weights and integrate in units of total draws. For subsets,
    retain the original total so unneeded cards still consume a draw.
    """
    groups = Counter(weights)
    def survival(u):
        if u == 0:
            return 1.0
        log_complete = sum(count * math.log(-math.expm1(-weight * u)) for weight, count in groups.items())
        return -math.expm1(log_complete)
    value, error = quad(survival, 0, 50, epsabs=1e-10, epsrel=1e-10)
    return value * total, error * total


def build():
    rows, graph, facts = load()
    weights = [graph.in_degree(r["node_id"]) + 1 for r in rows]
    total = sum(weights)
    assert total == 1784 + 303 == 2087
    assert sum(w == 1 for w in weights) == facts["zero_in"] == 58
    all_draws, error = expectation(weights, total)
    nonisolate_weights = [w for r, w in zip(rows, weights) if graph.degree(r["node_id"]) > 0]
    nonisolate_draws, _ = expectation(nonisolate_weights, total)
    isolated_draws = total * sum(1 / k for k in range(1, 18))
    # Independent simulation of exponential races checks numerical integration.
    rng = np.random.default_rng(20260910)
    means = [np.max(rng.exponential(total / np.array(weights), size=(1000, 303)), axis=1) for _ in range(20)]
    samples = np.concatenate(means)
    assert abs(float(samples.mean()) - all_draws) < 5 * float(samples.std()) / math.sqrt(len(samples))
    histogram = Counter(w - 1 for w in weights)
    payload = {"snapshot": "2026-08-26", "packSize": 5, "rule": "Independent draws with replacement; p(card) = (in-degree + 1) / 2087. A design device, not measured fame.",
               "totalWeight": total, "cards": [{"id": r["node_id"], "weight": w, "probability": w / total} for r, w in zip(rows, weights)],
               "histogram": [{"degree": k, "count": histogram[k]} for k in sorted(histogram)],
               "collector": {"expectedDraws": all_draws, "numericalError": error,
                             "expectedPacksLower": all_draws / 5, "expectedPacksUpper": all_draws / 5 + .8,
                             "expectedPacksRounded": round(all_draws / 5 + 0.4), "minimumRateCards": 58,
                             "isolatesOnlyExpectedDraws": isolated_draws,
                             "withoutIsolateRequirementExpectedDraws": nonisolate_draws,
                             "isolateMarginalExpectedDraws": all_draws - nonisolate_draws,
                             "isolateMarginalShare": (all_draws - nonisolate_draws) / all_draws,
                             "simulationMean": float(samples.mean()), "simulationTrials": len(samples),
                             "method": "Numerical integration of 1 - product_i(1-exp(-p_i*t)); tail truncated at 50*2087 with bound < 303*2087*exp(-50). For five-card packs, E[N]/5 <= E[ceil(N/5)] <= E[N]/5 + 0.8.",
                             "isolateInterpretation": "Marginal extra wait compares requiring all cards with requiring only non-isolates under the SAME draw probabilities. The expected time for isolates alone is not an additive share of completion time."}}
    write("week01_packs.json", payload)
    print(f"Collector: {all_draws:.2f} draws; about {round(all_draws / 5 + 0.4):,} five-card packs; 58 equally rare cards (including 17 isolates).")


if __name__ == "__main__":
    build()
