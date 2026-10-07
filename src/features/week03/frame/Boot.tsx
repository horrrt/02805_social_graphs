"use client";
// What week03-boot.js boot() and corridor.js main() did before the page drew:
// read the style dimensions from the URL and put them on <body>, load the
// chosen renderer's library and install its module, load the five data files,
// and start the engine once all of that is in. Also the page-wide listeners
// main() added after the data: the window resize, the glossary hover. It
// renders the one tooltip every chart shares. The status line under the hero
// says where the loading is.
import { useEffect, useState } from "react";
import { island } from "@/lib/island";
import { ChartTip } from "@/lib/ChartTip";
import { useBodyDataset } from "@/lib/useBody";
import { useData } from "@/lib/useData";
import { useDocumentEvent } from "@/lib/useEvents";
import { useHydrated } from "@/lib/useHydrated";
import { useVendor } from "@/lib/useVendor";
import { api, applyStyle, glossaryMove, installRenderer, resized, restyle, start } from "@/scripts/corridor.js";
import { asset } from "@/scripts/site.js";
import { RENDERERS, readStyle } from "@/scripts/week03-boot.js";
import { corridor, useCorridor, type Style } from "./shared";

type Renderer = { label: string; bytes: number; script?: string; global?: string; module?: () => Promise<{ install: (api: unknown, lib: unknown) => object }> };
const REGISTRY = RENDERERS as Record<string, Renderer>;

const file = (name: string) => asset(`assets/data/${name}`);

function BootService() {
  const hydrated = useHydrated();
  const style = useCorridor((s) => s.style);
  const status = useCorridor((s) => s.status);

  // The style comes from the URL, so it is read once the page is in the browser.
  useEffect(() => {
    if (hydrated && !corridor.getState().style) corridor.setState({ style: readStyle() as Style });
  }, [hydrated]);

  // The body carries four of the dimensions for the stylesheet; the engine
  // reads the rest. A change after the first paint repaints everything.
  useBodyDataset({ variant: style?.variant, palette: style?.palette, tables: style?.tables, skin: style?.skin }, Boolean(style));
  useEffect(() => {
    if (!style) return;
    applyStyle(style);
    // Only a new choice repaints; the first paint is start()'s.
    if (corridor.getState().status === "ready") restyle();
  }, [style]);

  // The renderer: canvas needs nothing, the others a vendored library and a
  // variant module. A broken renderer must not take the post down with it.
  const renderer = style ? REGISTRY[style.variant] : null;
  const vendor = useVendor(renderer?.script ?? "none", renderer?.global ?? "none", { enabled: Boolean(renderer?.script) });
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (!style || !renderer || installed) return;
    if (!renderer.script || !renderer.module) {
      setInstalled(true);
      return;
    }
    const fail = (error: Error) => {
      corridor.setState({
        message:
          `The ${renderer.label} renderer failed to load (${error.message}); ` +
          "showing the canvas version instead.",
        style: { ...style, variant: "canvas" },
        renderer: "canvas",
      });
      console.error(error);
      setInstalled(true);
    };
    if (vendor.status === "error") {
      fail(vendor.error as Error);
      return;
    }
    if (vendor.status !== "ready") return;
    let live = true;
    renderer.module().then(
      ({ install }) => {
        if (!live) return;
        try {
          installRenderer({ name: style.variant, ...install(api, vendor.lib) });
          corridor.setState({ renderer: style.variant });
          setInstalled(true);
        } catch (error) {
          fail(error as Error);
        }
      },
      (error: Error) => {
        if (live) fail(error);
      },
    );
    return () => {
      live = false;
    };
  }, [style, renderer, vendor, installed]);

  // The data. The cartography and the outlines are optional: a page that
  // still works without its roles or its land is better than one that fails
  // to open without them.
  const corridors = useData(hydrated ? file("week03_corridors.json") : null);
  const edges = useData(hydrated ? file("week03_edges.json") : null);
  const flights = useData(hydrated ? file("week03_flights.json") : null);
  const cart = useData(hydrated ? file("week03_cartography.json") : null);
  const world = useData(hydrated ? file("world_outline.geo.json") : null);
  const settled = (s: { status: string }) => s.status === "ready" || s.status === "error";
  useEffect(() => {
    if (corridor.getState().status !== "loading") return;
    const failed = [corridors, edges, flights].find((s) => s.status === "error");
    if (failed) {
      const error = failed.error as Error;
      corridor.setState({ status: "error", message: `Could not load the corridor data: ${error?.message}` });
      console.error(error);
      return;
    }
    if (!installed || ![corridors, edges, flights].every((s) => s.status === "ready") || !settled(cart) || !settled(world)) return;
    start({ corridors: corridors.data, edges: edges.data, flights: flights.data, cart: cart.data ?? null, world: world.data ?? null });
  }, [installed, corridors, edges, flights, cart, world]);

  // After the data: the window resize, the glossary, and the scroll position
  // a renderer switch carried across its reload.
  useEffect(() => {
    if (status !== "ready") return;
    // Exposed for scripts/audit_week03.js, which checks that every control on
    // the page actually moves something in every renderer.
    (window as unknown as { api: unknown }).api = api;
    const controller = new AbortController();
    window.addEventListener("resize", () => resized(), { signal: controller.signal });
    restoreScroll();
    return () => controller.abort();
  }, [status]);
  useDocumentEvent("pointermove", (event) => {
    if (corridor.getState().status === "ready") glossaryMove(event);
  });

  return <ChartTip />;
}

function restoreScroll() {
  let saved = null;
  try {
    saved = sessionStorage.getItem("week03-scroll");
    sessionStorage.removeItem("week03-scroll");
  } catch {
    return;
  }
  if (saved === null) return;
  // The charts size themselves after the data lands, so the page is only as
  // tall as it will be once a frame has passed.
  requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, Number(saved))));
}

export const Boot = island("week03/frame/Boot", BootService, () => null, { roots: "none", affects: "page" });

function StatusLine() {
  const message = useCorridor((s) => s.message);
  return (
    <p aria-live="polite" className="status-line" id="status">
      {message ?? "Loading the corridor data…"}
    </p>
  );
}

function StatusPlaceholder() {
  return (
    <p aria-live="polite" className="status-line" id="status">
      Loading the corridor data…
    </p>
  );
}

export const Status = island("week03/frame/Status", StatusLine, StatusPlaceholder, { roots: ["#status"] });
