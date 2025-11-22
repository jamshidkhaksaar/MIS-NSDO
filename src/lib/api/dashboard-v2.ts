import { withConnection } from "@/lib/db";
import {
  ALL_SECTOR_KEY,
  ALL_SECTOR_FIELD_ACTIVITY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  type EvaluationDashboardData,
  type FindingsDashboardData,
  type MainSectorRecord,
  type MonitoringDashboardData,
  type KnowledgeHubData,
  type PdmDashboardData,
  type SubSectorRecord,
  SectorDetails,
  SectorKey,
} from "@/lib/dashboard-data";
import { fetchDashboardState } from "@/lib/dashboard-repository";

// Helper to create empty breakdown
function createEmptyBreakdown(): BeneficiaryBreakdown {
  const direct: Record<BeneficiaryTypeKey, number> = {} as Record<
    BeneficiaryTypeKey,
    number
  >;
  const indirect: Record<BeneficiaryTypeKey, number> = {} as Record<
    BeneficiaryTypeKey,
    number
  >;
  const include: Record<BeneficiaryTypeKey, boolean> = {} as Record<
    BeneficiaryTypeKey,
    boolean
  >;
  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    direct[key] = 0;
    indirect[key] = 0;
    include[key] = false;
  });
  return { direct, indirect, include };
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0] ?? "";
}

type SectorRow = {
  id: number;
  sector_key: string;
  display_name: string;
  start_date: string | null;
  end_date: string | null;
  field_activity: string | null;
  projects: number;
  staff: number;
};

type ProjectRow = {
  id: number;
  sector: string | null;
  start_date: string | null;
  end_date: string | null;
  staff: number | null;
};

type ProjectBeneficiaryRow = {
    project_id: number;
    type_key: string;
    direct: number;
    indirect: number;
    include_in_totals: boolean;
};

type ProjectProvinceRow = {
    project_id: number;
    province: string;
};

type ProjectStandardSectorRow = {
    project_id: number;
    standard_sector: string;
};

type MainSectorRow = {
  id: number;
  name: string;
};

type SubSectorRow = {
  id: number;
  main_sector_id: number;
  name: string;
};

const UNSPECIFIED_SECTOR_KEY = "Unassigned / Other";

function normalizeSector(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized ? normalized : null;
}

export type DashboardOverviewStats = {
  totalProjects: number;
  activeProjects: number;
  totalBeneficiaries: number;
  coveredProvinces: string[];
  sectors: Record<string, SectorDetails>;
  projectStatusCounts: {
    active: number;
    ongoing: number;
    completed: number;
  };
  projects: Array<{
    id: string;
    name: string;
    province: string[];
    sector: string;
    status: string;
  }>;
};

export type DashboardFilters = {
    year?: number;
    province?: string;
    sector?: string;
};

export type AvailableFilters = {
    years: number[];
    provinces: string[];
    sectors: Array<{ key: string; name: string }>;
    mainSectors: Array<Pick<MainSectorRecord, "id" | "name">>;
    subSectors: Array<{
      id: string;
      mainSectorId: string;
      mainSectorName: string;
      name: string;
    }>;
};

export async function fetchAvailableFilters(): Promise<AvailableFilters> {
    return withConnection(async (connection) => {
        const [projectYears] = await connection.query<{ start_date: string | null; end_date: string | null }>(
            "SELECT start_date, end_date FROM projects"
        );

        // We can fetch provinces from sector_provinces or project_provinces
        // Let's use project_provinces to be consistent with actual data
        const [provinceRows] = await connection.query<{ province: string }>(
            "SELECT DISTINCT province FROM project_provinces ORDER BY province ASC"
        );

        const [mainSectorRows] = await connection.query<MainSectorRecord & { created_at?: string; updated_at?: string }>(
          "SELECT id, name FROM main_sectors ORDER BY name ASC"
        );

        const mainSectorMap = new Map<number, string>();
        mainSectorRows.forEach((row) => mainSectorMap.set(Number(row.id), row.name));

        const [subSectorRows] = await connection.query<SubSectorRecord & { main_sector_id: number; created_at?: string; updated_at?: string }>(
          "SELECT id, main_sector_id, name FROM sub_sectors ORDER BY name ASC"
        );

        const sectorOptions = new Map<string, string>();
        mainSectorRows.forEach((r) => {
          sectorOptions.set(r.name, r.name);
        });
        subSectorRows.forEach((r) => {
          sectorOptions.set(r.name, r.name);
        });

        const yearSet = new Set<number>();
        projectYears.forEach((row) => {
          const start = row.start_date ? new Date(row.start_date) : null;
          const end = row.end_date ? new Date(row.end_date) : null;
          if (start && !Number.isNaN(start.getTime())) {
            yearSet.add(start.getUTCFullYear());
          }
          if (end && !Number.isNaN(end.getTime())) {
            yearSet.add(end.getUTCFullYear());
          }
        });

        const years = Array.from(yearSet).sort((a, b) => b - a);

        return {
            years,
            provinces: provinceRows.map(r => r.province),
            sectors: Array.from(sectorOptions.entries()).map(([key, name]) => ({ key, name })),
            mainSectors: mainSectorRows.map(r => ({ id: r.id.toString(), name: r.name })),
            subSectors: subSectorRows.map(r => ({
              id: r.id.toString(),
              mainSectorId: r.main_sector_id.toString(),
              mainSectorName: mainSectorMap.get(r.main_sector_id) ?? "",
              name: r.name
            }))
        };
    });
}

