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
        <nav className="topnav" aria-label="Sections of this post">
          <a href="#opening">Opening</a>
          {" "}
          <a className="here" href="#place">Where</a>
          {" "}
          <a href="#jobs">Jobs</a>
          {" "}
          <a href="#who">Staffing</a>
          {" "}
          <a href="#footprint">Giants out</a>
          {" "}
          <a href="#beyond">Beyond</a>
          {" "}
          <a href="#cut">Deep dive</a>
        </nav>
      </div>
    </div>
  );
}
