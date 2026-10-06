import { SectionRail } from "@/components/post/SectionRail";
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

// The rail lists each section with its question, as Week 4's does.
const RAIL = [
  { target: "opening", label: "Opening" },
  { target: "relations", label: "Turn links into relationships", q: "Do enemies sit in different communities from allies and family?" },
  { target: "copying", label: "Catch Wikipedia copying itself", q: "Which Marvel pages copy text from each other?" },
  { target: "search", label: "A Marvel search engine in 20 lines", q: "Can a Bag-of-Words search find the right Marvel page from a short description?" },
  { target: "autocomplete", label: "Community autocomplete", q: "Can someone who has not seen the pages tell which community a fake page came from?" },
  { target: "heaps", label: "Heaps' law of the Marvel universe", q: "Do minor characters bring new words, or mostly repeat the famous ones?" },
  { target: "fame", label: "Does network fame buy you more words?", q: "Do characters that more pages link to get longer Wikipedia pages?" },
  { target: "weird", label: "Who has the weirdest Wikipedia page?", q: "Which Marvel page uses the most varied words for its length, and is that real or boilerplate?" },
  { target: "closing", label: "Closing" },
].map(({ target, label, q }) => ({ target, label, children: q ? [{ target: `${target}-asked`, label: q }] : undefined }));

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
        <SectionRail items={RAIL} />
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
