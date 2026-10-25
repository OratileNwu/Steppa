import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import type { UserProfile } from '@/types/profile';
import { auth, db } from '@/lib/firebase';

function requireUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to access your profile.');
  }
  return user;
}

export async function getProfile(): Promise<UserProfile> {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, 'users', user.uid));

  if (!snapshot.exists()) {
    throw new Error('Your profile could not be found.');
  }

  const data = snapshot.data();
  const storedRole = data.role;

  let role: UserProfile['role'];
  if (storedRole === 'customer' || storedRole === 'requester') {
    role = 'customer';
  } else if (storedRole === 'steppa' || storedRole === 'runner') {
    role = 'steppa';
  } else {
    throw new Error('Your account has an invalid role.');
  }

  return {
    uid: user.uid,
    displayName: data.name ?? user.displayName ?? '',
    email: data.email ?? user.email ?? '',
    phoneNumber: data.phoneNumber ?? '',
    role,
    photoURL: user.photoURL ?? undefined,
    createdAt:
      typeof data.createdAt?.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : undefined,
  };
}

export async function updateProfile(
  updates: Partial<
    Pick<UserProfile, 'displayName' | 'phoneNumber' | 'photoURL'>
  >
): Promise<UserProfile> {
  const user = requireUser();
  const profileRef = doc(db, 'users', user.uid);

  const changes: Record<string, string> = {};

  if (updates.displayName !== undefined) {
    changes.name = updates.displayName.trim();
  }
  if (updates.phoneNumber !== undefined) {
    changes.phoneNumber = updates.phoneNumber.trim();
  }

  if (Object.keys(changes).length > 0) {
    await updateDoc(profileRef, changes);
  }

  if (
    updates.displayName !== undefined ||
    updates.photoURL !== undefined
  ) {
    await updateAuthProfile(user, {
      ...(updates.displayName !== undefined
        ? { displayName: updates.displayName.trim() }
        : {}),
      ...(updates.photoURL !== undefined
        ? { photoURL: updates.photoURL ?? null }
        : {}),
    });
  }

  return getProfile();
}
