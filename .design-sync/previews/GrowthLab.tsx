import { GrowthLab } from "log-log-legends-kit";
import { labRefShare, labReference } from "@/features/kit-page/toy-growth";

// The kit page's nonlinear-attachment lab, against a toy reference network
// of 303 nodes (src/features/kit-page/toy-growth.ts), opened on the grown
// network at α = 1.
export const Linear = () => <GrowthLab reference={labReference} refShare={labRefShare} sizes={[100, 300, 1000]} sweepNs={[300, 1000]} seed={2} start="grown" />;
