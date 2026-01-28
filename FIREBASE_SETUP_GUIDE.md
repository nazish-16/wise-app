# 🔥 Firebase Setup - Step by Step

## Part 1: Get Firebase Admin Credentials

### Step 1: Go to Firebase Console
1. Open your browser
2. Go to: **https://console.firebase.google.com/**
3. You should see your project: **wise-app-b2398**
4. Click on it to open

### Step 2: Navigate to Service Accounts
1. Click the **⚙️ gear icon** (Settings) in the top left
2. Click **"Project settings"**
3. Click the **"Service accounts"** tab at the top

### Step 3: Generate Private Key
1. You'll see a section that says "Firebase Admin SDK"
2. Click the button **"Generate new private key"**
3. A popup will appear warning you to keep it secure
4. Click **"Generate key"**
5. A JSON file will download to your computer (e.g., `wise-app-b2398-firebase-adminsdk-xxxxx.json`)

### Step 4: Open the Downloaded JSON File
1. Find the downloaded file (usually in your Downloads folder)
2. Open it with Notepad or any text editor
3. You'll see something like this:

```json
{
  "type": "service_account",
  "project_id": "wise-app-b2398",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@wise-app-b2398.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Step 5: Copy the Values
You need TWO values from this file:

1. **client_email** - Copy the entire email address
2. **private_key** - Copy the ENTIRE private key INCLUDING the quotes and \n characters

### Step 6: Add to .env.local
1. Open your project in VS Code
2. Open the file `.env.local` (in the root folder)
3. Find these two lines at the bottom:
   ```
   FIREBASE_ADMIN_CLIENT_EMAIL=
   FIREBASE_ADMIN_PRIVATE_KEY=
   ```
4. Add the values like this:

```bash
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@wise-app-b2398.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT NOTES:**
- Keep the QUOTES around the private key
- Keep the `\n` characters (they should look like backslash-n, not actual newlines)
- The private key should be ONE LONG LINE with `\n` in it

### Step 7: Save the File
1. Save `.env.local`
2. **Restart your dev server** (stop with Ctrl+C and run `npm run dev` again)

---

## Part 2: Deploy Firestore Security Rules

You have TWO options:

### Option A: Using Firebase Console (Easier)

1. Go to **https://console.firebase.google.com/**
2. Select your project: **wise-app-b2398**
3. In the left sidebar, click **"Firestore Database"**
4. Click the **"Rules"** tab at the top
5. You'll see a code editor
6. **Delete everything** in that editor
7. Open the file `firestore.rules` in your project (in VS Code)
8. **Copy ALL the content** from `firestore.rules`
9. **Paste it** into the Firebase Console editor
10. Click the **"Publish"** button
11. Wait for confirmation that rules are published

### Option B: Using Firebase CLI (Advanced)

1. Open a NEW terminal (keep dev server running in the other one)
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Login to Firebase:
   ```bash
   firebase login
   ```
   - This will open a browser
   - Sign in with your Google account
4. Initialize Firestore:
   ```bash
   firebase init firestore
   ```
   - Select your project: **wise-app-b2398**
   - When asked for rules file, press Enter (use default: firestore.rules)
   - When asked for indexes file, press Enter
5. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Wait for success message

---

## ✅ Verification

After completing both parts:

1. Your `.env.local` should have these two lines filled:
   ```
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@wise-app-b2398.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. Your Firestore rules should be deployed (check in Firebase Console → Firestore Database → Rules)

3. Restart your dev server:
   ```bash
   # Stop current server with Ctrl+C
   npm run dev
   ```

4. Test the app:
   - Go to http://localhost:3000
   - Click "Get Started"
   - Sign up with email or Google
   - Complete onboarding
   - Check Firebase Console → Firestore Database → Data
   - You should see your user data there!

---

## 🆘 Troubleshooting

### "Firebase Admin not initialized"
- Make sure private key has QUOTES around it
- Make sure you kept the `\n` characters
- Restart dev server after adding credentials

### "Permission denied" in Firestore
- Make sure you deployed the security rules
- Check Firebase Console → Firestore Database → Rules
- The rules should match what's in your `firestore.rules` file

### "Module not found: Can't resolve './client'"
- This should be fixed now! The client.ts file was missing and I just created it.
- Restart your dev server

---

## 📝 Summary

**What you need to do:**

1. ✅ Go to Firebase Console
2. ✅ Generate private key (download JSON)
3. ✅ Copy `client_email` and `private_key` from JSON
4. ✅ Add them to `.env.local`
5. ✅ Deploy Firestore rules (Console or CLI)
6. ✅ Restart dev server
7. ✅ Test the app!

**Time required:** 10-15 minutes

**You can do this!** 🚀
