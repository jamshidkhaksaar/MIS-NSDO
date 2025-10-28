"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/context/DashboardDataContext";

type ProjectSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  includeBlankOption?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export default function ProjectSelect({
  value,
  onChange,
  label = "Select project",
  includeBlankOption = true,
  helperText,
  disabled = false,
}: ProjectSelectProps) {
  const { projects } = useDashboardData();

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  return (
    <div className="space-y-1">
      <label htmlFor="project-select" className="block text-sm font-medium text-brand-muted">
        {label}
      </label>
      <select
        id="project-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-brand block w-full rounded-lg"
        disabled={disabled}
      >
        {includeBlankOption ? (
          <option value="">{projects.length ? "Choose a project" : "No projects available"}</option>
        ) : null}
        {sortedProjects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      {helperText ? <p className="text-xs text-brand-soft">{helperText}</p> : null}
    </div>
  );
}
