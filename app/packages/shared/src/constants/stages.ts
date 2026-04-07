import type { JobStatus } from "../types/job.js";

export const STATUS_ORDER: JobStatus[] = [
  "applied",
  "screening",
  "technical",
  "onsite",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
];

export const STATUS_LABELS: Record<JobStatus, string> = {
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

export const STATUS_COLORS: Record<JobStatus, string> = {
  applied: "bg-blue-100 text-blue-700",
  screening: "bg-yellow-100 text-yellow-700",
  technical: "bg-purple-100 text-purple-700",
  onsite: "bg-indigo-100 text-indigo-700",
  offer: "bg-green-100 text-green-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  archived: "bg-slate-100 text-slate-500",
};
