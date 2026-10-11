// The document a layout returns: <html lang="en"> with an optional <head> and
// the page's <body>. A layout keeps its literal `import "@/styles/…";` lines
// (tests/stylesheets.test.mjs reads them) and passes the body's class, any
// other body attributes in the order the old JSX wrote them, and what its
// <head> held (JSON-LD, Week 1 and 2's inline script adding the js class).
import type { ReactNode } from "react";
import { el } from "./el";

type Props = {
  bodyClass?: string;
  bodyProps?: Record<string, string>;
  head?: ReactNode;
  children: ReactNode;
};

export function PageShell({ bodyClass, bodyProps, head, children }: Props) {
  return el(
    "html",
    { lang: "en", suppressHydrationWarning: true },
    head !== undefined && el("head", null, head),
    el("body", { className: bodyClass, ...bodyProps }, children),
  );
}
