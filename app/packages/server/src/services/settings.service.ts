import { eq } from "drizzle-orm";
import { settings } from "../db/schema.js";
import type { DrizzleDB } from "../db/client.js";

export class SettingsService {
  constructor(private db: DrizzleDB) {}

  async get(key: string): Promise<string | null> {
    const rows = await this.db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return rows[0]?.value ?? null;
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.select().from(settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async set(key: string, value: string): Promise<void> {
    await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date().toISOString() },
      });
  }

  async setMany(entries: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      await this.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.db.delete(settings).where(eq(settings.key, key));
  }
}
