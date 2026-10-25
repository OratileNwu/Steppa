import { useRouter } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/components/steppa-auth/Logo';
import Scene from '@/components/steppa-auth/Scene';
import WelcomeButton from '@/components/steppa-auth/WelcomeButton';
import useEntrance from '@/components/steppa-auth/useEntrance';
import { fonts } from '@/components/steppa-auth/tokens';
import { authActions } from '@/hooks/use-auth-session';
import { colors } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  const logo = useEntrance(0, -12);
  const scene = useEntrance(120, 24);
  const head = useEntrance(280);
  const sub = useEntrance(380);
  const b1 = useEntrance(500, 28);
  const b2 = useEntrance(600, 28);
  const b3 = useEntrance(700, 28);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <Animated.View style={[styles.logo, logo]}>
          <Logo />
          <Text style={styles.tag}>YOUR NEIGHBOURHOOD. ON THE MOVE.</Text>
        </Animated.View>

        <Animated.View style={[styles.scene, scene]}>
          <Scene height={240} />
        </Animated.View>

        <Animated.Text style={[styles.h1, head]}>
          Everyday errands, handled by your neighbourhood.
        </Animated.Text>

        <Animated.Text style={[styles.p, sub]}>
          Get local help when you need it, or earn by helping someone nearby.
        </Animated.Text>

        <View style={styles.spacer} />

        <Animated.View style={b1}>
          <WelcomeButton
            title="I need an errand"
            arrow
            onPress={() =>
              router.push({
                pathname: '/sign-up',
                params: { role: 'requester' },
              })
            }
          />
        </Animated.View>

        <Animated.View style={[styles.secondButton, b2]}>
          <WelcomeButton
            title="I want to run errands"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/sign-up',
                params: { role: 'runner' },
              })
            }
          />
        </Animated.View>

        <Animated.View style={[styles.footer, b3]}>
          <Pressable
            onPress={() => {
              authActions.enterDemo();
              router.replace('/(app)/(tabs)');
            }}
            hitSlop={10}
          >
            <Text style={styles.demo}>Explore demo</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/sign-in')}
            hitSlop={10}
            style={styles.signInButton}
          >
            <Text style={styles.signin}>
              Already on Steppa?{' '}
              <Text style={styles.signinBold}>Sign in</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logo: { alignItems: 'center' },
  tag: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: colors.primary,
  },
  scene: { marginTop: 22 },
  h1: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 25,
    lineHeight: 30,
    color: colors.text,
    letterSpacing: -0.6,
  },
  p: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
    paddingHorizontal: 22,
  },
  spacer: { flex: 1 },
  secondButton: { marginTop: 12 },
  footer: { alignItems: 'center', marginTop: 18 },
  demo: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  signInButton: { marginTop: 14 },
  signin: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  signinBold: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
