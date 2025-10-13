import { RowDataPacket } from "mysql2";
import mysql from "mysql2/promise";
import {
  ALL_SECTOR_FIELD_ACTIVITY,
  ALL_SECTOR_KEY,
  BENEFICIARY_TYPE_KEYS,
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  SectorDetails,
  SectorKey,
  DashboardUser,
  DashboardUserRole,
  ProjectSector,
} from "@/lib/dashboard-data";
import { withConnection } from "@/lib/db";
import type { ComplaintRecord } from "@/lib/dashboard-data";

type SectorRow = RowDataPacket & {
  id: number;
  sector_key: string;
  display_name: string;
  start_date: Date | null;
  end_date: Date | null;
  field_activity: string | null;
  projects: number;
  staff: number;
  created_at: Date;
  updated_at: Date;
};

type BeneficiaryRow = RowDataPacket & {
  sector_id: number;
  type_key: string;
  direct: number;
  indirect: number;
};

type ProvinceRow = RowDataPacket & {
  sector_id: number;
  province: string;
};

type ReportingYearRow = RowDataPacket & { year: number };

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization: string | null;
  password_hash?: string | null;
};

type BrandingRow = RowDataPacket & {
  company_name: string;
  logo_data: Buffer | null;
  logo_mime: string | null;
  favicon_data: Buffer | null;
  favicon_mime: string | null;
  updated_at: Date;
};

type ComplaintRow = RowDataPacket & {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  submitted_at: Date;
};

type ProjectRow = RowDataPacket & {
  id: number;
  name: string;
  sector_key: string;
  goal: string | null;
  objectives: string | null;
  major_achievements: string | null;
  country: string;
  start_date: Date | null;
  end_date: Date | null;
  staff: number;
};

type ProjectGeoRow = RowDataPacket & {
  project_id: number;
  level: "province" | "district" | "community";
  name: string;
};

type ProjectBeneficiaryRow = RowDataPacket & {
  project_id: number;
  type_key: string;
  direct: number;
  indirect: number;
};

type ProjectClusterRow = RowDataPacket & {
  project_id: number;
  cluster: string;
};

type ProjectSectorLabelRow = RowDataPacket & {
  project_id: number;
  sector_label: string;
};

type DashboardState = {
  sectors: Record<string, SectorDetails>;
  reportingYears: number[];
  users: DashboardUser[];
  projects: Array<{
    id: string;
    name: string;
    sector: ProjectSector;
    country: string;
    provinces: string[];
    districts: string[];
    communities: string[];
    goal: string;
    objectives: string;
    majorAchievements: string;
    beneficiaries: BeneficiaryBreakdown;
    clusters: string[];
    standardSectors: string[];
    staff: number;
    start: string;
    end: string;
  }>;
  branding: {
    companyName: string;
    logoDataUrl: string | null;
    faviconDataUrl: string | null;
  };
  complaints: ComplaintRecord[];
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "";
  }
  return value.toISOString().split("T")[0] ?? "";
}

function createEmptyBreakdown(): BeneficiaryBreakdown {
  const direct: Record<BeneficiaryTypeKey, number> = {} as Record<BeneficiaryTypeKey, number>;
  const indirect: Record<BeneficiaryTypeKey, number> = {} as Record<BeneficiaryTypeKey, number>;
  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    direct[key] = 0;
    indirect[key] = 0;
  });
  return { direct, indirect };
}

