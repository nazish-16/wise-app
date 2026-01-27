"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MdTrendingUp, MdWarning } from "react-icons/md";
import { SpendLog } from "@/app/lib/types";
import { formatINR, isSameMonth, getYMD } from "@/app/lib/utils";

export function InsightsView({
  logs,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
}: {
  logs: SpendLog[];
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
}) {
  const now = new Date();
  const monthLogs = useMemo(() => logs.filter((l) => isSameMonth(new Date(l.createdAt), now) && l.type === "expense"), [logs]);

  const insights = useMemo(() => {
    const result: Array<{ title: string; message: string; icon: string }> = [];

    const avgPerDay = monthLogs.length > 0 ? monthLogs.reduce((s, l) => s + l.amount, 0) / 30 : 0;
    const spikes = monthLogs.filter((l) => l.amount > avgPerDay * 2);
    if (spikes.length > 0) {
      result.push({
        title: "Spending Spikes Detected",
        message: `${spikes.length} transaction(s) exceeded 2x your daily average (₹${formatINR(Math.round(avgPerDay * 2))})`,
        icon: "warning",
      });
    }

    const daySpends: Record<string, number> = {};
    monthLogs.forEach((l) => {
      const ymd = getYMD(new Date(l.createdAt));
      daySpends[ymd] = (daySpends[ymd] || 0) + l.amount;
    });
    const mostExpensiveDay = Object.entries(daySpends).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    if (mostExpensiveDay) {
      result.push({
        title: "Most Expensive Day",
        message: `${new Date(mostExpensiveDay[0]).toLocaleDateString()} - ₹${formatINR(mostExpensiveDay[1])}`,
        icon: "trend",
      });
    }

    return result;
  }, [monthLogs]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className={`text-xl font-semibold ${fg}`}>Insights</h2>
        <p className={`text-sm ${muted} mt-1`}>Smart analysis of your spending patterns.</p>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className={`rounded-lg border ${border} ${shellBg} p-6 text-center`}>
            <p className={`text-sm ${muted}`}>No insights yet. Keep tracking your spending!</p>
          </div>
        ) : (
          insights.map((insight, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`rounded-xl border ${border} ${cardBg} p-4`}>
              <div className="flex gap-3">
                <div className="pt-1">
                  {insight.icon === "warning" ? <MdWarning size={18} className="text-yellow-500" /> : <MdTrendingUp size={18} className="text-blue-500" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${fg}`}>{insight.title}</p>
                  <p className={`text-sm ${muted} mt-1`}>{insight.message}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
