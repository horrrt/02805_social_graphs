import { EditableMatrix } from "log-log-legends-kit";
import { MATRIX_EXAMPLE, MATRIX_LABELS } from "@/features/kit-page/toy-editors";

// The kit page's editable matrix: toy messages among eight people
// (src/features/kit-page/toy-editors.ts); row i, column j counts i to j.
export const Messages = () => (
  <EditableMatrix labels={MATRIX_LABELS} initial={MATRIX_EXAMPLE} example={MATRIX_EXAMPLE} caption="Row i, column j: messages from i to j. Type a number into a cell." />
);
