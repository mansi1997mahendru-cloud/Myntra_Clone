import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Vite, environment variables must start with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Check if we are running with placeholder values and log a helpful reminder
if (firebaseConfig.apiKey === "placeholder-api-key") {
  console.warn(
    "Firebase initialized with placeholder configuration. " +
    "Please define VITE_FIREBASE_* variables in your .env or .env.local file to connect to your real Firebase project."
  );
}

const isFirebasePlaceholder = 
  firebaseConfig.apiKey === "placeholder-api-key" || 
  firebaseConfig.apiKey === "" || 
  firebaseConfig.apiKey.includes("your_api_key");

export { app, auth, db, storage, isFirebasePlaceholder };
