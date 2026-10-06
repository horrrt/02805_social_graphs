// The site's name as a link home. The topbars write it as text with LEGENDS in
// bold; the design archive and the play page (mark) put an arrow before it and
// break the line.
type Props = { href: string; mark?: boolean };

export function BrandMark({ href, mark }: Props) {
  if (mark)
    return (
      <a className="brand" href={href} aria-label="Log-Log Legends home">
        <span className="brand-mark" aria-hidden="true">↗</span>
        <span>
          LOG–LOG
          <br />
          LEGENDS
        </span>
      </a>
    );
  return (
    <a className="brand" href={href}>
      LOG–LOG
      {" "}
      <b>LEGENDS</b>
    </a>
  );
}
