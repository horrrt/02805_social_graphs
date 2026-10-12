import { ClueShop, ColdReadRoot, Frame } from "log-log-legends-kit";

// The root swaps body.corridor for body.cold-read; here around round 1.
export const AroundRoundOne = () => (
  <ColdReadRoot>
    <Frame page="practice" home="./">
      <ClueShop />
    </Frame>
  </ColdReadRoot>
);
