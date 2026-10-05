"use client";
// Week 5's frame: the hero scatter (#chart-hero-fame) and the findings minis
// (#findings [data-finding]), which week05-frame.js drew on main. Each host renders
// as the server did until hydrated. The hero then becomes a HoverTipHost as
// main's sweep left it (the class and a hidden tip) and, once fame.json has
// loaded, draws the scatter from fameLayout(), which empties the host of its
// tip as main's replaceChildren did (tip "none" in HOVERTIPS.md). Each mini
// draws from its own file through strips(); finding 4 has none and shows its
// line at once. On main one Promise.all over six files drew all of them or
// none (FP01).
import { Fragment, useEffect, useMemo, useRef } from "react";
import { MiniStrip } from "@/kit";
import HoverTipHost, { Tipped } from "@/kit/HoverTipHost";
import type { MiniSpec } from "@/kit/MiniStrip";
import { island, useIslandReady } from "@/lib/island";
import { useData, type DataState } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { useFittedWidth } from "@/lib/useSize";
import { useTokens, useTypeScale, type TypeScale } from "@/lib/useTypeScale";
import { asset } from "@/scripts/site.js";
import { FINDING_FILES, NO_GUESSES, fameLayout, strips } from "@/scripts/week05-frame.js";

const file = (name: string) => asset(`weeks/week05/data/${name}.json`);

// main's boot() logged one line when a file failed to load.
function useFailureLog(state: DataState<unknown>) {
  useEffect(() => {
    if (state.status === "error") console.error("week05 frame failed", state.error);
  }, [state]);
}

// ---- the hero ------------------------------------------------------------------

const HERO = {
  "aria-label":
    "Scatter plot of the 303 pages: words on the page against 1 plus the number of pages linking to it, both on log scales, with the fitted line.",
  className: "w5-hero-plot",
  id: "chart-hero-fame",
  role: "img",
};

const HERO_TOKENS = ["--w4-hero-ink", "--w4-hero-label", "--w4-hero-body", "--w4-hero-state-edge"];

type Layout = ReturnType<typeof fameLayout>;
type Fame = Parameters<typeof fameLayout>[0];

function FameSvg({ fame, scale, tokens }: { fame: Fame; scale: TypeScale; tokens: Record<string, string> }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useFittedWidth(ref, 560);
  const L: Layout = useMemo(() => fameLayout(fame, width), [fame, width]);
  const ink = tokens["--w4-hero-ink"];
  const label = tokens["--w4-hero-label"];
  const edge = tokens["--w4-hero-state-edge"];
  const caption = scale.fs("caption");
  // main's fitted() drew a new svg at each new width, so marks never keep a
  // class from a hover before it: the content is keyed by the width.
  return (
    <svg ref={ref} viewBox={`0 0 ${L.width} ${L.height}`} width={L.width} height={L.height} aria-hidden="true">
      <Fragment key={width}>
        {L.xTicks.map((t, i) => (
          <Fragment key={`x${i}`}>
            <line x1={t.x} y1={t.y1} x2={t.x} y2={t.y2} stroke={edge} strokeWidth={1} />
            <text x={t.x} y={t.labelY} fontSize={caption} fill={label} textAnchor="middle">
              {t.label}
            </text>
          </Fragment>
        ))}
        {L.yTicks.map((t, i) => (
          <Fragment key={`y${i}`}>
            <line x1={t.x1} y1={t.y} x2={t.x2} y2={t.y} stroke={edge} strokeWidth={1} />
            <text x={t.labelX} y={t.labelY} fontSize={caption} fill={label} textAnchor="end">
              {t.label}
            </text>
          </Fragment>
        ))}
        <text x={L.xTitle.x} y={L.xTitle.y} fontSize={caption} fill={label} textAnchor="end">
          {L.xTitle.text}
        </text>
        <text x={L.yTitle.x} y={L.yTitle.y} fontSize={caption} fill={label}>
          {L.yTitle.text}
        </text>
        <g>
          {L.dots.map((d: { cx: number; cy: number; tip: string }, i: number) => (
            <Tipped key={i} tag="circle" tip={d.tip} cx={d.cx} cy={d.cy} r={3.2} fill={tokens["--w4-hero-body"]} fillOpacity={0.55} />
          ))}
        </g>
        <line x1={L.line.x1} y1={L.line.y1} x2={L.line.x2} y2={L.line.y2} stroke={ink} strokeWidth={1.6} />
        {L.outliers.map((o, i) => (
          <Fragment key={`o${i}`}>
            <circle cx={o.cx} cy={o.cy} r={4.5} fill={ink} />
            <text x={o.labelX} y={o.labelY} fontSize={scale.fs("small")} fill={ink} fontWeight={700}>
              {o.name}
            </text>
          </Fragment>
        ))}
      </Fragment>
    </svg>
  );
}

