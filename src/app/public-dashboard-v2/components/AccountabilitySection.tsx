import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { AccountabilityOverview } from "@/lib/api/dashboard-v2";

type AccountabilitySectionProps = {
  year?: number;
  province?: string;
  sector?: string;
};

export default function AccountabilitySection({ year, province, sector }: AccountabilitySectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "accountability", year, province, sector],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (province) params.append("province", province);
      if (sector) params.append("sector", sector);
      const url = params.toString() ? `/api/v2/dashboard/accountability?${params.toString()}` : "/api/v2/dashboard/accountability";
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch accountability data");
        return res.json() as Promise<AccountabilityOverview>;
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
        Failed to load accountability data.
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Complaints</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.complaints}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">CRM Records</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.crmRecords}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Resolution Status</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            {Object.entries(data.complaintStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status.replace("_", " ")}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Recent Complaints</h3>
        {data.recentComplaints.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No complaints logged.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentComplaints.map((complaint) => (
              <div key={complaint.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Case {complaint.id}</p>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {complaint.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {complaint.category || "Uncategorized"} • {complaint.province || "Unknown province"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
