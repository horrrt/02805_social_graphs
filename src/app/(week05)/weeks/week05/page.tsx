import { PostTopbar } from "@/components/site/PostTopbar";
import { SkipLink } from "@/components/site/SkipLink";
import { Autocomplete } from "./_sections/Autocomplete";
import { Closing } from "./_sections/Closing";
import { Copying } from "./_sections/Copying";
import { Fame } from "./_sections/Fame";
import { Findings } from "./_sections/Findings";
import { Footer } from "./_sections/Footer";
import { Heaps } from "./_sections/Heaps";
import { Hero } from "./_sections/Hero";
import { Opening } from "./_sections/Opening";
import { Relations } from "./_sections/Relations";
import { Search } from "./_sections/Search";
import { Weird } from "./_sections/Weird";

// One component per section in _sections/. Each section's islands fill its
// hosts and place its terms.
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
          { href: "#relations", label: "1" },
          { href: "#copying", label: "2" },
          { href: "#search", label: "3" },
          { href: "#autocomplete", label: "4" },
          { href: "#heaps", label: "5" },
          { href: "#fame", label: "6" },
          { href: "#weird", label: "7" },
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
          <Relations />
          <Copying />
          <p aria-live="polite" className="status-line" id="w5-boot-status" hidden></p>
          <Search />
          <Autocomplete />
          <Heaps />
          <Fame />
          <Weird />
          <Closing />
        </div>
      </main>
      <Footer />
      {/* The spaces after the footer are in the page's markup; keep them. */}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
    </>
  );
}
