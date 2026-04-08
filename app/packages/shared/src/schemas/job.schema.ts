import { z } from "zod";
import { JOB_STATUSES, FOUND_VIA_SOURCES, SALARY_CURRENCIES } from "../types/job.js";

export const createJobInputSchema = z.object({
  title: z.string().min(1),
  employer: z.string().min(1),
  jobUrl: z.string().url(),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobDescription: z.string().optional(),
  remote: z.boolean().optional(),
  resumeUsed: z.string().min(1).optional(),
  foundVia: z.enum(FOUND_VIA_SOURCES).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.enum(SALARY_CURRENCIES).optional(),
  companyNotes: z.string().optional(),
});

export const jobFiltersSchema = z.object({
  status: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",") : v),
    z.array(z.enum(JOB_STATUSES)).optional(),
  ),
  foundVia: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",") : v),
    z.array(z.enum(FOUND_VIA_SOURCES)).optional(),
  ),
  resumeUsed: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",") : v),
    z.array(z.string().min(1)).optional(),
  ),
  search: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(500).default(20),
  sortBy: z
    .enum(["appliedAt", "employer", "updatedAt", "createdAt"])
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const updateJobSchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  title: z.string().min(1).optional(),
  employer: z.string().min(1).optional(),
  jobUrl: z.string().url().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  jobDescription: z.string().nullable().optional(),
  remote: z.boolean().optional(),
  resumeUsed: z.string().min(1).nullable().optional(),
  foundVia: z.enum(FOUND_VIA_SOURCES).nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.enum(SALARY_CURRENCIES).nullable().optional(),
  companyNotes: z.string().nullable().optional(),
  interviewNotes: z.string().nullable().optional(),
  talkingPoints: z.string().nullable().optional(),
  questionsToAsk: z.string().nullable().optional(),
  offerAmount: z.number().nullable().optional(),
  offerEquity: z.string().nullable().optional(),
  offerNotes: z.string().nullable().optional(),
  negotiationNotes: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  followUpDone: z.boolean().optional(),
});

export const scrapeUrlSchema = z.object({
  url: z.string().url(),
});

export const checkDuplicateSchema = z.object({
  jobUrl: z.string().url().optional(),
  title: z.string().optional(),
  employer: z.string().optional(),
});

export const renameResumeVariantSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export const createStageEventSchema = z.object({
  stage: z.string().min(1),
  outcome: z.enum(["pending", "passed", "failed", "withdrawn", "offer_accepted", "offer_declined", "ghosted"]).optional(),
  notes: z.string().optional(),
  actor: z.enum(["user", "system", "email_auto"]).optional(),
});

export const updateSettingsSchema = z.record(z.string(), z.string());

export const createTracerLinkSchema = z.object({
  jobId: z.number(),
  originalUrl: z.string().url(),
  label: z.string().optional(),
});
