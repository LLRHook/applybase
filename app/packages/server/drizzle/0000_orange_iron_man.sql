CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`employer` text NOT NULL,
	`job_url` text NOT NULL,
	`location` text,
	`salary` text,
	`job_description` text,
	`remote` integer,
	`status` text DEFAULT 'applied' NOT NULL,
	`resume_used` text,
	`found_via` text,
	`salary_min` real,
	`salary_max` real,
	`salary_currency` text,
	`company_notes` text,
	`interview_notes` text,
	`talking_points` text,
	`questions_to_ask` text,
	`offer_amount` real,
	`offer_equity` text,
	`offer_notes` text,
	`negotiation_notes` text,
	`follow_up_date` text,
	`follow_up_done` integer DEFAULT false,
	`applied_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_application_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text DEFAULT 'gmail' NOT NULL,
	`email` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expiry` text,
	`status` text DEFAULT 'disconnected' NOT NULL,
	`last_sync_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_application_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gmail_message_id` text,
	`thread_id` text,
	`from_address` text NOT NULL,
	`subject` text NOT NULL,
	`snippet` text,
	`body` text,
	`received_at` text NOT NULL,
	`classification` text,
	`matched_job_id` integer,
	`confidence` real,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`stage_target` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`matched_job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_application_messages_gmail_message_id_unique` ON `post_application_messages` (`gmail_message_id`);--> statement-breakpoint
CREATE TABLE `profile_personal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_personal_key_unique` ON `profile_personal` (`key`);--> statement-breakpoint
CREATE TABLE `profile_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tier` integer DEFAULT 3 NOT NULL,
	`tagline` text,
	`stack` text,
	`details` text,
	`best_for` text,
	`live_url` text
);
--> statement-breakpoint
CREATE TABLE `profile_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`level` text,
	`evidence` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stage_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`stage` text NOT NULL,
	`outcome` text,
	`notes` text,
	`actor` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `target_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`title_variants` text,
	`why_fit` text,
	`typical_yoe` text,
	`highlights` text,
	`salary_range` text,
	`risk_factors` text
);
--> statement-breakpoint
CREATE TABLE `tracer_click_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tracer_link_id` integer NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`is_bot` integer DEFAULT false,
	`fingerprint` text,
	`clicked_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tracer_link_id`) REFERENCES `tracer_links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tracer_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`job_id` integer,
	`original_url` text NOT NULL,
	`label` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracer_links_token_unique` ON `tracer_links` (`token`);