import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Components · Log–Log Legends",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <link href="../../assets/css/type.css?v=2" rel="stylesheet" />
        <link href="../../assets/css/corridor.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/post.css?v=10" rel="stylesheet" />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
