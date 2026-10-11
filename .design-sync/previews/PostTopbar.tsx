import { PostTopbar } from "log-log-legends-kit";

// Week 5's bar: the brand, "All posts", then one link per section.
export const Week5 = () => (
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
);

// Week 4 marks the section in view with a "here" link.
export const HereLink = () => (
  <PostTopbar
    root="../../"
    brandSpace
    siteLink
    navLabel="Sections of this post"
    links={[
      { href: "#place", label: "Where" },
      { href: "#jobs", label: "Jobs", here: true },
      { href: "#who", label: "Staffing" },
      { href: "#footprint", label: "Without the biggest" },
      { href: "#beyond", label: "Beyond" },
    ]}
  />
);

// The post template's short bar.
export const Template = () => (
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
);
