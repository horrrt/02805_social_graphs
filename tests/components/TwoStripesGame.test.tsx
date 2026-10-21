// Two Stripes played through its component: deal, read the bars, pick the
// nearest page, lose lives on wrong picks, and check the numbers the debrief
// quotes against the data file analysis/week07_two_stripes.py writes.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SPEED_MAX, timed } from "@/features/cold-read/pace";
import { TwoStripesGame } from "@/features/two-stripes/TwoStripesGame";
import { answerOf, dealOrder, decodeStrips, LETTERS, LIVES, nearestDot, points, type TwoStripesData } from "@/features/two-stripes/rules";
import { noExamples, still, zero } from "./coldReadData";

const data = JSON.parse(readFileSync(new URL("../../public/play/week07/data/two_stripes.json", import.meta.url), "utf8")) as TwoStripesData;
const order = dealOrder(data, zero);
const roundAt = (n: number) => data.rounds[order[n]];

beforeEach(() => {
  localStorage.clear();
  noExamples();
  localStorage.setItem("cold-read:example:two-stripes", "0");
});

async function dealt() {
  const user = userEvent.setup();
  render(<TwoStripesGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  return user;
}

const pick = (c: number) => screen.getByRole("button", { name: new RegExp(`^(Candidate )?${LETTERS[c]}\\b`) });

test("the data holds the brief's encoder and the solver gap the game rests on", () => {
  assert.equal(data.dims, 384);
  assert.equal(data.pages.length, 303);
  // The brief: PCA's two axes hold about 10% of the variance on these pages.
  assert.ok(data.variance.two_axes > 0.08 && data.variance.two_axes < 0.12);
  assert.ok(data.solver.pca.all_rounds.strip - data.solver.pca.all_rounds.map > 0.4, "matching bars beats the map dot on PCA");
  assert.ok(data.solver.pca.dot_is_nearest < data.solver.tsne.dot_is_nearest, "t-SNE keeps more neighbourhoods than PCA");
  const strips = decodeStrips(data);
  assert.equal(strips.length, 303);
  assert.ok(strips.every((s) => s.length === data.stripes && s.every((v) => Number.isInteger(v) && v >= -127 && v <= 127)));
  for (const r of data.rounds) {
    assert.equal(r.candidates.length, 4);
    assert.equal(r.rank.filter((x) => x === 1).length, 1, "exactly one candidate is the nearest page");
    assert.equal(data.pages[r.target].near[0], r.candidates[answerOf(r)]);
  }
});

test("the deal hides the candidates' names and shows the lit page", async () => {
  await dealt();
  const r = roundAt(0);
  assert.equal(r.map, "pca", "PCA comes first");
  for (let c = 0; c < 4; c++) assert.equal(pick(c).getAttribute("aria-label"), `Candidate ${LETTERS[c]}`);
  assert.ok(screen.getByText(/Which page is closest to/));
  assert.ok(screen.getByText(/PCA map · its two axes are bars 1 and 2 and hold \d+% of the variance/));
});

test("a t-SNE round makes no variance claim and shades no bars", async () => {
  const user = await dealt();
  await user.click(pick(0));
  await user.click(screen.getByRole("button", { name: "Next page" }));
  assert.equal(roundAt(1).map, "tsne", "t-SNE comes second");
  const caption = document.querySelector(".ts-map figcaption")?.textContent ?? "";
  assert.match(caption, /^t-SNE map/);
  assert.doesNotMatch(caption, /variance/);
  assert.equal(document.querySelectorAll(".ts-axes").length, 0);
});

test("picking the nearest page scores it and the debrief quotes cosine and rank", async () => {
  const user = await dealt();
  const r = roundAt(0);
  const a = answerOf(r);
  await user.click(pick(a));
  assert.ok(screen.getByText("Twin found"));
  assert.equal(document.querySelector(".cr-score b")?.textContent, timed(points(1), SPEED_MAX).toLocaleString("en"));
  const rows = screen.getAllByRole("row").slice(1);
  assert.equal(rows.length, 4);
  r.candidates.forEach((_, c) => assert.match(rows[c].textContent ?? "", new RegExp(`${r.cos[c].toFixed(3)}${r.rank[c]}`)));
  assert.match(rows[nearestDot(data, r)].textContent ?? "", /closest dot/);
  assert.equal(localStorage.getItem("two-stripes:best"), String(timed(points(1), SPEED_MAX)));
});

test("tapping the closest dot on PCA rounds runs out of lives", async () => {
  const user = await dealt();
  let lost = 0;
  for (let n = 0; lost < LIVES; n++) {
    const r = roundAt(n);
    const dot = nearestDot(data, r);
    await user.click(pick(dot));
    if (dot !== answerOf(r)) lost++;
    if (lost < LIVES) await user.click(screen.getByRole("button", { name: "Next page" }));
  }
  assert.ok(screen.getByText(/Run over:/));
  assert.ok(screen.getByText(/Tapping the closest dot would have found it in/));
});
