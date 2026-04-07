export interface DashboardMetrics {
  appliedThisWeek: number;
  totalApplied: number;
  responseRate: number;
  /** Average time from application to first response, in milliseconds (0 if no responses yet). */
  avgResponseTimeMs: number;
  activeInterviews: number;
  offers: number;
  followUpsDue: number;
}

export interface FunnelData {
  applied: number;
  screening: number;
  technical: number;
  onsite: number;
  offer: number;
  accepted: number;
}

export interface ResumeEffectiveness {
  resume: string;
  applied: number;
  responses: number;
  responseRate: number;
}

export interface SourceStats {
  source: string;
  applied: number;
  responseCount: number;
  responseRate: number;
}

export interface VelocityData {
  week: string;
  applied: number;
  responses: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface ActivityItem {
  id: number;
  type: "applied" | "status_change" | "email" | "follow_up";
  jobId: number;
  title: string;
  employer: string;
  detail: string;
  timestamp: string;
}
