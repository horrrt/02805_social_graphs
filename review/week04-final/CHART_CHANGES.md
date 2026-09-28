# Chart changes made on the design canvas (to port into the live page's JS)

Each item: what changed on the canvas, and how the canvas version was produced (script in the scratchpad folder one level up, or a patch applied to the live page's JS at render time via Playwright `page.route`). All numbers came from the page's own data files in docs/weeks/week04/data/.

1. Section 1 employer arcs map and deep-dive backbone map: straight links instead of curves (ECharts `curveness: 0`), docs/assets/js/week04-place.js.
2. Hero map (week04-place.js): third metro group ("the other 25") drawn in the base slate #7a8fac token instead of near-white; map framed wider (layoutSize 135%) so "San Francisco" is not clipped. Hero legend rebuilt as an aligned key (RTop board, `.rx-legend`).
3. Giant component vs alpha chart (week04-place.js `renderGcLine`): flat navy line, white dots, light solid grid, selected alpha filled, dashed marker where the backbone snaps, links kept listed per step.
4. Roles chart (week04-roles.js): navy-to-pale-blue ramp by size (#0f2340 … #e3ecf5, "All other" light grey #d3d9e1) via the `--w4-area-*` tokens; compact tooltip: axis trigger kept, but the card shows only the hovered band (share of year, filings, change on previous year), or when off a band the year's total and three largest roles; thin axis pointer line; blurred other bands. Patch in scratchpad/rolestip.js.
5. Occupation network (section 2 / Jobs topic, week04-jobs.js renderNetwork): layout from networkx, 51 of 60 occupations labelled with leader lines (scratchpad/netsvg.py produced a static SVG).
6. "Do the clusters follow official job groups?" (Jobs topic): composition bars over all 438 occupations plus a 0 to 1 NMI scale (scratchpad/jobgroups.py, jobs_crosstab.json). NMI 0.2339.
7. PageRank rounds (Jobs topic, week04-pagerank.js): bump chart of rank after each round for the final top 10 (scratchpad/pr.py); axis "round 1 … final"; full names, no ellipsis.
8. PageRank top 15 bars: label column widened so labels never touch bars (bars start at x 300 of 556 in the SVG).
9. Lottery (Paperwork topic): new chart "Every draw since 2020" from USCIS published totals, plus slopegraph label fix (scratchpad/lot.py).
10. 2B card (section 2): two new charts, "Where the links go" composition bar and "The 15 jobs with the most communities per link" scatter (scratchpad/s2b.py).
11. Section 3 "One client, many vendors" ego diagram: interactive, with a year control 2022 to 2026 and search over clients with 20+ placed filings (scratchpad/ego.py; data from staffing_clients.json).
12. All tables: redesigned (framed, tabular numbers, in-cell bars and meters; numbers in a fixed-width right-aligned slot so bars line up) (scratchpad/tab.py). USCIS denials table: bars on the two denial-rate columns, shared 0 to 4% scale, orange placing/blue direct.
13. Client scatter (Outsourcing topic, week04-staffing.js): colours only Finance and insurance (blue), Manufacturing (navy), Health care (orange); other known sectors small light grey; unknown sector palest, smallest, drawn beneath; client names above dots. Tables use NAICS sector names (map in scratchpad/sect.js and the fix script). Patch in scratchpad/sect.js.
14. Skills radar (week04-skills-radar.js): labels longer than 26 characters wrap to two lines at a word break instead of ending in an ellipsis; 10.5px (scratchpad/radar.js).
15. Section 2 start card: "The 12 most common job pairs" horizontal bars, pairs including Software Developers dark, others grey, counts at bar ends, key "Pair includes Software Developers (8 of 12)"; the empty "Select a pair" inspector removed (built from jobs.json pairs).
16. Section 2A: "Do outsourcers cluster jobs like random firms would?" horizontal bars with whiskers and plain row labels (from jobs_split.json finding.q1_*).
17. Five years roles chart hover card (see 4).
18. Deep-dive tables' in-cell bars aligned (`.rx-cell>span:last-child{min-width:5.2ch;text-align:right}`).
