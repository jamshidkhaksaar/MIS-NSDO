import { withConnection } from "@/lib/db";
import {
  ALL_SECTOR_KEY,
  ALL_SECTOR_FIELD_ACTIVITY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  SectorDetails,
  SectorKey,
} from "@/lib/dashboard-data";

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
};

export type DashboardFilters = {
    year?: number;
    province?: string;
};

export type AvailableFilters = {
    years: number[];
    provinces: string[];
};

export async function fetchAvailableFilters(): Promise<AvailableFilters> {
    return withConnection(async (connection) => {
        const [yearRows] = await connection.query<{ year: number }>(
            "SELECT year FROM reporting_years ORDER BY year DESC"
        );

        // We can fetch provinces from sector_provinces or project_provinces
        // Let's use project_provinces to be consistent with actual data
        const [provinceRows] = await connection.query<{ province: string }>(
            "SELECT DISTINCT province FROM project_provinces ORDER BY province ASC"
        );

        return {
            years: yearRows.map(r => r.year),
            provinces: provinceRows.map(r => r.province)
        };
    });
}

export async function fetchOverviewStats(filters?: DashboardFilters): Promise<DashboardOverviewStats> {
  return withConnection(async (connection) => {
    // 1. Fetch basic Sector config (for metadata like keys, although we might dynamically build it too)
    const [sectorConfigRows] = await connection.query<SectorRow>(
      "SELECT * FROM sectors ORDER BY display_name ASC"
    );
    const sectorKeyMap = new Map<string, string>();
    sectorConfigRows.forEach(r => sectorKeyMap.set(r.sector_key.toLowerCase(), r.sector_key));

    // 2. Fetch All Projects
    const [projects] = await connection.query<ProjectRow>(
        `SELECT id, sector, start_date, end_date, staff FROM projects`
    );
    const projectIds = projects.map(p => p.id);

    // 3. Fetch Project Attributes (Provinces, Beneficiaries, Standard Sectors)
    let projectProvinces: ProjectProvinceRow[] = [];
    let projectBeneficiaries: ProjectBeneficiaryRow[] = [];
    let projectStandardSectors: ProjectStandardSectorRow[] = [];

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
            start: "", // Will calc min
            end: "",   // Will calc max
            fieldActivity: "",
            staff: 0
        };
    });

    // Add Aggregates
    const allSectorsData = {
        provinces: new Set<string>(),
        beneficiaries: createEmptyBreakdown(),
        projects: 0,
        staff: 0
    };

    const projectSectorMap = new Map<number, string[]>();

    filteredProjects.forEach(project => {
        // Determine sectors for this project
        const pSectors = new Set<string>();
        if (project.sector) {
            const normalized = project.sector.toLowerCase();
            const key = sectorKeyMap.get(normalized);
            if (key) pSectors.add(key);
        }
        // Also check standard sectors
        filteredStandardSectors.filter(ss => ss.project_id === project.id).forEach(ss => {
             const normalized = ss.standard_sector.toLowerCase();
             const key = sectorKeyMap.get(normalized);
             if (key) pSectors.add(key);
        });

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
    sectorsData[ALL_SECTOR_KEY] = {
        provinces: Array.from(allSectorsData.provinces).sort((a, b) => a.localeCompare(b)),
        beneficiaries: allSectorsData.beneficiaries,
        projects: allSectorsData.projects,
        start: "",
        end: "",
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
      }
    };
  });
}
