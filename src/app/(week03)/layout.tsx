import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Corridor Control · Log–Log Legends",
  description: "Corridor Control: two country networks over the same world, where people live, from the UN migrant stock, and where you can fly, from OpenFlights.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="../../assets/favicon.svg?v=2" rel="icon" type="image/svg+xml" />
        <link href="../../assets/css/type.css?v=2" rel="stylesheet" />
        <link href="../../assets/css/corridor.css?v=f664d7a065" rel="stylesheet" />
      </head>
      <body className="corridor">{children}</body>
    </html>
  );
}
