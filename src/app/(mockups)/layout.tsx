import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
        <link rel="stylesheet" href="../assets/css/site.css?v=20260909-3" />
        <link rel="stylesheet" href="../assets/css/mockups.css?v=20260910-1" />
      </head>
      <body className="mockups">{children}</body>
    </html>
  );
}
