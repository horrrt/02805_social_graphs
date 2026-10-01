import { graph, bfs } from "./arcade-core.mjs";

// Selected examples from the frozen graph; paths are calculated, not scripted.
export const JOURNEYS = {
  "Spider-Man": [
    ["Enigma_(Marvel_Comics)", "Hulk"],
    ["Abomination_(character)", "Anne_Weying"],
  ],
  Hulk: [
    ["Abomination_(character)", "Crane_Mother"],
    ["Enigma_(Marvel_Comics)", "Doctor_Strange"],
  ],
  "Black_Widow_(Natasha_Romanova)": [
    ["Rockman_(character)", "Hulk"],
    ["Adam_Warlock", "Yelena_Belova"],
  ],
  Doctor_Strange: [
    ["Captain_Ultra", "Hulk"],
    ["Adam_Warlock", "Black_Rider_(character)"],
  ],
};

export function journey(data, from, to, removed) {
  const before = bfs(graph(data, { core: true }), from, to);
  const after = bfs(graph(data, { core: true, removed: [removed] }), from, to);
  return { before, after };
}

export function mountRide(root, data, { onClose, onRestore }) {
  if (!root) return { reset() {}, update() {} };
  const nodes = new Map(data.nodes.map((n) => [n.id, n]));
  const label = (id) => nodes.get(id).name.replace(/ \([^)]*\)/g, "");
  const find = (s) => root.querySelector(s);
  let station,
    closed = false,
    guess = null;
  const select = find("#ride-journey");
  function routeLine(container, path, broken = false) {
    container.replaceChildren();
    for (const id of path) {
      const stop = document.createElement("li");
      stop.className = broken && id === station ? "closed-stop" : "";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ride-stop";
      button.textContent = label(id);
      button.setAttribute(
        "aria-label",
        `${label(id)}${broken && id === station ? ", closed" : ""}: inspect article`,
      );
      button.addEventListener("click", () => {
        const n = nodes.get(id);
        find("#ride-inspector").textContent =
          `${label(id)}: ${n.degree} directly connected articles, ${n.kin} incoming references and ${n.kout} outgoing references in the frozen roster. ${closed && id === station ? "This article and its links are removed from the current model." : "The route shows just the links needed for this journey."}`;
      });
      stop.append(button);
      container.append(stop);
    }
  }
  function render() {
    const [from, to] = JOURNEYS[station][Number(select.value) || 0];
    const result = journey(data, from, to, station);
    find("#ride-title").textContent = `${label(from)} → ${label(to)}`;
    find("#ride-station").textContent = `Planned closure: ${label(station)}`;
    routeLine(find("#ride-before"), result.before);
    find("#ride-before-label").textContent =
      `Normal service · ${result.before.length - 1} hops`;
    find("#ride-after-panel").hidden = !closed;
    find("#ride-choices").hidden = closed;
    find("#ride-reset").hidden = !closed;
    find("#ride-inspector").textContent =
      "Select a station on either route to inspect its article. Each hop follows a real link, in either direction.";
    if (!closed) {
      find("#ride-result").textContent =
        `If ${label(station)} closes, can this journey still arrive?`;
      root.dataset.outcome = "waiting";
      return;
    }
    const arrived = !!result.after;
    root.dataset.outcome = arrived ? "arrived" : "cut-off";
    routeLine(find("#ride-after"), result.after || result.before, !arrived);
    find("#ride-after-label").textContent = arrived
      ? `After closure · ${result.after.length - 1} hops`
      : "After closure · no route";
    const verdict = arrived
      ? `You can still arrive. ${result.after.length > result.before.length ? `The shortest route now takes ${result.after.length - 1} hops instead of ${result.before.length - 1}.` : "A shortest route still takes the same number of hops."}`
      : `Journey cut off. There is no route from ${label(from)} to ${label(to)} anywhere in the remaining network.`;
    find("#ride-result").textContent =
      `${guess === null ? "" : guess === arrived ? "Your prediction holds. " : "The network does something different. "}${verdict}`;
    find("#ride-after-note").textContent = arrived
      ? "This is one shortest surviving route. Other routes may exist."
      : "The crossed-out station shows where the old route breaks. We checked the whole remaining core, not only the stops drawn here.";
  }
  for (const button of root.querySelectorAll("[data-arrive]"))
    button.addEventListener("click", () => {
      guess =
        button.dataset.arrive === "skip"
          ? null
          : button.dataset.arrive === "yes";
      onClose();
    });
  find("#ride-reset").addEventListener("click", () => {
    guess = null;
    onRestore();
  });
  select.addEventListener("change", () => {
    guess = null;
    render();
  });
  return {
    reset(id) {
      station = id;
      closed = false;
      guess = null;
      select.replaceChildren(
        ...JOURNEYS[id].map(([from, to], i) => {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = `${label(from)} → ${label(to)}`;
          return option;
        }),
      );
      render();
    },
    update(id) {
      closed = !!id;
      render();
    },
  };
}
