"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  BENEFICIARY_GROUPS,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  PROJECT_SECTORS,
  RESPONSE_CLUSTERS,
  STANDARD_SECTOR_GROUPS,
} from "@/lib/dashboard-data";
import type {
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  DashboardProject,
} from "@/context/DashboardDataContext";

type ProjectFormState = {
  name: string;
  sectorChoice: string;
  customSector: string;
  clusters: string[];
  standardSectors: string[];
  beneficiaries: BeneficiaryBreakdown;
  country: string;
  provinces: string[];
  districts: string[];
  communities: string[];
  goal: string;
  objectives: string;
  majorAchievements: string;
};

const createEmptyBeneficiaries = (): BeneficiaryBreakdown => {
  const breakdown: BeneficiaryBreakdown = {
    direct: {} as Record<BeneficiaryTypeKey, number>,
    indirect: {} as Record<BeneficiaryTypeKey, number>,
  };

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    breakdown.direct[key] = 0;
    breakdown.indirect[key] = 0;
  });

  return breakdown;
};

const cloneBeneficiaries = (source: BeneficiaryBreakdown | undefined): BeneficiaryBreakdown => {
  const clone = createEmptyBeneficiaries();
  if (!source) {
    return clone;
  }

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    clone.direct[key] = source.direct?.[key] ?? 0;
    clone.indirect[key] = source.indirect?.[key] ?? 0;
  });

  return clone;
};

const INITIAL_FORM_STATE: ProjectFormState = {
  name: "",
  sectorChoice: PROJECT_SECTORS[0] ?? "",
  customSector: "",
  clusters: [],
  standardSectors: [],
  beneficiaries: createEmptyBeneficiaries(),
  country: "Afghanistan",
  provinces: [],
  districts: [],
  communities: [],
  goal: "",
  objectives: "",
  majorAchievements: "",
};

