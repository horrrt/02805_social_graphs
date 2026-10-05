# W5-Z requests

W5-Z cannot close Week 5 on its own: with `src/scripts/entries/week05.js` gone, `tests/react-rules.test.mjs`
fails on every `// bridge:` and `// shim:` left under `src/features/week05/`, and the bridge's mount and the
three shims live in files W5-Z does not own. W5-Z committed nothing but this file; the entry, its ENTRIES line
and `<PageScripts page="week05" />` stay until the requests below land. Once they do, W5-Z's own part is three
edits:

- delete `src/scripts/entries/week05.js`;
- drop `"week05": () => import("@/scripts/entries/week05.js"),` from ENTRIES in `src/components/PageScripts.tsx`;
- in `src/app/(week05)/weeks/week05/page.tsx`, drop the PageScripts import and `<PageScripts page="week05" />`
  (keep the seven `{" "}` lines) and change the comment above `Page` to "One component per section in
  _sections/. Each section's islands fill its hosts and place its terms."

```diff
diff --git a/src/app/(week05)/weeks/week05/page.tsx b/src/app/(week05)/weeks/week05/page.tsx
index 52aa85c..73d5b5d 100644
--- a/src/app/(week05)/weeks/week05/page.tsx
+++ b/src/app/(week05)/weeks/week05/page.tsx
@@ -1,4 +1,3 @@
-import PageScripts from "@/components/PageScripts";
 import { PostTopbar } from "@/components/site/PostTopbar";
 import { SkipLink } from "@/components/site/SkipLink";
 import { Autocomplete } from "./_sections/Autocomplete";
@@ -14,8 +13,8 @@ import { Relations } from "./_sections/Relations";
 import { Search } from "./_sections/Search";
 import { Weird } from "./_sections/Weird";
 
-// One component per section in _sections/. Until the Week 5 close batch, the
-// legacy scripts behind <PageScripts> fill the empty hosts and place the terms.
+// One component per section in _sections/. Each section's islands fill its
+// hosts and place its terms.
 export default function Page() {
   return (
     <>
@@ -64,7 +63,6 @@ export default function Page() {
       {" "}
       {" "}
       {" "}
-      <PageScripts page="week05" />
     </>
   );
 }
diff --git a/src/components/PageScripts.tsx b/src/components/PageScripts.tsx
index a6fe235..e32744e 100644
--- a/src/components/PageScripts.tsx
+++ b/src/components/PageScripts.tsx
@@ -16,7 +16,6 @@ const ENTRIES = {
   "week02": () => import("@/scripts/entries/week02.js"),
   "week03": () => import("@/scripts/entries/week03.js"),
   "week04": () => import("@/scripts/entries/week04.js"),
-  "week05": () => import("@/scripts/entries/week05.js"),
 };
 
 export type PageName = keyof typeof ENTRIES;
```

What the test printed with the entry deleted and nothing else changed:

