import type { ReactNode } from "react";

// The page around every Cold Read round: the site link, the rounds built so
// far, the title and the credits. `home` is the relative path to the game's
// first page, so the links work from any round.
const ROUNDS = [
  { n: 1, name: "Clue Shop", topic: "TF-IDF", path: "" },
  { n: 2, name: "Whose Line", topic: "comparing groups", path: "round-2/" },
  { n: 3, name: "Mix Desk", topic: "topic models", path: "round-3/" },
  { n: 4, name: "Tezgüino", topic: "context and PPMI", path: "round-4/" },
  { n: 5, name: "Hot & Cold", topic: "word vectors", path: "round-5/" },
];

export function Frame({ round, home, sub, credits, children }: { round: number; home: string; sub: string; credits: ReactNode; children: ReactNode }) {
  return (
    <div className="cr-shell">
      <header className="cr-top">
        <a href={`${home}../../`}>Log–Log Legends</a>
        <nav className="cr-rounds" aria-label="Rounds">
          {ROUNDS.map((r) => (
            <a key={r.n} href={`${home}${r.path}`} aria-current={r.n === round ? "page" : undefined}>
              <b>{r.n}</b> {r.name} <small>{r.topic}</small>
            </a>
          ))}
        </nav>
      </header>
      <main id="main">
        <h1 className="cr-title">
          Cold <span>Read</span>
        </h1>
        <p className="cr-sub">{sub}</p>
        {children}
      </main>
      <footer className="cr-foot">
        {credits}
        <p>
          Cold Read · Week 6 · <a href={`${home}../../`}>Log–Log Legends</a> · DTU 02805
        </p>
      </footer>
    </div>
  );
}
