// Loads Cold Read's real data files from public/ for component tests, and a
// shuffle that tests can repeat: with random() fixed at 0 the game's order is
// shuffled(items, zero), which a test computes to know the hidden answer.
import { readFileSync } from "node:fs";

const DIR = new URL("../../public/play/cold-read/data/", import.meta.url);

export const json = <T,>(name: string): T => JSON.parse(readFileSync(new URL(name, DIR), "utf8")) as T;

export function binary(name: string): ArrayBuffer {
  const b = readFileSync(new URL(name, DIR));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

export const zero = () => 0;

// global-jsdom opens about:blank, which has no localStorage (and Node's own
// needs a file); the games keep best scores there, so tests get an in-memory one.
{
  const store = new Map<string, string>();
  const memory = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });
}
