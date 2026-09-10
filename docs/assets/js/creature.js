import {
  setupChrome,
  $,
  esc,
  shortName,
  load,
  prediction,
  articleOptions,
  canvasStage,
  errorMessage,
} from "./cabinet.js";
import { outcome } from "./arcade-core.mjs";
setupChrome();
try {
  const data = await load();
  $("#app-status").hidden = true;
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  let removed = null,
    repairs = [],
    state = outcome(data, null),
    unlocked = false;
  const name = (id) => shortName(byId.get(id));
  articleOptions(
    $("#creature-remove"),
    data,
    "Spider-Man",
    (n) => n.component === "core",
  );
  const draw = canvasStage($("#creature-canvas"), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const cx = w * 0.42,
      cy = h * 0.53,
      r = Math.min(w * 0.29, h * 0.35),
      golden = 2.399963;
    c.strokeStyle = "#416b58";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(cx, cy, r * 1.06, r, 0, 0, Math.PI * 2);
    c.stroke();
    state.largest.forEach((id, i) => {
      const rad = Math.sqrt((i + 0.5) / state.largest.length) * r * 0.93,
        angle = i * golden;
      const x = cx + Math.cos(angle) * rad,
        y = cy + Math.sin(angle) * rad;
      c.fillStyle = repairs.some((edge) => edge.includes(id))
        ? "#fff8a9"
        : "#a7efa9";
      c.beginPath();
      c.arc(x, y, Math.max(1.4, Math.min(3, r / 42)), 0, Math.PI * 2);
      c.fill();
    });
    for (const x of [cx - r * 0.28, cx + r * 0.28]) {
      c.fillStyle = "#102622";
      c.beginPath();
      c.ellipse(x, cy - r * 0.15, r * 0.13, r * 0.16, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#e8f7db";
      c.beginPath();
      c.arc(x + r * 0.025, cy - r * 0.19, r * 0.035, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = "#102622";
    c.lineWidth = 4;
    c.beginPath();
    if (state.stranded.length)
      c.arc(cx, cy + r * 0.45, r * 0.2, Math.PI * 1.1, Math.PI * 1.9);
    else c.arc(cx, cy + r * 0.22, r * 0.25, 0.1, Math.PI - 0.1);
    c.stroke();
    c.strokeStyle = "#a7efa9";
    c.lineWidth = 3;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + side * r * 0.65, cy + r * 0.7);
      c.lineTo(cx + side * r * 0.8, cy + r * 1.05);
      c.lineTo(cx + side * r, cy + r * 1.05);
      c.stroke();
    }
    state.groups.slice(1).forEach((group, i) => {
      const x = w * 0.83,
        y =
          75 +
          i * Math.min(57, (h - 120) / Math.max(1, state.groups.length - 2));
      group.forEach((id, j) => {
        c.fillStyle = "#ffbd9a";
        c.beginPath();
        c.arc(x + j * 9, y, 4, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = "#ffbd9a";
      c.font = "11px Barlow";
      c.textAlign = "center";
      c.fillText(
        group.length === 1 ? name(group[0]) : group.length + " articles",
        x,
        y + 19,
        w * 0.27,
      );
    });
    c.textAlign = "left";
    c.fillStyle = "#b2d1be";
    c.font = "12px Barlow";
    c.fillText(
      `One dot = one present article. ${state.stranded.length} outside the body.`,
      14,
      h - 15,
    );
  });
  function update() {
    state = outcome(data, removed, repairs);
    const health = state.health * 100;
    $("#health-number").textContent = health.toFixed(1) + "%";
    $("#health-denominator").textContent =
      `${state.largest.length} of ${state.remaining} present articles in the largest component`;
    $("#health-fill").style.width = health + "%";
    $(".health-track").setAttribute(
      "aria-label",
      `Connectivity health ${health.toFixed(1)} percent`,
    );
    $("#creature-mood").textContent = state.stranded.length
      ? `${state.stranded.length} articles are outside the body in ${state.groups.length - 1} separate groups. It takes at least ${state.groups.length - 1} more links to bring them all back.`
      : repairs.length
        ? "Together again, with your hypothetical repair links."
        : removed
          ? "Still together. This removal did not fragment the core."
          : "All together. All connections are original.";
    $("#creature-status").textContent = removed
      ? `${name(removed)} removed. ${repairs.length} repair ${repairs.length === 1 ? "link" : "links"} added.`
      : "Original 277-node core. Choose an article to remove after making your prediction.";
    $("#repair-from").innerHTML =
      state.stranded
        .map((id) => `<option value="${esc(id)}">${esc(name(id))}</option>`)
        .join("") || "<option>No stranded articles</option>";
    const targetBefore = $("#repair-to").value;
    $("#repair-to").innerHTML = state.largest
      .map((id) => `<option value="${esc(id)}">${esc(name(id))}</option>`)
      .join("");
    if (state.largest.includes(targetBefore))
      $("#repair-to").value = targetBefore;
    else if (state.largest.includes("Hulk")) $("#repair-to").value = "Hulk";
    $("#repair-add").disabled = !unlocked || !state.stranded.length;
    $("#repair-from").disabled = !state.stranded.length;
    $("#repair-to").disabled = !state.stranded.length;
    $("#repair-undo").disabled = !repairs.length;
    $("#repair-list").innerHTML = repairs
      .map(
        ([a, b], i) =>
          `<li>Repair ${i + 1}: ${esc(name(a))} ↔ ${esc(name(b))} <small>(hypothetical)</small></li>`,
      )
      .join("");
    $("#creature-groups").innerHTML = state.stranded.length
      ? state.groups
          .slice(1)
          .map(
            (group, i) =>
              `<p><b>Group ${i + 1} · ${group.length} ${group.length === 1 ? "article" : "articles"}:</b> ${group.map((id) => esc(name(id))).join(", ")}</p>`,
          )
          .join("")
      : "<p>No separated components.</p>";
    draw();
  }
  prediction($("#prediction"), {
    id: "w6-repairs",
    week: null,
    prompt:
      "After removing Spider-Man, what is the fewest new links needed to reconnect the remaining core?",
    min: 0,
    max: 10,
    answer: outcome(data, "Spider-Man").groups.length - 1,
    unit: "links",
    explain:
      "Each new link can join two separate components. Five stranded singletons need five links.",
    onReveal: () => {
      unlocked = true;
      $("#creature-cut").disabled = false;
    },
  });
  $("#creature-cut").addEventListener("click", () => {
    removed = $("#creature-remove").value;
    repairs = [];
    $("#repair-feedback").textContent =
      "New removal experiment. Previous repairs cleared.";
    update();
  });
  $("#creature-restore").addEventListener("click", () => {
    removed = null;
    repairs = [];
    $("#repair-feedback").textContent = "Original graph restored.";
    update();
  });
  $("#repair-add").addEventListener("click", () => {
    const a = $("#repair-from").value,
      b = $("#repair-to").value;
    if (!state.stranded.includes(a) || !state.largest.includes(b)) return;
    const before = state.stranded.length;
    repairs.push([a, b]);
    update();
    $("#repair-feedback").textContent =
      `${name(a)} ↔ ${name(b)} brings ${before - state.stranded.length} ${before - state.stranded.length === 1 ? "article" : "articles"} back into the body.`;
  });
  $("#repair-undo").addEventListener("click", () => {
    repairs.pop();
    $("#repair-feedback").textContent = "Last repair undone.";
    update();
  });
  update();
} catch (error) {
  errorMessage(error);
}
