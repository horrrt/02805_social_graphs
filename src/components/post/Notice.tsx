// A notice: div.notice with its icon (span.ico) and its text in a span.
// gap writes the {" "} most notices have between the two spans; a headline
// goes first in bold, followed by {" "} and the children. bodyId is the id
// some pages give the text span.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = {
  id?: string;
  icon: ReactNode;
  headline?: ReactNode;
  gap?: boolean;
  bodyId?: string;
  children?: ReactNode;
};

export function Notice({ id, icon, headline, gap, bodyId, children }: Props) {
  const lead = headline !== undefined && <b>{headline}</b>;
  return el(
    "div",
    { className: "notice", id },
    <span className="ico">{icon}</span>,
    gap && " ",
    el("span", { id: bodyId }, lead, lead && children !== undefined && " ", children),
  );
}
