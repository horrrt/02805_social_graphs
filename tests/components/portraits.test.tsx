// Portraits come from the site's own copies, Wikipedia first and the Marvel
// Database after; every character in a game's data has one on disk.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { Face } from "@/features/cold-read/Face";
import { portrait, portraitSlug, portraitSource } from "@/features/cold-read/portraits";

const read = (name: string) => JSON.parse(readFileSync(new URL(`../../public/play/cold-read/data/${name}.json`, import.meta.url), "utf8"));
const file = (url: string) => new URL(`../../public${new URL(url).pathname}`, import.meta.url);

test("Wikipedia comes first and the Marvel Database fills its gaps", () => {
  assert.equal(portraitSource("Hulk"), "wikipedia");
  assert.equal(portraitSource("Citizen V"), "marveldb");
  assert.equal(portraitSource("Hulk", ["marveldb", "wikipedia"]), "marveldb");
  assert.equal(portraitSource("Not a Marvel page"), null);
  assert.equal(portraitSlug("Ghost Rider (Danny Ketch)"), "ghost-rider-danny-ketch");
});

test("every character the games show has a portrait file", () => {
  const names = [
    ...read("clue_shop").pages.map((p: { name: string }) => p.name),
    ...read("mix_desk").pages.map((p: { name: string }) => p.name),
    ...read("whose_line").groups.flatMap((g: { hubs: { name: string }[] }) => g.hubs.map((h) => h.name)),
  ];
  for (const name of names) {
    const url = portrait(name);
    assert.ok(url, `${name} has no portrait`);
    assert.ok(existsSync(file(url)), `${name}: ${url} is missing`);
  }
});

test("a face shows initials when no source has the page", () => {
  const { container } = render(<Face name="Nobody (comics)" />);
  assert.equal(container.textContent, "N");
  assert.equal(render(<Face name="Hulk" />).container.querySelector("img")?.getAttribute("src")?.includes("/portraits/wikipedia/hulk.webp"), true);
});
