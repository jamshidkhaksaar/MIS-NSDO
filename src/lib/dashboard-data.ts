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
};

export const DEFAULT_COMPLAINTS: ComplaintRecord[] = [];

export type ProjectSector = (typeof PROJECT_SECTORS)[number] | string;

export type DashboardProject = {
  id: string;
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
};

export type DashboardProjects = DashboardProject[];
