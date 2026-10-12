import { ColdReadRoot, Frame, Tezguino } from "log-log-legends-kit";

// Cold Read's Tezguino round as its practice page shows it: the game's frame,
// then the round's start panel. The decks load from the live site.
export const PracticePage = () => (
  <ColdReadRoot>
    <Frame page="practice" home="./">
      <Tezguino />
    </Frame>
  </ColdReadRoot>
);
