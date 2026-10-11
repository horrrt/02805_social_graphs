// Week 4 redesign · the deep dive's O*NET skills box, #cut-skills. Built from
// public/weeks/week04/data/skills.json (analysis/week04_skills.py), which reuses
// section 2's own 60-occupation network and clusters (jobs.json) so every
// comparison here stays inside that same population: a random pair means a
// random pair of those 60, never of every rated occupation. The box
// (src/features/week04/skills/Skills.tsx) draws boxes 3 and 4 from the text
// and strips built here.

const sim = (x) => x.toFixed(2);
const count = (n) => n.toLocaleString("en-US");
// A permutation p-value can't go below 1 / (shuffles + 1): name the bound instead.
const pText = (p) => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`);

function pairLine(ex) {
  return `${ex.a_title} and ${ex.b_title} (${sim(ex.similarity)})`;
}

export const INTRO =
  "Section 2 grouped occupations by which companies file for them together. O*NET, the Department of " +
  "Labor's database of what each job involves, offers an independent check: box 3 and box 4 ask whether jobs " +
  "hired together also need similar skills, and box 5 lets you compare any occupations side by side.";

/** Box 3: hired together, alike in skills. */
export function card1(c, descriptors) {
  const t = c.strength;
  const rho = t.spearman;
  const quarters = t.quarters;
  const a = c.all_pairs;
  const examples = quarters[3].examples.slice(0, 3);
  const names = ["Hired together least", "Second quarter", "Third quarter", "Hired together most"];
  return {
    lead: `O*NET rates every detailed occupation on ${descriptors} skills, knowledge areas and work activities.`,
    background: "It never looks at which companies file for an occupation, so it checks section 2 with independent data.",
    notice:
      `The quarter of pairs hired together most average ${sim(quarters[3].mean)} similarity, the quarter hired ` +
      `together least ${sim(quarters[0].mean)}. Shuffling skill profiles within official job groups gives a ` +
      `correlation of ${sim(rho.null_within_major_mean)}; the real one is ${sim(rho.real)} (${pText(rho.p_within_major)}).`,
    method: [
      `Every pair of the ${c.occupations} occupations in section 2's jobs network counts, ${count(t.pairs)} in all; ` +
        `${count(t.pairs_with_cohiring)} share at least one company. How strongly a pair is hired together is its lift: ` +
        "the companies filing for both, divided by what the two occupations' sizes predict, so two large occupations " +
        "do not score high just for being large. The correlation is Spearman's, between lift and O*NET similarity.",
      `The null shuffles which occupation carries which O*NET profile, ${count(t.perms)} times. Shuffling only within ` +
        `each of the ${t.majors} SOC major groups keeps "two computer jobs are alike" intact, so beating that null means ` +
        `hiring tracks skills beyond the official groups. Free shuffles average ${sim(rho.null_free_mean)} (${pText(rho.p_free)}).`,
    ],
    more: [
      examples.length ? `The most alike pairs in the top quarter: ${examples.map(pairLine).join("; ")}.` : "",
      `Section 2's drawn links, each occupation's three strongest, average ${sim(c.direct_ties.mean)} ` +
        `over ${c.direct_ties.n} pairs. "All Other" codes blend more than one O*NET profile, which can flatten a ` +
        "single pair's similarity toward the average.",
    ],
    occupations: c.occupations,
    strip: {
      rows: quarters.map((q, i) => ({
        label: names[i],
        sub: i === quarters.length - 1 ? `lift ${q.lift_from.toFixed(1)} or more` : `lift ${q.lift_from.toFixed(1)} to ${q.lift_to.toFixed(1)}`,
        real: q.mean,
        realLabel: sim(q.mean),
        realTip: `${q.n} pairs: mean ${sim(q.mean)}, sd ${sim(q.sd)}`,
      })),
      opts: {
        domain: [0, 0.6],
        ticks: [0, 0.2, 0.4, 0.6],
        fmt: (v) => v.toFixed(1),
        labelW: 150,
        badgeW: 0,
        ref: [a.mean, `random pair ${sim(a.mean)}`],
        aria: `Mean O*NET similarity of occupation pairs by quarter of co-hiring lift, against a random pair of the same ${c.occupations}`,
      },
    },
  };
}

/** Box 4: whole hiring clusters. */
export function card2(c) {
  const s = c.same_cluster_other_pairs;
  const x = c.different_cluster_pairs;
  const a = c.all_pairs;
  const g = c.cluster_gap;
  const bestSame = s.examples.slice(0, 2).map(pairLine).join("; ");
  const worstDiff = x.examples.slice(-2).map(pairLine).join("; ");
  return {
    occupations: c.occupations,
    notice:
      `Same-cluster pairs without a drawn link average ${sim(s.mean)} similarity, against ${sim(x.mean)} across ` +
      `clusters. Official job groups alone would give a gap of ${sim(g.null_within_major_mean)}; the clusters add ` +
      `a little more (${sim(g.real)}, ${pText(g.p_within_major)}): a hiring cluster tracks skills, but loosely.`,
    method: [
      "Same-cluster pairs exclude the links section 2 draws, so this box asks a different question: does " +
        "the cluster as a whole share skills, beyond the companies that most strongly link two occupations. Different-" +
        `cluster pairs are every remaining pair across the ${c.occupations} occupations' cluster boundaries.`,
      `The averages cover ${s.n} same-cluster pairs and ${x.n} pairs in different clusters. The gap is tested ` +
        "against the same within-group shuffles as box 3. Section 2 checked its clusters against degree-preserving rewirings.",
    ],
    more:
      (bestSame ? `Most alike same-cluster pair without a drawn link: ${bestSame}. ` : "") +
      (worstDiff ? `Least alike pair across clusters: ${worstDiff}.` : ""),
    strip: {
      rows: [
        {
          label: "Same cluster",
          sub: `${s.n} pairs, no drawn link`,
          real: s.mean,
          realLabel: sim(s.mean),
          realTip: `Same cluster, no drawn link: mean ${sim(s.mean)}, sd ${sim(s.sd)}`,
          ref: [a.mean, `random pair ${sim(a.mean)}`],
        },
        {
          label: "Different cluster",
          sub: `${x.n} pairs`,
          real: x.mean,
          realLabel: sim(x.mean),
          realTip: `Different cluster: mean ${sim(x.mean)}, sd ${sim(x.sd)}`,
          divider: true,
        },
      ],
      opts: {
        domain: [0, 0.6],
        ticks: [0, 0.2, 0.4, 0.6],
        fmt: (v) => v.toFixed(1),
        labelW: 150,
        badgeW: 0,
        aria: "Mean O*NET similarity of same-cluster pairs against different-cluster pairs, with the random-pair baseline",
      },
    },
  };
}
