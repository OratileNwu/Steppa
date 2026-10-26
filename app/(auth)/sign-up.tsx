import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from 'react-native';

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
type Errors = Partial<
  Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>
>;

const ROLES: { key: Role; label: string }[] = [
  { key: 'requester', label: 'I need errands' },
  { key: 'runner', label: 'I run errands' },
];

const link = { color: colors.primary, fontWeight: '700' } as const;

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const [role, setRole] = useState<Role>(
    params.role === 'runner' ? 'runner' : 'requester'
  );
  const [form, setForm] = useState({
    name: '',
    university: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const updateField =
    (field: keyof typeof form) => (value: string) => {
      setForm((previous) => ({ ...previous, [field]: value }));
    };

  const submit = async () => {
    const nextErrors: Errors = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = 'Tell us your name.';
    }
    if (!isEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }
    if (form.confirm !== form.password) {
      nextErrors.confirm = "Passwords don't match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!auth || !db) {
      setErrors({ form: 'Authentication is not configured. Please try again later.' });
      return;
    }

    setLoading(true);
    authActions.beginSignUp();

    let createdUser: Awaited<
      ReturnType<typeof createUserWithEmailAndPassword>
    >['user'] | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim().toLowerCase(),
        form.password
      );

      createdUser = credential.user;

      await updateProfile(createdUser, {
        displayName: form.name.trim(),
      });

      await setDoc(doc(db, 'users', createdUser.uid), {
        uid: createdUser.uid,
        name: form.name.trim(),
        university: form.university.trim(),
        email: form.email.trim().toLowerCase(),
        role,
        phoneNumber: '',
        createdAt: serverTimestamp(),
        
      });
await setDoc(doc(db, 'publicProfiles', createdUser.uid), {
  name: form.name.trim(),
  averageRating: 0,
  ratingCount: 0,
});

      router.replace('/entry');

      // The root layout will admit the authenticated user after this.
    } catch (error: any) {
        console.error('Steppa registration failed:', error);

        Alert.alert(
            'Registration failed',
            `${error?.code ?? 'unknown'}\n${error?.message ?? 'No error message available'}`
        );
    } finally {
      authActions.endSignUp();
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join Steppa"
      subtitle="Two minutes to get your neighbourhood moving."
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace('/welcome')
      }
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: brand.mint,
          borderRadius: 16,
          padding: 4,
          marginBottom: spacing.md,
        }}
      >
        {ROLES.map((item) => {
          const selected = role === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => setRole(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : 'transparent',
              }}
            >
              <AppText
                style={{
                  fontWeight: '700',
                  fontSize: 13.5,
                  color: selected ? colors.textOnPrimary : colors.primary,
                }}
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: spacing.md }}>
        <AppTextInput
          placeholder="Full name"
          autoCapitalize="words"
          autoComplete="name"
          value={form.name}
          onChangeText={updateField('name')}
          error={errors.name}
        />
        <AppTextInput
          placeholder="University (optional)"
          autoCapitalize="words"
          value={form.university}
          onChangeText={updateField('university')}
        />
        <AppTextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={form.email}
          onChangeText={updateField('email')}
          error={errors.email}
        />
        <AppTextInput
          placeholder="Password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.password}
          onChangeText={updateField('password')}
          error={errors.password}
        />
        <AppTextInput
          placeholder="Confirm password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          value={form.confirm}
          onChangeText={updateField('confirm')}
          error={errors.confirm}
        />
      </View>

      {!!errors.form && (
        <AppText variant="error" style={{ marginTop: spacing.md }}>
          {errors.form}
        </AppText>
      )}

      <PrimaryButton
        title="Create account"
        loading={loading}
        onPress={submit}
        style={{ marginTop: spacing.lg }}
      />

      <Pressable
        onPress={() => router.replace('/sign-in')}
        style={{ alignItems: 'center', marginTop: spacing.lg }}
      >
        <AppText variant="secondary">
          Already have an account?{' '}
          <AppText variant="secondary" style={link}>
            Sign in
          </AppText>
        </AppText>
      </Pressable>
    </AuthLayout>
  );
}
