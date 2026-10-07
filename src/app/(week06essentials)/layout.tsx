import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";
import "@/styles/week06-essentials-story.css";

const PAGE = {
  path: "weeks/week06/essentials/",
  title: "What does a word actually tell us? · Week 6 essentials · Log–Log Legends",
  description: "An interactive data story of the Week 6 essentials — from raw counts to TF-IDF, context, PMI and embeddings — on 303 Marvel pages. Log–Log Legends.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
