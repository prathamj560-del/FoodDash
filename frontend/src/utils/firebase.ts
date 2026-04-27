import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "fooddash-2e381.firebaseapp.com",
  projectId: "fooddash-2e381",
  storageBucket: "fooddash-2e381.firebasestorage.app",
  messagingSenderId: "288874430245",
  appId: "1:288874430245:web:7d5d321575c9211d5664cc"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { app, auth };