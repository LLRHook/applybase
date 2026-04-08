import { apiFetch, apiPost, apiPatch } from "./client.ts";

export const jobsApi = {
  list: async (params?: Record<string, string>): Promise<{ data: any[]; total: number }> => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`/api/jobs${qs}`, { headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error?.message || "API error");
    return { data: json.data, total: json.meta?.total ?? json.data.length };
  },
  getById: (id: number) => apiFetch<any>(`/jobs/${id}`),
  create: (data: any) => apiPost<any>("/jobs", data),
  update: (id: number, data: any) => apiPatch<any>(`/jobs/${id}`, data),
  delete: (id: number) => apiFetch<void>(`/jobs/${id}`, { method: "DELETE" }),
  scrapeUrl: (url: string) =>
    apiPost<{ title?: string; employer?: string; description?: string; location?: string; salary?: string }>(
      "/jobs/scrape-url",
      { url },
    ),
  renameResume: (from: string, to: string) =>
    apiPost<{ updated: number }>("/jobs/rename-resume", { from, to }),
  resumeCounts: () => apiFetch<Record<string, number>>("/jobs/resume-counts"),
  followUps: () => apiFetch<any[]>("/jobs/follow-ups"),
  markFollowedUp: (id: number) => apiPost<void>(`/jobs/${id}/follow-up`),
};
