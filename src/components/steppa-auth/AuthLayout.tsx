import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from './Logo';
import Scene from './Scene';
import useEntrance from './useEntrance';
import { colors } from '@/theme';
import { brand, fonts } from './tokens';

type Props = { title: string; subtitle: string; onBack: () => void; children: ReactNode };

// Mint hero with the walking scene, and a white sheet that glides up over it.
export default function AuthLayout({ title, subtitle, onBack, children }: Props) {
  const sheet = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sheet, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [sheet]);
  const head = useEntrance(250);
  return (
    <View style={{ flex: 1, backgroundColor: brand.mint }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: brand.mint }}>
        <View style={styles.top}>
          <Pressable onPress={onBack} style={styles.back} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Logo size={0.7} />
          <View style={{ width: 40 }} />
        </View>
        <Scene height={150} style={{ borderRadius: 0, marginTop: 6 }} studentScale={0.72} />
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.sheet, { opacity: sheet, transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }]}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View style={head}>
              <Text style={styles.h1}>{title}</Text>
              <Text style={styles.sub}>{subtitle}</Text>
            </Animated.View>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: brand.white, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: colors.primary, fontFamily: fonts.bold },
  sheet: { flex: 1, backgroundColor: brand.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -26, overflow: 'hidden' },
  h1: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, letterSpacing: -0.6 },
  sub: { marginTop: 4, marginBottom: 20, fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
});
