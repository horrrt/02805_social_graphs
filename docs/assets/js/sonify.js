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
  download,
  reduced,
  tone,
  errorMessage,
} from "./cabinet.js";
import { graph, randomWalk } from "./arcade-core.mjs";
import { pitch, voiceNames, scheduleNotes, wav } from "./audio.mjs";
setupChrome();
try {
  const data = await load();
  $("#app-status").hidden = true;
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  articleOptions($("#sound-start"), data, "Spider-Man");
  let path = [],
    current = -1,
    context = null,
    master = null,
    handles = [],
    timers = [],
    unlocked = false,
    playing = false;
  const initial = randomWalk(graph(data), "Spider-Man", 32, 7);
  const draw = canvasStage($("#sound-map"), (c, w, h) => {
    const seen = new Set(current >= 0 ? path.slice(0, current + 1) : []);
    drawNetwork(c, w, h, data, {
      active: seen,
      label:
        current >= 0
          ? `Step ${current + 1} · ${shortName(byId.get(path[current]))}`
          : "Press Play to hear the current walk.",
    });
    if (current >= 0) {
      const n = byId.get(path[current]),
        x = (n.x / 930) * (w - 28) + 14,
        y = (n.y / 630) * (h - 50) + 20;
      c.strokeStyle = tone("--cv-sound-ring", "#fff");
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 8, 0, Math.PI * 2);
      c.stroke();
    }
  });
  function stop(message = "Playback stopped.") {
    timers.forEach(clearTimeout);
    timers = [];
    handles.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    handles = [];
    playing = false;
    $("#sound-stop").disabled = true;
    $("#sound-play").disabled = !unlocked;
    if (context?.state === "running") context.suspend();
    if (message) $("#sound-status").textContent = message;
    $$("#walk-sequence li").forEach((li) => li.classList.remove("playing"));
  }
  function prepare() {
    if (!$("#sound-seed").checkValidity()) {
      $("#sound-seed").reportValidity();
      return false;
    }
    if (playing) stop("Settings changed. Press Play for the new walk.");
    path = randomWalk(
      graph(data, { directed: $("#sound-direction").value === "directed" }),
      $("#sound-start").value,
      Number($("#sound-length").value),
      Number($("#sound-seed").value),
    );
    current = -1;
    $("#walk-visits").textContent = new Set(path).size;
    $("#walk-repeats").textContent = path.length - new Set(path).size;
    $("#walk-communities").textContent = new Set(
      path.map((id) => byId.get(id).community),
    ).size;
    $("#walk-sequence").innerHTML = unlocked
      ? path
          .map(
            (id, i) =>
              `<li title="${esc(shortName(byId.get(id)))}">${i + 1}</li>`,
          )
          .join("")
      : "";
    $("#walk-table").innerHTML =
      `<table><caption>Seed ${$("#sound-seed").value}; ${$("#sound-direction").value}; ${path.length} notes.</caption><thead><tr><th>Step</th><th>Article</th><th>Degree</th><th>Group / voice</th><th>MIDI note</th></tr></thead><tbody>${path
        .map((id, i) => {
          const n = byId.get(id);
          return `<tr><td>${i + 1}</td><td>${esc(shortName(n))}</td><td>${n.degree}</td><td>C${n.community} / ${voiceNames[n.community % 4]}</td><td>${pitch(n)}</td></tr>`;
        })
        .join("")}</tbody></table>`;
    $("#sound-now").textContent = unlocked
      ? "Ready when you are."
      : "Make your prediction to unlock the walk.";
    draw();
    return true;
  }
  prediction($("#prediction"), {
    id: "w5-walk",
    week: null,
    prompt:
      "Starting at Spider-Man, how many distinct articles will 32 notes visit (seed 7, undirected)?",
    min: 1,
    max: 32,
    answer: new Set(initial).size,
    unit: "articles",
    explain:
      "Repeated visits use notes without discovering new articles. This first example is fixed; the controls let you explore others.",
    onReveal: () => {
      unlocked = true;
      $("#sound-play").disabled = false;
      $("#sound-download").disabled = false;
      prepare();
    },
  });
  prepare();
  [
    "sound-start",
    "sound-seed",
    "sound-length",
    "sound-direction",
    "sound-tempo",
  ].forEach((id) => $("#" + id).addEventListener("change", prepare));
  $("#sound-volume").addEventListener("input", () => {
    if (master && context)
      master.gain.setTargetAtTime(
        Number($("#sound-volume").value),
        context.currentTime,
        0.02,
      );
  });
  $("#sound-play").addEventListener("click", async () => {
    try {
      stop("");
      if (!prepare()) return;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio)
        throw new Error(
          "This browser does not support Web Audio. Use the step table to explore the walk.",
        );
      context ??= new Audio();
      await context.resume();
      master = context.createGain();
      master.gain.value = Number($("#sound-volume").value);
      master.connect(context.destination);
      const tempo = Number($("#sound-tempo").value),
        beat = 60 / tempo,
        start = context.currentTime + 0.08,
        nodes = path.map((id) => byId.get(id));
      handles = scheduleNotes(context, master, nodes, tempo, start);
      playing = true;
      $("#sound-play").disabled = true;
      $("#sound-stop").disabled = false;
      $("#sound-status").textContent =
        `Playing ${path.length} notes · seed ${$("#sound-seed").value} · ${$("#sound-direction").value}. ${path.length < Number($("#sound-length").value) ? "The walk reaches a node with no available next step." : ""}`;
      path.forEach((id, i) =>
        timers.push(
          setTimeout(
            () => {
              current = i;
              const n = byId.get(id);
              $("#sound-now").textContent = `${i + 1}. ${shortName(n)}`;
              $$("#walk-sequence li").forEach((li, j) =>
                li.classList.toggle("playing", j === i),
              );
              if (!reduced() || i === 0 || i === path.length - 1) draw();
            },
            80 + i * beat * 1000,
          ),
        ),
      );
      timers.push(
        setTimeout(
          () => {
            stop(
              `Finished: ${path.length} notes, ${new Set(path).size} distinct articles. ${path.length === 1 ? "This article has no next step under the selected rules." : ""}`,
            );
            draw();
          },
          100 + path.length * beat * 1000,
        ),
      );
    } catch (error) {
      stop("");
      errorMessage(error, $("#sound-status"));
    }
  });
  $("#sound-stop").addEventListener("click", () => stop());
  window.addEventListener("pagehide", () => stop(""));
  $("#sound-download").addEventListener("click", async () => {
    const button = $("#sound-download");
    try {
      if (!prepare()) return;
      button.disabled = true;
      button.textContent = "Rendering…";
      const Offline =
        window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!Offline)
        throw new Error(
          "WAV export is unavailable in this browser. The walk table is still available.",
        );
      const tempo = Number($("#sound-tempo").value),
        duration = (path.length * 60) / tempo + 0.2,
        offline = new Offline(1, Math.ceil(duration * 44100), 44100),
        gain = offline.createGain();
      gain.gain.value = Number($("#sound-volume").value);
      gain.connect(offline.destination);
      scheduleNotes(
        offline,
        gain,
        path.map((id) => byId.get(id)),
        tempo,
        0.05,
      );
      const buffer = await offline.startRendering();
      download(
        `marvel-walk-seed-${$("#sound-seed").value}.wav`,
        wav(buffer),
        "audio/wav",
      );
      $("#sound-status").textContent =
        "WAV ready. The audio follows the current walk and volume setting.";
    } catch (error) {
      errorMessage(error, $("#sound-status"));
    } finally {
      button.disabled = !unlocked;
      button.textContent = "Download WAV";
    }
  });
} catch (error) {
  errorMessage(error);
}
