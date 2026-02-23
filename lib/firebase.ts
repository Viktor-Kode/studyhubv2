import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyC0pmHvjHbAk9TJZg_plTEl6ESvWGR499I",
    authDomain: "studyhelp-82734.firebaseapp.com",
    projectId: "studyhelp-82734",
    storageBucket: "studyhelp-82734.firebasestorage.app",
    messagingSenderId: "763192836819",
    appId: "1:763192836819:web:57c6143c89f446cfeeca26",
    measurementId: "G-XRQL3M5CQK"
}

// Prevent re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }
