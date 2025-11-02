export const BENEFICIARY_TYPE_KEYS = [
  "childrenGirls",
  "childrenBoys",
  "adultsWomen",
  "adultsMen",
  "households",
  "idps",
  "returnees",
  "pwds",
] as const;

export type BeneficiaryTypeKey = (typeof BENEFICIARY_TYPE_KEYS)[number];

export const BENEFICIARY_TYPE_META: Record<
  BeneficiaryTypeKey,
  { label: string; group: string; color: string }
> = {
  childrenGirls: { label: "Children • Girls", group: "Children", color: "#f472b6" },
  childrenBoys: { label: "Children • Boys", group: "Children", color: "#38bdf8" },
  adultsWomen: { label: "Adults • Women", group: "Adults", color: "#ec4899" },
  adultsMen: { label: "Adults • Men", group: "Adults", color: "#2563eb" },
  households: { label: "Households", group: "Households", color: "#22c55e" },
  idps: { label: "IDPs", group: "IDPs", color: "#0ea5e9" },
  returnees: { label: "Returnees", group: "Returnees", color: "#a855f7" },
  pwds: { label: "PwDs", group: "PwDs", color: "#f59e0b" },
};

export const BENEFICIARY_GROUPS = [
  { key: "children", label: "Children", members: ["childrenGirls", "childrenBoys"] },
  { key: "adults", label: "Adults", members: ["adultsWomen", "adultsMen"] },
  { key: "households", label: "Households", members: ["households"] },
  { key: "idps", label: "IDPs", members: ["idps"] },
  { key: "returnees", label: "Returnees", members: ["returnees"] },
  { key: "pwds", label: "PwDs", members: ["pwds"] },
] as const;

export type BeneficiaryGroupKey = (typeof BENEFICIARY_GROUPS)[number]["key"];

export type BeneficiaryBreakdown = {
  direct: Record<BeneficiaryTypeKey, number>;
  indirect: Record<BeneficiaryTypeKey, number>;
};

export type SectorKey = "Humanitarian" | "Advocacy" | "Development";

export const ALL_SECTOR_KEY = "All Sectors" as const;
export const ALL_SECTOR_FIELD_ACTIVITY = "Joint multi-sector coordination";

export type SectorDetails = {
  provinces: string[];
  beneficiaries: BeneficiaryBreakdown;
  projects: number;
  start: string;
  end: string;
  fieldActivity: string;
  staff: number;
  description?: string;
  clusters?: string[];
};

export type SectorState = Record<string, SectorDetails>;

export type DashboardUserRole = "Administrator" | "Editor" | "Viewer";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization?: string;
};

export type DashboardUsers = DashboardUser[];

export type CatalogEntry = {
  id: string;
  name: string;
  description?: string;
};

export type MainSectorRecord = {
  id: string;
  name: string;
  description?: string;
};

export type SubSectorRecord = {
  id: string;
  mainSectorId: string;
  mainSectorName: string;
  name: string;
  description?: string;
};

export const PROJECT_SECTORS = [
  "Agriculture",
  "Education",
  "Health",
  "WASH",
  "Enterprise Development",
  "TVET",
  "Protection",
  "Livelihoods",
] as const;

export const RESPONSE_CLUSTERS = [
  "Protection Cluster",
  "Emergency Shelter and Non-Food Items (ES/NFI) Cluster",
  "Health Cluster",
  "Nutrition Cluster",
  "Food Security and Agriculture Cluster",
  "WASH (Water, Sanitation and Hygiene) Cluster",
  "Education Cluster",
] as const;

export const STANDARD_SECTOR_GROUPS = [
  {
    label: "Humanitarian Sectors",
    sectors: [
      "Health",
      "Nutrition",
      "WASH (Water, Sanitation, Hygiene)",
      "Food Security & Agriculture",
      "Emergency Shelter & Non-Food Items (ES/NFI)",
      "Protection (including GBV, Child Protection, Legal Aid)",
      "Education",
      "Returnee & IDP Support",
      "Disaster Risk Reduction (DRR)",
    ],
  },
  {
    label: "Development Sectors",
    sectors: [
      "Agriculture & Rural Development",
      "Education & Literacy",
      "Health Systems Strengthening",
      "Livelihoods & Economic Empowerment",
      "Vocational Training (TVET)",
      "Infrastructure & Construction",
      "Environment & Climate Resilience",
      "Governance & Civic Engagement",
      "Women & Youth Empowerment",
      "Social Cohesion & Peacebuilding",
      "Media & Communication",
      "ICT & Digital Inclusion",
    ],
  },
  {
    label: "Advocacy & Cross-Cutting Themes",
    sectors: [
      "Human Rights & Legal Reform",
      "Gender Equality",
      "Disability Inclusion",
      "Community Engagement & Accountability",
      "Monitoring, Evaluation, Accountability & Learning (MEAL)",
      "Anti-Corruption & Transparency",
      "Cultural Heritage & Preservation",
    ],
  },
] as const;

