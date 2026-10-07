import { ArcadeChrome, Logbook } from "@/features/arcade/Chrome";
import { ArcadeFooter, ArcadeNoscript } from "@/features/arcade/Frame";
import { AppStatus } from "@/features/arcade/Status";
import { type RailItem, SectionRail } from "@/components/post/SectionRail";
import { Evidence } from "./_sections/Evidence";
import { Hero } from "./_sections/Hero";
import { Post } from "./_sections/Post";
import { Results } from "./_sections/Results";
import { TryIt } from "./_sections/TryIt";

// The section rail down the left margin, as on Weeks 4 and 5.
const RAIL: RailItem[] = [
  { target: "try-it", label: "Will your journey survive?" },
  { target: "post", label: "A busy station is not always a vital connection" },
  { target: "results", label: "Count the alternative routes, not just the connections" },
  { target: "evidence", label: "Go deeper" },
];

// One component per section in _sections/. The arcade islands
// (src/features/arcade/) paint the chrome, the logbook and the loading line;
// Week 2's own islands live in src/features/week02/.
export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ArcadeChrome />
      <main className="wrap" id="main">
        <AppStatus file="week02_transit.json" />
        <ArcadeNoscript />
        <Hero />
        <TryIt />
        <Post />
        <Results />
        <Evidence />
      </main>
      <ArcadeFooter />
      <SectionRail column={1120} items={RAIL} />
      <Logbook />
    </>
  );
}
