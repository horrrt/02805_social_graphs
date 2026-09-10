import {
  setupChrome,
  $,
  $$,
  esc,
  shortName,
  load,
  prediction,
  articleOptions,
  canvasStage,
  drawNetwork,
  url,
  reduced,
  errorMessage,
} from "./cabinet.js";
import {
  graph,
  rewire,
  triangles,
  tfidfIndex,
  tokens,
} from "./arcade-core.mjs";
import { createTerminal } from "./terminal.mjs";
import { metricLabels, metricValue } from "./cards.js";
setupChrome();
const style = document.createElement("link");
style.rel = "stylesheet";
style.href = url("assets/css/os.css");
document.head.append(style);
let skipped = false;
$("#skip-boot").addEventListener("click", () => {
  skipped = true;
  $("#boot-line").textContent = "Waiting for the snapshot to finish loading…";
});
try {
  const data = await load(),
    byId = new Map(data.nodes.map((n) => [n.id, n])),
    terminal = createTerminal(data),
    index = tfidfIndex(data.nodes);
  $("#boot-line").textContent =
    `Mounted: ${data.nodes.length} articles, ${data.links.length.toLocaleString()} directed links. Checking applications…`;
  if (!skipped && !reduced())
    await new Promise((resolve) => setTimeout(resolve, 650));
  $("#app-status").hidden = true;
  $("#os-boot").hidden = true;
  $("#desktop").hidden = false;
  const apps = [
    {
      id: "terminal",
      name: "Terminal",
      glyph: ">_",
      week: "LIVE GRAPH COMMANDS",
    },
    {
      id: "degrees",
      name: "degrees.exe",
      glyph: "k↗",
      week: "W01 · INSTALLED",
    },
    {
      id: "nullmodel",
      name: "nullmodel.sim",
      glyph: "⇄",
      week: "W02 · INSTALLED",
    },
    {
      id: "importance",
      name: "whomatters.app",
      glyph: "#1",
      week: "W03 · PREVIEW",
    },
    {
      id: "communities",
      name: "communities.app",
      glyph: "◉",
      week: "W04 · PREVIEW",
    },
    {
      id: "sound",
      name: "walkplayer.audio",
      glyph: "♫",
      week: "W05 · PREVIEW",
      href: "sound/",
    },
    {
      id: "creature",
      name: "creature.pet",
      glyph: ":)",
      week: "W06 · PREVIEW",
      href: "creature/",
    },
    { id: "notepad", name: "Notepad", glyph: "Aa", week: "W07 · PREVIEW" },
    { id: "search", name: "TF-IDF Search", glyph: "⌕", week: "W08 · PREVIEW" },
    {
      id: "transit",
      name: "Transit Authority",
      glyph: "M",
      week: "OPEN THE CABINET",
      href: "weeks/week02/",
    },
    {
      id: "packs",
      name: "Hero Packs",
      glyph: "05",
      week: "OPEN THE CABINET",
      href: "weeks/week01/",
    },
    {
      id: "trumps",
      name: "Hero Trumps",
      glyph: "VS",
      week: "OPEN THE CABINET",
      href: "trumps/",
    },
  ];
  const windows = new Map();
  let z = 10;
  $("#desktop-icons").innerHTML = apps
    .map((a) =>
      a.href
        ? `<a class="desktop-icon" href="${url(a.href)}"><span class="app-glyph" aria-hidden="true">${a.glyph}</span>${a.name}<small>${a.week}</small></a>`
        : `<button class="desktop-icon" data-app="${a.id}"><span class="app-glyph" aria-hidden="true">${a.glyph}</span>${a.name}<small>${a.week}</small></button>`,
    )
    .join("");
  $$("#desktop-icons [data-app]").forEach((button) =>
    button.addEventListener("click", () => openApp(button.dataset.app)),
  );
  $("#os-launcher").addEventListener("click", () => {
    for (const win of windows.values()) {
      win.el.hidden = true;
      win.task.setAttribute("aria-pressed", "false");
    }
    $("#desktop-icons button").focus();
  });
  function focus(win) {
    win.el.hidden = false;
    win.el.style.zIndex = ++z;
    for (const other of windows.values())
      other.task.setAttribute("aria-pressed", String(other === win));
  }
  function clamp(win, x, y) {
    const bounds = $("#window-layer").getBoundingClientRect();
    win.el.style.left =
      Math.max(0, Math.min(x, bounds.width - win.el.offsetWidth)) + "px";
    win.el.style.top = Math.max(0, Math.min(y, bounds.height - 50)) + "px";
  }
  function openApp(id) {
    const app = apps.find((a) => a.id === id);
    if (!app) return;
    if (app.href) {
      location.href = url(app.href);
      return;
    }
    if (windows.has(id)) {
      focus(windows.get(id));
      return windows.get(id);
    }
    const el = document.createElement("section");
    el.className = "os-window";
    el.setAttribute("aria-label", app.name + " window");
    el.innerHTML = `<div class="window-title" tabindex="0" aria-label="Move ${esc(app.name)} window with Alt and arrow keys"><h2>${esc(app.name)} <span class="fine">/ ${app.week}</span></h2><button aria-label="Minimize ${esc(app.name)}" data-action="min">−</button><button aria-label="Maximize ${esc(app.name)}" data-action="max">□</button><button aria-label="Close ${esc(app.name)}" data-action="close">×</button></div><div class="window-body"></div>`;
    $("#window-layer").append(el);
    const task = document.createElement("button");
    task.textContent = app.name;
    task.setAttribute("aria-label", "Restore " + app.name);
    $("#os-tasks").append(task);
    const win = { el, task, body: $(".window-body", el), id };
    windows.set(id, win);
    if (matchMedia("(min-width:681px)").matches) {
      clamp(win, 235 + (windows.size % 4) * 23, 24 + (windows.size % 4) * 31);
    }
    task.addEventListener("click", () => {
      focus(win);
      $(".window-title", el).focus();
    });
    el.addEventListener("pointerdown", () => focus(win));
    $("[data-action=min]", el).addEventListener("click", () => {
      el.hidden = true;
      task.setAttribute("aria-pressed", "false");
      task.focus();
    });
    $("[data-action=max]", el).addEventListener("click", () => {
      el.classList.toggle("maximized");
      $("[data-action=max]", el).setAttribute(
        "aria-label",
        (el.classList.contains("maximized")
          ? "Restore size of "
          : "Maximize ") + app.name,
      );
    });
    $("[data-action=close]", el).addEventListener("click", () => {
      el.remove();
      task.remove();
      windows.delete(id);
      $(`[data-app="${id}"]`).focus();
    });
    const title = $(".window-title", el);
    let drag = null;
    title.addEventListener("pointerdown", (e) => {
      if (
        e.target.closest("button") ||
        matchMedia("(max-width:680px)").matches ||
        el.classList.contains("maximized")
      )
        return;
      drag = {
        x: e.clientX,
        y: e.clientY,
        left: el.offsetLeft,
        top: el.offsetTop,
      };
      title.setPointerCapture(e.pointerId);
    });
    title.addEventListener("pointermove", (e) => {
      if (drag)
        clamp(
          win,
          drag.left + e.clientX - drag.x,
          drag.top + e.clientY - drag.y,
        );
    });
    title.addEventListener("pointerup", () => {
      drag = null;
    });
    title.addEventListener("pointercancel", () => {
      drag = null;
    });
    title.addEventListener("keydown", (e) => {
      if (
        e.altKey &&
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
        !el.classList.contains("maximized")
      ) {
        e.preventDefault();
        clamp(
          win,
          el.offsetLeft + ({ ArrowLeft: -20, ArrowRight: 20 }[e.key] || 0),
          el.offsetTop + ({ ArrowUp: -20, ArrowDown: 20 }[e.key] || 0),
        );
      }
    });
    renderApp(win);
    focus(win);
    if (matchMedia("(max-width:680px)").matches)
      requestAnimationFrame(() =>
        el.scrollIntoView({
          behavior: reduced() ? "instant" : "smooth",
          block: "start",
        }),
      );
    return win;
  }
  window.addEventListener("resize", () => {
    if (matchMedia("(min-width:681px)").matches)
      for (const win of windows.values())
        if (!win.el.classList.contains("maximized"))
          clamp(win, win.el.offsetLeft, win.el.offsetTop);
  });
  function renderApp(win) {
    const body = win.body,
      q = (selector) => $(selector, body);
    if (win.id === "terminal") {
      body.innerHTML =
        '<p class="fine">Real computations · local snapshot · type help. Use ↑ / ↓ for command history.</p><div class="terminal-output" role="log" aria-label="Terminal responses" aria-live="polite"></div><form class="terminal-form"><label class="sr-only" for="terminal-input">Graph command</label><span aria-hidden="true">303 ›</span><input id="terminal-input" autocomplete="off" spellcheck="false" placeholder="bfs baymax spider-man"><button>Run</button></form>';
      const output = q(".terminal-output"),
        input = q("input"),
        history = [];
      let cursor = 0;
      const append = (text, className = "") => {
        const div = document.createElement("div");
        div.className = className;
        div.textContent = text;
        output.append(div);
        output.scrollTop = output.scrollHeight;
      };
      append(
        "MARVEL-OS 303 · snapshot 2026-08-26\n303 articles mounted. 1,784 directed links ready.\nType help, or try: top --in 10\n",
      );
      win.run = async (line) => {
        if (!line.trim()) return;
        input.value = "";
        history.push(line);
        cursor = history.length;
        append("303 › " + line, "term-command");
        q("button").disabled = true;
        try {
          await new Promise((r) => setTimeout(r, 0));
          const response = terminal.execute(line);
          if (response.clear) output.replaceChildren();
          if (response.text) append(response.text + "\n");
          if (response.open) openApp(response.open);
        } catch (error) {
          append(error.message + "\n", "term-error");
        } finally {
          q("button").disabled = false;
          input.focus();
        }
      };
      q("form").addEventListener("submit", (e) => {
        e.preventDefault();
        win.run(input.value);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          cursor = Math.max(0, cursor - 1);
          input.value = history[cursor] || "";
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          cursor = Math.min(history.length, cursor + 1);
          input.value = history[cursor] || "";
        }
      });
    }
    if (win.id === "degrees" || win.id === "importance") {
      const degrees = win.id === "degrees";
      body.innerHTML = `<h3>${degrees ? "Attention has a direction." : "Which kind of important?"}</h3><p class="fine">${degrees ? "Original directed snapshot; all 303 roster entries." : "Exploratory preview. Exact undirected metrics over all 303 nodes, including isolates."}</p><div class="control-row"><label>Find an article<input class="rank-search" type="search" placeholder="Search names"></label><label>Rank by<select class="rank-metric">${(degrees ? ["kin", "kout", "degree"] : Object.keys(metricLabels)).map((k) => `<option value="${k}">${metricLabels[k]}</option>`).join("")}</select></label></div><p class="rank-summary status" role="status"></p><div class="table-scroll rank-table"></div><p class="fine">${data.metricMethod}</p><a href="${url(degrees ? "weeks/week01/" : "trumps/")}">Open ${degrees ? "Hero Packs" : "Hero Trumps"} ↗</a>`;
      const update = () => {
        const key = q("select").value,
          term = q("input").value.toLowerCase(),
          nodes = data.nodes
            .filter((n) => n.name.toLowerCase().includes(term))
            .sort((a, b) => b[key] - a[key] || a.id.localeCompare(b.id));
        q(".rank-summary").textContent =
          `${nodes.length} articles · ${metricLabels[key]}. ${nodes[0] ? "First in this view: " + shortName(nodes[0]) + "." : ""}`;
        q(".rank-table").innerHTML =
          `<table><thead><tr><th>Rank</th><th>Article</th><th class="num">${metricLabels[key]}</th></tr></thead><tbody>${nodes.map((n, i) => `<tr><td>${i + 1}</td><td>${esc(shortName(n))}</td><td class="num">${metricValue(n, key)}</td></tr>`).join("")}</tbody></table>`;
      };
      q("input").addEventListener("input", update);
      q("select").addEventListener("change", update);
      update();
    }
    if (win.id === "nullmodel") {
      const original = graph(data, { core: true }),
        sample = rewire(original, 20, 7),
        sampleCount = triangles(sample.adj);
      body.innerHTML =
        '<div class="app-prediction prediction"></div><div class="null-work" hidden><h3>One alternate world.</h3><p class="fine">277 core nodes, 1,421 undirected edges. Start connected, preserve every degree. This demonstration is separate from the recorded 1,000-draw benchmark.</p><div class="control-row"><label>Successful swaps<input class="null-swaps" type="number" min="0" max="2000" value="20" step="1"></label><label>Seed<input class="null-seed" type="number" min="0" max="4294967295" value="7" step="1"></label><button class="null-run">Rewire</button></div><p class="null-out" role="status"></p></div>';
      const show = () => {
        const a = q(".null-swaps"),
          b = q(".null-seed");
        if (!a.reportValidity() || !b.reportValidity()) return;
        try {
          const result = rewire(original, Number(a.value), Number(b.value));
          q(".null-out").textContent =
            `${result.completed}/${result.requested} swaps accepted (${result.attempts} proposals).\nOriginal: ${data.coreTriangles} triangles.\nThis world: ${triangles(result.adj)} triangles.\nDegrees unchanged; starting graph still connected.\nSeed ${result.seed}. Each run starts from the original.`;
        } catch (error) {
          q(".null-out").textContent = error.message;
        }
      };
      prediction(q(".app-prediction"), {
        id: "w2-triangles",
        week: 2,
        prompt:
          "After just 20 swaps (seed 7), how many triangles remain in the core?",
        min: 0,
        max: 3000,
        answer: sampleCount,
        unit: "triangles",
        explain: `The original has ${data.coreTriangles}. A few swaps preserve degrees but already change local structure.`,
        onReveal: () => {
          q(".null-work").hidden = false;
          show();
        },
      });
      q(".null-run").addEventListener("click", show);
      body.insertAdjacentHTML(
        "beforeend",
        `<a href="${url("weeks/week02/")}">Compare closures with the recorded ensemble ↗</a>`,
      );
    }
    if (win.id === "communities") {
      body.innerHTML =
        '<div class="app-prediction prediction"></div><div class="community-work" hidden><label>Explore a group<select class="community-select"></select></label><div class="community-stats"><strong class="community-size"></strong><span>articles in this group</span></div><canvas class="stage"></canvas><p class="community-members fine"></p><p class="fine">Louvain · undirected 303-node graph · seed 7 · resolution 1. Group numbers are labels, not rankings or canonical teams. Different seeds and resolutions may change the partition.</p></div>';
      q("select").innerHTML = data.communities
        .map(
          (g) =>
            `<option value="${g.id}">C${g.id} · ${g.size} ${g.size === 1 ? "article" : "articles"}</option>`,
        )
        .join("");
      const draw = canvasStage(q("canvas"), (c, w, h) => {
        const group = data.communities.find(
          (g) => g.id === Number(q("select").value),
        );
        drawNetwork(c, w, h, data, {
          active: new Set(group?.members || []),
          color: "#76e4d3",
          label: "Exploratory community " + q("select").value,
        });
      });
      const update = () => {
        const group = data.communities.find(
          (g) => g.id === Number(q("select").value),
        );
        q(".community-size").textContent = group.size;
        q(".community-members").textContent = group.members
          .map((id) => shortName(byId.get(id)))
          .join(", ");
        draw();
      };
      q("select").addEventListener("change", update);
      prediction(q(".app-prediction"), {
        id: "w4-communities",
        week: 4,
        prompt:
          "How many groups will this Louvain run find, including the isolates?",
        min: 1,
        max: 50,
        answer: data.communities.length,
        unit: "groups",
        explain:
          "Every isolate forms its own singleton group in this run. This partition is a model output, not ground truth.",
        onReveal: () => {
          q(".community-work").hidden = false;
          update();
        },
      });
    }
    if (win.id === "notepad") {
      const mutantCount = data.nodes.filter((n) =>
        tokens(n.text).includes("mutant"),
      ).length;
      body.innerHTML =
        '<div class="app-prediction prediction"></div><div class="notepad-work" hidden><p class="note">Real text, limited scope: these are the 303 short descriptions supplied in the frozen course roster. Complete Wikipedia article bodies are not bundled.</p><label>Read an article description<select class="notepad-select"></select></label><article class="text-document"></article><p class="fine">This text can explain an article’s subject, but it is too short to stand in for a full-article NLP assignment.</p></div>';
      articleOptions(q("select"), data, "Baymax");
      const update = () => {
        const n = byId.get(q("select").value);
        q(".text-document").innerHTML =
          `<h3>${esc(shortName(n))}</h3><p>${esc(n.text) || "No description in the course roster."}</p><a href="${esc(n.url)}" target="_blank" rel="noopener">Read the live source article ↗</a><p><small>${tokens(n.text).length} retained tokens after this app’s tokenization · frozen roster text</small></p>`;
      };
      q("select").addEventListener("change", update);
      prediction(q(".app-prediction"), {
        id: "w7-mutant",
        week: 7,
        prompt:
          "How many of the 303 short descriptions contain the exact token “mutant”?",
        min: 0,
        max: 303,
        answer: mutantCount,
        unit: "descriptions",
        explain:
          "Exact token matching excludes “mutants” and other forms. A tokenization choice can change an answer.",
        onReveal: () => {
          q(".notepad-work").hidden = false;
          update();
        },
      });
    }
    if (win.id === "search") {
      const matchCount = index.search("spider").length;
      body.innerHTML =
        '<div class="app-prediction prediction"></div><div class="search-work" hidden><h3>Find the words behind the links.</h3><p class="fine">TF-IDF cosine similarity over 303 short roster descriptions. This is text similarity, not a graph path or a full-article search.</p><form class="search-form"><label>Search the descriptions<input type="search" value="spider" placeholder="Try mutant or spider"></label><button style="margin-top:12px">Search</button></form><p class="search-count status" role="status"></p><div class="search-results"></div><details><summary>How ranking works</summary><p class="fine">Unicode words of at least three characters; declared stop words removed; no stemming. TF = 1 + ln(count). IDF = 1 + ln((304)/(1 + document frequency)). Document and query vectors are L2 normalized; results sort by cosine similarity. Unknown terms contribute nothing.</p></details></div>';
      const update = () => {
        const rows = index.search(q(".search-form input").value);
        q(".search-count").textContent =
          `${rows.length} descriptions match at least one retained query term. Showing ${Math.min(rows.length, 20)}.`;
        q(".search-results").innerHTML =
          rows
            .slice(0, 20)
            .map(
              (r) =>
                `<article class="search-result"><h3><a href="${esc(r.node.url)}" target="_blank" rel="noopener">${esc(shortName(r.node))}</a></h3><small>Cosine ${r.score.toFixed(4)} · matching terms: ${r.matches.map(esc).join(", ")}</small><p>${esc(r.node.text)}</p></article>`,
            )
            .join("") ||
          '<p class="empty">No matching terms. Try a different word from the supplied descriptions.</p>';
      };
      q(".search-form").addEventListener("submit", (e) => {
        e.preventDefault();
        update();
      });
      prediction(q(".app-prediction"), {
        id: "w8-search",
        week: 8,
        prompt: "How many roster descriptions will the search “spider” match?",
        min: 0,
        max: 100,
        answer: matchCount,
        unit: "descriptions",
        explain:
          "Similarity is computed from words in these short descriptions. A zero score does not mean the live article never discusses the topic.",
        onReveal: () => {
          q(".search-work").hidden = false;
          update();
        },
      });
    }
  }
  $$("[data-command]").forEach((button) =>
    button.addEventListener("click", () => {
      const win = openApp("terminal");
      win.run(button.dataset.command);
      $("#desktop").scrollIntoView({
        behavior: reduced() ? "instant" : "smooth",
        block: "start",
      });
    }),
  );
  const initial = new URLSearchParams(location.search).get("app");
  openApp(apps.some((a) => a.id === initial && !a.href) ? initial : "terminal");
} catch (error) {
  errorMessage(error);
  $("#boot-line").textContent =
    "Snapshot failed to load. Reload to retry. Static results remain below.";
  $("#skip-boot").hidden = true;
}
