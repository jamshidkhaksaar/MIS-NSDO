"use client";

import { useEffect, useMemo, useState } from "react";
import MultiSelectDropdown from "../new/(components)/MultiSelectDropdown";
import { useDashboardData } from "@/context/DashboardDataContext";
import { PROJECT_SECTORS } from "@/lib/dashboard-data";

type FeedbackState = {
  message: string | null;
  tone: "positive" | "negative";
};

type ProjectFormState = {
  code: string;
  name: string;
  donor: string;
  sector: string;
  country: string;
  start: string;
  end: string;
  budget: string;
  staff: string;
  focalPoint: string;
  goal: string;
  objectives: string;
  majorAchievements: string;
  provincesText: string;
  districtsText: string;
  communitiesText: string;
  clusters: string[];
  standardSectors: string[];
};

const EMPTY_FORM: ProjectFormState = {
  code: "",
  name: "",
  donor: "",
  sector: "",
  country: "Afghanistan",
  start: "",
  end: "",
  budget: "",
  staff: "",
  focalPoint: "",
  goal: "",
  objectives: "",
  majorAchievements: "",
  provincesText: "",
  districtsText: "",
  communitiesText: "",
  clusters: [],
  standardSectors: [],
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length);

const formatList = (values: string[]) => values.join(", ");

