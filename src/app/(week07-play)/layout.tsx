import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Driver.js's own stylesheet, vendored unmodified; cold-read.css restyles its popover in the site's tokens.
import "../../../public/assets/vendor/driver.js-1.9.0.min.css";
// KaTeX's stylesheet and fonts, vendored unmodified, for the debriefs' formulas.
import "../../../public/assets/vendor/katex-0.19.0/katex.min.css";
import "@/styles/type.css";
import "@/styles/cold-read.css";
import "@/styles/two-stripes.css";
import "@/styles/semantic-minefield.css";
// Same Word reuses Search Detective's progress bar, answer cards and results list.
import "@/styles/search-detective.css";
import "@/styles/same-word.css";

// The Week 7 games. Kept out of search (noindex); the Games menu and home page link them.
export const metadata: Metadata = {
  title: "Week 7 games · Log-Log Legends",
  description: "Games for Week 7 of DTU 02805: document embeddings, corpus maps, sentiment, named entities and search by meaning, on the Marvel pages.",
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
