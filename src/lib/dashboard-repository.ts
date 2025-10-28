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
  type DashboardProject,
  type ProjectSector,
  PROJECT_DOCUMENT_CATEGORIES,
  PROJECT_PHASES,
  type ProjectDocumentRecord,
  type ProjectPhaseRecord,
  type ProjectDocumentCategory,
  type ProjectPhaseKey,
  type ProjectPhaseStatus,
  type BaselineSurveyRecord,
  type BaselineSurveyStatus,
  type BaselineSurveyTool,
  type EnumeratorRecord,
  type DataCollectionTaskRecord,
  type DataCollectionTaskStatus,
  type BaselineReportRecord,
  type FieldVisitReportRecord,
  type MonthlyNarrativeRecord,
  type MonthlyNarrativeStatus,
  type MonitoringDashboardData,
  type EvaluationDashboardData,
  type FindingsDashboardData,
  type FindingsByDepartment,
  type FindingsSummary,
  type PdmDashboardData,
  type KnowledgeHubData,
  type ComplaintRecord,
  type ComplaintSummaryMetrics,
  type ComplaintResponseRecord,
  type CrmAwarenessRecord,
  type EvaluationRecord,
  type EvaluationType,
  type StoryRecord,
  type StoryType,
  type FindingRecord,
  type FindingType,
  type FindingSeverity,
  type FindingStatus,
  type DistributionRecord,
  type PdmSurveyRecord,
  type PdmReportRecord,
  type LessonRecord,
  type KnowledgeResourceRecord,
  type UserAccessAssignmentRecord,
  type IntegrationRecord,
  type ComplaintStatus,
} from "@/lib/dashboard-data";
import { withConnection } from "@/lib/db";

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

type BeneficiaryRow = {
  sector_id: number;
  type_key: string;
  direct: number;
  indirect: number;
};

type ProvinceRow = {
  sector_id: number;
  province: string;
};

type ReportingYearRow = { year: number };

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization: string | null;
  password_hash?: string | null;
};

type BrandingRow = {
  company_name: string;
  logo_data: Buffer | null;
  logo_mime: string | null;
  favicon_data: Buffer | null;
  favicon_mime: string | null;
};

type ComplaintRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  submitted_at: string;
};

type ComplaintMetadataRow = {
  complaint_id: number;
  status: string;
  assigned_officer: string | null;
  province: string | null;
  district: string | null;
  project_id: number | null;
  is_anonymous: number;
  auto_assigned_at: string | null;
  created_at: string;
  updated_at: string;
};

type ComplaintResponseRow = {
  id: number;
  complaint_id: number;
  responder: string | null;
  response: string;
  created_at: string;
};

type ProjectRow = {
  id: number;
  code: string;
  title: string;
  donor: string | null;
  sector: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  focal_point: string | null;
  goal: string | null;
  objectives: string | null;
  major_achievements: string | null;
  staff: number | null;
  created_at: string;
  updated_at: string;
};

type ProjectProvinceRow = { project_id: number; province: string };
type ProjectDistrictRow = { project_id: number; district: string };
type ProjectCommunityRow = { project_id: number; community: string };
type ProjectClusterRow = { project_id: number; cluster: string };
type ProjectStandardSectorRow = { project_id: number; standard_sector: string };

type ProjectBeneficiaryRow = {
  project_id: number;
  type_key: string;
  direct: number;
  indirect: number;
};

type ProjectDocumentRow = {
  id: number;
  project_id: number;
  category: string;
  title: string;
  file_url: string | null;
  uploaded_at: string;
};

type ProjectPhaseRow = {
  id: number;
  project_id: number;
  phase: string;
  status: string;
  notes: string | null;
  updated_at: string;
};

type BaselineSurveyRow = {
  id: number;
  project_id: number;
  title: string;
  tool: string | null;
  status: string;
  questionnaire_url: string | null;
  created_at: string;
  updated_at: string;
};

type EnumeratorRow = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  province: string | null;
};

type BaselineAssignmentRow = {
  baseline_survey_id: number;
  enumerator_id: number;
};

type DataCollectionTaskRow = {
  id: number;
  baseline_survey_id: number | null;
  status: string;
  completed_at: string | null;
  notes: string | null;
};

type BaselineReportRow = {
  id: number;
  baseline_survey_id: number;
  report_url: string | null;
  shared_with_program: number;
  shared_at: string | null;
  created_at: string;
};

type FieldVisitReportRow = {
  id: number;
  project_id: number;
  visit_date: string;
  location: string | null;
  positive_findings: string | null;
  negative_findings: string | null;
  photo_url: string | null;
  gps_coordinates: string | null;
  officer: string | null;
  created_at: string;
};

type MonthlyReportRow = {
  id: number;
  project_id: number;
  report_month: string;
  summary: string | null;
  gaps: string | null;
  recommendations: string | null;
  status: string;
  reviewer: string | null;
  feedback: string | null;
  submitted_at: string | null;
  updated_at: string;
};

type EvaluationRow = {
  id: number;
  project_id: number | null;
  evaluator_name: string | null;
  evaluation_type: string;
  report_url: string | null;
  findings_summary: string | null;
  completed_at: string | null;
  created_at: string;
};

type StoryRow = {
  id: number;
  project_id: number | null;
  story_type: string;
  title: string;
  quote: string | null;
  summary: string | null;
  photo_url: string | null;
  spotlight_order: number | null;
  created_at: string;
};

type CrmAwarenessRow = {
  id: number;
  project_id: number | null;
  district: string | null;
  awareness_date: string | null;
  notes: string | null;
  created_at: string;
};

type FindingRow = {
  id: number;
  project_id: number | null;
  finding_type: string;
  category: string | null;
  severity: string;
  department: string | null;
  status: string;
  description: string | null;
  evidence_url: string | null;
  reminder_due_at: string | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
};

type DistributionRow = {
  id: number;
  project_id: number | null;
  assistance_type: string;
  distribution_date: string | null;
  location: string | null;
  target_beneficiaries: number | null;
  notes: string | null;
  created_at: string;
};

type PdmSurveyRow = {
  id: number;
  project_id: number | null;
  tool: string | null;
  quality_score: number | null;
  quantity_score: number | null;
  satisfaction_score: number | null;
  protection_score: number | null;
  completed_at: string | null;
  created_at: string;
};

type PdmReportRow = {
  id: number;
  project_id: number | null;
  report_date: string | null;
  summary: string | null;
  recommendations: string | null;
  feedback_to_program: string | null;
  created_at: string;
};

type LessonRow = {
  id: number;
  project_id: number | null;
  source: string | null;
  lesson: string;
  department: string | null;
  theme: string | null;
  captured_at: string | null;
  created_at: string;
};

type KnowledgeResourceRow = {
  id: number;
  title: string;
  category: string | null;
  theme: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string;
};

type UserAccessAssignmentRow = {
  id: number;
  user_id: number;
  project_id: number | null;
  province: string | null;
  role: string | null;
};

type IntegrationRow = {
  id: number;
  name: string;
  config: string | null;
  created_at: string;
  updated_at: string;
};

type ClusterCatalogRow = {
  id: number;
  name: string;
  description: string | null;
};

type SectorCatalogRow = {
  id: number;
  name: string;
  description: string | null;
};

type UserWithPasswordRow = {
  id: number;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization: string | null;
  password_hash: string | null;
};

type SessionWithUserRow = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization: string | null;
};

type DashboardState = {
  sectors: Record<string, SectorDetails>;
  reportingYears: number[];
  users: DashboardUser[];
  projects: DashboardProject[];
  projectDocuments: ProjectDocumentRecord[];
  projectPhases: ProjectPhaseRecord[];
  branding: {
    companyName: string;
    logoDataUrl: string | null;
    faviconDataUrl: string | null;
  };
  complaints: ComplaintRecord[];
  complaintMetrics: ComplaintSummaryMetrics;
  crmAwareness: CrmAwarenessRecord[];
  monitoring: MonitoringDashboardData;
  evaluation: EvaluationDashboardData;
  findings: FindingsDashboardData;
  pdm: PdmDashboardData;
  knowledgeHub: KnowledgeHubData;
  userAccessAssignments: UserAccessAssignmentRecord[];
  integrations: IntegrationRecord[];
  clusterCatalog: Array<{ id: string; name: string; description?: string }>;
  sectorCatalog: Array<{ id: string; name: string; description?: string }>;
};

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

function createEmptyBreakdown(): BeneficiaryBreakdown {
  const direct: Record<BeneficiaryTypeKey, number> = {} as Record<BeneficiaryTypeKey, number>;
  const indirect: Record<BeneficiaryTypeKey, number> = {} as Record<BeneficiaryTypeKey, number>;
  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    direct[key] = 0;
    indirect[key] = 0;
  });
  return { direct, indirect };
}

function cloneBreakdownData(source: BeneficiaryBreakdown | undefined): BeneficiaryBreakdown {
  const clone = createEmptyBreakdown();
  if (!source) {
    return clone;
  }
  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    clone.direct[key] = source.direct?.[key] ?? 0;
    clone.indirect[key] = source.indirect?.[key] ?? 0;
  });
  return clone;
}

