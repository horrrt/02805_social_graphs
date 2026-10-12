import { PathQuest } from "log-log-legends-kit";
import { TOWN, TOWN_LINKS } from "@/features/kit-page/toy-games";

// The kit page's round trip on a toy one-way town of 30 pages
// (src/features/kit-page/toy-games.ts): its start panel, and a run two moves
// in, out from the Town Hall via the Market to the Bakery, with the map zoomed
// to the seven pages seen so far.
export const Start = () => <PathQuest names={TOWN} edges={TOWN_LINKS} homes={[0, 12, 9]} seed={3} />;

export const TwoMoves = () => <PathQuest names={TOWN} edges={TOWN_LINKS} homes={[0, 12, 9]} seed={3} preset={{ home: 0, target: 3, moves: [1, 2] }} />;
