"use client";
// The deep dive's five years of filings (#cut-years), which week04-years.js
// built on main once the box was first opened: the card with its answer,
// notice and eight panels of plain SVG, each drawn at its slot's width, and
// the Background and Table drawers. Until then, and if years.json fails, the
// box shows its status line.
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { TermText } from "@/kit";
import { island, useIslandReady } from "@/lib/island";
import { useFittedWidth } from "@/lib/useSize";
import { MONTHS, YEARS, niceAxis, num, pct, spread, yearsModel, yr } from "@/scripts/week04-years.js";
import { W4Table } from "../W4Table";
import { W4, useW4Data } from "../useW4Data";
import { useT, type T } from "../useT";

type Pal = { ink: string; inkSoft: string; inkMute: string; people: string; access: string; grid: string; line: string; card: string };
type Pt = { label: string; v: number };

const TOKENS = ["--ink", "--ink-soft", "--ink-mute-text", "--people", "--access", "--w4-grid", "--line", "--card"];

function palette(T: T): Pal {
  const tok = (name: string) => T.token(name) || "currentColor";
  return {
    ink: tok("--ink"),
    inkSoft: tok("--ink-soft"),
    inkMute: tok("--ink-mute-text"),
    people: tok("--people"),
    access: tok("--access"),
    grid: tok("--w4-grid"),
    line: tok("--line"),
    card: tok("--card"),
  };
}

// ---------------------------------------------------------------- SVG marks

const f1 = (v: number) => v.toFixed(1);

