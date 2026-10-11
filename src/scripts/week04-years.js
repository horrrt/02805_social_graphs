// Week 4 redesign · five years of filings, FY2022 to FY2026, in the deep
// dive's #cut-years box: eight panels of plain SVG from
// public/weeks/week04/data/years.json (written by analysis/week04_years.py),
// coloured from the page's own CSS tokens. The box
// (src/features/week04/years/Years.tsx) renders once it is first opened;
// this module computes the answer, the panels' series and findings, and the
// tables.

export const YEARS = ["2022", "2023", "2024", "2025", "2026"];
// Data keys read "FY2025"; the page writes the plain year.
export const yr = (s) => String(s).replace(/^FY(\d{4})/, "$1");
export const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const FOUR_FIRMS = ["Tata Consultancy Services", "Cognizant", "Infosys", "HCL"];

const whole = new Intl.NumberFormat("en-US");
export const num = (v) => whole.format(Math.round(v));
export const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
// A signed change in percent, with a true minus sign, for chart annotations.
export const signed = (p, d = 1) => `${p < 0 ? "−" : "+"}${Math.abs(p).toFixed(d)}%`;
export const change = (a, b) => 100 * (b / a - 1);

// A zero-based axis: the lowest round top tick that holds vmax in three to
// six steps. Ported from review/week04-redesign/generator/extra.py:nice_axis.
export function niceAxis(vmax) {
  let best = null;
  const mag = 10 ** Math.floor(Math.log10(vmax / 4));
  for (const m of [1, 2, 2.5, 5, 10, 20]) {
    const step = m * mag;
    const top = step * Math.ceil(vmax / step);
    const n = top / step;
    if (n >= 3 && n <= 6 && (!best || top < best.top)) best = { step, top };
  }
  return best || { step: vmax / 4, top: vmax };
}

