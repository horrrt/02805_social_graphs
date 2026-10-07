"use client";

// Runs a page's chart scripts once React has hydrated the page. The scripts
// draw into the server-rendered markup, so they must not start before
// hydration: React would find nodes it did not render and throw them away.
// Each page has one entry module (src/scripts/entries/) that imports its
// scripts in the order the old static page ran them.
import { useEffect } from "react";

const ENTRIES: Record<string, () => Promise<unknown>> = {};

export type PageName = keyof typeof ENTRIES;

export default function PageScripts({ page }: { page: PageName }) {
  useEffect(() => {
    ENTRIES[page]().catch((error: unknown) => console.error(`${page} scripts failed`, error));
  }, [page]);
  return null;
}
