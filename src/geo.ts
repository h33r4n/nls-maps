export type LL = { lat: number; lng: number };
export type XY = [number, number]; // [lng, lat]

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function metres(a: LL, b: LL) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Local flat projection in metres around a reference latitude (fine for city-sized distances).
function project(p: XY, lat0: number): [number, number] {
  return [rad(p[0]) * R * Math.cos(rad(lat0)), rad(p[1]) * R];
}

/** Nearest point on a polyline: distance off the line (m) and distance along it (m). */
export function snapToLine(me: LL, line: XY[]) {
  const lat0 = me.lat;
  const P = project([me.lng, me.lat], lat0);
  let best = { off: Infinity, along: 0, seg: 0 };
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const A = project(line[i], lat0);
    const B = project(line[i + 1], lat0);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len2)) : 0;
    const qx = A[0] + t * dx;
    const qy = A[1] + t * dy;
    const off = Math.hypot(P[0] - qx, P[1] - qy);
    const segLen = Math.sqrt(len2);
    if (off < best.off) best = { off, along: acc + t * segLen, seg: i };
    acc += segLen;
  }
  return best;
}

export function lineLength(line: XY[]) {
  let d = 0;
  for (let i = 0; i < line.length - 1; i++) d += metres({ lng: line[i][0], lat: line[i][1] }, { lng: line[i + 1][0], lat: line[i + 1][1] });
  return d;
}

export function bounds(line: XY[]): [number, number, number, number] {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [x, y] of line) {
    w = Math.min(w, x);
    e = Math.max(e, x);
    s = Math.min(s, y);
    n = Math.max(n, y);
  }
  return [w, s, e, n];
}

export const fmtDist = (m: number) =>
  m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;

export const fmtDur = (s: number) => {
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
};

export const fmtClock = (d: Date) => {
  let h = d.getHours();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}${ap}`;
};
