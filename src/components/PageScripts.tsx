"use client";

// Runs a page's chart scripts once React has hydrated the page. The scripts
// draw into the server-rendered markup, so they must not start before
// hydration: React would find nodes it did not render and throw them away.
// Each script is inserted with async = false, which keeps document order the
// way the <script> tags at the bottom of the old static pages did.
import { useEffect } from "react";

export type PageScript = { src: string; module?: boolean };

const started = new Set<string>();

export default function PageScripts({ scripts }: { scripts: PageScript[] }) {
  useEffect(() => {
    for (const { src, module } of scripts) {
      const url = new URL(src, document.baseURI).href;
      if (started.has(url)) continue;
      started.add(url);
      const el = document.createElement("script");
      if (module) el.type = "module";
      el.src = url;
      el.async = false;
      document.body.appendChild(el);
    }
  }, [scripts]);
  return null;
}
