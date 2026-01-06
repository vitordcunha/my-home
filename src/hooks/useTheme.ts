import { useEffect, useState } from "react";
import { useLocalStorage } from "react-use";

export type Theme = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "auto");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const updateResolvedTheme = () => {
    if (theme === "auto") {
      // Verifica horário (19h-7h = dark)
      const hour = new Date().getHours();
      const isDarkHours = hour >= 19 || hour < 7;

      // // Também considera preferência do sistema
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      // Prioriza horário, mas respeita sistema se não estiver nos horários extremos
      setResolvedTheme(isDarkHours ? "dark" : systemPrefersDark ? "dark" : "light");
    } else {
      setResolvedTheme(theme as ResolvedTheme);
    }
  };

  useEffect(() => {
    updateResolvedTheme();

    // Observa mudanças no sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateResolvedTheme();
    mediaQuery.addEventListener("change", handler);

    // Verifica horário a cada minuto (para auto mode)
    const interval = setInterval(updateResolvedTheme, 60000);

    return () => {
      mediaQuery.removeEventListener("change", handler);
      clearInterval(interval);
    };
  }, [theme]);

  useEffect(() => {
    // Aplica tema ao document
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  return {
    theme: theme || "auto",
    setTheme,
    resolvedTheme,
  };
}
