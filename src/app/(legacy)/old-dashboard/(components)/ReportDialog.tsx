"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@/context/DashboardDataContext";

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultYear?: number;
  defaultProjectId?: string;
  defaultSector?: string;
};

type FiltersState = {
  years: number[];
  projectIds: string[];
  provinces: string[];
  sectors: string[];
  clusters: string[];
};

const EMPTY_FILTERS: FiltersState = {
  years: [],
  projectIds: [],
  provinces: [],
  sectors: [],
  clusters: [],
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export default function ReportDialog({ open, onClose, defaultYear, defaultProjectId, defaultSector }: ReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);

  const { projects, reportingYears, clusterCatalog, sectorCatalog } = useDashboardData();

  useEffect(() => {
    if (!open) {
      setError(null);
      setNotice(null);
      setFilters((previous) => ({ ...previous }));
      return;
    }

    setFilters((previous) => {
      if (previous !== EMPTY_FILTERS) {
        return previous;
      }
      return {
        years: defaultYear ? [defaultYear] : [],
        projectIds: defaultProjectId ? [defaultProjectId] : [],
        provinces: [],
        sectors: defaultSector ? [defaultSector] : [],
        clusters: [],
      };
    });
  }, [open, defaultYear, defaultProjectId, defaultSector]);

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: `${project.code} – ${project.name}` })),
    [projects]
  );

  const provinceOptions = useMemo(() => {
    const provinces = projects.flatMap((project) => project.provinces);
    return uniqueSorted(provinces);
  }, [projects]);

  const sectorOptions = useMemo(() => {
    const sectors = new Set<string>();
    projects.forEach((project) => {
      if (project.sector) {
        sectors.add(project.sector);
      }
    });
    sectorCatalog.forEach((entry) => sectors.add(entry.name));
    return uniqueSorted(Array.from(sectors));
  }, [projects, sectorCatalog]);

  const clusterOptions = useMemo(() => {
    const clusters = new Set<string>();
    projects.forEach((project) => project.clusters.forEach((cluster) => clusters.add(cluster)));
    clusterCatalog.forEach((entry) => clusters.add(entry.name));
    return uniqueSorted(Array.from(clusters));
  }, [projects, clusterCatalog]);

  const toggleValue = (list: string[], value: string): string[] => {
    if (list.includes(value)) {
      return list.filter((item) => item !== value);
    }
    return [...list, value];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Unable to generate report." }));
        throw new Error(data.message ?? "Unable to generate report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `NSDO-dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotice("Report generated successfully. A PDF has been downloaded.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to generate report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-brand bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-strong">Generate PDF report</h2>
            <p className="text-sm text-brand-muted">
              Select filters to tailor the professional donor-ready report. Metrics are based on the current dashboard snapshot.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand px-3 py-1 text-sm font-semibold text-brand-muted hover:border-brand-primary hover:text-brand-primary"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-muted">Years</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {reportingYears.length ? reportingYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setFilters((previous) => ({ ...previous, years: toggleValue(previous.years.map(String), String(year)).map(Number) }))}
                    className={`rounded-full px-3 py-1 text-sm font-semibold border transition ${
                      filters.years.includes(year)
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand text-brand-muted hover:border-brand-primary hover:text-brand-primary"
                    }`}
                  >
                    {year}
                  </button>
                )) : (
                  <p className="text-sm text-brand-soft">No reporting years captured.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-muted" htmlFor="report-projects">Projects</label>
              <select
                id="report-projects"
                multiple
                value={filters.projectIds}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  setFilters((previous) => ({ ...previous, projectIds: values }));
                }}
                className="input-brand mt-2 block w-full rounded-lg h-32"
              >
                {projectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-muted" htmlFor="report-provinces">Provinces</label>
              <select
                id="report-provinces"
                multiple
                value={filters.provinces}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  setFilters((previous) => ({ ...previous, provinces: values }));
                }}
                className="input-brand mt-2 block w-full rounded-lg h-32"
              >
                {provinceOptions.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-muted" htmlFor="report-sectors">Sectors</label>
              <select
                id="report-sectors"
                multiple
                value={filters.sectors}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  setFilters((previous) => ({ ...previous, sectors: values }));
                }}
                className="input-brand mt-2 block w-full rounded-lg h-32"
              >
                {sectorOptions.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-brand-muted" htmlFor="report-clusters">Clusters</label>
              <select
                id="report-clusters"
                multiple
                value={filters.clusters}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  setFilters((previous) => ({ ...previous, clusters: values }));
                }}
                className="input-brand mt-2 block w-full rounded-lg h-32"
              >
                {clusterOptions.map((cluster) => (
                  <option key={cluster} value={cluster}>
                    {cluster}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {notice ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand-muted hover:border-brand-primary hover:text-brand-primary"
            >
              Clear filters
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2 text-sm font-semibold chip-brand"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmitting ? "Generating…" : "Download PDF"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
