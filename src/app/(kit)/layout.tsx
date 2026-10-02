import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

export const metadata: Metadata = {
  title: "Components · Log–Log Legends",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor">{children}</body>
    </html>
  );
}
