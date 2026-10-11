import { SiteFooter } from "log-log-legends-kit";

// Week 5's footer: the licence credit for the Wikipedia text, then the post's name and the link home.
export const Week5 = () => (
  <SiteFooter>
    <span>
      Page text, article names and links from English Wikipedia,
      {" "}
      <a href="#">CC BY-SA 4.0</a>
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

// The post template's footer.
export const Template = () => (
  <SiteFooter>
    <span>Credit each data source here, in the form its licence asks for.</span>
    {" "}
    <span>
      Post template ·
      {" "}
      <a href="../../">Log–Log Legends</a>
      {" "}
      · DTU 02805
    </span>
  </SiteFooter>
);
