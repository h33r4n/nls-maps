// Tiny shared store so the background GPS task and the screen see the same numbers.
export type Fix = { lat: number; lng: number; speed: number | null; time: number };

type State = {
  gpsOn: boolean;
  islandId: string | null;
  fixes: number;
  backgroundFixes: number;
  last: Fix | null;
  appActive: boolean;
  error: string | null;
};

const state: State = {
  gpsOn: false,
  islandId: null,
  fixes: 0,
  backgroundFixes: 0,
  last: null,
  appActive: true,
  error: null,
};

const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State>) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