```
src/features/week05/frame/OwnedHost.tsx: `// shim:` is allowed only under src/features/<page>/ while the page's entry exists
src/features/week05/frame/hovertips-compat.js: `// bridge:` is allowed only under src/features/<page>/ while the page's entry exists
src/features/week05/map/NetworkView.tsx: `// shim:` is allowed only under src/features/<page>/ while the page's entry exists
src/features/week05/map/NetworkView.tsx: writes the DOM with .setAttribute(
src/features/week05/relations/VerdictConcordance.tsx: `// shim:` is allowed only under src/features/<page>/ while the page's entry exists
```

## 1. Remove the hover-tip compat island and its mount

**Status:** open.

**Files:** `src/features/week05/frame/Frame.tsx` (W5-1), `src/app/(week05)/weeks/week05/_sections/Hero.tsx`
(W5-1), and delete `src/features/week05/frame/hovertips-compat.js` (W5-Z owns it, but it cannot go before its
importer changes).

**Why.** The W5-Z spec says to delete hovertips-compat.js and its call. W5-1 put the call (`HoverTipsCompat`, an
island in Frame.tsx) and its mount (Hero.tsx) in files W5-Z does not own. The sweep is already a no-op: every
`[id^="chart-"]` host on the page is drawn by a W5-1/2/3 island and marked through `useOwnedRef`
(HOVERTIPS.md lists all eleven), and the legacy modules no longer draw anything.

**Patch.**

```diff
diff --git a/src/app/(week05)/weeks/week05/_sections/Hero.tsx b/src/app/(week05)/weeks/week05/_sections/Hero.tsx
index 0f93cdc..afb1396 100644
--- a/src/app/(week05)/weeks/week05/_sections/Hero.tsx
+++ b/src/app/(week05)/weeks/week05/_sections/Hero.tsx
@@ -1,10 +1,9 @@
 import { HeroStat } from "@/components/post/HeroStat";
 import { PostHero } from "@/components/post/PostHero";
-import { Frame, HoverTipsCompat } from "@/features/week05/frame/Frame";
+import { Frame } from "@/features/week05/frame/Frame";
 
 // Hero: the post's question, the scope caution, two numbers and the fame scatter (#chart-hero-fame,
-// drawn by the frame island). HoverTipsCompat gives the chart hosts the old scripts still draw their
-// hover tips; it renders nothing.
+// drawn by the frame island).
 export function Hero() {
   return (
     <>
@@ -42,7 +41,6 @@ export function Hero() {
           </figcaption>
         </figure>
       </PostHero>
-      <HoverTipsCompat />
     </>
   );
 }
diff --git a/src/features/week05/frame/Frame.tsx b/src/features/week05/frame/Frame.tsx
index 88bab31..0461c3a 100644
--- a/src/features/week05/frame/Frame.tsx
+++ b/src/features/week05/frame/Frame.tsx
@@ -1,7 +1,6 @@
 "use client";
 // Week 5's frame: the hero scatter (#chart-hero-fame) and the findings minis
-// (#findings [data-finding]), which week05-frame.js drew on main, and the
-// hover-tip sweep it ran over the page's other chart hosts. Each host renders
+// (#findings [data-finding]), which week05-frame.js drew on main. Each host renders
 // as the server did until hydrated. The hero then becomes a HoverTipHost as
 // main's sweep left it (the class and a hidden tip) and, once fame.json has
 // loaded, draws the scatter from fameLayout(), which empties the host of its
@@ -20,7 +19,6 @@ import { useFittedWidth } from "@/lib/useSize";
 import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
 import { asset } from "@/scripts/site.js";
 import { FINDING_FILES, NO_GUESSES, fameLayout, strips } from "@/scripts/week05-frame.js";
-import { sweepHoverTips } from "./hovertips-compat.js";
 import { OwnedHost } from "./OwnedHost";
 
 const file = (name: string) => asset(`weeks/week05/data/${name}.json`);
@@ -183,18 +181,3 @@ function Placeholder({ part }: Props) {
 export const Frame = island("week05/frame/Frame", View, Placeholder, {
   roots: ["#chart-hero-fame", "#findings [data-finding]"],
 });
-
-// ---- the hover-tip sweep -------------------------------------------------------
-
-function Compat() {
-  useEffect(() => {
-    sweepHoverTips();
-  }, []);
-  return null;
-}
-
-const Nothing = () => null;
-
-// A service island: it renders nothing, and the chart hosts the old scripts
-// draw lose their tips when it fails.
-export const HoverTipsCompat = island("week05/frame/HoverTipsCompat", Compat, Nothing, { roots: "none", affects: "page" });
```

and `git rm src/features/week05/frame/hovertips-compat.js`.

**Checked.** With this patch and the three entry edits above applied together (W5-Z's working tree, not
committed), on a build with `GITHUB_SHA=parity00000` against main d52830f:

- `npm run typecheck`: clean.
- `static.mjs`: 16 pages, 0 differ, 0 grew over 2% (week05 HTML 136.2 -> 138.6 KB, +1.8%).
- `runtime.mjs --pages week05`: base, base-tips, K2 and W5-1 ok; W5-2 (1..40, 41..80, 81..113) and W5-3
  (1..40, 41..80, 81..120, 121..164) ok with `--runs 3`, as their headers say to run them. One W5-3 41..80 run
  showed DIFF 2 at step 42 (the hover tip read a different dot: head "Isaiah Bradley ×3.7", "Miracleman ×7.9");
  the same range passed on rerun and step 42 passed in the plain run of 1..55, so it is a hover-timing flake.
- `faults.mjs --data` (`--shard 1/6` to `6/6`): all 11 week05 data and vendor files ok, each expected diff from
  faults-W5-1.json or faults-W5-3.json.
- `faults.mjs --islands week05 --modes render,effect` (`--shard 1/3` to `3/3`): 74 faults, all ok.
- `node --test tests/page-modules.test.mjs`: 3 of 3 pass, anchor liveness 4 of 25 active (the three
  week05-weird.js anchors and week05-map.js `n.name,`); `pageScripts("week05")` lists every week05-<section>.js,
  week05-frame.js and week05-map.js; `runtime.mjs --check-known week05`: ok.
- `tests/react-rules.test.mjs`: fails only on the four shim lines above, which item 2 removes.

## 2. Land the open W5-1 and W5-2 kit requests and delete the three shims

**Status:** open; waits on `requests/W5-1.md` (1) and (2) and `requests/W5-2.md` (1), (2) and (4).

**Files:** `src/kit/HoverTipHost.tsx`, `src/kit/NetworkView.tsx`, `src/kit/Concordance.tsx` (K1b/K2), then the
Week 5 islands that import the shims (W5-1, W5-2).

**Why.** Recipe Z2 and `requests/README.md` remove shims "at the latest by the page's close batch", and
react-rules allows `// shim:` only while the page's entry exists. Deleting these shims means changing `src/kit`,
which W5-Z does not own:

- `src/features/week05/frame/OwnedHost.tsx` (`// shim: W5-1`) until W5-1 (1) and (2) land in HoverTipHost;
- `src/features/week05/map/NetworkView.tsx` (`// shim: W5-2`) until W5-2 (1) and (4) land in kit NetworkView;
  the same file is the one react-rules flags for `.setAttribute(`, which kit's `// surface:` copy may do;
- `src/features/week05/relations/VerdictConcordance.tsx` (`// shim: W5-2`) until W5-2 (2) gives Concordance its
  `extra` cells.

After those land and the islands import from `@/kit`, rerun W5-Z.