export async function fetchOverviewStats(filters?: DashboardFilters): Promise<DashboardOverviewStats> {
  return withConnection(async (connection) => {
    // 1. Fetch basic Sector config (for metadata like keys, although we might dynamically build it too)
    const [sectorConfigRows] = await connection.query<SectorRow>(
      "SELECT * FROM sectors ORDER BY display_name ASC"
    );
    const [mainSectorRows] = await connection.query<MainSectorRow>(
      "SELECT id, name FROM main_sectors ORDER BY name ASC"
    );
    const [subSectorRows] = await connection.query<SubSectorRow>(
      "SELECT id, main_sector_id, name FROM sub_sectors ORDER BY name ASC"
    );
    const sectorKeyMap = new Map<string, string>();
    sectorConfigRows.forEach((r) => {
      const key = normalizeSector(r.sector_key);
      const display = normalizeSector(r.display_name);
      if (key) {
        sectorKeyMap.set(key, r.sector_key);
      }
      if (display) {
        sectorKeyMap.set(display, r.sector_key);
      }
    });
    mainSectorRows.forEach((r) => {
      const normalized = normalizeSector(r.name);
      if (normalized) {
        sectorKeyMap.set(normalized, r.name);
      }
    });
    subSectorRows.forEach((r) => {
      const normalized = normalizeSector(r.name);
      const main = mainSectorRows.find((m) => m.id === r.main_sector_id);
      if (normalized && main?.name) {
        sectorKeyMap.set(normalized, main.name);
      }
    });

    // 2. Fetch All Projects
    const [projects] = await connection.query<ProjectRow & { title: string }>(
        `SELECT id, title, sector, start_date, end_date, staff FROM projects`
    );
    const projectIds = projects.map(p => p.id);

    // 3. Fetch Project Attributes (Provinces, Beneficiaries, Standard Sectors)
    let projectProvinces: ProjectProvinceRow[] = [];
    let projectBeneficiaries: ProjectBeneficiaryRow[] = [];
    let projectStandardSectors: ProjectStandardSectorRow[] = [];

    const subSectorToMain = new Map<string, string>();
    subSectorRows.forEach((row) => {
      const subName = normalizeSector(row.name);
      const main = mainSectorRows.find((m) => m.id === row.main_sector_id);
      if (subName && main?.name) {
        subSectorToMain.set(subName, main.name);
      }
    });

    if (projectIds.length) {
        const placeholders = projectIds.map(() => "?").join(", ");

        const [provRows] = await connection.query<ProjectProvinceRow>(
            `SELECT project_id, province FROM project_provinces WHERE project_id IN (${placeholders})`,
            projectIds
        );
        projectProvinces = provRows;

        const [benRows] = await connection.query<ProjectBeneficiaryRow>(
            `SELECT project_id, type_key, direct, indirect, include_in_totals FROM project_beneficiaries WHERE project_id IN (${placeholders})`,
            projectIds
        );
        projectBeneficiaries = benRows;

        const [stdSecRows] = await connection.query<ProjectStandardSectorRow>(
            `SELECT project_id, standard_sector FROM project_standard_sectors WHERE project_id IN (${placeholders})`,
            projectIds
        );
        projectStandardSectors = stdSecRows;
    }

    // 4. Filter Projects
    const year = filters?.year;
    const province = filters?.province;
    const selectedSector =
      filters?.sector && filters.sector.trim()
        ? sectorKeyMap.get(normalizeSector(filters.sector) ?? "") ?? filters.sector.trim()
        : undefined;

    const filteredProjects = projects.filter(project => {
        // Year Filter
        if (year) {
            const startTime = project.start_date ? Date.parse(project.start_date) : Number.NaN;
            const endTime = project.end_date ? Date.parse(project.end_date) : Number.NaN;
            const yearStart = new Date(year, 0, 1).getTime();
            const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

            // If no dates, include (standard logic in legacy dashboard)
            if (Number.isNaN(startTime) && Number.isNaN(endTime)) {
                // pass
            } else {
                const startsBeforeYearEnd = Number.isNaN(startTime) || startTime <= yearEnd;
                const endsAfterYearStart = Number.isNaN(endTime) || endTime >= yearStart;
                if (!startsBeforeYearEnd || !endsAfterYearStart) return false;
            }
        }

        // Province Filter
        if (province) {
             const pProvinces = projectProvinces.filter(pp => pp.project_id === project.id).map(pp => pp.province);
             if (!pProvinces.includes(province)) return false;
        }

        if (selectedSector) {
            const normalized = project.sector?.toLowerCase();
            const matchesPrimary = normalized === selectedSector.toLowerCase();
            const matchesStandard = projectStandardSectors
              .some(ss => ss.project_id === project.id && ss.standard_sector.toLowerCase() === selectedSector.toLowerCase());
            if (!matchesPrimary && !matchesStandard) {
                return false;
            }
        }

        return true;
    });

    // 5. Aggregate Stats
    const filteredIds = new Set(filteredProjects.map(p => p.id));
    const filteredProvinces = projectProvinces.filter(pp => filteredIds.has(pp.project_id));
    const filteredBeneficiaries = projectBeneficiaries.filter(pb => filteredIds.has(pb.project_id));
    const filteredStandardSectors = projectStandardSectors.filter(ss => filteredIds.has(ss.project_id));

    const sectorsData: Record<string, SectorDetails> = {};

    // Initialize sectors from config
    sectorConfigRows.forEach(row => {
        sectorsData[row.sector_key as SectorKey] = {
            provinces: [],
            beneficiaries: createEmptyBreakdown(),
            projects: 0,
            start: formatDate(row.start_date),
            end: formatDate(row.end_date),
            fieldActivity: row.field_activity ?? "",
            staff: row.staff ?? 0
        };
    });
    mainSectorRows.forEach((row) => {
        if (!sectorsData[row.name]) {
          sectorsData[row.name] = {
            provinces: [],
            beneficiaries: createEmptyBreakdown(),
            projects: 0,
            start: "",
            end: "",
            fieldActivity: "",
            staff: 0
          };
        }
    });
    // Allow a fallback bucket for projects without a mapped sector
    sectorsData[UNSPECIFIED_SECTOR_KEY] = {
        provinces: [],
        beneficiaries: createEmptyBreakdown(),
        projects: 0,
        start: "",
        end: "",
        fieldActivity: "",
        staff: 0
    };

    // Add Aggregates
    const allSectorsData = {
        provinces: new Set<string>(),
        beneficiaries: createEmptyBreakdown(),
        projects: 0,
        staff: 0
    };

    filteredProjects.forEach(project => {
        // Determine sectors for this project
        const pSectors = new Set<string>();
        if (project.sector) {
            const normalized = normalizeSector(project.sector);
            const key = normalized ? sectorKeyMap.get(normalized) : null;
            if (key) pSectors.add(key);
        }
        // Also check standard sectors
        filteredStandardSectors.filter(ss => ss.project_id === project.id).forEach(ss => {
             const normalized = normalizeSector(ss.standard_sector);
             if (normalized) {
               const main = subSectorToMain.get(normalized);
               if (main) {
                 pSectors.add(main);
               } else {
                 const key = sectorKeyMap.get(normalized);
                 if (key) pSectors.add(key);
               }
             }
        });

        if (!pSectors.size) {
            pSectors.add(UNSPECIFIED_SECTOR_KEY);
        }

        if (selectedSector && !pSectors.has(selectedSector)) {
            return;
        }

        // If no sector match found in config, we skip adding to specific sector stats but keep in total?
        // Or maybe 'Unassigned'? For now, only configured sectors.

        // Add to All Sectors
        allSectorsData.projects += 1;
        allSectorsData.staff += (project.staff ?? 0);

        const pProvincesList = filteredProvinces.filter(pp => pp.project_id === project.id).map(pp => pp.province);
        pProvincesList.forEach(p => allSectorsData.provinces.add(p));

        const pBeneficiaries = filteredBeneficiaries.filter(pb => pb.project_id === project.id);

        // Aggregate to All Sectors Beneficiaries
        pBeneficiaries.forEach(b => {
            const type = b.type_key as BeneficiaryTypeKey;
            const include = b.include_in_totals; // Or metadata check if null/undefined
            if (include || BENEFICIARY_TYPE_META[type].includeInTotals) {
                allSectorsData.beneficiaries.direct[type] += b.direct;
                allSectorsData.beneficiaries.indirect[type] += b.indirect;
                allSectorsData.beneficiaries.include[type] = true;
            }
        });

        // Add to Specific Sectors
        pSectors.forEach(sectorKey => {
            const sData = sectorsData[sectorKey];
            if (sData) {
                sData.projects += 1;
                sData.staff += (project.staff ?? 0);
                pProvincesList.forEach(p => {
                    if (!sData.provinces.includes(p)) sData.provinces.push(p);
                });
                pBeneficiaries.forEach(b => {
                    const type = b.type_key as BeneficiaryTypeKey;
                    const include = b.include_in_totals;
                    if (include || BENEFICIARY_TYPE_META[type].includeInTotals) {
                         sData.beneficiaries.direct[type] += b.direct;
                         sData.beneficiaries.indirect[type] += b.indirect;
                         sData.beneficiaries.include[type] = true;
                    }
                });
            }
        });
    });

    // Sort provinces
    Object.values(sectorsData).forEach(s => s.provinces.sort((a, b) => a.localeCompare(b)));

    // Add All Sector Key
    const sectorDateRangeSource = selectedSector
      ? sectorConfigRows.filter(row => row.sector_key === selectedSector)
      : sectorConfigRows;
    const startDates = sectorDateRangeSource
      .map(row => row.start_date)
      .filter((d): d is string => Boolean(d))
      .map(date => new Date(date))
      .filter(date => !Number.isNaN(date.getTime()));
    const endDates = sectorDateRangeSource
      .map(row => row.end_date)
      .filter((d): d is string => Boolean(d))
      .map(date => new Date(date))
      .filter(date => !Number.isNaN(date.getTime()));
    const startMillis = startDates.map(d => d.getTime()).filter(Number.isFinite);
    const endMillis = endDates.map(d => d.getTime()).filter(Number.isFinite);

    sectorsData[ALL_SECTOR_KEY] = {
        provinces: Array.from(allSectorsData.provinces).sort((a, b) => a.localeCompare(b)),
        beneficiaries: allSectorsData.beneficiaries,
        projects: allSectorsData.projects,
        start: startMillis.length ? formatDate(new Date(Math.min(...startMillis)).toISOString()) : "",
        end: endMillis.length ? formatDate(new Date(Math.max(...endMillis)).toISOString()) : "",
        fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
        staff: allSectorsData.staff
    };

    // Status Counts
    let active = 0;
    let ongoing = 0;
    let completed = 0;
    const nowTime = Date.now();

    filteredProjects.forEach(project => {
        const startTime = project.start_date ? Date.parse(project.start_date) : Number.NaN;
        const endTime = project.end_date ? Date.parse(project.end_date) : Number.NaN;
        const hasStart = !Number.isNaN(startTime);
        const hasEnd = !Number.isNaN(endTime);

        if (hasEnd && endTime < nowTime) {
            completed += 1;
        } else {
            active += 1;
            if (hasStart && startTime <= nowTime && (!hasEnd || endTime >= nowTime)) {
                ongoing += 1;
            }
        }
    });

    const totalBeneficiaries = BENEFICIARY_TYPE_KEYS.reduce((sum, key) => {
        if (allSectorsData.beneficiaries.include[key]) {
          return sum + allSectorsData.beneficiaries.direct[key] + allSectorsData.beneficiaries.indirect[key];
        }
        return sum;
    }, 0);

    const projectList = filteredProjects.map(p => {
        const startTime = p.start_date ? Date.parse(p.start_date) : Number.NaN;
        const endTime = p.end_date ? Date.parse(p.end_date) : Number.NaN;
        let status = "Active";
        if (!Number.isNaN(endTime) && endTime < nowTime) {
            status = "Completed";
        } else if (!Number.isNaN(startTime) && startTime > nowTime) {
            status = "Planned";
        } else if (!Number.isNaN(startTime) && startTime <= nowTime && (!Number.isNaN(endTime) && endTime >= nowTime)) {
            status = "Ongoing";
        }

        const pProvinces = projectProvinces
          .filter(pp => pp.project_id === p.id)
          .map(pp => pp.province);

        return {
            id: p.id.toString(),
            name: (p as any).title || `Project ${p.id}`, // p comes from fetch All Projects which only selects id, sector, start_date, end_date, staff. I need to add title to the query.
            province: pProvinces,
            sector: p.sector ?? "Unassigned",
            status
        };
    });

    return {
      totalProjects: allSectorsData.projects,
      activeProjects: active,
      totalBeneficiaries,
      coveredProvinces: Array.from(allSectorsData.provinces).sort((a, b) => a.localeCompare(b)),
      sectors: sectorsData,
      projectStatusCounts: {
          active,
          ongoing,
          completed
      },
      projects: projectList
    };
  });
}

