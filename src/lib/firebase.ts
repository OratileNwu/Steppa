import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore – Firebase ships this in its React Native build (Metro picks it up), but its TS types omit it.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Values come from `.env.local` (copy `.env.example`). Never commit real keys.
const env = process.env;
export const isFirebaseConfigured = !!env.EXPO_PUBLIC_FIREBASE_API_KEY;
if (!isFirebaseConfigured) {
  console.warn('[steppa] Firebase keys missing – add them to .env.local, then run `npx expo start -c`.');
}

const firebaseConfig = {
  // placeholder keeps the app booting (welcome screen + demo still work) when keys are missing
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'missing-api-key',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isFresh = getApps().length === 0;
const app = isFresh ? initializeApp(firebaseConfig) : getApp();

// Phones keep the login between launches via AsyncStorage. The web build has its own
// persistence (and no getReactNativePersistence), so it uses the default getAuth().
export const auth =
  isFresh && Platform.OS !== 'web'
    ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
    : getAuth(app);
export const db = getFirestore(app);
