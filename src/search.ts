// Place search: Photon (OpenStreetMap, free) + the official stops bundled in the app.
import { metres, type LL } from './geo';
import { STOPS, type PlaceKind } from './places';

export type Result = { id: string; name: string; detail: string; lat: number; lng: number; kind: PlaceKind; dist?: number };

const FOOD = new Set(['restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'ice_cream', 'bakery', 'food_court']);

function kindOf(p: any): PlaceKind {
  if (p.osm_value === 'fuel') return 'fuel';
  if (FOOD.has(p.osm_value)) return 'food';
  if (p.osm_value === 'bus_stop') return 'bus';
  if (p.osm_value === 'tram_stop') return 'tram';
  if (p.osm_value === 'station' && p.osm_key === 'railway') return 'train';
  return 'place';
}

export async function searchPlaces(q: string, near: LL | null, signal?: AbortSignal): Promise<Result[]> {
  const query = q.trim();
  if (query.length < 2) return [];

  // Official stops whose names match, closest first.
  const lower = query.toLowerCase();
  const stops: Result[] = [];
  for (const f of STOPS.features as any[]) {
    const n: string = f.properties.n;
    if (!n.toLowerCase().includes(lower)) continue;
    const [lng, lat] = f.geometry.coordinates;
    stops.push({
      id: `stop-${f.properties.i}`,
      name: n,
      detail: `${f.properties.m} stop`,
      lat,
      lng,
      kind: f.properties.m,
      dist: near ? metres(near, { lat, lng }) : undefined,
    });
    if (stops.length > 400) break;
  }
  stops.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

  let places: Result[] = [];
  try {
    const bias = near ? `&lat=${near.lat.toFixed(4)}&lon=${near.lng.toFixed(4)}` : '';
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en${bias}`, {
      signal,
      headers: { 'User-Agent': 'NLSMaps/0.4 (personal app)' },
    });
    const json = await res.json();
    places = (json.features ?? []).map((f: any, i: number) => {
      const p = f.properties ?? {};
      const [lng, lat] = f.geometry.coordinates;
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      const name = p.name || street || p.city || 'Unnamed place';
      const detail = [p.name ? street : '', p.district || p.locality || p.city, p.state].filter(Boolean).join(', ');
      return { id: `ph-${p.osm_id ?? i}`, name, detail, lat, lng, kind: kindOf(p), dist: near ? metres(near, { lat, lng }) : undefined };
    });
  } catch (e) {
    if ((e as any)?.name === 'AbortError') throw e;
  }

  return [...places.slice(0, 7), ...stops.slice(0, 4)];
}
