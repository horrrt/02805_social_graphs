"use client";
// The page's loading line (#app-status) and deep links into disclosures, as
// cabinet.js setupChrome() and errorMessage() ran them on main. The line hides
// once both data files are in; a failed file shows main's error as an alert
// and unlocks the page. A hash on load, a hashchange or a same-page link
// opens every <details> around its target; once the data is in (and the
// controls above may have moved it) the target is scrolled to again.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useDocumentEvent } from "@/lib/useEvents";
import { revealHashTarget } from "@/scripts/cabinet.js";
import { LOAD_ERROR, useArcade } from "./data";
import { unlock } from "./store.js";

type Props = { file: string };

function StatusHost(_: Props) {
  return (
    <p className="status" id="app-status" role="status">
      Loading the frozen snapshot…
    </p>
  );
}

function StatusView({ file }: Props) {
  const { graph, failed } = useArcade(file);
  const ready = graph !== null;
  useIslandReady(ready || failed);

  useEffect(() => {
    revealHashTarget();
    const controller = new AbortController();
    window.addEventListener("hashchange", () => revealHashTarget(), { signal: controller.signal });
    return () => controller.abort();
  }, []);

  useDocumentEvent("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href);
    if (target.origin === location.origin && target.pathname === location.pathname && target.search === location.search) revealHashTarget(target.hash);
  });

  useEffect(() => {
    if (!ready) return;
    let live = true;
    document.fonts.ready.then(() => {
      if (live) revealHashTarget(location.hash, true);
    });
    return () => {
      live = false;
    };
  }, [ready]);

  useEffect(() => {
    if (failed) unlock();
  }, [failed]);

  if (failed)
    return (
      <p className="status" id="app-status" role="alert">
        {LOAD_ERROR}
      </p>
    );
  return (
    <p className="status" id="app-status" role="status" hidden={ready}>
      Loading the frozen snapshot…
    </p>
  );
}

export const AppStatus = island("arcade/status/Status", StatusView, StatusHost, { roots: ["#app-status"] });
