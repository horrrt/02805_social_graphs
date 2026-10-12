import { PathQuest } from "log-log-legends-kit";
import { TOWN, TOWN_LINKS } from "@/features/kit-page/toy-games";

// The kit page's round trip on a toy one-way town of 30 pages
// (src/features/kit-page/toy-games.ts), on its start panel: pick a home and
// how far out, then set out. Mid-run the map shows only the pages seen so
// far, which squeezes into a corner of the card, so the card shows the start.
export const Start = () => <PathQuest names={TOWN} edges={TOWN_LINKS} homes={[0, 12, 9]} seed={3} />;
