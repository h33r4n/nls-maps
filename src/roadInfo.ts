// Speed limits + speed cameras from OpenStreetMap (Overpass API, free, no key).
import { useEffect, useRef, useState } from 'react';
import { metres, snapToLine, type LL, type XY } from './geo';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

export type Camera = { id: number; lat: number; lng: number; kind: string };

function parseLimit(v?: string): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  if (!Number.isNaN(n)) return /mph/.test(v) ? Math.round(n * 1.609) : n;
  if (/urban/i.test(v)) return 50;
  if (/rural/i.test(v)) return 100;
  if (/living_street|walk/i.test(v)) return 10;
  return null;
}

async function overpass(q: string, signal?: AbortSignal) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    body: `data=${encodeURIComponent(q)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'NLSMaps/0.5 (personal app)' },
    signal,
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  return res.json();
}

/** Speed limit of the road you're on + speed cameras nearby. */
export function useRoadInfo(me: (LL & { speedKmh: number; heading: number }) | null) {
  const [limit, setLimit] = useState<number | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [ahead, setAhead] = useState<{ cam: Camera; dist: number } | null>(null);
  const lastLimit = useRef<{ at: LL; t: number } | null>(null);
  const lastCams = useRef<LL | null>(null);
  const busy = useRef(false);

  // speed limit: refresh every ~150 m or 25 s while moving
  useEffect(() => {
    if (!me || busy.current) return;
    const prev = lastLimit.current;
    const moving = me.speedKmh > 8;
    if (prev && (!moving || (metres(prev.at, me) < 150 && Date.now() - prev.t < 25000))) return;
    lastLimit.current = { at: { lat: me.lat, lng: me.lng }, t: Date.now() };
    busy.current = true;
    const q = `[out:json][timeout:10];way(around:25,${me.lat},${me.lng})[highway][maxspeed];out tags geom;`;
    overpass(q)
      .then((j) => {
        let best: { d: number; v: number | null } = { d: Infinity, v: null };
        for (const w of j.elements ?? []) {
          if (!w.geometry) continue;
          const line: XY[] = w.geometry.map((g: any) => [g.lon, g.lat]);
          const d = snapToLine(me, line).off;
          const v = parseLimit(w.tags?.maxspeed);
          if (v && d < best.d) best = { d, v };
        }
        setLimit(best.v);
      })
      .catch(() => {})
      .finally(() => {
        busy.current = false;
      });
  }, [me?.lat, me?.lng]);

  // cameras: fetch a ~6 km box whenever you've moved 2 km
  useEffect(() => {
    if (!me) return;
    if (lastCams.current && metres(lastCams.current, me) < 2000) return;
    lastCams.current = { lat: me.lat, lng: me.lng };
    const d = 0.03;
    const q = `[out:json][timeout:15];(node[highway=speed_camera](${me.lat - d},${me.lng - d},${me.lat + d},${me.lng + d});node["enforcement"~"maxspeed|traffic_signals"](${me.lat - d},${me.lng - d},${me.lat + d},${me.lng + d}););out;`;
    overpass(q)
      .then((j) =>
        setCameras(
          (j.elements ?? []).map((n: any) => ({ id: n.id, lat: n.lat, lng: n.lon, kind: n.tags?.enforcement === 'traffic_signals' ? 'red light' : 'speed' })),
        ),
      )
      .catch(() => {});
  }, [me?.lat, me?.lng]);

  // camera alert: within 400 m and roughly in front of you
  useEffect(() => {
    if (!me || me.speedKmh < 15) return setAhead(null);
    let hit: { cam: Camera; dist: number } | null = null;
    for (const c of cameras) {
      const dist = metres(me, c);
      if (dist > 400) continue;
      const bearing = (Math.atan2(c.lng - me.lng, c.lat - me.lat) * 180) / Math.PI;
      const diff = Math.abs(((bearing - me.heading + 540) % 360) - 180);
      if (diff < 50 && (!hit || dist < hit.dist)) hit = { cam: c, dist };
    }
    setAhead(hit);
  }, [me?.lat, me?.lng, cameras]);

  return { limit, cameras, ahead };
}
