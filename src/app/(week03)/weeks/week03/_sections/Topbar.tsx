import { PostTopbar } from "@/components/site/PostTopbar";
import { StyleMenu } from "@/features/week03/menu/StyleMenu";
// The skip link and the top bar: brand, the Views menu host and the site nav.
export function Topbar() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <PostTopbar root="../../" current="weeks/week03/">
        <StyleMenu />
      </PostTopbar>
    </>
  );
}
