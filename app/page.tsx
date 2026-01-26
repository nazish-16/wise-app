/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiDedge } from "react-icons/si";
import { BiMenu } from "react-icons/bi";
import { MdDashboard, MdTrendingUp, MdSettings, MdAssignment, MdStart, MdLightbulb, MdRepeat, MdNotifications } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type CheckStatus = "idle" | "safe" | "risky" | "no";
type View = "dashboard" | "financegpt" | "settings" | "reports" | "goals" | "insights" | "recurring" | "notifications";

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(d: Date) {
  // Monday as start of week
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function getYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type UserData = {
  income: number;
  fixedExpenses: number;
  savingsGoal: number;
  monthlySubscriptions: number;
  [key: string]: unknown;
};

type SpendCategory =
  | "Food"
  | "Transport"
  | "Groceries"
  | "Shopping"
  | "Bills"
  | "Health"
  | "Entertainment"
  | "Other";

const CATEGORIES: SpendCategory[] = [
  "Food",
  "Transport",
  "Groceries",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
];

type SpendLog = {
  id: string;
  amount: number;
  note?: string;
  category?: SpendCategory;
  createdAt: string; // ISO
};

type CategoryBudgets = Record<SpendCategory, number>;

const USER_KEY = "wise_user_data";
const LOG_KEY = "wise_spend_logs";
const BUDGETS_KEY = "wise_category_budgets";

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function downloadJSON(filename: string, data: unknown) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Stable Components (prevents input focus loss) ----------

function FinanceGPT() {
  const border = "border-[rgb(var(--border))]";
  const fg = "text-[rgb(var(--foreground))]";
  const muted = "text-[rgb(var(--muted-foreground))]";
  const cardBg = "bg-[rgb(var(--card))]";

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className={`w-full max-w-xl rounded-lg border ${border} ${cardBg} p-6`}>
        <h2 className={`text-sm font-semibold ${fg}`}>FinanceGPT</h2>
        <p className={`text-sm ${muted} mt-2 leading-relaxed`}>
          Coming soon. We’ll connect Gemini here. For now, the dashboard focuses on real-time spend checks
          and staying on track.
        </p>
      </div>
    </div>
  );
}

