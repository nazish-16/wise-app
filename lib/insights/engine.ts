import { SpendLog, SpendCategory, CategoryBudgets, ConfidenceScore, SpendIntent, RecurringRule, Cadence } from "../../app/lib/types";

export interface DashboardContext {
    income: number;
    fixedTotal: number;
    goal: number;
    spendableMonth: number;
    spentThisMonth: number;
    remainingSpendable: number;
    safeSpendToday: number;
    noSpendStreak: number;
    categoryTotals: Record<SpendCategory, number>;
    budgets: CategoryBudgets;
    projectedRemaining: number;
    dayOfMonth: number;
    daysLeft: number;
    daysInMonth: number;
    weekSpent: number;
    expectedThisWeek: number;
}

/**
 * 1. Confidence Score Logic
 * budget adherence, noSpendStreak, projectedRemaining, overspend events
 */
export function computeConfidenceScore(context: DashboardContext): ConfidenceScore {
    let score = 70; // Base score
    let reasons: string[] = [];

    // 1. Budget adherence (avg utilization across categories)
    const budgets = context.budgets || {};
    const categories = Object.keys(budgets) as SpendCategory[];
    let overbudgetCount = 0;
    const categoryTotals = context.categoryTotals || {};
    categories.forEach(cat => {
        if (budgets[cat] > 0 && categoryTotals[cat] > budgets[cat]) {
            overbudgetCount++;
        }
    });

    if (overbudgetCount > 0) {
        score -= overbudgetCount * 5;
        reasons.push(`${overbudgetCount} categories over budget`);
    } else {
        score += 5;
        reasons.push("All categories within budget");
    }

    // 2. Streak
    if (context.noSpendStreak > 2) {
        score += Math.min(context.noSpendStreak * 2, 10);
        reasons.push(`${context.noSpendStreak} day no-spend streak!`);
    }

    // 3. Projected remaining
    if (context.projectedRemaining > 0) {
        score += 10;
        reasons.push("On track to save this month");
    } else if (context.projectedRemaining < 0) {
        score -= 15;
        reasons.push("Projected to overspend this month");
    }

    // 4. Safe spend today
    if (context.safeSpendToday > (context.spendableMonth / context.daysInMonth) * 1.2) {
        score += 5;
    } else if (context.safeSpendToday < 0) {
        score -= 10;
        reasons.push("Over spent today's limit");
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score,
        reason: reasons[reasons.length - 1] || "Stable financial health",
        timestamp: new Date().toISOString()
    };
}

/**
 * 2. Spend Fatigue Detection
 * Unusual frequency: N spends in last X hours
 */
export function detectFatigue(logs: SpendLog[], thresholdN = 4, thresholdHours = 12): { detected: boolean; count: number } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);

    const recentSpends = logs.filter(l => l.type === "expense" && new Date(l.createdAt) > cutoff);

    return {
        detected: recentSpends.length >= thresholdN,
        count: recentSpends.length
    };
}

/**
 * 3. Smart Recurring Detection
 * same merchant/note OR same category + similar amount repeated
 */
export function detectRecurring(logs: SpendLog[], existingRules: RecurringRule[]): Partial<RecurringRule> | null {
    const expenses = logs.filter(l => l.type === "expense" && l.amount > 0);
    if (expenses.length < 3) return null;

    // Group by note + amount or category + amount (rough buckets)
    const groups: Record<string, SpendLog[]> = {};

    expenses.forEach(log => {
        const key = `${log.category}-${Math.round(log.amount / 10) * 10}`; // Bucket by category and rounded amount
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
    });

    for (const key in groups) {
        const group = groups[key];
        if (group.length >= 3) {
            // Check if already covered by an existing rule
            const isAlreadyRecurring = existingRules.some(r =>
                r.category === group[0].category &&
                Math.abs(r.amount - group[0].amount) < (group[0].amount * 0.1)
            );

            if (isAlreadyRecurring) continue;

            // Simplistic cadence guess
            const dates = group.map(l => new Date(l.createdAt).getTime()).sort();
            const diffs = [];
            for (let i = 1; i < dates.length; i++) {
                diffs.push(dates[i] - dates[i - 1]);
            }

            const avgDiffDays = (diffs.reduce((a, b) => a + b, 0) / diffs.length) / (1000 * 60 * 60 * 24);

            let cadence: Cadence = "monthly";
            if (avgDiffDays < 2) cadence = "daily";
            else if (avgDiffDays < 10) cadence = "weekly";

            return {
                title: group[0].note || `Recurring ${group[0].category}`,
                amount: group[0].amount,
                category: group[0].category,
                cadence,
                type: "expense"
            };
        }
    }

    return null;
}

