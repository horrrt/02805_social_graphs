import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { Closing } from "./_sections/Closing";
import { Findings } from "./_sections/Findings";
import { First } from "./_sections/First";
import { Hero } from "./_sections/Hero";
import { Opening } from "./_sections/Opening";
import { Second } from "./_sections/Second";

// One component per section in _sections/; their charts are islands in
// src/features/template/, drawn from the toy data in src/scripts/week-template.js.
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
          { href: "#first", label: "1" },
          { href: "#second", label: "2" },
          { href: "#closing", label: "Closing" },
        ]}
      />
      <main id="main">
        <Hero />
        <div className="shell">
          <Findings />
        </div>
        <div className="shell">
          <Opening />
          <First />
          <Second />
          <Closing />
        </div>
      </main>
      <SiteFooter>
        <span>Credit each data source here, in the form its licence asks for.</span>
        {" "}
        <span>
          Post template ·
          {" "}
          <a href="../../">Log–Log Legends</a>
          {" "}
          · DTU 02805
        </span>
      </SiteFooter>
      {/* The space after the footer is in the page's markup; keep it. */}
      {" "}
    </>
  );
}
