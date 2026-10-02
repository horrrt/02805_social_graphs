import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
import "@/styles/type.css";
import "@/styles/arcade.css";
import "@/styles/story.css";
import "@/styles/design.css";

const PAGE = {
  path: "weeks/week01/",
  title: "Hero Packs · Log–Log Legends",
  description: "Hero Packs — an interactive data story from 303 Marvel Wikipedia articles.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd week={1} title={PAGE.title} description={PAGE.description} />
        <script>{`document.documentElement.classList.add("js");`}</script>
      </head>
      <body className="theme-packs guided-post visual-design">{children}</body>
    </html>
  );
}
