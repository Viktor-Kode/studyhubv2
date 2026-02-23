import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// On local/Render, we use the projectId. For full administrative access,
// you'd typically use a service account.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studyhelp-82734',
    });
}

export const adminAuth = admin.auth();
