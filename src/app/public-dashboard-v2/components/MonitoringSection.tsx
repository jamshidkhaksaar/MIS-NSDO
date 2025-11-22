import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { MonitoringOverview } from "@/lib/api/dashboard-v2";

type StatCardProps = { title: string; value: number; accent?: string; description?: string };

function StatCard({ title, value, accent = "bg-emerald-100 text-emerald-800", description }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      <span className={`mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${accent}`}>
        Live
      </span>
    </div>
  );
}

function StatusBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-sm font-medium text-gray-700">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

type MonitoringSectionProps = {
  year?: number;
  province?: string;
  sector?: string;
};

export default function MonitoringSection({ year, province, sector }: MonitoringSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "monitoring", year, province, sector],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (province) params.append("province", province);
      if (sector) params.append("sector", sector);
      const url = params.toString() ? `/api/v2/dashboard/monitoring?${params.toString()}` : "/api/v2/dashboard/monitoring";
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch monitoring data");
        return res.json() as Promise<MonitoringOverview>;
      });
    },
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-gray-500">
        Failed to load monitoring data.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Baseline Surveys" value={data.totals.baselineSurveys} />
        <StatCard title="Enumerators" value={data.totals.enumerators} accent="bg-blue-100 text-blue-800" />
        <StatCard title="Data Collection Tasks" value={data.totals.dataCollectionTasks} accent="bg-amber-100 text-amber-800" />
        <StatCard title="Field Visits" value={data.totals.fieldVisits} accent="bg-rose-100 text-rose-800" />
        <StatCard title="Monthly Reports" value={data.totals.monthlyReports} accent="bg-indigo-100 text-indigo-800" />
        <StatCard title="Baseline Reports" value={data.totals.baselineReports} accent="bg-gray-100 text-gray-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Baseline & Tasks Status</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(data.baselineByStatus).map(([status, count]) => (
              <StatusBar key={status} label={`Baseline: ${status}`} value={count} color="#10b981" />
            ))}
            {Object.entries(data.tasksByStatus).map(([status, count]) => (
              <StatusBar key={status} label={`Task: ${status}`} value={count} color="#f59e0b" />
            ))}
            {Object.entries(data.monthlyByStatus).map(([status, count]) => (
              <StatusBar key={status} label={`Monthly: ${status}`} value={count} color="#6366f1" />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Recent Field Visits</h3>
          {data.latestFieldVisits.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No field visits recorded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.latestFieldVisits.map((visit) => (
                <div key={visit.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{visit.project}</p>
                  <p className="text-xs text-gray-500">{visit.date}</p>
                  {visit.location ? <p className="text-xs text-gray-600">Location: {visit.location}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Recent Monthly Reports</h3>
        {data.latestMonthlyReports.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No monthly reports submitted.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.latestMonthlyReports.map((report) => (
              <div key={report.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{report.project}</p>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {report.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Month: {report.month}</p>
                {report.summary ? <p className="text-xs text-gray-600">{report.summary}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
