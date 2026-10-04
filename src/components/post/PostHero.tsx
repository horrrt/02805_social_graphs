// The hero of a Week 4-style post (section.hero.w4-hero): eyebrow, title, then
// a grid of the text column (the question in .body, the scope caution, an
// optional legend, the hero stats) and the page's figure and panels as
// children. Week 5 and the template add w5-hero-grid through gridClass.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = {
  id: string;
  eyebrow: ReactNode;
  title: ReactNode;
  gridClass?: string;
  body: ReactNode;
  caution: ReactNode;
  legend?: ReactNode;
  stats: ReactNode;
  children?: ReactNode;
};

export function PostHero({ id, eyebrow, title, gridClass = "w4-hero-grid", body, caution, legend, stats, children }: Props) {
  return (
    <section className="hero w4-hero" id={id}>
      <div className="shell">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {el(
          "div",
          { className: gridClass },
          el(
            "div",
            { className: "w4-hero-text" },
            <p className="body">{body}</p>,
            <p className="caution">{caution}</p>,
            legend,
            <div className="w4-hero-stats">{stats}</div>,
          ),
          children,
        )}
      </div>
    </section>
  );
}
