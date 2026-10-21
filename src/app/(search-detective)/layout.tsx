import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// KaTeX's stylesheet and fonts, vendored unmodified, for the cosine formula.
import "../../../public/assets/vendor/katex-0.19.0/katex.min.css";
import "@/styles/type.css";
import "@/styles/cold-read.css";
import "@/styles/search-detective.css";

// Kept out of search (noindex), like Cold Read, whose look and scoreboard it shares.
export const metadata: Metadata = {
  title: "Semantic Search Detective · Log-Log Legends",
  description: "Pick the document that best answers a query, then see how a semantic search ranks them with cosine similarity, and why a 2D map of embeddings can mislead. A game about document embeddings, Week 7.",
  robots: "noindex",
};

export const viewport: Viewport = { themeColor: "#0b1f3a" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="cold-read">{children}</body>
    </html>
  );
}
