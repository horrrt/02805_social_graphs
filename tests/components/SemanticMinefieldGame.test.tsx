// Semantic Minefield: the labels are explicit and consistent, every clue is
// counted from the real neighbours, every board clears by deduction from its
// opening, the chips alone cannot sweep a board, and the game plays through
// reveals, flags, a bomb, a cleared round and the results, and back again.
import "./dom";
import "./coldReadData";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { chipCategories, countClues, flood, makeBoard, neighbours, solves } from "@/features/semantic-minefield/board";
import { CATEGORIES, CHARACTERS, type CatId, character, isIn } from "@/features/semantic-minefield/characters";
import { boardFor, compare, explain, keywordHit, POINTS, ROUNDS, roundPoints } from "@/features/semantic-minefield/rounds";
import { SemanticMinefieldGame } from "@/features/semantic-minefield/SemanticMinefieldGame";

// The best lives in localStorage and a cookie; clear both so one test's best never leaks into the next.
beforeEach(() => {
  localStorage.clear();
  document.cookie = `${encodeURIComponent("semantic-minefield:best")}=; max-age=0; path=/`;
});

const CATS = Object.keys(CATEGORIES) as CatId[];

test("every character has a unique id, known categories and exactly one of hero or villain", () => {
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length);
  for (const c of CHARACTERS) {
    for (const cat of c.cats) assert.ok(CATS.includes(cat), `${c.id}: ${cat}`);
    assert.equal(new Set(c.cats).size, c.cats.length, `${c.id}: no repeated category`);
    assert.equal(Number(isIn(c, "hero")) + Number(isIn(c, "villain")), 1, `${c.id}: hero or villain`);
  }
});

test("no target category implies another: each pair is split by some character", () => {
  const targets = [...new Set(ROUNDS.map((r) => r.target))];
  for (const a of CATS)
    for (const b of targets) {
      if (a === b || (a === "hero" && b === "villain") || (a === "villain" && b === "hero")) continue;
      assert.ok(CHARACTERS.some((c) => isIn(c, a) && !isIn(c, b)), `someone is ${a} but not ${b}`);
    }
});

test("neighbours respect corners and edges", () => {
  assert.deepEqual(neighbours(0, 5, 6).sort((x, y) => x - y), [1, 6, 7]);
  assert.deepEqual(neighbours(5, 5, 6).sort((x, y) => x - y), [4, 10, 11]);
  assert.deepEqual(neighbours(29, 5, 6).sort((x, y) => x - y), [22, 23, 28]);
  assert.equal(neighbours(2, 5, 6).length, 5);
  assert.equal(neighbours(14, 5, 6).length, 8);
});

