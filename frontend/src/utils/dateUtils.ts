/**
 * Date and Time Utilities for EmotionVerse AI
 * Parses ISO timestamps reliably in UTC and formats them for the user's local timezone.
 */

export function parseUtcDate(timestamp: string | Date | undefined | null): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;

  let str = String(timestamp).trim();
  // If ISO string without timezone offset or Z, explicitly treat as UTC
  if (!str.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export interface FormattedDateTime {
  timeFormatted: string;
  dateLabel: string;
  isToday: boolean;
  relativeBadge: string | null;
  fullDateTime: string;
}

export function formatRecordDateTime(timestamp: string | Date | undefined | null): FormattedDateTime {
  const d = parseUtcDate(timestamp);
  const now = new Date();

  // Local time (e.g., "06:30:39 PM")
  const timeFormatted = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  let dateLabel = "";
  if (isToday) {
    dateLabel = "Today";
  } else if (isYesterday) {
    dateLabel = "Yesterday";
  } else {
    dateLabel = d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });
  }

  // Relative badge for recent activities
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  let relativeBadge: string | null = null;
  if (isToday) {
    if (diffSec >= 0 && diffSec < 90) {
      relativeBadge = "Just now";
    } else if (diffSec >= 90 && diffSec < 3600) {
      relativeBadge = `${Math.floor(diffSec / 60)}m ago`;
    } else if (diffSec >= 3600 && diffSec < 86400) {
      relativeBadge = `${Math.floor(diffSec / 3600)}h ago`;
    }
  }

  const fullDateTime = `${dateLabel}, ${timeFormatted}`;

  return {
    timeFormatted,
    dateLabel,
    isToday,
    relativeBadge,
    fullDateTime,
  };
}
