import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDist, type LL } from './geo';
import { ICONS } from './places';
import { tagLabel, useSaved } from './saved';
import { searchPlaces, type Result } from './search';
import { C, F, tap } from './ui';

export default function SearchSheet({ near, onPick, onClose }: { near: LL | null; onPick: (r: Result) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const saved = useSaved();
  const savedRows: Result[] = saved.map((s) => ({
    id: `saved-${s.id}`,
    name: s.tag === 'fav' ? s.name : tagLabel(s.tag),
    detail: s.tag === 'fav' ? `★ ${s.detail ?? 'saved'}` : `★ ${s.name}`,
    lat: s.lat,
    lng: s.lng,
    kind: s.kind,
  }));
  const showSaved = q.trim().length < 2;

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const t = setTimeout(() => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setLoading(true);
      searchPlaces(query, near, c.signal)
        .then((r) => {
          setResults(r);
          setError(r.length ? null : 'Nothing found');
        })
        .catch((e) => {
          if (e?.name !== 'AbortError') setError('Search failed — check your signal');
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View style={[StyleSheet.absoluteFill, s.screen, { paddingTop: insets.top + 8 }]}>
      <View style={s.bar}>
        <View style={s.inputWrap}>
          <Text style={s.glass}>⌕</Text>
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search places, addresses, stops"
            placeholderTextColor="#7A7A7A"
            style={s.input}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
            keyboardAppearance="dark"
          />
          {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={s.cancel}>
          <Text style={s.cancelText}>cancel</Text>
        </Pressable>
      </View>

      <FlatList
        data={showSaved ? savedRows : results}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          q.trim().length >= 2 && !loading && error ? <Text style={s.empty}>{error}</Text> : <Text style={s.empty}>{showSaved ? 'Save places with ☆ on any place card — Home and Work show up here.' : 'Try a street, a shop, or a stop name.'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              tap();
              Keyboard.dismiss();
              onPick(item);
            }}
            style={({ pressed }) => [s.row, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}
          >
            <Image source={ICONS[`poi-${item.kind}` as keyof typeof ICONS]} style={s.icon} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.name} numberOfLines={1}>
                {item.name}
              </Text>
              {item.detail ? (
                <Text style={s.detail} numberOfLines={1}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
            {item.dist != null ? <Text style={s.dist}>{fmtDist(item.dist)}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { backgroundColor: 'rgba(11,11,11,0.98)', paddingHorizontal: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  inputWrap: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  glass: { color: '#FFFFFF', fontSize: 20 },
  input: { flex: 1, color: '#FFFFFF', fontFamily: F.ui, fontSize: 17 },
  cancel: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  cancelText: { fontFamily: F.uiItalic, fontSize: 16, color: '#E6E6E6' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  icon: { width: 34, height: 34 },
  name: { fontFamily: F.ui, fontSize: 17, color: '#FFFFFF' },
  detail: { fontFamily: F.ui, fontSize: 13, color: C.muted, marginTop: 1 },
  dist: { fontFamily: F.mono, fontSize: 12, color: C.muted },
  empty: { fontFamily: F.ui, fontSize: 14, color: '#8A8A8A', textAlign: 'center', marginTop: 30 },
});
