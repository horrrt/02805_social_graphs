"use client";
// The five findings under the hero (#findings [data-finding]) and the strip
// beside section 1's opener ([data-strip="place-modularity"]), which
// week04-frame.js drew on main: each finding gets a one-row strip of the real
// network against its random baseline and a line under it, from the sections'
// own data files, once all five have loaded.
import { useMemo } from "react";
import { MiniStrip, StripChart } from "@/kit";
import type { MiniSpec } from "@/kit/MiniStrip";
import { island, useIslandReady } from "@/lib/island";
import { W4, useW4All } from "../useW4Data";

const FILES = [W4.place, W4.data("jobs"), W4.data("staffing_moves"), W4.data("footprint"), W4.data("beyond")];

const pct = (x: number) => `${Math.round(x * 100)}%`;

type Strip = [MiniSpec, string];

function strips([place, jobs, moves, footprint, beyond]: any[]): Record<string, Strip> {
  const q = place.null_model;
  const jq = jobs.quality;
  const f = moves.finding;
  const variant = Object.fromEntries(footprint.metros.variants.map((v: any) => [v.id, v]));
  const drop = variant.drop_top10_filings;
  const control = variant.control_top10_filings;
  const full = variant.full;
  const odds = beyond.q3;
  return {
    1: [
      {
        domain: [0, 0.06],
        real: q.Q,
        realLabel: q.Q.toFixed(3),
        base: [q.Q_null_mean, q.Q_null_std],
        baseLabel: `rewired ${q.Q_null_mean.toFixed(3)}`,
        aria: "Modularity of the metro network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(q.z)}`,
    ],
    2: [
      {
        domain: [0, 0.35],
        real: jq.louvain.modularity_mean,
        realLabel: jq.louvain.modularity_mean.toFixed(2),
        base: [jq.null.null, jq.null.null_sd],
        baseLabel: `rewired ${jq.null.null.toFixed(2)}`,
        aria: "Modularity of the occupation network against rewired networks",
      },
      `Modularity against rewired networks · z = ${Math.round(jq.null.z)}`,
    ],
    3: [
      {
        domain: [0, 0.3],
        real: f.q1_pooled_observed_share,
        realLabel: pct(f.q1_pooled_observed_share),
        base: [f.q1_pooled_null_mean, f.q1_pooled_null_sd],
        baseLabel: `random vendor ${pct(f.q1_pooled_null_mean)}`,
        aria: "Share of vendor switches that stay inside the client's group",
      },
      `Vendor switches that stay in the group · z = ${Math.round(f.q1_pooled_z)}`,
    ],
    4: [
      {
        domain: [-0.03, 0.2],
        real: drop.ami_region,
        realLabel: drop.ami_region.toFixed(2),
        base: [control.ami_region, control.ami_region_sd],
        baseLabel: "random cuts",
        ref: full.ami_region,
        aria: "Match with Census regions without the ten largest filers",
      },
      `Match with Census regions without the ten largest filers · dashed: all firms, ${full.ami_region.toFixed(2)}`,
    ],
    5: [
      {
        domain: [0, 6],
        real: odds.mantel_haenszel_odds_ratio,
        realLabel: `${odds.mantel_haenszel_odds_ratio.toFixed(1)}×`,
        ref: 1,
        refLabel: "1 = same odds",
        ci: odds.odds_ratio_cluster_ci95,
        aria: "Odds of a low wage level, placed against direct filings",
      },
      "Odds of wage level I or II, placed against direct, same job · 95% interval",
    ],
  };
}

function MiniHost({ finding }: { finding: string }) {
  return <div className="w4-mini" data-finding={finding}></div>;
}

function MiniView({ finding }: { finding: string }) {
  const all = useW4All(FILES, "findings");
  const strip = useMemo(() => (all ? strips(all)[finding] : null), [all, finding]);
  useIslandReady(strip !== null);
  return (
    <div className="w4-mini" data-finding={finding}>
      {strip ? (
        <>
          <MiniStrip spec={strip[0]} />
          <small>{strip[1]}</small>
        </>
      ) : null}
    </div>
  );
}

/** <FindingMini finding="1" /> to "5". */
export const FindingMini = island("week04/frame/FindingMini", MiniView, MiniHost, { roots: ["#findings [data-finding]"] });

function OpenerHost() {
  return <div className="w4-figure-body" data-strip="place-modularity"></div>;
}

function OpenerView() {
  const [place] = useW4All([W4.place], "openers") ?? [];
  useIslandReady(Boolean(place));
  if (!place) return <OpenerHost />;
  const q = place.null_model;
  return (
    <div className="w4-figure-body" data-strip="place-modularity">
      <StripChart
        rows={[
          {
            label: "Modularity",
            sub: `${place.cities.length} metros, ${q.communities} groups`,
            real: q.Q,
            realLabel: q.Q.toFixed(3),
            realTip: `The real network: ${q.Q.toFixed(3)}`,
            base: [q.Q_null_mean, q.Q_null_std],
            baseLabel: `rewired ${q.Q_null_mean.toFixed(3)} ± ${q.Q_null_std.toFixed(4)}`,
            baseTip: `Rewired networks: mean ${q.Q_null_mean.toFixed(3)}, sd ${q.Q_null_std.toFixed(4)}`,
            badge: `z = ${Math.round(q.z)}`,
          },
        ]}
        opts={{
          domain: [0, 0.06],
          ticks: [0, 0.02, 0.04, 0.06],
          fmt: (v) => v.toFixed(2),
          labelW: 132,
          badgeW: 66,
          aria: "Modularity of the metro groups against rewired networks",
        }}
      />
    </div>
  );
}

/** Section 1's opener strip. */
export const PlaceOpenerStrip = island("week04/frame/PlaceOpenerStrip", OpenerView, OpenerHost, {
  roots: ['[data-strip="place-modularity"]'],
});