export type DashboardProjectSummary = {
    id: string;
    code: string;
    name: string;
    sector: string;
    status: "Active" | "Completed" | "Ongoing" | "Planned";
    provinces: string[];
    startDate: string;
    endDate: string;
};

export async function fetchProjectsList(filters?: DashboardFilters): Promise<DashboardProjectSummary[]> {
    return withConnection(async (connection) => {
        // 1. Fetch Projects
        const [projects] = await connection.query<ProjectRow & { code: string; title: string }>(
            `SELECT id, code, title, sector, start_date, end_date, staff FROM projects ORDER BY title ASC`
        );
        const projectIds = projects.map(p => p.id);

        // 2. Fetch Provinces
        let projectProvinces: ProjectProvinceRow[] = [];
        let projectStandardSectors: ProjectStandardSectorRow[] = [];
        if (projectIds.length > 0) {
            const placeholders = projectIds.map(() => "?").join(", ");
            const [provRows] = await connection.query<ProjectProvinceRow>(
                `SELECT project_id, province FROM project_provinces WHERE project_id IN (${placeholders})`,
                projectIds
            );
            projectProvinces = provRows;

            const [stdRows] = await connection.query<ProjectStandardSectorRow>(
                `SELECT project_id, standard_sector FROM project_standard_sectors WHERE project_id IN (${placeholders})`,
                projectIds
            );
            projectStandardSectors = stdRows;
        }

        // 3. Apply Filters
        const year = filters?.year;
        const province = filters?.province;
        const sector = normalizeSector(filters?.sector);

        const filtered = projects.filter(project => {
            // Year Filter
            if (year) {
                const startTime = project.start_date ? Date.parse(project.start_date) : Number.NaN;
                const endTime = project.end_date ? Date.parse(project.end_date) : Number.NaN;
                const yearStart = new Date(year, 0, 1).getTime();
                const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

                if (Number.isNaN(startTime) && Number.isNaN(endTime)) {
                    // pass
                } else {
                    const startsBeforeYearEnd = Number.isNaN(startTime) || startTime <= yearEnd;
                    const endsAfterYearStart = Number.isNaN(endTime) || endTime >= yearStart;
                    if (!startsBeforeYearEnd || !endsAfterYearStart) return false;
                }
            }

            // Province Filter
            if (province) {
                const pProvinces = projectProvinces.filter(pp => pp.project_id === project.id).map(pp => pp.province);
                if (!pProvinces.includes(province)) return false;
            }

            if (sector) {
                const normalized = normalizeSector(project.sector);
                const matchesPrimary = normalized === sector;
                const matchesStandard = (projectStandardSectors || [])
                  .some(ss => {
                      const std = normalizeSector(ss.standard_sector);
                      return std === sector;
                  });
                if (!matchesPrimary && !matchesStandard) {
                    return false;
                }
            }

            return true;
        });

        // 4. Map to Summary
        const nowTime = Date.now();
        return filtered.map(p => {
            const startTime = p.start_date ? Date.parse(p.start_date) : Number.NaN;
            const endTime = p.end_date ? Date.parse(p.end_date) : Number.NaN;
            let status: "Active" | "Completed" | "Ongoing" | "Planned" = "Active";

            if (!Number.isNaN(endTime) && endTime < nowTime) {
                status = "Completed";
            } else if (!Number.isNaN(startTime) && startTime > nowTime) {
                status = "Planned";
            } else if (!Number.isNaN(startTime) && startTime <= nowTime && (!Number.isNaN(endTime) && endTime >= nowTime)) {
                status = "Ongoing";
            }

            return {
                id: p.id.toString(),
                code: p.code,
                name: p.title,
                sector: p.sector ?? "Unassigned",
                status,
                provinces: projectProvinces.filter(pp => pp.project_id === p.id).map(pp => pp.province),
                startDate: formatDate(p.start_date),
                endDate: formatDate(p.end_date)
            };
        });
    });
}