export type BrandingSettings = {
  companyName: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  companyName: "NSDO",
  logoDataUrl: null,
  faviconDataUrl: null,
};

export type ComplaintRecord = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt: string;
  status: ComplaintStatus;
  assignedOfficer?: string;
  province?: string;
  district?: string;
  village?: string;
  gender?: string;
  source_of_complaint?: string;
  category?: string;
  complaint_type?: string;
  summary?: string;
  how_reported?: string;
  referred_to?: string;
  date_sent?: string;
  response_given?: boolean;
  projectId?: string;
  isAnonymous: boolean;
  responses: ComplaintResponseRecord[];
};

export const DEFAULT_COMPLAINTS: ComplaintRecord[] = [];

export type ProjectSector = (typeof PROJECT_SECTORS)[number] | string;

export type DashboardProject = {
  id: string;
  code: string;
  name: string;
  sector: ProjectSector;
  beneficiaries: BeneficiaryBreakdown;
  country: string;
  provinces: string[];
  districts: string[];
  communities: string[];
  goal: string;
  objectives: string;
  majorAchievements: string;
  start: string;
  end: string;
  staff: number;
  clusters: string[];
  standardSectors: string[];
  donor?: string;
  budget?: number;
  focalPoint?: string;
  documents?: ProjectDocumentRecord[];
  phases?: ProjectPhaseRecord[];
};

export type DashboardProjects = DashboardProject[];

export const PROJECT_DOCUMENT_CATEGORIES = [
  "mePlan",
  "indicatorTable",
  "baselineAttachment",
  "evaluationReport",
  "beneficiaryProfile",
  "learningResource",
  "other",
] as const;

export type ProjectDocumentCategory = (typeof PROJECT_DOCUMENT_CATEGORIES)[number];

export type ProjectDocumentRecord = {
  id: string;
  projectId: string;
  category: ProjectDocumentCategory;
  title: string;
  fileUrl?: string;
  uploadedAt: string;
};

export const PROJECT_PHASES = [
  "baseline",
  "monitoring",
  "evaluation",
  "accountability",
  "learning",
] as const;

export type ProjectPhaseKey = (typeof PROJECT_PHASES)[number];

export type ProjectPhaseStatus = "not_started" | "in_progress" | "completed";

export type ProjectPhaseRecord = {
  id: string;
  projectId: string;
  phase: ProjectPhaseKey;
  status: ProjectPhaseStatus;
  notes?: string;
  updatedAt: string;
};

export type BaselineSurveyTool = "kobo" | "manual" | "other";

export type BaselineSurveyStatus = "draft" | "in_progress" | "completed" | "archived";

export type BaselineSurveyRecord = {
  id: string;
  projectId: string;
  title: string;
  tool: BaselineSurveyTool;
  status: BaselineSurveyStatus;
  questionnaireUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type EnumeratorRecord = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  province?: string;
  assignments: number;
};

export type DataCollectionTaskStatus = "pending" | "in_progress" | "completed";

export type DataCollectionTaskRecord = {
  id: string;
  baselineSurveyId: string;
  status: DataCollectionTaskStatus;
  completedAt?: string;
  notes?: string;
};

export type BaselineReportRecord = {
  id: string;
  baselineSurveyId: string;
  reportUrl?: string;
  sharedWithProgram: boolean;
  sharedAt?: string;
  createdAt: string;
};

export type FieldVisitReportRecord = {
  id: string;
  projectId: string;
  visitDate: string;
  location?: string;
  positiveFindings?: string;
  negativeFindings?: string;
  photoUrl?: string;
  gpsCoordinates?: string;
  officer?: string;
  createdAt: string;
};

export type MonthlyNarrativeStatus = "draft" | "submitted" | "approved" | "feedback";

export type MonthlyNarrativeRecord = {
  id: string;
  projectId: string;
  reportMonth: string;
  summary?: string;
  gaps?: string;
  recommendations?: string;
  status: MonthlyNarrativeStatus;
  reviewer?: string;
  feedback?: string;
  submittedAt?: string;
  updatedAt: string;
};

export type EvaluationType = "baseline" | "midterm" | "endline" | "special";

