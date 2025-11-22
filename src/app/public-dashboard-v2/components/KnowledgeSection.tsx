import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { KnowledgeOverview } from "@/lib/api/dashboard-v2";

type KnowledgeSectionProps = {
  year?: number;
  province?: string;
  sector?: string;
};

export default function KnowledgeSection({ year, province, sector }: KnowledgeSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "knowledge", year, province, sector],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (province) params.append("province", province);
      if (sector) params.append("sector", sector);
      const url = params.toString() ? `/api/v2/dashboard/knowledge?${params.toString()}` : "/api/v2/dashboard/knowledge";
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch knowledge data");
        return res.json() as Promise<KnowledgeOverview>;
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
        Failed to load knowledge data.
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Lessons Learned</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.lessons}</p>
          <p className="text-sm text-gray-500">Captured across programs.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Knowledge Resources</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.resources}</p>
          <p className="text-sm text-gray-500">Guides, templates, and references.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Recent Lessons</h3>
          {data.recentLessons.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No lessons recorded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.recentLessons.map((lesson) => (
                <div key={lesson.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
                  <p className="text-xs text-gray-500">{lesson.source || "Internal"}</p>
                  <p className="text-xs text-gray-500">{lesson.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Recent Resources</h3>
          {data.recentResources.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No resources uploaded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.recentResources.map((resource) => (
                <div key={resource.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{resource.title}</p>
                    {resource.category ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {resource.category}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500">{resource.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
