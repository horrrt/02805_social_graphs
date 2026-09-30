import type { Metadata } from "next";
import type { ReactNode } from "react";

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
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <link href="../../assets/css/type.css?v=2" rel="stylesheet" />
        <link href="../../assets/css/corridor.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/post.css?v=4" rel="stylesheet" />
        <link href="../../assets/css/week04-deep.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-years.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-roles.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-methods.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-skills.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-skills-radar.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-vis-more.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-vis-intros.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-vis-staffing.css?v=ts1" rel="stylesheet" />
        <link href="../../assets/css/week04-entities.css?v=4" rel="stylesheet" />
        <link href="../../assets/css/week04-sources.css?v=ts1" rel="stylesheet" />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
