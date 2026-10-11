import type { ReactNode } from "react";
import { Card, Anatomy } from "log-log-legends-kit";

// On the site the box fills the right column of the white opening card (w4-two),
// about 596px wide on the 1180px page; the card shows it in a card of that width.
const Column = ({ children }: { children: ReactNode }) => (
  <Card className="card w4-card" style={{ maxWidth: 640 }}>
    {children}
  </Card>
);

// Week 5: how each section card reads.
export const Week5 = () => (
  <Column>
    <Anatomy
      title="How each section reads"
      intro="Every section answers one question on one card."
      rows={[
        { term: "Question", def: "What we asked, and the short answer" },
        { term: "Did", def: "What we did, beside what to notice" },
        { term: "Figure", def: "The chart or table that answers it" },
        { term: "Drawers", def: "Method and its limits, more numbers, and the passages we read" },
      ]}
    />
  </Column>
);

// Week 4: the fields of one filing, each tagged with the section that uses it.
export const WithTags = () => (
  <Column>
    <Anatomy
      title="What one filing names"
      intro="Each section builds its network from one of these fields."
      rows={[
        { term: "Employer", def: "The company asking to hire", tag: "Links all three networks", tagClass: "w4-tag access" },
        { term: "Worksite", def: "A city, grouped into its metro area", tag: "1 · Where" },
        { term: "Occupation", def: "The job, as an official occupation code", tag: "2 · Jobs" },
        { term: "Client", def: "The company the worker is placed at, when it is not the employer", tag: "3 · Staffing" },
        { term: "Wage level", def: "I (entry) to IV (fully competent)", tag: "5 · Beyond" },
        { term: "Law firm", def: "Who prepared the filing", tag: "5 · Beyond" },
      ]}
    />
  </Column>
);
