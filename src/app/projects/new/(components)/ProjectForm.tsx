"use client";

import { useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";
import LocationSelector from "./LocationSelector";

const sectorOptions = [
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "wash", label: "WASH" },
  { value: "protection", label: "Protection" },
  { value: "agriculture", label: "Agriculture" },
];

const clusterOptions = [
  { value: "food-security", label: "Food Security" },
  { value: "emergency-shelter", label: "Emergency Shelter" },
  { value: "coordination", label: "Coordination" },
  { value: "nutrition", label: "Nutrition" },
];

type FormData = {
  projectName: string;
  donorName: string;
  sectors: string[];
  clusters: string[];
  startDate: string;
  endDate: string;
  status: string;
};

export default function ProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    donorName: "",
    sectors: [],
    clusters: [],
    startDate: "",
    endDate: "",
    status: "Pipeline Project",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleMultiSelectChange = (field: keyof FormData) => (selected: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: selected }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would typically send the data to a server
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-4">
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
        <LocationSelector />
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

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
        >
          Create Project
        </button>
      </div>
    </form>
  );
}
