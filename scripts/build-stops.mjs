// Builds assets/stops.json (official Victorian bus/tram/train stops) from the
// Transport Victoria GTFS Schedule. Run by .github/workflows/update-stops.yml.
// Usage: node scripts/build-stops.mjs <folder with the unzipped GTFS.zip>
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Pass the unzipped GTFS folder');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const head = rows.shift().map((h) => h.replace(/^﻿/, '').trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Each mode folder (1, 2, 3, ...) holds its own google_transit.zip.
function readFeed(dir) {
  let files = dir;
  const zip = join(dir, 'google_transit.zip');
  if (existsSync(zip)) {
    files = mkdtempSync(join(tmpdir(), 'gtfs-'));
    execFileSync('unzip', ['-qo', zip, 'stops.txt', 'routes.txt', '-d', files]);
  }
  if (!existsSync(join(files, 'stops.txt')) || !existsSync(join(files, 'routes.txt'))) return null;
  return {
    stops: parseCsv(readFileSync(join(files, 'stops.txt'), 'utf8')),
    routes: parseCsv(readFileSync(join(files, 'routes.txt'), 'utf8')),
  };
}

const MODE = { 0: 'tram', 2: 'train', 3: 'bus', 5: 'tram' };
const features = [];
const seen = new Set();
const counts = {};

for (const name of readdirSync(root).sort()) {
  const dir = join(root, name);
  if (!statSync(dir).isDirectory()) continue;
  const feed = readFeed(dir);
  if (!feed) continue;
  const types = new Set(feed.routes.map((r) => Number(r.route_type)));
  const modeType = [...types].find((t) => MODE[t] !== undefined);
  if (modeType === undefined) continue;
  const mode = MODE[modeType];
  const hasParents = feed.stops.some((s) => s.location_type === '1');

  for (const s of feed.stops) {
    const lat = Number(s.stop_lat);
    const lng = Number(s.stop_lon);
    if (!lat || !lng) continue;
    if (s.platform_code === 'R-Bus') continue; // temporary rail-replacement bus stops
    const lt = s.location_type || '0';
    if (mode === 'train') {
      if (hasParents ? lt !== '1' : lt !== '0') continue; // one dot per station
    } else if (lt !== '0') continue;
    const key = `${mode}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[mode] = (counts[mode] ?? 0) + 1;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))] },
      properties: { m: mode, n: s.stop_name.trim(), i: s.stop_id },
    });
  }
  console.log(`folder ${name}: mode ${mode}`);
}

if (features.length < 1000) throw new Error(`Only ${features.length} stops found — GTFS layout may have changed`);
writeFileSync('assets/stops.json', JSON.stringify({ type: 'FeatureCollection', features }));
console.log('stops written:', counts);
