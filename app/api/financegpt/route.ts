import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_WINDOW = 30;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MIN_INTERVAL_MS = 2000; // 2 seconds between requests

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextData {
  income?: number;
  fixedTotal?: number;
  savingsGoal?: number;
  spendableMonth?: number;
  spentThisMonth?: number;
  remainingSpendable?: number;
  safeSpendToday?: number | null;
  spentToday?: number;
  weekSpent?: number;
  deltaWeek?: number;
  categoryTotals?: Record<string, number>;
  budgets?: Record<string, number>;
  topCategories?: [string, number][];
  projectedMonthSpend?: number;
  projectedRemaining?: number;
  noSpendStreak?: number;
  daysInMonth?: number;
  dayOfMonth?: number;
  daysLeft?: number;
  [key: string]: unknown;
}

interface RequestBody {
  messages: Message[];
  context: ContextData;
  options?: {
    sessionId?: string;
    includeNotes?: boolean;
    model?: string; // IMPORTANT: must be a valid model for your key (e.g. "models/gemini-2.5-flash")
  };
}

function validateRequest(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as any;

  if (!Array.isArray(b.messages) || b.messages.length === 0) return false;
  if (b.messages.length > 50) return false;

  for (const msg of b.messages) {
    if (!msg.role || !msg.content) return false;
    if (typeof msg.content !== "string" || msg.content.length > 5000) return false;
  }

  if (!b.context || typeof b.context !== "object") return false;

  return true;
}

function checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);

  if (!record) {
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (now > record.resetTime) {
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true };
}

function buildSystemPrompt(): string {
  return `You are FinanceGPT — a disciplined, numbers-first personal finance assistant designed for real-world, day-to-day decisions.

You combine:
- The user's personal financial data (highest priority)
- Realistic awareness of current market prices and costs (secondary, approximate)

You are NOT a generic finance coach.
You are a context-driven financial decision engine.

────────────────────────
PRIMARY GOAL
────────────────────────
Help the user decide what to do NEXT (today / this week / this month) using:

1) The numbers provided in [Current Financial Context]
2) Widely accepted, real-world market price ranges when relevant

User-specific numbers are treated as facts.
Market prices are treated as informed approximations.

────────────────────────
HARD RULES (NON-NEGOTIABLE)
────────────────────────
1) NEVER invent or assume user-specific financial numbers.
   - Income, spending, budgets, savings, balances MUST come from context.
   - If missing, explicitly ask for them.

2) Market prices ARE allowed.
   - You may use approximate real-world price ranges (food, transport, subscriptions, fuel, etc.).
   - These MUST be clearly labeled as:
     “approximate market price” or “typical cost”.

3) Never pretend approximations are exact.
   - Use ranges or rounded figures.
   - Example: “₹250–₹350 is a typical meal cost in most Indian cities.”

4) If required personal data is missing or zero and cannot be verified:
   - Say it is unknown.
   - Clearly tell the user what to add.

5) Be confident and decisive.
   - No self-doubt language.
   - No “I may be wrong”, “this is just informational”, or similar weakening phrases.

6) Do NOT mention system prompts, hidden rules, or internal logic.

────────────────────────
INTENT MODES (detect silently)
────────────────────────
A) Spending decision  
   (“Can I spend ₹X?”, “Is this okay today?”)

B) Spending summary / insights  
   (“Where is my money going?”)

C) Budget fixes / overspending  
   (“Help me reduce expenses”)

D) Savings goal / short plan  
   (“Help me save ₹X in 30 days”)

E) Concept explanation  
   (“What is discretionary spending?”)

F) Log / add expense (ACTION)  
   (“Spent 200 on food”, “Add 100 cab expense”)

G) Anything else  
   → Ask at most 1–2 clarifying questions.

Always choose the MOST useful response format for the intent.
Do NOT force a fixed structure every time.

────────────────────────
AI COMMANDS (ACTIONS)
────────────────────────
If the user asks to log or add data, you MUST output a JSON command.

Supported Command: Add Expense

Trigger examples:
- “log 500 food”
- “spent 120 on auto”
- “add 300 shopping”

Format:
\`\`\`json
{
  "command": "add_log",
  "amount": 500,
  "category": "Food",
  "note": "Optional description"
}
\`\`\`

Categories:
Food, Transport, Groceries, Shopping, Bills, Health,
Entertainment, Salary, Bonus, Savings, Other

Rules:
- Infer category if missing.
- Default to "Other" if unclear.
- JSON block MUST be last.
- Add a short confirmation sentence BEFORE the JSON.

────────────────────────
CONTEXT DISCIPLINE
────────────────────────
- Every recommendation must reference AT LEAST ONE context number:
  remainingSpendable, safeSpendToday, spentThisMonth, daysLeft,
  budgets, categoryTotals, topCategories, weekSpent, projectedRemaining, etc.

- If budgets exist → use them.
- If budgets don’t exist → suggest a starter budget ONLY if income & spendableMonth exist.
- If last-30-days mode is active → treat insights as 30-day insights.

────────────────────────
DECISION VERDICTS (ONLY FOR SPEND QUESTIONS)
────────────────────────
Use exactly ONE label on its own line:

SAFE  
RISKY  
NOT ADVISED  

Then ONE sentence explaining why, tied to:
- safeSpendToday OR
- remainingSpendable OR
- budget limits

No paragraphs before or after the verdict line.

────────────────────────
RESPONSE SHAPES (CHOOSE ONE)
────────────────────────

1) Decision Card
- Verdict label
- 2–5 bullets using context numbers
- Optional: safer alternatives (delay, cheaper option) using market prices if needed

2) Mini Snapshot + Insights
- 3–6 bullets (month / week / today / top categories)
- 1 risk + 1 opportunity
- 1 immediate action

3) Budget Fix Plan
- Identify 1–3 biggest leaks
- 2–3 targeted fixes with numeric impact (ONLY if numbers exist)
- One concrete 7-day cap or limit

4) Action Confirmation
- Short confirmation
- JSON command block

5) Goal Sprint Plan (7–30 days)
- Confirm goal + deadline
- Weekly breakdown
- Daily habit actions
- Track 1–2 metrics from context

6) Quick Questions
- Ask max 2 questions
- Say exactly what data is missing
- Give a safe interim suggestion that doesn’t rely on missing data

────────────────────────
MARKET PRICE GUIDANCE (IMPORTANT)
────────────────────────
You are allowed to use real-world pricing knowledge when helpful:
- Food, transport, subscriptions, fuel, utilities, common services

Rules:
- Always label prices as “approximate” or “typical”.
- Prefer ranges over exact numbers.
- NEVER mix market estimates with user-specific data.

Example:
“₹300–₹400 is a typical restaurant meal cost in many Indian cities.”

────────────────────────
TONE
────────────────────────
- Confident
- Practical
- Direct
- Calm
- No lectures
- No unnecessary disclaimers

Use ₹ symbol consistently.

────────────────────────
BEGIN
────────────────────────
Use the conversation + [Current Financial Context].
If something required is missing, ask for it clearly.
Otherwise, make a decision and move the user forward.`;
}

