// Firebase Configuration
// Konfigurasi Firebase untuk Firestore Database

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

// Firebase configuration - user needs to add these environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Singleton pattern for Firebase app
let firebaseApp: FirebaseApp | null = null
let firestoreDb: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    const apps = getApps()
    if (apps.length > 0) {
      firebaseApp = apps[0]
    } else {
      firebaseApp = initializeApp(firebaseConfig)
    }
  }
  return firebaseApp
}

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseApp())
  }
  return firestoreDb
}

// Check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
}
