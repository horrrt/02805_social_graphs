import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";
import "@/styles/week04-deep.css";
import "@/styles/week04-years.css";
import "@/styles/week04-roles.css";
import "@/styles/week04-methods.css";
import "@/styles/week04-skills.css";
import "@/styles/week04-skills-radar.css";
import "@/styles/week04-vis-more.css";
import "@/styles/week04-vis-intros.css";
import "@/styles/week04-vis-staffing.css";
import "@/styles/week04-entities.css";
import "@/styles/week04-sources.css";

export const metadata: Metadata = {
  title: "Who hires America's foreign workers? · Log–Log Legends",
  description: "Who hires America's foreign workers? Places, jobs and companies from US H-1B filings — Week 4 go-nuts, Log–Log Legends.",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Draft: keep noindex until the whole post is final. */}
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
