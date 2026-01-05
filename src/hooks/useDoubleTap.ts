import { useState, useCallback, TouchEvent } from "react";

/**
 * Hook para detectar double tap (toque duplo)
 * Retorna handlers para adicionar ao elemento
 */
export function useDoubleTap(
  onDoubleTap: () => void,
  delay = 300
): {
  onTouchEnd: (e: TouchEvent) => void;
} {
  const [lastTap, setLastTap] = useState(0);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTap;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        // Double tap detectado!
        onDoubleTap();
        
        // Feedback háptico leve
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
        
        // Previne zoom no iOS
        e.preventDefault();
        
        // Reset
        setLastTap(0);
      } else {
        setLastTap(now);
      }
    },
    [lastTap, delay, onDoubleTap]
  );

  return {
    onTouchEnd: handleTouchEnd,
  };
}


