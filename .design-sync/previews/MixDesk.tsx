import { ColdReadRoot, Frame, MixDesk } from "log-log-legends-kit";

// Cold Read's MixDesk round as its practice page shows it: the game's frame,
// then the round's start panel. The decks load from the live site.
export const PracticePage = () => (
  <ColdReadRoot>
    <Frame page="practice" home="./">
      <MixDesk />
    </Frame>
  </ColdReadRoot>
);
