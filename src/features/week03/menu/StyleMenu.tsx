"use client";
// The style menu in the top bar (week03-boot.js wireMenu and renderBar on
// main): a trigger that opens a bar of the eleven style dimensions. Renderer
// and basemap are chips, each with a hidden select that mirrors it; the rest
// are dropdowns under "More options". A click outside or Escape closes it.
// Every choice is a URL parameter. The renderer reloads the page, keeping the
// scroll position; the rest go to the store and repaint in place.
import { Fragment, useRef, useState } from "react";
import { island } from "@/lib/island";
import { useOutsideClose } from "@/lib/useEvents";
import { ARC_STYLES, EARTH_SIZES } from "@/scripts/corridor.js";
import { CHIP_KEYS, DIMENSIONS, kb, styleURL } from "@/scripts/week03-boot.js";
import { corridor, useCorridor, type Style } from "../frame/shared";
import { CLIENT_IDS } from "./ids";

type Meta = { label: string; bytes?: number };
type Dimension = { key: keyof Style; label: string; options: Record<string, Meta>; fallback: string; reloads?: boolean };
const ALL = DIMENSIONS as Dimension[];

// A line style or an earth size is offered only if the renderers have a spec
// for it in corridor.js; every other dimension offers all its choices.
const SPECS: Partial<Record<keyof Style, Record<string, unknown>>> = { arcs: ARC_STYLES, earth: EARTH_SIZES };
const choices = (dimension: Dimension) =>
  Object.entries(dimension.options).filter(([value]) => !SPECS[dimension.key] || value in SPECS[dimension.key]!);

function choose(style: Style, key: keyof Style, value: string) {
  const chosen = { ...style, [key]: value };
  const url = styleURL(chosen);
  if (ALL.find((d) => d.key === key)?.reloads) {
    // Swapping the drawing library mid-flight would leave half the page in
    // the old renderer's DOM, so this one dimension reloads. Carry the scroll
    // position across, or the reader is thrown back to the top for a change
    // they made halfway down.
    try {
      sessionStorage.setItem("week03-scroll", String(window.scrollY));
    } catch {
      // Private mode: the reader lands at the top, which is the old behaviour.
    }
    window.location.assign(url.pathname + url.search);
    return;
  }
  window.history.replaceState(null, "", url.pathname + url.search);
  corridor.setState({ style: chosen });
}

function Options({ dimension }: { dimension: Dimension }) {
  return (
    <>
      {choices(dimension).map(([value, meta]) => (
        <option key={value} value={value}>
          {`${meta.label}${meta.bytes ? ` · ${kb(meta.bytes)}` : ""}`}
        </option>
      ))}
    </>
  );
}

function Bar({ style }: { style: Style }) {
  const pick = (key: keyof Style, value: string) => choose(style, key, value);
  return (
    <>
      {ALL.filter((d) => CHIP_KEYS.has(d.key)).map((dimension) => (
        <div className="style-group" key={dimension.key}>
          <span className="style-group-label">{dimension.label}</span>
          <div className="style-chips" role="group" data-dimension={dimension.key} aria-label={dimension.label}>
            {Object.entries(dimension.options).map(([value, meta]) => (
              <button
                key={value}
                type="button"
                className="style-chip"
                data-value={value}
                aria-pressed={String(value === style[dimension.key]) as "true" | "false"}
                onClick={() => pick(dimension.key, value)}
              >
                {meta.label}
              </button>
            ))}
          </div>
          <select
            id={`style-${dimension.key}`}
            data-dimension={dimension.key}
            className="style-select-proxy"
            tabIndex={-1}
            aria-hidden="true"
            value={style[dimension.key]}
            onChange={(e) => pick(dimension.key, e.target.value)}
          >
            <Options dimension={dimension} />
          </select>
        </div>
      ))}
      <details className="style-more">
        <summary>More options</summary>
        <div className="style-more-grid">
          {ALL.filter((d) => !CHIP_KEYS.has(d.key)).map((dimension) => (
            <div className="style-field" key={dimension.key}>
              {dimension.key === "earth" ? (
                <Fragment>
                  <label htmlFor={CLIENT_IDS.styleEarth}>{dimension.label}</label>
                  <select
                    id={CLIENT_IDS.styleEarth}
                    data-dimension={dimension.key}
                    value={style[dimension.key]}
                    onChange={(e) => pick(dimension.key, e.target.value)}
                  >
                    <Options dimension={dimension} />
                  </select>
                </Fragment>
              ) : (
                <Fragment>
                  <label htmlFor={`style-${dimension.key}`}>{dimension.label}</label>
                  <select
                    id={`style-${dimension.key}`}
                    data-dimension={dimension.key}
                    value={style[dimension.key]}
                    onChange={(e) => pick(dimension.key, e.target.value)}
                  >
                    <Options dimension={dimension} />
                  </select>
                </Fragment>
              )}
            </div>
          ))}
        </div>
      </details>
    </>
  );
}

function StyleMenuView() {
  const style = useCorridor((s) => s.style);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useOutsideClose([menu], () => setOpen(false), { escape: true });
  return (
    <div className="style-menu" ref={menu}>
      <button
        aria-controls="style-bar"
        aria-expanded={open ? "true" : "false"}
        className="style-trigger"
        id="style-trigger"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <span id="style-trigger-label">{style ? "Views" : "View"}</span>
        {" "}
        <span aria-hidden="true">▾</span>
      </button>
      <div aria-label="Page style" className="style-bar" id="style-bar" role="group" hidden={!open}>
        {style ? <Bar style={style} /> : null}
      </div>
    </div>
  );
}

function StyleMenuPlaceholder() {
  return (
    <div className="style-menu">
      <button aria-controls="style-bar" aria-expanded="false" className="style-trigger" id="style-trigger" type="button">
        <span id="style-trigger-label">View</span>
        {" "}
        <span aria-hidden="true">▾</span>
      </button>
      <div aria-label="Page style" className="style-bar" id="style-bar" role="group" hidden></div>
    </div>
  );
}

export const StyleMenu = island("week03/menu/StyleMenu", StyleMenuView, StyleMenuPlaceholder, { roots: [".style-menu"], affects: "page" });
