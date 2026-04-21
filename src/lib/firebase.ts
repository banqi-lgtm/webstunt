// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0_rb_M3sykwLkiH_MUvJj_oB0qxQyMq8",
  authDomain: "studio-7782861871-351ce.firebaseapp.com",
  projectId: "studio-7782861871-351ce",
  storageBucket: "studio-7782861871-351ce.firebasestorage.app",
  messagingSenderId: "946527863962",
  appId: "1:946527863962:web:229cfbaf53c700f6534b23"
};

// Initialize Firebase (prevent multiple initialization in Next.js development)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
