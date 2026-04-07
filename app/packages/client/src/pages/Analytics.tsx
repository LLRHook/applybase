import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api.ts";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { formatDuration } from "../lib/dates.ts";

/* ── colour tokens ── */
const FUNNEL_COLORS = ["#3b82f6", "#eab308", "#a855f7", "#6366f1", "#22c55e", "#10b981"];
const RADIAL_COLORS = ["#3b82f6", "#a855f7", "#f97316", "#22c55e", "#6b7280"];
/* ── tiny reusable bits ── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{children}</h3>;
}

function MiniSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={data.slice(-8)}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ProgressRing({ value, size = 40, stroke = 4, color = "#3b82f6" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-200 dark:text-gray-700" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700/50">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name || p.dataKey}: {p.value}</p>
      ))}
    </div>
  );
}

/* ── main page ── */
export function Analytics() {
  const { data: metrics } = useQuery({ queryKey: ["analytics", "dashboard"], queryFn: analyticsApi.dashboard });
  const { data: funnel } = useQuery({ queryKey: ["analytics", "funnel"], queryFn: analyticsApi.funnel });
  const { data: resume = [] } = useQuery({ queryKey: ["analytics", "resume"], queryFn: analyticsApi.resume });
  const { data: sources = [] } = useQuery({ queryKey: ["analytics", "sources"], queryFn: analyticsApi.sources });
  const { data: velocity = [] } = useQuery({ queryKey: ["analytics", "velocity"], queryFn: analyticsApi.velocity });
  const { data: heatmap = [] } = useQuery({ queryKey: ["analytics", "heatmap"], queryFn: analyticsApi.heatmap });

  /* derived data */
  const funnelData = funnel
    ? [
        { name: "Applied", value: funnel.applied, fill: FUNNEL_COLORS[0] },
        { name: "Screening", value: funnel.screening, fill: FUNNEL_COLORS[1] },
        { name: "Technical", value: funnel.technical, fill: FUNNEL_COLORS[2] },
        { name: "Onsite", value: funnel.onsite, fill: FUNNEL_COLORS[3] },
        { name: "Offer", value: funnel.offer, fill: FUNNEL_COLORS[4] },
        { name: "Accepted", value: funnel.accepted, fill: FUNNEL_COLORS[5] },
      ]
    : [];

  const interviewConversion = metrics && metrics.totalApplied > 0
    ? Math.round((metrics.activeInterviews / metrics.totalApplied) * 100)
    : 0;

  const sortedSources = [...sources].sort((a: any, b: any) => b.responseRate - a.responseRate);

  const radialData = resume.map((r: any, i: number) => ({
    name: r.resume,
    value: r.responseRate,
    fill: RADIAL_COLORS[i % RADIAL_COLORS.length],
  }));

  /* heatmap dates */
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Analytics</h2>

      {/* ═══ ROW 1: Hero KPI Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Applied</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{metrics?.totalApplied ?? "—"}</span>
            <MiniSparkline data={velocity} dataKey="applied" color="#3b82f6" />
          </div>
        </Card>

        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Response Rate</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{metrics?.responseRate ?? 0}%</span>
            <ProgressRing value={metrics?.responseRate ?? 0} color="#3b82f6" />
          </div>
        </Card>

        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Interview Rate</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{interviewConversion}%</span>
            <ProgressRing value={interviewConversion} color="#a855f7" />
          </div>
        </Card>

        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Response</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{formatDuration(metrics?.avgResponseTimeMs ?? 0)}</span>
          </div>
        </Card>

        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Pipeline</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{(metrics?.activeInterviews ?? 0) + (metrics?.offers ?? 0)}</span>
            <div className="flex gap-1 mb-1">
              {(metrics?.activeInterviews ?? 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {metrics?.activeInterviews} interview{(metrics?.activeInterviews ?? 0) !== 1 ? "s" : ""}
                </span>
              )}
              {(metrics?.offers ?? 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {metrics?.offers} offer{(metrics?.offers ?? 0) !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ ROW 2: Funnel (full width) ═══ */}
      <Card className="mb-6">
        <SectionTitle>Application Funnel</SectionTitle>
        {funnelData.length > 0 && funnelData[0].value > 0 ? (
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={220}>
                <FunnelChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive animationDuration={800}>
                    <LabelList dataKey="name" position="right" fill="#9ca3af" fontSize={12} />
                    <LabelList dataKey="value" position="center" fill="#fff" fontSize={13} fontWeight={600} />
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            {/* Conversion rates between stages */}
            <div className="hidden lg:flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-[140px]">
              {funnelData.slice(0, -1).map((stage, i) => {
                const next = funnelData[i + 1];
                const rate = stage.value > 0 ? Math.round((next.value / stage.value) * 100) : 0;
                return (
                  <div key={stage.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: next.fill }} />
                    <span>{stage.name} → {next.name}:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No application data yet</p>
        )}
      </Card>

      {/* ═══ ROW 3: Velocity + Sources ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Velocity — gradient area chart */}
        <Card>
          <SectionTitle>Weekly Velocity</SectionTitle>
          {velocity.length > 0 && velocity.some((v: any) => v.applied > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={velocity}>
                <defs>
                  <linearGradient id="gradApplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applied" stroke="#3b82f6" strokeWidth={2} fill="url(#gradApplied)" name="Applied" />
                <Area type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} fill="url(#gradResponses)" name="Responses" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No velocity data yet</p>
          )}
        </Card>

        {/* Sources — horizontal bar chart */}
        <Card>
          <SectionTitle>Source Performance</SectionTitle>
          {sortedSources.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sortedSources} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="source" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="applied" fill="#93c5fd" name="Applied" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="responseCount" fill="#3b82f6" name="Responses" radius={[0, 4, 4, 0]} barSize={14}>
                  <LabelList
                    formatter={(v: number, entry: any) => {
                      const src = sortedSources.find((s: any) => s.responseCount === v);
                      return src ? `${src.responseRate}%` : "";
                    }}
                    position="right"
                    fill="#9ca3af"
                    fontSize={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No source data yet</p>
          )}
        </Card>
      </div>

      {/* ═══ ROW 4: Resume Effectiveness + Activity Heatmap ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume — radial bar chart */}
        <Card>
          <SectionTitle>Resume Effectiveness</SectionTitle>
          {radialData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart innerRadius="20%" outerRadius="90%" data={radialData} startAngle={180} endAngle={-180}>
                  <RadialBar
                    background={{ fill: "rgba(107,114,128,0.15)" }}
                    dataKey="value"
                    cornerRadius={6}
                    animationDuration={800}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700/50">
                          <p className="font-medium">{d.name}</p>
                          <p>Response rate: {d.value}%</p>
                        </div>
                      );
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-col gap-2 min-w-[100px]">
                {radialData.map((d: any) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-gray-600 dark:text-gray-300 truncate">{d.name}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No resume data yet</p>
          )}
        </Card>

        {/* Activity heatmap */}
        <Card>
          <SectionTitle>Application Activity</SectionTitle>
          <div className="analytics-heatmap">
            <CalendarHeatmap
              startDate={yearAgo}
              endDate={today}
              values={heatmap}
              classForValue={(value: any) => {
                if (!value || value.count === 0) return "hm-empty";
                if (value.count === 1) return "hm-1";
                if (value.count === 2) return "hm-2";
                if (value.count <= 4) return "hm-3";
                return "hm-4";
              }}
              titleForValue={(value: any) =>
                value && value.date ? `${value.date}: ${value.count} application${value.count !== 1 ? "s" : ""}` : "No applications"
              }
              showWeekdayLabels
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
