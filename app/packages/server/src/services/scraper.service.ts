import * as cheerio from "cheerio";

export class ScraperService {
  async scrapeUrl(url: string): Promise<{
    title?: string;
    employer?: string;
    description?: string;
    location?: string;
    salary?: string;
  }> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    let title: string | undefined;
    let employer: string | undefined;
    let location: string | undefined;
    let salary: string | undefined;
    let description: string | undefined;

    // Try JSON-LD structured data first (most reliable)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html() || "";
        const data = JSON.parse(raw);
        const posting =
          data["@type"] === "JobPosting"
            ? data
            : Array.isArray(data["@graph"])
              ? data["@graph"].find((n: any) => n["@type"] === "JobPosting")
              : null;

        if (posting) {
          if (posting.title) title = posting.title;
          if (posting.hiringOrganization?.name)
            employer = posting.hiringOrganization.name;
          if (posting.jobLocation?.address) {
            const addr = posting.jobLocation.address;
            location =
              typeof addr === "string"
                ? addr
                : [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                    .filter(Boolean)
                    .join(", ");
          }
          if (posting.baseSalary?.value) {
            const sv = posting.baseSalary.value;
            salary =
              typeof sv === "object"
                ? `${sv.minValue || ""}-${sv.maxValue || ""} ${posting.baseSalary.currency || ""}`
                : String(sv);
          }
          if (posting.description)
            description = posting.description.replace(/<[^>]*>/g, "").substring(0, 5000);
        }
      } catch {}
    });

    // Fall back to meta tags
    if (!title) {
      title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        $("h1").first().text() ||
        undefined;
    }

    if (!description) {
      description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        undefined;
    }

    // Try to extract company from common patterns
    if (!employer) {
      employer =
        $('meta[property="og:site_name"]').attr("content") || undefined;
    }

    return {
      title: title?.trim()?.substring(0, 300),
      employer: employer?.trim()?.substring(0, 200),
      description: description?.trim()?.substring(0, 5000),
      location: location?.trim(),
      salary: salary?.trim(),
    };
  }
}
