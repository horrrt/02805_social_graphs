"use client";
// The design review's controls, which mockups.js wired on main: the filters
// and shortlist (shown only with JavaScript), the counts and status lines,
// each card's favourite button, the empty-shortlist note and the full-page
// viewer. Every island shows its server markup until the concepts are read.
import { Fragment, useEffect, useRef, type RefObject } from "react";
import { island } from "@/lib/island";
import { useBodyClass } from "@/lib/useBody";
import { useStore } from "@/lib/useStore";
import {
  FILTERS,
  chooseFilter,
  closeMockup,
  closed,
  copyLink,
  copyShortlist,
  imageFailed,
  init,
  onPopState,
  readHash,
  review,
  showAll,
  step,
  toggleFavourite,
  toggleFit,
  visibleCount,
  visibleText,
} from "./store.js";

type Mockup = {
  number: number;
  name: string;
  image: string;
  width: number;
  height: number;
  inspiration?: string;
  referenceUrl?: string;
  collection: string;
  kind?: string;
  alt?: string;
  rationaleLabel?: string;
  uxSummary?: string;
  reviewNote?: string;
  correctionNotice?: string;
  uxSources?: { title: string; url: string }[];
};
type State = {
  list: Mockup[];
  ready: boolean;
  favourites: number[];
  filter: string;
  currentId: number | null;
  open: boolean;
  opens: number;
  fitPage: boolean;
  scrolls: number;
  status: string;
  viewerStatus: string;
  fallback: { main: string | null; viewer: string | null };
  focus: { target: string | null; n: number };
};

const all = (s: State) => s;
const useReview = () => useStore(review, all) as State;

// ---- the service island: read the concepts, then follow the URL -------------------

function InitView() {
  useEffect(() => {
    init();
    const controller = new AbortController();
    window.addEventListener("hashchange", readHash, { signal: controller.signal });
    window.addEventListener("popstate", onPopState, { signal: controller.signal });
    return () => controller.abort();
  }, []);
  return null;
}
export const ReviewInit = island("mockups/review/Init", InitView, () => null, { roots: "none", affects: "page" });

// ---- filters and shortlist -----------------------------------------------------------

const LABELS: Record<string, [string, number]> = {
  all: ["All", 48],
  "data-stories": ["Data stories", 3],
  disney: ["Modern Disney", 3],
  netflix: ["Netflix", 4],
  marvel: ["Marvel", 1],
  comedy: ["Comic & comedy", 8],
  ux: ["UX principles", 3],
  reference: ["Reference inspired", 6],
  original: ["Original ideas", 20],
  saved: ["My shortlist", 0],
};

function ToolsMarkup({ s }: { s?: State }) {
  const ready = Boolean(s?.ready);
  const filter = s?.filter ?? "all";
  const count = (f: string) => {
    if (!s?.ready) return LABELS[f][1];
    if (f === "saved") return s.favourites.length;
    return f === "all" ? s.list.length : s.list.filter((m) => m.collection === f).length;
  };
  const filterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const focus = s?.focus;
  useEffect(() => {
    if (focus?.target === "first-filter") filterRefs.current.all?.focus();
    if (focus?.target === "saved-filter") filterRefs.current.saved?.focus();
    // One focus per request.
  }, [focus?.n]);
  const fallback = s?.fallback.main ?? null;
  useEffect(() => {
    if (fallback === null) return;
    fieldRef.current?.focus();
    fieldRef.current?.select();
  }, [fallback]);
  return (
    <section className="review-tools" aria-label="Review controls" data-js-only="" hidden={!ready}>
      <div className="tools-row">
        <div className="filters" role="group" aria-label="Filter mockups">
          {FILTERS.map((f, i) => (
            <Fragment key={f}>
              {i > 0 && " "}
              <button
                type="button"
                className="review-button"
                data-filter={f}
                aria-pressed={f === filter ? "true" : "false"}
                ref={(el) => {
                  filterRefs.current[f] = el;
                }}
                onClick={ready ? () => chooseFilter(f) : undefined}
              >
                {LABELS[f][0]}
                {" "}
                <span className="filter-count" id={f === "saved" ? "shortlist-count" : undefined}>{count(f)}</span>
              </button>
            </Fragment>
          ))}
        </div>
        <div className="shortlist-actions">
          <button type="button" className="review-button primary" id="copy-shortlist" disabled={!ready || s?.favourites.length === 0} onClick={copyShortlist}>Copy shortlist</button>
        </div>
      </div>
      <div className="copy-fallback" id="copy-fallback" hidden={fallback === null}>
        <label htmlFor="shortlist-text">Copy this shortlist and paste it into chat.</label>
        <textarea id="shortlist-text" readOnly value={fallback ?? ""} ref={fieldRef} />
      </div>
    </section>
  );
}

