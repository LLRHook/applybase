import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { analyticsApi } from "../api/analytics.api.ts";
import { jobsApi } from "../api/jobs.api.ts";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { relativeDate, shortDate, formatDuration } from "../lib/dates.ts";
import { SkeletonCard } from "../components/ui/Skeleton.tsx";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.dashboard,
  });
  const { data: velocity = [], isLoading: velocityLoading } = useQuery({
    queryKey: ["analytics", "velocity"],
    queryFn: analyticsApi.velocity,
  });
  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["analytics", "activity"],
    queryFn: analyticsApi.activity,
  });
  const { data: followUps = [] } = useQuery({
    queryKey: ["jobs", "follow-ups"],
    queryFn: jobsApi.followUps,
  });

  const markFollowedUp = useMutation({
    mutationFn: (id: number) => jobsApi.markFollowedUp(id),
    onSuccess: () => {
      toast.success("Follow-up marked as done");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => {
      toast.error("Failed to mark follow-up as done");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <button
          onClick={() => navigate("/add")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Application
        </button>
      </div>

      {/* Stat cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Applied This Week" value={metrics?.appliedThisWeek ?? 0} />
          <StatCard label="Total Applied" value={metrics?.totalApplied ?? 0} />
          <StatCard label="Response Rate" value={`${metrics?.responseRate ?? 0}%`} />
          <StatCard label="Avg Response Time" value={formatDuration(metrics?.avgResponseTimeMs ?? 0)} />
          <StatCard label="Active Interviews" value={metrics?.activeInterviews ?? 0} />
          <StatCard label="Offers" value={metrics?.offers ?? 0} />
        </div>
      )}

      {/* Follow-ups due */}
      {followUps.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Bell size={16} className="text-yellow-600 dark:text-yellow-400" />
            Follow-ups Due ({followUps.length})
          </h3>
          <div className="space-y-1">
            {followUps.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center justify-between text-sm">
                <span
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => navigate(`/applications/${job.id}`)}
                >
                  {job.title} @ {job.employer}
                </span>
                <button
                  onClick={() => markFollowedUp.mutate(job.id)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                >
                  Mark Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-3">Weekly Applications</h3>
          {velocityLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full h-full" />
            </div>
          ) : velocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={velocity}>
                <XAxis dataKey="week" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applied" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No data yet. Start adding applications.</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium mb-3">Recent Activity</h3>
          {activityLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-2/3" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-16" />
                </div>
              ))}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {activity.slice(0, 10).map((item: any) => (
                <div key={item.id} className="text-sm flex items-center justify-between">
                  <span
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate"
                    onClick={() => navigate(`/applications/${item.jobId}`)}
                  >
                    {item.employer} — {item.detail}
                  </span>
                  <span
                    className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2"
                    title={shortDate(item.timestamp)}
                  >
                    {relativeDate(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
