import { SiteFooter } from "@/components/site/SiteFooter";

// Footer: the Wikipedia credit the pages' licence asks for, then the post's name and the link home.
export function Footer() {
  return (
    <SiteFooter>
      <span>
        Page text, article names and links from English Wikipedia,
        {" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
        ,
        through the 02805 course snapshot of 26 August 2026.
      </span>
      {" "}
      <span>
        The Marvel network gets language ·
        {" "}
        <a href="../../">Log–Log Legends</a>
        {" "}
        · DTU 02805
      </span>
    </SiteFooter>
  );
}
