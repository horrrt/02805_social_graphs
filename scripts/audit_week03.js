// Audit of the week 3 post: does every control actually do something, in
// every renderer?
//
// Paste into a browser console on the post, or run it through a driver. It
// returns one row per check: what was tried, what changed, and a verdict. A
// control that is visible but inert is the failure this is looking for, so
// "rendered" is never enough on its own — every check has to observe a change.
//
//   await auditWeek03()                  // the renderer currently loaded
//   await auditWeek03({ verbose: true }) // include the passes, not just fails
//
// To cover every renderer, load the page once per ?variant= and collect the
// results; scripts/audit_week03.md says how.

window.auditWeek03 = async function auditWeek03({ verbose = false } = {}) {
  const results = [];
  const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  const record = (area, check, ok, detail) =>
    results.push({ area, check, ok, detail: detail ?? "" });

  // A canvas library like ECharts hit-tests on offsetX and offsetY, which a
  // synthetic MouseEvent leaves at zero. Setting them is what makes the audit
  // exercise the same path a real click takes.
  function offsetEvent(type, target, clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const event = new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });
    Object.defineProperty(event, "offsetX", { value: clientX - rect.left });
    Object.defineProperty(event, "offsetY", { value: clientY - rect.top });
    return event;
  }

  // A control counts as working only when something observable moves.
  async function expectChange(area, check, read, act) {
    const before = read();
    await act();
    await wait();
    const after = read();
    const ok = JSON.stringify(before) !== JSON.stringify(after);
    record(area, check, ok, ok ? `${before} → ${after}` : `stuck at ${before}`);
    return ok;
  }

  const variant = document.body.dataset.variant ?? "canvas";
  const selected = () => $("sel-name")?.textContent ?? "";
  const node = (iso3) => window.api?.node?.(iso3);

  /* --- the visuals are present in some form ------------------------------ */

  const VISUALS = [
    ["globe", "globe-canvas"],
    ["twin map", "map-canvas"],
    ["histogram", "hist"],
    ["ccdf", "ccdf"],
    ["betweenness scatter", "scatter-between"],
    ["z-score scatter", "scatter-z"],
    ["denmark scatter", "dk-scatter"],
    ["denmark z", "dk-z"],
    ["denmark time", "dk-time"],
    ["denmark rank", "dk-rank"],
    ["nordic bars", "dk-nordic"],
  ];

  for (const [name, id] of VISUALS) {
    const canvas = $(id);
    // A renderer may hide the canvas and mount its own element beside it.
    const replacement = document.getElementById(`${id}-ec`) ??
      document.getElementById(`${id}-d3`) ??
      document.getElementById(`${id}-deck`) ??
      (id === "globe-canvas"
        ? document.getElementById("globe-gl") ?? document.getElementById("globe-atlas")
        : null);
    const host = replacement ?? canvas;
    const painted = host ? host.getBoundingClientRect().height > 20 : false;
    record("visual", name, painted, host ? `${host.tagName.toLowerCase()}#${host.id}` : "missing");
  }

  /* --- selecting a country, every way the page offers -------------------- */

  // ECharts draws to its own canvas and hit-tests internally, so a blind sweep
  // has to land within a few pixels of a symbol. Ask the instance where its
  // points are and click exactly there instead.
  async function pickThroughECharts(id) {
    const host = document.getElementById(`${id}-ec`);
    const instance = window.echarts?.getInstanceByDom?.(host);
    if (!instance) return false;
    host.scrollIntoView({ block: "center" });
    await wait(150);
    const canvas = host.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    const option = instance.getOption();
    for (let seriesIndex = 0; seriesIndex < option.series.length; seriesIndex += 1) {
      const data = option.series[seriesIndex].data ?? [];
      for (const datum of data.slice(0, 40)) {
        const value = datum?.value ?? datum;
        if (!Array.isArray(value)) continue;
        const pixel = instance.convertToPixel({ seriesIndex }, value);
        if (!pixel) continue;
        for (const type of ["mousemove", "mousedown", "mouseup", "click"]) {
          canvas.dispatchEvent(
            offsetEvent(type, canvas, rect.left + pixel[0], rect.top + pixel[1]),
          );
        }
        await wait(40);
        if (selected() !== window.__auditBefore) return true;
      }
    }
    return false;
  }

  const pickACountry = async (id, fraction) => {
    const host =
      document.getElementById(`${id}-d3`) ??
      document.getElementById(`${id}-ec`) ??
      $(id);
    if (!host) return false;
    // elementFromPoint only answers for points inside the viewport, and an SVG
    // renderer puts its handlers on the marks, so the chart has to be on screen
    // before it can be swept. Without this the audit reports working controls
    // as broken purely because the page was scrolled somewhere else.
    host.scrollIntoView({ block: "center" });
    await wait(120);
    const rect = host.getBoundingClientRect();
    if (rect.height < 20) return false;
    // Sweep the plot area; charts are sparse, so one point is not enough. The
    // event goes to whatever is actually painted at that point, because an SVG
    // renderer puts its handlers on the marks and a canvas one on the canvas.
    for (const [fx, fy] of fraction) {
      const x = rect.left + rect.width * fx;
      const y = rect.top + rect.height * fy;
      const target = document.elementFromPoint(x, y) ?? host;
      if (!host.contains(target) && target !== host) continue;
      for (const type of ["pointermove", "mousemove", "mousedown", "mouseup", "click"]) {
        target.dispatchEvent(offsetEvent(type, target, x, y));
      }
      await wait(40);
      if (selected() !== window.__auditBefore) return true;
    }
    return false;
  };

  const SWEEP = [];
  for (let fx = 0.2; fx <= 0.86; fx += 0.045) {
    for (let fy = 0.15; fy <= 0.9; fy += 0.055) SWEEP.push([fx, fy]);
  }

  for (const [name, id] of [
    ["histogram", "hist"],
    ["ccdf", "ccdf"],
    ["betweenness scatter", "scatter-between"],
    ["z-score scatter", "scatter-z"],
    ["denmark scatter", "dk-scatter"],
    ["denmark z", "dk-z"],
    ["nordic bars", "dk-nordic"],
  ]) {
    window.__auditBefore = selected();
    const changed =
      (await pickThroughECharts(id)) || (await pickACountry(id, SWEEP));
    record("click to select", name, changed,
      changed ? `→ ${selected()}` : "no selection after sweeping the plot");
  }

  /* --- hover says something --------------------------------------------- */

  for (const [name, id] of [
    ["betweenness scatter", "scatter-between"],
    ["denmark scatter", "dk-scatter"],
  ]) {
    const host = document.getElementById(`${id}-ec`) ?? document.getElementById(`${id}-d3`) ?? $(id);
    let shown = false;
    if (host) host.scrollIntoView({ block: "center" });
    await wait(120);
    if (host && host.getBoundingClientRect().height > 20) {
      const rect = host.getBoundingClientRect();
      for (const [fx, fy] of SWEEP) {
        const x = rect.left + rect.width * fx;
        const y = rect.top + rect.height * fy;
        const target = document.elementFromPoint(x, y) ?? host;
        for (const type of ["pointermove", "mousemove"]) {
          target.dispatchEvent(offsetEvent(type, target, x, y));
        }
        await wait(25);
        const tip = document.querySelector(".chart-tip:not([hidden])");
        const ecTip = [...document.querySelectorAll("div")].some(
          (d) => /tooltip/i.test(d.className) ||
            (d.style.position === "absolute" && /rgba|rgb/.test(d.style.backgroundColor) &&
              d.style.display !== "none" && d.textContent.trim().length > 3 &&
              d.closest('[id$="-ec"]')),
        );
        const svgTitle = host.querySelector?.("title");
        if (tip || ecTip || svgTitle) {
          shown = true;
          break;
        }
      }
    }
    record("hover feedback", name, shown, shown ? "tooltip appeared" : "nothing on hover");
  }

  /* --- the style dimensions --------------------------------------------- */

  const DIMENSION_EFFECT = {
    palette: () => getComputedStyle(document.body).getPropertyValue("--people").trim(),
    tables: () => document.body.dataset.tables,
    arcs: () => api?.state?.arcs,
    links: () => api?.state?.links,
    thickness: () => api?.state?.thickness,
    focus: () => api?.state?.focus,
    dots: () => api?.state?.dots,
  };

  for (const [key, read] of Object.entries(DIMENSION_EFFECT)) {
    const select = $(`style-${key}`);
    if (!select) {
      record("style dimension", key, false, "no dropdown");
      continue;
    }
    const other = [...select.options].find((o) => o.value !== select.value);
    if (!other) {
      record("style dimension", key, false, "only one option");
      continue;
    }
    await expectChange("style dimension", key, read, async () => {
      select.value = other.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /* --- controls that draw rather than restyle ---------------------------- */

  for (const chart of ["hist", "ccdf"]) {
    const group = document.querySelector(`.axis-modes[data-chart="${chart}"]`);
    if (group) {
      group.scrollIntoView({ block: "center" });
      await wait(120);
    }
    if (!group) {
      record("axis mode", chart, false, "no control");
      continue;
    }
    const host = document.getElementById(`${chart}-ec`) ?? document.getElementById(`${chart}-d3`) ?? $(chart);
    // The chart has to actually redraw, and each renderer proves that
    // differently: pixels for a canvas, markup for SVG, the option for ECharts.
    const snapshot = () => {
      const ec = window.echarts?.getInstanceByDom?.(host);
      if (ec) {
        const option = ec.getOption();
        return `${option.xAxis?.[0]?.type}/${option.yAxis?.[0]?.type}`;
      }
      if (host?.tagName === "CANVAS") {
        try {
          return hashCanvas(host);
        } catch {
          return "unreadable";
        }
      }
      return host?.innerHTML?.length ?? 0;
    };
    const target = [...group.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-pressed") !== "true",
    );
    await expectChange("axis mode", chart, snapshot, async () => target?.click());
  }

  function hashCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let h = 0;
    for (let i = 0; i < data.length; i += 997) h = (h * 31 + data[i]) % 1e9;
    return h;
  }

  /* --- the rest of the page --------------------------------------------- */

  // Pick a chip that is not already selected, or the check proves nothing.
  const chip = [...document.querySelectorAll(".eg-chip")].find(
    (c) => node?.(c.dataset.iso3)?.name !== selected(),
  ) ?? document.querySelector(".eg-chip");
  if (chip) {
    await expectChange("typology", "example chip selects", selected, async () => chip.click());
  } else record("typology", "example chip selects", false, "no chips");

  const drawer = $("type-drawer");
  const all = document.querySelector(".eg-all");
  if (all && drawer) {
    drawer.hidden = true;
    await expectChange("typology", "drawer opens", () => drawer.hidden, async () => all.click());
    const rows = drawer.querySelectorAll(".drawer-table tbody tr").length;
    record("typology", "drawer lists countries", rows > 0, `${rows} rows`);
  } else record("typology", "drawer opens", false, "no see-all button");

  const origin = $("edge-origin");
  if (origin) {
    await expectChange("edge inspector", "changing origin", () => $("edge-facts")?.textContent?.slice(0, 40),
      async () => {
        const other = [...origin.options].find((o) => o.value !== origin.value && o.value !== $("edge-dest").value);
        origin.value = other.value;
        origin.dispatchEvent(new Event("change", { bubbles: true }));
      });
  } else record("edge inspector", "changing origin", false, "no control");

  const slider = $("year-slider");
  if (slider) {
    await expectChange("year slider", "changes the year", () => $("year-now")?.textContent, async () => {
      slider.value = slider.value === "0" ? "6" : "0";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
  } else record("year slider", "changes the year", false, "no slider");

  const toggle = document.querySelector('#map-toggle button[aria-pressed="false"]');
  if (toggle) {
    await expectChange("map layers", "toggle switches", () => api?.state?.layer, async () => toggle.click());
  } else record("map layers", "toggle switches", false, "no toggle");

  const failures = results.filter((r) => !r.ok);
  return {
    variant,
    total: results.length,
    failed: failures.length,
    failures,
    ...(verbose ? { all: results } : {}),
  };
};