function Settings({ userData, onUpdate }: { userData: UserData; onUpdate: () => void }) {
  const [income, setIncome] = useState<string>(String(userData.income || ""));
  const [fixedExpenses, setFixedExpenses] = useState<string>(String(userData.fixedExpenses || ""));
  const [savingsGoal, setSavingsGoal] = useState<string>(String(userData.savingsGoal || ""));
  const [monthlySubscriptions, setMonthlySubscriptions] = useState<string>(
    String(userData.monthlySubscriptions || "")
  );
  const [saved, setSaved] = useState(false);

  const cardBg = "bg-[rgb(var(--card))]";
  const border = "border-[rgb(var(--border))]";
  const fg = "text-[rgb(var(--foreground))]";
  const muted = "text-[rgb(var(--muted-foreground))]";

  const inputBase =
    `w-full rounded-lg border ${border} ${cardBg} ${fg} ` +
    "px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[rgb(var(--ring))] focus:border-transparent";

  const buttonPrimary =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]";

  const handleSave = () => {
    const updated: UserData = {
      ...userData,
      income: Number(income || 0),
      fixedExpenses: Number(fixedExpenses || 0),
      savingsGoal: Number(savingsGoal || 0),
      monthlySubscriptions: Number(monthlySubscriptions || 0),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onUpdate();
    }, 700);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-4">Financial Information</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${fg}`}>Monthly Income</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                type="text"
                inputMode="numeric"
                value={income}
                onChange={(e) => setIncome(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${fg}`}>Fixed Expenses</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                type="text"
                inputMode="numeric"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${fg}`}>Monthly Subscriptions</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                type="text"
                inputMode="numeric"
                value={monthlySubscriptions}
                onChange={(e) => setMonthlySubscriptions(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${fg}`}>Monthly Savings Goal</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                type="text"
                inputMode="numeric"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`${buttonPrimary} ${saved ? "bg-green-500/10 border-green-500/40" : ""}`}
        >
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function HeaderLogo({ border }: { border: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Image
        src="/assets/white-logo.png"
        alt="Wise"
        width={35}
        height={35}
        className="hover:bg-[#4d4d4d7c] rounded-md"
      />
      <div className={`leading-tight border ${border} rounded-full p-1 hover:bg-[#4d4d4d7c]`}>
        <SiDedge size={17} />
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  labelLeft,
  labelRight,
  border,
  shellBg,
  muted,
}: {
  value: number; // 0..1
  labelLeft: string;
  labelRight: string;
  border: string;
  shellBg: string;
  muted: string;
}) {
  const v = clamp01(value);
  return (
    <div className={`rounded-lg border ${border} ${shellBg} p-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${muted}`}>{labelLeft}</p>
        <p className={`text-xs ${muted}`}>{labelRight}</p>
      </div>
      <div className={`mt-2 h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-[rgb(var(--foreground))]/70`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(v * 100)}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

type Derived = {
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

  // NEW: "safe spend for rest of week"
  daysLeftThisWeek: number;
  safeSpendRestOfWeek: number;
};

function DashboardView({
  derived,
  userData,
  logs,

  checkAmount,
  setCheckAmount,
  checkNote,
  setCheckNote,
  checkCategory,
  setCheckCategory,
  checkStatus,
  checkMessage,
  runCheck,

  deleteLog,
  clearAllLogs,

  inputBase,
  buttonPrimary,
  buttonDanger,
  buttonGhost,

  border,
  cardBg,
  shellBg,
  fg,
  muted,
}: {
  derived: Derived;
  userData: UserData;
  logs: SpendLog[];

  checkAmount: string;
  setCheckAmount: React.Dispatch<React.SetStateAction<string>>;
  checkNote: string;
  setCheckNote: React.Dispatch<React.SetStateAction<string>>;
  checkCategory: SpendCategory;
  setCheckCategory: React.Dispatch<React.SetStateAction<SpendCategory>>;
  checkStatus: CheckStatus;
  checkMessage: string;
  runCheck: () => void;

  deleteLog: (id: string) => void;
  clearAllLogs: () => void;

  inputBase: string;
  buttonPrimary: string;
  buttonDanger: string;
  buttonGhost: string;

  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
}) {
  // ---------- Subtle feature-animations state ----------
  const [isLogging, setIsLogging] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const prevSpentThisMonth = useRef<number | null>(null);

  // Only used for subtle pulse when month spend changes
  useEffect(() => {
    if (prevSpentThisMonth.current === null) {
      prevSpentThisMonth.current = derived.spentThisMonth;
      return;
    }
    if (derived.spentThisMonth !== prevSpentThisMonth.current) {
      prevSpentThisMonth.current = derived.spentThisMonth;
      setPulseKey((k) => k + 1);
    }
  }, [derived.spentThisMonth]);

  // ---------- Category budgets ----------
  const defaultBudgets: CategoryBudgets = useMemo(() => {
    const base: CategoryBudgets = {
      Food: 0,
      Transport: 0,
      Groceries: 0,
      Shopping: 0,
      Bills: 0,
      Health: 0,
      Entertainment: 0,
      Other: 0,
    };
    return base;
  }, []);

  const [budgets, setBudgets] = useState<CategoryBudgets>(defaultBudgets);
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    const stored = safeParseJSON<CategoryBudgets>(localStorage.getItem(BUDGETS_KEY));
    if (stored) setBudgets({ ...defaultBudgets, ...stored });
  }, [defaultBudgets]);

  const saveBudgets = () => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 700);
  };

  // ---------- Logs filtering/search ----------
  const [filterCategory, setFilterCategory] = useState<SpendCategory | "All">("All");
  const [searchNote, setSearchNote] = useState("");

  const filteredRecent = useMemo(() => {
    const q = searchNote.trim().toLowerCase();
    return derived.recent.filter((l) => {
      const catOk = filterCategory === "All" ? true : (l.category || "Other") === filterCategory;
      const note = (l.note || "").toLowerCase();
      const noteOk = q.length === 0 ? true : note.includes(q);
      return catOk && noteOk;
    });
  }, [derived.recent, filterCategory, searchNote]);

  // ---------- Quick add buttons ----------
  const quickAdds = [50, 100, 200, 500, 1000];

  const exportName = `wise-logs-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
    2,
    "0"
  )}.json`;

  const statusColor =
    checkStatus === "safe"
      ? "text-[rgb(var(--success))]"
      : checkStatus === "risky"
      ? "text-yellow-500"
      : checkStatus === "no"
      ? "text-red-500"
      : `text-[rgb(var(--muted-foreground))]`;

  const statusRing =
    checkStatus === "safe"
      ? "ring-1 ring-[rgb(var(--success))]/30"
      : checkStatus === "risky"
      ? "ring-1 ring-yellow-500/25"
      : checkStatus === "no"
      ? "ring-1 ring-red-500/25"
      : "ring-1 ring-transparent";

  const statusBg =
    checkStatus === "safe"
      ? "bg-[rgb(var(--success))]/10"
      : checkStatus === "risky"
      ? "bg-yellow-500/10"
      : checkStatus === "no"
      ? "bg-red-500/10"
      : "bg-[rgb(var(--muted))]";

  const insightTone =
    derived.spendVsExpected <= 0
      ? "text-[rgb(var(--success))]"
      : derived.spendVsExpected <= Math.round(derived.basePerDay * 0.75)
      ? "text-yellow-500"
      : "text-red-500";

  const insightText =
    derived.spendVsExpected <= 0
      ? `You’re under the expected spend by ₹${formatINR(Math.abs(derived.spendVsExpected))}.`
      : `You’re over the expected spend by ₹${formatINR(derived.spendVsExpected)}.`;

  const projectionTone = derived.projectedRemaining > 0 ? "text-[rgb(var(--success))]" : "text-red-500";

  // subtle “card pulse” when spend changes
  const pulse = {
    initial: { scale: 1 },
    animate: { scale: [1, 1.012, 1] },
    transition: { duration: 0.35, ease: "easeOut" as const },
  };

  function ThemedBarChart({ data, labels }: { data: number[]; labels: string[] }) {
    return (
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Spent",
              data,
              backgroundColor: "#6366f1", // indigo
              borderRadius: 8,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },
          ],
        }}
        options={{
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `₹${formatINR(Number(ctx.raw))}` } },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#999", font: { size: 11 } },
            },
            y: {
              grid: { color: "#2a2a2a" },
              ticks: { color: "#999", font: { size: 11 }, callback: (v) => `₹${formatINR(Number(v))}` },
              beginAtZero: true,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        }}
        height={180}
      />
    );
  }

  function ThemedDoughnutChart({ data, labels }: { data: number[]; labels: string[] }) {
    // Vivid dark theme colors
    const palette = [
      "#818cf8", // indigo
      "#f472b6", // pink
      "#fbbf24", // amber
      "#34d399", // emerald
      "#f87171", // red
      "#a78bfa", // purple
      "#60a5fa", // blue
      "#38bdf8"  // cyan
    ];
    return (
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: palette.slice(0, labels.length),
              borderColor: "#1a1a1a",
              borderWidth: 2,
            },
          ],
        }}
        options={{
          plugins: {
            legend: { display: true, position: "bottom", labels: { color: "#999", font: { size: 11 }, padding: 12 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ₹${formatINR(Number(ctx.raw))}` } },
          },
          cutout: "65%",
          responsive: true,
          maintainAspectRatio: false,
        }}
        height={200}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div key={`income-${pulseKey}`} {...pulse} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Monthly Income</p>
          <p className={`text-lg font-semibold ${fg} mt-1`}>₹{formatINR(derived.income)}</p>
          <p className={`text-xs ${muted} mt-2`}>
            Fixed+Subs: ₹{formatINR(derived.fixedTotal)} • Savings goal: ₹{formatINR(derived.goal)}
          </p>
        </motion.div>

        <motion.div key={`spendable-${pulseKey}`} {...pulse} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Spendable This Month</p>
          <p className={`text-lg font-semibold ${fg} mt-1`}>₹{formatINR(derived.spendableMonth)}</p>
          <p className={`text-xs ${muted} mt-2`}>
            Spent: ₹{formatINR(derived.spentThisMonth)} • Remaining: ₹{formatINR(derived.remainingSpendable)}
          </p>
        </motion.div>

        <motion.div key={`safe-${pulseKey}`} {...pulse} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Safe Spend Today</p>
          <p className={`text-lg font-semibold ${fg} mt-1`}>
            {derived.safeSpendToday === null ? "—" : `₹${formatINR(derived.safeSpendToday)}`}
          </p>
          <p className={`text-xs ${muted} mt-2`}>
            Days left: {derived.daysLeft} • Month progress: {Math.round(derived.monthProgress * 100)}%
          </p>
        </motion.div>
      </div>

      {/* Health + Projections + Week remaining safe spend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressBar
          value={derived.utilization}
          labelLeft="Spendable used"
          labelRight={`${Math.round(clamp01(derived.utilization) * 100)}%`}
          border={border}
          shellBg={shellBg}
          muted={muted}
        />

        <div className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Projection (at current pace)</p>
          <p className={`text-sm font-semibold ${fg} mt-1`}>Spend: ₹{formatINR(derived.projectedMonthSpend)}</p>
          <p className={`text-xs ${projectionTone} mt-2`}>
            {derived.projectedRemaining > 0
              ? `Projected leftover: ₹${formatINR(derived.projectedRemaining)}`
              : `Projected overshoot: ₹${formatINR(Math.abs(derived.projectedRemaining))}`}
          </p>
          <p className={`text-xs ${muted} mt-1`}>Avg/day so far: ₹{formatINR(Math.round(derived.avgPerDaySoFar))}</p>
        </div>

        <div className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Budget Insight</p>
          <p className={`text-sm font-semibold ${fg} mt-1`}>Expected vs Actual</p>
          <p className={`text-xs ${insightTone} mt-2`}>{insightText}</p>
          <p className={`text-xs ${muted} mt-1`}>
            No-spend streak: <span className={`${fg} font-semibold`}>{derived.noSpendStreak}</span> day
            {derived.noSpendStreak === 1 ? "" : "s"}
          </p>
          <div className={`mt-3 rounded-lg border ${border} ${shellBg} p-3`}>
            <p className={`text-xs ${muted}`}>Safe spend for rest of week</p>
            <p className={`text-sm font-semibold ${fg} mt-1`}>₹{formatINR(derived.safeSpendRestOfWeek)}</p>
            <p className={`text-xs ${muted} mt-1`}>Days left this week: {derived.daysLeftThisWeek}</p>
          </div>
        </div>
      </div>

      {/* Real-time Spend Check */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Real-time Spend Check</h3>
            <p className={`text-xs ${muted} mt-1`}>Log your expense and see if it keeps you on track today.</p>
          </div>

          <motion.div
            animate={isLogging ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.18 }}
            className={`rounded-lg px-3 py-2 ${statusBg} ${statusRing}`}
          >
            <p className={`text-xs font-medium ${statusColor}`}>
              {checkStatus === "idle"
                ? "Enter "
                : checkStatus === "safe"
                ? "Safe"
                : checkStatus === "risky"
                ? "Risky"
                : "Not advised"}
            </p>
          </motion.div>
        </div>

        {/* Quick add row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className={`text-xs ${muted} mr-1`}>Quick add:</p>
          {quickAdds.map((a) => (
            <button
              key={a}
              className={`rounded-full border ${border} ${shellBg} px-3 py-1 text-xs ${muted} hover:bg-[rgb(var(--muted))] transition-colors`}
              onClick={() => setCheckAmount(String(a))}
              type="button"
            >
              ₹{formatINR(a)}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Amount</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                value={checkAmount}
                inputMode="numeric"
                onChange={(e) => setCheckAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="e.g., 250"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Note (optional)</label>
            <input
              className={inputBase}
              value={checkNote}
              onChange={(e) => setCheckNote(e.target.value)}
              placeholder="e.g., coffee, cab, groceries..."
            />
          </div>

          <div className="md:col-span-1">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Category</label>
            <select className={inputBase} value={checkCategory} onChange={(e) => setCheckCategory(e.target.value as SpendCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={() => {
                setIsLogging(true);
                runCheck(); // will toast inside runCheck now
                setTimeout(() => setIsLogging(false), 260);
              }}
              className={`${buttonPrimary} w-full transition-transform active:scale-[0.98]`}
              disabled={!derived.safeSpendToday}
              type="button"
            >
              {isLogging ? "Logging..." : "Check & Log"}
            </button>
          </div>
        </div>

        <motion.p
          key={`msg-${checkMessage}-${checkStatus}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`text-sm mt-3 ${statusColor}`}
        >
          {checkMessage || "Enter  to see guidance."}
        </motion.p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div layout className={`rounded-lg border ${border} ${shellBg} p-3`}>
            <p className={`text-xs ${muted}`}>Spent Today</p>
            <p className={`text-sm font-semibold ${fg} mt-1`}>₹{formatINR(derived.spentToday)}</p>
          </motion.div>

          <motion.div layout className={`rounded-lg border ${border} ${shellBg} p-3`}>
            <p className={`text-xs ${muted}`}>Spent This Week</p>
            <p className={`text-sm font-semibold ${fg} mt-1`}>₹{formatINR(derived.weekSpent)}</p>
            <p className={`text-xs ${muted} mt-1`}>Expected: ₹{formatINR(derived.expectedThisWeek)}</p>
          </motion.div>

          <motion.div layout className={`rounded-lg border ${border} ${shellBg} p-3`}>
            <p className={`text-xs ${muted}`}>Week Delta</p>
            <p className={`text-sm font-semibold mt-1 ${derived.deltaWeek <= 0 ? "text-[rgb(var(--success))]" : "text-red-500"}`}>
              {derived.deltaWeek <= 0 ? "On track" : "Over budget"}{" "}
              <span className={muted}>
                ({derived.deltaWeek >= 0 ? "+" : "−"}₹{formatINR(Math.abs(derived.deltaWeek))})
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* 7-day spend trend (Chart.js Bar) */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Last 7 Days</h3>
            <p className={`text-xs ${muted} mt-1`}>A quick view of your recent spending pattern.</p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${muted}`}>Avg/day (7d)</p>
            <p className={`text-sm font-semibold ${fg}`}>
              ₹{formatINR(Math.round(derived.last7.reduce((s, x) => s + x.total, 0) / 7))}
            </p>
          </div>
        </div>
        <div className="mt-4" style={{ minHeight: 200 }}>
          <ThemedBarChart 
            data={derived.last7.map((x) => x.total)} 
            labels={derived.last7.map((x) => new Date(x.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }))} 
          />
        </div>
      </div>

      {/* Category breakdown - Split into two widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart widget */}
        <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Top Categories</h3>
            <p className={`text-xs ${muted} mt-1`}>This month breakdown.</p>
          </div>
          <div className="mt-4" style={{ minHeight: 220 }}>
            {derived.topCategories.length > 0 ? (
              <ThemedDoughnutChart 
                data={derived.topCategories.map((x) => x[1])} 
                labels={derived.topCategories.map((x) => x[0])} 
              />
            ) : (
              <div className={`rounded-lg border ${border} ${shellBg} p-4 h-full flex items-center justify-center`}>
                <p className={`text-sm ${muted}`}>No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats widget */}
        <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Category Details</h3>
            <p className={`text-xs ${muted} mt-1`}>Spending by category.</p>
          </div>
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto no-scrollbar">
            {derived.topCategories.length === 0 ? (
              <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
                <p className={`text-sm ${muted}`}>Log a spend to see details.</p>
              </div>
            ) : (
              derived.topCategories.map(([cat, total], idx) => {
                const share = derived.spentThisMonth > 0 ? total / derived.spentThisMonth : 0;
                return (
                  <div key={cat} className={`rounded-lg border ${border} ${shellBg} p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${fg}`}>{cat}</p>
                      <p className={`text-sm font-semibold ${fg}`}>₹{formatINR(total)}</p>
                    </div>
                    <div className={`mt-2 h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
                      <motion.div
                        className={`h-full rounded-full bg-[rgb(var(--foreground))]/70`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(clamp01(share) * 100)}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                    <p className={`text-xs ${muted} mt-1`}>{Math.round(share * 100)}% of month</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Category Budgets</h3>
            <p className={`text-xs ${muted} mt-1`}>Set caps per category. We’ll show how close you are (this month).</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setBudgetsOpen((v) => !v)} className={buttonGhost} title="Edit budgets">
              {budgetsOpen ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              onClick={saveBudgets}
              className={`${buttonPrimary} ${budgetSaved ? "bg-green-500/10 border-green-500/40" : ""}`}
              title="Save budgets"
            >
              {budgetSaved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {budgetsOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {CATEGORIES.map((c) => (
                <div key={c} className={`rounded-lg border ${border} ${shellBg} p-3`}>
                  <p className={`text-xs ${muted}`}>{c} budget</p>
                  <div className="relative mt-2">
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                    <input
                      className={`${inputBase} pl-7`}
                      inputMode="numeric"
                      value={String(budgets[c] ?? 0)}
                      onChange={(e) =>
                        setBudgets((prev) => ({
                          ...prev,
                          [c]: Number(e.target.value.replace(/[^\d]/g, "") || 0),
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-4 space-y-2">
          {CATEGORIES.map((c) => {
            const budget = budgets[c] || 0;
            const spent = derived.categoryTotals[c] || 0;
            const hasBudget = budget > 0;
            const ratio = hasBudget ? spent / budget : 0;
            const pct = hasBudget ? Math.round(clamp01(ratio) * 100) : 0;

            const tone = !hasBudget
              ? muted
              : ratio <= 0.7
              ? "text-[rgb(var(--success))]"
              : ratio <= 1
              ? "text-yellow-500"
              : "text-red-500";

            return (
              <div key={c} className={`rounded-lg border ${border} ${shellBg} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-medium ${fg}`}>{c}</p>
                  <p className={`text-sm ${tone}`}>{hasBudget ? `${pct}%` : "No budget"}</p>
                </div>

                <p className={`text-xs ${muted} mt-1`}>
                  Spent: ₹{formatINR(spent)} {hasBudget ? `• Budget: ₹${formatINR(budget)}` : ""}
                </p>

                <div className={`mt-2 h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full bg-[rgb(var(--foreground))]/70`}
                    initial={{ width: 0 }}
                    animate={{ width: `${hasBudget ? pct : 0}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>

                {hasBudget && ratio > 1 ? <p className={`text-xs text-red-500 mt-2`}>Over by ₹{formatINR(spent - budget)}</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW: Monthly Spend Forecast */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div>
          <h3 className={`text-sm font-semibold ${fg}`}>Monthly Spend Forecast</h3>
          <p className={`text-xs ${muted} mt-1`}>Projected spending based on current pace.</p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
            <p className={`text-xs ${muted}`}>Current Monthly Spend</p>
            <p className={`text-lg font-semibold ${fg} mt-2`}>₹{formatINR(derived.spentThisMonth)}</p>
            <p className={`text-xs ${muted} mt-2`}>{derived.dayOfMonth} of {derived.daysInMonth} days used</p>
          </div>

          <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
            <p className={`text-xs ${muted}`}>Projected Total</p>
            <p className={`text-lg font-semibold ${fg} mt-2`}>₹{formatINR(derived.projectedMonthSpend)}</p>
            <p className={`text-xs ${muted} mt-2`}>At ₹{formatINR(Math.round(derived.avgPerDaySoFar))}/day</p>
          </div>

          <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
            <p className={`text-xs ${muted}`}>vs Budget</p>
            <p className={`text-lg font-semibold mt-2 ${derived.projectedRemaining > 0 ? "text-[rgb(var(--success))]" : "text-red-500"}`}>
              {derived.projectedRemaining > 0 ? "+" : "−"}₹{formatINR(Math.abs(derived.projectedRemaining))}
            </p>
            <p className={`text-xs ${muted} mt-2`}>
              {derived.projectedRemaining > 0 ? "Projected to save" : "Projected overshoot"}
            </p>
          </div>
        </div>

        {/* Forecast bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className={`text-xs font-medium ${muted}`}>Spending Trajectory</p>
            <p className={`text-xs font-semibold ${fg}`}>{Math.round((derived.spentThisMonth / derived.spendableMonth) * 100)}% of budget</p>
          </div>
          <div className={`h-3 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
            <motion.div
              className={`h-full rounded-full ${
                derived.utilization <= 0.7
                  ? "bg-[rgb(var(--success))]"
                  : derived.utilization <= 1
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(clamp01(derived.utilization) * 100)}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
          <p className={`text-xs ${muted} mt-2`}>
            Budget: ₹{formatINR(derived.spendableMonth)} • Safe/day remaining: ₹{formatINR(derived.safeSpendToday || 0)}
          </p>
        </div>
      </div>

      {/* Recent logs + export + filter/search */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Recent Spend Logs</h3>
            <p className={`text-xs ${muted} mt-1`}>These update your month & day calculations live.</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => downloadJSON(exportName, { userData, logs, budgets })} className={buttonGhost} title="Export data">
              Export
            </button>
            <button type="button" onClick={clearAllLogs} className={buttonDanger}>
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Filter category</label>
            <select className={inputBase} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as SpendCategory | "All")}>
              <option value="All">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Search note</label>
            <input
              className={inputBase}
              value={searchNote}
              onChange={(e) => setSearchNote(e.target.value)}
              placeholder="Type to search notes (e.g., coffee, cab...)"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filteredRecent.length === 0 ? (
            <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
              <p className={`text-sm ${muted}`}>No logs match your filter. Try changing category/search.</p>
            </div>
          ) : (
            filteredRecent.map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between gap-3 rounded-lg border ${border} ${shellBg} p-3`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${fg}`}>₹{formatINR(l.amount)}</p>
                  <p className={`text-xs ${muted} truncate`}>
                    {(l.category || "Other") + (l.note ? ` • ${l.note}` : " • —")} • {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <button type="button" onClick={() => deleteLog(l.id)} className={buttonDanger}>
                  Delete
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------- Home ---------------------------
export default function Home() {
  const router = useRouter();

  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [logs, setLogs] = useState<SpendLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Spend check input
  const [checkAmount, setCheckAmount] = useState<string>("");
  const [checkNote, setCheckNote] = useState<string>("");
  const [checkCategory, setCheckCategory] = useState<SpendCategory>("Other");
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
  const [checkMessage, setCheckMessage] = useState<string>("");

  // Load user data + logs
  useEffect(() => {
    const data = safeParseJSON<UserData>(localStorage.getItem(USER_KEY));
    if (!data) {
      router.push("/onboarding");
      return;
    }
    setUserData(data);

    const storedLogs = safeParseJSON<SpendLog[]>(localStorage.getItem(LOG_KEY)) || [];
    setLogs(storedLogs);

    setIsLoading(false);
  }, [router]);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs, isLoading]);

  const derived = useMemo<Derived | null>(() => {
    if (!userData) return null;

    const income = Number(userData.income || 0);
    const fixedBase = Number(userData.fixedExpenses || 0);
    const subs = Number(userData.monthlySubscriptions || 0);
    const goal = Number(userData.savingsGoal || 0);

    const fixedTotal = fixedBase + subs;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

    const spendableMonth = Math.max(0, income - fixedTotal - goal);

    const spentThisMonth = logs.reduce((sum, l) => {
      const dt = new Date(l.createdAt);
      if (isSameMonth(dt, now)) return sum + (l.amount || 0);
      return sum;
    }, 0);

    const remainingSpendable = Math.max(0, spendableMonth - spentThisMonth);
    const safeSpendToday = income > 0 ? Math.floor(remainingSpendable / daysLeft) : null;

    const monthProgress = dayOfMonth / daysInMonth;

    const spentToday = logs.reduce((sum, l) => {
      const dt = new Date(l.createdAt);
      if (isSameDay(dt, now)) return sum + (l.amount || 0);
      return sum;
    }, 0);

    const weekStart = startOfWeek(now);
    const weekSpent = logs.reduce((sum, l) => {
      const dt = new Date(l.createdAt);
      if (dt >= weekStart && dt <= now) return sum + (l.amount || 0);
      return sum;
    }, 0);

    const basePerDay = daysInMonth > 0 ? spendableMonth / daysInMonth : 0;
    const daysSoFarThisWeek = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const expectedThisWeek = Math.round(basePerDay * daysSoFarThisWeek);
    const deltaWeek = weekSpent - expectedThisWeek;

    const recent = [...logs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    const categoryTotals = CATEGORIES.reduce<Record<SpendCategory, number>>((acc, c) => {
      acc[c] = 0;
      return acc;
    }, {} as Record<SpendCategory, number>);

    logs.forEach((l) => {
      const dt = new Date(l.createdAt);
      if (!isSameMonth(dt, now)) return;
      const c = (l.category || "Other") as SpendCategory;
      categoryTotals[c] = (categoryTotals[c] || 0) + (l.amount || 0);
    });

    const topCategories = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5) as [string, number][];

    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(now, -(6 - i));
      const ymd = getYMD(d);
      let total = 0;
      logs.forEach((l) => {
        const dt = new Date(l.createdAt);
        if (getYMD(dt) === ymd) total += l.amount || 0;
      });
      return { date: d, ymd, total };
    });
    const max7 = Math.max(1, ...last7.map((x) => x.total));

    const daysElapsed = Math.max(1, dayOfMonth);
    const avgPerDaySoFar = spentThisMonth / daysElapsed;
    const projectedMonthSpend = Math.round(avgPerDaySoFar * daysInMonth);
    const projectedRemaining = Math.max(0, spendableMonth - projectedMonthSpend);

    const expectedSpentByNow = Math.round(basePerDay * dayOfMonth);
    const spendVsExpected = spentThisMonth - expectedSpentByNow;

    let noSpendStreak = 0;
    for (let i = 0; i < 60; i++) {
      const d = addDays(now, -i);
      const ymd = getYMD(d);
      const spentThatDay = logs.reduce((sum, l) => {
        const dt = new Date(l.createdAt);
        return getYMD(dt) === ymd ? sum + (l.amount || 0) : sum;
      }, 0);
      if (spentThatDay === 0) noSpendStreak += 1;
      else break;
    }

    const utilization = spendableMonth > 0 ? spentThisMonth / spendableMonth : 0;

    // safe spend for rest of week (Mon..Sun)
    const endOfWeek = (() => {
      const d = new Date(now);
      const day = d.getDay(); // 0 Sun .. 6 Sat
      const diffToSun = (7 - day) % 7; // days until Sunday
      d.setDate(d.getDate() + diffToSun);
      d.setHours(23, 59, 59, 999);
      return d;
    })();
    const daysLeftThisWeek = Math.max(1, Math.ceil((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const safeSpendRestOfWeek = Math.max(
      0,
      Math.floor((remainingSpendable - Math.max(0, weekSpent - expectedThisWeek)) / daysLeftThisWeek)
    );

    return {
      income,
      fixedTotal,
      goal,
      daysInMonth,
      dayOfMonth,
      daysLeft,
      spendableMonth,
      spentThisMonth,
      remainingSpendable,
      safeSpendToday,
      monthProgress,
      spentToday,
      weekSpent,
      expectedThisWeek,
      deltaWeek,
      recent,

      categoryTotals,
      topCategories,
      last7,
      max7,

      avgPerDaySoFar,
      projectedMonthSpend,
      projectedRemaining,
      spendVsExpected,
      utilization,
      noSpendStreak,
      basePerDay,

      daysLeftThisWeek,
      safeSpendRestOfWeek,
    };
  }, [userData, logs]);

  const refreshData = () => {
    const data = safeParseJSON<UserData>(localStorage.getItem(USER_KEY));
    if (data) setUserData(data);
  };

  function runCheck() {
    if (!derived?.safeSpendToday) return;

    const amt = Number(checkAmount || 0);
    if (amt <= 0) {
      setCheckStatus("idle");
      setCheckMessage("Enter  to see guidance.");
      return;
    }

    const entry: SpendLog = {
      id: crypto.randomUUID(),
      amount: amt,
      note: checkNote.trim() || undefined,
      category: checkCategory,
      createdAt: new Date().toISOString(),
    };

    setLogs((prev) => [entry, ...prev]);

    const safe = derived.safeSpendToday;

    if (amt <= safe) {
      setCheckStatus("safe");
      setCheckMessage("✅ Safe — you’ll still stay on track.");
    } else if (amt <= Math.floor(safe * 1.5)) {
      setCheckStatus("risky");
      setCheckMessage("⚠️ Risky — your daily safe spend will shrink.");
    } else {
      setCheckStatus("no");
      setCheckMessage("❌ Not advised — you’ll likely miss your goal.");
    }

    // ✅ React Hot Toast instead of the in-page toast
    toast.success("Logged. Calculations updated in real-time.");

    setCheckAmount("");
  }

  function deleteLog(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  function clearAllLogs() {
    setLogs([]);
  }

  if (isLoading || !userData || !derived) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[rgb(var(--background))]">
        <p className="text-[rgb(var(--muted-foreground))]">Loading...</p>
      </div>
    );
  }

  const shellBg = "bg-[rgb(var(--background))]";
  const cardBg = "bg-[rgb(var(--card))]";
  const border = "border-[rgb(var(--border))]";
  const fg = "text-[rgb(var(--foreground))]";
  const muted = "text-[rgb(var(--muted-foreground))]";

  const navBtn = "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-sm";
  const navBtnIdle = `hover:bg-[rgb(var(--muted))] ${fg}`;
  const navBtnMuted = `hover:bg-[rgb(var(--muted))] ${muted}`;

  const inputBase =
    `w-full rounded-lg border ${border} ${cardBg} ${fg} ` +
    "px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[rgb(var(--ring))] focus:border-transparent";

  const buttonBase = "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors border";
  const buttonPrimary = `${buttonBase} ${fg} ${border} hover:bg-[rgb(var(--muted))]`;
  const buttonDanger = `${buttonBase} text-[rgb(var(--foreground))] border-[rgb(var(--border))] hover:bg-red-500/10`;
  const buttonGhost = `${buttonBase} ${muted} ${border} hover:bg-[rgb(var(--muted))]`;

  // ✅ Strict fixed sidebar (mobile slide, desktop always fixed)
  const sidebar =
    `fixed inset-y-0 left-0 z-50 w-[280px] ${shellBg} border-r ${border} ` +
    `transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ` +
    "md:translate-x-0";

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: MdDashboard },
    { id: "reports", label: "Reports", icon: MdAssignment },
    { id: "goals", label: "Goals", icon: MdStart },
    { id: "insights", label: "Insights", icon: MdLightbulb },
    { id: "recurring", label: "Recurring", icon: MdRepeat },
    { id: "financegpt", label: "FinanceGPT", icon: MdTrendingUp },
  ];

  const settingsItems = [
    { id: "notifications", label: "Notifications", icon: MdNotifications },
    { id: "settings", label: "Settings", icon: MdSettings },
  ];

  return (
    <div className={`h-screen overflow-hidden ${shellBg} ${fg}`}>
      {/* ✅ Global toaster (theme matches your CSS vars) */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 1600,
          style: {
            background: "rgb(var(--card))",
            color: "rgb(var(--foreground))",
            border: "1px solid rgb(var(--border))",
          },
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          type="button"
        />
      ) : null}

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={sidebar}>
          <div className="p-4 border-b border-[rgb(var(--border))]">
            <HeaderLogo border={border} />
          </div>

          <div className="flex h-[calc(100vh-73px)] flex-col justify-between">
            {/* Main Navigation */}
            <div className="p-3 space-y-1 overflow-y-auto">
              <p className={`text-xs font-semibold ${muted} px-2 py-2`}>MAIN</p>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (["dashboard", "financegpt", "settings"].includes(item.id)) {
                        setCurrentView(item.id as View);
                        setSidebarOpen(false);
                      } else {
                        toast("Coming soon! 🚀", { icon: "⏳" });
                      }
                    }}
                    className={`${navBtn} ${
                      isActive ? navBtnIdle + " bg-[rgb(var(--muted))]" : navBtnMuted
                    } gap-3`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Section */}
            <div className="p-3 space-y-3 border-t border-[rgb(var(--border))]">
              {/* Settings Items */}
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (["settings", "notifications"].includes(item.id)) {
                          setCurrentView(item.id as View);
                          setSidebarOpen(false);
                        }
                      }}
                      className={`${navBtn} ${
                        isActive ? navBtnIdle + " bg-[rgb(var(--muted))]" : navBtnMuted
                      } gap-3`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Monthly Summary Card */}
              <div className={`rounded-lg border ${border} ${cardBg} p-3`}>
                <p className={`text-xs ${muted}`}>This month remaining</p>
                <p className={`text-sm font-semibold ${fg} mt-1`}>₹{formatINR(derived.remainingSpendable)}</p>
                <p className={`text-xs ${muted} mt-1`}>
                  Safe/day: {derived.safeSpendToday === null ? "—" : `₹${formatINR(derived.safeSpendToday)}`}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 md:ml-70 flex flex-col h-screen overflow-hidden">
          {/* Topbar */}
          <div className={`sticky top-0 z-30 ${shellBg} border-b ${border} shrink-0`}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className={`md:hidden ${buttonPrimary}`}
                  aria-label="Open sidebar"
                >
                  <BiMenu size={20} />
                </button>

                <div>
                  <p className={`text-sm font-semibold ${fg}`}>
                    {currentView === "dashboard"
                      ? "Dashboard"
                      : currentView === "financegpt"
                      ? "FinanceGPT"
                      : currentView === "settings"
                      ? "Settings"
                      : currentView === "reports"
                      ? "Reports"
                      : currentView === "goals"
                      ? "Goals"
                      : currentView === "insights"
                      ? "Insights"
                      : currentView === "recurring"
                      ? "Recurring"
                      : "Notifications"}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`hidden md:block text-right`}>
                  <p className={`text-xs ${muted}`}>Safe spend today</p>
                  <p className={`text-sm font-semibold ${fg}`}>
                    {derived.safeSpendToday === null ? "—" : `₹${formatINR(derived.safeSpendToday)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View content - now scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {currentView === "dashboard" ? (
              <DashboardView
                derived={derived}
                userData={userData}
                logs={logs}
                checkAmount={checkAmount}
                setCheckAmount={setCheckAmount}
                checkNote={checkNote}
                setCheckNote={setCheckNote}
                checkCategory={checkCategory}
                setCheckCategory={setCheckCategory}
                checkStatus={checkStatus}
                checkMessage={checkMessage}
                runCheck={runCheck}
                deleteLog={deleteLog}
                clearAllLogs={clearAllLogs}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
                buttonDanger={buttonDanger}
                buttonGhost={buttonGhost}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
              />
            ) : currentView === "financegpt" ? (
              <FinanceGPT />
            ) : currentView === "settings" ? (
              <div className={`max-w-3xl`}>
                <Settings userData={userData} onUpdate={refreshData} />
              </div>
            ) : currentView === "reports" || currentView === "goals" || currentView === "insights" || currentView === "recurring" || currentView === "notifications" ? (
              <div className="p-6 flex items-center justify-center h-full">
                <div className={`w-full max-w-xl rounded-lg border ${border} ${cardBg} p-6 text-center`}>
                  <p className={`text-sm font-semibold ${fg}`}>Coming Soon</p>
                  <p className={`text-sm ${muted} mt-2 leading-relaxed`}>
                    This feature is under development. We're working hard to bring it to you soon! 🚀
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
