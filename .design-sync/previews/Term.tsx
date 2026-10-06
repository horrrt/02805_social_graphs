import { useLayoutEffect, useRef } from "react";
import { Term } from "log-log-legends-kit";

// A glossary term in Week 4's running text. The pop-up shows on hover and
// focus; the second cell pins it open with the is-open class, as a click does.
const fiscal = "The US government's year runs October to September: 2025 runs from October 2024 to September 2025.";

export const InSentence = () => (
  <p className="sub">
    The filings come from the same Department of Labor disclosures. Years are US{" "}
    <Term id="preview-term-fiscal-year" word="fiscal years">{fiscal}</Term>.
  </p>
);

export const PopUpOpen = () => {
  const box = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    box.current?.querySelector(".w4-term")?.classList.add("is-open");
  }, []);
  return (
    <p className="sub" ref={box} style={{ paddingBottom: 120 }}>
      <Term id="preview-term-modularity" word="Modularity">
        How much more of the link weight falls inside the groups than a random network would put there. Higher means cleaner groups.
      </Term>{" "}
      of the real firm–client network, real against rewired networks that keep everyone's number of partners.
    </p>
  );
};
