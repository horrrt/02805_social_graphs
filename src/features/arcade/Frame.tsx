// The server markup Weeks 1 and 2 share around their sections: the note shown
// without JavaScript and the footer with its licence.
import { SiteFooter } from "@/components/site/SiteFooter";

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
    <SiteFooter>
      <span>
        Article names, links and text excerpts from English Wikipedia,
        {" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
      </span>
    </SiteFooter>
  );
}
