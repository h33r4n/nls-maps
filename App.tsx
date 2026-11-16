import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getState, setState, subscribe } from './src/store';
import { startGps, startIsland, stopAll } from './src/tracking';

const C = { bg: '#0B0B0B', text: '#EDEDED', muted: '#A8A8A8', line: 'rgba(255,255,255,0.22)', chrome: '#E6E6E6', ink: '#0B0B0B' };

function Pill({ label, onPress, filled }: { label: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, filled ? styles.pillFilled : styles.pillOutline, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.pillText, { color: filled ? C.ink : C.text }]}>{label}</Text>
    </Pressable>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={styles.rowVal}>{v}</Text>
    </View>
  );
}

export default function App() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribe(rerender), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setState({ appActive: s === 'active' }));
    return () => sub.remove();
  }, []);

  const s = getState();
  const report = (msg: string | null) => setState({ error: msg });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>nls-01 / pipeline test</Text>
        <Text style={styles.title}>Noqtrnl{'\n'}Logic Systems</Text>

        <View style={styles.card}>
          <Row k="background gps" v={s.gpsOn ? 'on' : 'off'} />
          <Row k="dynamic island" v={s.islandId ? 'on' : 'off'} />
          <Row k="gps fixes" v={String(s.fixes)} />
          <Row k="fixes while in background" v={String(s.backgroundFixes)} />
          <Row k="last position" v={s.last ? `${s.last.lat.toFixed(5)}, ${s.last.lng.toFixed(5)}` : '—'} />
        </View>

        <View style={styles.buttons}>
          <Pill filled label="Start background GPS" onPress={async () => report(await startGps())} />
          <Pill filled label="Start Dynamic Island test" onPress={() => report(startIsland())} />
          <Pill label="Stop all" onPress={() => stopAll().then(() => report(null))} />
        </View>

        {s.error ? <Text style={styles.error}>{s.error}</Text> : null}

        <Text style={styles.help}>
          Test: tap both white buttons, then lock your phone and walk around for a minute. The Dynamic Island / lock
          screen should show "NLS · fix" with the number going up. Then unlock and check "fixes while in background" is
          above 0.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48, gap: 22 },
  kicker: { color: C.muted, fontSize: 12, fontFamily: 'Menlo' },
  title: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', fontStyle: 'italic', letterSpacing: -0.8, lineHeight: 42 },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  rowKey: { color: C.muted, fontSize: 13, fontFamily: 'Menlo', flexShrink: 1 },
  rowVal: { color: C.text, fontSize: 13, fontFamily: 'Menlo' },
  buttons: { gap: 10 },
  pill: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillFilled: { backgroundColor: C.chrome, borderWidth: 1, borderColor: '#FFFFFF' },
  pillOutline: { borderWidth: 1, borderColor: '#FFFFFF' },
  pillText: { fontSize: 16, fontWeight: '600', fontStyle: 'italic' },
  error: { color: '#FFFFFF', fontSize: 14, borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 16, padding: 12 },
  help: { color: C.muted, fontSize: 14, lineHeight: 20 },
});
