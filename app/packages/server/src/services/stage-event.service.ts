import { eq, desc } from "drizzle-orm";
import { stageEvents } from "../db/schema.js";
import type { DrizzleDB } from "../db/client.js";
import type { CreateStageEventInput } from "@jobsearch/shared";
import { AppError } from "../middleware/error-handler.js";

export class StageEventService {
  constructor(private db: DrizzleDB) {}

  async listByJob(jobId: number) {
    return this.db
      .select()
      .from(stageEvents)
      .where(eq(stageEvents.jobId, jobId))
      .orderBy(desc(stageEvents.createdAt));
  }

  async create(input: CreateStageEventInput) {
    const [event] = await this.db
      .insert(stageEvents)
      .values({
        jobId: input.jobId,
        stage: input.stage,
        outcome: input.outcome,
        notes: input.notes,
        actor: input.actor || "user",
      })
      .returning();

    if (!event) throw new AppError(500, "Failed to create stage event");
    return event;
  }
}
