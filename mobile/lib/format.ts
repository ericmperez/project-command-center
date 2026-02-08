export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours < 1
    ? `${Math.round(hours * 60)}m`
    : `${hours.toFixed(1)}h`;
}
