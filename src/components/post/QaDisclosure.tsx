// A disclosure (details.qa) with its cue in the summary and its body in
// div.qa-body. Week 4's panels add classes, data-box, a name and a body id;
// the attributes come in that order. Never rendered open (R5).
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = {
  id?: string;
  className?: string;
  box?: string;
  name?: string;
  cue: ReactNode;
  bodyClass?: string;
  bodyId?: string;
  children?: ReactNode;
};

export function QaDisclosure({ id, className = "qa", box, name, cue, bodyClass = "qa-body", bodyId, children }: Props) {
  return el(
    "details",
    { className, "data-box": box, id, name },
    <summary>
      <span className="qa-cue">{cue}</span>
    </summary>,
    el("div", { className: bodyClass, id: bodyId }, children),
  );
}
