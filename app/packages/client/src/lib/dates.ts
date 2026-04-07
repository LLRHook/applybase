import { formatDistanceToNow, format } from "date-fns";

// The server writes some timestamps via SQLite's `datetime('now')` default,
// which returns a naive "YYYY-MM-DD HH:MM:SS" string with no timezone marker
// (SQLite's default is already UTC, it just doesn't tell you). When JS parses
// such a string with `new Date(...)`, it interprets it as LOCAL time — creating
// a display offset equal to the user's timezone difference from UTC.
//
// This helper normalizes any incoming timestamp to something JS will parse as
// UTC: strings that already carry a `Z` or explicit offset pass through, while
// unmarked ones get the space replaced with `T` and `Z` appended.
function toUtc(dateStr: string): string {
  if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(dateStr)) return dateStr;
  return dateStr.replace(" ", "T") + "Z";
}

export function relativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(toUtc(dateStr)), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function shortDate(dateStr: string): string {
  try {
    return format(new Date(toUtc(dateStr)), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Format a duration in milliseconds into a short human-readable string.
 * Picks units smartly so sub-day responses don't render as "0d":
 *   < 1 min        → "<1m"
 *   < 1 hour       → "Nm"
 *   < 24 hours     → "Nh"
 *   < 7 days       → "Nd"
 *   >= 7 days      → "Nw"
 */
/**
 * Whole days between `dateStr` and now. Negative results clamp to 0.
 * Used by the Kanban board to surface stalled cards.
 */
export function daysSince(dateStr: string): number {
  try {
    const ms = Date.now() - new Date(toUtc(dateStr)).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  } catch {
    return 0;
  }
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "—";
  const minutes = ms / 60000;
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 7) return `${Math.round(days)}d`;
  return `${Math.round(days / 7)}w`;
}
