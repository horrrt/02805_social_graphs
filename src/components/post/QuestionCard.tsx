// The Week 5 card the template copies: the question (#<section>-asked), what
// we did (#<section>-did) and what to notice (#<section>-surprise), the figure
// (#<section>-figure), then the drawers as children. layout "beside" puts the
// figure in the right column of .w4-two; "below" puts it under the two
// columns in div.w5-fig.
import type { ReactNode } from "react";
import { el } from "@/components/site/el";
import { QuestionHeader } from "./QuestionHeader";

type Props = {
  section: string;
  className?: string;
  num: ReactNode;
  question: ReactNode;
  answer: ReactNode;
  did: ReactNode;
  surprise: ReactNode;
  figure: ReactNode;
  layout: "beside" | "below";
  children?: ReactNode;
};

export function QuestionCard(props: Props) {
  const { section, className = "card w4-card w5-card", num, question, answer, did, surprise, figure, layout, children } = props;
  const didBox = <div id={`${section}-did`}>{did}</div>;
  const surpriseBox = <div id={`${section}-surprise`}>{surprise}</div>;
  const header = <QuestionHeader id={`${section}-asked`} num={num} question={question} answer={answer} />;
  if (layout === "beside")
    return el(
      "div",
      { className },
      header,
      <div className="w4-two">
        <div>
          {didBox}
          {surpriseBox}
        </div>
        <div id={`${section}-figure`}>{figure}</div>
      </div>,
      children,
    );
  return el(
    "div",
    { className },
    header,
    <div className="w4-two">
      {didBox}
      {surpriseBox}
    </div>,
    <div className="w5-fig" id={`${section}-figure`}>
      {figure}
    </div>,
    children,
  );
}
