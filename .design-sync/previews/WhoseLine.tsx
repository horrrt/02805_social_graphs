import { ColdReadRoot, Frame, WhoseLine } from "log-log-legends-kit";

// Cold Read's WhoseLine round as its practice page shows it: the game's frame,
// then the round's start panel. The decks load from the live site.
export const PracticePage = () => (
  <ColdReadRoot>
    <Frame page="practice" home="./">
      <WhoseLine />
    </Frame>
  </ColdReadRoot>
);
