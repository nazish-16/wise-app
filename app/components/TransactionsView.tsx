"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { SpendLog, SpendCategory } from "@/app/lib/types";
import { formatINR, getYMD } from "@/app/lib/utils";

const CATEGORIES: SpendCategory[] = [
  "Food", "Transport", "Groceries", "Shopping", "Bills", "Health",
  "Entertainment", "Salary", "Bonus", "Savings", "Other"
];

export function TransactionsView({
  logs,
  onAddLog,
  onDeleteLog,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  inputBase,
  buttonPrimary,
  buttonDanger,
  goals = [],
}: {
  logs: SpendLog[];
  onAddLog: (log: SpendLog) => void;
  onDeleteLog: (id: string) => void;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
  inputBase: string;
  buttonPrimary: string;
  buttonDanger: string;
  goals?: any[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<SpendCategory | "All">("All");
  const [filterType, setFilterType] = useState<"income" | "expense" | "All">("All");
  const [searchNote, setSearchNote] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");
  const [formData, setFormData] = useState({
    amount: "",
    note: "",
    category: "Other" as SpendCategory,
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    intent: "Essential" as "Essential" | "Comfort" | "Impulse",
  });

  const goalImpact = useMemo(() => {
    const amt = Number(formData.amount || 0);
    if (amt <= 0 || !goals.length) return null;
    const impact = goals.map(g => {
      const remaining = g.targetAmount - g.currentSaved;
      const delayedBy = Math.ceil(amt / (remaining / 30)); // Rough estimate
      return { title: g.title, delay: delayedBy };
    }).filter(i => i.delay > 0);
    return impact[0]; // Show first goal impact
  }, [formData.amount, goals]);

  const filteredLogs = useMemo(() => {
    let result = logs.filter((l) => {
      const catOk = filterCategory === "All" || (l.category || "Other") === filterCategory;
      const typeOk = filterType === "All" || l.type === filterType;
      const noteOk = searchNote.length === 0 || (l.note || "").toLowerCase().includes(searchNote.toLowerCase());
      return catOk && typeOk && noteOk;
    });

    if (sortBy === "newest") result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "amount-high") result = result.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "amount-low") result = result.sort((a, b) => a.amount - b.amount);

    return result;
  }, [logs, filterCategory, filterType, searchNote, sortBy]);

  const handleSave = () => {
    const amount = Number(formData.amount || 0);
    if (amount <= 0) {
      toast.error("Amount must be > 0");
      return;
    }

    const dateTime = `${formData.date}T${formData.time}:00.000Z`;

    onAddLog({
      id: crypto.randomUUID(),
      amount,
      note: formData.note.trim() || undefined,
      category: formData.category,
      type: formData.type,
      createdAt: dateTime,
      intent: formData.type === 'expense' ? formData.intent : undefined
    });

    toast.success("Transaction added");
    setModalOpen(false);
    setFormData({
      amount: "",
      note: "",
      category: "Other",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      intent: "Essential",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-semibold ${fg}`}>Transactions</h2>
          <p className={`text-sm ${muted} mt-1`}>View and manage all your transactions.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className={`${buttonPrimary} gap-2`}>
          <MdAdd size={18} /> Add
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className={inputBase}>
              <option value="All">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className={inputBase}>
              <option value="All">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={inputBase}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount: High</option>
              <option value="amount-low">Amount: Low</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${muted}`}>Search</label>
            <input type="text" value={searchNote} onChange={(e) => setSearchNote(e.target.value)} placeholder="Note..." className={inputBase} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className={`rounded-xl border ${border} ${cardBg} p-4 space-y-2`}>
        {filteredLogs.length === 0 ? (
          <div className={`rounded-lg border ${border} ${shellBg} p-6 text-center`}>
            <p className={`text-sm ${muted}`}>No transactions match your filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center justify-between gap-3 rounded-lg border ${border} ${shellBg} p-3`}>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${fg}`}>
                  {log.type === "income" ? "+" : "−"}₹{formatINR(log.amount)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-xs ${muted} truncate`}>
                    {(log.category || "Other")} {log.note ? `• ${log.note}` : ""}
                  </p>
                  {log.intent && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      log.intent === 'Essential' ? 'bg-green-500/10 text-green-500' :
                      log.intent === 'Comfort' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {log.intent}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${muted} mt-1`}>{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => { onDeleteLog(log.id); toast.success("Deleted"); }} className={`${buttonDanger}`}>
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
              <h3 className={`text-lg font-semibold ${fg}`}>Add Transaction</h3>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className={inputBase}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Amount</label>
                <div className="relative">
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input type="text" inputMode="numeric" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/[^\d]/g, "") })} className={`${inputBase} pl-7`} />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className={inputBase}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${muted}`}>Note</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="e.g., coffee at Starbucks" className={inputBase} />
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${muted}`}>Spend Intent</label>
                  <select value={formData.intent} onChange={(e) => setFormData({ ...formData, intent: e.target.value as any })} className={inputBase}>
                    <option value="Essential">Essential (Needs)</option>
                    <option value="Comfort">Comfort (Wants)</option>
                    <option value="Impulse">Impulse (Unplanned)</option>
                  </select>
                </div>
              )}

              {goalImpact && formData.type === 'expense' && (
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-yellow-500/80">
                    <span className="font-bold">Goal Friction:</span> This spend could delay your "{goalImpact.title}" goal by approx. <span className="font-bold">{goalImpact.delay} days</span>.
                  </p>
                </div>
              )}

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