type ProjectLookup = Map<string, string>;

type ProjectMeta = {
  id: string;
  name: string;
  sector?: string | null;
  start?: string;
  end?: string;
  provinces?: string[];
  standardSectors?: string[];
};

function buildProjectLookup(projects: Array<{ id: string; name: string }>): ProjectLookup {
  const map = new Map<string, string>();
  projects.forEach((project) => {
    map.set(project.id, project.name);
  });
  return map;
}

function labelForProject(projectId: string | undefined, lookup: ProjectLookup): string {
  if (!projectId) return "Unassigned project";
  return lookup.get(projectId) ?? `Project ${projectId}`;
}

function matchesProjectFilters(project: ProjectMeta, filters?: DashboardFilters, sectorKeyMap?: Map<string, string>): boolean {
  if (!filters) return true;
  const { year, province, sector } = filters;

  if (year) {
    const startTime = project.start ? Date.parse(project.start) : Number.NaN;
    const endTime = project.end ? Date.parse(project.end) : Number.NaN;
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();
    if (!Number.isNaN(startTime) || !Number.isNaN(endTime)) {
      const startsBeforeYearEnd = Number.isNaN(startTime) || startTime <= yearEnd;
      const endsAfterYearStart = Number.isNaN(endTime) || endTime >= yearStart;
      if (!startsBeforeYearEnd || !endsAfterYearStart) return false;
    }
  }

  if (province) {
    const provinces = project.provinces ?? [];
    if (!provinces.includes(province)) {
      return false;
    }
  }

  if (sector) {
    const normalized = normalizeSector(sector);
    const projectSector = normalizeSector(project.sector);
    const standardSectors = project.standardSectors?.map(normalizeSector).filter(Boolean) ?? [];
    const sectorMatch =
      normalized &&
      (projectSector === normalized ||
        standardSectors.includes(normalized) ||
        (sectorKeyMap && sectorKeyMap.get(normalized || "") === project.sector));
    if (normalized && !sectorMatch) {
      return false;
    }
  }

  return true;
}

