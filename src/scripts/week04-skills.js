// Week 4 redesign · the deep dive's O*NET skills box, #cut-skills. Built from
// docs/weeks/week04/data/skills.json (analysis/week04_skills.py), which reuses
// section 2's own 60-occupation network and clusters (jobs.json) so every
// comparison here stays inside that same population: a random pair means a
// random pair of those 60, never of every rated occupation.

import { asset } from "./site.js";
import { stripChart } from "./week04-strip.js";
import { drawer, drawerRow, termify } from "./week04-ui.js";

const DATA = asset("weeks/week04/data/skills.json");
const sim = (x) => x.toFixed(2);

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
  const d = c.direct_ties;
  const a = c.all_pairs;
  const diff = d.mean - a.mean;
  const article = document.createElement("div");
  article.className = "card w4-card";
  article.id = "cut-skills-direct";

  const header = document.createElement("header");
  header.className = "w4-q";
  header.innerHTML = `
    <span class="w4-num">3</span>
    <div>
      <h2>Do occupations the same companies hire together also need similar skills?</h2>
      <p class="w4-answer">Yes. Directly co-hired occupations need more alike skills than a random pair of the
      same ${c.occupations}.</p>
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
      `Directly co-hired pairs average ${sim(d.mean)} similarity, ${diff >= 0 ? "above" : "below"} the ` +
        `${sim(a.mean)} of a random pair from the same ${c.occupations} occupations.`,
    ),
  );
  termify(
    notice,
    "similarity",
    "The cosine of two occupations' O*NET ratings, from -1 to 1. Higher means more alike skills.",
    "w4-term-cut-skills-direct-similarity",
  );
  left.append(notice);

  const howBody = document.createElement("p");
  howBody.append(
    frag(
      `Every pair here is one of the ${c.occupations} occupations shown in section 2's jobs network. A direct tie is an edge in ` +
        `that network (the same companies file for both). The random baseline is every pair among those ${c.occupations}, not ` +
        "every occupation O*NET rates, so a large or popular field cannot inflate the answer just by being large.",
    ),
  );
  const moreBody = document.createElement("p");
  const list = document.createElement("span");
  const examples = d.examples.slice(0, 3);
  list.textContent = examples.length
    ? `The most alike co-hired pairs: ${examples.map(pairLine).join("; ")}.`
    : "";
  moreBody.append(list);
  const moreCounts = document.createElement("p");
  moreCounts.append(
    frag(
      `The averages cover ${d.n} co-hired pairs and ${a.n} random pairs, a gap of ${sim(Math.abs(diff))}. ` +
        `"All Other" codes blend more than one O*NET profile, which can flatten a single pair's similarity toward the average.`,
    ),
  );
  const moreNumbers = document.createElement("div");
  moreNumbers.append(moreBody, moreCounts);
  left.append(drawerRow(drawer("Background", background), drawer("Method", howBody), drawer("More numbers", moreNumbers)));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by hiring tie</h3>
    <p class="axis-note">
      Each row is the mean O*NET similarity over a group of occupation pairs; the band is one standard deviation,
      not a null model.
    </p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  host.append(
    stripChart(
      [
        {
          label: "Direct hiring tie",
          sub: `${d.n} pairs`,
          real: d.mean,
          realLabel: sim(d.mean),
          realTip: `Direct ties: mean ${sim(d.mean)}, sd ${sim(d.sd)}`,
          base: [a.mean, a.sd],
          baseLabel: `random pair ${sim(a.mean)}`,
          baseTip: `Random pair of the ${c.occupations}: mean ${sim(a.mean)}, sd ${sim(a.sd)}`,
        },
      ],
      {
        domain: [0, 0.6],
        ticks: [0, 0.2, 0.4, 0.6],
        fmt: (v) => v.toFixed(1),
        labelW: 150,
        badgeW: 0,
        aria: `Mean O*NET similarity of directly co-hired occupation pairs against a random pair of the same ${c.occupations}`,
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
      those clusters also share skills, leaving out the pairs box 3 already counts.
    </p>`;
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  notice.querySelector("span:last-child").append(
    frag(
      `Same-cluster pairs without a direct tie average ${sim(s.mean)} similarity, against ${sim(x.mean)} across ` +
        `clusters. Both sit close to the ${sim(a.mean)} random-pair baseline: a hiring cluster tracks skills, but loosely.`,
    ),
  );
  left.append(notice);

  const howBody = document.createElement("div");
  const howWhat = document.createElement("p");
  howWhat.append(
    frag(
      "Same-cluster pairs exclude the direct ties box 3 already counts, so this box asks a different question: does " +
        "the cluster as a whole share skills, beyond the companies that directly link two occupations. Different-" +
        `cluster pairs are every remaining pair across the ${c.occupations} occupations' cluster boundaries.`,
    ),
  );
  const howCounts = document.createElement("p");
  howCounts.append(
    frag(
      `The averages cover ${s.n} same-cluster pairs and ${x.n} pairs in different clusters. Section 2 checked its ` +
        "clusters against degree-preserving rewirings.",
    ),
  );
  howBody.append(howWhat, howCounts);
  const moreBody = document.createElement("p");
  const bestSame = s.examples.slice(0, 2).map(pairLine).join("; ");
  const worstDiff = x.examples.slice(-2).map(pairLine).join("; ");
  moreBody.textContent =
    (bestSame ? `Most alike same-cluster pair without a direct tie: ${bestSame}. ` : "") +
    (worstDiff ? `Least alike pair across clusters: ${worstDiff}.` : "");
  left.append(drawerRow(drawer("Method", howBody), drawer("More numbers", moreBody)));

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by cluster membership</h3>
    <p class="axis-note">
      Same row grouping as box 3's chart; the dashed reference line is the all-pairs random baseline from that chart.
    </p>`;
  const host = document.createElement("div");
  host.className = "w4-figure-body";
  host.append(
    stripChart(
      [
        {
          label: "Same cluster",
          sub: `${s.n} pairs, no direct tie`,
          real: s.mean,
          realLabel: sim(s.mean),
          realTip: `Same cluster, no direct tie: mean ${sim(s.mean)}, sd ${sim(s.sd)}`,
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
