import PageScripts from "@/components/PageScripts";
import { type RailItem, SectionRail } from "@/components/post/SectionRail";
import { TermLayer } from "@/components/post/TermLayer";
import { LegacyBridge } from "@/features/week04/frame/LegacyBridge";
import { Router } from "@/features/week04/frame/Router";
import { Beyond } from "./_sections/Beyond";
import { Closing } from "./_sections/Closing";
import { Cut } from "./_sections/Cut";
import { Findings } from "./_sections/Findings";
import { Footer } from "./_sections/Footer";
import { Footprint } from "./_sections/Footprint";
import { Hero } from "./_sections/Hero";
import { Jobs } from "./_sections/Jobs";
import { Opening } from "./_sections/Opening";
import { Place } from "./_sections/Place";
import { Topbar } from "./_sections/Topbar";
import { Who } from "./_sections/Who";

// The section rail down the left margin: each section with its questions, and the deep dive's topics.
const RAIL: RailItem[] = [
  { target: "opening", label: "Opening" },
  {
    target: "place",
    label: "Where the hiring is",
    children: [
      { target: "place-who", label: "Do cities group by who hires there instead of by region?" },
      { target: "place-break", label: "Where does the backbone break, and whose links hold it?" },
    ],
  },
  {
    target: "jobs",
    label: "Which jobs go together",
    children: [
      { target: "jobs-split", label: "Do outsourcing firms bundle jobs differently from direct employers?" },
      { target: "jobs-linkcom", label: "Does any job belong to two clusters at once?" },
    ],
  },
  {
    target: "who",
    label: "Who staffs whom",
    children: [
      { target: "who-switch", label: "When a client changes its main vendor, does it stay in its group?" },
      { target: "who-movers", label: "Which clients change group when filing counts are ignored?" },
      { target: "who-overlap", label: "Which clients sit in two groups at once?" },
    ],
  },
  {
    target: "footprint",
    label: "Without the biggest firms",
    children: [
      { target: "footprint-which", label: "Which firm hides the regions?" },
    ],
  },
  {
    target: "beyond",
    label: "Beyond the three networks",
    children: [
      { target: "beyond-law", label: "Do immigration law firms split companies the way vendors do?" },
      { target: "beyond-perm", label: "Do outsourcing firms sponsor fewer green cards?" },
      { target: "beyond-wage", label: "Do outsourcing firms file at lower wage levels for the same job?" },
    ],
  },
  { target: "closing", label: "Closing" },
  {
    target: "cut",
    label: "Deep dive",
    children: [
      { target: "topic-where", label: "Where the hiring is" },
      { target: "topic-jobs", label: "Jobs and skills" },
      { target: "topic-outsourcing", label: "Outsourcing firms and their clients" },
      { target: "topic-paperwork", label: "Paperwork, the lottery and green cards" },
      { target: "topic-years", label: "Five years" },
      { target: "evidence", label: "Data and methods" },
    ],
  },
];

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Topbar />
      <main id="main">
        {/* Hero: the text, the metro map, the inspector ------------------ */}
        <Hero />
        {/* The section rail: the numbers down the left margin ---------- */}
        <SectionRail items={RAIL} />
        {/* Five sections, five findings ------------------------------------ */}
        <div className="shell">
          <Findings />
        </div>
        <div className="shell">
          <p aria-live="polite" className="status-line" id="place-status">
            Loading place data…
          </p>
          {/* Opening ----------------------------------------------------- */}
          <Opening />
          {/* ============================================================ */}
          {" "}
          {/* Where the hiring is · companies × cities (Track C methods)   */}
          {" "}
          {/* ============================================================ */}
          <Place />
          {/* Jobs · Track B ---------------------------------------------- */}
          <Jobs />
          {/* Staffing · Track A ------------------------------------------ */}
          <Who />
          {/* Closing ----------------------------------------------------- */}
          {" "}
          {/* Without the biggest firms ------------------------------------ */}
          <Footprint />
          {/* Beyond the three networks ------------------------------------ */}
          <Beyond />
          <Closing />
          {/* Deep dive · the first round of questions ------------------ */}
          <Cut />
        </div>
        <Footer />
      </main>
      {/* One ECharts for both sections; week04-place.js skips its own loader when this is present. */}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      <TermLayer />
      <Router />
      <LegacyBridge />
      <PageScripts page="week04" />
    </>
  );
}
