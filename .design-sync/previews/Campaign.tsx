import { Campaign, ColdReadRoot, Frame } from "log-log-legends-kit";

// The Cold Read campaign, all five rounds in a row, as /play/cold-read/ shows it.
export const CampaignPage = () => (
  <ColdReadRoot>
    <Frame page="campaign" home="./">
      <Campaign />
    </Frame>
  </ColdReadRoot>
);
