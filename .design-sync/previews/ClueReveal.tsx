import { ClueReveal } from "log-log-legends-kit";
import { QUIZ } from "@/features/kit-page/toy-games";
import type { ClueRound } from "@/kit/QuizRun";

// The quiz's first suspect round: whose toy page holds these words?
// (src/features/kit-page/toy-games.ts)
const round = QUIZ[0] as ClueRound;
const noop = () => undefined;

// Two of the four clues shown.
export const TwoClues = () => <ClueReveal round={round} onAnswer={noop} startAt={2} />;

// Every clue shown.
export const AllClues = () => <ClueReveal round={round} onAnswer={noop} startAt={4} />;
