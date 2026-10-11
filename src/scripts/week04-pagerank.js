// Week 4 redesign · the deep dive's PageRank explorable, #cut-pagerank. Built
// from public/weeks/week04/data/pagerank.json (analysis/week04_pagerank.py):
// PageRank on section 2's occupation network, kept to its strongest ties (the
// disparity-filter backbone, alpha = 0.05), at three damping factors, plus a
// from-scratch power iteration checked against nx.pagerank. Nothing here is
// computed in the browser; every number comes from that JSON. The box
// (src/features/week04/pagerank/PageRank.tsx) draws the cards from the text
// and rows built here.

export const DEFAULT_D = "0.85";
export const BAR_W = 556;
export const ROW_H = 24;
export const TOP_SHOWN = 15;

// Display names for the two titles too long for a label column. Every chart
// keeps the full title in its <title> tooltip.
const SHORT = {
  "Software Quality Assurance Analysts and Testers": "Software QA Analysts and Testers",
  "Medical Scientists, Except Epidemiologists": "Medical Scientists",
};
export const short = (title) => SHORT[title] ?? title;

export const INTRO =
  "PageRank scores a node by how often a random walker lands on it: at each step the walker follows a link " +
  "with probability d, the damping factor, and otherwise jumps to a random node. Here it runs on section 2's " +
  "occupation network, kept to its strongest ties.";

/** The bars for one damping factor's top occupations. */
export function pagerankRows(list) {
  const max = Math.max(...list.map((r) => r.pagerank));
  return {
    max,
    rows: list.map((r) => ({
      rank: r.rank,
      label: short(r.title),
      value: r.pagerank,
      badge: r.degree_rank ?? undefined,
      tip: `${r.title}: PageRank ${r.pagerank.toFixed(4)}, filings ${r.filings.toLocaleString("en-US")}`,
    })),
  };
}

/** Box 6's text: the notice and the More numbers paragraphs. */
export function dampingText(data) {
  // The damping pair the overlap compares, read from its own key
  // ("top15_overlap_d0_5_vs_d0_99" -> 0.5 and 0.99).
  const OVERLAP_KEY = "top15_overlap_d0_5_vs_d0_99";
  const overlap5v99 = data.finding[OVERLAP_KEY];
  const [overlapLo, overlapHi] = OVERLAP_KEY.match(/_d(\d+_\d+)_vs_d(\d+_\d+)$/)
    .slice(1)
    .map((s) => Number(s.replace("_", ".")));
  const overlapDeg = data.finding.pagerank_vs_degree_top15_overlap;
  const overlapStr = data.finding.pagerank_vs_strength_top15_overlap;
  const lo = data.damping[0];
  const hi = data.damping.at(-1);
  const movers = data.movers.slice(0, 4);
  return {
    answer: `Yes. Raising it from ${data.damping[0]} to ${data.damping.at(-1)} moves the ranking away from plain tie counts.`,
    notice:
      `The top ${TOP_SHOWN} at d = ${overlapLo} and at d = ${overlapHi} share only ${overlap5v99} of ${TOP_SHOWN} ` +
      "occupations, so the damping factor reorders the ranking.",
    method:
      `The network is section 2's companies x occupations projection, kept to its disparity-filter backbone at ` +
      `alpha = ${data.meta.alpha_filter} (stricter than section 2's own alpha = ${data.meta.section2_alpha_filter} ` +
      `backbone, chosen so the ranking has to lean on network position, not just tie count): ${data.meta.nodes} of the ` +
      `${data.meta.nodes_before_backbone} occupations, ${data.meta.edges} of its ${data.meta.edges_before_backbone} ` +
      `ties. A firm-to-client staffing network was tried first and rejected: with no incoming ties for a firm and ` +
      `no outgoing ones for a client, every firm gets the same score and the damping factor cannot reorder the ` +
      `clients either, whatever value it takes. PageRank runs on the occupation network from section 2, trimmed by ` +
      `the disparity filter at α = ${data.meta.alpha_filter} to its largest connected piece.`,
    movers: movers.length
      ? `Biggest movers between d = ${lo} and d = ${hi}: ${movers.map((m) => `${m.title} (rank ${m.rank_d0_5} → ${m.rank_d0_99})`).join("; ")}.`
      : "",
    overlap:
      `At d = ${DEFAULT_D}, PageRank's top ${TOP_SHOWN} shares ${overlapDeg} of ${TOP_SHOWN} with plain unweighted-degree's ` +
      `top ${TOP_SHOWN}, and ${overlapStr} of ${TOP_SHOWN} with weighted strength's (the projection's own edge weight, ` +
      "shared companies). Being tied to the right occupations matters as much as how many ties there are. " +
      "Raising the damping factor moves the ranking toward occupations linked to the biggest hubs.",
  };
}

