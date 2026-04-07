import { DEFAULT_RESUME_VARIANTS } from "@jobsearch/shared";

// The list of resume variants is stored in the settings KV table under
// key "resume_variants" as a JSON-encoded string[]. This helper hides
// the (de)serialization and falls back to the shipped defaults when the
// user hasn't customized anything yet.

export function parseResumeVariants(settings: Record<string, string> | undefined): string[] {
  const raw = settings?.resume_variants;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        return parsed;
      }
    } catch {
      // fall through to defaults
    }
  }
  return [...DEFAULT_RESUME_VARIANTS];
}

export function serializeResumeVariants(variants: string[]): string {
  return JSON.stringify(variants);
}

export function formatResumeLabel(variant: string): string {
  return variant
    .split(/[-_\s]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}
