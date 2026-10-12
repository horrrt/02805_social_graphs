// The Claude Design entry: the site's React kit, as src/kit/index.ts exports
// it, the post and site layout components a page is built from, and
// CorridorRoot. env.ts must run first. Left out: PageShell (renders <html>
// and <body>), and TermProse, Termified and TermLayer (they place terms after
// the page's data loads; TermText and Term cover the static case).
import "./env";

export * from "../../src/kit";
export { default as CorridorRoot } from "./setup/CorridorRoot";
export { default as ColdReadRoot } from "./setup/ColdReadRoot";

export { Anatomy, type AnatomyRow } from "../../src/components/post/Anatomy";
export { Card } from "../../src/components/post/Card";
export { ClosingCard } from "../../src/components/post/ClosingCard";
export { Drawer } from "../../src/components/post/Drawer";
export { Drawers } from "../../src/components/post/Drawers";
export { FigRow } from "../../src/components/post/FigRow";
export { FindingRow } from "../../src/components/post/FindingRow";
export { FindingsStrip } from "../../src/components/post/FindingsStrip";
export { HeroStat } from "../../src/components/post/HeroStat";
export { HowTo, type HowToRow } from "../../src/components/post/HowTo";
export { Notice } from "../../src/components/post/Notice";
export { Plot } from "../../src/components/post/Plot";
export { PostHero } from "../../src/components/post/PostHero";
export { PostSection } from "../../src/components/post/PostSection";
export { QaDisclosure } from "../../src/components/post/QaDisclosure";
export { QuestionCard } from "../../src/components/post/QuestionCard";
export { QuestionHeader } from "../../src/components/post/QuestionHeader";
export { SectionOpener } from "../../src/components/post/SectionOpener";
export { SectionRail, type RailItem } from "../../src/components/post/SectionRail";
export { SegmentedControl, type SegmentButton } from "../../src/components/post/SegmentedControl";
export { Term, termStore } from "../../src/components/post/Term";
export { W4Figure } from "../../src/components/post/W4Figure";
export { BrandMark } from "../../src/components/site/BrandMark";
export { PostTopbar, type TopbarLink } from "../../src/components/site/PostTopbar";
export { SiteFooter } from "../../src/components/site/SiteFooter";
export { SkipLink } from "../../src/components/site/SkipLink";

// Cold Read, the Week 6 game at /play/cold-read/: the frame, the five rounds,
// the campaign through all five, and the level list the practice menu shows.
export { Frame } from "../../src/features/cold-read/Frame";
export { Campaign } from "../../src/features/cold-read/Campaign";
export { ClueShop } from "../../src/features/cold-read/ClueShop";
export { WhoseLine } from "../../src/features/cold-read/WhoseLine";
export { Tezguino } from "../../src/features/cold-read/Tezguino";
export { MixDesk } from "../../src/features/cold-read/MixDesk";
export { HotCold } from "../../src/features/cold-read/HotCold";
export { LEVELS } from "../../src/features/cold-read/levels";

// Week 6, the post at /weeks/week06/ ("Why do two Marvel pages read alike?") and
// its essentials page: every figure on each, by part name, drawn from the pages'
// own JSON on the live site.
export { Part as LookalikesPart } from "../../src/features/week06/Parts";
export { Essential as EssentialsPart } from "../../src/features/week06/Essentials";