export type MonitoringOverview = {
  totals: {
    baselineSurveys: number;
    baselineReports: number;
    enumerators: number;
    dataCollectionTasks: number;
    fieldVisits: number;
    monthlyReports: number;
  };
  baselineByStatus: Record<string, number>;
  tasksByStatus: Record<string, number>;
  monthlyByStatus: Record<string, number>;
  latestFieldVisits: Array<{ id: string; project: string; date: string; location?: string }>;
  latestMonthlyReports: Array<{ id: string; project: string; month: string; status: string; summary?: string }>;
};

export async function fetchMonitoringOverview(filters?: DashboardFilters): Promise<MonitoringOverview> {
  const state = await fetchDashboardState();
  const { monitoring } = state as { monitoring: MonitoringDashboardData };
  const sectorKeyMap = new Map<string, string>();
  state.sectors &&
    Object.keys(state.sectors).forEach((key) => {
      const normalized = normalizeSector(key);
      if (normalized) sectorKeyMap.set(normalized, key);
    });

  const projectLookup = buildProjectLookup(state.projects.map((p) => ({ id: p.id, name: p.name })));
  const filteredProjects = new Set(
    state.projects
      .filter((project) =>
        matchesProjectFilters(
          {
            id: project.id,
            name: project.name,
            sector: project.sector,
            start: project.start,
            end: project.end,
            provinces: project.provinces,
            standardSectors: project.standardSectors,
          },
          filters,
          sectorKeyMap
        )
      )
      .map((p) => p.id)
  );

  const baselineByStatus: Record<string, number> = {};
  monitoring.baselineSurveys
    .filter((survey) => !survey.projectId || filteredProjects.has(survey.projectId))
    .forEach((survey) => {
      baselineByStatus[survey.status] = (baselineByStatus[survey.status] ?? 0) + 1;
    });

  const tasksByStatus: Record<string, number> = {};
  monitoring.dataCollectionTasks
    .filter((task) => {
      const survey = monitoring.baselineSurveys.find((s) => s.id === task.baselineSurveyId);
      return survey ? !survey.projectId || filteredProjects.has(survey.projectId) : true;
    })
    .forEach((task) => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1;
    });

  const monthlyByStatus: Record<string, number> = {};
  const monthlyReports = monitoring.monthlyReports.filter(
    (report) => !report.projectId || filteredProjects.has(report.projectId)
  );
  monthlyReports.forEach((report) => {
    monthlyByStatus[report.status] = (monthlyByStatus[report.status] ?? 0) + 1;
  });

  const latestFieldVisits = monitoring.fieldVisits
    .filter((visit) => !visit.projectId || filteredProjects.has(visit.projectId))
    .slice(0, 5)
    .map((visit) => ({
      id: visit.id,
      project: labelForProject(visit.projectId, projectLookup),
      date: formatDate(visit.visitDate),
      location: visit.location,
    }));

  const latestMonthlyReports = monitoring.monthlyReports
    .slice(0, 5)
    .map((report) => ({
      id: report.id,
      project: labelForProject(report.projectId, projectLookup),
      month: report.reportMonth,
      status: report.status,
      summary: report.summary,
    }));

  return {
    totals: {
      baselineSurveys: monitoring.baselineSurveys.filter(
        (survey) => !survey.projectId || filteredProjects.has(survey.projectId)
      ).length,
      baselineReports: monitoring.baselineReports.filter((report) =>
        monitoring.baselineSurveys.some(
          (survey) => survey.id === report.baselineSurveyId && (!survey.projectId || filteredProjects.has(survey.projectId))
        )
      ).length,
      enumerators: monitoring.enumerators.length,
      dataCollectionTasks: monitoring.dataCollectionTasks.filter((task) => {
        const survey = monitoring.baselineSurveys.find((s) => s.id === task.baselineSurveyId);
        return survey ? !survey.projectId || filteredProjects.has(survey.projectId) : true;
      }).length,
      fieldVisits: monitoring.fieldVisits.filter((visit) => !visit.projectId || filteredProjects.has(visit.projectId)).length,
      monthlyReports: monthlyReports.length,
    },
    baselineByStatus,
    tasksByStatus,
    monthlyByStatus,
    latestFieldVisits,
    latestMonthlyReports,
  };
}

