// Week 4 redesign · the deep dive's O*NET skills box, #cut-skills. Built from
// docs/weeks/week04/data/skills.json (analysis/week04_skills.py), which reuses
// section 2's own 60-occupation network and clusters (jobs.json) so every
// comparison here stays inside that same population: a random pair means a
// random pair of those 60, never of every rated occupation.

import { stripChart } from "./week04-strip.js";

const DATA = new URL("../../weeks/week04/data/skills.json", import.meta.url);
const sim = (x) => x.toFixed(2);

async function load() {
  const r = await fetch(DATA);
  if (!r.ok) throw new Error(`${DATA.pathname} ${r.status}`);
  return r.json();
}

function reveal(id, label, bodyEl) {
  const span = document.createElement("span");
  span.className = "w4-tip";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-describedby", id);
  btn.innerHTML =
    '<svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" stroke-width="2"></circle><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg>' +
    label;
  const pop = document.createElement("span");
  pop.className = "w4-pop";
  pop.id = id;
  pop.setAttribute("role", "tooltip");
  pop.appendChild(node2("b", label));
  pop.appendChild(bodyEl);
  span.append(btn, pop);
  return span;
}

// Plain HTML element helper (week04-strip.js's node() builds SVG elements).
function node2(tag, text) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  return el;
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
    <span class="w4-num">S1</span>
    <div>
      <h2>Do occupations the same companies hire together also need similar skills?</h2>
      <p class="w4-answer">Yes. Two occupations with a direct hiring tie in section 2's network need more
      alike skills, by O*NET's own ratings, than a random pair of the same ${c.occupations} occupations.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      O*NET rates every detailed occupation on ${descriptors} skills, knowledge areas and work activities;
      profile similarity is the cosine of those ratings, from -1 to 1. It never looks at which
      companies file for an occupation, so it checks section 2's story with independent data.
    </p>`;
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  notice.querySelector("span:last-child").append(
    frag(
      `Directly co-hired pairs average ${sim(d.mean)} similarity (n = ${d.n}), ${diff >= 0 ? "above" : "below"} the ` +
        `${sim(a.mean)} a random pair of the same ${c.occupations} occupations gets (n = ${a.n}), a gap of ${sim(Math.abs(diff))}. `,
    ),
    frag(
      `"All Other" codes blend more than one O*NET profile, which can flatten a single pair's similarity toward the average.`,
    ),
  );
  left.append(notice);

  const revealsRow = document.createElement("div");
  revealsRow.className = "w4-reveals";
  const howBody = document.createElement("span");
  howBody.append(
    frag(
      `Every pair here is one of the ${c.occupations} occupations shown in section 2's jobs network. A direct tie is an edge in ` +
        `that network (the same companies file for both). The random baseline is every pair among those ${c.occupations}, not ` +
        "every occupation O*NET rates, so a large or popular field cannot inflate the answer just by being large.",
    ),
  );
  const moreBody = document.createElement("span");
  const list = document.createElement("span");
  const examples = d.examples.slice(0, 3);
  list.textContent = examples.length
    ? `The most alike co-hired pairs: ${examples.map(pairLine).join("; ")}.`
    : "";
  moreBody.append(list);
  revealsRow.append(reveal("w4-pop-skills-direct-how", "How we tested it", howBody));
  revealsRow.append(reveal("w4-pop-skills-direct-more", "More numbers", moreBody));
  left.append(revealsRow);

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by hiring tie</h3>
    <p class="axis-note">
      Each row is the mean O*NET similarity over a group of occupation pairs among the ${c.occupations} shown in
      section 2's jobs network; the band is one standard deviation, not a null model.
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
    <span class="w4-num">S2</span>
    <div>
      <h2>Does that agreement hold for whole hiring clusters, not just direct ties?</h2>
      <p class="w4-answer">Mostly. Occupations in the same Louvain cluster as section 2 found it need more
      alike skills than occupations in different clusters, even when they share no direct hiring tie of their own.</p>
    </div>`;

  const two = document.createElement("div");
  two.className = "w4-two";
  const left = document.createElement("div");
  left.innerHTML = `
    <p class="sub">
      Section 2 groups the ${c.occupations} occupations into hiring clusters with Louvain, checked there against
      degree-preserving rewirings. This asks whether that grouping also lines up with skills, using pairs
      that are not already counted in S1 above.
    </p>`;
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<span class="ico">💡</span><span><b>What to notice</b></span>`;
  notice.querySelector("span:last-child").append(
    frag(
      `Same-cluster pairs without a direct tie still average ${sim(s.mean)} similarity (n = ${s.n}), above ` +
        `${sim(x.mean)} for pairs in different clusters (n = ${x.n}) and above the ${sim(a.mean)} random-pair ` +
        `baseline. Both cluster groups sit on either side of that baseline, not far from it: a hiring cluster ` +
        `tracks skills, but loosely.`,
    ),
  );
  left.append(notice);

  const revealsRow = document.createElement("div");
  revealsRow.className = "w4-reveals";
  const howBody = document.createElement("span");
  howBody.append(
    frag(
      "Same-cluster pairs exclude the direct ties S1 already counts, so this box asks a different question: does " +
        "the cluster as a whole share skills, beyond the companies that directly link two occupations. Different-" +
        `cluster pairs are every remaining pair across the ${c.occupations} occupations' cluster boundaries.`,
    ),
  );
  const moreBody = document.createElement("span");
  const bestSame = s.examples.slice(0, 2).map(pairLine).join("; ");
  const worstDiff = x.examples.slice(-2).map(pairLine).join("; ");
  moreBody.textContent =
    (bestSame ? `Most alike same-cluster pair without a direct tie: ${bestSame}. ` : "") +
    (worstDiff ? `Least alike pair across clusters: ${worstDiff}.` : "");
  revealsRow.append(reveal("w4-pop-skills-cluster-how", "How we tested it", howBody));
  revealsRow.append(reveal("w4-pop-skills-cluster-more", "More numbers", moreBody));
  left.append(revealsRow);

  const plot = document.createElement("div");
  plot.className = "plot";
  plot.innerHTML = `
    <h3>Skill similarity by cluster membership</h3>
    <p class="axis-note">
      Same row grouping as S1's chart; the dashed reference line is the all-pairs random baseline from that chart.
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
    body.replaceChildren(card1(c, data.meta.descriptors), card2(c));
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
