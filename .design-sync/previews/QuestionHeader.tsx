import { QuestionHeader } from "log-log-legends-kit";

// The header at the top of a card: number, question and short answer; a
// header with no question shows a kicker; a header with no number sits in a
// grid cell. Text from Week 5 section 6 and Week 4 section 1.
export const NumberQuestionAnswer = () => (
  <div className="card w4-card w5-card">
    <QuestionHeader
      id="fame-asked"
      num="6A"
      question="Do characters that more pages link to get longer Wikipedia pages?"
      answer="Yes, and strongly (Pearson 0.77, Spearman 0.75)."
    />
  </div>
);

export const Kicker = () => (
  <div className="card w4-card">
    <QuestionHeader num="Start" kicker="The opening questions, side by side, before 1A" />
  </div>
);

export const NoNumber = () => (
  <div className="card w4-card">
    <QuestionHeader question="Which cities hire the most?" answer="San Jose asks for the most positions; New York has the most employers." />
  </div>
);