export type EvaluationOverview = {
  totals: {
    evaluations: number;
    stories: number;
  };
  evaluationsByType: Record<string, number>;
  recentEvaluations: Array<{ id: string; project: string; type: string; completedAt?: string }>;
  featuredStories: Array<{ id: string; title: string; type: string; project: string }>;
};

export async function fetchEvaluationOverview(filters?: DashboardFilters): Promise<EvaluationOverview> {
  const state = await fetchDashboardState();
  const { evaluation } = state as { evaluation: EvaluationDashboardData };
  const projectLookup = buildProjectLookup(state.projects.map((p) => ({ id: p.id, name: p.name })));
  const filteredProjects = new Set(
    state.projects
      .filter((project) =>
        matchesProjectFilters(
          {
            id: project.id,
            name: project.name,
            sector: project.sector,
            start: project.start,
            end: project.end,
            provinces: project.provinces,
            standardSectors: project.standardSectors,
          },
          filters
        )
      )
      .map((p) => p.id)
  );

  const evaluationsByType: Record<string, number> = {};
  evaluation.evaluations
    .filter((evaluationItem) => !evaluationItem.projectId || filteredProjects.has(evaluationItem.projectId))
    .forEach((evaluationItem) => {
      evaluationsByType[evaluationItem.evaluationType] =
        (evaluationsByType[evaluationItem.evaluationType] ?? 0) + 1;
    });

  const filteredEvaluations = evaluation.evaluations.filter(
    (item) => !item.projectId || filteredProjects.has(item.projectId)
  );

  const recentEvaluations = filteredEvaluations.slice(0, 5).map((item) => ({
    id: item.id,
    project: labelForProject(item.projectId, projectLookup),
    type: item.evaluationType,
    completedAt: item.completedAt,
  }));

  const filteredStories = evaluation.stories.filter(
    (story) => !story.projectId || filteredProjects.has(story.projectId)
  );

  const featuredStories = filteredStories.slice(0, 5).map((story) => ({
    id: story.id,
    title: story.title,
    type: story.storyType,
    project: labelForProject(story.projectId, projectLookup),
  }));

  return {
    totals: {
      evaluations: filteredEvaluations.length,
      stories: filteredStories.length,
    },
    evaluationsByType,
    recentEvaluations,
    featuredStories,
  };
}

