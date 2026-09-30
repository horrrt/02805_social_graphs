// Week 5 · #autocomplete — guess which network community wrote a fake page.

const DATA_URL = new URL("../../weeks/week05/data/autocomplete.json", import.meta.url);

async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.pathname} ${r.status}`);
  return r.json();
}

function optionLabel(opt) {
  return `${opt.label} community (${opt.size} pages · hubs: ${opt.hubs.slice(0, 2).join(", ")})`;
}

export async function bootAutocomplete(root = document) {
  const section = root.querySelector("#autocomplete");
  if (!section || section.dataset.booted) return;
  section.dataset.booted = "1";

  const data = await loadJson(DATA_URL);
  const answers = new Map(); // fake id -> chosen community_index
  let index = 0;
  let revealed = false;

  section.querySelector("#ac-n-fakes").textContent = String(data.n_fakes);
  section.querySelector("#ac-chance").textContent =
    `${Math.round(data.chance_rate * 1000) / 10}%`;
  const chanceInline = section.querySelector("#ac-chance-inline");
  if (chanceInline) chanceInline.textContent = `1-in-${data.n_fakes}`;
  section.querySelector("#ac-modularity").textContent = data.partition.modularity.toFixed(3);
  section.querySelector("#ac-null-z").textContent = String(data.partition.null_z);
  section.querySelector("#ac-mode-share").textContent =
    `${Math.round(data.partition.mode_share * 100)}%`;

  const guessStatus = data.guessing.status;
  const statusEl = section.querySelector("#ac-guess-status");
  if (guessStatus === "awaiting_other_groups") {
    statusEl.textContent =
      "Official hit rate: waiting for other course groups to guess. " +
      "Your clicks below are a visitor quiz, not the hand-in number.";
  } else {
    statusEl.textContent =
      `Official hit rate: ${data.guessing.hit_rate} ` +
      `(${data.guessing.n_correct}/${data.guessing.n_responses}), ` +
      `against chance ${data.guessing.chance_rate}.`;
  }

  const select = section.querySelector("#ac-select");
  select.innerHTML = `<option value="">Pick a community…</option>`;
  for (const opt of data.options) {
    const o = document.createElement("option");
    o.value = String(opt.community_index);
    o.textContent = optionLabel(opt);
    select.appendChild(o);
  }

  const charEl = section.querySelector("#ac-char");
  const textEl = section.querySelector("#ac-text");
  const scoreEl = section.querySelector("#ac-scoreboard");
  const reveal = section.querySelector("#ac-reveal");
  const progress = section.querySelector("#ac-progress");

  function score() {
    let answered = 0;
    let correct = 0;
    for (const fake of data.fakes) {
      if (!answers.has(fake.id)) continue;
      answered += 1;
      if (answers.get(fake.id) === fake.community_index) correct += 1;
    }
    return { answered, correct };
  }

  function paintScore() {
    const { answered, correct } = score();
    const chance = Math.round(data.chance_rate * answered);
    scoreEl.textContent =
      answered === 0
        ? `No guesses yet · chance alone would average about 1 in ${data.n_fakes}.`
        : `Your quiz: ${correct} / ${answered} correct` +
          (answered === data.n_fakes
            ? ` (finished). Chance would expect about ${chance}.`
            : `.`);
  }

  function show(i) {
    index = (i + data.fakes.length) % data.fakes.length;
    revealed = false;
    const fake = data.fakes[index];
    charEl.textContent = fake.character;
    textEl.textContent = fake.text;
    progress.textContent = `Fake page ${index + 1} of ${data.n_fakes}`;
    select.value = answers.has(fake.id) ? String(answers.get(fake.id)) : "";
    reveal.hidden = true;
    paintScore();
  }

  function doReveal() {
    const fake = data.fakes[index];
    const choice = select.value === "" ? null : Number(select.value);
    if (choice !== null) answers.set(fake.id, choice);
    revealed = true;
    const ok = choice === fake.community_index;
    const opt = data.options.find((o) => o.community_index === fake.community_index);
    reveal.hidden = false;
    reveal.innerHTML = `
      <p class="w5-lead">${
        choice === null
          ? "No guess yet."
          : ok
            ? `<span class="w5-ok">Correct.</span>`
            : `<span class="w5-fail">Not that community.</span>`
      }
      This page was sampled from the <b>${fake.community_label}</b> community
      (${fake.size} pages).</p>
      <p class="w5-hubs">Hubs: ${fake.hubs.join(", ")}.
      Voice cues the generator leaned on: ${fake.voice_cues.slice(0, 4).join(" · ") || "—"}.</p>
      <blockquote class="w5-quote">Real lead from ${fake.real_quote.name}:
        “${fake.real_quote.text}”</blockquote>`;
    paintScore();
  }

  section.querySelector("#ac-submit").addEventListener("click", doReveal);
  section.querySelector("#ac-next").addEventListener("click", () => show(index + 1));
  section.querySelector("#ac-prev").addEventListener("click", () => show(index - 1));
  section.querySelector("#ac-reveal-btn").addEventListener("click", doReveal);

  // Community list for the "what we did" strip
  const list = section.querySelector("#ac-comm-list");
  list.innerHTML = "";
  for (const c of data.communities_used) {
    const li = document.createElement("li");
    li.textContent = `${c.label} · ${c.size} pages · hubs ${c.hubs.slice(0, 3).join(", ")}`;
    list.appendChild(li);
  }

  section.querySelector("#ac-checked-quote").textContent =
    `“${data.fakes[0].real_quote.text}”`;
  section.querySelector("#ac-checked-who").textContent = data.fakes[0].real_quote.name;
  section.querySelector("#ac-checked-fake").textContent = data.fakes[0].character;

  show(0);
}

bootAutocomplete().catch((err) => {
  console.error("week05 autocomplete boot failed", err);
  const status = document.querySelector("#w5-boot-status");
  if (status) {
    status.hidden = false;
    status.textContent = "Could not load the autocomplete interactive data.";
  }
});
