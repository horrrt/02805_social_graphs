import { useState } from "react";
import { VectorAngle } from "log-log-legends-kit";
import { vecA, vecB } from "@/features/kit-page/toy";

// The kit page's two toy document vectors (src/features/kit-page/toy.ts)
// and the angle between them; the slider scales D2.
export const TwoDocuments = () => {
  const [k, setK] = useState(1);
  return <VectorAngle a={vecA} b={vecB} labels={{ a: "D1", b: "D2" }} scaleB={k} onScaleB={setK} />;
};

// D2 scaled to twice its length: the angle, and so the cosine, stays put.
export const Scaled = () => {
  const [k, setK] = useState(2);
  return <VectorAngle a={vecA} b={vecB} labels={{ a: "D1", b: "D2" }} scaleB={k} onScaleB={setK} />;
};
