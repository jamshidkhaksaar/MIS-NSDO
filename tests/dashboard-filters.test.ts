import { describe, expect, test, beforeEach, vi } from "vitest";
import type { AvailableFilters, DashboardOverviewStats } from "@/lib/api/dashboard-v2";

// Mock the database helper to avoid hitting a real DB.
type Row = Record<string, unknown>;

type QueryHandler = (sql: string) => Row[];

let queryHandler: QueryHandler;

vi.mock("@/lib/db", () => {
  return {
    withConnection: async <T>(callback: (connection: { query: <R extends Row>(sql: string) => Promise<[R[]]> }) => Promise<T>) => {
      const connection = {
        async query<R extends Row>(sql: string): Promise<[R[]]> {
          const rows = queryHandler(sql) as R[];
          return [rows];
        },
      };
      return callback(connection);
    },
  };
});

import { fetchAvailableFilters, fetchOverviewStats } from "../src/lib/api/dashboard-v2";

const sectors = [
  { id: 1, sector_key: "Humanitarian", display_name: "Humanitarian", start_date: "2023-01-01", end_date: null, field_activity: "Relief", projects: 0, staff: 5 },
];

const mainSectors = [{ id: 10, name: "Health" }];
const subSectors = [{ id: 100, main_sector_id: 10, name: "Primary Care" }];

const projects = [
  { id: 101, sector: "Humanitarian", start_date: "2023-01-15", end_date: "2023-12-31", staff: 3 },
  { id: 102, sector: null, start_date: "2024-01-01", end_date: "2024-12-31", staff: 2 },
];

const projectProvinces = [
  { project_id: 101, province: "Badakhshan" },
  { project_id: 102, province: "Kunduz" },
];

const projectStandardSectors = [{ project_id: 102, standard_sector: "Primary Care" }];

const projectBeneficiaries = [
  { project_id: 101, type_key: "adultsMen", direct: 100, indirect: 0, include_in_totals: true },
  { project_id: 102, type_key: "adultsWomen", direct: 50, indirect: 0, include_in_totals: true },
];

beforeEach(() => {
  queryHandler = (sql: string) => {
    if (sql.includes("FROM projects")) return projects;
    if (sql.includes("FROM project_provinces")) return projectProvinces;
    if (sql.includes("FROM project_standard_sectors")) return projectStandardSectors;
    if (sql.includes("FROM project_beneficiaries")) return projectBeneficiaries;
    if (sql.includes("FROM sectors")) return sectors;
    if (sql.includes("FROM main_sectors")) return mainSectors;
    if (sql.includes("FROM sub_sectors")) return subSectors;
    if (sql.includes("FROM reporting_years")) return []; // not used anymore
    if (sql.includes("DISTINCT province FROM project_provinces")) return projectProvinces;
    return [];
  };
});

describe("fetchAvailableFilters", () => {
  test("returns project years and main/sub sector labels", async () => {
    const filters: AvailableFilters = await fetchAvailableFilters();
    expect(filters.years).toEqual([2024, 2023]);
    expect(filters.provinces.sort()).toEqual(["Badakhshan", "Kunduz"]);
    expect(filters.mainSectors.map((s) => s.name)).toContain("Health");
    const sectorNames = filters.sectors.map((s) => s.name);
    expect(sectorNames).toContain("Health");
    expect(sectorNames).toContain("Primary Care");
  });
});

describe("fetchOverviewStats", () => {
  test("filters by province and maps sub-sectors to their main sector", async () => {
    const stats: DashboardOverviewStats = await fetchOverviewStats({ province: "Kunduz" });
    // Only project 102 should be included via province filter.
    expect(stats.totalProjects).toBe(1);
    // Beneficiaries from project 102 only.
    expect(stats.totalBeneficiaries).toBe(50);
    // Sub-sector should roll up under main sector "Health".
    const health = stats.sectors["Health"];
    expect(health?.projects).toBe(1);
    expect(health?.provinces).toContain("Kunduz");
    // All Sectors aggregate should respect province filter.
    expect(stats.coveredProvinces).toEqual(["Kunduz"]);
  });

  test("filters by year overlapping project dates", async () => {
    const stats2023 = await fetchOverviewStats({ year: 2023 });
    expect(stats2023.totalProjects).toBe(1); // only project 101 overlaps 2023
    const stats2024 = await fetchOverviewStats({ year: 2024 });
    expect(stats2024.totalProjects).toBe(1); // only project 102 overlaps 2024
  });
});
