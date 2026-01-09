import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { ja } from "date-fns/locale";

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: ja });
  }
  if (isYesterday(date)) {
    return '昨日';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale: ja });
  }
  return format(date, 'M/d', { locale: ja });
}
