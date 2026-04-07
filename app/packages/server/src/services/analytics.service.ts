import type { DrizzleDB } from "../db/client.js";
import { jobs, stageEvents } from "../db/schema.js";
import type { DashboardMetrics, FunnelData, ResumeEffectiveness, SourceStats, VelocityData, ActivityItem, HeatmapDay } from "@jobsearch/shared";

function startOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().split("T")[0];
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

export class AnalyticsService {
  constructor(private db: DrizzleDB) {}

  async getDashboard(): Promise<DashboardMetrics> {
    const allJobs = await this.db.select().from(jobs);
    const allEvents = await this.db.select().from(stageEvents);
    const weekStart = startOfWeek();

    const totalApplied = allJobs.length;
    const appliedThisWeek = allJobs.filter((j) => j.createdAt >= weekStart).length;

    const progressed = allJobs.filter((j) => j.status !== "applied");
    const responseRate = totalApplied > 0 ? Math.round((progressed.length / totalApplied) * 100) : 0;

    // Average response time: ms between creation and first non-"applied" stage event.
    // Both timestamps come from the same SQLite `datetime('now')` source, so parsing
    // them as JS Dates and subtracting cancels any timezone offset on both sides.
    const responseTimesMs: number[] = [];
    for (const job of progressed) {
      const firstResponse = allEvents
        .filter((e) => e.jobId === job.id && e.stage !== "applied")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (firstResponse) {
        const ms = new Date(firstResponse.createdAt).getTime() - new Date(job.createdAt).getTime();
        responseTimesMs.push(Math.max(0, ms));
      }
    }
    const avgResponseTimeMs = responseTimesMs.length > 0
      ? Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length)
      : 0;

    // "Active interviews" counts jobs in a true interview loop (technical or onsite).
    // Screening is excluded — it's a recruiter phone-screen/resume-review step that
    // happens before actual interviewing begins in most hiring funnels.
    const activeInterviews = allJobs.filter((j) =>
      ["technical", "onsite"].includes(j.status),
    ).length;
    const offers = allJobs.filter((j) => j.status === "offer").length;

    const today = new Date().toISOString().split("T")[0];
    const followUpsDue = allJobs.filter(
      (j) =>
        ["applied", "screening", "technical", "onsite"].includes(j.status) &&
        !j.followUpDone &&
        j.followUpDate &&
        j.followUpDate <= today,
    ).length;

    return { appliedThisWeek, totalApplied, responseRate, avgResponseTimeMs, activeInterviews, offers, followUpsDue };
  }

  async getFunnel(): Promise<FunnelData> {
    const allJobs = await this.db.select().from(jobs);
    const allEvents = await this.db.select().from(stageEvents);

    // Count jobs that reached each stage (via stage events or current status)
    const reached = (stage: string) => {
      const byEvent = new Set(allEvents.filter((e) => e.stage === stage).map((e) => e.jobId));
      const byStatus = allJobs.filter((j) => j.status === stage).map((j) => j.id);
      byStatus.forEach((id) => byEvent.add(id));
      return byEvent.size;
    };

    return {
      applied: allJobs.length,
      screening: reached("screening"),
      technical: reached("technical"),
      onsite: reached("onsite"),
      offer: reached("offer"),
      accepted: reached("accepted"),
    };
  }

  async getResumeEffectiveness(): Promise<ResumeEffectiveness[]> {
    const allJobs = await this.db.select().from(jobs);
    const grouped = new Map<string, { applied: number; responses: number }>();

    for (const job of allJobs) {
      const resume = job.resumeUsed || "unspecified";
      if (!grouped.has(resume)) grouped.set(resume, { applied: 0, responses: 0 });
      const g = grouped.get(resume)!;
      g.applied++;
      if (job.status !== "applied" && job.status !== "rejected" && job.status !== "withdrawn") {
        g.responses++;
      }
    }

    return Array.from(grouped.entries()).map(([resume, data]) => ({
      resume,
      applied: data.applied,
      responses: data.responses,
      responseRate: data.applied > 0 ? Math.round((data.responses / data.applied) * 100) : 0,
    }));
  }

  async getSourceStats(): Promise<SourceStats[]> {
    const allJobs = await this.db.select().from(jobs);
    const grouped = new Map<string, { applied: number; responseCount: number }>();

    for (const job of allJobs) {
      const source = job.foundVia || "unspecified";
      if (!grouped.has(source)) grouped.set(source, { applied: 0, responseCount: 0 });
      const g = grouped.get(source)!;
      g.applied++;
      if (job.status !== "applied" && job.status !== "rejected" && job.status !== "withdrawn") {
        g.responseCount++;
      }
    }

    return Array.from(grouped.entries()).map(([source, data]) => ({
      source,
      applied: data.applied,
      responseCount: data.responseCount,
      responseRate: data.applied > 0 ? Math.round((data.responseCount / data.applied) * 100) : 0,
    }));
  }

  async getVelocity(): Promise<VelocityData[]> {
    const allJobs = await this.db.select().from(jobs);
    if (allJobs.length === 0) return [];

    // Find the earliest application date
    const earliest = allJobs
      .map((j) => j.createdAt)
      .sort()[0];
    const firstWeek = isoWeek(earliest);
    const currentWeek = isoWeek(new Date().toISOString());

    // Generate weeks from first application to now
    const weeks = new Map<string, { applied: number; responses: number }>();
    let cursor = new Date(firstWeek);
    const end = new Date(currentWeek);
    while (cursor <= end) {
      weeks.set(cursor.toISOString().split("T")[0], { applied: 0, responses: 0 });
      cursor.setDate(cursor.getDate() + 7);
    }

    for (const job of allJobs) {
      const week = isoWeek(job.createdAt);
      if (weeks.has(week)) {
        weeks.get(week)!.applied++;
        if (job.status !== "applied") weeks.get(week)!.responses++;
      }
    }

    return Array.from(weeks.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  async getRecentActivity(limit = 20): Promise<ActivityItem[]> {
    const allJobs = await this.db.select().from(jobs);
    const allEvents = await this.db.select().from(stageEvents);

    const jobMap = new Map(allJobs.map((j) => [j.id, j]));
    const items: ActivityItem[] = [];

    for (const event of allEvents) {
      const job = jobMap.get(event.jobId);
      if (!job) continue;
      items.push({
        id: event.id,
        type: event.stage === "applied" ? "applied" : "status_change",
        jobId: event.jobId,
        title: job.title,
        employer: job.employer,
        detail: event.stage === "applied" ? "Application submitted" : `Status → ${event.stage}`,
        timestamp: event.createdAt,
      });
    }

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }

  async getHeatmap(): Promise<HeatmapDay[]> {
    const allJobs = await this.db.select().from(jobs);
    const counts = new Map<string, number>();

    for (const job of allJobs) {
      const date = (job.appliedAt || job.createdAt).split("T")[0];
      counts.set(date, (counts.get(date) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
