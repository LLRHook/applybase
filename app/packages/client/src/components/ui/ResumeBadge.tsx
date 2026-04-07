import { cn } from "../../lib/utils.ts";

// Reserved colors for the default-shipped variants. Custom variants get a
// deterministic color picked from the PALETTE below based on a hash of the
// name, so the same name always renders the same color across the app.
const RESERVED_COLORS: Record<string, string> = {
  backend: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  fullstack: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  lead: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  "ai-integration": "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
};

const PALETTE = [
  "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
  "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
  "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
  "bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400",
  "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
];

function colorFor(name: string): string {
  if (RESERVED_COLORS[name]) return RESERVED_COLORS[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function ResumeBadge({ resume }: { resume?: string | null }) {
  if (!resume) return null;
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs", colorFor(resume))}>
      {resume}
    </span>
  );
}
