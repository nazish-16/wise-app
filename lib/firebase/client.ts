import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton pattern)
// We only initialize if the apiKey is present to avoid crashing during build/SSR
const app = getApps().length === 0
    ? (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null)
    : getApp();

// Initialize Firestore
// If app is null (during build without env vars), we export a mock or null
export const db = app ? getFirestore(app) : null as unknown as any;

// Initialize Auth
// Defensive initialization for Auth to prevent "invalid-api-key" errors during build
export const auth = (() => {
    if (!app) return null as unknown as any;
    try {
        return getAuth(app);
    } catch (error) {
        console.warn("Firebase Auth failed to initialize:", error);
        return null as unknown as any;
    }
})();

// Initialize Analytics (only in browser)
export const analytics = typeof window !== "undefined" && app
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : Promise.resolve(null);

export default app;
