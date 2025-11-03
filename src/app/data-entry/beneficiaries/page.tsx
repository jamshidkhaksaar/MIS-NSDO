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

type BeneficiaryEntry = {
  key: BeneficiaryTypeKey;
  includeInTotals: boolean;
};

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
  const [entries, setEntries] = useState<BeneficiaryEntry[]>([]);
  const [pendingKey, setPendingKey] = useState<BeneficiaryTypeKey | "">("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setFormState(createEmptyState());
      setEntries([]);
      setPendingKey("");
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

    const includeState = selectedProject.beneficiaries.include;
    const detectedEntries = BENEFICIARY_TYPE_KEYS.reduce<BeneficiaryEntry[]>((accumulator, key) => {
      const directValue = selectedProject.beneficiaries.direct[key] ?? 0;
      const indirectValue = selectedProject.beneficiaries.indirect[key] ?? 0;
      const includeValue =
        includeState && Object.prototype.hasOwnProperty.call(includeState, key)
          ? Boolean(includeState[key])
          : BENEFICIARY_TYPE_META[key].includeInTotals;
      if (directValue > 0 || indirectValue > 0 || includeValue) {
        accumulator.push({
          key,
          includeInTotals: includeValue,
        });
      }
      return accumulator;
    }, []);
    setEntries(detectedEntries);
  }, [selectedProject]);

  const availableKeys = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.filter(
        (key) => !entries.some((entry) => entry.key === key)
      ),
    [entries]
  );

  useEffect(() => {
    if (!availableKeys.length) {
      setPendingKey("");
      return;
    }
    if (!pendingKey || !availableKeys.includes(pendingKey)) {
      setPendingKey(availableKeys[0]);
    }
  }, [availableKeys, pendingKey]);

  const totals = useMemo(() => {
    let direct = 0;
    let indirect = 0;
    entries.forEach(({ key, includeInTotals }) => {
      if (!includeInTotals) {
        return;
      }
      direct += Number.parseInt(formState[key].direct || "0", 10) || 0;
      indirect += Number.parseInt(formState[key].indirect || "0", 10) || 0;
    });
    return { direct, indirect, total: direct + indirect };
  }, [entries, formState]);

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

  const handleIncludeToggle = useCallback(
    (key: BeneficiaryTypeKey) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const isIncluded = event.target.checked;
        setEntries((previous) =>
          previous.map((entry) =>
            entry.key === key ? { ...entry, includeInTotals: isIncluded } : entry
          )
        );
      },
    []
  );

  const handleRemoveEntry = useCallback((key: BeneficiaryTypeKey) => {
    setEntries((previous) => previous.filter((entry) => entry.key !== key));
    setFormState((previous) => ({
      ...previous,
      [key]: { direct: "0", indirect: "0" },
    }));
  }, []);

  const handleAddEntry = useCallback(() => {
    if (!pendingKey) {
      return;
    }
    setEntries((previous) => [
      ...previous,
      {
        key: pendingKey,
        includeInTotals: true,
      },
    ]);
    setFormState((previous) => ({
      ...previous,
      [pendingKey]: previous[pendingKey] ?? { direct: "0", indirect: "0" },
    }));
  }, [pendingKey]);

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

    const includeLookup = new Map(entries.map((entry) => [entry.key, entry.includeInTotals]));

    const payload = {
      projectId: selectedProjectId,
      beneficiaries: BENEFICIARY_TYPE_KEYS.map((key) => ({
        type: key,
        direct: Number.parseInt(formState[key].direct || "0", 10) || 0,
        indirect: Number.parseInt(formState[key].indirect || "0", 10) || 0,
        includeInTotals: includeLookup.get(key) ?? false,
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
          <div className="space-y-4 bg-white p-6">
            {entries.length ? (
              entries.map(({ key, includeInTotals }) => {
                const meta = BENEFICIARY_TYPE_META[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-brand-soft p-4 shadow-brand-soft/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-semibold text-brand-muted">{meta.label}</p>
                          <p className="text-xs uppercase tracking-wide text-brand-soft">
                            {meta.group}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(key)}
                        className="text-xs font-semibold uppercase tracking-wide text-brand-primary hover:text-brand-strong"
                        disabled={!selectedProjectId}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        Direct Reach
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formState[key].direct}
                          onChange={handleInputChange(key, "direct")}
                          className="input-brand w-full rounded-lg text-right text-sm"
                          disabled={!selectedProjectId}
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        Indirect Reach
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formState[key].indirect}
                          onChange={handleInputChange(key, "indirect")}
                          className="input-brand w-full rounded-lg text-right text-sm"
                          disabled={!selectedProjectId}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-brand-soft text-brand-primary focus:ring-brand-primary"
                          checked={includeInTotals}
                          onChange={handleIncludeToggle(key)}
                          disabled={!selectedProjectId}
                        />
                        Include in totals
                      </label>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-soft bg-brand-soft/20 p-6 text-center text-sm text-brand-muted">
                No beneficiary categories added yet. Select a category below to start
                capturing reach.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-brand-soft pt-4">
              <select
                value={pendingKey}
                onChange={(event) =>
                  setPendingKey(event.target.value as BeneficiaryTypeKey | "")
                }
                className="input-brand w-full max-w-xs rounded-full text-sm"
                disabled={!selectedProjectId || !availableKeys.length}
              >
                {!availableKeys.length ? (
                  <option value="">All categories added</option>
                ) : (
                  <>
                    <option value="">Select category</option>
                    {availableKeys.map((key) => {
                      const optionMeta = BENEFICIARY_TYPE_META[key];
                      return (
                        <option key={key} value={key}>
                          {optionMeta.label}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={handleAddEntry}
                disabled={!selectedProjectId || !pendingKey}
                className="inline-flex h-10 items-center justify-center rounded-full bg-brand-primary px-4 text-sm font-semibold text-white shadow-brand-soft transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add category
              </button>
            </div>
          </div>
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
