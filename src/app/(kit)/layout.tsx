import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageShell } from "@/components/site/PageShell";
import "@/styles/type.css";
import "@/styles/corridor.css";
import "@/styles/post.css";

export const metadata: Metadata = {
  title: "Components · Log–Log Legends",
  robots: "noindex",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <PageShell bodyClass="corridor">{children}</PageShell>;
}
