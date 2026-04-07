import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "../api/client.ts";
import { toast } from "sonner";

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
  });

  const [followUpDays, setFollowUpDays] = useState("7");
  const [dailyTarget, setDailyTarget] = useState("10");

  useEffect(() => {
    if (settings.follow_up_days) setFollowUpDays(settings.follow_up_days);
    if (settings.daily_application_target) setDailyTarget(settings.daily_application_target);
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
    });
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
