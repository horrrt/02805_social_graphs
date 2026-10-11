// W5-1: Week 5's frame, now islands (src/features/week05/frame/). Hovers two
// dots of the hero scatter in turn, then the dot and band of every findings
// mini that has them, then narrows the window so the hero and the minis draw
// at their parents' new width, hovers the hero again and restores the width.
// base.json masks every #chart-* host (KB07), so heroHtml returns the hero's
// outerHTML after each hover and resize: its attributes in order, the tip's
// place among the host's children and the marks' classes, compared as is.
const HERO = "#chart-hero-fame g > circle";
const mini = (n) => `#findings [data-finding="${n}"] svg`;

/** The hero host's outerHTML, byte for byte. */
export async function heroHtml(page) {
  return page.evaluate(() => document.getElementById("chart-hero-fame")?.outerHTML ?? null);
}

const heroSnap = (label) => [{ evaluate: "heroHtml", label: `hero html ${label}` }, { snap: true }];

export default [
  {
    name: "w5-W5-1",
    url: "weeks/week05/",
    steps: [
      { evaluate: "heroHtml", label: "hero html at load" },
      { hover: [`${HERO}:nth-of-type(1)`, 0.5, 0.5], label: "hover the hero's first dot" },
      ...heroSnap("first dot"),
      { hover: [`${HERO}:nth-of-type(150)`, 0.5, 0.5], label: "hover the hero's 150th dot" },
      ...heroSnap("150th dot"),
      ...[1, 2, 3, 5, 6, 7].flatMap((n) => [
        { hover: [`${mini(n)} > circle`, 0.5, 0.5], label: `hover mini ${n}'s dot` },
        { snap: true },
      ]),
      ...[1, 5, 6].flatMap((n) => [
        { hover: [`${mini(n)} > g > rect`, 0.5, 0.5], label: `hover mini ${n}'s band` },
        { snap: true },
      ]),
      { evaluate: "heroHtml", label: "hero html after leaving it" },
      { resize: [1100, 900], label: "narrower window" },
      ...heroSnap("narrower"),
      { hover: [`${HERO}:nth-of-type(1)`, 0.5, 0.5], label: "hover the hero's first dot, narrower" },
      ...heroSnap("first dot, narrower"),
      { resize: [1440, 900], label: "window back" },
      ...heroSnap("window back"),
    ],
  },
];
