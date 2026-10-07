// Loads round 5's word vectors: the JSON through the site's loader, the int8
// rows through fetch. Used by the Hot & Cold island and by the campaign.
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/useData";
import { asset } from "@/scripts/site.js";
import { type HotColdData, type HotColdMeta, prepare } from "./vectors";

const META = "play/cold-read/data/hot_cold.json";
const BIN = "play/cold-read/data/hot_cold.bin";

export function useVectors(enabled: boolean): { data: HotColdData | null; error: unknown } {
  const meta = useData<HotColdMeta>(enabled ? asset(META) : null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetch(asset(BIN))
      .then((r) => {
        if (!r.ok) throw new Error(`${BIN}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => live && setBuffer(b))
      .catch((e: unknown) => live && setFailed(e));
    return () => {
      live = false;
    };
  }, [enabled]);
  const data = useMemo(() => (meta.data && buffer ? prepare(meta.data, buffer) : null), [meta.data, buffer]);
  return { data, error: meta.status === "error" ? meta.error : failed };
}
