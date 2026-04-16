import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// On local/Render, we use the projectId. For full administrative access,
// you'd typically use a service account.
if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studyhelp-82734';

    if (serviceAccountJson) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId
            });
        } catch (err) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
            admin.initializeApp({ projectId });
        }
    } else {
        admin.initializeApp({
            projectId
        });
    }
}

export const adminAuth = admin.auth();
