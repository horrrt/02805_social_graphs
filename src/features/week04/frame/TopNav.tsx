"use client";
// The top bar's section links (week04-cut.js on main): the link of the
// section in view is marked "here" as the reader scrolls. The server marks
// "Where" until the first scroll position is read.
import { Fragment, useEffect, useState } from "react";
import { island } from "@/lib/island";

const LINKS = [
  ["opening", "Opening"],
  ["place", "Where"],
  ["jobs", "Jobs"],
  ["who", "Staffing"],
  ["footprint", "Giants out"],
  ["beyond", "Beyond"],
  ["cut", "Deep dive"],
] as const;

function Nav({ here }: { here: string }) {
  return (
    <nav className="topnav" aria-label="Sections of this post">
      {LINKS.map(([id, label], i) => (
        <Fragment key={id}>
          {i > 0 ? " " : null}
          <a className={id === here ? "here" : undefined} href={`#${id}`}>
            {label}
          </a>
        </Fragment>
      ))}
    </nav>
  );
}

function Server() {
  return <Nav here="place" />;
}

function TopNavView() {
  const [here, setHere] = useState("place");
  useEffect(() => {
    const sections = LINKS.map(([id]) => document.getElementById(id)).filter((s): s is HTMLElement => s !== null);
    const mark = () => {
      const line = 120;
      let current = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
      if (current) setHere(current.id);
    };
    const controller = new AbortController();
    addEventListener("scroll", mark, { passive: true, signal: controller.signal });
    mark();
    return () => controller.abort();
  }, []);
  return <Nav here={here} />;
}

export const TopNav = island("week04/frame/TopNav", TopNavView, Server, { roots: [".topnav"] });
