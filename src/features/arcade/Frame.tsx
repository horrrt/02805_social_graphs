// The server markup Weeks 1 and 2 share around their sections: the note shown
// without JavaScript and the footer with its licence and page links.

export function ArcadeNoscript() {
  return (
    <noscript>
      <p className="note">
        The interactive cabinets need JavaScript. The main findings and
        methods are available below.
      </p>
    </noscript>
  );
}

export function ArcadeFooter() {
  return (
    <footer className="wrap footer">
      <span>
        Log–Log Legends · 02805 Social graphs and interactions · Fall
        2026 · Article names, links and text excerpts from English Wikipedia,
        {" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
      </span>
      <span>
        <a href="../../">Legends</a>
        {" "}
        /
        {" "}
        <a href="../../mockups/">Design archive</a>
        {" "}
        /
        {" "}
        <a href="../../weeks/week01/">Week 1</a>
        {" "}
        /
        {" "}
        <a href="../../weeks/week02/">Week 2</a>
      </span>
    </footer>
  );
}
