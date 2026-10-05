# Known bugs and failure-path changes

Copied verbatim from `knownBugsPreserved` in [plan.json](plan.json). A known file entry under
`scripts/parity/known/` cites these ids: `approvedBug` for a KB id, `fp` for an FP id. Rule R14 in
[src/lib/README.md](../../src/lib/README.md) says how to keep them.

## Known bugs (KB)

Main does these today and the rewrite keeps them, unless the entry says otherwise.

- KB01 Week 3: #net-note keeps stale text after leaving the net layer under ?variant=atlas and ?variant=deck; preserved through renderer.clearsNetNote.
- KB02 Week 3: cartography repaints only on data load and year change (renderTypology is its only caller); preserved by PAINT_TRIGGERS.
- KB03 Week 3: a map hover sets the shared hover that hist, CCDF, scatters, prestige and spotlight draw on their next repaint; preserved.
- KB04 Week 3: when a library renderer fails, the page falls back to canvas, #status shows the fallback sentence until the data summary overwrites it, and ?variant=<name> stays in the URL until the next non-reload style change drops it; preserved.
- KB05 Week 3: inspector rank spans and the z-top list use a hard-coded #7a8fac that ignores the palette; preserved (INSPECTOR_MUTE).
- KB06 Week 3: ?variant=echarts click-to-select checks in scripts/audit_week03.js fail on main; preserved, compared to main's rows.
- KB07 Week 5: the hoverTips sweep adds kit-tip-host and a tip div to every [id^=chart-] host, #chart-heaps-curve carries two tip divs, and the tip's position among the host's children depends on draw and hover history; preserved by HoverTipHost's tipAttached model.
- KB08 Week 4 (change requested, owner approval needed): skills-radar waits for #cut-skills-cluster with a 5 s fallback that skills' replaceChildren can wipe when skills.json is over 5 s slower; React renders the radar after the cluster deterministically. Normal-timing DOM is identical; the base-controls scenario with a 6 s delay shows the difference.
- KB09 Week 4: charts in closed <details> lay out at zero width until the synthetic window 'resize' dispatched on every details open; the dispatch is kept.
- KB10 Week 4: week04-place renderInspector writes #place-sel-* ids that no longer exist (dead code, no visible effect); dropped, no DOM change.
- KB11 Week 4 and 5: week04_place.json is fetched three times and the Week 5 section files twice; one request each now (invisible; head <= base).
- KB12 Week 4: #w4m-root data-want is written on METHOD routes and on w4m:show; preserved (rendered from deepDiveStore by the methods island).
- KB13 Arcade: setupChrome writes a 'The data' link to #network, a target that does not exist; preserved.
- KB14 Arcade: body.unlocked is added on the first reveal and never removed; preserved.
- KB15 Week 1: on storage failure #pack-status gets a sentence appended to its existing text; preserved.
- KB16 Styleguide: the proxy <select> without data-dimension writes body[data-undefined]; style params are always written to the URL, defaults included; preserved.
- KB17 Mockups: the server HTML keeps stale '49' counts that the script overwrites only in part; preserved.
- KB18 Play: the signal data URL comes from body[data-signal-src] without asset()'s ?v= stamp, and the map replaces the server <title>/<desc>; preserved.
- KB19 Screen-test: #vitals rows are appended without clearing (a second run would duplicate them; unreachable on a normal load); preserved.
- KB20 lobby.js is orphaned (no entry imports it); untouched because theme.test reads it; flagged for the owner.

## Failure paths (FP)

On the happy path every page equals main. Where main couples failures, the rewrite isolates each independent
chart, as the owner mandated; each place has an id here and an expected-diff entry in
`scripts/parity/known/<page>/faults-<batch>.json`.

- FP01 (failure path, isolation mandate) Week 5: week05-frame loads six files with one Promise.all (line 161), so one failure blanks the hero and all five findings; now the hero waits for fame.json and each finding for its own file.
- FP02 Week 5: week05-search awaits search.json and search_live.json together (line 119); parts that need one file now draw when it loads.
- FP03 Week 4: week04-frame loads five files with one Promise.all (line 162) for the findings minis and the opener; each now waits for its own files.
- FP04 Week 4: week04-vis-intros (lines 187, 482, 503) and week04-vis-staffing (line 377) couple figures through Promise.all; each figure now waits for its own files.
- FP05 Week 3: a throw in one renderer call stops the rest of that repaint sequence (setYear, select, restyle, resize); the engine runs each call in its own try/catch.
- FP06 Week 4: week04-place loads week04_place.json, usa.json and where_who.json with one Promise.all (line 62); charts that need fewer files now draw; #place-status keeps main's error text.
- FP07 Week 4: week04-methods loads explore.json, week04_place.json and usa.json together (line 936); #methods-status keeps main's text and panels needing fewer files draw.
- FP08 Week 3: a throw in installQuestions skipped installViews and the scroll restore; the drawers and the restore are independent now.
- FP09 All pages: the shared data cache dedupes requests, so a transient (non-repeatable) failure of a file reaches every consumer at once, where main's separate fetches might fail for one consumer only; injected faults abort every request to a URL, so both sides behave the same under faults.
- FP10 Week 3: corridor.js main() fails the whole page if any of the three required files fails (line 3404); #status keeps main's error text and charts whose RENDER_KEYS files loaded still draw.
