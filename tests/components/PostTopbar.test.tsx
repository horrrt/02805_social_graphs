// The top bar every page opens with: the brand on the left, a page's own
// control (a style menu) after it, and the site nav last, on the right. It
// carries no in-page section links.
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

test("the site nav is the bar's only navigation", () => {
  render(<PostTopbar root="./" current="home" />);
  assert.deepEqual(screen.getAllByRole("navigation").map((n) => n.getAttribute("aria-label")), ["Site"]);
});