function Svg({ w, h, aria, svgRef, children }: { w: number; h: number; aria: string; svgRef: React.Ref<SVGSVGElement>; children: ReactNode }) {
  return (
    <svg ref={svgRef} aria-label={aria} role="img" viewBox={`0 0 ${w} ${h}`} width={w} height={h} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

function Line({ x1, y1, x2, y2, stroke, sw = 1, dash, op, cap = "butt" }: { x1: number; y1: number; x2: number; y2: number; stroke: string; sw?: number; dash?: string; op?: number; cap?: "butt" | "round" }) {
  return <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeOpacity={op} strokeLinecap={cap}></line>;
}

function Rect({ x, y, w, h, fill, rx = 0, stroke, sw = 1, title }: { x: number; y: number; w: number; h: number; fill: string; rx?: number; stroke?: string | null; sw?: number; title?: string }) {
  return (
    <rect x={f1(x)} y={f1(y)} width={f1(Math.max(w, 0))} height={f1(Math.max(h, 0))} fill={fill} rx={rx} stroke={stroke ?? undefined} strokeWidth={stroke ? sw : undefined}>
      {title ? <title>{title}</title> : null}
    </rect>
  );
}

function Circle({ cx, cy, r, fill, stroke, sw = 1.5, title, opacity }: { cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number; title?: string; opacity?: number }) {
  return (
    <circle opacity={opacity} cx={f1(cx)} cy={f1(cy)} r={r} fill={fill} stroke={stroke} strokeWidth={stroke ? sw : undefined}>
      {title ? <title>{title}</title> : null}
    </circle>
  );
}

function Text({ x, y, s, size, fill, weight = 400, anchor = "start" }: { x: number; y: number; s: string; size: number; fill: string; weight?: number; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={f1(x)} y={f1(y)} fontSize={size} fill={fill} fontWeight={weight} textAnchor={anchor} font-variant-numeric="tabular-nums">
      {s}
    </text>
  );
}

// An SVG path through points [x, y], one decimal each.
const pathD = (pts: number[][]) => "M" + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L");

function Path({ d, stroke, sw = 1, dash, op }: { d: string; stroke: string; sw?: number; dash?: string; op?: number }) {
  return <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeOpacity={op} strokeLinejoin="round" strokeLinecap="round"></path>;
}

// Each chart sits in a slot and is drawn at the slot's width, one SVG unit to a pixel.
function useWidth(fallback: number) {
  const ref = useRef<SVGSVGElement>(null);
  return [ref, useFittedWidth(ref, fallback)] as const;
}

// ---------------------------------------------------------------- panels

// Ported from extra.py:year_bars.
function YearBars({ series, height, fmt, aria, pal, T, partialLast = true, sub = null, note = null, fallback }: { series: Pt[]; height: number; fmt: (v: number) => string; aria: string; pal: Pal; T: T; partialLast?: boolean; sub?: string[] | null; note?: [number, string] | null; fallback: number }) {
  const [ref, width] = useWidth(fallback);
  const L = 12, R = 12, Tp = 26, Bm = 44;
  const n = series.length;
  const cw = (width - L - R) / n;
  const vmax = Math.max(...series.map((s) => s.v)) * 1.12;
  const base = height - Bm;
  return (
    <Svg w={width} h={height} aria={aria} svgRef={ref}>
      {series.map((s, i) => {
        const x = L + i * cw + cw * 0.18;
        const w = cw * 0.64;
        const h = ((base - Tp) * s.v) / vmax;
        const last = partialLast && i === n - 1;
        return [
          <Rect key={`r${i}`} x={x} y={base - h} w={w} h={h} fill={last ? pal.card : pal.ink} rx={3} stroke={last ? pal.ink : null} sw={1.6} title={`${s.label}: ${fmt(s.v)}`} />,
          <Text key={`v${i}`} x={x + w / 2} y={base - h - 7} s={fmt(s.v)} size={T.fs("small")} fill={pal.ink} weight={700} anchor="middle" />,
          <Text key={`l${i}`} x={x + w / 2} y={base + 17} s={s.label} size={T.fs("small")} fill={pal.inkSoft} weight={600} anchor="middle" />,
          sub && sub[i] ? <Text key={`s${i}`} x={x + w / 2} y={base + 32} s={sub[i]} size={T.fs("caption")} fill={pal.inkMute} anchor="middle" /> : null,
          // The panel's finding, over the bar it is about.
          note && note[0] === i ? <Text key={`n${i}`} x={x + w / 2} y={base - h - 24} s={note[1]} size={T.fs("caption")} fill={pal.inkSoft} anchor="middle" /> : null,
        ];
      })}
      <Line x1={L} y1={base} x2={width - R} y2={base} stroke={pal.line} />
    </Svg>
  );
}

// One series over FY2022 to FY2026: the last point is hollow and joined with
// a dashed segment (this fiscal year is still in progress).
function YearLine({ series, height, fmt, aria, pal, color, T, fallback }: { series: Pt[]; height: number; fmt: (v: number) => string; aria: string; pal: Pal; color: string; T: T; fallback: number }) {
  const [ref, width] = useWidth(fallback);
  const L = 56, R = 24, Tp = 18, Bm = 30;
  const full = true;
  const vals = series.map((s) => s.v);
  const range = Math.max(...vals) - Math.min(...vals) || Math.max(...vals) * 0.2 || 1;
  const yMax = Math.max(...vals) + range * 0.6;
  const yMin = Math.max(0, Math.min(...vals) - range * 0.6);
  const x = (i: number) => L + (i * (width - L - R)) / (series.length - 1);
  const y = (v: number) => Tp + ((yMax - v) * (height - Tp - Bm)) / (yMax - yMin);
  const pts = series.map((s, i) => [x(i), y(s.v)]);
  const solid = full ? pts.slice(0, -1) : pts;
  return (
    <Svg w={width} h={height} aria={aria} svgRef={ref}>
      {[0, 1, 2, 3].map((k) => {
        const v = yMin + ((yMax - yMin) * k) / 3;
        return [
          <Line key={`g${k}`} x1={L} y1={y(v)} x2={width - R} y2={y(v)} stroke={pal.grid} />,
          <Text key={`t${k}`} x={L - 8} y={y(v) + 4} s={fmt(v)} size={T.fs("caption")} fill={pal.inkMute} anchor="end" />,
        ];
      })}
      <Path d={pathD(solid)} stroke={color} sw={2.4} />
      <Line x1={pts.at(-2)![0]} y1={pts.at(-2)![1]} x2={pts.at(-1)![0]} y2={pts.at(-1)![1]} stroke={color} sw={2} dash="4 4" />
      {series.map((s, i) => {
        const [px, py] = pts[i];
        const last = full && i === series.length - 1;
        return [
          <Circle key={`c${i}`} cx={px} cy={py} r={5} fill={last ? pal.card : color} stroke={color} sw={2} title={`${s.label}: ${fmt(s.v)}`} />,
          <Text key={`v${i}`} x={px} y={py - 11} s={fmt(s.v)} size={T.fs("small")} fill={pal.ink} weight={700} anchor="middle" />,
          <Text key={`l${i}`} x={px} y={height - 10} s={s.label} size={T.fs("caption")} fill={pal.inkMute} anchor="middle" />,
        ];
      })}
    </Svg>
  );
}

// Two series over the five fiscal years, labelled at their ends. Ported from extra.py:two_lines.
function TwoLines({ a, b, height, fmt, aria, pal, names, colors, note, T, fallback }: { a: number[]; b: number[]; height: number; fmt: (v: number) => string; aria: string; pal: Pal; names: string[]; colors: string[]; note: string | null; T: T; fallback: number }) {
  const [ref, width] = useWidth(fallback);
  // R holds the end names.
  const L = 56, Tp = 18, Bm = 30;
  const R = Math.ceil(Math.max(...names.map((name) => T.measure(name, "small", 700)))) + 20;
  const { step, top } = niceAxis(Math.max(...a, ...b));
  const x = (i: number) => L + (i * (width - L - R)) / 4;
  const y = (v: number) => Tp + ((top - v) * (height - Tp - Bm)) / top;
  const ticks = [];
  for (let k = 0; k <= Math.round(top / step); k++) ticks.push(k * step);
  return (
    <Svg w={width} h={height} aria={aria} svgRef={ref}>
      {ticks.map((v, k) => [
        <Line key={`g${k}`} x1={L} y1={y(v)} x2={width - R} y2={y(v)} stroke={v === 0 ? pal.line : pal.grid} />,
        <Text key={`t${k}`} x={L - 8} y={y(v) + 4} s={fmt(v)} size={T.fs("caption")} fill={pal.inkMute} anchor="end" />,
      ])}
      {(
        [
          [a, colors[0], names[0]],
          [b, colors[1], names[1]],
        ] as [number[], string, string][]
      ).map(([series, col, name], si) => {
        const pts = series.map((v, i) => [x(i), y(v)]);
        return (
          <g key={si}>
            <Path d={pathD(pts.slice(0, -1))} stroke={col} sw={2.4} />
            <Line x1={pts.at(-2)![0]} y1={pts.at(-2)![1]} x2={pts.at(-1)![0]} y2={pts.at(-1)![1]} stroke={col} sw={2} dash="4 4" />
            {pts.map(([px, py], i) => {
              const last = i === 4;
              // The first point sits on the y-axis; start-anchor its label just right of it.
              const first = i === 0;
              return [
                <Circle key={`c${i}`} cx={px} cy={py} r={4.5} fill={last ? pal.card : col} stroke={col} sw={2} title={`${YEARS[i]} ${name}: ${fmt(series[i])}`} />,
                <Text key={`v${i}`} x={first ? px + 6 : px} y={py - 10} s={fmt(series[i])} size={T.fs("small")} fill={pal.ink} weight={700} anchor={first ? "start" : "middle"} />,
              ];
            })}
            <Text x={pts.at(-1)![0] + 12} y={pts.at(-1)![1] + 4} s={name} size={T.fs("small")} fill={pal.ink} weight={700} />
          </g>
        );
      })}
      {YEARS.map((y_: string, i: number) => (
        <Text key={y_} x={x(i)} y={height - 10} s={y_} size={T.fs("caption")} fill={pal.inkMute} anchor="middle" />
      ))}
      {/* The panel's finding, in the empty band just above the zero line. */}
      {note ? <Text x={L + 8} y={y(0) - 8} s={note} size={T.fs("caption")} fill={pal.ink} /> : null}
    </Svg>
  );
}

// October to June on one axis, one line per fiscal year, each labelled at its June end.
function Season({ rows, k: key, aria, pal, color, note, T, fallback }: { rows: Record<string, any[]>; k: string; aria: string; pal: Pal; color: string; note: [number, string] | null; T: T; fallback: number }) {
  const [ref, width] = useWidth(fallback);
  const height = 280;
  const L = 56, R = 62, Tp = 16, Bm = 30;
  const years = Object.keys(rows);
  const { step, top } = niceAxis(Math.max(...years.flatMap((y) => rows[y].map((m) => m[key]))));
  const x = (i: number) => L + (i * (width - L - R)) / 8;
  const y = (v: number) => Tp + ((top - v) * (height - Tp - Bm)) / top;
  const ticks = [];
  for (let k = 0; k <= Math.round(top / step); k++) ticks.push(k * step);
  const ends: number[] = [];
  const lines = years.map((yy, yi) => {
    const newest = yi === years.length - 1;
    const opacity = years.length === 1 ? 1 : 0.35 + (0.65 * yi) / (years.length - 1);
    const pts = rows[yy].map((m, i) => [x(i), y(m[key])]);
    ends.push(pts.at(-1)![1]);
    return (
      <g key={yy}>
        <Path d={pathD(pts)} stroke={color} sw={newest ? 2.6 : 2} op={opacity} />
        {rows[yy].map((m, i) => (
          <Circle key={i} opacity={opacity} cx={pts[i][0]} cy={pts[i][1]} r={newest ? 3 : 2.2} fill={color} stroke={pal.card} sw={1.2} title={`${yr(yy)}, ${MONTHS[i]}: ${num(m[key])}`} />
        ))}
      </g>
    );
  });
  let marker = null;
  if (note) {
    const [i, label] = note;
    const m = rows[years.at(-1)!][i];
    marker = (
      <>
        <Circle cx={x(i)} cy={y(m[key])} r={4.5} fill={pal.card} stroke={color} sw={2} title={label} />
        <Text x={x(i) + 12} y={y(m[key]) - 6} s={label} size={T.fs("caption")} fill={pal.ink} />
      </>
    );
  }
  return (
    <Svg w={width} h={height} aria={aria} svgRef={ref}>
      {ticks.map((v, k) => [
        <Line key={`g${k}`} x1={L} y1={y(v)} x2={width - R} y2={y(v)} stroke={v === 0 ? pal.line : pal.grid} />,
        <Text key={`t${k}`} x={L - 8} y={y(v) + 4} s={num(v)} size={T.fs("caption")} fill={pal.inkMute} anchor="end" />,
      ])}
      {MONTHS.map((mo: string, i: number) => (
        <Text key={mo} x={x(i)} y={height - 10} s={mo} size={T.fs("caption")} fill={pal.inkMute} anchor="middle" />
      ))}
      {lines}
      {/* 15 apart, so the end labels clear each other's glyph boxes. */}
      {spread(ends, 15).map((ly: number, i: number) => {
        const newest = i === years.length - 1;
        return <Text key={`e${i}`} x={width - R + 8} y={ly + 4} s={yr(years[i])} size={T.fs("small")} fill={newest ? pal.ink : pal.inkMute} weight={newest ? 700 : 600} />;
      })}
      {marker}
    </Svg>
  );
}

// A small multiple per firm: filings per fiscal year. Ported from extra.py:mini_years.
function MiniYears({ series, ymax, pal, note, T, fallback }: { series: Pt[]; ymax: number; pal: Pal; note: string | null; T: T; fallback: number }) {
  const [ref, width] = useWidth(fallback);
  const height = 150;
  // Side margins of half the widest value label, so the end values stay inside.
  const L = Math.ceil(Math.max(...series.map((s) => T.measure(num(s.v), "small", 700))) / 2) + 2;
  const R = L, Tp = 20, Bm = 24;
  const full = series.length === 5;
  const x = (i: number) => L + (i * (width - L - R)) / 4;
  const y = (v: number) => Tp + ((ymax - v) * (height - Tp - Bm)) / ymax;
  const pts = series.map((s, i) => [x(i), y(s.v)]);
  const solid = full ? pts.slice(0, -1) : pts;
  return (
    <Svg w={width} h={height} aria="Filings per fiscal year" svgRef={ref}>
      <Line x1={L} y1={y(0)} x2={width - R} y2={y(0)} stroke={pal.line} />
      <Path d={pathD(solid)} stroke={pal.ink} sw={2.2} />
      {full ? <Line x1={pts.at(-2)![0]} y1={pts.at(-2)![1]} x2={pts.at(-1)![0]} y2={pts.at(-1)![1]} stroke={pal.ink} sw={1.8} dash="4 4" /> : null}
      {series.map((s, i) => {
        const [px, py] = pts[i];
        const last = full && i === series.length - 1;
        return [
          <Circle key={`c${i}`} cx={px} cy={py} r={4} fill={last ? pal.card : pal.ink} stroke={pal.ink} sw={1.6} title={`${s.label}: ${num(s.v)}`} />,
          <Text key={`v${i}`} x={px} y={py - 8} s={num(s.v)} size={T.fs("small")} fill={pal.ink} weight={700} anchor="middle" />,
          <Text key={`l${i}`} x={px} y={height - 6} s={s.label} size={T.fs("caption")} fill={pal.inkMute} anchor="middle" />,
        ];
      })}
      {/* The firm's finding, top right, where a short run leaves the chart empty. */}
      {note ? <Text x={width - R} y={12} s={note} size={T.fs("caption")} fill={pal.inkSoft} anchor="end" /> : null}
    </Svg>
  );
}

function Panel({ title, caption, span = 1, finding = "", children }: { title: string; caption: ReactNode; span?: number; finding?: string; children: ReactNode }) {
  return (
    <div className="years-panel" data-span={span > 1 ? "2" : undefined}>
      <h3>{title}</h3>
      <p>
        {caption}
        {finding ? (
          <>
            {" "}
            <b className="rx-tile-finding">{finding}</b>
          </>
        ) : null}
      </p>
      {children}
    </div>
  );
}

let slotId = 0;
function Slot({ children }: { children: ReactNode }) {
  const [id] = useState(() => slotId++);
  return <div data-years-chart={id}>{children}</div>;
}

const RIGHT = { textAlign: "right" as const };

function Card({ data, T }: { data: any; T: T }) {
  const m = useMemo(() => yearsModel(data), [data]);
  const pal = palette(T);
  const pctFmt = (v: number) => pct(v);
  return (
    <div className="card w4-card" id="years-card">
      <header className="w4-q">
        <span className="w4-num">1</span>
        <div>
          <h2>Five years of filings</h2>
          <p className="w4-answer">{m.answer}</p>
        </div>
      </header>
      <div className="notice">
        <span className="ico">!</span>
        <span>
          <b>How to read the years.</b> {m.notice}
        </span>
      </div>
      <div className="years-grid">
        <Panel title="Certified H-1B filings" caption="Each fiscal year. 2026 is outlined: nine months, not a year.">
          <Slot>
            <YearBars series={m.cert.series} height={250} fmt={num} aria="Certified H-1B filings per fiscal year" pal={pal} T={T} sub={["", "", "", "", "Oct–Jun only"]} note={m.cert.note as [number, string]} fallback={540} />
          </Slot>
        </Panel>
        <Panel title="The same months, compared" caption="October to June of each year: the fair way to set 2026 beside the two before it.">
          <Slot>
            <YearBars series={m.like.series} height={220} fmt={num} aria="Certified filings from October to June, three years" pal={pal} T={T} partialLast={false} note={m.like.note as [number, string]} fallback={540} />
          </Slot>
        </Panel>
        <Panel title="Month by month" caption="October to June of each fiscal year, the months 2026 covers." span={2}>
          <div className="years-split">
            <div>
              <h4>Certified filings</h4>
              <Slot>
                <Season rows={m.monthly.rows} k="certified_filings" aria="Certified H-1B filings per month, October to June, 2024 to 2026" pal={pal} color={pal.ink} note={m.monthly.shutdown as [number, string]} T={T} fallback={552} />
              </Slot>
            </div>
            <div>
              <h4>Placed at a client</h4>
              <Slot>
                <Season rows={m.monthly.rows} k="placed_filings" aria="Certified filings that place the worker at a client, per month, October to June, 2024 to 2026" pal={pal} color={pal.people} note={null} T={T} fallback={552} />
              </Slot>
            </div>
          </div>
        </Panel>
        <Panel title="Placed at a client" caption="Share of certified filings that put the worker at another company." finding={m.placedFinding}>
          <Slot>
            <YearLine series={m.share} height={230} fmt={pctFmt} aria="Share of certified filings that place a worker at a client" pal={pal} color={pal.people} T={T} fallback={540} />
          </Slot>
        </Panel>
        <Panel title="USCIS denials" caption={`Share of first-time petitions denied, employers with ${m.uscisMin} or more certified filings. 2026 runs October to June.`}>
          <Slot>
            <TwoLines a={m.denial.a} b={m.denial.b} height={240} fmt={pctFmt} aria="USCIS denials of first-time petitions, placing firms against direct employers" pal={pal} names={["placing firms", "direct employers"]} colors={[pal.people, pal.access]} note={m.denial.note} T={T} fallback={540} />
          </Slot>
        </Panel>
        <Panel
          title="The four largest placing firms"
          caption={`Placed filings each firm files per fiscal year, on one scale. Hollow: 2026, nine months. HCL leaves the top ${m.firms.topN} in 2026.`}
          span={2}
        >
          <div className="years-firms">
            {m.firms.firms.map((f: { name: string; series: Pt[]; note: string | null }) => (
              <div className="years-firm" key={f.name}>
                <span>{f.name}</span>
                <Slot>
                  <MiniYears series={f.series} ymax={m.firms.ymax} pal={pal} note={f.note} T={T} fallback={262} />
                </Slot>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="The lottery"
          caption={
            <TermText
              text={m.lottery.caption}
              phrase="Registrations"
              definition="Entries in the H-1B lottery. Each spring employers register the workers they want to sponsor, and USCIS draws at random from the entries."
              id="w4-term-years-card-registrations"
            />
          }
        >
          <Slot>
            <YearBars series={m.lottery.draws} height={230} fmt={num} aria="H-1B lottery registrations per draw" pal={pal} T={T} partialLast={false} sub={m.lottery.sub} note={m.lottery.note as [number, string]} fallback={540} />
          </Slot>
        </Panel>
        <Panel title="Clients and firms" caption="Client companies named on a placed filing, and the firms that place workers, per fiscal year.">
          <Slot>
            <TwoLines a={m.clients.a} b={m.clients.b} height={240} fmt={num} aria="Client companies and placing firms per year" pal={pal} names={["client companies", "firms that place"]} colors={[pal.ink, pal.people]} note={m.clients.note} T={T} fallback={540} />
          </Slot>
        </Panel>
      </div>
      <Drawers variant="foot">
        <Drawer label="Background">
          <p>{m.background}</p>
        </Drawer>
        <Drawer label="Table: the numbers behind the charts">
          {m.tables.map((t: { caption: string; head: string[]; rows: string[][]; after?: string }) => (
            <Fragment key={t.caption}>
              <W4Table
                className="ego"
                caption={t.caption}
                head={t.head.map((text, i) => ({ text, style: i ? RIGHT : undefined }))}
                rows={t.rows.map((row) => row.map((text, i) => ({ text, style: i ? RIGHT : undefined })))}
              />
              {t.after ? <p>{t.after}</p> : null}
            </Fragment>
          ))}
        </Drawer>
      </Drawers>
    </div>
  );
}

function StatusLine({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="status-line" id="years-status">
      {text}
    </p>
  );
}

function Server() {
  return <StatusLine text="Loading five years of filings…" />;
}

function YearsView() {
  // Rendered once the box is first opened, or at once if it is open already.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const box = document.getElementById("cut-years") as HTMLDetailsElement | null;
    if (!box) return;
    if (box.open) setOpened(true);
    const controller = new AbortController();
    box.addEventListener("toggle", () => box.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  const state = useW4Data(W4.data("years"), "years data", { enabled: opened });
  const T = useT(TOKENS);
  useIslandReady(Boolean(state.data && T));
  if (state.status === "error") return <StatusLine text="The five years of filings did not load." />;
  if (!state.data || !T) return <Server />;
  return <Card data={state.data} T={T} />;
}

/** <Years />: #years-body's content, the status line until the card is built. */
export const Years = island("week04/years/Years", YearsView, Server, { roots: ["#years-status", "#years-card"] });
