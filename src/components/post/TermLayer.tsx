"use client";
// Week 4's click and Escape handling for glossary terms (week04-frame.js
// wireReveals), as termStore changes: a click on a term's button toggles that
// term and closes the others, any other click closes them all, and Escape
// closes them all and moves focus off a term button, since
// .w4-term:focus-within keeps its pop-up open. Renders nothing; mount one per
// page, on Week 4 only.
import { useDocumentEvent } from "@/lib/useEvents";
import { termStore } from "./Term";

export function TermLayer() {
  useDocumentEvent("click", (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest(".w4-term > button") : null;
    const id = button?.getAttribute("aria-describedby") ?? null;
    termStore.setState((s) => ({ open: id !== null && s.open !== id ? id : null }));
  });
  useDocumentEvent("keydown", (event) => {
    if (event.key !== "Escape") return;
    termStore.setState({ open: null });
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest(".w4-term")) active.blur();
  });
  return null;
}
