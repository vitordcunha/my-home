import { useCallback } from "react";

/**
 * Hook para scroll suave para o topo
 * Útil para double tap no header
 */
export function useScrollToTop() {
  const scrollToTop = useCallback((smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });

    // Feedback háptico leve
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return scrollToTop;
}


