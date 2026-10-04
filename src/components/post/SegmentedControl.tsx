"use client";
// A row of buttons that picks one value (.rx-seg, .axis-modes,
// .staffing-years), with week04-frame.js wireSegments' keyboard: Tab reaches
// the group once, on its pressed button (or the first enabled, visible one),
// and ArrowLeft, ArrowRight, Home and End move to another button and press it.
// The tab stops are rendered only once hydrated, since the server markup has
// none. The group's attributes follow the order the caller writes its props
// in, so the markup can match the JSX it replaces; a role the caller leaves
// out comes last.
import type { KeyboardEvent, ReactNode } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { useOwnedRef } from "@/lib/useOwnedRef";

export type SegmentButton = {
  value: string;
  label: ReactNode;
  dataAttr?: { name: string; value: string };
  disabled?: boolean;
  hidden?: boolean;
};

export type SegmentedControlProps = {
  className?: string;
  role?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  buttons: SegmentButton[];
  value: string | null;
  onChange: (value: string) => void;
};

const GROUP_ATTRS = { className: "className", role: "role", id: "id", ariaLabel: "aria-label", ariaLabelledBy: "aria-labelledby" } as const;
const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

export function SegmentedControl(props: SegmentedControlProps) {
  const { buttons, value, onChange } = props;
  const hydrated = useHydrated();
  const owned = useOwnedRef();

  const attrs: Record<string, string> = {};
  for (const key of Object.keys(props)) {
    const name = GROUP_ATTRS[key as keyof typeof GROUP_ATTRS];
    const v = props[key as keyof typeof GROUP_ATTRS];
    if (name && v !== undefined) attrs[name] = v;
  }
  if (!("role" in attrs)) attrs.role = "group";

  const live = buttons.filter((b) => !b.disabled && !b.hidden);
  const stop = live.find((b) => b.value === value) ?? live[0];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // week04-frame.js wireSegments, while it still runs, has handled the key already.
    if (!KEYS.has(event.key) || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.tagName !== "BUTTON") return;
    const group = [...event.currentTarget.querySelectorAll("button")].filter((b) => !b.disabled && !b.hidden);
    const i = group.indexOf(target as HTMLButtonElement);
    if (i < 0 || !group.length) return;
    const n = group.length;
    const next = { ArrowLeft: group[(i - 1 + n) % n], ArrowRight: group[(i + 1) % n], Home: group[0], End: group[n - 1] }[event.key]!;
    event.preventDefault();
    next.focus();
    next.click();
  }

  return (
    <div {...attrs} ref={owned} onKeyDown={onKeyDown}>
      {buttons.map((b) => {
        const data = b.dataAttr ? { [`data-${b.dataAttr.name}`]: b.dataAttr.value } : {};
        const tabStop = hydrated && !b.disabled && !b.hidden ? (b === stop ? 0 : -1) : undefined;
        return (
          <button
            key={b.value}
            aria-pressed={b.value === value ? "true" : "false"}
            {...data}
            type="button"
            disabled={b.disabled}
            hidden={b.hidden}
            tabIndex={tabStop}
            onClick={() => onChange(b.value)}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
