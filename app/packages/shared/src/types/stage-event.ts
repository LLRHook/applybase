export const APPLICATION_STAGES = [
  "applied",
  "recruiter_screen",
  "assessment",
  "technical_interview",
  "onsite",
  "offer",
  "closed",
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const APPLICATION_OUTCOMES = [
  "pending",
  "passed",
  "failed",
  "withdrawn",
  "offer_accepted",
  "offer_declined",
  "ghosted",
] as const;
export type ApplicationOutcome = (typeof APPLICATION_OUTCOMES)[number];

export const STAGE_ACTORS = ["user", "system", "email_auto"] as const;
export type StageActor = (typeof STAGE_ACTORS)[number];

export interface StageEvent {
  id: number;
  jobId: number;
  stage: ApplicationStage;
  outcome?: ApplicationOutcome;
  notes?: string;
  actor: StageActor;
  createdAt: string;
}

export interface CreateStageEventInput {
  jobId: number;
  stage: ApplicationStage;
  outcome?: ApplicationOutcome;
  notes?: string;
  actor?: StageActor;
}