export type AccountabilityOverview = {
  totals: {
    complaints: number;
    crmRecords: number;
  };
  complaintStatus: Record<string, number>;
  recentComplaints: Array<{ id: string; category?: string | null; province?: string | null; status: string }>;
};

export async function fetchAccountabilityOverview(filters?: DashboardFilters): Promise<AccountabilityOverview> {
  const state = await fetchDashboardState();
  const filteredProjects = new Set(
    state.projects
      .filter((project) =>
        matchesProjectFilters(
          {
            id: project.id,
            name: project.name,
            sector: project.sector,
            start: project.start,
            end: project.end,
            provinces: project.provinces,
            standardSectors: project.standardSectors,
          },
          filters
        )
      )
      .map((p) => p.id)
  );

  const complaintStatus = {
    open: state.complaints.filter((c) => filteredProjects.has(c.projectId ?? "") || !c.projectId).length,
    in_review: state.complaints.filter((c) => (filteredProjects.has(c.projectId ?? "") || !c.projectId) && c.status === "in_review").length,
    resolved: state.complaints.filter((c) => (filteredProjects.has(c.projectId ?? "") || !c.projectId) && c.status === "resolved").length,
  };

  const filteredComplaints = state.complaints.filter(
    (complaint) => !complaint.projectId || filteredProjects.has(complaint.projectId)
  );

  const recentComplaints = filteredComplaints.slice(0, 5).map((complaint) => ({
    id: complaint.id,
    category: complaint.category,
    province: complaint.province,
    status: complaint.status,
  }));

  return {
    totals: {
      complaints: filteredComplaints.length,
      crmRecords: state.crmAwareness.length,
    },
    complaintStatus,
    recentComplaints,
  };
}

