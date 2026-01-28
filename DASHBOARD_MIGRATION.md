# Dashboard Migration Guide

## Overview
This guide will help you migrate the existing dashboard (`/app/dashboard/page.tsx`) from localStorage to Firestore with Clerk authentication.

---

## Step 1: Add Required Imports

At the top of `/app/dashboard/page.tsx`, add:

```typescript
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  useUserProfile,
  useSpendLogs,
  useCategoryBudgets,
  useChatMessages,
} from "@/lib/hooks/useFirestore";
```

---

## Step 2: Replace State Management

### Current (localStorage-based):
```typescript
const [userData, setUserData] = useState<UserData>({
  income: 0,
  fixedExpenses: 0,
  savingsGoal: 0,
  monthlySubscriptions: 0,
});

const [logs, setLogs] = useState<SpendLog[]>([]);
const [budgets, setBudgets] = useState<Record<SpendCategory, number>>({...});
```

### New (Firestore-based):
```typescript
const { user, isLoaded } = useUser();
const router = useRouter();
const { profile, loading: profileLoading, updateProfile } = useUserProfile();
const { logs, loading: logsLoading, addLog, removeLog, clearAllLogs } = useSpendLogs();
const { budgets, loading: budgetsLoading, updateBudgets } = useCategoryBudgets();
const { messages, addMessage, clearMessages } = useChatMessages();

// Redirect to onboarding if profile not set
useEffect(() => {
  if (isLoaded && user && profile && !profile.onboardingCompleted) {
    router.push("/onboarding");
  }
}, [isLoaded, user, profile, router]);

// Show loading state
if (!isLoaded || profileLoading || logsLoading) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
      <div className="text-[rgb(var(--foreground))]">Loading your dashboard...</div>
    </div>
  );
}

// Redirect if not signed in
if (!user) {
  router.push("/sign-in");
  return null;
}

// Convert profile to userData format for existing code
const userData: UserData = {
  income: profile?.income || 0,
  fixedExpenses: profile?.fixedExpenses || 0,
  savingsGoal: profile?.savingsGoal || 0,
  monthlySubscriptions: profile?.monthlySubscriptions || 0,
};
```

---

## Step 3: Update Add Log Function

### Current:
```typescript
const addNewLog = (amount: number, note: string, category: SpendCategory, type: TransactionType) => {
  const newLog: SpendLog = {
    id: crypto.randomUUID(),
    amount,
    note,
    category,
    type,
    createdAt: new Date().toISOString(),
  };
  const updated = [newLog, ...logs];
  setLogs(updated);
  localStorage.setItem(LOG_KEY, JSON.stringify(updated));
};
```

### New:
```typescript
const addNewLog = async (amount: number, note: string, category: SpendCategory, type: TransactionType) => {
  try {
    await addLog({
      amount,
      note,
      category,
      type,
      createdAt: new Date().toISOString(),
    });
    toast.success("Transaction added!");
  } catch (error) {
    toast.error("Failed to add transaction");
    console.error(error);
  }
};
```

---

## Step 4: Update Delete Log Function

### Current:
```typescript
const deleteLog = (id: string) => {
  const updated = logs.filter((l) => l.id !== id);
  setLogs(updated);
  localStorage.setItem(LOG_KEY, JSON.stringify(updated));
};
```

### New:
```typescript
const deleteLog = async (id: string) => {
  try {
    await removeLog(id);
    toast.success("Transaction deleted!");
  } catch (error) {
    toast.error("Failed to delete transaction");
    console.error(error);
  }
};
```

---

## Step 5: Update Clear All Logs Function

### Current:
```typescript
const clearAllLogs = () => {
  if (confirm("Delete all logs?")) {
    setLogs([]);
    localStorage.removeItem(LOG_KEY);
  }
};
```

### New:
```typescript
const clearAllLogsHandler = async () => {
  if (confirm("Delete all logs? This cannot be undone.")) {
    try {
      await clearAllLogs();
      toast.success("All logs cleared!");
    } catch (error) {
      toast.error("Failed to clear logs");
      console.error(error);
    }
  }
};
```

---

## Step 6: Update Budget Save Function

### Current:
```typescript
const saveBudgets = () => {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  setBudgetSaved(true);
  setTimeout(() => setBudgetSaved(false), 700);
};
```

### New:
```typescript
const saveBudgets = async () => {
  try {
    await updateBudgets(budgets);
    setBudgetSaved(true);
    toast.success("Budgets saved!");
    setTimeout(() => setBudgetSaved(false), 700);
  } catch (error) {
    toast.error("Failed to save budgets");
    console.error(error);
  }
};
```

---

## Step 7: Update Settings Save Function

### Current:
```typescript
const handleSave = () => {
  const updated = {
    ...userData,
    income: Number(income || 0),
    fixedExpenses: Number(fixedExpenses || 0),
    savingsGoal: Number(savingsGoal || 0),
    monthlySubscriptions: Number(monthlySubscriptions || 0),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  setSaved(true);
  setTimeout(() => {
    setSaved(false);
    onUpdate();
  }, 700);
};
```

