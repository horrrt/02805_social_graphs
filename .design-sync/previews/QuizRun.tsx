import { QuizRun } from "log-log-legends-kit";
import { QUIZ } from "@/features/kit-page/toy-games";

// The kit page's quiz on toy word bags and sentences
// (src/features/kit-page/toy-games.ts), at its start screen.
export const Start = () => <QuizRun rounds={QUIZ} lengths={[4, 8]} seed={7} />;

// A run of four, opened on its first round.
export const FirstRound = () => <QuizRun rounds={QUIZ} lengths={[4, 8]} seed={7} preset={{ settings: { length: "4", types: "mixed" } }} />;
