# 🚀 Quick Start Guide

## Immediate Next Steps

### 1. Complete Firebase Admin Setup (5 minutes)
```bash
# Go to: https://console.firebase.google.com/
# Select your project: wise-app-b2398
# Go to: Project Settings → Service Accounts
# Click: "Generate new private key"
# Download the JSON file
```

Then add to `.env.local`:
```bash
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@wise-app-b2398.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important**: Keep the quotes and `\n` characters!

### 2. Deploy Firestore Security Rules (2 minutes)
```bash
# Option 1: Firebase Console
# Go to: https://console.firebase.google.com/
# Firestore Database → Rules → Copy from firestore.rules → Publish

# Option 2: CLI
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 3. Test the App (10 minutes)
```bash
# Server should already be running at http://localhost:3000
# If not:
npm run dev
```

**Test Flow**:
1. ✅ Visit http://localhost:3000 (landing page)
2. ✅ Click "Get Started" → Sign up
3. ✅ Complete onboarding
4. ✅ Check dashboard loads (currently uses localStorage)

---

## Current Status

### ✅ Working
- Landing page
- Sign up / Sign in
- Onboarding wizard (saves to Firestore!)
- Firebase + Clerk integration
- Security rules

### ⏳ Needs Migration
- Dashboard (still uses localStorage)
- See `DASHBOARD_MIGRATION.md` for instructions

---

## File Structure

```
wise-app/
├── app/
│   ├── page.tsx                    # ✅ Landing page
│   ├── dashboard/page.tsx          # ⏳ Needs migration
│   ├── onboarding/page.tsx         # ✅ Uses Firestore
│   ├── sign-in/[[...sign-in]]/     # ✅ Clerk auth
│   └── sign-up/[[...sign-up]]/     # ✅ Clerk auth
├── lib/
│   ├── firebase/
│   │   ├── client.ts               # ✅ Firebase client
│   │   ├── admin.ts                # ⚠️ Needs credentials
│   │   ├── firestore.ts            # ✅ CRUD operations
│   │   └── types.ts                # ✅ TypeScript types
│   └── hooks/
│       └── useFirestore.ts         # ✅ React hooks
├── middleware.ts                   # ✅ Route protection
├── firestore.rules                 # ⚠️ Needs deployment
├── .env.local                      # ⚠️ Add admin credentials
├── SETUP_GUIDE.md                  # 📖 Full setup guide
├── DASHBOARD_MIGRATION.md          # 📖 Migration guide
└── IMPLEMENTATION_SUMMARY.md       # 📖 What was done
```

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check for TypeScript errors
npx tsc --noEmit

# Build for production
npm run build
```

---

## Environment Variables Checklist

```bash
# ✅ Already set
GEMINI_API_KEY=✅
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=✅
CLERK_SECRET_KEY=✅
NEXT_PUBLIC_FIREBASE_API_KEY=✅
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=✅
NEXT_PUBLIC_FIREBASE_PROJECT_ID=✅
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=✅
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=✅
NEXT_PUBLIC_FIREBASE_APP_ID=✅
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=✅
FIREBASE_ADMIN_PROJECT_ID=✅

# ⚠️ Need to add
FIREBASE_ADMIN_CLIENT_EMAIL=❌
FIREBASE_ADMIN_PRIVATE_KEY=❌
```

---

## Dashboard Migration (Priority)

**File**: `app/dashboard/page.tsx`

**Quick Steps**:
1. Add imports:
   ```typescript
   import { useUser } from "@clerk/nextjs";
   import { useUserProfile, useSpendLogs, useCategoryBudgets } from "@/lib/hooks/useFirestore";
   ```

2. Replace state:
   ```typescript
   const { user } = useUser();
   const { profile } = useUserProfile();
   const { logs, addLog, removeLog } = useSpendLogs();
   const { budgets, updateBudgets } = useCategoryBudgets();
   ```

3. Update functions to use hooks (see DASHBOARD_MIGRATION.md)

4. Remove all `localStorage` calls

5. Add loading states

6. Test!

---

## Troubleshooting

### "Permission denied" in Firestore
→ Deploy security rules (see step 2 above)

### "Firebase Admin not initialized"
→ Add admin credentials to .env.local (see step 1 above)

### "Module not found"
→ Run `npm install` again

### Dashboard not loading
→ Check browser console for errors
→ Verify user is authenticated
→ Check Firestore rules

---

## Resources

- **Full Setup**: `SETUP_GUIDE.md`
- **Migration Guide**: `DASHBOARD_MIGRATION.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Clerk Dashboard**: https://dashboard.clerk.com/
- **Firebase Console**: https://console.firebase.google.com/

---

## What's Next?

1. ⚠️ Add Firebase Admin credentials (5 min)
2. ⚠️ Deploy Firestore rules (2 min)
3. ⏳ Migrate dashboard (2-3 hours)
4. ✅ Test everything (1 hour)
5. 🚀 Deploy to production!

---

## Need Help?

Check the detailed guides:
- `SETUP_GUIDE.md` - Complete setup instructions
- `DASHBOARD_MIGRATION.md` - Step-by-step migration
- `IMPLEMENTATION_SUMMARY.md` - What was implemented

---

**You're 90% there! Just complete the Firebase Admin setup and deploy the rules, then you can start using the app!** 🎉
