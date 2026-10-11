// The section rail: a labelled nav with one link per section and per question,
// questions listed only for sections with more than one, and the section whose
// top has passed 35% of the window marked current with its questions. jsdom
// lays nothing out, so each test places the sections by hand.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SectionRail, type RailItem } from "@/components/post/SectionRail";

const ITEMS: RailItem[] = [
  { target: "intro", label: "Introduction" },
  {
    target: "hubs",
    label: "Hubs",
    children: [
      { target: "hubs-q1", label: "Who hires most?" },
      { target: "hubs-q2", label: "Where are they?" },
    ],
  },
  { target: "limits", label: "Limits", children: [{ target: "limits-q1", label: "What is missing?" }] },
];

// The window is 1000px tall, so the line sits at 350px.
const LINE = 350;
const tops: Record<string, number> = {};

function Page({ inDrawer = false }) {
  const all = ["intro", "hubs", "hubs-q1", "hubs-q2", "limits", "limits-q1"];
  const sections = all.map((id) => <section id={id} key={id} />);
  return (
    <>
      <SectionRail column={720} items={ITEMS} />
      {inDrawer ? (
        <>
          {sections.slice(0, 3)}
          <details>{sections.slice(3)}</details>
        </>
      ) : (
        sections
      )}
    </>
  );
}

// Place each section, then fire the event the rail listens for and let its frame run.
async function place(positions: Record<string, number>, event: () => void = () => fireEvent.scroll(document)) {
  Object.assign(tops, positions);
  for (const [id, top] of Object.entries(tops)) {
    const el = document.getElementById(id);
    if (el) el.getBoundingClientRect = () => ({ top }) as DOMRect;
  }
  await act(async () => {
    event();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

const current = () =>
  screen
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "true")
    .map((a) => a.getAttribute("aria-label"));

function setup(inDrawer = false) {
  window.innerHeight = 1000;
  for (const id of Object.keys(tops)) delete tops[id];
  render(<Page inDrawer={inDrawer} />);
}

test("one link per section, questions only for sections with several", () => {
  setup();
  const nav = screen.getByRole("navigation", { name: "Contents of this post" });
  const links = within(nav).getAllByRole("link").map((a) => [a.getAttribute("aria-label"), a.getAttribute("href")]);
  assert.deepEqual(links, [
    ["Introduction", "#intro"],
    ["Hubs", "#hubs"],
    ["Who hires most?", "#hubs-q1"],
    ["Where are they?", "#hubs-q2"],
    ["Limits", "#limits"],
  ]);
  assert.equal(nav.style.getPropertyValue("--rail-column"), "720px");
});

test("the last section past the line is current, with its question", async () => {
  setup();
  await place({ intro: -800, hubs: -200, "hubs-q1": 100, "hubs-q2": 600, limits: 1400, "limits-q1": 1500 });
  assert.deepEqual(current(), ["Hubs", "Who hires most?"]);
  assert.equal(screen.getByRole("link", { name: "Hubs" }).closest("li")!.className, "is-current");
});

test("scrolling moves the current section", async () => {
  setup();
  await place({ intro: 0, hubs: 900, "hubs-q1": 1000, "hubs-q2": 1200, limits: 2000, "limits-q1": 2100 });
  assert.deepEqual(current(), ["Introduction"]);
  await place({ intro: -2000, hubs: -1100, "hubs-q1": -1000, "hubs-q2": -800, limits: 0, "limits-q1": LINE + 1 });
  assert.deepEqual(current(), ["Limits"]);
});

test("nothing is current before the first section reaches the line", async () => {
  setup();
  await place({ intro: LINE + 1, hubs: 2000, "hubs-q1": 2100, "hubs-q2": 2200, limits: 3000, "limits-q1": 3100 });
  assert.deepEqual(current(), []);
});

test("a section in a closed drawer is skipped until the drawer opens", async () => {
  setup(true);
  await place({ intro: -900, hubs: -500, "hubs-q1": -300, "hubs-q2": -200, limits: -100, "limits-q1": 0 });
  assert.deepEqual(current(), ["Hubs", "Who hires most?"]);
  const drawer = document.querySelector("details")!;
  await place({}, () => {
    drawer.open = true;
    drawer.dispatchEvent(new Event("toggle"));
  });
  assert.deepEqual(current(), ["Limits"]);
});
