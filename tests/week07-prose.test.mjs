// Pins the Week 7 post, /weeks/week07/ (the hero, findings, #explore,
// #together, #unit, #only and closing), to comention.json, so a rerun of
// analysis/week07_comention.py that moves a number fails here instead of
// leaving the prose behind.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { block, flatten } from "./week04-html.mjs";
import { builtPage } from "./built-page.mjs";
import { heroSentences, partners, PICKS, START } from "../src/scripts/week07-comention.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");
const html = builtPage("out/weeks/week07/index.html");
const data = JSON.parse(read("public/weeks/week07/data/comention.json"));
const f = data.facts;
const page = flatten(html);
const pct = (v) => `${Math.round(v * 100)}%`;
const count = (n) => n.toLocaleString("en-US");
const says = (where, text) => {
  const s = where === "page" ? page : flatten(block(html, where));
  assert.ok(s.includes(text), `${where} should say "${text}"`);
};
const s = f.units.sentence;
const para = f.units.paragraph;
const pg = f.units.page;
const ner = f.ner_sentence;
const top = f.weights.at(-1);
const one = f.weights[0];

test("week 7 is Gyula's, is published, links its campaign and has no placeholder left", () => {
  for (const id of ["opening", "explore", "together", "unit", "only", "game", "closing"]) {
    assert.match(html, new RegExp(`<section class="step" data-owner="Gyula" id="${id}">`));
  }
  assert.doesNotMatch(html, /[Tt]oy (figure|numbers|network)|<<<<<<<|>>>>>>>/);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex"/);
  assert.match(html, /href="\.\.\/\.\.\/play\/week07\/"/);
  // Published before the group's review, so the AI note still says so.
  assert.match(html, /The group has not yet reviewed this page\./);
  assert.match(read("analysis/week07_comention.py"), /Owner: Gyula/);
});

test("the corpus and the names are the script's", () => {
  says("opening", `into ${count(f.sentences)} sentences`);
  says("opening", `${count(f.links)} linked pairs`);
  says("opening", `${f.characters_named} of the ${f.pages} characters are named somewhere, ${count(f.mentions)} times in all`);
  says("top", `in all ${count(f.sentences)} sentences`);
  says("unit", `as we did ${f.names.kept_by_hand}, such as Psylocke`);
  says("unit", `We rejected ${f.names.rejected_by_hand} aliases`);
  says("unit", `blocked ${f.names.blocked} phrases`);
  says("unit", `${count(f.raw_person_strings)} different strings as a person across the pages, against the ${f.characters_named} characters`);
});

test("the brief's Spider-Man example is reproduced and the page says so", () => {
  const c = f.course;
  assert.deepEqual([c.sentences, c.person_spans, c.distinct, c.nodes, c.edges], [445, 635, 179, 146, 293]);
  const text = `${c.sentences} sentences, ${c.person_spans} PERSON spans, ${c.distinct} different, and a network of ${c.nodes} names and ${c.edges} ties`;
  says("unit", text);
  says("closing", text);
  const ref = JSON.parse(read("analysis/course_reference.json"));
  const rows = ref.network.filter((r) => r.what.startsWith("Spider-Man"));
  assert.equal(rows.length, 9);
  assert.ok(rows.every((r) => r.match));
});

test("the hero, findings and section 2 quote the sentence network", () => {
  says("top", `${pct(s.share_linked)} of the pairs a sentence names are linked, against ${pct(s.null_mean)} in the same network rewired at random`);
  says("top", `find only ${pct(s.share_links_found)} of the links`);
  assert.match(flatten(block(html, "top")), new RegExp(`${pct(s.share_links_found)}\\s*of the ${count(f.links)} linked pairs have a sentence that names both`));
  says("findings", `${count(s.ties)} pairs of characters are named in one sentence somewhere. ${pct(s.share_linked)} of them are linked, against ${pct(s.null_mean)}`);
  says("explore", `${count(s.ties)} pairs of characters are named in one sentence somewhere, and ${pct(s.share_linked)} of them are linked`);
  says("together", `${pct(s.share_linked)} of the time, against ${pct(s.null_mean)} when the network is rewired; ${pct(top.share_linked)} when ten or more sentences name the pair`);
  says("together", `${count(s.ties)} pairs in all`);
  says("together", `rewires the text network ${count(f.runs)} times`);
  says("together", `linked ${pct(one.share_linked)} of the time, against ${pct(one.null_mean)} rewired; a pair named in ten or more, ${pct(top.share_linked)}, against ${pct(top.null_mean)}`);
  says("findings", `linked ${pct(one.share_linked)} of the time; a pair named in 10 or more, ${pct(top.share_linked)}, against ${pct(top.null_mean)} rewired`);
  says("together", `share linked is ${pct(s.share_linked)} against a rewired ${(s.null_mean * 100).toFixed(1)}% ± ${(s.null_sd * 100).toFixed(1)}, a z-score of ${s.z.toFixed(0)}`);
  says("together", `Of the ${count(f.arcs.arcs)} one-way links, ${count(f.arcs.source_names_target)} (${pct(f.arcs.source_names_target / f.arcs.arcs)})`);
  assert.equal(top.bin, "10+");
  // "works like a confidence score": the share linked rises with every bin.
  assert.ok(f.weights.every((w, i) => i === 0 || w.share_linked > f.weights[i - 1].share_linked));
  // The pair named together most often is the one the notice names.
  const best = data.ties.slice().sort((a, b) => b[2] - a[2])[0];
  assert.deepEqual([data.chars[best[0]], data.chars[best[1]]].sort(), ["Spider-Man", "Venom (character)"]);
  says("together", `Spider-Man and Venom share the most sentences, ${best[2]}`);
});

