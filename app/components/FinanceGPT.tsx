"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  MdDownload,
  MdRefresh,
  MdSend,
  MdMic,
  MdMicOff,
  MdExpandLess,
} from "react-icons/md";

import { SpendLog, SpendCategory } from "@/app/lib/types";
import { formatINR, safeParseJSON, downloadJSON } from "@/app/lib/utils";
import {
  BiBook,
  BiCalendarAlt,
  BiCopy,
  BiMoney,
} from "react-icons/bi";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type SpeechRecognitionEvent = Event & {
  results?: SpeechRecognitionResultList;
};

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: ((event: Event) => void) | null;
}

const QUICK_ACTIONS = [
  { label: "Can I spend ₹500?", text: "Can I safely spend ₹500 today?" },
  { label: "Weekly review", text: "Give me a summary of my spending this week." },
  { label: "Budget audit", text: "Analyze my spending and suggest improvements." },
  { label: "Savings plan", text: "Help me create a realistic 3-month savings plan." },
];

const CATEGORIES: SpendCategory[] = [
  "Food",
  "Transport",
  "Groceries",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Salary",
  "Bonus",
  "Savings",
  "Other",
];

const FINANCEGPT_CHAT_KEY = "wise_financegpt_chat";
const SESSION_ID_KEY = "wise_session_id";

