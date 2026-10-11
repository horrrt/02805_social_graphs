import { SiteFooter } from "@/components/site/SiteFooter";

// Footer: the credits the pages' and Wikidata's licences ask for, then the post's name and the link home.
export function Footer() {
  return (
    <SiteFooter>
      <span>
        Page text, article names and links from English Wikipedia,
        {" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
        ,
        through the 02805 course snapshot of 26 August 2026. Sex or gender from
        {" "}
        <a href="https://www.wikidata.org/wiki/Property:P21">Wikidata</a>
        ,
        {" "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>
        , fetched 6 October 2026.
      </span>
      {" "}
      <span>
        Why do two Marvel pages read alike? ·
        {" "}
        <a href="../../">Log–Log Legends</a>
        {" "}
        · DTU 02805
      </span>
    </SiteFooter>
  );
}
