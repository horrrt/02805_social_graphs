import { esc, shortName } from "./cabinet.js";
export const metricLabels = {
  kin: "Incoming links",
  kout: "Outgoing links",
  degree: "Neighbours",
  betweenness: "Betweenness",
  clustering: "Clustering",
};
export const metricValue = (node, key) =>
  ["betweenness", "clustering"].includes(key)
    ? `${(node[key] * 100).toFixed(2)}%`
    : node[key];
export function card(
  node,
  { index = 0, count, full = false, fresh = false } = {},
) {
  const initials = shortName(node)
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return `<article class="hero-card${count === 0 ? " uncollected" : ""}"><div class="card-id">#${String(index + 1).padStart(3, "0")} / ${node.component.toUpperCase()}</div>${fresh ? '<span class="new-stamp">NEW</span>' : ""}<div class="card-monogram" aria-hidden="true">${esc(initials)}</div><h3><a href="${esc(node.url)}" target="_blank" rel="noopener">${esc(shortName(node))}</a></h3>${(full ? Object.keys(metricLabels) : ["kin", "kout"]).map((k) => `<div class="stat-pair"><span>${metricLabels[k]}</span><strong>${metricValue(node, k)}</strong></div>`).join("")}<div class="stat-pair"><span>Community</span><strong>C${node.community}</strong></div>${count !== undefined ? `<small>${count ? `${count} collected` : "Not collected"}</small>` : ""}</article>`;
}
