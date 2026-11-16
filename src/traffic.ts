// Live traffic from TomTom (crowdsourced). Switches on when the TOMTOM_KEY secret is added.
import { KEYS } from './keys';

export type TrafficMode = 'off' | 'busy' | 'all';

export const hasTraffic = !!KEYS.tomtom;

export const trafficTiles = hasTraffic
  ? [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf?key=${KEYS.tomtom}`]
  : [];

// traffic_level = current speed ÷ free-flow speed (1 = clear, 0 = stopped)
export const trafficColour: any = [
  'step',
  ['get', 'traffic_level'],
  '#B00020', // stopped
  0.15,
  '#FF3B4A', // jammed
  0.4,
  '#FF8A3D', // heavy
  0.6,
  '#FFD23F', // slow
  0.8,
  '#2BD96B', // clear
];

export const trafficFilter = (mode: TrafficMode): any =>
  mode === 'busy' ? ['any', ['<', ['get', 'traffic_level'], 0.8], ['has', 'road_closure']] : ['has', 'traffic_level'];
