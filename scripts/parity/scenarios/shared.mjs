// Helpers shared by the P0b scenario libraries (scenarios/<page>/lib.mjs).
// Each takes the Playwright page first and returns a JSON value the runtime
// compares, like the built-ins in scripts/parity/evaluate.mjs.

/** Ctrl + wheel over the centre of the first `sel` match (the zoom gesture). */
export async function ctrlWheel(page, sel, deltaY = -240) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
  const b = await loc.boundingBox({ timeout: 5000 });
  if (!b) throw new Error(`${sel} has no box`);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, deltaY);
  await page.keyboard.up("Control");
  await page.waitForTimeout(400);
  return deltaY;
}

/** Focuses the first `sel` match without a click (keyboard paths). */
export async function focus(page, sel) {
  await page.locator(sel).first().focus({ timeout: 5000 });
  return sel;
}

/** Clicks at a fraction of the first `sel` match's box, then moves the mouse away. */
export async function clickAt(page, sel, fx = 0.5, fy = 0.5) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
  const b = await loc.boundingBox({ timeout: 5000 });
  if (!b) throw new Error(`${sel} has no box`);
  await page.mouse.click(b.x + b.width * fx, b.y + b.height * fy);
  return [fx, fy];
}

/** Waits until the first `sel` match is attached and visible (a slow step's end); returns sel. */
export async function waitFor(page, sel, timeout = 20000) {
  await page.locator(sel).first().waitFor({ state: "visible", timeout });
  return sel;
}
