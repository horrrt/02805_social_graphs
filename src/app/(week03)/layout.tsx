import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/type.css";
import "@/styles/corridor.css";

export const metadata: Metadata = {
  title: "Corridor Control · Log–Log Legends",
  description: "Corridor Control: two country networks over the same world, where people live, from the UN migrant stock, and where you can fly, from OpenFlights.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor">{children}</body>
    </html>
  );
}
