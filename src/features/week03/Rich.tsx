// The HTML strings corridor.js, questions.js and echarts-views.js build from
// the page's own data (<b>, <span style>, <li>, the inspector's <div><dt>…),
// rendered as React elements instead of written with innerHTML. Only the tags
// and attributes those builders write are understood.
import { createElement, Fragment, type ReactNode } from "react";

const VOID = new Set(["br", "hr", "img", "input"]);
const ATTRS: Record<string, string> = { class: "className", for: "htmlFor", colspan: "colSpan", rowspan: "rowSpan", tabindex: "tabIndex" };
const ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };

const decode = (text: string) =>
  text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (whole, name: string) => {
    if (name[0] === "#") return String.fromCodePoint(name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
    return ENTITIES[name] ?? whole;
  });

function styleObject(text: string) {
  const out: Record<string, string> = {};
  for (const part of text.split(";")) {
    const at = part.indexOf(":");
    if (at < 0) continue;
    const name = part.slice(0, at).trim();
    if (!name) continue;
    const key = name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = part.slice(at + 1).trim();
  }
  return out;
}

function props(text: string, key: number) {
  const out: Record<string, unknown> = { key };
  for (const m of text.matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)) {
    const name = m[1].toLowerCase();
    const value = m[2] === undefined ? "" : decode(m[2]);
    if (name === "style") out.style = styleObject(value);
    else out[ATTRS[name] ?? name] = m[2] === undefined && !name.startsWith("data-") && !name.startsWith("aria-") ? true : value;
  }
  return out;
}

type Node = { tag: string; attrs: string; children: (Node | string)[] };

function parse(html: string): (Node | string)[] {
  const root: Node = { tag: "", attrs: "", children: [] };
  const stack = [root];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+|<)/g)) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) {
      top.children.push(decode(m[5]));
      continue;
    }
    const tag = m[2].toLowerCase();
    if (m[1]) {
      // Close the nearest open element of this name and everything above it.
      for (let i = stack.length - 1; i > 0; i--)
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      continue;
    }
    const node: Node = { tag, attrs: m[3], children: [] };
    top.children.push(node);
    if (!m[4] && !VOID.has(tag)) stack.push(node);
  }
  return root.children;
}

function build(nodes: (Node | string)[]): ReactNode[] {
  return nodes.map((node, i) =>
    typeof node === "string"
      ? node
      : createElement(node.tag, props(node.attrs, i), ...(VOID.has(node.tag) ? [] : build(node.children))),
  );
}

/** The elements an HTML string from the page's builders describes. */
export function rich(html: string | null | undefined): ReactNode {
  if (!html) return null;
  return createElement(Fragment, null, ...build(parse(html)));
}
