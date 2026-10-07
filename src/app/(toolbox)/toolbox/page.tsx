import { PostHero } from "@/components/post/PostHero";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { Toolbox } from "@/features/toolbox/Toolbox";

// The toolbox: find games, materials, components and library examples for a
// week's concepts. Data from scripts/toolbox_data.py; filters in
// src/features/toolbox/filters.ts. The posts' topbar, hero and footer.
export default function Page() {
  return (
    <>
      <SkipLink />
      <PostTopbar root="../" brandSpace siteLink navLabel="Toolbox sections" links={[{ href: "#toolbox", label: "Toolbox" }]} />
      <main id="main">
        <PostHero
          id="top"
          eyebrow="Log–Log Legends"
          title="Toolbox"
          gridClass="tb-hero-grid"
          body={
            <>
              Pick a week or a few concepts to find the games, teaching materials, components we already have and library examples that could carry
              them.
            </>
          }
          caution="For the group only: no page links here."
          stats={null}
        />
        <div className="shell">
          <Toolbox />
        </div>
      </main>
      <SiteFooter>
        <span>
          Sources: game lists in <code>project/games/</code>, materials in <code>project/materials/</code>, components and libraries in{" "}
          <code>project/toolbox/</code>. Rebuild with <code>python scripts/toolbox_data.py</code>.
        </span>{" "}
        <span>
          Toolbox · <a href="../">Log–Log Legends</a> · DTU 02805
        </span>
      </SiteFooter>
    </>
  );
}
