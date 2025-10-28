"use client";

import { useMemo, useState } from "react";
import ProjectSelect from "../(components)/ProjectSelect";
import { useDashboardData } from "@/context/DashboardDataContext";

type FeedbackState = {
  message: string | null;
  tone: "positive" | "negative";
};

const BASELINE_TOOLS = [
  { value: "manual", label: "Manual" },
  { value: "kobo", label: "KoBo" },
  { value: "other", label: "Other" },
] as const;

const BASELINE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

const MONTHLY_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "feedback", label: "Needs feedback" },
] as const;

export default function MonitoringPage() {
  const { monitoring, projects, refresh } = useDashboardData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [baselineForm, setBaselineForm] = useState({
    title: "",
    tool: "manual",
    status: "draft",
    questionnaireUrl: "",
  });
  const [fieldVisitForm, setFieldVisitForm] = useState({
    visitDate: "",
    location: "",
    positiveFindings: "",
    negativeFindings: "",
    officer: "",
    photoUrl: "",
    gpsCoordinates: "",
  });
  const [monthlyForm, setMonthlyForm] = useState({
    reportMonth: "",
    summary: "",
    gaps: "",
    recommendations: "",
    status: "draft",
    reviewer: "",
    feedback: "",
    submittedAt: "",
  });
  const [enumeratorForm, setEnumeratorForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    province: "",
  });

  const [isSubmittingBaseline, setIsSubmittingBaseline] = useState(false);
  const [isSubmittingFieldVisit, setIsSubmittingFieldVisit] = useState(false);
  const [isSubmittingMonthly, setIsSubmittingMonthly] = useState(false);
  const [isSubmittingEnumerator, setIsSubmittingEnumerator] = useState(false);

  const [baselineFeedback, setBaselineFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [fieldVisitFeedback, setFieldVisitFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [monthlyFeedback, setMonthlyFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [enumeratorFeedback, setEnumeratorFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });

  const baselineSurveys = useMemo(
    () => monitoring.baselineSurveys.filter((survey) => !selectedProjectId || survey.projectId === selectedProjectId),
    [monitoring.baselineSurveys, selectedProjectId]
  );

  const fieldVisits = useMemo(
    () => monitoring.fieldVisits.filter((visit) => !selectedProjectId || visit.projectId === selectedProjectId),
    [monitoring.fieldVisits, selectedProjectId]
  );

  const monthlyReports = useMemo(
    () => monitoring.monthlyReports.filter((report) => !selectedProjectId || report.projectId === selectedProjectId),
    [monitoring.monthlyReports, selectedProjectId]
  );

  const handleBaselineSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setBaselineFeedback({ message: "Choose a project before logging a survey.", tone: "negative" });
      return;
    }
    setIsSubmittingBaseline(true);
    setBaselineFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/monitoring/baseline-surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: baselineForm.title,
          tool: baselineForm.tool,
          status: baselineForm.status,
          questionnaireUrl: baselineForm.questionnaireUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save baseline survey." }));
        throw new Error(error.message ?? "Unable to save baseline survey.");
      }

      setBaselineForm({
        title: "",
        tool: "manual",
        status: "draft",
        questionnaireUrl: "",
      });
      setBaselineFeedback({ message: "Baseline survey recorded successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setBaselineFeedback({
        message: error instanceof Error ? error.message : "Unable to save baseline survey.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingBaseline(false);
    }
  };

  const handleFieldVisitSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setFieldVisitFeedback({ message: "Choose a project before logging a field visit.", tone: "negative" });
      return;
    }
    setIsSubmittingFieldVisit(true);
    setFieldVisitFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/monitoring/field-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          visitDate: fieldVisitForm.visitDate,
          location: fieldVisitForm.location || undefined,
          positiveFindings: fieldVisitForm.positiveFindings || undefined,
          negativeFindings: fieldVisitForm.negativeFindings || undefined,
          officer: fieldVisitForm.officer || undefined,
          photoUrl: fieldVisitForm.photoUrl || undefined,
          gpsCoordinates: fieldVisitForm.gpsCoordinates || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save field visit." }));
        throw new Error(error.message ?? "Unable to save field visit.");
      }

      setFieldVisitForm({
        visitDate: "",
        location: "",
        positiveFindings: "",
        negativeFindings: "",
        officer: "",
        photoUrl: "",
        gpsCoordinates: "",
      });
      setFieldVisitFeedback({ message: "Field visit logged successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setFieldVisitFeedback({
        message: error instanceof Error ? error.message : "Unable to save field visit.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingFieldVisit(false);
    }
  };

  const handleMonthlySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setMonthlyFeedback({ message: "Choose a project before saving the monthly narrative.", tone: "negative" });
      return;
    }
    setIsSubmittingMonthly(true);
    setMonthlyFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/monitoring/monthly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          reportMonth: monthlyForm.reportMonth,
          summary: monthlyForm.summary || undefined,
          gaps: monthlyForm.gaps || undefined,
          recommendations: monthlyForm.recommendations || undefined,
          status: monthlyForm.status,
          reviewer: monthlyForm.reviewer || undefined,
          feedback: monthlyForm.feedback || undefined,
          submittedAt: monthlyForm.submittedAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save monthly report." }));
        throw new Error(error.message ?? "Unable to save monthly report.");
      }

      setMonthlyForm({
        reportMonth: "",
        summary: "",
        gaps: "",
        recommendations: "",
        status: "draft",
        reviewer: "",
        feedback: "",
        submittedAt: "",
      });
      setMonthlyFeedback({ message: "Monthly narrative saved successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setMonthlyFeedback({
        message: error instanceof Error ? error.message : "Unable to save monthly report.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingMonthly(false);
    }
  };

  const handleEnumeratorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingEnumerator(true);
    setEnumeratorFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/monitoring/enumerators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: enumeratorForm.fullName,
          email: enumeratorForm.email || undefined,
          phone: enumeratorForm.phone || undefined,
          province: enumeratorForm.province || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to add enumerator." }));
        throw new Error(error.message ?? "Unable to add enumerator.");
      }

      setEnumeratorForm({
        fullName: "",
        email: "",
        phone: "",
        province: "",
      });
      setEnumeratorFeedback({ message: "Enumerator added successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setEnumeratorFeedback({
        message: error instanceof Error ? error.message : "Unable to add enumerator.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingEnumerator(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Monitoring workspace</h2>
            <p className="text-sm text-brand-muted">
              Log surveys, field missions, and monthly narratives to keep the public dashboard up to date.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProjectSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              helperText={projects.length ? "Entries below will attach to the selected project." : undefined}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <form
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
            onSubmit={handleBaselineSubmit}
          >
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Baseline survey</h3>
              <p className="text-sm text-brand-muted">
                Track instruments used during the baseline phase and share questionnaires with the wider team.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="baseline-title">
                  Survey title
                </label>
                <input
                  id="baseline-title"
                  type="text"
                  value={baselineForm.title}
                  onChange={(event) => setBaselineForm((previous) => ({ ...previous, title: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Household vulnerability assessment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="baseline-tool">
                  Tool
                </label>
                <select
                  id="baseline-tool"
                  value={baselineForm.tool}
                  onChange={(event) => setBaselineForm((previous) => ({ ...previous, tool: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {BASELINE_TOOLS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="baseline-status">
                  Status
                </label>
                <select
                  id="baseline-status"
                  value={baselineForm.status}
                  onChange={(event) => setBaselineForm((previous) => ({ ...previous, status: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {BASELINE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="baseline-url">
                  Questionnaire link (optional)
                </label>
                <input
                  id="baseline-url"
                  type="url"
                  value={baselineForm.questionnaireUrl}
                  onChange={(event) =>
                    setBaselineForm((previous) => ({ ...previous, questionnaireUrl: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
            {baselineFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  baselineFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {baselineFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingBaseline}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingBaseline ? "Saving..." : "Save baseline survey"}
              </button>
            </div>
          </form>

          <form
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
            onSubmit={handleFieldVisitSubmit}
          >
            <header className="mb-4 flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Field monitoring visit</h3>
              <p className="text-sm text-brand-muted">
                Capture observations from joint missions or supervisory visits.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-date">
                  Visit date
                </label>
                <input
                  id="field-visit-date"
                  type="date"
                  value={fieldVisitForm.visitDate}
                  onChange={(event) => setFieldVisitForm((previous) => ({ ...previous, visitDate: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-location">
                  Location
                </label>
                <input
                  id="field-visit-location"
                  type="text"
                  value={fieldVisitForm.location}
                  onChange={(event) => setFieldVisitForm((previous) => ({ ...previous, location: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="District / Province"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-positive">
                  Positive findings
                </label>
                <textarea
                  id="field-visit-positive"
                  value={fieldVisitForm.positiveFindings}
                  onChange={(event) =>
                    setFieldVisitForm((previous) => ({ ...previous, positiveFindings: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Highlights, successes, or good practices"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-negative">
                  Issues to address
                </label>
                <textarea
                  id="field-visit-negative"
                  value={fieldVisitForm.negativeFindings}
                  onChange={(event) =>
                    setFieldVisitForm((previous) => ({ ...previous, negativeFindings: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Risks, deviations, or compliance gaps"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-officer">
                  MEAL focal point
                </label>
                <input
                  id="field-visit-officer"
                  type="text"
                  value={fieldVisitForm.officer}
                  onChange={(event) => setFieldVisitForm((previous) => ({ ...previous, officer: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Name of officer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-photo">
                  Photo URL (optional)
                </label>
                <input
                  id="field-visit-photo"
                  type="url"
                  value={fieldVisitForm.photoUrl}
                  onChange={(event) => setFieldVisitForm((previous) => ({ ...previous, photoUrl: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="field-visit-gps">
                  GPS coordinates (optional)
                </label>
                <input
                  id="field-visit-gps"
                  type="text"
                  value={fieldVisitForm.gpsCoordinates}
                  onChange={(event) =>
                    setFieldVisitForm((previous) => ({ ...previous, gpsCoordinates: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="34.565, 69.207"
                />
              </div>
            </div>
            {fieldVisitFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  fieldVisitFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {fieldVisitFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingFieldVisit}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingFieldVisit ? "Saving..." : "Save field visit"}
              </button>
            </div>
          </form>

          <form
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
            onSubmit={handleMonthlySubmit}
          >
            <header className="mb-4 flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Monthly narrative</h3>
              <p className="text-sm text-brand-muted">
                Summarise monthly progress and flag any implementation gaps for coordination.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-month">
                  Reporting month
                </label>
                <input
                  id="monthly-month"
                  type="month"
                  value={monthlyForm.reportMonth}
                  onChange={(event) =>
                    setMonthlyForm((previous) => ({ ...previous, reportMonth: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-status">
                  Status
                </label>
                <select
                  id="monthly-status"
                  value={monthlyForm.status}
                  onChange={(event) => setMonthlyForm((previous) => ({ ...previous, status: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {MONTHLY_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-summary">
                  Highlights & progress
                </label>
                <textarea
                  id="monthly-summary"
                  value={monthlyForm.summary}
                  onChange={(event) => setMonthlyForm((previous) => ({ ...previous, summary: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-gaps">
                  Gaps / risks
                </label>
                <textarea
                  id="monthly-gaps"
                  value={monthlyForm.gaps}
                  onChange={(event) => setMonthlyForm((previous) => ({ ...previous, gaps: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-recommendations">
                  Recommendations
                </label>
                <textarea
                  id="monthly-recommendations"
                  value={monthlyForm.recommendations}
                  onChange={(event) =>
                    setMonthlyForm((previous) => ({ ...previous, recommendations: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-reviewer">
                  Reviewer
                </label>
                <input
                  id="monthly-reviewer"
                  type="text"
                  value={monthlyForm.reviewer}
                  onChange={(event) => setMonthlyForm((previous) => ({ ...previous, reviewer: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Programme Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-feedback">
                  Feedback
                </label>
                <input
                  id="monthly-feedback"
                  type="text"
                  value={monthlyForm.feedback}
                  onChange={(event) => setMonthlyForm((previous) => ({ ...previous, feedback: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Pending MEAL review"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="monthly-submitted">
                  Submission date (optional)
                </label>
                <input
                  id="monthly-submitted"
                  type="date"
                  value={monthlyForm.submittedAt}
                  onChange={(event) =>
                    setMonthlyForm((previous) => ({ ...previous, submittedAt: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
            </div>
            {monthlyFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  monthlyFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {monthlyFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingMonthly}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingMonthly ? "Saving..." : "Save monthly narrative"}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={handleEnumeratorSubmit}
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
          >
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Enumerator roster</h3>
              <p className="text-sm text-brand-muted">
                Register data collection staff to keep the roster updated.
              </p>
            </header>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="enumerator-name">
                  Full name
                </label>
                <input
                  id="enumerator-name"
                  type="text"
                  value={enumeratorForm.fullName}
                  onChange={(event) =>
                    setEnumeratorForm((previous) => ({ ...previous, fullName: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="enumerator-email">
                  Email
                </label>
                <input
                  id="enumerator-email"
                  type="email"
                  value={enumeratorForm.email}
                  onChange={(event) => setEnumeratorForm((previous) => ({ ...previous, email: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="name@example.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="enumerator-phone">
                  Phone
                </label>
                <input
                  id="enumerator-phone"
                  type="tel"
                  value={enumeratorForm.phone}
                  onChange={(event) => setEnumeratorForm((previous) => ({ ...previous, phone: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="+93..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="enumerator-province">
                  Province
                </label>
                <input
                  id="enumerator-province"
                  type="text"
                  value={enumeratorForm.province}
                  onChange={(event) =>
                    setEnumeratorForm((previous) => ({ ...previous, province: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Balkh, Kabul..."
                />
              </div>
            </div>
            {enumeratorFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  enumeratorFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {enumeratorFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingEnumerator}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingEnumerator ? "Saving..." : "Add enumerator"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recent baseline surveys</h3>
                <p className="text-xs text-brand-muted">
                  Latest submissions for the selected project.
                </p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {baselineSurveys.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {baselineSurveys.slice(0, 5).map((survey) => (
                <div key={survey.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">{survey.title}</p>
                  <p className="text-xs text-brand-muted">
                    {survey.tool.toUpperCase()} &middot; {survey.status.replace(/_/g, " ")}
                  </p>
                  {survey.questionnaireUrl ? (
                    <a
                      href={survey.questionnaireUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center text-xs font-semibold text-brand-primary hover:underline"
                    >
                      Open questionnaire
                    </a>
                  ) : null}
                </div>
              ))}
              {!baselineSurveys.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  No surveys recorded yet for this project.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Field visit log</h3>
                <p className="text-xs text-brand-muted">Latest monitoring missions captured in the system.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {fieldVisits.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {fieldVisits.slice(0, 5).map((visit) => (
                <div key={visit.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {visit.location ? visit.location : "Unspecified location"}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {new Date(visit.visitDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot; {visit.officer ? `Officer: ${visit.officer}` : "Officer not recorded"}
                  </p>
                  {visit.positiveFindings ? (
                    <p className="mt-2 text-xs text-emerald-700">
                      <strong className="font-semibold">Positive:</strong> {visit.positiveFindings}
                    </p>
                  ) : null}
                  {visit.negativeFindings ? (
                    <p className="mt-1 text-xs text-red-600">
                      <strong className="font-semibold">Issues:</strong> {visit.negativeFindings}
                    </p>
                  ) : null}
                </div>
              ))}
              {!fieldVisits.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Field visit updates will appear here once logged.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Monthly narratives</h3>
                <p className="text-xs text-brand-muted">Snapshot of recent reports for leadership reviews.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {monthlyReports.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {monthlyReports.slice(0, 5).map((report) => (
                <div key={report.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {report.reportMonth} &middot; {report.status.replace(/_/g, " ")}
                  </p>
                  {report.summary ? (
                    <p className="mt-1 text-xs text-brand-muted">
                      {report.summary.length > 120 ? `${report.summary.slice(0, 120)}…` : report.summary}
                    </p>
                  ) : null}
                  {report.reviewer ? (
                    <p className="mt-1 text-xs text-brand-soft">Reviewer: {report.reviewer}</p>
                  ) : null}
                </div>
              ))}
              {!monthlyReports.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Submit the first monthly narrative to populate this section.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
