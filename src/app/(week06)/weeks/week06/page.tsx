import { SectionRail } from "@/components/post/SectionRail";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SkipLink } from "@/components/site/SkipLink";
import { Closing } from "./_sections/Closing";
import { Explore } from "./_sections/Explore";
import { Findings } from "./_sections/Findings";
import { Footer } from "./_sections/Footer";
import { Gender } from "./_sections/Gender";
import { Hero } from "./_sections/Hero";
import { Names } from "./_sections/Names";
import { Opening } from "./_sections/Opening";

// The rail lists each section with its question, as Weeks 4 and 5 do.
const RAIL = [
  { target: "opening", label: "Opening" },
  { target: "explore", label: "Pick a character", q: "Which pages read most like a character, and why?" },
  { target: "names", label: "Names carry the links", q: "How much of TF-IDF's agreement with the links comes from names?" },
  { target: "gender", label: "Without names, pages lean toward women's pages", q: "With the names gone, what makes two pages read alike?" },
  { target: "closing", label: "Closing" },
].map(({ target, label, q }) => ({ target, label, children: q ? [{ target: `${target}-asked`, label: q }] : undefined }));

// One component per section in _sections/; every chart, table and the explorer
// is a part of src/features/week06/Parts.tsx, drawn from lookalikes.json.
export default function Page() {
  return (
    <>
      <SkipLink />
      <PostTopbar
        root="../../"
        brandSpace
        siteLink
        navLabel="Sections of this post"
        links={[
          { href: "#opening", label: "Opening" },
          { href: "#explore", label: "1", name: "1: Pick a character" },
          { href: "#names", label: "2", name: "2: Names carry the links" },
          { href: "#gender", label: "3", name: "3: Without names, pages lean toward women's pages" },
          { href: "#closing", label: "Closing" },
        ]}
      />
      <main id="main">
        <Hero />
        <SectionRail items={RAIL} />
        <div className="shell">
          <Findings />
        </div>
        <div className="shell">
          <Opening />
          <Explore />
          <Names />
          <Gender />
          <Closing />
        </div>
      </main>
      <Footer />
      {" "}
    </>
  );
}
