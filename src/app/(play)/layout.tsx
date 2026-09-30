import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/site.css";
import "@/styles/signal.css";

export const metadata: Metadata = {
  title: "Give Baymax a voice — Log-Log Legends",
  description: "One hero. No connections. You get to add a link. A playable experiment in who gets found in the Marvel Wikipedia network.",
};

export const viewport: Viewport = { themeColor: "#141614" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="signal-story" data-signal-src="../assets/data/marvel_story.json">{children}</body>
    </html>
  );
}
