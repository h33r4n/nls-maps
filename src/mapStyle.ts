import type { StyleSpecification } from '@maplibre/maplibre-react-native';

// Noqtrnl Logic Systems — dark monochrome map style.
// Data: OpenFreeMap (OpenMapTiles schema, © OpenStreetMap contributors).

export const T = {
  ground: '#0B0B0B',
  water: '#000000',
  waterLine: '#5c5c5c',
  park: '#121212',
  building: '#2E2E2E',
  road: '#E6E6E6',
  minor: '#8A8A8A',
  path: '#4A4A4A',
  rail: '#6A6A6A',
  label: '#A8A8A8',
  place: '#8F8F8F',
};

const zoomWidth = (pairs: number[]): any => ['interpolate', ['exponential', 1.5], ['zoom'], ...pairs];

const MAJOR = ['primary', 'secondary', 'tertiary', 'trunk'];
const MOTOR = ['motorway'];
const MINOR = ['minor', 'service', 'unclassified', 'residential', 'living_street', 'raceway'];

export const mapStyle: StyleSpecification = {
  version: 8,
  name: 'nls-dark-mono',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  },
  light: { anchor: 'viewport', color: '#ffffff', intensity: 0.45, position: [1.2, 200, 35] },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': T.ground } },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': T.park },
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass']]],
      paint: { 'fill-color': T.park, 'fill-opacity': 0.7 },
    },
    {
      id: 'aeroway',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'aeroway',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#161616' },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': T.water, 'fill-outline-color': T.waterLine },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': '#262626', 'line-width': zoomWidth([10, 0.5, 18, 6]) },
    },

    // ---------- roads ----------
    {
      id: 'road-path',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', ['path', 'track', 'pedestrian']]],
      paint: { 'line-color': T.path, 'line-width': zoomWidth([14, 0.5, 18, 2]), 'line-dasharray': [2, 2] },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]],
      paint: { 'line-color': T.rail, 'line-width': zoomWidth([10, 0.6, 18, 2.5]), 'line-dasharray': [3, 3] },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', MINOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': T.minor, 'line-opacity': 0.55, 'line-width': zoomWidth([12, 0.5, 16, 3, 19, 14]) },
    },
    {
      id: 'road-major-glow',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', [...MAJOR, ...MOTOR]]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-opacity': 0.18, 'line-blur': 6, 'line-width': zoomWidth([8, 2, 16, 18, 19, 40]) },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', MAJOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': T.road, 'line-width': zoomWidth([8, 0.6, 16, 5, 19, 22]) },
    },
    {
      id: 'road-motorway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', MOTOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': T.ground, 'line-width': zoomWidth([6, 1.5, 16, 11, 19, 34]) },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', MOTOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': zoomWidth([6, 1, 16, 8, 19, 28]) },
    },
    {
      id: 'road-motorway-centre',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 13,
      filter: ['in', ['get', 'class'], ['literal', MOTOR]],
      paint: { 'line-color': T.ground, 'line-width': zoomWidth([13, 0.6, 19, 2.5]), 'line-dasharray': [4, 4] },
    },

    // ---------- 3D buildings ----------
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': T.building,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.94,
        'fill-extrusion-vertical-gradient': true,
      },
    },

    // ---------- labels ----------
    {
      id: 'road-names',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      minzoom: 14,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 13],
        'text-letter-spacing': 0.04,
      },
      paint: { 'text-color': T.label, 'text-halo-color': T.ground, 'text-halo-width': 1.6 },
    },
    {
      id: 'water-names',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': 12,
      },
      paint: { 'text-color': '#6f6f6f', 'text-halo-color': T.water, 'text-halo-width': 1.2 },
    },
    {
      id: 'place-suburb',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 11,
      maxzoom: 16,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'town', 'village']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 15, 14],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.18,
      },
      paint: { 'text-color': T.place, 'text-halo-color': T.ground, 'text-halo-width': 1.8 },
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      maxzoom: 12,
      filter: ['==', ['get', 'class'], 'city'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 11, 18],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.2,
      },
      paint: { 'text-color': '#d6d6d6', 'text-halo-color': T.ground, 'text-halo-width': 2 },
    },
  ],
} as StyleSpecification;
