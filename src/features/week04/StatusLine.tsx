// A Week 4 part's one-line status: what is loading, or that its data did not
// load. Without it a failed load leaves an empty figure and a console line.

export const FAILED = "The data for this figure did not load.";

export function StatusLine({ text, id }: { text: string; id?: string }) {
  return (
    <p aria-live="polite" className="status-line" id={id}>
      {text}
    </p>
  );
}
