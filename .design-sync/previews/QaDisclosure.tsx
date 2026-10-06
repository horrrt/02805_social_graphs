import { useLayoutEffect, useRef } from "react";
import { QaDisclosure } from "log-log-legends-kit";

// The closing card's disclosures. The site never renders one open; the
// second cell opens it as a reader's click would. Text from Week 5's closing.
const ai = (
  <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
    <p className="sub">
      AI coding assistants helped write the analysis and page code, drafted and revised text, and tested the page in a browser. The numbers come from the course data and the scripts above.
    </p>
    <p className="sub">
      Each script writes the numbers its section quotes to a JSON file the page reads. We reran the scripts under two hash seeds and got identical files, and we read the passages behind the counts.
    </p>
  </QaDisclosure>
);

export const Closed = () => (
  <div className="card w4-card w5-stack">
    <QaDisclosure id="methods" cue="Methods, data and AI use">
      <p className="sub">Data: the course's snapshot of the 303 pages, their node table and their links.</p>
    </QaDisclosure>
    {ai}
  </div>
);

export const Open = () => {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    box.current?.querySelectorAll("details").forEach((d) => (d.open = true));
  }, []);
  return (
    <div className="card w4-card w5-stack" ref={box}>
      {ai}
    </div>
  );
};
