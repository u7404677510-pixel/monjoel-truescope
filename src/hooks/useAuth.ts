import { useState, useEffect, createContext, useContext, createElement } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key";

const DEMO_EMAIL = "admin@joel.fr";
const DEMO_PASSWORD = "admin123";

const DEMO_USER = {
  uid: "demo-admin",
  email: DEMO_EMAIL,
  displayName: "Admin Joël",
} as unknown as User;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        setUser(DEMO_USER);
        return;
      }
      throw new Error("Identifiants invalides");
    }
    if (!auth) throw new Error("Firebase non configuré");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  return createElement(AuthContext.Provider, { value: { user, loading, login, logout } }, children);
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
