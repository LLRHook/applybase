import type { FoundViaSource } from "../types/job.js";

export const SOURCE_LABELS: Record<FoundViaSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  wellfound: "Wellfound",
  hackernews: "Hacker News",
  company_site: "Company Site",
  referral: "Referral",
  other: "Other",
};
