import { useDroppable } from "@dnd-kit/core";
import { BoardCard, type BoardCardJob } from "./BoardCard.tsx";
import { STATUS_LABELS, STATUS_ACCENT, type BoardStatus } from "./board-constants.ts";
import { cn } from "../../lib/utils.ts";

export function BoardColumn({ status, jobs }: { status: BoardStatus; jobs: BoardCardJob[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${STATUS_LABELS[status]} column`}
      className={cn(
        "flex flex-col min-w-[260px] w-[260px] bg-gray-50 dark:bg-gray-900/40 rounded-lg border-t-2 border border-gray-200 dark:border-gray-700/60",
        STATUS_ACCENT[status],
        isOver && "ring-2 ring-blue-400/60",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700/60">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">
          {jobs.length}
        </span>
      </div>

      <div role="list" className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
        {jobs.length === 0 ? (
          <div
            className={cn(
              "rounded border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-600 text-center py-6 transition",
              isOver && "border-blue-400 text-blue-500",
            )}
          >
            {isOver ? "Drop here" : "Empty"}
          </div>
        ) : (
          jobs.map((job) => <BoardCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
