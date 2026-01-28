/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BiMenu } from "react-icons/bi";
import { MdDashboard, MdTrendingUp, MdSettings, MdAssignment, MdStart, MdLightbulb, MdRepeat, MdNotifications, MdSend, MdRefresh, MdDownload } from "react-icons/md";
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

// Import new components
import { TransactionsView } from "@/app/components/TransactionsView";
import { ReportsView } from "@/app/components/ReportsView";
import { GoalsView } from "@/app/components/GoalsView";
import { InsightsView } from "@/app/components/InsightsView";
import { NotificationsView } from "@/app/components/NotificationsView";
import { RecurringView } from "@/app/components/RecurringView";
import { FinanceGPT } from "@/app/components/FinanceGPT";
import { SettingsView } from "@/app/components/SettingsView";
import { useAuth } from "@/app/components/FirebaseAuthProvider";
import { useUserProfile, useSpendLogs, useCategoryBudgets, useSavingsGoals, useNotifications } from "@/lib/hooks/useFirestore";

// Import types and utils
import { SpendLog, SpendCategory, Notification, SavingsGoal, RecurringRule, Cadence } from "@/app/lib/types";
import {
  formatINR,
  isSameDay,
  startOfWeek,
  isSameMonth,
  clamp01,
  addDays,
  getYMD,
  safeParseJSON,
  downloadJSON,
} from "@/app/lib/utils";
import Link from "next/link";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type CheckStatus = "idle" | "safe" | "risky" | "no";
type View = "dashboard" | "financegpt" | "settings" | "reports" | "goals" | "insights" | "recurring" | "notifications" | "transactions";
type TransactionType = "income" | "expense";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const CATEGORIES: SpendCategory[] = [
  "Food", "Transport", "Groceries", "Shopping", "Bills", "Health",
  "Entertainment", "Salary", "Bonus", "Savings", "Other",
];

const USER_KEY = "wise_user_data";
const LOG_KEY = "wise_spend_logs";
const BUDGETS_KEY = "wise_category_budgets";
const RECURRING_KEY = "wise_recurring_rules";
const GOALS_KEY = "wise_savings_goals";
const NOTIF_KEY = "wise_notifications";
const FINANCEGPT_CHAT_KEY = "wise_financegpt_chat";
const SESSION_ID_KEY = "wise_session_id";

// ---------- Helper Functions ----------

