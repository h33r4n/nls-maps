import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fmtClock, fmtDist, fmtDur } from './geo';
import type { Mode, Route } from './routing';
import { C, F, PillButton, tap } from './ui';

export default function RoutePreview({
  name,
  mode,
  setMode,
  route,
  loading,
  error,
  bottom,
  onGo,
  onClose,
}: {
  name: string;
  mode: Mode;
  setMode: (m: Mode) => void;
  route: Route | null;
  loading: boolean;
  error: string | null;
  bottom: number;
  onGo: () => void;
  onClose: () => void;
}) {
  const eta = route ? fmtClock(new Date(Date.now() + route.duration * 1000)) : '—';
  return (
    <View style={[s.card, { bottom }]}>
      <View style={s.top}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.kicker}>route to</Text>
          <Text style={s.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close route" onPress={onClose} style={s.close}>
          <Text style={s.closeX}>×</Text>
        </Pressable>
      </View>

      <View style={s.modes}>
        {(['car', 'walk'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            onPress={() => {
              tap();
              setMode(m);
            }}
            style={[s.mode, mode === m && s.modeOn]}
          >
            <Text style={[s.modeText, { color: mode === m ? C.ink : '#FFFFFF' }]}>{m === 'car' ? 'Drive' : 'Walk'}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={s.muted}>finding the best route…</Text>
        </View>
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : route ? (
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statK}>time</Text>
            <Text style={s.big}>{fmtDur(route.duration)}</Text>
          </View>
          <View style={[s.stat, s.statBorder]}>
            <Text style={s.statK}>distance</Text>
            <Text style={s.statV}>{fmtDist(route.distance)}</Text>
          </View>
          <View style={[s.stat, s.statBorder]}>
            <Text style={s.statK}>arrive</Text>
            <Text style={s.statV}>{eta}</Text>
          </View>
        </View>
      ) : null}

      <PillButton chrome label="Go" onPress={onGo} style={{ height: 52, opacity: route ? 1 : 0.4 }} />
      <Text style={s.foot}>{mode === 'car' ? 'No live traffic — times assume normal conditions.' : 'Walking routes use footpaths and crossings.'}</Text>
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
  kicker: { fontFamily: F.mono, fontSize: 11, color: C.muted },
  name: { fontFamily: F.brand, fontSize: 22, color: '#FFFFFF' },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#E6E6E6', fontSize: 22, lineHeight: 24 },
  modes: { flexDirection: 'row', padding: 3, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  mode: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modeOn: { backgroundColor: '#E6E6E6' },
  modeText: { fontFamily: F.uiItalic, fontSize: 15 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  muted: { fontFamily: F.ui, fontSize: 14, color: C.muted },
  error: { fontFamily: F.ui, fontSize: 14, color: '#FFFFFF', paddingVertical: 8 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  stat: { flex: 1, paddingVertical: 10, gap: 2, justifyContent: 'flex-end' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)', paddingLeft: 12 },
  statK: { fontFamily: F.mono, fontSize: 11, color: C.muted },
  big: { fontFamily: F.brand, fontSize: 24, color: '#FFFFFF' },
  statV: { fontFamily: F.mono, fontSize: 16, color: '#FFFFFF' },
  foot: { fontFamily: F.ui, fontSize: 12, color: '#9A9A9A' },
});
