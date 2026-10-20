import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

const PAGE = {
  path: "weeks/week07/",
  title: "Can the text rebuild the Marvel network? · Log-Log Legends",
  description: "Can the text rebuild the Marvel network? Characters named in one sentence on the 303 Marvel pages, compared with the links. Week 7, Log-Log Legends.",
};

// Built, not yet published: noindex, and Week 7 stays "coming" in src/scripts/weeks.js until the group signs it off.
export const metadata: Metadata = { ...pageMeta(PAGE), robots: "noindex" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd week={7} path={PAGE.path} title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
