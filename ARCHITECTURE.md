# Wise App - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │   Landing    │    │   Sign Up    │    │  Onboarding  │         │
│  │   Page (/)   │───▶│   /sign-up   │───▶│ /onboarding  │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│         │                                         │                 │
│         │                                         ▼                 │
│         │                              ┌──────────────────┐        │
│         └─────────────────────────────▶│    Dashboard     │        │
│                                         │   /dashboard     │        │
│                                         └──────────────────┘        │
│                                                  │                  │
│                          ┌───────────────────────┼─────────┐       │
│                          │                       │         │       │
│                          ▼                       ▼         ▼       │
│                  ┌──────────────┐      ┌──────────────┐  │        │
│                  │ Transactions │      │   Reports    │  │        │
│                  │     View     │      │     View     │  │        │
│                  └──────────────┘      └──────────────┘  │        │
│                                                           │        │
│                  ┌──────────────┐      ┌──────────────┐  │        │
│                  │    Goals     │      │   Insights   │  │        │
│                  │     View     │      │     View     │  │        │
│                  └──────────────┘      └──────────────┘  │        │
│                                                           │        │
│                  ┌──────────────┐      ┌──────────────┐  │        │
│                  │  Recurring   │      │FinanceGPT    │  │        │
│                  │     View     │      │     Chat     │◀─┘        │
│                  └──────────────┘      └──────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Clerk Auth      │  │  Firebase    │  │  Gemini AI   │
        │  (Authentication)│  │  Firestore   │  │  (FinanceGPT)│
        └──────────────────┘  └──────────────┘  └──────────────┘
                │                     │                 │
                │                     │                 │
        ┌───────┴─────────┐  ┌────────┴────────┐      │
        │                 │  │                 │      │
        ▼                 ▼  ▼                 ▼      ▼
    ┌────────┐      ┌────────────────────────────────────┐
    │ Email  │      │     Firestore Collections          │
    │ OAuth  │      │                                    │
    │ Google │      │  /users/{userId}/                  │
    └────────┘      │    ├─ profile/main                 │
                    │    ├─ logs/{logId}                 │
                    │    ├─ budgets/main                 │
                    │    ├─ goals/{goalId}               │
                    │    ├─ recurring/{ruleId}           │
                    │    ├─ notifications/{notifId}      │
                    │    └─ chat/{messageId}             │
                    │                                    │
                    │  Security Rules:                   │
                    │  ✓ Per-user isolation              │
                    │  ✓ Auth required                   │
                    └────────────────────────────────────┘
```

---

## Data Flow

### 1. User Sign-Up Flow
```
User → Landing Page
  ↓
Click "Get Started"
  ↓
Sign Up Page (Clerk)
  ↓
Create Account (Email/Google)
  ↓
Clerk creates user
  ↓
Redirect to /onboarding
  ↓
User fills form
  ↓
Save to Firestore: /users/{userId}/profile/main
  ↓
Redirect to /dashboard
```

### 2. Dashboard Data Loading Flow
```
User → Dashboard
  ↓
useUser() → Get Clerk user
  ↓
useUserProfile() → Fetch from Firestore
  ↓
useSpendLogs() → Fetch logs
  ↓
useCategoryBudgets() → Fetch budgets
  ↓
Render dashboard with data
```

### 3. Add Expense Flow
```
User → Enter expense details
  ↓
Click "Add"
  ↓
addLog() hook
  ↓
createSpendLog() → Firestore
  ↓
POST /users/{userId}/logs
  ↓
Update local state
  ↓
Re-render dashboard
```

### 4. FinanceGPT Chat Flow
```
User → Type message
  ↓
Send message
  ↓
Save to Firestore: /users/{userId}/chat
  ↓
Build context (logs, budgets, profile)
  ↓
POST /api/financegpt
  ↓
Call Gemini API
  ↓
Get AI response
  ↓
Save assistant message to Firestore
  ↓
