import PageScripts from "@/components/PageScripts";
import { type RailItem, SectionRail } from "@/components/post/SectionRail";
import { Boot, Status } from "@/features/week03/frame/Boot";
import { QuestionsWatch } from "@/features/week03/questions/Questions";
import { ViewsWatch } from "@/features/week03/views/Views";
import { Asks } from "./_sections/Asks";
import { Bridge } from "./_sections/Bridge";
import { Denmark } from "./_sections/Denmark";
import { Edge } from "./_sections/Edge";
import { Footer } from "./_sections/Footer";
import { Hero } from "./_sections/Hero";
import { Methods } from "./_sections/Methods";
import { Tails } from "./_sections/Tails";
import { Topbar } from "./_sections/Topbar";
import { Twin } from "./_sections/Twin";
import { Typology } from "./_sections/Typology";

// The section rail down the left margin, as on Weeks 4 and 5.
const RAIL: RailItem[] = [
  { target: "globe", label: "Migration on the globe" },
  { target: "tails", label: "Heavy tails in migration" },
  { target: "bridge", label: "Popular ≠ bridge. Big ≠ prestigious." },
  { target: "twin", label: "Compared to what?" },
  { target: "typology", label: "Roles inside the communities" },
  { target: "edge", label: "Edge inspector" },
  { target: "denmark", label: "Let's analyse Denmark" },
  {
    target: "asks",
    label: "More ways to look at this",
    children: [
      { target: "questions-head", label: "Six questions, answered from the same two files" },
      { target: "gravity", label: "What is left after gravity" },
      { target: "communities", label: "Does the world split into groups?" },
      { target: "surprise", label: "What surprised us" },
      { target: "more", label: "Four extra views" },
    ],
  },
  { target: "methods", label: "Methods, and what this cannot tell you" },
];
export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Topbar />
      <main id="main">
        <Hero />
        <div className="shell">
          <Status />
          <Tails />
          <Bridge />
          <Twin />
          <Typology />
          <Edge />
          <Denmark />
          {" "}
          <Asks />
          <Methods />
        </div>
        <Footer />
      </main>
      <SectionRail column={1132} items={RAIL} />
      <Boot />
      <QuestionsWatch />
      <ViewsWatch />
      <PageScripts page="week03" />
    </>
  );
}
