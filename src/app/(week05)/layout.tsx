import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

const PAGE = {
  path: "weeks/week05/",
  title: "The Marvel network gets language · Log–Log Legends",
  description: "The Marvel network gets language: seven questions about the 303 Marvel Wikipedia pages. Week 5, Log–Log Legends.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd week={5} title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
