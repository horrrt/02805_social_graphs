import { EgoEditor } from "log-log-legends-kit";
import { EGO } from "@/features/kit-page/toy-editors";

// The kit page's ego network: A and six candidate neighbours, four attached
// (src/features/kit-page/toy-editors.ts).
export const Toy = () => <EgoEditor focal={EGO.focal} neighbours={EGO.neighbours} initial={EGO.initial} seed={3} />;
