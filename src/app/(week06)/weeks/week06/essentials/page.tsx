import type { Metadata } from "next";
import { PostTopbar } from "@/components/site/PostTopbar";
import { SkipLink } from "@/components/site/SkipLink";

// The essentials page's old address. The essentials are the Week 6 post now,
// one level up; a static export has no server redirect, so this page sends
// the browser there with a meta refresh and keeps a link for anyone it does not.

export const metadata: Metadata = {
  title: "Moved: the Week 6 post · Log-Log Legends",
  robots: "noindex",
};

export default function Page() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=../" />
      <SkipLink />
      <PostTopbar root="../../../" />
      <main id="main">
        <div className="shell">
          <p>
            This page is now the
            {" "}
            <a href="../">Week 6 post</a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