test("clues count the bombs among the eight neighbours, and a zero floods without crossing flags", () => {
  // 3×3, one bomb in the corner.
  const bomb = [true, false, false, false, false, false, false, false, false];
  const counts = countClues(bomb, 3, 3);
  assert.deepEqual(counts, [0, 1, 0, 1, 1, 0, 0, 0, 0]);
  const b = { rows: 3, cols: 3, bomb, counts };
  assert.deepEqual(flood(8, b, new Set()).sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(flood(8, b, new Set(), new Set([5, 7])).sort(), [4, 8]);
  assert.deepEqual(flood(1, b, new Set()), [1], "a number opens only itself");
  assert.deepEqual(flood(0, b, new Set()), [], "a bomb never floods");
});

test("every round deals a consistent, solvable board, run after run", () => {
  for (const r of ROUNDS)
    for (let run = 0; run < 25; run++) {
      const b = boardFor(r, run);
      assert.equal(b.tiles.length, r.rows * r.cols);
      b.tiles.forEach((c, i) => assert.equal(b.bomb[i], isIn(c, r.target), `${r.id}: ${c.id} is a bomb exactly when in ${r.target}`));
      assert.equal(b.bomb.filter(Boolean).length, r.bombs, r.id);
      assert.deepEqual(b.counts, countClues(b.bomb, r.rows, r.cols), `${r.id}: clues come from the board`);
      assert.ok(b.opening.every((i) => !b.bomb[i]) && b.opening.some((i) => b.counts[i] === 0), `${r.id}: opens safely on a zero`);
      assert.ok(solves(b), `${r.id} run ${run}: clears without a guess`);
      b.chips.forEach((chip, i) => assert.ok(chip === null || (chip !== r.target && b.tiles[i].cats.includes(chip) && chipCategories(r.target).includes(chip)), `${r.id}: chip is a real, allowed category`));
      for (const id of r.include ?? []) assert.ok(b.tiles.some((c) => c.id === id), `${r.id}: holds ${id}`);
    }
});

test("the same seed deals the same board", () => {
  const a = boardFor(ROUNDS[2], 3);
  const b = boardFor(ROUNDS[2], 3);
  assert.deepEqual(a.tiles.map((c) => c.id), b.tiles.map((c) => c.id));
  assert.deepEqual(a.chips, b.chips);
});

test("a board too small to place its bombs is refused, and short pools repeat characters", () => {
  assert.throws(() => makeBoard({ target: "ai", rows: 5, cols: 5, bombs: 9 }, 1), /only 6/);
  const pool = CHARACTERS.filter((c) => ["ultron", "vision", "cap", "hulk"].includes(c.id));
  const b = makeBoard({ target: "ai", rows: 4, cols: 4, bombs: 2 }, 7, pool);
  assert.equal(b.tiles.length, 16);
  b.tiles.forEach((c, i) => assert.equal(b.bomb[i], isIn(c, "ai")));
});

test("no chip settles a tile on its own: each chip, and the blank, sits on bombs and safe tiles alike", () => {
  for (const r of ROUNDS) {
    const seen = new Map<string, Set<boolean>>();
    for (let run = 0; run < 40; run++) {
      const b = boardFor(r, run);
      b.chips.forEach((chip, i) => {
        const key = chip ?? "?";
        seen.set(key, (seen.get(key) ?? new Set()).add(b.bomb[i]));
      });
    }
    for (const [chip, sides] of seen) assert.equal(sides.size, 2, `${r.id}: chip ${chip} shows on both bombs and safe tiles`);
    for (const chip of chipCategories(r.target)) {
      assert.ok(CHARACTERS.some((c) => isIn(c, chip) && isIn(c, r.target)) && CHARACTERS.some((c) => isIn(c, chip) && !isIn(c, r.target)), `${r.id}: ${chip}`);
    }
  }
});

test("the rounds hold the decoys their lessons name", () => {
  const round = (id: string) => ROUNDS.find((r) => r.id === id)!;
  for (const id of ["cyclops", "xavier", "surfer", "wong"]) assert.ok(isIn(character(id), "hero") && !isIn(character(id), "avenger"), `${id}: a hero, not an Avenger`);
  for (const id of ["thor", "ironfist", "surfer"]) assert.ok(!isIn(character(id), "magic"), `${id}: not magic`);
  for (const id of ["ironman", "warmachine", "modok"]) assert.ok(isIn(character(id), "tech") && !isIn(character(id), "ai"), `${id}: uses tech, not an AI`);
  const tech = round("tech").include!.map(character).filter((c) => isIn(c, "tech"));
  assert.ok(tech.some((c) => isIn(c, "hero")) && tech.some((c) => isIn(c, "villain")), "technology on both sides");
  assert.ok(isIn(character("ultron"), "villain") && isIn(character("ultron"), "ai") && isIn(character("ultron"), "tech"), "Ultron sits in three categories");
});

test("explanations and the keyword comparison are built from the data", () => {
  assert.equal(
    explain(character("ultron"), "ai"),
    "Ultron is a bomb: it belongs to the target category “Artificial intelligence”. It is also in “Villain” and “Uses advanced technology”, but this round only “Artificial intelligence” counts.",
  );
  assert.match(explain(character("thor"), "magic"), /^Thor is safe: it is not in “Uses magic”\. It is in “Hero”, “Avengers member” and “Alien”/);
  assert.match(explain(character("redskull"), "magic"), /Red Skull is safe/);
  assert.ok(keywordHit(character("thor"), "magic"), "Thor's hammer is enchanted with magic");
  assert.ok(!keywordHit(character("strange"), "magic"), "the Sorcerer Supreme never says magic");
  assert.ok(keywordHit(character("ultron"), "artificial intelligence"));
  assert.ok(!keywordHit(character("panther"), "tech"), "whole words only");
  for (const r of ROUNDS) {
    const c = compare(boardFor(r), r.keyword);
    assert.ok(c.missed.length > 0, `${r.id}: the keyword misses someone`);
    for (const x of c.missed) assert.ok(isIn(x, r.target) && !keywordHit(x, r.keyword));
    for (const x of c.falseHits) assert.ok(!isIn(x, r.target) && keywordHit(x, r.keyword));
  }
});

test("flags score only at the round's end", () => {
  const t = { revealed: 4, flagsRight: 3, wrongFlags: 1, hits: 0 };
  assert.equal(roundPoints({ ...t, cleared: false }), 4 * POINTS.reveal);
  assert.equal(roundPoints({ ...t, cleared: true }), 4 * POINTS.reveal + 3 * POINTS.flag - POINTS.wrongFlag + POINTS.clean);
  assert.equal(roundPoints({ ...t, hits: 1, cleared: true }), 4 * POINTS.reveal - POINTS.bomb + 3 * POINTS.flag - POINTS.wrongFlag);
});

const tiles = () => screen.getAllByRole("button").filter((b) => b.classList.contains("sm-tile"));
const readBestValue = () => Number(localStorage.getItem("semantic-minefield:best")) || 0;
const score = () => Number(document.querySelector(".cr-score b")!.textContent!.replace(/,/g, ""));

test("a game plays through flags, a bomb, a cleared round and the results, and plays again", async () => {
  const user = userEvent.setup();
  const rounds = ROUNDS.slice(0, 1);
  const board = boardFor(rounds[0]);
  render(<SemanticMinefieldGame rounds={rounds} />);
  await user.click(screen.getByRole("button", { name: "Start" }));

  // The opening is already revealed and scores nothing.
  assert.equal(tiles().filter((t) => t.dataset.state === "open").length, board.opening.length);
  assert.equal(score(), 0);

  // Flag a bomb with a right-click, then a safe tile with the Flag mode: the score does not move.
  const bombs = board.bomb.flatMap((b, i) => (b ? [i] : []));
  const safe = board.bomb.flatMap((b, i) => (!b && !board.opening.includes(i) ? [i] : []));
  fireEvent.contextMenu(tiles()[bombs[0]]);
  assert.equal(tiles()[bombs[0]].dataset.state, "flag");
  await user.click(screen.getByRole("button", { name: "⚑ Flag" }));
  await user.click(tiles()[safe[0]]);
  assert.equal(tiles()[safe[0]].dataset.state, "flag");
  assert.equal(score(), 0, "flags are not scored while the round runs");
  await user.click(tiles()[safe[0]]);
  await user.click(screen.getByRole("button", { name: "Reveal" }));

  // Hit a bomb: a life goes, the score drops, the card explains it.
  await user.click(tiles()[bombs[1]]);
  assert.equal(tiles()[bombs[1]].dataset.state, "hit");
  assert.equal(score(), -POINTS.bomb);
  assert.ok(screen.getByText(new RegExp(`^${board.tiles[bombs[1]].name} is a bomb`)));
  assert.equal(document.querySelector(".cr-lives")!.getAttribute("aria-label"), "2 of 3");

  // Reveal every safe tile.
  for (const i of safe) if (tiles()[i].dataset.state === "hidden") await user.click(tiles()[i]);
  const debrief = document.querySelector(".sm-debrief") as HTMLElement;
  assert.ok(debrief, "the round ends when every safe tile is open");
  assert.ok(within(debrief).getByText(/Board cleared/));
  assert.ok(within(debrief).getByText(/Keyword search would say/));
  const expected = safe.length * POINTS.reveal - POINTS.bomb + POINTS.flag - POINTS.wrongFlag;
  assert.equal(score(), expected);

  await user.click(screen.getByRole("button", { name: "See the results" }));
  assert.ok(screen.getByText("Minefield swept"));
  assert.equal(Number(localStorage.getItem("semantic-minefield:best")), expected, "the best is kept");
  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.equal(score(), 0);
  assert.ok(tiles().length === 25);
});

test("flags placed in one tick all stick", async () => {
  const user = userEvent.setup();
  const rounds = ROUNDS.slice(0, 1);
  const board = boardFor(rounds[0]);
  render(<SemanticMinefieldGame rounds={rounds} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  const bombs = board.bomb.flatMap((b, i) => (b ? [i] : []));
  act(() => bombs.forEach((i) => tiles()[i].dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }))));
  assert.deepEqual(bombs.map((i) => tiles()[i].dataset.state), bombs.map(() => "flag"));
});

test("a run that ends out of lives keeps its score as the best when retried", async () => {
  const user = userEvent.setup();
  const rounds = ROUNDS.slice(0, 2);
  const [first, second] = rounds.map((r) => boardFor(r));
  render(<SemanticMinefieldGame rounds={rounds} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  for (const [i, b] of first.bomb.entries()) if (!b && tiles()[i].dataset.state === "hidden") await user.click(tiles()[i]);
  await user.click(screen.getByRole("button", { name: "Next round →" }));
  for (const i of second.bomb.flatMap((b, i) => (b ? [i] : [])).slice(0, 3)) await user.click(tiles()[i]);
  const total = score();
  assert.ok(total > 0, "the cleared first round keeps the score above zero");
  assert.ok(screen.getByText("Out of lives", { selector: "h3" }));
  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.equal(score(), 0);
  assert.equal(readBestValue(), total);
});