function bufferToDataUrl(data: Buffer | null, mime: string | null): string | null {
  if (!data || !data.length) {
    return null;
  }
  const mimeType = mime || "image/png";
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

export async function fetchDashboardState(): Promise<DashboardState> {
  return withConnection(async (connection) => {
    const [sectorRows] = await connection.query<SectorRow[]>("SELECT * FROM sectors ORDER BY display_name ASC");
    const sectorIds = sectorRows.map((row) => row.id);

    const [beneficiaryRows] = sectorIds.length
      ? await connection.query<BeneficiaryRow[]>(
          "SELECT sector_id, type_key, direct, indirect FROM beneficiary_stats WHERE sector_id IN (?)",
          [sectorIds]
        )
      : [[], []];

    const [provinceRows] = sectorIds.length
      ? await connection.query<ProvinceRow[]>(
          "SELECT sector_id, province FROM sector_provinces WHERE sector_id IN (?) ORDER BY province",
          [sectorIds]
        )
      : [[], []];

    const sectors: Record<string, SectorDetails> = {} as Record<string, SectorDetails>;

    sectorRows.forEach((row) => {
      const breakdown = createEmptyBreakdown();
      beneficiaryRows
        .filter((b) => b.sector_id === row.id)
        .forEach((b) => {
          const type = b.type_key as BeneficiaryTypeKey;
          if (!breakdown.direct[type]) {
            breakdown.direct[type] = 0;
          }
          if (!breakdown.indirect[type]) {
            breakdown.indirect[type] = 0;
          }
          breakdown.direct[type] = b.direct ?? 0;
          breakdown.indirect[type] = b.indirect ?? 0;
        });

      const provinces = provinceRows
        .filter((p) => p.sector_id === row.id)
        .map((p) => p.province);

      sectors[row.sector_key as SectorKey] = {
        provinces,
        beneficiaries: breakdown,
        projects: row.projects,
        start: formatDate(row.start_date),
        end: formatDate(row.end_date),
        fieldActivity: row.field_activity ?? "",
        staff: row.staff,
      };
    });

    // Aggregate All Sectors
    if (sectorRows.length) {
      const aggregate = createEmptyBreakdown();
      sectorRows.forEach((row) => {
        const details = sectors[row.sector_key as SectorKey];
        BENEFICIARY_TYPE_KEYS.forEach((key) => {
          aggregate.direct[key] += details.beneficiaries.direct[key];
          aggregate.indirect[key] += details.beneficiaries.indirect[key];
        });
      });

      sectors[ALL_SECTOR_KEY] = {
        provinces: Array.from(
          new Set(
            Object.values(sectors)
              .filter((_, index) => index < sectorRows.length)
              .flatMap((details) => details.provinces)
          )
        ).sort((a, b) => a.localeCompare(b)),
        beneficiaries: aggregate,
        projects: sectorRows.reduce((sum, row) => sum + row.projects, 0),
        start: "",
        end: "",
        fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
        staff: sectorRows.reduce((sum, row) => sum + row.staff, 0),
      };
    }

    const [yearRows] = await connection.query<ReportingYearRow[]>
      ("SELECT year FROM reporting_years ORDER BY year ASC");

    const reportingYears = yearRows.map((row) => row.year);

    const [userRows] = await connection.query<UserRow[]>(
      "SELECT id, name, email, role, organization FROM users ORDER BY name ASC"
    );

    const users: DashboardUser[] = userRows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      role: row.role,
      organization: row.organization ?? undefined,
    }));

    const [brandingRows] = await connection.query<BrandingRow[]>(
      "SELECT company_name, logo_data, logo_mime, favicon_data, favicon_mime, updated_at FROM branding_settings WHERE id = 1"
    );

    const brandingRow = brandingRows[0];

    const branding = {
      companyName: brandingRow?.company_name ?? "NSDO",
      logoDataUrl: bufferToDataUrl(brandingRow?.logo_data ?? null, brandingRow?.logo_mime ?? null),
      faviconDataUrl: bufferToDataUrl(brandingRow?.favicon_data ?? null, brandingRow?.favicon_mime ?? null),
    };

    const [complaintRows] = await connection.query<ComplaintRow[]>(
      "SELECT id, full_name, email, phone, message, submitted_at FROM complaints ORDER BY submitted_at DESC"
    );

    const complaints = complaintRows.map<ComplaintRecord>((row) => ({
      id: row.id.toString(),
      fullName: row.full_name,
      email: row.email,
      phone: row.phone ?? undefined,
      message: row.message,
      submittedAt: row.submitted_at.toISOString(),
    }));

    const [projectRows] = await connection.query<ProjectRow[]>(
      "SELECT id, name, sector_key, goal, objectives, major_achievements, country, start_date, end_date, staff FROM projects ORDER BY created_at DESC"
    );

    const projectIds = projectRows.map((row) => row.id);
    const [projectGeoRows] = projectIds.length
      ? await connection.query<ProjectGeoRow[]>(
          "SELECT project_id, level, name FROM project_geography WHERE project_id IN (?)",
          [projectIds]
        )
      : [[], []];

    const [projectBeneficiaryRows] = projectIds.length
      ? await connection.query<ProjectBeneficiaryRow[]>(
          "SELECT project_id, type_key, direct, indirect FROM project_beneficiaries WHERE project_id IN (?)",
          [projectIds]
        )
      : [[], []];

    const [projectClusterRows] = projectIds.length
      ? await connection.query<ProjectClusterRow[]>(
          "SELECT project_id, cluster FROM project_clusters WHERE project_id IN (?)",
          [projectIds]
        )
      : [[], []];

    const [projectSectorLabelRows] = projectIds.length
      ? await connection.query<ProjectSectorLabelRow[]>(
          "SELECT project_id, sector_label FROM project_standard_sectors WHERE project_id IN (?)",
          [projectIds]
        )
      : [[], []];

    const projects = projectRows.map((row) => {
      const provinces: string[] = [];
      const districts: string[] = [];
      const communities: string[] = [];

      projectGeoRows
        .filter((geo) => geo.project_id === row.id)
        .forEach((geo) => {
          if (geo.level === "province") {
            provinces.push(geo.name);
          } else if (geo.level === "district") {
            districts.push(geo.name);
          } else {
            communities.push(geo.name);
          }
        });

      const breakdown = createEmptyBreakdown();
      projectBeneficiaryRows
        .filter((b) => b.project_id === row.id)
        .forEach((b) => {
          const key = b.type_key as BeneficiaryTypeKey;
          breakdown.direct[key] = b.direct;
          breakdown.indirect[key] = b.indirect;
        });

      const clusters = projectClusterRows
        .filter((cluster) => cluster.project_id === row.id)
        .map((cluster) => cluster.cluster);

      const standardSectors = projectSectorLabelRows
        .filter((sector) => sector.project_id === row.id)
        .map((sector) => sector.sector_label);

      return {
        id: row.id.toString(),
        name: row.name,
        sector: row.sector_key as ProjectSector,
        country: row.country,
        provinces,
        districts,
        communities,
        goal: row.goal ?? "",
        objectives: row.objectives ?? "",
        majorAchievements: row.major_achievements ?? "",
        beneficiaries: breakdown,
        clusters,
        standardSectors,
        staff: row.staff,
        start: formatDate(row.start_date),
        end: formatDate(row.end_date),
      };
    });

    return {
      sectors,
      reportingYears,
      users,
      projects,
      branding,
      complaints,
    };
  });
}

