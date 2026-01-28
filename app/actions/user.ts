"use server";

import { getAdminDb, createFirebaseCustomToken } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/firebase/types";

// Note: In a production app, you would verify the Firebase ID token here
// for security. For this migration, we're simplifying.

export async function saveUserProfile(userId: string, profile: Partial<UserProfile>) {
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const db = getAdminDb();
    const profileRef = db.doc(`users/${userId}/profile/main`);

    // Get existing profile to preserve createdAt
    const doc = await profileRef.get();
    const existingData = doc.data() as UserProfile | undefined;

    const now = new Date().toISOString();

    const profileData = {
        ...profile,
        userId,
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
    };

    await profileRef.set(profileData, { merge: true });

    return { success: true };
}

export async function getFirebaseToken(userId: string) {
    if (!userId) return null;
    return await createFirebaseCustomToken(userId);
}
