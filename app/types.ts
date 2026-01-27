export type CheckStatus = "idle" | "safe" | "risky" | "no";
export type View = "dashboard" | "transactions" | "recurring" | "goals" | "reports" | "insights" | "notifications" | "settings";
export type SpendCategory =
  | "Food"
  | "Transport"
  | "Groceries"
  | "Shopping"
  | "Bills"
  | "Health"
  | "Entertainment"
  | "Other"
  | "Salary"
  | "Bonus"
  | "Savings";

export type Cadence = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
export type TransactionType = "income" | "expense";
export type ContributionType = "monthly" | "flexible";

export type UserData = {
  income: number;
  fixedExpenses: number;
  savingsGoal: number;
  monthlySubscriptions: number;
  [key: string]: unknown;
};

export type SpendLog = {
  id: string;
  amount: number;
  note?: string;
  category?: SpendCategory;
  createdAt: string;
  type: TransactionType;
  isRecurringInstance?: boolean;
  recurringRuleId?: string;
};

export type CategoryBudgets = Record<SpendCategory, number>;

export type RecurringRule = {
  id: string;
  title: string;
  amount: number;
  category: SpendCategory;
  cadence: Cadence;
  nextRunDate: string; // ISO
  active: boolean;
  type: TransactionType;
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string; // ISO
  currentSaved: number;
  contributionType: ContributionType;
  createdAt: string;
};

export type NotificationPref = {
  budgetThreshold: number; // 0-100 %
  dailySafeSpendWarning: boolean;
  weeklyReminder: boolean;
  categoryOverBudgetAlert: boolean;
};

export type Notification = {
  id: string;
  type: "budget" | "warning" | "reminder" | "spike" | "insight";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string; // e.g., "?view=transactions&filterCategory=Food"
};

export type Derived = {
  income: number;
  fixedTotal: number;
  goal: number;
  daysInMonth: number;
  dayOfMonth: number;
  daysLeft: number;
  spendableMonth: number;
  spentThisMonth: number;
  remainingSpendable: number;
  safeSpendToday: number | null;
  monthProgress: number;
  spentToday: number;
  weekSpent: number;
  expectedThisWeek: number;
  deltaWeek: number;
  recent: SpendLog[];
  categoryTotals: Record<SpendCategory, number>;
  topCategories: [string, number][];
  last7: { date: Date; ymd: string; total: number }[];
  max7: number;
  avgPerDaySoFar: number;
  projectedMonthSpend: number;
  projectedRemaining: number;
  spendVsExpected: number;
  utilization: number;
  noSpendStreak: number;
  basePerDay: number;
  daysLeftThisWeek: number;
  safeSpendRestOfWeek: number;
  totalIncomeThisMonth: number;
  netThisMonth: number;
};
