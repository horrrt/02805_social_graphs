"use client";
// Sticky chapter progress for the Week 6 essentials story. Highlights the
// current chapter as the reader scrolls; links jump to chapter anchors.
import { useEffect, useState } from "react";
import { island, useIslandReady } from "@/lib/island";

export type ChapterLink = { id: string; num: string; label: string };

type Props = { chapters: ChapterLink[] };

function StoryNavView({ chapters }: Props) {
  const [active, setActive] = useState(chapters[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  useIslandReady(true);

  useEffect(() => {
    const nodes = chapters
      .map((c) => document.getElementById(c.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.28;
      let current = chapters[0].id;
      for (const node of nodes) {
        if (node.offsetTop <= y) current = node.id;
      }
      setActive(current);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chapters]);

  return (
    <nav className="w6s-nav" id="w6s-nav" aria-label="Story chapters">
      <div className="w6s-nav-track" aria-hidden="true">
        <span className="w6s-nav-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <ol className="w6s-nav-list">
        {chapters.map((c) => (
          <li key={c.id} className={active === c.id ? "is-active" : undefined}>
            <a href={`#${c.id}`}>
              <span className="w6s-nav-num">{c.num}</span>
              <span className="w6s-nav-label">{c.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StoryNavHost({ chapters }: Props) {
  return (
    <nav className="w6s-nav" id="w6s-nav" aria-label="Story chapters">
      <div className="w6s-nav-track" aria-hidden="true">
        <span className="w6s-nav-fill" style={{ width: "0%" }} />
      </div>
      <ol className="w6s-nav-list">
        {chapters.map((c, i) => (
          <li key={c.id} className={i === 0 ? "is-active" : undefined}>
            <a href={`#${c.id}`}>
              <span className="w6s-nav-num">{c.num}</span>
              <span className="w6s-nav-label">{c.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const StoryNav = island("week06/essentials-story/StoryNav", StoryNavView, StoryNavHost, {
  roots: ["#w6s-nav"],
});
