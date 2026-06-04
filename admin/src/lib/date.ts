import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export function formatDate(date: string | Date, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

export function isYesterday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
}
