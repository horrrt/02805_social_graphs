const { chromium } = require('/Users/gyula/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Users/gyula/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })).newPage();
  let hit = 0;
  await page.route(/week04-roles\.js/, async (route) => {
    const resp = await route.fetch(); let b = await resp.text(); const b0 = b;
    b = b.replace('padding: [10, 12],\n        textStyle', 'padding: [8, 10],\n        extraCssText: "border-radius:8px;box-shadow:0 4px 14px rgba(11,31,58,.18);max-width:240px;white-space:normal;",\n        axisPointer: { type: "line", lineStyle: { color: "rgba(15,35,64,.35)", width: 1 } },\n        textStyle');
    b = b.replace('formatter: (points) => tooltipHtml(points),', 'formatter: (points) => compactTip(points),');
    b = b.replace('emphasis: { focus: "series" },', 'emphasis: { focus: "series" },\n    blur: { areaStyle: { opacity: 0.35 } },');
    b = b.replace('function tooltipHtml(points) {', `function compactTip(points) {
  const yi = points[0]?.dataIndex ?? 0; const totals = totalsFor(); const total = totals[YEARS[yi]] || 1;
  const series = seriesOf(state.split); const hov = window.__hov;
  const head = '<div style="font-size:11px;opacity:.75">' + esc(YEARS[yi]) + (state.window === "oct_jun" ? ", Oct–Jun" : "") + ' · ' + num(total) + ' filings</div>';
  const line = (s, big) => { const v = valuesFor(s)[yi]; const p = points.find((q) => q.seriesName === s.name);
    const prev = yi > 0 ? valuesFor(s)[yi - 1] : null;
    return '<div style="display:flex;gap:6px;align-items:baseline;margin-top:' + (big ? 4 : 2) + 'px">' + (p ? '<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' + (typeof p.color === 'string' ? p.color : p.color?.colorStops?.[0]?.color || '#0f2340') + ';box-shadow:0 0 0 1px rgba(255,255,255,.45)"></span>' : '') + '<span style="flex:1' + (big ? ';font-weight:700' : '') + '">' + esc(s.name) + '</span><b>' + pct(v / total) + '</b></div>' +
      (big ? '<div style="margin-left:16px;font-size:11px;opacity:.8">' + num(v) + ' filings' + (prev ? ', ' + (v >= prev ? '+' : '') + Math.round(100 * (v - prev) / prev) + '% on ' + YEARS[yi - 1] : '') + '</div>' : ''); };
  const s = hov && series.find((r) => r.name === hov);
  if (s) return head + line(s, true);
  const top = [...series].filter((r) => r.code !== null).sort((a, b) => valuesFor(b)[yi] - valuesFor(a)[yi]).slice(0, 3);
  return head + top.map((r) => line(r, false)).join('') + '<div style="margin-top:4px;font-size:11px;opacity:.7">Hover a band for its numbers</div>';
}
function tooltipHtml(points) {`);
    if (b !== b0) hit++;
    await route.fulfill({ status: 200, body: b, contentType: 'application/javascript' });
  });
  await page.goto('http://localhost:8777/weeks/week04/'); await page.waitForTimeout(1500);
  const MODE = process.argv[2];
  const info = await page.evaluate(async (MODE) => {
    const ramp = ['#0f2340','#14618f','#3d7fb0','#5b95c2','#739fc4','#86aecf','#97badb','#a7c5e0','#b3cde5','#bfd5e9','#c9dcec','#d2e2ef','#dbe7f2','#e3ecf5'];
    const c = document.querySelector('.corridor') || document.documentElement;
    ramp.forEach((v, i) => c.style.setProperty('--w4-area-' + (i + 1), v)); c.style.setProperty('--w4-area-other', '#d3d9e1');
    const d = document.getElementById('cut-roles'); d.open = true; d.scrollIntoView();
    await new Promise(r => setTimeout(r, 2500));
    document.querySelector('[data-roles-split="groups"]').click(); await new Promise(r => setTimeout(r, 500));
    document.querySelector('[data-roles-split="occupations"]').click(); await new Promise(r => setTimeout(r, 1200));
    const inst = echarts.getInstanceByDom(document.getElementById('roles-chart'));
    const series = inst.getOption().series; const si = series.findIndex(s => s.name === 'Software Developers');
    if (MODE === 'band') inst.dispatchAction({ type: 'highlight', seriesIndex: si });
    window.__hov = MODE === 'band' ? 'Software Developers' : null; inst.dispatchAction({ type: 'showTip', seriesIndex: si, dataIndex: 3 });
    await new Promise(r => setTimeout(r, 900));
    return { si, n: series.length };
  }, MODE);
  const el = await page.$('#roles-chart'); await el.screenshot({ path: 'roles_tip_' + MODE + '.png' });
  console.log('hit', hit, JSON.stringify(info));
  await browser.close();
})();
