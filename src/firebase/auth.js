import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up a new user and create their profile doc in Firestore.
// Firestore doc lets you store caregiver links, device IDs, thresholds, etc.
// beyond what Firebase Auth itself stores.
export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    displayName: displayName || '',
    createdAt: serverTimestamp(),
    deviceId: null, // link this to the Arduino/ESP32 device ID once paired
  });
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  return signOut(auth);
}

// Subscribe to auth state changes. Call the returned unsubscribe function
// on cleanup (e.g. in a useEffect return).
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
