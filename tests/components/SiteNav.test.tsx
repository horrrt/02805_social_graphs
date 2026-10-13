// The site nav in every top bar: Home, Posts and About, with a menu of every
// post under Posts. jsdom applies no stylesheet, so the menu's state is read
// from data-open and the chevron's aria-expanded, which the CSS follows.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteNav } from "@/components/site/SiteNav";
import { POSTS } from "@/components/site/posts";

const chevron = () => screen.getByRole("button", { name: "Show all posts" });
const isOpen = () => chevron().getAttribute("aria-expanded") === "true";
const posts = () => chevron().parentElement!;

test("Home, Posts and About link to the root, its post list and its about section", () => {
  render(<SiteNav root="../../" current="weeks/week05/" />);
  const nav = screen.getByRole("navigation", { name: "Site" });
  assert.equal(within(nav).getByRole("link", { name: "Home" }).getAttribute("href"), "../../");
  assert.equal(within(nav).getByRole("link", { name: "Posts" }).getAttribute("href"), "../../#weeks");
  assert.equal(within(nav).getByRole("link", { name: "About" }).getAttribute("href"), "../../#about");
  assert.equal(chevron().getAttribute("aria-controls"), "site-nav-menu");
  assert.ok(document.getElementById("site-nav-menu"), "the chevron controls a menu that exists");
});

test("the menu lists every post, the alternative under Week 6, and marks this page current", () => {
  render(<SiteNav root="../../../" current="weeks/week06/alternative/" />);
  const menu = within(document.getElementById("site-nav-menu")!);
  const labels = ["Week 1 · Hero Packs", "Week 2 · Transit Authority", "Week 3 · Corridor Control", "Week 4 · Who Hires", "Week 5 · Marvel in Words", "Week 6 · Seventeen Essentials"];
  assert.deepEqual(POSTS.map((p) => p.label), labels);
  for (const [i, label] of labels.entries()) assert.equal(menu.getByRole("link", { name: label }).getAttribute("href"), `../../../weeks/week0${i + 1}/`);
  const alternative = menu.getByRole("link", { name: "Week 6 alternative" });
  assert.equal(alternative.getAttribute("href"), "../../../weeks/week06/alternative/");
  assert.ok(menu.getByRole("link", { name: labels[5] }).closest("li")!.contains(alternative), "the alternative sits under Week 6");
  const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
  assert.deepEqual(current, [alternative]);
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
  for (let i = 0; i < POSTS.length + 2; i++) await user.tab();
  assert.equal(document.activeElement?.textContent, "About");
  assert.equal(isOpen(), false, "tabbing out of the menu closes it");
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
