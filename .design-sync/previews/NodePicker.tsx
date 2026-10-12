import { NodePicker, type NetId, type PickerGraph } from "log-log-legends-kit";
import { cliqueGraph } from "@/features/kit-page/toy-editors";

// The kit page's clique hunt: twelve toy people with a 4-clique planted
// among them (src/features/kit-page/toy-editors.ts).
const K = 4;
const pairs = (K * (K - 1)) / 2;
const generate = (seed: number) => cliqueGraph(seed, K);
// A pick wins when every pair is linked.
const check = (picked: NetId[], g: PickerGraph) => {
  const set = new Set(g.links.map((l) => `${l.source}|${l.target}`));
  const linked = (a: NetId, b: NetId) => set.has(`${a}|${b}`) || set.has(`${b}|${a}`);
  let missing = 0;
  for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) if (!linked(picked[i], picked[j])) missing += 1;
  return missing === 0 ? { ok: true, msg: `Yes: all ${pairs} pairs are linked, a ${K}-clique.` } : { ok: false, msg: `Not yet: ${missing} of the ${pairs} pairs are not linked.` };
};

export const FourClique = () => (
  <div className="kit-net-demo">
    <NodePicker
      k={K}
      seed={1}
      generate={generate}
      check={check}
      prompt={<p>Pick <b>{K}</b> people who are all linked to each other. A {K}-clique has {pairs} links, one per pair. Tip: start from someone with many links.</p>}
      aria={`A random network of twelve people with a ${K}-clique hidden in it`}
    />
  </div>
);