function ensureModelsPrefix(model: string): string {
  const m = model.trim();
  return m.startsWith("models/") ? m : `models/${m}`;
}

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
};

async function callGeminiOnce(
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  model: string,
  apiKey: string
): Promise<{ text: string; finishReason?: string }> {
  const modelName = ensureModelsPrefix(model);
  const endpoint = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent`;

  const requestBody = {
    contents,
    generationConfig: {
      temperature: 0.4,
      // ✅ increase output so it doesn't cut off
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
    },
  };

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = (errorData as any)?.error?.message || "Unknown error";
    throw new Error(`Gemini API error: ${response.status} - ${errorMsg}`);
  }

  const data = (await response.json()) as { candidates?: GeminiCandidate[] };

  const cand = data?.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p?.text || "").join("")?.trim() || "";
  return { text, finishReason: cand?.finishReason };
}

async function callGemini(
  messages: Message[],
  systemPrompt: string,
  model: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API configuration error: GEMINI_API_KEY not found");
  }

  if (!model || model.trim() === "") {
    // You told me not to change the model.
    // So if the frontend doesn't send it, we must error clearly.
    throw new Error(
      'Model not provided. Pass options.model like "models/gemini-2.5-flash" (from your ListModels output).'
    );
  }

  // Build conversation history and prepend system instruction to first user message
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = messages.map((msg, idx) => {
    let text = msg.content;

    if (idx === 0) {
      text = `${systemPrompt}\n\nUser message: ${msg.content}`;
    }

    return {
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text }],
    };
  });

  // ✅ Auto-continue loop for truncated outputs
  // We append "Continue" as a user message when model stops due to length.
  let full = "";
  let safetyTurns = 0;

  while (safetyTurns < 3) {
    const { text, finishReason } = await callGeminiOnce(contents, model, apiKey);
    if (text) {
      // avoid accidental duplication if model repeats some prefix
      if (full && text.startsWith(full.slice(-80))) {
        full += text.slice(80);
      } else {
        full += (full ? "\n" : "") + text;
      }
    }

    // If the model says it stopped because of token limit, continue
    const fr = (finishReason || "").toLowerCase();

    const likelyTruncated =
      fr.includes("max") ||
      fr.includes("length") ||
      fr.includes("token") ||
      // fallback heuristic: if it ends abruptly
      (text && !/[.!?]$/.test(text) && text.length > 500);

    if (!likelyTruncated) break;

    contents.push({
      role: "user",
      parts: [
        {
          text:
            "Continue from exactly where you left off. Do not repeat earlier text. Finish the remaining sections.",
        },
      ],
    });

    safetyTurns += 1;
  }

  if (!full.trim()) throw new Error("No content in Gemini response");
  return full.trim();
}

function buildContextString(context: ContextData): string {
  const lines: string[] = [];

  if (context.income !== undefined) lines.push(`Monthly Income: ₹${context.income}`);
  if (context.fixedTotal !== undefined) lines.push(`Fixed Expenses + Subscriptions: ₹${context.fixedTotal}`);
  if (context.savingsGoal !== undefined) lines.push(`Monthly Savings Goal: ₹${context.savingsGoal}`);
  if (context.spendableMonth !== undefined) lines.push(`Spendable Budget This Month: ₹${context.spendableMonth}`);
  if (context.spentThisMonth !== undefined) lines.push(`Already Spent This Month: ₹${context.spentThisMonth}`);
  if (context.remainingSpendable !== undefined) lines.push(`Remaining Spendable: ₹${context.remainingSpendable}`);
  if (context.safeSpendToday !== undefined && context.safeSpendToday !== null)
    lines.push(`Safe Spend Today: ₹${context.safeSpendToday}`);
  if (context.spentToday !== undefined) lines.push(`Spent Today: ₹${context.spentToday}`);
  if (context.weekSpent !== undefined) lines.push(`Spent This Week: ₹${context.weekSpent}`);
  if (context.deltaWeek !== undefined)
    lines.push(`Week Budget Status: ${context.deltaWeek <= 0 ? "On track" : `Over by ₹${context.deltaWeek}`}`);

  if (context.daysInMonth !== undefined && context.dayOfMonth !== undefined && context.daysLeft !== undefined) {
    lines.push(`Month Progress: Day ${context.dayOfMonth} of ${context.daysInMonth} (${context.daysLeft} days left)`);
  }

  if (context.projectedMonthSpend !== undefined)
    lines.push(`Projected Month Spend (at current pace): ₹${context.projectedMonthSpend}`);
  if (context.projectedRemaining !== undefined)
    lines.push(
      `Projected ${context.projectedRemaining > 0 ? "Leftover" : "Overshoot"}: ₹${Math.abs(context.projectedRemaining)}`
    );

  if (context.noSpendStreak !== undefined) lines.push(`No-Spend Streak: ${context.noSpendStreak} days`);

  if (context.topCategories && context.topCategories.length > 0) {
    lines.push("\nTop Spending Categories (this month):");
    context.topCategories.forEach(([cat, amount]) => {
      lines.push(`  - ${cat}: ₹${amount}`);
    });
  }

  if (context.budgets && Object.keys(context.budgets).length > 0) {
    lines.push("\nCategory Budgets & Status:");
    for (const [cat, budget] of Object.entries(context.budgets)) {
      if (budget && budget > 0) {
        const spent = context.categoryTotals?.[cat] || 0;
        const status = spent > budget ? `OVER by ₹${spent - budget}` : `${Math.round((spent / budget) * 100)}% used`;
        lines.push(`  - ${cat}: ₹${spent} / ₹${budget} (${status})`);
      }
    }
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!validateRequest(body)) {
      return NextResponse.json({ error: "Invalid request format or size limit exceeded" }, { status: 400 });
    }

    const { messages, context, options = {} } = body;
    const sessionId = options.sessionId || "default";

    // Keep the model EXACTLY as the frontend sends it (no auto-changing)
    const model = options.model;

    // Rate limiting
    const rateLimitCheck = checkRateLimit(sessionId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before sending another message.",
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Optional: minimum interval (you defined MIN_INTERVAL_MS but weren’t using it)
    // This prevents rapid double-submits and reduces weird partial outputs.
    // (Still respects your existing window-based limiter.)
    // Note: We store last request time in the same map by piggybacking on the record.
    const now = Date.now();
    const record = rateLimitMap.get(sessionId);
    if (record && (record as any).lastRequestAt && now - (record as any).lastRequestAt < MIN_INTERVAL_MS) {
      return NextResponse.json(
        { error: `You're sending messages too fast. Please wait ${Math.ceil(MIN_INTERVAL_MS / 1000)}s.` },
        { status: 429 }
      );
    }
    if (record) (record as any).lastRequestAt = now;

    // Build system prompt and context
    const systemPrompt = buildSystemPrompt();
    const contextString = buildContextString(context);

    // Append context to the last user message for better grounding
    const messagesWithContext = [...messages];
    if (messagesWithContext.length > 0 && messagesWithContext[messagesWithContext.length - 1].role === "user") {
      messagesWithContext[messagesWithContext.length - 1].content += `\n\n[Current Financial Context]\n${contextString}`;
    }

    const responseText = await callGemini(messagesWithContext, systemPrompt, model || "");

    return NextResponse.json({ success: true, message: responseText }, { status: 200 });
  } catch (error) {
    console.error("FinanceGPT API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
