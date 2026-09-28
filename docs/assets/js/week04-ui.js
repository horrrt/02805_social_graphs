// Week 4 redesign · shared drawer builders for cards that scripts build. A
// drawer is a closed <details class="rx-drawer">; a card's drawers sit together
// in one div.rx-drawers.rx-foot, the last child of its text column. Labels run
// Background, Method, More numbers, then "Table: …" or "Maps: …". This module
// has no <script> tag of its own, so page scripts may import it.

/** One closed drawer. `body` is a Node or an HTML string. */
export function drawer(label, body) {
  const details = document.createElement("details");
  details.className = "rx-drawer";
  const summary = document.createElement("summary");
  summary.textContent = label;
  const inner = document.createElement("div");
  inner.className = "rx-drawer-body";
  if (typeof body === "string") inner.innerHTML = body;
  else if (body) inner.append(body);
  details.append(summary, inner);
  return details;
}

/** The row that holds a card's drawers, in the order given. */
export function drawerRow(...drawers) {
  const row = document.createElement("div");
  row.className = "rx-drawers rx-foot";
  row.append(...drawers);
  return row;
}
