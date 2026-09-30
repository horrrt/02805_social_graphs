// Capture parts of the drawn page as canvas boards: each board is the top bar
// plus the named parts, laid out at 1440 px off-screen to measure its height,
// then posted as {height, html} to the local receiver (build/scratch/receive.py).
window.__capture = async (boards) => {
  const bar = document.querySelector(".topbar")?.outerHTML ?? "";
  const done = [];
  for (const b of boards) {
    const parts = b.ids.map((id) => {
      const el = document.getElementById(id).cloneNode(true);
      if (b.open) for (const d of el.querySelectorAll("details")) d.setAttribute("open", "");
      for (const d of el.querySelectorAll(b.close ?? "none")) d.removeAttribute("open");
      return el;
    });
    const walker = (root) => {
      const it = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
      const dead = [];
      while (it.nextNode()) dead.push(it.currentNode);
      dead.forEach((c) => c.remove());
    };
    const main = document.createElement("main");
    main.id = "main";
    if (b.hero) {
      main.append(parts[0]);
      if (parts.length > 1) {
        const shell = document.createElement("div");
        shell.className = "shell";
        parts.slice(1).forEach((p) => shell.append(p));
        main.append(shell);
      }
    } else {
      const shell = document.createElement("div");
      shell.className = "shell";
      parts.forEach((p) => shell.append(p));
      main.append(shell);
    }
    walker(main);
    const html = bar + main.outerHTML;
    // Measure: the same markup in a 1440 px corridor box off-screen.
    const probe = document.createElement("div");
    probe.className = "corridor";
    probe.style.cssText = "position:absolute;left:-20000px;top:0;width:1440px;background:#eef3f9";
    probe.innerHTML = html;
    document.body.append(probe);
    const height = Math.ceil(probe.scrollHeight + (b.pad ?? 48));
    probe.remove();
    await fetch(`http://127.0.0.1:8768/${b.name}.json`, { method: "POST", mode: "no-cors", body: JSON.stringify({ height, html }) });
    done.push(`${b.name} ${height}px ${Math.round(html.length / 1024)} KB`);
  }
  return done;
};
"ready";
