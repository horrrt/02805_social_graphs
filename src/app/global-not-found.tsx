import type { Metadata } from "next";
import "@/styles/type.css";
import "@/styles/corridor.css";

// GitHub Pages serves out/404.html for any unknown path, so every URL in it
// is absolute and carries the base path. It has no layout, so it imports its
// own stylesheets.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Page not found · Log–Log Legends",
  robots: "noindex",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="corridor">
        <main id="main" className="shell" style={{ padding: "96px 24px" }}>
          <p className="eyebrow">404</p>
          <h1>No page here</h1>
          <p>
            <a href={`${BASE}/`}>Back to all posts</a>
          </p>
        </main>
      </body>
    </html>
  );
}
