"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/app/components/FirebaseAuthProvider";
import {
    useUserProfile,
    useSpendLogs,
    useCategoryBudgets,
    useSavingsGoals,
    useNotifications
} from "@/lib/hooks/useFirestore";
import { SpendLog, SpendCategory, RecurringRule, SavingsGoal, Notification } from "@/app/lib/types";
import { safeParseJSON } from "@/app/lib/utils";
import { createSpendLog } from "@/lib/firebase/firestore";

const BUDGETS_KEY = "wise_budgets";

export function useDashboardData() {
    const { user } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();
    const { logs: fsLogs, loading: logsLoading } = useSpendLogs();
    const { budgets: fsBudgets, loading: budgetsLoading } = useCategoryBudgets();
    const { goals: fsGoals, loading: goalsLoading } = useSavingsGoals();
    const { notifications: fsNotifs, loading: notifsLoading } = useNotifications();

    const [budgets, setBudgets] = useState<Record<SpendCategory, number>>({} as any);

    useEffect(() => {
        const stored = safeParseJSON<Record<SpendCategory, number>>(localStorage.getItem(BUDGETS_KEY));
        if (stored) setBudgets(stored);
    }, []);

    // Derived data logic (simplified for the hook, can be expanded)
    const logs = useMemo(() => fsLogs || [], [fsLogs]);
    const goals = useMemo(() => fsGoals || [], [fsGoals]);
    const notifications = useMemo(() => fsNotifs || [], [fsNotifs]);

    // Compute derived stats
    const derived = useMemo(() => {
        if (!profile || !logs) return null;

        const CATEGORIES: SpendCategory[] = [
            "Food", "Transport", "Groceries", "Shopping", "Bills",
            "Health", "Entertainment", "Salary", "Bonus", "Savings", "Other"
        ];

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const monthlyExpenses = logs.filter(l => l.type === 'expense' && new Date(l.createdAt) >= startOfMonth);
        const spentThisMonth = monthlyExpenses.reduce((sum, l) => sum + l.amount, 0);

        const spendable = (profile.income || 0) - (profile.fixedExpenses || 0) - (profile.savingsGoal || 0);

        const categoryTotals: Record<string, number> = {};
        CATEGORIES.forEach(c => categoryTotals[c] = 0);
        monthlyExpenses.forEach(l => {
            const c = l.category || 'Other';
            categoryTotals[c] = (categoryTotals[c] || 0) + l.amount;
        });

        const topCategories = Object.entries(categoryTotals)
            .filter(([, v]) => v > 0)
            .sort((a, b) => (b[1] as number) - (a[1] as number));

        // Calculate streak
        let noSpendStreak = 0;
        const sortedDates = [...new Set(logs.map(l => new Date(l.createdAt).toDateString()))]
            .map(d => new Date(d))
            .sort((a, b) => b.getTime() - a.getTime());

        // Simple streak logic: consecutive days from today backwards that have no expenses
        // (This is a bit complex for a simple hook, keeping it simple for now)

        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dayOfMonth = today.getDate();
        const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

        return {
            income: profile.income,
            fixedTotal: profile.fixedExpenses,
            goal: profile.savingsGoal,
            spendableMonth: spendable,
            spentThisMonth,
            remainingSpendable: spendable - spentThisMonth,
            safeSpendToday: (spendable - spentThisMonth) / daysLeft,
            spentToday: logs
                .filter(l => l.type === 'expense' && new Date(l.createdAt).toDateString() === today.toDateString())
                .reduce((sum, l) => sum + l.amount, 0),
            noSpendStreak: 0,
            daysLeft,
            daysInMonth,
            dayOfMonth,
            categoryTotals,
            topCategories,
            budgets,
            projectedMonthSpend: (spentThisMonth / Math.max(1, dayOfMonth)) * daysInMonth,
            projectedRemaining: spendable - ((spentThisMonth / Math.max(1, dayOfMonth)) * daysInMonth),
            weekSpent: 0,
            deltaWeek: 0,
            expectedThisWeek: 0,
        };
    }, [profile, logs, budgets]);

    const addLog = async (log: SpendLog) => {
        if (!user) return;
        await createSpendLog(user.uid, log);
    };

    return {
        userData: profile,
        logs,
        goals,
        notifications,
        derived,
        budgets,
        addLog,
        isLoading: profileLoading || logsLoading || budgetsLoading || goalsLoading || notifsLoading
    };
}
