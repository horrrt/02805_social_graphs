import type { ReactNode } from "react";
import { Card, HowTo } from "log-log-legends-kit";

// On the site the box fills the right column of the white opening card (w4-two),
// about 596px wide on the 1180px page; the card shows it in a card of that width.
const Column = ({ children }: { children: ReactNode }) => (
  <Card className="card w4-card" style={{ maxWidth: 640 }}>
    {children}
  </Card>
);

// Week 5's key: the real pages, the random baseline and the reference line.
export const Week5 = () => (
  <Column>
    <HowTo
      rows={[
        { swatch: "w4-sw-real", label: "The real pages", text: "What the pages and links show." },
        { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over shuffles, rewired networks or random orders." },
        { swatch: "w4-sw-ref", label: "Reference", text: "What chance alone would give." },
      ]}
    />
  </Column>
);

// Week 4's key, with the two filing colours and a three-colour swatch for the metro groups.
export const Week4 = () => (
  <Column>
    <HowTo
      rows={[
        { swatch: "w4-sw-real", label: "The real network", text: "What the filings show." },
        { swatch: "w4-sw-band", label: "Random baseline", text: "Mean and one standard deviation over rewired networks or random draws." },
        { swatch: "w4-sw-people", label: "Placed at a client", text: "Filings that put the worker at another company." },
        { swatch: "w4-sw-access", label: "Direct employer", text: "Filings for the employer’s own site." },
        { swatch: "w4-sw-ref", label: "Reference", text: "The full network, or equal odds." },
        {
          swatch: "w4-sw-groups",
          swatchChildren: (
            <>
              <b className="g0"></b>
              <b className="g1"></b>
              <b className="g2"></b>
            </>
          ),
          label: "Metro groups",
          text: "Violet, green and slate mark the three Louvain groups, on maps only.",
        },
      ]}
    />
  </Column>
);