/**
 * 4. What-If Simulator
 */
export function simulateWhatIf(context: DashboardContext, amount: number, category: SpendCategory, date?: string) {
    const newSpentThisMonth = context.spentThisMonth + amount;
    const newRemainingSpendable = context.remainingSpendable - amount;

    // Recalculate safeSpendToday
    const daysLeft = context.daysLeft || 1;
    const newSafeSpendToday = Math.max(0, newRemainingSpendable / daysLeft);

    // Week projection impact
    const newWeekSpent = context.weekSpent + amount;

    // Goal delay estimate (extremely rough: divide amount by daily savings goal)
    const dailyTargetSavings = context.goal / context.daysInMonth;
    const goalDelayDays = dailyTargetSavings > 0 ? Math.ceil(amount / dailyTargetSavings) : 0;

    const status: "SAFE" | "RISKY" | "NOT ADVISED" =
        amount <= context.safeSpendToday ? "SAFE" :
            amount <= context.safeSpendToday * 2 ? "RISKY" : "NOT ADVISED";

    return {
        deltas: {
            safeSpendToday: newSafeSpendToday - context.safeSpendToday,
            remainingSpendable: -amount,
            weekSpent: amount
        },
        newValues: {
            safeSpendToday: newSafeSpendToday,
            remainingSpendable: newRemainingSpendable,
            weekSpent: newWeekSpent
        },
        goalDelayDays,
        status
    };
}

/**
 * 5. Threshold Crossing Detection
 */
export function detectThresholdCrossings(prevState: DashboardContext, nextState: DashboardContext) {
    const events = [];

    if (prevState.safeSpendToday > 0 && nextState.safeSpendToday <= 0) {
        events.push({
            type: "warning",
            title: "Daily Limit Reached",
            message: "You've exhausted your safe spend for today."
        });
    }

    if (prevState.projectedRemaining >= 0 && nextState.projectedRemaining < 0) {
        events.push({
            type: "budget",
            title: "Negative Projection",
            message: "At this rate, you'll overspend your monthly budget."
        });
    }

    // Category crossings
    for (const cat in nextState.budgets) {
        const c = cat as SpendCategory;
        const budget = nextState.budgets[c];
        if (budget > 0) {
            const prevUtil = prevState.categoryTotals[c] / budget;
            const nextUtil = nextState.categoryTotals[c] / budget;

            if (prevUtil < 1 && nextUtil >= 1) {
                events.push({
                    type: "budget",
                    title: "Budget Exceeded",
                    message: `You've spent more than your ${c} budget.`
                });
            } else if (prevUtil < 0.9 && nextUtil >= 0.9) {
                events.push({
                    type: "warning",
                    title: "Budget Alert",
                    message: `You've used 90% of your ${c} budget.`
                });
            }
        }
    }

    return events;
}

/**
 * 6. Time-Aware Sensitivity
 */
export function getTimeSensitivity(context: DashboardContext) {
    const progress = context.dayOfMonth / context.daysInMonth;
    if (progress > 0.7) {
        return {
            label: "Late-month sensitivity",
            level: "medium",
            message: "You are in the last 30% of the month. Every ₹ counts more now."
        };
    }
    return null;
}
