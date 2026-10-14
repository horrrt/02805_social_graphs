// Every post the site nav lists, in course order, from the schedule in
// src/scripts/weeks.js: "Week N · <cabinet name>" and the cabinet's href,
// relative to the site's root. A week's companion pages could hang under it
// as parts; none is listed (Week 6's alternative post is reached from the post).
import { liveWeeks } from "@/scripts/weeks.js";

export type Post = { href: string; label: string; parts?: Post[] };

const PARTS: Record<number, Post[]> = {};

const weeks = liveWeeks() as { n: number; cabinet: { name: string; href: string } }[];

export const POSTS: Post[] = weeks.map((w) => ({ href: w.cabinet.href, label: `Week ${w.n} · ${w.cabinet.name}`, ...(PARTS[w.n] ? { parts: PARTS[w.n] } : {}) }));
