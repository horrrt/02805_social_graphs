import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";
import "@/styles/toolbox.css";

// The group's own toolbox: hidden (noindex, and no page links here). Open /toolbox/ directly.
export const metadata: Metadata = {
  title: "Toolbox · Log–Log Legends",
  description: "Games, teaching materials, our own components and chart library examples, filtered by course week and concept.",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor toolbox">{children}</body>
    </html>
  );
}
