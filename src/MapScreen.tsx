import { Camera, GeoJSONSource, Images, Layer, LayerAnnotation, Map, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LayersPanel from './LayersPanel';
import { mapStyle } from './mapStyle';
import PlaceCard, { type Picked } from './PlaceCard';
import { CATS, ICONS, layerId, STOP_ZOOM, STOPS, type Cat, type CatId } from './places';
import { PillButton } from './ui';
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

const guessCat = (p: Record<string, any>): CatId =>
  p.m === 'bus' || p.m === 'tram' || p.m === 'train' ? p.m : p.class === 'fuel' ? 'fuel' : 'food';

function poiLayer(c: Cat, visible: boolean) {
  return {
    type: 'symbol' as const,
    id: layerId(c.id),
    minzoom: c.minzoom,
    filter: c.filter,
    layout: {
      visibility: visible ? ('visible' as const) : ('none' as const),
      'icon-image': `poi-${c.id}`,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.22, 17, 0.32] as any,
      'icon-allow-overlap': c.id === 'train',
      'icon-padding': 4,
      'text-field': ['step', ['zoom'], '', 17, ['coalesce', ['get', 'n'], ['get', 'name:latin'], ['get', 'name']]] as any,
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.5] as [number, number],
      'text-anchor': 'top' as const,
      'text-optional': true,
    },
    paint: { 'text-color': '#D6D6D6', 'text-halo-color': '#0B0B0B', 'text-halo-width': 1.5 },
  };
}

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
  const [layersOpen, setLayersOpen] = useState(false);
  const [on, setOn] = useState<Record<CatId, boolean>>({ food: true, fuel: true, bus: true, train: true, tram: true });
  const [picked, setPicked] = useState<Picked | null>(null);

  const onMapPress = async (e: { nativeEvent: { point: [number, number] } }) => {
    const [x, y] = e.nativeEvent.point;
    const ids = CATS.filter((c) => on[c.id]).map((c) => layerId(c.id));
    if (!ids.length) return setPicked(null);
    try {
      const feats = await map.current?.queryRenderedFeatures([[x - 22, y - 22], [x + 22, y + 22]], { layers: ids });
      const f = feats?.find((ft) => ft.geometry?.type === 'Point');
      if (!f) return setPicked(null);
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      const props = f.properties ?? {};
      const cat = guessCat(props);
      const name = (props.n || props['name:latin'] || props.name || CATS.find((c) => c.id === cat)?.label || 'Place') as string;
      setPicked({ cat, name, lat, lng });
      setLayersOpen(false);
    } catch {
      setPicked(null);
    }
  };

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
        attributionPosition={{ top: insets.top + 86, right: 14 }}
        onRegionWillChange={(e) => {
          if (e.nativeEvent.userInteraction) setFollow(false);
        }}
        onRegionDidChange={(e) => setZoom(e.nativeEvent.zoom)}
        onPress={(e) => onMapPress(e as any)}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: MELBOURNE, zoom: 16, pitch: PITCH_3D }}
          trackUserLocation={follow ? 'course' : undefined}
        />
        <Images images={{ 'me-arrow': require('../assets/me-arrow.png'), ...ICONS }} />
        {CATS.filter((c) => !c.official).map((c) => (
          <Layer key={c.id} {...poiLayer(c, on[c.id])} source="openmaptiles" source-layer="poi" />
        ))}
        <GeoJSONSource id="pt" data={STOPS}>
          {CATS.filter((c) => c.official).map((c) => (
            <Layer key={c.id} {...poiLayer(c, on[c.id])} />
          ))}
        </GeoJSONSource>
        <GeoJSONSource
          id="picked"
          data={{
            type: 'FeatureCollection',
            features: picked
              ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: [picked.lng, picked.lat] }, properties: { cat: picked.cat } }]
              : [],
          }}
        >
          <Layer
            type="symbol"
            id="picked-icon"
            layout={{
              'icon-image': ['concat', 'poi-', ['get', 'cat'], '-sel'],
              'icon-size': 0.42,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            }}
          />
        </GeoJSONSource>
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
        <PillButton
          chrome
          label="layers"
          accessibilityLabel="Open map layers"
          onPress={() => {
            setPicked(null);
            setLayersOpen(true);
          }}
        />
      </View>

      {zoom < STOP_ZOOM && (on.bus || on.tram) && !picked && !layersOpen ? (
        <View style={[styles.hint, { top: insets.top + 84 }]} pointerEvents="none">
          <Text style={styles.hintText}>zoom in to see bus + tram stops</Text>
        </View>
      ) : null}

      {denied ? (
        <View style={[styles.notice, { top: insets.top + 84 }]}>
          <Text style={styles.noticeText}>Location is off. Go to Settings → NLS Maps → Location and pick "While Using" or "Always".</Text>
        </View>
      ) : null}

      {!picked ? (
      <>
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
        <Text style={styles.mode} numberOfLines={1}>
          {follow ? 'following you' : 'free look'}
        </Text>
      </View>
      </>
      ) : null}

      {picked ? <PlaceCard place={picked} me={me} bottom={insets.bottom + 12} onClose={() => setPicked(null)} /> : null}

      {layersOpen ? <LayersPanel on={on} setOn={setOn} onClose={() => setLayersOpen(false)} /> : null}
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
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  hintText: { fontFamily: F.mono, fontSize: 11, color: '#E6E6E6' },
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
    maxWidth: 230,
    minWidth: 150,
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
