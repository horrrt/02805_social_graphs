"""Render the static, accessible fallbacks and the null-distribution figures.

Every figure is drawn once per palette. The arcade's dark palette writes
removal_results.svg, null_comparison.svg and null_survivors.svg; the light
palette for the Apple-styled version 2 writes the same figures with a _light
suffix. Run analysis/week02_resilience.py and analysis/week02_nullmodels.py
first; this script only draws what they measured.
"""
import csv
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.ticker import MaxNLocator

ROOT = Path(__file__).resolve().parents[1]
INK, PAPER, YELLOW, PURPLE = "#141614", "#f4f5ef", "#e7fa52", "#c0b0f2"
DARK = {"background": INK, "text": PAPER, "secondary": PAPER, "edge": "#626b56",
        "bars": PURPLE, "real": YELLOW, "bars_er": "#ff9f86",
        "legend_face": INK, "legend_edge": "#626b56", "legend_text": PAPER}
LIGHT = {"background": "#ffffff", "text": "#1d1d1f", "secondary": "#6e6e73", "edge": "#d2d2d7",
         "bars": "#0071e3", "real": "#ff3b30", "bars_er": "#af52de",
         "legend_face": "#ffffff", "legend_edge": "#d2d2d7", "legend_text": "#1d1d1f"}
PALETTES = [("", DARK), ("_light", LIGHT)]

# The six quantities the survivors figure shows: key, panel heading, axis label.
SURVIVORS = [
    ("avg_clustering", "CLUSTERING", "Average clustering C"),
    ("neighbour_degree_node", "THE FRIENDSHIP PARADOX", "Mean degree of a random friend"),
    ("friend_at_least", "IS YOUR FRIEND BIGGER?", "Chance the friend is at least as linked"),
    ("components", "ISLANDS", "Connected components"),
    ("avg_path_giant", "DISTANCES", "Average distance in the largest component"),
    ("assortativity", "DO HUBS AVOID HUBS?", "Degree assortativity"),
]


def draw(data, target, suffix, p):
    """Write the removal figure and the null comparison with palette p; return the paths."""
    plt.rcParams.update({"font.family": "sans-serif", "font.size": 12,
        "text.color": p["text"], "axes.labelcolor": p["secondary"], "xtick.color": p["secondary"],
        "ytick.color": p["secondary"], "axes.edgecolor": p["edge"], "axes.facecolor": p["background"],
        "figure.facecolor": p["background"], "svg.hashsalt": "week02"})
    font = FontProperties(fname=ROOT / "docs/assets/fonts/barlow-condensed-800.ttf")
    removal = target / f"removal_results{suffix}.svg"
    fig, ax = plt.subplots(figsize=(10, 4.8), layout="constrained")
    labels = [c["label"] for c in data["cases"]]
    counts = [c["real"]["count"] for c in data["cases"]]
    ax.barh(labels, counts, color=p["bars"], height=.6)
    for i, count in enumerate(counts): ax.text(count + .13, i, str(count), va="center", color=p["real"], fontsize=24, fontproperties=font)
    ax.invert_yaxis(); ax.set_xlim(0, 6); ax.set_xticks(range(7))
    ax.set_xlabel("Other articles outside the largest remaining group")
    ax.set_title("PULL ONE HERO. WHO ELSE GETS STRANDED?", loc="left", pad=20, fontproperties=font, fontsize=26, color=p["text"])
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", alpha=.12); ax.set_axisbelow(True)
    fig.savefig(removal, metadata={"Date": None})
    plt.close(fig)

    null = target / f"null_comparison{suffix}.svg"
    fig, axes = plt.subplots(2, 2, figsize=(11, 8), sharex=True, sharey=True, layout="constrained")
    for ax, case in zip(axes.flat, data["cases"]):
        h = case["null"]["histogram"]
        ax.bar([v["value"] for v in h], [v["count"] for v in h], color=p["bars"], width=.7, label="Shuffled worlds")
        ax.axvline(case["real"]["count"], color=p["real"], linestyle="--", linewidth=2.5, label="Real result")
        ax.set_title(f'{case["label"]} · real = {case["real"]["count"]}', loc="left", color=p["text"], fontproperties=font, fontsize=23, pad=12)
        ax.set_xlim(-.55, 5.6); ax.set_ylim(0, 1000); ax.set_xticks(range(6))
        ax.yaxis.set_major_locator(MaxNLocator(integer=True, nbins=5))
        ax.grid(axis="y", alpha=.12); ax.set_axisbelow(True)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_xlabel("Other articles stranded")
        ax.set_ylabel("Number of shuffled worlds")
    axes[0, 0].legend(facecolor=p["legend_face"], edgecolor=p["legend_edge"], labelcolor=p["legend_text"], fontsize=10)
    fig.suptitle("SAME DEGREES. DIFFERENT WIRING.", color=p["text"], fontproperties=font, fontsize=32)
    fig.savefig(null, metadata={"Date": None})
    plt.close(fig)
    return [removal, null]


