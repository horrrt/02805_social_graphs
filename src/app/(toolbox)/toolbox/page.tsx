import { Toolbox } from "@/features/toolbox/Toolbox";

// The toolbox: find games, materials, components and library examples for a
// week's concepts. Data from scripts/toolbox_data.py; filters in
// src/features/toolbox/filters.ts.
export default function Page() {
  return (
    <main id="main" className="tb-shell">
      <header className="tb-head">
        <a href="../">Log–Log Legends</a>
        <h1>Toolbox</h1>
        <p>
          Pick a week or a few concepts to find the games, teaching materials, components we already have and library examples that could carry
          them. For the group only: no page links here.
        </p>
      </header>
      <Toolbox />
      <footer className="tb-note">
        Sources: game lists in <code>project/games/</code>, materials in <code>project/materials/</code>, components and libraries in{" "}
        <code>project/toolbox/</code>. Rebuild with <code>python scripts/toolbox_data.py</code>.
      </footer>
    </main>
  );
}
