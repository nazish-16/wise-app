"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PayCycle = "monthly" | "weekly" | "biweekly";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [income, setIncome] = useState<string>("");
  const [fixedExpenses, setFixedExpenses] = useState<string>("");
  const [savingsGoal, setSavingsGoal] = useState<string>("");
  const [payCycle, setPayCycle] = useState<PayCycle>("monthly");
  const [spendingHabits, setSpendingHabits] = useState<string>("");
  const [financialGoals, setFinancialGoals] = useState<string[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<string>("");
  const [monthlySubscriptions, setMonthlySubscriptions] = useState<string>("");

  const goals = [
    "New phone",
    "Vacation/Trip",
    "Emergency fund",
    "Buy a vehicle",
    "Home down payment",
    "Education",
    "Wedding",
    "Investment",
  ];

  const toggleGoal = (goal: string) => {
    setFinancialGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    // Simulate saving data (in real app, save to DB)
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Store in localStorage for now
    const userData = {
      income: Number(income),
      fixedExpenses: Number(fixedExpenses),
      savingsGoal: Number(savingsGoal) || 0,
      payCycle,
      spendingHabits,
      financialGoals,
      emergencyFund: Number(emergencyFund) || 0,
      monthlySubscriptions: Number(monthlySubscriptions) || 0,
      onboarded: true,
    };
    localStorage.setItem("wise_user_data", JSON.stringify(userData));
    
    router.push("/");
  };

  const shellBg = "bg-[rgb(var(--background))]";
  const cardBg = "bg-[rgb(var(--card))]";
  const border = "border-[rgb(var(--border))]";
  const fg = "text-[rgb(var(--foreground))]";
  const muted = "text-[rgb(var(--muted-foreground))]";

  const inputBase =
    `w-full rounded-xl border ${border} ${cardBg} ${fg} ` +
    "px-4 py-3 outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-transparent";

  const buttonBase =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-colors border";
  const buttonPrimary =
    `${buttonBase} ${fg} ${border} hover:bg-[rgb(var(--muted))]`;
  const buttonSecondary =
    `${buttonBase} ${muted} ${border} hover:bg-[rgb(var(--muted))]`;

  return (
    <div className={`min-h-screen ${shellBg} ${fg} flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Image src="/assets/logo.png" alt="Wise" width={48} height={48} />
            <h1 className="text-3xl font-semibold">Wise</h1>
          </div>
          <p className={muted}>Let&apos;s set up your financial clarity in 2 minutes</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${muted}`}>Step {step} of 4</span>
            <span className={`text-sm ${muted}`}>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className={`h-2 w-full rounded-full bg-[rgb(var(--muted))] overflow-hidden`}>
            <div
              className="h-full bg-[rgb(var(--accent))] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Income & Expenses */}
        {step === 1 && (
          <div className={`rounded-2xl border ${border} ${cardBg} p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold mb-2">Let&apos;s start with the basics</h2>
            <p className={`text-sm ${muted} mb-6`}>
              We need to know your income and fixed expenses to calculate your safe daily spend.
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Monthly Income <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input
                    className={`${inputBase} pl-8`}
                    type="text"
                    inputMode="numeric"
                    placeholder="25000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Fixed Monthly Expenses <span className="text-red-400">*</span>
                </label>
                <p className={`text-xs ${muted} mb-2`}>
                  Rent, EMI, insurance, utilities, etc.
                </p>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input
                    className={`${inputBase} pl-8`}
                    type="text"
                    inputMode="numeric"
                    placeholder="12000"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Monthly Subscriptions
                </label>
                <p className={`text-xs ${muted} mb-2`}>
                  Netflix, Spotify, gym, etc.
                </p>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input
                    className={`${inputBase} pl-8`}
                    type="text"
                    inputMode="numeric"
                    placeholder="1500"
                    value={monthlySubscriptions}
                    onChange={(e) => setMonthlySubscriptions(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Pay Cycle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["monthly", "biweekly", "weekly"] as PayCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setPayCycle(cycle)}
                      className={`px-4 py-3 rounded-xl border ${border} transition-colors ${
                        payCycle === cycle
                          ? `${cardBg} ${fg} ring-2 ring-[rgb(var(--ring))]`
                          : `${cardBg} ${muted} hover:bg-[rgb(var(--muted))]`
                      }`}
                    >
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!income || !fixedExpenses}
                className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Savings & Goals */}
        {step === 2 && (
          <div className={`rounded-2xl border ${border} ${cardBg} p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold mb-2">What are you saving for?</h2>
            <p className={`text-sm ${muted} mb-6`}>
              Set a savings goal to help us calculate your safe daily spend more accurately.
            </p>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Monthly Savings Goal (Optional)
                </label>
                <p className={`text-xs ${muted} mb-2`}>
                  How much do you want to save each month?
                </p>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input
                    className={`${inputBase} pl-8`}
                    type="text"
                    inputMode="numeric"
                    placeholder="5000"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Emergency Fund Target
                </label>
                <p className={`text-xs ${muted} mb-2`}>
                  How much do you want in your emergency fund? (Optional)
                </p>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>₹</span>
                  <input
                    className={`${inputBase} pl-8`}
                    type="text"
                    inputMode="numeric"
                    placeholder="50000"
                    value={emergencyFund}
                    onChange={(e) => setEmergencyFund(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  Financial Goals (Select all that apply)
                </label>
                <p className={`text-xs ${muted} mb-3`}>
                  What are you working towards?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {goals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`px-3 py-2 rounded-lg border ${border} text-sm transition-colors ${
                        financialGoals.includes(goal)
                          ? `${cardBg} ${fg} ring-2 ring-[rgb(var(--ring))]`
                          : `${cardBg} ${muted} hover:bg-[rgb(var(--muted))]`
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={buttonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={buttonPrimary}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Spending Habits */}
        {step === 3 && (
          <div className={`rounded-2xl border ${border} ${cardBg} p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold mb-2">Tell us about your spending</h2>
            <p className={`text-sm ${muted} mb-6`}>
              This helps us give you better recommendations.
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${fg}`}>
                  How would you describe your spending habits?
                </label>
                <textarea
                  className={inputBase}
                  rows={4}
                  placeholder="e.g., I tend to overspend on food delivery and online shopping..."
                  value={spendingHabits}
                  onChange={(e) => setSpendingHabits(e.target.value)}
                />
                <p className={`text-xs ${muted} mt-2`}>
                  Optional: Share what you struggle with or want to improve.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className={buttonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className={buttonPrimary}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Complete */}
        {step === 4 && (
          <div className={`rounded-2xl border ${border} ${cardBg} p-6 sm:p-8`}>
            <h2 className="text-2xl font-semibold mb-2">Review your setup</h2>
            <p className={`text-sm ${muted} mb-6`}>
              Everything looks good? Let&apos;s get started!
            </p>

            <div className={`space-y-4 rounded-xl border ${border} p-4 ${cardBg}`}>
              <div className="flex justify-between">
                <span className={muted}>Monthly Income</span>
                <span className={fg}>₹{Number(income).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className={muted}>Fixed Expenses</span>
                <span className={fg}>₹{Number(fixedExpenses).toLocaleString("en-IN")}</span>
              </div>
              {monthlySubscriptions && (
                <div className="flex justify-between">
                  <span className={muted}>Subscriptions</span>
                  <span className={fg}>₹{Number(monthlySubscriptions).toLocaleString("en-IN")}</span>
                </div>
              )}
              {savingsGoal && (
                <div className="flex justify-between">
                  <span className={muted}>Monthly Savings Goal</span>
                  <span className={fg}>₹{Number(savingsGoal).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={muted}>Pay Cycle</span>
                <span className={fg}>{payCycle.charAt(0).toUpperCase() + payCycle.slice(1)}</span>
              </div>
              {financialGoals.length > 0 && (
                <div>
                  <span className={muted}>Goals: </span>
                  <span className={fg}>{financialGoals.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">
                💡 Your safe daily spend will be calculated automatically based on these inputs.
              </p>
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(3)}
                className={buttonSecondary}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
