import { GameShell, NetworkView, useGameRun } from "log-log-legends-kit";
import { KITE, KITE_AT, KITE_NAMES } from "@/features/kit-page/toy-networks";

// The frame every kit game plays in, around Krackhardt's kite
// (src/features/kit-page/toy-networks.ts) as a stand-in board.
const segments = [
  { key: "budget", label: "Hits", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }] },
  { key: "hints", label: "Hints", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
];
const rules = <p>Pick the people whose removal cuts the network apart the most. Fewer people left in the largest piece is better.</p>;
const board = (
  <NetworkView
    spec={{
      ratio: 0.5,
      nodes: KITE_NAMES.map((name, i) => ({ id: i, x: KITE_AT[i][0], y: KITE_AT[i][1], label: name })),
      links: KITE.map(([a, b]) => ({ source: a, target: b })),
      labels: "beside",
      aria: "Krackhardt's kite, ten people",
    }}
  />
);

// In play: the stat tiles beside the title, the board below.
export const Playing = () => {
  const run = useGameRun({ game: "preview-shell", defaults: { budget: "2", hints: "on" }, better: "lower", autostart: true });
  return (
    <GameShell
      run={run}
      title="Break the kite"
      segments={segments}
      rules={rules}
      hud={[{ label: "Largest piece", value: "10 of 10" }, { label: "Hits left", value: "2" }, { label: "Hints left", value: "1" }]}
    >
      {board}
    </GameShell>
  );
};
