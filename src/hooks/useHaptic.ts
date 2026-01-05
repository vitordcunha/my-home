import { useLocalStorage } from "react-use";

/**
 * Sistema completo de feedback háptico mobile
 * Permite controlar vibração em diferentes intensidades
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning"
  | "notification";

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 30,
  heavy: 50,
  success: [30, 50, 30], // tap-pause-tap
  error: [50, 100, 50, 100, 50], // buzz triplo
  warning: [100, 50, 100], // duas batidas fortes
  notification: [10, 20, 10], // suave
};

export function useHaptic() {
  const [enabled, setEnabled] = useLocalStorage("haptic-enabled", true);

  const trigger = (type: HapticType) => {
    if (!enabled || !("vibrate" in navigator)) {
      return;
    }

    try {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn("Haptic feedback not supported:", error);
    }
  };

  return {
    enabled,
    setEnabled,
    trigger,
  };
}