def draw_survivors(table, draws, target, suffix, p):
    """One panel per quantity: both null distributions, and the real value marked."""
    font = FontProperties(fname=ROOT / "docs/assets/fonts/barlow-condensed-800.ttf")
    path = target / f"null_survivors{suffix}.svg"
    fig, axes = plt.subplots(2, 3, figsize=(14, 8.6), layout="constrained")
    handles = None
    for ax, (key, heading, axis_label) in zip(axes.flat, SURVIVORS):
        entry = table[key]
        real, digits = entry["real"], entry["digits"]
        series = [(draws["swap"][key], p["bars"], "Degree-preserving shuffle"),
                  (draws["er"][key], p["bars_er"], "Random G(n, m)")]
        span = [v for values, *_ in series for v in values] + [real]
        # Integer quantities get one bin per value; the rest get 30 shared bins.
        if all(float(v).is_integer() for v in span):
            edges = [v - .5 for v in range(int(min(span)), int(max(span)) + 2)]
        else:
            low, high = min(span), max(span)
            pad = (high - low) * .06 or .01
            edges = [low - pad + i * (high - low + 2 * pad) / 30 for i in range(31)]
        for values, colour, label in series:
            ax.hist(values, bins=edges, color=colour, alpha=.85, label=label)
        ax.axvline(real, color=p["real"], linestyle="--", linewidth=2.5, label="The real network")
        verdict = ("the shuffle cannot move it" if entry["swap"]["fixed"]
                   else f'z = {entry["swap"]["z"]:+.1f} against the shuffle')
        ax.set_title(heading, loc="left", color=p["text"], fontproperties=font,
                     fontsize=21, pad=26)
        ax.annotate(f"real = {real:,.{digits}f} · {verdict}", (0, 1),
                    xytext=(0, 8), textcoords="offset points", xycoords="axes fraction",
                    color=p["secondary"], fontsize=11)
        ax.set_xlabel(axis_label)
        ax.set_ylabel("Draws out of 1,000")
        ax.grid(axis="y", alpha=.12)
        ax.set_axisbelow(True)
        ax.spines[["top", "right"]].set_visible(False)
        handles = ax.get_legend_handles_labels()
    fig.legend(*handles, loc="outside lower center", ncols=3, frameon=False,
               labelcolor=p["legend_text"], fontsize=12)
    fig.suptitle("WHICH PROPERTIES SURVIVE THE SHUFFLE?", color=p["text"],
                 fontproperties=font, fontsize=32)
    fig.savefig(path, metadata={"Date": None})
    plt.close(fig)
    return [path]


def main():
    data = json.loads((ROOT / "docs/assets/data/week02_resilience.json").read_text())
    nulls = json.loads((ROOT / "docs/assets/data/week02_nullmodels.json").read_text())
    table = {q["key"]: q for q in nulls["quantities"]}
    draws = {"swap": {}, "er": {}}
    with (ROOT / "docs/assets/data/week02_nullmodels_draws.csv").open() as f:
        for row in csv.DictReader(f):
            for key in table:
                draws[row["null"]].setdefault(key, []).append(float(row[key]))
    target = ROOT / "docs/weeks/week02/figures"
    target.mkdir(parents=True, exist_ok=True)
    written = [path for suffix, palette in PALETTES
               for path in draw(data, target, suffix, palette)
               + draw_survivors(table, draws, target, suffix, palette)]
    for path in written:
        path.write_text("\n".join(line.rstrip() for line in path.read_text().splitlines()) + "\n")
    print("Wrote " + ", ".join(path.name for path in written) + ".")


if __name__ == "__main__":
    main()
