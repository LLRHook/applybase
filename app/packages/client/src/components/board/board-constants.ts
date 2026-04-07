// Single source of truth for the Kanban board's column set, labels, and
// accent colors. Adding/removing a board column starts and ends here.
//
// Why six columns and not all nine job statuses: rejected/withdrawn/archived
// are terminal dead-ends that bloat the active pipeline. Use the List view
// to manage them.

export const BOARD_COLUMNS = [
  "applied",
  "screening",
  "technical",
  "onsite",
  "offer",
  "accepted",
] as const;

export type BoardStatus = (typeof BOARD_COLUMNS)[number];

export const STATUS_LABELS: Record<BoardStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  accepted: "Accepted",
};

export const STATUS_ACCENT: Record<BoardStatus, string> = {
  applied: "border-t-blue-400",
  screening: "border-t-yellow-400",
  technical: "border-t-purple-400",
  onsite: "border-t-pink-400",
  offer: "border-t-emerald-400",
  accepted: "border-t-green-500",
};
