// Routes from the free FOSSGIS OSRM servers (OpenStreetMap data), car or foot.
import type { LL, XY } from './geo';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const osrmText = require('osrm-text-instructions')('v5');

export type Mode = 'car' | 'walk';

export type Step = {
  text: string;
  type: string;
  modifier?: string;
  name: string;
  distance: number; // metres of this step (from its manoeuvre to the next)
  duration: number;
  loc: XY; // where the manoeuvre happens
};

export type Route = { coords: XY[]; distance: number; duration: number; steps: Step[]; mode: Mode };

export async function getRoute(from: LL, to: LL, mode: Mode, signal?: AbortSignal): Promise<Route> {
  const svc = mode === 'car' ? 'routed-car/route/v1/driving' : 'routed-foot/route/v1/foot';
  const url =
    `https://routing.openstreetmap.de/${svc}/${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=false`;
  const res = await fetch(url, { signal, headers: { 'User-Agent': 'NLSMaps/0.4 (personal app)' } });
  if (!res.ok) throw new Error(`Route server said ${res.status}`);
  const json = await res.json();
  const r = json?.routes?.[0];
  if (!r) throw new Error(json?.message || 'No route found');

  const steps: Step[] = [];
  for (const leg of r.legs) {
    for (const st of leg.steps) {
      let text = '';
      try {
        text = osrmText.compile('en', st, { legCount: r.legs.length, legIndex: 0 });
      } catch {
        text = st.name ? `Continue on ${st.name}` : 'Continue';
      }
      steps.push({
        text,
        type: st.maneuver.type,
        modifier: st.maneuver.modifier,
        name: st.name || st.ref || '',
        distance: st.distance,
        duration: st.duration,
        loc: st.maneuver.location as XY,
      });
    }
  }
  return { coords: r.geometry.coordinates as XY[], distance: r.distance, duration: r.duration, steps, mode };
}

/** A simple arrow for a manoeuvre. */
export function arrowFor(step?: { type: string; modifier?: string }) {
  if (!step) return '↑';
  const { type, modifier } = step;
  if (type === 'arrive') return '◉';
  if (type === 'roundabout' || type === 'rotary' || type === 'roundabout turn') return '↻';
  switch (modifier) {
    case 'uturn':
      return '↶';
    case 'sharp right':
    case 'right':
      return '↱';
    case 'slight right':
      return '↗';
    case 'sharp left':
    case 'left':
      return '↰';
    case 'slight left':
      return '↖';
    default:
      return '↑';
  }
}
