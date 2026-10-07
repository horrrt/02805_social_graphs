"use client";
// The deep dive's "Who filed, and for which roles?" card (#roles-card), which
// week04-roles.js drew on main once #cut-roles first opened: a stacked-area
// chart of certified filings split by role, occupation group, employer or
// placement, on a count or 100% scale, over full years or October to June;
// a legend that hides and traces series; and the answer, notice, summary
// and drawers that follow the view.
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { SegmentedControl } from "@/components/post/SegmentedControl";
import { TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import type { EChartsInstance } from "@/lib/useEChart";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import { ROLES_TOKENS, START_HIDDEN, colourOf, rolesOption, rolesReveal, rolesText, seriesOf } from "@/scripts/week04-roles.js";
import { W4Chart } from "../W4Chart";
import { W4, useW4Data } from "../useW4Data";

type View = { split: string; scale: string; window: string };

const SPLITS = [
  { value: "occupations", label: "Roles", dataAttr: { name: "roles-split", value: "occupations" } },
  { value: "groups", label: "Occupation groups", dataAttr: { name: "roles-split", value: "groups" } },
  { value: "employer", label: "Employer", dataAttr: { name: "roles-split", value: "employer" } },
  { value: "placement", label: "Placed or direct", dataAttr: { name: "roles-split", value: "placement" } },
];
const SCALES = [
  { value: "count", label: "Filings", dataAttr: { name: "roles-scale", value: "count" } },
  { value: "percent", label: "100%", dataAttr: { name: "roles-scale", value: "percent" } },
];
const WINDOWS = [
  { value: "full", label: "Full year", dataAttr: { name: "roles-window", value: "full" } },
  { value: "oct_jun", label: "Oct to Jun only", dataAttr: { name: "roles-window", value: "oct_jun" } },
];

function Card({ live }: { live: boolean }) {
  const card = useRef<HTMLDivElement>(null);
  const state = useW4Data(live ? W4.data("roles") : null, "roles data");
  const data = state.data as any;
  const scale = useTypeScale();
  const tokens = useTokens(ROLES_TOKENS as string[], card);
  const token = useMemo(() => (name: string) => tokens?.[name] || "currentColor", [tokens]);
  const T = useMemo(() => (scale && tokens ? { fs: scale.fs, family: scale.family } : null), [scale, tokens]);
  const [view, setView] = useState<View>({ split: "occupations", scale: "count", window: "full" });
  const [hidden, setHidden] = useState<Record<string, string[]>>(START_HIDDEN);
  // The band under the pointer, from the chart's own mouseover/mouseout; null
  // between bands. The tooltip shows that band alone when it is set.
  const hovered = useRef<string | null>(null);
  const chart = useRef<EChartsInstance | null>(null);
  const option = useMemo(
    () => (data && T ? rolesOption(data, view, hidden[view.split], () => hovered.current, token, T) : null),
    [data, T, view, hidden, token],
  );
  const events = useMemo(
    () => ({
      mouseover: (p: { seriesType?: string; seriesName?: string }) => {
        if (p.seriesType === "line") hovered.current = p.seriesName ?? null;
      },
      mouseout: (p: { seriesType?: string }) => {
        if (p.seriesType === "line") hovered.current = null;
      },
      globalout: () => {
        hovered.current = null;
      },
    }),
    [],
  );
  useIslandReady(option !== null || state.status === "error");
  const text = data ? rolesText(data, view) : null;
  const reveal = data ? rolesReveal(data) : null;
  const series = data ? seriesOf(data, view.split) : [];
  const set = (key: keyof View) => (value: string) => setView((v) => ({ ...v, [key]: value }));
  const toggle = (name: string) =>
    setHidden((h) => {
      const now = h[view.split];
      return { ...h, [view.split]: now.includes(name) ? now.filter((n) => n !== name) : [...now, name] };
    });
  const answer = state.status === "error" ? "Who filed for which roles did not load." : text ? text.answer : "Loading…";
  return (
    <div className="card w4-card" id="roles-card" ref={card}>
      <header className="w4-q">
        <span className="w4-num">2</span>
        <div>
          <h2>Who filed, and for which roles?</h2>
          <p className="w4-answer" id="roles-answer">
            {answer}
          </p>
        </div>
      </header>
      <div className="roles-toolbar" role="group" aria-label="Chart controls">
        <div className="axis-modes-group">
          <span className="axis-modes-label" id="roles-split-label">
            Split by
          </span>
          <SegmentedControl ariaLabelledBy="roles-split-label" className="axis-modes" role="group" separator=" " buttons={SPLITS} value={view.split} onChange={set("split")} />
        </div>
        <div className="axis-modes-group">
          <span className="axis-modes-label" id="roles-scale-label">
            Scale
          </span>
          <SegmentedControl ariaLabelledBy="roles-scale-label" className="axis-modes" role="group" separator=" " buttons={SCALES} value={view.scale} onChange={set("scale")} />
        </div>
        <div className="axis-modes-group">
          <span className="axis-modes-label" id="roles-window-label">
            Months
          </span>
          <SegmentedControl ariaLabelledBy="roles-window-label" className="axis-modes" role="group" separator=" " buttons={WINDOWS} value={view.window} onChange={set("window")} />
        </div>
      </div>
      <p className="axis-note">Each band is one series, largest at the bottom. Hover a band for its numbers; click a legend entry to hide it.</p>
      <div className="roles-chart-wrap">
        <W4Chart className="chart-host" id="roles-chart" option={option} onEvents={events} chartRef={chart} />
        <div className="roles-legend" id="roles-legend">
          {series.map((s: { name: string }, i: number) => (
            <button
              key={s.name}
              type="button"
              aria-pressed={hidden[view.split].includes(s.name) ? "false" : "true"}
              onMouseEnter={() => chart.current?.dispatchAction({ type: "highlight", seriesName: s.name })}
              onMouseLeave={() => chart.current?.dispatchAction({ type: "downplay", seriesName: s.name })}
              onClick={() => toggle(s.name)}
            >
              <span className="sw" style={{ background: colourOf(view.split, s, i, token) }}></span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="roles-summary" id="roles-summary" aria-live="polite">
        {text?.summary}
      </p>
      <div className="notice" id="roles-notice">
        <span className="ico">!</span>{" "}
        <span id="roles-notice-text">{text ? text.notice ?? "Loading…" : "Loading…"}</span>
      </div>
      <Drawers variant="foot" id="roles-reveals">
        {reveal ? (
          <>
            <Drawer label="Background">
              <p>{reveal.background}</p>
            </Drawer>
            <Drawer label="Method">
              <p>
                <TermText text={reveal.method} phrase="crosswalk" definition="A published table that maps each old occupation code to its new code or codes." id="w4-term-roles-card-crosswalk" />
              </p>
            </Drawer>
          </>
        ) : null}
      </Drawers>
    </div>
  );
}

function Server() {
  return <Card live={false} />;
}

function RolesView() {
  // Drawn once #cut-roles first opens, or at once if it is open already.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const box = document.getElementById("cut-roles") as HTMLDetailsElement | null;
    if (!box) return;
    if (box.open) setOpened(true);
    const controller = new AbortController();
    box.addEventListener("toggle", () => box.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  return <Card live={opened} />;
}

/** <Roles />: the whole #roles-card. */
export const Roles = island("week04/roles/Roles", RolesView, Server, { roots: ["#roles-card"] });
