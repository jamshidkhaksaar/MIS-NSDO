"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  BENEFICIARY_GROUPS,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  PROJECT_SECTORS,
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
  start: string;
  end: string;
  staff: number;
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
  start: "",
  end: "",
  staff: 0,
};

function sortProjects(projects: DashboardProject[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}

const PROJECT_STATUS_META: Record<
  "active" | "upcoming" | "completed",
  { label: string; description: string; tone: string }
> = {
  active: {
    label: "Active",
    description: "Project currently in delivery window.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  upcoming: {
    label: "Upcoming",
    description: "Starts in the future; prepare for mobilisation.",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Completed",
    description: "Project timeline has ended; archive results.",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function getProjectStatus(project: DashboardProject): keyof typeof PROJECT_STATUS_META {
  const now = Date.now();
  const startTime = project.start ? Date.parse(project.start) : Number.NaN;
  const endTime = project.end ? Date.parse(project.end) : Number.NaN;

  const hasStart = !Number.isNaN(startTime);
  const hasEnd = !Number.isNaN(endTime);

  if (hasEnd && endTime < now) {
    return "completed";
  }

  if (hasStart && startTime > now) {
    return "upcoming";
  }

  return "active";
}

const sortAlphabetical = (items: string[]): string[] =>
  [...items].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

export default function ProjectsPage() {
  const {
    projects,
    addProject,
    updateProject,
    removeProject,
    clusterCatalog,
    sectorCatalog,
    registerCluster,
    registerSector,
    isLoading,
  } = useDashboardData();
  const [formState, setFormState] = useState<ProjectFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [locationInputs, setLocationInputs] = useState({
    province: "",
    district: "",
    community: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [newClusterDraft, setNewClusterDraft] = useState({ name: "", description: "" });
  const [newSectorDraft, setNewSectorDraft] = useState({ name: "", description: "" });
  const [isSavingCluster, setIsSavingCluster] = useState(false);
  const [isSavingSector, setIsSavingSector] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const locationConfigs = [
    { label: "Provinces", type: "provinces", placeholder: "Add province", inputKey: "province" },
    { label: "Districts", type: "districts", placeholder: "Add district", inputKey: "district" },
    {
      label: "Villages / Communities",
      type: "communities",
      placeholder: "Add village or community",
      inputKey: "community",
    },
  ] as const;

  const preparedProjects = useMemo(() => sortProjects(projects), [projects]);
  const isBootstrapLoading = isLoading && projects.length === 0;
  const steps = useMemo(
    () => [
      { key: "details", label: "Project Details" },
      { key: "classification", label: "Classification" },
      { key: "beneficiaries", label: "Beneficiaries" },
    ] as const,
    []
  );
  const isLastStep = currentStep === steps.length - 1;

  const clusterOptions = useMemo(() => {
    const names = new Set<string>();
    clusterCatalog.forEach((entry) => names.add(entry.name));
    formState.clusters.forEach((name) => names.add(name));
    return sortAlphabetical(Array.from(names));
  }, [clusterCatalog, formState.clusters]);

  const sectorOptions = useMemo(() => {
    const names = new Set<string>();
    sectorCatalog.forEach((entry) => names.add(entry.name));
    formState.standardSectors.forEach((name) => names.add(name));
    return sortAlphabetical(Array.from(names));
  }, [sectorCatalog, formState.standardSectors]);

  const primarySectorOptions = useMemo(() => {
    const names = new Set<string>(PROJECT_SECTORS);
    projects.forEach((project) => names.add(project.sector.toString()));
    sectorCatalog.forEach((entry) => names.add(entry.name));
    return sortAlphabetical(Array.from(names));
  }, [projects, sectorCatalog]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) {
      return null;
    }
    return preparedProjects.find((project) => project.id === activeProjectId) ?? null;
  }, [preparedProjects, activeProjectId]);

  const activeTotals = useMemo(() => {
    if (!activeProject) {
      return { direct: 0, indirect: 0 };
    }
    const direct = BENEFICIARY_TYPE_KEYS.reduce(
      (sum, key) => sum + (activeProject.beneficiaries.direct?.[key] ?? 0),
      0
    );
    const indirect = BENEFICIARY_TYPE_KEYS.reduce(
      (sum, key) => sum + (activeProject.beneficiaries.indirect?.[key] ?? 0),
      0
    );
    return { direct, indirect };
  }, [activeProject]);

  const activeBeneficiaryRows = useMemo(() => {
    if (!activeProject) {
      return [] as Array<{ key: BeneficiaryTypeKey; label: string; direct: number; indirect: number }>;
    }
    return BENEFICIARY_TYPE_KEYS.map((key) => ({
      key,
      label: BENEFICIARY_TYPE_META[key].label,
      direct: activeProject.beneficiaries.direct?.[key] ?? 0,
      indirect: activeProject.beneficiaries.indirect?.[key] ?? 0,
    }));
  }, [activeProject]);

  useEffect(() => {
    if (editingProjectId) {
      setActiveProjectId(editingProjectId);
      return;
    }

    if (!preparedProjects.length) {
      setActiveProjectId(null);
      return;
    }

    setActiveProjectId((current) => {
      if (current && preparedProjects.some((project) => project.id === current)) {
        return current;
      }
      return preparedProjects[0]!.id;
    });
  }, [preparedProjects, editingProjectId]);
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

  const handleStartEditing = (project: DashboardProject) => {
    setError(null);
    setNotice(null);
    setEditingProjectId(project.id);
    setCurrentStep(0);
    setActiveProjectId(project.id);

    const sectorChoice = primarySectorOptions.includes(project.sector) ? project.sector : "custom";
    setFormState({
      name: project.name,
      sectorChoice,
      customSector: sectorChoice === "custom" ? project.sector : "",
      clusters: [...project.clusters],
      standardSectors: [...project.standardSectors],
      beneficiaries: cloneBeneficiaries(project.beneficiaries),
      country: project.country,
      provinces: [...project.provinces],
      districts: [...project.districts],
      communities: [...project.communities],
      goal: project.goal,
      objectives: project.objectives,
      majorAchievements: project.majorAchievements,
      start: project.start,
      end: project.end,
      staff: Number.isFinite(project.staff) ? project.staff : 0,
    });
    setLocationInputs({ province: "", district: "", community: "" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setFormState({
      ...INITIAL_FORM_STATE,
      sectorChoice: PROJECT_SECTORS[0] ?? "",
      beneficiaries: createEmptyBeneficiaries(),
    });
    setLocationInputs({ province: "", district: "", community: "" });
    setNotice(null);
    setError(null);
    setCurrentStep(0);
    setNewClusterDraft({ name: "", description: "" });
    setNewSectorDraft({ name: "", description: "" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isLastStep) {
      handleNextStep();
      return;
    }

    if (!validateStep(0) || !validateStep(1)) {
      return;
    }

    if (!formState.goal.trim()) {
      setError("Describe the project goal.");
      setCurrentStep(2);
      return;
    }

    if (!formState.objectives.trim()) {
      setError("Outline the project objectives.");
      setCurrentStep(2);
      return;
    }

    if (!formState.majorAchievements.trim()) {
      setError("Provide major achievements or expected results.");
      setCurrentStep(2);
      return;
    }

    const sector =
      formState.sectorChoice === "custom"
        ? formState.customSector.trim()
        : formState.sectorChoice;
    if (!sector) {
      setError("Select or enter the primary sector before saving.");
      setCurrentStep(0);
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
      setCurrentStep(2);
      return;
    }

    if (formState.start && formState.end) {
      const startTime = Date.parse(formState.start);
      const endTime = Date.parse(formState.end);
      if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime < startTime) {
        setError("Project end date must be on or after the start date.");
        setCurrentStep(0);
        return;
      }
    }

    if (!Number.isFinite(formState.staff) || formState.staff < 0) {
      setError("Enter the number of project staff (0 or more).");
      setCurrentStep(0);
      return;
    }

    const payload: Omit<DashboardProject, "id"> = {
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
      start: formState.start.trim(),
      end: formState.end.trim(),
      staff: Math.max(0, Math.floor(formState.staff)),
    };

    try {
      setIsSubmitting(true);
      if (editingProjectId) {
        await updateProject(editingProjectId, payload);
        setNotice("Project updated successfully.");
      } else {
        await addProject(payload);
        setNotice("Project recorded successfully.");
      }

      const nextSectorChoice =
        formState.sectorChoice === "custom"
          ? primarySectorOptions[0] ?? ""
          : formState.sectorChoice;

      setFormState({
        ...INITIAL_FORM_STATE,
        sectorChoice: nextSectorChoice,
        beneficiaries: createEmptyBeneficiaries(),
      });
      setEditingProjectId(null);
      setLocationInputs({ province: "", district: "", community: "" });
      setCurrentStep(0);
      setNewClusterDraft({ name: "", description: "" });
      setNewSectorDraft({ name: "", description: "" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    await removeProject(projectId);
    setActiveProjectId((current) => (current === projectId ? null : current));
    if (editingProjectId === projectId) {
      handleCancelEdit();
    }
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
          clusters: sortAlphabetical(next),
        };
      });
    },
    []
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
          standardSectors: sortAlphabetical(next),
        };
      });
    },
    []
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

  const validateStep = useCallback((stepIndex: number) => {
    const sectorValue =
      formState.sectorChoice === "custom"
        ? formState.customSector.trim()
        : formState.sectorChoice;

    if (stepIndex === 0) {
      if (!formState.name.trim()) {
        setError("Enter the project name before continuing.");
        setCurrentStep(0);
        return false;
      }

      if (!sectorValue) {
        setError("Select or enter the primary sector before continuing.");
        setCurrentStep(0);
        return false;
      }

      if (!formState.country.trim()) {
        setError("Specify the country of implementation before continuing.");
        setCurrentStep(0);
        return false;
      }

      return true;
    }

    if (stepIndex === 1) {
      if (!formState.clusters.length) {
        setError("Select at least one response cluster for this project.");
        setCurrentStep(1);
        return false;
      }

      if (!formState.standardSectors.length) {
        setError("Highlight at least one sector alignment before proceeding.");
        setCurrentStep(1);
        return false;
      }

      return true;
    }

    return true;
  }, [formState]);

  const handleNextStep = useCallback(() => {
    setError(null);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep, steps.length, validateStep]);

  const handlePreviousStep = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.max(0, prev - 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleAddClusterToCatalog = async () => {
    const trimmedName = newClusterDraft.name.trim();
    if (!trimmedName) {
      setError("Provide a cluster name before adding it to the catalog.");
      return;
    }

    try {
      setIsSavingCluster(true);
      const entry = await registerCluster({
        name: trimmedName,
        description: newClusterDraft.description.trim() || undefined,
      });
      setFormState((prev) => ({
        ...prev,
        clusters: sortAlphabetical([...prev.clusters, entry.name]),
      }));
      setNewClusterDraft({ name: "", description: "" });
      setNotice(`Cluster "${entry.name}" added and selected.`);
      setError(null);
    } catch (catalogError) {
      setError(catalogError instanceof Error ? catalogError.message : "Unable to store cluster.");
    } finally {
      setIsSavingCluster(false);
    }
  };

  const handleAddSectorToCatalog = async () => {
    const trimmedName = newSectorDraft.name.trim();
    if (!trimmedName) {
      setError("Provide a sector name before adding it to the catalog.");
      return;
    }

    try {
      setIsSavingSector(true);
      const entry = await registerSector({
        name: trimmedName,
        description: newSectorDraft.description.trim() || undefined,
      });
      setFormState((prev) => ({
        ...prev,
        standardSectors: sortAlphabetical([...prev.standardSectors, entry.name]),
      }));
      setNewSectorDraft({ name: "", description: "" });
      setNotice(`Sector "${entry.name}" added and selected.`);
      setError(null);
    } catch (catalogError) {
      setError(catalogError instanceof Error ? catalogError.message : "Unable to store sector.");
    } finally {
      setIsSavingSector(false);
    }
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
          <form className="flex flex-col gap-8 p-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-3">
                <ol className="flex flex-wrap items-center gap-3">
                  {steps.map((step, index) => {
                    const isCurrent = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                      <li key={step.key} className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
                            isCurrent
                              ? "border-brand bg-brand text-white"
                              : isCompleted
                              ? "border-brand bg-brand-soft text-brand-strong"
                              : "border-brand bg-white text-brand-muted"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isCurrent ? "text-brand-strong" : "text-brand-soft"
                          }`}
                        >
                          {step.label}
                        </span>
                        {index < steps.length - 1 ? (
                          <span className="mx-2 hidden h-px w-10 bg-brand-tint md:block" aria-hidden />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
                {editingProjectId ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Editing an existing project. Changes will update the live registry.
                  </div>
                ) : null}
              </div>

              {currentStep === 0 ? (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-strong">Project Information</h2>
                    <p className="text-sm text-brand-soft">
                      Provide the official project title, delivery timeline, and staffing footprint.
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
                        {primarySectorOptions.map((sector) => (
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

                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">Start date</span>
                      <input
                        type="date"
                        value={formState.start}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, start: event.target.value }))
                        }
                        className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">End date</span>
                      <input
                        type="date"
                        value={formState.end}
                        min={formState.start || undefined}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, end: event.target.value }))
                        }
                        className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">
                        Team size (number of staff)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={Number.isNaN(formState.staff) ? "" : formState.staff}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setFormState((prev) => ({
                            ...prev,
                            staff: Number.isNaN(value) ? 0 : value,
                          }));
                        }}
                        placeholder="e.g. 12"
                        className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                      />
                    </label>
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
                            <span className="text-xs font-normal text-brand-soft">No entries yet</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {currentStep === 1 ? (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-strong">Classification</h2>
                    <p className="text-sm text-brand-soft">
                      Link this project to response clusters and sector frameworks. You can register new catalogue entries on the fly.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-brand-soft">Response clusters</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">
                          {formState.clusters.length ? `${formState.clusters.length} selected` : "Select applicable clusters"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {clusterOptions.length ? (
                          clusterOptions.map((option) => {
                            const isSelected = formState.clusters.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleClusterToggle(option)}
                                aria-pressed={isSelected}
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                  isSelected
                                    ? "border-transparent toggle-pill toggle-pill-active"
                                    : "border border-brand bg-brand-soft text-brand-muted toggle-pill"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-xs text-brand-soft">No clusters registered yet. Add one below.</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_3fr_auto]">
                        <input
                          type="text"
                          value={newClusterDraft.name}
                          onChange={(event) => setNewClusterDraft((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="New cluster name"
                          className="rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                        />
                        <input
                          type="text"
                          value={newClusterDraft.description}
                          onChange={(event) =>
                            setNewClusterDraft((prev) => ({ ...prev, description: event.target.value }))
                          }
                          placeholder="Optional description"
                          className="rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                        />
                        <button
                          type="button"
                          onClick={handleAddClusterToCatalog}
                          disabled={isSavingCluster}
                          className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide btn-brand disabled:opacity-70"
                        >
                          {isSavingCluster ? "Saving..." : "Add cluster"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-wide text-brand-soft">Sector alignment</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">
                          {formState.standardSectors.length ? `${formState.standardSectors.length} selected` : "Highlight relevant sectors"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sectorOptions.length ? (
                          sectorOptions.map((option) => {
                            const isSelected = formState.standardSectors.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleStandardSectorToggle(option)}
                                aria-pressed={isSelected}
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                  isSelected
                                    ? "border-transparent toggle-pill toggle-pill-active"
                                    : "border border-brand bg-white text-brand-muted toggle-pill"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-xs text-brand-soft">No sectors registered yet. Add one below.</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_3fr_auto]">
                        <input
                          type="text"
                          value={newSectorDraft.name}
                          onChange={(event) => setNewSectorDraft((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="New sector label"
                          className="rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                        />
                        <input
                          type="text"
                          value={newSectorDraft.description}
                          onChange={(event) =>
                            setNewSectorDraft((prev) => ({ ...prev, description: event.target.value }))
                          }
                          placeholder="Optional description"
                          className="rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                        />
                        <button
                          type="button"
                          onClick={handleAddSectorToCatalog}
                          disabled={isSavingSector}
                          className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide btn-brand disabled:opacity-70"
                        >
                          {isSavingSector ? "Saving..." : "Add sector"}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {currentStep === 2 ? (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-brand-strong">Beneficiaries &amp; Summary</h2>
                    <p className="text-sm text-brand-soft">
                      Capture beneficiary reach and narrative details. Totals update automatically as you enter figures.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  <div className="grid grid-cols-1 gap-4">
                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">Project goal</span>
                      <textarea
                        value={formState.goal}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, goal: event.target.value }))
                        }
                        rows={3}
                        placeholder="High-level goal outlining the intended change."
                        className="w-full rounded-lg input-brand bg-white px-4 py-3 text-sm text-brand-muted"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">Objectives</span>
                      <textarea
                        value={formState.objectives}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, objectives: event.target.value }))
                        }
                        rows={4}
                        placeholder="List key objectives. Use bullet points or sentences."
                        className="w-full rounded-lg input-brand bg-white px-4 py-3 text-sm text-brand-muted"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                      <span className="text-xs uppercase tracking-wide text-brand-soft">Major achievements</span>
                      <textarea
                        value={formState.majorAchievements}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, majorAchievements: event.target.value }))
                        }
                        rows={4}
                        placeholder="Summarise achievements or significant milestones."
                        className="w-full rounded-lg input-brand bg-white px-4 py-3 text-sm text-brand-muted"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-brand bg-brand-soft px-4 py-5">
                    <h3 className="text-sm font-semibold text-brand-strong">Beneficiary details</h3>
                    <p className="mt-1 text-xs text-brand-soft">
                      Record direct and indirect reach by beneficiary type. Totals appear above.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                      {( ["direct", "indirect"] as const).map((view) => (
                        <div key={`project-${view}`} className="space-y-4">
                          <h4 className="text-sm font-semibold text-brand-strong">
                            {view === "direct" ? "Direct beneficiaries" : "Indirect beneficiaries"}
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
                </section>
              ) : null}

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

              <div className="flex flex-wrap items-center justify-between gap-3">
                {editingProjectId ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-brand px-5 py-2 text-sm font-semibold text-brand-muted hover:bg-brand-soft"
                  >
                    Cancel edit
                  </button>
                ) : <span />}

                <div className="flex flex-wrap items-center gap-3">
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="rounded-lg border border-brand px-5 py-2 text-sm font-semibold text-brand-muted hover:bg-brand-soft"
                    >
                      Previous
                    </button>
                  ) : null}

                  <button
                    type={isLastStep ? "submit" : "button"}
                    onClick={isLastStep ? undefined : handleNextStep}
                    disabled={isLastStep ? isSubmitting : false}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-white btn-brand disabled:opacity-70"
                  >
                    {isLastStep
                      ? isSubmitting
                        ? editingProjectId
                          ? "Updating..."
                          : "Saving..."
                        : editingProjectId
                        ? "Update Project"
                        : "Save Project"
                      : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-brand bg-white shadow-brand-soft">
          <div className="border-b border-brand px-6 py-4">
            <h2 className="text-lg font-semibold text-brand-strong">Recorded Projects</h2>
            <p className="text-sm text-brand-soft">
              Browse the portfolio, then open a project to review or update its details.
            </p>
          </div>
          {preparedProjects.length ? (
            <div className="grid gap-6 px-6 py-5 md:grid-cols-[minmax(260px,320px)_1fr]">
              <aside className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
                {preparedProjects.map((project) => {
                  const statusKey = getProjectStatus(project);
                  const statusMeta = PROJECT_STATUS_META[statusKey];
                  const totalBeneficiaries = BENEFICIARY_TYPE_KEYS.reduce(
                    (sum, key) =>
                      sum + (project.beneficiaries.direct?.[key] ?? 0) + (project.beneficiaries.indirect?.[key] ?? 0),
                    0
                  );
                  const isActive = project.id === activeProjectId;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setActiveProjectId(project.id)}
                      className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        isActive
                          ? "border-brand bg-brand-soft text-brand-strong shadow-brand-soft"
                          : "border-transparent bg-brand-soft/40 text-brand-muted hover:border-brand hover:bg-brand-soft"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{project.name}</p>
                          <p className="text-[11px] uppercase tracking-wide text-brand-soft">{project.sector}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.tone}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-brand-soft">
                        <span>{project.start || "Start ?"}</span>
                        <span>→</span>
                        <span>{project.end || "End ?"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>{project.country}</span>
                        <span>{totalBeneficiaries.toLocaleString()} people</span>
                      </div>
                    </button>
                  );
                })}
              </aside>

              <div className="rounded-2xl border border-brand bg-white px-5 py-5 shadow-sm">
                {activeProject ? (
                  <div className="flex h-full flex-col gap-5">
                    <header className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-brand-strong">{activeProject.name}</h3>
                          <p className="text-sm uppercase tracking-wide text-blue-600">{activeProject.sector}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditing(activeProject)}
                            className="rounded-full border border-brand bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted transition hover:bg-brand-soft"
                          >
                            Edit Project
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(activeProject.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-brand-soft">
                        <span>{activeProject.start || "Start ?"}</span>
                        <span>→</span>
                        <span>{activeProject.end || "End ?"}</span>
                        <span className="ml-2 rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
                          Team: {Number.isFinite(activeProject.staff) ? activeProject.staff.toLocaleString() : "—"}
                        </span>
                      </div>
                    </header>

                    {(activeProject.clusters.length || activeProject.standardSectors.length) && (
                      <div className="space-y-3 text-sm text-brand-muted">
                        {activeProject.clusters.length ? (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-brand-soft">Response clusters</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {activeProject.clusters.map((cluster) => (
                                <span
                                  key={cluster}
                                  className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700"
                                >
                                  {cluster}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {activeProject.standardSectors.length ? (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-brand-soft">Sector alignment</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {activeProject.standardSectors.map((sectorLabel) => (
                                <span
                                  key={sectorLabel}
                                  className="rounded-full border border-brand bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted"
                                >
                                  {sectorLabel}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 text-sm text-brand-muted md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Country</span>
                        <p className="mt-1 text-brand-muted">{activeProject.country}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Provinces</span>
                        <p className="mt-1 text-brand-muted">
                          {activeProject.provinces.length ? activeProject.provinces.join(", ") : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Districts</span>
                        <p className="mt-1 text-brand-muted">
                          {activeProject.districts.length ? activeProject.districts.join(", ") : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Communities</span>
                        <p className="mt-1 text-brand-muted">
                          {activeProject.communities.length ? activeProject.communities.join(", ") : "—"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Goal</span>
                        <p className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2">
                          {activeProject.goal || "No goal recorded."}
                        </p>
                      </div>
                      <div className="md:col-span-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Objectives</span>
                        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2">
                          {activeProject.objectives || "No objectives recorded."}
                        </pre>
                      </div>
                      <div className="md:col-span-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Major achievements</span>
                        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-soft px-3 py-2">
                          {activeProject.majorAchievements || "No achievements captured yet."}
                        </pre>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm text-brand-muted md:grid-cols-2">
                      <div className="rounded-xl border border-brand bg-brand-soft px-4 py-4">
                        <span className="text-xs uppercase tracking-wide text-brand-soft">Direct beneficiaries</span>
                        <p className="mt-2 text-2xl font-semibold text-brand-strong">
                          {activeTotals.direct.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-brand bg-brand-soft px-4 py-4">
                        <span className="text-xs uppercase tracking-wide text-brand-soft">Indirect beneficiaries</span>
                        <p className="mt-2 text-2xl font-semibold text-brand-strong">
                          {activeTotals.indirect.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-brand bg-white px-4 py-4 text-xs uppercase tracking-wide text-brand-soft">
                      {activeBeneficiaryRows.map((row) => (
                        <div key={`active-${row.key}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[11px]">
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
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-brand-soft">
                    Select a project to review its details.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-brand-soft">
              No projects recorded yet. Use the form above to add your first project.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
