import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/home.css";

const PAGE = {
  path: "",
  title: "Log–Log Legends · DTU 02805 Social Graphs",
  description: "Log–Log Legends: one interactive post per week of DTU 02805 Social Graphs and Interactions, by Àngela, Gyula and Niklas. Marvel articles, migration corridors and H-1B hiring so far; the language half follows.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor home">{children}</body>
    </html>
  );
}