const PROJECT_PHASE_STATUS_VALUES: ProjectPhaseStatus[] = ["not_started", "in_progress", "completed"];
const BASELINE_SURVEY_STATUS_VALUES: BaselineSurveyStatus[] = ["draft", "in_progress", "completed", "archived"];
const BASELINE_SURVEY_TOOL_VALUES: BaselineSurveyTool[] = ["kobo", "manual", "other"];
const DATA_COLLECTION_STATUS_VALUES: DataCollectionTaskStatus[] = ["pending", "in_progress", "completed"];
const MONTHLY_STATUS_VALUES: MonthlyNarrativeStatus[] = ["draft", "submitted", "approved", "feedback"];
const EVALUATION_TYPE_VALUES: EvaluationType[] = ["baseline", "midterm", "endline", "special"];
const STORY_TYPE_VALUES: StoryType[] = ["case", "success", "impact"];
const COMPLAINT_STATUS_VALUES: ComplaintStatus[] = ["open", "in_review", "resolved"];
const FINDING_TYPE_VALUES: FindingType[] = ["negative", "positive"];
const FINDING_SEVERITY_VALUES: FindingSeverity[] = ["minor", "major", "critical"];
const FINDING_STATUS_VALUES: FindingStatus[] = ["pending", "in_progress", "solved"];

const DOCUMENT_CATEGORY_LOOKUP = new Map<string, ProjectDocumentCategory>(
  PROJECT_DOCUMENT_CATEGORIES.map((category) => [category.toLowerCase(), category])
);
const PROJECT_DOCUMENT_CATEGORY_SET = new Set<ProjectDocumentCategory>(PROJECT_DOCUMENT_CATEGORIES);
const PROJECT_PHASE_KEY_SET = new Set<ProjectPhaseKey>(PROJECT_PHASES);
const PROJECT_PHASE_STATUS_SET = new Set<ProjectPhaseStatus>(PROJECT_PHASE_STATUS_VALUES);
const BASELINE_SURVEY_STATUS_SET = new Set<BaselineSurveyStatus>(BASELINE_SURVEY_STATUS_VALUES);
const BASELINE_SURVEY_TOOL_SET = new Set<BaselineSurveyTool>(BASELINE_SURVEY_TOOL_VALUES);
const DATA_COLLECTION_STATUS_SET = new Set<DataCollectionTaskStatus>(DATA_COLLECTION_STATUS_VALUES);
const MONTHLY_STATUS_SET = new Set<MonthlyNarrativeStatus>(MONTHLY_STATUS_VALUES);
const EVALUATION_TYPE_SET = new Set<EvaluationType>(EVALUATION_TYPE_VALUES);
const STORY_TYPE_SET = new Set<StoryType>(STORY_TYPE_VALUES);
const COMPLAINT_STATUS_SET = new Set<ComplaintStatus>(COMPLAINT_STATUS_VALUES);
const FINDING_TYPE_SET = new Set<FindingType>(FINDING_TYPE_VALUES);
const FINDING_SEVERITY_SET = new Set<FindingSeverity>(FINDING_SEVERITY_VALUES);
const FINDING_STATUS_SET = new Set<FindingStatus>(FINDING_STATUS_VALUES);

function mapDocumentCategory(value: string): ProjectDocumentCategory {
  const normalized = value?.trim();
  if (!normalized) {
    return "other";
  }
  const match = DOCUMENT_CATEGORY_LOOKUP.get(normalized.toLowerCase());
  if (match) {
    return match;
  }
  return PROJECT_DOCUMENT_CATEGORY_SET.has(normalized as ProjectDocumentCategory)
    ? (normalized as ProjectDocumentCategory)
    : "other";
}

function mapPhaseKey(value: string): ProjectPhaseKey {
  const normalized = value?.trim().toLowerCase();
  if (PROJECT_PHASE_KEY_SET.has(normalized as ProjectPhaseKey)) {
    return normalized as ProjectPhaseKey;
  }
  return "baseline";
}

function mapPhaseStatus(value: string): ProjectPhaseStatus {
  const normalized = value?.trim().toLowerCase();
  if (PROJECT_PHASE_STATUS_SET.has(normalized as ProjectPhaseStatus)) {
    return normalized as ProjectPhaseStatus;
  }
  return "not_started";
}

function mapBaselineTool(value: string | null): BaselineSurveyTool {
  const normalized = value?.trim().toLowerCase();
  if (normalized && BASELINE_SURVEY_TOOL_SET.has(normalized as BaselineSurveyTool)) {
    return normalized as BaselineSurveyTool;
  }
  return "manual";
}

function mapBaselineStatus(value: string): BaselineSurveyStatus {
  const normalized = value?.trim().toLowerCase();
  if (BASELINE_SURVEY_STATUS_SET.has(normalized as BaselineSurveyStatus)) {
    return normalized as BaselineSurveyStatus;
  }
  return "draft";
}

function mapDataCollectionStatus(value: string): DataCollectionTaskStatus {
  const normalized = value?.trim().toLowerCase();
  if (DATA_COLLECTION_STATUS_SET.has(normalized as DataCollectionTaskStatus)) {
    return normalized as DataCollectionTaskStatus;
  }
  return "pending";
}

function mapMonthlyStatus(value: string): MonthlyNarrativeStatus {
  const normalized = value?.trim().toLowerCase();
  if (MONTHLY_STATUS_SET.has(normalized as MonthlyNarrativeStatus)) {
    return normalized as MonthlyNarrativeStatus;
  }
  return "draft";
}

function mapEvaluationType(value: string): EvaluationType {
  const normalized = value?.trim().toLowerCase();
  if (EVALUATION_TYPE_SET.has(normalized as EvaluationType)) {
    return normalized as EvaluationType;
  }
  return "special";
}

function mapStoryType(value: string): StoryType {
  const normalized = value?.trim().toLowerCase();
  if (STORY_TYPE_SET.has(normalized as StoryType)) {
    return normalized as StoryType;
  }
  return "impact";
}

function mapComplaintStatus(value: string): ComplaintStatus {
  const normalized = value?.trim().toLowerCase();
  if (COMPLAINT_STATUS_SET.has(normalized as ComplaintStatus)) {
    return normalized as ComplaintStatus;
  }
  return "open";
}

function mapFindingType(value: string): FindingType {
  const normalized = value?.trim().toLowerCase();
  if (FINDING_TYPE_SET.has(normalized as FindingType)) {
    return normalized as FindingType;
  }
  return "negative";
}

function mapFindingSeverity(value: string): FindingSeverity {
  const normalized = value?.trim().toLowerCase();
  if (FINDING_SEVERITY_SET.has(normalized as FindingSeverity)) {
    return normalized as FindingSeverity;
  }
  return "minor";
}

function mapFindingStatus(value: string): FindingStatus {
  const normalized = value?.trim().toLowerCase();
  if (FINDING_STATUS_SET.has(normalized as FindingStatus)) {
    return normalized as FindingStatus;
  }
  return "pending";
}

function createPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

function safeIsoString(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
}

