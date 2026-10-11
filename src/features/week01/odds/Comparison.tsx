"use client";
// "What if every card had the same chance?": the packs-opened select, the two
// bars and the sentence under them. The server sends the 20-pack figures with
// the select disabled; once both data files are in, the select works and the
// bars follow expectedDistinct() for the chosen number of packs, as packs.js
// updateComparison() drew them on main.
import { useState } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useHydrated } from "@/lib/useHydrated";
import { expectedDistinct } from "@/scripts/collection-model.mjs";
import { usePacks } from "../packs/model";

type Figures = { weighted: string; uniform: string; weightedWidth: string; uniformWidth: string; explanation: string };

const SERVER: Figures = {
  weighted: "70.5",
  uniform: "85.3",
  weightedWidth: "23.27%",
  uniformWidth: "28.15%",
  explanation: "At 20 packs, equal odds give about 15 more different cards on average. Repeats still happen under both rules.",
};

function Markup({ figures, value = "20", onChange }: { figures: Figures; value?: string; onChange?: (value: string) => void }) {
  return (
    <>
      <label htmlFor="compare-packs">Packs opened</label>
      {" "}
      <select
        id="compare-packs"
        disabled={!onChange}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="1">1 pack · 5 cards</option>
        <option value="20">20 packs · 100 cards</option>
        <option value="100">100 packs · 500 cards</option>
        <option value="400">400 packs · 2,000 cards</option>
      </select>
      <figure aria-labelledby="odds-caption">
        <figcaption id="odds-caption">
          Different cards collected, on average · out of 303
        </figcaption>
        <div className="odds-row">
          <span>Our link-weighted rule</span>
          <div className="odds-track">
            <span id="weighted-bar" style={{ width: figures.weightedWidth }}></span>
          </div>
          <strong id="weighted-unique">{figures.weighted}</strong>
        </div>
        <div className="odds-row">
          <span>Every card equally likely</span>
          <div className="odds-track">
            <span id="uniform-bar" style={{ width: figures.uniformWidth }}></span>
          </div>
          <strong id="uniform-unique">{figures.uniform}</strong>
        </div>
      </figure>
      <p id="odds-explanation" aria-live="polite">
        {figures.explanation}
      </p>
    </>
  );
}

function ComparisonView() {
  const hydrated = useHydrated();
  const model = usePacks();
  const [value, setValue] = useState("20");
  useIslandReady(model !== null);
  if (!hydrated || !model) return <Markup figures={SERVER} />;
  const packCount = Number(value);
  const draws = packCount * model.packs.packSize;
  const weighted = expectedDistinct(model.weightedOdds, draws);
  const uniform = expectedDistinct(model.uniformOdds, draws);
  const difference = uniform - weighted;
  const figures: Figures = {
    weighted: weighted.toFixed(1),
    uniform: uniform.toFixed(1),
    weightedWidth: `${(weighted / model.N) * 100}%`,
    uniformWidth: `${(uniform / model.N) * 100}%`,
    explanation:
      difference < 1
        ? `After one pack, the averages are close. Try 20 or 100 packs to see how the gap grows. Repeats can happen under either rule.`
        : `At ${packCount} packs, equal odds give about ${Math.round(difference)} more different cards on average. Repeats still happen under both rules.`,
  };
  return <Markup figures={figures} value={value} onChange={setValue} />;
}

const ComparisonHost = () => <Markup figures={SERVER} />;

export const Comparison = island("week01/odds/Comparison", ComparisonView, ComparisonHost, {
  roots: ['label[for="compare-packs"]', "#compare-packs", ".learning-comparison figure", "#odds-explanation"],
});
