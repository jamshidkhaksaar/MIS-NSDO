"use client";

import { useMemo, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";
import LocationSelector from "./LocationSelector";
import { useDashboardData } from "@/context/DashboardDataContext";
import { encodeProjectLocations, type ProjectProvinceLocations } from "@/lib/project-locations";

const DEFAULT_SECTOR_OPTIONS = [
  { value: "Health", label: "Health" },
  { value: "Education", label: "Education" },
  { value: "WASH", label: "WASH" },
  { value: "Protection", label: "Protection" },
  { value: "Agriculture", label: "Agriculture" },
];

const DEFAULT_CLUSTER_OPTIONS = [
  { value: "Food Security", label: "Food Security" },
  { value: "Emergency Shelter", label: "Emergency Shelter" },
  { value: "Coordination", label: "Coordination" },
  { value: "Nutrition", label: "Nutrition" },
];

type FormData = {
  projectCode: string;
  projectName: string;
  donorName: string;
  sectors: string[];
  clusters: string[];
  startDate: string;
  endDate: string;
  status: string;
  locations: ProjectProvinceLocations[];
};

export default function ProjectForm() {
  const { sectorCatalog, clusterCatalog, createProject } = useDashboardData();
  const [formData, setFormData] = useState<FormData>({
    projectCode: "",
    projectName: "",
    donorName: "",
    sectors: [],
    clusters: [],
    startDate: "",
    endDate: "",
    status: "Pipeline Project",
    locations: [],
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectorOptions = useMemo(() => {
    const entries = new Map<string, { value: string; label: string }>();

    sectorCatalog.forEach((entry) => {
      const trimmedName = entry.name.trim();
      if (!trimmedName) {
        return;
      }
      const key = trimmedName.toLowerCase();
      entries.set(key, { value: trimmedName, label: trimmedName });
    });

    DEFAULT_SECTOR_OPTIONS.forEach((option) => {
      const key = option.label.toLowerCase();
      if (!entries.has(key)) {
        entries.set(key, option);
      }
    });

    return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [sectorCatalog]);

  const clusterOptions = useMemo(() => {
    const entries = new Map<string, { value: string; label: string }>();

    clusterCatalog.forEach((entry) => {
      const trimmedName = entry.name.trim();
      if (!trimmedName) {
        return;
      }
      const key = trimmedName.toLowerCase();
      entries.set(key, { value: trimmedName, label: trimmedName });
    });

    DEFAULT_CLUSTER_OPTIONS.forEach((option) => {
      const key = option.label.toLowerCase();
      if (!entries.has(key)) {
        entries.set(key, option);
      }
    });

    return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [clusterCatalog]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleMultiSelectChange = (field: keyof FormData) => (selected: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: selected }));
  };

  const handleLocationsChange = (locations: ProjectProvinceLocations[]) => {
    setFormData((previous) => ({ ...previous, locations }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!formData.projectCode.trim()) {
      setError("Project code is required.");
      return;
    }
    if (!formData.projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    const locations = encodeProjectLocations(formData.locations);
    const primarySector = formData.sectors[0]?.trim() ?? undefined;

    const payload = {
      code: formData.projectCode.trim(),
      name: formData.projectName.trim(),
      donor: formData.donorName.trim() || undefined,
      sector: primarySector,
      country: "Afghanistan",
      start: formData.startDate || undefined,
      end: formData.endDate || undefined,
      provinces: locations.provinces,
      districts: locations.districts,
      communities: locations.communities,
      clusters: formData.clusters,
      standardSectors: formData.sectors,
    };

    setIsSubmitting(true);
    try {
      await createProject(payload);
      setNotice("Project created successfully.");
      setFormData({
        projectCode: "",
        projectName: "",
        donorName: "",
        sectors: [],
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
            placeholder="Project Name based on contract given by donor/partner"
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
        <div>
          <label className="block text-sm font-medium text-brand-muted">Relevant Sector</label>
          <MultiSelectDropdown
            options={sectorOptions}
            selected={formData.sectors}
            onChange={handleMultiSelectChange("sectors")}
            placeholder="Select relevant sectors"
          />
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
