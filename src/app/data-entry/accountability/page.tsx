"use client";

import { useMemo, useState } from "react";
import ProjectSelect from "../(components)/ProjectSelect";
import { useDashboardData } from "@/context/DashboardDataContext";

type FeedbackState = {
  message: string | null;
  tone: "positive" | "negative";
};

const FINDING_TYPES = [
  { value: "negative", label: "Negative" },
  { value: "positive", label: "Positive" },
] as const;

const FINDING_SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
] as const;

const FINDING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "solved", label: "Resolved" },
] as const;

export default function AccountabilityPage() {
  const { findings, crmAwareness, refresh, projects } = useDashboardData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [findingForm, setFindingForm] = useState({
    findingType: "negative",
    category: "",
    severity: "minor",
    department: "",
    status: "pending",
    description: "",
    evidenceUrl: "",
    reminderDueAt: "",
  });

  const [crmForm, setCrmForm] = useState({
    district: "",
    awarenessDate: "",
    notes: "",
  });

  const [isSubmittingFinding, setIsSubmittingFinding] = useState(false);
  const [isSubmittingCrm, setIsSubmittingCrm] = useState(false);
  const [findingFeedback, setFindingFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [crmFeedback, setCrmFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });

  const findingsForProject = useMemo(
    () => findings.findings.filter((item) => !selectedProjectId || item.projectId === selectedProjectId),
    [findings.findings, selectedProjectId]
  );

  const crmRecords = useMemo(
    () =>
      crmAwareness.filter((item) => !selectedProjectId || item.projectId === selectedProjectId),
    [crmAwareness, selectedProjectId]
  );

  const handleFindingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setFindingFeedback({ message: "Select a project before logging a finding.", tone: "negative" });
      return;
    }
    setIsSubmittingFinding(true);
    setFindingFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/accountability/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          findingType: findingForm.findingType,
          category: findingForm.category || undefined,
          severity: findingForm.severity,
          department: findingForm.department || undefined,
          status: findingForm.status,
          description: findingForm.description || undefined,
          evidenceUrl: findingForm.evidenceUrl || undefined,
          reminderDueAt: findingForm.reminderDueAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save finding." }));
        throw new Error(error.message ?? "Unable to save finding.");
      }

      setFindingForm({
        findingType: "negative",
        category: "",
        severity: "minor",
        department: "",
        status: "pending",
        description: "",
        evidenceUrl: "",
        reminderDueAt: "",
      });
      setFindingFeedback({ message: "Finding logged successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setFindingFeedback({
        message: error instanceof Error ? error.message : "Unable to save finding.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingFinding(false);
    }
  };

  const handleCrmSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setCrmFeedback({ message: "Select a project before logging CRM awareness.", tone: "negative" });
      return;
    }
    setIsSubmittingCrm(true);
    setCrmFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/accountability/crm-awareness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          district: crmForm.district || undefined,
          awarenessDate: crmForm.awarenessDate || undefined,
          notes: crmForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save CRM awareness event." }));
        throw new Error(error.message ?? "Unable to save CRM awareness event.");
      }

      setCrmForm({
        district: "",
        awarenessDate: "",
        notes: "",
      });
      setCrmFeedback({ message: "CRM awareness activity saved.", tone: "positive" });
      await refresh();
    } catch (error) {
      setCrmFeedback({
        message: error instanceof Error ? error.message : "Unable to save CRM awareness event.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingCrm(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Accountability & findings tracker</h2>
            <p className="text-sm text-brand-muted">
              Document feedback trends, CRM outreach, and programme findings that require follow-up.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProjectSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              helperText={
                projects.length
                  ? "Findings and CRM entries will link to the selected project."
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={handleFindingSubmit}
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
          >
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Log a finding</h3>
              <p className="text-sm text-brand-muted">
                Record monitoring, evaluation, or accountability findings that require programme action.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-type">
                  Finding type
                </label>
                <select
                  id="finding-type"
                  value={findingForm.findingType}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, findingType: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {FINDING_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-severity">
                  Severity
                </label>
                <select
                  id="finding-severity"
                  value={findingForm.severity}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, severity: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {FINDING_SEVERITIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-status">
                  Status
                </label>
                <select
                  id="finding-status"
                  value={findingForm.status}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {FINDING_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-category">
                  Category
                </label>
                <input
                  id="finding-category"
                  type="text"
                  value={findingForm.category}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, category: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Distribution, HR compliance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-department">
                  Responsible department
                </label>
                <input
                  id="finding-department"
                  type="text"
                  value={findingForm.department}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, department: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Programme, Logistics..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-reminder">
                  Reminder due date
                </label>
                <input
                  id="finding-reminder"
                  type="date"
                  value={findingForm.reminderDueAt}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, reminderDueAt: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-description">
                  Description
                </label>
                <textarea
                  id="finding-description"
                  value={findingForm.description}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={4}
                  placeholder="Outline the issue identified and recommended actions."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="finding-evidence">
                  Evidence / reference URL
                </label>
                <input
                  id="finding-evidence"
                  type="url"
                  value={findingForm.evidenceUrl}
                  onChange={(event) =>
                    setFindingForm((previous) => ({ ...previous, evidenceUrl: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
            {findingFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  findingFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {findingFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingFinding}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingFinding ? "Saving..." : "Save finding"}
              </button>
            </div>
          </form>

          <form onSubmit={handleCrmSubmit} className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4">
              <h3 className="text-lg font-semibold">CRM awareness activity</h3>
              <p className="text-sm text-brand-muted">
                Record community outreach sessions to update accountability metrics.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="crm-district">
                  District / locality
                </label>
                <input
                  id="crm-district"
                  type="text"
                  value={crmForm.district}
                  onChange={(event) => setCrmForm((previous) => ({ ...previous, district: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="District or community name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="crm-date">
                  Awareness date
                </label>
                <input
                  id="crm-date"
                  type="date"
                  value={crmForm.awarenessDate}
                  onChange={(event) => setCrmForm((previous) => ({ ...previous, awarenessDate: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="crm-notes">
                  Notes
                </label>
                <textarea
                  id="crm-notes"
                  value={crmForm.notes}
                  onChange={(event) => setCrmForm((previous) => ({ ...previous, notes: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Key messages shared, attendance, action points."
                />
              </div>
            </div>
            {crmFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  crmFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {crmFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingCrm}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingCrm ? "Saving..." : "Save CRM activity"}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recent findings</h3>
                <p className="text-xs text-brand-muted">A quick overview of follow-up items for this project.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {findingsForProject.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {findingsForProject.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-brand-strong">
                      {item.category ? item.category : "General finding"}
                    </p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-brand-primary">
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted capitalize">Status: {item.status.replace(/_/g, " ")}</p>
                  {item.description ? (
                    <p className="mt-2 text-xs text-brand-soft">
                      {item.description.length > 120 ? `${item.description.slice(0, 120)}…` : item.description}
                    </p>
                  ) : null}
                  {item.reminderDueAt ? (
                    <p className="mt-1 text-xs text-amber-600">
                      Reminder due: {new Date(item.reminderDueAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              ))}
              {!findingsForProject.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Log your first finding to track corrective actions.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">CRM awareness log</h3>
                <p className="text-xs text-brand-muted">Community outreach sessions and CRM messaging.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {crmRecords.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {crmRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {record.district ? record.district : "Unspecified district"}
                  </p>
                  {record.awarenessDate ? (
                    <p className="text-xs text-brand-muted">
                      {new Date(record.awarenessDate).toLocaleDateString()}
                    </p>
                  ) : null}
                  {record.notes ? (
                    <p className="mt-2 text-xs text-brand-soft">
                      {record.notes.length > 120 ? `${record.notes.slice(0, 120)}…` : record.notes}
                    </p>
                  ) : null}
                </div>
              ))}
              {!crmRecords.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Community outreach records will appear here.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
