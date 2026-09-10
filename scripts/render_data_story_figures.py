"""Exact data companions for the three full-page design concepts.

Run from the repository root with Matplotlib installed. No generated image is
edited here: these figures are independently plotted from the frozen dataset.
"""
import csv
import json
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs/assets/data"
OUT = ROOT / "docs/mockups/data-figures"
OUT.mkdir(exist_ok=True)
D = json.loads((DATA / "week02_resilience.json").read_text())
ROWS = list(csv.DictReader((DATA / "week02_all_removals.csv").open()))
NULL = list(csv.DictReader((DATA / "week02_null_draws.csv").open()))
INK, MUTED, BLUE, ORANGE, GRID = "#172329", "#53636C", "#2458CD", "#B75B0D", "#D6DEE4"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 14,
                     "text.color": INK, "axes.labelcolor": INK,
                     "xtick.color": MUTED, "ytick.color": INK,
                     "axes.edgecolor": GRID, "savefig.facecolor": "white"})


def heading(fig, kicker, title, subtitle):
    fig.text(.06, .955, kicker.upper(), color=BLUE, size=12, weight="bold")
    fig.text(.06, .904, title, size=29, weight="bold")
    fig.text(.06, .862, subtitle, size=14, color=MUTED)


def save(fig, name):
    fig.savefig(OUT / f"{name}.png", dpi=150)
    plt.close(fig)


# Validate chart inputs against graph traversal, independently of saved metrics.
adj = {n["id"]: set() for n in D["nodes"]}
for u, v in D["links"]:
    adj[u].add(v)
    adj[v].add(u)


def components(skip=None):
    todo = set(adj) - {skip}
    result = []
    while todo:
        todo.remove(start := next(iter(todo)))
        stack, group = [start], {start}
        while stack:
            for item in adj[stack.pop()] & todo:
                todo.remove(item)
                group.add(item)
                stack.append(item)
        result.append(group)
    return sorted(result, key=len, reverse=True)


assert len(adj) == 277 and len(components()) == 1
for row in ROWS:
    assert int(row["degree"]) == len(adj[row["node_id"]])
    assert int(row["stranded"]) == 276 - len(components(row["node_id"])[0])
assert Counter(int(r["stranded"]) for r in ROWS) == {0: 264, 1: 10, 2: 1, 3: 1, 5: 1}

# 1. A census of every possible single-article removal.
fig = plt.figure(figsize=(12, 9))
heading(fig, "01 / The fragility census", "264 of 277 removals keep the rest connected",
        "One removal test per mark · 276 articles remain after each test · snapshot 26 Aug 2026")
ax = fig.add_axes([.06, .465, .52, .32])
for i in range(277):
    x, y = i % 26, -(i // 26)
    ax.scatter(x, y, s=36, marker="o" if i < 264 else "s",
               facecolor=GRID if i < 264 else BLUE,
               edgecolor=MUTED if i < 264 else INK, linewidth=.45)
ax.set(xlim=(-1, 26), ylim=(-11, 1)); ax.set_axis_off()
fig.text(.63, .75, "264", size=43, weight="bold")
fig.text(.63, .71, "Circles: remaining articles stay connected", size=12)
fig.text(.63, .65, "13", size=43, weight="bold", color=BLUE)
fig.text(.63, .61, "Squares: remaining articles split into groups", size=12)
fig.text(.06, .434, "The 13 removals that cause fragmentation", size=19, weight="bold")
affected = [r for r in ROWS if int(r["stranded"]) > 0]
names = [r["name"].replace(" (Natasha Romanova)", "").replace(" (character)", "").replace(" (comics)", "") for r in affected]
ax = fig.add_axes([.19, .093, .52, .31])
ax.barh(range(13), [int(r["stranded"]) for r in affected], height=.64,
        color=BLUE, edgecolor=INK, linewidth=.4)
ax.set_yticks(range(13), names, fontsize=10)
ax.invert_yaxis(); ax.set_xlim(0, 5.6); ax.set_xticks(range(6))
ax.set_xlabel("Articles stranded outside the largest remaining group", fontsize=11)
ax.tick_params(axis="y", length=0)
ax.spines[["right", "top"]].set_visible(False)
for i, r in enumerate(affected):
    ax.text(int(r["stranded"]) + .08, i, r["stranded"], va="center", size=10)
fig.text(.77, .30, "The effect is\nconcentrated in\na few articles.", size=20, weight="bold", linespacing=1.5)
fig.text(.06, .016, "Source: week02_all_removals.csv, verified against the 277-node graph. Links are Wikipedia article links.", size=10, color=MUTED)
save(fig, "removal-census")

# 2. Exact local topology, with the unaffected core explicitly collapsed.
black = next(c for c in D["cases"] if c["label"] == "Black Widow")
assert {frozenset(g) for g in components(black["id"])[1:]} == {
    frozenset(["Blue_Eagle_(character)"]), frozenset(["Rockman_(character)", "The_Witness_(character)"])}
fig = plt.figure(figsize=(12, 8))
heading(fig, "02 / Follow the fracture", "Three articles stranded. Two separate groups.",
        "Remove Black Widow · 277 articles before, 276 after · snapshot 26 Aug 2026")

for index, after in enumerate([False, True]):
    ax = fig.add_axes([.06 + index * .48, .26, .42, .52])
    ax.set(xlim=(0, 10), ylim=(0, 10)); ax.set_axis_off()
    ax.text(0, 9.7, "AFTER REMOVAL" if after else "BEFORE REMOVAL", size=14, weight="bold")
    ax.add_patch(FancyBboxPatch((.3, 6.3), 3.5, 2.1, boxstyle="round,pad=.1,rounding_size=.15",
                               facecolor="white", edgecolor=BLUE, linewidth=1.5))
    ax.text(2.05, 7.35, "273 articles\nMain group", ha="center", va="center", size=15, linespacing=1.5)
    if not after:
        ax.plot([3.8, 6], [7.35, 7.35], color=MUTED, lw=2)
        ax.text(4.8, 8.0, "23 links", ha="center", size=11)
        ax.plot([6, 2.05], [7, 2.4], color=MUTED, lw=2)
        ax.plot([6, 6], [7, 2.4], color=MUTED, lw=2)
        ax.scatter([6], [7.35], s=650, facecolor=BLUE, edgecolor=INK, zorder=3)
        ax.text(6, 8.5, "Black Widow", ha="center", size=12, weight="bold")
    else:
        ax.scatter([6], [7.35], s=140, marker="x", color=MUTED, linewidth=2)
        ax.text(6, 8.5, "Black Widow\nremoved", ha="center", size=12, linespacing=1.4)
        for x, w in [(0.4, 3.3), (4.7, 4.7)]:
            ax.add_patch(FancyBboxPatch((x, .4), w, 3.5, boxstyle="round,pad=.1,rounding_size=.15",
                                       facecolor="white", edgecolor=ORANGE, linewidth=1.5, linestyle="--"))
        ax.text(2.05, .9, "1 article", size=11, ha="center", color=ORANGE)
        ax.text(7.1, .9, "2 articles", size=11, ha="center", color=ORANGE)
    ax.plot([6, 8.25], [2.4, 2.4], color=ORANGE if after else MUTED, lw=2)
    ax.scatter([2.05, 6, 8.25], [2.4] * 3, s=230,
               facecolor=ORANGE if after else "white", edgecolor=INK, zorder=3)
    for x, label in [(2.05, "Blue Eagle"), (6, "Rockman"), (8.25, "The Witness")]:
        ax.text(x, 3.1, label, ha="center", size=11,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.5})

