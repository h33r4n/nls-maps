import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtClock, fmtDist, fmtDur } from './geo';
import type { NavState } from './nav';
import { arrowFor } from './routing';
import { C, F, PillButton, tap } from './ui';

export default function NavHUD({
  nav,
  speedKmh,
  limit,
  onEnd,
  onVoice,
  onRecentre,
  following,
}: {
  nav: NavState;
  speedKmh: number;
  limit: number | null;
  onEnd: () => void;
  onVoice: () => void;
  onRecentre: () => void;
  following: boolean;
}) {
  const insets = useSafeAreaInsets();
  const r = nav.route!;
  const step = r.steps[nav.step];
  const after = r.steps[nav.step + 1];
  const eta = fmtClock(new Date(Date.now() + nav.remainingS * 1000));

  return (
    <>
      {/* next turn */}
      <View style={[s.banner, { top: insets.top + 6 }]}>
        {nav.arrived ? (
          <View style={s.row}>
            <Text style={s.arrow}>◉</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.dist}>Arrived</Text>
              <Text style={s.instr} numberOfLines={2}>
                {nav.dest?.name}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={s.row}>
              <Text style={s.arrow}>{arrowFor(step)}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.dist}>{fmtDist(nav.toNext)}</Text>
                <Text style={s.instr} numberOfLines={2}>
                  {nav.rerouting ? 'Rerouting…' : step?.text ?? 'Continue'}
                </Text>
              </View>
            </View>
            {after && step?.type !== 'arrive' ? (
              <View style={s.then}>
                <Text style={s.thenText} numberOfLines={1}>
                  then {arrowFor(after)} {after.text}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {nav.error ? (
        <View style={[s.toast, { top: insets.top + 150 }]}>
          <Text style={s.toastText}>{nav.error}</Text>
        </View>
      ) : null}

      {/* side buttons */}
      <View style={[s.side, { bottom: insets.bottom + 120 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nav.voice ? 'Mute voice' : 'Turn voice on'}
          onPress={() => {
            tap();
            onVoice();
          }}
          style={s.round}
        >
          <Text style={s.voiceK}>voice</Text>
          <Text style={s.voiceV}>{nav.voice ? 'on' : 'off'}</Text>
        </Pressable>
        {!following ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recentre"
            onPress={() => {
              tap();
              onRecentre();
            }}
            style={[s.round, { backgroundColor: '#E6E6E6' }]}
          >
            <View style={s.crosshair} />
          </Pressable>
        ) : null}
      </View>

      {/* trip bar */}
      <View style={[s.bar, { bottom: insets.bottom + 12 }]}>
        <View style={[s.speed, limit != null && speedKmh > limit + 2 && s.speedOver]}>
          <Text style={[s.speedNum, limit != null && speedKmh > limit + 2 && { color: '#FF3B4A' }]}>{speedKmh}</Text>
          <Text style={s.speedUnit}>km/h</Text>
        </View>
        {limit != null ? (
          <View style={s.limit}>
            <Text style={s.limitNum}>{limit}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={s.eta}>{nav.arrived ? 'you are here' : eta}</Text>
          <Text style={s.left}>{nav.arrived ? nav.dest?.name : `${fmtDur(nav.remainingS)} · ${fmtDist(nav.remaining)}`}</Text>
        </View>
        <PillButton label={nav.arrived ? 'Done' : 'End'} onPress={onEnd} style={{ width: 86 }} chrome={nav.arrived} />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(11,11,11,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  arrow: { fontSize: 46, color: '#FFFFFF', width: 54, textAlign: 'center' },
  dist: { fontFamily: F.brand, fontSize: 30, color: '#FFFFFF', lineHeight: 34 },
  instr: { fontFamily: F.ui, fontSize: 17, color: '#E6E6E6' },
  then: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 18, paddingVertical: 8 },
  thenText: { fontFamily: F.mono, fontSize: 12, color: C.muted },
  toast: { position: 'absolute', left: 16, right: 16, padding: 10, borderRadius: 16, backgroundColor: 'rgba(11,11,11,0.95)', borderWidth: 1, borderColor: '#FFFFFF' },
  toastText: { fontFamily: F.ui, fontSize: 14, color: '#FFFFFF' },
  side: { position: 'absolute', right: 12, gap: 8 },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(11,11,11,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceK: { fontFamily: F.mono, fontSize: 9, color: C.muted, lineHeight: 11 },
  voiceV: { fontFamily: F.uiItalic, fontSize: 14, color: '#FFFFFF', lineHeight: 16 },
  crosshair: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#0B0B0B' },
  bar: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(11,11,11,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  speed: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  speedOver: { borderColor: '#FF3B4A' },
  limit: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', borderWidth: 5, borderColor: '#E0242F', alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  limitNum: { fontFamily: F.brand, fontSize: 17, color: '#0B0B0B' },
  speedNum: { fontFamily: F.brand, fontSize: 20, color: '#FFFFFF', lineHeight: 22 },
  speedUnit: { fontFamily: F.mono, fontSize: 9, color: C.muted },
  eta: { fontFamily: F.brand, fontSize: 24, color: '#FFFFFF' },
  left: { fontFamily: F.mono, fontSize: 12, color: C.muted },
});
