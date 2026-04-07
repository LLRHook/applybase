import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../api/jobs.api.ts";
import { cn } from "../lib/utils.ts";
import { ExternalLink, Trash2, Archive, CheckCircle, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { relativeDate, shortDate } from "../lib/dates.ts";
import { StatusBadge } from "../components/ui/StatusBadge.tsx";
import { ResumeBadge } from "../components/ui/ResumeBadge.tsx";
import { CompanyLogo } from "../components/ui/CompanyLogo.tsx";
import { SkeletonCard } from "../components/ui/Skeleton.tsx";
import { JOB_STATUSES, FOUND_VIA_SOURCES, SOURCE_LABELS, SALARY_CURRENCIES } from "@jobsearch/shared";
import { apiFetch } from "../api/client.ts";
import { parseResumeVariants, formatResumeLabel } from "../lib/resume-variants.ts";

const TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  JOB_STATUSES.map((s) => [s, JOB_STATUSES.filter((t) => t !== s)]),
);

const TABS = ["Overview", "Notes", "Salary / Offer"];

const SOURCE_OPTIONS = [
  { value: "", label: "None" },
  ...FOUND_VIA_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] })),
];

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Overview");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
  });
  const resumeVariants = parseResumeVariants(settings);
  const RESUME_OPTIONS = [
    { value: "", label: "None" },
    ...resumeVariants.map((v) => ({ value: v, label: formatResumeLabel(v) })),
  ];
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", employer: "", jobUrl: "", location: "", resumeUsed: "", foundVia: "" });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const { data: job, isLoading } = useQuery({
    queryKey: ["jobs", id],
    queryFn: () => jobsApi.getById(Number(id)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => jobsApi.update(Number(id), data),
    onMutate: () => {
      setSaveState("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSaveState("saved");
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: () => {
      setSaveState("idle");
      toast.error("Failed to save changes");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: any) => jobsApi.update(Number(id), data),
    onSuccess: (_, variables) => {
      toast.success(`Status changed to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.delete(Number(id)),
    onSuccess: () => {
      toast.success("Application deleted");
      navigate("/applications");
    },
    onError: () => {
      toast.error("Failed to delete application");
    },
  });

  const handleFieldBlur = useCallback(
    (field: string, value: string | number | null) => {
      if (job && value !== (job as any)[field]) {
        updateMutation.mutate({ [field]: value || null });
      }
    },
    [job, updateMutation],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (!job) return <p className="text-red-500">Application not found.</p>;

  const nextStatuses = TRANSITIONS[job.status] || [];
  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100";

  return (
    <div>
      {/* Header */}
      {editing ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">Edit Application</h3>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Cancel">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Job Title</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Company</label>
              <input
                value={editForm.employer}
                onChange={(e) => setEditForm({ ...editForm, employer: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Job URL</label>
            <input
              type="url"
              value={editForm.jobUrl}
              onChange={(e) => setEditForm({ ...editForm, jobUrl: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
              <input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className={inputClass}
                placeholder="Remote, NYC..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Resume Used</label>
              <select
                value={editForm.resumeUsed}
                onChange={(e) => setEditForm({ ...editForm, resumeUsed: e.target.value })}
                className={inputClass}
              >
                {RESUME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                {/* Preserve a value that was removed from settings so editing doesn't silently drop it */}
                {editForm.resumeUsed && !resumeVariants.includes(editForm.resumeUsed) && (
                  <option value={editForm.resumeUsed}>
                    {formatResumeLabel(editForm.resumeUsed)} (removed)
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Found Via</label>
              <select
                value={editForm.foundVia}
                onChange={(e) => setEditForm({ ...editForm, foundVia: e.target.value })}
                className={inputClass}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                const updates: any = {};
                if (editForm.title !== job.title) updates.title = editForm.title;
                if (editForm.employer !== job.employer) updates.employer = editForm.employer;
                if (editForm.jobUrl !== job.jobUrl) updates.jobUrl = editForm.jobUrl;
                if (editForm.location !== (job.location || "")) updates.location = editForm.location || null;
                if (editForm.resumeUsed !== (job.resumeUsed || "")) updates.resumeUsed = editForm.resumeUsed || null;
                if (editForm.foundVia !== (job.foundVia || "")) updates.foundVia = editForm.foundVia || null;
                if (Object.keys(updates).length > 0) {
                  updateMutation.mutate(updates, { onSuccess: () => { setEditing(false); toast.success("Application updated"); } });
                } else {
                  setEditing(false);
                }
              }}
              disabled={!editForm.title || !editForm.employer || !editForm.jobUrl}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CompanyLogo employer={job.employer} url={job.jobUrl} />
              <h2 className="text-xl font-bold">{job.title}</h2>
              <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => {
                  setEditForm({
                    title: job.title,
                    employer: job.employer,
                    jobUrl: job.jobUrl,
                    location: job.location || "",
                    resumeUsed: job.resumeUsed || "",
                    foundVia: job.foundVia || "",
                  });
                  setEditing(true);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Edit application"
              >
                <Pencil size={14} />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{job.employer} {job.location ? `\u2022 ${job.location}` : ""}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={job.status} />
              <ResumeBadge resume={job.resumeUsed} />
              {job.foundVia && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs dark:text-gray-300">{job.foundVia}</span>}
              {job.appliedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-500" title={shortDate(job.appliedAt)}>
                  Applied {relativeDate(job.appliedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {job.status !== "archived" && (
              <button
                onClick={() => {
                  statusMutation.mutate({ status: "archived" });
                  toast.success("Application archived");
                }}
                className="text-gray-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Archive"
              >
                <Archive size={18} />
              </button>
            )}
            <button
              onClick={() => { if (confirm("Delete this application permanently?")) deleteMutation.mutate(); }}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Status transitions */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 py-1">Move to:</span>
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => statusMutation.mutate({ status: s })}
              className="hover:opacity-80"
            >
              <StatusBadge status={s} className="cursor-pointer border border-transparent hover:border-current" />
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex gap-4 items-center">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-2 text-sm font-medium border-b-2",
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              {tab}
            </button>
          ))}
          {/* Save indicator for Notes tab */}
          {activeTab === "Notes" && saveState !== "idle" && (
            <span className="ml-auto text-xs flex items-center gap-1 text-gray-400 dark:text-gray-500">
              {saveState === "saving" && (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              )}
              {saveState === "saved" && (
                <>
                  <CheckCircle size={12} className="text-green-500" />
                  Saved
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium mb-3">Timeline</h3>
            {job.stageEvents?.length > 0 ? (
              <div className="space-y-2">
                {job.stageEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 text-sm">
                    <StatusBadge status={e.stage} className="w-24 text-center" />
                    <span
                      className="text-gray-400 dark:text-gray-500 text-xs"
                      title={shortDate(e.createdAt)}
                    >
                      {relativeDate(e.createdAt)}
                    </span>
                    {e.notes && <span className="text-gray-500 dark:text-gray-400">&mdash; {e.notes}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No events yet.</p>
            )}
          </div>

          {/* Follow-up */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium mb-2">Follow-up</h3>
            <div className="flex items-center gap-3">
              <input
                type="date"
                defaultValue={job.followUpDate || ""}
                onBlur={(e) => handleFieldBlur("followUpDate", e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
              />
              <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={job.followUpDone || false}
                  onChange={(e) => updateMutation.mutate({ followUpDone: e.target.checked })}
                  className="w-4 h-4"
                />
                Done
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Notes" && (
        <div className="space-y-4">
          {[
            { field: "companyNotes", label: "Company Research" },
            { field: "talkingPoints", label: "Talking Points" },
            { field: "questionsToAsk", label: "Questions to Ask" },
            { field: "interviewNotes", label: "Interview Notes" },
          ].map(({ field, label }) => (
            <div key={field} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <textarea
                defaultValue={(job as any)[field] || ""}
                onBlur={(e) => handleFieldBlur(field, e.target.value)}
                className={inputClass}
                rows={4}
                placeholder={`Add ${label.toLowerCase()}...`}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === "Salary / Offer" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium mb-3">Salary Range</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min</label>
                <input
                  type="number"
                  defaultValue={job.salaryMin || ""}
                  onBlur={(e) => handleFieldBlur("salaryMin", e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max</label>
                <input
                  type="number"
                  defaultValue={job.salaryMax || ""}
                  onBlur={(e) => handleFieldBlur("salaryMax", e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Currency</label>
                <select
                  defaultValue={job.salaryCurrency || "USD"}
                  onChange={(e) => updateMutation.mutate({ salaryCurrency: e.target.value })}
                  className={inputClass}
                >
                  {SALARY_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium mb-3">Offer Details</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Offer Amount</label>
                <input
                  type="number"
                  defaultValue={job.offerAmount || ""}
                  onBlur={(e) => handleFieldBlur("offerAmount", e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Equity</label>
                <input
                  type="text"
                  defaultValue={job.offerEquity || ""}
                  onBlur={(e) => handleFieldBlur("offerEquity", e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 0.1% over 4 years"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Offer Notes</label>
              <textarea
                defaultValue={job.offerNotes || ""}
                onBlur={(e) => handleFieldBlur("offerNotes", e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Negotiation Notes</label>
              <textarea
                defaultValue={job.negotiationNotes || ""}
                onBlur={(e) => handleFieldBlur("negotiationNotes", e.target.value)}
                className={inputClass}
                rows={2}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
