import { PackControls, PackResults } from "@/features/week01/packs/PackMachine";

// "Open a pack": the pack machine. Its islands (src/features/week01/packs/)
// wire the controls and draw the status, the tray and the three counts.
export function TryIt() {
  return (
    <>
      <span className="anchor" id="try-it"></span>
      <header className="w12-opener">
        <span aria-hidden="true" className="w12-opener-num">1</span>
        <div>
          <h2>Open a pack</h2>
          <p className="w12-scope">Five cards per pack · you can get repeats</p>
        </div>
      </header>
      <section aria-label="Open a pack" className="section interaction-panel" id="pack-machine">
        <PackControls />
        <p className="fine">
          Our rule: the more articles mention a character, the more often its
          card appears. Every card still has a chance. This is a game rule, not
          a measure of fame.
        </p>
        <PackResults />
      </section>
    </>
  );
}
