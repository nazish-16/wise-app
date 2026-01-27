"use client";

import React, { useState, useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import { MdDownload } from "react-icons/md";
import { SpendLog } from "@/app/lib/types";
import { formatINR, isSameMonth, addMonths, getMonthName, downloadCSV } from "@/app/lib/utils";

const CATEGORIES = [
  "Food", "Transport", "Groceries", "Shopping", "Bills", "Health",
  "Entertainment", "Salary", "Bonus", "Savings", "Other"
];

export function ReportsView({
  logs,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  inputBase,
  buttonPrimary,
}: {
  logs: SpendLog[];
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
  inputBase: string;
  buttonPrimary: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthLogs = useMemo(() => {
    return logs.filter((l) => isSameMonth(new Date(l.createdAt), selectedMonth));
  }, [logs, selectedMonth]);

  const stats = useMemo(() => {
    const income = monthLogs.filter((l) => l.type === "income").reduce((s, l) => s + l.amount, 0);
    const expenses = monthLogs.filter((l) => l.type === "expense").reduce((s, l) => s + l.amount, 0);
    const net = income - expenses;

    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (categoryTotals[c] = 0));
    monthLogs.forEach((l) => {
      if (l.type === "expense") categoryTotals[l.category || "Other"] = (categoryTotals[l.category || "Other"] || 0) + l.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);

    const avgPerDay = monthLogs.length > 0 ? expenses / 30 : 0;

    return { income, expenses, net, categoryTotals, topCategories, avgPerDay };
  }, [monthLogs]);

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Amount", "Category", "Note"],
      ...monthLogs.map((l) => [
        new Date(l.createdAt).toLocaleString(),
        l.type,
        String(l.amount),
        l.category || "Other",
        l.note || "",
      ]),
    ];
    downloadCSV(`wise-report-${getMonthName(selectedMonth).replace(" ", "-")}.csv`, rows);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${fg}`}>Reports</h2>
          <p className={`text-sm ${muted} mt-1`}>Analyze your spending patterns.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedMonth.getFullYear() + "-" + String(selectedMonth.getMonth() + 1).padStart(2, "0")} onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setSelectedMonth(new Date(Number(y), Number(m) - 1, 1));
          }} className={inputBase}>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = addMonths(new Date(), -i);
              const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={key} value={key}>{getMonthName(d)}</option>;
            })}
          </select>
          <button onClick={exportCSV} className={`${buttonPrimary} gap-2`}>
            <MdDownload size={18} /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Total Income</p>
          <p className={`text-lg font-semibold ${fg} mt-2`}>₹{formatINR(stats.income)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Total Expenses</p>
          <p className={`text-lg font-semibold text-red-500 mt-2`}>₹{formatINR(stats.expenses)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Net Savings</p>
          <p className={`text-lg font-semibold ${stats.net > 0 ? "text-[rgb(var(--success))]" : "text-red-500"} mt-2`}>₹{formatINR(stats.net)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <p className={`text-xs ${muted}`}>Avg/Day</p>
          <p className={`text-lg font-semibold ${fg} mt-2`}>₹{formatINR(Math.round(stats.avgPerDay))}</p>
        </motion.div>
      </div>

      {/* Top Categories */}
      {stats.topCategories.length > 0 && (
        <div className={`rounded-xl border ${border} ${cardBg} p-4`}>
          <h3 className={`text-sm font-semibold ${fg}`}>Top Categories</h3>
          <div className="mt-4 space-y-2">
            {stats.topCategories.map(([cat, amount]) => (
              <div key={cat} className={`flex items-center justify-between rounded-lg border ${border} ${shellBg} p-3`}>
                <p className={`text-sm font-medium ${fg}`}>{cat}</p>
                <p className={`text-sm font-semibold ${fg}`}>₹{formatINR(amount as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
