// {evaluate} functions for the Week 3 scenarios.
import { audit03 } from "../../evaluate.mjs";

export { clickAt, ctrlWheel, focus } from "../shared.mjs";

/**
 * audit03 with every row (verbose). Under ?variant=echarts main has no
 * #prestige-ec, and ECharts 5.5.1's getInstanceByDom(null) throws, so the
 * plain audit stops at its click-to-select checks. While the audit runs, a
 * null host gets undefined back (what the audit's `if (!instance)` expects),
 * so the run reaches its end and returns main's rows, failures included
 * (KB06). The original function is put back afterwards.
 */
export async function audit03Rows(page) {
  await page.evaluate(() => {
    const E = window.echarts;
    if (!E?.getInstanceByDom || E.__parityGuard) return;
    const real = E.getInstanceByDom;
    E.__parityGuard = real;
    E.getInstanceByDom = (dom) => (dom ? real.call(E, dom) : undefined);
  });
  try {
    const rows = await audit03(page, { verbose: true });
    return { ...rows, all: rows.all.map((r) => ({ ...r, detail: String(r.detail).replace(/\d{5,}/g, "#") })) };
  } finally {
    await page.evaluate(() => {
      const E = window.echarts;
      if (E?.__parityGuard) {
        E.getInstanceByDom = E.__parityGuard;
        delete E.__parityGuard;
      }
    }).catch(() => {});
  }
}
