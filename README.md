# Wise

**Not budgeting. Just better daily money decisions.**

Wise is a real-time, decision-first personal finance dashboard that helps users answer one question **in the moment**:

> *“Can I spend this money right now?”*

No spreadsheets.
No rigid budgets.
No bank integrations.

Just clarity.

---

## 🧠 Why Wise Exists

Most finance apps fail because they:

* Require constant discipline
* Expect users to track everything
* Focus on analysis instead of action

Wise flips the model.

Instead of asking users to **plan harder**, it helps them **decide smarter**—right before spending.

---

## ✨ Core Principles

* **Decision-first UX** → Help at the moment of spending
* **Real-time math** → Everything updates instantly
* **Emotion-aware finance** → Reduce anxiety, not just numbers
* **Zero integrations** → No bank APIs, no legal complexity
* **Local-first** → Your data stays in your browser

---

## 🚀 Key Features

### 🔢 Today’s Safe Spend

Instantly shows how much you can safely spend **today**, calculated from:

```
(income − fixed costs − savings goal − spent so far) ÷ days left
```

No categories. No charts. Just a number you can trust.

---

### ⚡ Real-Time Spend Check

Log a spend like:

> “₹299 on Swiggy”

Get an immediate verdict:

* ✅ Safe — you’re on track
* ⚠️ Risky — tomorrow’s allowance shrinks
* ❌ Not advised — goal impact detected

The log is saved and all metrics update instantly.

---

### 📊 Live Financial Health

* Monthly spendable vs used
* Week-over-week comparison
* Safe spend for rest of week
* No-spend streaks
* Projected month-end outcome

All computed **from real data**, not estimates.

---

### 🧠 FinanceGPT (Powered by Gemini)

An AI assistant connected directly to your financial reality.

It understands:

* Your income, expenses, goals
* Your spending patterns
* Budget overruns and projections

Ask things like:

* “Can I afford a ₹5k phone this month?”
* “Why am I overspending on food?”
* “How do I fix my projected overshoot?”

No fake advice. No hallucinated numbers.

---

### 🎯 Goals & Budgets

* Create savings goals with projections
* Set category budgets (optional)
* See progress, risk, and overshoots in real time

---

### 🔁 Recurring Expenses (Smart)

Define recurring rules (rent, subscriptions, EMIs).
One click generates real transactions when due.

---

### 📈 Reports & Insights

* 7-day trend
* Monthly breakdowns
* Category analysis
* Overspend detection
* Spending spike alerts

Everything is derived from actual logs.

---

### 🔔 Notifications (Local)

* Budget threshold alerts
* Daily overspend warnings
* Weekly summary nudges

No push services. No tracking.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS (ChatGPT-style dark UI)
* **Animations**: Framer Motion
* **Charts**: Chart.js
* **AI**: Google Gemini API
* **State/Data**: localStorage (local-first)
* **Notifications**: react-hot-toast
* **Deployment**: Vercel

---

## 🔐 Privacy by Design

* No bank connections
* No third-party trackers
* No backend database (for now)
* AI only receives **sanitized, opt-in context**
* All data lives in your browser

---

## 📦 Getting Started

```bash
git clone https://github.com/your-username/Wise
cd Wise
npm install
```

Create a `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Run locally:

```bash
npm run dev
```

---

## 🧪 Data Storage Keys

All data is stored locally using these keys:

* `wise_user_data`
* `wise_spend_logs`
* `wise_category_budgets`
* `wise_recurring_rules`
* `wise_goals`
* `wise_financegpt_chat`

---

## 🏆 Perfect For

* Hackathons
* Students & early professionals
* Personal finance experiments
* AI + UX case studies
* Fintech MVPs without compliance pain

---

## 🧩 Roadmap (Optional)

* WhatsApp daily safe spend
* Family/shared budgets
* Cloud sync (opt-in)
* UPI / bank integrations
* Public read-only financial summaries

---

## 💬 Philosophy

> *We’re not teaching finance.*
> *We’re reducing money anxiety.*

If Wise helps someone pause before a bad spend,
it’s already doing its job.
