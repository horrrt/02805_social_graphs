import { Passage } from "log-log-legends-kit";

// Real sentences from Week 5's data (heaps.json passages, relations.json
// concordance), each from one page with the highlighted word marked.
export const NewWord = () => (
  <Passage
    page="Miracleman_(character)"
    text="The character was revived by Dez Skinn in 1982, with Alan Moore and Garry Leach as the creative team on Marvelman in the pages of Warrior."
    highlight="Marvelman"
  />
);

export const TwoHits = () => (
  <Passage
    page="Brian_Braddock"
    text="Following his corruption by Morgan le Fay, his twin sister Betsy reclaimed the mantle of Captain Britain, with Brian taking up the moniker Captain Avalon as defender of Avalon."
    highlight="Captain"
  />
);

export const NoMatch = () => (
  <Passage
    page="Rachel_Summers"
    text="Soon after X (Xavier) is killed by bioengineered human terrorists, Cyclops gathers Rachel and Kid Cable for a mission on the Atlantic Ocean regarding a piece of their new homeland of Krakoa."
    highlight="power"
  />
);
