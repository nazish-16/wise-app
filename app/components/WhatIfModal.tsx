"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpendCategory } from "@/app/lib/types";
import { formatINR } from "@/app/lib/utils";
import { simulateWhatIf, DashboardContext } from "@/lib/insights/engine";

export function WhatIfModal({
  isOpen,
  onClose,
  context,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  inputBase,
  buttonPrimary,
}: {
  isOpen: boolean;
  onClose: () => void;
  context: DashboardContext;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
  inputBase: string;
  buttonPrimary: string;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<SpendCategory>("Other");

  const simulation = useMemo(() => {
    const amt = Number(amount || 0);
    if (amt <= 0) return null;
    return simulateWhatIf(context, amt, category);
  }, [amount, category, context]);

  const CATEGORIES: SpendCategory[] = [
    "Food", "Transport", "Groceries", "Shopping", "Bills", "Health",
    "Entertainment", "Salary", "Bonus", "Savings", "Other"
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-sm rounded-2xl border ${border} ${cardBg} p-6 shadow-2xl`}
        >
          <h3 className={`text-xl font-bold ${fg} mb-4`}>"What If" Simulator</h3>
          <p className={`text-sm ${muted} mb-6`}>
            See how a potential spend affects your daily limit and goals without recording it.
          </p>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold ${muted} mb-1 uppercase tracking-wider`}>Amount</label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${muted}`}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  className={`${inputBase} pl-8 text-lg font-medium`}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${muted} mb-1 uppercase tracking-wider`}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpendCategory)}
                className={inputBase}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {simulation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`mt-6 p-4 rounded-xl border ${border} ${shellBg} space-y-3`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${muted}`}>New Daily Limit</span>
                  <span className={`text-sm font-bold ${simulation.status === "SAFE" ? "text-[rgb(var(--success))]" : "text-yellow-500"}`}>
                    ₹{formatINR(simulation.newValues.safeSpendToday)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={muted}>Daily limit change</span>
                  <span className="text-red-400">−₹{formatINR(Math.abs(simulation.deltas.safeSpendToday))}</span>
                </div>
                {simulation.goalDelayDays > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className={muted}>Est. Goal Delay</span>
                    <span className="text-yellow-500">{simulation.goalDelayDays} day(s)</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[rgb(var(--border))]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      simulation.status === "SAFE" ? "bg-[rgb(var(--success))]" :
                      simulation.status === "RISKY" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <span className={`text-sm font-bold ${
                      simulation.status === "SAFE" ? "text-[rgb(var(--success))]" :
                      simulation.status === "RISKY" ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {simulation.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm font-medium hover:bg-[rgb(var(--muted))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className={`flex-1 ${buttonPrimary} rounded-xl`}
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
