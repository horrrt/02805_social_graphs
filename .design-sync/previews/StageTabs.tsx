import { StageTabs } from "log-log-legends-kit";
import { NLP_STAGES } from "@/features/kit-page/toy-editors";

// The kit page's strip of stages, from counts to large language models
// (src/features/kit-page/toy-editors.ts); first stage open.
export const FirstStage = () => <StageTabs stages={NLP_STAGES} label="From counts to large language models" />;

// A later stage open.
export const LaterStage = () => <StageTabs stages={NLP_STAGES} initial={Math.min(3, NLP_STAGES.length - 1)} label="From counts to large language models" />;
