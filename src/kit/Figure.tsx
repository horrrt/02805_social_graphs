// One figure, as kit.js figure() builds it: the chart in div.kit-stage, a
// caption that says how to read it, and the numbers behind it as a Table in a
// closed drawer at the foot. Style: .kit-figure in post.css.
import type { ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import Table, { type TableSpec } from "./Table";

/** <Figure chart={<EChart option={…} />} caption="…" data={{ columns, rows }} /> */
export default function Figure({
  chart,
  caption,
  data,
  label = "Table: the numbers behind the figure",
}: {
  chart?: ReactNode;
  caption?: ReactNode;
  data?: TableSpec;
  label?: ReactNode;
}) {
  return (
    <figure className="kit-figure">
      <div className="kit-stage">{chart}</div>
      {caption ? <figcaption>{caption}</figcaption> : null}
      {data ? (
        <Drawers variant="foot">
          <Drawer label={label}>
            <Table {...data} />
          </Drawer>
        </Drawers>
      ) : null}
    </figure>
  );
}
