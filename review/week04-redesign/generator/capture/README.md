# Capturing the site as canvas boards

The Week 5, network-view and template pages of the redesign canvas are the live site's own markup, captured
after its scripts have drawn every chart. To redo them after the site changes:

1. `python review/week04-redesign/generator/capture/make_capture.py` writes copies of the week 5 page, the
   post template and the kit styleguide to `docs/_snap/`, which is ignored and never published. Each copy
   runs animation frames and resize observations on timers, so charts reach their real width even in a
   hidden browser tab.
2. Serve `docs/` (`python3 -m http.server 8767 --directory docs`) and start the receiver:
   `python review/week04-redesign/generator/capture/receive.py`.
3. Open a copy at 1440 px wide, for example `http://localhost:8767/_snap/week05.html`, and in its console:
   `eval(await (await fetch('/_snap/capture.js')).text()); await __capture([{ name: "W5Top", ids: ["top", "findings"], hero: true }])`.
   Each board is the top bar plus the named elements, measured at 1440 px; `open: true` opens its drawers.
   The receiver writes `build/canvas-capture/<name>.json`.
4. Read the canvas's `project/canvas.json`, then run `assemble_boards.py <that file> <folder>` and publish the
   folder's `project/` files to the canvas in one call. It adds pages and boards and keeps every other entry.
5. Copy the published boards and `canvas.json` into `review/week04-redesign/boards/`, as they are, and delete
   `docs/_snap/`: the site tests walk every page under `docs/`, ignored or not.

The boards link the site stylesheets as canvas uploads; `assemble_boards.py` names their `/_blob/` urls.
