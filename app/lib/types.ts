export type CheckStatus = "idle" | "safe" | "risky" | "no";
export type View = "dashboard" | "financegpt" | "settings" | "reports" | "goals" | "insights" | "recurring" | "notifications" | "transactions";
export type TransactionType = "income" | "expense";
export type Cadence = "daily" | "weekly" | "monthly" | "yearly";

export type SpendCategory =
  | "Food"
  | "Transport"
  | "Groceries"
  | "Shopping"
  | "Bills"
  | "Health"
  | "Entertainment"
  | "Salary"
  | "Bonus"
  | "Savings"
  | "Other";

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
};

export type CategoryBudgets = Record<SpendCategory, number>;

export type RecurringRule = {
  id: string;
  title: string;
  amount: number;
  category: SpendCategory;
  cadence: Cadence;
  nextRunDate: string;
  active: boolean;
  type: TransactionType;
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
  currentSaved: number;
  contributionType: "monthly" | "flexible";
  createdAt: string;
};

export type Notification = {
  id: string;
  type: "budget" | "warning" | "reminder" | "insight";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type NotificationPref = {
  budgetThreshold: number;
  dailySafeSpendWarning: boolean;
  weeklyReminder: boolean;
};
