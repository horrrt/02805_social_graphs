// The side panel for whatever the reader picked in a map or a network: a
// small kicker, the item's title and a line under it, a row of stat chips
// under the title (never beside it), word chips, a list of representative
// items, and one or two lists of nearest items with their scores. A nearest
// row with onPick is a button, so the panel can move the selection on.
// Without a title it shows `empty`. Plain HTML, so it renders on the server.
// Style: .kit-detail in post.css.
import type { ReactNode } from "react";

export type DetailStat = { label: ReactNode; value: ReactNode };
export type DetailItem = { title: ReactNode; text?: ReactNode };
export type NearestRow = { key: string; label: ReactNode; score: number | string; onPick?: () => void };
export type NearestList = { title: ReactNode; rows: NearestRow[]; fmt?: (v: number) => string };

const score = (v: number | string, fmt?: (v: number) => string) => (typeof v === "number" ? (fmt ?? ((x: number) => x.toFixed(2)))(v) : v);

/** <DetailPanel kicker="Selected topic" title="Topic 4" sub="20 of 303 documents" stats={[{ label: "Size", value: 20 }]} words={["spider", "man"]} nearest={[{ title: "Nearest topics", rows }]} /> */
export default function DetailPanel({
  kicker,
  title,
  sub,
  stats,
  words,
  wordsTitle = "Representative words",
  items,
  itemsTitle = "Representative items",
  nearest,
  empty = "Pick an item to see its details.",
}: {
  kicker?: ReactNode;
  title?: ReactNode;
  sub?: ReactNode;
  stats?: DetailStat[];
  words?: string[];
  wordsTitle?: ReactNode;
  items?: DetailItem[];
  itemsTitle?: ReactNode;
  nearest?: NearestList[];
  empty?: ReactNode;
}) {
  if (title === undefined || title === null || title === "")
    return (
      <aside className="kit-detail kit-detail-empty">
        {kicker ? <p className="kit-detail-kicker">{kicker}</p> : null}
        <p className="kit-empty">{empty}</p>
      </aside>
    );
  const lists = (nearest ?? []).slice(0, 2);
  return (
    <aside className="kit-detail" aria-live="polite">
      {kicker ? <p className="kit-detail-kicker">{kicker}</p> : null}
      <h4>{title}</h4>
      {sub ? <p className="kit-detail-sub">{sub}</p> : null}
      {stats?.length ? (
        <dl className="kit-detail-stats">
          {stats.map((s, i) => (
            <div key={i}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {words?.length ? (
        <section>
          <h5>{wordsTitle}</h5>
          <ul className="kit-detail-words">
            {words.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {items?.length ? (
        <section>
          <h5>{itemsTitle}</h5>
          <ul className="kit-detail-items">
            {items.map((it, i) => (
              <li key={i}>
                <b>{it.title}</b>
                {it.text ? <span>{it.text}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {lists.length ? (
        <div className={lists.length === 2 ? "kit-detail-near kit-detail-near-two" : "kit-detail-near"}>
          {lists.map((list, i) => (
            <section key={i}>
              <h5>{list.title}</h5>
              {list.rows.length ? (
                <ol>
                  {list.rows.map((r) => (
                    <li key={r.key}>
                      {r.onPick ? (
                        <button type="button" className="kit-link" onClick={r.onPick}>
                          {r.label}
                        </button>
                      ) : (
                        <span>{r.label}</span>
                      )}
                      <span className="kit-num">{score(r.score, list.fmt)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="kit-note">None.</p>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
