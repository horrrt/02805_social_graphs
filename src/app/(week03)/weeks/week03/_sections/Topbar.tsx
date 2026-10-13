import { SiteNav } from "@/components/site/SiteNav";
import { StyleMenu } from "@/features/week03/menu/StyleMenu";
// The top bar: brand, site nav, the Views menu host and the section links.
export function Topbar() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="topbar">
        <div className="shell">
          <a className="brand" href="../../">
            LOG–LOG
            {" "}
            <b>LEGENDS</b>
          </a>
          {" "}
          <SiteNav root="../../" current="weeks/week03/" />
          <StyleMenu />
          <nav className="topnav" aria-label="Sections of this post">
            <a className="here" href="#globe">Migration</a>
            {" "}
            <a href="#twin">Flights</a>
            {" "}
            <a href="#typology">People</a>
            {" "}
            <a href="#denmark">Connectivity</a>
          </nav>
        </div>
      </div>
    </>
  );
}
