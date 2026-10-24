import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AppTextInput } from '@/components/AppTextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import AuthLayout from '@/components/steppa-auth/AuthLayout';
import { friendlyAuthError, isEmail } from '@/components/steppa-auth/authErrors';
import { brand } from '@/components/steppa-auth/tokens';
import { authActions } from '@/hooks/use-auth-session';
import { auth, db } from '@/lib/firebase';
import { colors, spacing } from '@/theme';

type Role = 'requester' | 'runner';
const ROLES: { key: Role; label: string }[] = [
  { key: 'requester', label: 'I need errands' },
  { key: 'runner', label: 'I run errands' },
];
type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>;
const link = { color: colors.primary, fontWeight: '700' } as const;

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<Role>(params.role === 'runner' ? 'runner' : 'requester');
  const [f, setF] = useState({ name: '', university: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const e: Errors = {};
    if (f.name.trim().length < 2) e.name = 'Tell us your name.';
    if (!isEmail(f.email)) e.email = 'Enter a valid email address.';
    if (f.password.length < 8) e.password = 'Use at least 8 characters.';
    if (f.confirm !== f.password) e.confirm = 'Passwords don’t match.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    authActions.beginSignUp(); // keep the gate shut until the profile is saved
    try {
      const { user } = await createUserWithEmailAndPassword(auth, f.email.trim(), f.password);
      try {
        await updateProfile(user, { displayName: f.name.trim() });
        await setDoc(doc(db, 'users', user.uid), {
          name: f.name.trim(),
          university: f.university.trim(),
          email: f.email.trim().toLowerCase(),
          role,
          createdAt: serverTimestamp(),
        });
      } catch (profileErr) {
        await user.delete().catch(() => {}); // don't leave an account with no profile behind
        throw profileErr;
      }
    } catch (err: any) {
      setErrors({ form: friendlyAuthError(err?.code) });
      setLoading(false);
    } finally {
      authActions.endSignUp(); // on success this lets the root layout open the tabs
    }
  };

  return (
    <AuthLayout title="Join Steppa" subtitle="Two minutes to get your neighbourhood moving." onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}>
      <View style={{ flexDirection: 'row', backgroundColor: brand.mint, borderRadius: 16, padding: 4, marginBottom: spacing.md }}>
        {ROLES.map((r) => {
          const on = role === r.key;
          return (
            <Pressable key={r.key} onPress={() => setRole(r.key)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : 'transparent' }}>
              <AppText style={{ fontWeight: '700', fontSize: 13.5, color: on ? colors.textOnPrimary : colors.primary }}>{r.label}</AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: spacing.md }}>
        <AppTextInput placeholder="Full name" autoCapitalize="words" autoComplete="name" value={f.name} onChangeText={set('name')} error={errors.name} />
        <AppTextInput placeholder="University (optional)" autoCapitalize="words" value={f.university} onChangeText={set('university')} />
        <AppTextInput placeholder="Email" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={f.email} onChangeText={set('email')} error={errors.email} />
        <AppTextInput placeholder="Password" secureTextEntry autoComplete="new-password" textContentType="newPassword" value={f.password} onChangeText={set('password')} error={errors.password} />
        <AppTextInput placeholder="Confirm password" secureTextEntry autoComplete="new-password" textContentType="newPassword" value={f.confirm} onChangeText={set('confirm')} error={errors.confirm} />
      </View>
      {!!errors.form && <AppText variant="error" style={{ marginTop: spacing.md }}>{errors.form}</AppText>}
      <PrimaryButton title="Create account" loading={loading} onPress={submit} style={{ marginTop: spacing.lg }} />
      <Pressable onPress={() => router.replace('/sign-in')} style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <AppText variant="secondary">Already have an account? <AppText variant="secondary" style={link}>Sign in</AppText></AppText>
      </Pressable>
    </AuthLayout>
  );
}
