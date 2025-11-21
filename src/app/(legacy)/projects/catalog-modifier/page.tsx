"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@/context/DashboardDataContext";
import type { CatalogEntry, MainSectorRecord, SubSectorRecord } from "@/lib/dashboard-data";

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

function buildDuplicateChecker<T extends { id: string; name: string }>(entries: T[]) {
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

function buildSubSectorDuplicateChecker(entries: SubSectorRecord[]) {
  const index = new Map<string, string>();
  entries.forEach((entry) => {
    const key = `${entry.mainSectorId}::${entry.name.trim().toLowerCase()}`;
    index.set(key, entry.id);
  });
  return (mainSectorId: string, name: string, currentId: string | null) => {
    const key = `${mainSectorId}::${name.trim().toLowerCase()}`;
    if (!name.trim()) {
      return false;
    }
    const existingId = index.get(key);
    if (!existingId) {
      return false;
    }
    return existingId !== currentId;
  };
}

export default function ClusterSectorModifierPage() {
  const {
    sectorCatalog,
    clusterCatalog,
    mainSectors,
    subSectors,
    registerSector,
    registerCluster,
    updateSectorCatalogEntry,
    updateClusterCatalogEntry,
    removeSectorCatalogEntry,
    removeClusterCatalogEntry,
    registerMainSector,
    updateMainSectorEntry,
    removeMainSector,
    registerSubSector,
    updateSubSectorEntry,
    removeSubSector,
  } = useDashboardData();

  const [sectorForm, setSectorForm] = useState<CatalogFormState>(initialFormState);
  const [clusterForm, setClusterForm] = useState<CatalogFormState>(initialFormState);
  const [sectorEditingId, setSectorEditingId] = useState<string | null>(null);
  const [clusterEditingId, setClusterEditingId] = useState<string | null>(null);
  const [sectorFeedback, setSectorFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [clusterFeedback, setClusterFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [isSectorSubmitting, setIsSectorSubmitting] = useState(false);
  const [isClusterSubmitting, setIsClusterSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalogs" | "main-sub">("catalogs");
  const [mainSectorForm, setMainSectorForm] = useState<CatalogFormState>(initialFormState);
  const [subSectorForm, setSubSectorForm] = useState<CatalogFormState>(initialFormState);
  const [mainSectorEditingId, setMainSectorEditingId] = useState<string | null>(null);
  const [subSectorEditingId, setSubSectorEditingId] = useState<string | null>(null);
  const [mainSectorFeedback, setMainSectorFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [subSectorFeedback, setSubSectorFeedback] = useState<FeedbackState>({ error: null, success: null });
  const [isMainSectorSubmitting, setIsMainSectorSubmitting] = useState(false);
  const [isSubSectorSubmitting, setIsSubSectorSubmitting] = useState(false);
  const [selectedMainSectorForSub, setSelectedMainSectorForSub] = useState<string>("");

  const sortedSectors = useMemo(
    () => [...sectorCatalog].sort((a, b) => a.name.localeCompare(b.name)),
    [sectorCatalog]
  );
  const sortedClusters = useMemo(
    () => [...clusterCatalog].sort((a, b) => a.name.localeCompare(b.name)),
    [clusterCatalog]
  );
  const sortedMainSectors = useMemo(
    () => [...mainSectors].sort((a, b) => a.name.localeCompare(b.name)),
    [mainSectors]
  );
  const subSectorsByMain = useMemo(() => {
    const map = new Map<string, SubSectorRecord[]>();
    subSectors.forEach((entry) => {
      const list = map.get(entry.mainSectorId) ?? [];
      list.push(entry);
      map.set(entry.mainSectorId, list);
    });
    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [subSectors]);

  const isDuplicateSector = useMemo(() => buildDuplicateChecker(sortedSectors), [sortedSectors]);
  const isDuplicateCluster = useMemo(() => buildDuplicateChecker(sortedClusters), [sortedClusters]);
  const isDuplicateMainSector = useMemo(() => buildDuplicateChecker(sortedMainSectors), [sortedMainSectors]);
  const isDuplicateSubSector = useMemo(() => buildSubSectorDuplicateChecker(subSectors), [subSectors]);

  useEffect(() => {
    if (!sortedMainSectors.length) {
      setSelectedMainSectorForSub("");
      return;
    }
    setSelectedMainSectorForSub((previous) => {
      if (previous && sortedMainSectors.some((entry) => entry.id === previous)) {
        return previous;
      }
      return sortedMainSectors[0]!.id;
    });
  }, [sortedMainSectors]);

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

  const handleMainSectorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normalizeName(mainSectorForm.name);
    const description = normalizeName(mainSectorForm.description);

    if (!name) {
      setMainSectorFeedback({ error: "Main sector name is required.", success: null });
      return;
    }

    if (isDuplicateMainSector(name, mainSectorEditingId)) {
      setMainSectorFeedback({ error: "A main sector with this name already exists.", success: null });
      return;
    }

    setIsMainSectorSubmitting(true);
    setMainSectorFeedback({ error: null, success: null });

    try {
      if (mainSectorEditingId) {
        await updateMainSectorEntry({
          id: mainSectorEditingId,
          name,
          description: description || undefined,
        });
        setMainSectorFeedback({ error: null, success: "Main sector updated successfully." });
      } else {
        await registerMainSector({
          name,
          description: description || undefined,
        });
        setMainSectorFeedback({ error: null, success: "Main sector added successfully." });
      }
      setMainSectorForm(initialFormState);
      setMainSectorEditingId(null);
    } catch (error) {
      setMainSectorFeedback({
        error: extractErrorMessage(error, "Failed to save main sector. Please try again."),
        success: null,
      });
    } finally {
      setIsMainSectorSubmitting(false);
    }
  };

  const handleSubSectorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMainSectorForSub) {
      setSubSectorFeedback({ error: "Select a main sector before adding a sub-sector.", success: null });
      return;
    }

    const name = normalizeName(subSectorForm.name);
    const description = normalizeName(subSectorForm.description);

    if (!name) {
      setSubSectorFeedback({ error: "Sub-sector name is required.", success: null });
      return;
    }

    if (isDuplicateSubSector(selectedMainSectorForSub, name, subSectorEditingId)) {
      setSubSectorFeedback({
        error: "This sub-sector already exists for the selected main sector.",
        success: null,
      });
      return;
    }

    setIsSubSectorSubmitting(true);
    setSubSectorFeedback({ error: null, success: null });

    try {
      if (subSectorEditingId) {
        await updateSubSectorEntry({
          id: subSectorEditingId,
          mainSectorId: selectedMainSectorForSub,
          name,
          description: description || undefined,
        });
        setSubSectorFeedback({ error: null, success: "Sub-sector updated successfully." });
      } else {
        await registerSubSector({
          mainSectorId: selectedMainSectorForSub,
          name,
          description: description || undefined,
        });
        setSubSectorFeedback({ error: null, success: "Sub-sector added successfully." });
      }
      setSubSectorForm(initialFormState);
      setSubSectorEditingId(null);
    } catch (error) {
      setSubSectorFeedback({
        error: extractErrorMessage(error, "Failed to save sub-sector. Please try again."),
        success: null,
      });
    } finally {
      setIsSubSectorSubmitting(false);
    }
  };

  const resetMainSectorForm = () => {
    setMainSectorForm(initialFormState);
    setMainSectorEditingId(null);
    setMainSectorFeedback({ error: null, success: null });
  };

  const resetSubSectorForm = () => {
    setSubSectorForm(initialFormState);
    setSubSectorEditingId(null);
    setSubSectorFeedback({ error: null, success: null });
  };

  const beginMainSectorEdit = (entry: MainSectorRecord) => {
    setMainSectorForm({
      name: entry.name,
      description: entry.description ?? "",
    });
    setMainSectorEditingId(entry.id);
    setMainSectorFeedback({ error: null, success: null });
    setActiveTab("main-sub");
  };

  const beginSubSectorEdit = (entry: SubSectorRecord) => {
    setSubSectorForm({
      name: entry.name,
      description: entry.description ?? "",
    });
    setSelectedMainSectorForSub(entry.mainSectorId);
    setSubSectorEditingId(entry.id);
    setSubSectorFeedback({ error: null, success: null });
    setActiveTab("main-sub");
  };

  const handleMainSectorDelete = async (entry: MainSectorRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the main sector "${entry.name}"? All linked sub-sectors will also be removed.`
    );
    if (!confirmed) {
      return;
    }
    try {
      await removeMainSector(entry.id);
      if (mainSectorEditingId === entry.id) {
        resetMainSectorForm();
      }
      if (selectedMainSectorForSub === entry.id) {
        setSelectedMainSectorForSub("");
        resetSubSectorForm();
      }
      setMainSectorFeedback({ error: null, success: "Main sector removed." });
      setSubSectorFeedback({ error: null, success: null });
    } catch (error) {
      setMainSectorFeedback({
        error: extractErrorMessage(error, "Failed to remove main sector."),
        success: null,
      });
    }
  };

  const handleSubSectorDelete = async (entry: SubSectorRecord) => {
    const confirmed = window.confirm(`Are you sure you want to delete the sub-sector "${entry.name}"?`);
    if (!confirmed) {
      return;
    }
    try {
      await removeSubSector(entry.id);
      if (subSectorEditingId === entry.id) {
        resetSubSectorForm();
      }
      setSubSectorFeedback({ error: null, success: "Sub-sector removed." });
    } catch (error) {
      setSubSectorFeedback({
        error: extractErrorMessage(error, "Failed to remove sub-sector."),
        success: null,
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("catalogs")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === "catalogs" ? "btn-brand text-white shadow-brand-soft" : "chip-brand"
          }`}
        >
          Sector &amp; Cluster Catalogs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("main-sub")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === "main-sub" ? "btn-brand text-white shadow-brand-soft" : "chip-brand"
          }`}
        >
          Main &amp; Sub-Sectors
        </button>
      </div>

      {activeTab === "catalogs" ? (
        <div className="grid gap-6 md:grid-cols-2">
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-6 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold">Main Sectors</h2>
              <p className="text-sm text-brand-muted">
                Curate the strategic sectors that appear below the dashboard navigation.
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleMainSectorSubmit}>
              <div>
                <label htmlFor="main-sector-name" className="block text-sm font-medium text-brand-muted">
                  Main sector name
                </label>
                <input
                  id="main-sector-name"
                  type="text"
                  value={mainSectorForm.name}
                  onChange={(event) => {
                    setMainSectorForm((previous) => ({ ...previous, name: event.target.value }));
                  }}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="e.g. Emergency Response"
                />
              </div>

              <div>
                <label htmlFor="main-sector-description" className="block text-sm font-medium text-brand-muted">
                  Description (optional)
                </label>
                <textarea
                  id="main-sector-description"
                  value={mainSectorForm.description}
                  onChange={(event) => {
                    setMainSectorForm((previous) => ({ ...previous, description: event.target.value }));
                  }}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Add context for your team (optional)"
                />
              </div>

              {mainSectorFeedback.error ? (
                <p className="text-sm text-red-600">{mainSectorFeedback.error}</p>
              ) : null}
              {mainSectorFeedback.success ? (
                <p className="text-sm text-emerald-600">{mainSectorFeedback.success}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isMainSectorSubmitting}
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
                >
                  {mainSectorEditingId ? "Save main sector" : "Add main sector"}
                </button>
                {mainSectorEditingId ? (
                  <button
                    type="button"
                    onClick={resetMainSectorForm}
                    className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold chip-brand"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
                Active main sectors
              </h3>
              {sortedMainSectors.length ? (
                <ul className="space-y-3">
                  {sortedMainSectors.map((sector) => (
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
                          onClick={() => beginMainSectorEdit(sector)}
                          className="rounded-full px-3 py-1 text-xs font-semibold chip-brand"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMainSectorDelete(sector)}
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
                  No main sectors yet. Use the form above to highlight your primary focus areas.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold">Sub-Sectors</h2>
              <p className="text-sm text-brand-muted">
                Define the sub-sectors that users can filter within the dashboard working sectors bar.
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubSectorSubmit}>
              <div>
                <label htmlFor="sub-sector-main" className="block text-sm font-medium text-brand-muted">
                  Main sector
                </label>
                <select
                  id="sub-sector-main"
                  value={selectedMainSectorForSub}
                  onChange={(event) => setSelectedMainSectorForSub(event.target.value)}
                  className="input-brand mt-1 block w-full rounded-lg"
                  disabled={!sortedMainSectors.length}
                >
                  {sortedMainSectors.length ? (
                    sortedMainSectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Add a main sector first</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="sub-sector-name" className="block text-sm font-medium text-brand-muted">
                  Sub-sector name
                </label>
                <input
                  id="sub-sector-name"
                  type="text"
                  value={subSectorForm.name}
                  onChange={(event) => {
                    setSubSectorForm((previous) => ({ ...previous, name: event.target.value }));
                  }}
                  className="input-brand mt-1 block w-full rounded-lg"
                  placeholder="e.g. Mobile Health Teams"
                  disabled={!sortedMainSectors.length}
                />
              </div>

              <div>
                <label htmlFor="sub-sector-description" className="block text-sm font-medium text-brand-muted">
                  Description (optional)
                </label>
                <textarea
                  id="sub-sector-description"
                  value={subSectorForm.description}
                  onChange={(event) => {
                    setSubSectorForm((previous) => ({ ...previous, description: event.target.value }));
                  }}
                  className="input-brand mt-1 block w-full rounded-lg"
                  rows={3}
                  placeholder="Add context for teams selecting this sub-sector"
                  disabled={!sortedMainSectors.length}
                />
              </div>

              {subSectorFeedback.error ? (
                <p className="text-sm text-red-600">{subSectorFeedback.error}</p>
              ) : null}
              {subSectorFeedback.success ? (
                <p className="text-sm text-emerald-600">{subSectorFeedback.success}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!sortedMainSectors.length || isSubSectorSubmitting}
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand disabled:opacity-60"
                >
                  {subSectorEditingId ? "Save sub-sector" : "Add sub-sector"}
                </button>
                {subSectorEditingId ? (
                  <button
                    type="button"
                    onClick={resetSubSectorForm}
                    className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold chip-brand"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
                Sub-sectors by main sector
              </h3>
              {sortedMainSectors.length ? (
                <div className="space-y-4">
                  {sortedMainSectors.map((main) => {
                    const children = subSectorsByMain.get(main.id) ?? [];
                    return (
                      <div
                        key={main.id}
                        className="rounded-xl border border-brand bg-brand-soft/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-brand-strong">{main.name}</p>
                          <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                            {children.length} sub-sector{children.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        {children.length ? (
                          <ul className="mt-3 space-y-2">
                            {children.map((child) => (
                              <li
                                key={child.id}
                                className="flex items-start justify-between gap-3 rounded-lg border border-brand/50 bg-white px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-brand-strong">{child.name}</p>
                                  {child.description ? (
                                    <p className="text-xs text-brand-muted">{child.description}</p>
                                  ) : null}
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => beginSubSectorEdit(child)}
                                    className="rounded-full px-3 py-1 text-xs font-semibold chip-brand"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSubSectorDelete(child)}
                                    className="rounded-full px-3 py-1 text-xs font-semibold text-white btn-brand"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-brand-soft">
                            No sub-sectors captured for this main sector yet.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-brand px-4 py-6 text-sm text-brand-soft">
                  Add a main sector to start defining sub-sectors.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
