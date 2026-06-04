export function secondsSinceNow(date: Date | string | number): number {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 1000);
}

export function formatMsToString(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}

export function formatDate(date: Date | string | number): string {
  return new Date(date).toISOString();
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function diffInDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function diffInHours(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
}

