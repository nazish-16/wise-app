import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK (server-side only)
 * Uses service account credentials from environment variables
 */
export function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    const apps = getApps();
    if (apps.length > 0) {
        adminApp = apps[0];
        return adminApp;
    }

    // Check if we have the required credentials
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId) {
        throw new Error("FIREBASE_ADMIN_PROJECT_ID is not set");
    }

    // If we have full credentials, use them
    if (clientEmail && privateKey) {
        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                // Replace escaped newlines in private key
                privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
        });
    } else {
        // Fallback: use application default credentials (works in Cloud environments)
        adminApp = initializeApp({
            projectId,
        });
    }

    return adminApp;
}

/**
 * Get Firestore Admin instance
 */
export function getAdminDb(): Firestore {
    if (adminDb) {
        return adminDb;
    }

    const app = getAdminApp();
    adminDb = getFirestore(app);
    return adminDb;
}
/**
 * Create a custom token for a user
 */
export async function createFirebaseCustomToken(userId: string): Promise<string> {
    const app = getAdminApp();
    const auth = getAuth(app);
    return await auth.createCustomToken(userId);
}