function FameChart({ fame }: { fame: Fame }) {
  const scale = useTypeScale();
  const tokens = useTokens(HERO_TOKENS);
  if (!scale || !tokens) return null;
  return <FameSvg fame={fame} scale={scale} tokens={tokens} />;
}

function HeroHost() {
  return <div {...HERO} />;
}

function HeroView() {
  const hydrated = useHydrated();
  const fame = useData<Fame>(hydrated ? file("fame") : null);
  const ready = fame.status === "ready";
  useIslandReady(ready);
  useFailureLog(fame);
  if (!hydrated) return <HeroHost />;
  // Swept (a hidden tip first) until the scatter replaces the host's content.
  return (
    <HoverTipHost {...HERO} tip={ready ? "none" : "first"} redraws={ready ? 1 : 0}>
      {ready && fame.data ? <FameChart fame={fame.data} /> : null}
    </HoverTipHost>
  );
}

// ---- the findings minis ------------------------------------------------------

type Strip = [MiniSpec, string];
const FILE_OF = FINDING_FILES as Record<string, string | undefined>;

function MiniHost({ finding }: { finding: string }) {
  return <div className="w4-mini" data-finding={finding}></div>;
}

function MiniView({ finding }: { finding: string }) {
  const hydrated = useHydrated();
  const name = FILE_OF[finding];
  const loaded = useData(hydrated && name ? file(name) : null);
  const strip = useMemo(
    () => (name && loaded.data ? ((strips({ [name]: loaded.data }) as Record<string, Strip>)[finding] ?? null) : null),
    [name, loaded.data, finding],
  );
  useIslandReady(name ? strip !== null : hydrated);
  useFailureLog(loaded);
  return (
    <div className="w4-mini" data-finding={finding}>
      {!name && hydrated ? <small>{NO_GUESSES}</small> : null}
      {strip ? (
        <>
          <MiniStrip spec={strip[0]} />
          <small>{strip[1]}</small>
        </>
      ) : null}
    </div>
  );
}

// One island per kind of host, so a fault in the hero leaves the minis alone
// and the other way round.
const Hero = island("week05/frame/HeroFame", HeroView, HeroHost, { roots: ["#chart-hero-fame"] });
const Minis = island("week05/frame/FindingMinis", MiniView, MiniHost, { roots: ["#findings [data-finding]"] });

type Props = { part: string };

function View({ part }: Props) {
  return part === "hero" ? <Hero /> : <Minis finding={part} />;
}

function Placeholder({ part }: Props) {
  return part === "hero" ? <HeroHost /> : <MiniHost finding={part} />;
}

// The sections render <Frame part="hero" /> and <Frame part="1" /> to "7": one
// client reference in the page's payload, which static parity holds to 2%
// growth, wrapping each host's own island.
export const Frame = island("week05/frame/Frame", View, Placeholder, {
  roots: ["#chart-hero-fame", "#findings [data-finding]"],
});