export default function RegisteredProjectsPage() {
  const {
    projects,
    updateProject,
    isLoading,
    clusterCatalog,
    sectorCatalog,
  } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProjectFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }
    return projects
      .filter((project) => {
        const haystack = [
          project.name,
          project.code,
          project.donor,
          project.sector,
          project.goal,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, searchTerm]);

  useEffect(() => {
    if (!filteredProjects.length) {
      setSelectedProjectId(null);
      setFormState(EMPTY_FORM);
      return;
    }
    const stillSelected =
      selectedProjectId && filteredProjects.some((project) => project.id === selectedProjectId);
    if (stillSelected) {
      return;
    }
    setSelectedProjectId(filteredProjects[0]!.id);
  }, [filteredProjects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setFormState(EMPTY_FORM);
      return;
    }
    setFormState({
      code: selectedProject.code,
      name: selectedProject.name,
      donor: selectedProject.donor ?? "",
      sector: selectedProject.sector ?? "",
      country: selectedProject.country ?? "Afghanistan",
      start: selectedProject.start ?? "",
      end: selectedProject.end ?? "",
      budget: selectedProject.budget != null ? String(selectedProject.budget) : "",
      staff: Number.isFinite(selectedProject.staff) ? String(selectedProject.staff) : "",
      focalPoint: selectedProject.focalPoint ?? "",
      goal: selectedProject.goal ?? "",
      objectives: selectedProject.objectives ?? "",
      majorAchievements: selectedProject.majorAchievements ?? "",
      provincesText: formatList(selectedProject.provinces ?? []),
      districtsText: formatList(selectedProject.districts ?? []),
      communitiesText: formatList(selectedProject.communities ?? []),
      clusters: selectedProject.clusters ?? [],
      standardSectors: selectedProject.standardSectors ?? [],
    });
    setFeedback({ message: null, tone: "positive" });
  }, [selectedProject]);

  const clusterOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();
    clusterCatalog.forEach((entry) => {
      if (entry.name.trim()) {
        optionMap.set(entry.name.trim().toLowerCase(), { value: entry.name.trim(), label: entry.name.trim() });
      }
    });
    projects.forEach((project) => {
      project.clusters.forEach((cluster) => {
        const trimmed = cluster.trim();
        if (trimmed && !optionMap.has(trimmed.toLowerCase())) {
          optionMap.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
        }
      });
    });
    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [clusterCatalog, projects]);

  const standardSectorOptions = useMemo(() => {
    const set = new Map<string, { value: string; label: string }>();
    PROJECT_SECTORS.forEach((sector) => {
      set.set(sector.toLowerCase(), { value: sector, label: sector });
    });
    sectorCatalog.forEach((entry) => {
      const trimmed = entry.name.trim();
      if (trimmed) {
        set.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
      }
    });
    projects.forEach((project) => {
      project.standardSectors.forEach((sector) => {
        const trimmed = sector.trim();
        if (trimmed) {
          set.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
        }
      });
    });
    return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [projects, sectorCatalog]);

  const availableSectors = useMemo(() => {
    const sectorSet = new Map<string, string>();
    projects.forEach((project) => {
      if (project.sector?.trim()) {
        sectorSet.set(project.sector.trim().toLowerCase(), project.sector.trim());
      }
    });
    PROJECT_SECTORS.forEach((sector) => {
      sectorSet.set(sector.toLowerCase(), sector);
    });
    sectorCatalog.forEach((entry) => {
      if (entry.name.trim()) {
        sectorSet.set(entry.name.trim().toLowerCase(), entry.name.trim());
      }
    });
    return Array.from(sectorSet.values()).sort((a, b) => a.localeCompare(b));
  }, [projects, sectorCatalog]);

  const handleReset = () => {
    if (!selectedProject) {
      return;
    }
    setSelectedProjectId(selectedProject.id);
    setFeedback({ message: "Changes were discarded.", tone: "positive" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    if (!formState.code.trim() || !formState.name.trim()) {
      setFeedback({ message: "Project name and code are required.", tone: "negative" });
      return;
    }
    const parseNumber = (value: string): number | null => {
      if (!value.trim()) {
        return null;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error("Numeric fields must contain valid numbers.");
      }
      return parsed;
    };

    const payload = {
      id: selectedProject.id,
      code: formState.code.trim(),
      name: formState.name.trim(),
      donor: formState.donor.trim() || undefined,
      sector: formState.sector.trim() || undefined,
      country: formState.country.trim() || undefined,
      start: formState.start || undefined,
      end: formState.end || undefined,
      budget: null as number | null,
      focalPoint: formState.focalPoint.trim() || undefined,
      goal: formState.goal.trim() || undefined,
      objectives: formState.objectives.trim() || undefined,
      majorAchievements: formState.majorAchievements.trim() || undefined,
      staff: null as number | null,
      provinces: splitList(formState.provincesText),
      districts: splitList(formState.districtsText),
      communities: splitList(formState.communitiesText),
      clusters: formState.clusters,
      standardSectors: formState.standardSectors,
    };

    try {
      payload.budget = parseNumber(formState.budget);
      payload.staff = parseNumber(formState.staff);
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Please check numeric inputs.",
        tone: "negative",
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ message: null, tone: "positive" });

    try {
      await updateProject(payload);
      setFeedback({ message: "Project updated successfully.", tone: "positive" });
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Failed to update project.",
        tone: "negative",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Registered Projects</h1>
          <p className="text-sm text-brand-muted">
            Review and update project metadata. Changes sync instantly to the public dashboard.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, code, donor, or sector"
            className="input-brand w-full rounded-full pl-10"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-soft">
            🔍
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-strong">Projects</h2>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
              {filteredProjects.length}
            </span>
          </div>
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const isActive = project.id === selectedProjectId;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-brand-primary bg-gradient-to-r from-brand-primary/90 to-brand-primary text-white shadow-brand-soft"
                      : "border-brand bg-white hover:border-brand-primary/70 hover:shadow-brand-soft/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold sm:text-base">{project.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        isActive ? "bg-white/20" : "bg-brand-soft text-brand-primary"
                      }`}
                    >
                      {project.code}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs sm:text-sm ${isActive ? "text-white/80" : "text-brand-muted"}`}>
                    {project.donor ? `Donor: ${project.donor}` : "Donor not recorded"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                    {project.sector ? (
                      <span className={isActive ? "bg-white/15 px-2 py-0.5 rounded-full" : "rounded-full bg-brand-soft px-2 py-0.5 text-brand-primary"}>
                        {project.sector}
                      </span>
                    ) : null}
                    {project.provinces.slice(0, 2).map((province) => (
                      <span
                        key={`${project.id}-${province}`}
                        className={isActive ? "bg-white/15 px-2 py-0.5 rounded-full" : "rounded-full bg-brand-soft px-2 py-0.5 text-brand-primary"}
                      >
                        {province}
                      </span>
                    ))}
                    {project.provinces.length > 2 ? (
                      <span className={isActive ? "bg-white/15 px-2 py-0.5 rounded-full" : "rounded-full bg-brand-soft px-2 py-0.5 text-brand-primary"}>
                        +{project.provinces.length - 2}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {!filteredProjects.length && !isLoading ? (
              <p className="rounded-2xl border border-dashed border-brand px-4 py-8 text-center text-sm text-brand-soft">
                No projects match your filters. Adjust your search term to continue.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="space-y-6">
          {!selectedProject ? (
            <div className="rounded-3xl border border-dashed border-brand bg-white/60 p-10 text-center text-sm text-brand-soft">
              Select a project to view its details and update metadata.
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
              >
                <header className="flex flex-col gap-2">
                  <h2 className="text-xl font-semibold text-brand-strong">Project overview</h2>
                  <p className="text-sm text-brand-muted">
                    Update high-level information. Clusters and sectors drive dashboard filters and donor views.
                  </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-code">
                      Project code
                    </label>
                    <input
                      id="project-code"
                      type="text"
                      value={formState.code}
                      onChange={(event) => setFormState((previous) => ({ ...previous, code: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-name">
                      Project name
                    </label>
                    <input
                      id="project-name"
                      type="text"
                      value={formState.name}
                      onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-donor">
                      Donor
                    </label>
                    <input
                      id="project-donor"
                      type="text"
                      value={formState.donor}
                      onChange={(event) => setFormState((previous) => ({ ...previous, donor: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      placeholder="e.g. UNHCR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-sector">
                      Sector
                    </label>
                    <input
                      id="project-sector"
                      list="project-sector-options"
                      value={formState.sector}
                      onChange={(event) => setFormState((previous) => ({ ...previous, sector: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      placeholder="Choose or type a sector"
                    />
                    <datalist id="project-sector-options">
                      {availableSectors.map((sector) => (
                        <option key={sector} value={sector} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-country">
                      Country
                    </label>
                    <input
                      id="project-country"
                      type="text"
                      value={formState.country}
                      onChange={(event) => setFormState((previous) => ({ ...previous, country: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-focal-point">
                      Focal point
                    </label>
                    <input
                      id="project-focal-point"
                      type="text"
                      value={formState.focalPoint}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, focalPoint: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      placeholder="Name of project manager"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-start">
                      Start date
                    </label>
                    <input
                      id="project-start"
                      type="date"
                      value={formState.start}
                      onChange={(event) => setFormState((previous) => ({ ...previous, start: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-end">
                      End date
                    </label>
                    <input
                      id="project-end"
                      type="date"
                      value={formState.end}
                      onChange={(event) => setFormState((previous) => ({ ...previous, end: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-budget">
                      Budget (USD)
                    </label>
                    <input
                      id="project-budget"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formState.budget}
                      onChange={(event) => setFormState((previous) => ({ ...previous, budget: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-staff">
                      Staff deployed
                    </label>
                    <input
                      id="project-staff"
                      type="number"
                      min={0}
                      value={formState.staff}
                      onChange={(event) => setFormState((previous) => ({ ...previous, staff: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-muted">Clusters</label>
                    <MultiSelectDropdown
                      options={clusterOptions}
                      selected={formState.clusters}
                      onChange={(values) => setFormState((previous) => ({ ...previous, clusters: values }))}
                      placeholder="Select clusters"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-brand-muted">Standard sectors</label>
                    <MultiSelectDropdown
                      options={standardSectorOptions}
                      selected={formState.standardSectors}
                      onChange={(values) => setFormState((previous) => ({ ...previous, standardSectors: values }))}
                      placeholder="Select sectors"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-provinces">
                      Provinces
                    </label>
                    <textarea
                      id="project-provinces"
                      value={formState.provincesText}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, provincesText: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                      placeholder="Separate entries with commas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-districts">
                      Districts
                    </label>
                    <textarea
                      id="project-districts"
                      value={formState.districtsText}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, districtsText: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                      placeholder="Separate entries with commas"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-communities">
                      Communities
                    </label>
                    <textarea
                      id="project-communities"
                      value={formState.communitiesText}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, communitiesText: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                      placeholder="Separate entries with commas"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-goal">
                      Project goal
                    </label>
                    <textarea
                      id="project-goal"
                      value={formState.goal}
                      onChange={(event) => setFormState((previous) => ({ ...previous, goal: event.target.value }))}
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-objectives">
                      Objectives
                    </label>
                    <textarea
                      id="project-objectives"
                      value={formState.objectives}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, objectives: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-brand-muted" htmlFor="project-achievements">
                      Major achievements
                    </label>
                    <textarea
                      id="project-achievements"
                      value={formState.majorAchievements}
                      onChange={(event) =>
                        setFormState((previous) => ({ ...previous, majorAchievements: event.target.value }))
                      }
                      className="input-brand mt-1 block w-full rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>

                {feedback.message ? (
                  <p
                    className={`text-sm ${
                      feedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {feedback.message}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold chip-brand"
                  >
                    Reset changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-strong">Documents</h3>
                      <p className="text-xs text-brand-muted">Latest uploads linked to this project.</p>
                    </div>
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                      {selectedProject.documents?.length ?? 0}
                    </span>
                  </header>
                  <div className="space-y-3 text-sm">
                    {selectedProject.documents?.slice(0, 5).map((document) => (
                      <div key={document.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                        <p className="font-semibold text-brand-strong">{document.title}</p>
                        <p className="text-xs text-brand-muted uppercase tracking-wide">
                          {document.category} · {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : "Date unknown"}
                        </p>
                        {document.fileUrl ? (
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center text-xs font-semibold text-brand-primary hover:underline"
                          >
                            Open document
                          </a>
                        ) : null}
                      </div>
                    ))}
                    {!selectedProject.documents?.length ? (
                      <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                        Upload project documents to showcase supporting evidence.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
                  <header className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-strong">Project phases</h3>
                      <p className="text-xs text-brand-muted">Track the lifecycle of implementation.</p>
                    </div>
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                      {selectedProject.phases?.length ?? 0}
                    </span>
                  </header>
                  <div className="space-y-3 text-sm">
                    {selectedProject.phases?.map((phase) => (
                      <div key={phase.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                        <p className="font-semibold text-brand-strong capitalize">{phase.phase}</p>
                        <p className="text-xs text-brand-muted capitalize">
                          Status: {phase.status.replace(/_/g, " ")}
                        </p>
                        {phase.notes ? (
                          <p className="mt-1 text-xs text-brand-soft">
                            {phase.notes.length > 140 ? `${phase.notes.slice(0, 140)}…` : phase.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {!selectedProject.phases?.length ? (
                      <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                        Updating phases in the MEAL workflow will reflect here automatically.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
