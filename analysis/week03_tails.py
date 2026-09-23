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

Steps 1 and 3 are the `powerlaw` package (Alstott, Bullmore and Plenz 2014,
PLoS ONE 9(1)), which is the reference implementation of the procedure. This
file used to implement them itself, and that was a mistake twice over: it is
untested code wearing a published method's name, and it was wrong.

The bug, kept here because the numbers on the page moved when it was fixed.
Our Kolmogorov-Smirnov distance walked the sorted tail one observation at a
time, so a value repeated ten times produced ten steps in the empirical CDF
against one flat stretch of the model, and the gap between them counted as
distance. Degree sequences are nothing but ties: the in-degree tail has 227
observations over 88 distinct values. The exponent was never affected, because
the likelihood does not care about order, and on corridor weights, which are
continuous and essentially tie-free, the old code agreed with `powerlaw` to
the digit. But the inflated distance moved the x_min that minimises it, and
all three degree sequences were fitted above the wrong x_min. Collapsing ties
to distinct values reproduces `powerlaw`'s distance to four decimals, which is
how the cause was pinned down.

Step 2 stays ours, because `powerlaw` does not do it: `Fit` reports the KS
distance but never the bootstrapped p that turns it into a test. It is the
semi-parametric bootstrap CSN prescribe, now built on `powerlaw`'s own fit and
sampler, so the observed and synthetic distances are measured the same way.

Two honest limitations, repeated in the output so they reach the page:

  n is small. After x_min there are often fewer than a hundred countries, and
  at that size the goodness-of-fit test has little power to reject anything.
  "A power law is plausible" here means "not ruled out", not "established".

  The alternatives are fitted with the continuous approximation on the integer
  degree sequences, which is standard above x_min of about six and slightly
  favours the alternatives below it.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import warnings
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

import numpy as np
import powerlaw

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from week04_staffing import span  # noqa: E402  (module import order kept flat)

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "assets" / "data"
OUT = ROOT / "analysis"

RIVALS = ("lognormal", "exponential")


def fit_tail(values: np.ndarray, discrete: bool) -> powerlaw.Fit:
    """x_min by minimum KS distance, alpha by maximum likelihood on the tail."""
    # powerlaw narrates its search on stdout and warns about the divide by zero
    # it does deliberately while scanning candidate x_min values.
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return powerlaw.Fit(values, discrete=discrete, verbose=False)


def _one_draw(args):
    """One synthetic dataset, fitted from scratch. Top level, so it pickles."""
    below, alpha, xmin, n_tail, n_below, discrete, seed = args
    rng = np.random.default_rng(seed)
    # The inverse CDF of a continuous power law above x_min: this is
    # `powerlaw`'s own _generate_random_continuous formula (distributions.py),
    # written out so the draw follows the seed this worker was given rather
    # than the global numpy stream. For a discrete tail this is only an
    # approximation of `powerlaw`'s sampler: its
    # _generate_random_discrete_estimate applies a continuity correction,
    # (xmin - 0.5) * (1 - r) ** (-1/(alpha-1)) + 0.5, that the plain round()
    # below does not. The difference is small for the x_min values these
    # tails fit at, but it is a difference.
    tail = xmin * (1 - rng.random(n_tail)) ** (-1 / (alpha - 1))
    if discrete:
        tail = np.round(tail)
    synthetic = (
        np.concatenate([rng.choice(below, size=n_below, replace=True), tail])
        if n_below
        else tail
    )
    return fit_tail(synthetic, discrete).D


