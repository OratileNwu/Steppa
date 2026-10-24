export function friendlyAuthError(code?: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'That email already has an account. Try signing in.';
    case 'auth/invalid-email': return 'That email address doesn’t look right.';
    case 'auth/weak-password': return 'Choose a stronger password (8+ characters).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Wrong email or password. Please try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed': return 'No connection. Check your internet and retry.';
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found': return 'Firebase isn’t set up yet. Add your keys to .env.local and restart.';
    case 'auth/operation-not-allowed': return 'Email sign-in isn’t switched on in Firebase yet.';
    case 'permission-denied': return 'We couldn’t save your profile. Check the Firestore rules.';
    default: return 'Something went wrong. Please try again.';
  }
}
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
