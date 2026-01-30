"use client";

import React from "react";
import { motion } from "framer-motion";
import { ConfidenceScore } from "@/app/lib/types";

export function ConfidenceWidget({
  confidence,
  border,
  cardBg,
  fg,
  muted,
}: {
  confidence: ConfidenceScore;
  border: string;
  cardBg: string;
  fg: string;
  muted: string;
}) {
  const score = confidence.score;
  const color = score > 80 ? "rgb(var(--success))" : score > 50 ? "#fbbf24" : "#f87171";

  return (
    <div className={`rounded-xl border ${border} ${cardBg} p-4 flex flex-col items-center justify-between text-center`}>
      <p className={`text-xs ${muted} mb-2`}>Money Confidence</p>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-[rgb(var(--muted))]"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="175.9"
            initial={{ strokeDashoffset: 175.9 }}
            animate={{ strokeDashoffset: 175.9 - (175.9 * score) / 100 }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-sm font-bold ${fg}`}>{score}</span>
      </div>

      <p className={`text-[10px] ${muted} mt-2 line-clamp-1`}>{confidence.reason}</p>
    </div>
  );
}
