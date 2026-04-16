import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase configuration using environment variables.
 * Note: If you receive an 'auth/unauthorized-domain' error, you must add your 
 * current domain (e.g., studyhelp.site) to the 'Authorized domains' list in the 
 * Firebase Console -> Authentication -> Settings.
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC0pmHvjHbAk9TJZg_plTEl6ESvWGR499I",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studyhelp-82734.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studyhelp-82734",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studyhelp-82734.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "763192836819",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:763192836819:web:57c6143c89f446cfeeca26",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XRQL3M5CQK"
}

// Prevent re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
