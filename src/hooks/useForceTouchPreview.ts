import { TouchEvent, useCallback } from "react";

/**
 * Hook para detectar 3D Touch / Force Touch (iOS)
 * Permite preview de conteúdo com pressão forte
 */
export function useForceTouchPreview(
  onPreview: () => void,
  forceThreshold = 0.5
): {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
} {
  const handleTouch = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      
      // Force está disponível apenas no iOS com 3D Touch
      if ("force" in touch) {
        const force = (touch as any).force;
        
        if (force > forceThreshold) {
          onPreview();
          
          // Haptic Engine feedback (iOS)
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        }
      }
    },
    [onPreview, forceThreshold]
  );

  return {
    onTouchStart: handleTouch,
    onTouchMove: handleTouch,
  };
}




