import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { jobs } from "./jobs.js";

export const tracerLinks = sqliteTable("tracer_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  jobId: integer("job_id").references(() => jobs.id),
  originalUrl: text("original_url").notNull(),
  label: text("label"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tracerClickEvents = sqliteTable("tracer_click_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tracerLinkId: integer("tracer_link_id")
    .notNull()
    .references(() => tracerLinks.id, { onDelete: "cascade" }),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  isBot: integer("is_bot", { mode: "boolean" }).default(false),
  fingerprint: text("fingerprint"),
  clickedAt: text("clicked_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
