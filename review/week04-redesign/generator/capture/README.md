# Capturing the site as canvas boards

The Week 5, network-view and template pages of the redesign canvas are the live site's own markup, captured
after its scripts have drawn every chart. To redo them after the site changes:

1. `npm run build`, then `python review/week04-redesign/generator/capture/make_capture.py` writes copies of
   the built week 5 page, post template and kit styleguide to `out/_snap/`, which the next build wipes. Each copy
   runs animation frames and resize observations on timers, so charts reach their real width even in a
   hidden browser tab.
2. Serve the build (`npm run preview`, port 8767) and start the receiver:
   `python review/week04-redesign/generator/capture/receive.py`.
3. Open a copy at 1440 px wide, for example `http://127.0.0.1:8767/02805_social_graphs/_snap/week05.html`, and
   in its console: `eval(await (await fetch('/02805_social_graphs/_snap/capture.js')).text()); await __capture([{ name: "W5Top", ids: ["top", "findings"], hero: true }])`.
   Each board is the top bar plus the named elements, measured at 1440 px; `open: true` opens its drawers.
   The receiver writes `build/canvas-capture/<name>.json`.
4. Read the canvas's `project/canvas.json`, then run `assemble_boards.py <that file> <folder>` and publish the
   folder's `project/` files to the canvas in one call. It adds pages and boards and keeps every other entry.
5. Copy the published boards and `canvas.json` into `review/week04-redesign/boards/`, as they are.

The boards link the site stylesheets as canvas uploads; `assemble_boards.py` names their `/_blob/` urls.
