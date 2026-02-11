import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const APP_ID = import.meta.env.VITE_APP_ID;
const PROD_APP_URL = "https://profile-launcher-app.netlify.app";

const getRedirectUrl = (): string => {
  if (typeof window === "undefined") return PROD_APP_URL;
  const origin = window.location.origin;
  return origin.includes("localhost") ? PROD_APP_URL : origin;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndSetSession = async (session: Session | null) => {
      if (session?.user) {
        const userAppId = session.user.user_metadata?.app_id;
        if (userAppId && userAppId !== APP_ID) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      validateAndSetSession(session).then(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      validateAndSetSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { app_id: APP_ID },
        emailRedirectTo: getRedirectUrl(),
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithMagicLink, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
