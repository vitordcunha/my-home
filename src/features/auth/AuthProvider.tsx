import { createContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Handle deep links for Capacitor
    const handleDeepLink = async (url: string) => {
      try {
        console.log("Deep link processed:", url);
        // Debug alert to see if the app receives the URL
        // alert("Deep Link Recebido: " + url);

        // Handle PKCE (code in search params)
        // Note: URL parsing might need to handle custom schemes carefully
        // Standard URL object works well with "scheme://path?query"
        const cleanUrl = url.replace("#", "?"); // Sometimes fragment comes as hash
        const urlObj = new URL(cleanUrl);
        const params = urlObj.searchParams;
        const code = params.get("code");

        if (code) {
          toast({
            title: "Autenticando...",
            description: "Processando login com Google.",
          });
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          return;
        }

        // Handle Implicit (tokens in hash) - fallback
        // Check if we have tokens directly in the URL (hash or query)
        // This is common if Supabase redirects with #access_token=...

        let accessToken = params.get("access_token");
        let refreshToken = params.get("refresh_token");

        // If not in query, check hash manually if URL parsing didn't catch it
        if (!accessToken && url.includes("access_token")) {
          const fragment = url.split("access_token=")[1].split("&")[0];
          accessToken = fragment;
          const refreshFragment = url.split("refresh_token=")[1]?.split("&")[0];
          refreshToken = refreshFragment;
        }

        if (accessToken && refreshToken) {
          toast({
            title: "Autenticando...",
            description: "Finalizando login.",
          });
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
        toast({
          variant: "destructive",
          title: "Erro no Login",
          description: "Não foi possível processar o retorno do Google.",
        });
        // alert("Erro no Login: " + JSON.stringify(error));
      }
    };

    const setupListener = async () => {
      await App.addListener("appUrlOpen", (event) => {
        if (event.url.includes("com.nossacasa.app")) {
          handleDeepLink(event.url);
        }
      });
    };

    setupListener();

    return () => {
      subscription.unsubscribe();
      App.removeAllListeners();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