fig.text(.06, .205, "Stranded does not necessarily mean alone.", size=23, weight="bold")
fig.text(.06, .165, "Blue Eagle is isolated. Rockman and The Witness still link to each other,\nbut none of the three can reach the main group.", size=15, linespacing=1.55, va="top")
fig.text(.06, .056, "Schematic: the 273-article group and its 23 links to Black Widow are collapsed; sizes are not proportional.", size=10, color=MUTED)
fig.text(.06, .023, "Source: week02_resilience.json · actual article links; node positions held fixed for comparison.", size=10, color=MUTED)
save(fig, "black-widow-islands")

# 3. Discrete distribution of every recorded shuffled trial.
counts = Counter(int(r["Spider-Man"]) for r in NULL)
assert counts == {0: 235, 1: 350, 2: 248, 3: 114, 4: 44, 5: 9}
fig = plt.figure(figsize=(12, 8))
heading(fig, "03 / A thousand possible worlds", "Five is unusual in this comparison",
        "1,000 degree-preserving shuffles · connected before Spider-Man is removed · snapshot 26 Aug 2026")
ax = fig.add_axes([.09, .24, .57, .52])
bars = ax.bar(range(6), [counts[x] for x in range(6)], width=.68,
              color=[BLUE] * 5 + [ORANGE], edgecolor=INK, linewidth=.7)
bars[-1].set_hatch("///")
ax.set_ylim(0, 400); ax.set_yticks([0, 100, 200, 300, 400]); ax.set_xticks(range(6))
ax.set_xlabel("Articles stranded after removal", labelpad=12)
ax.set_ylabel("Number of shuffled trials", labelpad=12)
ax.spines[["right", "top"]].set_visible(False)
ax.set_axisbelow(True); ax.yaxis.grid(True, color=GRID, linewidth=.7)
for x in range(6):
    ax.text(x, counts[x] + 9, str(counts[x]), ha="center", weight="bold", size=14)
ax.annotate("Observed result: 5", xy=(5, 9), xytext=(3.25, 210), size=12, weight="bold",
            arrowprops={"arrowstyle": "->", "color": INK, "linewidth": 1.3})
fig.text(.72, .66, "9 / 1,000", size=33, weight="bold", color=ORANGE)
fig.text(.72, .55, "trials stranded\nat least 5 articles", size=17, linespacing=1.5)
fig.text(.72, .41, "1.409", size=25, weight="bold")
fig.text(.72, .36, "mean articles stranded", size=12)
fig.text(.06, .12, "The arrangement of links matters, beyond the number each article has.", size=19, weight="bold")
fig.text(.06, .060, "Exploratory, finite-shuffle comparison. This is an empirical count, not proof of a cause or a calibrated significance claim.", size=9.5, color=MUTED)
fig.text(.06, .025, "Source: all 1,000 rows in week02_null_draws.csv. Observed Spider-Man removal: 5 stranded, 271 in the largest group.", size=10, color=MUTED)
save(fig, "shuffled-worlds")

print(json.dumps({"verified_removals": len(ROWS), "verified_shuffle_trials": len(NULL),
                  "figures": [str(p) for p in OUT.glob("*.png")]}, indent=2))
