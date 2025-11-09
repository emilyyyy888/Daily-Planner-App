# 🔥 Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "daily-planner")
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **test mode** (we'll add security rules later)
4. Choose a location (closest to you)
5. Click "Enable"

## Step 3: Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register app with nickname (e.g., "Daily Planner")
5. Copy the `firebaseConfig` object

## Step 4: Install Firebase

```bash
npm install firebase
```

## Step 5: Create Firebase Config File

Create `src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

Replace the values with your actual Firebase config.

## Step 6: Update App.jsx

See the updated `App.jsx` implementation in the next section.

## Step 7: Set Up Security Rules (Important!)

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to tasks collection
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // For anonymous access (no auth), use this simpler rule:
    match /tasks/{taskId} {
      allow read, write: if true; // ⚠️ Only for testing! Add proper auth later
    }
  }
}
```

**⚠️ Warning:** The simple rule above allows anyone to read/write. For production, implement authentication!

## Step 8: Deploy

After implementing Firebase integration, deploy to Vercel:
- Your Firebase config will work in production
- Data will sync across all devices
- Changes persist even after browser refresh

