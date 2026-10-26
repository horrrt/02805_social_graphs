import { PortraitCredit } from "@/components/site/PortraitCredit";
import { SiteFooter } from "@/components/site/SiteFooter";

// Footer: the credits the pages' and Wikidata's licences ask for.
export function Footer() {
  return (
    <SiteFooter>
      <span>
        Page text, article names and links from English Wikipedia,
        {" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
        ,
        through the 02805 course snapshot of 26 August 2026. Character names and aliases from
        {" "}
        <a href="https://www.wikidata.org/">Wikidata</a>
        ,
        {" "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>
        , fetched 20 October 2026.
        <PortraitCredit />
      </span>
    </SiteFooter>
  );
}