function optionalIsoString(value: string | null): string | undefined {
  const iso = safeIsoString(value);
  return iso ? iso : undefined;
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
    const [sectorRows] = await connection.query<SectorRow>("SELECT * FROM sectors ORDER BY display_name ASC");
    const sectorIds = sectorRows.map((row) => row.id);

    let beneficiaryRows: BeneficiaryRow[] = [];
    if (sectorIds.length) {
      const placeholders = sectorIds.map(() => "?").join(", ");
      const [rows] = await connection.query<BeneficiaryRow>(
        `SELECT sector_id, type_key, direct, indirect FROM beneficiary_stats WHERE sector_id IN (${placeholders})`,
        sectorIds
      );
      beneficiaryRows = rows;
    }

    let provinceRows: ProvinceRow[] = [];
    if (sectorIds.length) {
      const placeholders = sectorIds.map(() => "?").join(", ");
      const [rows] = await connection.query<ProvinceRow>(
        `SELECT sector_id, province FROM sector_provinces WHERE sector_id IN (${placeholders}) ORDER BY province`,
        sectorIds
      );
      provinceRows = rows;
    }

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

    const [yearRows] = await connection.query<ReportingYearRow>
      ("SELECT year FROM reporting_years ORDER BY year ASC");

    const reportingYears = yearRows.map((row) => row.year);

    const [userRows] = await connection.query<UserRow>(
      "SELECT id, name, email, role, organization FROM users ORDER BY name ASC"
    );

    const users: DashboardUser[] = userRows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      role: row.role,
      organization: row.organization ?? undefined,
    }));

    const [brandingRows] = await connection.query<BrandingRow>(
      "SELECT company_name, logo_data, logo_mime, favicon_data, favicon_mime FROM branding_settings WHERE id = 1"
    );

    const brandingRow = brandingRows[0];

    const branding = {
      companyName: brandingRow?.company_name ?? "NSDO",
      logoDataUrl: bufferToDataUrl(brandingRow?.logo_data ?? null, brandingRow?.logo_mime ?? null),
      faviconDataUrl: bufferToDataUrl(brandingRow?.favicon_data ?? null, brandingRow?.favicon_mime ?? null),
    };

    const [tableInfoRows] = await connection.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    );
    const existingTables = new Set(tableInfoRows.map((row) => row.name.toLowerCase()));

    const hasProjectsTable = existingTables.has("projects");
    const hasProjectProvinces = existingTables.has("project_provinces");
    const hasProjectDistricts = existingTables.has("project_districts");
    const hasProjectCommunities = existingTables.has("project_communities");
    const hasProjectClusters = existingTables.has("project_clusters");
    const hasProjectStandardSectors = existingTables.has("project_standard_sectors");
    const hasProjectBeneficiaries = existingTables.has("project_beneficiaries");
    const hasProjectDocuments = existingTables.has("project_documents");
    const hasProjectPhases = existingTables.has("project_phases");
    const hasEnumerators = existingTables.has("enumerators");
    const hasBaselineSurveys = existingTables.has("baseline_surveys");
    const hasBaselineAssignments = existingTables.has("baseline_enumerator_assignments");
    const hasDataCollectionTasks = existingTables.has("data_collection_tasks");
    const hasBaselineReports = existingTables.has("baseline_reports");
    const hasFieldVisits = existingTables.has("field_visit_reports");
    const hasMonthlyReports = existingTables.has("monthly_reports");
    const hasEvaluations = existingTables.has("evaluations");
    const hasStories = existingTables.has("stories");
    const hasComplaintMetadata = existingTables.has("complaint_metadata");
    const hasComplaintResponses = existingTables.has("complaint_responses");
    const hasCrmAwareness = existingTables.has("crm_awareness_records");
    const hasFindings = existingTables.has("findings");
    const hasDistributionRecords = existingTables.has("distribution_records");
    const hasPdmSurveys = existingTables.has("pdm_surveys");
    const hasPdmReports = existingTables.has("pdm_reports");
    const hasLessons = existingTables.has("lessons");
    const hasKnowledgeResources = existingTables.has("knowledge_resources");
    const hasUserAccessAssignments = existingTables.has("user_access_assignments");
    const hasIntegrations = existingTables.has("integrations");

    let projectRows: ProjectRow[] = [];
    if (hasProjectsTable) {
      const [rows] = await connection.query<ProjectRow>(
        `SELECT
           id,
           code,
           title,
           donor,
           sector,
           country,
           start_date,
           end_date,
           budget,
           focal_point,
           goal,
           objectives,
           major_achievements,
           staff,
           created_at,
           updated_at
         FROM projects
         ORDER BY title ASC`
      );
      projectRows = rows;
    }

    const projectIds = projectRows.map((row) => row.id);
    let projectProvinceRows: ProjectProvinceRow[] = [];
    let projectDistrictRows: ProjectDistrictRow[] = [];
    let projectCommunityRows: ProjectCommunityRow[] = [];
    let projectClusterRows: ProjectClusterRow[] = [];
    let projectStandardSectorRows: ProjectStandardSectorRow[] = [];
    let projectBeneficiaryRows: ProjectBeneficiaryRow[] = [];
    let projectDocumentRows: ProjectDocumentRow[] = [];
    let projectPhaseRows: ProjectPhaseRow[] = [];

    if (projectIds.length) {
      const placeholders = createPlaceholders(projectIds.length);

      if (hasProjectProvinces) {
        [projectProvinceRows] = await connection.query<ProjectProvinceRow>(
          `SELECT project_id, province
           FROM project_provinces
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, province`,
          projectIds
        );
      }

      if (hasProjectDistricts) {
        [projectDistrictRows] = await connection.query<ProjectDistrictRow>(
          `SELECT project_id, district
           FROM project_districts
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, district`,
          projectIds
        );
      }

      if (hasProjectCommunities) {
        [projectCommunityRows] = await connection.query<ProjectCommunityRow>(
          `SELECT project_id, community
           FROM project_communities
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, community`,
          projectIds
        );
      }

      if (hasProjectClusters) {
        [projectClusterRows] = await connection.query<ProjectClusterRow>(
          `SELECT project_id, cluster
           FROM project_clusters
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, cluster`,
          projectIds
        );
      }

      if (hasProjectStandardSectors) {
        [projectStandardSectorRows] = await connection.query<ProjectStandardSectorRow>(
          `SELECT project_id, standard_sector
           FROM project_standard_sectors
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, standard_sector`,
          projectIds
        );
      }

      if (hasProjectBeneficiaries) {
        [projectBeneficiaryRows] = await connection.query<ProjectBeneficiaryRow>(
          `SELECT project_id, type_key, direct, indirect
           FROM project_beneficiaries
           WHERE project_id IN (${placeholders})`,
          projectIds
        );
      }

      if (hasProjectDocuments) {
        [projectDocumentRows] = await connection.query<ProjectDocumentRow>(
          `SELECT id, project_id, category, title, file_url, uploaded_at
           FROM project_documents
           WHERE project_id IN (${placeholders})
           ORDER BY uploaded_at DESC, id DESC`,
          projectIds
        );
      }

      if (hasProjectPhases) {
        [projectPhaseRows] = await connection.query<ProjectPhaseRow>(
          `SELECT id, project_id, phase, status, notes, updated_at
           FROM project_phases
           WHERE project_id IN (${placeholders})
           ORDER BY project_id, phase`,
          projectIds
        );
      }
    }

    const provinceMap = new Map<number, string[]>();
    projectProvinceRows.forEach((row) => {
      const list = provinceMap.get(row.project_id) ?? [];
      list.push(row.province);
      provinceMap.set(row.project_id, list);
    });
    provinceMap.forEach((list, key) => {
      provinceMap.set(
        key,
        Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
      );
    });

    const districtMap = new Map<number, string[]>();
    projectDistrictRows.forEach((row) => {
      const list = districtMap.get(row.project_id) ?? [];
      list.push(row.district);
      districtMap.set(row.project_id, list);
    });
    districtMap.forEach((list, key) => {
      districtMap.set(
        key,
        Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
      );
    });

    const communityMap = new Map<number, string[]>();
    projectCommunityRows.forEach((row) => {
      const list = communityMap.get(row.project_id) ?? [];
      list.push(row.community);
      communityMap.set(row.project_id, list);
    });
    communityMap.forEach((list, key) => {
      communityMap.set(
        key,
        Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
      );
    });

    const clusterMap = new Map<number, string[]>();
    projectClusterRows.forEach((row) => {
      const list = clusterMap.get(row.project_id) ?? [];
      list.push(row.cluster);
      clusterMap.set(row.project_id, list);
    });
    clusterMap.forEach((list, key) => {
      clusterMap.set(
        key,
        Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
      );
    });

    const standardSectorMap = new Map<number, string[]>();
    projectStandardSectorRows.forEach((row) => {
      const list = standardSectorMap.get(row.project_id) ?? [];
      list.push(row.standard_sector);
      standardSectorMap.set(row.project_id, list);
    });
    standardSectorMap.forEach((list, key) => {
      standardSectorMap.set(
        key,
        Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
      );
    });

    const projectBeneficiaryMap = new Map<number, BeneficiaryBreakdown>();
    projectIds.forEach((id) => {
      projectBeneficiaryMap.set(id, createEmptyBreakdown());
    });
    projectBeneficiaryRows.forEach((row) => {
      if (!(BENEFICIARY_TYPE_KEYS as readonly string[]).includes(row.type_key)) {
        return;
      }
      const breakdown = projectBeneficiaryMap.get(row.project_id) ?? createEmptyBreakdown();
      const type = row.type_key as BeneficiaryTypeKey;
      breakdown.direct[type] = row.direct ?? 0;
      breakdown.indirect[type] = row.indirect ?? 0;
      projectBeneficiaryMap.set(row.project_id, breakdown);
    });

    const projectDocuments: ProjectDocumentRecord[] = projectDocumentRows.map((row) => {
      const uploadedAt = safeIsoString(row.uploaded_at);
      return {
        id: row.id.toString(),
        projectId: row.project_id.toString(),
        category: mapDocumentCategory(row.category),
        title: row.title,
        fileUrl: row.file_url ?? undefined,
        uploadedAt,
      };
    });
    projectDocuments.sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));

    const projectDocumentMap = new Map<number, ProjectDocumentRecord[]>();
    projectDocuments.forEach((doc) => {
      const projectId = Number.parseInt(doc.projectId, 10);
      if (Number.isNaN(projectId)) {
        return;
      }
      const list = projectDocumentMap.get(projectId) ?? [];
      list.push(doc);
      projectDocumentMap.set(projectId, list);
    });

    const projectPhases: ProjectPhaseRecord[] = projectPhaseRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      phase: mapPhaseKey(row.phase),
      status: mapPhaseStatus(row.status),
      notes: row.notes ?? undefined,
      updatedAt: safeIsoString(row.updated_at),
    }));

    const projectPhaseMap = new Map<number, ProjectPhaseRecord[]>();
    projectPhases.forEach((phase) => {
      const projectId = Number.parseInt(phase.projectId, 10);
      if (Number.isNaN(projectId)) {
        return;
      }
      const list = projectPhaseMap.get(projectId) ?? [];
      list.push(phase);
      projectPhaseMap.set(projectId, list);
    });
    projectPhaseMap.forEach((list, key) => {
      projectPhaseMap.set(
        key,
        [...list].sort(
          (a, b) => PROJECT_PHASES.indexOf(a.phase) - PROJECT_PHASES.indexOf(b.phase)
        )
      );
    });

    const projects: DashboardProject[] = projectRows.map((row) => {
      const projectId = row.id;
      const provinces = provinceMap.get(projectId) ?? [];
      const districts = districtMap.get(projectId) ?? [];
      const communities = communityMap.get(projectId) ?? [];
      const clusters = clusterMap.get(projectId) ?? [];
      const standardSectors = standardSectorMap.get(projectId) ?? [];
      const beneficiaries = cloneBreakdownData(projectBeneficiaryMap.get(projectId));
      const documents = projectDocumentMap.get(projectId) ?? [];
      const phases = projectPhaseMap.get(projectId) ?? [];

      return {
        id: projectId.toString(),
        code: row.code,
        name: row.title,
        sector: (row.sector ?? "Unassigned") as ProjectSector,
        beneficiaries,
        country: row.country ?? "Afghanistan",
        provinces,
        districts,
        communities,
        goal: row.goal ?? "",
        objectives: row.objectives ?? "",
        majorAchievements: row.major_achievements ?? "",
        start: formatDate(row.start_date),
        end: formatDate(row.end_date),
        staff: row.staff ?? 0,
        clusters,
        standardSectors,
        donor: row.donor ?? undefined,
        budget: row.budget ?? undefined,
        focalPoint: row.focal_point ?? undefined,
        documents: documents.map((doc) => ({ ...doc })),
        phases: phases.map((phase) => ({ ...phase })),
      };
    });

    let enumeratorRows: EnumeratorRow[] = [];
    if (hasEnumerators) {
      [enumeratorRows] = await connection.query<EnumeratorRow>(
        "SELECT id, full_name, email, phone, province FROM enumerators ORDER BY full_name ASC"
      );
    }

    let baselineSurveyRows: BaselineSurveyRow[] = [];
    let baselineAssignmentRows: BaselineAssignmentRow[] = [];
    let dataCollectionTaskRows: DataCollectionTaskRow[] = [];
    let baselineReportRows: BaselineReportRow[] = [];
    let fieldVisitRows: FieldVisitReportRow[] = [];
    let monthlyReportRows: MonthlyReportRow[] = [];

    if (projectIds.length) {
      const placeholders = createPlaceholders(projectIds.length);

      if (hasBaselineSurveys) {
        [baselineSurveyRows] = await connection.query<BaselineSurveyRow>(
          `SELECT id, project_id, title, tool, status, questionnaire_url, created_at, updated_at
           FROM baseline_surveys
           WHERE project_id IN (${placeholders})
           ORDER BY created_at DESC, id DESC`,
          projectIds
        );
      }

      if (hasFieldVisits) {
        [fieldVisitRows] = await connection.query<FieldVisitReportRow>(
          `SELECT id, project_id, visit_date, location, positive_findings, negative_findings, photo_url, gps_coordinates, officer, created_at
           FROM field_visit_reports
           WHERE project_id IN (${placeholders})
           ORDER BY visit_date DESC, id DESC`,
          projectIds
        );
      }

      if (hasMonthlyReports) {
        [monthlyReportRows] = await connection.query<MonthlyReportRow>(
          `SELECT id, project_id, report_month, summary, gaps, recommendations, status, reviewer, feedback, submitted_at, updated_at
           FROM monthly_reports
           WHERE project_id IN (${placeholders})
           ORDER BY report_month DESC, id DESC`,
          projectIds
        );
      }
    }

    const surveyIds = baselineSurveyRows.map((row) => row.id);
    if (surveyIds.length) {
      const surveyPlaceholders = createPlaceholders(surveyIds.length);

      if (hasBaselineAssignments) {
        [baselineAssignmentRows] = await connection.query<BaselineAssignmentRow>(
          `SELECT baseline_survey_id, enumerator_id
           FROM baseline_enumerator_assignments
           WHERE baseline_survey_id IN (${surveyPlaceholders})`,
          surveyIds
        );
      }

      if (hasDataCollectionTasks) {
        [dataCollectionTaskRows] = await connection.query<DataCollectionTaskRow>(
          `SELECT id, baseline_survey_id, status, completed_at, notes
           FROM data_collection_tasks
           WHERE baseline_survey_id IN (${surveyPlaceholders})
           ORDER BY id`,
          surveyIds
        );
      }

      if (hasBaselineReports) {
        [baselineReportRows] = await connection.query<BaselineReportRow>(
          `SELECT id, baseline_survey_id, report_url, shared_with_program, shared_at, created_at
           FROM baseline_reports
           WHERE baseline_survey_id IN (${surveyPlaceholders})
           ORDER BY created_at DESC, id DESC`,
          surveyIds
        );
      }
    }

    const enumeratorAssignmentCount = new Map<number, number>();
    baselineAssignmentRows.forEach((row) => {
      enumeratorAssignmentCount.set(
        row.enumerator_id,
        (enumeratorAssignmentCount.get(row.enumerator_id) ?? 0) + 1
      );
    });

    const enumerators: EnumeratorRecord[] = enumeratorRows.map((row) => ({
      id: row.id.toString(),
      fullName: row.full_name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      province: row.province ?? undefined,
      assignments: enumeratorAssignmentCount.get(row.id) ?? 0,
    }));

    const baselineSurveys: BaselineSurveyRecord[] = baselineSurveyRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      title: row.title,
      tool: mapBaselineTool(row.tool),
      status: mapBaselineStatus(row.status),
      questionnaireUrl: row.questionnaire_url ?? undefined,
      createdAt: safeIsoString(row.created_at),
      updatedAt: safeIsoString(row.updated_at),
    }));

    const dataCollectionTasks: DataCollectionTaskRecord[] = dataCollectionTaskRows.map((row) => ({
      id: row.id.toString(),
      baselineSurveyId: row.baseline_survey_id?.toString() ?? "",
      status: mapDataCollectionStatus(row.status),
      completedAt: optionalIsoString(row.completed_at),
      notes: row.notes ?? undefined,
    }));

    const baselineReports: BaselineReportRecord[] = baselineReportRows.map((row) => ({
      id: row.id.toString(),
      baselineSurveyId: row.baseline_survey_id.toString(),
      reportUrl: row.report_url ?? undefined,
      sharedWithProgram: Boolean(row.shared_with_program),
      sharedAt: optionalIsoString(row.shared_at),
      createdAt: safeIsoString(row.created_at),
    }));

    const fieldVisits: FieldVisitReportRecord[] = fieldVisitRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      visitDate: safeIsoString(row.visit_date),
      location: row.location ?? undefined,
      positiveFindings: row.positive_findings ?? undefined,
      negativeFindings: row.negative_findings ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      gpsCoordinates: row.gps_coordinates ?? undefined,
      officer: row.officer ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    const monthlyReports: MonthlyNarrativeRecord[] = monthlyReportRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      reportMonth: row.report_month,
      summary: row.summary ?? undefined,
      gaps: row.gaps ?? undefined,
      recommendations: row.recommendations ?? undefined,
      status: mapMonthlyStatus(row.status),
      reviewer: row.reviewer ?? undefined,
      feedback: row.feedback ?? undefined,
      submittedAt: optionalIsoString(row.submitted_at),
      updatedAt: safeIsoString(row.updated_at),
    }));

    const monitoring: MonitoringDashboardData = {
      baselineSurveys,
      enumerators,
      dataCollectionTasks,
      baselineReports,
      fieldVisits,
      monthlyReports,
    };

    let evaluationRows: EvaluationRow[] = [];
    if (hasEvaluations) {
      [evaluationRows] = await connection.query<EvaluationRow>(
        `SELECT id, project_id, evaluator_name, evaluation_type, report_url, findings_summary, completed_at, created_at
         FROM evaluations
         ORDER BY (completed_at IS NULL) ASC, completed_at DESC, created_at DESC`
      );
    }

    let storyRows: StoryRow[] = [];
    if (hasStories) {
      [storyRows] = await connection.query<StoryRow>(
        `SELECT id, project_id, story_type, title, quote, summary, photo_url, spotlight_order, created_at
         FROM stories
         ORDER BY COALESCE(spotlight_order, 9999) ASC, created_at DESC`
      );
    }

    const evaluationRecords: EvaluationRecord[] = evaluationRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      evaluatorName: row.evaluator_name ?? undefined,
      evaluationType: mapEvaluationType(row.evaluation_type),
      reportUrl: row.report_url ?? undefined,
      findingsSummary: row.findings_summary ?? undefined,
      completedAt: optionalIsoString(row.completed_at),
      createdAt: safeIsoString(row.created_at),
    }));

    const storyRecords: StoryRecord[] = storyRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      storyType: mapStoryType(row.story_type),
      title: row.title,
      quote: row.quote ?? undefined,
      summary: row.summary ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    const evaluation: EvaluationDashboardData = {
      evaluations: evaluationRecords,
      stories: storyRecords,
    };

    const [complaintRows] = await connection.query<ComplaintRow>(
      "SELECT id, full_name, email, phone, message, submitted_at FROM complaints ORDER BY submitted_at DESC"
    );

    const complaintIds = complaintRows.map((row) => row.id);

    let complaintMetadataRows: ComplaintMetadataRow[] = [];
    let complaintResponseRows: ComplaintResponseRow[] = [];
    if (complaintIds.length) {
      const placeholders = createPlaceholders(complaintIds.length);
      if (hasComplaintMetadata) {
        [complaintMetadataRows] = await connection.query<ComplaintMetadataRow>(
          `SELECT complaint_id, status, assigned_officer, province, district, project_id, is_anonymous, auto_assigned_at, created_at, updated_at
           FROM complaint_metadata
           WHERE complaint_id IN (${placeholders})`,
          complaintIds
        );
      }

      if (hasComplaintResponses) {
        [complaintResponseRows] = await connection.query<ComplaintResponseRow>(
          `SELECT id, complaint_id, responder, response, created_at
           FROM complaint_responses
           WHERE complaint_id IN (${placeholders})
           ORDER BY created_at ASC, id ASC`,
          complaintIds
        );
      }
    }

    const complaintMetadataMap = new Map<number, ComplaintMetadataRow>();
    complaintMetadataRows.forEach((row) => {
      complaintMetadataMap.set(row.complaint_id, row);
    });

    const complaintResponseMap = new Map<number, ComplaintResponseRecord[]>();
    complaintResponseRows.forEach((row) => {
      const response: ComplaintResponseRecord = {
        id: row.id.toString(),
        complaintId: row.complaint_id.toString(),
        responder: row.responder ?? undefined,
        response: row.response,
        createdAt: safeIsoString(row.created_at),
      };
      const list = complaintResponseMap.get(row.complaint_id) ?? [];
      list.push(response);
      complaintResponseMap.set(row.complaint_id, list);
    });

    const complaints = complaintRows.map<ComplaintRecord>((row) => {
      const metadata = complaintMetadataMap.get(row.id);
      const status = mapComplaintStatus(metadata?.status ?? "open");
      const responses = complaintResponseMap.get(row.id) ?? [];
      return {
        id: row.id.toString(),
        fullName: row.full_name,
        email: row.email,
        phone: row.phone ?? undefined,
        message: row.message,
        submittedAt: safeIsoString(row.submitted_at),
        status,
        assignedOfficer: metadata?.assigned_officer ?? undefined,
        province: metadata?.province ?? undefined,
        district: metadata?.district ?? undefined,
        projectId: metadata?.project_id ? metadata.project_id.toString() : undefined,
        isAnonymous: Boolean(metadata?.is_anonymous),
        responses,
      };
    });

    const complaintMetrics: ComplaintSummaryMetrics = {
      total: complaints.length,
      open: 0,
      inReview: 0,
      resolved: 0,
    };
    complaints.forEach((complaint) => {
      if (complaint.status === "open") {
        complaintMetrics.open += 1;
      } else if (complaint.status === "in_review") {
        complaintMetrics.inReview += 1;
      } else if (complaint.status === "resolved") {
        complaintMetrics.resolved += 1;
      }
    });

    let crmAwarenessRows: CrmAwarenessRow[] = [];
    if (hasCrmAwareness) {
      [crmAwarenessRows] = await connection.query<CrmAwarenessRow>(
        `SELECT id, project_id, district, awareness_date, notes, created_at
         FROM crm_awareness_records
         ORDER BY (awareness_date IS NULL) ASC, awareness_date DESC, created_at DESC`
      );
    }

    const crmAwareness: CrmAwarenessRecord[] = crmAwarenessRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      district: row.district ?? undefined,
      awarenessDate: optionalIsoString(row.awareness_date),
      notes: row.notes ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    let findingRows: FindingRow[] = [];
    if (hasFindings) {
      [findingRows] = await connection.query<FindingRow>(
        `SELECT id, project_id, finding_type, category, severity, department, status, description, evidence_url, reminder_due_at, last_reminded_at, created_at, updated_at
         FROM findings
         ORDER BY created_at DESC, id DESC`
      );
    }

    const findingRecords: FindingRecord[] = findingRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      findingType: mapFindingType(row.finding_type),
      category: row.category ?? undefined,
      severity: mapFindingSeverity(row.severity),
      department: row.department ?? undefined,
      status: mapFindingStatus(row.status),
      description: row.description ?? undefined,
      evidenceUrl: row.evidence_url ?? undefined,
      reminderDueAt: optionalIsoString(row.reminder_due_at),
      lastRemindedAt: optionalIsoString(row.last_reminded_at),
      createdAt: safeIsoString(row.created_at),
      updatedAt: safeIsoString(row.updated_at),
    }));

    const findingsSummary: FindingsSummary = {
      total: findingRecords.length,
      byType: {
        negative: 0,
        positive: 0,
      },
      bySeverity: {
        minor: 0,
        major: 0,
        critical: 0,
      },
      byStatus: {
        pending: 0,
        in_progress: 0,
        solved: 0,
      },
      byDepartment: {} as FindingsByDepartment,
    };

    findingRecords.forEach((record) => {
      findingsSummary.byType[record.findingType] += 1;
      findingsSummary.bySeverity[record.severity] += 1;
      findingsSummary.byStatus[record.status] += 1;

      const departmentKey = record.department?.trim() || "Unassigned";
      const departmentEntry = findingsSummary.byDepartment[departmentKey] ?? {
        pending: 0,
        inProgress: 0,
        solved: 0,
      };
      if (record.status === "pending") {
        departmentEntry.pending += 1;
      } else if (record.status === "in_progress") {
        departmentEntry.inProgress += 1;
      } else {
        departmentEntry.solved += 1;
      }
      findingsSummary.byDepartment[departmentKey] = departmentEntry;
    });

    const findings: FindingsDashboardData = {
      findings: findingRecords,
      summary: findingsSummary,
    };

    let distributionRows: DistributionRow[] = [];
    if (hasDistributionRecords) {
      [distributionRows] = await connection.query<DistributionRow>(
        `SELECT id, project_id, assistance_type, distribution_date, location, target_beneficiaries, notes, created_at
         FROM distribution_records
         ORDER BY (distribution_date IS NULL) ASC, distribution_date DESC, created_at DESC`
      );
    }

    let pdmSurveyRows: PdmSurveyRow[] = [];
    if (hasPdmSurveys) {
      [pdmSurveyRows] = await connection.query<PdmSurveyRow>(
        `SELECT id, project_id, tool, quality_score, quantity_score, satisfaction_score, protection_score, completed_at, created_at
         FROM pdm_surveys
         ORDER BY (completed_at IS NULL) ASC, completed_at DESC, created_at DESC`
      );
    }

    let pdmReportRows: PdmReportRow[] = [];
    if (hasPdmReports) {
      [pdmReportRows] = await connection.query<PdmReportRow>(
        `SELECT id, project_id, report_date, summary, recommendations, feedback_to_program, created_at
         FROM pdm_reports
         ORDER BY (report_date IS NULL) ASC, report_date DESC, created_at DESC`
      );
    }

    const distributions: DistributionRecord[] = distributionRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      assistanceType: row.assistance_type,
      distributionDate: optionalIsoString(row.distribution_date),
      location: row.location ?? undefined,
      targetBeneficiaries: row.target_beneficiaries ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    const pdmSurveys: PdmSurveyRecord[] = pdmSurveyRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      tool: row.tool ?? undefined,
      qualityScore: row.quality_score ?? undefined,
      quantityScore: row.quantity_score ?? undefined,
      satisfactionScore: row.satisfaction_score ?? undefined,
      protectionScore: row.protection_score ?? undefined,
      completedAt: optionalIsoString(row.completed_at),
      createdAt: safeIsoString(row.created_at),
    }));

    const pdmReports: PdmReportRecord[] = pdmReportRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      reportDate: optionalIsoString(row.report_date),
      summary: row.summary ?? undefined,
      recommendations: row.recommendations ?? undefined,
      feedbackToProgram: row.feedback_to_program ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    const pdm: PdmDashboardData = {
      distributions,
      surveys: pdmSurveys,
      reports: pdmReports,
    };

    let lessonRows: LessonRow[] = [];
    if (hasLessons) {
      [lessonRows] = await connection.query<LessonRow>(
        `SELECT id, project_id, source, lesson, department, theme, captured_at, created_at
         FROM lessons
         ORDER BY created_at DESC`
      );
    }

    let knowledgeResourceRows: KnowledgeResourceRow[] = [];
    if (hasKnowledgeResources) {
      [knowledgeResourceRows] = await connection.query<KnowledgeResourceRow>(
        `SELECT id, title, category, theme, description, file_url, created_at
         FROM knowledge_resources
         ORDER BY created_at DESC`
      );
    }

    const lessons: LessonRecord[] = lessonRows.map((row) => ({
      id: row.id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      source: row.source ?? undefined,
      lesson: row.lesson,
      department: row.department ?? undefined,
      theme: row.theme ?? undefined,
      capturedAt: optionalIsoString(row.captured_at),
      createdAt: safeIsoString(row.created_at),
    }));

    const knowledgeResources: KnowledgeResourceRecord[] = knowledgeResourceRows.map((row) => ({
      id: row.id.toString(),
      title: row.title,
      category: row.category ?? undefined,
      theme: row.theme ?? undefined,
      description: row.description ?? undefined,
      fileUrl: row.file_url ?? undefined,
      createdAt: safeIsoString(row.created_at),
    }));

    const knowledgeHub: KnowledgeHubData = {
      lessons,
      resources: knowledgeResources,
    };

    let userAccessRows: UserAccessAssignmentRow[] = [];
    if (hasUserAccessAssignments) {
      [userAccessRows] = await connection.query<UserAccessAssignmentRow>(
        `SELECT id, user_id, project_id, province, role
         FROM user_access_assignments
         ORDER BY user_id ASC, project_id ASC`
      );
    }

    const userAccessAssignments: UserAccessAssignmentRecord[] = userAccessRows.map((row) => ({
      id: row.id.toString(),
      userId: row.user_id.toString(),
      projectId: row.project_id ? row.project_id.toString() : undefined,
      province: row.province ?? undefined,
      role: row.role ?? undefined,
    }));

    let integrationRows: IntegrationRow[] = [];
    if (hasIntegrations) {
      [integrationRows] = await connection.query<IntegrationRow>(
        `SELECT id, name, config, created_at, updated_at
         FROM integrations
         ORDER BY name ASC`
      );
    }

    const integrations: IntegrationRecord[] = integrationRows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      config: row.config ?? undefined,
      createdAt: safeIsoString(row.created_at),
      updatedAt: safeIsoString(row.updated_at),
    }));

    const [clusterCatalogRows] = await connection.query<ClusterCatalogRow>(
      "SELECT id, name, description FROM cluster_catalog ORDER BY name ASC"
    );

    const clusterCatalog = clusterCatalogRows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description ?? undefined,
    }));

    const [sectorCatalogRows] = await connection.query<SectorCatalogRow>(
      "SELECT id, name, description FROM sector_catalog ORDER BY name ASC"
    );

    const sectorCatalog = sectorCatalogRows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description ?? undefined,
    }));

    return {
      sectors,
      reportingYears,
      users,
      projects,
      projectDocuments,
      projectPhases,
      branding,
      complaints,
      complaintMetrics,
      crmAwareness,
      monitoring,
      evaluation,
      findings,
      pdm,
      knowledgeHub,
      userAccessAssignments,
      integrations,
      clusterCatalog,
      sectorCatalog,
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
    const email = payload.email.trim().toLowerCase();
    const name = payload.name.trim();
    const organization = payload.organization?.trim() ?? null;

    const [existingRows] = await connection.query<UserWithPasswordRow>(
      "SELECT id, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingRows.length) {
      const existing = existingRows[0];
      const passwordHash = payload.passwordHash ?? existing.password_hash ?? null;
      await connection.execute(
        "UPDATE users SET name = ?, role = ?, organization = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?",
        [name, payload.role, organization, passwordHash, existing.id]
      );
      return;
    }

    await connection.execute(
      "INSERT INTO users (name, email, role, organization, password_hash) VALUES (?, ?, ?, ?, ?)",
      [name, email, payload.role, organization, payload.passwordHash ?? null]
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
    await connection.execute("INSERT INTO reporting_years (year) VALUES (?) ON CONFLICT(year) DO NOTHING", [
      year,
    ]);
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
      const [rows] = await connection.query<SectorRow>(
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
        sectorId = result.insertId;
      }

      await connection.execute("DELETE FROM sector_provinces WHERE sector_id = ?", [sectorId]);
      if (details.provinces.length) {
        const insertProvince = details.provinces
          .map((province) => province.trim())
          .filter((province) => province.length);
        for (const province of insertProvince) {
          await connection.execute("INSERT INTO sector_provinces (sector_id, province) VALUES (?, ?)", [
            sectorId,
            province,
          ]);
        }
      }

      await connection.execute("DELETE FROM beneficiary_stats WHERE sector_id = ?", [sectorId]);
      for (const key of BENEFICIARY_TYPE_KEYS) {
        await connection.execute(
          "INSERT INTO beneficiary_stats (sector_id, type_key, direct, indirect) VALUES (?, ?, ?, ?)",
          [
            sectorId,
            key,
            details.beneficiaries.direct[key],
            details.beneficiaries.indirect[key],
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export type CatalogEntry = {
  id: string;
  name: string;
  description?: string;
};

export async function fetchClusterCatalog(): Promise<CatalogEntry[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<ClusterCatalogRow>(
      "SELECT id, name, description FROM cluster_catalog ORDER BY name ASC"
    );
    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description ?? undefined,
    }));
  });
}

