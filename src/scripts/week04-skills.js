// Week 4 redesign · the deep dive's O*NET skills box, #cut-skills. Built from
// public/weeks/week04/data/skills.json (analysis/week04_skills.py), which reuses
// section 2's own 60-occupation network and clusters (jobs.json) so every
// comparison here stays inside that same population: a random pair means a
// random pair of those 60, never of every rated occupation.

import { asset } from "./site.js";
import { stripChart } from "./week04-strip.js";
import { drawer, drawerRow, termify } from "./week04-ui.js";

const DATA = asset("weeks/week04/data/skills.json");
const sim = (x) => x.toFixed(2);
const count = (n) => n.toLocaleString("en-US");
// A permutation p-value can't go below 1 / (shuffles + 1): name the bound instead.
const pText = (p) => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`);

async function load() {
  const r = await fetch(DATA);
  if (!r.ok) throw new Error(`${DATA.pathname} ${r.status}`);
  return r.json();
}

function frag(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function pairLine(ex) {
  return `${ex.a_title} and ${ex.b_title} (${sim(ex.similarity)})`;
}

function card1(c, descriptors) {
  const t = c.strength;
  const rho = t.spearman;
  const quarters = t.quarters;
  const a = c.all_pairs;
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-skills-direct";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">3</span>
    <div>
      <h2>Do occupations the same companies hire together also need similar skills?</h2>
      <p class="w4-answer">Yes. The more companies two occupations share, the more alike their skills, and not only
      because they sit in the same official job group.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  // One sentence of lead stays visible; why O*NET is independent goes in Background.
  const lead = document.createElement("p");
  lead.className = "sub";
  lead.textContent = `O*NET rates every detailed occupation on ${descriptors} skills, knowledge areas and work activities.`;
  left.append(lead);
  const background = document.createElement("p");
  background.textContent =
    "It never looks at which companies file for an occupation, so it checks section 2 with independent data.";
  termify(
    lead,
    "O*NET",
    "The US Department of Labor's database of what each occupation involves, rated from surveys of workers and analysts.",
    "w4-term-cut-skills-direct-onet",
  );
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  notice.querySelector("span:last-child").append(
    frag(
      `The quarter of pairs hired together most average ${sim(quarters[3].mean)} similarity, the quarter hired ` +
        `together least ${sim(quarters[0].mean)}. Shuffling skill profiles within official job groups gives a ` +
        `correlation of ${sim(rho.null_within_major_mean)}; the real one is ${sim(rho.real)} (${pText(rho.p_within_major)}).`,
    ),
  );
  termify(
    notice,
    "similarity",
    "The cosine of two occupations' O*NET ratings, from -1 to 1. Higher means more alike skills.",
    "w4-term-cut-skills-direct-similarity",
  );
  left.append(notice);

  const howBody = document.createElement("div");
  const howWhat = document.createElement("p");
  howWhat.append(
    frag(
      `Every pair of the ${c.occupations} occupations in section 2's jobs network counts, ${count(t.pairs)} in all; ` +
        `${count(t.pairs_with_cohiring)} share at least one company. How strongly a pair is hired together is its lift: ` +
        "the companies filing for both, divided by what the two occupations' sizes predict, so two large occupations " +
        "do not score high just for being large. The correlation is Spearman's, between lift and O*NET similarity.",
    ),
  );
  const howNull = document.createElement("p");
  howNull.append(
    frag(
      `The null shuffles which occupation carries which O*NET profile, ${count(t.perms)} times. Shuffling only within ` +
        `each of the ${t.majors} SOC major groups keeps "two computer jobs are alike" intact, so beating that null means ` +
        `hiring tracks skills beyond the official groups. Free shuffles average ${sim(rho.null_free_mean)} (${pText(rho.p_free)}).`,
    ),
  );
  howBody.append(howWhat, howNull);
  const moreBody = document.createElement("p");
  const examples = quarters[3].examples.slice(0, 3);
  moreBody.textContent = examples.length
    ? `The most alike pairs in the top quarter: ${examples.map(pairLine).join("; ")}.`
    : "";
  const moreCounts = document.createElement("p");
  moreCounts.append(
    frag(
      `Section 2's drawn links, each occupation's three strongest, average ${sim(c.direct_ties.mean)} ` +
        `over ${c.direct_ties.n} pairs. "All Other" codes blend more than one O*NET profile, which can flatten a ` +
        "single pair's similarity toward the average.",
    ),
  );
  const moreNumbers = document.createElement("div");
  moreNumbers.append(moreBody, moreCounts);
  left.append(drawerRow(drawer("Background", background), drawer("Method", howBody), drawer("More numbers", moreNumbers)));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by how often companies hire both</h3>
    <p class="axis-note">
      Mean O*NET similarity of the pairs in each quarter of lift. The dashed line is a random pair of the same
      ${c.occupations}.
    </p>`;
  const names = ["Hired together least", "Second quarter", "Third quarter", "Hired together most"];
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  host.append(
    stripChart(
      quarters.map((q, i) => ({
        label: names[i],
        sub: i === quarters.length - 1 ? `lift ${q.lift_from.toFixed(1)} or more` : `lift ${q.lift_from.toFixed(1)} to ${q.lift_to.toFixed(1)}`,
        real: q.mean,
        realLabel: sim(q.mean),
        realTip: `${q.n} pairs: mean ${sim(q.mean)}, sd ${sim(q.sd)}`,
      })),
      {
        domain: [0, 0.6],
        ticks: [0, 0.2, 0.4, 0.6],
        fmt: (v) => v.toFixed(1),
        labelW: 150,
        badgeW: 0,
        ref: [a.mean, `random pair ${sim(a.mean)}`],
        aria: `Mean O*NET similarity of occupation pairs by quarter of co-hiring lift, against a random pair of the same ${c.occupations}`,
      },
    ),
  );
  plot.append(host);
  two.append(left, plot);
  article.append(header, two);
  return article;
}

function card2(c) {
  const s = c.same_cluster_other_pairs;
  const x = c.different_cluster_pairs;
  const a = c.all_pairs;
  const g = c.cluster_gap;
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-skills-cluster";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">4</span>
    <div>
      <h2>Does that agreement hold for whole hiring clusters, not just direct ties?</h2>
      <p class="w4-answer">Mostly. Occupations in the same hiring cluster need more alike skills than pairs in
      different clusters, even without a direct tie.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      Section 2 groups the ${c.occupations} occupations into hiring clusters with Louvain. This box asks whether
      those clusters also share skills, leaving out the pairs section 2 draws as links.
    </p>`;
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  notice.querySelector("span:last-child").append(
    frag(
      `Same-cluster pairs without a drawn link average ${sim(s.mean)} similarity, against ${sim(x.mean)} across ` +
        `clusters. Official job groups alone would give a gap of ${sim(g.null_within_major_mean)}; the clusters add ` +
        `a little more (${sim(g.real)}, ${pText(g.p_within_major)}): a hiring cluster tracks skills, but loosely.`,
    ),
  );
  left.append(notice);

  const howBody = document.createElement("div");
  const howWhat = document.createElement("p");
  howWhat.append(
    frag(
      "Same-cluster pairs exclude the links section 2 draws, so this box asks a different question: does " +
        "the cluster as a whole share skills, beyond the companies that most strongly link two occupations. Different-" +
        `cluster pairs are every remaining pair across the ${c.occupations} occupations' cluster boundaries.`,
    ),
  );
  const howCounts = document.createElement("p");
  howCounts.append(
    frag(
      `The averages cover ${s.n} same-cluster pairs and ${x.n} pairs in different clusters. The gap is tested ` +
        "against the same within-group shuffles as box 3. Section 2 checked its clusters against degree-preserving rewirings.",
    ),
  );
  howBody.append(howWhat, howCounts);
  const moreBody = document.createElement("p");
  const bestSame = s.examples.slice(0, 2).map(pairLine).join("; ");
  const worstDiff = x.examples.slice(-2).map(pairLine).join("; ");
  moreBody.textContent =
    (bestSame ? `Most alike same-cluster pair without a drawn link: ${bestSame}. ` : "") +
    (worstDiff ? `Least alike pair across clusters: ${worstDiff}.` : "");
  left.append(drawerRow(drawer("Method", howBody), drawer("More numbers", moreBody)));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by cluster membership</h3>
    <p class="axis-note">
      Mean O*NET similarity per group of pairs; the dashed line is the random-pair baseline from box 3's chart.
    </p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  host.append(
    stripChart(
      [
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
      {
        domain: [0, 0.6],
        ticks: [0, 0.2, 0.4, 0.6],
        fmt: (v) => v.toFixed(1),
        labelW: 150,
        badgeW: 0,
        aria: "Mean O*NET similarity of same-cluster pairs against different-cluster pairs, with the random-pair baseline",
      },
    ),
  );
  plot.append(host);
  two.append(left, plot);
  article.append(header, two);
  return article;
}

async function render() {
  const body = document.getElementById("skills-body");
  const status = document.getElementById("skills-status");
  try {
    const data = await load();
    const c = data.cohiring;
    const intro = document.createElement("p");
    intro.className = "w4-box-intro";
    intro.textContent =
      "Section 2 grouped occupations by which companies file for them together. O*NET, the Department of " +
      "Labor's database of what each job involves, offers an independent check: box 3 and box 4 ask whether jobs " +
      "hired together also need similar skills, and box 5 lets you compare any occupations side by side.";
    body.replaceChildren(intro, card1(c, data.meta.descriptors), card2(c));
  } catch (err) {
    status.textContent = "Could not load the O*NET comparison.";
    console.error("week04-skills", err);
  }
}

function wire() {
  const details = document.getElementById("cut-skills");
  if (!details) return;
  let done = false;
  const open = () => {
    if (done || !details.open) return;
    done = true;
    render();
  };
  details.addEventListener("toggle", open);
  open();
}

wire();
