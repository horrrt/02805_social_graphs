// The site nav in every top bar: Home, Posts, Games and About, with a menu of
// every post under Posts and of every game under Games. jsdom applies no stylesheet, so the menu's state is read
// from data-open and the chevron's aria-expanded, which the CSS follows.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@/components/site/SiteNav";
import { GAMES, GAME_WEEKS } from "@/components/site/games";
import { POSTS } from "@/components/site/posts";
import { readdirSync } from "node:fs";

const chevron = () => screen.getByRole("button", { name: "Show all posts" });
const isOpen = () => chevron().getAttribute("aria-expanded") === "true";
const posts = () => chevron().parentElement!;

test("Home, Posts, Games and About link to the root, its post list, its games and its about section", () => {
  render(<SiteNav root="../../" current="weeks/week05/" />);
  const nav = screen.getByRole("navigation", { name: "Site" });
  assert.equal(within(nav).getByRole("link", { name: "Home" }).getAttribute("href"), "../../");
  assert.equal(within(nav).getByRole("link", { name: "Posts" }).getAttribute("href"), "../../#weeks");
  assert.equal(within(nav).getByRole("link", { name: "Games" }).getAttribute("href"), "../../#games");
  assert.equal(within(nav).getByRole("link", { name: "About" }).getAttribute("href"), "../../#about");
  assert.equal(chevron().getAttribute("aria-controls"), "site-nav-menu");
  assert.equal(screen.getByRole("button", { name: "Show all games" }).getAttribute("aria-controls"), "site-nav-games-menu");
  assert.ok(document.getElementById("site-nav-menu"), "the chevron controls a menu that exists");
});

test("the menu lists every post and marks this page current, and not the alternative Week 6 post", () => {
  render(<SiteNav root="../../../" current="weeks/week06/" />);
  const menu = within(document.getElementById("site-nav-menu")!);
  const labels = ["Week 1 · Hero Packs", "Week 2 · Transit Authority", "Week 3 · Corridor Control", "Week 4 · Who Hires", "Week 5 · Marvel in Words", "Week 6 · Storm, Not Weather", "Week 7 · Named Together"];
  assert.deepEqual(POSTS.map((p) => p.label), labels);
  for (const [i, label] of labels.entries()) assert.equal(menu.getByRole("link", { name: label }).getAttribute("href"), `../../../weeks/week0${i + 1}/`);
  assert.equal(menu.queryByRole("link", { name: /alternative/i }), null, "the alternative post is not in the menu");
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
  assert.deepEqual(current, [menu.getByRole("link", { name: labels[5] })]);
});

test("the Games menu lists one line per week, each linking to its game or campaign, with its games under it", () => {
  render(<SiteNav root="../../" current="weeks/week06/" />);
  const menu = document.getElementById("site-nav-games-menu")!;
  const lines = [...menu.querySelectorAll(":scope > li > .site-nav-week-line > :first-child")].map((el) => el.textContent);
  assert.deepEqual(lines, ["Week 1 · Networks", "Week 2 · Models & null models", "Week 6 · What words mean", "Week 7 · Measuring with words"]);
  const hrefs = ["play/", "prototypes/screen-test/", "play/cold-read/", "play/week07/same-word/", "play/week07/two-stripes/", "play/topic-tetris/", "play/week07/sentiment-trap/", "play/search-detective/", "play/week07/semantic-minefield/"];
  assert.deepEqual(GAMES.map((g) => g.href), hrefs);
  // A one-game week's line goes to that game, and Week 7's to its campaign.
  assert.deepEqual(GAME_WEEKS.map((w) => w.href), ["play/", "prototypes/screen-test/", "play/cold-read/", "play/week07/"]);
  const games = within(menu);
  for (const game of GAMES) {
    const link = games.getAllByRole("link", { name: game.name }).at(-1)!;
    assert.equal(link.getAttribute("href"), `../../${game.href}`);
    assert.equal(link.getAttribute("aria-current"), null);
  }
});

test("a week's chevron slides its games down and back up", async () => {
  const user = userEvent.setup();
  render(<SiteNav root="../../" />);
  const week = screen.getByRole("button", { name: "Show Week 7's games" });
  const line = week.closest("li")!;
  assert.equal(line.getAttribute("data-open"), "false", "games start folded");
  await user.click(week);
  assert.equal(line.getAttribute("data-open"), "true");
  assert.equal(week.getAttribute("aria-expanded"), "true");
  await user.click(week);
  assert.equal(line.getAttribute("data-open"), "false");
  assert.equal(screen.getByRole("link", { name: "Week 7 · Measuring with words" }).getAttribute("href"), "../../play/week07/", "the week's name goes to its campaign");
});

test("unfolding a week folds the week that was open", async () => {
  const user = userEvent.setup();
  render(<SiteNav root="../../" />);
  const six = screen.getByRole("button", { name: "Show Week 6's games" });
  const seven = screen.getByRole("button", { name: "Show Week 7's games" });
  await user.click(six);
  assert.equal(six.getAttribute("aria-expanded"), "true");
  await user.click(seven);
  assert.equal(seven.getAttribute("aria-expanded"), "true");
  assert.equal(six.getAttribute("aria-expanded"), "false", "Week 6 folds when Week 7 unfolds");
  assert.equal(six.closest("li")!.getAttribute("data-open"), "false");
});

