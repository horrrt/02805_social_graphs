import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Give Baymax a voice — Log-Log Legends",
  description: "One hero. No connections. You get to add a link. A playable experiment in who gets found in the Marvel Wikipedia network.",
};

export const viewport: Viewport = { themeColor: "#141614" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="../assets/favicon.svg?v=2" type="image/svg+xml" />
        <link href="../assets/css/type.css?v=2" rel="stylesheet" />
        <link rel="stylesheet" href="../assets/css/site.css?v=ts1" />
        <link rel="stylesheet" href="../assets/css/signal.css?v=ts1" />
      </head>
      <body className="signal-story" data-signal-src="../assets/data/marvel_story.json">{children}</body>
    </html>
  );
}
