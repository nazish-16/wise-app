/**
 * Shared types for Firestore documents
 * These extend the existing app types with Firestore-specific fields
 */

import {
    SpendLog,
    SpendCategory,
    UserData,
    SavingsGoal,
    RecurringRule,
    Notification,
    TransactionType,
    Cadence,
} from "@/app/lib/types";

// Chat message type for FinanceGPT
export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    userId: string;
};

// User profile stored in Firestore
export type UserProfile = UserData & {
    userId: string;
    createdAt: string;
    updatedAt: string;
    onboardingCompleted: boolean;
    // Onboarding additional data
    payCycle?: string;
    spendingHabits?: string;
    financialGoals?: string[];
    emergencyFund?: number;
};

// Category budgets document
export type CategoryBudgetsDoc = {
    userId: string;
    budgets: Record<SpendCategory, number>;
    updatedAt: string;
};

// Firestore document types (with Firestore metadata)
export type FirestoreSpendLog = SpendLog & {
    userId: string;
};

export type FirestoreSavingsGoal = SavingsGoal & {
    userId: string;
};

export type FirestoreRecurringRule = RecurringRule & {
    userId: string;
};

export type FirestoreNotification = Notification & {
    userId: string;
};
