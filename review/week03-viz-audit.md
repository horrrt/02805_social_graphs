# Week 3 visualization audit — 17 September 2026

Checked the shipped charts in `docs/weeks/week03/index.html` against the data in
`docs/assets/data/week03_corridors.json` and the drawing code in
`docs/assets/js/corridor.js`. Numbers below are the 2020 migration snapshot
(228 countries with data) and the undated flight snapshot (236 nodes).

## Problems that change a claim

### 1. The "Most surprising bridges" list crowns islands (§4)
`z >= 2` returns 16 countries. Ten are real brokers (DEU 6.4, SSD 6.1, GBR 5.0,
USA 4.2, FRA 2.9, ESP 2.4, SDN 4.8, BGD 4.4, ETH 4.1, TCD 2.6). Six are
artifacts of a collapsed null spread: Kiribati, New Caledonia, Guam, Palau,
Comoros, Réunion all have betweenness ≈ 0.0088 against a null mean of ~0.0005
and sd ~0.002, because in most of the 100 shuffles their betweenness is exactly
zero. Germany's betweenness is 0.277 — thirty times larger.

The `in_degree >= 10` guard at `corridor.js:2206` catches Kiribati and Palau but
not Guam (k=11) or New Caledonia (k=16), so Guam currently sits in the displayed
top six next to Germany. A z-score against a distribution that is mostly zeros
is not a z-score. Fix: use the empirical rank (share of shuffles the real value
beats) instead of z, or require a minimum non-zero fraction in the null, not a
degree floor.

### 2. Half the world is missing from §3, and nothing says so
`corridor.js:1475` filters `betweenness > 0` for the log–log scatter. In 2020,
111 of 228 countries have betweenness exactly 0, and 172 of 236 have zero flight
betweenness. So "Popular ≠ bridge" is drawn on 117 migration points and 64
flight points out of the full set, with no note in the caption. The zeros are
the strongest version of the post's own claim — countries with partners and no
brokerage — and they are the ones dropped.

### 3. §3 and §4 plot different populations on the same axes
§4's z scatter (`corridor.js:1546`) keeps the zero-betweenness countries; §3
drops them. The two charts sit four lines apart, share a selection, and look
like the same cloud twice. A country clicked in §4 can be absent from §3.

### 4. No country is significantly *below* its degree
`z <= -2` count is zero, and the zero-betweenness countries span z = −1.65 to
0.00. The aside says "z = 0 means 'just degree'", but for those 111 countries
z ≈ 0 means "the real value and the null are both zero" — no information, not
agreement. Worth one clause in the aside.

### 5. §2's year tag contradicts its own chart
`index.html:139` hardcodes "(analysis year: 2020)", but `setYear`
(`corridor.js:2068`) re-renders `hist` and `ccdf` on every slider move. Drag to
1990 and section 2 shows 1990 data under a 2020 label. §3, §6 and §8 carry the
same label and genuinely are fixed at 2020, so identical labels describe two
different behaviors. The slider's own label says "Year (map animation)", which
is also wrong — it drives the globe, map, both distributions, the inspector and
the edge inspector.

## Weaker, but worth a look

- **Heavy tails (§2).** In-degree: median 21, 90th percentile 109, max 201 of a
  possible 235. Out-degree: median 35, max 158. Skewed and bounded, on 236
  nodes. "A few countries have many partners, most have few" is safe;
  "heavy-tailed" in the heading is doing more work than the data supports, and
  POST_GUIDE forbids claiming a power law from the shape of a line.
- **"The flight network's tail is the longest"** compares degree in a different
  graph with a different link rule (airport pairs aggregated to countries). The
  caption should say the two are not the same kind of partner.
- **§8 duplicates §3 and §4.** `dk-scatter` and `dk-z` are 440×330 reprints of
  charts from four sections earlier, and both ship `<h3>&nbsp;</h3>`
  (`index.html:408`, `:437`) so they have no title. A highlighted marker on the
  originals does the same work.
