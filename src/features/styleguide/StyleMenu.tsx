"use client";
// The style menu that pages/styleguide.js wired on main: the View trigger
// opens and closes #style-bar, a click outside closes it, and the three
// dropdowns do to this page what the post's style bar does to the post: set
// data-skin, data-palette and data-tables on <body>, read first from the URL
// and written back to it on change. No script draws anything.
import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { island } from "@/lib/island";
import { useBodyDataset } from "@/lib/useBody";
import { useOutsideClose } from "@/lib/useEvents";
import { useHydrated } from "@/lib/useHydrated";

type Dimension = "skin" | "palette" | "tables";
type Values = Record<Dimension, string>;

const OPTIONS: Record<Dimension, [string, string][]> = {
  skin: [
    ["clean", "Clean"],
    ["editorial", "Editorial"],
    ["terminal", "Terminal"],
    ["poster", "Poster"],
  ],
  palette: [
    ["signal", "Signal"],
    ["ember", "Ember"],
    ["iris", "Iris"],
    ["okabe", "Okabe-Ito"],
    ["slate", "Slate"],
  ],
  tables: [
    ["rules", "Rules"],
    ["zebra", "Zebra"],
    ["cards", "Cards"],
    ["compact", "Compact"],
  ],
};
const FIELDS: [Dimension, string, string][] = [
  ["skin", "style-skin", "Skin"],
  ["palette", "style-palette", "Colours"],
  ["tables", "style-tables", "Tables"],
];
const DEFAULTS: Values = { skin: "clean", palette: "signal", tables: "rules" };

type Live = {
  open: boolean;
  values: Values;
  onToggle: () => void;
  onChange: (key: Dimension, event: ChangeEvent<HTMLSelectElement>) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  barRef: RefObject<HTMLDivElement | null>;
};

// The menu's markup; without `live` it is the server markup, uncontrolled.
function Menu({ live }: { live?: Live }) {
  return (
    <div className="style-menu" key={live ? "live" : "server"}>
      <button
        aria-controls="style-bar"
        aria-expanded={live ? live.open : false}
        className="style-trigger"
        id="style-trigger"
        type="button"
        ref={live?.triggerRef}
        onClick={live?.onToggle}
      >
        <span id="style-trigger-label">View</span>
        {" "}
        <span aria-hidden="true">▾</span>
      </button>
      <div aria-label="Page style" className="style-bar" id="style-bar" role="group" hidden={live ? !live.open : true} ref={live?.barRef}>
        <div className="style-group">
          <span className="style-group-label">Renderer</span>
          <div className="style-chips" role="group">
            <button aria-pressed="true" className="style-chip" type="button">Canvas</button>
            {" "}
            <button aria-pressed="false" className="style-chip" type="button">D3</button>
            {" "}
            <button aria-pressed="false" className="style-chip" type="button">ECharts</button>
          </div>
          <select className="style-select-proxy" tabIndex={-1} aria-hidden="true">
            <option>Canvas</option>
          </select>
        </div>
        <div className="style-group">
          <span className="style-group-label">The world</span>
          <div className="style-chips" role="group">
            <button aria-pressed="true" className="style-chip" type="button">Photographic Earth</button>
            {" "}
            <button aria-pressed="false" className="style-chip" type="button">Country outlines</button>
          </div>
        </div>
        <details className="style-more">
          <summary>More options</summary>
          <div className="style-more-grid">
            {FIELDS.map(([key, id, label]) => (
              <div className="style-field" key={key}>
                <label htmlFor={id}>{label}</label>
                {" "}
                <select
                  data-dimension={key}
                  id={id}
                  {...(live ? { value: live.values[key], onChange: (event: ChangeEvent<HTMLSelectElement>) => live.onChange(key, event) } : {})}
                >
                  {OPTIONS[key].map(([value, text]) => (
                    <option value={value} key={value}>{text}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </details>
        <p className="style-note" id="style-note">
          The same three dimensions the post offers. They set
          {" "}
          <code>data-skin</code>
          ,
          {" "}
          <code>data-palette</code>
          {" "}
          and
          {" "}
          <code>data-tables</code>
          {" "}
          on the body, exactly as the post does,
          so the whole guide repaints.
        </p>
      </div>
    </div>
  );
}

function StyleMenuView() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // The script read the URL once on load; a value the select does not offer is ignored.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const read = { ...DEFAULTS };
    for (const key of Object.keys(OPTIONS) as Dimension[]) {
      const asked = params.get(key);
      if (asked && OPTIONS[key].some(([value]) => value === asked)) read[key] = asked;
    }
    setValues(read);
  }, []);
  useBodyDataset(values ?? {}, values !== null);
  useOutsideClose([triggerRef, barRef], () => setOpen(false));

  if (!hydrated || !values) return <Menu />;
  return (
    <Menu
      live={{
        open,
        values,
        triggerRef,
        barRef,
        onToggle: () => setOpen((o) => !o),
        onChange: (key, event) => {
          const value = event.target.value;
          setValues((v) => ({ ...(v ?? DEFAULTS), [key]: value }));
          const url = new URL(window.location.href);
          url.searchParams.set(key, value);
          window.history.replaceState(null, "", url.pathname + url.search);
        },
      }}
    />
  );
}

export const StyleMenu = island("styleguide/style-bar/StyleMenu", StyleMenuView, () => <Menu />, { roots: [".style-menu"] });
