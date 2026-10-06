import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

const PAGE = {
  path: "weeks/week06/",
  title: "Why do two Marvel pages read alike? · Log–Log Legends",
  description: "Why do two Marvel pages read alike: names, stories or Wikipedia's template? TF-IDF on the 303 Marvel pages, with and without names. Week 6, Log–Log Legends.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd week={6} title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
