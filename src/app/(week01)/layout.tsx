import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/arcade.css";
import "@/styles/story.css";
import "@/styles/design.css";

export const metadata: Metadata = {
  title: "Hero Packs · Log–Log Legends",
  description: "Hero Packs — an interactive data story from 303 Marvel Wikipedia articles.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <script>{`document.documentElement.classList.add("js");`}</script>
      </head>
      <body className="theme-packs guided-post visual-design">{children}</body>
    </html>
  );
}
