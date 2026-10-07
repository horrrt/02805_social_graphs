"use client";
// The island for the campaign: loads every level's data at once (about 2 MB,
// the vectors the largest), then renders CampaignGame (CampaignGame.tsx). A
// level whose data is still on its way says so; a level whose data failed
// can be skipped.
import { useEffect } from "react";
import { island, useIslandReady } from "@/lib/island";
import { useData } from "@/lib/useData";
import { useHydrated } from "@/lib/useHydrated";
import { asset } from "@/scripts/site.js";
import { CampaignGame, CampaignIntro } from "./CampaignGame";
import type { TezguinoData } from "./contexts";
import type { WhoseLineData } from "./groups";
import type { ClueShopData } from "./rules";
import type { MixDeskData } from "./topics";
import { useVectors } from "./useVectors";

const DIR = "play/cold-read/data/";

function Placeholder() {
  return (
    <section className="cr-campaign" id="campaign" aria-label="Campaign">
      <div className="cr-table">
        <div className="cr-start">
          <CampaignIntro />
          <p className="cr-note">Loading the five levels…</p>
        </div>
      </div>
    </section>
  );
}

function View() {
  const hydrated = useHydrated();
  const url = (name: string) => (hydrated ? asset(DIR + name) : null);
  const clue = useData<ClueShopData>(url("clue_shop.json"));
  const groups = useData<WhoseLineData>(url("whose_line.json"));
  const mix = useData<MixDeskData>(url("mix_desk.json"));
  const contexts = useData<TezguinoData>(url("tezguino.json"));
  const vectors = useVectors(hydrated);
  const failed = [clue, groups, mix, contexts].filter((s) => s.status === "error").map((s) => s.error);
  if (vectors.error) failed.push(vectors.error);
  useIslandReady(hydrated);
  useEffect(() => {
    for (const e of failed) console.error("cold-read campaign data failed", e);
    // Log once per failure: the count only grows.
  }, [failed.length]);
  if (!hydrated) return <Placeholder />;
  return (
    <CampaignGame data={{ clue: clue.data, groups: groups.data, mix: mix.data, contexts: contexts.data, vectors: vectors.data ?? undefined }} />
  );
}

export const Campaign = island("cold-read/Campaign", View, Placeholder, { roots: ["#campaign"] });
