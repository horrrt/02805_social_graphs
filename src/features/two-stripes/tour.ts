// Two Stripes' example game for Tutorial.tsx, which deals a fresh game before
// the first step. The last step presses the strip that matches best, the way
// a player would.
import { press, type TourStep } from "@/features/cold-read/Tutorial";

export const twoStripesTour = (): TourStep[] => [
  {
    element: ".ts-map",
    title: "The map",
    text: "Each dot is one of the 303 Marvel pages. The orange one is lit, and four candidates are ringed A to D. The map is a drawing: it keeps only two numbers per page.",
  },
  {
    element: ".ts-target-row",
    title: "The whole vector",
    text: "Each page is 384 numbers from a text encoder. The bars show its first 24 principal directions. On a PCA map the two shaded bars are the map's own axes; a t-SNE map uses none of them.",
  },
  {
    element: ".ts-strips",
    title: "Match the shapes",
    text: "The lit page's bars are outlined on every candidate. The nearest page by cosine is the one whose bars follow the outline best, the tall ones most of all, wherever its dot sits on the map.",
  },
  {
    act: press("#ts-pick-0"),
    element: ".cr-debrief",
    title: "The reveal",
    text: "Every candidate's cosine and its rank among the other 302 pages. The line on the map joins the lit page to its true nearest page.",
  },
  {
    element: ".cr-worth-box",
    title: "Beat the clock",
    text: "Playing for is what a right pick scores now; it falls as the clock runs down. A wrong pick or the buzzer costs a life.",
  },
];
