import { readFileSync } from "node:fs";
import { join } from "node:path";

type Card = { id: string; weight: number; probability: number };
type Packs = { totalWeight: number; cards: Card[] };

// The hero's figure: the draw odds as a raffle. Each card holds one ticket per
// incoming link plus one, so the wall has as many squares as the denominator
// of p(card). Drawn at build time from the same JSON the pack machine loads.
const packs: Packs = JSON.parse(
  readFileSync(join(process.cwd(), "public/assets/data/week01_packs.json"), "utf8"),
);

const COLS = 48;
const STEP = 7.5;
const SIZE = 6;

function label(id: string) {
  return id.replace(/_/g, " ").replace(/ \([^)]*\)$/, "");
}

export function TicketWall() {
  const total = packs.totalWeight;
  const cards = [...packs.cards].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  const top = cards[0];
  const rare = cards.filter((c) => c.weight === 1).length;
  const rows = Math.ceil(total / COLS);
  let cell = 0;
  return (
    <figure className="w1-tickets">
      <svg
        viewBox={`0 0 ${COLS * STEP} ${rows * STEP}`}
        role="img"
        aria-label={`${total.toLocaleString("en-US")} squares, one per ticket. ${label(top.id)} holds ${top.weight}; each of the ${rare} cards with no incoming links holds one.`}
      >
        {cards.map((c, i) => {
          const tone = i === 0 ? "top" : c.weight === 1 ? "rare" : i % 2 ? "a" : "b";
          const squares = [];
          for (let k = 0; k < c.weight; k += 1, cell += 1) {
            squares.push(
              <rect
                key={k}
                x={(cell % COLS) * STEP}
                y={Math.floor(cell / COLS) * STEP}
                width={SIZE}
                height={SIZE}
                rx={1.2}
              />,
            );
          }
          return (
            <g key={c.id} className={`w1-t-${tone}`}>
              <title>
                {`${label(c.id)}: ${c.weight} ${c.weight === 1 ? "ticket" : "tickets"}, ${(c.probability * 100).toFixed(c.probability < 0.01 ? 2 : 1)}% a draw`}
              </title>
              {squares}
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="w1-key"><i className="w1-t-top" />{label(top.id)}, {top.weight} tickets</span>
        <span className="w1-key"><i className="w1-t-rare" />{rare} cards with one ticket each</span>
        <span className="w1-tickets-note">
          Each square is one of {total.toLocaleString("en-US")} tickets, and every
          draw picks one. A card holds one ticket per incoming link, plus one.
          Hover a square to see its card.
        </span>
      </figcaption>
    </figure>
  );
}