export type FindingsOverview = {
  totals: {
    findings: number;
    distributions: number;
    pdmSurveys: number;
    pdmReports: number;
  };
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentFindings: Array<{ id: string; project: string; severity: string; status: string }>;
};

export async function fetchFindingsOverview(filters?: DashboardFilters): Promise<FindingsOverview> {
  const state = await fetchDashboardState();
  const findingsData = state.findings as FindingsDashboardData;
  const pdmData = state.pdm as PdmDashboardData;
  const projectLookup = buildProjectLookup(state.projects.map((p) => ({ id: p.id, name: p.name })));
  const filteredProjects = new Set(
    state.projects
      .filter((project) =>
        matchesProjectFilters(
          {
            id: project.id,
            name: project.name,
            sector: project.sector,
            start: project.start,
            end: project.end,
            provinces: project.provinces,
            standardSectors: project.standardSectors,
          },
          filters
        )
      )
      .map((p) => p.id)
  );

  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const filteredFindings = findingsData.findings.filter(
    (finding) => !finding.projectId || filteredProjects.has(finding.projectId)
  );
  filteredFindings.forEach((finding) => {
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    byStatus[finding.status] = (byStatus[finding.status] ?? 0) + 1;
  });

  const recentFindings = filteredFindings.slice(0, 5).map((finding) => ({
    id: finding.id,
    project: labelForProject(finding.projectId, projectLookup),
    severity: finding.severity,
    status: finding.status,
  }));

  return {
    totals: {
      findings: filteredFindings.length,
      distributions: pdmData.distributions.filter(
        (distribution) => !distribution.projectId || filteredProjects.has(distribution.projectId)
      ).length,
      pdmSurveys: pdmData.surveys.filter((survey) => !survey.projectId || filteredProjects.has(survey.projectId)).length,
      pdmReports: pdmData.reports.filter((report) => !report.projectId || filteredProjects.has(report.projectId)).length,
    },
    bySeverity,
    byStatus,
    recentFindings,
  };
}

export type KnowledgeOverview = {
  totals: {
    lessons: number;
    resources: number;
  };
  recentLessons: Array<{ id: string; title: string; source?: string; createdAt: string }>;
  recentResources: Array<{ id: string; title: string; category?: string; createdAt: string }>;
};

export async function fetchKnowledgeOverview(filters?: DashboardFilters): Promise<KnowledgeOverview> {
  const state = await fetchDashboardState();
  const knowledge = state.knowledgeHub as KnowledgeHubData;
  const filteredProjects = new Set(
    state.projects
      .filter((project) =>
        matchesProjectFilters(
          {
            id: project.id,
            name: project.name,
            sector: project.sector,
            start: project.start,
            end: project.end,
            provinces: project.provinces,
            standardSectors: project.standardSectors,
          },
          filters
        )
      )
      .map((p) => p.id)
  );

  const filteredLessons = knowledge.lessons.filter(
    (lesson) => !lesson.projectId || filteredProjects.has(lesson.projectId)
  );

  const filteredResources = knowledge.resources.filter(
    (resource) => !resource.projectId || filteredProjects.has(resource.projectId)
  );

  const recentLessons = filteredLessons.slice(0, 5).map((lesson) => ({
    id: lesson.id,
    title: lesson.lesson,
    source: lesson.source,
    createdAt: lesson.createdAt,
  }));

  const recentResources = filteredResources.slice(0, 5).map((resource) => ({
    id: resource.id,
    title: resource.title,
    category: resource.category,
    createdAt: resource.createdAt,
  }));

  return {
    totals: {
      lessons: filteredLessons.length,
      resources: filteredResources.length,
    },
    recentLessons,
    recentResources,
  };
}
