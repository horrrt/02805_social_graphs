// Built-in functions for {evaluate: name, args} steps. A scenario module's own
// named exports win, then scenarios/<page>/lib.mjs, then these. Each takes the
// Playwright page first and returns a JSON value the runtime compares.
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

/** Clicks data item dataIndex of series seriesIndex in the ECharts chart on #hostId. */
export async function echartsClick(page, hostId, seriesIndex = 0, dataIndex = 0) {
  const point = await page.evaluate(([hostId, seriesIndex, dataIndex]) => {
    const host = document.getElementById(hostId);
    const inst = host && window.echarts?.getInstanceByDom(host);
    if (!inst) throw new Error(`no ECharts instance on #${hostId}`);
    const series = inst.getModel().getSeriesByIndex(seriesIndex);
    if (!series) throw new Error(`#${hostId} has no series ${seriesIndex}`);
    const data = series.getData();
    let xy = null;
    try {
      const name = data.getName(dataIndex);
      const value = data.getValues ? data.getValues(dataIndex) : data.get(data.dimensions[0], dataIndex);
      xy = inst.convertToPixel({ seriesIndex }, series.type === "map" ? name : value);
    } catch { /* fall through to the item's shape */ }
    if (!Array.isArray(xy) || !xy.every(Number.isFinite)) {
      const el = data.getItemGraphicEl(dataIndex);
      if (!el) throw new Error(`#${hostId} series ${seriesIndex} item ${dataIndex} has no shape`);
      const r = el.getBoundingRect().clone();
      el.getComputedTransform() && r.applyTransform(el.getComputedTransform());
      xy = [r.x + r.width / 2, r.y + r.height / 2];
    }
    const box = host.getBoundingClientRect();
    return [box.left + xy[0], box.top + xy[1]];
  }, [hostId, seriesIndex, dataIndex]);
  await page.mouse.click(point[0], point[1]);
  return point.map((v) => Math.round(v));
}

/** Runs scripts/audit_week03.js in the page and returns auditWeek03()'s rows. */
export async function audit03(page, options = {}) {
  await page.addScriptTag({ path: join(ROOT, "scripts/audit_week03.js") });
  return page.evaluate((o) => window.auditWeek03(o), options);
}

/** Fires the storage event another tab would send after writing localStorage[key]. */
export async function storageEvent(page, key, newValue) {
  return page.evaluate(([key, newValue]) => {
    if (newValue !== undefined) localStorage.setItem(key, newValue);
    const value = localStorage.getItem(key);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: value, storageArea: localStorage, url: location.href }));
    return value;
  }, [key, newValue]);
}
