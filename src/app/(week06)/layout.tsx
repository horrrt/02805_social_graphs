import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, pageMeta } from "@/components/agentMeta";
// KaTeX's stylesheet and fonts, vendored unmodified, for the formulas.
import "../../../public/assets/vendor/katex-0.19.0/katex.min.css";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

const PAGE = {
  path: "weeks/week06/",
  title: "Here, storm means Ororo, not the weather · Log-Log Legends",
  description: "Eight ways of reading text, from TF-IDF to GloVe, each tried on the same 303 Marvel pages with an explorable and a baseline. Log-Log Legends.",
};

export const metadata: Metadata = pageMeta(PAGE);

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd week={6} title={PAGE.title} description={PAGE.description} />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
