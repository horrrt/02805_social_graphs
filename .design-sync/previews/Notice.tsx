import { Notice } from "log-log-legends-kit";

// The two notices a Week 5 card uses: "What to notice" under what we did, and
// the closing card's one limit (icon "!", with the gap). Text from Week 5.
export const WhatToNotice = () => (
  <Notice icon="💡" headline="What to notice">
    54% of enemy links join two communities, against 42% when the labels are shuffled (z = 4.3). Family links cross only 23% of the time (z = −4.6). Allies cross 31%, still within chance; teammate and killed links look like shuffled ones.
  </Notice>
);

export const OneLimit = () => (
  <Notice icon="!" gap headline="One important limit">
    Wikipedia editors write both the words and the links. A long, well-linked page may measure how much editors care about a character more than the character's place in the comics, and nothing on this page separates the two.
  </Notice>
);

export const WithoutHeadline = () => (
  <Notice icon="!" gap>
    Sections 2 and 3 keep digits and split words at hyphens, so the pages hold about 740,000 tokens, 4% more. Each section states its rule.
  </Notice>
);
