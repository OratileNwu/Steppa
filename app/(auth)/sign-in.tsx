import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AppTextInput } from '@/components/AppTextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import AuthLayout from '@/components/steppa-auth/AuthLayout';
import { friendlyAuthError, isEmail } from '@/components/steppa-auth/authErrors';
import { auth } from '@/lib/firebase';
import { colors, spacing } from '@/theme';

type Errors = { email?: string; password?: string; form?: string };
const link = { color: colors.primary, fontWeight: '700' } as const;

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Errors = {};
    if (!isEmail(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      // On success the root layout notices the new session and swaps to the tabs by itself.
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/entry');
    } catch (err: any) {
      setErrors({ form: friendlyAuthError(err?.code) });
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!isEmail(email)) return setErrors({ email: 'Enter your email first, then tap “Forgot password”.' });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your inbox', 'We sent you a password reset link.');
    } catch (err: any) {
      setErrors({ form: friendlyAuthError(err?.code) });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off." onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}>
      <View style={{ gap: spacing.md }}>
        <AppTextInput placeholder="Email" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} error={errors.email} />
        <AppTextInput placeholder="Password" secureTextEntry autoComplete="password" textContentType="password" value={password} onChangeText={setPassword} error={errors.password} />
      </View>
      <Pressable onPress={forgot} style={{ alignSelf: 'flex-end', marginTop: spacing.sm }} hitSlop={8}>
        <AppText variant="small" style={link}>Forgot password?</AppText>
      </Pressable>
      {!!errors.form && <AppText variant="error" style={{ marginTop: spacing.md }}>{errors.form}</AppText>}
      <PrimaryButton title="Sign in" loading={loading} onPress={submit} style={{ marginTop: spacing.lg }} />
      <Pressable onPress={() => router.replace({ pathname: '/sign-up', params: { role: 'requester' } })} style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <AppText variant="secondary">New to Steppa? <AppText variant="secondary" style={link}>Create an account</AppText></AppText>
      </Pressable>
    </AuthLayout>
  );
}
