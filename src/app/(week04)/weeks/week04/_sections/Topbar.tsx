import { TopNav } from "@/features/week04/frame/TopNav";

// The top bar with the brand and the section links.
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
        <a className="site-link" href="../../#weeks">All posts</a>
        <TopNav />
      </div>
    </div>
  );
}
