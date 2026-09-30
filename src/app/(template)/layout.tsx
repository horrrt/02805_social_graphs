import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Post template · Log–Log Legends",
  description: "Template for a Log–Log Legends post: copy it to start a new week.",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
              THE POST TEMPLATE. Start a new week by copying this folder:
        
                cp -r docs/weeks/_template docs/weeks/week06
        
              Then, in the copy:
                1. Title, description, eyebrow and h1: the week's question, not its method.
                2. Rename the section ids (first, second) to short words for your sections;
                   each slot id is <section>-<part>, which is what slot("first", "figure") finds.
                3. Replace every placeholder sentence and toy chart. Toy numbers say "toy" on the
                   page; nothing marked toy may stay in a published post.
                4. Point the script at the bottom at docs/assets/js/weekNN-<section>.js files.
                5. Keep noindex and the week "coming" in docs/assets/js/weeks.js until it is done.
                6. Keep the cards as they are: Week 4's form, as docs/weeks/week05/ uses it. Question and
                   answer, one paragraph beside "What to notice", the figure, then drawers; the limitation
                   goes in Method. tests/text-budget.test.mjs fails a card that shows more than 350 words
                   before a click (POST_GUIDE.md, "Keep the card short").
              Stylesheets: type.css, corridor.css, post.css and nothing else (tests/stylesheets.test.mjs).
              Rules for the writing and the numbers: POST_GUIDE.md.
            */}
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <link href="../../assets/css/type.css?v=2" rel="stylesheet" />
        <link href="../../assets/css/corridor.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/post.css?v=10" rel="stylesheet" />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
