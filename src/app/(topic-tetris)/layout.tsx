import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
// Cold Read's sheet styles the shared parts (score box, rules, start row, faces); topic-tetris.css the board.
import "@/styles/cold-read.css";
import "@/styles/topic-tetris.css";
import "@/styles/topic-tetris-stack.css";

// Kept out of search (noindex) and linked from nowhere until the group says otherwise.
export const metadata: Metadata = {
  title: "Topic Tetris · Log-Log Legends",
  description: "Nine Marvel pages fall three times. Group them by their words, by their meaning and by their links, and watch the groups change. A game about representation, Week 7.",
  robots: "noindex",
};

export const viewport: Viewport = { themeColor: "#0b1f3a" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="cold-read topic-tetris">{children}</body>
    </html>
  );
}
