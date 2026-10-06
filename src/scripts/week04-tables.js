// Table styling for week 4: numeric columns right-aligned, one bar column
// scaled to its largest value, one meter column for a share, and the other
// text columns softened. The rules follow the redesign's table pass.
//
// A table may set its bars itself with data-rx-bars="col:max:class,…": each
// listed column gets a bar of that class on a 0-to-max scale, and the automatic
// bar and meter rules are skipped. A cell written as a percentage counts as a
// fraction there, so "2.7%" is 0.027 against a max of 0.04.
//
// Decoration adds no text: the bar is an empty <span><i></i></span> in front
// of the cell's own content. Scripts refill tables after load, so
// decorateAll() watches its root and decorates again whatever changed. This
// file has no <script> tag, so any page script may import it.

const NUM = /^[−\-+]?[\d,]+(\.\d+)?(%|×)?$|^[−\-+]?\d*\.\d+(\s*±\s*\d*\.?\d+)?$/;
const BAR_HEADER = /filings|links|weight|registrations|certified|clients|vendors|firms|edges/i;
const METER_HEADER = /share|placed/i;
const YEAR_HEADER = /^\d{4}/;

const text = (cell) => (cell ? cell.textContent.replace(/\s+/g, " ").trim() : "");
const value = (s) =>
  parseFloat(s.replace(/,/g, "").replace(/%/g, "").replace(/−/g, "-").replace(/×/g, "").split("±")[0]);

// The cell's content without any bar we added before.
function content(cell) {
  const wrap = cell.querySelector(":scope > .rx-cell");
  return wrap ? wrap.lastElementChild : null;
}

function setBar(cell, width, kind) {
  let wrap = cell.querySelector(":scope > .rx-cell");
  if (!wrap) {
    wrap = document.createElement("span");
    wrap.className = "rx-cell";
    const bar = document.createElement("span");
    bar.append(document.createElement("i"));
    const own = document.createElement("span");
    own.append(...cell.childNodes);
    wrap.append(bar, own);
    cell.append(wrap);
  }
  const bar = wrap.firstElementChild;
  bar.className = kind ? `rx-bar ${kind}` : "rx-bar";
  bar.firstElementChild.style.width = width;
}

function clearBar(cell) {
  const own = content(cell);
  if (!own) return;
  cell.replaceChildren(...own.childNodes);
}

function overrides(spec) {
  if (!spec) return null;
  const out = new Map();
  for (const part of spec.split(",")) {
    const [col, max, kind] = part.trim().split(":");
    const j = Number(col);
    const m = Number(max);
    if (Number.isInteger(j) && m > 0) out.set(j, { max: m, kind: kind || "" });
  }
  return out;
}

const squash = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/**
 * What decorate() does to a table, worked out from its text alone, so a
 * component can render the same classes and bars. headers: the last head
 * row's cell text. rows: the body rows, each an array of cells, a cell being
 * its text (a <td>) or { text, tag }. rxBars: the table's data-rx-bars.
 * Returns null for a table without body rows, which decorate() leaves alone.
 * Otherwise head[j] is the class a head cell gains ("num" or ""), and each
 * row is { rx: true, cells } with cells[j] = { tag, className, bar }:
 * className is "num", "soft" or "" (a <th>, or the first column, gains
 * nothing), and a "num" cell has bar { kind, width } (width "12.5%") or
 * bar null, which removes a bar drawn before.
 */
