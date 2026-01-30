"use client";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { FinanceGPT } from "@/app/components/FinanceGPT";
import { useRouter } from "next/navigation";
import { BiArrowBack } from "react-icons/bi";
import { useEffect, useState } from "react";
import { safeParseJSON } from "@/app/lib/utils";
import { SpendCategory } from "@/app/lib/types";

export default function FinanceGPTFullPage() {
  const router = useRouter();
  const { userData, logs, derived, budgets, addLog, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <header className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <BiArrowBack size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">FinanceGPT</h1>
            <p className="text-xs text-white/50">Full-screen AI Assistant</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <FinanceGPT
          userData={userData}
          derived={derived}
          logs={logs}
          budgets={budgets}
          inputBase="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          border="border-white/10"
          cardBg="bg-white/5"
          shellBg="bg-[#0a0a0a]"
          fg="text-white"
          muted="text-white/50"
          onAddLog={addLog}
        />
      </main>
    </div>
  );
}
