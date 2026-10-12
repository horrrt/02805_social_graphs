import { NullBoard } from "log-log-legends-kit";
import { boardCells, boardMeasures, boardModels } from "@/features/kit-page/toy-distributions";

// The kit page's board: toy measures against toy null models, 300 draws each
// (src/features/kit-page/toy-distributions.ts).
const CELLS = boardCells();
export const Toy = () => <NullBoard measures={boardMeasures} models={boardModels} cells={CELLS} caption="Toy numbers: 300 draws per null model." />;
