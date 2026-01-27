"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { MdAdd, MdDelete } from "react-icons/md";
import { SavingsGoal } from "@/app/lib/types";
import { formatINR, clamp01 } from "@/app/lib/utils";

export function GoalsView({
  goals,
  onAddGoal,
  onDeleteGoal,
  onAddContribution,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  inputBase,
  buttonPrimary,
  buttonDanger,
}: {
  goals: SavingsGoal[];
  onAddGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddContribution: (goalId: string, amount: number) => void;
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
    name: "",
    targetAmount: "",
    targetDate: "",
    contributionType: "monthly" as "monthly" | "flexible",
  });
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const handleSaveGoal = () => {
    const target = Number(formData.targetAmount || 0);
    if (target <= 0 || !formData.name.trim()) {
      toast.error("Fill required fields");
      return;
    }

    onAddGoal({
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      targetAmount: target,
      targetDate: formData.targetDate || undefined,
      currentSaved: 0,
      contributionType: formData.contributionType,
      createdAt: new Date().toISOString(),
    });

    toast.success("Goal created");
    setModalOpen(false);
    setFormData({ name: "", targetAmount: "", targetDate: "", contributionType: "monthly" });
  };

  const handleAddContribution = () => {
    const amount = Number(contributionAmount || 0);
    if (amount <= 0) {
      toast.error("Amount must be > 0");
      return;
    }

    if (contributionGoalId) {
      onAddContribution(contributionGoalId, amount);
      toast.success("Contribution added");
      setContributionGoalId(null);
      setContributionAmount("");
    }
  };

  const getProgress = (goal: SavingsGoal) => {
    return clamp01(goal.currentSaved / goal.targetAmount);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${fg}`}>Savings Goals</h2>
          <p className={`text-sm ${muted} mt-1`}>Track your progress towards financial targets.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className={`${buttonPrimary} gap-2`}>
          <MdAdd size={18} /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 ? (
          <div className={`col-span-full rounded-lg border ${border} ${shellBg} p-6 text-center`}>
            <p className={`text-sm ${muted}`}>No goals yet. Create one to start saving!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal);
            return (
              <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border ${border} ${cardBg} p-4 space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${fg}`}>{goal.name}</p>
                    <p className={`text-xs ${muted} mt-1`}>₹{formatINR(goal.currentSaved)} / ₹{formatINR(goal.targetAmount)}</p>
                  </div>
                  <button onClick={() => { onDeleteGoal(goal.id); toast.success("Deleted"); }} className={`${buttonDanger}`}>
                    <MdDelete size={16} />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className={`text-xs ${muted}`}>{Math.round(progress * 100)}%</p>
                  </div>
                  <div className={`h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
                    <motion.div className="h-full rounded-full bg-[rgb(var(--success))]" initial={{ width: 0 }} animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>

                {contributionGoalId === goal.id ? (
                  <div className="flex gap-2 mt-3">
                    <div className="relative flex-1">
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                      <input type="text" inputMode="numeric" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="Amount" className={`${inputBase} pl-7 text-sm`} />
                    </div>
                    <button onClick={handleAddContribution} className={`${buttonPrimary} text-xs px-2`}>Add</button>
                    <button onClick={() => setContributionGoalId(null)} className={`px-2 rounded-lg border ${border} text-xs`}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setContributionGoalId(goal.id)} className={`w-full ${buttonPrimary} text-xs`}>
                    Add Contribution
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="fixed inset-0 z-40 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl border ${border} ${cardBg} p-6 space-y-4`}>
              <h3 className={`text-lg font-semibold ${fg}`}>New Savings Goal</h3>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Goal Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Vacation" className={inputBase} />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Target Amount</label>
                <div className="relative">
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input type="text" inputMode="numeric" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value.replace(/[^\d]/g, "") })} className={`${inputBase} pl-7`} />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Target Date (Optional)</label>
                <input type="date" value={formData.targetDate} onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })} className={inputBase} />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-lg border ${border} text-sm`}>Cancel</button>
                <button onClick={handleSaveGoal} className={`${buttonPrimary}`}>Create</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
