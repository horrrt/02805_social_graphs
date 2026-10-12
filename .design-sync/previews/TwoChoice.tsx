import { TwoChoice } from "log-log-legends-kit";
import { QUIZ } from "@/features/kit-page/toy-games";
import type { TwoRound } from "@/kit/QuizRun";

// The quiz's first which-is-real round (src/features/kit-page/toy-games.ts).
const round = QUIZ[4] as TwoRound;
const noop = () => undefined;

export const Unanswered = () => <TwoChoice round={round} onAnswer={noop} />;

// Answered with the real sentence: the why shows.
export const Answered = () => <TwoChoice round={round} onAnswer={noop} answered={0} />;
