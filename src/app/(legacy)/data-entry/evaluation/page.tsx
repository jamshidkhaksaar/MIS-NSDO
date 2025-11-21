"use client";

import { useMemo, useState } from "react";
import ProjectSelect from "../(components)/ProjectSelect";
import { useDashboardData } from "@/context/DashboardDataContext";

type FeedbackState = {
  message: string | null;
  tone: "positive" | "negative";
};

const EVALUATION_TYPES = [
  { value: "baseline", label: "Baseline" },
  { value: "midterm", label: "Midterm" },
  { value: "endline", label: "Endline" },
  { value: "special", label: "Special / Thematic" },
] as const;

const STORY_TYPES = [
  { value: "success", label: "Success story" },
  { value: "impact", label: "Impact story" },
  { value: "case", label: "Case study" },
] as const;

export default function EvaluationPage() {
  const { evaluation, projects, refresh } = useDashboardData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [evaluationForm, setEvaluationForm] = useState({
    evaluationType: "baseline",
    evaluatorName: "",
    completedAt: "",
    reportUrl: "",
    findingsSummary: "",
  });

  const [storyForm, setStoryForm] = useState({
    projectIdOverride: "",
    storyType: "success",
    title: "",
    quote: "",
    summary: "",
    photoUrl: "",
  });

  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });
  const [storyFeedback, setStoryFeedback] = useState<FeedbackState>({ message: null, tone: "positive" });

  const evaluations = useMemo(
    () =>
      evaluation.evaluations.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [evaluation.evaluations, selectedProjectId]
  );

  const stories = useMemo(
    () => evaluation.stories.filter((record) => !selectedProjectId || record.projectId === selectedProjectId),
    [evaluation.stories, selectedProjectId]
  );

  const handleEvaluationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setEvaluationFeedback({ message: "Select a project before logging an evaluation.", tone: "negative" });
      return;
    }
    setIsSubmittingEvaluation(true);
    setEvaluationFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/evaluation/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          evaluationType: evaluationForm.evaluationType,
          evaluatorName: evaluationForm.evaluatorName || undefined,
          completedAt: evaluationForm.completedAt || undefined,
          reportUrl: evaluationForm.reportUrl || undefined,
          findingsSummary: evaluationForm.findingsSummary || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save evaluation record." }));
        throw new Error(error.message ?? "Unable to save evaluation record.");
      }

      setEvaluationForm({
        evaluationType: "baseline",
        evaluatorName: "",
        completedAt: "",
        reportUrl: "",
        findingsSummary: "",
      });
      setEvaluationFeedback({ message: "Evaluation record saved.", tone: "positive" });
      await refresh();
    } catch (error) {
      setEvaluationFeedback({
        message: error instanceof Error ? error.message : "Unable to save evaluation record.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const handleStorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetProject = storyForm.projectIdOverride || selectedProjectId;
    if (!targetProject) {
      setStoryFeedback({ message: "Select a project before documenting a story.", tone: "negative" });
      return;
    }

    setIsSubmittingStory(true);
    setStoryFeedback({ message: null, tone: "positive" });

    try {
      const response = await fetch("/api/data-entry/evaluation/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProject,
          storyType: storyForm.storyType,
          title: storyForm.title,
          quote: storyForm.quote || undefined,
          summary: storyForm.summary || undefined,
          photoUrl: storyForm.photoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unable to save story." }));
        throw new Error(error.message ?? "Unable to save story.");
      }

      setStoryForm({
        projectIdOverride: "",
        storyType: "success",
        title: "",
        quote: "",
        summary: "",
        photoUrl: "",
      });
      setStoryFeedback({ message: "Story captured successfully.", tone: "positive" });
      await refresh();
    } catch (error) {
      setStoryFeedback({
        message: error instanceof Error ? error.message : "Unable to save story.",
        tone: "negative",
      });
    } finally {
      setIsSubmittingStory(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Evaluation & success stories</h2>
            <p className="text-sm text-brand-muted">
              Register formal evaluation moments and spotlight the change stories shared with donors.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProjectSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              helperText={
                projects.length
                  ? "Forms below will default to the selected project."
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <form
            className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft"
            onSubmit={handleEvaluationSubmit}
          >
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Evaluation record</h3>
              <p className="text-sm text-brand-muted">Track third-party or internal evaluations for each project.</p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="evaluation-type">
                  Evaluation type
                </label>
                <select
                  id="evaluation-type"
                  value={evaluationForm.evaluationType}
                  onChange={(event) =>
                    setEvaluationForm((previous) => ({ ...previous, evaluationType: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {EVALUATION_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="evaluation-completed">
                  Completion date
                </label>
                <input
                  id="evaluation-completed"
                  type="date"
                  value={evaluationForm.completedAt}
                  onChange={(event) =>
                    setEvaluationForm((previous) => ({ ...previous, completedAt: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="evaluation-evaluator">
                  Evaluator / agency
                </label>
                <input
                  id="evaluation-evaluator"
                  type="text"
                  value={evaluationForm.evaluatorName}
                  onChange={(event) =>
                    setEvaluationForm((previous) => ({ ...previous, evaluatorName: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="Third-party partner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="evaluation-report">
                  Report URL
                </label>
                <input
                  id="evaluation-report"
                  type="url"
                  value={evaluationForm.reportUrl}
                  onChange={(event) =>
                    setEvaluationForm((previous) => ({ ...previous, reportUrl: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="evaluation-findings">
                  Key findings
                </label>
                <textarea
                  id="evaluation-findings"
                  value={evaluationForm.findingsSummary}
                  onChange={(event) =>
                    setEvaluationForm((previous) => ({ ...previous, findingsSummary: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={4}
                  placeholder="Highlight major recommendations or outcomes from the evaluation."
                />
              </div>
            </div>
            {evaluationFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  evaluationFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {evaluationFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingEvaluation}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingEvaluation ? "Saving..." : "Save evaluation"}
              </button>
            </div>
          </form>

          <form className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft" onSubmit={handleStorySubmit}>
            <header className="mb-4">
              <h3 className="text-lg font-semibold">Success / impact story</h3>
              <p className="text-sm text-brand-muted">
                Capture beneficiary voices and success stories to syndicate on the public dashboard.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-project">
                  Project override (optional)
                </label>
                <select
                  id="story-project"
                  value={storyForm.projectIdOverride}
                  onChange={(event) =>
                    setStoryForm((previous) => ({ ...previous, projectIdOverride: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  <option value="">Use selected project</option>
                  {[...projects]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-type">
                  Story type
                </label>
                <select
                  id="story-type"
                  value={storyForm.storyType}
                  onChange={(event) =>
                    setStoryForm((previous) => ({ ...previous, storyType: event.target.value }))
                  }
                  className="input-brand mt-1 block w-full rounded-lg"
                >
                  {STORY_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-title">
                  Title
                </label>
                <input
                  id="story-title"
                  type="text"
                  value={storyForm.title}
                  onChange={(event) => setStoryForm((previous) => ({ ...previous, title: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="From displacement to livelihoods"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-summary">
                  Summary
                </label>
                <textarea
                  id="story-summary"
                  value={storyForm.summary}
                  onChange={(event) => setStoryForm((previous) => ({ ...previous, summary: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={4}
                  placeholder="Describe the change, outcome, or lesson in 3-4 sentences."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-quote">
                  Beneficiary quote
                </label>
                <textarea
                  id="story-quote"
                  value={storyForm.quote}
                  onChange={(event) => setStoryForm((previous) => ({ ...previous, quote: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="&ldquo;The project helped us rebuild...&rdquo;"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted" htmlFor="story-photo">
                  Photo URL
                </label>
                <input
                  id="story-photo"
                  type="url"
                  value={storyForm.photoUrl}
                  onChange={(event) => setStoryForm((previous) => ({ ...previous, photoUrl: event.target.value }))}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
            {storyFeedback.message ? (
              <p
                className={`mt-3 text-sm ${
                  storyFeedback.tone === "positive" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {storyFeedback.message}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingStory}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
              >
                {isSubmittingStory ? "Saving..." : "Save story"}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recent evaluations</h3>
                <p className="text-xs text-brand-muted">Completion status for the selected project.</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {evaluations.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {evaluations.slice(0, 5).map((record) => (
                <div key={record.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {record.evaluationType.toUpperCase()}{" "}
                    {record.completedAt
                      ? `— ${new Date(record.completedAt).toLocaleDateString()}`
                      : "— In progress"}
                  </p>
                  {record.evaluatorName ? (
                    <p className="text-xs text-brand-muted">Evaluator: {record.evaluatorName}</p>
                  ) : null}
                  {record.findingsSummary ? (
                    <p className="mt-1 text-xs text-brand-soft">
                      {record.findingsSummary.length > 120
                        ? `${record.findingsSummary.slice(0, 120)}…`
                        : record.findingsSummary}
                    </p>
                  ) : null}
                </div>
              ))}
              {!evaluations.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Add your first evaluation to populate this section.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Spotlight stories</h3>
                <p className="text-xs text-brand-muted">
                  The latest success stories feeding the public dashboard carousel.
                </p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
                {stories.length}
              </span>
            </header>
            <div className="space-y-3 text-sm">
              {stories.slice(0, 5).map((story) => (
                <div key={story.id} className="rounded-2xl border border-brand/60 bg-brand-soft/40 px-4 py-3">
                  <p className="font-semibold text-brand-strong">
                    {story.title} &middot; {story.storyType.toUpperCase()}
                  </p>
                  {story.summary ? (
                    <p className="mt-1 text-xs text-brand-muted">
                      {story.summary.length > 120 ? `${story.summary.slice(0, 120)}…` : story.summary}
                    </p>
                  ) : null}
                  {story.quote ? (
                    <p className="mt-2 text-xs italic text-brand-soft">“{story.quote}”</p>
                  ) : null}
                </div>
              ))}
              {!stories.length ? (
                <p className="rounded-2xl border border-dashed border-brand px-4 py-6 text-center text-xs text-brand-soft">
                  Submit a success story to showcase community impact.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