export type EvaluationRecord = {
  id: string;
  projectId?: string;
  evaluatorName?: string;
  evaluationType: EvaluationType;
  reportUrl?: string;
  findingsSummary?: string;
  completedAt?: string;
  createdAt: string;
};

export type StoryType = "case" | "success" | "impact";

export type StoryRecord = {
  id: string;
  projectId?: string;
  storyType: StoryType;
  title: string;
  quote?: string;
  summary?: string;
  photoUrl?: string;
  createdAt: string;
};

export type ComplaintStatus = "open" | "in_review" | "resolved";

export type ComplaintResponseRecord = {
  id: string;
  complaintId: string;
  responder?: string;
  response: string;
  createdAt: string;
};

export type ComplaintMetadataRecord = {
  complaintId: string;
  status: ComplaintStatus;
  assignedOfficer?: string;
  province?: string;
  district?: string;
  projectId?: string;
  isAnonymous: boolean;
  autoAssignedAt?: string;
  updatedAt: string;
};

export type ComplaintSummaryMetrics = {
  total: number;
  open: number;
  inReview: number;
  resolved: number;
};

export type CrmAwarenessRecord = {
  id: string;
  projectId?: string;
  district?: string;
  awarenessDate?: string;
  notes?: string;
  createdAt: string;
};

export type FindingType = "negative" | "positive";

export type FindingSeverity = "minor" | "major" | "critical";

export type FindingStatus = "pending" | "in_progress" | "solved";

export type FindingRecord = {
  id: string;
  projectId?: string;
  findingType: FindingType;
  category?: string;
  severity: FindingSeverity;
  department?: string;
  status: FindingStatus;
  description?: string;
  evidenceUrl?: string;
  reminderDueAt?: string;
  lastRemindedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FindingsByDepartment = Record<string, { pending: number; inProgress: number; solved: number }>;

export type FindingsSummary = {
  total: number;
  byType: Record<FindingType, number>;
  bySeverity: Record<FindingSeverity, number>;
  byStatus: Record<FindingStatus, number>;
  byDepartment: FindingsByDepartment;
};

export type DistributionRecord = {
  id: string;
  projectId?: string;
  assistanceType: string;
  distributionDate?: string;
  location?: string;
  targetBeneficiaries?: number;
  notes?: string;
  createdAt: string;
};

export type PdmSurveyRecord = {
  id: string;
  projectId?: string;
  tool?: string;
  qualityScore?: number;
  quantityScore?: number;
  satisfactionScore?: number;
  protectionScore?: number;
  completedAt?: string;
  createdAt: string;
};

export type PdmReportRecord = {
  id: string;
  projectId?: string;
  reportDate?: string;
  summary?: string;
  recommendations?: string;
  feedbackToProgram?: string;
  createdAt: string;
};

export type LessonRecord = {
  id: string;
  projectId?: string;
  source?: string;
  lesson: string;
  department?: string;
  theme?: string;
  capturedAt?: string;
  createdAt: string;
};

export type KnowledgeResourceRecord = {
  id: string;
  title: string;
  category?: string;
  theme?: string;
  description?: string;
  fileUrl?: string;
  createdAt: string;
};

export type UserAccessAssignmentRecord = {
  id: string;
  userId: string;
  projectId?: string;
  province?: string;
  role?: string;
};

export type IntegrationRecord = {
  id: string;
  name: string;
  config?: string;
  createdAt: string;
  updatedAt: string;
};

export type MonitoringDashboardData = {
  baselineSurveys: BaselineSurveyRecord[];
  enumerators: EnumeratorRecord[];
  dataCollectionTasks: DataCollectionTaskRecord[];
  baselineReports: BaselineReportRecord[];
  fieldVisits: FieldVisitReportRecord[];
  monthlyReports: MonthlyNarrativeRecord[];
};

export type EvaluationDashboardData = {
  evaluations: EvaluationRecord[];
  stories: StoryRecord[];
};

export type AccountabilityDashboardData = {
  complaints: ComplaintRecord[];
  complaintMetrics: ComplaintSummaryMetrics;
  crmAwareness: CrmAwarenessRecord[];
};

export type FindingsDashboardData = {
  findings: FindingRecord[];
  summary: FindingsSummary;
};

export type PdmDashboardData = {
  distributions: DistributionRecord[];
  surveys: PdmSurveyRecord[];
  reports: PdmReportRecord[];
};

export type KnowledgeHubData = {
  lessons: LessonRecord[];
  resources: KnowledgeResourceRecord[];
};
