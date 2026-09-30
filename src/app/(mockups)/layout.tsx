import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/site.css";
import "@/styles/mockups.css";

export const metadata: Metadata = {
  title: "48 visual concepts — Log-Log Legends",
  description: "Review 48 visual concepts for Log-Log Legends: 46 full-page designs and three data stories. Explore findings, proposed interactions and UX rationale, and save your favourites.",
  robots: "noindex",
};

export const viewport: Viewport = { themeColor: "#141614" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="../assets/favicon.svg?v=2" type="image/svg+xml" />
      </head>
      <body className="mockups">{children}</body>
    </html>
  );
}