// Nudge label y positions apart so no two sit closer than gap, keeping their
// order. Ported from extra.py:spread.
export function spread(ys, gap = 13) {
  const order = [...ys.keys()].sort((a, b) => ys[a] - ys[b]);
  const pos = order.map((i) => ys[i]);
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let k = 1; k < pos.length; k++) {
      const d = pos[k] - pos[k - 1];
      if (d < gap - 0.01) {
        pos[k - 1] -= (gap - d) / 2;
        pos[k] += (gap - d) / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = new Array(ys.length);
  order.forEach((i, k) => (out[i] = pos[k]));
  return out;
}

/**
 * The card's answer and the first two panels' findings, all from years.json:
 * the 2023 change on 2022, the 2025 total, and 2026 against the same
 * October-to-June months of 2025 (2026 has no other months yet).
 */
export function yearsAnswer(data) {
  const ys = data.years;
  const oj = data.oct_jun.totals;
  const fell23 = change(ys["2022"].certified_filings, ys["2023"].certified_filings);
  const rose25 = ys["2025"].certified_filings > ys["2024"].certified_filings;
  const fell26 = change(oj.FY2025.certified_filings, oj.FY2026.certified_filings);
  const verb = (p) => (p < 0 ? "fell" : "rose");
  const answer =
    `Certified filings ${verb(fell23)} ${Math.abs(fell23).toFixed(0)}% in 2023, ${rose25 ? "rose" : "fell"} to ` +
    `${num(ys["2025"].certified_filings)} in 2025, and ${verb(fell26)} ${Math.abs(fell26).toFixed(1)}% in 2026 ` +
    "against the same months a year earlier.";
  return { answer, oj, fell23, fell26 };
}

/** Everything the box draws: the answer, each panel's series and finding, and the tables. */
export function yearsModel(data) {
  const ys = data.years;
  const { answer, oj, fell23, fell26 } = yearsAnswer(data);
  const cert = YEARS.map((y) => ({ label: y, v: ys[y].certified_filings }));
  const like = ["FY2024", "FY2025", "FY2026"].map((fy) => ({ label: yr(fy), v: oj[fy].certified_filings }));
  const rows = { FY2024: data.monthly.FY2024, FY2025: data.monthly.FY2025, FY2026: data.monthly.FY2026 };
  const oct25 = rows.FY2026[0];
  const share = YEARS.map((y) => ({ label: y, v: ys[y].placed_share }));

  const per = {};
  YEARS.forEach((y) => {
    per[y] = Object.fromEntries(ys[y].top_firms_by_filings);
  });
  const ymaxF = Math.max(...FOUR_FIRMS.flatMap((f) => YEARS.map((y) => per[y][f] || 0))) * 1.18;
  const topN = ys["2026"].top_firms_by_filings.length;
  const firms = FOUR_FIRMS.map((f) => {
    const full = YEARS.map((y) => ({ label: y.replace("20", "’"), v: per[y][f] }));
    const have = full.filter((s) => s.v != null);
    return { name: f, series: have.length < 5 ? have : full, note: per["2026"][f] == null ? `Not in 2026’s top ${topN}` : null };
  });

  const denialA = data.uscis_series.map((r) => r.placing_initial_denial_rate);
  const denialB = data.uscis_series.map((r) => r.direct_initial_denial_rate);
  const ratios = denialA.map((v, i) => v / denialB[i]);

  // Each draw is held the March before the cap year it fills.
  const capYears = Object.keys(data.lottery_draws).sort();
  const drawMonth = (capYear) => `March ${Number(capYear) - 1}`;
  const draws = capYears.map((y) => ({ label: drawMonth(y), v: data.lottery_draws[y].registrations }));
  const drawGrowth = draws.at(-1).v / draws[0].v;
  const funnelYears = Object.keys(data.lottery_funnels).sort();
  const perApp = funnelYears.map((y) => data.lottery_funnels[y].registrations_per_approval);

  const clients = YEARS.map((y) => ys[y].clients);
  const firmCounts = YEARS.map((y) => ys[y].firms);

  const placedFalls = ["2024", "2025", "2026"].every((y, i) => ys[y].placed_share < ys[YEARS[i + 1]].placed_share);
  const placedFinding = placedFalls
    ? "The share placed at a client fell every year from 2023: " +
      `${pct(ys["2023"].placed_share)}, ${pct(ys["2024"].placed_share)}, ${pct(ys["2025"].placed_share)}, and ` +
      `${pct(ys["2026"].placed_share)} from October 2025 to June 2026.`
    : "";

  const tables = [
    {
      caption: "Certified filings, placed share, clients, firms and USCIS denial rates, per fiscal year",
      head: ["Year", "Certified filings", "Placed at a client", "Clients", "Firms", "Placing firms’ denials", "Direct employers’ denials"],
      rows: YEARS.map((y, i) => [
        `${y}${y === "2026" ? ", Oct–Jun" : ""}`,
        num(ys[y].certified_filings),
        pct(ys[y].placed_share),
        num(ys[y].clients),
        num(ys[y].firms),
        pct(data.uscis_series[i].placing_initial_denial_rate),
        pct(data.uscis_series[i].direct_initial_denial_rate),
      ]),
    },
    {
      caption: "Certified filings, October to June, three fiscal years",
      head: ["Year", "Certified filings"],
      rows: ["FY2024", "FY2025", "FY2026"].map((fy) => [yr(fy), num(oj[fy].certified_filings)]),
      after: `2026 against 2025: ${data.oct_jun.certified_filings_change_fy25_fy26_percent.toFixed(1)}%.`,
    },
    {
      caption: "Certified and placed filings per month, October to June, 2024 to 2026",
      head: ["Month", "2024 certified", "2025 certified", "2026 certified", "2024 placed", "2025 placed", "2026 placed"],
      rows: MONTHS.map((mo, i) => [
        mo,
        num(rows.FY2024[i].certified_filings),
        num(rows.FY2025[i].certified_filings),
        num(rows.FY2026[i].certified_filings),
        num(rows.FY2024[i].placed_filings),
        num(rows.FY2025[i].placed_filings),
        num(rows.FY2026[i].placed_filings),
      ]),
    },
    {
      caption: "Placed filings for the four largest placing firms, per fiscal year",
      head: ["Firm", ...YEARS.map((y) => `${y}${y === "2026" ? " (Oct–Jun)" : ""}`)],
      rows: FOUR_FIRMS.map((firm) => [firm, ...YEARS.map((y) => (per[y][firm] != null ? num(per[y][firm]) : "–"))]),
    },
    {
      caption: "H-1B lottery: registrations per draw and registrations per approval",
      head: ["Draw", "Cap year", "Registrations", "Registrations per approval"],
      rows: capYears.map((y) => [
        drawMonth(y),
        y,
        num(data.lottery_draws[y].registrations),
        data.lottery_funnels[y] ? data.lottery_funnels[y].registrations_per_approval.toFixed(2) : "–",
      ]),
    },
  ];

  return {
    answer,
    notice:
      "Each year runs October to September; 2026 covers October 2025 to June 2026 and is drawn hollow. " +
      "Compare 2026 with earlier years on matching months.",
    background:
      `October 2025, the month of the federal shutdown, holds ${num(oct25.certified_filings)} certified filings ` +
      `against ${num(rows.FY2025[0].certified_filings)} a year earlier.`,
    cert: { series: cert, note: [1, `${signed(fell23, 0)} on 2022`] },
    like: { series: like, note: [2, `${signed(fell26)} on 2025`] },
    monthly: { rows, shutdown: [0, `Shutdown, October 2025: ${num(oct25.certified_filings)}`] },
    share,
    placedFinding,
    firms: { firms, ymax: ymaxF, topN },
    denial: { a: denialA, b: denialB, note: `Placing firms: ${Math.min(...ratios).toFixed(1)}× to ${Math.max(...ratios).toFixed(1)}× the direct rate` },
    uscisMin: data.uscis_min_filings,
    lottery: {
      draws,
      sub: capYears.map((y) => `${y} cap`),
      note: [draws.length - 1, `${drawGrowth.toFixed(1)}× the ${draws[0].label} draw`],
      caption:
        `Registrations per draw. One approved petition took ${perApp[0].toFixed(1)} registrations in the ${drawMonth(funnelYears[0])} ` +
        `draw and ${perApp[1].toFixed(1)} in ${drawMonth(funnelYears[1])}; USCIS’s data ends there.`,
    },
    // 2025 is the last full year, so the clients-and-firms finding stops there.
    clients: { a: clients, b: firmCounts, note: `2022 to 2025: clients ${signed(change(clients[0], clients[3]))}, firms ${signed(change(firmCounts[0], firmCounts[3]))}` },
    tables,
  };
}
