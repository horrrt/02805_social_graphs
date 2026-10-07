import type { ReactNode } from "react";
import { Fullscreen } from "./Fullscreen";

// The page around the Cold Read campaign, the practice menu and every round's
// practice page: the site link, the two places to play, the title and the
// credits. `home` is the relative path to the campaign page, so the links work
// from any page; `page` says which of the two the reader is in.
export function Frame({ page, home, sub, credits, children }: {
  page: "campaign" | "practice"; home: string; sub?: string; credits?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="cr-shell">
      <header className="cr-top">
        <a href={`${home}../../`}>Log–Log Legends</a>
        <nav className="cr-rounds" aria-label="Ways to play">
          <a href={home} aria-current={page === "campaign" ? "page" : undefined}>
            Campaign
          </a>
          <a href={`${home}practice/`} aria-current={page === "practice" ? "page" : undefined}>
            Practice
          </a>
          <Fullscreen />
        </nav>
      </header>
      <main id="main">
        <h1 className="cr-title">
          Cold <span>Read</span>
        </h1>
        {sub ? <p className="cr-sub">{sub}</p> : null}
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
