import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';
import { fonts } from './tokens';

type Props = { title: string; onPress: () => void; variant?: 'primary' | 'outline'; arrow?: boolean };

// Welcome-screen buttons from the Figma (filled + outlined, springy press).
// Colours come from the shared theme so they stay in step with <PrimaryButton />.
export default function WelcomeButton({ title, onPress, variant = 'primary', arrow }: Props) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  const primary = variant === 'primary';
  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.97)} onPressOut={() => to(1)} accessibilityRole="button" accessibilityLabel={title}>
      <Animated.View style={[styles.base, primary ? styles.primary : styles.outline, { transform: [{ scale: s }] }]}>
        <Text style={[styles.text, { color: primary ? colors.textOnPrimary : colors.primary }]}>{title}{arrow ? '  ›' : ''}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  outline: { borderWidth: 1.5, borderColor: colors.primary },
  text: { fontFamily: fonts.bold, fontSize: 15 },
});