test("section 3 quotes the units and the instrument check", () => {
  says("unit", `One page finds ${pct(pg.share_links_found)} of the links, but only ${pct(pg.share_linked)} of its pairs are links; one sentence finds ${pct(s.share_links_found)}, with ${pct(s.share_linked)} linked. spaCy's tagger finds ${pct(ner.share_links_found)}`);
  says("findings", `One sentence finds ${pct(s.share_links_found)} of the links, one paragraph ${pct(para.share_links_found)}, one page ${pct(pg.share_links_found)}; but only ${pct(pg.share_linked)} of the pairs one page names are linked. spaCy's tagger finds ${pct(ner.share_links_found)}`);
  // "A wider unit finds more of the links and adds many more pairs that are not links."
  assert.ok(s.share_links_found < para.share_links_found && para.share_links_found < pg.share_links_found);
  assert.ok(s.ties < para.ties && para.ties < pg.ties);
  // "spaCy's tagger is more often right, and finds fewer."
  assert.ok(ner.share_linked > s.share_linked && ner.share_links_found < s.share_links_found);
  const i = f.instrument;
  says("unit", `It found ${i.ner.right} of the ${i.mentions} mentions in the ${i.sentences} sentences. Our names list found ${i.names.right}`);
  says("unit", `We read ${i.sentences} sentences drawn at random from all ${count(f.sentences)}`);
  says("unit", `name ${i.mentions} characters in all`);
  says("unit", `our names were right ${pct(i.names.precision)} of the time and the tagger ${pct(i.ner.precision)}; our names found ${pct(i.names.recall)} of the ${i.mentions} and the tagger ${pct(i.ner.recall)}`);
  says("closing", `Our names find ${pct(i.names.recall)} of the character mentions in ${i.sentences} sentences we read, and are right for ${pct(i.names.precision)}`);
  // The examples the notice names are in the reading: missed by the tagger, or by our names.
  const read_ = data.sentences_read;
  for (const name of ["Cyclops (Marvel Comics)", "Golem (Marvel Comics)", "Speed (character)"]) {
    assert.ok(read_.some((r) => r.read.includes(name) && !r.ner.includes(name)), `the tagger misses ${name}`);
  }
  for (const [name, word] of [["Brian Braddock", "Brian"], ["Luke Cage", "Cage"]]) {
    assert.ok(read_.some((r) => r.read.includes(name) && !r.names.includes(name) && r.sentence.includes(word)), `our names miss ${word}`);
  }
  assert.ok(read_.some((r) => r.sentence.includes("Hulk and the Agents") && r.names.includes("Hulk") && !r.read.includes("Hulk")));
  assert.ok(read_.some((r) => r.page === "Human Torch" && r.names.includes("Storm (Marvel Comics)") && !r.read.includes("Storm (Marvel Comics)")));
});

