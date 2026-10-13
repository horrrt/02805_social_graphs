// Every post the site nav lists, in course order, from the schedule in
// src/scripts/weeks.js: "Week N · <cabinet name>" and the cabinet's href,
// relative to the site's root. A week's companion pages hang under it.
import { liveWeeks } from "@/scripts/weeks.js";

export type Post = { href: string; label: string; parts?: Post[] };

const PARTS: Record<number, Post[]> = {
  6: [{ href: "weeks/week06/alternative/", label: "Week 6 alternative" }],
};

const weeks = liveWeeks() as { n: number; cabinet: { name: string; href: string } }[];

export const POSTS: Post[] = weeks.map((w) => ({ href: w.cabinet.href, label: `Week ${w.n} · ${w.cabinet.name}`, ...(PARTS[w.n] ? { parts: PARTS[w.n] } : {}) }));
