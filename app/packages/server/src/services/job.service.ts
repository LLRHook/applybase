import { eq, and, like, or, desc, asc, inArray, lte, sql } from "drizzle-orm";
import { jobs, stageEvents } from "../db/schema.js";
import type { DrizzleDB } from "../db/client.js";
import type { JobStatus, JobFilters, CreateJobInput } from "@jobsearch/shared";
import { STATUS_TRANSITIONS } from "@jobsearch/shared";
import { AppError } from "../middleware/error-handler.js";

export class JobService {
  constructor(private db: DrizzleDB) {}

  async create(input: CreateJobInput) {
    const now = new Date().toISOString();
    const [inserted] = await this.db
      .insert(jobs)
      .values({
        ...input,
        status: "applied",
        appliedAt: now,
      })
      .returning();

    // Auto-create "applied" stage event
    await this.db.insert(stageEvents).values({
      jobId: inserted.id,
      stage: "applied",
      outcome: "pending",
      actor: "user",
    });

    return inserted;
  }

  async list(filters: JobFilters) {
    const conditions = [];

    if (filters.status?.length) {
      conditions.push(inArray(jobs.status, filters.status));
    }
    if (filters.foundVia?.length) {
      conditions.push(inArray(jobs.foundVia, filters.foundVia));
    }
    if (filters.resumeUsed?.length) {
      conditions.push(inArray(jobs.resumeUsed, filters.resumeUsed));
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(like(jobs.title, term), like(jobs.employer, term)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn =
      filters.sortBy === "employer"
        ? jobs.employer
        : filters.sortBy === "appliedAt"
          ? jobs.appliedAt
          : filters.sortBy === "updatedAt"
            ? jobs.updatedAt
            : jobs.createdAt;

    const orderFn = filters.sortDir === "asc" ? asc : desc;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(filters.limit ?? 20)
        .offset(filters.offset ?? 0),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(where),
    ]);

    return { jobs: rows, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) throw new AppError(404, "Job not found");

    const events = await this.db
      .select()
      .from(stageEvents)
      .where(eq(stageEvents.jobId, id))
      .orderBy(desc(stageEvents.createdAt));

    return { ...job, stageEvents: events };
  }

  async update(id: number, data: Record<string, unknown>) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) throw new AppError(404, "Job not found");

    const { status, ...rest } = data;

    // Handle status transition
    if (status && status !== job.status) {
      const allowed = STATUS_TRANSITIONS[job.status as JobStatus];
      if (!allowed?.includes(status as JobStatus)) {
        throw new AppError(
          400,
          `Cannot transition from '${job.status}' to '${status}'`,
          "INVALID_TRANSITION",
        );
      }
    }

    await this.db.transaction(async (tx) => {
      if (status && status !== job.status) {
        await tx.insert(stageEvents).values({
          jobId: id,
          stage: status as string,
          outcome: "pending",
          actor: "user",
        });
      }

      await tx
        .update(jobs)
        .set({
          ...rest,
          ...(status ? { status: status as string } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(jobs.id, id));
    });

    const [updated] = await this.db.select().from(jobs).where(eq(jobs.id, id));
    return updated;
  }

  async delete(id: number) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) throw new AppError(404, "Job not found");

    await this.db.delete(stageEvents).where(eq(stageEvents.jobId, id));
    await this.db.delete(jobs).where(eq(jobs.id, id));
  }

  async getFollowUps() {
    const today = new Date().toISOString().split("T")[0];
    const activeStatuses = ["applied", "screening", "technical", "onsite"];

    const allJobs = await this.db.select().from(jobs);
    return allJobs.filter(
      (j) =>
        activeStatuses.includes(j.status) &&
        !j.followUpDone &&
        j.followUpDate &&
        j.followUpDate <= today,
    );
  }

  async markFollowedUp(id: number) {
    await this.db
      .update(jobs)
      .set({ followUpDone: true, updatedAt: new Date().toISOString() })
      .where(eq(jobs.id, id));
  }

  async checkDuplicate(input: { jobUrl?: string; title?: string; employer?: string }) {
    if (input.jobUrl) {
      const byUrl = await this.db
        .select()
        .from(jobs)
        .where(eq(jobs.jobUrl, input.jobUrl));
      if (byUrl.length > 0) return byUrl[0];
    }
    if (input.title && input.employer) {
      const byName = await this.db
        .select()
        .from(jobs)
        .where(and(eq(jobs.employer, input.employer), eq(jobs.title, input.title)));
      if (byName.length > 0) return byName[0];
    }
    return null;
  }
}