test("every game page under play/ is in the games list", () => {
  // A game's own page is a play/.../page.tsx route; its rounds, practice and stack pages sit one folder below it.
  const routes = readdirSync("src/app", { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith("page.tsx"))
    .map((f) => f.split("/").filter((part) => !part.startsWith("(")).slice(0, -1).join("/") + "/")
    .filter((r) => r.startsWith("play/"));
  // A week's campaign counts too: its games are its levels.
  const games = new Set([...GAMES.map((g) => g.href), ...GAME_WEEKS.flatMap((w) => (w.href ? [w.href] : []))]);
  const tops = routes.filter((r) => !routes.some((o) => o !== r && o !== "play/" && r.startsWith(o)));
  assert.deepEqual(tops.filter((r) => !games.has(r)), []);
});

test("on the home page Home is current", () => {
  render(<SiteNav root="./" current="home" />);
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
  assert.deepEqual(current.map((a) => a.textContent), ["Home"]);
  assert.equal(screen.getByRole("link", { name: "Posts" }).getAttribute("href"), "./#weeks");
});

test("the chevron opens and closes the menu, and a click outside closes it", async () => {
  const user = userEvent.setup();
  render(
    <>
      <SiteNav root="../../" />
      <p>Outside</p>
    </>,
  );
  assert.equal(isOpen(), false);
  fireEvent.click(chevron());
  assert.equal(isOpen(), true);
  assert.equal(posts().getAttribute("data-open"), "true");
  fireEvent.click(chevron());
  assert.equal(isOpen(), false);
  assert.equal(posts().getAttribute("data-open"), "false");
  await user.click(chevron());
  assert.equal(isOpen(), true, "a pointer click opens it");
  await user.click(screen.getByText("Outside"));
  assert.equal(isOpen(), false, "a click outside closes it");
});

test("hover opens the menu, and a click on the chevron then keeps it open", async () => {
  const user = userEvent.setup();
  render(<SiteNav root="../../" />);
  await user.hover(screen.getByRole("link", { name: "Posts" }));
  assert.equal(isOpen(), true);
  await user.unhover(posts());
  assert.equal(isOpen(), false);
  await user.click(chevron());
  assert.equal(isOpen(), true);
  fireEvent.mouseLeave(posts());
  assert.equal(isOpen(), true, "a menu opened with the chevron stays open when the pointer leaves");
  await user.click(chevron());
  assert.equal(isOpen(), false);
});

test("from the keyboard: focus opens it, Tab reaches every post, Escape closes it and returns to the chevron", async () => {
  const user = userEvent.setup();
  render(<SiteNav root="../../" current="weeks/week03/" />);
  await user.tab();
  assert.equal(document.activeElement?.textContent, "Home");
  assert.equal(isOpen(), false);
  await user.tab();
  assert.equal(document.activeElement?.textContent, "Posts");
  assert.equal(isOpen(), true, "focus on Posts opens the menu");
  await user.tab();
  assert.equal(document.activeElement, chevron());
  await user.tab();
  assert.equal(document.activeElement?.textContent, "Week 1 · Hero Packs");
  await user.keyboard("{Escape}");
  assert.equal(isOpen(), false);
  assert.equal(document.activeElement, chevron(), "Escape returns focus to the chevron");
  await user.keyboard("{Enter}");
  assert.equal(isOpen(), true, "Enter on the chevron opens it");
  await user.keyboard("{Enter}");
  assert.equal(isOpen(), false, "and Enter again closes it");
  await user.keyboard("{Enter}");
  // Every entry in the menu, its parts included, then one more tab reaches Games.
  const entries = POSTS.flatMap((p) => [p, ...(p.parts ?? [])]).length;
  for (let i = 0; i < entries + 1; i++) await user.tab();
  assert.equal(document.activeElement?.textContent, "Games");
  assert.equal(isOpen(), false, "tabbing out of the menu closes it");
  const games = screen.getByRole("button", { name: "Show all games" });
  assert.equal(games.getAttribute("aria-expanded"), "true", "focus on Games opens its menu");
  // Its chevron and each week's line and chevron, its games folded away, then one more tab reaches About.
  for (let i = 0; i < 2 * GAME_WEEKS.length + 2; i++) await user.tab();
  assert.equal(document.activeElement?.textContent, "About");
  assert.equal(games.getAttribute("aria-expanded"), "false", "tabbing out of the Games menu closes it");
});

test("Escape while the menu is closed leaves focus where it is", async () => {
  const user = userEvent.setup();
  render(
    <>
      <SiteNav root="../../" />
      <button type="button">Elsewhere</button>
    </>,
  );
  const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
  elsewhere.focus();
  await user.keyboard("{Escape}");
  assert.equal(document.activeElement, elsewhere);
  assert.equal(isOpen(), false);
});
