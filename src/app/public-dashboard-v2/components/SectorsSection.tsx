import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SectorDetails } from "@/lib/dashboard-data";

type SectorsSectionProps = {
    year?: number;
    province?: string;
    sector?: string;
};

type SectorListItem = SectorDetails & { name: string };

function fetchSectors(year?: number, province?: string, sector?: string) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (province) params.append("province", province);
  if (sector) params.append("sector", sector);

  return fetch(`/api/v2/dashboard/sectors?${params.toString()}`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch sectors");
    return res.json() as Promise<SectorListItem[]>;
  });
}

export default function SectorsSection({ year, province, sector }: SectorsSectionProps) {
  const { data: sectors, isLoading, error } = useQuery({
    queryKey: ["dashboard", "sectors", year, province, sector],
    queryFn: () => fetchSectors(year, province, sector),
    placeholderData: keepPreviousData
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !sectors) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-gray-500">
        Failed to load sectors data.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sectors Performance</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {sectors.length} Active Sectors
            </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sectors.map((sector) => (
                <div key={sector.name} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">{sector.name}</h3>
                        <p className="text-xs text-gray-500">Active since {sector.start || "N/A"}</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Projects</span>
                            <span className="text-xl font-bold text-emerald-600">{sector.projects}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Staff</span>
                            <span className="text-xl font-bold text-blue-600">{sector.staff}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Provinces</span>
                            <span className="text-xl font-bold text-amber-600">{sector.provinces.length}</span>
                        </div>
                        <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Activity</p>
                            <p className="mt-1 text-sm text-gray-700 line-clamp-2">{sector.fieldActivity || "No activity recorded"}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
  );
}
