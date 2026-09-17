# Presentation direction: The Log–Log Arcade

Make the visitor operate the evidence. Each weekly post has one question, an action
with a visible consequence, and a takeaway that can be repeated without the
calculation. This is an authored presentation scorecard, not an official judging
rubric or a claim that the site will win the competition.

## The story across the posts

1. **Hero Packs** is the week-1 entry: five weighted draws per pack, a persistent
   collection, searchable cards, a linear/log–log distribution and a sketchable
   histogram. Its central surprise is that familiar hubs are easy to draw. There
   are 58 equally rare cards, including all 17 isolates. Finishing takes about
   1,945 packs on average, not 303/5.
2. **Transit Authority** uses station closures and routes to explain connectivity.
   The map deliberately shows only 16 interchanges; every drawn segment is a real
   link. The full 303-node route planner is the analytical tool. A schematic
   crossing is not a connection. Drawing lines are not detected communities.
3. **Corridor Control** puts two country networks side by side, ranks corridors by
   weighted betweenness and checks the ranking against a degree-preserving null.
4. **Predict before reveal** gives each visit a reason to pay attention. A first
   guess is recorded before the explanation. Progress follows the visitor across
   the live course weeks; no account or public leaderboard is required.

The earlier free-play experiments (MARVEL-OS 303, Hero Trumps, Walk / Listen,
Keep It Together and the OS apps) have been removed from the site.

## Presentation and interaction criteria

| Criterion | Implementation |
| --- | --- |
| Recognizable identity | A green arcade lobby, gold card cabinet, transit signage and corridor map |
| Narrative | Question → committed guess → action → result → explanation |
| Results first | Short takeaways and named consequences; calculations behind native disclosures |
| Meaningful agency | A closure, draft or corridor filter changes a computed answer |
| Honest uncertainty | Null draws, illustrative rewires and real structure are labelled separately |
| Clear scope | Snapshot date, graph direction, denominator and source-text boundary accompany the relevant result |
| Accessible alternatives | Names, counts, tables and paths accompany every canvas; no hover-only information |
| Keyboard and touch | Native labels and controls; window keyboard movement; stacked phone layout |
| Error recovery | Restore graph, empty states and a load-error fallback |
| Persistence | Local first-guess log and card collection; explicit reset/download; no uploaded visitor data |
| Reliability | Native modules, local fonts and data; no keys, live API or external runtime dependency |

## Boundaries that must remain visible

- A Wikipedia hyperlink is not a social relationship or a strength score.
- The roster includes 17 isolates. Never build the node set only from edges.
- Degree distributions alone do not establish a power law.
- Week-2 removal findings use the 277-node undirected core, then 276 remaining
  nodes. Stranded nodes can form groups; they are not necessarily individual isolates.
- The recorded null networks start connected and retain degrees. Interactive
  connected edge swapping is a separate demonstration, not a formal ensemble test.
- Weeks 4–8 carry only the course title and date until their session.
- Prediction scores are a game based on normalized numerical error, not a formal
  estimate of reader calibration.

## Evidence and review

The user’s remembered teacher-liked reference was **Web-Crawler by Capes & Edges**.
The inspiration is its mission-to-insight structure, not its visual treatment.
The design archive at `/mockups/` preserves the earlier alternatives.

Relevant principles are progressive disclosure, recognition over recall,
immediate feedback, consistent controls, visible state and recoverable actions.
Every canvas carries a text equivalent:

- [W3C WAI: Complex Images](https://www.w3.org/WAI/tutorials/images/complex/)
- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

Automated tests compare graph answers against independent analysis. Browser
checks cover the primary journeys, including prediction persistence, card
collection and station closures. This is a practical review, not a formal
accessibility audit or teacher usability study.

## Guided weekly posts

Each post leads with the question, one interaction, findings and a takeaway.
Reading the post does not require a prediction. Full analyses, methods and
disclosures remain in labelled expandable sections. Fragment links open the
containing sections, preserving access from existing URLs.

The homepage leads with published posts. Upcoming weeks are collapsed.
