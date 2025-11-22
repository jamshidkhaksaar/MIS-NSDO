import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  MapPin,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";

import { cn } from "@/lib/utils";
import type { DashboardOverviewStats } from "@/lib/api/dashboard-v2";
import {
  ALL_SECTOR_KEY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META
} from "@/lib/dashboard-data";
import AfghanistanMap from "@/ui/AfghanistanMap";

const STATUS_COLORS = ["#10b981", "#3b82f6", "#94a3b8"];
const BENEFICIARY_COLORS = ["#0f766e", "#10b981", "#22c55e", "#67e8f9", "#38bdf8", "#a5b4fc", "#fbbf24", "#f97316"];

type OverviewSectionProps = {
    year?: number;
    province?: string;
    sector?: string;
};

function fetchOverview(year?: number, province?: string, sector?: string) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (province) params.append("province", province);
  if (sector) params.append("sector", sector);

  return fetch(`/api/v2/dashboard/overview?${params.toString()}`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<DashboardOverviewStats>;
  });
}

export default function OverviewSection({ year, province, sector }: OverviewSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "overview", year, province, sector],
    queryFn: () => fetchOverview(year, province, sector),
    placeholderData: keepPreviousData
  });

  const provinceData = useMemo(() => {
    const map: Record<string, { projects: string[] }> = {};
    if (data?.projects) {
        data.projects.forEach(p => {
            p.province.forEach(prov => {
                if (!map[prov]) map[prov] = { projects: [] };
                if (!map[prov].projects.includes(p.name)) {
                    map[prov].projects.push(p.name);
                }
            });
        });
    }
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-gray-500">
        Failed to load overview data.
      </div>
    );
  }

  const projectStatusData = [
      { name: 'Active', value: data.projectStatusCounts.active, fill: STATUS_COLORS[0] },
      { name: 'Ongoing', value: data.projectStatusCounts.ongoing, fill: STATUS_COLORS[1] },
      { name: 'Completed', value: data.projectStatusCounts.completed, fill: STATUS_COLORS[2] },
  ].filter(d => d.value > 0); // Filter out zero values for cleaner pie chart

  const chartData = Object.entries(data.sectors)
    .filter(([key, details]) => key !== "All Sectors" && details.projects > 0)
    .map(([key, details]) => ({
      name: key,
      projects: details.projects,
      // Using projects count for bar chart mainly
    }))
    .sort((a, b) => b.projects - a.projects);

  const aggregate = data.sectors[ALL_SECTOR_KEY] ?? Object.values(data.sectors)[0];
  const beneficiaries =
    aggregate?.beneficiaries ??
    BENEFICIARY_TYPE_KEYS.reduce(
      (acc, key) => {
        acc.direct[key] = 0;
        acc.indirect[key] = 0;
        acc.include[key] = false;
        return acc;
      },
      {
        direct: {} as Record<(typeof BENEFICIARY_TYPE_KEYS)[number], number>,
        indirect: {} as Record<(typeof BENEFICIARY_TYPE_KEYS)[number], number>,
        include: {} as Record<(typeof BENEFICIARY_TYPE_KEYS)[number], boolean>
      }
    );

  const directTotal = BENEFICIARY_TYPE_KEYS.reduce((sum, key) => {
    if (beneficiaries.include[key]) {
      return sum + beneficiaries.direct[key];
    }
    return sum;
  }, 0);

  const indirectTotal = BENEFICIARY_TYPE_KEYS.reduce((sum, key) => {
    if (beneficiaries.include[key]) {
      return sum + beneficiaries.indirect[key];
    }
    return sum;
  }, 0);

  const beneficiarySlices = BENEFICIARY_TYPE_KEYS.map((key, idx) => ({
    key,
    name: BENEFICIARY_TYPE_META[key].label,
    value: beneficiaries.direct[key] + beneficiaries.indirect[key],
    color: BENEFICIARY_COLORS[idx % BENEFICIARY_COLORS.length],
    group: BENEFICIARY_TYPE_META[key].group,
    include: beneficiaries.include[key]
  }))
    .filter((slice) => slice.include && slice.value > 0)
    .sort((a, b) => b.value - a.value);
  const topBeneficiaries = beneficiarySlices.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Projects"
          value={data.totalProjects}
          icon={Briefcase}
          trend="+12%"
          trendUp={true}
        />
        <KpiCard
          title="Active Projects"
          value={data.activeProjects}
          icon={Target}
          subValue={`${data.projectStatusCounts.ongoing} ongoing`}
        />
        <KpiCard
          title="Total Beneficiaries"
          value={data.totalBeneficiaries}
          icon={Users}
          trend="+5%"
          trendUp={true}
        />
        <KpiCard
          title="Provinces Covered"
          value={data.coveredProvinces.length}
          icon={MapPin}
          subValue="Across Afghanistan"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart: Projects by Sector */}
        <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-6 text-base font-semibold text-gray-900">Projects by Sector</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#6b7280' }} />
                <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="projects" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Project List for Projects by Sector */}
          {data.projects && data.projects.length > 0 && (
             <ProjectList projects={data.projects} title="Included Projects" />
          )}
        </div>

        {/* Chart: Project Status */ }
        <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-base font-semibold text-gray-900">Project Status</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
             <div className="text-center">
                 <p className="text-2xl font-bold text-gray-900">{data.projectStatusCounts.completed}</p>
                 <p>Completed</p>
             </div>
             <div className="text-center">
                 <p className="text-2xl font-bold text-gray-900">{data.projectStatusCounts.active}</p>
                 <p>Active</p>
             </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
           <div className="mb-4 flex items-center justify-between">
               <h3 className="text-base font-semibold text-gray-900">Geographic Coverage</h3>
               <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                   {data.coveredProvinces.length} Provinces
               </span>
           </div>
           <div className="h-[500px] w-full overflow-hidden rounded-lg border border-gray-100 bg-emerald-50/30">
               <AfghanistanMap
                   highlightedProvinces={data.coveredProvinces}
                   provinceData={provinceData}
                   className="h-full w-full"
               />
           </div>
           <div className="mt-4 flex flex-wrap gap-2">
               {data.coveredProvinces.slice(0, 10).map(p => (
                   <span key={p} className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600">
                       {p}
                   </span>
               ))}
               {data.coveredProvinces.length > 10 && (
                   <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">
                       +{data.coveredProvinces.length - 10} more
                   </span>
               )}
           </div>
      </div>

      {/* Beneficiary Distribution */}
      <motion.div
        key={`beneficiaries-${year ?? "all"}-${province ?? "all"}-${sector ?? "all"}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Beneficiary Distribution</h3>
            <p className="text-sm text-gray-500">
              Combined direct and indirect beneficiaries across the selected filters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 shadow-sm">
              Direct {directTotal.toLocaleString()}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 shadow-sm">
              Indirect {indirectTotal.toLocaleString()}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 shadow-sm">
              Total {(directTotal + indirectTotal).toLocaleString()}
            </span>
          </div>
        </div>

        {beneficiarySlices.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-gray-50 text-sm text-gray-500">
            No beneficiary records found for this selection.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={beneficiarySlices}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  barSize={14}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={160}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Legend verticalAlign="bottom" height={32} iconType="circle" />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {beneficiarySlices.map((entry, index) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {topBeneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.key}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: beneficiary.color }}
                    />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-900">{beneficiary.name}</p>
                      <p className="text-xs text-gray-500">{beneficiary.group}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {beneficiary.value.toLocaleString()}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      {((beneficiary.value / (directTotal + indirectTotal || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project List for Beneficiaries */}
        {data.projects && data.projects.length > 0 && (
            <ProjectList projects={data.projects} title="Contributing Projects" />
        )}
      </motion.div>
    </motion.div>
  );
}

function ProjectList({ projects, title }: { projects: Array<{ name: string; status: string; sector: string }>; title: string }) {
  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{projects.length} Projects</span>
      </div>
      <div className="max-h-60 overflow-y-auto pr-2">
        <div className="space-y-2">
            {projects.map((p, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 p-3 transition hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-gray-800">{p.name}</span>
                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-gray-500 sm:inline-block">{p.sector}</span>
                    <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        p.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "Completed" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                    )}>{p.status}</span>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
    title,
    value,
    icon: Icon,
    subValue,
    trend,
    trendUp
}: {
    title: string;
    value: number | string;
    icon: any;
    subValue?: string;
    trend?: string;
    trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h4 className="mt-2 text-3xl font-bold text-gray-900">
             {typeof value === 'number' ? value.toLocaleString() : value}
          </h4>
        </div>
        <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
         {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
         {trend && (
             <span className={cn(
                 "flex items-center text-sm font-medium",
                 trendUp ? "text-emerald-600" : "text-red-600"
             )}>
                 {trendUp ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
                 {trend}
             </span>
         )}
      </div>
    </div>
  );
}
