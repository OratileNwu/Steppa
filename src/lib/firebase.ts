
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore – Firebase ships this in its React Native build (Metro picks it up), but its TS types omit it.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Use static environment-variable references so Expo can inline them in web builds.
export const isFirebaseConfigured =
    !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!isFirebaseConfigured) {
    console.warn(
        '[steppa] Firebase keys missing – add them to .env.local, then run `npx expo start -c`.'
    );
}

const firebaseConfig = {
    apiKey:
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'missing-api-key',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isFresh = getApps().length === 0;
const app = isFresh ? initializeApp(firebaseConfig) : getApp();

// Phones keep the login between launches via AsyncStorage.
// The web build uses Firebase's default auth persistence.
export const auth =
    isFresh && Platform.OS !== 'web'
        ? initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        })
        : getAuth(app);

export const db = getFirestore(app);
