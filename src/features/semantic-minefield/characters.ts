// Semantic Minefield's teaching data: the categories and the characters that
// belong to them. Every membership is written out by hand, once, for the
// mainstream Marvel Comics continuity (not the films), and nothing is
// inferred: being a villain says nothing here about using magic, and an
// artificial intelligence is only one because its row says so. A category a
// row leaves out is a no. Characters whose labels the comics leave in doubt
// (membership only of a team that is not an official Avengers line-up,
// several people under one name) are left out rather than argued over.
//
// `page` is the character's title in the course's 303-page Marvel corpus, when
// it has one, so Face can show its portrait; the others show initials. `blurb`
// is a one-line description, written for the game, that the keyword search in
// the debrief reads; it never decides a category.

export type CatId = "hero" | "villain" | "avenger" | "xmen" | "mutant" | "magic" | "tech" | "ai" | "alien";

export type Category = {
  id: CatId;
  label: string;
  /** The rule a character must meet, shown in the legend and the round's query. */
  rule: string;
  /** A short mark for the tile's chip. */
  mark: string;
};

export const CATEGORIES: Record<CatId, Category> = {
  hero: { id: "hero", label: "Hero", rule: "Best known as a hero.", mark: "★" },
  villain: { id: "villain", label: "Villain", rule: "Best known as a villain.", mark: "☠" },
  avenger: { id: "avenger", label: "Avengers member", rule: "Has served on an official Avengers team in the comics.", mark: "A" },
  xmen: { id: "xmen", label: "X-Men member", rule: "Has served on the X-Men.", mark: "X" },
  mutant: { id: "mutant", label: "Mutant", rule: "Born with the X-gene. Powers from a spider, a serum or radiation do not count.", mark: "M" },
  magic: { id: "magic", label: "Uses magic", rule: "Casts spells or practises sorcery. A god’s power, chi or the Power Cosmic alone does not count.", mark: "✦" },
  tech: { id: "tech", label: "Uses advanced technology", rule: "Builds or fights with machines: armour, gadgets or weapons with working parts. Being a machine is not enough.", mark: "⚙" },
  ai: { id: "ai", label: "Artificial intelligence", rule: "A machine mind: a robot, android or synthezoid whose mind was built, not born.", mark: "AI" },
  alien: { id: "alien", label: "Alien", rule: "Comes from beyond Earth: another planet, or another realm such as Asgard or the Dark Dimension.", mark: "☄" },
};

export type Character = {
  id: string;
  name: string;
  page?: string;
  cats: CatId[];
  blurb: string;
};

