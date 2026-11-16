import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export const F = {
  brand: 'Exo2_800ExtraBold_Italic',
  ui: 'Exo2_600SemiBold',
  uiItalic: 'Exo2_600SemiBold_Italic',
  mono: 'SpaceMono_400Regular',
};
export const C = { panel: 'rgba(11,11,11,0.92)', line: 'rgba(255,255,255,0.22)', text: '#EDEDED', muted: '#A8A8A8', ink: '#0B0B0B' };

export const tap = () => Haptics.selectionAsync().catch(() => {});

export function PillButton({
  label,
  onPress,
  chrome,
  style,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  chrome?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  accessibilityLabel?: string;
}) {
  const content = (
    <View style={s.pillInner}>
      {icon}
      <Text style={[s.pillText, { color: chrome ? C.ink : '#FFFFFF' }]}>{label}</Text>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.pill, !chrome && s.pillOutline, pressed && { opacity: 0.6 }, style]}
    >
      {chrome ? (
        <LinearGradient colors={['#FFFFFF', '#B9B9B9']} style={s.fill}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function Switch({ on }: { on: boolean }) {
  return (
    <View style={[s.track, { backgroundColor: on ? '#FFFFFF' : 'transparent' }]}>
      <View style={[s.knob, { left: on ? 21 : 3, backgroundColor: on ? C.ink : '#FFFFFF' }]} />
    </View>
  );
}

const s = StyleSheet.create({
  pill: { height: 44, borderRadius: 22, overflow: 'hidden' },
  pillOutline: { borderWidth: 1, borderColor: '#FFFFFF' },
  fill: { flex: 1 },
  pillInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16 },
  pillText: { fontFamily: F.uiItalic, fontSize: 15 },
  track: { width: 42, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF' },
  knob: { position: 'absolute', top: 3, width: 16, height: 16, borderRadius: 8 },
});
