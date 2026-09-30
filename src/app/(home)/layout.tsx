import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/home.css";

export const metadata: Metadata = {
  title: "Log–Log Legends · DTU 02805 Social Graphs",
  description: "Log–Log Legends: one interactive post per week of DTU 02805 Social Graphs and Interactions, by Àngela, Gyula and Niklas. Marvel articles, migration corridors and H-1B hiring so far; the language half follows.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
      </head>
      <body className="corridor home">{children}</body>
    </html>
  );
}
