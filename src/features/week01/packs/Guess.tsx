"use client";
// "Try estimating the number of packs": the scored prediction packs.js drew
// into #prediction on main, once both data files were in. A saved first
// guess with the same answer reveals itself again.
import { useState } from "react";
import { Prediction } from "@/features/arcade/Prediction";
import { island, useIslandReady } from "@/lib/island";
import { usePacks } from "./model";

function GuessView() {
  const model = usePacks();
  const [revealed, setRevealed] = useState(false);
  useIslandReady(model !== null);
  return (
    <div className={revealed ? "prediction revealed" : "prediction"} id="prediction">
      {model ? (
        <Prediction
          id="w1-packs"
          week={1}
          prompt="How many five-card packs to collect every article, on average?"
          min={0}
          max={4000}
          answer={model.packs.collector.expectedPacksRounded}
          unit="packs"
          explain="An approximate expectation, not a guaranteed finish. The slow part is finding the last rare cards."
          onReveal={() => setRevealed(true)}
        />
      ) : null}
    </div>
  );
}

const GuessHost = () => <div className="prediction" id="prediction"></div>;

export const PacksGuess = island("week01/packs/Guess", GuessView, GuessHost, { roots: ["#prediction"] });
