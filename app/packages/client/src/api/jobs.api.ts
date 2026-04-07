import { apiFetch, apiPost, apiPatch } from "./client.ts";

export const jobsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<any[]>(`/jobs${qs}`);
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
  followUps: () => apiFetch<any[]>("/jobs/follow-ups"),
  markFollowedUp: (id: number) => apiPost<void>(`/jobs/${id}/follow-up`),
};
