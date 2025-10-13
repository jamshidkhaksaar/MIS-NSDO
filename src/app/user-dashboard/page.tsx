"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  ALL_SECTOR_KEY,
  BENEFICIARY_GROUPS,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
} from "@/lib/dashboard-data";
import type {
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  SectorKey,
} from "@/context/DashboardDataContext";

type BeneficiaryFormState = BeneficiaryBreakdown;

type SectorFormState = {
  provinces: string;
  beneficiaries: BeneficiaryFormState;
  projects: number;
  start: string;
  end: string;
  fieldActivity: string;
  description: string;
  clusters: string;
  staff: number;
};

const createEmptyBeneficiaries = (): BeneficiaryFormState => {
  const breakdown: BeneficiaryFormState = {
    direct: {} as Record<BeneficiaryTypeKey, number>,
    indirect: {} as Record<BeneficiaryTypeKey, number>,
  };

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    breakdown.direct[key] = 0;
    breakdown.indirect[key] = 0;
  });

  return breakdown;
};

const cloneBeneficiaries = (source: BeneficiaryBreakdown | undefined): BeneficiaryFormState => {
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

const EMPTY_FORM_STATE: SectorFormState = {
  provinces: "",
  beneficiaries: createEmptyBeneficiaries(),
  projects: 0,
  start: "",
  end: "",
  fieldActivity: "",
  description: "",
  clusters: "",
  staff: 0,
};

export default function UserDashboard() {
  const {
    sectors,
    reportingYears,
    updateSector,
    addReportingYear,
    removeReportingYear,
    complaints,
    removeComplaint,
    isLoading,
  } = useDashboardData();

  const sectorKeys = useMemo(
    () =>
      Object.keys(sectors)
        .filter((key) => key !== ALL_SECTOR_KEY) as SectorKey[],
    [sectors]
  );

  const [selectedSector, setSelectedSector] = useState<SectorKey>(
    () => sectorKeys[0] ?? "Humanitarian"
  );
  const [formState, setFormState] = useState<SectorFormState>(EMPTY_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [newYearInput, setNewYearInput] = useState("");

  useEffect(() => {
    if (!selectedSector || !sectors[selectedSector]) {
      return;
    }
    const data = sectors[selectedSector];
    setFormState({
      provinces: data.provinces.join(", "),
      beneficiaries: cloneBeneficiaries(data.beneficiaries),
      projects: data.projects,
      start: data.start,
      end: data.end,
      fieldActivity: data.fieldActivity,
      staff: data.staff,
    });
  }, [selectedSector, sectors]);

  const handleSectorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSector(event.target.value as SectorKey);
    setSaveMessage(null);
  };

  const handleBeneficiaryChange = (
    view: "direct" | "indirect",
    category: BeneficiaryTypeKey,
    value: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      beneficiaries: {
        ...prev.beneficiaries,
        [view]: {
          ...prev.beneficiaries[view],
          [category]: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
        },
      },
    }));
  };

  const handleNumericFieldChange = (
    field: "projects" | "staff",
    value: number
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0,
    }));
  };

  const handleTextFieldChange = (
    field: "start" | "end" | "fieldActivity" | "provinces",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSector) {
      return;
    }

    setIsSaving(true);
    const provinceList = formState.provinces
      .split(",")
      .map((province) => province.trim())
      .filter(Boolean);

    updateSector(selectedSector, {
      provinces: provinceList,
      beneficiaries: cloneBeneficiaries(formState.beneficiaries),
      projects: formState.projects,
      start: formState.start || sectors[selectedSector]?.start || "",
      end: formState.end || sectors[selectedSector]?.end || "",
      fieldActivity: formState.fieldActivity || sectors[selectedSector]?.fieldActivity || "",
      staff: formState.staff,
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("Updates saved to the live dashboard.");
    }, 250);
  };

  const handleAddYear = () => {
    const parsed = Number(newYearInput);
    if (!Number.isFinite(parsed)) {
      setSaveMessage("Enter a valid year before adding.");
      return;
    }
    addReportingYear(Math.floor(parsed));
    setNewYearInput("");
    setSaveMessage(`Year ${Math.floor(parsed)} added.`);
  };

  const handleRemoveYear = (year: number) => {
    removeReportingYear(year);
    setSaveMessage(`Year ${year} removed.`);
  };

  if (isLoading && !sectorKeys.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-tint text-brand-soft">
        Loading data-entry workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-strong">
              Data Entry Workspace
            </h1>
            <p className="text-sm text-brand-soft">
              Manage sector metrics and reporting periods powering the public dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              View Dashboard
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
          <form className="space-y-8 p-6" onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand pb-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-strong">
                  Sector Configuration
                </h2>
                <p className="text-sm text-brand-soft">
                  Pick a sector to tune its provincial coverage, targets, and beneficiaries.
                </p>
              </div>
              <label className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Select Sector</span>
                <select
                  value={selectedSector}
                  onChange={handleSectorChange}
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm font-medium text-brand-muted"
                >
                  {sectorKeys.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-xl border border-brand bg-brand-soft px-4 py-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      Provinces Served
                    </span>
                    <textarea
                      value={formState.provinces}
                      onChange={(event) =>
                        handleTextFieldChange("provinces", event.target.value)
                      }
                      rows={4}
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                      placeholder="Comma-separated list, e.g. Kabul, Herat, Parwan"
                    />
                  </label>
                  <p className="mt-2 text-xs text-brand-soft">
                    Entries are auto-sorted alphabetically on save. Duplicate names are removed.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      Active Projects
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formState.projects}
                      onChange={(event) =>
                        handleNumericFieldChange("projects", Number(event.target.value))
                      }
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      Total Staff
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={formState.staff}
                      onChange={(event) =>
                        handleNumericFieldChange("staff", Number(event.target.value))
                      }
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      Start Date
                    </span>
                    <input
                      type="text"
                      value={formState.start}
                      onChange={(event) =>
                        handleTextFieldChange("start", event.target.value)
                      }
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                      placeholder="e.g. 01 Jan 2024"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                    <span className="text-xs uppercase tracking-wide text-brand-soft">
                      End Date
                    </span>
                    <input
                      type="text"
                      value={formState.end}
                      onChange={(event) =>
                        handleTextFieldChange("end", event.target.value)
                      }
                      className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                      placeholder="e.g. 31 Dec 2025"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">
                    Current Focus / Field Activity
                  </span>
                  <textarea
                    value={formState.fieldActivity}
                    onChange={(event) =>
                      handleTextFieldChange("fieldActivity", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted bg-white"
                    placeholder="Brief description of priority activities"
                  />
                </label>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-brand bg-brand-soft px-4 py-4">
                  <h3 className="text-sm font-semibold text-brand-strong">
                    Beneficiary Breakdown
                  </h3>
                  <p className="mb-4 text-xs text-brand-soft">
                    Capture direct and indirect beneficiary reach for each cohort.
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {( ["direct", "indirect"] as const).map((view) => (
                      <div key={view} className="space-y-4">
                        <h4 className="text-sm font-semibold text-brand-strong">
                          {view === "direct" ? "Direct Beneficiaries" : "Indirect Beneficiaries"}
                        </h4>
                        {BENEFICIARY_GROUPS.map((group) => (
                          <div
                            key={`${view}-${group.key}`}
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
                                    key={`${view}-${member}`}
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

                <div className="rounded-xl border border-brand bg-white px-4 py-4">
                  <h3 className="text-sm font-semibold text-brand-strong">
                    Reporting Years
                  </h3>
                  <p className="mb-3 text-xs text-brand-soft">
                    These values populate the year filter across the public dashboard.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {reportingYears.map((year) => (
                      <div
                        key={year}
                        className="flex items-center gap-2 rounded-full border border-brand bg-brand-soft px-3 py-1 text-sm font-medium text-brand-muted"
                      >
                        <span>{year}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveYear(year)}
                          className="rounded-full border border-transparent p-1 text-xs text-brand-soft transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          aria-label={`Remove year ${year}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Add year"
                      value={newYearInput}
                      onChange={(event) => setNewYearInput(event.target.value)}
                      className="w-32 rounded-lg input-brand px-3 py-2 text-sm text-brand-muted"
                    />
                    <button
                      type="button"
                      onClick={handleAddYear}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white btn-brand disabled:opacity-70"
                      disabled={!newYearInput.trim()}
                    >
                      Add Year
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-brand pt-6">
              <div className="text-sm text-brand-soft">
                {saveMessage ? (
                  <span className="font-medium text-emerald-600">{saveMessage}</span>
                ) : (
                  "Changes persist immediately for the current session."
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-lg px-4 py-2 text-sm font-medium chip-brand"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg px-5 py-2 text-sm font-semibold text-white btn-brand disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-brand bg-white shadow-brand-soft">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-strong">Complaint Inbox</h2>
              <p className="text-sm text-brand-soft">
                Complaints submitted via the public form appear here for MEAL review.
              </p>
            </div>
            <Link
              href="/complaint-form"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Open Complaint Form
            </Link>
          </div>

          <div className="divide-y divide-emerald-50">
            {complaints.length ? (
              complaints.map((complaint) => {
                const submittedDate = new Date(complaint.submittedAt);
                const formattedDate = Number.isNaN(submittedDate.getTime())
                  ? complaint.submittedAt
                  : submittedDate.toLocaleString();

                return (
                  <article
                    key={complaint.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-strong">{complaint.fullName}</p>
                          <p className="text-xs text-brand-soft">{complaint.email}{complaint.phone ? ` • ${complaint.phone}` : ""}</p>
                        </div>
                        <span className="text-xs uppercase tracking-wide text-brand-soft">{formattedDate}</span>
                      </div>
                      <p className="rounded-lg border border-brand bg-brand-soft px-4 py-3 text-sm text-brand-muted whitespace-pre-wrap">
                        {complaint.message}
                      </p>
                    </div>
                    <div className="flex items-start justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={async () => {
                          await removeComplaint(complaint.id);
                        }}
                        className="rounded-full border border-brand-strong bg-white px-4 py-2 font-semibold text-brand-muted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Archive
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="px-6 py-8 text-sm text-brand-soft">
                No complaints submitted yet. New entries will appear here instantly.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
