import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { jobsApi } from "../api/jobs.api.ts";
import { cn } from "../lib/utils.ts";
import { ExternalLink, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { relativeDate, shortDate } from "../lib/dates.ts";
import { StatusBadge } from "../components/ui/StatusBadge.tsx";
import { ResumeBadge } from "../components/ui/ResumeBadge.tsx";
import { CompanyLogo } from "../components/ui/CompanyLogo.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { SkeletonRow } from "../components/ui/Skeleton.tsx";
import { JOB_STATUSES } from "@jobsearch/shared";

const ALL_STATUSES = JOB_STATUSES;
const PAGE_SIZE = 50;

type SortKey = "title" | "employer" | "status" | "resumeUsed" | "foundVia" | "appliedAt";
type SortDir = "asc" | "desc";

export function Applications() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("appliedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [statusDropdownId, setStatusDropdownId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, search]);

  const queryClient = useQueryClient();

  // Close status dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobsApi.delete(id),
    onSuccess: () => {
      toast.success("Application deleted");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => {
      toast.error("Failed to delete application");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => jobsApi.update(id, data),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setStatusDropdownId(null);
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => jobsApi.delete(id)));
    },
    onSuccess: () => {
      toast.success(`${selected.size} application(s) deleted`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => {
      toast.error("Failed to delete some applications");
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => jobsApi.update(id, { status: "archived" })));
    },
    onSuccess: () => {
      toast.success(`${selected.size} application(s) archived`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: () => {
      toast.error("Failed to archive some applications");
    },
  });

  const handleDelete = (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${title}"?`)) deleteMutation.mutate(id);
  };

  const params: Record<string, string> = {
    limit: String(PAGE_SIZE),
    offset: String(page * PAGE_SIZE),
    sortBy: "createdAt",
    sortDir: "desc",
  };
  if (statusFilter && statusFilter !== "all") {
    params.status = statusFilter;
  } else if (!statusFilter) {
    params.status = "applied,screening,technical,onsite,offer,accepted,rejected,withdrawn";
  }
  if (search) params.search = search;

  const { data: result, isLoading } = useQuery({
    queryKey: ["jobs", "list", statusFilter, search, page],
    queryFn: () => jobsApi.list(params),
  });
  const jobs = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Client-side sort
  const sortedJobs = [...jobs].sort((a: any, b: any) => {
    let aVal = a[sortKey] ?? "";
    let bVal = b[sortKey] ?? "";
    if (sortKey === "appliedAt") {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selected.size === sortedJobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedJobs.map((j: any) => j.id)));
    }
  };

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const active = sortKey === sortKeyName;
    return (
      <th
        className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
        onClick={() => handleSort(sortKeyName)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </span>
      </th>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Applications ({total})</h2>
        <button
          onClick={() => navigate("/add")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Active</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="technical">Technical</option>
          <option value="onsite">Onsite</option>
          <option value="offer">Offer</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="archived">Archived</option>
          <option value="all">All (incl. archived)</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or company..."
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm flex-1 bg-white dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : sortedJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description='Click "Add" to log your first job application and start tracking your progress.'
          action="+ Add Application"
          onAction={() => navigate("/add")}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === sortedJobs.length && sortedJobs.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <SortHeader label="Role" sortKeyName="title" />
                  <SortHeader label="Company" sortKeyName="employer" />
                  <SortHeader label="Status" sortKeyName="status" />
                  <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Resume</th>
                  <SortHeader label="Source" sortKeyName="foundVia" />
                  <SortHeader label="Applied" sortKeyName="appliedAt" />
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job: any) => (
                  <tr
                    key={job.id}
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                      selected.has(job.id) && "bg-blue-50 dark:bg-blue-900/20",
                    )}
                    onClick={() => navigate(`/applications/${job.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{job.title}</span>
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <CompanyLogo employer={job.employer} url={job.jobUrl} />
                    </td>
                    <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setStatusDropdownId(statusDropdownId === job.id ? null : job.id)}>
                        <StatusBadge status={job.status} className="cursor-pointer hover:opacity-80" />
                      </button>
                      {statusDropdownId === job.id && (
                        <div
                          ref={dropdownRef}
                          className="absolute z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]"
                        >
                          {ALL_STATUSES.filter((s) => s !== job.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateMutation.mutate({ id: job.id, data: { status: s } })}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <StatusBadge status={s} />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ResumeBadge resume={job.resumeUsed} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{job.foundVia || "\u2014"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {job.appliedAt ? (
                        <span title={shortDate(job.appliedAt)}>{relativeDate(job.appliedAt)}</span>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, job.id, job.title)}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Floating bulk action bar */}
          {selected.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl px-6 py-3 flex items-center gap-4 z-30">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <button
                onClick={() => {
                  if (confirm(`Archive ${selected.size} application(s)?`))
                    bulkArchiveMutation.mutate(Array.from(selected));
                }}
                className="px-3 py-1.5 bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 rounded text-sm"
              >
                Archive
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selected.size} application(s) permanently?`))
                    bulkDeleteMutation.mutate(Array.from(selected));
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
