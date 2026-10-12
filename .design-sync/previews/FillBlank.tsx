import { FillBlank } from "log-log-legends-kit";
import { QUIZ } from "@/features/kit-page/toy-games";
import type { BlankRound } from "@/kit/QuizRun";

const noop = () => undefined;

// The quiz's fill-the-blank rounds (src/features/kit-page/toy-games.ts):
// the astronomer's line, the answer among three decoys.
export const Astronomer = () => <FillBlank round={QUIZ[7] as BlankRound} onAnswer={noop} seed={7} />;

// The sailor's line.
export const Sailor = () => <FillBlank round={QUIZ[8] as BlankRound} onAnswer={noop} seed={7} />;
