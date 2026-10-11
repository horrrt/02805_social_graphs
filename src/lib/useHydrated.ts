// False on the server and for the hydration render, true from the render
// React runs right after the hydration commit (spike.md, finding d). An
// island renders its server markup until this is true.
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
