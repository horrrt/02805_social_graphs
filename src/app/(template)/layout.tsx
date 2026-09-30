// THE POST TEMPLATE. Start a new week by copying this route group:
//
//   cp -r "src/app/(template)" "src/app/(week06)"
//   mv "src/app/(week06)/weeks/%5Ftemplate" "src/app/(week06)/weeks/week06"
//
// Then, in the copy:
//   1. Title, description, eyebrow and h1: the week's question, not its method.
//   2. Rename the section ids (first, second) to short words for your sections;
//      each slot id is <section>-<part>, which is what slot("first", "figure") finds.
//   3. Replace every placeholder sentence and toy chart. Toy numbers say "toy" on the
//      page; nothing marked toy may stay in a published post.
//   4. Write src/scripts/weekNN-<section>.js files, import them from a new
//      src/scripts/entries/week06.js, list that entry in src/components/PageScripts.tsx
//      and set <PageScripts page="week06" /> in the page.
//   5. Keep noindex and the week "coming" in src/scripts/weeks.js until it is done.
//   6. Keep the cards as they are: Week 4's form, as src/app/(week05)/ uses it. Question and
//      answer, one paragraph beside "What to notice", the figure, then drawers; the limitation
//      goes in Method. tests/text-budget.test.mjs fails a card that shows more than 350 words
//      before a click (POST_GUIDE.md, "Keep the card short").
// Stylesheets: type.css, corridor.css, post.css and nothing else (tests/stylesheets.test.mjs).
// Rules for the writing and the numbers: POST_GUIDE.md.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

export const metadata: Metadata = {
  title: "Post template · Log–Log Legends",
  description: "Template for a Log–Log Legends post: copy it to start a new week.",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor">{children}</body>
    </html>
  );
}