export function decorationFor({ headers = [], rows, rxBars }) {
  if (!rows.length) return null;
  const cells = rows.map((row) =>
    row.map((cell) =>
      typeof cell === "object" && cell !== null
        ? { text: squash(cell.text), tag: String(cell.tag ?? "td").toLowerCase() }
        : { text: squash(cell), tag: "td" },
    ),
  );
  const ncol = Math.max(0, ...cells.map((r) => r.length));
  const column = (j) => cells.map((r) => (r[j] ? r[j].text : "")).filter(Boolean);

  const numeric = [];
  for (let j = 0; j < ncol; j++) {
    const col = column(j);
    numeric.push(j > 0 && col.length > 0 && col.filter((s) => NUM.test(s)).length >= 0.8 * col.length);
  }
  const hdr = headers.map(squash);

  const bars = new Map();
  const custom = overrides(rxBars);
  if (custom) {
    for (const [j, { max, kind }] of custom) bars.set(j, { max, kind, fraction: true });
  } else {
    const barCol = numeric.findIndex(
      (isNum, j) =>
        isNum && j < hdr.length && BAR_HEADER.test(hdr[j]) && !YEAR_HEADER.test(hdr[j]) && !column(j).some((s) => s.endsWith("%")),
    );
    if (barCol >= 0) {
      const max = Math.max(0, ...column(barCol).filter((s) => NUM.test(s)).map(value));
      if (max > 0) bars.set(barCol, { max, kind: "", fraction: false });
    }
    const meterCol = numeric.findIndex(
      (isNum, j) => isNum && j < hdr.length && METER_HEADER.test(hdr[j]) && column(j).every((s) => s.endsWith("%")),
    );
    if (meterCol >= 0 && meterCol !== barCol) bars.set(meterCol, { max: 100, kind: "meter", fraction: false, meter: true });
  }

  return {
    head: hdr.map((_, j) => (j < ncol && numeric[j] ? "num" : "")),
    rows: cells.map((row) => ({
      rx: true,
      cells: row.map(({ text: s, tag }, j) => {
        if (tag !== "td") return { tag, className: "", bar: null };
        if (!numeric[j]) return { tag, className: j > 0 ? "soft" : "", bar: null };
        const bar = bars.get(j);
        if (!bar || !NUM.test(s)) return { tag, className: "num", bar: null };
        let v = value(s);
        if (bar.fraction && s.endsWith("%")) v /= 100;
        const width = bar.meter ? Math.min(100, Math.max(2, v)) : Math.min(100, Math.max(2, (100 * v) / bar.max));
        return { tag, className: "num", bar: { kind: bar.kind, width: `${width.toFixed(1)}%` } };
      }),
    })),
  };
}

export function decorate(table) {
  const head = table.tHead ? table.tHead.rows[table.tHead.rows.length - 1] : null;
  const headers = head ? [...head.cells] : [];
  const rows = [...table.tBodies].flatMap((body) => [...body.rows]);
  const cells = rows.map((row) => [...row.cells]);
  const plan = decorationFor({
    headers: headers.map(text),
    rows: cells.map((r) => r.map((cell) => ({ text: text(cell), tag: cell.tagName }))),
    rxBars: table.dataset.rxBars,
  });
  if (!plan) return;

  headers.forEach((th, j) => {
    if (plan.head[j]) th.classList.add(plan.head[j]);
  });
  rows.forEach((row, i) => {
    plan.rows[i].cells.forEach(({ tag, className, bar }, j) => {
      if (tag !== "td" || !className) return;
      const cell = cells[i][j];
      cell.classList.add(className);
      if (className !== "num") return;
      if (bar) setBar(cell, bar.width, bar.kind);
      else clearBar(cell);
    });
    row.dataset.rx = "";
  });
}

// Decorate every table under `root` now, and again whenever a script adds or
// refills one. Our own changes are taken off the observer's queue, so the
// observer never reacts to itself.
export function decorateAll(root) {
  if (!root) return;
  let queued = new Set();
  let frame = 0;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const table = target && target.closest("table");
      if (table) queued.add(table);
      for (const added of record.addedNodes) {
        if (added.nodeType !== 1) continue;
        if (added.tagName === "TABLE") queued.add(added);
        else for (const t of added.querySelectorAll("table")) queued.add(t);
      }
    }
    if (queued.size && !frame) frame = requestAnimationFrame(flush);
  });
  const watch = () => observer.observe(root, { childList: true, subtree: true });
  const run = (tables) => {
    observer.disconnect();
    for (const table of tables) if (table.isConnected && root.contains(table)) decorate(table);
    observer.takeRecords();
    watch();
  };
  function flush() {
    frame = 0;
    const tables = queued;
    queued = new Set();
    run(tables);
  }
  run(root.querySelectorAll("table"));
}
