import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  employer: text("employer").notNull(),
  jobUrl: text("job_url").notNull(),
  location: text("location"),
  salary: text("salary"),
  jobDescription: text("job_description"),
  remote: integer("remote", { mode: "boolean" }),
  status: text("status").notNull().default("applied"),
  resumeUsed: text("resume_used"),
  foundVia: text("found_via"),
  salaryMin: real("salary_min"),
  salaryMax: real("salary_max"),
  salaryCurrency: text("salary_currency"),
  companyNotes: text("company_notes"),
  interviewNotes: text("interview_notes"),
  talkingPoints: text("talking_points"),
  questionsToAsk: text("questions_to_ask"),
  offerAmount: real("offer_amount"),
  offerEquity: text("offer_equity"),
  offerNotes: text("offer_notes"),
  negotiationNotes: text("negotiation_notes"),
  followUpDate: text("follow_up_date"),
  followUpDone: integer("follow_up_done", { mode: "boolean" }).default(false),
  appliedAt: text("applied_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_jobs_created_at").on(table.createdAt),
  index("idx_jobs_applied_at").on(table.appliedAt),
  index("idx_jobs_status").on(table.status),
]);