export async function fetchSectorCatalog(): Promise<CatalogEntry[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<SectorCatalogRow>(
      "SELECT id, name, description FROM sector_catalog ORDER BY name ASC"
    );
    return rows.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description ?? undefined,
    }));
  });
}

export async function insertClusterCatalogEntry(payload: {
  name: string;
  description?: string;
}): Promise<CatalogEntry> {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Cluster name is required.");
  }
  const description = payload.description?.trim() ?? null;

  return withConnection(async (connection) => {
    const [existing] = await connection.query<ClusterCatalogRow>(
      "SELECT id FROM cluster_catalog WHERE lower(name) = lower(?) LIMIT 1",
      [name]
    );
    if (existing.length) {
      const duplicateError = new Error("DUPLICATE_CLUSTER_NAME");
      duplicateError.name = "CatalogDuplicateError";
      throw duplicateError;
    }

    const [rows] = await connection.query<ClusterCatalogRow>(
      `INSERT INTO cluster_catalog (name, description)
       VALUES (?, ?)
       RETURNING id, name, description`,
      [name, description]
    );
    const record = rows[0];
    if (!record) {
      throw new Error("Failed to store cluster entry.");
    }
    return {
      id: record.id.toString(),
      name: record.name,
      description: record.description ?? undefined,
    };
  });
}

