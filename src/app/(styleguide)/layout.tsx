import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";

export const metadata: Metadata = {
  title: "Style guide · Corridor Control · Log–Log Legends",
  description: "Every component of the Corridor Control post, drawn once under every skin, palette and table style, from the same stylesheet the post loads.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <style>{`
              /* Only what the guide itself needs: scoped specimens and swatches.
                 Everything a reader sees inside a specimen comes from corridor.css. */
              .sg-specimens { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .sg-specimens.five { grid-template-columns: repeat(5, minmax(0, 1fr)); }
              .sg-specimens.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .sg-scope { border-radius: 10px; padding: 14px; }
              .sg-scope .card { padding: 14px; }
              .sg-name { font-size: var(--fs-caption); font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px; opacity: 0.7; }
              .sg-swatches { display: grid; gap: 12px; grid-template-columns: repeat(6, minmax(0, 1fr)); }
              .sg-swatch i { display: block; height: 44px; border-radius: 10px; border: 1px solid var(--line); }
              .sg-swatch code { display: block; font-size: var(--fs-caption); margin-top: 6px; }
              .sg-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
              .sg-stack { display: flex; flex-direction: column; gap: 12px; }
              .sg-label { font-size: var(--fs-caption); color: var(--ink-mute); margin: 0 0 6px; }
              .sg-label code { font-size: var(--fs-caption); }
              .sg-ramp { display: flex; align-items: baseline; gap: 14px; border-bottom: 1px solid var(--line-soft); padding: 6px 0; }
              .sg-ramp small { font-size: var(--fs-caption); color: var(--ink-mute); }
              .sg-tip { position: static; display: inline-flex; }
              .sg-hero .shell { grid-template-columns: minmax(0, 1fr) 320px; }
            `}</style>
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
