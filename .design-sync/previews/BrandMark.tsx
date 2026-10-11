import { BrandMark } from "log-log-legends-kit";

// The brand takes its colours from the topbar's tokens, so it sits in the bar's markup.
export const InTopbar = () => (
  <div className="topbar">
    <div className="shell">
      <BrandMark href="../../" />
    </div>
  </div>
);
