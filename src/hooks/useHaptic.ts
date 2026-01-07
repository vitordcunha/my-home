import { useLocalStorage } from "react-use";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

/**
 * Sistema completo de feedback háptico mobile
 * Usa Capacitor Haptics para sensação nativa em iOS/Android
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning"
  | "notification";

export function useHaptic() {
  const [enabled, setEnabled] = useLocalStorage("haptic-enabled", true);

  const trigger = async (type: HapticType) => {
    if (!enabled) return;

    try {
      // Se não for nativo (web), tentamos navigator.vibrate como fallback
      if (!Capacitor.isNativePlatform()) {
        if ("vibrate" in navigator) {
          const webPatterns: Record<HapticType, number | number[]> = {
            light: 10,
            medium: 30,
            heavy: 50,
            success: [30, 50, 30],
            error: [50, 100, 50, 100, 50],
            warning: [100, 50, 100],
            notification: [10, 20, 10],
          };
          navigator.vibrate(webPatterns[type]);
        }
        return;
      }

      // Implementação Nativa via Capacitor
      switch (type) {
        case "light":
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case "medium":
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case "heavy":
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case "success":
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case "warning":
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case "error":
          await Haptics.notification({ type: NotificationType.Error });
          break;
        default:
          await Haptics.vibrate();
          break;
      }
    } catch (error) {
      console.warn("Haptic failed:", error);
    }
  };

  return {
    enabled,
    setEnabled,
    trigger,
  };
}


