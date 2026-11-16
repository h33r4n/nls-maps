// Turn-by-turn engine. Runs on GPS fixes from the background task, so it keeps working with the screen locked.
import * as LiveActivity from 'expo-live-activity';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { fmtDist, fmtDur, metres, snapToLine, type LL } from './geo';
import { arrowFor, getRoute, type Mode, type Route } from './routing';

export const GPS_TASK = 'nls-background-gps';

export type Dest = { name: string; lat: number; lng: number };

export type NavState = {
  active: boolean;
  route: Route | null;
  dest: Dest | null;
  mode: Mode;
  step: number; // index of the NEXT manoeuvre
  toNext: number; // metres to the next manoeuvre
  remaining: number; // metres left
  remainingS: number; // seconds left
  arrived: boolean;
  rerouting: boolean;
  voice: boolean;
  error: string | null;
};

let s: NavState = {
  active: false,
  route: null,
  dest: null,
  mode: 'car',
  step: 1,
  toNext: 0,
  remaining: 0,
  remainingS: 0,
  arrived: false,
  rerouting: false,
  voice: false,
  error: null,
};

const subs = new Set<() => void>();
export const getNav = () => s;
export function subscribeNav(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
function set(patch: Partial<NavState>) {
  s = { ...s, ...patch };
  subs.forEach((f) => f());
}

// ---------- Dynamic Island ----------
let islandId: string | null = null;
let lastIslandKey = '';
let lastIslandAt = 0;

function islandContent(): LiveActivity.LiveActivityState {
  const r = s.route;
  const st = r?.steps[s.step];
  if (s.arrived) return { title: '◉ Arrived', subtitle: s.dest?.name ?? '', progressBar: { progress: 1 } };
  const done = r ? Math.min(1, Math.max(0, 1 - s.remaining / r.distance)) : 0;
  return {
    title: `${arrowFor(st)} ${fmtDist(s.toNext)}`,
    subtitle: st ? st.text : 'Navigating',
    progressBar: { progress: done },
  };
}

function pushIsland(force = false) {
  try {
    const content = islandContent();
    const key = `${content.title}|${content.subtitle}`;
    const now = Date.now();
    if (!islandId) {
      const id = LiveActivity.startActivity(content, {
        backgroundColor: '#0B0B0B',
        titleColor: '#FFFFFF',
        subtitleColor: '#A8A8A8',
        progressViewTint: '#FFFFFF',
        progressViewLabelColor: '#FFFFFF',
        padding: { horizontal: 18, vertical: 14 },
      });
      islandId = id || null;
      lastIslandKey = key;
      lastIslandAt = now;
      return;
    }
    if (!force && key === lastIslandKey && now - lastIslandAt < 15000) return;
    if (!force && now - lastIslandAt < 2000) return;
    LiveActivity.updateActivity(islandId, content);
    lastIslandKey = key;
    lastIslandAt = now;
  } catch {
    // Island is a nice-to-have; never break navigation over it.
  }
}

function endIsland() {
  if (!islandId) return;
  try {
    LiveActivity.stopActivity(islandId, islandContent());
  } catch {}
  islandId = null;
}

// ---------- voice ----------
const spoken = new Set<string>();
function say(key: string, text: string) {
  if (!s.voice || spoken.has(key)) return;
  spoken.add(key);
  Speech.stop();
  Speech.speak(text, { language: 'en-AU', rate: 1.0 });
}
export function setVoice(on: boolean) {
  set({ voice: on });
  if (!on) Speech.stop();
}

// ---------- engine ----------
let offCount = 0;
let lastReroute = 0;

function computeFrom(me: LL) {
  const r = s.route;
  if (!r) return;
  const snap = snapToLine(me, r.coords);
  // distance along route at each manoeuvre (cumulative step distances)
  let acc = 0;
  let next = r.steps.length - 1;
  for (let i = 0; i < r.steps.length; i++) {
    if (acc > snap.along + 5) {
      next = i;
      break;
    }
    acc += r.steps[i].distance;
  }
  // acc is now the along-distance of step `next`'s manoeuvre
  const cum = r.steps.slice(0, next).reduce((a, st) => a + st.distance, 0);
  const toNext = Math.max(0, cum - snap.along);
  const remaining = Math.max(0, r.distance - snap.along);
  const remainingS = r.distance > 0 ? (r.duration * remaining) / r.distance : 0;
  const prevStep = s.step;
  set({ step: Math.max(1, next), toNext, remaining, remainingS });

  const st = r.steps[Math.max(1, next)];
  if (st) {
    const near = r.mode === 'car' ? 250 : 60;
    if (prevStep !== s.step) say(`go-${s.step}`, `${st.text}${toNext > near ? `, in ${fmtDist(toNext)}` : ''}`);
    if (toNext < near) say(`near-${s.step}`, st.text);
  }

  const arriveAt = r.mode === 'car' ? 35 : 20;
  if (metres(me, { lat: r.coords[r.coords.length - 1][1], lng: r.coords[r.coords.length - 1][0] }) < arriveAt) {
    set({ arrived: true, toNext: 0, remaining: 0, remainingS: 0 });
    say('arrived', `You have arrived at ${s.dest?.name ?? 'your destination'}`);
    pushIsland(true);
    return { off: 0 };
  }
  pushIsland(prevStep !== s.step);
  return { off: snap.off };
}

export async function onFix(me: LL) {
  if (!s.active || !s.route || s.arrived) return;
  const res = computeFrom(me);
  if (!res) return;
  const limit = s.route.mode === 'car' ? 60 : 35;
  offCount = res.off > limit ? offCount + 1 : 0;
  if (offCount >= 3 && Date.now() - lastReroute > 15000 && s.dest && !s.rerouting) {
    lastReroute = Date.now();
    offCount = 0;
    set({ rerouting: true });
    try {
      const route = await getRoute(me, s.dest, s.mode);
      spoken.clear();
      set({ route, step: 1, rerouting: false, error: null });
      say('reroute', 'Rerouting');
      computeFrom(me);
    } catch (e) {
      set({ rerouting: false, error: 'Could not reroute — check your signal' });
    }
  }
}

export async function startNav(route: Route, dest: Dest, me: LL | null): Promise<string | null> {
  spoken.clear();
  offCount = 0;
  set({ active: true, route, dest, mode: route.mode, step: 1, arrived: false, rerouting: false, error: null, remaining: route.distance, remainingS: route.duration, toNext: route.steps[1]?.distance ?? route.steps[0]?.distance ?? 0 });
  if (me) computeFrom(me);
  pushIsland(true);
  // Keep GPS running with the screen off.
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status === 'granted' && !(await Location.hasStartedLocationUpdatesAsync(GPS_TASK))) {
      await Location.startLocationUpdatesAsync(GPS_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
        activityType: route.mode === 'car' ? Location.LocationActivityType.AutomotiveNavigation : Location.LocationActivityType.Fitness,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    }
    return bg.status === 'granted' ? null : 'Background location is off, so directions pause when the screen locks. Settings → NLS Maps → Location → Always.';
  } catch {
    return null;
  }
}

export async function stopNav() {
  Speech.stop();
  endIsland();
  set({ active: false, route: null, dest: null, arrived: false, rerouting: false, error: null });
  try {
    if (await Location.hasStartedLocationUpdatesAsync(GPS_TASK)) await Location.stopLocationUpdatesAsync(GPS_TASK);
  } catch {}
}

export const etaText = () => fmtDur(s.remainingS);

// Background GPS → engine. Must be defined at the top level (imported from index.ts).
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(GPS_TASK, async ({ data, error }) => {
  if (error) return;
  // While the app is open, the on-screen GPS watcher feeds the engine instead.
  if (AppState.currentState === 'active') return;
  const l = data?.locations?.[data.locations.length - 1];
  if (l) await onFix({ lat: l.coords.latitude, lng: l.coords.longitude });
});
