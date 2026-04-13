import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from "firebase/functions";

// Config Firebase : uniquement via variables d'environnement (.env), jamais en dur
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your-project-id";

let app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;
let _functions: Functions | null = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  _db = getFirestore(app);
  _storage = getStorage(app);
  _auth = getAuth(app);
  _functions = getFunctions(app, "europe-west1");
}

export const appInstance = app;
export const db = _db;
export const storage = _storage;
export const auth = _auth;
export const functions = _functions;