### New:
```typescript
const handleSave = async () => {
  try {
    await updateProfile({
      income: Number(income || 0),
      fixedExpenses: Number(fixedExpenses || 0),
      savingsGoal: Number(savingsGoal || 0),
      monthlySubscriptions: Number(monthlySubscriptions || 0),
    });
    setSaved(true);
    toast.success("Settings saved!");
    setTimeout(() => {
      setSaved(false);
    }, 700);
  } catch (error) {
    toast.error("Failed to save settings");
    console.error(error);
  }
};
```

---

## Step 8: Update FinanceGPT Chat

### Current:
```typescript
useEffect(() => {
  const savedChat = safeParseJSON<ChatMessage[]>(localStorage.getItem(FINANCEGPT_CHAT_KEY));
  if (savedChat) {
    setChatMessages(savedChat);
  }
}, []);

useEffect(() => {
  if (chatMessages.length > 0) {
    localStorage.setItem(FINANCEGPT_CHAT_KEY, JSON.stringify(chatMessages));
  }
}, [chatMessages]);
```

### New:
```typescript
// Use the messages from useFirestore hook
const { messages: chatMessages, addMessage, clearMessages } = useChatMessages();

// When sending a message:
const sendMessage = async () => {
  if (!inputValue.trim() || isLoading) return;

  const userMessage = {
    role: "user" as const,
    content: inputValue,
    timestamp: Date.now(),
  };

  try {
    await addMessage(userMessage);
    setInputValue("");
    setIsLoading(true);

    // Call API for assistant response
    const response = await fetch("/api/financegpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...chatMessages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        context: buildContextData(),
        options: { sessionId, includeNotes, model: "models/gemini-2.5-flash" },
      }),
    });

    const data = await response.json();

    const assistantMessage = {
      role: "assistant" as const,
      content: data.message,
      timestamp: Date.now(),
    };

    await addMessage(assistantMessage);
  } catch (error) {
    toast.error("Failed to send message");
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

// Reset chat:
const resetChat = async () => {
  if (confirm("Clear all chat history?")) {
    try {
      await clearMessages();
      toast.success("Chat cleared!");
    } catch (error) {
      toast.error("Failed to clear chat");
      console.error(error);
    }
  }
};
```

---

## Step 9: Remove localStorage References

Search for and remove all references to:
- `localStorage.getItem(USER_KEY)`
- `localStorage.setItem(USER_KEY, ...)`
- `localStorage.getItem(LOG_KEY)`
- `localStorage.setItem(LOG_KEY, ...)`
- `localStorage.getItem(BUDGETS_KEY)`
- `localStorage.setItem(BUDGETS_KEY, ...)`
- `localStorage.getItem(FINANCEGPT_CHAT_KEY)`
- `localStorage.setItem(FINANCEGPT_CHAT_KEY, ...)`

---

## Step 10: Add User Menu

Add a user menu with sign-out button in the header:

```typescript
import { UserButton } from "@clerk/nextjs";

// In your header:
<div className="flex items-center gap-4">
  <UserButton afterSignOutUrl="/" />
</div>
```

---

## Step 11: Handle Initial Budgets

When budgets is null (first time user), initialize with defaults:

```typescript
const defaultBudgets: Record<SpendCategory, number> = useMemo(() => {
  const base: Record<SpendCategory, number> = {} as any;
  CATEGORIES.forEach((c) => (base[c] = 0));
  return base;
}, []);

const activeBudgets = budgets || defaultBudgets;
```

---

## Step 12: Add Loading States

Add skeleton loaders for better UX:

```typescript
if (logsLoading) {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-[rgb(var(--muted))] rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
```

---

## Step 13: Add Error Handling

Wrap data operations in try-catch:

```typescript
try {
  await addLog(...);
  toast.success("Success!");
} catch (error) {
  console.error("Error:", error);
  toast.error("Operation failed. Please try again.");
}
```

---

## Step 14: Test Everything

1. Sign up → Complete onboarding → Check dashboard loads
2. Add expense → Verify it saves to Firestore
3. Delete expense → Verify it removes from Firestore
4. Update settings → Verify profile updates
5. Set budgets → Verify budgets save
6. Chat with FinanceGPT → Verify messages persist
7. Sign out → Sign in → Verify data persists

---

## Quick Migration Checklist

- [ ] Add Clerk and Firestore imports
- [ ] Replace useState with useFirestore hooks
- [ ] Add loading and auth checks
- [ ] Update addNewLog to use addLog
- [ ] Update deleteLog to use removeLog
- [ ] Update clearAllLogs to use clearAllLogs
- [ ] Update saveBudgets to use updateBudgets
- [ ] Update Settings save to use updateProfile
- [ ] Update FinanceGPT to use chat hooks
- [ ] Remove all localStorage references
- [ ] Add UserButton for sign out
- [ ] Add loading states
- [ ] Add error handling with toasts
- [ ] Test all functionality

---

## Need Help?

If you get stuck:
1. Check browser console for errors
2. Verify Firestore rules are deployed
3. Check that user is authenticated
4. Ensure all environment variables are set
5. Restart dev server

---

## Alternative: Automated Migration Script

If you prefer, I can create a script to automatically migrate localStorage data to Firestore for existing users. Let me know!
