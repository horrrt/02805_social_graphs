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
  { target: "pack-machine", label: "Open a pack" },
  { target: "post", label: "58 articles receive no incoming links" },
  { target: "results", label: "The last few cards take the longest" },
  { target: "evidence", label: "Go deeper" },
];

// One component per section in _sections/. The arcade islands
// (src/features/arcade/) paint the chrome, the logbook and the loading line;
// Week 1's own islands live in src/features/week01/.
export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ArcadeChrome />
      <main className="wrap" id="main">
        <AppStatus file="week01_packs.json" />
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
