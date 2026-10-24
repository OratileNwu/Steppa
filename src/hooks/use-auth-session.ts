import { onAuthStateChanged, type User } from 'firebase/auth';
import { useSyncExternalStore } from 'react';

import { auth } from '@/lib/firebase';

// One tiny store that answers "is this person allowed into the main app?".
// Used by the root layout (<Stack.Protected>) and by the auth screens.
type Session = { user: User | null; ready: boolean; demo: boolean; pending: boolean };

let state: Session = { user: null, ready: false, demo: false, pending: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<Session>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

onAuthStateChanged(auth, (user) => set({ user, ready: true }));

export const authActions = {
  enterDemo: () => set({ demo: true }),
  exitDemo: () => set({ demo: false }),
  // Sign-up creates the account first and the Firestore profile second. Holding the gate
  // closed in between means the home screens never see a user without a profile.
  beginSignUp: () => set({ pending: true }),
  endSignUp: () => set({ pending: false }),
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useAuthSession() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  return { ...s, signedIn: (!!s.user && !s.pending) || s.demo };
}
