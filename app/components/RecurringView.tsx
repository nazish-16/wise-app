"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { MdAdd, MdDelete, MdCheckCircle } from "react-icons/md";
import { RecurringRule, SpendCategory } from "@/app/lib/types";
import { formatINR } from "@/app/lib/utils";

const CATEGORIES: SpendCategory[] = [
  "Food", "Transport", "Groceries", "Shopping", "Bills", "Health",
  "Entertainment", "Salary", "Bonus", "Savings", "Other"
];

const CADENCES = ["daily", "weekly", "monthly", "yearly"];

export function RecurringView({
  rules,
  onAddRule,
  onDeleteRule,
  onRunDue,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  inputBase,
  buttonPrimary,
  buttonDanger,
}: {
  rules: RecurringRule[];
  onAddRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onRunDue: () => void;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
  inputBase: string;
  buttonPrimary: string;
  buttonDanger: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Other" as SpendCategory,
    cadence: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    type: "expense" as "income" | "expense",
    nextRunDate: new Date().toISOString().split("T")[0],
  });

  const dueRules = useMemo(() => {
    const now = new Date();
    return rules.filter((r) => r.active && new Date(r.nextRunDate) <= now);
  }, [rules]);

  const handleSave = () => {
    const amount = Number(formData.amount || 0);
    if (amount <= 0 || !formData.title.trim()) {
      toast.error("Fill all fields");
      return;
    }

    onAddRule({
      id: crypto.randomUUID(),
      title: formData.title.trim(),
      amount,
      category: formData.category,
      cadence: formData.cadence,
      nextRunDate: formData.nextRunDate + "T00:00:00Z",
      type: formData.type,
      active: true,
      createdAt: new Date().toISOString(),
    });

    toast.success("Recurring rule created");
    setModalOpen(false);
    setFormData({
      title: "",
      amount: "",
      category: "Other",
      cadence: "monthly",
      type: "expense",
      nextRunDate: new Date().toISOString().split("T")[0],
    });
  };

  const getTotalMonthly = (rule: RecurringRule) => {
    const map: Record<string, number> = { 
      daily: 30, 
      weekly: 4.3, 
      monthly: 1, 
      yearly: 1 / 12 
    };
    return Math.round(rule.amount * (map[rule.cadence] || 1));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${fg}`}>Recurring Transactions</h2>
          <p className={`text-sm ${muted} mt-1`}>Set up automatic income or expense rules.</p>
        </div>
        <div className="flex gap-2">
          {dueRules.length > 0 && (
            <button onClick={onRunDue} className={`${buttonPrimary} gap-2`}>
              <MdCheckCircle size={18} /> Run Due ({dueRules.length})
            </button>
          )}
          <button onClick={() => setModalOpen(true)} className={`${buttonPrimary} gap-2`}>
            <MdAdd size={18} /> Add
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 space-y-3`}>
        {rules.length === 0 ? (
          <div className={`rounded-lg border ${border} ${shellBg} p-6 text-center`}>
            <p className={`text-sm ${muted}`}>No recurring rules yet.</p>
          </div>
        ) : (
          rules.map((rule) => (
            <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center justify-between gap-3 rounded-lg border ${border} ${shellBg} p-3`}>
              <div className="flex-1">
                <p className={`text-sm font-medium ${fg}`}>{rule.title}</p>
                <p className={`text-xs ${muted} mt-1`}>
                  {rule.type === "income" ? "+" : "−"}₹{formatINR(rule.amount)} • {rule.cadence} • ~₹{formatINR(getTotalMonthly(rule))}/month
                </p>
                <p className={`text-xs ${muted}`}>Next: {new Date(rule.nextRunDate).toLocaleDateString()} {rule.active ? "✓" : "(inactive)"}</p>
              </div>
              <button onClick={() => { onDeleteRule(rule.id); toast.success("Deleted"); }} className={`${buttonDanger}`}>
                <MdDelete size={16} />
              </button>
            </motion.div>
          ))
        )}
        
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="fixed inset-0 z-40 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl border ${border} ${cardBg} p-6 space-y-4`}>
              <h3 className={`text-lg font-semibold ${fg}`}>Add Recurring Rule</h3>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })} className={inputBase}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Gym membership" className={inputBase} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Amount</label>
                <div className="relative">
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input type="text" inputMode="numeric" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^\d]/g, "") })} className={`${inputBase} pl-7`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${muted}`}>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as SpendCategory })} className={inputBase}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${muted}`}>Frequency</label>
                  <select value={formData.cadence} onChange={(e) => setFormData({ ...formData, cadence: e.target.value as any })} className={inputBase}>
                    {CADENCES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>First Run Date</label>
                <input type="date" value={formData.nextRunDate} onChange={(e) => setFormData({ ...formData, nextRunDate: e.target.value })} className={inputBase} />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-lg border ${border} text-sm`}>Cancel</button>
                <button onClick={handleSave} className={`${buttonPrimary}`}>Save</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
