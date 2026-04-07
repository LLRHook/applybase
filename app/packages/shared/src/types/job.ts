export const JOB_STATUSES = [
  "applied",
  "screening",
  "technical",
  "onsite",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const RESUME_VARIANTS = [
  "backend",
  "fullstack",
  "lead",
  "ai-integration",
  "custom",
] as const;
export type ResumeVariant = (typeof RESUME_VARIANTS)[number];

export const FOUND_VIA_SOURCES = [
  "linkedin",
  "indeed",
  "glassdoor",
  "wellfound",
  "hackernews",
  "company_site",
  "referral",
  "other",
] as const;
export type FoundViaSource = (typeof FOUND_VIA_SOURCES)[number];

export const SALARY_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF"] as const;
export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];

export interface CreateJobInput {
  title: string;
  employer: string;
  jobUrl: string;
  location?: string;
  salary?: string;
  jobDescription?: string;
  remote?: boolean;
  resumeUsed?: ResumeVariant;
  foundVia?: FoundViaSource;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: SalaryCurrency;
  companyNotes?: string;
}

export interface Job extends CreateJobInput {
  id: number;
  status: JobStatus;
  interviewNotes?: string;
  talkingPoints?: string;
  questionsToAsk?: string;
  offerAmount?: number;
  offerEquity?: string;
  offerNotes?: string;
  negotiationNotes?: string;
  followUpDate?: string;
  followUpDone?: boolean;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetail extends Job {
  stageEvents: import("./stage-event.js").StageEvent[];
}

export interface JobFilters {
  status?: JobStatus[];
  foundVia?: FoundViaSource[];
  resumeUsed?: ResumeVariant[];
  search?: string;
  offset?: number;
  limit?: number;
  sortBy?: "appliedAt" | "employer" | "updatedAt" | "createdAt";
  sortDir?: "asc" | "desc";
}

// Any status can transition to any other status (user corrects mistakes)
const ALL_STATUSES: JobStatus[] = [
  "applied", "screening", "technical", "onsite",
  "offer", "accepted", "rejected", "withdrawn", "archived",
];

export const STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = Object.fromEntries(
  ALL_STATUSES.map((s) => [s, ALL_STATUSES.filter((t) => t !== s)]),
) as Record<JobStatus, JobStatus[]>;
