"use client";

// Runs a page's chart scripts once React has hydrated the page. The scripts
// draw into the server-rendered markup, so they must not start before
// hydration: React would find nodes it did not render and throw them away.
// Each page has one entry module (src/scripts/entries/) that imports its
// scripts in the order the old static page ran them.
import { useEffect } from "react";

const ENTRIES = {
  "kit": () => import("@/scripts/entries/kit.js"),
  "mockups": () => import("@/scripts/entries/mockups.js"),
  "play": () => import("@/scripts/entries/play.js"),
  "screen-test": () => import("@/scripts/entries/screen-test.js"),
  "styleguide": () => import("@/scripts/entries/styleguide.js"),
  "template": () => import("@/scripts/entries/template.js"),
  "week01": () => import("@/scripts/entries/week01.js"),
  "week02": () => import("@/scripts/entries/week02.js"),
  "week03": () => import("@/scripts/entries/week03.js"),
  "week04": () => import("@/scripts/entries/week04.js"),
  "week05": () => import("@/scripts/entries/week05.js"),
};

export type PageName = keyof typeof ENTRIES;

export default function PageScripts({ page }: { page: PageName }) {
  useEffect(() => {
    ENTRIES[page]().catch((error: unknown) => console.error(`${page} scripts failed`, error));
  }, [page]);
  return null;
}
