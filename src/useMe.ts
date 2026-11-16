import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type Me = {
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number; // degrees from north, for the arrow
  suburb: string | null;
};

const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// Live position, speed, heading and suburb while the app is open.
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [denied, setDenied] = useState(false);
  const compass = useRef(0);
  const lastGeo = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const suburb = useRef<string | null>(null);

  useEffect(() => {
    let posSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    let alive = true;

    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        if (alive) setDenied(true);
        return;
      }
      headSub = await Location.watchHeadingAsync((h) => {
        compass.current = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      });
      posSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (loc) => {
          const { latitude: lat, longitude: lng, speed, heading } = loc.coords;
          const mps = speed != null && speed > 0 ? speed : 0;
          // Moving: use GPS course. Standing still: use the compass.
          const dir = mps > 1.5 && heading != null && heading >= 0 ? heading : compass.current;

          const here = { lat, lng };
          const prev = lastGeo.current;
          if (!prev || dist(prev, here) > 300 || Date.now() - prev.t > 90000) {
            lastGeo.current = { ...here, t: Date.now() };
            Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
              .then((r) => {
                const a = r[0];
                suburb.current = a?.district || a?.subregion || a?.city || suburb.current;
              })
              .catch(() => {});
          }

          if (alive) setMe({ lat, lng, speedKmh: Math.round(mps * 3.6), heading: dir, suburb: suburb.current });
        },
      );
    })();

    return () => {
      alive = false;
      posSub?.remove();
      headSub?.remove();
    };
  }, []);

  return { me, denied };
}
