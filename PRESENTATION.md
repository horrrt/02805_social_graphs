# Presentation direction: The Log–Log Arcade

Make the visitor operate the evidence. Each cabinet has one question, an action
with a visible consequence, and a takeaway that can be repeated without the
calculation. This is an authored presentation scorecard, not an official judging
rubric or a claim that the site will win the competition.

## The story across the free-play concepts

1. **MARVEL-OS 303** makes the snapshot a machine. A real boot loads the local
   data, draggable windows expose named applications, and the terminal computes
   graph answers instead of displaying scripted responses. Weekly additions
   appear as installed apps and patch notes.
2. **Transit Authority** uses station closures and routes to explain connectivity.
   The map deliberately shows only 16 interchanges; every drawn segment is a real
   link. The full 303-node route planner is the analytical tool. A schematic
   crossing is not a connection. Drawing lines are not detected communities.
3. **Predict before reveal** gives each visit a reason to pay attention. A first
   guess is recorded before the explanation. Progress follows the visitor across
   the live course weeks, with free-play guesses logged separately; no account
   or public leaderboard is required.
4. **Hero Trumps** makes the definition of importance the contest. Changing from
   incoming to outgoing links reverses the Spider-Man / Betsy Braddock matchup.
   Five-card drafting teaches overlap and coverage; the greedy 184/303 reference
   is explicitly not a proven optimum.
5. **Walk / Listen** maps real random-walk visits to notes. Degree controls pitch;
   community controls a labelled synthetic voice. A silent dead end has an exact
   explanation in the step table. Seeds make a melody repeatable; WAV export
   makes it shareable.
6. **Keep It Together** makes component repair tangible. One dot represents one
   present article. Health always uses an honest percentage, so Spider-Man’s
   removal shows 98.2%, not theatrical devastation. Repairing the Rockman–Witness
   component returns two articles with one hypothetical link.

Hero Packs is the week-1 entry: five weighted draws per pack, persistent
collection, searchable cards, a linear/log–log distribution and a sketchable
histogram. Its central surprise is that familiar hubs are easy to draw. There
are 58 equally rare cards, including all 17 isolates. Finishing takes about 1,945
packs on average, not 303/5.

## Presentation and interaction criteria

| Criterion | Implementation |
| --- | --- |
| Recognizable identity | A green arcade lobby, gold card cabinet, transit signage, teal desktop, purple instrument and living graph |
| Narrative | Question → committed guess → action → result → explanation |
| Results first | Short takeaways and named consequences; calculations behind native disclosures |
| Meaningful agency | A command, closure, draft, walk or repair changes a computed answer |
| Honest uncertainty | Null draws, illustrative rewires and real structure are labelled separately |
| Clear scope | Snapshot date, graph direction, denominator and source-text boundary accompany the relevant result |
| Accessible alternatives | Names, counts, tables and paths accompany every canvas; no hover-only information |
| Keyboard and touch | Native labels and controls; window keyboard movement; stacked phone layout |
| Motion and audio control | No autoplay audio; stop/volume controls; reduced-motion support |
| Error recovery | Restore graph, undo repairs, empty search states, invalid-command guidance and load-error fallback |
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
- Five cards cannot cover 303 articles because each of 17 isolates requires a slot.
- Communities are one Louvain partition (seed 7, resolution 1), not canonical teams.
- The Notepad and TF-IDF free-play apps contain real short roster descriptions,
  not full article bodies.
- Free-play pages are experiments, not posts. Weeks 3–8 carry only the course
  title and date until their session.
- Prediction scores are a game based on normalized numerical error, not a formal
  estimate of reader calibration.

## Version 2 · the Apple edition

The design archive's concept 21, "Connections, Reconsidered", took apple.com's
iPhone page as its model. Version 2 applies that concept to every arcade page
under `/v2/`, following the three principles Apple's Human Interface Guidelines
name: clarity, deference and depth.

- **Clarity.** One type stack (SF Pro through `-apple-system`), a strict scale
  (hero 80/1.05, section 48/1.08, lead 21/1.38, body 17/1.47, caption 12), text
  `#1d1d1f`, secondary `#6e6e73`, one accent `#0071e3`, system red `#ff3b30` for
  stranded or closed. Headlines are sentence case and end with a period.
- **Deference.** White pages with `#f5f5f7` bands, hairlines instead of boxes,
  no ornament. The lobby hero shows the network itself, as the mockup does; the
  drawn arcade room stays in version 1.
- **Depth.** A translucent sticky navigation bar, rounded tiles that lift on
  hover, and a macOS-style desktop for MARVEL-OS with traffic-light window
  buttons and a translucent dock.
- **Controls.** Pill buttons, 44 px minimum targets, chevron links, accordion
  rows for evidence, native inputs tinted with `accent-color`, visible focus
  rings, reduced motion respected, and a dark appearance through
  `prefers-color-scheme`.
- **Boundaries.** Numbers, methods, limitations and AI disclosures are the same
  text as version 1. Only the presentation changes, and the tests hold both
  editions to the same schedule manifest.

## Evidence and review

The user’s remembered teacher-liked reference was **Web-Crawler by Capes & Edges**.
The inspiration is its mission-to-insight structure, not its visual treatment.
The design archive at `/mockups/` preserves the earlier alternatives.

Relevant principles are progressive disclosure, recognition over recall,
immediate feedback, consistent controls, visible state and recoverable actions.
The technical choices follow the Web Audio user-activation model and provide a
text equivalent for visual and sonic encodings:

- [W3C WAI: Complex Images](https://www.w3.org/WAI/tutorials/images/complex/)
- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [MDN: Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [NetworkX: Louvain communities](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.louvain.louvain_communities.html)

Automated tests compare graph answers against independent analysis. Browser
checks cover the primary journeys at desktop and phone widths, including
prediction persistence, card collection, window controls, closures, repair undo,
search, audio playback and WAV download. This is a practical review, not a formal
accessibility audit or teacher usability study.
