import { useEffect } from "react";

/**
 * Hook para detectar shake (agitar) do dispositivo
 * Útil para implementar "shake to undo"
 */
export function useShakeDetection(onShake: () => void, threshold = 30) {
  useEffect(() => {
    // Verifica se está em mobile e suporta DeviceMotion
    if (typeof window === "undefined" || !window.DeviceMotionEvent) {
      return;
    }

    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastUpdate = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const { x, y, z } = e.accelerationIncludingGravity || {};
      if (x === null || y === null || z === null || x === undefined || y === undefined || z === undefined) return;

      const now = Date.now();
      
      // Throttle: verifica apenas a cada 100ms
      if (now - lastUpdate < 100) return;
      lastUpdate = now;

      // Calcula diferença de aceleração
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);
      const totalDelta = deltaX + deltaY + deltaZ;

      // Detecta shake (aceleração súbita)
      if (totalDelta > threshold) {
        onShake();
        
        // Vibração de confirmação
        if ("vibrate" in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    // Solicita permissão no iOS 13+
    if (
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(console.error);
    } else {
      // Android e iOS < 13
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [onShake, threshold]);
}

