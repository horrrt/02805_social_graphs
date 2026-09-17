"""Is the tail a power law, or does it only look like one on a log axis?

Section 2 of the post is called "Heavy tails in migration". It draws a
histogram and a CCDF, offers a log-log toggle, and never fits anything, which
is exactly the move POST_GUIDE forbids: a straight-ish line on log-log axes is
not evidence of a power law. Plenty of distributions look straight over one or
two decades, and 228 countries buy you about two.

This runs the Clauset, Shalizi and Newman procedure on each degree sequence
and on the corridor weights:

  1. For every candidate x_min, fit alpha by maximum likelihood on the tail
     and record the Kolmogorov-Smirnov distance between the fitted model and
     the data above x_min. Take the x_min with the smallest distance.
  2. Test whether a power law could have produced that tail at all: generate
     synthetic datasets from the fitted model, refit each one from scratch,
     and count how often the synthetic KS distance beats the observed one.
     That fraction is p. Small p rules the power law out; large p does not
     rule it in.
  3. Compare against the distributions that also look straight: lognormal and
     exponential, by Vuong's likelihood-ratio test on the same tail. A
     normalised ratio near zero means the data cannot tell them apart, which
     is the usual answer at this sample size and is worth saying out loud.

    python analysis/week03_tails.py [--boot 500] [--seed 20260917]

Two honest limitations, repeated in the output so they reach the page:

  n is small. After x_min there are often fewer than a hundred countries, and
  at that size the goodness-of-fit test has little power to reject anything.
  "A power law is plausible" here means "not ruled out", not "established".

  The alternatives are fitted with the continuous approximation on the
  integer degree sequences, which is standard above x_min of about six and
  slightly favours the alternatives below it.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib

import numpy as np
from scipy import optimize, special, stats

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "assets" / "data"
OUT = ROOT / "analysis"


# ----------------------------------------------------------------- the model

def discrete_loglike(alpha: float, tail: np.ndarray, xmin: int) -> float:
    """Log-likelihood of a discrete power law with lower bound x_min.

    p(k) = k^-alpha / zeta(alpha, x_min), where zeta is the Hurwitz zeta and
    the sum runs from x_min to infinity.
    """
    if alpha <= 1.0:
        return -np.inf
    return -tail.size * math.log(special.zeta(alpha, xmin)) - alpha * np.log(tail).sum()


def fit_discrete_alpha(tail: np.ndarray, xmin: int) -> float:
    result = optimize.minimize_scalar(
        lambda a: -discrete_loglike(a, tail, xmin),
        bounds=(1.01, 8.0),
        method="bounded",
        options={"xatol": 1e-6},
    )
    return float(result.x)


def continuous_alpha(tail: np.ndarray, xmin: float) -> float:
    """The closed-form MLE, used for the corridor weights."""
    return 1.0 + tail.size / np.log(tail / xmin).sum()


def discrete_cdf(alpha: float, xmin: int, xs: np.ndarray) -> np.ndarray:
    """P(X <= x) for the fitted discrete power law, over the observed values."""
    total = special.zeta(alpha, xmin)
    # zeta(alpha, x + 1) is the upper tail from x + 1 onward, so the CDF at x
    # is one minus that share.
    return 1.0 - special.zeta(alpha, xs + 1) / total


def ks_distance(values: np.ndarray, alpha: float, xmin: float, discrete: bool) -> float:
    tail = np.sort(values[values >= xmin])
    if tail.size < 2:
        return np.inf
    empirical = np.arange(1, tail.size + 1) / tail.size
    below = np.arange(0, tail.size) / tail.size
    model = (
        discrete_cdf(alpha, int(xmin), tail)
        if discrete
        else 1.0 - (tail / xmin) ** (1.0 - alpha)
    )
    return float(max(np.abs(empirical - model).max(), np.abs(model - below).max()))


def best_xmin(values: np.ndarray, discrete: bool, min_tail: int = 25):
    """The x_min that minimises the KS distance, with alpha fitted at each one."""
    candidates = np.unique(values)
    candidates = candidates[candidates > 0]
    best = None
    for xmin in candidates:
        tail = values[values >= xmin]
        if tail.size < min_tail:
            break
        alpha = (
            fit_discrete_alpha(tail, int(xmin))
            if discrete
            else continuous_alpha(tail, float(xmin))
        )
        d = ks_distance(values, alpha, float(xmin), discrete)
        if best is None or d < best["ks"]:
            best = {"xmin": float(xmin), "alpha": float(alpha), "ks": d, "n_tail": int(tail.size)}
    return best


# ------------------------------------------------------------ goodness of fit

def sample_discrete(alpha: float, xmin: int, size: int, rng) -> np.ndarray:
    """Draw from the fitted discrete power law by inverting its CDF."""
    # A table out to where the survival function is negligible is faster than
    # a search per draw and exact enough for a KS statistic.
    top = xmin
    while special.zeta(alpha, top) / special.zeta(alpha, xmin) > 1e-9 and top < xmin + 200000:
        top *= 2
    support = np.arange(xmin, top + 1)
    weights = support.astype(float) ** -alpha
    weights /= weights.sum()
    return rng.choice(support, size=size, p=weights)


def goodness_of_fit(values, fit, discrete, reps, rng):
    """CSN's p: how often a synthetic dataset from the fitted model fits worse.

    Each synthetic set keeps the observed mixture — the body below x_min is
    resampled from the real data, the tail is drawn from the fitted model —
    and is refitted from scratch, so the test accounts for having chosen
    x_min from the data.
    """
    values = np.asarray(values)
    body = values[values < fit["xmin"]]
    n = values.size
    share_tail = fit["n_tail"] / n
    worse = 0
    for _ in range(reps):
        draws = rng.random(n) < share_tail
        n_tail = int(draws.sum())
        synthetic = np.empty(n)
        if discrete:
            synthetic[draws] = sample_discrete(fit["alpha"], int(fit["xmin"]), n_tail, rng)
        else:
            # Inverse transform for the continuous power law.
            u = rng.random(n_tail)
            synthetic[draws] = fit["xmin"] * (1.0 - u) ** (-1.0 / (fit["alpha"] - 1.0))
        synthetic[~draws] = (
            rng.choice(body, size=n - n_tail, replace=True) if body.size else fit["xmin"]
        )
        refit = best_xmin(synthetic, discrete)
        if refit and refit["ks"] >= fit["ks"]:
            worse += 1
    return worse / reps


# ------------------------------------------------------------- the rivals

def lognormal_tail_loglike(params, tail, xmin):
    mu, sigma = params
    if sigma <= 0:
        return np.inf
    # Truncated at x_min, so the density is renormalised by the mass above it.
    above = stats.norm.sf((math.log(xmin) - mu) / sigma)
    if above <= 0:
        return np.inf
    return -(
        stats.lognorm.logpdf(tail, s=sigma, scale=math.exp(mu)).sum()
        - tail.size * math.log(above)
    )


def compare(tail: np.ndarray, xmin: float, alpha: float):
    """Vuong's test of the power law against lognormal and exponential.

    Returns the normalised log-likelihood ratio R and its two-sided p for each
    rival. R > 0 favours the power law, R < 0 the rival, and a p above 0.1
    means the data cannot tell them apart — which is a result in itself.
    """
    n = tail.size
    logs = np.log(tail)
    # Both sides of the ratio have to be densities on the same measure, or the
    # comparison is between a probability and a probability density and the
    # ratio means nothing. The power law is therefore taken in its continuous
    # form here even for the integer degree sequences, refitted on the same
    # tail — which is the standard approximation once x_min is above about
    # six, and every x_min below is well above it.
    alpha_c = continuous_alpha(tail, xmin)
    power = math.log(alpha_c - 1.0) - math.log(xmin) - alpha_c * np.log(tail / xmin)

    start = [logs.mean(), max(logs.std(), 1e-3)]
    fit = optimize.minimize(
        lognormal_tail_loglike, start, args=(tail, xmin), method="Nelder-Mead",
    )
    mu, sigma = fit.x
    above = stats.norm.sf((math.log(xmin) - mu) / sigma)
    lognormal = stats.lognorm.logpdf(tail, s=sigma, scale=math.exp(mu)) - math.log(above)

    lam = 1.0 / (tail.mean() - xmin) if tail.mean() > xmin else 1.0
    exponential = math.log(lam) - lam * (tail - xmin)

    out = {}
    for name, rival in (("lognormal", lognormal), ("exponential", exponential)):
        diff = power - rival
        sigma_d = diff.std(ddof=0)
        if sigma_d <= 0:
            out[name] = {"R": 0.0, "p": 1.0}
            continue
        r = diff.sum() / (math.sqrt(n) * sigma_d)
        out[name] = {
            "R": round(float(r), 3),
            "p": round(float(math.erfc(abs(r) / math.sqrt(2))), 4),
        }
    out["lognormal_mu"] = round(float(mu), 3)
    out["lognormal_sigma"] = round(float(sigma), 3)
    out["alpha_continuous"] = round(float(alpha_c), 3)
    return out


# ------------------------------------------------------------------- the run

def verdict(fit, gof, rivals, n):
    """One sentence a reader can act on, given what the numbers allow.

    Two questions in order, because they are separate: could a power law have
    produced this tail at all, and does something else describe it better? A
    tail can pass the first and lose the second, which is what most of these
    do, so the sentence has to carry both rather than stopping at whichever
    reads better.
    """
    rivals_only = ("lognormal", "exponential")
    beaten = [k for k in rivals_only if rivals[k]["R"] < 0 and rivals[k]["p"] <= 0.1]
    tied = [k for k in rivals_only if rivals[k]["p"] > 0.1]

    if gof < 0.1:
        head = (
            f"Ruled out on its own terms: a power law above {fit['xmin']:.0f} produces a fit "
            f"this poor in {gof * 100:.0f}% of its own draws."
        )
    else:
        head = (
            f"Not ruled out on its own terms (p = {gof:.2f} over {n} points in the tail), "
            f"which is a weak thing to be able to say at this size."
        )
    if beaten:
        head += f" The {' and '.join(beaten)} describes the same tail better."
    if tied:
        head += (
            f" The {' and '.join(tied)} cannot be separated from it either way."
        )
    if not beaten and not tied:
        head += " It beats both rivals on this tail."
    return head


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--boot", type=int, default=500, help="synthetic datasets for p")
    parser.add_argument("--seed", type=int, default=20260917)
    args = parser.parse_args()
    rng = np.random.default_rng(args.seed)

    corridors = json.loads((DATA / "week03_corridors.json").read_text())
    edges = json.loads((DATA / "week03_edges.json").read_text())
    year = str(corridors["null_year"])
    nodes = corridors["nodes"]
    yi = edges["years"].index(int(year))

    quantities = {
        "in_degree": {
            "label": "Origins per destination (in-degree)",
            "values": [n["years"][year]["in_degree"] for n in nodes.values() if year in n.get("years", {})],
            "discrete": True,
        },
        "out_degree": {
            "label": "Destinations per origin (out-degree)",
            "values": [n["years"][year]["out_degree"] for n in nodes.values() if year in n.get("years", {})],
            "discrete": True,
        },
        "flight_degree": {
            "label": "Flight partners per country",
            "values": [n["flight_degree"] for n in nodes.values()],
            "discrete": True,
        },
        "corridor_people": {
            "label": "People on a corridor",
            "values": [e[2][yi] for e in edges["edges"] if e[2][yi] > 0],
            "discrete": False,
        },
    }

    report = {
        "generated": "analysis/week03_tails.py",
        "year": int(year),
        "method": "Clauset, Shalizi and Newman (2009), SIAM Review 51(4), 661-703",
        "bootstrap": args.boot,
        "seed": args.seed,
        "note": "p is the share of synthetic datasets from the fitted model that fit "
                "it worse than the data does. p below 0.1 rules the power law out; a "
                "large p does not rule it in. R is Vuong's normalised log-likelihood "
                "ratio: positive favours the power law, negative the rival, and its "
                "p above 0.1 means the two cannot be separated at this sample size.",
        "fits": {},
    }

    for key, spec in quantities.items():
        values = np.asarray([v for v in spec["values"] if v and v > 0], dtype=float)
        if values.size < 50:
            continue
        print(f"\n{spec['label']}  (n = {values.size})")
        fit = best_xmin(values, spec["discrete"])
        if not fit:
            print("  no tail long enough to fit")
            continue
        print(f"  x_min {fit['xmin']:.0f}, alpha {fit['alpha']:.2f}, "
              f"n in tail {fit['n_tail']}, KS {fit['ks']:.3f}")
        gof = goodness_of_fit(values, fit, spec["discrete"], args.boot, rng)
        tail = np.sort(values[values >= fit["xmin"]])
        rivals = compare(tail, fit["xmin"], fit["alpha"])
        line = verdict(fit, gof, rivals, fit["n_tail"])
        print(f"  goodness of fit p = {gof:.2f}")
        for rival in ("lognormal", "exponential"):
            r = rivals[rival]
            print(f"  vs {rival:12s} R = {r['R']:+.2f}  p = {r['p']:.3f}")
        print(f"  → {line}")
        report["fits"][key] = {
            "label": spec["label"],
            "n": int(values.size),
            "xmin": fit["xmin"],
            "alpha": round(fit["alpha"], 3),
            "n_tail": fit["n_tail"],
            "ks": round(fit["ks"], 4),
            "p": round(gof, 3),
            "vs": rivals,
            "verdict": line,
        }

    path = OUT / "week03_tails.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"\nwrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
