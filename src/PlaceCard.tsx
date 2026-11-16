import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATS, fmtDist, ICONS, metres, type CatId } from './places';
import { C, F, PillButton } from './ui';

export type Picked = { cat: CatId; name: string; lat: number; lng: number };

export default function PlaceCard({
  place,
  me,
  bottom,
  onClose,
}: {
  place: Picked;
  me: { lat: number; lng: number } | null;
  bottom: number;
  onClose: () => void;
}) {
  const cat = CATS.find((c) => c.id === place.cat)!;
  const d = me ? metres(me, place) : null;
  const walk = d != null ? Math.max(1, Math.round(d / 80)) : null;
  const isStop = place.cat === 'bus' || place.cat === 'tram' || place.cat === 'train';

  const openWaze = () => {
    const url = `waze://?ll=${place.lat},${place.lng}&navigate=yes`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`));
  };

  return (
    <View style={[s.card, { bottom }]}>
      <View style={s.top}>
        <Image source={ICONS[`poi-${place.cat}-sel` as keyof typeof ICONS]} style={s.icon} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.kind}>{cat.short}</Text>
          <Text style={s.name} numberOfLines={2}>
            {place.name}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose} style={s.close}>
          <Text style={s.closeX}>×</Text>
        </Pressable>
      </View>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statK}>distance</Text>
          <Text style={s.statV}>{d != null ? fmtDist(d) : '—'}</Text>
        </View>
        <View style={[s.stat, s.statBorder]}>
          <Text style={s.statK}>walk</Text>
          <Text style={s.statV}>{walk != null ? `${walk} min` : '—'}</Text>
        </View>
        <View style={[s.stat, s.statBorder]}>
          <Text style={s.statK}>{isStop ? 'live times' : 'directions'}</Text>
          <Text style={s.statV}>{isStop ? 'soon' : 'phase 4'}</Text>
        </View>
      </View>

      <PillButton chrome label="Open in Waze" onPress={openWaze} />
      <Text style={s.foot}>Straight-line distance. Proper routes and turn-by-turn arrive in Phase 4.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(11,11,11,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 16,
    gap: 14,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46 },
  kind: { fontFamily: F.mono, fontSize: 11, color: C.muted },
  name: { fontFamily: F.brand, fontSize: 22, color: '#FFFFFF', lineHeight: 26 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#E6E6E6', fontSize: 22, lineHeight: 24 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  stat: { flex: 1, paddingVertical: 10, gap: 2 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)', paddingLeft: 12 },
  statK: { fontFamily: F.mono, fontSize: 11, color: C.muted },
  statV: { fontFamily: F.mono, fontSize: 16, color: '#FFFFFF' },
  foot: { fontFamily: F.ui, fontSize: 12, color: '#9A9A9A' },
});