export async function updateClusterCatalogEntry(payload: {
  id: string;
  name: string;
  description?: string;
}): Promise<CatalogEntry> {
  const id = Number.parseInt(payload.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("A valid cluster id is required.");
  }
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Cluster name is required.");
  }
  const description = payload.description?.trim() ?? null;

  return withConnection(async (connection) => {
    const [conflictRows] = await connection.query<ClusterCatalogRow>(
      "SELECT id FROM cluster_catalog WHERE lower(name) = lower(?) AND id <> ? LIMIT 1",
      [name, id]
    );
    if (conflictRows.length) {
      const duplicateError = new Error("DUPLICATE_CLUSTER_NAME");
      duplicateError.name = "CatalogDuplicateError";
      throw duplicateError;
    }

    const [rows] = await connection.query<ClusterCatalogRow>(
      `UPDATE cluster_catalog
       SET name = ?, description = ?
       WHERE id = ?
       RETURNING id, name, description`,
      [name, description, id]
    );
    const record = rows[0];
    if (!record) {
      throw new Error("Cluster entry not found.");
    }
    return {
      id: record.id.toString(),
      name: record.name,
      description: record.description ?? undefined,
    };
  });
}

export async function deleteClusterCatalogEntry(id: string): Promise<void> {
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) {
    throw new Error("A valid cluster id is required.");
  }

  await withConnection(async (connection) => {
    const [result] = await connection.execute(
      "DELETE FROM cluster_catalog WHERE id = ?",
      [numericId]
    );
    if (!result.affectedRows) {
      throw new Error("Cluster entry not found.");
    }
  });
}

