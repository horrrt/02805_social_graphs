import { Drawer, Drawers } from "log-log-legends-kit";

// A row of drawers: "foot" at the bottom of a Week 5 card, "inline" in
// Week 4's text after a moved-questions note. Text from those pages.
export const Foot = () => (
  <div className="card w4-card w5-card">
    <Drawers variant="foot">
      <Drawer label="Method">
        <p>
          A link from A to B means A's Wikipedia page links to B's. For each of the 1,784 links we took the first sentence on A's page that names B, and found one for 1,513 (85%).
        </p>
        <p>A small word list labels each sentence: killed, family, enemy, ally or teammate.</p>
      </Drawer>
      <Drawer label="More numbers">
        <p>The labelled links: 217 teammate, 202 enemy, 116 family, 84 killed and 58 ally. 113 sentences match more than one label.</p>
      </Drawer>
      <Drawer label="What we read in the pages" bodyId="relations-checked">
        <p>We read 60 sentences, 12 per label, drawn at random: 32 of the labels describe how A and B relate.</p>
      </Drawer>
    </Drawers>
  </div>
);

export const Inline = () => (
  <div className="card w4-card">
    <p className="rx-moved">Earlier questions now open sections 1 to 3.</p>
    <Drawers variant="inline">
      <Drawer label="Which ones">
        <span>
          Which cities hire the most? and Is it one national job market or several regional ones? in section 1, Which jobs are hired together? in section 2, How many workers sit at a client? in section 3.
        </span>
      </Drawer>
    </Drawers>
  </div>
);
