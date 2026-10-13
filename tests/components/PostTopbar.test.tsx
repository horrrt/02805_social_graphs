// The top bar every page opens with: the brand on the left, a page's own
// control (a style menu) after it, the page's tools on the right, and the
// site nav last. It carries no in-page section links.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import { PostTopbar } from "@/components/site/PostTopbar";

test("the bar holds the brand, then the page's control, then the site nav", () => {
  const { container } = render(
    <PostTopbar root="../../" current="weeks/week03/">
      <button type="button">Views</button>
    </PostTopbar>,
  );
  const shell = container.querySelector(".topbar > .shell")!;
  const parts = [...shell.children];
  assert.equal(parts.length, 3);
  assert.equal(parts[0].className, "brand");
  assert.equal(parts[0].getAttribute("href"), "../../");
  assert.equal(parts[1].textContent, "Views");
  assert.equal(parts[2], screen.getByRole("navigation", { name: "Site" }), "the site nav comes last");
  const current = within(parts[2] as HTMLElement).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
  assert.deepEqual(current.map((a) => a.textContent), ["Week 3 · Corridor Control"]);
});

test("a page's tools sit on the right, after its control and just before the site nav", () => {
  const { container } = render(
    <PostTopbar root="../../" current="weeks/week01/" tools={<button type="button">LOGBOOK 0/6</button>}>
      <button type="button">Views</button>
    </PostTopbar>,
  );
  const parts = [...container.querySelector(".topbar > .shell")!.children];
  assert.deepEqual(parts.map((p) => p.className), ["brand", "", "topbar-tools", "site-nav"]);
  assert.equal(parts[1].textContent, "Views");
  assert.equal(within(parts[2] as HTMLElement).getByRole("button").textContent, "LOGBOOK 0/6");
});

test("without tools the bar has no tools group", () => {
  const { container } = render(<PostTopbar root="./" current="home" />);
  assert.equal(container.querySelector(".topbar-tools"), null);
  assert.equal(container.querySelector(".topbar > .shell")!.children.length, 2);
});

test("the site nav is the bar's only navigation", () => {
  render(<PostTopbar root="./" current="home" />);
  assert.deepEqual(screen.getAllByRole("navigation").map((n) => n.getAttribute("aria-label")), ["Site"]);
});
