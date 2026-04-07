import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import type { DrizzleDB } from "../db/client.js";
import { tracerLinks, tracerClickEvents } from "../db/schema.js";
import { getConfig } from "../lib/config.js";

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /facebookexternalhit/i,
  /linkedinbot/i, /twitterbot/i, /googlebot/i, /bingbot/i,
];

export class TracerService {
  constructor(private db: DrizzleDB) {}

  async generateLink(jobId: number, originalUrl: string, label?: string) {
    const token = nanoid(12);
    const [link] = await this.db
      .insert(tracerLinks)
      .values({ token, jobId, originalUrl, label })
      .returning();
    return {
      token,
      trackingUrl: `${getConfig().baseUrl}/t/${token}`,
      originalUrl,
    };
  }

  async handleClick(token: string, ip: string, userAgent: string) {
    const [link] = await this.db
      .select()
      .from(tracerLinks)
      .where(eq(tracerLinks.token, token));

    if (!link) return null;

    const isBot = BOT_PATTERNS.some((p) => p.test(userAgent));
    const dayBucket = new Date().toISOString().split("T")[0];
    const ipPrefix = ip.split(".").slice(0, 3).join(".");
    const fingerprint = createHash("sha256")
      .update(`${ipPrefix}|${userAgent}|${dayBucket}`)
      .digest("hex")
      .substring(0, 16);

    const ipHash = createHash("sha256").update(ipPrefix).digest("hex").substring(0, 16);

    await this.db.insert(tracerClickEvents).values({
      tracerLinkId: link.id,
      ipHash,
      userAgent: userAgent.substring(0, 500),
      isBot,
      fingerprint,
    });

    return link.originalUrl;
  }

  async getClicksByJob(jobId: number) {
    const links = await this.db
      .select()
      .from(tracerLinks)
      .where(eq(tracerLinks.jobId, jobId));

    const result = [];
    for (const link of links) {
      const clicks = await this.db
        .select()
        .from(tracerClickEvents)
        .where(eq(tracerClickEvents.tracerLinkId, link.id));

      result.push({
        ...link,
        totalClicks: clicks.length,
        humanClicks: clicks.filter((c) => !c.isBot).length,
        uniqueFingerprints: new Set(clicks.map((c) => c.fingerprint)).size,
      });
    }

    return result;
  }
}
