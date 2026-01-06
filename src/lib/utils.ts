import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isSameDay, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWithinLast24Hours(date: Date | string): boolean {
  const compareDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - compareDate.getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export function isCompletedToday(date: Date | string): boolean {
  const compareDate = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return isSameDay(compareDate, today);
}

export function vibrate(duration: number = 50) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

export function formatDistanceToNow(date: Date | string): string {
  const compareDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - compareDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return "agora há pouco";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} ${diffInWeeks === 1 ? "semana" : "semanas"}`;
  }

  return compareDate.toLocaleDateString("pt-BR");
}
