import {
  setupChrome,
  $,
  esc,
  shortName,
  load,
  prediction,
  articleOptions,
  canvasStage,
  drawNetwork,
  errorMessage,
} from "./cabinet.js";
import { graph, coverage } from "./arcade-core.mjs";
import { card, metricLabels, metricValue } from "./cards.js";
setupChrome();
try {
  const data = await load();
  $("#app-status").hidden = true;
  const adj = graph(data),
    byId = new Map(data.nodes.map((n) => [n.id, n]));
  let team = [];
  prediction($("#prediction"), {
    id: "w3-coverage",
    week: 3,
    prompt: "Our greedy five-card team covers how many of the 303 articles?",
    min: 0,
    max: 303,
    answer: data.greedyDraft.covered,
    unit: "articles",
    explain:
      "Coverage includes each selected article and its neighbours. This is a baseline you can try to beat, not a proven optimum.",
  });
  articleOptions($("#battle-left"), data, "Spider-Man");
  articleOptions($("#battle-right"), data, "Betsy_Braddock");
  articleOptions($("#draft-select"), data, "Spider-Man");
  const explain = {
    kin: "Incoming links count who points to this article. The direction matters: receiving attention and linking outward are different behaviours.",
    kout: "Outgoing links count where this article points within the roster. A prolific linker need not be widely linked to.",
    degree:
      "Undirected neighbours count distinct adjacent articles, collapsing mutual links. This is not the sum of incoming and outgoing links.",
    betweenness:
      "Betweenness measures the share of shortest paths passing through an article, normalized over the full undirected 303-node graph. It is brokerage in this model, not causal influence.",
    clustering:
      "Local clustering is the fraction of possible neighbour-to-neighbour links that exist. A small, tightly connected group can beat a large hub. Degree below two receives zero.",
  };
  function battle() {
    const a = byId.get($("#battle-left").value),
      b = byId.get($("#battle-right").value),
      key = $("#battle-metric").value;
    $("#left-card").innerHTML = card(a, {
      index: data.nodes.indexOf(a),
      full: true,
    });
    $("#right-card").innerHTML = card(b, {
      index: data.nodes.indexOf(b),
      full: true,
    });
    const delta = a[key] - b[key];
    $("#battle-result").textContent =
      `${Math.abs(delta) < 1e-12 ? "Tie" : shortName(delta > 0 ? a : b) + " wins"} on ${metricLabels[key].toLowerCase()}: ${metricValue(a, key)} vs ${metricValue(b, key)}. ${a.id === b.id ? "You selected the same article twice." : "Switch the stat and see whether the answer changes."}`;
    $("#metric-explanation").textContent = explain[key];
  }
  ["battle-left", "battle-right", "battle-metric"].forEach((id) =>
    $("#" + id).addEventListener("change", battle),
  );
  battle();
  const draw = canvasStage($("#coverage-map"), (c, w, h) =>
    drawNetwork(c, w, h, data, {
      active: coverage(adj, team),
      color: "#d5adff",
      label: `${coverage(adj, team).size} covered · ${team.length}/5 cards`,
    }),
  );
  function draft() {
    const covered = coverage(adj, team);
    $("#coverage-count").textContent = `${covered.size} / 303`;
    $("#draft-slots").innerHTML =
      team
        .map(
          (id) =>
            `<button data-remove="${esc(id)}" aria-label="Remove ${esc(shortName(byId.get(id)))} from team">${esc(shortName(byId.get(id)))} ×</button>`,
        )
        .join("") +
      Array.from(
        { length: 5 - team.length },
        () => '<span class="vacant">Open slot</span>',
      ).join("");
    $("#draft-slots")
      .querySelectorAll("button")
      .forEach((b) =>
        b.addEventListener("click", () => {
          team = team.filter((id) => id !== b.dataset.remove);
          draft();
        }),
      );
    $("#draft-learning").textContent = team.length
      ? `${covered.size} distinct articles from ${team.length} cards. ${team.reduce((s, id) => s + adj.get(id).size + 1, 0) - covered.size} overlapping coverage contributions do not count twice. All 303 is impossible with five cards: 17 isolates each require a slot of their own.`
      : "Try a hub, then compare another hub with a card that reaches somewhere new. Each isolated article covers only itself.";
    $("#uncovered-list").textContent = data.nodes
      .filter((n) => !covered.has(n.id))
      .map(shortName)
      .join(", ");
    $("#draft-add").disabled =
      team.length >= 5 || team.includes($("#draft-select").value);
    draw();
  }
  $("#draft-select").addEventListener("change", () => {
    $("#draft-add").disabled =
      team.length >= 5 || team.includes($("#draft-select").value);
  });
  $("#draft-add").addEventListener("click", () => {
    const id = $("#draft-select").value;
    if (team.length >= 5 || team.includes(id)) return;
    const before = coverage(adj, team).size;
    team.push(id);
    $("#draft-status").textContent =
      `${shortName(byId.get(id))} adds ${coverage(adj, team).size - before} previously uncovered articles.`;
    draft();
  });
  $("#draft-reset").addEventListener("click", () => {
    team = [];
    $("#draft-status").textContent = "Team cleared.";
    draft();
  });
  $("#draft-benchmark").addEventListener("click", () => {
    team = [...data.greedyDraft.cards];
    $("#draft-status").textContent =
      "Greedy reference loaded. Can you find a better combination?";
    draft();
  });
  draft();
  function index() {
    const term = $("#trumps-search").value.toLowerCase();
    const nodes = data.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(term) ||
        String(n.community) === term ||
        "c" + n.community === term,
    );
    $("#trumps-table").innerHTML =
      `<table><caption>${nodes.length} cards. Betweenness and clustering shown as percentages.</caption><thead><tr><th>Article</th>${Object.values(
        metricLabels,
      )
        .map((v) => `<th class="num">${v}</th>`)
        .join("")}<th>Community</th></tr></thead><tbody>${nodes
        .map(
          (n) =>
            `<tr><td><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(shortName(n))}</a></td>${Object.keys(
              metricLabels,
            )
              .map((k) => `<td class="num">${metricValue(n, k)}</td>`)
              .join("")}<td>C${n.community}</td></tr>`,
        )
        .join("")}</tbody></table>`;
  }
  $("#trumps-search").addEventListener("input", index);
  index();
} catch (error) {
  errorMessage(error);
}
