"use client";

import { useMemo, useState } from "react";
import ProjectSelect from "../(components)/ProjectSelect";
import { useDashboardData } from "@/context/DashboardDataContext";

type FeedbackState = {
  message: string | null;
  tone: "positive" | "negative";
};

export default function LessonLearnsPage() {
  const { pdm, knowledgeHub, refresh, projects } = useDashboardData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [distributionForm, setDistributionForm] = useState({
    assistanceType: "",
    distributionDate: "",
    location: "",
    targetBeneficiaries: "",
    notes: "",
  });
  const [surveyForm, setSurveyForm] = useState({
    tool: "",
    qualityScore: "",
    quantityScore: "",
    satisfactionScore: "",
    protectionScore: "",
    completedAt: "",
  });
  const [reportForm, setReportForm] = useState({
    reportDate: "",
    summary: "",
    recommendations: "",
    feedbackToProgram: "",
  });
  const [lessonForm, setLessonForm] = useState({
    source: "",
    lesson: "",
    department: "",
    theme: "",
    capturedAt: "",
  });

  const [distributionFeedback, setDistributionFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [surveyFeedback, setSurveyFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [reportFeedback, setReportFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [lessonFeedback, setLessonFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });

  const [isSubmittingDistribution, setIsSubmittingDistribution] = useState(false);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  const distributions = useMemo(
    () => pdm.distributions.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [pdm.distributions, selectedProjectId]
  );

  const surveys = useMemo(
    () => pdm.surveys.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [pdm.surveys, selectedProjectId]
  );

  const reports = useMemo(
    () => pdm.reports.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [pdm.reports, selectedProjectId]
  );

  const lessons = useMemo(
    () => knowledgeHub.lessons.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [knowledgeHub.lessons, selectedProjectId]
  );

  const handleDistributionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setDistributionFeedback({ message: "Select a project before logging a distribution.", tone: "negative" });
      return;
    }
    setIsSubmittingDistribution(true);
    setDistributionFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/lesson-learns/pdm/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          assistanceType: distributionForm.assistanceType,
          distributionDate: distributionForm.distributionDate || undefined,
          location: distributionForm.location || undefined,
          targetBeneficiaries: distributionForm.targetBeneficiaries
            ? Number.parseInt(distributionForm.targetBeneficiaries, 10)
            : undefined,
          notes: distributionForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save distribution." }));
        throw new Error(error.message ?? "Unable to save distribution.");
      }

      setDistributionForm({
        assistanceType: "",
        distributionDate: "",
        location: "",
        targetBeneficiaries: "",
        notes: "",
      });
      setDistributionFeedback({ message: "Distribution recorded successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setDistributionFeedback({
        message: error instanceof Error ? error.message : "Unable to save distribution.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingDistribution(false);
    }
  };

  const handleSurveySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setSurveyFeedback({ message: "Select a project before logging a PDM survey.", tone: "negative" });
      return;
    }
    setIsSubmittingSurvey(true);
    setSurveyFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/lesson-learns/pdm/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          tool: surveyForm.tool || undefined,
          qualityScore: surveyForm.qualityScore ? Number(surveyForm.qualityScore) : undefined,
          quantityScore: surveyForm.quantityScore ? Number(surveyForm.quantityScore) : undefined,
          satisfactionScore: surveyForm.satisfactionScore ? Number(surveyForm.satisfactionScore) : undefined,
          protectionScore: surveyForm.protectionScore ? Number(surveyForm.protectionScore) : undefined,
          completedAt: surveyForm.completedAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save PDM survey." }));
        throw new Error(error.message ?? "Unable to save PDM survey.");
      }

      setSurveyForm({
        tool: "",
        qualityScore: "",
        quantityScore: "",
        satisfactionScore: "",
        protectionScore: "",
        completedAt: "",
      });
      setSurveyFeedback({ message: "PDM survey recorded successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setSurveyFeedback({
        message: error instanceof Error ? error.message : "Unable to save PDM survey.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const handleReportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setReportFeedback({ message: "Select a project before saving a PDM report.", tone: "negative" });
      return;
    }
    setIsSubmittingReport(true);
    setReportFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/lesson-learns/pdm/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          reportDate: reportForm.reportDate || undefined,
          summary: reportForm.summary || undefined,
          recommendations: reportForm.recommendations || undefined,
          feedbackToProgram: reportForm.feedbackToProgram || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save PDM report." }));
        throw new Error(error.message ?? "Unable to save PDM report.");
      }

      setReportForm({
        reportDate: "",
        summary: "",
        recommendations: "",
        feedbackToProgram: "",
      });
      setReportFeedback({ message: "PDM report saved successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setReportFeedback({
        message: error instanceof Error ? error.message : "Unable to save PDM report.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleLessonSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setLessonFeedback({ message: "Select a project before capturing a lesson.", tone: "negative" });
      return;
    }
    setIsSubmittingLesson(true);
    setLessonFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/lesson-learns/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          source: lessonForm.source || undefined,
          lesson: lessonForm.lesson,
          department: lessonForm.department || undefined,
          theme: lessonForm.theme || undefined,
          capturedAt: lessonForm.capturedAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save lesson." }));
        throw new Error(error.message ?? "Unable to save lesson.");
      }

      setLessonForm({
        source: "",
        lesson: "",
        department: "",
        theme: "",
        capturedAt: "",
      });
      setLessonFeedback({ message: "Lesson documented successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setLessonFeedback({
        message: error instanceof Error ? error.message : "Unable to save lesson.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Learning & post-distribution monitoring</h2>
            <p className="text-sm text-brand-muted">
              Track distributions, beneficiary satisfaction, and operational lessons for continuous improvement.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProjectSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              helperText={
                projects.length
                  ? "Entries will attach to the selected project."
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <form
            onSubmit={handleDistributionSubmit}
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
          >
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Distribution summary</h3>
              <p className="text-sm text-brand-muted">
                Log delivered assistance to monitor coverage and beneficiary reach.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="distribution-assistance">
                  Assistance type
                </label>
                <input
                  id="distribution-assistance"
                  type="text"
                  value={distributionForm.assistanceType}
                  onChange={(event) =>
                    setDistributionForm((previous) => ({ ...previous, assistanceType: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Cash transfer, hygiene kits..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="distribution-date">
                  Distribution date
                </label>
                <input
                  id="distribution-date"
                  type="date"
                  value={distributionForm.distributionDate}
                  onChange={(event) =>
                    setDistributionForm((previous) => ({ ...previous, distributionDate: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="distribution-location">
                  Location
                </label>
                <input
                  id="distribution-location"
                  type="text"
                  value={distributionForm.location}
                  onChange={(event) =>
                    setDistributionForm((previous) => ({ ...previous, location: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="District / site"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="distribution-beneficiaries">
                  Target beneficiaries
                </label>
                <input
                  id="distribution-beneficiaries"
                  type="number"
                  min={0}
                  value={distributionForm.targetBeneficiaries}
                  onChange={(event) =>
                    setDistributionForm((previous) => ({ ...previous, targetBeneficiaries: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="distribution-notes">
                  Notes
                </label>
                <textarea
                  id="distribution-notes"
                  value={distributionForm.notes}
                  onChange={(event) => setDistributionForm((previous) => ({ ...previous, notes: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            {distributionFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  distributionFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {distributionFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingDistribution}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingDistribution ? "Saving..." : "Save distribution"}
              </button>
            </div>
          </form>

          <form onSubmit={handleSurveySubmit} className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4">
              <h3 className="text-lg font-semibold">PDM survey</h3>
              <p className="text-sm text-brand-muted">
                Capture beneficiary satisfaction scores to feed the public dashboard metrics.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-tool">
                  Survey tool
                </label>
                <input
                  id="survey-tool"
                  type="text"
                  value={surveyForm.tool}
                  onChange={(event) => setSurveyForm((previous) => ({ ...previous, tool: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="e.g. Kobo, ODK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-quality">
                  Quality score
                </label>
                <input
                  id="survey-quality"
                  type="number"
                  min={0}
                  max={100}
                  value={surveyForm.qualityScore}
                  onChange={(event) => setSurveyForm((previous) => ({ ...previous, qualityScore: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="0 - 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-quantity">
                  Quantity score
                </label>
                <input
                  id="survey-quantity"
                  type="number"
                  min={0}
                  max={100}
                  value={surveyForm.quantityScore}
                  onChange={(event) =>
                    setSurveyForm((previous) => ({ ...previous, quantityScore: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="0 - 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-satisfaction">
                  Satisfaction score
                </label>
                <input
                  id="survey-satisfaction"
                  type="number"
                  min={0}
                  max={100}
                  value={surveyForm.satisfactionScore}
                  onChange={(event) =>
                    setSurveyForm((previous) => ({ ...previous, satisfactionScore: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="0 - 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-protection">
                  Protection score
                </label>
                <input
                  id="survey-protection"
                  type="number"
                  min={0}
                  max={100}
                  value={surveyForm.protectionScore}
                  onChange={(event) =>
                    setSurveyForm((previous) => ({ ...previous, protectionScore: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="0 - 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="survey-completed">
                  Completed at
                </label>
                <input
                  id="survey-completed"
                  type="date"
                  value={surveyForm.completedAt}
                  onChange={(event) => setSurveyForm((previous) => ({ ...previous, completedAt: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
            </div>
            {surveyFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  surveyFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {surveyFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingSurvey}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingSurvey ? "Saving..." : "Save survey"}
              </button>
            </div>
          </form>

          <form onSubmit={handleReportSubmit} className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4">
              <h3 className="text-lg font-semibold">PDM report</h3>
              <p className="text-sm text-brand-muted">
                Summarise the key findings from the PDM cycle for leadership visibility.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="report-date">
                  Report date
                </label>
                <input
                  id="report-date"
                  type="date"
                  value={reportForm.reportDate}
                  onChange={(event) => setReportForm((previous) => ({ ...previous, reportDate: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="report-summary">
                  Summary
                </label>
                <textarea
                  id="report-summary"
                  value={reportForm.summary}
                  onChange={(event) => setReportForm((previous) => ({ ...previous, summary: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Highlight satisfaction trends, response quality, or concerns."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="report-recommendations">
                  Recommendations
                </label>
                <textarea
                  id="report-recommendations"
                  value={reportForm.recommendations}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, recommendations: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="report-feedback">
                  Feedback to programme
                </label>
                <textarea
                  id="report-feedback"
                  value={reportForm.feedbackToProgram}
                  onChange={(event) =>
                    setReportForm((previous) => ({ ...previous, feedbackToProgram: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            {reportFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  reportFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {reportFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReport}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingReport ? "Saving..." : "Save PDM report"}
              </button>
            </div>
          </form>

          <form onSubmit={handleLessonSubmit} className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Lesson captured</h3>
              <p className="text-sm text-brand-muted">Document operational learning to enrich the knowledge hub.</p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="lesson-source">
                  Source
                </label>
                <input
                  id="lesson-source"
                  type="text"
                  value={lessonForm.source}
                  onChange={(event) => setLessonForm((previous) => ({ ...previous, source: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Monitoring visit, evaluation..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="lesson-date">
                  Captured on
                </label>
                <input
                  id="lesson-date"
                  type="date"
                  value={lessonForm.capturedAt}
                  onChange={(event) => setLessonForm((previous) => ({ ...previous, capturedAt: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="lesson-text">
                  Lesson learnt
                </label>
                <textarea
                  id="lesson-text"
                  value={lessonForm.lesson}
                  onChange={(event) => setLessonForm((previous) => ({ ...previous, lesson: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={4}
                  placeholder="Explain the lesson or best practice that should be replicated."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="lesson-department">
                  Department
                </label>
                <input
                  id="lesson-department"
                  type="text"
                  value={lessonForm.department}
                  onChange={(event) => setLessonForm((previous) => ({ ...previous, department: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="MEAL, Operations..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="lesson-theme">
                  Theme
                </label>
                <input
                  id="lesson-theme"
                  type="text"
                  value={lessonForm.theme}
                  onChange={(event) => setLessonForm((previous) => ({ ...previous, theme: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Accountability, quality..."
                />
              </div>
            </div>
            {lessonFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  lessonFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {lessonFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingLesson}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingLesson ? "Saving..." : "Save lesson"}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recent distributions</h3>
                <p className="text-xs text-brand-muted">Snapshot of assistance deliveries.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {distributions.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {distributions.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">{item.assistanceType}</p>
                  <p className="text-xs text-brand-muted">
                    {item.distributionDate
                      ? new Date(item.distributionDate).toLocaleDateString()
                      : "Date not recorded"}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                  {item.targetBeneficiaries ? (
                    <p className="mt-1 text-xs text-brand-soft">
                      Target beneficiaries: {item.targetBeneficiaries.toLocaleString()}
                    </p>
                  ) : null}
                  {item.notes ? (
                    <p className="mt-1 text-xs text-brand-soft">
                      {item.notes.length > 120 ? `${item.notes.slice(0, 120)}…` : item.notes}
                    </p>
                  ) : null}
                </div>
              ))}
              {!distributions.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Distributions logged here will sync to the dashboard distribution map.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Satisfaction surveys</h3>
                <p className="text-xs text-brand-muted">Latest beneficiary scoring for the selected project.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {surveys.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {surveys.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {item.tool ? item.tool : "Survey"}{" "}
                    {item.completedAt
                      ? `— ${new Date(item.completedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                  <p className="text-xs text-brand-muted">
                    Quality {item.qualityScore ?? 0} · Quantity {item.quantityScore ?? 0} · Satisfaction{" "}
                    {item.satisfactionScore ?? 0} · Protection {item.protectionScore ?? 0}
                  </p>
                </div>
              ))}
              {!surveys.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Add a survey to populate dashboard satisfaction metrics.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">PDM reports</h3>
                <p className="text-xs text-brand-muted">Key insights from follow-up missions.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {reports.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {report.reportDate
                      ? new Date(report.reportDate).toLocaleDateString()
                      : "Report"}
                  </p>
                  {report.summary ? (
                    <p className="mt-1 text-xs text-brand-muted">
                      {report.summary.length > 120 ? `${report.summary.slice(0, 120)}…` : report.summary}
                    </p>
                  ) : null}
                  {report.recommendations ? (
                    <p className="mt-1 text-xs text-brand-soft">
                      <strong className="font-semibold text-brand-primary">Recommendations:</strong>{" "}
                      {report.recommendations.length > 120
                        ? `${report.recommendations.slice(0, 120)}…`
                        : report.recommendations}
                    </p>
                  ) : null}
                </div>
              ))}
              {!reports.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Save a PDM report to summarise satisfaction trends and programme adaptations.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Lessons learnt</h3>
                <p className="text-xs text-brand-muted">Knowledge captured for cross-team learning.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {lessons.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {lessons.slice(0, 5).map((lesson) => (
                <div key={lesson.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {lesson.theme ? lesson.theme : "Lesson"}{" "}
                    {lesson.capturedAt ? `— ${new Date(lesson.capturedAt).toLocaleDateString()}` : ""}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {lesson.source ? `Source: ${lesson.source}` : "Source not recorded"}
                    {lesson.department ? ` · ${lesson.department}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-brand-soft">
                    {lesson.lesson.length > 140 ? `${lesson.lesson.slice(0, 140)}…` : lesson.lesson}
                  </p>
                </div>
              ))}
              {!lessons.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Lessons captured here will surface on the knowledge hub and dashboard.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
