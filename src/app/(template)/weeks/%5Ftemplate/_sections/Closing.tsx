import { ClosingCard } from "@/components/post/ClosingCard";
import { Notice } from "@/components/post/Notice";
import { PostSection } from "@/components/post/PostSection";
import { QaDisclosure } from "@/components/post/QaDisclosure";
import { SectionOpener } from "@/components/post/SectionOpener";

// Closing: the takeaway, one limit, one next step; methods and the AI-use note one click away.
export function Closing() {
  return (
    <PostSection id="closing" owner="">
      <SectionOpener num="✓" title="Closing">The takeaway in one line.</SectionOpener>
      <ClosingCard
        takeaway="The takeaway with the sections' key numbers, each against its baseline."
        limit={
          <Notice icon="!" gap headline="One important limit">
            The limit that applies to the whole post.
          </Notice>
        }
        next={
          <>
            <b>Next step.</b>
            {" "}
            One meaningful next step, such as next week's method applied to this data.
          </>
        }
      >
        <QaDisclosure id="methods" cue="Methods, data and AI use">
          <p className="sub">
            Data: the source, its licence and the date it was frozen. Every random step has a fixed seed.
          </p>
          <ul className="w5-methods">
            <li>
              <b>1 · analysis/weekNN_first.py</b>
              {" "}
              The method and its baseline, in one line.
            </li>
            <li>
              <b>2 · analysis/weekNN_second.py</b>
              {" "}
              The method and its baseline, in one line.
            </li>
          </ul>
        </QaDisclosure>
        <QaDisclosure id="closing-ai" cue="AI use and how we checked it">
          <p className="sub">What AI assistants did: code, drafts, revisions, browser tests.</p>
          <p className="sub">
            How we checked it: each script writes the numbers its section quotes to a JSON file, a schema check tests the file, the site tests fail when the page and the file disagree, and the scripts rerun identically under two hash seeds.
          </p>
        </QaDisclosure>
      </ClosingCard>
    </PostSection>
  );
}