/** ✅ NEW: Toggles shown only on the empty / main screen */
function ContextToggles({
  includeLast30Days,
  setIncludeLast30Days,
  includeBudgets,
  setIncludeBudgets,
  includeNotes,
  setIncludeNotes,
  border,
  cardBg,
  fg,
  muted,
}: {
  includeLast30Days: boolean;
  setIncludeLast30Days: (v: boolean) => void;
  includeBudgets: boolean;
  setIncludeBudgets: (v: boolean) => void;
  includeNotes: boolean;
  setIncludeNotes: (v: boolean) => void;
  border: string;
  cardBg: string;
  fg: string;
  muted: string;
}) {
  return (
    <div className="w-full max-w-2xl">
      <div className={`rounded-xl border ${border} ${cardBg} p-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs font-medium ${fg}`}>Context options</p>
            <p className={`text-xs ${muted} mt-0.5`}>
              These affect FinanceGPT answers.
            </p>
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setIncludeLast30Days(!includeLast30Days)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                includeLast30Days
                  ? "bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]"
                  : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
              }`}
              title="Toggle: Last 30 days"
            >
              <BiCalendarAlt size={18} />
            </button>

            <button
              onClick={() => setIncludeBudgets(!includeBudgets)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                includeBudgets
                  ? "bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]"
                  : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
              }`}
              title="Toggle: Include budgets"
            >
              <BiMoney size={18} />
            </button>

            <button
              onClick={() => setIncludeNotes(!includeNotes)}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                includeNotes
                  ? "bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]"
                  : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
              }`}
              title="Toggle: Include notes"
            >
              <BiBook size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content, fg }: { content: string; fg: string }) {
  return (
    <div className={`text-sm leading-relaxed ${fg} space-y-3`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-base font-bold mt-4 mb-2 border-b border-[rgb(var(--border))] pb-1" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-sm font-bold mt-3 mb-1" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />
          ),
          p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({ ...props }) => (
            <ul className="list-disc list-outside ml-4 space-y-1 mb-2" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-outside ml-4 space-y-1 mb-2" {...props} />
          ),
          li: ({ ...props }) => <li className="pl-1" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-2 border-[rgb(var(--muted-foreground))] pl-3 py-1 italic text-[rgb(var(--muted-foreground))] bg-[rgb(var(--muted))]/30 rounded-r my-2"
              {...props}
            />
          ),
          code: ({ inline, ...props }: any) =>
            inline ? (
              <code
                className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] px-1.5 py-0.5 rounded text-[11px] font-mono mx-1"
                {...props}
              />
            ) : (
              <code
                className="block font-mono text-[11px]"
                {...props}
              />
            ),
          pre: ({ ...props }) => (
            <div className="my-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] overflow-hidden">
              <pre className="m-0 p-3 overflow-x-auto" {...props} />
            </div>
          ),
          a: ({ ...props }) => (
            <a
              className="text-blue-400 font-medium hover:underline hover:text-blue-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-[rgb(var(--border))]">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-[rgb(var(--muted))]/50 font-semibold" {...props} />
          ),
          tbody: ({ ...props }) => <tbody className="divide-y divide-[rgb(var(--border))]" {...props} />,
          tr: ({ ...props }) => (
            <tr className="hover:bg-[rgb(var(--muted))]/20 transition-colors" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="p-2 border-b border-[rgb(var(--border))] whitespace-nowrap" {...props} />
          ),
          td: ({ ...props }) => <td className="p-2 whitespace-nowrap" {...props} />,
          hr: ({ ...props }) => <hr className="my-4 border-[rgb(var(--border))]" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[rgb(var(--foreground))]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

function ChatMessage({
  message,
  onCopy,
  fg,
  muted,
  cardBg,
  border,
}: {
  message: ChatMessage;
  onCopy: (text: string) => void;
  fg: string;
  muted: string;
  cardBg: string;
  border: string;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] md:max-w-2xl rounded-2xl px-5 py-3.5 shadow-sm ${
          isUser
            ? "bg-[#27272a] text-white rounded-br-sm"
            : `bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded-bl-sm`
        }`}
      >
        {isUser ? (
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap wrap-break-words">{message.content}</p>
        ) : (
          <MarkdownContent content={message.content} fg={fg} />
        )}

        <div className={`flex items-center justify-between gap-2 mt-2 ${isUser ? "opacity-80" : ""}`}>
          <p className={`text-[10px] ${isUser ? "text-inherit" : muted}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isUser && (
            <button
              onClick={() => {
                onCopy(message.content);
                toast.success("Copied");
              }}
              className={`p-1 hover:opacity-100 opacity-60 transition-opacity ${muted}`}
              title="Copy"
            >
              <BiCopy size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AudioInput({
  onTranscript,
  muted,
}: {
  onTranscript: (text: string) => void;
  muted: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognitionCtor();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      let isFinal = false;

      if (event.results) {
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
      }

      if (isFinal) onTranscript(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    return () => {
      if (recognition) recognition.abort();
    };
  }, [onTranscript]);

  const handleToggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`p-1.5 rounded-lg transition-colors ${
        isListening
          ? "bg-red-500/20 text-red-500"
          : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]"
      }`}
      title={isListening ? "Stop" : "Start recording"}
    >
      {isListening ? <MdMicOff size={18} /> : <MdMic size={18} />}
    </motion.button>
  );
}

function QuickActionChips({
  onSelect,
  fg,
  border,
}: {
  onSelect: (text: string) => void;
  fg: string;
  border: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl">
      {QUICK_ACTIONS.map((action, idx) => (
        <motion.button
          key={idx}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(action.text)}
          className={`px-3 py-2 rounded-lg border ${border} hover:bg-[rgb(var(--muted))] transition-colors text-left`}
        >
          <span className={`text-xs font-medium ${fg}`}>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function InsightsPeek({
  userData,
  derived,
  budgets,
  fg,
  muted,
  cardBg,
  border,
}: {
  userData: any;
  derived: any;
  budgets: Record<SpendCategory, number>;
  fg: string;
  muted: string;
  cardBg: string;
  border: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-2xl text-center">
      <div className={`rounded-lg border ${border} ${cardBg} p-3`}>
        <p className={`text-xs ${muted}`}>Safe Today</p>
        <p className={`text-lg font-bold ${fg} mt-1`}>
          {derived?.safeSpendToday === null
            ? "—"
            : `₹${formatINR(derived?.safeSpendToday || 0)}`}
        </p>
      </div>

      <div className={`rounded-lg border ${border} ${cardBg} p-3`}>
        <p className={`text-xs ${muted}`}>Spent Today</p>
        <p className={`text-lg font-bold ${fg} mt-1`}>
          ₹{formatINR(derived?.spentToday || 0)}
        </p>
      </div>

      <div className={`rounded-lg border ${border} ${cardBg} p-3`}>
        <p className={`text-xs ${muted}`}>Month Left</p>
        <p className={`text-lg font-bold ${fg} mt-1`}>
          ₹{formatINR(derived?.remainingSpendable || 0)}
        </p>
      </div>
    </div>
  );
}

export function FinanceGPT({
  userData,
  derived,
  logs,
  budgets,
  inputBase,
  border,
  cardBg,
  shellBg,
  fg,
  muted,
  onAddLog,
}: {
  userData: any;
  derived: any;
  logs: SpendLog[];
  budgets: Record<SpendCategory, number>;
  inputBase: string;
  border: string;
  cardBg: string;
  shellBg: string;
  fg: string;
  muted: string;
  onAddLog: (log: SpendLog) => void;
}) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeLast30Days, setIncludeLast30Days] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [scrolledUp, setScrolledUp] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    let id = localStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, id);
    }
    setSessionId(id);

    const savedChat = safeParseJSON<ChatMessage[]>(
      localStorage.getItem(FINANCEGPT_CHAT_KEY)
    );
    if (savedChat) setChatMessages(savedChat);
  }, []);

  useEffect(() => {
    if (!scrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, scrolledUp]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem(FINANCEGPT_CHAT_KEY, JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const buildContextData = () => {
    let logsToUse = logs;

    if (includeLast30Days) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      logsToUse = logs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo);
    }

    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach((c) => (categoryTotals[c] = 0));
    logsToUse.forEach((l) => {
      const c = l.category || "Other";
      categoryTotals[c] = (categoryTotals[c] || 0) + l.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 8);

    const contextData: any = {
      income: userData.income || 0,
      fixedTotal: derived.fixedTotal || 0,
      savingsGoal: derived.goal || 0,
      spendableMonth: derived.spendableMonth || 0,
      spentThisMonth: derived.spentThisMonth || 0,
      remainingSpendable: derived.remainingSpendable || 0,
      safeSpendToday: derived.safeSpendToday || 0,
      spentToday: derived.spentToday || 0,
      weekSpent: derived.weekSpent || 0,
      deltaWeek: derived.deltaWeek || 0,
      expectedThisWeek: derived.expectedThisWeek || 0,
      categoryTotals,
      topCategories,
      projectedMonthSpend: derived.projectedMonthSpend || 0,
      projectedRemaining: derived.projectedRemaining || 0,
      noSpendStreak: derived.noSpendStreak || 0,
      daysInMonth: derived.daysInMonth || 0,
      dayOfMonth: derived.dayOfMonth || 0,
      daysLeft: derived.daysLeft || 0,
    };

    if (includeBudgets) contextData.budgets = budgets;

    return contextData;
  };

  const sendMessage = async (customText?: string) => {
    const text = customText || inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);
    setScrolledUp(false);

    try {
      const contextData = buildContextData();

      const response = await fetch("/api/financegpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: contextData,
          options: {
            sessionId,
            includeNotes,
            model: "models/gemini-2.5-flash",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      let assistantText = data.message;

      // Check for JSON command block
      const commandRegex = /```json\s*(\{[\s\S]*?"command"\s*:\s*"add_log"[\s\S]*?\})\s*```/;
      const match = assistantText.match(commandRegex);

      if (match) {
        try {
          const commandData = JSON.parse(match[1]);
          if (commandData.command === "add_log") {
            const newLog: SpendLog = {
              id: crypto.randomUUID(),
              amount: Number(commandData.amount),
              category: commandData.category || "Other",
              note: commandData.note || "AI Logged",
              createdAt: new Date().toISOString(),
              type: "expense",
            };
            onAddLog(newLog);
            toast.success(`Logged ₹${newLog.amount} for ${newLog.category}`);
            
            // Remove the JSON block from the displayed message
            assistantText = assistantText.replace(match[0], "").trim();
          }
        } catch (e) {
          console.error("Failed to parse AI command", e);
        }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // toast.error(error instanceof Error ? error.message : "Failed to send");
      // setChatMessages((prev) => prev.slice(0, -1));
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Please try again or Please ask again.",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (confirm("Clear chat history?")) {
      setChatMessages([]);
      localStorage.removeItem(FINANCEGPT_CHAT_KEY);
      toast.success("Chat cleared");
    }
  };

  const exportChat = (format: "json" | "markdown") => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      downloadJSON(`financegpt-chat-${timestamp}.json`, {
        messages: chatMessages,
        exportedAt: new Date().toISOString(),
      });
    } else {
      const md = chatMessages
        .map((m) => {
          const role = m.role === "user" ? "**You**" : "**FinanceGPT**";
          return `${role}\n\n${m.content}`;
        })
        .join("\n\n---\n\n");

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financegpt-chat-${timestamp}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported");
    }
  };

  const isEmpty = chatMessages.length === 0;

  return (
    <div className="h-full flex flex-col bg-[rgb(var(--background))]">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center px-4 pb-32 space-y-4"
            >
              <div className="text-center space-y-2">
                <h3 className={`text-2xl font-semibold ${fg}`}>FinanceGPT</h3>
                <p className={`text-sm ${muted}`}>What's on your mind?</p>
              </div>

              <InsightsPeek
                userData={userData}
                derived={derived}
                budgets={budgets}
                fg={fg}
                muted={muted}
                cardBg={cardBg}
                border={border}
              />

              {/* ✅ Toggles ONLY on main screen */}
              <ContextToggles
                includeLast30Days={includeLast30Days}
                setIncludeLast30Days={setIncludeLast30Days}
                includeBudgets={includeBudgets}
                setIncludeBudgets={setIncludeBudgets}
                includeNotes={includeNotes}
                setIncludeNotes={setIncludeNotes}
                border={border}
                cardBg={cardBg}
                fg={fg}
                muted={muted}
              />

              <QuickActionChips onSelect={sendMessage} fg={fg} border={border} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4"
            >
              {chatMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                  fg={fg}
                  muted={muted}
                  cardBg={cardBg}
                  border={border}
                />
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex gap-3 rounded-xl p-4 bg-[rgb(var(--muted))]`}
                >
                  <TypingIndicator />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {scrolledUp && !isEmpty && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className={`absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-2 rounded-full ${cardBg} border ${border} text-sm ${fg} hover:opacity-80 transition-opacity flex items-center gap-1`}
          >
            <MdExpandLess size={16} /> New messages
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input bar (toggles removed from here) */}
      <motion.div
        layout
        className={`border-t ${border} ${cardBg} px-4 md:px-6 py-2.5`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1.5 items-center">
            <div className="flex-1 flex gap-1.5 items-center">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isEmpty ? "Ask me anything..." : "Follow up..."}
                  className={`${inputBase} flex-1 resize-none max-h-20 py-2`}
                  rows={1}
                />
              </div>
              <AudioInput
                onTranscript={(text) =>
                  setInputValue((prev) => prev + (prev ? " " : "") + text)
                }
                muted={muted}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 rounded-lg bg-[rgb(var(--foreground))] text-[rgb(var(--background))] hover:opacity-90 disabled:opacity-50 transition-opacity font-semibold shrink-0"
            >
              <MdSend size={18} />
            </motion.button>

            {/* Only export / reset remain here */}
            <div className="flex gap-0.5 shrink-0">
              <button
                onClick={() => exportChat("markdown")}
                className="p-1.5 rounded hover:bg-[rgb(var(--muted))] transition-colors text-[rgb(var(--muted-foreground))]"
                title="Export as Markdown"
              >
                <MdDownload size={16} />
              </button>
              <button
                onClick={resetChat}
                className="p-1.5 rounded hover:bg-[rgb(var(--muted))] transition-colors text-[rgb(var(--muted-foreground))]"
                title="Clear chat"
              >
                <MdRefresh size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