function ToolsView() {
  const s = useReview();
  return <ToolsMarkup s={s} />;
}
export const Tools = island("mockups/review/Tools", ToolsView, () => <ToolsMarkup />, { roots: [".review-tools"] });

// ---- counts, status and the empty shortlist ------------------------------------------------

function SummaryMarkup({ s }: { s?: State }) {
  const ready = Boolean(s?.ready);
  const n = s?.favourites.length ?? 0;
  return (
    <div className="review-summary">
      <p id="visible-count">{s?.ready ? visibleText(s) : "Showing 48 of 48 visual concepts"}</p>
      <p id="shortlist-hint" data-js-only="" hidden={!ready}>
        {ready && n ? `${n} saved. Copy your shortlist, then paste it into chat.` : "Save favourites to make a shortlist. Choices stay in this browser."}
      </p>
    </div>
  );
}
export const Summary = island("mockups/review/Summary", () => <SummaryMarkup s={useReview()} />, () => <SummaryMarkup />, { roots: [".review-summary"] });

function StatusMarkup({ s }: { s?: State }) {
  return <p className="sr-only" id="review-status" role="status" aria-live="polite" aria-atomic="true">{s?.status ?? ""}</p>;
}
export const Status = island("mockups/review/Status", () => <StatusMarkup s={useReview()} />, () => <StatusMarkup />, { roots: ["#review-status"] });

function EmptyMarkup({ s }: { s?: State }) {
  return (
    <section className="empty-shortlist" id="empty-shortlist" hidden={!s?.ready || visibleCount(s) !== 0}>
      <h2>Your shortlist starts here.</h2>
      <p>
        Save any design that catches your eye. Then copy your shortlist and paste it into chat so we know which ones you mean.
      </p>
      <button className="review-button primary" type="button" id="show-all" onClick={s?.ready ? showAll : undefined}>Browse all 49</button>
    </section>
  );
}
export const EmptyShortlist = island("mockups/review/EmptyShortlist", () => <EmptyMarkup s={useReview()} />, () => <EmptyMarkup />, { roots: ["#empty-shortlist"] });

// ---- favourite buttons -------------------------------------------------------------------

/** The state every favourite button carries once the shortlist is read (mockups.js syncFavourites()). */
function favouriteProps(s: State | undefined, id: number | null) {
  if (!s?.ready) return { "aria-pressed": "false" as const, children: "Save favourite" };
  const saved = id !== null && s.favourites.includes(id);
  return {
    "aria-pressed": saved ? ("true" as const) : ("false" as const),
    "aria-label": `${saved ? "Remove" : "Save"} mockup ${id} ${saved ? "from" : "to"} favourites`,
    children: saved ? "Saved" : "Save favourite",
    onClick: () => {
      if (id !== null) toggleFavourite(id);
    },
  };
}

function FavouriteMarkup({ n, s }: { n: number; s?: State }) {
  return <button className="review-button" type="button" data-favourite={n} data-js-only="" hidden={!s?.ready} {...favouriteProps(s, n)} />;
}
export const Favourite = island("mockups/review/Favourite", ({ n }: { n: number }) => <FavouriteMarkup n={n} s={useReview()} />, ({ n }: { n: number }) => <FavouriteMarkup n={n} />, {
  roots: [".card-actions [data-favourite]"],
});

// ---- the viewer --------------------------------------------------------------------------