export async function insertComplaint(payload: {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute(
      "INSERT INTO complaints (full_name, email, phone, message) VALUES (?, ?, ?, ?)",
      [payload.fullName.trim(), payload.email.trim(), payload.phone?.trim() ?? null, payload.message.trim()]
    );
  });
}

export async function deleteComplaint(id: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM complaints WHERE id = ?", [id]);
  });
}

export async function insertUser(payload: {
  name: string;
  email: string;
  role: DashboardUserRole;
  organization?: string;
  passwordHash?: string | null;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute(
      "INSERT INTO users (name, email, role, organization, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), organization = VALUES(organization), password_hash = VALUES(password_hash)",
      [
        payload.name.trim(),
        payload.email.trim().toLowerCase(),
        payload.role,
        payload.organization?.trim() ?? null,
        payload.passwordHash ?? null,
      ]
    );
  });
}

export async function removeUserById(id: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
  });
}

export async function insertReportingYear(year: number): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("INSERT IGNORE INTO reporting_years (year) VALUES (?)", [year]);
  });
}

export async function deleteReportingYear(year: number): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM reporting_years WHERE year = ?", [year]);
  });
}

export async function upsertSectorDetails(sectorKey: string, details: SectorDetails): Promise<void> {
  await withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      const [rows] = await connection.query<SectorRow[]>(
        "SELECT id FROM sectors WHERE sector_key = ?",
        [sectorKey]
      );

      let sectorId: number;

      if (rows.length) {
        sectorId = rows[0].id;
        await connection.execute(
          "UPDATE sectors SET projects = ?, start_date = NULLIF(?, ''), end_date = NULLIF(?, ''), field_activity = ?, staff = ? WHERE id = ?",
          [
            details.projects,
            details.start,
            details.end,
            details.fieldActivity,
            details.staff,
            sectorId,
          ]
        );
      } else {
        const [result] = await connection.execute(
          "INSERT INTO sectors (sector_key, display_name, projects, start_date, end_date, field_activity, staff) VALUES (?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?)",
          [sectorKey, sectorKey, details.projects, details.start, details.end, details.fieldActivity, details.staff]
        );
        sectorId = (result as mysql.ResultSetHeader).insertId;
      }

      await connection.execute("DELETE FROM sector_provinces WHERE sector_id = ?", [sectorId]);
      if (details.provinces.length) {
        const values = details.provinces.map((province) => [sectorId, province.trim()]);
        await connection.query("INSERT INTO sector_provinces (sector_id, province) VALUES ?", [values]);
      }

      await connection.execute("DELETE FROM beneficiary_stats WHERE sector_id = ?", [sectorId]);
      const beneficiaryValues = BENEFICIARY_TYPE_KEYS.map((key) => [
        sectorId,
        key,
        details.beneficiaries.direct[key],
        details.beneficiaries.indirect[key],
      ]);
      await connection.query(
        "INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect) VALUES ?",
        [beneficiaryValues]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function insertProject(payload: {
  name: string;
  sectorKey: string;
  country: string;
  goal: string;
  objectives: string;
  majorAchievements: string;
  start: string;
  end: string;
  staff: number;
  beneficiaries: BeneficiaryBreakdown;
  provinces: string[];
  districts: string[];
  communities: string[];
  clusters: string[];
  standardSectors: string[];
}): Promise<number> {
  return withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      const [result] = await connection.execute(
        "INSERT INTO projects (name, sector_key, goal, objectives, major_achievements, country, start_date, end_date, staff) VALUES (?, ?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?)",
        [
          payload.name,
          payload.sectorKey,
          payload.goal,
          payload.objectives,
          payload.majorAchievements,
          payload.country,
          payload.start,
          payload.end,
          payload.staff,
        ]
      );

      const projectId = (result as mysql.ResultSetHeader).insertId;

      const geoValues: Array<[number, "province" | "district" | "community", string]> = [];
      payload.provinces.forEach((province) => {
        geoValues.push([projectId, "province", province]);
      });
      payload.districts.forEach((district) => {
        geoValues.push([projectId, "district", district]);
      });
      payload.communities.forEach((community) => {
        geoValues.push([projectId, "community", community]);
      });

      if (geoValues.length) {
        await connection.query(
          "INSERT INTO project_geography (project_id, level, name) VALUES ?",
          [geoValues]
        );
      }

      const beneficiaryValues = BENEFICIARY_TYPE_KEYS.map((key) => [
        projectId,
        key,
        payload.beneficiaries.direct[key],
        payload.beneficiaries.indirect[key],
      ]);
      await connection.query(
        "INSERT INTO project_beneficiaries (project_id, type_key, direct, indirect) VALUES ?",
        [beneficiaryValues]
      );

      if (payload.clusters.length) {
        await connection.query(
          "INSERT INTO project_clusters (project_id, cluster) VALUES ?",
          [payload.clusters.map((cluster) => [projectId, cluster])]
        );
      }

      if (payload.standardSectors.length) {
        await connection.query(
          "INSERT INTO project_standard_sectors (project_id, sector_label) VALUES ?",
          [payload.standardSectors.map((sector) => [projectId, sector])]
        );
      }

      await connection.commit();
      return projectId;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function updateProject(projectId: string, payload: {
  name: string;
  sectorKey: string;
  country: string;
  goal: string;
  objectives: string;
  majorAchievements: string;
  start: string;
  end: string;
  staff: number;
  beneficiaries: BeneficiaryBreakdown;
  provinces: string[];
  districts: string[];
  communities: string[];
  clusters: string[];
  standardSectors: string[];
}): Promise<void> {
  const id = Number(projectId);
  await withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      await connection.execute(
        "UPDATE projects SET name = ?, sector_key = ?, goal = ?, objectives = ?, major_achievements = ?, country = ?, start_date = NULLIF(?, ''), end_date = NULLIF(?, ''), staff = ? WHERE id = ?",
        [
          payload.name,
          payload.sectorKey,
          payload.goal,
          payload.objectives,
          payload.majorAchievements,
          payload.country,
          payload.start,
          payload.end,
          payload.staff,
          id,
        ]
      );

      await connection.execute("DELETE FROM project_geography WHERE project_id = ?", [id]);
      const geoValues: Array<[number, "province" | "district" | "community", string]> = [];
      payload.provinces.forEach((province) => geoValues.push([id, "province", province]));
      payload.districts.forEach((district) => geoValues.push([id, "district", district]));
      payload.communities.forEach((community) => geoValues.push([id, "community", community]));
      if (geoValues.length) {
        await connection.query(
          "INSERT INTO project_geography (project_id, level, name) VALUES ?",
          [geoValues]
        );
      }

      await connection.execute("DELETE FROM project_beneficiaries WHERE project_id = ?", [id]);
      const beneficiaryValues = BENEFICIARY_TYPE_KEYS.map((key) => [
        id,
        key,
        payload.beneficiaries.direct[key],
        payload.beneficiaries.indirect[key],
      ]);
      await connection.query(
        "INSERT INTO project_beneficiaries (project_id, type_key, direct, indirect) VALUES ?",
        [beneficiaryValues]
      );

      await connection.execute("DELETE FROM project_clusters WHERE project_id = ?", [id]);
      if (payload.clusters.length) {
        await connection.query(
          "INSERT INTO project_clusters (project_id, cluster) VALUES ?",
          [payload.clusters.map((cluster) => [id, cluster])]
        );
      }

      await connection.execute("DELETE FROM project_standard_sectors WHERE project_id = ?", [id]);
      if (payload.standardSectors.length) {
        await connection.query(
          "INSERT INTO project_standard_sectors (project_id, sector_label) VALUES ?",
          [payload.standardSectors.map((sector) => [id, sector])]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM projects WHERE id = ?", [projectId]);
  });
}

export async function updateBranding(payload: {
  companyName?: string;
  logoDataUrl?: string | null;
  faviconDataUrl?: string | null;
}): Promise<void> {
  const { companyName, logoDataUrl, faviconDataUrl } = payload;
  const parseDataUrl = (value: string | null | undefined) => {
    if (!value) return { data: null, mime: null };
    const match = value.match(/^data:(.+);base64,(.*)$/);
    if (!match) return { data: null, mime: null };
    return { data: Buffer.from(match[2], "base64"), mime: match[1] };
  };

  const logo = parseDataUrl(logoDataUrl);
  const favicon = parseDataUrl(faviconDataUrl);

  await withConnection(async (connection) => {
    await connection.execute(
      `INSERT INTO branding_settings (id, company_name, logo_data, logo_mime, favicon_data, favicon_mime)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_name = VALUES(company_name),
         logo_data = COALESCE(VALUES(logo_data), logo_data),
         logo_mime = COALESCE(VALUES(logo_mime), logo_mime),
         favicon_data = COALESCE(VALUES(favicon_data), favicon_data),
         favicon_mime = COALESCE(VALUES(favicon_mime), favicon_mime)`,
      [companyName ?? "NSDO", logo.data, logo.mime, favicon.data, favicon.mime]
    );
  });
}
