import { apiFetch } from "./client.ts";

export const analyticsApi = {
  dashboard: () => apiFetch<any>("/analytics/dashboard"),
  funnel: () => apiFetch<any>("/analytics/funnel"),
  sources: () => apiFetch<any[]>("/analytics/sources"),
  resume: () => apiFetch<any[]>("/analytics/resume"),
  velocity: () => apiFetch<any[]>("/analytics/velocity"),
  activity: () => apiFetch<any[]>("/analytics/activity"),
  heatmap: () => apiFetch<any[]>("/analytics/heatmap"),
};
