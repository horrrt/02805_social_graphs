// The toolbox's filters as pure functions, so the page only renders and tests
// need no DOM. The data is public/toolbox/data/toolbox.json, written by
// scripts/toolbox_data.py. Every item carries concept ids (`c`), and a week is
// a list of concept ids, so "what could help with Week 3" is one filter.

export type Concept = { id: string; label: string; group: "networks" | "text" | "general" };
export type Week = { n: number; title: string; c: string[] };
export type Game = {
  name: string; list: string; rank: number; year: number | null; loop: string; build: string; teach: string; star: boolean; c: string[];
  wiki: string | null; link: { label: string; url: string } | null; img: string | null; play: string | null;
};
export type Topic = { slug: string; title: string; note: string; week: number; c: string[] };
export type Material = {
  topic: string; rank: number; name: string; type: string; by: string; why: string; free: string; url: string; c: string[]; img: string | null;
};
export type Component = {
  name: string; kind: string; what: string; where: string; seen_at: string | null; week: number | null; concepts: string[]; img: string | null;
};
export type Example = { title: string; cat: string; url: string; c: string[]; img: string | null };
export type Library = {
  name: string; slug: string; site: string; gallery: string; version_in_repo: string | null; what_for: string; note: string; examples: Example[];
};
export type ToolboxData = {
  concepts: Concept[]; weeks: Week[]; games: Game[]; topics: Topic[]; materials: Material[]; components: Component[]; libraries: Library[];
};

/** How likely a game carries one of the chosen concepts: "strong" when winning requires it (★), "likely" when its mechanic fits one. */
export type Fit = "strong" | "likely" | null;

export function fit(tags: string[], star: boolean, chosen: string[]): Fit {
  if (!chosen.length || !tags.some((t) => chosen.includes(t))) return null;
  return star ? "strong" : "likely";
}

const BUILD_ORDER = { S: 0, M: 1, L: 2 } as Record<string, number>;
const matches = (q: string, ...fields: (string | null | undefined)[]) => !q || fields.some((f) => f?.toLowerCase().includes(q));
const touches = (tags: string[], chosen: string[]) => !chosen.length || tags.some((t) => chosen.includes(t));

export type GameFilter = { concepts: string[]; query: string; list: string; builds: string[]; starOnly: boolean };

/** Games that match, best fit first, then quickest to build, then rank in their list. */
export function filterGames(games: Game[], f: GameFilter) {
  const q = f.query.trim().toLowerCase();
  return games
    .filter((g) => touches(g.c, f.concepts))
    .filter((g) => !f.list || g.list === f.list)
    .filter((g) => !f.builds.length || f.builds.includes(g.build.slice(0, 1)))
    .filter((g) => !f.starOnly || g.star)
    .filter((g) => matches(q, g.name, g.loop, g.teach, g.list))
    .map((g) => ({ g, fit: fit(g.c, g.star, f.concepts) }))
    .sort((a, b) => Number(b.g.star) - Number(a.g.star) || (BUILD_ORDER[a.g.build[0]] ?? 3) - (BUILD_ORDER[b.g.build[0]] ?? 3) || a.g.rank - b.g.rank);
}

/**
 * Topics for a week (that week's own topics) or else for the chosen concepts, each with its materials that
 * match the search. A week picks by week because neighbouring weeks share concepts (clustering is Weeks 2 and 3).
 */
export function filterMaterials(data: Pick<ToolboxData, "topics" | "materials">, concepts: string[], query: string, week = 0) {
  const q = query.trim().toLowerCase();
  return data.topics
    .filter((t) => (week ? t.week === week : touches(t.c, concepts)))
    .map((t) => ({ topic: t, rows: data.materials.filter((m) => m.topic === t.slug && matches(q, m.name, m.by, m.why, m.type)) }))
    .filter((t) => t.rows.length);
}

export function filterComponents(items: Component[], concepts: string[], query: string) {
  const q = query.trim().toLowerCase();
  return items.filter((i) => touches(i.concepts, concepts) && matches(q, i.name, i.what, i.kind, i.where));
}

/**
 * Each library with the examples that match; with concepts chosen, matching examples come first and the rest stay
 * listed after them. Any network concept also counts network drawings, as a networks week draws networks.
 */
export function filterLibraries(libs: Library[], chosen: string[], query: string, networkIds: string[] = []) {
  const q = query.trim().toLowerCase();
  const concepts = chosen.some((c) => networkIds.includes(c)) ? [...chosen, "network-visualization"] : chosen;
  return libs.map((lib) => {
    const rows = lib.examples.filter((e) => matches(q, e.title, e.cat) || matches(q, lib.name));
    const hits = concepts.length ? rows.filter((e) => touches(e.c, concepts)) : rows;
    return { lib, hits, rest: concepts.length ? rows.filter((e) => !touches(e.c, concepts)) : [] };
  });
}

/** A site path from the data ("/weeks/week03/#x") as a link from /toolbox/. */
export const sitePath = (path: string) => `..${path.startsWith("/") ? path : `/${path}`}`;
