import { format, formatDistanceToNowStrict, isAfter, isBefore, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const TIMEZONE = 'Asia/Dhaka';

export function getDhakaDate(dateInput: string | Date = new Date()): Date {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return toZonedTime(date, TIMEZONE);
}

export function formatEventDate(dateInput: string | Date): string {
  const date = getDhakaDate(dateInput);
  return format(date, 'MMM d, yyyy');
}

export function formatEventTime(dateInput: string | Date): string {
  const date = getDhakaDate(dateInput);
  return format(date, 'h:mm a');
}

export function formatEventDateTime(dateInput: string | Date): string {
  const date = getDhakaDate(dateInput);
  return format(date, 'MMM d, yyyy · h:mm a');
}

export function formatDeadlineCountdown(deadlineIso: string): {
  text: string;
  isExpired: boolean;
  isClosingSoon: boolean;
} {
  const deadline = parseISO(deadlineIso);
  const now = new Date();

  if (isBefore(deadline, now)) {
    return { text: 'Registration closed', isExpired: true, isClosingSoon: false };
  }

  const diffMs = deadline.getTime() - now.getTime();
  const hoursLeft = diffMs / (1000 * 60 * 60);
  const daysLeft = Math.floor(hoursLeft / 24);
  const remainingHours = Math.floor(hoursLeft % 24);
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let text = '';
  if (daysLeft > 0) {
    text = `Closes in ${daysLeft}d ${remainingHours}h`;
  } else if (hoursLeft >= 1) {
    text = `Closes in ${remainingHours}h ${minutesLeft}m`;
  } else {
    text = `Closes in ${minutesLeft}m`;
  }

  return {
    text,
    isExpired: false,
    isClosingSoon: hoursLeft <= 48,
  };
}
