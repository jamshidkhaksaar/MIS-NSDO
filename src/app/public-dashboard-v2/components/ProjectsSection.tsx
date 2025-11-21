import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { DashboardProjectSummary } from "@/lib/api/dashboard-v2";
import { cn } from "@/lib/utils";

type ProjectsSectionProps = {
    year?: number;
    province?: string;
};

function fetchProjects(year?: number, province?: string) {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (province) params.append("province", province);

  return fetch(`/api/v2/dashboard/projects?${params.toString()}`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json() as Promise<DashboardProjectSummary[]>;
  });
}

export default function ProjectsSection({ year, province }: ProjectsSectionProps) {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["dashboard", "projects", year, province],
    queryFn: () => fetchProjects(year, province),
    placeholderData: keepPreviousData
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !projects) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed p-6 text-gray-500">
        Failed to load projects data.
      </div>
    );
  }

  if (projects.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-gray-50 p-6 text-gray-500">
            <p>No projects found for the selected filters.</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {projects.length} Total
            </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Project Title</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sector</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provinces</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-emerald-600">
                                {project.code}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="font-medium">{project.name}</div>
                                <div className="text-xs text-gray-500">{project.startDate} — {project.endDate}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                    {project.sector}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                <StatusBadge status={project.status} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="flex flex-wrap gap-1">
                                    {project.provinces.slice(0, 3).map(p => (
                                        <span key={p} className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                                            {p}
                                        </span>
                                    ))}
                                    {project.provinces.length > 3 && (
                                        <span className="text-xs text-gray-400">+{project.provinces.length - 3}</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Active: "bg-emerald-100 text-emerald-800",
        Ongoing: "bg-blue-100 text-blue-800",
        Completed: "bg-gray-100 text-gray-800",
        Planned: "bg-amber-100 text-amber-800"
    };
    const className = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
            {status}
        </span>
    );
}
