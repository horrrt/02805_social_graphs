"""Render the static, accessible fallback and the optional null-distribution figure."""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.ticker import MaxNLocator

ROOT = Path(__file__).resolve().parents[1]
INK, PAPER, YELLOW, PURPLE = "#141614", "#f4f5ef", "#e7fa52", "#c0b0f2"


def main():
    data = json.loads((ROOT / "docs/assets/data/week02_resilience.json").read_text())
    target = ROOT / "docs/weeks/week02/figures"
    target.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"font.family": "sans-serif", "font.size": 12,
        "text.color": PAPER, "axes.labelcolor": PAPER, "xtick.color": PAPER,
        "ytick.color": PAPER, "axes.edgecolor": "#626b56", "axes.facecolor": INK,
        "figure.facecolor": INK, "svg.hashsalt": "week02"})
    font = FontProperties(fname=ROOT / "docs/assets/fonts/barlow-condensed-800.ttf")
    fig, ax = plt.subplots(figsize=(10, 4.8), layout="constrained")
    labels = [c["label"] for c in data["cases"]]
    counts = [c["real"]["count"] for c in data["cases"]]
    ax.barh(labels, counts, color=PURPLE, height=.6)
    for i, count in enumerate(counts): ax.text(count + .13, i, str(count), va="center", color=YELLOW, fontsize=24, fontproperties=font)
    ax.invert_yaxis(); ax.set_xlim(0, 6); ax.set_xticks(range(7))
    ax.set_xlabel("Other articles outside the largest remaining group")
    ax.set_title("PULL ONE HERO. WHO ELSE GETS STRANDED?", loc="left", pad=20, fontproperties=font, fontsize=26, color=PAPER)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", alpha=.12); ax.set_axisbelow(True)
    fig.savefig(target / "removal_results.svg", metadata={"Date": None})
    plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(11, 8), sharex=True, sharey=True, layout="constrained")
    for ax, case in zip(axes.flat, data["cases"]):
        h = case["null"]["histogram"]
        ax.bar([v["value"] for v in h], [v["count"] for v in h], color=PURPLE, width=.7, label="Shuffled worlds")
        ax.axvline(case["real"]["count"], color=YELLOW, linestyle="--", linewidth=2.5, label="Real result")
        ax.set_title(f'{case["label"]} · real = {case["real"]["count"]}', loc="left", color=PAPER, fontproperties=font, fontsize=23, pad=12)
        ax.set_xlim(-.55, 5.6); ax.set_ylim(0, 1000); ax.set_xticks(range(6))
        ax.yaxis.set_major_locator(MaxNLocator(integer=True, nbins=5))
        ax.grid(axis="y", alpha=.12); ax.set_axisbelow(True)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_xlabel("Other articles stranded")
        ax.set_ylabel("Number of shuffled worlds")
    axes[0, 0].legend(facecolor=INK, edgecolor="#626b56", labelcolor=PAPER, fontsize=10)
    fig.suptitle("SAME DEGREES. DIFFERENT WIRING.", color=PAPER, fontproperties=font, fontsize=32)
    fig.savefig(target / "null_comparison.svg", metadata={"Date": None})
    plt.close(fig)
    for name in ("removal_results.svg", "null_comparison.svg"):
        path = target / name
        path.write_text("\n".join(line.rstrip() for line in path.read_text().splitlines()) + "\n")
    print("Wrote the removal figure and all four null distributions.")


if __name__ == "__main__":
    main()
