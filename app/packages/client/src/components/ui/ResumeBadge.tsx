import { cn } from "../../lib/utils.ts";

const RESUME_COLORS: Record<string, string> = {
  backend: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  fullstack: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  lead: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  "ai-integration": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  custom: "bg-gray-50 text-gray-600 dark:bg-gray-700/20 dark:text-gray-400",
};

export function ResumeBadge({ resume }: { resume?: string | null }) {
  if (!resume) return null;
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs", RESUME_COLORS[resume] || "bg-gray-50")}>
      {resume}
    </span>
  );
}
