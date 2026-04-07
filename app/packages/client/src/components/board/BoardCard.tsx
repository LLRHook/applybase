import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { CompanyLogo } from "../ui/CompanyLogo.tsx";
import { ResumeBadge } from "../ui/ResumeBadge.tsx";
import { DaysInStageBadge } from "./DaysInStageBadge.tsx";
import { cn } from "../../lib/utils.ts";

export interface BoardCardJob {
  id: number;
  title: string;
  employer: string;
  jobUrl: string;
  status: string;
  resumeUsed?: string | null;
  updatedAt?: string | null;
}

// Shared visual markup. Used by both the live draggable card and the
// DragOverlay clone — only the live one calls useDraggable.
function CardContents({ job }: { job: BoardCardJob }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <div className="shrink-0">
          <CompanyLogo employer={job.employer} url={job.jobUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {job.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.employer}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 gap-2">
        <ResumeBadge resume={job.resumeUsed} />
        <DaysInStageBadge updatedAt={job.updatedAt} />
      </div>
    </>
  );
}

export function BoardCard({ job }: { job: BoardCardJob }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });
  // PointerSensor's `activationConstraint: { distance: 5 }` calls
  // setPointerCapture once a drag starts, which suppresses the synthetic
  // click event the browser would otherwise fire on pointerup. So onClick
  // here only fires when no drag happened — no extra guard needed.
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => navigate(`/applications/${job.id}`)}
      role="listitem"
      aria-label={`${job.title} at ${job.employer}`}
      className={cn(
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition",
        isDragging && "opacity-40",
      )}
    >
      <CardContents job={job} />
    </div>
  );
}

// Non-draggable visual clone rendered inside DragOverlay. Calls no dnd-kit
// hooks because DragOverlay renders in a portal outside the DndContext tree.
export function BoardCardOverlay({ job }: { job: BoardCardJob }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl rotate-1 ring-2 ring-blue-400/40 cursor-grabbing">
      <CardContents job={job} />
    </div>
  );
}
