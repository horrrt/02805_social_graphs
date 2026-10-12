import { NullBars } from "log-log-legends-kit";
import { linkRows } from "@/features/kit-page/toy-distributions";

// The kit page's link-type bars: toy counts of each link type against
// shuffled labels (src/features/kit-page/toy-distributions.ts).
export const LinkTypes = () => <NullBars rows={linkRows} xLabel="links of each type (toy)" />;
