"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "@/context/DashboardDataContext";
import type { CatalogEntry } from "@/lib/dashboard-data";

type CatalogFormState = {
  name: string;
  description: string;
};

type FeedbackState = {
  error: string | null;
  success: string | null;
};

const initialFormState: CatalogFormState = {
  name: "",
  description: "",
};

function normalizeName(value: string): string {
  return value.trim();
}

function buildDuplicateChecker(entries: CatalogEntry[]) {
  const index = new Map<string, string>();
  entries.forEach((entry) => {
    index.set(entry.name.trim().toLowerCase(), entry.id);
  });
  return (name: string, currentId: string | null) => {
    const key = name.trim().toLowerCase();
    if (!key) {
      return false;
    }
    const existingId = index.get(key);
    if (!existingId) {
      return false;
    }
    return existingId !== currentId;
  };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message || fallback;
  }
  return fallback;
}

export default function ClusterSectorModifierPage() {
  const {
    sectorCatalog,
    clusterCatalog,
    registerSector,
    registerCluster,
    updateSectorCatalogEntry,
    updateClusterCatalogEntry,
    removeSectorCatalogEntry,
    removeClusterCatalogEntry,
  } = useDashboardData();

  const [sectorForm, setSectorForm] = useState<CatalogFormState>(initialFormState);
  const [clusterForm, setClusterForm] = useState<CatalogFormState>(initialFormState);
  const [sectorEditingId, setSectorEditingId] = useState<string | null>(null);
  const [clusterEditingId, setClusterEditingId] = useState<string | null>(null);
  const [sectorFeedback, setSectorFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [clusterFeedback, setClusterFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [isSectorSubmitting, setIsSectorSubmitting] = useState(false);
  const [isClusterSubmitting, setIsClusterSubmitting] = useState(false);

  const sortedSectors = useMemo(
    () => [...sectorCatalog].sort((a, b) => a.name.localeCompare(b.name)),
    [sectorCatalog]
  );
  const sortedClusters = useMemo(
    () => [...clusterCatalog].sort((a, b) => a.name.localeCompare(b.name)),
    [clusterCatalog]
  );

  const isDuplicateSector = useMemo(() => buildDuplicateChecker(sortedSectors), [sortedSectors]);
  const isDuplicateCluster = useMemo(() => buildDuplicateChecker(sortedClusters), [sortedClusters]);

  const handleSectorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normalizeName(sectorForm.name);
    const description = normalizeName(sectorForm.description);

    if (!name) {
      setSectorFeedback({ error: "Sector name is required.", success: null });
      return;
    }

    if (isDuplicateSector(name, sectorEditingId)) {
      setSectorFeedback({ error: "A sector with this name already exists.", success: null });
      return;
    }

    setIsSectorSubmitting(true);
    setSectorFeedback({ error: null, success: null });

    try {
      if (sectorEditingId) {
        await updateSectorCatalogEntry({
          id: sectorEditingId,
          name,
          description: description || undefined,
        });
        setSectorFeedback({ error: null, success: "Sector updated successfully." });
      } else {
        await registerSector({
          name,
          description: description || undefined,
        });
        setSectorFeedback({ error: null, success: "Sector added successfully." });
      }
      setSectorForm(initialFormState);
      setSectorEditingId(null);
    } catch (error) {
      setSectorFeedback({
        error: extractErrorMessage(error, "Failed to save sector. Please try again."),
        success: null,
      });
    } finally {
      setIsSectorSubmitting(false);
    }
  };

  const handleClusterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normalizeName(clusterForm.name);
    const description = normalizeName(clusterForm.description);

    if (!name) {
      setClusterFeedback({ error: "Cluster name is required.", success: null });
      return;
    }

    if (isDuplicateCluster(name, clusterEditingId)) {
      setClusterFeedback({ error: "A cluster with this name already exists.", success: null });
      return;
    }

    setIsClusterSubmitting(true);
    setClusterFeedback({ error: null, success: null });

    try {
      if (clusterEditingId) {
        await updateClusterCatalogEntry({
          id: clusterEditingId,
          name,
          description: description || undefined,
        });
        setClusterFeedback({ error: null, success: "Cluster updated successfully." });
      } else {
        await registerCluster({
          name,
          description: description || undefined,
        });
        setClusterFeedback({ error: null, success: "Cluster added successfully." });
      }
      setClusterForm(initialFormState);
      setClusterEditingId(null);
    } catch (error) {
      setClusterFeedback({
        error: extractErrorMessage(error, "Failed to save cluster. Please try again."),
        success: null,
      });
    } finally {
      setIsClusterSubmitting(false);
    }
  };

  const beginSectorEdit = (entry: CatalogEntry) => {
    setSectorForm({
      name: entry.name,
      description: entry.description ?? "",
    });
    setSectorEditingId(entry.id);
    setSectorFeedback({ error: null, success: null });
  };

  const beginClusterEdit = (entry: CatalogEntry) => {
    setClusterForm({
      name: entry.name,
      description: entry.description ?? "",
    });
    setClusterEditingId(entry.id);
    setClusterFeedback({ error: null, success: null });
  };

  const resetSectorForm = () => {
    setSectorForm(initialFormState);
    setSectorEditingId(null);
    setSectorFeedback({ error: null, success: null });
  };

  const resetClusterForm = () => {
    setClusterForm(initialFormState);
    setClusterEditingId(null);
    setClusterFeedback({ error: null, success: null });
  };

  const handleSectorDelete = async (entry: CatalogEntry) => {
    const confirmed = window.confirm(`Are you sure you want to delete the sector "${entry.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await removeSectorCatalogEntry(entry.id);
      if (sectorEditingId === entry.id) {
        resetSectorForm();
      }
      setSectorFeedback({ error: null, success: "Sector removed." });
    } catch (error) {
      setSectorFeedback({
        error: extractErrorMessage(error, "Failed to remove sector."),
        success: null,
      });
    }
  };

  const handleClusterDelete = async (entry: CatalogEntry) => {
    const confirmed = window.confirm(`Are you sure you want to delete the cluster "${entry.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await removeClusterCatalogEntry(entry.id);
      if (clusterEditingId === entry.id) {
        resetClusterForm();
      }
      setClusterFeedback({ error: null, success: "Cluster removed." });
    } catch (error) {
      setClusterFeedback({
        error: extractErrorMessage(error, "Failed to remove cluster."),
        success: null,
      });
    }
  };

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Sector Catalog</h2>
          <p className="text-sm text-brand-muted">
            Add or update the sectors your organisation is serving. These appear in the project form.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSectorSubmit}>
          <div>
            <label htmlFor="sector-name" className="block text-sm font-medium text-brand-muted">
              Sector name
            </label>
            <input
              id="sector-name"
              name="sector-name"
              type="text"
              value={sectorForm.name}
              onChange={(event) => {
                setSectorForm((previous) => ({ ...previous, name: event.target.value }));
              }}
              className="input-brand mt-1 block w-full rounded-lg"
              placeholder="e.g. Health"
            />
          </div>

          <div>
            <label htmlFor="sector-description" className="block text-sm font-medium text-brand-muted">
              Description (optional)
            </label>
            <textarea
              id="sector-description"
              name="sector-description"
              value={sectorForm.description}
              onChange={(event) => {
                setSectorForm((previous) => ({ ...previous, description: event.target.value }));
              }}
              className="input-brand mt-1 block w-full rounded-lg"
              rows={3}
              placeholder="Short notes for your team"
            />
          </div>

          {sectorFeedback.error ? (
            <p className="text-sm text-red-600">{sectorFeedback.error}</p>
          ) : null}
          {sectorFeedback.success ? (
            <p className="text-sm text-emerald-600">{sectorFeedback.success}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSectorSubmitting}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
            >
              {sectorEditingId ? "Save sector" : "Add sector"}
            </button>
            {sectorEditingId ? (
              <button
                type="button"
                onClick={resetSectorForm}
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold chip-brand"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
            Active sectors
          </h3>
          {sortedSectors.length ? (
            <ul className="space-y-3">
              {sortedSectors.map((sector) => (
                <li
                  key={sector.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-brand bg-brand-soft/30 p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-brand-strong">{sector.name}</p>
                    {sector.description ? (
                      <p className="mt-1 text-sm text-brand-muted">{sector.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => beginSectorEdit(sector)}
                      className="rounded-full px-3 py-1 text-xs font-semibold chip-brand"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSectorDelete(sector)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white btn-brand"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-brand px-4 py-6 text-sm text-brand-soft">
              No sectors yet. Use the form above to add your first sector.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Cluster Catalog</h2>
          <p className="text-sm text-brand-muted">
            Maintain the clusters that projects can be mapped to during onboarding.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleClusterSubmit}>
          <div>
            <label htmlFor="cluster-name" className="block text-sm font-medium text-brand-muted">
              Cluster name
            </label>
            <input
              id="cluster-name"
              name="cluster-name"
              type="text"
              value={clusterForm.name}
              onChange={(event) => {
                setClusterForm((previous) => ({ ...previous, name: event.target.value }));
              }}
              className="input-brand mt-1 block w-full rounded-lg"
              placeholder="e.g. Food Security"
            />
          </div>

          <div>
            <label htmlFor="cluster-description" className="block text-sm font-medium text-brand-muted">
              Description (optional)
            </label>
            <textarea
              id="cluster-description"
              name="cluster-description"
              value={clusterForm.description}
              onChange={(event) => {
                setClusterForm((previous) => ({ ...previous, description: event.target.value }));
              }}
              className="input-brand mt-1 block w-full rounded-lg"
              rows={3}
              placeholder="Short notes for your team"
            />
          </div>

          {clusterFeedback.error ? (
            <p className="text-sm text-red-600">{clusterFeedback.error}</p>
          ) : null}
          {clusterFeedback.success ? (
            <p className="text-sm text-emerald-600">{clusterFeedback.success}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isClusterSubmitting}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
            >
              {clusterEditingId ? "Save cluster" : "Add cluster"}
            </button>
            {clusterEditingId ? (
              <button
                type="button"
                onClick={resetClusterForm}
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold chip-brand"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
            Active clusters
          </h3>
          {sortedClusters.length ? (
            <ul className="space-y-3">
              {sortedClusters.map((cluster) => (
                <li
                  key={cluster.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-brand bg-brand-soft/30 p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-brand-strong">{cluster.name}</p>
                    {cluster.description ? (
                      <p className="mt-1 text-sm text-brand-muted">{cluster.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => beginClusterEdit(cluster)}
                      className="rounded-full px-3 py-1 text-xs font-semibold chip-brand"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClusterDelete(cluster)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white btn-brand"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-brand px-4 py-6 text-sm text-brand-soft">
              No clusters yet. Use the form above to add your first cluster.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
