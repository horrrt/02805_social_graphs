// Shared layout for one essentials beat: big idea → stage → short reveal →
// evidence drawers. Keeps analytical claims in the section (tests pin them)
// while the visible hierarchy stays visual-first.
import type { ReactNode } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { PostSection } from "@/components/post/PostSection";
import { Essential } from "@/features/week06/Essentials";

type BeatId = "weights" | "cosine" | "contrast" | "topics" | "contexts" | "pmi" | "vectors" | "glove";

type Props = {
  id: BeatId;
  chapter?: string;
  idea: ReactNode;
  question: ReactNode;
  prompt?: ReactNode;
  reveal: ReactNode;
  evidence: ReactNode;
  method: ReactNode;
  essentials?: string;
};

export function StoryBeat({ id, chapter, idea, question, prompt, reveal, evidence, method, essentials }: Props) {
  return (
    <PostSection id={id} owner="Gyula">
      <article className="w6s-beat">
        {chapter ? <p className="w6s-chapter-tag">{chapter}</p> : null}
        <h2 className="w6s-idea">{idea}</h2>
        <p className="w6s-question">{question}</p>
        {prompt ? <p className="w6s-prompt">{prompt}</p> : null}
        <div className="w6s-stage" id={`${id}-figure`}>
          <Essential part={id} />
        </div>
        <div className="w6s-reveal">{reveal}</div>
        <Drawers variant="foot">
          <Drawer label="Evidence & baseline">{evidence}</Drawer>
          <Drawer label="Method">{method}</Drawer>
        </Drawers>
        {essentials ? <p className="w6s-uses">{`Uses: ${essentials}`}</p> : null}
      </article>
    </PostSection>
  );
}
