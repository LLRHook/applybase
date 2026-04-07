import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { jobsApi } from "../api/jobs.api.ts";
import { apiFetch } from "../api/client.ts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "../components/ui/CompanyLogo.tsx";
import { FOUND_VIA_SOURCES, SOURCE_LABELS, SALARY_CURRENCIES } from "@jobsearch/shared";
import { parseResumeVariants, formatResumeLabel } from "../lib/resume-variants.ts";

const SOURCE_OPTIONS = [
  { value: "", label: "Where did you find this?" },
  ...FOUND_VIA_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] })),
];

export function AddApplication() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
  });
  const resumeVariants = parseResumeVariants(settings);
  const RESUME_OPTIONS = [
    { value: "", label: "Select resume..." },
    ...resumeVariants.map((v) => ({ value: v, label: formatResumeLabel(v) })),
  ];
  const [form, setForm] = useState({
    title: "",
    employer: "",
    jobUrl: "",
    location: "",
    remote: false,
    resumeUsed: "",
    foundVia: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    companyNotes: "",
  });

  const scrapeMutation = useMutation({
    mutationFn: (u: string) => jobsApi.scrapeUrl(u),
    onSuccess: (data) => {
      setForm((prev) => ({
        ...prev,
        jobUrl: url,
        title: data.title || prev.title,
        employer: data.employer || prev.employer,
        location: data.location || prev.location,
      }));
      toast.success("Auto-filled from URL");
    },
    onError: () => {
      toast.error("Failed to scrape URL. Fill in the details manually.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => jobsApi.create(data),
    onSuccess: (job) => {
      toast.success("Application added successfully");
      navigate(`/applications/${job.id}`);
    },
    onError: () => {
      toast.error("Failed to add application");
    },
  });

  const handleScrape = () => {
    if (!url) return;
    scrapeMutation.mutate(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      jobUrl: form.jobUrl || url,
      resumeUsed: form.resumeUsed || undefined,
      foundVia: form.foundVia || undefined,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      salaryCurrency: form.salaryCurrency || undefined,
      remote: form.remote || undefined,
    });
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Add Application</h2>

      {/* URL Scraper */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <label className={labelClass}>Paste Job URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com/careers/senior-engineer"
            className={inputClass}
          />
          <button
            onClick={handleScrape}
            disabled={!url || scrapeMutation.isPending}
            className="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-500 disabled:opacity-50 flex-shrink-0"
          >
            {scrapeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Scrape"}
          </button>
        </div>
        {scrapeMutation.isSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Auto-filled from URL</p>
        )}
      </div>

      {/* Company logo preview after scrape */}
      {scrapeMutation.isSuccess && form.employer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 flex items-center gap-3">
          <CompanyLogo employer={form.employer} url={form.jobUrl || url} />
          {form.title && <span className="text-sm text-gray-500 dark:text-gray-400">- {form.title}</span>}
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Job Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Senior Backend Engineer"
            />
          </div>
          <div>
            <label className={labelClass}>Company *</label>
            <input
              required
              value={form.employer}
              onChange={(e) => setForm({ ...form, employer: e.target.value })}
              className={inputClass}
              placeholder="Stripe"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Job URL *</label>
          <input
            required
            type="url"
            value={form.jobUrl}
            onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              placeholder="Remote, NYC, San Francisco..."
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                className="w-4 h-4"
              />
              Remote
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Resume Used</label>
            <select
              value={form.resumeUsed}
              onChange={(e) => setForm({ ...form, resumeUsed: e.target.value })}
              className={inputClass}
            >
              {RESUME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Found Via</label>
            <select
              value={form.foundVia}
              onChange={(e) => setForm({ ...form, foundVia: e.target.value })}
              className={inputClass}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Salary Min</label>
            <input
              type="number"
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              className={inputClass}
              placeholder="150000"
            />
          </div>
          <div>
            <label className={labelClass}>Salary Max</label>
            <input
              type="number"
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
              className={inputClass}
              placeholder="200000"
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select
              value={form.salaryCurrency}
              onChange={(e) => setForm({ ...form, salaryCurrency: e.target.value })}
              className={inputClass}
            >
              {SALARY_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.companyNotes}
            onChange={(e) => setForm({ ...form, companyNotes: e.target.value })}
            className={inputClass}
            rows={3}
            placeholder="Initial impressions, why this role interests you..."
          />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Adding..." : "Add Application"}
        </button>
      </form>
    </div>
  );
}
