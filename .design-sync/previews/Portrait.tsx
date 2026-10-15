import { Portrait } from "log-log-legends-kit";

// The four sizes round, a tile for a card, and a page with no portrait source,
// which falls back to its initials.
export const Sizes = () => (
  <p style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Portrait page="Storm (Marvel Comics)" size="xs" />
    <Portrait page="Storm (Marvel Comics)" size="s" />
    <Portrait page="Storm (Marvel Comics)" size="m" />
    <Portrait page="Storm (Marvel Comics)" size="l" />
  </p>
);

export const Tile = () => <Portrait page="Cyclops (Marvel Comics)" size="l" shape="tile" />;

export const InARow = () => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    <li className="kit-named"><Portrait page="Storm (Marvel Comics)" />Storm</li>
    <li className="kit-named"><Portrait page="Hulk" />Hulk</li>
    <li className="kit-named"><Portrait page="Not A Real Character" />Initials when no source has one</li>
  </ul>
);
