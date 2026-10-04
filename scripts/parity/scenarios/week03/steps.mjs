// The Week 3 renderer scenario every base-<variant>.mjs file runs: load,
// audit03, the year slider to its first year, the corridor selects' second
// options, each twin-map layer, each axis mode, three hovers and a click on
// the histogram and on the z-score scatter, a drag on the globe and a window
// resize. Each renderer draws into its own host, so the targets differ.

/**
 * hosts: { hist, scatter, globe } selectors for the variant. auditThrows: the
 * plain audit throws on main under this renderer. noAudit: main's audit takes
 * minutes under this WebGL renderer in the headless shell (globe 3.5 min,
 * atlas longer), past the 2-minute command limit, so the file leaves it out.
 * webgl: the WebGL stage overlaps the twin map's and the charts' controls, so
 * Playwright's click refuses them; buttons are pressed with Enter instead and
 * the chart clicks land at the pixel (clickAt), as a reader's would.
 * part: "a" keeps the controls (year, selects, layers, axis modes), "b" the
 * hovers, clicks, drag and resize; globe.gl and Atlas snapshot so slowly in
 * the headless shell (about 7 s each) that one file took 2.5 minutes.
 */
export function variantScenarios(variant, hosts, { auditThrows = false, noAudit = false, webgl = false, part = null } = {}) {
  const url = `weeks/week03/?variant=${variant}`;
  const audit = auditThrows
    ? [
      // On main the plain audit throws under this renderer (KB06): compare the
      // error, then run it again with the null-host guard to compare its rows.
      { evaluate: "audit03", args: [{ verbose: true }], expectError: true, label: "audit03 (throws on main)" },
      { evaluate: "audit03Rows", label: "audit03 rows" },
    ]
    : noAudit ? [] : [{ evaluate: "audit03Rows", label: "audit03 rows" }];
  const press = (sel, label) => (webgl ? { press: [sel, "Enter"], label } : { click: sel, label });
  const hovers = (sel, name) => [
    { hover: [sel, 0.3, 0.4], label: `${name} hover 1` },
    { snap: true },
    { hover: [sel, 0.5, 0.6], label: `${name} hover 2` },
    { snap: true },
    { hover: [sel, 0.7, 0.75], label: `${name} hover 3` },
    { snap: true },
    webgl ? { evaluate: "clickAt", args: [sel, 0.5, 0.5], label: `${name} click` } : { click: sel, label: `${name} click` },
    { snap: true },
  ];
  const controls = [
    { press: ["#year-slider", "Home"], label: "year slider to 0" },
    { snap: true },
    { select: ["#edge-origin", { index: 1 }], label: "edge origin, second option" },
    { snap: true },
    { select: ["#edge-dest", { index: 1 }], label: "edge destination, second option" },
    { snap: true },
    ...["flights", "both", "net", "migration"].flatMap((layer) => [
      press(`#map-toggle [data-layer="${layer}"]`, `map layer ${layer}`),
      { snap: true },
    ]),
    ...["semilog", "linear", "loglog"].flatMap((mode) => [
      press(`.axis-modes >> nth=0 >> button[data-mode="${mode}"]`),
      press(`.axis-modes >> nth=1 >> button[data-mode="${mode}"]`, `axis mode ${mode}`),
      { snap: true },
    ]),
  ];
  const pointer = [
    ...hovers(hosts.hist, "histogram"),
    ...hovers(hosts.scatter, "z-score scatter"),
    { drag: [hosts.globe, [0.5, 0.5], [0.7, 0.55]], label: "globe drag" },
    { snap: true },
    { resize: [1280, 800] },
    { snap: true, label: "after resize" },
  ];
  if (part === "a") return [{ name: `w3-${variant}`, url, steps: controls }];
  if (part === "b") return [{ name: `w3-${variant}-b`, url, steps: pointer }];
  return [
    ...(audit.length ? [{ name: `w3-${variant}-audit`, url, steps: audit }] : []),
    { name: `w3-${variant}`, url, steps: [...controls, ...pointer] },
  ];
}
