import { Campaign } from "@/features/cold-read/Campaign";
import { Frame } from "@/features/cold-read/Frame";

// Cold Read: the campaign through all five rounds, from TF-IDF to word
// vectors. Each round also has its own practice page, linked from the frame.
export default function Page() {
  return (
    <Frame round={0} home="./">
      <Campaign />
    </Frame>
  );
}
