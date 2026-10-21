import type { ReactNode } from "react";
import { PostTopbar } from "@/components/site/PostTopbar";
import { Fullscreen } from "@/features/cold-read/Fullscreen";
import { SoundToggle } from "@/features/cold-read/SoundToggle";

// The page around Topic Tetris: the site's top bar with the sound switch and
// full screen as its tools, the title, then the game. `root` is the relative
// path to the site's home, so the links work wherever the page is served.
export function Frame({ root, children }: { root: string; children: ReactNode }) {
  return (
    <>
      <PostTopbar
        root={root}
        tools={
          <nav className="cr-rounds" aria-label="Game tools">
            <SoundToggle />
            <Fullscreen />
          </nav>
        }
      />
      <div className="cr-shell">
        <main id="main">
          <h1 className="cr-title">
            Topic <span>Tetris</span>
          </h1>
          {children}
        </main>
        <footer className="cr-foot">
          <p>
            Topic Tetris · Week 7 · <a href={root}>Log-Log Legends</a> · DTU 02805
          </p>
        </footer>
      </div>
    </>
  );
}