export const CHARACTERS: Character[] = [
  // Heroes
  { id: "cap", name: "Captain America", cats: ["hero", "avenger"], blurb: "Steve Rogers, a soldier made super by a wartime serum, who fights with a round shield." },
  { id: "ironman", name: "Iron Man", cats: ["hero", "avenger", "tech"], blurb: "Tony Stark, an inventor who fights in powered armour he designed, helped by an artificial intelligence in the suit." },
  { id: "thor", name: "Thor", cats: ["hero", "avenger", "alien"], blurb: "The Asgardian god of thunder, whose hammer was enchanted with magic by his father Odin." },
  { id: "hulk", name: "Hulk", page: "Hulk", cats: ["hero", "avenger"], blurb: "Bruce Banner, a scientist who turns into a green giant after a gamma bomb blast." },
  { id: "widow", name: "Black Widow", page: "Black Widow (Natasha Romanova)", cats: ["hero", "avenger", "tech"], blurb: "Natasha Romanoff, a former Soviet spy who fights with stingers built into her bracelets." },
  { id: "hawkeye", name: "Hawkeye", page: "Hawkeye (comics)", cats: ["hero", "avenger", "tech"], blurb: "Clint Barton, a master archer with trick arrows, who began as a villain before joining the Avengers." },
  { id: "spidey", name: "Spider-Man", page: "Spider-Man", cats: ["hero", "avenger", "tech"], blurb: "Peter Parker, bitten by a radioactive spider, who swings on web-shooters he built himself." },
  { id: "strange", name: "Doctor Strange", page: "Doctor Strange", cats: ["hero", "avenger", "magic"], blurb: "Stephen Strange, a former surgeon who became Earth’s Sorcerer Supreme." },
  { id: "vision", name: "Vision", cats: ["hero", "avenger", "ai"], blurb: "A synthezoid, a synthetic man built by Ultron, who turned on his maker and joined the Avengers." },
  { id: "panther", name: "Black Panther", page: "Black Panther (character)", cats: ["hero", "avenger", "tech"], blurb: "T’Challa, king of Wakanda, who fights in a vibranium suit made with his nation’s technology." },
  { id: "warmachine", name: "War Machine", page: "War Machine", cats: ["hero", "avenger", "tech"], blurb: "James Rhodes, a pilot who wears a heavily armed suit of armour." },
  { id: "pym", name: "Ant-Man (Hank Pym)", page: "Hank Pym", cats: ["hero", "avenger", "tech"], blurb: "Hank Pym, a scientist who shrinks with his own particles and talks to ants through a cybernetic helmet." },
  { id: "shehulk", name: "She-Hulk", page: "She-Hulk", cats: ["hero", "avenger"], blurb: "Jennifer Walters, a lawyer who became a green giant after a blood transfusion from her cousin Bruce Banner." },
  { id: "shangchi", name: "Shang-Chi", page: "Shang-Chi", cats: ["hero", "avenger"], blurb: "A master of kung fu, trained from childhood." },
  { id: "jocasta", name: "Jocasta", cats: ["hero", "avenger", "ai"], blurb: "A robot Ultron built to be his bride, who turned against him and joined the Avengers." },
  { id: "cage", name: "Luke Cage", page: "Luke Cage", cats: ["hero", "avenger"], blurb: "A hero for hire whose skin became unbreakable in a prison experiment." },
  { id: "jessica", name: "Jessica Jones", page: "Jessica Jones", cats: ["hero", "avenger"], blurb: "A private investigator with super strength who once flew as a costumed hero." },
  { id: "druid", name: "Doctor Druid", page: "Doctor Druid", cats: ["hero", "avenger", "magic"], blurb: "Anthony Druid, a psychiatrist trained in the mystic arts, who served with the Avengers." },
  { id: "daredevil", name: "Daredevil", cats: ["hero", "avenger"], blurb: "Matt Murdock, a blind lawyer whose other senses are superhumanly sharp." },
  { id: "ironfist", name: "Iron Fist", page: "Iron Fist (character)", cats: ["hero", "avenger"], blurb: "Danny Rand, a martial artist who focuses the mystical chi of a dragon into his fist." },
  { id: "wolverine", name: "Wolverine", page: "Wolverine (character)", cats: ["hero", "avenger", "xmen", "mutant"], blurb: "Logan, a mutant with bone claws who heals from almost any wound." },
  { id: "storm", name: "Storm", page: "Storm (Marvel Comics)", cats: ["hero", "avenger", "xmen", "mutant"], blurb: "Ororo Munroe, a mutant who controls the weather." },
  { id: "cyclops", name: "Cyclops", page: "Cyclops (Marvel Comics)", cats: ["hero", "xmen", "mutant"], blurb: "Scott Summers, the X-Men’s field leader, whose eyes fire beams of force." },
  { id: "jean", name: "Jean Grey", page: "Jean Grey", cats: ["hero", "xmen", "mutant"], blurb: "A telepath and telekinetic, one of the first X-Men." },
  { id: "xavier", name: "Professor X", cats: ["hero", "xmen", "mutant"], blurb: "Charles Xavier, the telepath who founded the X-Men." },
  { id: "nightcrawler", name: "Nightcrawler", cats: ["hero", "xmen", "mutant"], blurb: "Kurt Wagner, a blue-skinned X-Man who looks like a demon and teleports in a puff of smoke." },
  { id: "magik", name: "Magik", cats: ["hero", "xmen", "mutant", "magic"], blurb: "Illyana Rasputina, a mutant who teleports and practises sorcery learned in the realm of Limbo." },
  { id: "surfer", name: "Silver Surfer", cats: ["hero", "alien"], blurb: "Norrin Radd of the planet Zenn-La, who rides the cosmos on a board, powered by the Power Cosmic." },
  { id: "gamora", name: "Gamora", cats: ["hero", "alien"], blurb: "The last of her people, raised by Thanos as an assassin, who later joined the Guardians of the Galaxy." },
  { id: "wong", name: "Wong", cats: ["hero", "magic"], blurb: "Doctor Strange’s friend and fellow student of the mystic arts." },
  { id: "machineman", name: "Machine Man", page: "Machine Man", cats: ["hero", "avenger", "ai", "tech"], blurb: "X-51, a robot with gadgets built into his body, whose maker, the scientist Abel Stack, raised him as a son." },
  { id: "android", name: "Human Torch (android)", page: "Human Torch (android)", cats: ["hero", "avenger", "ai"], blurb: "Jim Hammond, an android built in 1939 who bursts into flame in the open air." },
  // Villains
  { id: "doom", name: "Doctor Doom", cats: ["villain", "tech", "magic"], blurb: "Victor von Doom, ruler of Latveria, who fights in armour of his own design and studies sorcery." },
  { id: "loki", name: "Loki", cats: ["villain", "magic", "alien"], blurb: "Thor’s adoptive brother, a frost giant by birth and a trickster who casts spells." },
  { id: "thanos", name: "Thanos", cats: ["villain", "alien"], blurb: "An Eternal born on Titan, a moon of Saturn, who wants to win the love of Death." },
  { id: "ultron", name: "Ultron", cats: ["villain", "ai", "tech"], blurb: "A robot Hank Pym created, whose artificial intelligence turned against its maker and keeps building new bodies." },
  { id: "redskull", name: "Red Skull", cats: ["villain"], blurb: "Johann Schmidt, a Nazi agent and the villain Captain America has fought longest." },
  { id: "vulture", name: "Vulture", cats: ["villain", "tech"], blurb: "Adrian Toomes, an engineer who flies with a mechanical wing harness." },
  { id: "mysterio", name: "Mysterio", cats: ["villain", "tech"], blurb: "Quentin Beck, a special-effects artist whose illusions come from stage technology." },
  { id: "dormammu", name: "Dormammu", cats: ["villain", "magic", "alien"], blurb: "Ruler of the Dark Dimension, whose magic rivals that of Doctor Strange." },
  { id: "enchantress", name: "Enchantress", cats: ["villain", "magic", "alien"], blurb: "Amora, an Asgardian sorceress who bends men to her will with spells." },
  { id: "mordo", name: "Baron Mordo", cats: ["villain", "magic"], blurb: "Karl Mordo, Doctor Strange’s rival, a sorcerer who turned to black magic." },
  { id: "mastermold", name: "Master Mold", cats: ["villain", "ai", "tech"], blurb: "A giant robot that builds Sentinels to hunt mutants." },
  { id: "modok", name: "M.O.D.O.K.", cats: ["villain", "tech"], blurb: "George Tarleton, a man mutated into a giant head, who floats in a hover chair armed with weapons." },
  { id: "zemo", name: "Baron Zemo", cats: ["villain"], blurb: "Helmut Zemo, a German aristocrat who led the Masters of Evil against the Avengers." },
  { id: "kingpin", name: "Kingpin", cats: ["villain"], blurb: "Wilson Fisk, the crime boss of New York." },
  { id: "superskrull", name: "Super-Skrull", cats: ["villain", "alien"], blurb: "Kl’rt, a Skrull warrior given the powers of all four of the Fantastic Four." },
  { id: "abomination", name: "Abomination", page: "Abomination (character)", cats: ["villain"], blurb: "Emil Blonsky, a spy turned into a scaly gamma monster and the Hulk’s enemy." },
  { id: "foom", name: "Fin Fang Foom", page: "Fin Fang Foom", cats: ["villain", "alien"], blurb: "A giant dragon who is in fact an alien from the planet Kakaranathara." },
];

export const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));

export const character = (id: string) => {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`no character ${id}`);
  return c;
};

/** Membership is a lookup in the character's own row, never a rule between categories. */
export const isIn = (c: Character, cat: CatId) => c.cats.includes(cat);