function ViewerMarkup({ s, dialogRef, canvasRef, linkRef }: {
  s?: State;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  canvasRef?: RefObject<HTMLDivElement | null>;
  linkRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const id = s?.currentId ?? null;
  const m = id !== null ? s?.list.find((x) => x.number === id) : undefined;
  const data = m?.kind === "data-visualization";
  const position = m && s ? s.list.findIndex((x) => x.number === id) : -1;
  let origin = "";
  if (m) {
    origin = "Original direction";
    if (data) origin = "Data visualization · verified source data";
    else if (m.collection === "ux") origin = "UX principles";
    else if (m.inspiration) origin = `${m.inspiration} inspired`;
  }
  const sources = m?.uxSources ?? [];
  const fit = Boolean(s?.fitPage);
  const live = Boolean(s?.ready);
  return (
    <dialog
      className="mockup-viewer"
      id="mockup-viewer"
      aria-labelledby="viewer-title"
      aria-describedby="viewer-note"
      ref={dialogRef}
      onClose={live ? closed : undefined}
      onKeyDown={
        live
          ? (event) => {
              if ((event.target as Element).matches("textarea, input") || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
              if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
              if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
            }
          : undefined
      }
    >
      <header className="viewer-head">
        <div className="viewer-heading">
          <div>
            <h2 id="viewer-title">{m ? `${String(m.number).padStart(2, "0")} · ${m.name}` : "Full-page mockup"}</h2>
            <p>
              <span id="viewer-origin">{origin}</span>
              {" "}
              <a id="viewer-reference" href={m?.referenceUrl || "#"} target="_blank" rel="noopener" hidden={!m?.referenceUrl}>Visual reference ↗</a>
            </p>
          </div>
          <button type="button" className="review-button" id="close-viewer" autoFocus onClick={live ? closeMockup : undefined}>Close</button>
        </div>
        <div className="viewer-controls">
          <button type="button" className="review-button" id="previous-mockup" aria-label="Previous mockup" disabled={m ? position === 0 : undefined} onClick={live ? () => step(-1) : undefined}>← Previous</button>
          <span className="viewer-position" id="viewer-position">{m && s ? `${position + 1} / ${s.list.length}` : "1 / 49"}</span>
          <button type="button" className="review-button" id="next-mockup" aria-label="Next mockup" disabled={m && s ? position === s.list.length - 1 : undefined} onClick={live ? () => step(1) : undefined}>Next →</button>
          <button type="button" className="review-button" id="fit-page" aria-pressed={fit ? "true" : "false"} onClick={live ? toggleFit : undefined}>{fit ? "Read at full width" : "Fit whole page"}</button>
          <button type="button" className="review-button" id="viewer-favourite" data-favourite="" {...favouriteProps(s, id)} />
          <button type="button" className="review-button" id="copy-mockup-link" onClick={live ? copyLink : undefined}>Copy link</button>
          <a className="review-button" id="open-image" href={m ? m.image : "images/01-control-room.webp"} target="_blank" rel="noopener">Open image ↗</a>
        </div>
      </header>
      <div
        className={fit ? "viewer-canvas fit-page" : "viewer-canvas"}
        id="viewer-canvas"
        tabIndex={0}
        role="region"
        aria-label={data ? "Data visualization; scroll to inspect the figure" : "Full-page design; scroll to read the complete page"}
        ref={canvasRef}
      >
        {m ? (
          <img
            id="viewer-image"
            alt={m.alt || `Complete page for mockup ${m.number}: ${m.name}. ${m.collection === "ux" ? "UX principles" : m.inspiration || "Original direction"}.`}
            decoding="async"
            src={m.image}
            width={m.width}
            height={m.height}
            onError={imageFailed}
          />
        ) : (
          <img id="viewer-image" alt="" decoding="async" />
        )}
      </div>
      <footer className="viewer-foot">
        <p className="ux-review-note" id="viewer-correction" hidden={!m?.correctionNotice}>{m?.correctionNotice || ""}</p>
        <details className="ux-rationale" id="viewer-rationale" hidden={!m?.uxSummary} key={s?.opens ?? 0}>
          <summary id="viewer-rationale-label">{m?.rationaleLabel || "UX rationale & review notes"}</summary>
          <p id="viewer-ux-summary">{m?.uxSummary || ""}</p>
          <p className="ux-sources" id="viewer-ux-sources" hidden={m ? !sources.length : undefined}>
            {sources.map((source, index) => (
              <Fragment key={index}>
                {index ? " · " : null}
                <a href={source.url} target="_blank" rel="noopener">{source.title}</a>
              </Fragment>
            ))}
          </p>
          <p className="ux-review-note" id="viewer-review-note">{m?.reviewNote ? `Before implementation: ${m.reviewNote}` : ""}</p>
        </details>
        <p id="viewer-note">
          {m
            ? data
              ? "Exact data figure · proposed interactions are described in the review notes. Use arrow keys to move between concepts; Escape to close."
              : "Design concept · illustrative network and generated labels. Use arrow keys to move between mockups; Escape to close."
            : "Design concept · illustrative network and generated labels. Use arrow keys to move between mockups; Escape closes the viewer."}
        </p>
        <p className="viewer-status" id="viewer-status" role="status" aria-live="polite" aria-atomic="true">{s?.viewerStatus ?? ""}</p>
        <div className="copy-fallback" id="viewer-copy-fallback" hidden={(s?.fallback.viewer ?? null) === null}>
          <label htmlFor="mockup-link-text">Copy this link to share the current mockup.</label>
          <textarea id="mockup-link-text" readOnly value={s?.fallback.viewer ?? ""} ref={linkRef} />
        </div>
      </footer>
    </dialog>
  );
}

function ViewerView() {
  const s = useReview();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLTextAreaElement>(null);
  useBodyClass("viewer-open", s.open);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (s.open && !dialog.open) dialog.showModal();
    else if (!s.open && dialog.open) dialog.close();
  }, [s.open]);
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.scrollTop = 0;
  }, [s.scrolls]);
  const fallback = s.fallback.viewer;
  useEffect(() => {
    if (fallback === null) return;
    linkRef.current?.focus();
    linkRef.current?.select();
  }, [fallback]);
  return <ViewerMarkup s={s} dialogRef={dialogRef} canvasRef={canvasRef} linkRef={linkRef} />;
}
export const Viewer = island("mockups/review/Viewer", ViewerView, () => <ViewerMarkup />, { roots: ["#mockup-viewer"] });