export async function insertSectorCatalogEntry(payload: {
  name: string;
  description?: string;
}): Promise<CatalogEntry> {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Sector name is required.");
  }
  const description = payload.description?.trim() ?? null;

  return withConnection(async (connection) => {
    const [existing] = await connection.query<SectorCatalogRow>(
      "SELECT id FROM sector_catalog WHERE lower(name) = lower(?) LIMIT 1",
      [name]
    );
    if (existing.length) {
      const duplicateError = new Error("DUPLICATE_SECTOR_NAME");
      duplicateError.name = "CatalogDuplicateError";
      throw duplicateError;
    }

    const [rows] = await connection.query<SectorCatalogRow>(
      `INSERT INTO sector_catalog (name, description)
       VALUES (?, ?)
       RETURNING id, name, description`,
      [name, description]
    );
    const record = rows[0];
    if (!record) {
      throw new Error("Failed to store sector entry.");
    }
    return {
      id: record.id.toString(),
      name: record.name,
      description: record.description ?? undefined,
    };
  });
}

export type AuthUserRecord = {
  id: number;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization?: string;
  passwordHash: string | null;
};

export type SessionLookupResult = {
  sessionId: string;
  expiresAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
    role: DashboardUserRole;
    organization?: string;
  };
};

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  return withConnection(async (connection) => {
    const [rows] = await connection.query<UserWithPasswordRow>(
      "SELECT id, name, email, role, organization, password_hash FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      organization: row.organization ?? undefined,
      passwordHash: row.password_hash ?? null,
    };
  });
}

export async function createUserSessionRecord(
  userId: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM user_sessions WHERE expires_at < datetime('now')");
    await connection.execute(
      "INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [userId, tokenHash, expiresAt.toISOString()]
    );
  });
}

