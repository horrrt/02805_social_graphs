import { Face } from "log-log-legends-kit";

// The bare face inside Cold Read's own frame (.cr-face, styled under body.cold-read).
export const InColdReadFrame = () => (
  <p style={{ display: "flex", gap: 12 }}>
    <span className="cr-face" data-size="m"><Face name="Hulk" /></span>
    <span className="cr-face" data-size="m"><Face name="Storm (Marvel Comics)" /></span>
    <span className="cr-face" data-size="m"><Face name="Not A Real Character" /></span>
  </p>
);
