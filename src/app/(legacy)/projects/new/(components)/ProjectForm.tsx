"use client";

import { useEffect, useMemo, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";
import LocationSelector from "./LocationSelector";
import { useDashboardData } from "@/context/DashboardDataContext";
import { encodeProjectLocations, type ProjectProvinceLocations } from "@/lib/project-locations";

type FormData = {
  projectCode: string;
  projectName: string;
  donorName: string;
  mainSector: string;
  subSectors: string[];
  clusters: string[];
  startDate: string;
  endDate: string;
  status: string;
  locations: ProjectProvinceLocations[];
};

const normalize = (value: string) => value.trim();

export default function ProjectForm() {
  const { clusterCatalog, createProject, mainSectors, subSectors } = useDashboardData();
  const [formData, setFormData] = useState<FormData>({
    projectCode: "",
    projectName: "",
    donorName: "",
    mainSector: "",
    subSectors: [],
    clusters: [],
    startDate: "",
    endDate: "",
    status: "Pipeline Project",
    locations: [],
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mainSectorOptions = useMemo(
    () =>
      mainSectors
        .map((sector) => ({
          id: sector.id,
          name: normalize(sector.name),
        }))
        .filter((sector) => sector.name.length)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [mainSectors]
  );

  const selectedMainSector = useMemo(() => {
    if (!formData.mainSector.trim()) {
      return null;
    }
    const target = formData.mainSector.trim().toLowerCase();
    return (
      mainSectorOptions.find((option) => option.name.toLowerCase() === target) ?? null
    );
  }, [formData.mainSector, mainSectorOptions]);

  const subSectorOptions = useMemo(() => {
    if (!selectedMainSector) {
      return [];
    }
    const available = subSectors
      .filter((entry) => entry.mainSectorId === selectedMainSector.id)
      .map((entry) => normalize(entry.name))
      .filter((name) => name.length);

    const optionMap = new Map<string, string>();
    available.forEach((name) => optionMap.set(name.toLowerCase(), name));
    formData.subSectors.forEach((name) => {
      const trimmed = normalize(name);
      if (trimmed.length && !optionMap.has(trimmed.toLowerCase())) {
        optionMap.set(trimmed.toLowerCase(), trimmed);
      }
    });

    return Array.from(optionMap.values())
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [formData.subSectors, selectedMainSector, subSectors]);

  const clusterOptions = useMemo(() => {
    const optionMap = new Map<string, { value: string; label: string }>();
    clusterCatalog.forEach((entry) => {
      const trimmed = normalize(entry.name);
      if (trimmed.length) {
        optionMap.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
      }
    });
    formData.clusters.forEach((cluster) => {
      const trimmed = normalize(cluster);
      if (trimmed.length && !optionMap.has(trimmed.toLowerCase())) {
        optionMap.set(trimmed.toLowerCase(), { value: trimmed, label: trimmed });
      }
    });
    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [clusterCatalog, formData.clusters]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = event.target;
    setFormData((previous) => ({ ...previous, [id]: value }));
  };

  const handleMultiSelectChange =
    (field: keyof FormData) =>
    (selected: string[]): void => {
      setFormData((previous) => ({ ...previous, [field]: selected }));
    };

  const handleMainSectorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSector = event.target.value;
    setFormData((previous) => ({ ...previous, mainSector: nextSector }));
  };

  useEffect(() => {
    setFormData((previous) => {
      if (!selectedMainSector) {
        return previous.subSectors.length ? { ...previous, subSectors: [] } : previous;
      }
      const validNames = new Set(
        subSectorOptions.map((option) => option.value.toLowerCase())
      );
      const filtered = previous.subSectors.filter((name) =>
        validNames.has(name.trim().toLowerCase())
      );
      if (filtered.length === previous.subSectors.length) {
        return previous;
      }
      return { ...previous, subSectors: filtered };
    });
  }, [selectedMainSector, subSectorOptions]);

  const handleLocationsChange = (locations: ProjectProvinceLocations[]) => {
    setFormData((previous) => ({ ...previous, locations }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const code = normalize(formData.projectCode);
    if (!code) {
      setError("Project code is required.");
      return;
    }

    const name = normalize(formData.projectName);
    if (!name) {
      setError("Project name is required.");
      return;
    }

    const mainSectorName = normalize(formData.mainSector);
    if (!mainSectorName) {
      setError("Select a main sector for the project.");
      return;
    }

    const trimmedSubSectors = Array.from(
      new Set(formData.subSectors.map((entry) => normalize(entry)).filter(Boolean))
    );
    const trimmedClusters = Array.from(
      new Set(formData.clusters.map((entry) => normalize(entry)).filter(Boolean))
    );

    const locations = encodeProjectLocations(formData.locations);

    const payload = {
      code,
      name,
      donor: normalize(formData.donorName) || undefined,
      sector: mainSectorName,
      country: "Afghanistan",
      start: formData.startDate || undefined,
      end: formData.endDate || undefined,
      provinces: locations.provinces,
      districts: locations.districts,
      communities: locations.communities,
      clusters: trimmedClusters,
      standardSectors: trimmedSubSectors,
    };

    setIsSubmitting(true);
    try {
      await createProject(payload);
      setNotice("Project created successfully.");
      setFormData({
        projectCode: "",
        projectName: "",
        donorName: "",
        mainSector: "",
        subSectors: [],
        clusters: [],
        startDate: "",
        endDate: "",
        status: "Pipeline Project",
        locations: [],
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Failed to create project."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="projectCode" className="block text-sm font-medium text-brand-muted">
            Project Code
          </label>
          <input
            type="text"
            id="projectCode"
            value={formData.projectCode}
            onChange={handleInputChange}
            className="input-brand mt-1 block w-full rounded-lg"
            placeholder="Unique code provided by donor/partner"
          />
        </div>
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-brand-muted">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="input-brand mt-1 block w-full rounded-lg"
            placeholder="Project name based on donor contract"
          />
        </div>
        <div>
          <label htmlFor="donorName" className="block text-sm font-medium text-brand-muted">
            Donor / Partner Name
          </label>
          <input
            type="text"
            id="donorName"
            value={formData.donorName}
            onChange={handleInputChange}
            className="input-brand mt-1 block w-full rounded-lg"
            placeholder="Enter donor or partner name"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="main-sector" className="block text-sm font-medium text-brand-muted">
              Main sector
            </label>
            <select
              id="main-sector"
              value={formData.mainSector}
              onChange={handleMainSectorChange}
              className="input-brand mt-1 block w-full rounded-lg"
            >
              <option value="">Select a main sector</option>
              {mainSectorOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-muted">Sub-sectors</label>
            <MultiSelectDropdown
              options={subSectorOptions}
              selected={formData.subSectors}
              onChange={handleMultiSelectChange("subSectors")}
              placeholder={
                selectedMainSector ? "Select sub-sectors" : "Choose a main sector first"
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-muted">Clusters</label>
          <MultiSelectDropdown
            options={clusterOptions}
            selected={formData.clusters}
            onChange={handleMultiSelectChange("clusters")}
            placeholder="Select relevant clusters"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted">Projects Locations</label>
        <LocationSelector value={formData.locations} onChange={handleLocationsChange} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-brand-muted">
            Project Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="input-brand mt-1 block w-full rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-brand-muted">
            Project End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className="input-brand mt-1 block w-full rounded-lg"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-brand-muted">
          Project Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={handleInputChange}
          className="input-brand mt-1 block w-full rounded-lg"
        >
          <option>Pipeline Project</option>
          <option>Approved</option>
          <option>Implementing</option>
          <option>Completed</option>
        </select>
      </div>

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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
