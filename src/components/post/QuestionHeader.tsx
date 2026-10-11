// The question at the top of a card (header.w4-q): an optional number, then
// the question and its short answer. A header without a question shows a
// kicker line instead. answerAttrs go on the answer after its class, in the
// order given (an id, or a data-* hook a script fills).
import type { ReactNode } from "react";
import { el } from "@/components/site/el";

type Props = {
  id?: string;
  num?: ReactNode;
  question?: ReactNode;
  kicker?: ReactNode;
  answer?: ReactNode;
  answerAttrs?: Record<string, string>;
};

export function QuestionHeader({ id, num, question, kicker, answer, answerAttrs }: Props) {
  return el(
    "header",
    { className: "w4-q", id },
    num !== undefined && <span className="w4-num">{num}</span>,
    el(
      "div",
      null,
      question !== undefined ? <h2>{question}</h2> : <p className="rx-kicker">{kicker}</p>,
      answer !== undefined && el("p", { className: "w4-answer", ...answerAttrs }, answer),
    ),
  );
}
