import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

const PAGE = {
  path: "weeks/week06/essentials/",
  title: "The Week 6 essentials on 303 Marvel pages · Log–Log Legends",
  description: "Every term on the Week 6 Essentials list, from TF-IDF to GloVe, used once on the course's 303 Marvel pages, each with an explorable and a baseline. Log–Log Legends.",
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
