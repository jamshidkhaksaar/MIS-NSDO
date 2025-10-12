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
};

export type SectorState = Record<SectorKey, SectorDetails>;

export const INITIAL_SECTOR_STATE: SectorState = {
  Humanitarian: {
    provinces: ["Kabul", "Takhar", "Badakhshan", "Herat"],
    beneficiaries: {
      direct: {
        childrenGirls: 280,
        childrenBoys: 260,
        adultsWomen: 310,
        adultsMen: 210,
        households: 140,
        idps: 90,
        returnees: 65,
        pwds: 55,
      },
      indirect: {
        childrenGirls: 180,
        childrenBoys: 170,
        adultsWomen: 240,
        adultsMen: 195,
        households: 120,
        idps: 75,
        returnees: 48,
        pwds: 36,
      },
    },
    projects: 14,
    start: "15 Feb 2024",
    end: "30 Sep 2025",
    fieldActivity: "Emergency response & relief kits",
    staff: 62,
  },
  Advocacy: {
    provinces: ["Parwan", "Kabul", "Baghlan"],
    beneficiaries: {
      direct: {
        childrenGirls: 160,
        childrenBoys: 150,
        adultsWomen: 190,
        adultsMen: 140,
        households: 90,
        idps: 50,
        returnees: 44,
        pwds: 28,
      },
      indirect: {
        childrenGirls: 120,
        childrenBoys: 115,
        adultsWomen: 160,
        adultsMen: 120,
        households: 72,
        idps: 42,
        returnees: 30,
        pwds: 22,
      },
    },
    projects: 9,
    start: "01 Mar 2024",
    end: "31 Dec 2024",
    fieldActivity: "Policy dialogues & community forums",
    staff: 28,
  },
  Development: {
    provinces: ["Kunduz", "Baghlan", "Parwan", "Badakhshan"],
    beneficiaries: {
      direct: {
        childrenGirls: 210,
        childrenBoys: 200,
        adultsWomen: 250,
        adultsMen: 220,
        households: 120,
        idps: 70,
        returnees: 60,
        pwds: 44,
      },
      indirect: {
        childrenGirls: 150,
        childrenBoys: 140,
        adultsWomen: 190,
        adultsMen: 170,
        households: 110,
        idps: 62,
        returnees: 48,
        pwds: 34,
      },
    },
    projects: 11,
    start: "10 Jan 2024",
    end: "31 Dec 2025",
    fieldActivity: "Infrastructure rehabilitation",
    staff: 44,
  },
};

export const INITIAL_REPORTING_YEARS = [2023, 2024, 2025] as const;

export type DashboardUserRole = "Administrator" | "Editor" | "Viewer";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: DashboardUserRole;
  organization?: string;
};

export type DashboardUsers = DashboardUser[];

export const INITIAL_USERS: DashboardUsers = [
  {
    id: "user-1",
    name: "Jamila Farzad",
    email: "jamila.farzad@example.org",
    role: "Administrator",
    organization: "NSDO HQ",
  },
  {
    id: "user-2",
    name: "Rahim Khan",
    email: "rahim.khan@example.org",
    role: "Editor",
    organization: "Regional Office",
  },
  {
    id: "user-3",
    name: "Sara Barakzai",
    email: "sara.barakzai@example.org",
    role: "Viewer",
    organization: "Partner Agency",
  },
];

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
  clusters: string[];
  standardSectors: string[];
  beneficiaries: BeneficiaryBreakdown;
  country: string;
  provinces: string[];
  districts: string[];
  communities: string[];
  goal: string;
  objectives: string;
  majorAchievements: string;
};

export type DashboardProjects = DashboardProject[];

export const INITIAL_PROJECTS: DashboardProjects = [
  {
    id: "project-1",
    name: "Community-Based Agricultural Support",
    sector: "Agriculture",
    clusters: [
      "Food Security and Agriculture Cluster",
      "WASH (Water, Sanitation and Hygiene) Cluster",
    ],
    standardSectors: [
      "Food Security & Agriculture",
      "Livelihoods & Economic Empowerment",
      "Environment & Climate Resilience",
    ],
    beneficiaries: {
      direct: {
        childrenGirls: 320,
        childrenBoys: 340,
        adultsWomen: 460,
        adultsMen: 380,
        households: 220,
        idps: 120,
        returnees: 90,
        pwds: 70,
      },
      indirect: {
        childrenGirls: 280,
        childrenBoys: 295,
        adultsWomen: 420,
        adultsMen: 360,
        households: 240,
        idps: 140,
        returnees: 110,
        pwds: 84,
      },
    },
    country: "Afghanistan",
    provinces: ["Kabul", "Takhar", "Herat"],
    districts: ["Kabul City", "Rostaq", "Guzara"],
    communities: ["Pole-e-Charkhi", "Dasht-e-Qala", "Karokh"],
    goal: "Increase household food security through resilient agricultural practices.",
    objectives:
      "• Provide farmer field school training across 3 provinces.\n• Introduce drought-resilient seed kits and irrigation tools.\n• Establish producer cooperatives to connect farmers with local markets.",
    majorAchievements:
      "• 1,250 farmers trained on climate-smart techniques.\n• 18 agribusiness cooperatives formed with 45% women leadership.\n• Average crop yields increased by 27% in target districts.",
  },
  {
    id: "project-2",
    name: "Inclusive Education Access Initiative",
    sector: "Education",
    clusters: ["Education Cluster", "Protection Cluster"],
    standardSectors: [
      "Education",
      "Education & Literacy",
      "Disability Inclusion",
      "Gender Equality",
    ],
    beneficiaries: {
      direct: {
        childrenGirls: 620,
        childrenBoys: 590,
        adultsWomen: 420,
        adultsMen: 340,
        households: 180,
        idps: 150,
        returnees: 110,
        pwds: 95,
      },
      indirect: {
        childrenGirls: 540,
        childrenBoys: 520,
        adultsWomen: 400,
        adultsMen: 310,
        households: 200,
        idps: 170,
        returnees: 130,
        pwds: 100,
      },
    },
    country: "Afghanistan",
    provinces: ["Kunduz", "Baghlan"],
    districts: ["Kunduz City", "Pul-e-Khumri"],
    communities: ["Imam Sahib", "Nahr-e-Shahi"],
    goal: "Broaden safe learning access for primary students in rural communities.",
    objectives:
      "• Rehabilitate 12 community classrooms and learning spaces.\n• Deploy accelerated learning curricula for out-of-school children.\n• Train teachers on inclusive education and safeguarding.",
    majorAchievements:
      "• 2,050 children re-enrolled in formal schooling pathways.\n• 164 teachers certified on inclusive pedagogy.\n• Child protection referral pathways established in all target schools.",
  },
];
