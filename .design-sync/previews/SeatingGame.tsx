import { SeatingGame } from "log-log-legends-kit";
import { KARATE, KARATE_NAMES, KARATE_SPLIT } from "@/features/kit-page/toy-games";

// The kit page's seating plan for Zachary's karate club, with the club's real
// split as the reference (src/features/kit-page/toy-games.ts), opened in the
// full room with two place cards laid: Mr Hi at table 1, the Officer at table 2.
export const TwoCards = () => (
  <SeatingGame n={34} edges={KARATE} names={KARATE_NAMES} reference={{ label: "the club's real split", partition: KARATE_SPLIT }} seed={2} preset={{ mode: "room", count: 2, cards: { 0: 0, 33: 1 } }} />
);
