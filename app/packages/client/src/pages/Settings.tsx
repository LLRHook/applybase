import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "../api/client.ts";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { parseResumeVariants, serializeResumeVariants } from "../lib/resume-variants.ts";
import { ResumeBadge } from "../components/ui/ResumeBadge.tsx";

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
  });

  const [followUpDays, setFollowUpDays] = useState("7");
  const [dailyTarget, setDailyTarget] = useState("10");
  const [resumeVariants, setResumeVariants] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState("");

  useEffect(() => {
    if (settings.follow_up_days) setFollowUpDays(settings.follow_up_days);
    if (settings.daily_application_target) setDailyTarget(settings.daily_application_target);
    setResumeVariants(parseResumeVariants(settings));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiPatch<any>("/settings", data),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      follow_up_days: followUpDays,
      daily_application_target: dailyTarget,
      resume_variants: serializeResumeVariants(resumeVariants),
    });
  };

  const addVariant = () => {
    const v = newVariant.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    if (resumeVariants.includes(v)) {
      toast.error(`"${v}" already exists`);
      return;
    }
    setResumeVariants([...resumeVariants, v]);
    setNewVariant("");
  };

  const removeVariant = (v: string) => {
    setResumeVariants(resumeVariants.filter((x) => x !== v));
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-3">Follow-up Period</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Days after applying before a follow-up reminder appears.</p>
          <input
            type="number"
            value={followUpDays}
            onChange={(e) => setFollowUpDays(e.target.value)}
            className="w-24 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">days</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-3">Daily Application Target</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your goal for applications per day.</p>
          <input
            type="number"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
            className="w-24 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">per day</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-1">Resume Variants</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            The categories you can pick from when logging an application. These
            should match the resume PDFs you've built in <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded">resume/</code>.
          </p>

          {resumeVariants.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">No resume variants yet. Add one below.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {resumeVariants.map((v) => (
                <div
                  key={v}
                  className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded pr-1"
                >
                  <ResumeBadge resume={v} />
                  <button
                    onClick={() => removeVariant(v)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
                    aria-label={`Remove ${v}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVariant();
                }
              }}
              placeholder="e.g. data-engineering"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={addVariant}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Removing a variant won't change applications that already use it — it just hides it from the dropdown going forward.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