def goodness_of_fit(values, fit, discrete, reps, seed):
    """CSN's semi-parametric bootstrap, the part `powerlaw` leaves to you.

    Each synthetic dataset keeps the shape of the data below x_min by
    resampling it, and draws the tail from the fitted power law, so it has the
    same size and the same non-tail as the real thing. Every one is then refit
    from scratch, x_min included, because a p computed against a fixed x_min
    ignores that x_min was chosen to make the distance small and comes out far
    too generous.

    Across processes, because that refit is the whole cost. powerlaw scans
    every distinct value below x_min as a candidate, so one fit of the 8,792
    corridor weights takes two seconds and 500 of them take seventeen minutes
    on one core. Restricting the scan would have been faster still and would
    have biased p upwards, which is the flattering direction, so the work is
    spread instead of cut.
    """
    below = values[values < fit.xmin]
    n_tail = int((values >= fit.xmin).sum())
    n_below = int(values.size - n_tail)
    jobs = [
        (below, float(fit.alpha), float(fit.xmin), n_tail, n_below, discrete, seed + i)
        for i in range(reps)
    ]
    started = time.time()
    step = max(1, reps // 10)
    distances = []
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as pool:
        futures = [pool.submit(_one_draw, job) for job in jobs]
        for done, future in enumerate(as_completed(futures), start=1):
            distances.append(future.result())
            if done % step == 0 or done == reps:
                elapsed = time.time() - started
                print(f"    bootstrap: {done}/{reps} ({done / reps:.0%}), "
                      f"{span(elapsed)} elapsed, "
                      f"about {span(elapsed / done * (reps - done))} left", flush=True)
    return sum(1 for d in distances if d >= fit.D) / reps


def compare(fit) -> dict:
    """Vuong's normalised likelihood ratio against each rival, on the same tail.

    Both sides are fitted with the continuous approximation, the power law
    included, because a ratio between a probability mass and a probability
    density is not a number that means anything.
    """
    out = {}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for rival in RIVALS:
            R, p = fit.distribution_compare(
                "power_law", rival, normalized_ratio=True
            )
            out[rival] = {"R": round(float(R), 3), "p": round(float(p), 3)}
    return out


def verdict(fit, gof, rivals, n):
    """One sentence a reader can act on, given what the numbers allow.

    Two questions in order, because they are separate: could a power law have
    produced this tail at all, and does something else describe it better? A
    tail can pass the first and lose the second, which is what most of these
    do, so the sentence has to carry both rather than stopping at whichever
    reads better.
    """
    beaten = [k for k in RIVALS if rivals[k]["R"] < 0 and rivals[k]["p"] <= 0.1]
    tied = [k for k in RIVALS if rivals[k]["p"] > 0.1]
    # "The lognormal and exponential describes" was the first thing this got
    # wrong out loud, and a verb is not the kind of thing a reader forgives.
    verb = lambda names, one, many: one if len(names) == 1 else many

    if gof < 0.1:
        head = (
            f"Ruled out on its own terms: a power law above {fit.xmin:.0f} produces a fit "
            f"this poor in {gof * 100:.0f}% of its own draws."
        )
        # 0.1 is a convention, not a discovery, and at 500 draws p carries a
        # standard error of about 0.013. A p of 0.09 is on the line, and a
        # sentence that reads the same at 0.09 as at 0.00 is overclaiming.
        if gof >= 0.05:
            head += (
                f" That is close to the 0.1 line the convention draws, and with "
                f"{n} points in the tail it is the weakest kind of rejection."
            )
    else:
        head = (
            f"Not ruled out on its own terms (p = {gof:.2f} over {n} points in the tail), "
            f"which is a weak thing to be able to say at this size."
        )
    if beaten:
        head += (
            f" The {' and '.join(beaten)} "
            f"{verb(beaten, 'describes', 'describe')} the same tail better."
        )
    if tied:
        head += (
            f" The {' and '.join(tied)} "
            f"{verb(tied, 'cannot', 'cannot')} be separated from it either way."
        )
    if not beaten and not tied:
        head += " It beats both rivals on this tail."
    return head


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--boot", type=int, default=500, help="synthetic datasets for p")
    parser.add_argument("--seed", type=int, default=20260917)
    args = parser.parse_args()

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
        "flight_partners": {
            "label": "Flight partners per country",
            "values": [n["flight_partners"] for n in nodes.values()],
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
        "method": "Clauset, Shalizi and Newman (2009), SIAM Review 51(4), 661-703, "
                  "fitted with the powerlaw package (Alstott, Bullmore and Plenz 2014)",
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
        fit = fit_tail(values, spec["discrete"])
        n_tail = int((values >= fit.xmin).sum())
        print(f"  x_min {fit.xmin:.0f}, alpha {fit.alpha:.2f}, "
              f"n in tail {n_tail}, KS {fit.D:.3f}")
        gof = goodness_of_fit(values, fit, spec["discrete"], args.boot, args.seed)
        rivals = compare(fit)
        line = verdict(fit, gof, rivals, n_tail)
        print(f"  goodness of fit p = {gof:.2f}")
        for rival in RIVALS:
            r = rivals[rival]
            print(f"  vs {rival:12s} R = {r['R']:+.2f}  p = {r['p']:.3f}")
        print(f"  → {line}")
        report["fits"][key] = {
            "label": spec["label"],
            "n": int(values.size),
            "xmin": float(fit.xmin),
            "alpha": round(float(fit.alpha), 3),
            "n_tail": n_tail,
            "ks": round(float(fit.D), 4),
            "p": round(gof, 3),
            "vs": rivals,
            "verdict": line,
        }

    path = OUT / "week03_tails.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"\nwrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
