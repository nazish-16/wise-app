# ✅ Wise App - Setup Checklist

## 🎯 Critical Tasks (Do These First!)

### 1. Firebase Admin Credentials
- [ ] Go to Firebase Console (https://console.firebase.google.com/)
- [ ] Select project: wise-app-b2398
- [ ] Go to Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Download JSON file
- [ ] Copy `client_email` to `.env.local` as `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] Copy `private_key` to `.env.local` as `FIREBASE_ADMIN_PRIVATE_KEY`
- [ ] Verify private key has quotes and `\n` characters

### 2. Deploy Firestore Security Rules
- [ ] Option A: Use Firebase Console
  - [ ] Go to Firestore Database → Rules
  - [ ] Copy from `firestore.rules` file
  - [ ] Paste and publish
- [ ] Option B: Use Firebase CLI
  - [ ] Run `npm install -g firebase-tools`
  - [ ] Run `firebase login`
  - [ ] Run `firebase init firestore`
  - [ ] Run `firebase deploy --only firestore:rules`

### 3. Test Basic Flow
- [ ] Visit http://localhost:3000
- [ ] Click "Get Started"
- [ ] Sign up with email or Google
- [ ] Complete onboarding (4 steps)
- [ ] Verify data saves to Firestore (check Firebase Console)
- [ ] Check dashboard loads

---

## 📋 Dashboard Migration (High Priority)

### File: `app/dashboard/page.tsx`

- [ ] Add imports
  - [ ] `import { useUser } from "@clerk/nextjs"`
  - [ ] `import { useUserProfile, useSpendLogs, useCategoryBudgets } from "@/lib/hooks/useFirestore"`
  
- [ ] Replace state management
  - [ ] Replace `useState` for userData with `useUserProfile()`
  - [ ] Replace `useState` for logs with `useSpendLogs()`
  - [ ] Replace `useState` for budgets with `useCategoryBudgets()`
  
- [ ] Add authentication checks
  - [ ] Add `const { user, isLoaded } = useUser()`
  - [ ] Add loading state check
  - [ ] Add redirect if not authenticated
  - [ ] Add redirect if onboarding not complete
  
- [ ] Update CRUD operations
  - [ ] Update `addNewLog` to use `addLog` hook
  - [ ] Update `deleteLog` to use `removeLog` hook
  - [ ] Update `clearAllLogs` to use `clearAllLogs` hook
  - [ ] Update `saveBudgets` to use `updateBudgets` hook
  - [ ] Update Settings save to use `updateProfile` hook
  
- [ ] Update FinanceGPT
  - [ ] Use `useChatMessages()` hook
  - [ ] Update `sendMessage` to save to Firestore
  - [ ] Update `resetChat` to use `clearMessages` hook
  
- [ ] Remove localStorage
  - [ ] Remove all `localStorage.getItem(USER_KEY)`
  - [ ] Remove all `localStorage.setItem(USER_KEY, ...)`
  - [ ] Remove all `localStorage.getItem(LOG_KEY)`
  - [ ] Remove all `localStorage.setItem(LOG_KEY, ...)`
  - [ ] Remove all `localStorage.getItem(BUDGETS_KEY)`
  - [ ] Remove all `localStorage.setItem(BUDGETS_KEY, ...)`
  - [ ] Remove all `localStorage.getItem(FINANCEGPT_CHAT_KEY)`
  - [ ] Remove all `localStorage.setItem(FINANCEGPT_CHAT_KEY, ...)`
  
- [ ] Add UI improvements
  - [ ] Add UserButton from Clerk for sign-out
  - [ ] Add loading skeletons
  - [ ] Add error toasts
  - [ ] Add success toasts
  
- [ ] Test everything
  - [ ] Add expense
  - [ ] Delete expense
  - [ ] Clear all logs
  - [ ] Update settings
  - [ ] Save budgets
  - [ ] Chat with FinanceGPT
  - [ ] Sign out and sign in
  - [ ] Verify data persists

---

## 🔧 Component Updates (Medium Priority)

### TransactionsView.tsx
- [ ] Add Firestore imports
- [ ] Use `useSpendLogs()` hook
- [ ] Update add/delete operations
- [ ] Add loading states
- [ ] Add error handling

### ReportsView.tsx
- [ ] Use `useSpendLogs()` hook
- [ ] Update data fetching
- [ ] Add loading states

### GoalsView.tsx
- [ ] Use `useSavingsGoals()` hook
- [ ] Update CRUD operations
- [ ] Add loading states
- [ ] Add error handling

### InsightsView.tsx
- [ ] Use `useSpendLogs()` hook
- [ ] Update data analysis
- [ ] Add loading states

### NotificationsView.tsx
- [ ] Use `useNotifications()` hook
- [ ] Update CRUD operations
- [ ] Add loading states

### RecurringView.tsx
- [ ] Use `useRecurringRules()` hook
- [ ] Update CRUD operations
- [ ] Add loading states
- [ ] Add error handling

### FinanceGPT.tsx
- [ ] Use `useChatMessages()` hook
- [ ] Update message persistence
- [ ] Add loading states
- [ ] Add error handling

---

## 🚀 Deployment (When Ready)

### Vercel Deployment
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Run `vercel` in project directory
- [ ] Link to Vercel account
- [ ] Add environment variables in Vercel Dashboard
  - [ ] All `NEXT_PUBLIC_*` variables
  - [ ] All `CLERK_*` variables
  - [ ] All `FIREBASE_*` variables
  - [ ] `GEMINI_API_KEY`
- [ ] Update Clerk redirect URLs with production domain
- [ ] Test production deployment

### Post-Deployment
- [ ] Test sign-up flow in production
- [ ] Test sign-in flow in production
- [ ] Test onboarding in production
- [ ] Test dashboard in production
- [ ] Monitor Firestore usage in Firebase Console
- [ ] Monitor errors in Vercel logs

---

## 📊 Testing Checklist

### Authentication
- [ ] Sign up with email works
- [ ] Sign up with Google works
- [ ] Sign in with email works
- [ ] Sign in with Google works
- [ ] Sign out works
- [ ] Protected routes redirect to sign-in
- [ ] Public routes accessible without auth

### Onboarding
- [ ] All 4 steps work
- [ ] Form validation works
- [ ] Data saves to Firestore
- [ ] Redirects to dashboard after completion
- [ ] Can't access dashboard without completing onboarding

### Dashboard
- [ ] Loads user profile from Firestore
- [ ] Loads spend logs from Firestore
- [ ] Loads budgets from Firestore
- [ ] Safe spend today calculates correctly
- [ ] Charts render correctly
- [ ] Stats update in real-time

### Spend Logs
- [ ] Add expense saves to Firestore
- [ ] Add income saves to Firestore
- [ ] Delete log removes from Firestore
- [ ] Clear all logs works
- [ ] Logs persist after sign-out/sign-in
- [ ] Filter by category works
- [ ] Search by note works

### Budgets
- [ ] Set budgets saves to Firestore
- [ ] Budget progress displays correctly
- [ ] Budget alerts work
- [ ] Budgets persist after sign-out/sign-in

### Settings
- [ ] Update income saves to Firestore
- [ ] Update fixed expenses saves
- [ ] Update savings goal saves
- [ ] Update subscriptions saves
- [ ] Settings persist after sign-out/sign-in

### FinanceGPT
- [ ] Send message saves to Firestore
- [ ] Receive AI response
- [ ] Chat history persists
- [ ] Clear chat works
- [ ] Export chat works
- [ ] Context toggles work

### Security
- [ ] Can't access other users' data
- [ ] Firestore rules enforce per-user isolation
- [ ] Unauthenticated users can't read/write
- [ ] API routes require authentication

---

## 📈 Performance Checklist

- [ ] Page load time < 3 seconds
- [ ] Firestore reads optimized (pagination if needed)
- [ ] Images optimized (Next.js Image component)
- [ ] No unnecessary re-renders
- [ ] Proper use of React.memo and useMemo
- [ ] Debounced search/filter inputs

---

## 🔐 Security Checklist

- [ ] Firestore security rules deployed
- [ ] All API routes protected
- [ ] Environment variables not exposed
- [ ] No sensitive data in client code
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Clerk middleware configured correctly

---

## 📱 Responsive Design Checklist

- [ ] Landing page responsive
- [ ] Sign-in/sign-up responsive
- [ ] Onboarding responsive
- [ ] Dashboard responsive on mobile
- [ ] Dashboard responsive on tablet
- [ ] Dashboard responsive on desktop
- [ ] Charts responsive
- [ ] Tables responsive

---

## 🎨 UX Checklist

- [ ] Loading states for all async operations
- [ ] Error messages user-friendly
- [ ] Success feedback for actions
- [ ] Empty states informative
- [ ] Smooth animations
- [ ] Consistent theme
- [ ] Accessible (keyboard navigation)
- [ ] Clear CTAs

---

## 📝 Documentation Checklist

- [ ] README.md updated
- [ ] SETUP_GUIDE.md complete
- [ ] DASHBOARD_MIGRATION.md clear
- [ ] ARCHITECTURE.md accurate
- [ ] Code comments added where needed
- [ ] Environment variables documented

---

## 🎯 Progress Tracking

### Overall Completion: ____%

**Completed:**
- ✅ Authentication setup
- ✅ Database setup
- ✅ Landing page
- ✅ Onboarding
- ✅ Custom hooks
- ✅ Documentation

**In Progress:**
- ⏳ Dashboard migration
- ⏳ Component updates

**Not Started:**
- ❌ Deployment
- ❌ Production testing

---

## 🎊 Launch Checklist

When everything above is complete:

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance optimized
- [ ] Security verified
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] Production tested
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] 🚀 **LAUNCH!**

---

**Use this checklist to track your progress. Check off items as you complete them!**
