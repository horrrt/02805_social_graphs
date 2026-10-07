// The degree chart's axis view, chosen in the section head's select and read
// by the canvas below it: "linear" (the select's first option) or "log".
import { createStore } from "../../../scripts/runtime/store.js";

export const chart = createStore({ scale: "linear" });

export const setScale = (scale) => chart.setState({ scale });
