import { AttackGame } from "log-log-legends-kit";
import { KARATE, KARATE_NAMES } from "@/features/kit-page/toy-games";

// The kit page's attack on Zachary's karate club
// (src/features/kit-page/toy-games.ts), opened mid-run: a budget of 5, Mr Hi
// already hit.
export const OneHit = () => <AttackGame n={34} edges={KARATE} names={KARATE_NAMES} budgets={[3, 5, 8]} seed={5} preset={{ budget: 5, hits: [0] }} />;
