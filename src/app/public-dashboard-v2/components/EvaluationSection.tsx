import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { EvaluationOverview } from "@/lib/api/dashboard-v2";

type EvaluationSectionProps = {
  year?: number;
  province?: string;
  sector?: string;
};

export default function EvaluationSection({ year, province, sector }: EvaluationSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "evaluation", year, province, sector],
    queryFn: () => {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (province) params.append("province", province);
      if (sector) params.append("sector", sector);
      const url = params.toString() ? `/api/v2/dashboard/evaluation?${params.toString()}` : "/api/v2/dashboard/evaluation";
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch evaluation data");
        return res.json() as Promise<EvaluationOverview>;
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
        Failed to load evaluation data.
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
          <p className="text-sm font-medium text-gray-500">Evaluations</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.evaluations}</p>
          <div className="mt-4 space-y-2">
            {Object.entries(data.evaluationsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Success Stories</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.totals.stories}</p>
          <p className="text-sm text-gray-500">Latest stories linked to project evaluations.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Recent Evaluations</h3>
          {data.recentEvaluations.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No evaluations recorded.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.recentEvaluations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">{item.project}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  {item.completedAt ? <p className="text-xs text-gray-500">Completed: {item.completedAt}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Featured Stories</h3>
          {data.featuredStories.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No stories submitted.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.featuredStories.map((story) => (
                <div key={story.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{story.title}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {story.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{story.project}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
