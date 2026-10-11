import { Concordance } from "log-log-legends-kit";

// Week 5 section 1's hand-read sentences (public/weeks/week05/data/relations.json
// concordance): the linked page in context, its source page linked to Wikipedia.
export const EnemySentences = () => (
  <Concordance
    caption="Enemy sentences, read by hand"
    rows={[
      { page: "Iron_Fist_(character)", left: "Iron Fist and Lei Kung bring Hope Summers to K'un-Lun to train as an Iron Fist, in order to defeat the ", hit: "Phoenix", right: " Force-possessed X-Men." },
      { page: "Sabra_(character)", left: "There, she meets Iron Man and the Arabian Knight (Abdul Qamar), and battles ", hit: "She-Hulk", right: " and Captain Britain." },
      { page: "Adam_Warlock", left: "As Loki, ", hit: "Emma Frost", right: ", Hulk, Ant-Man, Ms. Marvel, and Kang the Conqueror gather together, they find Adam" },
    ]}
  />
);

export const KilledSentences = () => (
  <Concordance
    caption="Killed sentences, read by hand"
    rows={[
      { page: "Iron_Man_2020", left: "Arno also murders ", hit: "War Machine", right: "." },
      { page: "Man-Thing", left: "After Xarus is killed by ", hit: "Blade", right: ", the latter adopts Boy-Thing." },
      { page: "Guardsman_(character)", left: "Pascal Tyler - killed Cinder, framing ", hit: "Luke Cage", right: " and Rhino" },
    ]}
  />
);

export const EmptyContext = () => (
  <Concordance caption="A hit with no context on either side" rows={[{ page: "Thor_(Marvel_Comics)", left: "", hit: "Mjolnir", right: "" }]} />
);
