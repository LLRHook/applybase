CREATE INDEX `idx_jobs_created_at` ON `jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_applied_at` ON `jobs` (`applied_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_stage_events_job_id` ON `stage_events` (`job_id`);