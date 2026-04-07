import { BOARD_COLUMNS } from "./board-constants.ts";

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((c) => (
        <div
          key={c}
          className="flex flex-col min-w-[260px] w-[260px] bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700/60"
        >
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700/60">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
