import { PostTopbar } from "@/components/site/PostTopbar";
// The skip link and the top bar: brand and the site nav, as on Weeks 4 and 5.
export function Topbar() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <PostTopbar root="../../" current="weeks/week03/" />
    </>
  );
}
