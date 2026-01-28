/**
 * Custom React hooks for Firestore data management
 * Provides real-time data sync and CRUD operations
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/FirebaseAuthProvider";
import {
    getUserProfile,
    getSpendLogs,
    getCategoryBudgets,
    getSavingsGoals,
    getRecurringRules,
    getNotifications,
    getChatMessages,
    createSpendLog,
    deleteSpendLog,
    deleteAllSpendLogs,
    setCategoryBudgets,
    updateUserProfile,
    createChatMessage,
    deleteAllChatMessages,
} from "@/lib/firebase/firestore";
import {
    UserProfile,
    ChatMessage,
} from "@/lib/firebase/types";
import {
    SpendLog,
    SavingsGoal,
    RecurringRule,
    Notification,
    SpendCategory,
} from "@/app/lib/types";

// Hook for user profile
export function useUserProfile() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await getUserProfile(user.uid);
                setProfile(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, authLoading]);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;

        try {
            await updateUserProfile(user.uid, updates);
            setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { profile, loading, error, updateProfile };
}

// Hook for spend logs
export function useSpendLogs() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<SpendLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchLogs = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getSpendLogs(user.uid);
            setLogs(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchLogs();
        }
    }, [user, authLoading]);

    const addLog = async (log: Omit<SpendLog, "id">) => {
        if (!user) return;

        try {
            const id = await createSpendLog(user.uid, log);
            setLogs((prev) => [{ ...log, id }, ...prev]);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    const removeLog = async (logId: string) => {
        if (!user) return;

        try {
            await deleteSpendLog(user.uid, logId);
            setLogs((prev) => prev.filter((l) => l.id !== logId));
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    const clearAllLogs = async () => {
        if (!user) return;

        try {
            await deleteAllSpendLogs(user.uid);
            setLogs([]);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { logs, loading, error, addLog, removeLog, clearAllLogs, refetch: fetchLogs };
}

// Hook for category budgets
export function useCategoryBudgets() {
    const { user, loading: authLoading } = useAuth();
    const [budgets, setBudgets] = useState<Record<SpendCategory, number> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchBudgets = async () => {
            try {
                setLoading(true);
                const data = await getCategoryBudgets(user.uid);
                setBudgets(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgets();
    }, [user, authLoading]);

    const updateBudgets = async (newBudgets: Record<SpendCategory, number>) => {
        if (!user) return;

        try {
            await setCategoryBudgets(user.uid, newBudgets);
            setBudgets(newBudgets);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { budgets, loading, error, updateBudgets };
}

// Hook for savings goals
export function useSavingsGoals() {
    const { user, loading: authLoading } = useAuth();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchGoals = async () => {
            try {
                setLoading(true);
                const data = await getSavingsGoals(user.uid);
                setGoals(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, [user, authLoading]);

    return { goals, loading, error };
}

// Hook for recurring rules
export function useRecurringRules() {
    const { user, loading: authLoading } = useAuth();
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchRules = async () => {
            try {
                setLoading(true);
                const data = await getRecurringRules(user.uid);
                setRules(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, [user, authLoading]);

    return { rules, loading, error };
}

// Hook for notifications
export function useNotifications() {
    const { user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const data = await getNotifications(user.uid);
                setNotifications(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [user, authLoading]);

    return { notifications, loading, error };
}

// Hook for chat messages
export function useChatMessages() {
    const { user, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMessages = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getChatMessages(user.uid);
            setMessages(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchMessages();
        }
    }, [user, authLoading]);

    const addMessage = async (message: Omit<ChatMessage, "id" | "userId">) => {
        if (!user) return;

        try {
            const id = await createChatMessage(user.uid, {
                ...message,
                userId: user.uid,
            });
            setMessages((prev) => [...prev, { ...message, id, userId: user.uid }]);
            return id;
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    const clearMessages = async () => {
        if (!user) return;

        try {
            await deleteAllChatMessages(user.uid);
            setMessages([]);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    return { messages, loading, error, addMessage, clearMessages, refetch: fetchMessages };
}
