"use client";
// The island for the Week 7 campaign: loads the two levels that read data
// (Two Stripes' map and Sentiment Trap's scores), then renders CampaignGame
// (CampaignGame.tsx). Same Word and Semantic Minefield ship their rounds in
// code. A level whose data is still on its way says so and can be skipped.
import { useEffect } from "react";
import type { SentimentTrapData } from "@/features/sentiment-trap/data";
import type { TwoStripesData } from "@/features/two-stripes/rules";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { CampaignGame, CampaignIntro } from "./CampaignGame";

const DIR = "play/week07/data/";

function Placeholder() {
  return (
    <section className="cr-campaign" id="campaign" aria-label="Campaign">
      <div className="cr-table">
        <div className="cr-start">
          <CampaignIntro />
          <p className="cr-note">Loading the four levels…</p>
        </div>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const url = (name: string) => (hydrated ? asset(DIR + name) : null);
  const stripes = useData<TwoStripesData>(url("two_stripes.json"));
  const sentiment = useData<SentimentTrapData>(url("sentiment_trap.json"));
  const failed = [stripes, sentiment].filter((s) => s.status === "error").map((s) => s.error);
  useIslandReady(hydrated);
  useEffect(() => {
    for (const e of failed) console.error("week07 campaign data failed", e);
    // Log once per failure: the count only grows.
  }, [failed.length]);
  if (!hydrated) return <Placeholder />;
  return <CampaignGame data={{ stripes: stripes.data, sentiment: sentiment.data }} />;
}

export const Campaign = island("week07-campaign/Campaign", View, Placeholder, { roots: ["#campaign"] });
