import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATS, ICONS, type CatId } from './places';
import { hasTraffic, type TrafficMode } from './traffic';
import { C, F, PillButton, Switch, tap } from './ui';

export default function LayersPanel({
  on,
  setOn,
  traffic,
  setTraffic,
  onClose,
}: {
  on: Record<CatId, boolean>;
  setOn: (next: Record<CatId, boolean>) => void;
  traffic: TrafficMode;
  setTraffic: (m: TrafficMode) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const all = (v: boolean) => setOn({ food: v, fuel: v, bus: v, train: v, tram: v });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable accessibilityLabel="Close layers" onPress={onClose} style={[StyleSheet.absoluteFill, s.dim]} />
      <View style={[s.panel, { top: insets.top + 6, bottom: insets.bottom + 10 }]}>
        <View style={s.head}>
          <View>
            <Text style={s.kicker}>nls / filter</Text>
            <Text style={s.title}>Layers</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close layers" onPress={onClose} style={s.close}>
            <Text style={s.closeX}>×</Text>
          </Pressable>
        </View>
        <View style={s.rule} />
        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {CATS.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="switch"
              accessibilityState={{ checked: on[c.id] }}
              onPress={() => {
                tap();
                setOn({ ...on, [c.id]: !on[c.id] });
              }}
              style={s.row}
            >
              <Image source={ICONS[`poi-${c.id}` as keyof typeof ICONS]} style={[s.icon, { opacity: on[c.id] ? 1 : 0.4 }]} />
              <Text style={[s.label, { opacity: on[c.id] ? 1 : 0.45 }]}>{c.label}</Text>
              <Switch on={on[c.id]} />
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.section}>traffic</Text>
        <View style={[s.seg, !hasTraffic && { opacity: 0.4 }]}>
          {(['off', 'busy', 'all'] as TrafficMode[]).map((m) => (
            <Pressable
              key={m}
              disabled={!hasTraffic}
              accessibilityRole="button"
              accessibilityState={{ selected: traffic === m }}
              onPress={() => {
                tap();
                setTraffic(m);
              }}
              style={[s.segBtn, traffic === m && s.segOn]}
            >
              <Text style={[s.segText, { color: traffic === m ? '#0B0B0B' : '#FFFFFF' }]}>{m === 'off' ? 'Off' : m === 'busy' ? 'Busy roads' : 'Every road'}</Text>
            </Pressable>
          ))}
        </View>
        {!hasTraffic ? <Text style={s.note}>Live traffic switches on once the TomTom key is added.</Text> : null}
        <View style={s.buttons}>
          <PillButton chrome label="show all" onPress={() => all(true)} style={{ flex: 1 }} />
          <PillButton label="hide all" onPress={() => all(false)} style={{ flex: 1 }} />
        </View>
        <Text style={s.note}>Bus and tram stops only show once you zoom in, so the map stays clean.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    position: 'absolute',
    left: 10,
    width: 290,
    borderRadius: 30,
    backgroundColor: 'rgba(11,11,11,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontFamily: F.mono, fontSize: 11, color: C.muted },
  title: { fontFamily: F.brand, fontSize: 28, color: '#FFFFFF' },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#E6E6E6', fontSize: 22, lineHeight: 24 },
  rule: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  icon: { width: 30, height: 30 },
  label: { flex: 1, fontFamily: F.ui, fontSize: 17, color: C.text },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  section: { fontFamily: F.mono, fontSize: 11, color: C.muted, marginTop: 10 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  segBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: '#E6E6E6' },
  segText: { fontFamily: F.uiItalic, fontSize: 13 },
  note: { fontFamily: F.ui, fontSize: 13, lineHeight: 18, color: '#9A9A9A', marginTop: 4 },
});
