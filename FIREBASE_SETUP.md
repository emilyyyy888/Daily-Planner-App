# 🔥 Firebase Setup Guide - Step by Step

## Why Firebase?
- ✅ **Free forever** - 1GB storage, 50K reads/day (more than enough for personal use)
- ✅ **Real-time sync** - Changes sync across all devices instantly
- ✅ **Reliable** - Data persists even after browser refresh
- ✅ **No backend needed** - Everything runs from your frontend

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `daily-planner` (or any name you like)
4. **Disable Google Analytics** (optional, you can enable later)
5. Click **"Create project"**
6. Wait for project creation (takes ~30 seconds)
7. Click **"Continue"**

## Step 2: Enable Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left menu
2. Click **"Create database"**
3. **Start in test mode** (we'll add security rules later)
   - This allows read/write access for now
   - ⚠️ For production, you should add proper authentication
4. Choose a **location** (pick the one closest to you)
   - Example: `us-central` (Iowa) or `asia-east1` (Taiwan)
5. Click **"Enable"**
6. Wait for database creation (~30 seconds)

## Step 3: Get Your Firebase Config

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **web icon** `</>` (or "Add app" → Web)
5. Register your app:
   - App nickname: `Daily Planner` (or any name)
   - **Don't check** "Also set up Firebase Hosting"
   - Click **"Register app"**
6. **Copy the `firebaseConfig` object** - it looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## Step 4: Update Your Code

1. Open `src/firebase.js` in your project
2. **Replace** the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...", // Your actual API key
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## Step 5: Install Firebase

Run this command in your project directory:

```bash
npm install firebase
```

## Step 6: Test It!

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)
3. Add a task
4. You should see: `✅ Draft tasks saved to Firebase: 1 tasks`
5. **Refresh the page** - your task should still be there! 🎉

## Step 7: Set Up Security Rules (Important!)

Currently, your database is in "test mode" which allows anyone to read/write. For production:

1. Go to Firebase Console → **Firestore Database** → **Rules**
2. Replace the rules with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to tasks collections
       match /{collection}/{document=**} {
         allow read, write: if true; // ⚠️ For now, allow all access
       }
     }
   }
   ```
3. Click **"Publish"**

**⚠️ Note:** The rule above allows anyone to access your data. For better security:
- Add Firebase Authentication
- Restrict access by user ID
- See `firebase-setup.md` for more advanced security rules

## Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Check that you copied the correct API key from Firebase Console
- Make sure there are no extra spaces or quotes

### Error: "Firebase: Error (permission-denied)"
- Go to Firestore Database → Rules
- Make sure rules allow read/write access
- Click "Publish" after making changes

### Data not saving?
- Check browser console (F12) for error messages
- Make sure Firestore Database is enabled
- Verify your Firebase config is correct

### Still using localStorage?
- Check browser console - it should say "✅ Firebase detected"
- If it says "⚠️ Firebase not configured", check your `firebase.js` file
- Make sure API key is not "YOUR_API_KEY"

## What Happens Now?

✅ **Data saves to Firebase** - Your tasks are stored in the cloud
✅ **Refresh works** - Data persists after page refresh
✅ **Cross-device sync** - Access your tasks from any device
✅ **Real-time updates** - Changes sync instantly

## Free Tier Limits

Firebase Free Tier includes:
- **1 GB storage** - Enough for ~100,000 tasks
- **50,000 reads/day** - Plenty for personal use
- **20,000 writes/day** - More than enough
- **10 GB/month bandwidth** - Sufficient for most users

You'll likely never hit these limits for personal use!

## Need Help?

If you encounter any issues:
1. Check browser console (F12) for error messages
2. Verify Firebase config is correct
3. Make sure Firestore Database is enabled
4. Check that security rules allow read/write access

