// Firebase configuration
// Replace these values with your Firebase project config
// Get them from: Firebase Console → Project Settings → Your apps → Web app
// See FIREBASE_SETUP.md for detailed instructions

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB2rnRFcha4ZcqPL5SdGHTZdiZiJMg9t9s",
  authDomain: "daily-planner-70b78.firebaseapp.com",
  projectId: "daily-planner-70b78",
  storageBucket: "daily-planner-70b78.firebasestorage.app",
  messagingSenderId: "523028819983",
  appId: "1:523028819983:web:883a8473b01f08fa32f37a",
};

// Check if Firebase is configured
const isConfigured =
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app = null;
let db = null;

if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    // Initialize Firestore
    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
} else {
  console.log(
    "⚠️ Firebase not configured. Using localStorage. See FIREBASE_SETUP.md for setup instructions."
  );
}

export { db };
export default app;
