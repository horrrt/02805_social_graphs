import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Driver.js's own stylesheet, vendored unmodified; cold-read.css restyles its popover in the site's tokens.
import "../../../public/assets/vendor/driver.js-1.9.0.min.css";
import "@/styles/type.css";
import "@/styles/cold-read.css";

// Hidden for now: noindex, and no page on the site links here. Share the URL.
export const metadata: Metadata = {
  title: "Cold Read · Log–Log Legends",
  description: "A Marvel page is hidden. Flip word cards that show only how often the word appears here and on how many pages, and name the page. A game about TF-IDF and cosine similarity, Week 6.",
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
