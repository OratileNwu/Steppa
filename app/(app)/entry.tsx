import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { useAuthSession } from '@/hooks/use-auth-session';
import { db } from '@/lib/firebase';

type Destination = '/(app)/(tabs)' | '/runner-home';

export default function AppEntryScreen() {
  const { user, demo } = useAuthSession();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function resolveDestination() {
      setDestination(null);
      setError('');

      if (demo) {
        if (active) setDestination('/(app)/(tabs)');
        return;
      }

      if (!user) {
        if (active) setError('Your session is not available. Please sign in again.');
        return;
      }

      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          throw new Error('Your account profile was not found in Firestore.');
        }

        const role = String(profileSnap.data().role ?? '').toLowerCase();
        const next: Destination =
          role === 'runner' || role === 'steppa'
            ? '/runner-home'
            : '/(app)/(tabs)';

        if (active) setDestination(next);
      } catch (cause) {
        console.error('[Steppa] Could not load account role:', cause);
        if (active) {
          setError('We could not load your account profile. Check your connection and Firestore permissions, then try again.');
        }
      }
    }

    void resolveDestination();
    return () => { active = false; };
  }, [user, demo]);

  if (destination) return <Redirect href={destination} />;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#FFFFFF' }}>
      {error ? (
        <>
          <Text style={{ color: '#20252B', fontSize: 17, fontWeight: '600', textAlign: 'center' }}>We couldn't open your dashboard</Text>
          <Text style={{ color: '#5D6670', textAlign: 'center', lineHeight: 22 }}>{error}</Text>
          <Pressable onPress={() => setError('Retry requires reopening this screen. Please go back and sign in again.')} style={{ backgroundColor: '#087F5B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Please sign in again</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#087F5B" />
          <Text style={{ color: '#5D6670' }}>Loading your Steppa dashboard…</Text>
        </>
      )}
    </View>
  );
}