function sortProjects(projects: DashboardProject[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}

export default function ProjectsPage() {
  const { projects, addProject, removeProject, isLoading } = useDashboardData();
  const [formState, setFormState] = useState<ProjectFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationInputs, setLocationInputs] = useState({
    province: "",
    district: "",
    community: "",
  });
  const locationConfigs = [
  { label: "Provinces", type: "provinces", placeholder: "Add province", inputKey: "province" },
  { label: "Districts", type: "districts", placeholder: "Add district", inputKey: "district" },
  { label: "Villages / Communities", type: "communities", placeholder: "Add village or community", inputKey: "community" },
] as const;

  const clusterReference = useMemo(() => [...RESPONSE_CLUSTERS], []);
  const standardSectorReference = useMemo(
    () => STANDARD_SECTOR_GROUPS.flatMap((group) => [...group.sectors]),
    []
  );

  const sortByReference = useCallback((items: string[], reference: string[]) => {
    return [...items].sort((a, b) => {
      const indexA = reference.indexOf(a);
      const indexB = reference.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }
      return indexA - indexB;
    });
  }, []);

  const preparedProjects = useMemo(() => sortProjects(projects), [projects]);
  const isBootstrapLoading = isLoading && projects.length === 0;
  const formDirectTotal = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.reduce(
        (sum, key) => sum + (formState.beneficiaries.direct[key] ?? 0),
        0
      ),
    [formState.beneficiaries.direct]
  );

  const formIndirectTotal = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.reduce(
        (sum, key) => sum + (formState.beneficiaries.indirect[key] ?? 0),
        0
      ),
    [formState.beneficiaries.indirect]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!formState.name.trim()) {
      setError("Please provide a project name.");
      return;
    }

    if (!formState.country.trim()) {
      setError("Please specify the country where the project operates.");
      return;
    }

    const sector =
      formState.sectorChoice === "custom"
        ? formState.customSector.trim()
        : formState.sectorChoice;

    if (!sector) {
      setError("Select or enter a project sector.");
      return;
    }

    if (!formState.goal.trim()) {
      setError("Describe the project goal.");
      return;
    }

    if (!formState.objectives.trim()) {
      setError("Outline the project objectives.");
      return;
    }

    if (!formState.majorAchievements.trim()) {
      setError("Provide major achievements or expected results.");
      return;
    }

    const directTotal = BENEFICIARY_TYPE_KEYS.reduce(
      (sum, key) => sum + (formState.beneficiaries.direct[key] ?? 0),
      0
    );
    const indirectTotal = BENEFICIARY_TYPE_KEYS.reduce(
      (sum, key) => sum + (formState.beneficiaries.indirect[key] ?? 0),
      0
    );

    if (directTotal === 0 && indirectTotal === 0) {
      setError("Enter at least one beneficiary count before saving.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addProject({
        name: formState.name.trim(),
        sector,
        clusters: formState.clusters,
        standardSectors: formState.standardSectors,
        beneficiaries: cloneBeneficiaries(formState.beneficiaries),
        country: formState.country.trim(),
        provinces: formState.provinces,
        districts: formState.districts,
        communities: formState.communities,
        goal: formState.goal.trim(),
        objectives: formState.objectives.trim(),
        majorAchievements: formState.majorAchievements.trim(),
      });

      setNotice("Project recorded successfully.");
      setFormState((prev) => ({
        ...INITIAL_FORM_STATE,
        sectorChoice: prev.sectorChoice === "custom" ? PROJECT_SECTORS[0] ?? "" : prev.sectorChoice,
        beneficiaries: createEmptyBeneficiaries(),
      }));
      setLocationInputs({ province: "", district: "", community: "" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    await removeProject(projectId);
    setNotice("Project removed.");
  };

  const handleBeneficiaryChange = (
    view: "direct" | "indirect",
    key: BeneficiaryTypeKey,
    value: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      beneficiaries: {
        ...prev.beneficiaries,
        [view]: {
          ...prev.beneficiaries[view],
          [key]: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
        },
      },
    }));
  };

  const handleClusterToggle = useCallback(
    (cluster: string) => {
      setFormState((prev) => {
        const exists = prev.clusters.includes(cluster);
        const next = exists
          ? prev.clusters.filter((item) => item !== cluster)
          : [...prev.clusters, cluster];
        return {
          ...prev,
          clusters: sortByReference(next, clusterReference),
        };
      });
    },
    [clusterReference, sortByReference]
  );

  const handleStandardSectorToggle = useCallback(
    (sectorLabel: string) => {
      setFormState((prev) => {
        const exists = prev.standardSectors.includes(sectorLabel);
        const next = exists
          ? prev.standardSectors.filter((item) => item !== sectorLabel)
          : [...prev.standardSectors, sectorLabel];
        return {
          ...prev,
          standardSectors: sortByReference(next, standardSectorReference),
        };
      });
    },
    [sortByReference, standardSectorReference]
  );

  const handleLocationAdd = (type: "provinces" | "districts" | "communities") => {
    const inputKey = type === "provinces" ? "province" : type === "districts" ? "district" : "community";
    const value = locationInputs[inputKey as keyof typeof locationInputs].trim();
    if (!value) {
      return;
    }

    setFormState((prev) => {
      const existing = prev[type];
      if (existing.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [type]: [...existing, value],
      };
    });

    setLocationInputs((prev) => ({
      ...prev,
      [inputKey]: "",
    }));
  };

  const handleLocationRemove = (type: "provinces" | "districts" | "communities", value: string) => {
    setFormState((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }));
  };

  if (isBootstrapLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-tint text-brand-soft">
        Loading project workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-strong">
              Projects Registry
            </h1>
            <p className="text-sm text-brand-soft">
              Capture project details, beneficiary reach, goals, objectives, and achievements.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Dashboard
            </Link>
            <Link
              href="/user-dashboard"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Data Entry
            </Link>
            <Link
              href="/admin"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl border border-brand bg-white shadow-brand-soft">
          <form className="grid gap-8 p-6" onSubmit={handleSubmit}>
            <div className="space-y-4 border-b border-brand pb-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-strong">
                  Project Information
                </h2>
                <p className="text-sm text-brand-soft">
                  Provide the official project title, sector, reach, and strategic narrative.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted md:col-span-2">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">
                    Proper project name (as per donor/partner contract)
                  </span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="e.g. Rural Livelihoods Enhancement Programme"
                    className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">
                    Relevant sector
                  </span>
                  <select
                    value={formState.sectorChoice}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        sectorChoice: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  >
                    {PROJECT_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                    <option value="custom">Other (specify)</option>
                  </select>
                </label>

                {formState.sectorChoice === "custom" ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      Custom sector
                    </span>
                    <input
                      type="text"
                      value={formState.customSector}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, customSector: event.target.value }))
                      }
                      placeholder="e.g. Emergency Shelter"
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                    />
                  </label>
                ) : null}

                <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">
                    Country of implementation
                  </span>
                  <input
                    type="text"
                    value={formState.country}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, country: event.target.value }))
                    }
                    placeholder="e.g. Afghanistan"
                    className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  />
                </label>

                <div className="md:col-span-2 space-y-4 rounded-xl border border-brand bg-white px-4 py-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">
                        Response clusters
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">
                        {formState.clusters.length
                          ? `${formState.clusters.length} selected`
                          : "Select applicable clusters"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {clusterReference.map((cluster) => {
                        const isSelected = formState.clusters.includes(cluster);
                        return (
                          <button
                            key={cluster}
                            type="button"
                            onClick={() => handleClusterToggle(cluster)}
                            aria-pressed={isSelected}
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                              isSelected
                                ? "border-transparent toggle-pill toggle-pill-active"
                                : "border border-brand bg-brand-soft text-brand-muted toggle-pill"
                            }`}
                          >
                            {cluster}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-brand-tint" />

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">
                        Standard sector alignment
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">
                        {formState.standardSectors.length
                          ? `${formState.standardSectors.length} selected`
                          : "Highlight relevant sectors"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {STANDARD_SECTOR_GROUPS.map((group) => (
                        <div key={group.label} className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.sectors.map((sectorLabel) => {
                              const isPicked = formState.standardSectors.includes(sectorLabel);
                              return (
                                <button
                                  key={sectorLabel}
                                  type="button"
                                  onClick={() => handleStandardSectorToggle(sectorLabel)}
                                  aria-pressed={isPicked}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                    isPicked
                                      ? "border-transparent toggle-pill toggle-pill-active"
                                      : "border border-brand bg-white text-brand-muted toggle-pill"
                                  }`}
                                >
                                  {sectorLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
                  <span className="text-xs uppercase tracking-wide text-blue-600">
                    Direct beneficiaries (calculated)
                  </span>
                  <div className="mt-2 text-2xl font-semibold">
                    {formDirectTotal.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900">
                  <span className="text-xs uppercase tracking-wide text-violet-600">
                    Indirect beneficiaries (calculated)
                  </span>
                  <div className="mt-2 text-2xl font-semibold">
                    {formIndirectTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {locationConfigs.map((config) => (
                  <div
                    key={config.type}
                    className="flex flex-col gap-2 text-sm font-medium text-brand-muted"
                  >
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={locationInputs[config.inputKey as keyof typeof locationInputs]}
                        onChange={(event) =>
                          setLocationInputs((prev) => ({
                            ...prev,
                            [config.inputKey]: event.target.value,
                          }))
                        }
                        placeholder={config.placeholder}
                        className="flex-1 rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                      />
                      <button
                        type="button"
                        onClick={() => handleLocationAdd(config.type)}
                        className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide chip-brand"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formState[config.type].length ? (
                        formState[config.type].map((value) => (
                          <span
                            key={`${config.type}-${value}`}
                            className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand-soft px-3 py-1 text-xs font-medium text-brand-muted"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => handleLocationRemove(config.type, value)}
                              className="text-brand-soft transition hover:text-rose-500"
                              aria-label={`Remove ${value}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-normal text-brand-soft">
                          No entries yet
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">
                  Project goal
                </span>
                <textarea
                  value={formState.goal}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, goal: event.target.value }))
                  }
                  rows={3}
                  placeholder="High-level goal outlining the intended change."
                  className="w-full rounded-lg input-brand px-4 py-3 text-sm text-brand-muted bg-white"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">
                  Objectives
                </span>
                <textarea
                  value={formState.objectives}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, objectives: event.target.value }))
                  }
                  rows={4}
                  placeholder="List key objectives. Use bullet points or sentences."
                  className="w-full rounded-lg input-brand px-4 py-3 text-sm text-brand-muted bg-white"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">
                  Major achievements
                </span>
                <textarea
                  value={formState.majorAchievements}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, majorAchievements: event.target.value }))
                  }
                  rows={4}
                  placeholder="Summarise achievements or significant milestones."
                  className="w-full rounded-lg input-brand px-4 py-3 text-sm text-brand-muted bg-white"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-brand bg-brand-soft px-4 py-5">
              <h3 className="text-sm font-semibold text-brand-strong">
                Beneficiary Details
              </h3>
              <p className="mt-1 text-xs text-brand-soft">
                Record direct and indirect reach by beneficiary type. Totals above update automatically.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                {( ["direct", "indirect"] as const).map((view) => (
                  <div key={`project-${view}`} className="space-y-4">
                    <h4 className="text-sm font-semibold text-brand-strong">
                      {view === "direct" ? "Direct Beneficiaries" : "Indirect Beneficiaries"}
                    </h4>
                    {BENEFICIARY_GROUPS.map((group) => (
                      <div
                        key={`project-${view}-${group.key}`}
                        className="rounded-lg border border-brand bg-white px-3 py-3"
                      >
                        <span className="text-xs uppercase tracking-wide text-brand-soft">
                          {group.label}
                        </span>
                        <div className="mt-3 grid grid-cols-1 gap-3">
                          {group.members.map((member) => {
                            const key = member as BeneficiaryTypeKey;
                            const labelParts = BENEFICIARY_TYPE_META[key].label.split("•");
                            const memberLabel =
                              group.members.length > 1
                                ? labelParts[labelParts.length - 1]?.trim() ?? BENEFICIARY_TYPE_META[key].label
                                : BENEFICIARY_TYPE_META[key].label;
                            return (
                              <label
                                key={`project-${view}-${member}`}
                                className="flex flex-col gap-2 text-sm font-medium text-brand-muted"
                              >
                                <span>{memberLabel}</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={formState.beneficiaries[view][key] ?? 0}
                                  onChange={(event) =>
                                    handleBeneficiaryChange(view, key, Number(event.target.value))
                                  }
                                  className="w-full rounded-md input-brand px-3 py-1 text-sm text-brand-muted"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white btn-brand disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Save Project"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-brand bg-white shadow-brand-soft">
          <div className="border-b border-brand px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-strong">Recorded Projects</h2>
            <p className="text-sm text-brand-soft">
              Review existing entries, including sector alignment and beneficiary reach.
            </p>
          </div>
          <div className="divide-y divide-emerald-50">
            {preparedProjects.length ? (
              preparedProjects.map((project) => {
                const directTotal = BENEFICIARY_TYPE_KEYS.reduce(
                  (sum, key) => sum + (project.beneficiaries.direct?.[key] ?? 0),
                  0
                );
                const indirectTotal = BENEFICIARY_TYPE_KEYS.reduce(
                  (sum, key) => sum + (project.beneficiaries.indirect?.[key] ?? 0),
                  0
                );
                const projectRows = BENEFICIARY_TYPE_KEYS.map((key) => ({
                  key,
                  label: BENEFICIARY_TYPE_META[key].label,
                  direct: project.beneficiaries.direct?.[key] ?? 0,
                  indirect: project.beneficiaries.indirect?.[key] ?? 0,
                }));

                return (
                  <article
                    key={project.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1fr]"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-brand-strong">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {project.sector}
                      </p>
                      {project.clusters.length || project.standardSectors.length ? (
                        <div className="mt-3 space-y-2">
                          {project.clusters.length ? (
                            <div className="flex flex-wrap gap-2">
                              {project.clusters.map((cluster) => (
                                <span
                                  key={cluster}
                                  className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700"
                                >
                                  {cluster}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {project.standardSectors.length ? (
                            <div className="flex flex-wrap gap-2">
                              {project.standardSectors.map((sectorLabel) => (
                                <span
                                  key={sectorLabel}
                                  className="rounded-full border border-brand bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted"
                                >
                                  {sectorLabel}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                    <div className="mt-4 space-y-3 text-sm text-brand-muted">
                      <div>
                        <span className="font-semibold text-brand-muted">Goal:</span>{" "}
                        {project.goal}
                      </div>
                        <div>
                          <span className="font-semibold text-brand-muted">Objectives:</span>
                          <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-muted">
                            {project.objectives}
                          </pre>
                        </div>
                      <div>
                        <span className="font-semibold text-brand-muted">Major achievements:</span>
                        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-muted">
                          {project.majorAchievements}
                        </pre>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs uppercase tracking-wide text-brand-soft md:grid-cols-2">
                        <div>
                          <span className="font-semibold text-brand-muted">Country:</span>
                          <p className="mt-1 text-sm normal-case text-brand-muted">{project.country}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-brand-muted">Provinces:</span>
                          <p className="mt-1 text-sm normal-case text-brand-muted">
                            {project.provinces.length
                              ? project.provinces.join(", ")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-brand-muted">Districts:</span>
                          <p className="mt-1 text-sm normal-case text-brand-muted">
                            {project.districts.length
                              ? project.districts.join(", ")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-brand-muted">Communities:</span>
                          <p className="mt-1 text-sm normal-case text-brand-muted">
                            {project.communities.length
                              ? project.communities.join(", ")
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand bg-brand-soft p-4 text-sm text-brand-muted">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-brand-soft">Direct beneficiaries</span>
                          <span className="text-base font-semibold text-brand-strong">
                            {directTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-soft">Indirect beneficiaries</span>
                          <span className="text-base font-semibold text-brand-strong">
                            {indirectTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-lg border border-brand bg-white px-3 py-3 text-xs uppercase tracking-wide text-brand-soft">
                        {projectRows.map((row) => (
                          <div key={`${project.id}-${row.key}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[11px]">
                            <span className="truncate text-brand-muted">{row.label}</span>
                            <span className="text-right font-semibold text-brand-strong">
                              D: {row.direct.toLocaleString()}
                            </span>
                            <span className="text-right font-semibold text-brand-strong">
                              I: {row.indirect.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(project.id)}
                        className="self-end rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="px-6 py-8 text-sm text-brand-soft">
                No projects recorded yet. Use the form above to add your first project.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
