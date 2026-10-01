// Runs a page's scripts the way separate <script type="module"> tags did: in
// order, and each on its own, so a script that throws or whose data fails to
// load leaves the others drawing. `together` starts every script at once, for
// pages whose scripts wait for their data at the top level: a section should
// not hold up the next one while its JSON loads.
export async function run(loaders, { together = false } = {}) {
  const report = (error) => console.error("a page script failed", error);
  if (together) {
    await Promise.all(loaders.map((load) => load().catch(report)));
    return;
  }
  for (const load of loaders) await load().catch(report);
}
