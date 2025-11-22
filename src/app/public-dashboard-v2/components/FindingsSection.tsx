import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { FindingsOverview } from "@/lib/api/dashboard-v2";

type FindingsSectionProps = {
  year?: number;
  province?: string;
  sector?: string;
};

export default function FindingsSection({ year, province, sector }: FindingsSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "findings", year, province, sector],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (province) params.append("province", province);
      if (sector) params.append("sector", sector);
      const url = params.toString() ? `/api/v2/dashboard/findings?${params.toString()}` : "/api/v2/dashboard/findings";
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch findings data");
        return res.json() as Promise<FindingsOverview>;
      });
    },
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-gray-500">
        Failed to load findings data.
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Findings" value={data.totals.findings} />
        <StatCard title="Distributions" value={data.totals.distributions} accent="bg-amber-100 text-amber-800" />
        <StatCard title="PDM Surveys" value={data.totals.pdmSurveys} accent="bg-indigo-100 text-indigo-800" />
        <StatCard title="PDM Reports" value={data.totals.pdmReports} accent="bg-blue-100 text-blue-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusCard title="By Severity" data={data.bySeverity} colors={["#ef4444", "#f59e0b", "#10b981"]} />
        <StatusCard title="By Status" data={data.byStatus} colors={["#f97316", "#6366f1", "#22c55e"]} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Recent Findings</h3>
        {data.recentFindings.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No findings captured.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.recentFindings.map((finding) => (
              <div key={finding.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{finding.project}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {finding.severity}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {finding.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Finding #{finding.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, accent = "bg-emerald-100 text-emerald-800" }: { title: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <span className={`mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${accent}`}>Live</span>
    </div>
  );
}

function StatusCard({
  title,
  data,
  colors,
}: {
  title: string;
  data: Record<string, number>;
  colors: string[];
}) {
  const entries = Object.entries(data);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No data.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map(([key, value], index) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <p className="text-sm font-medium text-gray-700 capitalize">{key}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