export async function findSessionByTokenHash(tokenHash: string): Promise<SessionLookupResult | null> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<SessionWithUserRow>(
      `SELECT
         s.id,
         s.user_id,
         s.token_hash,
         s.expires_at,
         u.name,
         u.email,
         u.role,
         u.organization
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length) {
      return null;
    }

    const session = rows[0];
    const expiresAtDate = new Date(session.expires_at);
    return {
      sessionId: session.id.toString(),
      expiresAt: expiresAtDate,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role,
        organization: session.organization ?? undefined,
      },
    };
  });
}

export async function updateSectorCatalogEntry(payload: {
  id: string;
  name: string;
  description?: string;
}): Promise<CatalogEntry> {
  const id = Number.parseInt(payload.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("A valid sector id is required.");
  }
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Sector name is required.");
  }
  const description = payload.description?.trim() ?? null;

  return withConnection(async (connection) => {
    const [conflictRows] = await connection.query<SectorCatalogRow>(
      "SELECT id FROM sector_catalog WHERE lower(name) = lower(?) AND id <> ? LIMIT 1",
      [name, id]
    );
    if (conflictRows.length) {
      const duplicateError = new Error("DUPLICATE_SECTOR_NAME");
      duplicateError.name = "CatalogDuplicateError";
      throw duplicateError;
    }

    const [rows] = await connection.query<SectorCatalogRow>(
      `UPDATE sector_catalog
       SET name = ?, description = ?
       WHERE id = ?
       RETURNING id, name, description`,
      [name, description, id]
    );
    const record = rows[0];
    if (!record) {
      throw new Error("Sector entry not found.");
    }
    return {
      id: record.id.toString(),
      name: record.name,
      description: record.description ?? undefined,
    };
  });
}

export async function deleteSectorCatalogEntry(id: string): Promise<void> {
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) {
    throw new Error("A valid sector id is required.");
  }

  await withConnection(async (connection) => {
    const [result] = await connection.execute(
      "DELETE FROM sector_catalog WHERE id = ?",
      [numericId]
    );
    if (!result.affectedRows) {
      throw new Error("Sector entry not found.");
    }
  });
}

export async function updateProjectRecord(payload: {
  id: string;
  code: string;
  name: string;
  sector?: string | null;
  donor?: string | null;
  country?: string | null;
  start?: string | null;
  end?: string | null;
  budget?: number | null;
  focalPoint?: string | null;
  goal?: string | null;
  objectives?: string | null;
  majorAchievements?: string | null;
  staff?: number | null;
  provinces?: string[];
  districts?: string[];
  communities?: string[];
  clusters?: string[];
  standardSectors?: string[];
}): Promise<void> {
  const projectId = Number.parseInt(payload.id, 10);
  if (!Number.isFinite(projectId)) {
    throw new Error("A valid project id is required.");
  }

  const code = payload.code?.trim();
  if (!code) {
    throw new Error("Project code is required.");
  }

  const title = payload.name?.trim();
  if (!title) {
    throw new Error("Project name is required.");
  }

  await withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      const [updateResult] = await connection.execute(
        `UPDATE projects
         SET code = ?,
             title = ?,
             donor = ?,
             sector = ?,
             country = ?,
             start_date = ?,
             end_date = ?,
             budget = ?,
             focal_point = ?,
             goal = ?,
             objectives = ?,
             major_achievements = ?,
             staff = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [
          code,
          title,
          payload.donor?.trim() || null,
          payload.sector?.trim() || null,
          payload.country?.trim() || null,
          payload.start?.trim() || null,
          payload.end?.trim() || null,
          typeof payload.budget === "number" ? payload.budget : null,
          payload.focalPoint?.trim() || null,
          payload.goal?.trim() || null,
          payload.objectives?.trim() || null,
          payload.majorAchievements?.trim() || null,
          typeof payload.staff === "number" ? payload.staff : null,
          projectId,
        ]
      );

      if (!updateResult.affectedRows) {
        throw new Error("Project not found.");
      }

      const resetAndInsert = async (table: string, column: string, values: string[] | undefined) => {
        await connection.execute(`DELETE FROM ${table} WHERE project_id = ?`, [projectId]);
        if (!values?.length) {
          return;
        }
        for (const rawValue of values) {
          const value = rawValue?.trim();
          if (!value) {
            continue;
          }
          await connection.execute(
            `INSERT INTO ${table} (project_id, ${column}) VALUES (?, ?)`,
            [projectId, value]
          );
        }
      };

      await resetAndInsert("project_provinces", "province", payload.provinces);
      await resetAndInsert("project_districts", "district", payload.districts);
      await resetAndInsert("project_communities", "community", payload.communities);
      await resetAndInsert("project_clusters", "cluster", payload.clusters);
      await resetAndInsert("project_standard_sectors", "standard_sector", payload.standardSectors);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function createBaselineSurvey(payload: {
  projectId: string;
  title: string;
  tool?: string | null;
  status?: string | null;
  questionnaireUrl?: string | null;
}): Promise<BaselineSurveyRecord> {
  const projectId = Number.parseInt(payload.projectId, 10);
  if (!Number.isFinite(projectId)) {
    throw new Error("A valid project id is required.");
  }
  const title = payload.title?.trim();
  if (!title) {
    throw new Error("Baseline survey title is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<BaselineSurveyRow>(
      `INSERT INTO baseline_surveys (project_id, title, tool, status, questionnaire_url)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, project_id, title, tool, status, questionnaire_url, created_at, updated_at`,
      [
        projectId,
        title,
        mapBaselineTool(payload.tool ?? null),
        mapBaselineStatus(payload.status ?? "draft"),
        payload.questionnaireUrl?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create baseline survey.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id.toString(),
    title: record.title,
    tool: mapBaselineTool(record.tool),
    status: mapBaselineStatus(record.status),
    questionnaireUrl: record.questionnaire_url ?? undefined,
    createdAt: safeIsoString(record.created_at),
    updatedAt: safeIsoString(record.updated_at),
  };
}

export async function createEnumerator(payload: {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  province?: string | null;
}): Promise<EnumeratorRecord> {
  const fullName = payload.fullName?.trim();
  if (!fullName) {
    throw new Error("Enumerator name is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<EnumeratorRow>(
      `INSERT INTO enumerators (full_name, email, phone, province)
       VALUES (?, ?, ?, ?)
       RETURNING id, full_name, email, phone, province`,
      [
        fullName,
        payload.email?.trim() || null,
        payload.phone?.trim() || null,
        payload.province?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create enumerator.");
  }

  return {
    id: record.id.toString(),
    fullName: record.full_name,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    province: record.province ?? undefined,
    assignments: 0,
  };
}

export async function createFieldVisit(payload: {
  projectId: string;
  visitDate: string;
  location?: string | null;
  positiveFindings?: string | null;
  negativeFindings?: string | null;
  photoUrl?: string | null;
  gpsCoordinates?: string | null;
  officer?: string | null;
}): Promise<FieldVisitReportRecord> {
  const projectId = Number.parseInt(payload.projectId, 10);
  if (!Number.isFinite(projectId)) {
    throw new Error("A valid project id is required.");
  }
  const visitDate = payload.visitDate?.trim();
  if (!visitDate) {
    throw new Error("Visit date is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<FieldVisitReportRow>(
      `INSERT INTO field_visit_reports (
         project_id,
         visit_date,
         location,
         positive_findings,
         negative_findings,
         photo_url,
         gps_coordinates,
         officer
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, visit_date, location, positive_findings, negative_findings, photo_url, gps_coordinates, officer, created_at`,
      [
        projectId,
        visitDate,
        payload.location?.trim() || null,
        payload.positiveFindings?.trim() || null,
        payload.negativeFindings?.trim() || null,
        payload.photoUrl?.trim() || null,
        payload.gpsCoordinates?.trim() || null,
        payload.officer?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create field visit record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id.toString(),
    visitDate: safeIsoString(record.visit_date),
    location: record.location ?? undefined,
    positiveFindings: record.positive_findings ?? undefined,
    negativeFindings: record.negative_findings ?? undefined,
    photoUrl: record.photo_url ?? undefined,
    gpsCoordinates: record.gps_coordinates ?? undefined,
    officer: record.officer ?? undefined,
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createMonthlyReport(payload: {
  projectId: string;
  reportMonth: string;
  summary?: string | null;
  gaps?: string | null;
  recommendations?: string | null;
  status?: string | null;
  reviewer?: string | null;
  feedback?: string | null;
  submittedAt?: string | null;
}): Promise<MonthlyNarrativeRecord> {
  const projectId = Number.parseInt(payload.projectId, 10);
  if (!Number.isFinite(projectId)) {
    throw new Error("A valid project id is required.");
  }
  const reportMonth = payload.reportMonth?.trim();
  if (!reportMonth) {
    throw new Error("Report month is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<MonthlyReportRow>(
      `INSERT INTO monthly_reports (
         project_id,
         report_month,
         summary,
         gaps,
         recommendations,
         status,
         reviewer,
         feedback,
         submitted_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, report_month, summary, gaps, recommendations, status, reviewer, feedback, submitted_at, updated_at`,
      [
        projectId,
        reportMonth,
        payload.summary?.trim() || null,
        payload.gaps?.trim() || null,
        payload.recommendations?.trim() || null,
        mapMonthlyStatus(payload.status ?? "draft"),
        payload.reviewer?.trim() || null,
        payload.feedback?.trim() || null,
        payload.submittedAt?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create monthly report.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id.toString(),
    reportMonth: record.report_month,
    summary: record.summary ?? undefined,
    gaps: record.gaps ?? undefined,
    recommendations: record.recommendations ?? undefined,
    status: mapMonthlyStatus(record.status),
    reviewer: record.reviewer ?? undefined,
    feedback: record.feedback ?? undefined,
    submittedAt: optionalIsoString(record.submitted_at),
    updatedAt: safeIsoString(record.updated_at),
  };
}

export async function createEvaluation(payload: {
  projectId: string;
  evaluationType: string;
  evaluatorName?: string | null;
  reportUrl?: string | null;
  findingsSummary?: string | null;
  completedAt?: string | null;
}): Promise<EvaluationRecord> {
  const projectId = Number.parseInt(payload.projectId, 10);
  if (!Number.isFinite(projectId)) {
    throw new Error("A valid project id is required.");
  }
  const evaluationType = mapEvaluationType(payload.evaluationType);

  const [rows] = await withConnection((connection) =>
    connection.query<EvaluationRow>(
      `INSERT INTO evaluations (
         project_id,
         evaluator_name,
         evaluation_type,
         report_url,
         findings_summary,
         completed_at
       )
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, evaluator_name, evaluation_type, report_url, findings_summary, completed_at, created_at`,
      [
        projectId,
        payload.evaluatorName?.trim() || null,
        evaluationType,
        payload.reportUrl?.trim() || null,
        payload.findingsSummary?.trim() || null,
        payload.completedAt?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create evaluation record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    evaluatorName: record.evaluator_name ?? undefined,
    evaluationType: mapEvaluationType(record.evaluation_type),
    reportUrl: record.report_url ?? undefined,
    findingsSummary: record.findings_summary ?? undefined,
    completedAt: optionalIsoString(record.completed_at),
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createStory(payload: {
  projectId?: string | null;
  storyType: string;
  title: string;
  quote?: string | null;
  summary?: string | null;
  photoUrl?: string | null;
}): Promise<StoryRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }
  const title = payload.title?.trim();
  if (!title) {
    throw new Error("Story title is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<StoryRow>(
      `INSERT INTO stories (
         project_id,
         story_type,
         title,
         quote,
         summary,
         photo_url
       )
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, story_type, title, quote, summary, photo_url, created_at`,
      [
        projectId,
        mapStoryType(payload.storyType),
        title,
        payload.quote?.trim() || null,
        payload.summary?.trim() || null,
        payload.photoUrl?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create story.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    storyType: mapStoryType(record.story_type),
    title: record.title,
    quote: record.quote ?? undefined,
    summary: record.summary ?? undefined,
    photoUrl: record.photo_url ?? undefined,
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createFinding(payload: {
  projectId?: string | null;
  findingType: string;
  category?: string | null;
  severity: string;
  department?: string | null;
  status: string;
  description?: string | null;
  evidenceUrl?: string | null;
  reminderDueAt?: string | null;
}): Promise<FindingRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<FindingRow>(
      `INSERT INTO findings (
         project_id,
         finding_type,
         category,
         severity,
         department,
         status,
         description,
         evidence_url,
         reminder_due_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, finding_type, category, severity, department, status, description, evidence_url, reminder_due_at, last_reminded_at, created_at, updated_at`,
      [
        projectId,
        mapFindingType(payload.findingType),
        payload.category?.trim() || null,
        mapFindingSeverity(payload.severity),
        payload.department?.trim() || null,
        mapFindingStatus(payload.status),
        payload.description?.trim() || null,
        payload.evidenceUrl?.trim() || null,
        payload.reminderDueAt?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create finding record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    findingType: mapFindingType(record.finding_type),
    category: record.category ?? undefined,
    severity: mapFindingSeverity(record.severity),
    department: record.department ?? undefined,
    status: mapFindingStatus(record.status),
    description: record.description ?? undefined,
    evidenceUrl: record.evidence_url ?? undefined,
    reminderDueAt: optionalIsoString(record.reminder_due_at),
    lastRemindedAt: optionalIsoString(record.last_reminded_at),
    createdAt: safeIsoString(record.created_at),
    updatedAt: safeIsoString(record.updated_at),
  };
}

export async function createCrmAwarenessRecord(payload: {
  projectId?: string | null;
  district?: string | null;
  awarenessDate?: string | null;
  notes?: string | null;
}): Promise<CrmAwarenessRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<CrmAwarenessRow>(
      `INSERT INTO crm_awareness_records (project_id, district, awareness_date, notes)
       VALUES (?, ?, ?, ?)
       RETURNING id, project_id, district, awareness_date, notes, created_at`,
      [
        projectId,
        payload.district?.trim() || null,
        payload.awarenessDate?.trim() || null,
        payload.notes?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create CRM awareness record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    district: record.district ?? undefined,
    awarenessDate: optionalIsoString(record.awareness_date),
    notes: record.notes ?? undefined,
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createDistributionRecord(payload: {
  projectId?: string | null;
  assistanceType: string;
  distributionDate?: string | null;
  location?: string | null;
  targetBeneficiaries?: number | null;
  notes?: string | null;
}): Promise<DistributionRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }
  const assistanceType = payload.assistanceType?.trim();
  if (!assistanceType) {
    throw new Error("Assistance type is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<DistributionRow>(
      `INSERT INTO distribution_records (
         project_id,
         assistance_type,
         distribution_date,
         location,
         target_beneficiaries,
         notes
       )
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, assistance_type, distribution_date, location, target_beneficiaries, notes, created_at`,
      [
        projectId,
        assistanceType,
        payload.distributionDate?.trim() || null,
        payload.location?.trim() || null,
        typeof payload.targetBeneficiaries === "number" ? payload.targetBeneficiaries : null,
        payload.notes?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create distribution record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    assistanceType: record.assistance_type,
    distributionDate: optionalIsoString(record.distribution_date),
    location: record.location ?? undefined,
    targetBeneficiaries: record.target_beneficiaries ?? undefined,
    notes: record.notes ?? undefined,
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createPdmSurvey(payload: {
  projectId?: string | null;
  tool?: string | null;
  qualityScore?: number | null;
  quantityScore?: number | null;
  satisfactionScore?: number | null;
  protectionScore?: number | null;
  completedAt?: string | null;
}): Promise<PdmSurveyRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<PdmSurveyRow>(
      `INSERT INTO pdm_surveys (
         project_id,
         tool,
         quality_score,
         quantity_score,
         satisfaction_score,
         protection_score,
         completed_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, tool, quality_score, quantity_score, satisfaction_score, protection_score, completed_at, created_at`,
      [
        projectId,
        payload.tool?.trim() || null,
        typeof payload.qualityScore === "number" ? payload.qualityScore : null,
        typeof payload.quantityScore === "number" ? payload.quantityScore : null,
        typeof payload.satisfactionScore === "number" ? payload.satisfactionScore : null,
        typeof payload.protectionScore === "number" ? payload.protectionScore : null,
        payload.completedAt?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create PDM survey.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    tool: record.tool ?? undefined,
    qualityScore: record.quality_score ?? undefined,
    quantityScore: record.quantity_score ?? undefined,
    satisfactionScore: record.satisfaction_score ?? undefined,
    protectionScore: record.protection_score ?? undefined,
    completedAt: optionalIsoString(record.completed_at),
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createPdmReport(payload: {
  projectId?: string | null;
  reportDate?: string | null;
  summary?: string | null;
  recommendations?: string | null;
  feedbackToProgram?: string | null;
}): Promise<PdmReportRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<PdmReportRow>(
      `INSERT INTO pdm_reports (project_id, report_date, summary, recommendations, feedback_to_program)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, project_id, report_date, summary, recommendations, feedback_to_program, created_at`,
      [
        projectId,
        payload.reportDate?.trim() || null,
        payload.summary?.trim() || null,
        payload.recommendations?.trim() || null,
        payload.feedbackToProgram?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create PDM report.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    reportDate: optionalIsoString(record.report_date),
    summary: record.summary ?? undefined,
    recommendations: record.recommendations ?? undefined,
    feedbackToProgram: record.feedback_to_program ?? undefined,
    createdAt: safeIsoString(record.created_at),
  };
}

export async function createLesson(payload: {
  projectId?: string | null;
  source?: string | null;
  lesson: string;
  department?: string | null;
  theme?: string | null;
  capturedAt?: string | null;
}): Promise<LessonRecord> {
  const projectId = payload.projectId ? Number.parseInt(payload.projectId, 10) : null;
  if (payload.projectId && !Number.isFinite(projectId)) {
    throw new Error("Project selection is invalid.");
  }
  const lesson = payload.lesson?.trim();
  if (!lesson) {
    throw new Error("Lesson description is required.");
  }

  const [rows] = await withConnection((connection) =>
    connection.query<LessonRow>(
      `INSERT INTO lessons (
         project_id,
         source,
         lesson,
         department,
         theme,
         captured_at
       )
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, project_id, source, lesson, department, theme, captured_at, created_at`,
      [
        projectId,
        payload.source?.trim() || null,
        lesson,
        payload.department?.trim() || null,
        payload.theme?.trim() || null,
        payload.capturedAt?.trim() || null,
      ]
    )
  );

  const record = rows[0];
  if (!record) {
    throw new Error("Failed to create lesson record.");
  }

  return {
    id: record.id.toString(),
    projectId: record.project_id ? record.project_id.toString() : undefined,
    source: record.source ?? undefined,
    lesson: record.lesson,
    department: record.department ?? undefined,
    theme: record.theme ?? undefined,
    capturedAt: optionalIsoString(record.captured_at),
    createdAt: safeIsoString(record.created_at),
  };
}


export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM user_sessions WHERE token_hash = ?", [tokenHash]);
  });
}

export async function purgeExpiredSessions(): Promise<void> {
  await withConnection(async (connection) => {
    await connection.execute("DELETE FROM user_sessions WHERE expires_at <= datetime('now')");
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
       ON CONFLICT(id) DO UPDATE SET
         company_name = excluded.company_name,
         logo_data = COALESCE(excluded.logo_data, branding_settings.logo_data),
         logo_mime = COALESCE(excluded.logo_mime, branding_settings.logo_mime),
         favicon_data = COALESCE(excluded.favicon_data, branding_settings.favicon_data),
         favicon_mime = COALESCE(excluded.favicon_mime, branding_settings.favicon_mime)`,
      [companyName ?? "NSDO", logo.data, logo.mime, favicon.data, favicon.mime]
    );
  });
}
