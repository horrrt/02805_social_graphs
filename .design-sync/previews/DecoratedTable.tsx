import { DecoratedTable } from "log-log-legends-kit";

// Cells as text; decorate() works out the bars and meters from the text.
// Week 5 numbers from public/weeks/week05/data/fame.json and relations.json.
export const LongerThanFame = () => (
  <DecoratedTable
    caption="Pages far longer than their in-degree predicts"
    head={[{ text: "Page" }, { text: "In-degree" }, { text: "Words" }, { text: "Predicted" }]}
    rows={[
      [{ text: "Brian Braddock", tag: "th" }, "1", "7,226", "899"],
      [{ text: "Miracleman", tag: "th" }, "0", "4,315", "546"],
      [{ text: "Betsy Braddock", tag: "th" }, "7", "12,800", "2,444"],
      [{ text: "U.S. Agent", tag: "th" }, "6", "9,615", "2,220"],
      [{ text: "Isaiah Bradley", tag: "th" }, "0", "2,028", "546"],
    ]}
  />
);

export const ReadByHand = () => (
  <DecoratedTable
    caption="Sentences read by hand: how often the label was right"
    head={[{ text: "Label" }, { text: "Read" }, { text: "Right" }, { text: "Share right" }]}
    rows={[
      [{ text: "Ally", tag: "th" }, "12", "9", "75%"],
      [{ text: "Teammate", tag: "th" }, "12", "7", "58%"],
      [{ text: "Family", tag: "th" }, "12", "6", "50%"],
      [{ text: "Enemy", tag: "th" }, "12", "5", "42%"],
      [{ text: "Killed", tag: "th" }, "12", "5", "42%"],
    ]}
  />
);
