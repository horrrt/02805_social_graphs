// What the published pages tell crawlers and AI agents about themselves: the
// canonical URL, the Markdown copy that scripts/agent-files.mjs writes beside
// each page after the build, Open Graph tags, and schema.org JSON-LD. Every
// live page's layout uses these, so the pages cannot drift apart.
import type { Metadata } from "next";
import { JsonLdScript } from "@/lib/JsonLdScript";
import { GROUP, WEEKS } from "@/scripts/weeks.js";

// The deployed site. Absolute on purpose: a canonical URL must be, and dev
// serves from the root while GitHub Pages serves from the project path.
export const SITE_URL = "https://horrrt.github.io/02805_social_graphs/";
export const SITE_NAME = "Log–Log Legends";

type Page = { path: string; title: string; description: string };

/** Canonical, Markdown alternate and Open Graph tags for a page at `path` ("" or "weeks/week05/"). */
export function pageMeta({ path, title, description }: Page): Metadata {
  const url = SITE_URL + path;
  return {
    title,
    description,
    alternates: { canonical: url, types: { "text/markdown": `${url}index.md` } },
    openGraph: {
      type: path ? "article" : "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "en_GB",
    },
  };
}

const authors = GROUP.members.map((name) => ({ "@type": "Person", name }));
const website = { "@type": "WebSite", name: SITE_NAME, url: SITE_URL };

/** schema.org JSON-LD: the site on the lobby, an Article for a week's post. */
export function JsonLd({ week, title, description }: { week?: number; title: string; description: string }) {
  const post = WEEKS.find((w) => w.n === week);
  const data = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: SITE_URL + `weeks/week${String(week).padStart(2, "0")}/`,
        datePublished: post.date,
        inLanguage: "en",
        author: authors,
        isPartOf: website,
        about: `DTU 02805 Social Graphs and Interactions, week ${week}: ${post.courseTitle}`,
      }
    : {
        "@context": "https://schema.org",
        ...website,
        description,
        inLanguage: "en",
        author: authors,
      };
  return <JsonLdScript data={data} />;
}
