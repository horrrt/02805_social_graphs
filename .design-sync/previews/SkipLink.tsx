import { useEffect, useRef } from "react";
import { PostTopbar, SkipLink } from "log-log-legends-kit";

// The link stays off screen until it has focus, so the card focuses it, as Tab
// does on the first keypress, above the topbar it skips.
export const Focused = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLAnchorElement>("a.skip")?.focus();
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", paddingTop: 56 }}>
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
    </div>
  );
};
