import { Camera, Images, Layer, LayerAnnotation, Map, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapStyle } from './mapStyle';
import { useMe } from './useMe';

const F = {
  brand: 'Exo2_800ExtraBold_Italic',
  ui: 'Exo2_600SemiBold',
  uiItalic: 'Exo2_600SemiBold_Italic',
  mono: 'SpaceMono_400Regular',
};
const C = { panel: 'rgba(11,11,11,0.9)', line: 'rgba(255,255,255,0.22)', text: '#EDEDED', muted: '#A8A8A8' };
const MELBOURNE: [number, number] = [144.9631, -37.8136];
const PITCH_3D = 55;

const DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const dirText = (deg: number) => `${DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]} ${String(Math.round(deg)).padStart(3, '0')}°`;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  let h = now.getHours();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(now.getMinutes()).padStart(2, '0')}${ap}`;
}

function RoundBtn({ label, onPress, children, chrome }: { label: string; onPress: () => void; children: React.ReactNode; chrome?: boolean }) {
  const inner = <View style={styles.roundInner}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.round, pressed && { opacity: 0.6 }]}
    >
      {chrome ? (
        <LinearGradient colors={['#FFFFFF', '#B9B9B9']} style={styles.roundChrome}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { me, denied } = useMe();
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const [follow, setFollow] = useState(true);
  const [is3D, setIs3D] = useState(true);
  const [zoom, setZoom] = useState(16);
  const time = useClock();

  const zoomBy = (d: number) => {
    const z = Math.max(3, Math.min(20, zoom + d));
    setZoom(z);
    camera.current?.zoomTo(z, { duration: 300 });
  };
  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    map.current
      ?.getCenter()
      .then((center) => camera.current?.easeTo({ center, pitch: next ? PITCH_3D : 0, duration: 500 }))
      .catch(() => {});
  };
  const recentre = () => {
    setFollow(true);
    if (me) camera.current?.easeTo({ center: [me.lng, me.lat], zoom: Math.max(zoom, 16), pitch: is3D ? PITCH_3D : 0, duration: 600 });
  };

  return (
    <View style={styles.screen}>
      <Map
        ref={map}
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        logo={false}
        compass={false}
        scaleBar={false}
        attribution
        attributionPosition={{ bottom: insets.bottom + 4, right: 120 }}
        onRegionWillChange={(e) => {
          if (e.nativeEvent.userInteraction) setFollow(false);
        }}
        onRegionDidChange={(e) => setZoom(e.nativeEvent.zoom)}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: MELBOURNE, zoom: 16, pitch: PITCH_3D }}
          trackUserLocation={follow ? 'course' : undefined}
        />
        <Images images={{ 'me-arrow': require('../assets/me-arrow.png') }} />
        {me ? (
          <LayerAnnotation id="me" lngLat={[me.lng, me.lat]} animated>
            <Layer
              type="circle"
              id="me-halo"
              source="me"
              paint={{
                'circle-radius': 24,
                'circle-color': 'rgba(255,255,255,0.10)',
                'circle-stroke-color': 'rgba(255,255,255,0.6)',
                'circle-stroke-width': 1,
                'circle-pitch-alignment': 'map',
              }}
            />
            <Layer
              type="symbol"
              id="me-arrow"
              source="me"
              layout={{
                'icon-image': 'me-arrow',
                'icon-size': 0.34,
                'icon-rotate': me.heading,
                'icon-rotation-alignment': 'map',
                'icon-pitch-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              }}
            />
          </LayerAnnotation>
        ) : null}
      </Map>

      {/* top status pill */}
      <View style={[styles.topPill, { top: insets.top + 6 }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.brand} numberOfLines={1}>
            Noqtrnl Logic Systems
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {me ? `spd ${String(me.speedKmh).padStart(2, '0')} km/h · hdg ${dirText(me.heading)}` : denied ? 'location is off' : 'finding you…'}
          </Text>
        </View>
        <View style={styles.gps}>
          <View style={[styles.gpsDot, { opacity: me ? 1 : 0.3 }]} />
          <Text style={styles.gpsText}>gps</Text>
        </View>
      </View>

      {denied ? (
        <View style={[styles.notice, { top: insets.top + 84 }]}>
          <Text style={styles.noticeText}>Location is off. Go to Settings → NLS Maps → Location and pick "While Using" or "Always".</Text>
        </View>
      ) : null}

      {/* controls */}
      <View style={[styles.controls, { bottom: insets.bottom + 14 }]}>
        <RoundBtn label="Zoom in" onPress={() => zoomBy(1)}>
          <Text style={styles.ctrlText}>+</Text>
        </RoundBtn>
        <RoundBtn label="Zoom out" onPress={() => zoomBy(-1)}>
          <Text style={styles.ctrlText}>−</Text>
        </RoundBtn>
        <View style={styles.ctrlDivider} />
        <RoundBtn label="Switch between 3D and 2D" onPress={toggle3D}>
          <Text style={styles.ctrlMono}>{is3D ? '2d' : '3d'}</Text>
        </RoundBtn>
        <RoundBtn label="Recentre on me" onPress={recentre} chrome={!follow}>
          <View style={[styles.crosshair, { borderColor: follow ? '#F2F2F2' : '#0B0B0B' }]} />
        </RoundBtn>
      </View>

      {/* info card */}
      <View style={[styles.info, { bottom: insets.bottom + 14 }]}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.suburb} numberOfLines={1}>
          {me?.suburb ?? 'Melbourne'}
        </Text>
        <Text style={styles.mode}>{follow ? 'following you' : 'free look'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0B0B' },
  topPill: {
    position: 'absolute',
    left: 10,
    right: 10,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 26,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: { fontFamily: F.brand, fontSize: 17, color: '#FFFFFF', letterSpacing: -0.2 },
  sub: { fontFamily: F.mono, fontSize: 11, color: C.muted, marginTop: 1 },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  gpsText: { fontFamily: F.mono, fontSize: 11, color: '#D6D6D6' },
  notice: { position: 'absolute', left: 16, right: 16, padding: 12, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: '#FFFFFF' },
  noticeText: { fontFamily: F.ui, fontSize: 14, color: C.text },
  controls: {
    position: 'absolute',
    left: 12,
    padding: 4,
    gap: 2,
    borderRadius: 28,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  round: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  roundChrome: { flex: 1, borderRadius: 22 },
  roundInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ctrlText: { fontFamily: F.ui, fontSize: 22, color: '#F2F2F2', lineHeight: 26 },
  ctrlMono: { fontFamily: F.mono, fontSize: 12, color: '#F2F2F2' },
  ctrlDivider: { height: 1, marginHorizontal: 8, marginVertical: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  crosshair: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  info: {
    position: 'absolute',
    right: 12,
    maxWidth: 210,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'flex-end',
    gap: 2,
  },
  time: { fontFamily: F.mono, fontSize: 24, color: '#FFFFFF', lineHeight: 28 },
  suburb: { fontFamily: F.uiItalic, fontSize: 15, color: '#E6E6E6' },
  mode: { fontFamily: F.mono, fontSize: 11, color: C.muted },
});
