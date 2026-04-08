import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "../api/client.ts";
import { jobsApi } from "../api/jobs.api.ts";
import { toast } from "sonner";
import { Plus, X, Pencil, Check } from "lucide-react";
import { parseResumeVariants, serializeResumeVariants } from "../lib/resume-variants.ts";
import { ResumeBadge } from "../components/ui/ResumeBadge.tsx";

// Each editable variant remembers the name it was loaded with so we can
// detect renames on save and cascade them to existing applications.
// `original === null` means "added in this session, never persisted".
type EditableVariant = { name: string; original: string | null };

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
  });

  const { data: resumeCounts = {} } = useQuery({
    queryKey: ["jobs", "resume-counts"],
    queryFn: () => jobsApi.resumeCounts(),
  });

  const [followUpDays, setFollowUpDays] = useState("7");
  const [dailyTarget, setDailyTarget] = useState("10");
  const [variants, setVariants] = useState<EditableVariant[]>([]);
  const [newVariant, setNewVariant] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  // When the user clicks × on a chip that still has applications using it,
  // stash the pending removal here and render an inline confirmation. null
  // means no pending removal. Confirming commits the removal to local state;
  // the actual save still only happens on Save Settings.
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.follow_up_days) setFollowUpDays(settings.follow_up_days);
    if (settings.daily_application_target) setDailyTarget(settings.daily_application_target);
    setVariants(parseResumeVariants(settings).map((name) => ({ name, original: name })));
  }, [settings]);

  // Auto-focus the inline edit input when entering edit mode
  useEffect(() => {
    if (editingIndex !== null) editInputRef.current?.focus();
  }, [editingIndex]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { settings: Record<string, string>; renames: Array<{ from: string; to: string }> }) => {
      // Cascade renames first so any concurrent reader of /api/settings
      // sees consistent data once the variants list flips to the new names.
      let totalUpdated = 0;
      for (const r of payload.renames) {
        const result = await jobsApi.renameResume(r.from, r.to);
        totalUpdated += result.updated;
      }
      await apiPatch<any>("/settings", payload.settings);
      return { totalUpdated, renames: payload.renames.length };
    },
    onSuccess: ({ totalUpdated, renames }) => {
      if (renames > 0) {
        toast.success(
          `Settings saved · ${renames} variant${renames === 1 ? "" : "s"} renamed (${totalUpdated} application${totalUpdated === 1 ? "" : "s"} updated)`,
        );
      } else {
        toast.success("Settings saved");
      }
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      // invalidateQueries above already matches this via prefix, but being
      // explicit makes the intent obvious and survives future key changes.
      queryClient.invalidateQueries({ queryKey: ["jobs", "resume-counts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  const handleSave = () => {
    // Diff against original names to compute the rename cascade
    const renames = variants
      .filter((v) => v.original !== null && v.original !== v.name)
      .map((v) => ({ from: v.original as string, to: v.name }));

    saveMutation.mutate({
      settings: {
        follow_up_days: followUpDays,
        daily_application_target: dailyTarget,
        resume_variants: serializeResumeVariants(variants.map((v) => v.name)),
      },
      renames,
    });
  };

  const addVariant = () => {
    const v = normalize(newVariant);
    if (!v) return;
    if (variants.some((x) => x.name === v)) {
      toast.error(`"${v}" already exists`);
      return;
    }
    setVariants([...variants, { name: v, original: null }]);
    setNewVariant("");
  };

  const requestRemove = (index: number) => {
    const variant = variants[index];
    // Only count jobs against the ORIGINAL name — an in-session rename
    // hasn't been persisted yet, so any jobs still reference the original.
    const nameOnServer = variant.original ?? variant.name;
    const usage = resumeCounts[nameOnServer] ?? 0;
    if (usage > 0) {
      setPendingRemoveIndex(index);
    } else {
      confirmRemove(index);
    }
  };

  const confirmRemove = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    if (pendingRemoveIndex === index) setPendingRemoveIndex(null);
  };

  const cancelRemove = () => setPendingRemoveIndex(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(variants[index].name);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const next = normalize(editingValue);
    if (!next) {
      toast.error("Resume variant name cannot be empty");
      return;
    }
    if (variants.some((v, i) => i !== editingIndex && v.name === next)) {
      toast.error(`"${next}" already exists`);
      return;
    }
    setVariants(variants.map((v, i) => (i === editingIndex ? { ...v, name: next } : v)));
    setEditingIndex(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
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
            Click a variant's pencil icon to rename it — existing applications using the old name are updated automatically.
          </p>

          {variants.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">No resume variants yet. Add one below.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {variants.map((v, i) => {
                const isEditing = editingIndex === i;
                const isRenamed = v.original !== null && v.original !== v.name;
                const nameOnServer = v.original ?? v.name;
                const usage = resumeCounts[nameOnServer] ?? 0;
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded pr-1"
                  >
                    {isEditing ? (
                      <>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          className="bg-white dark:bg-gray-800 border border-blue-400 rounded px-2 py-0.5 text-xs text-gray-900 dark:text-gray-100 w-32"
                        />
                        <button
                          onClick={commitEdit}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-0.5"
                          aria-label="Save rename"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                          aria-label="Cancel edit"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ResumeBadge resume={v.name} />
                        {usage > 0 && (
                          <span
                            className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums"
                            title={`${usage} application${usage === 1 ? "" : "s"} using this variant`}
                          >
                            {usage}
                          </span>
                        )}
                        {isRenamed && (
                          <span
                            className="text-[10px] text-blue-500 dark:text-blue-400 italic"
                            title={`Originally "${v.original}" — will rename on save`}
                          >
                            renamed
                          </span>
                        )}
                        <button
                          onClick={() => startEdit(i)}
                          className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-0.5"
                          aria-label={`Rename ${v.name}`}
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => requestRemove(i)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
                          aria-label={`Remove ${v.name}`}
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline confirmation when the user tries to remove an in-use variant */}
          {pendingRemoveIndex !== null && variants[pendingRemoveIndex] && (() => {
            const v = variants[pendingRemoveIndex];
            const nameOnServer = v.original ?? v.name;
            const usage = resumeCounts[nameOnServer] ?? 0;
            return (
              <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700/50 rounded-lg p-3 text-sm">
                <p className="text-yellow-900 dark:text-yellow-200 font-medium mb-1">
                  {usage} application{usage === 1 ? "" : "s"} still use{usage === 1 ? "s" : ""} "{nameOnServer}".
                </p>
                <p className="text-yellow-800 dark:text-yellow-300 mb-3">
                  Removing it here keeps those applications tagged with "{nameOnServer}", but the variant disappears from the dropdown going forward. To <strong>rename</strong> the variant and have every application updated automatically, cancel and click the <Pencil size={11} className="inline -mt-0.5" /> pencil icon instead.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmRemove(pendingRemoveIndex!)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                  >
                    Remove anyway
                  </button>
                  <button
                    onClick={cancelRemove}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

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
            <strong>Rename</strong> (pencil icon) cascades to every application using the old name. <strong>Remove</strong> (×) only hides the variant from the dropdown — existing applications keep their value and you'd have to update each one manually.
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
