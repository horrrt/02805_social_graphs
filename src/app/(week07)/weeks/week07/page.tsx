import { SectionRail } from "@/components/post/SectionRail";
import { TermLayer } from "@/components/post/TermLayer";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SkipLink } from "@/components/site/SkipLink";
import { Closing } from "./_sections/Closing";
import { Explore } from "./_sections/Explore";
import { Findings } from "./_sections/Findings";
import { Footer } from "./_sections/Footer";
import { Hero } from "./_sections/Hero";
import { Only } from "./_sections/Only";
import { Opening } from "./_sections/Opening";
import { Together } from "./_sections/Together";
import { Unit } from "./_sections/Unit";

// The rail lists each section with its question, as Weeks 4 to 6 do.
const RAIL = [
  { target: "opening", label: "Opening" },
  { target: "explore", label: "Pick a character", q: "Who do the pages name in one sentence with a character, and are the two linked?" },
  { target: "together", label: "Named together, mostly linked", q: "How often is a pair named in one sentence also linked?" },
  { target: "unit", label: "Sentence, paragraph or page", q: "Does the unit of text, or spaCy's tagger, change the network?" },
  { target: "only", label: "What only one network has", q: "What do the ties in only one of the two networks turn out to be?" },
  { target: "closing", label: "Closing" },
].map(({ target, label, q }) => ({ target, label, children: q ? [{ target: `${target}-asked`, label: q }] : undefined }));

// One component per section in _sections/; every chart, table and the explorer
// is a part of src/features/week07/Parts.tsx, drawn from comention.json.
export default function Page() {
  return (
    <>
      <SkipLink />
      <TermLayer />
      <PostTopbar root="../../" current="weeks/week07/" />
      <main id="main">
        <Hero />
        <SectionRail items={RAIL} />
        <div className="shell">
          <Findings />
        </div>
        <div className="shell">
          <Opening />
          <Explore />
          <Together />
          <Unit />
          <Only />
          <Closing />
        </div>
      </main>
      <Footer />
      {" "}
    </>
  );
}
