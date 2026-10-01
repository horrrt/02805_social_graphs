import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

export const metadata: Metadata = {
  title: "The Marvel network gets language · Log–Log Legends",
  description: "The Marvel network gets language: seven questions about the 303 Marvel Wikipedia pages. Week 5, Log–Log Legends.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor">{children}</body>
    </html>
  );
}
