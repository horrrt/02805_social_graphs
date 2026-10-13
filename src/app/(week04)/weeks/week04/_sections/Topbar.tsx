import { SiteNav } from "@/components/site/SiteNav";
import { TopNav } from "@/features/week04/frame/TopNav";

// The top bar with the brand, the site nav and the section links.
export function Topbar() {
  return (
    <div className="topbar">
      <div className="shell">
        <a className="brand" href="../../">
          LOG–LOG
          {" "}
          <b>LEGENDS</b>
        </a>
        {" "}
        <SiteNav root="../../" current="weeks/week04/" />
        <TopNav />
      </div>
    </div>
  );
}
