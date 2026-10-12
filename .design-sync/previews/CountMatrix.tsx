import { useState } from "react";
import { CountMatrix } from "log-log-legends-kit";
import { matrixCells, matrixCols, matrixRows } from "@/features/kit-page/toy";

// The kit page's co-occurrence matrix: toy counts of each column word within
// two words of the row word (src/features/kit-page/toy.ts), wine's row lit.
export const Counts = () => {
  const [row, setRow] = useState(0);
  return <CountMatrix rows={matrixRows} cols={matrixCols} cells={matrixCells} highlightRow={row} onRow={setRow} caption="Toy counts of each column word within two words of the row word." />;
};
