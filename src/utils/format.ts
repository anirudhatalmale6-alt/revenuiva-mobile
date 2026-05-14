import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Colors } from '../theme/colors';

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  if (national.length !== 10) return phone;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  try {
    const date = timeStr.includes('T') ? parseISO(timeStr) : parseISO(`1970-01-01T${timeStr}`);
    return format(date, 'h:mm a');
  } catch {
    return timeStr;
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  return `${first}${last}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: Colors.primary,
    completed: Colors.success,
    cancelled: Colors.error,
    no_show: Colors.error,
    pending: Colors.warning,
    checked_in: Colors.secondary,
    in_progress: Colors.secondary,
  };
  return map[status.toLowerCase()] || Colors.textSecondary;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    pending: 'Pending',
    checked_in: 'Checked In',
    in_progress: 'In Progress',
  };
  return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export function timeAgo(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateStr;
  }
}
