"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectSelect from "../(components)/ProjectSelect";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  type BeneficiaryTypeKey,
} from "@/lib/dashboard-data";

type FeedbackState = { tone: "positive" | "negative"; message: string | null };

type BeneficiaryInputState = Record<
  BeneficiaryTypeKey,
  { direct: string; indirect: string }
>;

const createEmptyState = (): BeneficiaryInputState =>
  BENEFICIARY_TYPE_KEYS.reduce(
    (accumulator, key) => ({
      ...accumulator,
      [key]: { direct: "0", indirect: "0" },
    }),
    {} as BeneficiaryInputState
  );

export default function BeneficiariesDataEntryPage() {
  const { projects, refresh } = useDashboardData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: "positive",
    message: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<BeneficiaryInputState>(
    createEmptyState()
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setFormState(createEmptyState());
      return;
    }

    const nextState = createEmptyState();
    BENEFICIARY_TYPE_KEYS.forEach((key) => {
      const directValue = selectedProject.beneficiaries.direct[key] ?? 0;
      const indirectValue = selectedProject.beneficiaries.indirect[key] ?? 0;
      nextState[key] = {
        direct: directValue.toString(),
        indirect: indirectValue.toString(),
      };
    });
    setFormState(nextState);
  }, [selectedProject]);

  const totals = useMemo(() => {
    let direct = 0;
    let indirect = 0;
    BENEFICIARY_TYPE_KEYS.forEach((key) => {
      direct += Number.parseInt(formState[key].direct || "0", 10) || 0;
      indirect += Number.parseInt(formState[key].indirect || "0", 10) || 0;
    });
    return { direct, indirect, total: direct + indirect };
  }, [formState]);

  const handleInputChange = useCallback(
    (key: BeneficiaryTypeKey, field: "direct" | "indirect") =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/[^0-9]/g, "");
        setFormState((previous) => ({
          ...previous,
          [key]: {
            ...previous[key],
            [field]: value,
          },
        }));
      },
    []
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProjectId) {
      setFeedback({
        tone: "negative",
        message: "Select a project before saving beneficiary totals.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ tone: "positive", message: null });

    const payload = {
      projectId: selectedProjectId,
      beneficiaries: BENEFICIARY_TYPE_KEYS.map((key) => ({
        type: key,
        direct: Number.parseInt(formState[key].direct || "0", 10) || 0,
        indirect: Number.parseInt(formState[key].indirect || "0", 10) || 0,
      })),
    };

    try {
      const response = await fetch("/api/data-entry/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to save beneficiary totals."
        );
      }

      setFeedback({
        tone: "positive",
        message: "Beneficiary totals updated successfully.",
      });
      await refresh();
    } catch (error) {
      setFeedback({
        tone: "negative",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save beneficiary totals.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-brand bg-white p-8 shadow-brand-soft">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-brand-strong">
          Beneficiary Data Capture
        </h1>
        <p className="text-sm text-brand-muted">
          Select a project and record direct and indirect reach for each
          demographic cohort. Updates sync instantly to the public dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProjectSelect
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          helperText="Only saved projects appear in this list."
        />
        <div className="rounded-2xl border border-brand bg-brand-soft/40 p-4 text-sm">
          <p className="font-semibold text-brand-muted">Totals preview</p>
          <dl className="mt-3 space-y-1 text-brand-soft">
            <div className="flex items-center justify-between">
              <dt>Direct</dt>
              <dd className="font-semibold text-brand-strong">
                {totals.direct.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Indirect</dt>
              <dd className="font-semibold text-brand-strong">
                {totals.indirect.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-brand pt-2">
              <dt>Total</dt>
              <dd className="text-lg font-semibold text-brand-primary">
                {totals.total.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-3xl border border-brand">
          <table className="min-w-full divide-y divide-brand-soft text-sm">
            <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
              <tr>
                <th className="px-4 py-3 text-left">Cohort</th>
                <th className="px-4 py-3 text-right">Direct</th>
                <th className="px-4 py-3 text-right">Indirect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/60 bg-white">
              {BENEFICIARY_TYPE_KEYS.map((key) => {
                const meta = BENEFICIARY_TYPE_META[key];
                return (
                  <tr key={key} className="align-middle">
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-medium text-brand-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <div>
                          <p>{meta.label}</p>
                          <p className="text-xs uppercase tracking-wide text-brand-soft">
                            {meta.group}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formState[key].direct}
                        onChange={handleInputChange(key, "direct")}
                        className="input-brand w-full rounded-lg text-right"
                        disabled={!selectedProjectId}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formState[key].indirect}
                        onChange={handleInputChange(key, "indirect")}
                        className="input-brand w-full rounded-lg text-right"
                        disabled={!selectedProjectId}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {feedback.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === "positive"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!selectedProjectId || isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save beneficiaries"}
          </button>
        </div>
      </form>
    </section>
  );
}