- **PageRank has no view.** Added in 4340c09 as a panel number with a fineprint
  gloss. The interesting part is where PageRank and in-degree disagree, and
  nothing shows that.

## Brief coverage

`analysis/week03_migration_centrality.py` already computes closeness, harmonic,
eigenvector, degree assortativity, attribute assortativity with its own null,
k_nn(k) and cliques. None of it is on the page. This is the "go nuts" free-form
post and POST_GUIDE says it need not reproduce every exercise, so the gap is a
choice rather than a defect — but it is a choice worth making on purpose.

## What was fixed on 17 September 2026

1. **The broker list is ranked by brokerage, not by z.** `brokers()` in
   `corridor.js` keeps the z ≥ 2 test for getting on the list and orders it by
   observed betweenness minus the null's average. The top six become the United
   States, the United Kingdom, Germany, France, Spain and Ethiopia; the
   arbitrary `in_degree >= 10` floor is gone, and the caption names the six
   small territories that clear z = 2 on a collapsed null and says why their z
   inflates. Section 3's point labels use the same ranking.
2. **Every country is on the section 3 scatter.** Zeros sit on a baseline row
   under a dashed axis break, labelled 0 on the y-axis, and the caption counts
   them (110 of 227 in migration, 143 of 207 in flights). Hovering one says the
   value is exactly zero. The same treatment went into section 8's mini scatter,
   where the selected country used to vanish when it brokered nothing.
3. **Sections 3 and 4 now plot the same countries**, which falls out of 2.
4. **The year tags tell the truth.** Section 2's reads
   "(2020 · follows the slider)" and updates with it; sections 3, 6 and 8 read
   "(2020 only · the null-model year)"; the slider's own label names everything
   it drives.

Also: the z-score glossary entry and the section 4 aside now say what a zero
means for a country that brokers nothing, and that nothing falls below −2.
All three renderers were changed together, since they share the captions.
Checked on desktop in all three skins with a zero-betweenness country selected
(Hungary, 182 origins, betweenness 0); no console errors; 51 repository tests
pass.

## The second list, cleared the same day

**Section 8's duplicate scatters are gone.** `dk-scatter` and `dk-z` were
440×330 reprints of sections 3 and 4 answering no new question, and one of them
had no heading. Section 8 is now a 2×2 of the four panels that say something
about one country: in and out, through time, bridge rank (with a real heading
at last), nearest neighbours. Removed from all three renderers and from
`scripts/audit_week03.js`.

**PageRank has a view.** A slope chart in section 3 puts the world's top twelve
by people beside the top twelve by PageRank, with each country's global rank on
both sides and the lines coloured by which way it moves. The caption states
that PageRank here runs on the weighted graph, so the agreement with the people
ranking (ρ = 0.73, against ρ = 0.53 for the partner count) is close to a
tautology and the crossings are the story.

The comparison deliberately uses in-strength, not in-degree. The in-degree top
ten is Norway, Denmark, Hungary, Greece, Luxembourg, Bulgaria, Finland,
Slovakia, Iceland: countries whose population registers name every origin.
Section 8's own verdict already says so. A chart headlined "PageRank disagrees
with in-degree" would have reported a reporting artifact as a finding, which is
the bug this audit started with.

The aside answers the mechanism for any country the reader picks. A new
`pagerank_sources` field, written by `analysis/week03_corridor_control.py`,
carries the three senders that hand a country the most of its score, each with
the sender's own rank and the share of its people that came here. Saudi Arabia
holds the world's second largest foreign-born population and ranks 38th: its
biggest contributor, Bangladesh, ranks 41st and gives it 21%. Mexico is 42nd by
people and 7th here, because the United States alone hands it 90%. Regenerated
with `--reuse-null`, so every existing number, including the whole null
summary, is byte-identical.
