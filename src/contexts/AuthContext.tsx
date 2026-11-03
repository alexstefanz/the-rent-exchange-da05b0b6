import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const deactivationChecked = useRef<Set<string>>(new Set());

  const clearPasswordRecovery = () => setIsPasswordRecovery(false);

  // Separate effect for deactivation check — runs AFTER auth state is set
  useEffect(() => {
    if (!user) return;
    if (deactivationChecked.current.has(user.id)) return;
    deactivationChecked.current.add(user.id);

    const checkDeactivated = async () => {
      try {
        // Verify the auth user still exists server-side (deleted accounts keep a stale local token).
        // Only sign out on an explicit "user not found" style error — transient network/fetch
        // failures must never log a valid user out.
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (!authData?.user) {
          const userGone =
            authError &&
            /not.?found|does not exist|user_not_found|invalid.*jwt|sub claim/i.test(authError.message ?? "");
          if (userGone) {
            await supabase.auth.signOut({ scope: "local" });
            window.location.replace("/");
            return;
          }
          // Any other failure (network hiccup, timeout, refresh issue): keep the session.
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("is_deactivated")
          .eq("id", user.id)
          .maybeSingle();
        if (!error && !data) {
          // Profile removed → account was deleted
          await supabase.auth.signOut({ scope: "local" });
          window.location.replace("/");
          return;
        }
        if (data?.is_deactivated) {
          await supabase.auth.signOut();
          alert("Acest cont a fost dezactivat.");
        }
      } catch (err) {
        console.error("checkDeactivated error:", err);
      }
    };

    checkDeactivated();
  }, [user]);

  useEffect(() => {
    // Get initial session — synchronous state update
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      supabase.realtime.setAuth(session?.access_token ?? null);
      setLoading(false);
    });

    // Listen for auth changes — strictly synchronous callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        setSession(session);
        setUser(session?.user ?? null);
        supabase.realtime.setAuth(session?.access_token ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    // Supabase obfuscates "user already exists" to prevent email enumeration:
    // it returns success with an empty identities array and no email is sent.
    // Detect this case and surface a clear error to the UI.
    const identities = (data?.user as any)?.identities;
    if (!error && Array.isArray(identities) && identities.length === 0) {
      return {
        error: {
          message: "User already registered",
          name: "UserAlreadyExists",
        } as any,
      };
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery, clearPasswordRecovery, signUp, signIn, signOut }}>
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
