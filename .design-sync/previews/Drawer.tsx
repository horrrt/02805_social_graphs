import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Drawer, Drawers } from "log-log-legends-kit";

// One drawer at the foot of a Week 5 card (it needs its Drawers row). The
// site never renders a drawer open; the second cell opens it as a reader's
// click would. Text from Week 5 section 6.
function Opened({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    box.current?.querySelectorAll("details").forEach((d) => (d.open = true));
  }, []);
  return <div ref={box}>{children}</div>;
}

const method = (
  <Drawer label="Method">
    <p>
      A character's in-degree is the number of the other pages that link to its page. We counted the words on each of the 303 pages by the rule sections 5 to 7 share: runs of letters in any alphabet, an inner apostrophe or hyphen kept, lowercased, a possessive 's removed; digits and punctuation dropped.
    </p>
    <p id="fame-limit">
      In-degree counts only links among these 303 pages. A character famous from British comics or television, like Miracleman or Isaiah Bradley, gets nothing for it.
    </p>
  </Drawer>
);

export const Closed = () => (
  <div className="card w4-card w5-card">
    <Drawers variant="foot">{method}</Drawers>
  </div>
);

export const Open = () => (
  <div className="card w4-card w5-card">
    <Opened>
      <Drawers variant="foot">{method}</Drawers>
    </Opened>
  </div>
);
