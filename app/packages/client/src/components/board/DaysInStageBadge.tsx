import { Clock, AlertTriangle } from "lucide-react";
import { daysSince } from "../../lib/dates.ts";
import { cn } from "../../lib/utils.ts";

/**
 * Approximates time-in-stage from `updatedAt`. Resets on any job edit, not
 * just status changes — for precise timing see the detail page's stageEvents
 * timeline. The tradeoff is one less round-trip per card, which matters on a
 * board with dozens of cards.
 */

const TONES = {
  neutral: { className: "text-gray-500 dark:text-gray-400", Icon: Clock },
  warn: {
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded",
    Icon: Clock,
  },
  stall: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded",
    Icon: AlertTriangle,
  },
} as const;

export function DaysInStageBadge({ updatedAt }: { updatedAt?: string | null }) {
  if (!updatedAt) return null;
  const days = daysSince(updatedAt);
  const tone = days >= 14 ? "stall" : days >= 7 ? "warn" : "neutral";
  const { className, Icon } = TONES[tone];

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <Icon size={10} />
      {days === 0 ? "today" : `${days}d`}
    </span>
  );
}
