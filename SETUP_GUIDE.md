# Wise App - Setup Guide

## 🚀 Complete Setup Checklist

### 1. Firebase Setup

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `wise-app` (or your preferred name)
4. Disable Google Analytics (optional) or configure it
5. Click "Create project"

#### B. Enable Firestore Database
1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we have security rules ready)
4. Select your preferred location (e.g., `asia-south1` for India)
5. Click "Enable"

#### C. Deploy Firestore Security Rules
1. In your project root, you'll find `firestore.rules`
2. In Firebase Console, go to "Firestore Database" → "Rules"
3. Copy the contents of `firestore.rules` and paste it
4. Click "Publish"

**OR** use Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select your project
# Use firestore.rules as the rules file
firebase deploy --only firestore:rules
```

#### D. Get Firebase Admin SDK Credentials
1. In Firebase Console, go to "Project Settings" (gear icon)
2. Go to "Service Accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract these values from the JSON:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

6. Add to `.env.local`:
```bash
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key must be in quotes and keep the `\n` characters as-is.

---

### 2. Clerk Setup

#### A. Create Clerk Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click "Add application"
3. Name it "Wise App"
4. Choose authentication methods:
   - ✅ Email & Password
   - ✅ Google (OAuth)
5. Click "Create application"

#### B. Configure Redirect URLs
1. In Clerk Dashboard, go to "Paths"
2. Set the following:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/onboarding`
   - **Home URL**: `/`

3. In "Allowed redirect URLs" (for production), add:
   - `http://localhost:3000`
   - Your production domain (e.g., `https://wise-app.vercel.app`)

#### C. Get API Keys
1. In Clerk Dashboard, go to "API Keys"
2. Copy the keys (already in your `.env.local`):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

---

### 3. Environment Variables

Your `.env.local` should have all these variables:

```bash
# Google Gemini API Key
GEMINI_API_KEY=AIzaSyCtTrnEBJsBlTKQOYOvNhFAqqrv2g2DZ4Q

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZW1pbmVudC1sYWItNDYuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_07tnFer91bvlPHSqZ8aWBe011NyEgDoJ8TuXOI5YKH

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAp4lZ5xU7LWxYyFtzQgCignNo8k6wvErM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wise-app-b2398.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wise-app-b2398
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wise-app-b2398.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=179922292843
NEXT_PUBLIC_FIREBASE_APP_ID=1:179922292843:web:ee7dc53259fa380311a12e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-N7KS4FZ096

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=wise-app-b2398
FIREBASE_ADMIN_CLIENT_EMAIL=<YOUR_SERVICE_ACCOUNT_EMAIL>
FIREBASE_ADMIN_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

---

### 4. Local Development

#### A. Install Dependencies
```bash
npm install
```

Dependencies installed:
- `@clerk/nextjs` - Authentication
- `firebase` - Client SDK
- `firebase-admin` - Server SDK

#### B. Run Development Server
```bash
npm run dev
```

#### C. Test the Flow
1. Visit `http://localhost:3000`
2. Click "Get Started" → Sign up with email or Google
3. Complete onboarding wizard
4. Access dashboard at `/dashboard`

---

### 5. Firestore Data Structure

Your data is organized as:

```
/users/{userId}/
  ├─ profile/main              # User settings
  ├─ logs/{logId}              # Spend logs
  ├─ budgets/main              # Category budgets
  ├─ goals/{goalId}            # Savings goals
  ├─ recurring/{ruleId}        # Recurring transactions
  ├─ notifications/{notifId}   # User notifications
  └─ chat/{messageId}          # FinanceGPT chat history
```

---

### 6. Security

✅ **Firestore Security Rules**: Only authenticated users can access their own data
✅ **Clerk Authentication**: Secure email/password + OAuth
✅ **Environment Variables**: Never commit `.env.local` to git
✅ **HTTPS**: Always use HTTPS in production

---

### 7. Deployment (Vercel)

#### A. Connect to Vercel
```bash
npm install -g vercel
vercel login
vercel
```

#### B. Add Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy

#### C. Update Clerk Redirect URLs
1. In Clerk Dashboard, add your Vercel domain to allowed redirect URLs
2. Update `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and similar if needed

---

### 8. Testing Checklist

- [ ] Sign up with email works
- [ ] Sign up with Google works
- [ ] Onboarding saves to Firestore
- [ ] Dashboard loads user profile
- [ ] Add expense saves to Firestore
- [ ] Delete expense works
- [ ] Budgets save and load
- [ ] FinanceGPT chat persists
- [ ] Sign out works
- [ ] Sign in redirects to dashboard

---

### 9. Troubleshooting

#### "Firebase Admin not initialized"
- Make sure `FIREBASE_ADMIN_PRIVATE_KEY` is in quotes
- Keep `\n` characters in the private key

#### "Clerk middleware not working"
- Check that `middleware.ts` is in the root directory
- Restart dev server after adding middleware

#### "Firestore permission denied"
- Deploy security rules
- Check that user is authenticated
- Verify userId matches Clerk user ID

#### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next`, then reinstall

---

### 10. Next Steps

1. **Migrate localStorage data**: Create a migration script for existing users
2. **Add data export**: Let users download their data
3. **Add data import**: Let users restore from backup
4. **Implement caching**: Use React Query or SWR for better performance
5. **Add analytics**: Track user behavior with Firebase Analytics
6. **Add notifications**: Use Firebase Cloud Messaging

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Firestore rules in Firebase Console
3. Verify all environment variables are set
4. Check Clerk Dashboard for authentication issues

---

## 🎉 You're All Set!

Your Wise app now has:
- ✅ Clerk authentication
- ✅ Firestore database
- ✅ Per-user data isolation
- ✅ Onboarding flow
- ✅ Landing page
- ✅ Secure architecture

Happy coding! 🚀
