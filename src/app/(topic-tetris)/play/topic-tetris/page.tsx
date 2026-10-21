import { Frame } from "@/features/topic-tetris/Frame";
import { TopicTetris } from "@/features/topic-tetris/TopicTetris";

// Topic Tetris: the Week 7 game. The data comes from analysis/week07_topic_tetris.py;
// the rules are in src/features/topic-tetris/rules.ts.
export default function Page() {
  return (
    <Frame root="../../">
      <TopicTetris />
    </Frame>
  );
}
