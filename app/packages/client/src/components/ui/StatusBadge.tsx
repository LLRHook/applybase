import { cn } from "../../lib/utils.ts";

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  screening: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  technical: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  onsite: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  offer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  withdrawn: "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400",
  archived: "bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", STATUS_COLORS[status] || "bg-gray-100", className)}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
