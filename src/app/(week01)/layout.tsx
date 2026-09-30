import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hero Packs · Log–Log Legends",
  description: "Hero Packs — an interactive data story from 303 Marvel Wikipedia articles.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="../../assets/css/type.css?v=2" rel="stylesheet" />
        <link href="../../assets/css/arcade.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <script>{`document.documentElement.classList.add("js");`}</script>
        <link href="../../assets/css/story.css?v=ts1" rel="stylesheet" />
        <link rel="stylesheet" href="../../assets/css/design.css?v=ts1" />
      </head>
      <body className="theme-packs guided-post visual-design">{children}</body>
    </html>
  );
}
