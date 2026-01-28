"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/components/FirebaseAuthProvider";
import { setUserProfile } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  MdPerson, 
  MdSecurity, 
  MdAccountBalance, 
  MdNotifications, 
  MdCloudDone,
  MdEdit,
  MdCheck
} from "react-icons/md";
import { BiLogoGoogle, BiMailSend, BiUserCircle } from "react-icons/bi";

export function SettingsView({ 
  userData, 
  onUpdate,
  border,
  cardBg,
  fg,
  muted,
  inputBase,
  buttonPrimary
}: any) {
  const { user } = useAuth();
  
  const [income, setIncome] = useState<string>(String(userData?.income || ""));
  const [fixedExpenses, setFixedExpenses] = useState<string>(String(userData?.fixedExpenses || ""));
  const [savingsGoal, setSavingsGoal] = useState<string>(String(userData?.savingsGoal || ""));
  const [monthlySubscriptions, setMonthlySubscriptions] = useState<string>(
    String(userData?.monthlySubscriptions || "")
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "finance" | "account">("profile");

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updated = {
        ...userData,
        income: Number(income || 0),
        fixedExpenses: Number(fixedExpenses || 0),
        savingsGoal: Number(savingsGoal || 0),
        monthlySubscriptions: Number(monthlySubscriptions || 0),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await setUserProfile(user.uid, updated);
      
      // Also sync local storage for faster fallback
      localStorage.setItem("wise_user_data", JSON.stringify(updated));
      
      toast.success("Settings updated successfully");
      onUpdate();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: MdPerson },
    { id: "finance", label: "Financial Info", icon: MdAccountBalance },
    { id: "account", label: "Security", icon: MdSecurity },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${fg}`}>Settings</h2>
          <p className={`${muted} text-sm mt-1`}>Manage your account and financial preferences.</p>
        </div>
        
        <div className="flex bg-[rgb(var(--muted))]/50 p-1 rounded-xl border border-[rgb(var(--border))]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? `bg-[rgb(var(--card))] ${fg} shadow-sm` 
                    : `${muted} hover:${fg}`
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border ${border} ${cardBg} overflow-hidden shadow-sm`}>
                <div className="h-24 bg-[#2d2d2d] border-b border-[rgb(var(--border))]" />
                <div className="px-6 pb-6">
                  <div className="relative -mt-12 flex flex-col items-center md:items-start md:flex-row md:gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-4 border-[rgb(var(--card))] bg-[rgb(var(--muted))] overflow-hidden shadow-lg">
                        {user?.photoURL ? (
                          <Image 
                            src={user.photoURL} 
                            alt="Profile" 
                            width={96} 
                            height={96} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[rgb(var(--muted-foreground))]">
                            <BiUserCircle size={64} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-14 space-y-1 text-center md:text-left">
                      <h3 className={`text-xl font-bold ${fg}`}>{user?.displayName || "Wise User"}</h3>
                      <p className={`${muted} text-sm flex items-center justify-center md:justify-start gap-1`}>
                        <BiMailSend size={16} />
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border ${border} ${cardBg} p-6 shadow-sm space-y-6`}>
                <h4 className={`text-sm font-semibold uppercase tracking-wider ${muted}`}>Google Account Info</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${muted}`}>Provider</p>
                    <div className={`flex items-center gap-1 px-3 py-2 rounded-lg bg-[rgb(var(--muted))]/30 border ${border}`}>
                        <BiLogoGoogle size={20} className="text-white"/>
                      <span className={`text-sm ${fg}`}>Google Authentication</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${muted}`}>User ID</p>
                    <div className={`px-3 py-2 rounded-lg bg-[rgb(var(--muted))]/30 border ${border} font-mono text-xs ${fg} truncate`}>
                      {user?.uid}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${muted}`}>Email Verification</p>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${user?.emailVerified ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"} border ${border} text-sm`}>
                      <MdCloudDone size={16} />
                      {user?.emailVerified ? "Verified" : "Pending"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${muted}`}>Member Since</p>
                    <div className={`px-3 py-2 rounded-lg bg-[rgb(var(--muted))]/30 border ${border} text-sm ${fg}`}>
                      {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCE TAB */}
          {activeTab === "finance" && (
            <div className={`rounded-2xl border ${border} ${cardBg} p-6 shadow-sm space-y-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-bold ${fg}`}>Monthly Finance</h3>
                  <p className={`${muted} text-xs`}>Adjust your core numbers to update your daily spend guidance.</p>
                </div>
                <div className="hidden sm:block">
                   <MdAccountBalance size={32} className="text-indigo-500/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`block text-sm font-semibold ${fg}`}>Monthly Income</label>
                    <p className={`text-xs ${muted}`}>Total money you receive each month.</p>
                    <div className="relative group">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${muted} transition-colors group-focus-within:text-indigo-500`}>₹</span>
                      <input
                        className={`${inputBase} pl-10 h-12 text-lg font-medium`}
                        type="text"
                        inputMode="numeric"
                        value={income}
                        onChange={(e) => setIncome(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-sm font-semibold ${fg}`}>Fixed Expenses</label>
                    <p className={`text-xs ${muted}`}>Rent, EMI, utilities, and other stable costs.</p>
                    <div className="relative group">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${muted} transition-colors group-focus-within:text-indigo-500`}>₹</span>
                      <input
                        className={`${inputBase} pl-10 h-12 text-lg font-medium`}
                        type="text"
                        inputMode="numeric"
                        value={fixedExpenses}
                        onChange={(e) => setFixedExpenses(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`block text-sm font-semibold ${fg}`}>Monthly Subscriptions</label>
                    <p className={`text-xs ${muted}`}>SaaS, gym, entertainment, newspapers, etc.</p>
                    <div className="relative group">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${muted} transition-colors group-focus-within:text-indigo-500`}>₹</span>
                      <input
                        className={`${inputBase} pl-10 h-12 text-lg font-medium`}
                        type="text"
                        inputMode="numeric"
                        value={monthlySubscriptions}
                        onChange={(e) => setMonthlySubscriptions(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-sm font-semibold ${fg}`}>Monthly Savings Goal</label>
                    <p className={`text-xs ${muted}`}>Amount you want to put aside every month.</p>
                    <div className="relative group">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${muted} transition-colors group-focus-within:text-indigo-500`}>₹</span>
                      <input
                        className={`${inputBase} pl-10 h-12 text-lg font-medium`}
                        type="text"
                        inputMode="numeric"
                        value={savingsGoal}
                        onChange={(e) => setSavingsGoal(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <MdCheck size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className={`rounded-2xl border ${border} ${cardBg} p-6 shadow-sm space-y-4`}>
                <h3 className={`text-lg font-bold ${fg}`}>Security</h3>
                <p className={`${muted} text-sm`}>Your account is secured via Google OAuth.</p>
                <div className={`p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex gap-4 items-start`}>
                  <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                    <MdSecurity size={24} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-500">Enhanced Security Active</h5>
                    <p className="text-sm text-green-500/80 mt-1">
                      You are signed in with Google. This provides two-factor authentication (if enabled in your Google account) and 
                      end-to-end encryption for your sessions.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border ${border} ${cardBg} p-6 shadow-sm space-y-6`}>
                <h3 className={`text-lg font-bold ${fg}`}>Data Management</h3>
                
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${border} hover:bg-[rgb(var(--muted))]/30 transition-colors`}>
                    <div>
                      <p className={`font-semibold ${fg}`}>Export All Data</p>
                      <p className={`text-xs ${muted}`}>Download your spend logs and profile as JSON.</p>
                    </div>
                    <button className={buttonPrimary}>Download</button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-colors`}>
                    <div>
                      <p className="font-semibold text-red-500">Delete Account</p>
                      <p className="text-xs text-red-500/70">Permanently remove all your data from Wise.</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
