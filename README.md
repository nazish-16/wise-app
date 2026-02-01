# Wise

**Micro Financial Advisor**

Wise is a real-time, decision-first personal finance dashboard that helps users answer one question **in the moment**:

> *"Can I spend this money right now?"*

No spreadsheets.
No rigid budgets.
No bank integrations.

Just clarity.

---

## 🎯 What's New (v2.0)

✨ **Full Authentication** with Clerk (Email + Google OAuth)
✨ **Persistent Database** with Firebase Firestore
✨ **Per-User Data Isolation** with security rules
✨ **Beautiful Landing Page** matching dashboard theme
✨ **Guided Onboarding** for new users
✨ **Production-Ready** architecture

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
* **Secure & Private** → Per-user data isolation with Firestore

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

The log is saved to Firestore and all metrics update instantly.

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

Chat history is persisted to Firestore per user.

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

### 🔔 Notifications

* Budget threshold alerts
* Daily overspend warnings
* Weekly summary nudges

Stored per-user in Firestore.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS 4 (Dark UI)
* **Animations**: Framer Motion
* **Charts**: Chart.js
* **Icons**: React Icons
* **Notifications**: react-hot-toast

### Backend & Services
* **Authentication**: Clerk (Email/Password + Google OAuth)
* **Database**: Firebase Firestore
* **AI**: Google Gemini 2.5 Flash
* **Deployment**: Vercel (recommended)

### Security
* **Per-user data isolation** via Firestore security rules
* **Clerk middleware** for route protection
* **Environment variables** for API keys
* **No third-party trackers**

---

## 🔐 Privacy & Security

* ✅ Secure authentication with Clerk
* ✅ Per-user data isolation (Firestore rules)
* ✅ No bank connections
* ✅ No third-party trackers
* ✅ AI receives **sanitized, opt-in context**
* ✅ All data encrypted in transit and at rest

---

## 📦 Getting Started

### Prerequisites
* Node.js 18+ installed
* Firebase project created
* Clerk account created

### Quick Setup

1.  **Clone the repository**
```bash
git clone https://github.com/your-username/wise-app
cd wise-app
npm install
```

2.  **Set up environment variables**

Create `.env.local` with:
```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... (see SETUP_GUIDE.md for full list)

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"
```

3.  **Deploy Firestore security rules**
```bash
firebase deploy --only firestore:rules
```

4.  **Run development server**
```bash
npm run dev
```

5.  **Open http://localhost:3000**

### Detailed Setup

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for complete instructions including:
- Firebase project setup
- Clerk configuration
- Firestore rules deployment
- Environment variables
- Troubleshooting

---

## 📚 Documentation

*   **[QUICK_START.md](./QUICK_START.md)** - Quick reference for immediate next steps
*   **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
*   **[DASHBOARD_MIGRATION.md](./DASHBOARD_MIGRATION.md)** - Migrate dashboard to Firestore
*   **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was implemented
*   **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and data flows

---

## 🗄️ Data Structure

All user data is stored in Firestore:

```
/users/{userId}/
  ├─ profile/main              # User settings (income, expenses, goals)
  ├─ logs/{logId}              # Spend logs
  ├─ budgets/main              # Category budgets
  ├─ goals/{goalId}            # Savings goals
  ├─ recurring/{ruleId}        # Recurring transaction rules
  ├─ notifications/{notifId}   # User notifications
  └─ chat/{messageId}          # FinanceGPT chat history
```

Security rules ensure each user can only access their own data.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Settings → Environment Variables
```

### Other Platforms

Works on any platform supporting Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

---

## 🏆 Perfect For

*   Production personal finance apps
*   Hackathons
*   Students & early professionals
*   Personal finance experiments
*   AI + UX case studies
*   Fintech MVPs without compliance pain

---

## 🧩 Roadmap

### Completed ✅
- [x] Clerk authentication
- [x] Firebase Firestore integration
- [x] Per-user data isolation
- [x] Landing page
- [x] Onboarding wizard
- [x] FinanceGPT chat persistence

### In Progress 🔄
- [ ] Dashboard migration to Firestore
- [ ] Component updates

### Future 🚀
- [ ] Data export/import
- [ ] React Query for caching
- [ ] Optimistic UI updates
- [ ] Offline support
- [ ] Firebase Analytics
- [ ] WhatsApp daily safe spend
- [ ] Family/shared budgets
- [ ] UPI / bank integrations (optional)

---

## 🤝 Contributing

Contributions are welcome! Please:

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Submit a pull request

---

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

---

## 🙏 Acknowledgments

*   **Clerk** for authentication
*   **Firebase** for database
*   **Google Gemini** for AI
*   **Vercel** for hosting
*   **Next.js** for the framework

---

## 📞 Support

For issues or questions:
- Check the documentation in the repo
- Open an issue on GitHub
- Review SETUP_GUIDE.md for troubleshooting

---

**Built with ❤️ for better financial decisions**
