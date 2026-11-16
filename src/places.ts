import type { FilterSpecification } from '@maplibre/maplibre-react-native';

export type CatId = 'food' | 'fuel' | 'bus' | 'train' | 'tram';

export type Cat = {
  id: CatId;
  label: string; // layers panel
  short: string; // place card
  minzoom: number;
  filter: FilterSpecification;
};

// OpenMapTiles "poi" layer → our five categories.
export const CATS: Cat[] = [
  {
    id: 'food',
    label: 'Food & drink',
    short: 'food & drink',
    minzoom: 15,
    filter: ['in', ['get', 'class'], ['literal', ['restaurant', 'fast_food', 'cafe', 'bar', 'beer', 'ice_cream', 'bakery']]],
  },
  { id: 'fuel', label: 'Petrol stations', short: 'petrol station', minzoom: 13, filter: ['==', ['get', 'class'], 'fuel'] },
  { id: 'bus', label: 'Bus stops', short: 'bus stop', minzoom: 15.5, filter: ['==', ['get', 'class'], 'bus'] },
  {
    id: 'train',
    label: 'Train stations',
    short: 'train station',
    minzoom: 12,
    filter: [
      'all',
      ['==', ['get', 'class'], 'railway'],
      ['in', ['get', 'subclass'], ['literal', ['station', 'halt']]],
    ],
  },
  { id: 'tram', label: 'Tram stops', short: 'tram stop', minzoom: 15.5, filter: ['==', ['get', 'subclass'], 'tram_stop'] },
];

export const STOP_ZOOM = 15.5;

export const ICONS = {
  'poi-food': require('../assets/poi/food.png'),
  'poi-fuel': require('../assets/poi/fuel.png'),
  'poi-bus': require('../assets/poi/bus.png'),
  'poi-train': require('../assets/poi/train.png'),
  'poi-tram': require('../assets/poi/tram.png'),
  'poi-food-sel': require('../assets/poi/food-sel.png'),
  'poi-fuel-sel': require('../assets/poi/fuel-sel.png'),
  'poi-bus-sel': require('../assets/poi/bus-sel.png'),
  'poi-train-sel': require('../assets/poi/train-sel.png'),
  'poi-tram-sel': require('../assets/poi/tram-sel.png'),
};

export const layerId = (c: CatId) => `poi-${c}`;

export function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
