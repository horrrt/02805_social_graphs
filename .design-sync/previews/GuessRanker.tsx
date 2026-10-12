import { useEffect, useRef, type ReactNode } from "react";
import { GuessRanker } from "log-log-legends-kit";
import { guessBanned, guessItems, guessScore } from "@/features/kit-page/toy";

const tick = () => new Promise((r) => setTimeout(r, 0));

// Types words into the round and says each, as a reader would, so the ranking has something to rank.
function Said({ words, children }: { words: string[]; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const input = box.current?.querySelector<HTMLInputElement>("input[type=text]");
    const form = input?.form;
    if (!input || !form) return;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    (async () => {
      for (const w of words) {
        setValue.call(input, w);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await tick();
        form.requestSubmit();
        await tick();
      }
    })();
  }, [words]);
  return <div ref={box}>{children}</div>;
}

// The kit page's round: describe Wolverine without naming him, six toy
// heroes with toy word lists (src/features/kit-page/toy.ts). Three words
// said, one of them banned.
const WORDS = ["claws", "logan", "healing"];
export const ThreeWords = () => (
  <Said words={WORDS}>
    <GuessRanker items={guessItems} score={guessScore} target="wolverine" budget={6} banned={guessBanned} />
  </Said>
);
