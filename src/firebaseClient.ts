import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize core app only (no auth side-effects)
export function ensureFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseDb() {
  const app = ensureFirebaseApp();
  return getFirestore(app);
}

export function getFirebaseAuth() {
  const app = ensureFirebaseApp();
  return getAuth(app);
}

export const authProvider = new GoogleAuthProvider();
authProvider.setCustomParameters({
  hd: 'athlas.io',
  prompt: 'select_account',
});

export { getAuth, signInWithPopup, signOut, onAuthStateChanged };