/** The step (from it.steps) at which keyFn's value settles into its final
 * value and never changes again, scanning backward from the last step. */
export function stablePoint(steps, keyFn) {
  const finalKey = keyFn(steps.at(-1));
  let stable = steps.at(-1).step;
  for (let i = steps.length - 1; i >= 0 && keyFn(steps[i]) === finalKey; i--) stable = steps[i].step;
  return stable;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const word = (n) => WORDS[n] ?? String(n);

/** What the card claims, all read from it.steps: the round from which the
 * final leader holds first place, the round from which the top 10 holds its
 * final members, the round from which it holds its final order, and who led
 * after the first round. */
export function iterationClaims(it) {
  const codes = (s) => s.rows.map((r) => r.code);
  const leaderStep = stablePoint(it.steps, (s) => s.rows[0].code);
  const setStep = stablePoint(it.steps, (s) => [...codes(s)].sort().join(","));
  const orderStep = stablePoint(it.steps, (s) => codes(s).join(","));
  const first = it.steps.find((s) => s.step > 0);
  return {
    leaderStep,
    setStep,
    orderStep,
    leaderTitle: it.steps.at(-1).rows[0].title,
    firstStep: first.step,
    firstLeaderTitle: first.rows[0].title,
  };
}

/** Box 7's text, every claim built from iterationClaims. */
export function iterationText(data) {
  const it = data.iteration;
  const claims = iterationClaims(it);
  const n = it.steps.at(-1).rows.length;
  const firstLead =
    claims.firstLeaderTitle === claims.leaderTitle
      ? `${claims.leaderTitle} lead from round ${claims.leaderStep} and hold first place for good.`
      : `After round ${claims.firstStep} ${claims.firstLeaderTitle} lead; from round ${claims.leaderStep} ` +
        `${claims.leaderTitle} hold first place for good.`;
  return {
    claims,
    n,
    answer: `${claims.leaderTitle} leads from round ${claims.leaderStep}; the rest of the top ${n} settles by round ${claims.orderStep}.`,
    lead:
      "Every occupation starts with an equal score, and each round passes it along the network's ties: the same walk " +
      `PageRank repeats until nothing moves. The chart follows the ${word(n)} occupations that finish on top.`,
    notice:
      `${firstLead} The grey lines stop crossing by round ${claims.orderStep}` +
      (claims.orderStep > claims.setStep ? `, after the top ${n} has its final members at round ${claims.setStep}` : "") +
      ".",
    check:
      `The rounds use damping d = ${it.alpha}, and the final scores match a standard PageRank calculation within ` +
      `${it.max_error_vs_nx_pagerank}.`,
    step:
      "Each step redistributes (1 - d)/n to every occupation, plus d times the score its ties send it, split by " +
      "each neighbour's total tie weight. No dangling-node correction is needed: every occupation in this " +
      "network has at least one tie, unlike a firm-to-client network where one whole side has none.",
    more:
      `Run to step ${it.steps.at(-1).step}, where every occupation's score matches the standard PageRank routine's fixed point ` +
      `within ${it.max_error_vs_nx_pagerank}: past that point, one more round would not change the ranking. At round 0 ` +
      `every occupation holds the same score, 1/${data.meta.nodes}, so the chart starts at round ${claims.firstStep}.`,
    heading: `First place settles by round ${word(claims.leaderStep)}, the top ${n} by round ${word(claims.setStep)}`,
    note: `Rank after each round for the ${word(n)} occupations that finish on top. A hollow dot on the bottom line means outside the top ${n} at that round.`,
  };
}