test("section 4 and the findings match the hand-read pairs and links", () => {
  const p = f.pairs_read;
  const l = f.links_read;
  assert.equal(p.n, 25);
  assert.equal(l.n, 20);
  assert.equal((p.story ?? 0) + (p.title ?? 0) + (p.passing ?? 0) + (p["wrong name"] ?? 0), p.n);
  assert.equal((l.pronoun ?? 0) + (l["other name"] ?? 0) + (l["no mention"] ?? 0), l.n);
  says("only", `Of the ${p.n} strongest ties without a link, ${p.story} share a story. Of ${l.n} links no sentence finds, ${l.pronoun} use he or she for one of the two, ${l["other name"]} another name, and ${l["no mention"]} never name the other`);
  says("findings", `Of the ${p.n} strongest ties without a link, ${p.story} share a story, ${p.title} name a title and ${p["wrong name"]} are wrong names`);
  says("findings", `${pct(f.link_only.share_page_names_other)} of the links no sentence finds are named on one page`);
  says("only", `drawn at random from ${count(f.link_only.links)}`);
  says("only", `for ${pct(f.link_only.share_page_names_other)} of the ${count(f.link_only.links)}, one page names the other`);
  // "mostly titles and wrong names"; "mostly a page saying he or she, or another name".
  assert.ok(p.title + p["wrong name"] > p.n / 2);
  assert.ok(l.pronoun + l["other name"] > l.n / 2);
  const jj = data.links_missed.find((r) => r.a === "Jessica Jones" && r.b === "Misty Knight");
  assert.equal(jj.bucket, "pronoun");
  assert.match(jj.note, /she forms a partnership with Misty Knight/);
  const toro = data.pairs.find((r) => r.a === "Human Torch" && r.b === "Toro (character)");
  assert.equal(toro.bucket, "wrong name");
  assert.match(toro.note, /android/);
  const morituri = data.pairs.find((r) => r.a === "Hawkeye (comics)" && r.b === "Mockingbird (Marvel Comics)");
  assert.equal(morituri.bucket, "title");
  assert.ok(data.pairs.some((r) => r.bucket === "wrong name" && r.example.includes("Blade of the Phoenix")));
});

test("the closing restates the numbers once, the same way", () => {
  says("closing", `linked ${pct(s.share_linked)} of the time, against ${pct(s.null_mean)} in the same network rewired, and ${pct(top.share_linked)} once ten or more sentences name them`);
  says("closing", `One sentence finds ${pct(s.share_links_found)} of the ${count(f.links)} links; a whole page finds ${pct(pg.share_links_found)}`);
  // "pairs that are mostly not links": under half of the page unit's pairs are links.
  assert.ok(pg.share_linked < 0.5);
});

test("the hero's three sentences are the ones its caption describes", () => {
  const rows = heroSentences(data);
  assert.equal(rows.length, 3);
  assert.deepEqual([rows[0].a, rows[0].b].sort(), ["Spider-Man", "Venom"]);
  assert.ok(rows[0].linked && !rows[1].linked && !rows[2].linked);
  assert.deepEqual([rows[2].a, rows[2].b], ["Human Torch", "Toro"]);
  for (const r of rows) assert.ok(r.runs.filter((x) => x.name).length >= 2, `${r.a} · ${r.b} marks both names`);
});

test("the Hawkeye and Force numbers come from the file", () => {
  const m = f.most_unlinked;
  const hawkeye = m.characters.find((c) => c.name === "Hawkeye (comics)");
  const force = m.characters.find((c) => c.name === "Force (comics)");
  assert.ok(hawkeye && force, "Hawkeye and Force are among the five characters with the most unlinked ties");
  says("explore", `Hawkeye's page, about a name rather than one person, links to ${hawkeye.linked} of its ${hawkeye.ties} partners`);
  says("only", `among the ${count(m.unlinked)} pairs named in one sentence without a link`);
  assert.equal(m.unlinked, s.ties - s.linked);
  const read6 = data.pairs.filter((p) => p.a === "Hawkeye (comics)" || p.b === "Hawkeye (comics)").length;
  says("only", `Hawkeye is named with ${hawkeye.ties} characters and linked with ${hawkeye.linked}, and ${read6} of the ${f.pairs_read.n} pairs we read are Hawkeye's`);
  says("only", `${force.ties} partners, ${force.linked === 0 ? "none" : force.linked} linked`);
  const luke = partners(data, data.chars.indexOf("Luke Cage"));
  assert.ok(luke.ties.filter((t) => t.linked).length / luke.ties.length > 0.5, "Luke Cage's ties mostly match its links");
  const hk = partners(data, data.chars.indexOf("Hawkeye (comics)"));
  assert.ok(hk.ties.filter((t) => t.linked).length / hk.ties.length < 0.1, "almost none of Hawkeye's ties link");
});

test("the explorer's start and picks are pages in the file, and the notice holds", () => {
  for (const name of [START, ...PICKS]) assert.ok(data.chars.includes(name), name);
  const torch = partners(data, data.chars.indexOf("Human Torch"));
  const toro = torch.ties.find((t) => t.name === "Toro");
  assert.ok(toro && !toro.linked, "Human Torch and Toro are tied and not linked");
});
