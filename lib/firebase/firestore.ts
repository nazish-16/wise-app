/**
 * Firestore CRUD operations for Wise App
 * Client-side operations using Firebase SDK
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { db } from "./client";
import {
    UserProfile,
    CategoryBudgetsDoc,
    FirestoreSpendLog,
    FirestoreSavingsGoal,
    FirestoreRecurringRule,
    FirestoreNotification,
    ChatMessage,
} from "./types";
import { SpendLog, SavingsGoal, RecurringRule, Notification, SpendCategory } from "@/app/lib/types";

// ==================== USER PROFILE ====================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const profileRef = doc(db, `users/${userId}/profile/main`);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            return profileSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
}

export async function setUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
        const profileRef = doc(db, `users/${userId}/profile/main`);
        const now = new Date().toISOString();

        const existingProfile = await getUserProfile(userId);

        const profileData: UserProfile = {
            userId,
            income: profile.income ?? existingProfile?.income ?? 0,
            fixedExpenses: profile.fixedExpenses ?? existingProfile?.fixedExpenses ?? 0,
            savingsGoal: profile.savingsGoal ?? existingProfile?.savingsGoal ?? 0,
            monthlySubscriptions: profile.monthlySubscriptions ?? existingProfile?.monthlySubscriptions ?? 0,
            onboardingCompleted: profile.onboardingCompleted ?? existingProfile?.onboardingCompleted ?? false,
            createdAt: existingProfile?.createdAt ?? now,
            updatedAt: now,
        };

        await setDoc(profileRef, profileData);
    } catch (error) {
        console.error("Error setting user profile:", error);
        throw error;
    }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
        const profileRef = doc(db, `users/${userId}/profile/main`);
        await updateDoc(profileRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}

// ==================== SPEND LOGS ====================

export async function createSpendLog(userId: string, log: Omit<SpendLog, "id">): Promise<string> {
    try {
        const logsRef = collection(db, `users/${userId}/logs`);
        const docRef = await addDoc(logsRef, {
            ...log,
            userId,
            createdAt: log.createdAt || new Date().toISOString(),
        } as FirestoreSpendLog);

        return docRef.id;
    } catch (error) {
        console.error("Error creating spend log:", error);
        throw error;
    }
}

export async function getSpendLogs(userId: string, limitCount?: number): Promise<SpendLog[]> {
    try {
        const logsRef = collection(db, `users/${userId}/logs`);
        const q = limitCount
            ? query(logsRef, orderBy("createdAt", "desc"), limit(limitCount))
            : query(logsRef, orderBy("createdAt", "desc"));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as SpendLog));
    } catch (error) {
        console.error("Error getting spend logs:", error);
        throw error;
    }
}

export async function updateSpendLog(userId: string, logId: string, updates: Partial<SpendLog>): Promise<void> {
    try {
        const logRef = doc(db, `users/${userId}/logs/${logId}`);
        await updateDoc(logRef, updates);
    } catch (error) {
        console.error("Error updating spend log:", error);
        throw error;
    }
}

export async function deleteSpendLog(userId: string, logId: string): Promise<void> {
    try {
        const logRef = doc(db, `users/${userId}/logs/${logId}`);
        await deleteDoc(logRef);
    } catch (error) {
        console.error("Error deleting spend log:", error);
        throw error;
    }
}

export async function deleteAllSpendLogs(userId: string): Promise<void> {
    try {
        const logsRef = collection(db, `users/${userId}/logs`);
        const querySnapshot = await getDocs(logsRef);

        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Error deleting all spend logs:", error);
        throw error;
    }
}

// ==================== BUDGETS ====================

export async function getCategoryBudgets(userId: string): Promise<Record<SpendCategory, number> | null> {
    try {
        const budgetRef = doc(db, `users/${userId}/budgets/main`);
        const budgetSnap = await getDoc(budgetRef);

        if (budgetSnap.exists()) {
            const data = budgetSnap.data() as CategoryBudgetsDoc;
            return data.budgets;
        }
        return null;
    } catch (error) {
        console.error("Error getting category budgets:", error);
        throw error;
    }
}

export async function setCategoryBudgets(userId: string, budgets: Record<SpendCategory, number>): Promise<void> {
    try {
        const budgetRef = doc(db, `users/${userId}/budgets/main`);
        const budgetData: CategoryBudgetsDoc = {
            userId,
            budgets,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(budgetRef, budgetData);
    } catch (error) {
        console.error("Error setting category budgets:", error);
        throw error;
    }
}

// ==================== SAVINGS GOALS ====================

export async function createSavingsGoal(userId: string, goal: Omit<SavingsGoal, "id">): Promise<string> {
    try {
        const goalsRef = collection(db, `users/${userId}/goals`);
        const docRef = await addDoc(goalsRef, {
            ...goal,
            userId,
            createdAt: goal.createdAt || new Date().toISOString(),
        } as FirestoreSavingsGoal);

        return docRef.id;
    } catch (error) {
        console.error("Error creating savings goal:", error);
        throw error;
    }
}

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    try {
        const goalsRef = collection(db, `users/${userId}/goals`);
        const q = query(goalsRef, orderBy("createdAt", "desc"));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as SavingsGoal));
    } catch (error) {
        console.error("Error getting savings goals:", error);
        throw error;
    }
}

export async function updateSavingsGoal(userId: string, goalId: string, updates: Partial<SavingsGoal>): Promise<void> {
    try {
        const goalRef = doc(db, `users/${userId}/goals/${goalId}`);
        await updateDoc(goalRef, updates);
    } catch (error) {
        console.error("Error updating savings goal:", error);
        throw error;
    }
}

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
    try {
        const goalRef = doc(db, `users/${userId}/goals/${goalId}`);
        await deleteDoc(goalRef);
    } catch (error) {
        console.error("Error deleting savings goal:", error);
        throw error;
    }
}

// ==================== RECURRING RULES ====================

export async function createRecurringRule(userId: string, rule: Omit<RecurringRule, "id">): Promise<string> {
    try {
        const rulesRef = collection(db, `users/${userId}/recurring`);
        const docRef = await addDoc(rulesRef, {
            ...rule,
            userId,
            createdAt: rule.createdAt || new Date().toISOString(),
        } as FirestoreRecurringRule);

        return docRef.id;
    } catch (error) {
        console.error("Error creating recurring rule:", error);
        throw error;
    }
}

export async function getRecurringRules(userId: string): Promise<RecurringRule[]> {
    try {
        const rulesRef = collection(db, `users/${userId}/recurring`);
        const q = query(rulesRef, orderBy("createdAt", "desc"));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as RecurringRule));
    } catch (error) {
        console.error("Error getting recurring rules:", error);
        throw error;
    }
}

export async function updateRecurringRule(userId: string, ruleId: string, updates: Partial<RecurringRule>): Promise<void> {
    try {
        const ruleRef = doc(db, `users/${userId}/recurring/${ruleId}`);
        await updateDoc(ruleRef, updates);
    } catch (error) {
        console.error("Error updating recurring rule:", error);
        throw error;
    }
}

export async function deleteRecurringRule(userId: string, ruleId: string): Promise<void> {
    try {
        const ruleRef = doc(db, `users/${userId}/recurring/${ruleId}`);
        await deleteDoc(ruleRef);
    } catch (error) {
        console.error("Error deleting recurring rule:", error);
        throw error;
    }
}

// ==================== NOTIFICATIONS ====================

export async function createNotification(userId: string, notification: Omit<Notification, "id">): Promise<string> {
    try {
        const notifsRef = collection(db, `users/${userId}/notifications`);
        const docRef = await addDoc(notifsRef, {
            ...notification,
            userId,
            createdAt: notification.createdAt || new Date().toISOString(),
        } as FirestoreNotification);

        return docRef.id;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}

export async function getNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
    try {
        const notifsRef = collection(db, `users/${userId}/notifications`);
        const q = query(notifsRef, orderBy("createdAt", "desc"), limit(limitCount));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Notification));
    } catch (error) {
        console.error("Error getting notifications:", error);
        throw error;
    }
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
        const notifRef = doc(db, `users/${userId}/notifications/${notificationId}`);
        await updateDoc(notifRef, { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
}

export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
        const notifRef = doc(db, `users/${userId}/notifications/${notificationId}`);
        await deleteDoc(notifRef);
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
}

// ==================== CHAT MESSAGES ====================

export async function createChatMessage(userId: string, message: Omit<ChatMessage, "id">): Promise<string> {
    try {
        const chatRef = collection(db, `users/${userId}/chat`);
        const docRef = await addDoc(chatRef, {
            ...message,
            userId,
            timestamp: message.timestamp || Date.now(),
        });

        return docRef.id;
    } catch (error) {
        console.error("Error creating chat message:", error);
        throw error;
    }
}

export async function getChatMessages(userId: string, limitCount = 100): Promise<ChatMessage[]> {
    try {
        const chatRef = collection(db, `users/${userId}/chat`);
        const q = query(chatRef, orderBy("timestamp", "asc"), limit(limitCount));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ChatMessage));
    } catch (error) {
        console.error("Error getting chat messages:", error);
        throw error;
    }
}

export async function deleteAllChatMessages(userId: string): Promise<void> {
    try {
        const chatRef = collection(db, `users/${userId}/chat`);
        const querySnapshot = await getDocs(chatRef);

        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        console.error("Error deleting all chat messages:", error);
        throw error;
    }
}
