// THE POST TEMPLATE. Start a new week by copying this route group:
//
//   cp -r "src/app/(template)" "src/app/(week06)"
//   mv "src/app/(week06)/weeks/%5Ftemplate" "src/app/(week06)/weeks/week06"
//
// Then, in the copy:
//   1. Title, description, eyebrow and h1: the week's question, not its method.
//   2. Rename the section ids (first, second) to short words for your sections, one
//      component per section in _sections/; each part's id is <section>-<part>.
//   3. Replace every placeholder sentence and toy chart. Toy numbers say "toy" on the
//      page; nothing marked toy may stay in a published post.
//   4. Copy src/features/template/ to src/features/week06/ and give each chart host an
//      island there (island() in src/lib/island.tsx, named week06/<section>/<Name>) that
//      loads its JSON with useData and draws with the kit (src/kit/). Put each section's
//      pure builders in src/scripts/week06-<section>.js; prose that gets a glossary term
//      goes through TermProse. The rules: src/lib/README.md.
//   5. Keep noindex and the week "coming" in src/scripts/weeks.js until it is done.
//   6. Keep the cards as they are: Week 4's form, as src/app/(week05)/ uses it. Question and
//      answer, one paragraph beside "What to notice", the figure, then drawers; the limitation
//      goes in Method. tests/text-budget.test.mjs fails a card that shows more than 350 words
//      before a click (project/POST_GUIDE.md, "Keep the card short").
// Stylesheets: type.css, corridor.css, post.css and nothing else (tests/stylesheets.test.mjs).
// Rules for the writing and the numbers: project/POST_GUIDE.md.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageShell } from "@/components/site/PageShell";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

export const metadata: Metadata = {
  title: "Post template · Log–Log Legends",
  description: "Template for a Log–Log Legends post: copy it to start a new week.",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <PageShell bodyClass="corridor">{children}</PageShell>;
}
