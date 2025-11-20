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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

import { cn } from "@/lib/utils";
import type { DashboardOverviewStats } from "@/lib/api/dashboard-v2";
import AfghanistanMap from "@/ui/AfghanistanMap";

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7"];

type OverviewSectionProps = {
    year?: number;
    province?: string;
};

function fetchOverview(year?: number, province?: string) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (province) params.append("province", province);

  return fetch(`/api/v2/dashboard/overview?${params.toString()}`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<DashboardOverviewStats>;
  });
}

export default function OverviewSection({ year, province }: OverviewSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "overview", year, province],
    queryFn: () => fetchOverview(year, province),
    placeholderData: keepPreviousData
  });

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
      { name: 'Active', value: data.projectStatusCounts.active },
      { name: 'Ongoing', value: data.projectStatusCounts.ongoing },
      { name: 'Completed', value: data.projectStatusCounts.completed },
  ].filter(d => d.value > 0); // Filter out zero values for cleaner pie chart

  const chartData = Object.entries(data.sectors)
    .filter(([key]) => key !== "All Sectors")
    .map(([key, details]) => ({
      name: key,
      projects: details.projects,
      // Using projects count for bar chart mainly
    }))
    .sort((a, b) => b.projects - a.projects);

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
        </div>

        {/* Chart: Project Status */}
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </motion.div>
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