Display in chat
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Clerk Middleware                              │
│  ┌────────────────────────────────────────────┐        │
│  │ • Protects all routes except public pages  │        │
│  │ • Validates JWT tokens                     │        │
│  │ • Redirects unauthenticated users          │        │
│  └────────────────────────────────────────────┘        │
│                       ↓                                  │
│  Layer 2: Firestore Security Rules                      │
│  ┌────────────────────────────────────────────┐        │
│  │ • Per-user data isolation                  │        │
│  │ • Only authenticated users can access      │        │
│  │ • userId must match auth.uid               │        │
│  └────────────────────────────────────────────┘        │
│                       ↓                                  │
│  Layer 3: Application Logic                             │
│  ┌────────────────────────────────────────────┐        │
│  │ • Validate user input                      │        │
│  │ • Sanitize data                            │        │
│  │ • Error handling                           │        │
│  └────────────────────────────────────────────┘        │
│                       ↓                                  │
│  Layer 4: Environment Variables                         │
│  ┌────────────────────────────────────────────┐        │
│  │ • API keys in .env.local                   │        │
│  │ • Never committed to git                   │        │
│  │ • Server-side only for secrets             │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
RootLayout (ClerkProvider)
  │
  ├─ Landing Page (/)
  │   ├─ Header
  │   ├─ Hero Section
  │   ├─ Features Section
  │   ├─ How It Works Section
  │   ├─ Security Section
  │   ├─ FAQ Section
  │   └─ Footer
  │
  ├─ Sign In (/sign-in)
  │   └─ Clerk SignIn Component
  │
  ├─ Sign Up (/sign-up)
  │   └─ Clerk SignUp Component
  │
  ├─ Onboarding (/onboarding)
  │   ├─ Step 1: Income & Expenses
  │   ├─ Step 2: Savings & Goals
  │   ├─ Step 3: Spending Habits
  │   └─ Step 4: Review & Complete
  │
  └─ Dashboard (/dashboard) [Protected]
      ├─ Header
      │   ├─ Logo
      │   ├─ Navigation
      │   └─ UserButton (Clerk)
      │
      ├─ Sidebar
      │   └─ View Selector
      │
      └─ Main Content
          ├─ Dashboard View
          │   ├─ Safe Spend Today Card
          │   ├─ Stats Cards
          │   ├─ Charts
          │   └─ Recent Transactions
          │
          ├─ Transactions View
          │   ├─ Add Transaction Form
          │   ├─ Filters
          │   └─ Transaction List
          │
          ├─ Reports View
          │   ├─ Category Breakdown
          │   ├─ Trends
          │   └─ Insights
          │
          ├─ Goals View
          │   ├─ Add Goal Form
          │   └─ Goals List
          │
          ├─ Insights View
          │   ├─ Spending Patterns
          │   ├─ Predictions
          │   └─ Recommendations
          │
          ├─ Recurring View
          │   ├─ Add Rule Form
          │   └─ Rules List
          │
          ├─ Notifications View
          │   └─ Notifications List
          │
          └─ FinanceGPT View
              ├─ Chat Messages
              ├─ Context Toggles
              └─ Input Form
```

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
├─────────────────────────────────────────────────────────┤
│ • Next.js 16 (App Router)                               │
│ • React 19                                               │
│ • TypeScript                                             │
│ • Tailwind CSS 4                                         │
│ • Framer Motion (Animations)                            │
│ • Chart.js (Data Visualization)                         │
│ • React Hot Toast (Notifications)                       │
│ • React Icons                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Authentication                        │
├─────────────────────────────────────────────────────────┤
│ • Clerk (@clerk/nextjs)                                 │
│   - Email/Password                                       │
│   - Google OAuth                                         │
│   - Session management                                   │
│   - User management                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      Database                            │
├─────────────────────────────────────────────────────────┤
│ • Firebase Firestore                                     │
│   - NoSQL document database                             │
│   - Real-time sync                                       │
│   - Security rules                                       │
│   - Scalable                                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                        AI/ML                             │
├─────────────────────────────────────────────────────────┤
│ • Google Gemini 2.5 Flash                               │
│   - Financial advice                                     │
│   - Context-aware responses                             │
│   - Spending insights                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     Deployment                           │
├─────────────────────────────────────────────────────────┤
│ • Vercel (Recommended)                                   │
│   - Automatic HTTPS                                      │
│   - Edge functions                                       │
│   - Environment variables                               │
│   - CI/CD                                                │
└─────────────────────────────────────────────────────────┘
```

---

## API Routes

```
/api/financegpt
  ├─ POST
  │   ├─ Body: { messages, context, options }
  │   ├─ Calls: Google Gemini API
  │   └─ Returns: { message: string }
  │
  └─ Authentication: Required (Clerk)
```

---

## Environment Variables

