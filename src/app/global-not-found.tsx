import type { Metadata } from "next";

// GitHub Pages serves out/404.html for any unknown path, so every URL in it
// is absolute and carries the base path.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Page not found · Log–Log Legends",
  robots: "noindex",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href={`${BASE}/assets/css/type.css`} rel="stylesheet" />
        <link href={`${BASE}/assets/css/corridor.css`} rel="stylesheet" />
      </head>
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