function FinanceGPTComponent({
  userData,
  derived,
  logs,
  budgets,
  inputBase,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
}: {
  userData: any;
  derived: any;
  logs: SpendLog[];
  budgets: Record<SpendCategory, number>;
  inputBase: string;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
}) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeLast30Days, setIncludeLast30Days] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID and load chat history
  useEffect(() => {
    let id = localStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, id);
    }
    setSessionId(id);

    const savedChat = safeParseJSON<ChatMessage[]>(localStorage.getItem(FINANCEGPT_CHAT_KEY));
    if (savedChat) {
      setChatMessages(savedChat);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Persist chat to localStorage
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem(FINANCEGPT_CHAT_KEY, JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  const buildContextData = () => {
    let logsToUse = logs;

    // Filter to last 30 days if toggled
    if (includeLast30Days) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      logsToUse = logs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo);
    }

    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (categoryTotals[c] = 0));
    logsToUse.forEach((l) => {
      const c = l.category || "Other";
      categoryTotals[c] = (categoryTotals[c] || 0) + l.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 8);

    const contextData: any = {
      income: userData.income || 0,
      fixedTotal: derived.fixedTotal || 0,
      savingsGoal: derived.goal || 0,
      spendableMonth: derived.spendableMonth || 0,
      spentThisMonth: derived.spentThisMonth || 0,
      remainingSpendable: derived.remainingSpendable || 0,
      safeSpendToday: derived.safeSpendToday || 0,
      spentToday: derived.spentToday || 0,
      weekSpent: derived.weekSpent || 0,
      deltaWeek: derived.deltaWeek || 0,
      expectedThisWeek: derived.expectedThisWeek || 0,
      categoryTotals,
      topCategories,
      projectedMonthSpend: derived.projectedMonthSpend || 0,
      projectedRemaining: derived.projectedRemaining || 0,
      noSpendStreak: derived.noSpendStreak || 0,
      daysInMonth: derived.daysInMonth || 0,
      dayOfMonth: derived.dayOfMonth || 0,
      daysLeft: derived.daysLeft || 0,
    };

    if (includeBudgets) {
      contextData.budgets = budgets;
    }

    return contextData;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const contextData = buildContextData();

      const response = await fetch("/api/financegpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context: contextData,
          options: {
            sessionId,
            includeNotes,
            // ✅ IMPORTANT: Send a model you ACTUALLY have (from ListModels)
            model: "models/gemini-2.5-flash",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (confirm("Clear all chat history?")) {
      setChatMessages([]);
      localStorage.removeItem(FINANCEGPT_CHAT_KEY);
    }
  };

  const exportChat = () => {
    downloadJSON(`financegpt-chat-${new Date().toISOString().split("T")[0]}.json`, {
      messages: chatMessages,
      exportedAt: new Date().toISOString(),
    });
  };

  const quickPrompts = [
    { label: "Can I spend ₹500 today?", text: "Can I safely spend ₹500 today?" },
    {
      label: "How to reduce spending?",
      text: "Based on my spending patterns, what's the best way to reduce my expenses?",
    },
    { label: "Biggest spending leak?", text: "What's my biggest spending leak this month?" },
    { label: "Savings strategy", text: "Help me create a realistic savings plan for the next 3 months." },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${fg}`}>FinanceGPT</h2>
          <p className={`text-xs ${muted} mt-1`}>Just financial advice • Consult a professional for investment decisions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportChat} className="p-2 rounded hover:bg-[rgb(var(--muted))]" title="Export chat">
            <MdDownload size={18} />
          </button>
          <button onClick={resetChat} className="p-2 rounded hover:bg-[rgb(var(--muted))]" title="Reset chat">
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Context toggles */}
      <div className={`rounded-lg border ${border} ${cardBg} p-3 flex flex-wrap gap-2`}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeLast30Days}
            onChange={(e) => setIncludeLast30Days(e.target.checked)}
            className="w-4 h-4"
          />
          <span className={muted}>Last 30 days only</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeBudgets}
            onChange={(e) => setIncludeBudgets(e.target.checked)}
            className="w-4 h-4"
          />
          <span className={muted}>Include budgets</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(e) => setIncludeNotes(e.target.checked)}
            className="w-4 h-4"
          />
          <span className={muted}>Include spending notes</span>
        </label>
      </div>

      {/* Quick prompts */}
      {chatMessages.length === 0 && (
        <div className="space-y-2">
          <p className={`text-xs font-medium ${muted}`}>Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(prompt.text)}
                className={`px-3 py-2 rounded-lg border ${border} text-sm ${muted} hover:bg-[rgb(var(--muted))] transition-colors`}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 rounded-lg border ${border} ${cardBg} p-4`}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className={`text-sm ${muted} text-center`}>
              Start a conversation about your finances. Ask anything about spending, budgets, or goals.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-4 ${
                  msg.role === "user" ? `${cardBg} border ${border}` : `bg-[rgb(var(--muted))]`
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className={`text-sm ${fg} space-y-2 whitespace-pre-wrap wrap-break-word`}>
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={idx} className="text-base font-bold mt-2 mb-1">
                            {line.replace(/^## /, "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("# ")) {
                        return (
                          <h1 key={idx} className="text-lg font-bold mt-3 mb-2">
                            {line.replace(/^# /, "")}
                          </h1>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <div key={idx} className="ml-4 flex gap-2">
                            <span>•</span>
                            <span>{line.replace(/^- /, "")}</span>
                          </div>
                        );
                      }
                      if (/^\d+\./.test(line)) {
                        return (
                          <div key={idx} className="ml-4">
                            {line}
                          </div>
                        );
                      }
                      if (line.trim()) {
                        return (
                          <p key={idx} className="mb-2">
                            {line.split("**").map((part, i) =>
                              i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                            )}
                          </p>
                        );
                      }
                      return <div key={idx} className="h-1" />;
                    })}
                  </div>
                ) : (
                  <p className={`text-sm ${fg} whitespace-pre-wrap wrap-break-word`}>{msg.content}</p>
                )}
                <p className={`text-xs ${muted} mt-2`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 bg-[rgb(var(--muted))]`}>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[rgb(var(--foreground))] rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-[rgb(var(--foreground))] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[rgb(var(--foreground))] rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`flex gap-2`}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask me anything about your finances."
          className={`${inputBase} flex-1 resize-none max-h-20 py-2`}
          rows={2}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputValue.trim()}
          className="p-3 rounded-lg bg-[rgb(var(--foreground))] text-[rgb(var(--background))] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <MdSend size={20} />
        </button>
      </div>
    </div>
  );
}

// Old Settings component removed.

function HeaderLogo({ border }: { border: string }) {
  return (
    <Link href={`/dashboard`} className="flex items-center justify-between gap-2">
      <Image
        src="/assets/white-logo.png"
        alt="Wise"
        width={35}
        height={35}
        className="bg-[#4d4d4d7c] hover:bg-[#4d4d4d4b] rounded-md p-1"
      />
    </Link>
  );
}

function ProgressBar({
  value,
  labelLeft,
  labelRight,
  border,
  shellBg,
  muted,
}: any) {
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
  goals,
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
}: any) {
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
  const defaultBudgets: Record<SpendCategory, number> = useMemo(() => {
    const base: Record<SpendCategory, number> = {} as any;
    CATEGORIES.forEach((c) => (base[c] = 0));
    return base;
  }, []);

  const [budgets, setBudgets] = useState<Record<SpendCategory, number>>(defaultBudgets);
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    const stored = safeParseJSON<Record<SpendCategory, number>>(localStorage.getItem(BUDGETS_KEY));
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
    return derived.recent.filter((l: { category: any; note: any; }) => {
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
      ? `You're under the expected spend by ₹${formatINR(Math.abs(derived.spendVsExpected))}.`
      : `You're over the expected spend by ₹${formatINR(derived.spendVsExpected)}.`;

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
            animate={checkStatus !== "idle" ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.18 }}
            className={`rounded-lg px-3 py-2 ${statusBg} ${statusRing}`}
          >
            <p className={`text-xs font-medium ${statusColor}`}>
              {checkStatus === "idle"
                ? "Enter amount"
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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Amount</label>
            <div className="relative">
              <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
              <input
                className={`${inputBase} pl-7`}
                inputMode="numeric"
                value={checkAmount}
                onChange={(e) => setCheckAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Category</label>
            <select
              value={checkCategory}
              onChange={(e) => setCheckCategory(e.target.value as SpendCategory)}
              className={inputBase}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Note (optional)</label>
            <input
              type="text"
              value={checkNote}
              onChange={(e) => setCheckNote(e.target.value)}
              placeholder="e.g., coffee"
              className={inputBase}
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={runCheck}
              className={`${buttonPrimary} w-full`}
            >
              Check
            </button>
          </div>
        </div>

        {checkStatus !== "idle" && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-lg bg-[rgba(0,0,0,0.2)]">
            <p className={`text-sm ${statusColor}`}>{checkMessage}</p>
          </motion.div>
        )}
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
              ₹{formatINR(Math.round(derived.last7.reduce((s: any, x: { total: any; }) => s + x.total, 0) / 7))}
            </p>
          </div>
        </div>
        <div className="mt-4" style={{ minHeight: 200 }}>
          <ThemedBarChart 
            data={derived.last7.map((x: { total: any; }) => x.total)} 
            labels={derived.last7.map((x: { date: string | number | Date; }) => new Date(x.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }))} 
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
                data={derived.topCategories.map((x: any[]) => x[1])} 
                labels={derived.topCategories.map((x: any[]) => x[0])} 
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
              derived.topCategories.map(([cat, total]: any, idx: any) => {
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

      {/* Savings Goals Widget (Product/Goal related) */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 md:p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${fg}`}>Active Goals</h3>
            <p className={`text-xs ${muted} mt-1`}>Track your progress towards specific purchases or products.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(!goals || goals.length === 0) ? (
            <div className={`rounded-lg border ${border} ${shellBg} p-4`}>
              <p className={`text-sm ${muted}`}>No goals set. Add a goal to track savings for a product.</p>
            </div>
          ) : (
            goals.slice(0, 3).map((g: any) => (
              <div key={g.id} className={`rounded-lg border ${border} ${shellBg} p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${fg}`}>{g.title}</p>
                  <p className={`text-sm font-semibold ${fg}`}>
                    ₹{formatINR(g.currentSaved)} <span className={`text-xs ${muted} font-normal`}>/ ₹{formatINR(g.targetAmount)}</span>
                  </p>
                </div>
                <div className={`mt-2 h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full bg-[rgb(var(--foreground))]/70`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(clamp01(g.currentSaved / g.targetAmount) * 100)}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))
          )}
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
            filteredRecent.map((l: { id: React.Key | null | undefined; amount: number; category: any; note: any; createdAt: string | number | Date; }) => (
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

  const [userData, setUserData] = useState<any>(null);
  const [logs, setLogs] = useState<SpendLog[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [checkAmount, setCheckAmount] = useState<string>("");
  const [checkNote, setCheckNote] = useState<string>("");
  const [checkCategory, setCheckCategory] = useState<SpendCategory>("Other");
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
  const [checkMessage, setCheckMessage] = useState<string>("");

  // Add budgets state for use in FinanceGPT
  const defaultBudgets: Record<SpendCategory, number> = useMemo(() => {
    const base: Record<SpendCategory, number> = {} as any;
    CATEGORIES.forEach((c) => (base[c] = 0));
    return base;
  }, []);
  const [budgets, setBudgets] = useState<Record<SpendCategory, number>>(defaultBudgets);

  // Load budgets from localStorage
  useEffect(() => {
    const stored = safeParseJSON<Record<SpendCategory, number>>(localStorage.getItem(BUDGETS_KEY));
    if (stored) setBudgets({ ...defaultBudgets, ...stored });
  }, [defaultBudgets]);

  // Save budgets to localStorage when changed
  useEffect(() => {
    if (!isLoading) localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }, [budgets, isLoading]);

  const { loading: authLoading, user, logout } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { logs: fsLogs, loading: logsLoading } = useSpendLogs();
  const { budgets: fsBudgets, loading: budgetsLoading } = useCategoryBudgets();
  const { goals: fsGoals, loading: goalsLoading } = useSavingsGoals();
  const { notifications: fsNotifs, loading: notifsLoading } = useNotifications();

  // Load from hooks when data arrives
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (profile) {
        setUserData(profile);
      } else {
        // Fallback to localStorage if no Firestore profile yet
        const localData = safeParseJSON<any>(localStorage.getItem(USER_KEY));
        if (localData) {
          setUserData(localData);
        } else if (user) {
          // If signed in but no profile in FS or LS, redirect to onboarding
          router.push("/onboarding");
          return;
        }
      }
    }
  }, [authLoading, profile, profileLoading, user, router]);

  useEffect(() => {
    if (!logsLoading && fsLogs.length > 0) {
      setLogs(fsLogs);
    } else {
      const storedLogs = safeParseJSON<SpendLog[]>(localStorage.getItem(LOG_KEY)) || [];
      if (storedLogs.length > 0) setLogs(storedLogs.map(l => ({ ...l, category: l.category || "Other" })));
    }
  }, [fsLogs, logsLoading]);

  useEffect(() => {
    if (!budgetsLoading && fsBudgets) {
      setBudgets(fsBudgets);
    } else {
      const stored = safeParseJSON<Record<SpendCategory, number>>(localStorage.getItem(BUDGETS_KEY));
      if (stored) setBudgets({ ...defaultBudgets, ...stored });
    }
  }, [fsBudgets, budgetsLoading, defaultBudgets]);

  useEffect(() => {
    if (!goalsLoading && fsGoals.length > 0) {
      setGoals(fsGoals);
    } else {
      const storedGoals = safeParseJSON<SavingsGoal[]>(localStorage.getItem(GOALS_KEY)) || [];
      if (storedGoals.length > 0) setGoals(storedGoals);
    }
  }, [fsGoals, goalsLoading]);

  useEffect(() => {
    if (!notifsLoading && fsNotifs.length > 0) {
      setNotifications(fsNotifs);
    } else {
      const storedNotifs = safeParseJSON<Notification[]>(localStorage.getItem(NOTIF_KEY)) || [];
      if (storedNotifs.length > 0) setNotifications(storedNotifs);
    }
  }, [fsNotifs, notifsLoading]);

  // Set top-level loading state
  useEffect(() => {
    if (!authLoading && !profileLoading && !logsLoading && !budgetsLoading) {
      setIsLoading(false);
    }
  }, [authLoading, profileLoading, logsLoading, budgetsLoading]);

  // Save data
  useEffect(() => {
    if (!isLoading) localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(RECURRING_KEY, JSON.stringify(recurring));
  }, [recurring, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications, isLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCurrentView("transactions");
      }
      if (e.key === "Escape") {
        // Close modals if needed
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------- Derived State ----------
  const derived = useMemo<any>(() => {
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
    const data = safeParseJSON<any>(localStorage.getItem(USER_KEY));
    if (data) setUserData(data);
  };

  function runCheck() {
    if (!derived?.safeSpendToday) return;

    const amt = Number(checkAmount || 0);
    if (amt <= 0) {
      setCheckStatus("idle");
      setCheckMessage("Enter amount to see guidance.");
      return;
    }

    const entry: SpendLog = {
      id: crypto.randomUUID(),
      amount: amt,
      note: checkNote.trim() || undefined,
      category: checkCategory,
      createdAt: new Date().toISOString(),
      type: "expense"
    };

    setLogs((prev) => [entry, ...prev]);

    const safe = derived.safeSpendToday;

    if (amt <= safe) {
      setCheckStatus("safe");
      setCheckMessage("✅ Safe — you'll still stay on track.");
    } else if (amt <= Math.floor(safe * 1.5)) {
      setCheckStatus("risky");
      setCheckMessage("⚠️ Risky — your daily safe spend will shrink.");
    } else {
      setCheckStatus("no");
      setCheckMessage("❌ Not advised — you'll likely miss your goal.");
    }

    toast.success("Logged. Calculations updated in real-time.");

    setCheckAmount("");
  }

  function deleteLog(id: string) {
    const deleted = logs.find(l => l.id === id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    
    // Undo feature
    if (deleted) {
      toast((t) => (
        <span>
          Deleted. 
          <button
            onClick={() => {
              setLogs(prev => [deleted, ...prev]);
              toast.dismiss(t.id);
            }}
            className="ml-2 underline"
          >
            Undo
          </button>
        </span>
      ));
    }
  }

  function clearAllLogs() {
    if (window.confirm("Are you sure? This cannot be undone.")) {
      setLogs([]);
      toast.success("All logs cleared");
    }
  }

  function addLog(log: SpendLog) {
    setLogs((prev) => [log, ...prev]);
  }

  function addRecurringRule(rule: RecurringRule) {
    setRecurring((prev) => [rule, ...prev]);
  }

  function deleteRecurringRule(id: string) {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }

  function runDueRecurring() {
    const now = new Date();
    const newLogs: SpendLog[] = [];

    recurring.forEach((rule) => {
      if (!rule.active || new Date(rule.nextRunDate) > now) return;

      const entry: SpendLog = {
        id: crypto.randomUUID(),
        amount: rule.amount,
        note: rule.title,
        category: rule.category,
        createdAt: now.toISOString(),
        type: rule.type,
      };

      newLogs.push(entry);

      const cadenceMap: Record<Cadence, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        yearly: 365,
      };
      const newNextRun = new Date(rule.nextRunDate);
      newNextRun.setDate(newNextRun.getDate() + (cadenceMap[rule.cadence] || 1));
      rule.nextRunDate = newNextRun.toISOString();
    });

    setLogs((prev) => [...newLogs, ...prev]);
    setRecurring([...recurring]);

    if (newLogs.length > 0) {
      toast.success(`Processed ${newLogs.length} recurring transaction(s)`);
    }
  }

  function addGoal(goal: SavingsGoal) {
    setGoals((prev) => [goal, ...prev]);
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function addContribution(goalId: string, amount: number) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentSaved: g.currentSaved + amount } : g
      )
    );
  }

  function addNotification(notif: Notification) {
    setNotifications((prev) => [notif, ...prev]);
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function markNotificationRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
    "lg:translate-x-0";

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: MdDashboard },
    { id: "transactions", label: "Transactions", icon: MdAssignment },
    { id: "recurring", label: "Recurring", icon: MdRepeat },
    { id: "goals", label: "Goals", icon: MdStart },
    { id: "reports", label: "Reports", icon: MdAssignment },
    { id: "insights", label: "Insights", icon: MdLightbulb },
    { id: "financegpt", label: "FinanceGPT", icon: MdTrendingUp },
  ];

  const settingsItems = [
    { id: "notifications", label: "Notifications", icon: MdNotifications },
    { id: "settings", label: "Settings", icon: MdSettings },
  ];

  const bottomNavItems = [
    { id: "dashboard", label: "Home", icon: MdDashboard },
    { id: "transactions", label: "Spend", icon: MdAssignment },
    { id: "financegpt", label: "AI", icon: MdTrendingUp },
    { id: "goals", label: "Goals", icon: MdStart },
    { id: "more", label: "More", icon: BiMenu },
  ];

  return (
    <div className={`h-screen overflow-hidden ${shellBg} ${fg}`}>
      {/* ✅ Global toaster (theme matches your CSS vars) */}
      <Toaster
        position="top-center"
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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
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
                                           setCurrentView(item.id as View);
                      setSidebarOpen(false);
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
                        setCurrentView(item.id as View);
                        setSidebarOpen(false);
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
                <p className={`text-sm font-semibold ${fg} mt-1`}>₹{formatINR(derived?.remainingSpendable || 0)}</p>
                <p className={`text-xs ${muted} mt-1`}>
                  Safe/day: {derived?.safeSpendToday === null ? "—" : `₹${formatINR(derived?.safeSpendToday || 0)}`}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 lg:ml-[280px] flex flex-col h-screen overflow-hidden pb-[72px] lg:pb-0">
          {/* Topbar */}
          <div className={`sticky top-0 z-30 ${shellBg} border-b ${border} shrink-0`}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden ${buttonPrimary}`}
                  aria-label="Open sidebar"
                >
                  <BiMenu size={20} />
                </button>

                <div>
                  <p className={`text-sm font-semibold ${fg}`}>
                    {currentView === "dashboard"
                      ? "Dashboard"
                      : currentView === "transactions"
                      ? "Transactions"
                      : currentView === "recurring"
                      ? "Recurring"
                      : currentView === "goals"
                      ? "Goals"
                      : currentView === "reports"
                      ? "Reports"
                      : currentView === "insights"
                      ? "Insights"
                      : currentView === "notifications"
                      ? "Notifications"
                      : currentView === "settings"
                      ? "Settings"
                      : "FinanceGPT"}
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

              <div className="flex items-center gap-4">
                <div className={`hidden lg:block text-right`}>
                  <p className={`text-xs ${muted}`}>Safe spend today</p>
                  <p className={`text-sm font-semibold ${fg}`}>
                    {derived?.safeSpendToday === null ? "—" : `₹${formatINR(derived?.safeSpendToday || 0)}`}
                  </p>
                </div>
                <div className="pl-2 border-l border-[rgb(var(--border))] flex items-center gap-3">
                  {user?.photoURL && (
                    <Image 
                      src={user.photoURL} 
                      alt="Profile" 
                      width={32} 
                      height={32} 
                      className="rounded-full" 
                    />
                  )}
                  <button 
                    onClick={async () => {
                      await logout();
                      router.push("/");
                    }}
                    className={`text-xs ${muted} hover:text-red-600 bg-[#2d2d2d] px-3 py-2 rounded-md`}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* View content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {currentView === "dashboard" ? (
              <DashboardView
                derived={derived}
                userData={userData}
                logs={logs}
                goals={goals}
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
            ) : currentView === "transactions" ? (
              <TransactionsView
                logs={logs}
                onAddLog={addLog}
                onDeleteLog={deleteLog}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
                buttonDanger={buttonDanger}
              />
            ) : currentView === "recurring" ? (
              <RecurringView
                rules={recurring}
                onAddRule={addRecurringRule}
                onDeleteRule={deleteRecurringRule}
                onRunDue={runDueRecurring}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
                buttonDanger={buttonDanger}
              />
            ) : currentView === "goals" ? (
              <GoalsView
                goals={goals}
                onAddGoal={addGoal}
                onDeleteGoal={deleteGoal}
                onAddContribution={addContribution}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
                buttonDanger={buttonDanger}
              />
            ) : currentView === "reports" ? (
              <ReportsView
                logs={logs}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
              />
            ) : currentView === "insights" ? (
              <InsightsView
                logs={logs}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
              />
            ) : currentView === "notifications" ? (
              <NotificationsView
                notifications={notifications}
                onDeleteNotif={deleteNotification}
                onMarkRead={markNotificationRead}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
              />
            ) : currentView === "financegpt" ? (
              <FinanceGPT
                userData={userData}
                derived={derived}
                logs={logs}
                budgets={budgets}
                inputBase={inputBase}
                border={border}
                cardBg={cardBg}
                shellBg={shellBg}
                fg={fg}
                muted={muted}
                onAddLog={addLog}
              />
            ) : currentView === "settings" ? (
              <SettingsView 
                userData={userData} 
                onUpdate={refreshData} 
                border={border}
                cardBg={cardBg}
                fg={fg}
                muted={muted}
                inputBase={inputBase}
                buttonPrimary={buttonPrimary}
              />
            ) : null}
          </div>
        </main>
      </div>

      {/* Modern Bottom Navigation for Mobile/Tablet */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 ${cardBg} border-t ${border} flex justify-around items-center backdrop-blur-xl bg-opacity-90 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]`}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "more") {
                  setSidebarOpen(true);
                } else {
                  setCurrentView(item.id as View);
                }
              }}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-200 ${
                isActive ? "text-[rgb(var(--foreground))]" : "text-[rgb(var(--muted-foreground))]"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${
                isActive ? "bg-[rgb(var(--foreground))]/10 scale-110" : "hover:bg-[rgb(var(--muted))]"
              }`}>
                <Icon size={22} className={isActive ? "text-[rgb(var(--foreground))]" : ""} />
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