```
┌─────────────────────────────────────────────────────────┐
│                  Public Variables                        │
│              (Accessible in browser)                     │
├─────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY                       │
│ NEXT_PUBLIC_CLERK_SIGN_IN_URL                           │
│ NEXT_PUBLIC_CLERK_SIGN_UP_URL                           │
│ NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL                     │
│ NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL                     │
│ NEXT_PUBLIC_FIREBASE_API_KEY                            │
│ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN                        │
│ NEXT_PUBLIC_FIREBASE_PROJECT_ID                         │
│ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET                     │
│ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID                │
│ NEXT_PUBLIC_FIREBASE_APP_ID                             │
│ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Private Variables                       │
│              (Server-side only)                          │
├─────────────────────────────────────────────────────────┤
│ CLERK_SECRET_KEY                                         │
│ GEMINI_API_KEY                                           │
│ FIREBASE_ADMIN_PROJECT_ID                               │
│ FIREBASE_ADMIN_CLIENT_EMAIL                             │
│ FIREBASE_ADMIN_PRIVATE_KEY                              │
└─────────────────────────────────────────────────────────┘
```

---

## File Organization

```
wise-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── financegpt/
│   │       └── route.ts          # FinanceGPT endpoint
│   ├── components/               # React components
│   │   ├── FinanceGPT.tsx
│   │   ├── GoalsView.tsx
│   │   ├── InsightsView.tsx
│   │   ├── NotificationsView.tsx
│   │   ├── RecurringView.tsx
│   │   ├── ReportsView.tsx
│   │   └── TransactionsView.tsx
│   ├── dashboard/                # Dashboard page
│   │   └── page.tsx
│   ├── lib/                      # Shared utilities
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── onboarding/               # Onboarding page
│   │   └── page.tsx
│   ├── sign-in/                  # Clerk sign-in
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/                  # Clerk sign-up
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   ├── utils/                    # Utility functions
│   │   ├── dateHelpers.ts
│   │   └── storage.ts
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── types.ts                  # Type definitions
│
├── lib/                          # Library code
│   ├── firebase/                 # Firebase integration
│   │   ├── admin.ts              # Admin SDK
│   │   ├── client.ts             # Client SDK
│   │   ├── firestore.ts          # CRUD operations
│   │   └── types.ts              # Firestore types
│   └── hooks/                    # Custom React hooks
│       └── useFirestore.ts       # Firestore hooks
│
├── public/                       # Static assets
│   └── assets/
│       ├── logo.png
│       └── white-logo.png
│
├── .env.local                    # Environment variables
├── .gitignore                    # Git ignore rules
├── firestore.rules               # Firestore security rules
├── middleware.ts                 # Clerk middleware
├── next.config.ts                # Next.js config
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
│
└── Documentation/
    ├── QUICK_START.md            # Quick reference
    ├── SETUP_GUIDE.md            # Complete setup
    ├── DASHBOARD_MIGRATION.md    # Migration guide
    ├── IMPLEMENTATION_SUMMARY.md # What was done
    └── ARCHITECTURE.md           # This file
```

---

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Next.js automatic code splitting
2. **Image Optimization**: Next.js Image component
3. **Lazy Loading**: Components loaded on demand
4. **Caching**: Firestore client-side caching
5. **Memoization**: React.useMemo for expensive calculations
6. **Debouncing**: Input debouncing for search/filters

### Firestore Best Practices
- Use compound queries sparingly
- Limit query results (pagination)
- Use subcollections for better organization
- Index frequently queried fields
- Batch writes when possible

---

## Scalability

### Current Limits
- **Firestore**: 1M reads/day (free tier)
- **Clerk**: 10K MAU (free tier)
- **Gemini**: Rate limits apply

### Scaling Strategy
1. Implement pagination for logs
2. Add caching layer (Redis/Vercel KV)
3. Use Firestore indexes
4. Implement data archiving
5. Monitor usage in Firebase Console

---

## Monitoring & Analytics

### Recommended Tools
- **Firebase Analytics**: User behavior
- **Vercel Analytics**: Performance metrics
- **Sentry**: Error tracking
- **LogRocket**: Session replay

### Key Metrics to Track
- User sign-ups
- Onboarding completion rate
- Daily active users
- Average session duration
- FinanceGPT usage
- Error rates

---

This architecture is designed for:
✅ Security (per-user isolation)
✅ Scalability (Firestore + Vercel)
✅ Performance (Next.js optimizations)
✅ Maintainability (TypeScript + modular code)
✅ User Experience (Fast, responsive, intuitive)
