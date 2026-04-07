import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";
import { jobsApi } from "../../api/jobs.api.ts";
import { BoardColumn } from "./BoardColumn.tsx";
import { BoardCardOverlay, type BoardCardJob } from "./BoardCard.tsx";
import { BoardSkeleton } from "./BoardSkeleton.tsx";
import { BOARD_COLUMNS, type BoardStatus } from "./board-constants.ts";
import { EmptyState } from "../ui/EmptyState.tsx";

// Default KeyboardSensor uses pixel-grid movement, which doesn't snap to
// columns on a kanban layout — keyboard users would never be able to drop a
// card into another column. This getter advances/retreats by a full column
// width on left/right and by one card height on up/down so arrow keys move
// between meaningful drop targets.
const COLUMN_STEP = 270; // 260px column + 10px gap
const CARD_STEP = 100;
const boardKeyboardCoordinateGetter: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  switch (event.code) {
    case "ArrowRight":
      return { ...currentCoordinates, x: currentCoordinates.x + COLUMN_STEP };
    case "ArrowLeft":
      return { ...currentCoordinates, x: currentCoordinates.x - COLUMN_STEP };
    case "ArrowDown":
      return { ...currentCoordinates, y: currentCoordinates.y + CARD_STEP };
    case "ArrowUp":
      return { ...currentCoordinates, y: currentCoordinates.y - CARD_STEP };
  }
  return undefined;
};

export function BoardView({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [localJobs, setLocalJobs] = useState<BoardCardJob[]>([]);
  const [activeJob, setActiveJob] = useState<BoardCardJob | null>(null);

  // Single fetch for the board: limit raised to 500 to cover realistic
  // active-pipeline volume without per-column queries. The status filter is
  // hard-coded to the six visible columns — rejected/withdrawn/archived are
  // intentionally not on the board (use the List view for those).
  const params: Record<string, string> = {
    limit: "500",
    offset: "0",
    sortBy: "updatedAt",
    sortDir: "desc",
    status: BOARD_COLUMNS.join(","),
  };
  if (search) params.search = search;

  const { data: result, isLoading } = useQuery({
    queryKey: ["jobs", "board", search],
    queryFn: () => jobsApi.list(params),
  });

  // Mirror the query into local state so drag-drop can update optimistically
  // without waiting for a refetch round-trip.
  useEffect(() => {
    if (result?.data) setLocalJobs(result.data as BoardCardJob[]);
  }, [result?.data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      jobsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const sensors = useSensors(
    // 5px activation distance prevents click-to-open from being hijacked
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinateGetter }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = event.active.data.current?.job as BoardCardJob | undefined;
    if (job) setActiveJob(job);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as number;
    const newStatus = over.id as string;
    if (!BOARD_COLUMNS.includes(newStatus as BoardStatus)) return;

    // Read prevStatus from the closure's `localJobs` — this is the current
    // render's optimistic state, refreshed every time setLocalJobs runs and
    // the component re-renders. Reading from `active.data.current?.job` would
    // give us the snapshot dnd-kit captured at useDraggable call time, which
    // is also fresh in practice but more indirect.
    const current = localJobs.find((j) => j.id === jobId);
    if (!current || current.status === newStatus) return;
    const prevStatus = current.status;

    setLocalJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)),
    );

    updateMutation.mutate(
      { id: jobId, status: newStatus },
      {
        onError: (err: Error) => {
          setLocalJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: prevStatus } : j)),
          );
          toast.error(`Couldn't move to ${newStatus}: ${err.message || "unknown error"}`);
        },
      },
    );
  };

  if (isLoading) return <BoardSkeleton />;

  if (localJobs.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No active applications"
        description="Add an application or switch to List view to see archived/rejected ones."
      />
    );
  }

  const byStatus: Record<BoardStatus, BoardCardJob[]> = {
    applied: [],
    screening: [],
    technical: [],
    onsite: [],
    offer: [],
    accepted: [],
  };
  for (const job of localJobs) {
    if (BOARD_COLUMNS.includes(job.status as BoardStatus)) {
      byStatus[job.status as BoardStatus].push(job);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((status) => (
          <BoardColumn key={status} status={status} jobs={byStatus[status]} />
        ))}
      </div>
      <DragOverlay>{activeJob ? <BoardCardOverlay job={activeJob} /> : null}</DragOverlay>
    </DndContext>
  );
}
